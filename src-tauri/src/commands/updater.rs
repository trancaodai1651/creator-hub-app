use std::fs::File;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;

use reqwest::header::USER_AGENT;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter};

const RELEASES_URL: &str = "https://api.github.com/repos/trancaodai1651/creator-hub-app/releases/latest";

#[derive(Debug, Deserialize)]
struct GithubAsset {
    name: String,
    browser_download_url: String,
}

#[derive(Debug, Deserialize)]
struct GithubRelease {
    tag_name: String,
    body: Option<String>,
    assets: Vec<GithubAsset>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInfo {
    pub has_update: bool,
    pub current_version: String,
    pub latest_version: Option<String>,
    pub release_notes: Option<String>,
    pub download_url: Option<String>,
    pub file_name: Option<String>,
}

fn version_parts(version: &str) -> Option<[u64; 3]> {
    let clean = version.trim().trim_start_matches('v').split('-').next()?;
    let mut parts = clean.split('.').map(|part| part.parse::<u64>().ok());
    Some([parts.next()??, parts.next().unwrap_or(Some(0))?, parts.next().unwrap_or(Some(0))?])
}

fn is_newer_version(latest: &str, current: &str) -> bool {
    match (version_parts(latest), version_parts(current)) {
        (Some(latest), Some(current)) => latest > current,
        _ => false,
    }
}

fn select_asset(assets: &[GithubAsset]) -> Option<&GithubAsset> {
    #[cfg(target_os = "windows")]
    {
        assets
            .iter()
            .find(|asset| asset.name.to_ascii_lowercase().contains("setup") && asset.name.ends_with(".exe"))
            .or_else(|| assets.iter().find(|asset| asset.name.ends_with(".exe")))
    }

    #[cfg(target_os = "macos")]
    {
        assets.iter().find(|asset| asset.name.ends_with(".dmg"))
    }

    #[cfg(target_os = "linux")]
    {
        assets.iter().find(|asset| asset.name.ends_with(".AppImage"))
    }
}

#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<UpdateInfo, String> {
    let current_version = app.package_info().version.to_string();
    let client = reqwest::Client::new();
    let release = client
        .get(RELEASES_URL)
        .header(USER_AGENT, "Creator-Hub-Updater")
        .send()
        .await
        .map_err(|error| format!("GitHub update check failed: {error}"))?
        .error_for_status()
        .map_err(|error| format!("GitHub update check failed: {error}"))?
        .json::<GithubRelease>()
        .await
        .map_err(|error| format!("Invalid GitHub release response: {error}"))?;

    let latest_version = release.tag_name.trim_start_matches('v').to_string();
    if !is_newer_version(&latest_version, &current_version) {
        return Ok(UpdateInfo {
            has_update: false,
            current_version,
            latest_version: Some(latest_version),
            release_notes: None,
            download_url: None,
            file_name: None,
        });
    }

    let asset = select_asset(&release.assets)
        .ok_or_else(|| "No installer asset was published for this platform.".to_string())?;

    Ok(UpdateInfo {
        has_update: true,
        current_version,
        latest_version: Some(latest_version),
        release_notes: release.body,
        download_url: Some(asset.browser_download_url.clone()),
        file_name: Some(asset.name.clone()),
    })
}

fn safe_file_name(file_name: &str) -> Result<String, String> {
    let path = Path::new(file_name);
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Invalid update file name.".to_string())?;
    Ok(name.to_string())
}

fn emit_progress(app: &AppHandle, message: String, percent: u32) {
    let _ = app.emit("update-progress", json!({ "message": message, "percent": percent }));
}

#[tauri::command]
pub async fn trigger_auto_update(
    app: AppHandle,
    download_url: String,
    file_name: String,
    language: Option<String>,
) -> Result<Value, String> {
    let url = reqwest::Url::parse(&download_url).map_err(|error| format!("Invalid update URL: {error}"))?;
    let host = url.host_str().unwrap_or_default();
    if host != "github.com" && !host.ends_with("githubusercontent.com") {
        return Err("Update downloads must come from GitHub.".to_string());
    }

    let file_name = safe_file_name(&file_name)?;
    let target_path: PathBuf = std::env::temp_dir().join(&file_name);
    let is_vi = language.as_deref() != Some("en");
    let client = reqwest::Client::new();
    let mut response = client
        .get(url)
        .header(USER_AGENT, "Creator-Hub-Updater")
        .send()
        .await
        .map_err(|error| format!("Update download failed: {error}"))?
        .error_for_status()
        .map_err(|error| format!("Update download failed: {error}"))?;

    let total_bytes = response.content_length().unwrap_or(0);
    let mut downloaded_bytes = 0u64;
    let mut file = File::create(&target_path).map_err(|error| format!("Cannot create update file: {error}"))?;
    emit_progress(
        &app,
        if is_vi { "Đang tải bản cập nhật..." } else { "Downloading update..." }.to_string(),
        0,
    );

    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|error| format!("Update download failed: {error}"))?
    {
        file.write_all(&chunk).map_err(|error| format!("Cannot write update file: {error}"))?;
        downloaded_bytes += chunk.len() as u64;
        if total_bytes > 0 {
            let percent = ((downloaded_bytes.saturating_mul(100)) / total_bytes).min(100) as u32;
            emit_progress(
                &app,
                if is_vi {
                    format!("Đang tải bản cập nhật: {percent}%")
                } else {
                    format!("Downloading update: {percent}%")
                },
                percent,
            );
        }
    }
    file.flush().map_err(|error| format!("Cannot finalize update file: {error}"))?;

    #[cfg(target_os = "windows")]
    {
        Command::new(&target_path)
            .spawn()
            .map_err(|error| format!("Cannot launch installer: {error}"))?;
        emit_progress(
            &app,
            if is_vi { "Đã tải xong, đang mở trình cài đặt..." } else { "Download complete, launching installer..." }.to_string(),
            100,
        );
        app.exit(0);
        Ok(json!({ "success": true, "fileName": file_name }))
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = Command::new(&target_path);
        Err("Automatic installation is currently supported on Windows only.".to_string())
    }
}
