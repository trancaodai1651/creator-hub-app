use serde_json::{json, Value};
use std::ffi::OsString;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::Manager;

const SCRIPT_RELATIVE_PATH: &str = "scripts/omnivoice_adapter.py";
const OMNIVOICE_REPOSITORY: &str = "git+https://github.com/k2-fsa/OmniVoice.git";

fn resolve_project_dir(app: &tauri::AppHandle, requested: Option<String>) -> Result<PathBuf, String> {
    let root = match requested.filter(|value| !value.trim().is_empty()) {
        Some(value) => PathBuf::from(value),
        None => app
            .path()
            .app_data_dir()
            .map_err(|error| error.to_string())?
            .join("creator-hub")
            .join("project-default"),
    };

    fs::create_dir_all(root.join("voices")).map_err(|error| error.to_string())?;
    fs::create_dir_all(root.join("audio")).map_err(|error| error.to_string())?;
    Ok(root)
}

fn adapter_script(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let bundled = app
        .path()
        .resource_dir()
        .map_err(|error| error.to_string())?
        .join(SCRIPT_RELATIVE_PATH);
    if bundled.exists() {
        return Ok(bundled);
    }

    let development = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(SCRIPT_RELATIVE_PATH);
    if development.exists() {
        return Ok(development);
    }

    Err(format!("Không tìm thấy bộ điều hợp OmniVoice tại {}", bundled.display()))
}

fn python_command(script: &Path, args: &[OsString]) -> Command {
    if let Ok(path) = std::env::var("OMNIVOICE_PYTHON") {
        let mut command = Command::new(path);
        command.arg(script).args(args);
        return command;
    }

    if cfg!(target_os = "windows") {
        let mut command = Command::new("py");
        command.arg("-3").arg(script).args(args);
        command
    } else {
        let mut command = Command::new("python3");
        command.arg(script).args(args);
        command
    }
}

