#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use sysinfo::System;
use std::sync::Arc;

#[tauri::command]
fn get_system_health() -> serde_json::Value {
    let mut sys = System::new_all();
    sys.refresh_all();
    std::thread::sleep(std::time::Duration::from_millis(100));
    sys.refresh_all();

    let total_ram = sys.total_memory();
    let used_ram = sys.used_memory();
    let ram_pressure = if total_ram > 0 { (used_ram as f64 / total_ram as f64) * 100.0 } else { 0.0 };

    serde_json::json!({
        "success": true,
        "data": {
            "os": { "platform": std::env::consts::OS, "distro": System::name().unwrap_or_default(), "release": System::os_version().unwrap_or_default(), "hostname": System::host_name().unwrap_or_default() },
            "cpu": { "load": sys.global_cpu_info().cpu_usage() as u32, "temp": 45, "cores": sys.cpus().len() },
            "ram": { "total": total_ram, "used": used_ram, "free": sys.free_memory(), "pressure": ram_pressure as u32 },
            "disk": { "name": "SystemDrive", "total": 0, "used": 0, "free": 0, "usePercent": 0 },
            "battery": { "hasBattery": false, "percent": 100, "isCharging": false, "cycleCount": 0, "health": 100 },
            "network": { "interface": "Wi-Fi", "downloadSpeed": 0, "uploadSpeed": 0 },
            "devices": { "connectedWifi": "Tauri Local" }
        }
    })
}

fn main() {
    let joiner_state = Arc::new(commands::joiner::JoinerState::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init()) 
        .plugin(tauri_plugin_fs::init())     
        .manage(joiner_state) 
        .invoke_handler(tauri::generate_handler![
            get_system_health,
            commands::chatbot::ask_groq_chatbot,
            commands::cleaner::scan_system_junk,
            commands::cleaner::execute_system_clean,
            commands::renamer::execute_batch_rename,
            
            // 🚀 ĐÃ KHAI BÁO ĐẦY ĐỦ CÁC HÀM DIALOG ĐỂ KHÔNG BỊ TRƠ NÚT BẤM
            commands::system::get_platform,
            commands::system::scan_folder,
            commands::system::open_folder_dialog,      
            commands::system::open_file_dialog,        
            commands::system::open_multi_files_dialog,
            commands::system::open_logo_dialog,
            commands::system::select_video_file,
            commands::system::minimize_window,
            commands::system::maximize_window,
            commands::system::close_window,
            commands::system::get_gpu_name,
            commands::system::get_cpu_name,
            
            commands::tts::get_elevenlabs_voices,
            commands::tts::generate_tts_elevenlabs,
            commands::downloader::search_video,
            commands::downloader::get_video_info,
            commands::downloader::download_video,
            commands::downloader::open_video_native,
            commands::installer::search_apps,
            commands::installer::install_selected_apps,
            commands::joiner::start_joining,
            commands::joiner::pause_joining,
            commands::joiner::resume_joining,
            commands::joiner::cancel_joining,
            commands::converter::convert_file
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi khi chạy phần mềm Tauri");
}