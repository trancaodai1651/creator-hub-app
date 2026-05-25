use tauri::{AppHandle, Emitter};
use serde_json::{json, Value};
use tauri::Manager;
use std::fs::{self, File};
use std::io::Write;
use std::process::Command;
use std::path::{Path, PathBuf};
use reqwest::Client;

// =======================================================================
// ⏰ CÁC HÀM FORMAT THỜI GIAN THEO ĐỊNH DẠNG PHỤ ĐỀ NATIVE
// =======================================================================
fn format_srt_time(secs: f64) -> String {
    let h = (secs / 3600.0).floor() as u32;
    let m = ((secs % 3600.0) / 60.0).floor() as u32;
    let s = (secs % 60.0).floor() as u32;
    let ms = ((secs % 1.0) * 1000.0).round() as u32;
    format!("{:02}:{:02}:{:02},{:03}", h, m, s, ms)
}

fn format_vtt_time(secs: f64) -> String {
    let h = (secs / 3600.0).floor() as u32;
    let m = ((secs % 3600.0) / 60.0).floor() as u32;
    let s = (secs % 60.0).floor() as u32;
    let ms = ((secs % 1.0) * 1000.0).round() as u32;
    format!("{:02}:{:02}:{:02}.{:03}", h, m, s, ms)
}

fn format_ass_time(secs: f64) -> String {
    let h = (secs / 3600.0).floor() as u32;
    let m = ((secs % 3600.0) / 60.0).floor() as u32;
    let s = (secs % 60.0).floor() as u32;
    let cc = ((secs % 1.0) * 100.0).round() as u32;
    format!("{}:{:02}:{:02}.{:02}", h, m, s, cc)
}

