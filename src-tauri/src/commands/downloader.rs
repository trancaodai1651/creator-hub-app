use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;
use serde_json::{json, Value};
use tauri::Manager;
use std::fs;
use std::process::Command;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};

// =======================================================================
// 🚀 HÀM TỰ ĐỘNG MỞ VIDEO BẰNG TRÌNH PHÁT MẶC ĐỊNH CỦA HỆ ĐIỀU HÀNH
// =======================================================================
#[tauri::command]
pub fn open_video_native(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("Tệp tin video không tồn tại hoặc đã bị di chuyển!".to_string());
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("cmd")
            .creation_flags(0x08000000)
            .args(["/C", "start", "", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open").arg(&path).spawn().map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open").arg(&path).spawn().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn get_unique_file_path(dir: &Path, file_name: &str) -> PathBuf {
    let path = Path::new(file_name);
    let ext = path.extension().unwrap_or_default().to_str().unwrap_or_default();
    let base_name = path.file_stem().unwrap_or_default().to_str().unwrap_or_default();
    
    let mut counter = 1;
    let mut final_path = dir.join(file_name);
    
    while final_path.exists() {
        let new_name = if ext.is_empty() {
            format!("{} ({})", base_name, counter)
        } else {
            format!("{} ({}).{}", base_name, counter, ext)
        };
        final_path = dir.join(new_name);
        counter += 1;
    }
    final_path
}

fn detect_gpu_encoder(ffmpeg_exe: &Path) -> String {
    let mut cmd = Command::new(ffmpeg_exe);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000);
    
    if let Ok(output) = cmd.arg("-encoders").output() {
        let text = String::from_utf8_lossy(&output.stdout).to_lowercase();
        if text.contains("h264_nvenc") { return "h264_nvenc".to_string(); } 
        if text.contains("h264_amf") { return "h264_amf".to_string(); }     
        if text.contains("h264_qsv") { return "h264_qsv".to_string(); }     
        if text.contains("h264_videotoolbox") { return "h264_videotoolbox".to_string(); } 
    }
    "libx264".to_string() 
}

fn sidecar_output_error(output: &[u8], fallback: &str) -> String {
    let message = String::from_utf8_lossy(output).trim().to_string();
    if message.is_empty() { fallback.to_string() } else { message }
}

fn is_youtube_url(url: &str) -> bool {
    let lower = url.to_lowercase();
    lower.contains("youtube.com") || lower.contains("youtu.be")
}

fn add_youtube_runtime_args(args: &mut Vec<String>, url: &str, deno_exe: &Path, embedded_fallback: bool) {
    if deno_exe.exists() {
        args.push("--js-runtimes".to_string());
        args.push(format!("deno:{}", deno_exe.to_string_lossy()));
        args.push("--remote-components".to_string());
        args.push("ejs:github".to_string());
    }

    if is_youtube_url(url) {
        args.push("--extractor-args".to_string());
        args.push(if embedded_fallback {
            "youtube:player_client=web_embedded".to_string()
        } else {
            "youtube:player_client=default,-android_sdkless".to_string()
        });
    }
}

fn build_download_args(
    url: &str,
    output_template: &str,
    ffmpeg_location: &str,
    format_filter: &str,
    merge_format: &str,
    deno_exe: &Path,
    embedded_fallback: bool,
) -> Vec<String> {
    let mut args = vec![
        url.to_string(), "-o".to_string(), output_template.to_string(),
        "--ffmpeg-location".to_string(), ffmpeg_location.to_string(),
        "-f".to_string(), format_filter.to_string(),
        "--merge-output-format".to_string(), merge_format.to_string(),
        "--newline".to_string(),
        "--no-warnings".to_string(),
        "--no-update".to_string(),
        "--ignore-config".to_string(),
        "--no-playlist".to_string(),
        "--retries".to_string(), "5".to_string(),
        "--fragment-retries".to_string(), "5".to_string(),
        "--file-access-retries".to_string(), "3".to_string(),
        "--windows-filenames".to_string(),
    ];
    add_youtube_runtime_args(&mut args, url, deno_exe, embedded_fallback);
    args
}

#[tauri::command]
pub async fn get_video_info(app: AppHandle, url: String) -> Result<Value, String> {
    let sidecar = app.shell().sidecar("yt-dlp").map_err(|e| e.to_string())?;
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    let deno_exe = resource_dir.join("resources").join("deno.exe");
    let mut info_args = vec![
        "--dump-single-json".to_string(), "--flat-playlist".to_string(),
        "--no-warnings".to_string(), "--no-update".to_string(),
        "--ignore-config".to_string(), url.clone()
    ];
    add_youtube_runtime_args(&mut info_args, &url, &deno_exe, false);
    let output = sidecar.args(info_args).output().await.map_err(|e| e.to_string())?;
    if !output.status.success() {
        return Err(format!("yt-dlp could not read video info: {}", sidecar_output_error(&output.stderr, "unknown extractor error")));
    }
    
    let stdout_str = String::from_utf8_lossy(&output.stdout);
    let metadata: Value = serde_json::from_str(&stdout_str).map_err(|e| e.to_string())?;

    if metadata["_type"].as_str() == Some("playlist") || metadata["entries"].is_array() {
        let mut entries_list = Vec::new();
        if let Some(entries) = metadata["entries"].as_array() {
            for e in entries {
                entries_list.push(json!({
                    "title": e["title"].as_str().unwrap_or("Video trong Playlist"),
                    "url": e["url"].as_str().or(e["webpage_url"].as_str()).unwrap_or(&url),
                    "thumbnail": e["thumbnail"].as_str().unwrap_or_default(),
                    "availableResolutions": vec!["best"]
                }));
            }
        }
        return Ok(json!({
            "success": true,
            "isPlaylist": true,
            "playlistName": metadata["title"].as_str().unwrap_or("Danh sách phát"),
            "entries": entries_list
        }));
    }

    let mut available_res = vec!["best".to_string()];
    if let Some(formats) = metadata["formats"].as_array() {
        let mut heights: Vec<i64> = formats.iter()
            .filter_map(|f| f["height"].as_i64())
            .filter(|&h| h >= 360)
            .collect();
        
        heights.sort_by(|a, b| b.cmp(a));
        heights.dedup();
        for h in heights { available_res.push(h.to_string()); }
    }

    Ok(json!({
        "success": true,
        "isPlaylist": false,
        "title": metadata["title"].as_str().unwrap_or("Unknown Video"),
        "thumbnail": metadata["thumbnail"].as_str().unwrap_or_default(),
        "availableResolutions": available_res
    }))
}

#[tauri::command]
pub async fn download_video(
    app: AppHandle,
    id: String,
    url: String,
    save_dir: String,
    resolution: String,
    is_light: bool,
    start_time: String,
    end_time: String,
    use_gpu: Option<bool>, 
) -> Result<Value, String> {
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    let ffmpeg_exe = resource_dir.join("resources").join(if cfg!(target_os = "windows") { "ffmpeg.exe" } else { "ffmpeg" });
    let ffmpeg_location_str = resource_dir.join("resources").to_string_lossy().to_string();

    let final_save_dir_buf = if save_dir.is_empty() || !Path::new(&save_dir).exists() {
        app.path().download_dir().map_err(|e| e.to_string())?
    } else {
        PathBuf::from(save_dir)
    };

    let timestamp = chrono::Utc::now().timestamp_millis();
    let temp_dir = final_save_dir_buf.join(format!("temp_dl_{}_{}", id, timestamp));
    if !temp_dir.exists() { fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?; }

    let output_template = temp_dir.join("%(title)s.%(ext)s").to_string_lossy().to_string();
    let mut format_filter = "bv*+ba/b".to_string();

    if is_light {
        // 🚀 BẢN VÁ PREMIERE: Ép luồng Video tải chuẩn H.264 (avc) và Audio chuẩn M4A/AAC
        if resolution != "best" {
            format_filter = format!("bv*[height<={}][vcodec^=avc]+ba[ext=m4a]/b[height<={}][vcodec^=avc]/b", resolution, resolution);
        } else {
            format_filter = "bv*[vcodec^=avc]+ba[ext=m4a]/b[vcodec^=avc]/b".to_string();
        }
    } else if resolution != "best" {
        format_filter = format!("bv*[height<={}]+ba/b", resolution);
    }

    let merge_format = if is_light { "mp4" } else { "mkv" };

    let app_clone = app.clone();
    let mut last_output = String::new();
    let deno_exe = resource_dir.join("resources").join("deno.exe");
    let mut embedded_fallback = false;
    let mut download_failed: bool;

    loop {
        let sidecar = app.shell().sidecar("yt-dlp").map_err(|e| e.to_string())?;
        let args = build_download_args(
            &url,
            &output_template,
            &ffmpeg_location_str,
            &format_filter,
            merge_format,
            &deno_exe,
            embedded_fallback,
        );
        let (mut rx, mut _child) = sidecar.args(args).spawn().map_err(|e| e.to_string())?;
        let mut terminated = false;
        let mut attempt_failed = false;

        while let Some(event) = rx.recv().await {
            match event {
                tauri_plugin_shell::process::CommandEvent::Stdout(line) |
                tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                    let text = String::from_utf8_lossy(&line).to_string();
                    if !text.trim().is_empty() { last_output = text.trim().to_string(); }
                    if text.contains("[download]") && text.contains("%") {
                        if let Some(pct_idx) = text.find('%') {
                            let start_search = &text[..pct_idx];
                            if let Some(space_idx) = start_search.rfind(' ') {
                                let pct_str = start_search[space_idx..].trim();
                                if let Ok(percent_val) = pct_str.parse::<f64>() {
                                    let factor = if is_light { 0.9 } else { 0.7 };
                                    let display_percent = (percent_val * factor) as u32;
                                    let msg_key = if is_light { "dl_msg_downloading_light" } else { "dl_msg_downloading_hq" };
                                    let _ = app_clone.emit("download-progress", json!({ "id": id, "percent": display_percent, "msgKey": msg_key }));
                                }
                            }
                        }
                    }
                }
                tauri_plugin_shell::process::CommandEvent::Error(error) => {
                    last_output = error.to_string();
                    attempt_failed = true;
                }
                tauri_plugin_shell::process::CommandEvent::Terminated(payload) => {
                    terminated = true;
                    attempt_failed = payload.code.unwrap_or(1) != 0;
                }
                _ => {}
            }
        }

        if !terminated {
            attempt_failed = true;
            if last_output.is_empty() { last_output = "yt-dlp process ended unexpectedly".to_string(); }
        }
        if !attempt_failed {
            download_failed = false;
            break;
        }

        download_failed = true;
        let should_retry_embedded = !embedded_fallback
            && is_youtube_url(&url)
            && last_output.to_lowercase().contains("403");
        if !should_retry_embedded { break; }

        embedded_fallback = true;
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
    }

    if download_failed {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err(format!("yt-dlp download failed: {}", sidecar_output_error(last_output.as_bytes(), "unknown download error")));
    }

    let entries = fs::read_dir(&temp_dir).map_err(|e| e.to_string())?;
    let mut downloaded_file: Option<PathBuf> = None;
    for entry in entries.flatten() {
        let path = entry.path();
        let ext = path.extension().unwrap_or_default().to_string_lossy();
        if path.is_file() && ext != "part" && ext != "ytdl" {
            downloaded_file = Some(path);
            break;
        }
    }

    let downloaded_file_path = downloaded_file.ok_or_else(|| format!("yt-dlp finished without a video file: {}", sidecar_output_error(last_output.as_bytes(), "no output file")))?;
    let file_stem = downloaded_file_path.file_stem().unwrap_or_default().to_string_lossy().to_string();
    let final_file_name = if is_light { format!("{}.mp4", file_stem) } else { format!("{}_premiere.mp4", file_stem) };
    let final_file_path = get_unique_file_path(&final_save_dir_buf, &final_file_name);

    let need_cut = !start_time.trim().is_empty() && !end_time.trim().is_empty();

    // yt-dlp already merged the fast path into an MP4. Copy it directly so a
    // second FFmpeg pass cannot turn a successful download into a false error.
    if is_light && !need_cut {
        fs::copy(&downloaded_file_path, &final_file_path)
            .map_err(|error| format!("could not save downloaded video: {}", error))?;
        let _ = fs::remove_dir_all(&temp_dir);
        let _ = app.emit("download-progress", json!({ "id": id, "percent": 100, "msgKey": "dl_msg_done" }));
        return Ok(json!({ "success": true, "path": final_file_path.to_string_lossy().to_string() }));
    }

    let gpu_enabled = use_gpu.unwrap_or(true);
    let encoder = if gpu_enabled { detect_gpu_encoder(&ffmpeg_exe) } else { "libx264".to_string() };

    let mut cmd = Command::new(&ffmpeg_exe);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000);
    cmd.arg("-y");

    if need_cut {
        let _ = app.emit("download-progress", json!({ "id": id, "percent": 85, "msgKey": "dl_msg_cutting" }));
        cmd.arg("-ss").arg(start_time.trim()).arg("-to").arg(end_time.trim());
    } else {
        let _ = app.emit("download-progress", json!({ "id": id, "percent": 85, "msgKey": "dl_msg_gpu_render" }));
    }

    cmd.arg("-i").arg(&downloaded_file_path);

    if is_light && !need_cut {
        cmd.args(["-c:v", "copy", "-c:a", "aac", "-b:a", "192k"]);
    } else {
        cmd.arg("-c:v").arg(&encoder);
        // 🚀 ĐÃ BỎ GIỚI HẠN 5MBPS: Đẩy lên cấu hình nén đỉnh cao, Bung xõa max bitrate nguyên bản
        match encoder.as_str() {
            "h264_nvenc" => { cmd.args(["-preset", "p6", "-rc", "vbr", "-cq", "12", "-maxrate", "50M", "-bufsize", "100M"]); },
            "h264_amf" => { cmd.args(["-quality", "quality", "-b:v", "25000k"]); },
            "h264_qsv" => { cmd.args(["-preset", "veryslow", "-b:v", "25000k"]); },
            "h264_videotoolbox" => { cmd.args(["-b:v", "3000k"]); },
            _ => { cmd.args(["-preset", "veryfast", "-crf", "14"]); } // libx264 nét như rạp phim
        }
        cmd.args(["-pix_fmt", "yuv420p", "-profile:v", "high", "-c:a", "aac", "-b:a", "192k"]);
    }

    cmd.arg(&final_file_path);

    let output = cmd.output().map_err(|e| e.to_string())?;
    
    if !output.status.success() {
        if encoder != "libx264" && !is_light {
            let _ = app.emit("download-progress", json!({ "id": id.clone(), "percent": 90, "msgKey": "dl_msg_gpu_fail_fallback_cpu" }));
            let mut fallback_cmd = Command::new(&ffmpeg_exe);
            #[cfg(target_os = "windows")]
            fallback_cmd.creation_flags(0x08000000);
            fallback_cmd.arg("-y");
            if need_cut { fallback_cmd.arg("-ss").arg(start_time.trim()).arg("-to").arg(end_time.trim()); }
            fallback_cmd.arg("-i").arg(&downloaded_file_path)
                        .args(["-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k"])
                        .arg(&final_file_path);
            
            let fb_out = fallback_cmd.output().map_err(|e| e.to_string())?;
            if !fb_out.status.success() {
                let _ = fs::remove_dir_all(&temp_dir);
                return Err(format!("Lỗi kết xuất: {}", String::from_utf8_lossy(&fb_out.stderr)));
            }
        } else {
            let _ = fs::remove_dir_all(&temp_dir);
            return Err(format!("Lỗi phân đoạn: {}", String::from_utf8_lossy(&output.stderr)));
        }
    }

    let _ = fs::remove_dir_all(&temp_dir);
    let _ = app.emit("download-progress", json!({ "id": id, "percent": 100, "msgKey": "dl_msg_done" }));
    
    Ok(json!({ "success": true, "path": final_file_path.to_string_lossy().to_string() }))
}

