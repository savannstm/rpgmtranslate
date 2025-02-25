import {
    animateProgressText,
    applyLocalization,
    applyTheme,
    CompileSettings,
    getThemeStyleSheet,
    join,
    Settings,
} from "./extensions/functions";
import "./extensions/htmlelement-extensions";
import {
    addToScope,
    appendToEnd,
    compile,
    escapeText,
    extractArchive,
    read,
    readLastLine,
    translateText,
} from "./extensions/invokes";
import { MainWindowLocalization } from "./extensions/localization";
import "./extensions/string-extensions";
import {
    BatchAction,
    EngineType,
    JumpDirection,
    Language,
    MapsProcessingMode,
    ProcessingMode,
    ReplaceMode,
    RowDeleteMode,
    SaveMode,
    SearchMode,
} from "./types/enums";

import { convertFileSrc } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow, WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ask, message, open as openPath } from "@tauri-apps/plugin-dialog";
import {
    copyFile,
    exists,
    mkdir,
    readDir,
    readTextFile,
    readTextFileLines,
    remove as removePath,
    writeTextFile,
} from "@tauri-apps/plugin-fs";
import { attachConsole } from "@tauri-apps/plugin-log";
import { locale as getLocale } from "@tauri-apps/plugin-os";
import { exit, relaunch } from "@tauri-apps/plugin-process";
import { check as checkVersion } from "@tauri-apps/plugin-updater";
// to not import BaseDirectory enum (which even isn't const)
const Resource = 11;
const appWindow = getCurrentWebviewWindow();

import XRegExp from "xregexp";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const tw = (strings: TemplateStringsArray, ...values: string[]): string => String.raw({ raw: strings }, ...values);

