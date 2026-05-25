use std::fs;
use std::path::Path;
use serde_json::{json, Value};
use tauri_plugin_dialog::DialogExt;
use tauri::Manager;

#[tauri::command]
pub async fn get_platform() -> Result<String, String> {
    Ok(std::env::consts::OS.to_string())
}

#[tauri::command]
pub async fn scan_folder(folder_path: String) -> Result<Value, String> {
    if folder_path.is_empty() { return Ok(json!([])); }
    let path = Path::new(&folder_path);
    let mut files_list = Vec::new();

    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Some(ext) = p.extension() {
                    let ext_str = ext.to_string_lossy().to_string();
                    if ["mp4", "mkv", "mov", "avi", "mp3", "m4a", "wav"].contains(&ext_str.as_str()) {
                        files_list.push(p.to_string_lossy().to_string());
                    }
                }
            }
        }
    }
    files_list.sort();
    Ok(json!(files_list))
}

// =======================================================================
// 🚀 KÍCH HOẠT: HÀM CHỌN THƯ MỤC CHUẨN (FIX LỖI LIỆT NÚT CỦA BẠN)
// =======================================================================
#[tauri::command]
pub async fn open_folder_dialog(app: tauri::AppHandle) -> Result<Value, String> {
    let folder = app.dialog().file()
        .set_title("Chọn thư mục mục tiêu")
        .blocking_pick_folder();

    match folder {
        Some(folder_path) => {
            let path_buf = match folder_path {
                tauri_plugin_dialog::FilePath::Path(p) => p,
                tauri_plugin_dialog::FilePath::Url(u) => std::path::PathBuf::from(u.path()),
            };
            Ok(json!(path_buf.to_string_lossy().to_string()))
        },
        None => Ok(Value::Null)
    }
}

// =======================================================================
// 🚀 KÍCH HOẠT: HÀM CHỌN 1 FILE BẤT KỲ
// =======================================================================
#[tauri::command]
pub async fn open_file_dialog(app: tauri::AppHandle) -> Result<Value, String> {
    let file = app.dialog().file()
        .set_title("Chọn tập tin xử lý")
        .blocking_pick_file();

    match file {
        Some(file_path) => {
            let path_buf = match file_path {
                tauri_plugin_dialog::FilePath::Path(p) => p,
                tauri_plugin_dialog::FilePath::Url(u) => std::path::PathBuf::from(u.path()),
            };
            Ok(json!(path_buf.to_string_lossy().to_string()))
        },
        None => Ok(Value::Null)
    }
}

#[tauri::command]
pub async fn open_multi_files_dialog(app: tauri::AppHandle) -> Result<Value, String> {
    let files = app.dialog().file()
        .set_title("Chọn các tập tin cần xử lý")
        .blocking_pick_files();

    match files {
        Some(file_paths) => {
            let mut result = Vec::new();
            for file_path in file_paths {
                let path_buf = match file_path {
                    tauri_plugin_dialog::FilePath::Path(p) => p,
                    tauri_plugin_dialog::FilePath::Url(u) => std::path::PathBuf::from(u.path()),
                };
                
                let path_str = path_buf.to_string_lossy().to_string();
                let ext = path_buf.extension().unwrap_or_default().to_string_lossy().to_string();
                let name = path_buf.file_stem().unwrap_or_default().to_string_lossy().to_string();
                
                result.push(json!({
                    "path": path_str,
                    "name": name,
                    "ext": format!(".{}", ext)
                }));
            }
            Ok(json!(result))
        },
        None => Ok(json!([]))
    }
}

#[tauri::command]
pub async fn open_logo_dialog(app: tauri::AppHandle) -> Result<Value, String> {
    let file = app.dialog().file()
        .set_title("Chọn file ảnh biểu tượng logo")
        .add_filter("Images", &["png", "jpg", "jpeg", "bmp"])
        .blocking_pick_file();

    match file {
        Some(file_path) => {
            let path_buf = match file_path {
                tauri_plugin_dialog::FilePath::Path(p) => p,
                tauri_plugin_dialog::FilePath::Url(u) => std::path::PathBuf::from(u.path()),
            };
            Ok(json!(path_buf.to_string_lossy().to_string()))
        },
        None => Ok(Value::Null)
    }
}

#[tauri::command]
pub async fn select_video_file(app: tauri::AppHandle) -> Result<Value, String> {
    let file = app.dialog().file()
        .set_title("Chọn tập tin video đầu vào")
        .add_filter("Videos", &["mp4", "mov", "avi", "mkv"])
        .blocking_pick_file();

    match file {
        Some(file_path) => {
            let path_buf = match file_path {
                tauri_plugin_dialog::FilePath::Path(p) => p,
                tauri_plugin_dialog::FilePath::Url(u) => std::path::PathBuf::from(u.path()),
            };
            Ok(json!(path_buf.to_string_lossy().to_string()))
        },
        None => Ok(Value::Null)
    }
}

