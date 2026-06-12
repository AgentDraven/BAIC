use std::collections::HashMap;
use std::path::{Path, PathBuf};

const SECRETS_FILE_NAME: &str = "plugin-env-secrets.json";

pub(crate) fn secrets_path(app_data_dir: &Path) -> PathBuf {
    app_data_dir.join(SECRETS_FILE_NAME)
}

fn read_secrets(app_data_dir: &Path) -> HashMap<String, String> {
    let path = secrets_path(app_data_dir);
    let text = match std::fs::read_to_string(&path) {
        Ok(text) => text,
        Err(_) => return HashMap::new(),
    };
    serde_json::from_str(text.trim_start_matches('\u{feff}'))
        .unwrap_or_default()
}

fn write_secrets(app_data_dir: &Path, secrets: &HashMap<String, String>) -> Result<(), String> {
    let path = secrets_path(app_data_dir);
    let json = serde_json::to_string_pretty(secrets)
        .map_err(|e| format!("failed to encode plugin secrets: {e}"))?;
    std::fs::write(&path, json).map_err(|e| format!("failed to write plugin secrets: {e}"))
}

pub(crate) fn get_stored_value(app_data_dir: &Path, name: &str) -> Option<String> {
    let value = read_secrets(app_data_dir).get(name)?.clone();
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}

pub(crate) fn set_stored_value(
    app_data_dir: &Path,
    name: &str,
    value: &str,
) -> Result<(), String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err("value must not be empty".to_string());
    }

    let mut secrets = read_secrets(app_data_dir);
    secrets.insert(name.to_string(), trimmed.to_string());
    write_secrets(app_data_dir, &secrets)
}

pub(crate) fn is_env_value_available(
    app_data_dir: &Path,
    name: &str,
    process_value: Option<String>,
) -> bool {
    if process_value
        .as_deref()
        .map(str::trim)
        .is_some_and(|value| !value.is_empty())
    {
        return true;
    }
    get_stored_value(app_data_dir, name).is_some()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    static TEST_COUNTER: AtomicU64 = AtomicU64::new(0);

    fn temp_app_data_dir() -> PathBuf {
        let id = TEST_COUNTER.fetch_add(1, Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!("tokenmaxxing-plugin-secrets-{id}"));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).expect("create temp app data dir");
        dir
    }

    #[test]
    fn round_trips_stored_secret() {
        let dir = temp_app_data_dir();
        set_stored_value(&dir, "MINIMAX_API_KEY", "mini-test-key")
            .expect("set stored value");
        assert_eq!(
            get_stored_value(&dir, "MINIMAX_API_KEY").as_deref(),
            Some("mini-test-key")
        );
    }

    #[test]
    fn rejects_empty_value() {
        let dir = temp_app_data_dir();
        let err = set_stored_value(&dir, "MINIMAX_API_KEY", "   ").expect_err("empty value");
        assert!(err.contains("empty"));
    }
}