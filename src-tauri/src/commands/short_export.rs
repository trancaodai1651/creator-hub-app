use serde_json::{json, Value};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};
use tauri::{AppHandle, Emitter, Manager};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

fn append_encoder_settings(command: &mut Command, encoder: &str, hardware_mode: &str) {
    command.args(["-c:v", encoder, "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k"]);
    match encoder {
        "h264_nvenc" => match hardware_mode {
            "low" => command.args(["-preset", "fast", "-b:v", "3000k"]),
            "balanced" => command.args(["-preset", "medium", "-b:v", "6000k"]),
            _ => command.args(["-preset", "slow", "-b:v", "10000k"]),
        },
        "h264_amf" => match hardware_mode {
            "low" => command.args(["-quality", "speed"]),
            _ => command.args(["-quality", "balanced"]),
        },
        "h264_qsv" => match hardware_mode {
            "low" => command.args(["-preset", "veryfast"]),
            _ => command.args(["-preset", "medium"]),
        },
        "h264_videotoolbox" => match hardware_mode {
            "low" => command.args(["-b:v", "3000k"]),
            _ => command.args(["-b:v", "6000k"]),
        },
        _ => match hardware_mode {
            "low" => command.args(["-preset", "ultrafast", "-crf", "28"]),
            "balanced" => command.args(["-preset", "veryfast", "-crf", "25"]),
            _ => command.args(["-preset", "fast", "-crf", "23"]),
        },
    };
}

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
    use_gpu: bool,
    video_encoder: Option<String>,
    hardware_mode: Option<String>,
) -> Result<Value, String> {
    if video_paths.is_empty() {
        return Err("Không có video đầu vào để xuất bản ngắn.".to_string());
    }

    let valid_paths: Vec<&String> = video_paths.iter().filter(|path| Path::new(path).is_file()).collect();
    if valid_paths.is_empty() {
        return Err("Không tìm thấy video đầu vào hợp lệ.".to_string());
    }
    let _ = app.emit("join-progress", json!({ "message": "Giai đoạn 4/4: Bản dài đã xong, đang xuất bản ngắn theo cùng kịch bản...", "percent": 0 }));

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
        "16:9" | "9:16" | "3:4" | "1:1" | "4:3" => short_ratio.as_str(),
        _ => "9:16",
    };
    let ratio_filter = match ratio {
        "16:9" => "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080",
        "4:3" => "scale=1440:1080:force_original_aspect_ratio=increase,crop=1440:1080",
        "3:4" => "scale=1080:1440:force_original_aspect_ratio=increase,crop=1080:1440",
        "1:1" => "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080",
        _ => "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
    };
    let list_content: String = valid_paths.iter().map(|path| format!("file '{}'\n", path.replace('\\', "/").replace('\'', "'\\''"))).collect();
    fs::write(&list_path, list_content).map_err(|error| error.to_string())?;

    let duration_secs = (short_duration_mins.max(0.1) * 60.0).min(86_400.0);
    let output_path = final_output_dir.join(format!("SHORT_VIDEO_{}_{}s_{}.mp4", ratio.replace(':', "x"), duration_secs.round() as u64, stamp));
    let has_logo = !logo_path.is_empty() && Path::new(&logo_path).is_file();
    let hardware_mode = hardware_mode.unwrap_or_else(|| "max".to_string());
    let mut encoders = vec!["libx264".to_string()];
    if use_gpu {
        if let Some(custom_encoder) = video_encoder.filter(|value| !value.is_empty()) {
            encoders = vec![custom_encoder, "libx264".to_string()];
        } else if cfg!(target_os = "windows") {
            encoders = vec!["h264_nvenc".to_string(), "h264_qsv".to_string(), "h264_amf".to_string(), "libx264".to_string()];
        } else if cfg!(target_os = "macos") {
            encoders = vec!["h264_videotoolbox".to_string(), "libx264".to_string()];
        }
    }

    let scenario_children: Vec<Value> = valid_paths.iter().map(|path| json!({
        "name": Path::new(path).file_name().unwrap_or_default().to_string_lossy(),
        "path": path,
        "durationSecs": Value::Null
    })).collect();
    let scenario_scripts = vec![json!({
        "outputName": output_path.file_name().unwrap_or_default().to_string_lossy(),
        "outputPath": output_path.to_string_lossy(),
        "type": "short",
        "format": "MP4",
        "ratio": ratio,
        "durationSecs": duration_secs,
        "children": scenario_children
    })];
    let _ = app.emit("join-scenario", json!({ "scope": "joiner-short", "scripts": scenario_scripts }));

    let run_encoder = |encoder: &str| -> Result<Output, String> {
        let mut command = Command::new(&ffmpeg_exe);
        #[cfg(target_os = "windows")]
        command.creation_flags(0x08000000);
        command.args(["-y", "-v", "warning", "-f", "concat", "-safe", "0", "-i"]).arg(&list_path);
        if has_logo {
            command.args(["-loop", "1", "-i"]).arg(&logo_path);
            let overlay = match logo_position.as_str() {
                "top-right" => "main_w-overlay_w-25:25",
                "bottom-left" => "25:main_h-overlay_h-25",
                "bottom-right" => "main_w-overlay_w-25:main_h-overlay_h-25",
                _ => "25:25",
            };
            let size = logo_size.max(1);
            let filter = format!("[0:v]{}[short_bg];[1:v]scale={}:-1[short_logo];[short_bg][short_logo]overlay={}[short_video]", ratio_filter, size, overlay);
            command.args(["-filter_complex", filter.as_str(), "-map", "[short_video]", "-map", "0:a?"]);
        } else {
            command.arg("-vf").arg(ratio_filter).args(["-map", "0:v:0", "-map", "0:a?"]);
        }
        let duration_arg = format!("{:.3}", duration_secs);
        command.args(["-t", duration_arg.as_str()]);
        append_encoder_settings(&mut command, encoder, &hardware_mode);
        command.args(["-movflags", "+faststart"]).arg(&output_path).stdout(Stdio::null()).stderr(Stdio::piped());
        command.output().map_err(|error| error.to_string())
    };

    let mut final_output: Option<Output> = None;
    let mut last_error = String::new();
    for encoder in &encoders {
        let result = run_encoder(encoder)?;
        if result.status.success() {
            final_output = Some(result);
            break;
        }
        last_error = String::from_utf8_lossy(&result.stderr).trim().to_string();
    }
    let _ = fs::remove_file(&list_path);
    if final_output.is_none() {
        return Err(if last_error.is_empty() { "FFmpeg không thể xuất bản ngắn.".to_string() } else { last_error });
    }

    let _ = app.emit("join-progress", json!({ "message": "Đã hoàn thành bản dài và bản ngắn.", "percent": 100 }));
    Ok(json!({
        "success": true,
        "path": output_path.to_string_lossy(),
        "scripts": scenario_scripts,
        "message": format!("Đã xuất thêm bản ngắn {} ({:.1} phút).", ratio, short_duration_mins.max(0.1))
    }))
}
