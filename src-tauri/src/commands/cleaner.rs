use std::fs;
use std::path::Path;
use serde_json::{json, Value};

fn calculate_folder_size(dir_path: &Path) -> u64 {
    if !dir_path.exists() { return 0; }
    if dir_path.is_file() {
        return fs::metadata(dir_path).map(|m| m.len()).unwrap_or(0);
    }
    let mut total_size = 0;
    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            total_size += calculate_folder_size(&entry.path());
        }
    }
    total_size
}

fn clear_folder_contents(dir_path: &Path) {
    if !dir_path.exists() { return; }
    if let Ok(entries) = fs::read_dir(dir_path) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let _ = fs::remove_file(path);
            } else if path.is_dir() {
                let _ = fs::remove_dir_all(path);
            }
        }
    }
}

// 🚀 BẮT BUỘC PHẢI CÓ DÒNG NÀY NGAY TRÊN HÀM PUB
#[tauri::command]
pub async fn scan_system_junk() -> Result<Value, String> {
    let mut junk_data = Vec::new();
    let temp_dir = std::env::temp_dir();
    let size = calculate_folder_size(&temp_dir);
    
    junk_data.push(json!({
        "id": "sys_temp",
        "name": "Tệp tin hệ thống tạm thời",
        "desc": "Các file rác sinh ra trong quá trình hệ điều hành vận hành.",
        "size": size,
        "path": temp_dir.to_string_lossy().to_string()
    }));
    
    Ok(json!(junk_data))
}

// 🚀 BẮT BUỘC PHẢI CÓ DÒNG NÀY NGAY TRÊN HÀM PUB
#[tauri::command]
pub async fn execute_system_clean(targets: Vec<String>) -> Result<Value, String> {
    if targets.is_empty() {
        return Ok(json!({ "success": false, "message": "Không có mục tiêu nào được chọn!" }));
    }
    for target in targets {
        let path = Path::new(&target);
        clear_folder_contents(path);
    }
    Ok(json!({ 
        "success": true, 
        "message": "Hệ thống đã dọn dẹp sạch sẽ toàn bộ các file đệm rác!" 
    }))
}