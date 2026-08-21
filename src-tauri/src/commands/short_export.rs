use serde_json::{json, Value};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::{AppHandle, Manager};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[tauri::command]
pub async fn export_short_version(
    app: AppHandle,
    video_paths: Vec<String>,
    output_dir: String,
    short_duration_mins: f64,
    short_ratio: String,
    logo_path: String,
    logo_position: String,
    logo_size: i32,
) -> Result<Value, String> {
    if video_paths.is_empty() {
        return Err("Không có video đầu vào để xuất bản ngắn.".to_string());
    }

    let valid_paths: Vec<&String> = video_paths.iter().filter(|path| Path::new(path).is_file()).collect();
    if valid_paths.is_empty() {
        return Err("Không tìm thấy video đầu vào hợp lệ.".to_string());
    }

    let resource_dir = app.path().resource_dir().map_err(|error| error.to_string())?;
    let ffmpeg_exe = resource_dir.join("resources").join(if cfg!(target_os = "windows") { "ffmpeg.exe" } else { "ffmpeg" });
    if !ffmpeg_exe.is_file() {
        return Err("Không tìm thấy FFmpeg đi kèm ứng dụng.".to_string());
    }

    let final_output_dir = if !output_dir.is_empty() && Path::new(&output_dir).is_dir() {
        PathBuf::from(output_dir)
    } else {
        Path::new(valid_paths[0]).parent().unwrap_or_else(|| Path::new(".")).to_path_buf()
    };
    let stamp = chrono::Utc::now().timestamp_millis();
    let list_path = final_output_dir.join(format!("creator_hub_short_list_{}.txt", stamp));
    let ratio = match short_ratio.as_str() {
        "16:9" | "9:16" | "1:1" => short_ratio.as_str(),
        _ => "9:16",
    };
    let ratio_filter = match ratio {
        "16:9" => "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080",
        "1:1" => "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080",
        _ => "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
    };
    let list_content: String = valid_paths.iter().map(|path| format!("file '{}'\n", path.replace('\\', "/").replace('\'', "'\\''"))).collect();
    fs::write(&list_path, list_content).map_err(|error| error.to_string())?;

    let duration_secs = (short_duration_mins.max(0.1) * 60.0).min(86_400.0);
    let output_path = final_output_dir.join(format!("SHORT_VIDEO_{}_{}s_{}.mp4", ratio.replace(':', "x"), duration_secs.round() as u64, stamp));
    let has_logo = !logo_path.is_empty() && Path::new(&logo_path).is_file();
    let mut command = Command::new(&ffmpeg_exe);
    #[cfg(target_os = "windows")]
    command.creation_flags(0x08000000);
    command.args(["-y", "-v", "warning", "-f", "concat", "-safe", "0", "-i"]).arg(&list_path);

    if has_logo {
        command.arg("-i").arg(&logo_path);
        let overlay = match logo_position.as_str() {
            "top-right" => "main_w-overlay_w-25:25",
            "bottom-left" => "25:main_h-overlay_h-25",
            "bottom-right" => "main_w-overlay_w-25:main_h-overlay_h-25",
            _ => "25:25",
        };
        let size = logo_size.max(1);
        let filter = format!("[0:v]{}[short_bg];[1:v]scale={}:-1[short_logo];[short_bg][short_logo]overlay={}[short_video]", ratio_filter, size, overlay);
        command.arg("-filter_complex").arg(filter).args(["-map", "[short_video]", "-map", "0:a?"]);
    } else {
        command.arg("-vf").arg(ratio_filter).args(["-map", "0:v:0", "-map", "0:a?"]);
    }

    let duration_arg = format!("{:.3}", duration_secs);
    command.args(["-t", duration_arg.as_str(), "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart"])
        .arg(&output_path)
        .stdout(Stdio::null())
        .stderr(Stdio::piped());

    let output = command.output().map_err(|error| error.to_string())?;
    let _ = fs::remove_file(&list_path);
    if !output.status.success() {
        let message = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if message.is_empty() { "FFmpeg không thể xuất bản ngắn.".to_string() } else { message });
    }

    Ok(json!({
        "success": true,
        "path": output_path.to_string_lossy(),
        "message": format!("Đã xuất thêm bản ngắn {} ({:.1} phút).", ratio, short_duration_mins.max(0.1))
    }))
}
