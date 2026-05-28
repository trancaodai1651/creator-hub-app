use tauri::{AppHandle, Emitter};
use serde_json::{json, Value};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use tauri_plugin_dialog::DialogExt; 
use std::fs;

// 1. CHỌN NHIỀU VIDEO CÙNG LÚC
#[tauri::command]
pub async fn select_publisher_video_file(app: AppHandle) -> Result<Value, String> {
    let file_paths = app.dialog().file().add_filter("Videos", &["mp4", "mov", "avi", "mkv"]).blocking_pick_files();

    if let Some(paths) = file_paths {
        let mut results = Vec::new();
        for path in paths {
            if let Ok(path_buf) = path.into_path() {
                // An toàn: Không lấy được dung lượng thì gán = 0, tuyệt đối không vứt file
                let size_mb = fs::metadata(&path_buf).map(|m| m.len() as f64 / 1024.0 / 1024.0).unwrap_or(0.0); 
                let file_name = path_buf.file_name().unwrap_or_default().to_string_lossy().to_string();
                results.push(json!({ "name": file_name, "size": format!("{:.2} MB", size_mb), "path": path_buf.to_string_lossy().to_string() }));
            }
        }
        return Ok(json!(results));
    }
    Ok(Value::Null)
}

// 2. MỞ TRÌNH DUYỆT SETUP TÀI KHOẢN
#[tauri::command]
pub async fn setup_publisher_account(platform: String, profile_name: String) -> Result<Value, String> {
    let config = json!({
        "platform": platform,
        "profileName": profile_name
    });
    let config_str = serde_json::to_string(&config).unwrap();

    let mut cmd = Command::new("node");
    
    // 🚀 FIX: ĐÃ CHỈ ĐỊNH ĐÚNG FILE TỔNG CHỈ HUY MỚI
    cmd.args(["scripts/main_runner.js", "setup", &config_str]);

    let status = cmd.spawn().map_err(|e| e.to_string())?.wait().map_err(|e| e.to_string())?;
    
    if status.success() { Ok(json!({ "success": true })) } 
    else { Ok(json!({ "success": false, "error": "Không thể mở trình duyệt!" })) }
}

// 3. TIẾN TRÌNH AUTO ĐĂNG TẢI CHÍNH
#[tauri::command]
pub async fn trigger_puppeteer_publish(app: AppHandle, config: Value) -> Result<Value, String> {
    let config_str = serde_json::to_string(&config).unwrap();

    let mut cmd = Command::new("node");
    
    // 🚀 FIX: ĐÃ CHỈ ĐỊNH ĐÚNG FILE TỔNG CHỈ HUY MỚI
    cmd.args(["scripts/main_runner.js", "publish", &config_str]);

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped()); 

    let mut child = cmd.spawn().map_err(|e| format!("Lỗi khởi chạy Node: {}", e))?;

    // BẮT LOG BÌNH THƯỜNG TRUYỀN LÊN GIAO DIỆN
    if let Some(stdout) = child.stdout.take() {
        let app_clone = app.clone();
        std::thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines().flatten() {
                let _ = app_clone.emit("publisher-log-reply", line);
            }
        });
    }

    // BẮT LỖI SẬP NGUỒN CỦA NODE TRUYỀN LÊN GIAO DIỆN
    if let Some(stderr) = child.stderr.take() {
        let app_clone = app.clone();
        std::thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines().flatten() {
                let _ = app_clone.emit("publisher-log-reply", format!("❌ LỖI HỆ THỐNG: {}", line));
            }
        });
    }

    let status = child.wait().map_err(|e| e.to_string())?;
    
    if status.success() { Ok(json!({ "success": true })) } 
    else { Ok(json!({ "success": false, "error": "Tiến trình Node.js sụp đổ. Hãy kiểm tra log!" })) }
}