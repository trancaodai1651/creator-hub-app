use rand::seq::SliceRandom;
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::{AppHandle, Emitter, Manager};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[derive(Debug, Deserialize, Clone)]
pub struct HighlightSegment {
    pub video_path: String,
    pub start_secs: f64,
    pub end_secs: f64,
}

#[derive(Clone)]
struct SegmentPlan {
    video_path: String,
    start_secs: f64,
    duration: f64,
    source_duration: f64,
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

fn probe_duration(ffprobe_exe: &Path, video_path: &str) -> f64 {
    let mut command = Command::new(ffprobe_exe);
    #[cfg(target_os = "windows")]
    command.creation_flags(0x08000000);
    command.args(["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", video_path]);
    command.output().ok().and_then(|output| String::from_utf8_lossy(&output.stdout).trim().parse::<f64>().ok()).filter(|value| *value > 0.0).unwrap_or(0.0)
}

fn append_encoder_settings(command: &mut Command, encoder: &str, hardware_mode: &str) {
    command.args(["-c:v", encoder, "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k"]);
    match encoder {
        "h264_nvenc" => {
            command.args(match hardware_mode { "low" => ["-preset", "fast"], "balanced" => ["-preset", "medium"], _ => ["-preset", "slow"] });
            if hardware_mode == "low" { command.args(["-b:v", "3000k"]); } else if hardware_mode == "balanced" { command.args(["-b:v", "6000k"]); } else { command.args(["-b:v", "10000k"]); }
        }
        "h264_amf" => { command.args(if hardware_mode == "low" { ["-quality", "speed"] } else { ["-quality", "balanced"] }); }
        "h264_qsv" => { command.args(if hardware_mode == "low" { ["-preset", "veryfast"] } else { ["-preset", "medium"] }); }
        "h264_videotoolbox" => { command.args(if hardware_mode == "low" { ["-b:v", "3000k"] } else { ["-b:v", "6000k"] }); }
        _ => {
            if hardware_mode == "low" { command.args(["-preset", "ultrafast", "-crf", "28"]); } else if hardware_mode == "balanced" { command.args(["-preset", "veryfast", "-crf", "25"]); }
        }
    }
}

#[tauri::command]
pub async fn export_highlights(
    app: AppHandle,
    segments: Vec<HighlightSegment>,
    output_dir: String,
    output_mode: String,
    ratio: String,
    short_duration_mins: f64,
    short_ratio: String,
    random_script: bool,
    min_mins: f64,
    max_mins: f64,
    require_pillar: bool,
    use_gpu: bool,
    video_encoder: Option<String>,
    hardware_mode: Option<String>,
    logo_path: String,
    logo_position: String,
    logo_size: i32,
) -> Result<Value, String> {
    if segments.is_empty() {
        return Err("Chưa có đoạn highlight để xuất.".to_string());
    }

    let valid_segments: Vec<HighlightSegment> = segments.into_iter().filter(|segment| Path::new(&segment.video_path).is_file() && segment.start_secs >= 0.0 && segment.end_secs > segment.start_secs).collect();
    if valid_segments.is_empty() {
        return Err("Các mốc highlight không hợp lệ hoặc không tìm thấy video.".to_string());
    }

    let resource_dir = app.path().resource_dir().map_err(|error| error.to_string())?;
    let ffmpeg_exe = resource_dir.join("resources").join(if cfg!(target_os = "windows") { "ffmpeg.exe" } else { "ffmpeg" });
    let ffprobe_exe = resource_dir.join("resources").join(if cfg!(target_os = "windows") { "ffprobe.exe" } else { "ffprobe" });
    if !ffmpeg_exe.is_file() { return Err("Không tìm thấy FFmpeg đi kèm ứng dụng.".to_string()); }

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
    let output_ratio = if is_short {
        match short_ratio.as_str() { "16:9" | "9:16" | "3:4" | "1:1" | "4:3" => short_ratio.as_str(), _ => "9:16" }
    } else {
        match ratio.as_str() { "16:9" | "9:16" | "3:4" | "1:1" | "4:3" => ratio.as_str(), _ => "original" }
    };
    let ratio_filter_value = ratio_filter(output_ratio);
    let short_duration_secs = (short_duration_mins.max(0.1) * 60.0).min(86_400.0);
    let min_secs = (min_mins.max(0.1) * 60.0).min(86_400.0);
    let max_secs = (max_mins.max(min_mins).max(0.1) * 60.0).min(86_400.0).max(min_secs);
    let has_logo = !logo_path.is_empty() && Path::new(&logo_path).is_file();
    let hardware_mode = hardware_mode.unwrap_or_else(|| "max".to_string());

    let mut duration_cache = HashMap::new();
    let plans: Vec<SegmentPlan> = valid_segments.iter().map(|segment| {
        let source_duration = *duration_cache.entry(segment.video_path.clone()).or_insert_with(|| probe_duration(&ffprobe_exe, &segment.video_path));
        SegmentPlan { video_path: segment.video_path.clone(), start_secs: segment.start_secs, duration: (segment.end_secs - segment.start_secs).min(86_400.0), source_duration }
    }).collect();

    let mut groups: Vec<Vec<usize>> = Vec::new();
    if single_output {
        let mut group: Vec<usize> = (0..plans.len()).collect();
        if random_script {
            let mut rng = rand::thread_rng();
            group.shuffle(&mut rng);
            if require_pillar {
                group.sort_by_key(|index| if plans[*index].source_duration > 600.0 { 0 } else { 1 });
            }
        }
        groups.push(group);
    } else if random_script {
        let mut pillars = Vec::new();
        let mut regular = Vec::new();
        for (index, plan) in plans.iter().enumerate() {
            if require_pillar && plan.source_duration > 600.0 { pillars.push(index); } else { regular.push(index); }
        }
        let mut rng = rand::thread_rng();
        pillars.shuffle(&mut rng);
        regular.shuffle(&mut rng);
        while !pillars.is_empty() || !regular.is_empty() {
            let mut group = Vec::new();
            let mut total = 0.0;
            if require_pillar { if let Some(index) = pillars.pop() { total += plans[index].duration; group.push(index); } }
            loop {
                let next = regular.pop().map(|index| (index, false)).or_else(|| pillars.pop().map(|index| (index, true)));
                let Some((index, was_pillar)) = next else { break };
                let duration = plans[index].duration;
                if !group.is_empty() && total >= min_secs && total + duration > max_secs { if was_pillar { pillars.push(index); } else { regular.push(index); } break; }
                total += duration;
                group.push(index);
                if total >= min_secs { break; }
            }
            if group.is_empty() { if let Some(index) = regular.pop().or_else(|| pillars.pop()) { group.push(index); } }
            if !group.is_empty() { groups.push(group); }
        }
    } else {
        groups = (0..plans.len()).map(|index| vec![index]).collect();
    }
    if groups.is_empty() { return Err("Không tạo được kịch bản highlight.".to_string()); }

    let stamp = chrono::Utc::now().timestamp_millis();
    let scenario_scripts: Vec<Value> = groups.iter().enumerate().map(|(index, group)| {
        let output = if single_output { output_path.join(format!("HIGHLIGHT_{}_{}_{}.mp4", kind, output_ratio.replace(':', "x"), stamp)) } else { output_path.join(format!("HIGHLIGHT_{}_{}_{}_{:03}.mp4", kind, output_ratio.replace(':', "x"), stamp, index + 1)) };
        let total_duration: f64 = group.iter().map(|item| plans[*item].duration).sum();
        let children: Vec<Value> = group.iter().map(|item| json!({ "name": Path::new(&plans[*item].video_path).file_name().unwrap_or_default().to_string_lossy(), "path": plans[*item].video_path, "durationSecs": plans[*item].duration })).collect();
        json!({ "outputName": output.file_name().unwrap_or_default().to_string_lossy(), "outputPath": output.to_string_lossy(), "type": if is_short { "short" } else { "long" }, "format": "MP4", "ratio": output_ratio, "durationSecs": if is_short { total_duration.min(short_duration_secs) } else { total_duration }, "children": children })
    }).collect();
    let _ = app.emit("join-scenario", json!({ "scope": "highlight", "scripts": scenario_scripts }));

    let mut encoders = vec!["libx264".to_string()];
    if use_gpu {
        if let Some(custom_encoder) = video_encoder.filter(|value| !value.is_empty()) { encoders = vec![custom_encoder, "libx264".to_string()]; }
        else if cfg!(target_os = "windows") { encoders = vec!["h264_nvenc".to_string(), "h264_qsv".to_string(), "h264_amf".to_string(), "libx264".to_string()]; }
        else if cfg!(target_os = "macos") { encoders = vec!["h264_videotoolbox".to_string(), "libx264".to_string()]; }
    }

    let mut temporary_paths: Vec<Option<PathBuf>> = vec![None; plans.len()];
    let _ = app.emit("join-progress", json!({ "message": "Highlight: đang cắt các đoạn đã chọn...", "percent": 0 }));
    for (index, plan) in plans.iter().enumerate() {
        let temp_path = output_path.join(format!(".creator_hub_highlight_{}_{}.mp4", stamp, index + 1));
        let render_duration = if is_short && !random_script && !single_output { plan.duration.min(short_duration_secs) } else { plan.duration };
        let start_arg = format!("{:.3}", plan.start_secs);
        let duration_arg = format!("{:.3}", render_duration);
        let run_encoder = |encoder: &str| -> Result<std::process::Output, String> {
            let mut command = Command::new(&ffmpeg_exe);
            #[cfg(target_os = "windows")]
            command.creation_flags(0x08000000);
            command.args(["-y", "-v", "warning", "-ss", start_arg.as_str(), "-i"]).arg(&plan.video_path).args(["-t", duration_arg.as_str()]);
            if has_logo {
                command.args(["-loop", "1", "-i"]).arg(&logo_path);
                let overlay = match logo_position.as_str() { "top-right" => "main_w-overlay_w-25:25", "bottom-left" => "25:main_h-overlay_h-25", "bottom-right" => "main_w-overlay_w-25:main_h-overlay_h-25", _ => "25:25" };
                let base = ratio_filter_value.unwrap_or("format=yuv420p");
                let size = logo_size.max(1);
                let filter = format!("[0:v]{}[highlight_bg];[1:v]scale={}:-1[highlight_logo];[highlight_bg][highlight_logo]overlay={}[highlight_video]", base, size, overlay);
                command.args(["-filter_complex", filter.as_str(), "-map", "[highlight_video]", "-map", "0:a?"]);
            } else if let Some(filter) = ratio_filter_value {
                command.args(["-vf", filter, "-map", "0:v:0", "-map", "0:a?"]);
            } else {
                command.args(["-map", "0:v:0", "-map", "0:a?"]);
            }
            append_encoder_settings(&mut command, encoder, &hardware_mode);
            command.args(["-movflags", "+faststart", "-shortest"]).arg(&temp_path).stdout(Stdio::null()).stderr(Stdio::piped());
            command.output().map_err(|error| error.to_string())
        };

        let mut last_error = String::new();
        let mut rendered = false;
        for encoder in &encoders {
            let result = run_encoder(encoder)?;
            if result.status.success() { rendered = true; break; }
            last_error = String::from_utf8_lossy(&result.stderr).trim().to_string();
        }
        if !rendered { return Err(if last_error.is_empty() { format!("Không thể cắt highlight {}.", index + 1) } else { last_error }); }
        temporary_paths[index] = Some(temp_path);
        let percent = (((index + 1) as f64 / plans.len() as f64) * 70.0) as u32;
        let _ = app.emit("join-progress", json!({ "message": format!("Highlight: đã xử lý {}/{} đoạn...", index + 1, plans.len()), "percent": percent }));
    }

    let mut output_paths = Vec::new();
    for (index, group) in groups.iter().enumerate() {
        let final_path = if single_output { output_path.join(format!("HIGHLIGHT_{}_{}_{}.mp4", kind, output_ratio.replace(':', "x"), stamp)) } else { output_path.join(format!("HIGHLIGHT_{}_{}_{}_{:03}.mp4", kind, output_ratio.replace(':', "x"), stamp, index + 1)) };
        let can_rename = group.len() == 1 && (!is_short || (!random_script && !single_output));
        let first_temp = temporary_paths[group[0]].clone().ok_or_else(|| "Thiếu tệp tạm highlight.".to_string())?;
        if can_rename {
            fs::rename(&first_temp, &final_path).map_err(|error| error.to_string())?;
        } else {
            let list_path = output_path.join(format!(".creator_hub_highlight_list_{}_{}.txt", stamp, index));
            let list_content: String = group.iter().filter_map(|item| temporary_paths[*item].as_ref()).map(|path| format!("file '{}'\n", clean_path(path))).collect();
            fs::write(&list_path, list_content).map_err(|error| error.to_string())?;
            let mut command = Command::new(&ffmpeg_exe);
            #[cfg(target_os = "windows")]
            command.creation_flags(0x08000000);
            command.args(["-y", "-v", "warning", "-f", "concat", "-safe", "0", "-i"]).arg(&list_path);
            if is_short { let duration_arg = format!("{:.3}", short_duration_secs); command.args(["-t", duration_arg.as_str()]); }
            command.args(["-c", "copy", "-movflags", "+faststart"]).arg(&final_path).stdout(Stdio::null()).stderr(Stdio::piped());
            let output = command.output().map_err(|error| error.to_string())?;
            let _ = fs::remove_file(&list_path);
            if !output.status.success() { return Err(String::from_utf8_lossy(&output.stderr).trim().to_string()); }
            for item in group { if let Some(path) = &temporary_paths[*item] { let _ = fs::remove_file(path); } }
        }
        output_paths.push(final_path.to_string_lossy().to_string());
    }

    let _ = app.emit("join-progress", json!({ "message": "Đã hoàn thành highlight.", "percent": 100 }));
    Ok(json!({ "success": true, "paths": output_paths, "scripts": scenario_scripts, "message": format!("Đã xuất {} highlight {}.", output_paths.len(), if is_short { "ngắn" } else { "dài" }) }))
}
