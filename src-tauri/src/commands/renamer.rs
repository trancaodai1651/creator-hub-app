use std::fs;
use serde_json::{json, Value};

#[derive(serde::Deserialize)]
pub struct RenameRule {
    #[serde(rename = "oldPath")]
    old_path: String,
    #[serde(rename = "newPath")]
    new_path: String,
}

// 🚀 ĐỒNG BỘ MACRO ĐỊNH DANH TAURI COMMAND
#[tauri::command]
pub async fn execute_batch_rename(file_rules: Vec<RenameRule>) -> Result<Value, String> {
    if file_rules.is_empty() {
        return Ok(json!({ "success": false, "message": "Không có file nào để đổi tên!" }));
    }

    let mut success_count = 0;
    for rule in &file_rules {
        if fs::metadata(&rule.old_path).is_ok() {
            match fs::rename(&rule.old_path, &rule.new_path) {
                Ok(_) => success_count += 1,
                Err(e) => eprintln!("Lỗi đổi tên: {}", e),
            }
        }
    }

    Ok(json!({ 
        "success": true, 
        "message": format!("Đã đổi tên hàng loạt thành công {}/{} tập tin.", success_count, file_rules.len())
    }))
}