// =======================================================================
// 🚀 CORE API: CHUYỂN ĐỔI ĐỊNH DẠNG & TRÍCH XUẤT PHỤ ĐỀ AI
// =======================================================================
#[tauri::command]
pub async fn convert_file(
    app: AppHandle,
    input_path: String,
    output_dir: String,
    target_ext: String,
    sub_path: Option<String>,
    api_key: Option<String>,
    video_encoder: Option<String>,
) -> Result<Value, String> {
    let input_p = Path::new(&input_path);
    if !input_p.exists() { return Err("Tập tin đầu vào không tồn tại!".to_string()); }

    let base_name = input_p.file_stem().unwrap_or_default().to_string_lossy().to_string();
    
    let final_output_dir = if output_dir.is_empty() || !Path::new(&output_dir).exists() {
        input_p.parent().unwrap().to_path_buf()
    } else {
        PathBuf::from(output_dir)
    };

    let output_path = final_output_dir.join(format!("{}_converted.{}", base_name, target_ext));
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    let ffmpeg_exe = resource_dir.join("resources").join(if cfg!(target_os = "windows") { "ffmpeg.exe" } else { "ffmpeg" });

    // -------------------------------------------------------------------
    // CHẾ ĐỘ 1: TRÍCH XUẤT PHỤ ĐỀ CHỮ BẰNG AI WHISPER V3
    // -------------------------------------------------------------------
    if ["srt", "vtt", "ass"].contains(&target_ext.as_str()) {
        let key = api_key.unwrap_or_default();
        if !key.starts_with("gsk_") {
            return Err("Vui lòng cấu hình chính xác mã Groq Cloud API Key!".to_string());
        }

        let _ = app.emit("convert-progress", json!({ "message": "Đang bóc tách luồng âm thanh gốc...", "percent": 15 }));
        let temp_audio_path = final_output_dir.join(format!("temp_voice_{}.mp3", chrono::Utc::now().timestamp_millis()));

        let output = Command::new(&ffmpeg_exe)
            .args(["-y", "-i", &input_path, "-vn", "-acodec", "libmp3lame", "-ac", "1", "-ar", "16000", "-ab", "64k", &temp_audio_path.to_string_lossy().to_string()])
            .output().map_err(|e| e.to_string())?;

        if !output.status.success() {
            return Err("Không thể bóc tách luồng âm thanh bằng lõi FFmpeg!".to_string());
        }

        let _ = app.emit("convert-progress", json!({ "message": "Đang đẩy dữ liệu âm thanh lên AI Groq Cloud...", "percent": 45 }));
        
        let client = Client::new();
        let file_bytes = fs::read(&temp_audio_path).map_err(|e| e.to_string())?;
        let file_part = reqwest::multipart::Part::bytes(file_bytes)
            .file_name("voice.mp3")
            .mime_str("audio/mp3").map_err(|e| e.to_string())?;

        let form = reqwest::multipart::Form::new()
            .part("file", file_part)
            .text("model", "whisper-large-v3")
            .text("response_format", "verbose_json");

        let res = client.post("https://api.groq.com/openai/v1/audio/transcriptions")
            .bearer_auth(&key)
            .multipart(form)
            .send().await.map_err(|e| e.to_string())?;

        if temp_audio_path.exists() { let _ = fs::remove_file(&temp_audio_path); }

        if !res.status().is_success() {
            return Err(format!("Lỗi máy chủ Groq Cloud: {}", res.text().await.unwrap_or_default()));
        }

        let res_json: Value = res.json().await.map_err(|e| e.to_string())?;
        let segments = res_json["segments"].as_array().ok_or("AI không phân tích được phân đoạn hội thoại.")?;
        
        let mut sub_content = String::new();
        if target_ext == "srt" {
            for (idx, seg) in segments.iter().enumerate() {
                let start = seg["start"].as_f64().unwrap_or(0.0);
                let end = seg["end"].as_f64().unwrap_or(0.0);
                let text = seg["text"].as_str().unwrap_or("").trim();
                sub_content += &format!("{}\n{} --> {}\n{}\n\n", idx + 1, format_srt_time(start), format_srt_time(end), text);
            }
        } else if target_ext == "vtt" {
            sub_content = "WEBVTT\n\n".to_string();
            for (idx, seg) in segments.iter().enumerate() {
                let start = seg["start"].as_f64().unwrap_or(0.0);
                let end = seg["end"].as_f64().unwrap_or(0.0);
                let text = seg["text"].as_str().unwrap_or("").trim();
                sub_content += &format!("{}\n{} --> {}\n{}\n\n", idx + 1, format_vtt_time(start), format_vtt_time(end), text);
            }
        } else if target_ext == "ass" {
            sub_content = "[Script Info]\nScriptType: v4.00+\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,16,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n".to_string();
            for seg in segments {
                let start = seg["start"].as_f64().unwrap_or(0.0);
                let end = seg["end"].as_f64().unwrap_or(0.0);
                let text = seg["text"].as_str().unwrap_or("").trim().replace('\n', "\\N");
                sub_content += &format!("Dialogue: 0,{},{},Default,,0,0,0,,{}\n", format_ass_time(start), format_ass_time(end), text);
            }
        }

        let mut f = File::create(&output_path).map_err(|e| e.to_string())?;
        f.write_all(sub_content.as_bytes()).map_err(|e| e.to_string())?;
        let _ = app.emit("convert-progress", json!({ "message": "Hoàn thành!", "percent": 100 }));
        return Ok(json!({ "success": true, "message": "Hệ thống Whisper V3 đã trích xuất phụ đề thành công vào file!" }));
    }

    // -------------------------------------------------------------------
    // CHẾ ĐỘ 2: CONVERT CODE VIDEO/AUDIO CHUYÊN NGHIỆP
    // -------------------------------------------------------------------
    let encoder = video_encoder.unwrap_or_else(|| "libx264".to_string());
    
    // Tạo tham chiếu an toàn tránh xung đột vòng đời Closure của Rust
    let ffmpeg_exe_ref = &ffmpeg_exe;
    let input_path_ref = &input_path;
    let sub_path_ref = &sub_path;
    let target_ext_ref = &target_ext;
    let output_path_ref = &output_path;

    let run_encoding_engine = |encoder_id: &str| -> Result<(), String> {
        let mut cmd = Command::new(ffmpeg_exe_ref);
        cmd.arg("-i").arg(input_path_ref).arg("-y");

        let is_video = ["mp4", "mkv", "mov", "avi"].contains(&target_ext_ref.as_str());
        let is_audio = ["mp3", "m4a"].contains(&target_ext_ref.as_str());

        if is_video {
            let mut filter_graph = "scale=trunc(iw/2)*2:trunc(ih/2)*2".to_string();
            if let Some(ref s_path) = sub_path_ref {
                if !s_path.is_empty() && Path::new(s_path).exists() {
                    filter_graph += &format!(",subtitles='{}'", s_path.replace('\\', "/").replace(':', "\\:"));
                }
            }
            cmd.arg("-vf").arg(filter_graph);
            cmd.arg("-c:v").arg(encoder_id).args(["-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k"]);

            match encoder_id {
                "h264_nvenc" => { cmd.args(["-preset", "p6", "-profile:v", "high", "-rc", "vbr", "-cq", "19", "-b:v", "0"]); },
                "h264_amf" => { cmd.args(["-quality", "balanced"]); },
                "h264_qsv" => { cmd.args(["-preset", "medium"]); },
                "h264_videotoolbox" => { cmd.args(["-b:v", "6000k"]); },
                _ => { cmd.args(["-preset", "fast", "-crf", "23"]); }
            }
        } else if is_audio {
            cmd.arg("-vn");
            if target_ext_ref.as_str() == "mp3" { cmd.args(["-c:a", "libmp3lame", "-b:a", "192k"]); }
            if target_ext_ref.as_str() == "m4a" { cmd.args(["-c:a", "aac", "-b:a", "192k"]); }
        } else {
            cmd.args(["-vframes", "1"]);
        }

        cmd.arg(output_path_ref);
        let output = cmd.output().map_err(|e| e.to_string())?;
        if output.status.success() { Ok(()) } else { Err(String::from_utf8_lossy(&output.stderr).to_string()) }
    };

    let _ = app.emit("convert-progress", json!({ "message": "Đang tiến hành chuẩn hóa định dạng...", "percent": 50 }));
    if let Err(err) = run_encoding_engine(&encoder) {
        if encoder != "libx264" {
            let _ = app.emit("convert-progress", json!({ "message": "Phát hiện lỗi GPU! Tự động chuyển luồng sang CPU...", "percent": 10 }));
            // 🚀 ĐÃ VÁ LỖI: Loại bỏ hoàn toàn chữ "run_ffmpeg_engine:" thừa gây lỗi dấu hai chấm
            run_encoding_engine("libx264").map_err(|e| format!("Lỗi CPU dự phòng: {}", e))?;
        } else {
            return Err(format!("Lỗi lõi kết xuất FFmpeg: {}", err));
        }
    }

    let _ = app.emit("convert-progress", json!({ "message": "Hoàn thành!", "percent": 100 }));
    Ok(json!({ "success": true, "message": "Chuyển đổi tập tin hoàn tất!" }))
}