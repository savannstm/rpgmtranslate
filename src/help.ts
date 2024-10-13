import { applyLocalization, applyTheme, getThemeStyleSheet } from "./extensions/functions";
import { HelpWindowLocalization } from "./extensions/localization";

import { emit, once } from "@tauri-apps/api/event";
import { BaseDirectory } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/plugin-fs";
const { Resource } = BaseDirectory;

document.addEventListener("DOMContentLoaded", async () => {
    let settings!: Settings;

    await once<Settings>("settings", (data) => {
        settings = data.payload;
    });

    await emit("fetch-settings");

    while (!settings) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const { theme, language } = settings;

    applyTheme(
        getThemeStyleSheet() as CSSStyleSheet,
        JSON.parse(await readTextFile("res/themes.json", { baseDir: Resource }))[theme],
    );

    applyLocalization(new HelpWindowLocalization(language));
});
