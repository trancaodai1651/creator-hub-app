use tauri::{AppHandle, Emitter, State};
use serde_json::{json, Value};
use tauri::Manager;
use std::fs;
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use std::time::Instant;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt; 
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, Condvar};
use std::sync::atomic::{AtomicBool, Ordering};
use rand::seq::SliceRandom;

// =======================================================================
// 🚀 HÀM PHỤ: QUÉT TÊN PHẦN CỨNG ĐỂ HIỂN THỊ LÊN THANH TIẾN TRÌNH
// =======================================================================
fn get_real_hardware_names() -> (String, String) {
    let mut cpu_name = String::from("CPU");
    let mut gpu_name = String::from("GPU");

    #[cfg(target_os = "windows")]
    {
        // Quét tên CPU
        if let Ok(output) = Command::new("wmic").args(["cpu", "get", "name"]).creation_flags(0x08000000).output() {
            let out_str = String::from_utf8_lossy(&output.stdout);
            for line in out_str.lines() {
                let trimmed = line.trim();
                if !trimmed.is_empty() && !trimmed.to_lowercase().contains("name") {
                    cpu_name = trimmed.replace("(R)", "").replace("(TM)", "").replace("CPU", "").replace("@", "").trim().to_string();
                    if let Some(idx) = cpu_name.find("  ") { cpu_name = cpu_name[..idx].trim().to_string(); }
                    break;
                }
            }
        }
        // Quét tên Card Màn Hình
        if let Ok(output) = Command::new("wmic").args(["path", "win32_VideoController", "get", "name"]).creation_flags(0x08000000).output() {
            let out_str = String::from_utf8_lossy(&output.stdout);
            let mut gpus = Vec::new();
            for line in out_str.lines() {
                let trimmed = line.trim();
                if !trimmed.is_empty() && !trimmed.to_lowercase().contains("name") {
                    gpus.push(trimmed.to_string());
                }
            }
            let target = gpus.iter().find(|g| g.to_lowercase().contains("nvidia") || g.to_lowercase().contains("amd") || g.to_lowercase().contains("radeon") || g.to_lowercase().contains("rtx"))
                .unwrap_or_else(|| gpus.first().unwrap_or(&gpu_name));

            gpu_name = target.replace("NVIDIA GeForce", "").replace("AMD Radeon", "").replace("Intel(R)", "").replace("Graphics", "").replace("UHD", "").trim().to_string();
        }
    }
    (cpu_name, gpu_name)
}

pub struct JoinerState {
    pub is_paused: AtomicBool,
    pub is_cancelled: AtomicBool,
    pub condvar: Condvar,
    pub mutex: Mutex<bool>,
}

impl JoinerState {
    #[allow(dead_code)]
    pub fn new() -> Self {
        Self {
            is_paused: AtomicBool::new(false),
            is_cancelled: AtomicBool::new(false),
            condvar: Condvar::new(),
            mutex: Mutex::new(false),
        }
    }
}

fn check_pause_and_cancel(state: &JoinerState, app: &AppHandle, msg: &str, percent: u32) -> bool {
    if state.is_cancelled.load(Ordering::Relaxed) { return true; }
    if state.is_paused.load(Ordering::Relaxed) {
        let _ = app.emit("join-progress", json!({ "message": format!("[TẠM DỪNG] {}", msg), "percent": percent }));
        let mut started = state.mutex.lock().unwrap();
        while state.is_paused.load(Ordering::Relaxed) && !state.is_cancelled.load(Ordering::Relaxed) {
            started = state.condvar.wait(started).unwrap();
        }
    }
    state.is_cancelled.load(Ordering::Relaxed)
}

#[tauri::command]
pub fn pause_joining(state: State<'_, Arc<JoinerState>>) {
    state.is_paused.store(true, Ordering::Relaxed);
}

#[tauri::command]
pub fn resume_joining(state: State<'_, Arc<JoinerState>>) {
    state.is_paused.store(false, Ordering::Relaxed);
    let mut started = state.mutex.lock().unwrap();
    *started = true;
    state.condvar.notify_all();
}

