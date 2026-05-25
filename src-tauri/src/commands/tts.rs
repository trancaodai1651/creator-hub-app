use reqwest::Client;
use serde_json::{json, Value};
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use tauri::Manager; // 🚀 THÊM DÒNG NÀY

#[tauri::command]
pub async fn get_elevenlabs_voices(api_key: String) -> Result<Value, String> {
    if api_key.is_empty() { return Ok(json!([])); }
    let client = Client::new();
    
    let res = client.get("https://api.elevenlabs.io/v1/voices").header("xi-api-key", &api_key).send().await.map_err(|e| e.to_string())?;
    let data: Value = res.json().await.map_err(|e| e.to_string())?;
    Ok(data["voices"].clone())
}

#[tauri::command] // 🚀 THÊM app: tauri::AppHandle
pub async fn generate_tts_elevenlabs(
    app: tauri::AppHandle, 
    text: String,
    voice_id: String,
    api_key: String,
    output_dir: Option<String>,
) -> Result<Value, String> {
    if text.is_empty() || voice_id.is_empty() || api_key.is_empty() {
        return Err("Thiếu tham số cấu hình TTS!".to_string());
    }

    // 🚀 LẤY ĐƯỜNG DẪN DOWNLOAD CHUẨN TAURI V2
    let final_dir = match output_dir {
        Some(dir) => PathBuf::from(dir),
        None => app.path().download_dir().map_err(|e| e.to_string())?,
    };

    let file_name = format!("Voice_Adam_AI_{}.mp3", json!(chrono::Utc::now().timestamp_millis()));
    let output_path = final_dir.join(file_name);

    let client = Client::new();
    let payload = json!({
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": { "stability": 0.5, "similarity_boost": 0.75 }
    });

    let res = client
        .post(format!("https://api.elevenlabs.io/v1/text-to-speech/{}", voice_id))
        .header("xi-api-key", &api_key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err("Lỗi kết nối từ ElevenLabs API".to_string());
    }

    let bytes = res.bytes().await.map_err(|e| e.to_string())?;
    let mut file = File::create(&output_path).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;

    Ok(json!({ "success": true, "message": format!("Đã chuyển đổi giọng nói AI thành công vào thư mục: {}", output_path.to_string_lossy()) }))
}