#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use crate::commands::*;
use lazy_static::lazy_static;
use regex::Regex;
use rvpacker_lib::types::{GameType, ResultExt};
use tauri::{generate_context, generate_handler, App, Builder, Manager};
use translators::GoogleTranslator;

lazy_static! {
    pub static ref GOOGLE_TRANS: GoogleTranslator = GoogleTranslator::default();
}

pub fn get_game_type(game_title: &str) -> Option<GameType> {
    let lowercased: String = game_title.to_lowercase();

    if Regex::new(r"\btermina\b").unwrap_log().is_match(&lowercased) {
        Some(GameType::Termina)
    } else if Regex::new(r"\blisa\b").unwrap_log().is_match(&lowercased) {
        Some(GameType::LisaRPG)
    } else {
        None
    }
}

fn main() {
    Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview))
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            let window: tauri::WebviewWindow = unsafe { app.get_webview_window("main").unwrap_unchecked() };
            let _ = window.maximize();
            let _ = window.set_focus();
        }))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(generate_handler![
            escape_text,
            read,
            compile,
            read_last_line,
            translate_text,
            add_to_scope,
            extract_archive,
            append_to_end
        ])
        .setup(|_app: &mut App| {
            #[cfg(debug_assertions)]
            _app.get_webview_window("main").unwrap().open_devtools();
            Ok(())
        })
        .run(generate_context!())
        .expect("error while running tauri application");
}