#[tauri::command]
pub fn cancel_joining(state: State<'_, Arc<JoinerState>>) {
    state.is_cancelled.store(true, Ordering::Relaxed);
    state.is_paused.store(false, Ordering::Relaxed);
    let mut started = state.mutex.lock().unwrap();
    *started = true;
    state.condvar.notify_all();
}

#[tauri::command]
pub async fn start_joining(
    app: AppHandle,
    state: State<'_, Arc<JoinerState>>,
    video_paths: Vec<String>,
    min_mins: f64,
    max_mins: f64,
    require_pillar: bool,
    output_dir: String,
    logo_path: String,
    logo_position: String,
    logo_size: i32,
    ratio: String,
    use_gpu: bool,
    video_encoder: Option<String>,
    single_mode: bool,
    hardware_mode: Option<String>, 
) -> Result<Value, String> {
    state.is_paused.store(false, Ordering::Relaxed);
    state.is_cancelled.store(false, Ordering::Relaxed);

    if video_paths.is_empty() { return Err("Không tìm thấy dữ liệu video đầu vào!".to_string()); }

    let hw_mode = hardware_mode.unwrap_or_else(|| "max".to_string());
    let resource_dir = app.path().resource_dir().map_err(|e| e.to_string())?;
    let ffmpeg_exe = resource_dir.join("resources").join(if cfg!(target_os = "windows") { "ffmpeg.exe" } else { "ffmpeg" });
    let ffprobe_exe = resource_dir.join("resources").join(if cfg!(target_os = "windows") { "ffprobe.exe" } else { "ffprobe" });

    let (real_cpu, real_gpu) = get_real_hardware_names();

    let final_output_dir = if output_dir.is_empty() || !Path::new(&output_dir).exists() {
        Path::new(&video_paths[0]).parent().unwrap().to_path_buf()
    } else {
        PathBuf::from(output_dir)
    };

    let min_secs = min_mins * 60.0;
    let max_secs = max_mins * 60.0;
    let mut video_data = Vec::new();
    let total_files = video_paths.len();

    for (i, v_path) in video_paths.iter().enumerate() {
        let read_percent = (((i + 1) as f64 / total_files as f64) * 100.0) as u32;
        let msg = format!("Giai đoạn 1/3: Đang quét thời lượng ({}/{})", i + 1, total_files);
        if check_pause_and_cancel(&state, &app, &msg, read_percent) { return Ok(json!({ "success": false, "message": "Đã hủy bỏ!" })); }
        let _ = app.emit("join-progress", json!({ "message": msg, "percent": read_percent }));

        let mut cmd = Command::new(&ffprobe_exe);
        #[cfg(target_os = "windows")]
        cmd.creation_flags(0x08000000); 

        let output = cmd.args(["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", v_path]).output();

        if let Ok(out) = output {
            if let Ok(duration) = String::from_utf8_lossy(&out.stdout).trim().parse::<f64>() {
                if duration > 0.0 { video_data.push((v_path.clone(), duration)); }
            }
        }
    }

    if video_data.is_empty() { return Err("Hệ thống không quét được thông tin video!".to_string()); }
    let _ = app.emit("join-progress", json!({ "message": "Giai đoạn 2/3: Đang tính toán kịch bản...", "percent": 100 }));

    let mut groups: Vec<(Vec<String>, f64)> = Vec::new();

    if single_mode {
        for v in video_data { groups.push((vec![v.0], v.1)); }
    } else {
        let mut rng = rand::thread_rng();
        let mut pillars = Vec::new();
        let mut small_videos = Vec::new();

        if require_pillar {
            for v in video_data { if v.1 > 600.0 { pillars.push(v); } else { small_videos.push(v); } }
        } else { small_videos = video_data; }

        pillars.shuffle(&mut rng); small_videos.shuffle(&mut rng);

        let mut current_group: Vec<(String, f64)> = Vec::new();
        let mut current_duration = 0.0;

        let finalize_group = |mut group: Vec<(String, f64)>, groups_vec: &mut Vec<(Vec<String>, f64)>| {
            if group.is_empty() { return; }
            let mut max_idx = 0;
            let mut total_dur = 0.0;
            for i in 0..group.len() { 
                total_dur += group[i].1;
                if group[i].1 > group[max_idx].1 { max_idx = i; } 
            }
            let longest = group.remove(max_idx);
            group.insert(0, longest);
            groups_vec.push((group.into_iter().map(|g| g.0).collect(), total_dur));
        };

        if require_pillar && !pillars.is_empty() { if let Some(p) = pillars.pop() { current_duration += p.1; current_group.push(p); } }

        while !small_videos.is_empty() {
            let next_video = small_videos.pop().unwrap();
            if current_duration + next_video.1 > max_secs {
                if current_duration >= min_secs { finalize_group(current_group.clone(), &mut groups); }
                current_group.clear(); current_duration = 0.0;
                if require_pillar && !pillars.is_empty() { if let Some(p) = pillars.pop() { current_duration += p.1; current_group.push(p); } }
            }
            current_duration += next_video.1; current_group.push(next_video);

            if current_duration >= min_secs && current_duration <= max_secs {
                finalize_group(current_group.clone(), &mut groups);
                current_group.clear(); current_duration = 0.0;
                if require_pillar && !pillars.is_empty() { if let Some(p) = pillars.pop() { current_duration += p.1; current_group.push(p); } }
            }
        }
        if !current_group.is_empty() && current_duration >= min_secs { finalize_group(current_group, &mut groups); }
        if groups.is_empty() { return Err("Tổng thời lượng video gộp chưa đạt số phút tối thiểu!".to_string()); }
    }

    let total_groups = groups.len();
    let has_logo = !logo_path.is_empty() && Path::new(&logo_path).exists();

    let mut encoders_pool = vec!["libx264".to_string()]; 
    if use_gpu {
        if let Some(custom_enc) = video_encoder {
            if !custom_enc.is_empty() { encoders_pool = vec![custom_enc]; }
        } else if cfg!(target_os = "windows") {
            encoders_pool = vec!["h264_nvenc".to_string(), "h264_qsv".to_string(), "h264_amf".to_string(), "libx264".to_string()];
        } else if cfg!(target_os = "macos") {
            encoders_pool = vec!["h264_videotoolbox".to_string(), "libx264".to_string()];
        }
    }

    let mut active_encoder = String::new();

    for (i, (group, target_duration)) in groups.iter().enumerate() {
        let tdur = *target_duration; 

        let output_path = if single_mode {
            let file_stem = Path::new(&group[0]).file_stem().unwrap_or_default().to_string_lossy().to_string();
            final_output_dir.join(format!("{}_processed.mp4", file_stem))
        } else {
            final_output_dir.join(format!("VIDEO_{}.mp4", i + 1))
        };

        let txt_path = final_output_dir.join(format!("temp_list_{}.txt", i));
        
        if !single_mode || group.len() > 1 {
            let txt_content: String = group.iter().map(|v| format!("file '{}'\n", v.replace('\\', "/").replace('\'', "'\\''"))).collect();
            fs::write(&txt_path, txt_content).map_err(|e| e.to_string())?;
        }

        let run_ffmpeg_engine = |encoder_id: &str, msg_base: &str| -> Result<(), String> {
            let mut cmd = Command::new(&ffmpeg_exe);
            #[cfg(target_os = "windows")]
            cmd.creation_flags(0x08000000); 

            cmd.args(["-progress", "pipe:2", "-nostats", "-v", "warning", "-y"]);

            if hw_mode == "low" { cmd.args(["-threads", "2"]); } 
            else if hw_mode == "balanced" { cmd.args(["-threads", "4"]); }

            if single_mode { cmd.arg("-i").arg(&group[0]); } 
            else { cmd.args(["-f", "concat", "-safe", "0", "-i"]).arg(&txt_path); }

            let need_re_encode = has_logo || ratio != "original";

            if need_re_encode {
                let ratio_filter = match ratio.as_str() {
                    "16:9" => "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080",
                    "9:16" => "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
                    "1:1" => "scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080",
                    _ => "scale=trunc(iw/2)*2:trunc(ih/2)*2",
                };

                if has_logo {
                    cmd.arg("-i").arg(&logo_path);
                    let overlay_params = match logo_position.as_str() {
                        "top-right" => "main_w-overlay_w-25:25",
                        "bottom-left" => "25:main_h-overlay_h-25",
                        "bottom-right" => "main_w-overlay_w-25:main_h-overlay_h-25",
                        _ => "25:25",
                    };
                    
                    let logo_filter = format!("[1:v]scale={}:-1[maskedlogo]", logo_size);

                    if ratio != "original" { cmd.arg("-filter_complex").arg(format!("[0:v]{}[bg]; {}; [bg][maskedlogo]overlay={}", ratio_filter, logo_filter, overlay_params)); } 
                    else { cmd.arg("-filter_complex").arg(format!("{}; [0:v][maskedlogo]overlay={}", logo_filter, overlay_params)); }
                } else {
                    cmd.arg("-vf").arg(ratio_filter);
                }

                cmd.arg("-c:v").arg(encoder_id).args(["-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k"]);

                match encoder_id {
                    "h264_nvenc" => {
                        if hw_mode == "low" { cmd.args(["-preset", "fast", "-b:v", "3000k"]); } 
                        else if hw_mode == "balanced" { cmd.args(["-preset", "medium", "-b:v", "6000k"]); } 
                        else { cmd.args(["-preset", "slow", "-b:v", "10000k"]); }
                    },
                    "h264_amf" => {
                        if hw_mode == "low" { cmd.args(["-quality", "speed"]); } else { cmd.args(["-quality", "balanced"]); }
                    },
                    "h264_qsv" => {
                        if hw_mode == "low" { cmd.args(["-preset", "veryfast"]); } else { cmd.args(["-preset", "medium"]); }
                    },
                    "h264_videotoolbox" => {
                        if hw_mode == "low" { cmd.args(["-b:v", "3000k"]); } else { cmd.args(["-b:v", "6000k"]); }
                    },
                    _ => {
                        if hw_mode == "low" { cmd.args(["-preset", "ultrafast", "-crf", "28"]); } 
                        else if hw_mode == "balanced" { cmd.args(["-preset", "veryfast", "-crf", "25"]); } 
                        else { cmd.args(["-preset", "fast", "-crf", "23"]); }
                    }
                }
            } else {
                cmd.args(["-c", "copy"]);
            }

            cmd.arg(&output_path);

            cmd.stdout(Stdio::null());
            cmd.stderr(Stdio::piped());

            let start_time = Instant::now();
            let mut child = cmd.spawn().map_err(|e| e.to_string())?;
            
            let stderr = child.stderr.take().unwrap();
            let stderr_arc = Arc::new(Mutex::new(String::new()));
            let stderr_clone = Arc::clone(&stderr_arc);
            
            let app_clone = app.clone();
            let msg_clone = msg_base.to_string();

            std::thread::spawn(move || {
                let reader = BufReader::new(stderr);
                let mut recent_lines = Vec::new();
                
                for line in reader.lines().flatten() {
                    if let Some(idx) = line.find("out_time_us=") {
                        if let Ok(us) = line[idx+12..].trim().parse::<f64>() {
                            let current_sec = us / 1_000_000.0;
                            let mut p = ((current_sec / tdur) * 100.0) as u32;
                            if p > 99 { p = 99; } 
                            
                            let elapsed = start_time.elapsed().as_secs_f64();
                            let mut eta_str = String::from(" | ⏳ Đang tính toán...");
                            if p > 0 && p < 100 {
                                let total_est = elapsed / (p as f64 / 100.0);
                                let remaining = total_est - elapsed;
                                
                                if remaining > 0.0 {
                                    let mins = (remaining / 60.0) as u32;
                                    let secs = (remaining % 60.0) as u32;
                                    if mins > 59 {
                                        let hours = mins / 60;
                                        let m_rem = mins % 60;
                                        eta_str = format!(" | ⏳ Còn: ~{:02}:{:02}:{:02}", hours, m_rem, secs);
                                    } else {
                                        eta_str = format!(" | ⏳ Còn: ~{:02}:{:02}", mins, secs);
                                    }
                                } else {
                                    eta_str = String::from(" | ⏳ Đang lưu file...");
                                }
                            }

                            let _ = app_clone.emit("join-progress", json!({
                                "message": format!("{}{}", msg_clone, eta_str),
                                "percent": p
                            }));
                        }
                    } else if !line.contains('=') && !line.is_empty() {
                        recent_lines.push(line.clone());
                        if recent_lines.len() > 5 { recent_lines.remove(0); }
                        if let Ok(mut err_store) = stderr_clone.lock() {
                            *err_store = recent_lines.join(" | ");
                        }
                    }
                }
            });

            loop {
                if state.is_cancelled.load(Ordering::Relaxed) {
                    let _ = child.kill();
                    if txt_path.exists() { let _ = fs::remove_file(&txt_path); }
                    return Err("Process Cancelled".to_string());
                }

                match child.try_wait() {
                    Ok(Some(status)) => {
                        if status.success() { 
                            return Ok(()); 
                        } else { 
                            let final_err = stderr_arc.lock().unwrap().clone();
                            return Err(if final_err.is_empty() { format!("Exit code {}", status.code().unwrap_or(1)) } else { final_err });
                        }
                    },
                    Ok(None) => {
                        std::thread::sleep(std::time::Duration::from_millis(150));
                    },
                    Err(e) => return Err(e.to_string()),
                }
            }
        };

        let current_try_list = if active_encoder.is_empty() { encoders_pool.clone() } else { vec![active_encoder.clone()] };
        let mut render_success = false;
        let mut last_error_msg = String::new();

        for encoder_id in &current_try_list {
            let label = if !has_logo && ratio == "original" { 
                "Siêu tốc".to_string() 
            } else { 
                match encoder_id.as_str() {
                    "libx264" => real_cpu.clone(),
                    "h264_nvenc" | "h264_qsv" | "h264_amf" | "h264_videotoolbox" => real_gpu.clone(),
                    _ => encoder_id.clone()
                }
            };
            
            let mode_tag = match hw_mode.as_str() { "low" => " [Mát máy]", "balanced" => " [Cân bằng]", _ => " [Max]" };
            
            let msg_base = format!("Giai đoạn 3/3: Đang xử lý {}/{} [Lõi: {}{}]", i + 1, total_groups, label, mode_tag);
            
            let _ = app.emit("join-progress", json!({ "message": format!("{} | ⏳ Đang tính toán...", msg_base), "percent": 0 }));

            if check_pause_and_cancel(&state, &app, &msg_base, 0) {
                if txt_path.exists() { let _ = fs::remove_file(&txt_path); }
                return Ok(json!({ "success": false, "message": "Đã hủy bỏ!" }));
            }

            match run_ffmpeg_engine(encoder_id, &msg_base) {
                Ok(_) => {
                    render_success = true;
                    if active_encoder.is_empty() { active_encoder = encoder_id.clone(); }
                    break;
                },
                Err(err) => {
                    if err == "Process Cancelled" { return Ok(json!({ "success": false, "message": "Đã hủy bỏ!" })); }
                    last_error_msg = err;
                }
            }
        }

        if txt_path.exists() { let _ = fs::remove_file(&txt_path); }

        if !render_success {
            if active_encoder != "libx264" {
                let msg_base = format!("Giai đoạn 3/3: Đang xử lý {}/{} [Lõi: {}]", i + 1, total_groups, real_cpu);
                let _ = app.emit("join-progress", json!({ "message": format!("Lỗi GPU: {} -> Lùi về CPU...", last_error_msg), "percent": 0 }));
                run_ffmpeg_engine("libx264", &msg_base).map_err(|e| format!("Lỗi sập nguồn CPU: {}", e))?;
                active_encoder = "libx264".to_string();
            } else {
                return Err(format!("Lỗi kết xuất FFmpeg: {}", last_error_msg));
            }
        }
    }

    let _ = app.emit("join-progress", json!({ "message": "Hoàn thành! Toàn bộ file đã lưu.", "percent": 100 }));
    Ok(json!({ "success": true, "message": "Thành công! Toàn bộ yêu cầu xử lý video đã hoàn tất." }))
}