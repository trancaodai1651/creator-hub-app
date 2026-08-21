use serde::Deserialize;
use serde_json::{json, Value};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::{AppHandle, Emitter, Manager};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[derive(Debug, Deserialize)]
pub struct HighlightSegment {
    pub video_path: String,
    pub start_secs: f64,
    pub end_secs: f64,
}

fn ratio_filter(ratio: &str) -> Option<&'static str> {
    match ratio {
        "16:9" => Some("scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080"),
        "4:3" => Some("scale=1440:1080:force_original_aspect_ratio=increase,crop=1440:1080"),
        "9:16" => Some("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"),
        "3:4" => Some("scale=1080:1440:force_original_aspect_ratio=increase,crop=1080:1440"),
        "1:1" => Some("scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080"),
        _ => None,
    }
}

fn clean_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/").replace('\'', "'\\''")
}

#[tauri::command]
pub async fn export_highlights(
    app: AppHandle,
    segments: Vec<HighlightSegment>,
    output_dir: String,
    output_mode: String,
    ratio: String,
    logo_path: String,
    logo_position: String,
    logo_size: i32,
) -> Result<Value, String> {
    if segments.is_empty() {
        return Err("Chưa có đoạn highlight để xuất.".to_string());
    }

    let valid_segments: Vec<&HighlightSegment> = segments.iter().filter(|segment| {
        Path::new(&segment.video_path).is_file()
            && segment.start_secs >= 0.0
            && segment.end_secs > segment.start_secs
    }).collect();
    if valid_segments.is_empty() {
        return Err("Các mốc highlight không hợp lệ hoặc không tìm thấy video.".to_string());
    }

    let resource_dir = app.path().resource_dir().map_err(|error| error.to_string())?;
    let ffmpeg_exe = resource_dir.join("resources").join(if cfg!(target_os = "windows") { "ffmpeg.exe" } else { "ffmpeg" });
    if !ffmpeg_exe.is_file() {
        return Err("Không tìm thấy FFmpeg đi kèm ứng dụng.".to_string());
    }

    let output_path = if !output_dir.is_empty() && Path::new(&output_dir).is_dir() {
        PathBuf::from(output_dir)
    } else {
        Path::new(&valid_segments[0].video_path).parent().unwrap_or_else(|| Path::new(".")).to_path_buf()
    };
    let normalized_mode = match output_mode.as_str() {
        "single-long" | "multiple-long" | "single-short" | "multiple-short" => output_mode.as_str(),
        _ => "multiple-long",
    };
    let is_short = normalized_mode.ends_with("short");
    let single_output = normalized_mode.starts_with("single");
    let kind = if is_short { "SHORT" } else { "LONG" };
    let stamp = chrono::Utc::now().timestamp_millis();
    let has_logo = !logo_path.is_empty() && Path::new(&logo_path).is_file();
    let ratio_filter_value = ratio_filter(&ratio);
    let mut temporary_paths = Vec::with_capacity(valid_segments.len());
    let mut output_paths = Vec::new();

    let _ = app.emit("join-progress", json!({ "message": "Highlight: đang cắt các đoạn đã chọn...", "percent": 0 }));

    for (index, segment) in valid_segments.iter().enumerate() {
        let duration = (segment.end_secs - segment.start_secs).min(86_400.0);
        let temp_path = output_path.join(format!(".creator_hub_highlight_{}_{}.mp4", stamp, index + 1));
        let start_arg = format!("{:.3}", segment.start_secs);
        let duration_arg = format!("{:.3}", duration);
        let mut command = Command::new(&ffmpeg_exe);
        #[cfg(target_os = "windows")]
        command.creation_flags(0x08000000);
        command.args(["-y", "-v", "warning", "-ss", start_arg.as_str(), "-i"]).arg(&segment.video_path).args(["-t", duration_arg.as_str()]);

        if has_logo {
            command.args(["-loop", "1", "-i"]).arg(&logo_path);
            let overlay = match logo_position.as_str() {
                "top-right" => "main_w-overlay_w-25:25",
                "bottom-left" => "25:main_h-overlay_h-25",
                "bottom-right" => "main_w-overlay_w-25:main_h-overlay_h-25",
                _ => "25:25",
            };
            let base = ratio_filter_value.unwrap_or("format=yuv420p");
            let size = logo_size.max(1);
            let filter = format!("[0:v]{}[highlight_bg];[1:v]scale={}:-1[highlight_logo];[highlight_bg][highlight_logo]overlay={}[highlight_video]", base, size, overlay);
            command.args(["-filter_complex", filter.as_str(), "-map", "[highlight_video]", "-map", "0:a?"]);
        } else if let Some(filter) = ratio_filter_value {
            command.args(["-vf", filter, "-map", "0:v:0", "-map", "0:a?"]);
        } else {
            command.args(["-map", "0:v:0", "-map", "0:a?"]);
        }

        command.args(["-c:v", "libx264", "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest"])
            .arg(&temp_path)
            .stdout(Stdio::null())
            .stderr(Stdio::piped());
        let output = command.output().map_err(|error| error.to_string())?;
        if !output.status.success() {
            let _ = fs::remove_file(&temp_path);
            let message = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(if message.is_empty() { format!("Không thể cắt highlight {}.", index + 1) } else { message });
        }

        if single_output {
            temporary_paths.push(temp_path);
        } else {
            let final_path = output_path.join(format!("HIGHLIGHT_{}_{}_{:03}_{}.mp4", kind, ratio.replace(':', "x"), index + 1, stamp));
            fs::rename(&temp_path, &final_path).map_err(|error| error.to_string())?;
            output_paths.push(final_path.to_string_lossy().to_string());
        }
        let percent = (((index + 1) as f64 / valid_segments.len() as f64) * 80.0) as u32;
        let _ = app.emit("join-progress", json!({ "message": format!("Highlight: đã xử lý {}/{} đoạn...", index + 1, valid_segments.len()), "percent": percent }));
    }

    if single_output {
        let list_path = output_path.join(format!(".creator_hub_highlight_list_{}.txt", stamp));
        let list_content: String = temporary_paths.iter().map(|path| format!("file '{}'\n", clean_path(path))).collect();
        fs::write(&list_path, list_content).map_err(|error| error.to_string())?;
        let final_path = output_path.join(format!("HIGHLIGHT_{}_{}_{}.mp4", kind, ratio.replace(':', "x"), stamp));
        let mut command = Command::new(&ffmpeg_exe);
        #[cfg(target_os = "windows")]
        command.creation_flags(0x08000000);
        command.args(["-y", "-v", "warning", "-f", "concat", "-safe", "0", "-i"]).arg(&list_path)
            .args(["-c", "copy", "-movflags", "+faststart"])
            .arg(&final_path)
            .stdout(Stdio::null())
            .stderr(Stdio::piped());
        let output = command.output().map_err(|error| error.to_string())?;
        let _ = fs::remove_file(&list_path);
        for path in &temporary_paths { let _ = fs::remove_file(path); }
        if !output.status.success() {
            let message = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(if message.is_empty() { "Không thể nối các đoạn highlight.".to_string() } else { message });
        }
        output_paths.push(final_path.to_string_lossy().to_string());
    }

    let _ = app.emit("join-progress", json!({ "message": "Đã hoàn thành highlight.", "percent": 100 }));
    Ok(json!({
        "success": true,
        "paths": output_paths,
        "message": format!("Đã xuất {} highlight {}.", output_paths.len(), if is_short { "ngắn" } else { "dài" })
    }))
}
