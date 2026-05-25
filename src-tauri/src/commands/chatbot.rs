use reqwest::Client;
use serde_json::{json, Value};

#[tauri::command]
pub async fn ask_groq_chatbot(
    messages: Vec<Value>,
    groq_key: String,
    model: Option<String>,
) -> Result<Value, String> {
    // Kiểm tra xem có ảnh trong tin nhắn không (dựa trên mảng content)
    let has_image = messages.iter().any(|m| m["content"].is_array());
    
    let selected_model = if has_image {
        "llama-3.2-11b-vision-preview".to_string()
    } else {
        model.unwrap_or_else(|| "llama-3.1-8b-instant".to_string())
    };

    let client = Client::new();
    let payload = json!({
        "model": selected_model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 8000
    });

    // Gọi API Groq
    let res = client
        .post("https://api.groq.com/openai/v1/chat/completions")
        .bearer_auth(&groq_key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Lỗi kết nối Groq: {}", err_text));
    }

    let json_res: Value = res.json().await.map_err(|e| e.to_string())?;
    
    if let Some(content) = json_res["choices"][0]["message"]["content"].as_str() {
        Ok(json!({ "success": true, "content": content }))
    } else {
        Err("AI không trả về nội dung hợp lệ.".to_string())
    }
}