// =======================================================================
// 🚀 4. CÁC HÀM ĐIỀU KHIỂN CỬA SỔ (TITLEBAR CUSTOM)
// =======================================================================
#[tauri::command]
pub async fn minimize_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.minimize();
    }
    Ok(())
}

#[tauri::command]
pub async fn maximize_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let is_maximized = window.is_maximized().unwrap_or(false);
        if is_maximized {
            let _ = window.unmaximize();
        } else {
            let _ = window.maximize();
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn close_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.close();
    }
    Ok(())
}

// =======================================================================
// 🖥️ HÀM TỰ ĐỘNG DÒ TÌM VÀ LẤY TÊN GPU THỰC TẾ CỦA MÁY
// =======================================================================
#[tauri::command]
pub fn get_gpu_name() -> String {
    use std::process::Command;
    #[cfg(target_os = "windows")]
    use std::os::windows::process::CommandExt;

    // 1. Xử lý trên môi trường Windows
    if cfg!(target_os = "windows") {
        let mut cmd = Command::new("wmic");
        #[cfg(target_os = "windows")]
        cmd.creation_flags(0x08000000); // Ẩn cửa sổ cmd đen ngầm

        let output = cmd.args(["path", "win32_VideoController", "get", "name"]).output();
        if let Ok(out) = output {
            let text = String::from_utf8_lossy(&out.stdout);
            let mut gpus: Vec<String> = text
                .lines()
                .map(|l| l.trim().to_string())
                .filter(|l| !l.is_empty() && l != "Name")
                .collect();
            
            if !gpus.is_empty() {
                // Nếu máy có 2 card (Ví dụ: 1 Intel Onboard + 1 Nvidia rời)
                // Ưu tiên đưa card rời lên trước hoặc hiển thị cả 2 dạng chuỗi kết hợp
                gpus.reverse(); 
                return gpus.join(" + ");
            }
        }
    } 
    // 2. Xử lý trên môi trường macOS Apple Silicon / Intel Mac
    else if cfg!(target_os = "macos") {
        let output = Command::new("system_profiler").arg("SPDisplaysDataType").output();
        if let Ok(out) = output {
            let text = String::from_utf8_lossy(&out.stdout);
            let mut gpus = Vec::new();
            for line in text.lines() {
                if line.contains("Chipset Model:") {
                    if let Some(name) = line.split("Chipset Model:").nth(1) {
                        gpus.push(name.trim().to_string());
                    }
                }
            }
            if !gpus.is_empty() { return gpus.join(" + "); }
        }
    } 
    // 3. Môi trường Linux dự phòng
    else {
        let output = Command::new("sh").args(["-c", "lspci | grep -E \"VGA|3D\""]).output();
        if let Ok(out) = output {
            let text = String::from_utf8_lossy(&out.stdout);
            if let Some(line) = text.lines().next() {
                if let Some(idx) = line.find("controller:") {
                    return line[idx + 11..].trim().to_string();
                }
                return line.to_string();
            }
        }
    }
    
    "Chíp Đồ Họa Hệ Thống".to_string()
}

// =======================================================================
// 🖥️ HÀM TỰ ĐỘNG DÒ TÌM VÀ LẤY TÊN CPU THỰC TẾ CỦA MÁY
// =======================================================================
#[tauri::command]
pub fn get_cpu_name() -> String {
    use std::process::Command;
    #[cfg(target_os = "windows")]
    use std::os::windows::process::CommandExt;

    if cfg!(target_os = "windows") {
        let mut cmd = Command::new("wmic");
        #[cfg(target_os = "windows")]
        cmd.creation_flags(0x08000000); // Ẩn cửa sổ cmd
        
        if let Ok(out) = cmd.args(["cpu", "get", "name"]).output() {
            let text = String::from_utf8_lossy(&out.stdout);
            let lines: Vec<&str> = text.lines().map(|l| l.trim()).filter(|l| !l.is_empty() && l != &"Name").collect();
            if let Some(cpu) = lines.first() {
                return cpu.to_string();
            }
        }
    } else if cfg!(target_os = "macos") {
        if let Ok(out) = Command::new("sysctl").args(["-n", "machdep.cpu.brand_string"]).output() {
            return String::from_utf8_lossy(&out.stdout).trim().to_string();
        }
    } else {
        if let Ok(out) = Command::new("sh").args(["-c", "grep 'model name' /proc/cpuinfo | head -1"]).output() {
            let text = String::from_utf8_lossy(&out.stdout);
            if let Some(idx) = text.find(':') {
                return text[idx + 1..].trim().to_string();
            }
        }
    }
    "Bộ vi xử lý Hệ Thống".to_string()
}