#[tauri::command]
pub async fn search_video(app: AppHandle, keyword: String, limit: u32) -> Result<Value, String> {
    let sidecar = app.shell().sidecar("yt-dlp").map_err(|e| e.to_string())?;
    let search_str = format!("ytsearch{}:{}", limit, keyword);

    let output = sidecar.args([&search_str, "--dump-single-json", "--flat-playlist"]).output().await.map_err(|e| e.to_string())?;
    let stdout_str = String::from_utf8_lossy(&output.stdout);
    let metadata: Value = serde_json::from_str(&stdout_str).map_err(|e| e.to_string())?;
    
    if let Some(entries) = metadata["entries"].as_array() {
        let results: Vec<Value> = entries.iter().map(|e| {
            let id = e["id"].as_str().unwrap_or_default();
            let duration_string = match e["duration_string"].as_str() {
                Some(ds) => ds.to_string(),
                None => match e["duration"].as_f64() {
                    Some(secs) => {
                        let s = secs as u64;
                        format!("{:02}:{:02}", (s % 3600) / 60, s % 60)
                    },
                    None => "N/A".to_string()
                }
            };

            json!({
                "id": id,
                "title": e["title"].as_str().unwrap_or("Mất kết nối tiêu đề"),
                "url": e["url"].as_str().or(e["webpage_url"].as_str()).unwrap_or(&format!("https://www.youtube.com/watch?v={}", id)),
                "thumbnail": e["thumbnail"].as_str().unwrap_or(&format!("https://i.ytimg.com/vi/{}/hqdefault.jpg", id)),
                "duration": duration_string,
                "channel": e["uploader"].as_str().or(e["channel"].as_str()).unwrap_or("YouTube")
            })
        }).collect();
        Ok(json!({ "success": true, "results": results }))
    } else {
        Err("Không tìm thấy kết quả phù hợp.".to_string())
    }
}