fn run_adapter(app: &tauri::AppHandle, action: &str, args: &[OsString]) -> Result<Value, String> {
    let script = adapter_script(app)?;
    let output = python_command(&script, args)
        .arg(action)
        .output()
        .map_err(|error| format!("Không thể chạy Python cho OmniVoice: {error}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
    let parsed = if stdout.is_empty() {
        json!({})
    } else {
        serde_json::from_str::<Value>(&stdout).unwrap_or_else(|_| json!({ "message": stdout }))
    };

    if !output.status.success() || parsed.get("success") == Some(&Value::Bool(false)) {
        let message = parsed
            .get("message")
            .and_then(Value::as_str)
            .or_else(|| parsed.get("error").and_then(Value::as_str))
            .filter(|value| !value.is_empty())
            .map(String::from)
            .unwrap_or_else(|| if stderr.is_empty() { "OmniVoice không thể xử lý yêu cầu.".to_string() } else { stderr });
        return Err(message);
    }

    Ok(parsed)
}

fn arg(value: impl Into<OsString>) -> OsString {
    value.into()
}

fn clean_name(value: &str) -> String {
    let cleaned: String = value
        .chars()
        .map(|character| if character.is_ascii_alphanumeric() || character == '-' || character == '_' { character } else { '_' })
        .collect();
    let trimmed = cleaned.trim_matches('_');
    if trimmed.is_empty() { "voice".to_string() } else { trimmed.to_string() }
}

#[tauri::command]
pub async fn omnivoice_status(app: tauri::AppHandle) -> Result<Value, String> {
    run_adapter(&app, "status", &[])
}

#[tauri::command]
pub async fn install_omnivoice_runtime(app: tauri::AppHandle) -> Result<Value, String> {
    let _ = adapter_script(&app)?;
    let python = std::env::var("OMNIVOICE_PYTHON").unwrap_or_else(|_| "py".to_string());
    let mut command = Command::new(python);
    if cfg!(target_os = "windows") && std::env::var("OMNIVOICE_PYTHON").is_err() {
        command.arg("-3");
    }
    let output = command
        .args(["-m", "pip", "install", "--upgrade", OMNIVOICE_REPOSITORY])
        .output()
        .map_err(|error| format!("Không thể gọi pip: {error}"))?;
    if !output.status.success() {
        let message = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if message.is_empty() { "Cài lõi OmniVoice thất bại.".to_string() } else { message });
    }
    Ok(json!({ "success": true, "message": "Đã cài lõi OmniVoice. Có thể cần tải model ở lần tạo voice đầu tiên." }))
}

#[tauri::command]
pub async fn clone_omnivoice_voice(
    app: tauri::AppHandle,
    name: String,
    reference_audio: String,
    reference_text: String,
    project_dir: Option<String>,
    device: Option<String>,
    model_id: Option<String>,
) -> Result<Value, String> {
    if reference_audio.trim().is_empty() || !Path::new(&reference_audio).exists() {
        return Err("Cần chọn tệp âm thanh mẫu để lưu giọng.".to_string());
    }
    if reference_text.trim().is_empty() {
        return Err("Cần nhập nội dung của tệp âm thanh mẫu để clone chính xác.".to_string());
    }

    let root = resolve_project_dir(&app, project_dir)?;
    let file_stem = format!("{}_{}", clean_name(&name), chrono::Utc::now().timestamp_millis());
    let prompt_path = root.join("voices").join(format!("{file_stem}.pt"));
    let args = vec![
        arg("--ref-audio"), arg(reference_audio),
        arg("--ref-text"), arg(reference_text),
        arg("--prompt-path"), arg(prompt_path.as_os_str()),
        arg("--device"), arg(device.unwrap_or_else(|| "auto".to_string())),
        arg("--model"), arg(model_id.unwrap_or_else(|| "k2-fsa/OmniVoice".to_string())),
    ];
    let mut result = run_adapter(&app, "clone", &args)?;
    result["voiceId"] = Value::String(file_stem);
    result["promptPath"] = Value::String(prompt_path.to_string_lossy().to_string());
    result["projectDir"] = Value::String(root.to_string_lossy().to_string());
    Ok(result)
}

#[tauri::command]
pub async fn generate_omnivoice_voice(
    app: tauri::AppHandle,
    text: String,
    language: Option<String>,
    voice_id: Option<String>,
    prompt_path: Option<String>,
    reference_audio: Option<String>,
    reference_text: Option<String>,
    voice_instruction: Option<String>,
    output_dir: Option<String>,
    project_dir: Option<String>,
    device: Option<String>,
    model_id: Option<String>,
) -> Result<Value, String> {
    if text.trim().is_empty() {
        return Err("Kịch bản chưa có nội dung để tạo giọng.".to_string());
    }

    let root = resolve_project_dir(&app, project_dir)?;
    let output_root = match output_dir.filter(|value| !value.trim().is_empty()) {
        Some(value) => PathBuf::from(value),
        None => root.join("audio"),
    };
    fs::create_dir_all(&output_root).map_err(|error| error.to_string())?;
    let id = voice_id.unwrap_or_else(|| "omnivoice".to_string());
    let output_path = output_root.join(format!("{}_{}.wav", clean_name(&id), chrono::Utc::now().timestamp_millis()));
    let mut args = vec![
        arg("--text"), arg(text),
        arg("--language"), arg(language.unwrap_or_else(|| "auto".to_string())),
        arg("--output"), arg(output_path.as_os_str()),
        arg("--device"), arg(device.unwrap_or_else(|| "auto".to_string())),
        arg("--model"), arg(model_id.unwrap_or_else(|| "k2-fsa/OmniVoice".to_string())),
    ];
    if let Some(value) = prompt_path.filter(|value| !value.trim().is_empty()) {
        args.extend([arg("--prompt-path"), arg(value)]);
    }
    if let Some(value) = reference_audio.filter(|value| !value.trim().is_empty()) {
        args.extend([arg("--ref-audio"), arg(value)]);
    }
    if let Some(value) = reference_text.filter(|value| !value.trim().is_empty()) {
        args.extend([arg("--ref-text"), arg(value)]);
    }
    if let Some(value) = voice_instruction.filter(|value| !value.trim().is_empty()) {
        args.extend([arg("--instruct"), arg(value)]);
    }

    let mut result = run_adapter(&app, "generate", &args)?;
    result["outputPath"] = Value::String(output_path.to_string_lossy().to_string());
    result["projectDir"] = Value::String(root.to_string_lossy().to_string());
    Ok(result)
}
