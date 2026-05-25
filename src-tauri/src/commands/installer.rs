use std::process::Command;
use serde_json::{json, Value};

#[tauri::command]
pub async fn search_apps(query: String) -> Result<Value, String> {
    if query.is_empty() { return Ok(json!([])); }
    
    // Trên Windows dùng lệnh winget search
    let output = if cfg!(target_os = "windows") {
        Command::new("winget")
            .args(["search", &query])
            .output()
            .map_err(|e| e.to_string())?
    } else {
        // Trên Mac dùng brew search
        Command::new("brew")
            .args(["search", "--casks", &query])
            .output()
            .map_err(|e| e.to_string())?
    };

    let text = String::from_utf8_lossy(&output.stdout).to_string();
    let mut results = Vec::new();
    
    for line in text.lines().skip(2) {
        let trimmed = line.trim();
        if !trimmed.is_empty() {
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if !parts.is_empty() {
                results.push(json!({ "id": parts[0], "name": parts[0], "icon": "📦" }));
            }
        }
    }
    Ok(json!(results))
}

#[tauri::command]
pub async fn install_selected_apps(app_ids: Vec<String>) -> Result<Value, String> {
    let mut success_count = 0;
    for app_id in &app_ids {
        let status = if cfg!(target_os = "windows") {
            Command::new("winget")
                .args(["install", "--id", app_id, "--silent"])
                .status()
        } else {
            Command::new("brew")
                .args(["install", "--cask", app_id])
                .status()
        };

        if let Ok(s) = status {
            if s.success() { success_count += 1; }
        }
    }
    Ok(json!({ "success": true, "message": format!("Đã cài đặt thành công {}/{} ứng dụng.", success_count, app_ids.len()) }))
}