document.addEventListener("DOMContentLoaded", async () => {
    async function beforeClose(): Promise<boolean> {
        await awaitSave();

        if (await exitConfirmation()) {
            if (settings.projectPath) {
                await writeTextFile(join(settings.projectPath, programDataDir, logFile), JSON.stringify(replaced));
                await writeTextFile(
                    join(settings.projectPath, programDataDir, bookmarksFile),
                    JSON.stringify(bookmarks),
                );

                const dataDirEntries = await readDir(join(settings.projectPath, programDataDir));

                for (const entry of dataDirEntries) {
                    const name = entry.name;

                    if (name === tempMapsDir) {
                        await removePath(join(settings.projectPath, programDataDir, tempMapsDir), { recursive: true });
                    } else if (entry.isFile && !["compile-settings.json", logFile, bookmarksFile].includes(name)) {
                        await removePath(join(settings.projectPath, programDataDir, name));
                    }
                }
            }

            await writeTextFile(settingsPath, JSON.stringify(settings), { baseDir: Resource });
            return true;
        } else {
            return false;
        }
    }

    async function fetchReplacementLog(): Promise<ReplacementLog> {
        const replaced: ReplacementLog = {};

        if (settings.projectPath && (await exists(join(settings.projectPath, programDataDir, logFile)))) {
            for (const [key, value] of Object.entries(
                JSON.parse(await readTextFile(join(settings.projectPath, programDataDir, logFile))) as ReplacementLog,
            )) {
                replaced[key] = value;
            }
        }

        return replaced;
    }

    function updateProgressMeter(total: number, translated: number) {
        globalProgressMeter.style.width = `${Math.round((translated / total) * 100)}%`;
        globalProgressMeter.innerHTML = `${translated} / ${total}`;
    }

    function addBookmark(bookmark: Bookmark) {
        const bookmarkElement = document.createElement("button");
        bookmarkElement.className = tw`backgroundPrimary backgroundSecondHovered flex h-auto flex-row items-center justify-center p-1`;
        bookmarkElement.innerHTML = `${bookmark.title}<br>${bookmark.description}`;

        bookmarks.push(bookmark);
        bookmarksMenu.appendChild(bookmarkElement);
    }

    async function createSettings(): Promise<Settings | undefined> {
        let language: Language;

        const locale: string = (await getLocale()) ?? "en";
        const mainPart: string = locale.split("-", 1)[0];

        switch (mainPart) {
            case "ru":
            case "uk":
            case "be":
                language = Language.Russian;
                break;
            default:
                language = Language.English;
                break;
        }

        localization = new MainWindowLocalization(language);
        const settings = new Settings(language);

        await addToScope({ path: settingsPath });
        await writeTextFile(settingsPath, JSON.stringify(settings), {
            baseDir: Resource,
        });

        alert(localization.createdSettings);
        return settings;
    }

    function initializeLocalization(language: Language) {
        settings.language = language;
        localization = new MainWindowLocalization(language);
    }

    async function createRegExp(text: string): Promise<RegExp | null> {
        text = text.trim();
        if (!text) {
            return null;
        }

        let regexp = searchRegexButton.classList.contains("backgroundThird") ? text : await escapeText({ text });

        if (searchWholeButton.classList.contains("backgroundThird")) {
            regexp = `(?<!\\p{L})${regexp}(?!\\p{L})`;
        }

        const attr = searchCaseButton.classList.contains("backgroundThird") ? "g" : "gi";

        try {
            return XRegExp(regexp, attr);
        } catch (err) {
            await message(`${localization.invalidRegexp} (${text}), ${err})`);
            return null;
        }
    }

    function appendMatch(metadata: string, result: string, counterpartTextMisc?: string) {
        const [file, type, row] = metadata.split("-");

        const actualRow = file !== currentTab ? Number.parseInt(row) + 1 : Number.parseInt(row);

        const reverseType = type.startsWith("o") ? "translation" : "original";

        const resultContainer = document.createElement("div");
        resultContainer.className = tw`textSecond borderPrimary backgroundSecond my-1 cursor-pointer border-2 p-1 text-base`;

        const rowContainer = file !== currentTab ? null : (tabContent.children[actualRow - 1] as HTMLDivElement);
        const counterpartElement = rowContainer?.children[type.startsWith("o") ? 2 : 1];

        const resultDiv = document.createElement("div");
        resultDiv.innerHTML = result;
        resultContainer.appendChild(resultDiv);

        const originalInfo = document.createElement("div");
        originalInfo.className = tw`textThird text-xs`;

        originalInfo.innerHTML = `${file} - ${type} - ${actualRow}`;
        resultContainer.appendChild(originalInfo);

        const arrow = document.createElement("div");
        arrow.className = tw`textSecond font-material flex items-center justify-center text-xl`;
        arrow.innerHTML = "arrow_downward";
        resultContainer.appendChild(arrow);

        const counterpart = document.createElement("div");

        const counterpartText = counterpartElement
            ? counterpartElement.tagName === "TEXTAREA"
                ? (counterpartElement as HTMLTextAreaElement).value
                : counterpartElement.innerHTML
            : counterpartTextMisc;
        counterpart.innerHTML = counterpartText!.replaceAllMultiple({ "<": "&lt;", ">": "&gt;" });

        resultContainer.appendChild(counterpart);

        const counterpartInfo = document.createElement("div");
        counterpartInfo.className = tw`textThird text-xs`;

        counterpartInfo.innerHTML = `${file} - ${reverseType} - ${actualRow}`;
        resultContainer.appendChild(counterpartInfo);

        resultContainer.setAttribute("data", `${file}-${type}-${actualRow}`);
        searchPanelFound.appendChild(resultContainer);
    }

    async function searchText(text: string, replaceMode: ReplaceMode): Promise<Map<string, number[]> | null> {
        const regexp: RegExp | null = await createRegExp(text);
        if (!regexp) {
            return null;
        }

        function createMatchesContainer(elementText: string, matches: string[]): string {
            const result: string[] = [];
            let lastIndex = 0;

            for (const match of matches) {
                const start = elementText.indexOf(match, lastIndex);
                const end = start + match.length;

                const matchDiv = `${elementText.slice(lastIndex, start)}<span class="backgroundThird">${match}</span>`;
                result.push(matchDiv);

                lastIndex = end;
            }

            const afterDiv = elementText.slice(lastIndex);
            result.push(afterDiv);

            return result.join("");
        }

        const programDataDirPath = join(settings.projectPath, programDataDir);

        const searchMode = Number.parseInt(searchModeSelect.value) as SearchMode;
        const results = replaceMode !== ReplaceMode.Search ? new Map<string, number[]>() : null;
        const objectToWrite = new Map<string, string | [string, string]>();
        let file = 0;

        const openedTab = tabContent.children;

        for (const file of await readDir(programDataDirPath)) {
            if (file.name.startsWith("matches-")) {
                await removePath(join(programDataDirPath, file.name));
            }
        }

        for (const rowContainer of openedTab.length ? openedTab : []) {
            const rowContainerChildren = rowContainer.children;

            if (searchMode !== SearchMode.OnlyOriginal && replaceMode !== ReplaceMode.Put) {
                const translationTextArea = rowContainerChildren[2] as HTMLTextAreaElement;
                const translationText = translationTextArea.value.replaceAllMultiple({
                    "<": "&lt;",
                    ">": "&gt;",
                });

                if (translationText) {
                    const matches = translationText.match(regexp);

                    if (matches) {
                        const matchesContainer = createMatchesContainer(translationText, matches);
                        const [file, row] = translationTextArea.closest(`[id^="${currentTab}"]`)!.id.split("-");
                        replaceMode !== ReplaceMode.Search
                            ? results!.has(file)
                                ? results!.get(file)!.push(Number.parseInt(row))
                                : results!.set(file, [Number.parseInt(row)])
                            : objectToWrite.set(`${file}-translation-${row}`, matchesContainer);
                    }
                }
            }

            if (searchMode !== SearchMode.OnlyTranslation && replaceMode !== ReplaceMode.Replace) {
                const originalTextDiv = rowContainerChildren[1] as HTMLDivElement;
                const originalText = originalTextDiv.innerHTML.replaceAllMultiple({
                    "<": "&lt;",
                    ">": "&gt;",
                });
                const matches = originalText.match(regexp);

                if (matches) {
                    const matchesContainer = createMatchesContainer(originalText, matches);
                    const [file, row] = originalTextDiv.closest(`[id^="${currentTab}"]`)!.id.split("-");

                    replaceMode !== ReplaceMode.Search
                        ? results!.has(file)
                            ? results!.get(file)!.push(Number.parseInt(row))
                            : results!.set(file, [Number.parseInt(row)])
                        : objectToWrite.set(`${file}-original-${row}`, matchesContainer);
                }
            }

            if ((objectToWrite.size + 1) % 1000 === 0) {
                await writeTextFile(
                    join(programDataDirPath, `matches-${file}.json`),
                    JSON.stringify(Object.fromEntries(objectToWrite)),
                );

                objectToWrite.clear();
                file++;
            }
        }

        if (!searchLocationButton.classList.contains("backgroundThird")) {
            const mapsEntries = await readDir(join(programDataDirPath, tempMapsDir));
            const otherEntries = await readDir(join(programDataDirPath, translationDir));

            const itemsIndex = otherEntries.findIndex((entry) => entry.name === "items.txt");
            const beforeOtherEntries = otherEntries.slice(0, itemsIndex + 1);
            const afterOtherEntries = otherEntries.slice(itemsIndex + 1);

            for (const [i, entry] of [
                beforeOtherEntries,
                mapsEntries.sort((a, b) => Number.parseInt(a.name.slice(4, -4)) - Number.parseInt(b.name.slice(4, -4))),
                afterOtherEntries,
            ]
                .flat()
                .entries()) {
                const name = entry.name;

                if (!name.endsWith(".txt") || (currentTab && name.startsWith(currentTab)) || name === "maps.txt") {
                    continue;
                }

                const nameWithoutExtension = name.slice(0, -4);

                for (const [lineNumber, line] of (
                    await readTextFile(
                        join(
                            programDataDirPath,
                            i < beforeOtherEntries.length || i > beforeOtherEntries.length + mapsEntries.length
                                ? translationDir
                                : tempMapsDir,
                            name,
                        ),
                    )
                )
                    .split("\n")
                    .entries()) {
                    if (line.trim() === "") {
                        continue;
                    }

                    const [original, translated] = line.split(LINES_SEPARATOR);

                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (translated === undefined) {
                        console.error(localization.couldNotSplitLine, lineNumber + 1, name);
                        continue;
                    }

                    const translatedNormalized = translated.replaceAll(NEW_LINE, "\n").trim();
                    const originalNormalized = original.replaceAll(NEW_LINE, "\n").trim();

                    if (searchMode !== SearchMode.OnlyOriginal && replaceMode !== ReplaceMode.Put) {
                        if (translatedNormalized) {
                            const matches = translatedNormalized.match(regexp);

                            if (matches) {
                                const matchesContainer = createMatchesContainer(translatedNormalized, matches);

                                replaceMode !== ReplaceMode.Search
                                    ? results!.has(name)
                                        ? results!.get(name)!.push(lineNumber)
                                        : results!.set(name, [lineNumber])
                                    : objectToWrite.set(`${nameWithoutExtension}-translation-${lineNumber}`, [
                                          matchesContainer,
                                          originalNormalized,
                                      ]);
                            }
                        }
                    }

                    if (searchMode !== SearchMode.OnlyTranslation && replaceMode !== ReplaceMode.Replace) {
                        const matches = originalNormalized.match(regexp);

                        if (matches) {
                            const matchesContainer = createMatchesContainer(originalNormalized, matches);

                            replaceMode !== ReplaceMode.Search
                                ? results!.has(name)
                                    ? results!.get(name)!.push(lineNumber)
                                    : results!.set(name, [lineNumber])
                                : objectToWrite.set(`${nameWithoutExtension}-original-${lineNumber}`, [
                                      matchesContainer,
                                      translatedNormalized,
                                  ]);
                        }
                    }

                    if ((objectToWrite.size + 1) % 1000 === 0) {
                        await writeTextFile(
                            join(programDataDirPath, `matches-${file}.json`),
                            JSON.stringify(Object.fromEntries(objectToWrite)),
                        );

                        objectToWrite.clear();
                        file++;
                    }
                }
            }
        }

        searchTotalPages.textContent = file.toString();
        searchCurrentPage.textContent = "0";

        if (objectToWrite.size > 0) {
            await writeTextFile(
                join(programDataDirPath, `matches-${file}.json`),
                JSON.stringify(Object.fromEntries(objectToWrite)),
            );
            file++;
        }

        if (file) {
            const matches = JSON.parse(await readTextFile(join(programDataDirPath, "matches-0.json"))) as object;

            for (const [id, result] of Object.entries(matches) as [string, string | [string, string]]) {
                if (Array.isArray(result)) {
                    appendMatch(id, result[0] as string, result[1] as string);
                } else {
                    appendMatch(id, result);
                }
            }
        } else if (replaceMode === ReplaceMode.Search) {
            searchPanelFound.innerHTML = `<div id="no-results" class="flex justify-center items-center h-full">${localization.noMatches}</div>`;
            showSearchPanel(false);
        }

        return results;
    }

    async function handleReplacedClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const element = target.closest("[reverted]")!;

        if (element.getAttribute("reverted") === "1" || !searchPanelReplaced.contains(element)) {
            return;
        }

        const rowContainerId = element.firstElementChild!.textContent!;
        const [file, rowNumber] = rowContainerId.split("-");

        const row = Number.parseInt(rowNumber) - 1;

        if (event.button === 0) {
            await changeTab(file);

            tabContent.children[row].scrollIntoView({
                block: "center",
                inline: "center",
            });
        } else if (event.button === 2) {
            if (currentTab === file) {
                const textarea = tabContent.children[row].lastElementChild! as HTMLTextAreaElement;
                textarea.value = element.children[1].textContent!;
            } else {
                const filePath = join(
                    settings.projectPath,
                    programDataDir,
                    file.startsWith("maps") ? tempMapsDir : translationDir,
                    file + ".txt",
                );

                const fileLines = (await readTextFile(filePath)).split("\n");

                const neededLineSplit = fileLines[row].split(LINES_SEPARATOR);
                neededLineSplit[1] = element.children[1].textContent!.replaceAll("\n", NEW_LINE);

                fileLines[row] = neededLineSplit.join(LINES_SEPARATOR);

                await writeTextFile(filePath, fileLines.join("\n"));
            }

            element.innerHTML = `<div class="textThird">${element.firstElementChild!.textContent!}</div>${localization.textReverted}<div>${element.children[1].textContent!}</div>`;
            element.setAttribute("reverted", "1");
            delete replaced[rowContainerId];
        }
    }

    function showSearchPanel(hide = true) {
        if (hide) {
            searchPanel.toggleMultiple("translate-x-0", "translate-x-full");
        } else {
            searchPanel.classList.replace("translate-x-full", "translate-x-0");
        }
    }

    async function displaySearchResults(text: string | null = null, hide = true) {
        if (!text) {
            showSearchPanel(hide);
            return;
        }

        text = text.trim();
        if (!text) {
            return;
        }

        await searchText(text, ReplaceMode.Search);

        showSearchPanel(hide);
    }

    async function handleResultClick(event: MouseEvent) {
        const target = event.target as HTMLDivElement;
        const resultElement = target.closest("[data]")!;

        if (!searchPanelFound.contains(resultElement)) {
            return;
        }

        const elementId = resultElement.getAttribute("data")!;
        const [file, type, row] = elementId.split("-");

        if (event.button === 0) {
            await changeTab(file);

            tabContent.children[Number.parseInt(row) - 1].scrollIntoView({
                block: "center",
                inline: "center",
            });
        } else if (event.button === 2) {
            if (type.startsWith("o")) {
                alert(localization.originalTextIrreplacable);
                return;
            } else {
                const replacer = replaceInput.value.trim();

                if (replacer) {
                    const elementToReplace =
                        file !== currentTab ? null : tabContent.children[Number.parseInt(row) - 1].lastElementChild!;

                    let newText: string;

                    if (elementToReplace) {
                        newText = (await replaceText(
                            elementToReplace as HTMLTextAreaElement,
                            replacer,
                            ReplaceMode.Replace,
                        ))!;
                    } else {
                        const regexp = await createRegExp(searchInput.value);
                        if (!regexp) {
                            return;
                        }

                        const normalizedFilename = file + ".txt";
                        const pathToFile = join(
                            settings.projectPath,
                            programDataDir,
                            normalizedFilename.startsWith("maps") ? tempMapsDir : translationDir,
                            normalizedFilename,
                        );

                        const content = (await readTextFile(pathToFile)).split("\n");

                        const lineToReplace = Number.parseInt(row) - 1;
                        const requiredLine = content[lineToReplace];
                        const [original, translated] = requiredLine.split(LINES_SEPARATOR);
                        const translatedNormalized = translated.replaceAll(NEW_LINE, "\n").trim();

                        const translatedReplaced = translatedNormalized
                            .split(regexp)
                            .flatMap((part, i, arr) => [
                                part,
                                i < arr.length - 1 ? `<span class="bg-red-600">${replacer}</span>` : "",
                            ])
                            .join("");

                        const replacedNormalized = translatedReplaced.replaceAll(/<span(.*?)>|<\/span>/g, "");

                        replaced[`${file}-${lineToReplace}`] = { old: translatedNormalized, new: replacedNormalized };

                        content[lineToReplace] =
                            `${original}${LINES_SEPARATOR}${replacedNormalized.replaceAll("\n", NEW_LINE)}`;

                        newText = translatedReplaced;

                        await writeTextFile(pathToFile, content.join("\n"));
                    }

                    if (newText) {
                        saved = false;
                        resultElement.firstElementChild!.children[type.startsWith("o") ? 3 : 0].innerHTML = newText;
                    }
                }
            }
        } else if (event.button === 1) {
            if (type.startsWith("t")) {
                alert(localization.translationTextAreaUnputtable);
                return;
            } else {
                const replacer = replaceInput.value.trim();

                if (replacer) {
                    const elementToReplace =
                        file !== currentTab ? null : tabContent.children[Number.parseInt(row) - 1].lastElementChild!;

                    let newText: string;

                    if (elementToReplace) {
                        newText = (await replaceText(
                            elementToReplace as HTMLTextAreaElement,
                            replacer,
                            ReplaceMode.Put,
                        ))!;
                    } else {
                        const regexp = await createRegExp(searchInput.value);
                        if (!regexp) {
                            return;
                        }

                        const normalizedFilename = file + ".txt";
                        const pathToFile = join(
                            settings.projectPath,
                            programDataDir,
                            normalizedFilename.startsWith("maps") ? tempMapsDir : translationDir,
                            normalizedFilename,
                        );

                        const content = (await readTextFile(pathToFile)).split("\n");

                        const lineToReplace = Number.parseInt(row) - 1;
                        const requiredLine = content[lineToReplace];
                        const original = requiredLine.split(LINES_SEPARATOR)[0];

                        const replacerNormalized = replacer.replaceAll("\n", NEW_LINE);
                        content[lineToReplace] = `${original}${LINES_SEPARATOR}${replacerNormalized}`;

                        newText = `<span class="bg-red-600">${replacer}</span>`;

                        await writeTextFile(pathToFile, content.join("\n"));
                    }

                    if (newText) {
                        saved = false;
                        resultElement.children[3].innerHTML = newText;
                    }
                }
            }
        }
    }

    async function replaceText(
        text: string | HTMLTextAreaElement,
        replacer: string,
        replaceMode: ReplaceMode,
    ): Promise<string | undefined> {
        if (text instanceof HTMLTextAreaElement) {
            const textarea = text;
            const regexp: RegExp | null = await createRegExp(searchInput.value);
            if (!regexp) {
                return;
            }

            let newValue: string;

            if (replaceMode === ReplaceMode.Replace) {
                newValue = textarea.value
                    .split(regexp)
                    .flatMap((part, i, arr) => [
                        part,
                        i < arr.length - 1 ? `<span class="bg-red-600">${replacer}</span>` : "",
                    ])
                    .join("");

                replaced[textarea.id] = { old: textarea.value, new: newValue };
                textarea.value = newValue.replaceAll(/<span(.*?)>|<\/span>/g, "");
                saved = false;
            } else {
                textarea.value = replacer;
                newValue = `<span class="bg-red-600">${replacer}</span>`;
            }

            return newValue;
        } else {
            text = text.trim();
            if (!text) {
                return;
            }

            const results: Map<string, number[]> = (await searchText(text, replaceMode))!;
            if (!results.size) {
                return;
            }

            const regexp: RegExp | null = await createRegExp(text);
            if (!regexp) {
                return;
            }

            for (const [file, rowNumberArray] of results.entries()) {
                if (currentTab?.startsWith(file)) {
                    for (const rowNumber of rowNumberArray) {
                        const textarea = tabContent.children[rowNumber - 1].lastElementChild! as HTMLTextAreaElement;

                        if (replaceMode === ReplaceMode.Replace) {
                            const newValue = textarea.value.replace(regexp, replacer);

                            replaced[textarea.closest(`[id^="${currentTab}"]`)!.id] = {
                                old: textarea.value,
                                new: newValue,
                            };

                            textarea.value = newValue;
                        } else {
                            textarea.value = replacer;
                        }
                    }
                } else {
                    const filePath = join(
                        settings.projectPath,
                        programDataDir,
                        file.startsWith("maps") ? tempMapsDir : translationDir,
                        file,
                    );

                    const fileContent = (await readTextFile(filePath)).split("\n");

                    for (const rowNumber of rowNumberArray) {
                        const [original, translated] = fileContent[rowNumber].split(LINES_SEPARATOR);

                        if (replaceMode === ReplaceMode.Replace) {
                            const translatedNormalized = translated.replaceAll(NEW_LINE, "\n");
                            const newValue = translatedNormalized.replace(regexp, replacer);

                            replaced[`${file.slice(0, -4)}-${rowNumber}`] = {
                                old: translatedNormalized,
                                new: newValue,
                            };

                            fileContent[rowNumber] =
                                `${original}${LINES_SEPARATOR}${newValue.replaceAll("\n", NEW_LINE)}`;
                        } else {
                            fileContent[rowNumber] =
                                `${original}${LINES_SEPARATOR}${replacer.replaceAll("\n", NEW_LINE)}`;
                        }
                    }

                    await writeTextFile(filePath, fileContent.join("\n"));
                }
            }

            saved = false;
        }
    }

    async function save(mode: SaveMode) {
        if (
            !settings.projectPath ||
            (mode === SaveMode.SingleFile && !currentTab) ||
            (mode !== SaveMode.Backup && saving)
        ) {
            return;
        }

        saving = true;

        if (mode !== SaveMode.SingleFile) {
            saveButton.firstElementChild!.classList.add("animate-spin");
        }

        const translationPath = join(settings.projectPath, programDataDir, translationDir);
        const tempMapsPath = join(settings.projectPath, programDataDir, tempMapsDir);
        const outputArray: string[] = [];

        if (mode !== SaveMode.Backup) {
            if (currentTab) {
                for (const rowContainer of tabContent.children) {
                    const originalTextDiv = rowContainer.children[1] as HTMLDivElement;
                    const translationTextArea = rowContainer.children[2] as HTMLTextAreaElement;

                    outputArray.push(
                        originalTextDiv.textContent!.replaceAll("\n", NEW_LINE) +
                            LINES_SEPARATOR +
                            translationTextArea.value.replaceAll("\n", NEW_LINE),
                    );
                }

                if (currentTab === "system") {
                    const originalTitle = currentGameTitle.getAttribute("original-title")!;

                    const output =
                        originalTitle +
                        LINES_SEPARATOR +
                        (originalTitle === currentGameTitle.value ? "" : currentGameTitle.value);

                    outputArray.push(output);
                }

                const filePath = `${currentTab}.txt`;
                const savePath = join(currentTab.startsWith("maps") ? tempMapsPath : translationPath, filePath);

                await writeTextFile(savePath, outputArray.join("\n"));
            }

            outputArray.length = 0;

            if (mode === SaveMode.AllFiles) {
                const entries = (await readDir(tempMapsPath)).sort(
                    (a, b) => Number.parseInt(a.name.slice(4)) - Number.parseInt(b.name.slice(4)),
                );

                for (const entry of entries) {
                    outputArray.push(await readTextFile(join(tempMapsPath, entry.name)));
                }

                await writeTextFile(join(translationPath, "maps.txt"), outputArray.join("\n"));
                saved = true;
            }
        } else {
            const backupFolderEntries = await readDir(join(settings.projectPath, programDataDir, "backups"));

            if (backupFolderEntries.length >= settings.backup.max) {
                await removePath(join(settings.projectPath, programDataDir, "backups", backupFolderEntries[0].name), {
                    recursive: true,
                });
            }

            const date = new Date();
            const formattedDate = [
                date.getFullYear(),
                (date.getMonth() + 1).toString().padStart(2, "0"),
                date.getDate().toString().padStart(2, "0"),
                date.getHours().toString().padStart(2, "0"),
                date.getMinutes().toString().padStart(2, "0"),
                date.getSeconds().toString().padStart(2, "0"),
            ].join("-");

            nextBackupNumber = (nextBackupNumber % settings.backup.max) + 1;

            const backupFolderName = join(
                settings.projectPath,
                programDataDir,
                "backups",
                `${formattedDate}_${nextBackupNumber.toString().padStart(2, "0")}`,
            );

            await mkdir(backupFolderName, { recursive: true });
            await mkdir(join(backupFolderName, tempMapsDir));
            await mkdir(join(backupFolderName, translationDir));

            for (const entry of await readDir(translationPath)) {
                await copyFile(join(translationPath, entry.name), join(backupFolderName, translationDir, entry.name));
            }

            for (const entry of await readDir(tempMapsPath)) {
                await copyFile(join(tempMapsPath, entry.name), join(backupFolderName, tempMapsDir, entry.name));
            }
        }

        setTimeout(() => {
            saveButton.firstElementChild!.classList.remove("animate-spin");
        }, 1000);

        saving = false;
    }

    function backup() {
        backupIsActive = setInterval(async () => {
            if (settings.backup.enabled) {
                if (await appWindow.isFocused()) {
                    await save(SaveMode.Backup);
                }
            } else {
                clearInterval(backupIsActive!);
            }
        }, settings.backup.period * 1000);
    }

    async function changeTab(filename: string | null, newTabIndex?: number) {
        if ((currentTab && currentTab === filename) || changeTimer) {
            return;
        }

        await awaitSave();

        if (currentTab) {
            await save(SaveMode.SingleFile);

            let totalFields = tabContent.children.length;

            if (totalFields) {
                let translatedFields = 0;

                for (const rowContainer of tabContent.children) {
                    const originalTextDiv = rowContainer.children[1] as HTMLDivElement;
                    const translationTextArea = rowContainer.children[2] as HTMLTextAreaElement;

                    if (originalTextDiv.textContent!.startsWith("<!--")) {
                        totalFields--;
                    } else if (translationTextArea.value) {
                        translatedFields++;
                    }
                }

                const percentage = Math.floor((translatedFields / totalFields) * 100);

                const selectedTab = leftPanel.children[currentTabIndex!];
                const progressBar = selectedTab.lastElementChild?.firstElementChild as HTMLSpanElement | null;

                if (progressBar) {
                    translatedLinesArray[currentTabIndex!] = translatedFields;
                    updateProgressMeter(
                        totalAllLines,
                        translatedLinesArray.reduce((a, b) => a + b, 0),
                    );

                    progressBar.style.width = progressBar.innerHTML = `${percentage}%`;

                    if (percentage === 100) {
                        progressBar.classList.replace("backgroundThird", "bg-green-600");
                    } else {
                        progressBar.classList.replace("bg-green-600", "backgroundThird");
                    }
                }

                selectedTab.classList.replace("backgroundThird", "backgroundPrimary");
            }
        }

        tabContent.innerHTML = "";

        if (!filename) {
            currentTab = null;
            currentTabDiv.innerHTML = "";
        } else {
            currentTabDiv.innerHTML = currentTab = filename;

            if (!newTabIndex) {
                let i = 0;

                for (const element of leftPanel.children) {
                    if (element.firstElementChild!.textContent === filename) {
                        newTabIndex = i;
                        break;
                    }

                    i++;
                }
            }

            currentTabIndex = newTabIndex!;

            const selectedTab = leftPanel.children[currentTabIndex];
            selectedTab.classList.replace("backgroundPrimary", "backgroundThird");

            await createTabContent(filename);
        }

        changeTimer = setTimeout(() => {
            changeTimer = null;
        }, 100);

        selectedTextareas.clear();
        replacedTextareas.clear();
    }

    function handleGotoRowInputKeypress(event: KeyboardEvent) {
        if (event.code === "Enter") {
            const targetRow = document.getElementById(`${currentTab!}-${goToRowInput.value}`) as HTMLDivElement | null;

            if (targetRow) {
                targetRow.scrollIntoView({
                    block: "center",
                    inline: "center",
                });
            }

            goToRowInput.value = "";
            goToRowInput.classList.add("hidden");
        } else if (event.code === "Escape") {
            goToRowInput.value = "";
            goToRowInput.classList.add("hidden");
        }
    }

    function areLanguageTagsValid(): boolean {
        const from = fromLanguageInput.value.trim();
        const to = toLanguageInput.value.trim();

        if (!from || !to) {
            alert(localization.translationLanguagesNotSelected);
            return false;
        }

        try {
            new Intl.Locale(from);
            new Intl.Locale(to);
        } catch {
            alert(localization.incorrectLanguageTag);
            return false;
        }

        return true;
    }

    async function handleKeypress(event: KeyboardEvent) {
        if (!settings.projectPath) {
            return;
        }

        if (event.key === "Tab") {
            event.preventDefault();
        }

        if (document.activeElement === document.body) {
            if (event.ctrlKey) {
                switch (event.code) {
                    case "KeyZ":
                        event.preventDefault();

                        for (const [rowNumber, value] of selectedTextareas.entries()) {
                            const rowContainer = tabContent.children[rowNumber] as HTMLDivElement;
                            const translationTextArea = rowContainer.lastElementChild! as HTMLTextAreaElement;
                            translationTextArea.value = value;
                        }

                        for (const [rowNumber, value] of replacedTextareas.entries()) {
                            const rowContainer = tabContent.children[rowNumber] as HTMLDivElement;
                            const translationTextArea = rowContainer.lastElementChild! as HTMLTextAreaElement;
                            translationTextArea.value = value;
                            translationTextArea.calculateHeight();
                        }

                        replacedTextareas.clear();
                        break;
                    case "KeyS":
                        await save(SaveMode.AllFiles);
                        break;
                    case "KeyG":
                        event.preventDefault();

                        if (currentTab && goToRowInput.classList.contains("hidden")) {
                            goToRowInput.classList.remove("hidden");
                            goToRowInput.focus();

                            const lastRow = tabContent.lastElementChild!.id.split("-")[1];

                            goToRowInput.placeholder = `${localization.goToRow} ${lastRow}`;
                        } else if (!goToRowInput.classList.contains("hidden")) {
                            goToRowInput.classList.add("hidden");
                        }
                        break;
                    case "KeyF":
                        event.preventDefault();

                        searchMenu.classList.replace("hidden", "flex");
                        searchInput.focus();
                        break;
                    case "KeyB":
                        bookmarksMenu.toggleMultiple("hidden", "flex");

                        requestAnimationFrame(() => {
                            bookmarksMenu.style.left = `${bookmarksButton.offsetLeft}px`;
                            bookmarksMenu.style.top = `${menuBar.clientHeight + topPanel.clientHeight}px`;
                        });
                        break;
                    case "Equal":
                        if (zoom < 7) {
                            await appWindow.setZoom((zoom += 0.1));
                        }
                        break;
                    case "Minus":
                        if (zoom > 0.1) {
                            await appWindow.setZoom((zoom -= 0.1));
                        }
                        break;
                    case "KeyR":
                        event.preventDefault();
                        break;
                }
            } else if (event.altKey) {
                switch (event.code) {
                    case "KeyC":
                        await startCompilation(false);
                        break;
                    case "F4":
                        await appWindow.close();
                        break;
                }
            } else {
                switch (event.code) {
                    case "Escape":
                        await changeTab(null);
                        break;
                    case "Tab":
                        leftPanel.toggleMultiple("translate-x-0", "-translate-x-full");
                        break;
                    case "KeyR":
                        await displaySearchResults();
                        break;
                    case "ArrowDown":
                        if (currentTabIndex !== null) {
                            const newStateIndex = (currentTabIndex + 1) % leftPanel.children.length;

                            await changeTab(
                                leftPanel.children[newStateIndex].firstElementChild!.textContent,
                                newStateIndex,
                            );
                        }
                        break;
                    case "ArrowUp":
                        if (currentTabIndex !== null) {
                            const newStateIndex =
                                (currentTabIndex - 1 + leftPanel.children.length) % leftPanel.children.length;
                            await changeTab(
                                leftPanel.children[newStateIndex].firstElementChild!.textContent,
                                newStateIndex,
                            );
                        }

                        break;
                }
            }
        } else {
            switch (event.code) {
                case "Escape":
                    if (document.activeElement) {
                        (document.activeElement as HTMLElement).blur();
                    }
                    break;
                case "Enter": {
                    if (event.altKey || event.ctrlKey) {
                        function jump(direction: JumpDirection) {
                            const focusedElement = document.activeElement as HTMLElement;
                            if (!tabContent.contains(focusedElement) && focusedElement.tagName !== "TEXTAREA") {
                                return;
                            }

                            const [file, i] = focusedElement.closest(`[id^="${currentTab}"]`)!.id.split("-");
                            const index = Number.parseInt(i);

                            if (
                                Number.isNaN(index) ||
                                (index === 1 && direction === JumpDirection.Previous) ||
                                (index === tabContent.children.length && direction === JumpDirection.Next)
                            ) {
                                return;
                            }

                            const step = direction === JumpDirection.Next ? 1 : -1;
                            const nextElement = document.getElementById(`${file}-${index + step}`)!
                                .lastElementChild as HTMLTextAreaElement | null;

                            if (!nextElement) {
                                return;
                            }

                            window.scrollBy(0, step * nextElement.clientHeight);
                            focusedElement.blur();
                            nextElement.focus();
                            nextElement.setSelectionRange(0, 0);
                        }

                        if (event.altKey) {
                            jump(JumpDirection.Next);
                        } else if (event.ctrlKey) {
                            jump(JumpDirection.Previous);
                        }
                    }
                    break;
                }
                case "KeyT":
                    if (event.ctrlKey) {
                        const selectedTextArea = event.target as HTMLTextAreaElement;

                        if (!selectedTextArea.value) {
                            if (!selectedTextArea.placeholder) {
                                if (!areLanguageTagsValid()) {
                                    return;
                                }

                                const originalTextDiv = selectedTextArea.parentElement!.children[1] as HTMLDivElement;
                                let originalText = originalTextDiv.textContent!;

                                if (originalText.startsWith("<!-- In-game")) {
                                    originalText = originalText.slice(29, -4);
                                }

                                const translation = await translateText({
                                    text: originalText,
                                    to: toLanguageInput.value.trim(),
                                    from: fromLanguageInput.value.trim(),
                                    replace: false,
                                });

                                selectedTextArea.placeholder = translation;
                            } else {
                                selectedTextArea.value = selectedTextArea.placeholder;
                                selectedTextArea.placeholder = "";
                            }
                        }
                        break;
                    }
            }
        }

        if (event.key === "Shift" && !event.repeat) {
            shiftPressed = true;
        }
    }

    async function handleSearchInputKeypress(event: KeyboardEvent) {
        if (!settings.projectPath) {
            return;
        }

        if (event.code === "Enter") {
            event.preventDefault();

            if (event.ctrlKey) {
                searchInput.value += "\n";
            } else {
                if (searchInput.value.trim()) {
                    searchPanelFound.innerHTML = "";
                    await displaySearchResults(searchInput.value, false);
                }
            }
        } else if (event.altKey) {
            switch (event.code) {
                case "KeyC":
                    searchCaseButton.classList.toggle("backgroundThird");
                    break;
                case "KeyW":
                    searchWholeButton.classList.toggle("backgroundThird");
                    break;
                case "KeyR":
                    searchRegexButton.classList.toggle("backgroundThird");
                    break;
                case "KeyL":
                    searchLocationButton.classList.toggle("backgroundThird");
                    break;
            }
        }

        requestAnimationFrame(() => {
            searchInput.calculateHeight();
        });
    }

    function handleReplaceInputKeypress(event: KeyboardEvent) {
        if (!settings.projectPath) {
            return;
        }

        if (event.code === "Enter") {
            event.preventDefault();

            if (event.ctrlKey) {
                replaceInput.value += "\n";
                replaceInput.calculateHeight();
            }
        } else if (event.code === "Backspace") {
            requestAnimationFrame(() => {
                replaceInput.calculateHeight();
            });
        }
    }

    async function createTabContent(state: string) {
        const programDataDirPath = join(settings.projectPath, programDataDir);
        const translationPath = join(programDataDirPath, translationDir);

        const contentName = state.toString();
        const formattedFilename = `${contentName}.txt`;

        let pathToContent = join(translationPath, formattedFilename);

        if (contentName.startsWith("plugins") && !(await exists(pathToContent))) {
            if (await exists(join(translationPath, "scripts.txt"))) {
                pathToContent = join(translationPath, formattedFilename);
            }
        } else if (contentName.startsWith("maps")) {
            pathToContent = join(programDataDirPath, tempMapsDir, formattedFilename);
        }

        const content = (await readTextFile(pathToContent)).split("\n");

        if (contentName === "system") {
            content.pop();
        }

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < content.length; i++) {
            if (content[i].trim() === "") {
                continue;
            }

            const [originalText, translationText] = content[i].split(LINES_SEPARATOR);
            const added = i + 1;

            const originalTextSplit = originalText.replaceAll(NEW_LINE, "\n");
            const translationTextSplit = translationText.split(NEW_LINE);

            const textParent = document.createElement("div");
            textParent.id = `${contentName}-${added}`;
            textParent.className = tw`flex w-full flex-row justify-around py-[1px]`;

            const originalTextDiv = document.createElement("div");
            originalTextDiv.className = tw`outlinePrimary backgroundPrimary font inline-block w-full cursor-pointer p-1 whitespace-pre-wrap outline outline-2`;

            if (settings.fontUrl) {
                originalTextDiv.style.fontFamily = "font";
            }

            originalTextDiv.textContent = originalTextSplit;

            const translationTextArea = document.createElement("textarea");
            translationTextArea.rows = translationTextSplit.length;
            translationTextArea.className = tw`outlinePrimary outlineFocused backgroundPrimary font w-full resize-none overflow-hidden p-1 outline outline-2 focus:z-10`;
            translationTextArea.spellcheck = false;
            translationTextArea.autocomplete = "off";
            translationTextArea.autocapitalize = "off";
            translationTextArea.autofocus = false;

            if (settings.fontUrl) {
                translationTextArea.style.fontFamily = "font";
            }

            translationTextArea.value = translationTextSplit.join("\n");

            const rowNumberContainer = document.createElement("div");
            rowNumberContainer.className = tw`outlinePrimary backgroundPrimary flex w-52 flex-row p-1 outline outline-2`;

            const rowNumberSpan = document.createElement("span");
            rowNumberSpan.textContent = added.toString();

            const rowNumberButtonDiv = document.createElement("div");
            rowNumberButtonDiv.className = tw`textThird flex w-full items-start justify-end p-0.5 text-xl`;

            const bookmarkButton = document.createElement("button");
            bookmarkButton.className = tw`borderPrimary backgroundPrimaryHovered font-material flex max-h-6 items-center justify-center rounded-md border-2`;
            bookmarkButton.textContent = "bookmark";

            if (bookmarks.some((obj) => obj.title === textParent.id)) {
                bookmarkButton.classList.add("backgroundThird");
            }

            const deleteButton = document.createElement("button");
            deleteButton.className = tw`borderPrimary backgroundPrimaryHovered font-material flex max-h-6 items-center justify-center rounded-md border-2`;
            deleteButton.textContent = "close";

            rowNumberButtonDiv.appendChild(bookmarkButton);
            rowNumberButtonDiv.appendChild(deleteButton);
            rowNumberContainer.appendChild(rowNumberSpan);
            rowNumberContainer.appendChild(rowNumberButtonDiv);

            originalTextDiv.classList.add("text-lg");
            document.body.appendChild(originalTextDiv);

            const { lineHeight, paddingTop } = window.getComputedStyle(originalTextDiv);
            const minHeight =
                (originalTextDiv.innerHTML.count("\n") + 1) * Number.parseInt(lineHeight) +
                Number.parseInt(paddingTop) * 2;

            document.body.removeChild(originalTextDiv);
            originalTextDiv.classList.remove("text-lg");

            textParent.style.minHeight =
                rowNumberContainer.style.minHeight =
                originalTextDiv.style.minHeight =
                translationTextArea.style.minHeight =
                textParent.style.minHeight =
                    `${minHeight}px`;

            textParent.appendChild(rowNumberContainer);
            textParent.appendChild(originalTextDiv);
            textParent.appendChild(translationTextArea);
            fragment.appendChild(textParent);
        }

        tabContent.appendChild(fragment);
    }

    async function startCompilation(silent: boolean) {
        if (!settings.projectPath) {
            return;
        }

        if (typeof projectSettings.compileSettings !== "object") {
            projectSettings.compileSettings = new CompileSettings();
        }

        const compileSettings: CompileSettings = projectSettings.compileSettings;

        if (!compileSettings.initialized || !compileSettings.doNotAskAgain || !silent) {
            const compileWindow = new WebviewWindow("compile", {
                url: "compile.html",
                title: localization.compileWindowTitle,
                center: true,
            });

            const compileUnlisten = await compileWindow.once("compile", async () => {
                await startCompilation(true);
            });
            await compileWindow.once("tauri://destroyed", compileUnlisten);
        } else {
            compileButton.firstElementChild!.classList.add("animate-spin");

            const executionTime = await compile(
                settings.projectPath,
                originalDir,
                compileSettings.customOutputPath.path,
                currentGameTitle.value,
                projectSettings.mapsProcessingMode,
                projectSettings.romanize,
                projectSettings.disableCustomProcessing,
                Object.values(compileSettings.disableProcessing.of),
                settings.engineType!,
            );

            compileButton.firstElementChild!.classList.remove("animate-spin");
            alert(`${localization.compileSuccess} ${executionTime}`);
        }
    }

    function getNewLinePositions(textarea: HTMLTextAreaElement): { left: number; top: number }[] {
        const positions: { left: number; top: number }[] = [];
        const lines = textarea.value.split("\n");

        if (
            !textAreaPropertiesMemo.lineHeight ||
            !textAreaPropertiesMemo.padding ||
            !textAreaPropertiesMemo.fontSize ||
            !textAreaPropertiesMemo.fontFamily
        ) {
            const computedStyles = window.getComputedStyle(textarea);
            textAreaPropertiesMemo.lineHeight = Number.parseInt(computedStyles.lineHeight);
            textAreaPropertiesMemo.padding = Number.parseInt(computedStyles.paddingTop);
            textAreaPropertiesMemo.fontSize = computedStyles.fontSize;
            textAreaPropertiesMemo.fontFamily = computedStyles.fontFamily;
        }

        const { lineHeight, fontSize, fontFamily } = textAreaPropertiesMemo;

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        context.font = `${fontSize} ${fontFamily}`;

        let top = textarea.offsetTop;

        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            const textWidth = context.measureText(`${line} `).width;
            const left = textarea.offsetLeft + textWidth;

            positions.push({ left, top });
            top += lineHeight;
        }

        return positions;
    }

    function trackFocus(focusedElement: Event) {
        for (const ghost of activeGhostLines) {
            ghost.remove();
        }

        const result = getNewLinePositions(focusedElement.target as HTMLTextAreaElement);

        for (const { left, top } of result) {
            const ghostNewLineDiv = document.createElement("div");
            ghostNewLineDiv.className = tw`textThird pointer-events-none absolute z-50 cursor-default select-none`;
            ghostNewLineDiv.style.left = `${left}px`;
            ghostNewLineDiv.style.top = `${top}px`;
            ghostNewLineDiv.textContent = "\\n";

            activeGhostLines.push(ghostNewLineDiv);
            document.body.appendChild(ghostNewLineDiv);
        }
    }

    function calculateHeight(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        const lineBreaks = target.value.split("\n").length;

        if (textAreaPropertiesMemo.lineBreaks === lineBreaks) {
            return;
        }

        textAreaPropertiesMemo.lineBreaks = lineBreaks;

        if (!textAreaPropertiesMemo.lineHeight || !textAreaPropertiesMemo.padding) {
            const computedStyles = window.getComputedStyle(target);
            textAreaPropertiesMemo.lineHeight = Number.parseInt(computedStyles.lineHeight);
            textAreaPropertiesMemo.padding = Number.parseInt(computedStyles.paddingTop);
        }

        const { lineHeight, padding } = textAreaPropertiesMemo;
        const newHeight = lineBreaks * lineHeight + padding * 2;

        const parent = target.parentElement;

        if (parent) {
            for (const child of parent.children) {
                (child as HTMLElement).style.height = `${newHeight}px`;
            }
        }
    }

    function handleFocus(event: FocusEvent) {
        const target = event.target as HTMLTextAreaElement;

        if (tabContent.contains(target) && target.tagName === "TEXTAREA" && target.id !== currentFocusedElement[0]) {
            currentFocusedElement = [target.id, target.value];
        }
    }

    function handleBlur(event: FocusEvent) {
        const target = event.target as HTMLTextAreaElement;
        target.placeholder = "";

        for (const ghost of activeGhostLines) {
            ghost.remove();
        }

        if (target.id == currentFocusedElement[0]) {
            if (saved && currentFocusedElement[1] !== target.value) {
                saved = false;
            }

            currentFocusedElement.length = 0;
        }
    }

    async function loadFont(fontUrl: string) {
        if (fontUrl) {
            await addToScope({ path: fontUrl });

            const font = await new FontFace("font", `url(${convertFileSrc(fontUrl)})`).load();
            document.fonts.add(font);

            textAreaPropertiesMemo.fontFamily = "font";

            for (const element of document.querySelectorAll(".font")) {
                (element as HTMLElement).style.fontFamily = "font";
            }
        } else {
            textAreaPropertiesMemo.fontFamily = document.body.style.fontFamily;

            for (const element of document.querySelectorAll(".font")) {
                (element as HTMLElement).style.fontFamily = "";
            }
        }
    }

    async function exitConfirmation(): Promise<boolean> {
        let askExitUnsaved: boolean;
        if (saved) {
            return true;
        } else {
            askExitUnsaved = await ask(localization.unsavedChanges);
        }

        let askExit: boolean;
        if (!askExitUnsaved) {
            askExit = await ask(localization.exit);
        } else {
            await save(SaveMode.AllFiles);
            return true;
        }

        if (!askExit) {
            return false;
        } else {
            return true;
        }
    }

    async function awaitSave() {
        while (saving) {
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
    }

    function setTheme(newTheme: Theme) {
        if (newTheme.name === currentTheme) {
            return;
        }

        [currentTheme, theme] = [newTheme.name, newTheme];

        applyTheme(sheet, theme);
        settings.theme = newTheme.name;
    }

    async function initializeProject(pathToProject: string) {
        async function ensureProjectIsValid(pathToProject: string): Promise<boolean> {
            if (!pathToProject) {
                return false;
            }

            if (!(await exists(pathToProject))) {
                await message(localization.selectedFolderMissing);
                return false;
            }

            originalDir = "";

            if (await exists(join(pathToProject, "Data"))) {
                originalDir = "Data";
            } else if (await exists(join(pathToProject, "data"))) {
                originalDir = "data";
            }

            if (await exists(join(pathToProject, "original"))) {
                originalDir = "original";
            }

            if (!originalDir) {
                for (const archiveName of ["Game.rgssad", "Game.rgss2a", "Game.rgss3a"]) {
                    const archivePath = join(pathToProject, archiveName);

                    if (await exists(archivePath)) {
                        await extractArchive({
                            inputPath: archivePath,
                            outputPath: pathToProject,
                            processingMode: ProcessingMode.Default,
                        });
                        break;
                    }
                }

                originalDir = "Data";
            }

            gameInfo.classList.replace("hidden", "flex");
            currentTabDiv.classList.replace("hidden", "flex");
            progressMeterContainer.classList.replace("hidden", "flex");

            const projectSettingsPath = join(pathToProject, programDataDir, "project-settings.json");

            if (await exists(projectSettingsPath)) {
                projectSettings = JSON.parse(await readTextFile(projectSettingsPath));

                if (typeof projectSettings.translationLanguages.to === "string") {
                    toLanguageInput.value = projectSettings.translationLanguages.to;
                }

                if (typeof projectSettings.translationLanguages.from === "string") {
                    fromLanguageInput.value = projectSettings.translationLanguages.from;
                }
            } else {
                projectSettings = {} as ProjectSettings;
            }

            if (typeof projectSettings.engineType === "number") {
                settings.engineType = projectSettings.engineType;
            } else {
                if (await exists(join(pathToProject, originalDir, "System.rxdata"))) {
                    settings.engineType = EngineType.XP;
                } else if (await exists(join(pathToProject, originalDir, "System.rvdata"))) {
                    settings.engineType = EngineType.VX;
                } else if (await exists(join(pathToProject, originalDir, "System.rvdata2"))) {
                    settings.engineType = EngineType.VXAce;
                } else if (await exists(join(pathToProject, originalDir, "System.json"))) {
                    settings.engineType = EngineType.New;
                } else {
                    await message(localization.cannotDetermineEngine);
                    await changeTab(null);

                    tabContent.innerHTML = "";
                    currentGameEngine.innerHTML = "";
                    currentGameTitle.value = "";

                    gameInfo.classList.replace("flex", "hidden");
                    currentTabDiv.classList.replace("flex", "hidden");
                    progressMeterContainer.classList.replace("flex", "hidden");

                    return false;
                }

                projectSettings.engineType = settings.engineType;
            }

            switch (settings.engineType) {
                case EngineType.New:
                    currentGameEngine.innerHTML = "MV / MZ";
                    break;
                case EngineType.VXAce:
                    currentGameEngine.innerHTML = "VX Ace";
                    break;
                case EngineType.VX:
                    currentGameEngine.innerHTML = "VX";
                    break;
                case EngineType.XP:
                    currentGameEngine.innerHTML = "XP";
                    break;
            }

            return true;
        }

        await addToScope({ path: pathToProject });

        projectStatus.innerHTML = localization.loadingProject;
        const interval = animateProgressText(projectStatus);

        const projectIsValid = await ensureProjectIsValid(pathToProject);

        if (!projectIsValid) {
            settings.projectPath = "";
            projectStatus.innerHTML = localization.noProjectSelected;
        } else {
            totalAllLines = 0;
            translatedLinesArray.length = 0;

            settings.projectPath = pathToProject;

            // Create program data directory
            const programDataDirPath = join(settings.projectPath, programDataDir);
            await addToScope({ path: programDataDirPath });

            if (!(await exists(programDataDirPath))) {
                await mkdir(programDataDirPath);
            }

            const translationPath = join(settings.projectPath, programDataDir, translationDir);
            const parsed = await exists(translationPath);

            if (!parsed) {
                await mkdir(translationPath, { recursive: true });
                const rootTranslationPath = join(settings.projectPath, translationDir);

                if (await exists(rootTranslationPath)) {
                    for (const entry of await readDir(rootTranslationPath)) {
                        await copyFile(join(rootTranslationPath, entry.name), join(translationPath, entry.name));
                    }

                    const metadataPath = join(rootTranslationPath, ".rvpacker-metadata");
                    if (await exists(metadataPath)) {
                        const metadata = JSON.parse(await readTextFile(metadataPath)) as {
                            mapsProcessingMode: MapsProcessingMode;
                            romanize: boolean;
                            disableCustomProcessing: boolean;
                        };

                        projectSettings.mapsProcessingMode = metadata.mapsProcessingMode;
                        projectSettings.romanize = metadata.romanize;
                        projectSettings.disableCustomProcessing = metadata.disableCustomProcessing;
                    }
                } else {
                    let gameTitle!: string;

                    if (settings.engineType === EngineType.New) {
                        gameTitle = (
                            JSON.parse(await readTextFile(join(settings.projectPath, originalDir, "System.json"))) as {
                                gameTitle: string;
                            }
                        ).gameTitle;
                    } else {
                        for await (const line of await readTextFileLines(join(settings.projectPath, "Game.ini"))) {
                            if (line.toLowerCase().startsWith("title")) {
                                gameTitle = line.split("=")[1].trim();
                            }
                        }
                    }

                    await read(
                        settings.projectPath,
                        originalDir,
                        gameTitle,
                        1,
                        false,
                        false,
                        [false, false, false, false],
                        ProcessingMode.Default,
                        settings.engineType!,
                        false,
                    );

                    await appendToEnd({
                        path: join(settings.projectPath, programDataDir, translationDir, "system.txt"),
                        text: `${gameTitle}${LINES_SEPARATOR}`,
                    });
                }
            }

            const translationFiles = await readDir(join(settings.projectPath, programDataDir, translationDir));
            leftPanel.innerHTML = "";

            let i = 1;

            await mkdir(join(settings.projectPath, programDataDir, tempMapsDir), { recursive: true });

            function createTab(name: string, content: string[], i: number): HTMLButtonElement | undefined {
                if (name === "system") {
                    content = content.slice(0, -1);
                }

                let totalLines = content.length;
                let translatedLines = 0;

                for (const line of content) {
                    if (line.startsWith("<!--")) {
                        totalLines--;
                    } else if (!line.endsWith(LINES_SEPARATOR)) {
                        translatedLines++;
                    }
                }

                if (totalLines === 0) {
                    return;
                }

                const buttonElement = document.createElement("button");
                buttonElement.className = "menu-button backgroundPrimary backgroundPrimaryHovered h-8";
                buttonElement.id = (i - 1).toString();

                const stateSpan = document.createElement("span");
                stateSpan.innerHTML = name;
                stateSpan.className = "pr-1";
                buttonElement.appendChild(stateSpan);

                totalAllLines += totalLines;
                translatedLinesArray.push(translatedLines);

                const percentage = Math.floor((translatedLines / totalLines) * 100);
                const progressBar = document.createElement("div");
                const progressMeter = document.createElement("div");

                progressBar.className = tw`backgroundSecond w-full rounded-xs`;
                progressMeter.className = tw`backgroundThird textPrimary rounded-xs p-0.5 text-center text-xs leading-none font-medium`;
                progressMeter.style.width = progressMeter.textContent = `${percentage}%`;

                if (percentage === 100) {
                    progressMeter.classList.replace("backgroundThird", "bg-green-600");
                }

                progressBar.appendChild(progressMeter);
                buttonElement.appendChild(progressBar);

                const checkboxDiv = document.createElement("div");
                checkboxDiv.className = tw`flex flex-row items-center gap-1 p-0.5`;
                checkboxDiv.id = buttonElement.id;

                const checkbox = document.createElement("span");
                checkbox.className = tw`checkbox borderPrimary max-h-6 min-h-6 max-w-6 min-w-6`;

                const checkboxLabel = document.createElement("span");
                checkboxLabel.className = tw`text-base`;
                checkboxLabel.innerHTML = buttonElement.firstElementChild!.textContent!;

                checkboxDiv.appendChild(checkbox);
                checkboxDiv.appendChild(checkboxLabel);
                batchWindowBody.appendChild(checkboxDiv);

                return buttonElement;
            }

            batchWindowBody.innerHTML = "";

            for (const entry of translationFiles) {
                if (!entry.name.endsWith(".txt")) {
                    continue;
                }

                const name = entry.name;
                const content = await readTextFile(join(settings.projectPath, programDataDir, translationDir, name));

                if (!content) {
                    continue;
                }

                const split = content.split("\n");

                if (name.startsWith("maps")) {
                    if (split.length === 1) {
                        continue;
                    }

                    const result: string[] = [];
                    const mapsNumbers: number[] = [];

                    for (let l = 0; l <= split.length; l++) {
                        const line = split[l];

                        if (l === split.length || line.startsWith("<!-- Map -->")) {
                            if (l !== split.length) {
                                mapsNumbers.push(Number.parseInt(line.slice(line.lastIndexOf("<#>") + 3)));
                            }

                            if (!result.length) {
                                result.push(line);
                                continue;
                            }

                            const mapsNumber = mapsNumbers.shift();
                            const joined = result.join("\n");
                            await writeTextFile(
                                join(settings.projectPath, programDataDir, tempMapsDir, `maps${mapsNumber}.txt`),
                                joined,
                            );

                            const tab = createTab(`maps${mapsNumber}`, result, i);

                            if (tab) {
                                leftPanel.appendChild(tab);
                                i++;
                            }

                            result.length = 0;
                        }

                        result.push(line);
                    }
                } else {
                    const tab = createTab(name.slice(0, -4), split, i);

                    if (tab) {
                        leftPanel.appendChild(tab);
                        i++;
                    }
                }
            }

            updateProgressMeter(
                totalAllLines,
                translatedLinesArray.reduce((a, b) => a + b, 0),
            );

            // Create log file
            const logFilePath = join(settings.projectPath, programDataDir, logFile);
            if (!(await exists(logFilePath))) {
                await writeTextFile(logFilePath, "{}");
            }

            // Initialize themes
            for (const themeName of Object.keys(themes)) {
                const themeButton = document.createElement("button");
                themeButton.id = themeButton.innerHTML = themeName;
                themeButton.className = tw`backgroundPrimary backgroundPrimaryHovered p-2 text-base`;

                themeMenu.insertBefore(themeButton, createThemeMenuButton);
            }

            const backupPath = join(programDataDirPath, "backups");
            if (!(await exists(backupPath))) {
                await mkdir(backupPath);
            }

            nextBackupNumber = (await readDir(backupPath))
                .map((entry) => Number.parseInt(entry.name.slice(0, -2)))
                .sort((a, b) => a - b)[0];

            if (!nextBackupNumber) {
                nextBackupNumber = 0;
            }

            if (settings.backup.enabled) {
                backup();
            }

            if (settings.firstLaunch) {
                new WebviewWindow("help", {
                    url: "https://savannstm.github.io/rpgmtranslate/",
                    title: localization.helpButton,
                    center: true,
                });

                settings.firstLaunch = false;
            }

            const [originalTitle, translatedTitle] = (
                await readLastLine({
                    filePath: join(settings.projectPath, programDataDir, translationDir, "system.txt"),
                })
            ).split(LINES_SEPARATOR);

            currentGameTitle.setAttribute("original-title", originalTitle);

            if (translatedTitle) {
                currentGameTitle.value = translatedTitle;
            } else {
                currentGameTitle.value = originalTitle;
            }

            if (projectStatus.textContent) {
                projectStatus.innerHTML = "";
            }
        }

        clearInterval(interval);
    }

    function wrapText(text: string, length: number): string {
        const lines = text.split("\n");
        const remainder: string[] = [];
        const wrappedLines: string[] = [];

        for (let line of lines) {
            if (remainder.length) {
                line = `${remainder.join(" ")} ${line}`;
                remainder.length = 0;
            }

            if (line.length > length) {
                const words = line.split(" ");

                while (line.length > length && words.length > 0) {
                    remainder.unshift(words.pop()!);
                    line = words.join(" ");
                }

                wrappedLines.push(words.join(" "));
            } else {
                wrappedLines.push(line);
            }
        }

        if (remainder.length) {
            wrappedLines.push(remainder.join(" "));
        }

        return wrappedLines.join("\n");
    }

    async function processFile(filename: string, i: number, wrapLength?: number) {
        await sleep(1000);

        if (filename === currentTab) {
            await changeTab(null);
        }

        await processExternalFile(filename, i, wrapLength);
    }

    async function processExternalFile(filename: string, i: number, wrapLength?: number) {
        const contentPath = join(
            settings.projectPath,
            programDataDir,
            filename.startsWith("maps") ? tempMapsDir : translationDir,
            filename + ".txt",
        );

        const newLines = await Promise.all(
            (await readTextFile(contentPath)).split("\n").map(async (line) => {
                const [original, translation] = line.split(LINES_SEPARATOR);
                if (!original.trim()) {
                    return;
                }

                const translationTrimmed = translation.trim();
                const translationExists = Boolean(translationTrimmed);
                const isComment = original.startsWith("<!--");
                const isMapDisplayNameComment = original.startsWith("<!-- In-game");

                switch (batchWindowAction) {
                    case BatchAction.Trim:
                        return translationExists ? `${original}${LINES_SEPARATOR}${translationTrimmed}` : line;
                    case BatchAction.Translate:
                        if ((isMapDisplayNameComment || !isComment) && !translationExists) {
                            return await translateLine(original, isMapDisplayNameComment);
                        }

                        return line;
                    case BatchAction.Wrap:
                        if (!isComment && translationExists && wrapLength) {
                            const wrapped = wrapText(translation.replaceAll(NEW_LINE, "\n"), wrapLength);
                            return `${original}${LINES_SEPARATOR}${wrapped.replaceAll("\n", NEW_LINE)}`;
                        }

                        return line;
                }
            }),
        );

        if (batchWindowAction === BatchAction.Translate) {
            updateTranslationProgress(i, newLines.length);
        }

        await writeTextFile(contentPath, newLines.join("\n"));

        batchWindowBody.children[i].firstElementChild!.classList.add("text-green-500");
        await sleep(500);
    }

    async function translateLine(text: string, isMapComment: boolean): Promise<string> {
        const textToTranslate = isMapComment ? text.slice(29, -4) : text;

        const translated = await translateText({
            text: textToTranslate,
            from: fromLanguageInput.value.trim(),
            to: toLanguageInput.value.trim(),
            replace: true,
        });
        return `${text}${LINES_SEPARATOR}${translated}`;
    }

    function updateTranslationProgress(index: number, linesCount: number) {
        const progressBar = leftPanel.children[index].lastElementChild?.firstElementChild as HTMLElement | null;

        if (progressBar) {
            updateProgressMeter(
                totalAllLines,
                translatedLinesArray.reduce((a, b) => a + b, 0),
            );

            progressBar.style.width = progressBar.textContent = "100%";
        }

        translatedLinesArray[index] = linesCount;
    }

    function initializeBatchWindow(rootElement: HTMLElement) {
        const { x, y } = rootElement.getBoundingClientRect();
        batchWindow.style.left = `${x + rootElement.clientWidth}px`;
        batchWindow.style.top = `${y}px`;

        batchWindowFooter.firstElementChild!.classList.toggle("hidden", batchWindowAction !== BatchAction.Wrap);
        batchWindow.classList.replace("hidden", "flex");
    }

    // #region Settings and localization initialization, check for updates
    await attachConsole();

    const settingsPath = "res/settings.json";

    let localization!: MainWindowLocalization;

    let settings: Settings = (await exists(settingsPath, { baseDir: Resource }))
        ? (JSON.parse(await readTextFile(settingsPath, { baseDir: Resource })) as Settings)
        : (await createSettings())!;

    const themes = JSON.parse(await readTextFile("res/themes.json", { baseDir: Resource })) as ThemeObject;
    let theme: Theme = themes[settings.theme];

    initializeLocalization(settings.language);

    if (settings.checkForUpdates || typeof settings.checkForUpdates !== "boolean") {
        try {
            const update = await checkVersion();

            if (update) {
                const installUpdate = await ask(
                    `${localization.newVersionFound}: ${update.version}\n${localization.currentVersion}: ${update.currentVersion}\nRelease notes: https://github.com/savannstm/rpgmtranslate/releases/latest`,
                    { title: localization.updateAvailable, okLabel: localization.installUpdate },
                );

                if (installUpdate) {
                    let downloaded = 0;
                    let contentLength: number | undefined = 0;

                    await update.downloadAndInstall((event) => {
                        switch (event.event) {
                            case "Started":
                                contentLength = event.data.contentLength;
                                console.log(`Started downloading ${event.data.contentLength} bytes`);
                                break;
                            case "Progress":
                                downloaded += event.data.chunkLength;
                                console.log(`Downloaded ${downloaded} from ${contentLength}`);
                                break;
                            case "Finished":
                                console.log("Download finished");
                                break;
                        }
                    });

                    await relaunch();
                }
            } else {
                console.log(localization.upToDate);
            }
        } catch (e) {
            console.error(e);
        }
    }
    // #endregion

    // #region Program initialization
    applyLocalization(localization, theme);

    // #region Static constants
    const NEW_LINE = "\\#";
    const LINES_SEPARATOR = "<#>";
    const sheet = getThemeStyleSheet()!;

    const programDataDir = ".rpgmtranslate";

    const translationDir = "translation";
    const tempMapsDir = "temp-maps";

    const logFile = "replacement-log.json";
    const bookmarksFile = "bookmarks.json";

    const tabContent = document.getElementById("tab-content") as HTMLDivElement;
    const searchInput = document.getElementById("search-input") as HTMLTextAreaElement;
    const replaceInput = document.getElementById("replace-input") as HTMLTextAreaElement;
    const leftPanel = document.getElementById("left-panel") as HTMLDivElement;
    const searchPanel = document.getElementById("search-results") as HTMLDivElement;
    const searchPanelFound = document.getElementById("search-content") as HTMLDivElement;
    const searchPanelReplaced = document.getElementById("replace-content") as HTMLDivElement;
    const searchCurrentPage = document.getElementById("search-current-page") as HTMLSpanElement;
    const searchTotalPages = document.getElementById("search-total-pages") as HTMLSpanElement;
    const topPanel = document.getElementById("top-panel") as HTMLDivElement;
    const topPanelButtonsDiv = topPanel.firstElementChild! as HTMLDivElement;
    const saveButton: HTMLButtonElement = topPanelButtonsDiv.querySelector("#save-button")!;
    const compileButton: HTMLButtonElement = topPanelButtonsDiv.querySelector("#compile-button")!;
    const themeButton: HTMLButtonElement = topPanelButtonsDiv.querySelector("#theme-button")!;
    const themeMenu = document.getElementById("theme-menu")! as HTMLDivElement;
    const toolsButton: HTMLButtonElement = topPanelButtonsDiv.querySelector("#tools-button")!;
    const toolsMenu = document.getElementById("tools-menu")! as HTMLDivElement;
    const searchCaseButton = document.getElementById("case-button") as HTMLButtonElement;
    const searchWholeButton = document.getElementById("whole-button") as HTMLButtonElement;
    const searchRegexButton = document.getElementById("regex-button") as HTMLButtonElement;
    const searchModeSelect = document.getElementById("search-mode") as HTMLSelectElement;
    const searchLocationButton = document.getElementById("location-button") as HTMLButtonElement;
    const goToRowInput = document.getElementById("goto-row-input") as HTMLInputElement;
    const menuBar = document.getElementById("menu-bar") as HTMLDivElement;
    const fileMenuButton = document.getElementById("file-menu-button") as HTMLButtonElement;
    const helpMenuButton = document.getElementById("help-menu-button") as HTMLButtonElement;
    const languageMenuButton = document.getElementById("language-menu-button") as HTMLButtonElement;
    const fileMenu = document.getElementById("file-menu") as HTMLDivElement;
    const helpMenu = document.getElementById("help-menu") as HTMLDivElement;
    const languageMenu = document.getElementById("language-menu") as HTMLDivElement;
    const currentTabDiv = document.getElementById("current-tab") as HTMLDivElement;
    const createThemeMenuButton = document.getElementById("create-theme-menu-button") as HTMLButtonElement;
    const searchMenu = document.getElementById("search-menu") as HTMLDivElement;
    const searchButton = document.getElementById("search-button") as HTMLButtonElement;
    const bookmarksButton = document.getElementById("bookmarks-button") as HTMLButtonElement;
    const bookmarksMenu = document.getElementById("bookmarks-menu") as HTMLDivElement;
    const projectStatus = document.getElementById("project-status") as HTMLDivElement;
    const progressMeterContainer = document.getElementById("progress-meter-container") as HTMLDivElement;
    const globalProgressMeter = document.getElementById("progress-meter") as HTMLDivElement;
    const gameInfo = document.getElementById("game-info") as HTMLDivElement;
    const currentGameEngine = document.getElementById("game-engine") as HTMLDivElement;
    const currentGameTitle = document.getElementById("game-title") as HTMLInputElement;
    const batchWindow = document.getElementById("batch-window") as HTMLDivElement;
    const batchWindowBody = batchWindow.children[1];
    const batchWindowFooter = batchWindow.children[2];
    const themeWindow = document.getElementById("theme-window") as HTMLDivElement;
    const themeWindowBody = themeWindow.children[1];
    const createThemeButton: HTMLButtonElement = themeWindow.querySelector("#create-theme")!;
    const closeButton: HTMLButtonElement = themeWindow.querySelector("#close-button")!;
    const searchSwitch = document.getElementById("switch-search-content") as HTMLDivElement;
    const fromLanguageInput = document.getElementById("from-language-input") as HTMLInputElement;
    const toLanguageInput = document.getElementById("to-language-input") as HTMLInputElement;
    // #endregion

    let backupIsActive: number | null = null;
    let originalDir = "";

    // Set theme
    let currentTheme: string;

    setTheme(theme);

    // Initialize the project
    let currentTab: string | null = null;
    let currentTabIndex: number | null = null;
    let batchWindowAction!: BatchAction;
    let nextBackupNumber: number;

    let projectSettings!: ProjectSettings;

    const batchSelectWindowChecked: HTMLElement[] = [];

    let totalAllLines = 0;
    const translatedLinesArray: number[] = [];

    await initializeProject(settings.projectPath);

    // Load the font
    const textAreaPropertiesMemo: TextAreaPropertiesMemo = {};
    await loadFont(settings.fontUrl);

    const replaced: ReplacementLog = await fetchReplacementLog();

    const activeGhostLines: HTMLDivElement[] = [];

    const selectedTextareas = new Map<number, string>();
    const replacedTextareas = new Map<number, string>();

    const bookmarks: Bookmark[] = [];

    {
        const bookmarksFilePath = join(settings.projectPath, programDataDir, bookmarksFile);
        await addToScope({ path: bookmarksFilePath });

        if (await exists(bookmarksFilePath)) {
            const bookmarkEntries = JSON.parse(await readTextFile(bookmarksFilePath)) as Bookmark[];

            for (const bookmark of bookmarkEntries) {
                addBookmark(bookmark);
            }
        }
    }

    let saved = true;
    let saving = false;
    let currentFocusedElement: [string, string] | [] = [];

    let changeTimer: null | number = null;
    let shiftPressed = false;

    let multipleTextAreasSelected = false;

    let zoom = 1;

    await appWindow.setZoom(zoom);
    // #endregion

    // #region Event listeners
    leftPanel.addEventListener("click", async (event) => {
        let target: HTMLElement | null = event.target as HTMLElement;
        const leftPanelChildren = Array.from(leftPanel.children);

        if (leftPanel.contains(target)) {
            while (target && !leftPanelChildren.includes(target)) {
                target = target.parentElement;
            }

            if (target) {
                await changeTab(target.firstElementChild!.textContent, Number.parseInt(target.id));
            }
        }
    });

    topPanelButtonsDiv.addEventListener("contextmenu", (event) => {
        event.preventDefault();
    });

    topPanelButtonsDiv.addEventListener("mousedown", async (event) => {
        const target = (event.target as HTMLElement).closest(`[id$="button"]`);

        if (
            target === null ||
            (!settings.projectPath && target.id !== "open-directory-button") ||
            !topPanelButtonsDiv.contains(target)
        ) {
            return;
        }

        switch (target.id) {
            case "menu-button":
                leftPanel.toggleMultiple("translate-x-0", "-translate-x-full");
                break;
            case saveButton.id:
                await save(SaveMode.AllFiles);
                break;
            case "compile-button":
                await startCompilation(event.button !== 2);
                break;
            case "open-directory-button": {
                const directory = await openPath({ directory: true, multiple: false });

                if (directory) {
                    if (directory === settings.projectPath) {
                        await message(localization.directoryAlreadyOpened);
                        return;
                    }

                    await changeTab(null);
                    currentGameTitle.innerHTML = "";

                    await initializeProject(directory);
                }
                break;
            }
            case "settings-button": {
                const settingsWindow = new WebviewWindow("settings", {
                    url: "settings.html",
                    title: localization.settingsButtonTitle,
                    center: true,
                    resizable: false,
                });

                const settingsUnlisten = await settingsWindow.once<Settings>("get-settings", async (data) => {
                    settings = data.payload;

                    if (settings.backup.enabled && !backupIsActive) {
                        backup();
                    }

                    await loadFont(settings.fontUrl);
                });

                await settingsWindow.once("tauri://destroyed", settingsUnlisten);
                break;
            }
            case themeButton.id:
                themeMenu.toggleMultiple("hidden", "flex");

                requestAnimationFrame(() => {
                    themeMenu.style.left = `${themeButton.offsetLeft}px`;
                    themeMenu.style.top = `${menuBar.clientHeight + topPanel.clientHeight}px`;
                });
                break;
            case bookmarksButton.id:
                bookmarksMenu.toggleMultiple("hidden", "flex");

                requestAnimationFrame(() => {
                    bookmarksMenu.style.left = `${bookmarksButton.offsetLeft}px`;
                    bookmarksMenu.style.top = `${menuBar.clientHeight + topPanel.clientHeight}px`;
                });
                break;
            case "read-button": {
                const readWindow = new WebviewWindow("read", {
                    title: localization.readWindowTitle,
                    url: "read.html",
                    center: true,
                });

                const unlistenRestart = await readWindow.once("restart", async () => {
                    await writeTextFile(join(settings.projectPath, programDataDir, logFile), JSON.stringify(replaced));
                    await writeTextFile(
                        join(settings.projectPath, programDataDir, bookmarksFile),
                        JSON.stringify(bookmarks),
                    );

                    const dataDirEntries = await readDir(join(settings.projectPath, programDataDir));

                    for (const entry of dataDirEntries) {
                        const name = entry.name;

                        if (name === tempMapsDir) {
                            await removePath(join(settings.projectPath, programDataDir, tempMapsDir), {
                                recursive: true,
                            });
                        } else if (entry.isFile && !["compile-settings.json", logFile, bookmarksFile].includes(name)) {
                            await removePath(join(settings.projectPath, programDataDir, name));
                        }
                    }

                    await writeTextFile(settingsPath, JSON.stringify(settings), { baseDir: Resource });
                    location.reload();
                });

                await readWindow.once("tauri://destroyed", () => {
                    unlistenRestart();
                });
                break;
            }
            case "search-button":
                if (searchMenu.classList.contains("hidden")) {
                    searchMenu.classList.remove("hidden");
                    requestAnimationFrame(() => {
                        searchMenu.style.left = `${searchButton.offsetLeft}px`;
                        searchMenu.style.top = `${menuBar.clientHeight + topPanel.clientHeight}px`;
                    });
                } else {
                    searchMenu.classList.add("hidden");
                }
                break;
            case toolsButton.id:
                toolsMenu.toggleMultiple("hidden", "flex");

                requestAnimationFrame(() => {
                    toolsMenu.style.left = `${toolsButton.offsetLeft}px`;
                    toolsMenu.style.top = `${menuBar.clientHeight + topPanel.clientHeight}px`;
                });
                break;
            case "purge-button": {
                new WebviewWindow("purge", {
                    title: localization.purgeWindowTitle,
                    url: "purge.html",
                    center: true,
                });
                break;
            }
        }
    });

    searchPanelReplaced.addEventListener("mousedown", handleReplacedClick);

    searchPanel.addEventListener("click", async (event) => {
        const target = event.target as HTMLElement;

        switch (target.id) {
            case searchSwitch.id: {
                searchPanelFound.classList.toggle("hidden");
                searchPanelReplaced.classList.toggle("hidden");

                if (target.innerHTML.trim() === "search") {
                    target.innerHTML = "menu_book";

                    for (const [key, value] of Object.entries(replaced)) {
                        const replacedContainer = document.createElement("div");
                        replacedContainer.className = tw`textSecond backgroundSecond borderPrimary my-1 cursor-pointer border-2 p-1 text-base`;
                        replacedContainer.setAttribute("reverted", "0");

                        replacedContainer.innerHTML = `<div class="textThird">${key}</div><div>${value.old}</div><div class="flex justify-center items-center text-xl textPrimary font-material">arrow_downward</div><div>${value.new}</div>`;

                        searchPanelReplaced.appendChild(replacedContainer);
                    }
                } else {
                    target.innerHTML = "search";
                    searchPanelReplaced.innerHTML = "";
                }
                break;
            }
            case "previous-page-button": {
                const page = Number.parseInt(searchCurrentPage.textContent!);

                if (page > 0) {
                    searchCurrentPage.textContent = (page - 1).toString();
                    searchPanelFound.innerHTML = "";

                    const matches = JSON.parse(
                        await readTextFile(
                            join(settings.projectPath, programDataDir, `matches-${searchCurrentPage.textContent}.json`),
                        ),
                    ) as object;

                    for (const [id, result] of Object.entries(matches) as [string, string | [string, string]]) {
                        if (Array.isArray(result)) {
                            appendMatch(id, result[0] as string, result[1] as string);
                        } else {
                            appendMatch(id, result);
                        }
                    }
                }
                break;
            }
            case "next-page-button": {
                const page = Number.parseInt(searchCurrentPage.textContent!);

                if (page < Number.parseInt(searchTotalPages.textContent!)) {
                    searchCurrentPage.textContent = (page + 1).toString();
                    searchPanelFound.innerHTML = "";

                    const matches = JSON.parse(
                        await readTextFile(
                            join(settings.projectPath, programDataDir, `matches-${searchCurrentPage.textContent}.json`),
                        ),
                    ) as object;

                    for (const [id, result] of Object.entries(matches) as [string, string | [string, string]]) {
                        if (Array.isArray(result)) {
                            appendMatch(id, result[0] as string, result[1] as string);
                        } else {
                            appendMatch(id, result);
                        }
                    }
                }
                break;
            }
        }
    });

    document.body.addEventListener("keydown", handleKeypress);
    document.body.addEventListener("keyup", (event) => {
        if (event.key === "Shift") {
            shiftPressed = false;
        }
    });

    searchMenu.addEventListener("click", async (event) => {
        if (!settings.projectPath) {
            return;
        }

        const target = event.target as HTMLElement;

        switch (target.id) {
            case "search-button":
                if (searchInput.value.trim()) {
                    searchPanelFound.innerHTML = "";
                    await displaySearchResults(searchInput.value, false);
                }
                break;
            case "replace-button": {
                const replacer = replaceInput.value.trim();
                if (searchInput.value.trim() && replacer) {
                    await replaceText(searchInput.value, replacer, ReplaceMode.Replace);
                }
                break;
            }
            case "put-button": {
                const replacer = replaceInput.value.trim();
                if (searchInput.value.trim() && replacer) {
                    await replaceText(searchInput.value, replacer, ReplaceMode.Put);
                }
                break;
            }
            case "case-button":
                searchCaseButton.classList.toggle("backgroundThird");
                break;
            case "whole-button":
                searchWholeButton.classList.toggle("backgroundThird");
                break;
            case "regex-button":
                searchRegexButton.classList.toggle("backgroundThird");
                break;
            case "location-button":
                searchLocationButton.classList.toggle("backgroundThird");
                break;
        }
    });

    tabContent.addEventListener("focus", handleFocus, true);
    tabContent.addEventListener("blur", handleBlur, true);
    tabContent.addEventListener("click", async (event) => {
        const target = event.target as HTMLElement;

        if (target.tagName === "DIV") {
            const rowContainer = target.parentElement;

            if (rowContainer) {
                if (/\d$/.test(rowContainer.id)) {
                    await writeText(target.textContent!);
                }
            }
        }
    });

    tabContent.addEventListener("mousedown", async (event) => {
        const target = event.target as HTMLElement;

        if (target.textContent === "bookmark") {
            const rowContainerId = target.closest(`[id^="${currentTab}"]`)!.id;
            const bookmarkIndex = bookmarks.findIndex((obj) => obj.title === rowContainerId);

            if (bookmarkIndex !== -1) {
                bookmarks.splice(bookmarkIndex, 1);

                for (const bookmark of bookmarksMenu.children) {
                    if (bookmark.textContent?.startsWith(rowContainerId)) {
                        bookmark.remove();
                    }
                }

                target.classList.remove("backgroundThird");
            } else {
                const bookmarkDescriptionInput = document.createElement("input");
                bookmarkDescriptionInput.className =
                    "absolute w-auto h-7 p-1 z-50 text-base input textSecond backgroundSecond";
                bookmarkDescriptionInput.style.left = `${target.offsetLeft + target.clientWidth}px`;
                bookmarkDescriptionInput.style.top = `${target.offsetTop}px`;
                document.body.appendChild(bookmarkDescriptionInput);

                requestAnimationFrame(() => {
                    bookmarkDescriptionInput.focus();
                });

                bookmarkDescriptionInput.onkeydown = (event) => {
                    if (event.key === "Enter") {
                        const description = bookmarkDescriptionInput.value;
                        bookmarkDescriptionInput.remove();

                        addBookmark({ title: rowContainerId, description });
                        target.classList.add("backgroundThird");
                    } else if (event.key === "Escape") {
                        requestAnimationFrame(() => {
                            bookmarkDescriptionInput.remove();
                        });
                    }
                };
            }
        } else if (target.textContent === "close") {
            if (typeof settings.rowDeleteMode !== "number" || settings.rowDeleteMode === RowDeleteMode.Disabled) {
                alert(localization.deletingDisabled);
                return;
            } else if (settings.rowDeleteMode === RowDeleteMode.Confirmation) {
                const confirmation = await ask(localization.deletingConfirmation);

                if (!confirmation) {
                    return;
                }
            }

            const rowContainer = target.closest(`[id^="${currentTab}"]`)!;
            const position = Number.parseInt(rowContainer.firstElementChild!.textContent!);

            const children = tabContent.children as HTMLCollectionOf<HTMLDivElement>;

            rowContainer.remove();

            for (let i = position - 1; i < children.length; i++) {
                const element = children[i];

                const rowNumberElement = element.firstElementChild!.firstElementChild!;
                const newRowNumber = (i + 1).toString();

                rowNumberElement.textContent = newRowNumber;
                element.id = element.id.replace(/\d+$/, newRowNumber);
            }

            totalAllLines -= 1;
            rowContainer.remove();
        } else if (event.button === 0) {
            if (shiftPressed) {
                if (tabContent.contains(document.activeElement) && document.activeElement?.tagName === "TEXTAREA") {
                    event.preventDefault();

                    selectedTextareas.clear();
                    multipleTextAreasSelected = true;

                    const clickedRowContainerNumber = Number.parseInt(
                        (event.target as HTMLElement).closest(`[id^="${currentTab}"]`)!.id.split("-")[1],
                    );
                    const selectedRowContainerNumber = Number.parseInt(
                        document.activeElement.closest(`[id^="${currentTab}"]`)!.id.split("-")[1],
                    );

                    const rowsRange = clickedRowContainerNumber - selectedRowContainerNumber;
                    const rowsToSelect = Math.abs(rowsRange);

                    if (rowsRange > 0) {
                        for (let i = 0; i <= rowsToSelect; i++) {
                            const rowNumber = selectedRowContainerNumber + i - 1;

                            const nextRowContainer = tabContent.children[rowNumber] as HTMLDivElement;
                            const nextTextArea = nextRowContainer.lastElementChild! as HTMLTextAreaElement;

                            nextTextArea.style.outlineColor = theme.outlineFocused;
                            selectedTextareas.set(rowNumber, nextTextArea.value);
                        }
                    } else {
                        for (let i = rowsToSelect; i >= 0; i--) {
                            const rowNumber = selectedRowContainerNumber - i - 1;

                            const nextRowContainer = tabContent.children[rowNumber] as HTMLDivElement;
                            const nextTextArea = nextRowContainer.lastElementChild! as HTMLTextAreaElement;

                            nextTextArea.style.outlineColor = theme.outlineFocused;
                            selectedTextareas.set(rowNumber, nextTextArea.value);
                        }
                    }
                }
            } else {
                multipleTextAreasSelected = false;

                for (const rowNumber of selectedTextareas.keys()) {
                    const rowContainer = tabContent.children[rowNumber] as HTMLDivElement;
                    (rowContainer.lastElementChild! as HTMLTextAreaElement).style.outlineColor = "";
                }
            }
        }
    });

    tabContent.addEventListener("copy", async (event) => {
        if (multipleTextAreasSelected && document.activeElement?.tagName === "TEXTAREA") {
            event.preventDefault();
            await writeText(Array.from(selectedTextareas.values()).join("\0"));
        }
    });

    tabContent.addEventListener("cut", async (event) => {
        if (multipleTextAreasSelected && document.activeElement?.tagName === "TEXTAREA") {
            event.preventDefault();
            await writeText(Array.from(selectedTextareas.values()).join("\0"));

            for (const rowNumber of selectedTextareas.keys()) {
                const rowContainer = tabContent.children[rowNumber] as HTMLDivElement;
                (rowContainer.lastElementChild! as HTMLTextAreaElement).value = "";
            }

            saved = false;
        }
    });

    tabContent.addEventListener("paste", async (event) => {
        const normalized = (await readText()).replaceAll(NEW_LINE, "\n");

        await writeText(normalized);

        await sleep(10);

        if (document.activeElement?.tagName === "TEXTAREA" && normalized.includes("\0")) {
            event.preventDefault();
            const clipboardTextSplit = normalized.split("\0");
            const textRows = clipboardTextSplit.length;

            if (textRows === 0) {
                return;
            } else {
                const rowContainer = document.activeElement.closest(`[id^="${currentTab}"]`)!;
                const rowContainerNumber = Number.parseInt(rowContainer.id.split("-")[1]);

                for (let i = 0; i < textRows; i++) {
                    const rowNumber = rowContainerNumber + i - 1;
                    const rowContainer = tabContent.children[rowNumber] as HTMLDivElement | null;

                    if (rowContainer) {
                        const textAreaToReplace = rowContainer.lastElementChild! as HTMLTextAreaElement;

                        replacedTextareas.set(rowNumber, textAreaToReplace.value.replaceAll(normalized, ""));
                        textAreaToReplace.value = clipboardTextSplit[i];
                        textAreaToReplace.calculateHeight();
                    }
                }

                saved = false;
            }
        }
    });

    tabContent.addEventListener("keyup", (event) => {
        const target = event.target as HTMLTextAreaElement;

        if (target.tagName === "TEXTAREA") {
            target.calculateHeight();
        }
    });

    tabContent.addEventListener("input", (event) => {
        const target = event.target as HTMLTextAreaElement;

        if (target.tagName === "TEXTAREA" && settings.displayGhostLines) {
            trackFocus(event);
        }
    });

    bookmarksMenu.addEventListener("click", async (event) => {
        const target = event.target as HTMLElement;

        if (target.id === bookmarksMenu.id) {
            return;
        }

        const [file, row] = target.textContent!.split("-");

        await changeTab(file);
        tabContent.children[Number.parseInt(row)].scrollIntoView({
            inline: "center",
            block: "center",
        });
    });

    searchPanel.addEventListener("transitionend", () => {
        if (searchSwitch.innerHTML.trim() === "search") {
            searchPanelFound.toggleMultiple("hidden", "flex");
        } else {
            searchPanelReplaced.toggleMultiple("hidden", "flex");
        }
    });

    searchPanelFound.addEventListener("mousedown", handleResultClick);

    goToRowInput.addEventListener("keydown", handleGotoRowInputKeypress);

    searchMenu.addEventListener("change", (event) => {
        const target = event.target as HTMLElement;

        switch (target.id) {
            case searchInput.id:
            case replaceInput.id:
                calculateHeight(event);
                break;
        }
    });

    searchMenu.addEventListener("keydown", async (event) => {
        const target = event.target as HTMLElement;

        switch (target.id) {
            case searchInput.id:
                await handleSearchInputKeypress(event);
                break;
            case replaceInput.id:
                handleReplaceInputKeypress(event);
                break;
        }
    });

    menuBar.addEventListener("click", async (event) => {
        const target = event.target as HTMLElement;

        switch (target.id) {
            case fileMenuButton.id:
                fileMenu.toggleMultiple("hidden", "flex");
                helpMenu.classList.replace("flex", "hidden");
                languageMenu.classList.replace("flex", "hidden");

                fileMenu.style.top = `${fileMenuButton.offsetTop + fileMenuButton.offsetHeight}px`;
                fileMenu.style.left = `${fileMenuButton.offsetLeft}px`;
                break;
            case "reload-button":
                if (await beforeClose()) {
                    location.reload();
                }
                break;
            case helpMenuButton.id:
                helpMenu.toggleMultiple("hidden", "flex");
                fileMenu.classList.replace("flex", "hidden");
                languageMenu.classList.replace("flex", "hidden");

                helpMenu.style.top = `${helpMenuButton.offsetTop + helpMenuButton.offsetHeight}px`;
                helpMenu.style.left = `${helpMenuButton.offsetLeft}px`;
                break;
            case "help-button":
                new WebviewWindow("help", {
                    url: "https://savannstm.github.io/rpgmtranslate/",
                    title: localization.helpButton,
                    center: true,
                });
                break;
            case "about-button":
                new WebviewWindow("about", {
                    url: "about.html",
                    title: localization.aboutButton,
                    center: true,
                    resizable: false,
                });
                break;
            case languageMenuButton.id:
                languageMenu.toggleMultiple("hidden", "flex");
                helpMenu.classList.replace("flex", "hidden");
                fileMenu.classList.replace("flex", "hidden");

                languageMenu.style.top = `${languageMenuButton.offsetTop + languageMenuButton.offsetHeight}px`;
                languageMenu.style.left = `${languageMenuButton.offsetLeft}px`;
                break;
            case "ru-button":
                if (settings.language !== Language.Russian) {
                    initializeLocalization(Language.Russian);
                    applyLocalization(localization, theme);
                }
                break;
            case "en-button":
                if (settings.language !== Language.English) {
                    initializeLocalization(Language.English);
                    applyLocalization(localization, theme);
                }
                break;
        }
    });

    themeWindow.addEventListener("input", (event) => {
        const target = event.target as HTMLInputElement;

        if (target.type === "color") {
            applyTheme(sheet, [target.id, target.value]);
            return;
        }
    });

    themeWindow.addEventListener("click", async (event) => {
        const target = event.target as HTMLElement;

        switch (target.id) {
            case createThemeButton.id: {
                const themeNameInput: HTMLInputElement = themeWindow.querySelector("#theme-name-input")!;
                const themeName = themeNameInput.value.trim();

                if (!/^[a-zA-Z0-9_-]+$/.test(themeName)) {
                    await message(`${localization.invalidThemeName} ${localization.allowedThemeNameCharacters}`);
                    return;
                }

                const newTheme = { name: themeName } as Theme;
                for (const div of themeWindowBody.children as HTMLCollectionOf<HTMLDivElement>) {
                    for (const subdiv of div.children) {
                        const input = subdiv.firstElementChild as HTMLInputElement;
                        newTheme[input.id] = input.value;
                    }
                }

                themes[themeName] = newTheme;
                await writeTextFile("res/themes.json", JSON.stringify(themes), { baseDir: Resource });

                const newThemeButton = document.createElement("button");
                newThemeButton.id = newThemeButton.textContent = themeName;
                themeMenu.insertBefore(newThemeButton, themeMenu.lastElementChild);
                break;
            }
            case closeButton.id:
                themeWindow.classList.add("hidden");
                break;
        }
    });

    themeMenu.addEventListener("click", (event: MouseEvent) => {
        const target = event.target as HTMLButtonElement;

        if (!themeMenu.contains(target)) {
            return;
        }

        if (target.id === "create-theme-menu-button") {
            themeWindow.classList.remove("hidden");
            themeWindow.style.left = `${(document.body.clientWidth - themeWindow.clientWidth) / 2}px`;

            const themeColors = Object.values(theme);
            let colorIndex = 1;

            for (const div of themeWindowBody.children as HTMLCollectionOf<HTMLDivElement>) {
                for (const subdiv of div.children) {
                    (subdiv.firstElementChild as HTMLInputElement).value = themeColors[colorIndex++];
                }
            }
        } else {
            setTheme(themes[target.id]);
        }
    });

    batchWindow.addEventListener("click", async (event) => {
        const target = event.target as HTMLElement | null;

        if (target && batchWindow.contains(target)) {
            if (target.classList.contains("checkbox") && !batchSelectWindowChecked.includes(target)) {
                target.textContent = target.textContent ? "" : "check";
                batchSelectWindowChecked.push(target);
            }

            switch (target.id) {
                case "select-all-button":
                    for (const element of batchWindowBody.children) {
                        element.firstElementChild!.textContent = "check";
                    }
                    break;
                case "deselect-all-button":
                    for (const element of batchWindowBody.children) {
                        element.firstElementChild!.textContent = "";
                    }
                    break;
                case "apply-button": {
                    const filenames: [string, number][] = [];

                    for (const element of batchWindowBody.children) {
                        if (element.firstElementChild!.textContent) {
                            filenames.push([element.lastElementChild!.textContent!, Number.parseInt(element.id)]);
                        }
                    }

                    for (const [filename, i] of filenames) {
                        await processFile(
                            filename,
                            i,
                            Number.parseInt(
                                (batchWindowFooter.firstElementChild!.firstElementChild! as HTMLInputElement).value,
                            ),
                        );
                    }

                    saved = false;
                    for (const element of batchWindowBody.children) {
                        element.firstElementChild!.textContent = "";
                    }

                    batchWindow.classList.replace("flex", "hidden");
                    break;
                }
                case "cancel-button":
                    for (const element of batchWindowBody.children) {
                        element.firstElementChild!.textContent = "";
                    }

                    batchWindow.classList.replace("flex", "hidden");
                    break;
            }
        }
    });

    batchWindow.addEventListener("mousemove", (event) => {
        if (event.buttons === 1) {
            const target = event.target as HTMLElement;
            if (target.classList.contains("checkbox") && !batchSelectWindowChecked.includes(target)) {
                target.textContent = target.textContent ? "" : "check";
                batchSelectWindowChecked.push(target);
            }
        }
    });

    batchWindow.addEventListener("mouseup", () => {
        batchSelectWindowChecked.length = 0;
    });

    toolsMenu.addEventListener("click", (event: MouseEvent) => {
        const target = event.target as HTMLButtonElement;

        if (!toolsMenu.contains(target)) {
            return;
        }

        if (batchWindow.classList.contains("flex")) {
            batchWindow.classList.replace("flex", "hidden");
            return;
        }

        switch (target.id) {
            case "translate-tools-menu-button":
                if (!areLanguageTagsValid()) {
                    return;
                }

                batchWindowAction = BatchAction.Translate;
                initializeBatchWindow(target);
                break;
            case "trim-tools-menu-button":
                batchWindowAction = BatchAction.Trim;
                initializeBatchWindow(target);
                break;
            case "wrap-tools-menu-button":
                batchWindowAction = BatchAction.Wrap;
                initializeBatchWindow(target);
                break;
        }
    });

    await listen("fetch-settings", async () => {
        await emit("settings", [settings, theme, projectSettings]);
    });

    await appWindow.onCloseRequested(async (event) => {
        if (await beforeClose()) {
            await exit();
        } else {
            event.preventDefault();
        }
    });
    // #endregion
});
