import { Language } from "../types/enums";

export class MainWindowLocalization {
    readonly askCreateSettings: string;
    readonly createdSettings: string;
    readonly unsavedChanges: string;
    readonly originalTextIrreplacable: string;
    readonly invalidRegexp: string;
    readonly textReverted: string;
    readonly reloadButton: string;
    readonly helpButton: string;
    readonly aboutButton: string;
    readonly hotkeysButton: string;
    readonly exit: string;
    readonly fileMenu: string;
    readonly helpMenu: string;
    readonly languageMenu: string;
    readonly menuButtonTitle: string;
    readonly saveButtonTitle: string;
    readonly compileButtonTitle: string;
    readonly settingsButtonTitle: string;
    readonly searchButtonTitle: string;
    readonly searchInputTitle: string;
    readonly replaceButtonTitle: string;
    readonly replaceInputTitle: string;
    readonly caseButtonTitle: string;
    readonly wholeButtonTitle: string;
    readonly regexButtonTitle: string;
    readonly translationButtonTitle: string;
    readonly locationButtonTitle: string;
    readonly noMatches: string;
    readonly currentPage: string;
    readonly separator: string;
    readonly goToRow: string;
    readonly missingTranslationDir: string;
    readonly missingOriginalDir: string;
    readonly missingTranslationSubdirs: string;
    readonly noProjectSelected: string;
    readonly bgDark: string;
    readonly bgPrimary: string;
    readonly bgSecond: string;
    readonly bgThird: string;
    readonly outPrimary: string;
    readonly outSecond: string;
    readonly outThird: string;
    readonly outFocused: string;
    readonly bdPrimary: string;
    readonly bdSecond: string;
    readonly bdFocused: string;
    readonly bgPrimaryHovered: string;
    readonly bgSecondHovered: string;
    readonly txtPrimary: string;
    readonly txtSecond: string;
    readonly txtThird: string;
    readonly createTheme: string;
    readonly allowedThemeNameCharacters: string;
    readonly invalidThemeName: string;
    readonly themeName: string;
    readonly compileSuccess: string;
    readonly themeButtonTitle: string;
    readonly openButtonTitle: string;
    readonly loadingProject: string;
    readonly missingFileText: string;
    readonly cannotDetermineEngine: string;
    readonly selectedFolderMissing: string;
    readonly compileWindowTitle: string;
    readonly readWindowTitle: string;
    readonly bookmarksButtonTitle: string;
    readonly readButtonTitle: string;
    readonly directoryAlreadyOpened: string;
    readonly errorOccurred: string;
    readonly searchMode: string;
    readonly searchAll: string;
    readonly searchOnlyTranslation: string;
    readonly searchOnlyOriginal: string;
    readonly trimFields: string;
    readonly translateFields: string;
    readonly wrapFields: string;
    readonly translationLanguagesNotSelected: string;
    readonly selectFiles: string;
    readonly wrapNumber: string;
    readonly deletingDisabled: string;
    readonly deletingConfirmation: string;
    readonly selectAll: string;
    readonly deselectAll: string;
    readonly apply: string;
    readonly cancel: string;
    readonly newVersionFound: string;
    readonly currentVersion: string;
    readonly updateAvailable: string;
    readonly installUpdate: string;

    constructor(language: Language) {
        switch (language) {
            case Language.Russian:
                this.askCreateSettings = "Не удалось найти файл настроек программы.\nСоздать настройки?";
                this.createdSettings =
                    "Настройки созданы.\nРезервное копирование: Включено\nПериод копирования: 60 сек.\nМаксимальное число копий: 99.\nТема: Классный цинк";
                this.unsavedChanges = "У вас остались несохранённые изменения. Сохранить прогресс и выйти?";
                this.originalTextIrreplacable = "Оригинальные строки не могут быть заменены.";
                this.invalidRegexp = "Некорректное регулярное выражение";
                this.textReverted = "Текст был возвращён к исходному значению";
                this.reloadButton = "Перезагрузить (F5)";
                this.helpButton = "Помощь";
                this.aboutButton = "О программе";
                this.hotkeysButton = "Горячие клавиши";
                this.exit = "Выйти без сохранения?";
                this.fileMenu = "Файл";
                this.helpMenu = "Помощь";
                this.languageMenu = "Язык";
                this.menuButtonTitle = "Вкладки (Tab)";
                this.saveButtonTitle = "Сохранить файлы перевода (Ctrl + S)";
                this.compileButtonTitle = "Скомпилировать (Alt + C)";
                this.settingsButtonTitle = "Настройки";
                this.searchButtonTitle = "Поиск (Ctrl + F)";
                this.searchInputTitle = "Поиск";
                this.replaceButtonTitle = "Заменить все совпадения на";
                this.replaceInputTitle = "Замена";
                this.caseButtonTitle = "Учитывать регистр (Alt + C)";
                this.wholeButtonTitle = "Искать слова целиком (Alt + W)";
                this.regexButtonTitle = "Поиск по регулярным выражениям (Alt + R)";
                this.translationButtonTitle = "Поиск только по переводу (Alt + T)";
                this.locationButtonTitle = "Поиск только в текущем файле (Alt + L)";
                this.noMatches = "Нет совпадений";
                this.currentPage = "Нет";
                this.separator = "из";
                this.goToRow = "Перейти к строке... от 1 до";
                this.missingTranslationDir = 'Директория "translation" отсутствует. Проект не будет инициализирован.';
                this.missingOriginalDir = 'Директория "data" отсутствует. Проект не будет инициализирован.';
                this.missingTranslationSubdirs =
                    'Поддиректории "maps" и "other" директории "translation" отсутствуют. Проект не будет инициализирован.';
                this.noProjectSelected =
                    'Проект не выбран. Выберите директорию проекта, используя кнопку "открыть папку" в левом верхнем углу. Директория должна содержать в себе папки "data" и "translation" (с поддиректориями "maps", "other" и "plugins", если это RPG Maker MV/MZ; или "maps" и "other", если это RPG Maker XP/VX/VXAce).';
                this.bgDark = "Тёмный цвет фона";
                this.bgPrimary = "Основной цвет фона";
                this.bgSecond = "Второстепенный цвет фона";
                this.bgThird = "Третий цвет фона";
                this.outPrimary = "Основной цвет контура";
                this.outSecond = "Второстепенный цвет контура";
                this.outThird = "Третий цвет контура";
                this.outFocused = "Цвет контура при фокусировке";
                this.bdPrimary = "Основной цвет границы";
                this.bdSecond = "Второстепенный цвет границы";
                this.bdFocused = "Цвет границы при фокусировке";
                this.bgPrimaryHovered = "Основной цвет фона при наведении курсора";
                this.bgSecondHovered = "Второстепенный цвет фона при наведении курсора";
                this.txtPrimary = "Основной цвет текста";
                this.txtSecond = "Второстепенный цвет текста";
                this.txtThird = "Третий цвет текста";
                this.createTheme = "Создать тему";
                this.allowedThemeNameCharacters = "Разрешенные символы: a-z, A-Z, 0-9, -, _.";
                this.invalidThemeName = "Название темы недопустимо.";
                this.themeName = "Название темы:";
                this.compileSuccess = "Все файлы записаны успешно.\nПотрачено (в секундах):";
                this.themeButtonTitle = "Меню тем";
                this.openButtonTitle = "Открыть папку";
                this.loadingProject = "Загружаем проект";
                this.selectedFolderMissing = "Выбранная папка не существует. Проект не будет инициализирован.";
                this.missingFileText =
                    "Текст выбранного файла отсутствует. Скорее всего, этот файл и/или его _trans версия отсутствуют.";
                this.cannotDetermineEngine = "Не удалось определить тип движка игры.";
                this.compileWindowTitle = "Настройки компиляции";
                this.readWindowTitle = "Настройки чтения";
                this.bookmarksButtonTitle = "Закладки (Ctrl + B)";
                this.readButtonTitle = "Перечитать файлы (Alt + R)";
                this.directoryAlreadyOpened = "Выбранная директория уже открыта в программе.";
                this.errorOccurred = "Произошла ошибка:";
                this.searchMode = "Режим поиска";
                this.searchAll = "Искать везде";
                this.searchOnlyOriginal = "Искать только в ориг. тексте";
                this.searchOnlyTranslation = "Искать только в переводе";
                this.trimFields = "Обрезать пробелы полей";
                this.translateFields = "Перевести поля";
                this.wrapFields = "Перенести строки в полях";
                this.translationLanguagesNotSelected = "Языки перевода не выбраны. Настройте их в настройках.";
                this.selectFiles = "Выберите файлы (можно зажать ЛКМ и выделить несколько файлов)";
                this.wrapNumber = "Длина строки для переноса";
                this.deletingDisabled = "Удаление рядов выключено.";
                this.deletingConfirmation = "Вы действительно хотите удалить этот ряд? Это действие необратимо!";
                this.selectAll = "Выбрать всё";
                this.deselectAll = "Убрать всё";
                this.apply = "Применить";
                this.cancel = "Отменить";
                this.newVersionFound = "Обнаружена новая версия";
                this.currentVersion = "Текущая версия";
                this.updateAvailable = "Доступно обновление!";
                this.installUpdate = "Установить обновление";
                break;
            default:
                this.askCreateSettings = "Cannot find program's settings.\nCreate settings?";
                this.createdSettings =
                    "Settings created.\nBackups: Enabled\nBackup period: 60 secs.\nMaximum backups: 99.\nTheme: Cool Zinc";
                this.unsavedChanges = "You have unsaved changes. Save progress and quit?";
                this.originalTextIrreplacable = "Original text is irreplacable.";
                this.invalidRegexp = "Invalid regular expression.";
                this.textReverted = "Text was reverted to the original state";
                this.reloadButton = "Reload (F5)";
                this.helpButton = "Help";
                this.aboutButton = "About";
                this.hotkeysButton = "Hotkeys";
                this.exit = "Quit without saving?";
                this.fileMenu = "File";
                this.helpMenu = "Help";
                this.languageMenu = "Language";
                this.menuButtonTitle = "Tabs (Tab)";
                this.saveButtonTitle = "Save the translation files (Ctrl + S)";
                this.compileButtonTitle = "Compile (Alt + C)";
                this.settingsButtonTitle = "Settings";
                this.searchButtonTitle = "Search (Ctrl + F)";
                this.searchInputTitle = "Search";
                this.replaceButtonTitle = "Replace all matches with";
                this.replaceInputTitle = "Replace";
                this.caseButtonTitle = "Consider case (Alt + C)";
                this.wholeButtonTitle = "Search the whole text (Alt + W)";
                this.regexButtonTitle = "Search by regular expressions (Alt + R)";
                this.translationButtonTitle = "Search only by translation (Alt + T)";
                this.locationButtonTitle = "Search only in the current file (Alt + L)";
                this.noMatches = "No matches";
                this.currentPage = "None";
                this.separator = "of";
                this.goToRow = "Go to row... from 1 to";
                this.missingTranslationDir = "'translation' directory is missing. Project won't be initialized.";
                this.missingOriginalDir = "'data' directory is missing. Project won't be initialized.";
                this.missingTranslationSubdirs =
                    "'translation' directory's subdirectories 'maps', 'other' and/or 'plugins' are missing. Project won't be initialized.";
                this.noProjectSelected =
                    "No project selected. Select the project directory, using 'open folder' button in the left-top corner. Directory must contain directories  'data' and 'translation' (with 'maps', 'other' and 'plugins' subdirectories, if it's RPG Maker MV/MZ; or 'maps' and 'other', if it's RPG Maker XP/VX/VXAce).";
                this.bgDark = "Dark background color";
                this.bgPrimary = "Primary background color";
                this.bgSecond = "Second background color";
                this.bgThird = "Third background color";
                this.outPrimary = "Primary outline color";
                this.outSecond = "Second outline color";
                this.outThird = "Third outline color";
                this.outFocused = "Focused outline color";
                this.bdPrimary = "Primary border color";
                this.bdSecond = "Second border color";
                this.bdFocused = "Focused border color";
                this.bgPrimaryHovered = "Primary background color when hovered";
                this.bgSecondHovered = "Second background color when hovered";
                this.txtPrimary = "Primary text color";
                this.txtSecond = "Second text color";
                this.txtThird = "Third text color";
                this.createTheme = "Create theme";
                this.allowedThemeNameCharacters = "Allowed characters: a-z, A-Z, 0-9, -, _.";
                this.invalidThemeName = "Theme name is invalid.";
                this.themeName = "Theme name:";
                this.compileSuccess = "All files were written successfully.\nTime spent (in seconds):";
                this.themeButtonTitle = "Themes menu";
                this.openButtonTitle = "Open folder";
                this.loadingProject = "Loading project";
                this.selectedFolderMissing = "Selected folder is missing. Project won't be initialized.";
                this.missingFileText =
                    "Text of the selected file missing. Probably, it and it's _trans version don't exist for some reason.";
                this.cannotDetermineEngine = "Cannot determine the type of the game's engine.";
                this.compileWindowTitle = "Compilation settings";
                this.readWindowTitle = "Read settings";
                this.bookmarksButtonTitle = "Bookmarks (Ctrl + B)";
                this.readButtonTitle = "Re-read files (Alt + R)";
                this.directoryAlreadyOpened = "Selected directory is already opened in the program.";
                this.errorOccurred = "An error has occurred:";
                this.searchMode = "Search mode";
                this.searchAll = "Search everywhere";
                this.searchOnlyOriginal = "Search only in original text";
                this.searchOnlyTranslation = "Search only in translation";
                this.trimFields = "Trim fields";
                this.translateFields = "Translate fields";
                this.wrapFields = "Wrap lines in fields";
                this.translationLanguagesNotSelected =
                    "Translation languages are not selected. Set them in the settings.";
                this.selectFiles = "Select files (You can hold LMB and drag to select multiple files)";
                this.wrapNumber = "Line length for wrapping";
                this.deletingDisabled = "Deleting is disabled in settings.";
                this.deletingConfirmation = "Do you really want to delete this row? This action is irreversible!";
                this.selectAll = "Select all";
                this.deselectAll = "Deselect all";
                this.apply = "Apply";
                this.cancel = "Cancel";
                this.newVersionFound = "New version found";
                this.currentVersion = "Current version";
                this.updateAvailable = "Update available!";
                this.installUpdate = "Install update";
                break;
        }
    }
}

export class SettingsWindowLocalization {
    readonly backupPeriodLabel: string;
    readonly backupPeriodNote: string;
    readonly backupMaxLabel: string;
    readonly backupMaxNote: string;
    readonly backup: string;
    readonly font: string;
    readonly defaultFont: string;
    readonly translationLanguages: string;
    readonly fromLanguage: string;
    readonly toLanguage: string;
    readonly incorrectLanguageTag: string;
    readonly confirmation: string;
    readonly disabled: string;
    readonly allowed: string;
    readonly delete: string;
    readonly displayGhostLines: string;

    constructor(language: Language) {
        switch (language) {
            case Language.Russian:
                this.backupPeriodLabel = "Создавать резервные копии каждые:";
                this.backupPeriodNote = "секунд (минимум 60, максимум 3600)";
                this.backupMaxLabel = "Максимальное количество резервных копий:";
                this.backupMaxNote = "(минимум 1, максимум 99)";
                this.backup = "Резервное копирование";
                this.font = "Шрифт";
                this.defaultFont = "Стандартный";
                this.translationLanguages = "Языки перевода (для машинного перевода)";
                this.fromLanguage = "Исходный язык (тег BCP-47, например, en или en-US)";
                this.toLanguage = "Язык перевода (тег BCP-47, например, ru или ru-RU)";
                this.incorrectLanguageTag = "Некорректный тег языка";
                this.delete = "Режим удаления рядов";
                this.disabled = "Выключить";
                this.confirmation = "Спрашивать";
                this.allowed = "Разрешить";
                this.displayGhostLines = "Отображать переносы строк в текстовых полях";
                break;
            default:
                this.backupPeriodLabel = "Create backup every:";
                this.backupPeriodNote = "seconds (min 60, max 3600)";
                this.backupMaxLabel = "Max number of backups:";
                this.backupMaxNote = "(min 1, max 99)";
                this.backup = "Backup";
                this.font = "Font";
                this.defaultFont = "Default";
                this.translationLanguages = "Translation languages (for machine translation)";
                this.fromLanguage = "From language (BCP-47 tag, e.g. ja or ja-JP)";
                this.toLanguage = "To language (BCP-47 tag, e.g. en or en-US)";
                this.incorrectLanguageTag = "Incorrect language tag";
                this.delete = "Row delete mode";
                this.disabled = "Disabled";
                this.confirmation = "Ask for confirmation";
                this.allowed = "Allowed";
                this.displayGhostLines = "Display lines breaks in text areas";
                break;
        }
    }
}

export class AboutWindowLocalization {
    readonly version: string;
    readonly contacts: string;
    readonly vkLink: string;
    readonly tgLink: string;
    readonly repoLink: string;
    readonly license: string;

    constructor(language: Language) {
        switch (language) {
            case Language.Russian:
                this.version = "Версия";
                this.contacts = "Контакты:";
                this.vkLink = "ВК";
                this.tgLink = "Телеграм";
                this.repoLink = "Репозиторий программы";
                this.license = "Лицензия";
                break;
            default:
                this.version = "Version";
                this.contacts = "Contacts:";
                this.vkLink = "VK";
                this.tgLink = "Telegram";
                this.repoLink = "Program's repository";
                this.license = "License";
                break;
        }
    }
}

export class HelpWindowLocalization {
    readonly help: string;
    readonly helpText: string;
    readonly hotkeys: string;
    readonly hotkeysText: string;

    constructor(language: Language) {
        switch (language) {
            case Language.Russian:
                this.help = "Как пользоваться; что делать; куда нажимать?";
                this.helpText =
                    'Чтобы запустить проект и начать перевод, используйте кнопку "Открыть папку" в левом верхнем углу. Открываемая папка должна содержать в себе папку "data" с оригинальными файлами игры. Если текст игры не был распарсен ранее с использованием CLI-инструментов, прогрмма автоматически распарсит его. По умолчанию, программа поддерживает чтение и запись файлов движков RPG Maker XP/VX/VXAce/MV/MZ.<br>Программа регулярно создает резервные копии файлов переводов по пути "папка_проекта/.rpgmtranslate/backups", период резервного копирования и максимальное количество резервных копий можно регулировать в настройках. По умолчанию программа создает резервные копии каждые 60 секунд.<br>При сохранении перевода в программе, все файлы перевода будут сохранятся по пути "папка_проекта/.rpgmtranslate/translation".<br>Чтобы сохранить изменения в проекте, нажмите кнопку сохранить или используйте сочетание клавиш Ctrl + S. Программа автоматически сохранит ваш проект, и когда вы снова запустите программу, вы сможете продолжить с того места, на котором остановились.<br>Чтобы скомпилировать ваш перевод в рабочие файлы игры, нажмите кнопку компиляции или используйте сочетание клавиш Alt + C. Обязательно сохраните перевод перед компиляцией. Программа создаст полностью функциональные файлы игры с применённым переводом в папке "папка_проекта/.rpgmtranslate/output".<br>Вы можете еще раз прочитать это руководство или получить справку о горячих клавишах программы, выбрав пункты верхнего меню "Помощь" > "Помощь".';
                this.hotkeys = "Горячие клавиши";
                this.hotkeysText =
                    "Tab - Открыть панель выбора файлов<br>Стрелки вниз/Вверх - Перейти к следующему/предыдущему файлу<br>Ctrl + S - Сохранить файлы перевода<br>Ctrl + F - Открыть окно поиска текста<br>R - Открыть панель результатов поиска<br>Alt/Ctrl + Enter - Переход к текстовому полю ниже/выше выделенного соответственно<br>ЛКМ на оригинальном текстовом поле - скопировать текст из него<br>Ctrl + T, пока текстовая область выделена: при первой активации показать предварительный просмотр машинного перевода оригинального текста. При второй, вставить машинный перевод в поле<br>Esc - Если сфокусированным элементом является текстовая область, убрать фокусировку, в противном случае закрыть открытый файл<br>Alt + C, если вы НЕ сфокусированы на текстовой области - скомпилировать перевод<br>Alt + C, Alt + W, Alt + R, Alt + T, пока вы сфокусированы на поле поиска - переключить поиск по регистру, целым словам, регулярным выражениям и поиск только по переводу<br>ЛКМ на результате поиска - открыть выбранное поле<br>ПКМ на результате поиска - заменить текст этого элемента на тот, который в данный момент введен в поле замены текста<br>ЛКМ на результате журнала - открыть ранее изменённый элемент<br>ПКМ на результате журнала - вернуть изменённый элемент в исходное состояние<br>Ctrl + G - открыть поле перехода к строке<br>Ctrl + B - открыть окно закладок<br>Ctrl + R - открыть окно чтения файлов";
                break;
            default:
                this.help = "How to use; what to do; where to click?";
                this.helpText =
                    "To start the project and start the translation, use the 'Open Folder' button in the upper left corner. The folder must contain the 'data' folder with the original game files. If the text of the game has not been parsed previously using CLI tools, the program will automatically parse it. By default, the program supports reading and writing RPG Maker XP/VX/VXAce/MV/MZ engine files.<br>The program regularly creates backups of translation files in the path 'project_folder/.rpgmtranslate/backups', the backup period and the maximum number of backups can be adjusted in the settings. By default, the program creates backups every 60 seconds.<br>When saving a translation in the program, all translation files will be saved in the path 'project_folder/.rpgmtranslate/translation'. To save the changes in the project, click save or use the keyboard shortcut Ctrl + S. The program will automatically save your project, and when you run the program again, you can pick up where you left off. To compile your translation into working game files, click the compile button or use the Alt + C keyboard shortcut. Be sure to save the translation before compiling. The program will create fully functional game files with the applied translation in the folder 'project_folder/.rpgmtranslate/output'.<br>You can read this manual again or get help about the program's hotkeys by selecting the 'Help' > 'Help' item in the top menu.";
                this.hotkeys = "Hotkeys";
                this.hotkeysText =
                    "Tab - Open the panel for selecting files<br>Arrow Down/Up - Jump to the next/previous file<br>Ctrl + S - Save the translation files<br>Ctrl + F - Open the search window<br>R - Open the search results panel<br>Alt/Ctrl + Enter - Jump to the textarea below/above the focused respectively<br>LMB on the original text field - copy the text from the original field<br>Ctrl + T, while the textarea is selected: for the first activation, show the preview of machine translation of the original text. For the second, insert the machine translation into the field<br>Esc - If focused element is the textarea, remove the focus, else close the opened file<br>Alt + C, if you are NOT focused on the textarea - Compile translation<br>Alt + C, Alt + W, Alt + R, Alt + T, while you are focused on the search field - toggle case, whole text, regular expressions, and only translation text search respectively<br>LMB on the search result - scroll into the view of the result element<br>RMB on the search result - replace matching text of this element with the one that's currently entered into the replace field<br>LMB on the log result - scroll into the view of the previously changed element<br>RMB on the log result - revert changed element to the original state<br>Ctrl + G - open the 'jump to row' field<br>Ctrl + B - open the bookmarks window<br>Ctrl + R - open the files reading window";
                break;
        }
    }
}

export class CompileWindowLocalization {
    readonly options: string;
    readonly romanizeOption: string;
    readonly shuffleOption: string;
    readonly shuffleLevel: string;
    readonly chooseOptionText: string;
    readonly shuffleLinesOption: string;
    readonly shuffleAllOption: string;
    readonly disableCustomProcessing: string;
    readonly customOutputPath: string;
    readonly selectOutputPath: string;
    readonly disableProcessing: string;
    readonly disableMapsProcessingOption: string;
    readonly disableOtherProcessingOption: string;
    readonly disableSystemProcessingOption: string;
    readonly disablePluginsProcessingOption: string;
    readonly dontAskAgain: string;
    readonly compileButtonText: string;
    readonly mapsProcessingMode: string;
    readonly defaultMapsMode: string;
    readonly separateMapsMode: string;
    readonly preserveMapsMode: string;
    readonly loggingOption: string;

    constructor(language: Language) {
        switch (language) {
            case Language.Russian:
                this.options = "Опции:";
                this.romanizeOption =
                    "Романизация игрового текста. Используйте эту опцию, лишь если вы прочитали текст с её использованием, чтобы корректно записать все файлы.";
                this.shuffleOption = "Перемешивание";
                this.shuffleLevel = "Уровень перемешивания";
                this.chooseOptionText = "Выберите опцию";
                this.shuffleLinesOption = "Перемешать линии в строках";
                this.shuffleAllOption = "Перемешать линии и слова";
                this.disableCustomProcessing =
                    "Выключить индивидуальную обработку (используйте лишь если вы прочитали файлы без индивидуальной обработки)";
                this.customOutputPath = "Другой выходной путь";
                this.selectOutputPath = "Выбрать выходной путь";
                this.disableProcessing = "Выключить обработку...";
                this.disableMapsProcessingOption = "Выключить обработку файлов maps";
                this.disableOtherProcessingOption = "Выключить обработку файлов other";
                this.disableSystemProcessingOption = "Выключить обработку файла system";
                this.disablePluginsProcessingOption = "Выключить обработку файла plugins/scripts";
                this.dontAskAgain = "Больше не спрашивать (вы можете вновь открыть это окно правой кнопкой мыши)";
                this.compileButtonText = "Скомпилировать";
                this.mapsProcessingMode = "Режим обработки файлов maps";
                this.defaultMapsMode = "Стандартный";
                this.separateMapsMode = "Раздельный текст карт";
                this.preserveMapsMode = "Сохранять дубликаты";
                this.loggingOption =
                    "Включить логирование (Выводит информацию в консоль программы, F12/ПКМ > Просмотр)";
                break;
            default:
                this.options = "Options:";
                this.romanizeOption =
                    "Whether to romanize text. Only use this option if you've read text with it, to correctly write all files.";
                this.shuffleOption = "Shuffle";
                this.shuffleLevel = "Shuffle level";
                this.chooseOptionText = "Choose an option";
                this.shuffleLinesOption = "Shuffle text lines";
                this.shuffleAllOption = "Shuffle both lines and words";
                this.disableCustomProcessing =
                    "Disable custom processing (use only if you've read files without custom processing)";
                this.customOutputPath = "Custom output path";
                this.selectOutputPath = "Select output path";
                this.disableProcessing = "Disable processing of...";
                this.disableMapsProcessingOption = "Disable maps processing";
                this.disableOtherProcessingOption = "Disable other processing";
                this.disableSystemProcessingOption = "Disable system processing";
                this.disablePluginsProcessingOption = "Disable plugins/scripts processing";
                this.dontAskAgain = "Don't ask again (you can open this window again by right-clicking compile button)";
                this.compileButtonText = "Compile";
                this.mapsProcessingMode = "Maps processing mode";
                this.defaultMapsMode = "Default";
                this.separateMapsMode = "Separate maps text";
                this.preserveMapsMode = "Preserve duplicates";
                this.loggingOption = "Enable logging (Outputs information to the program's console, F12/RMB > Inspect)";
                break;
        }
    }
}

export class ReadWindowLocalization {
    readonly mode: string;
    readonly chooseReadingMode: string;
    readonly defaultReadingMode: string;
    readonly appendReadingMode: string;
    readonly forceReadingMode: string;
    readonly appendModeDescription: string;
    readonly forceModeDescription: string;
    readonly options: string;
    readonly romanizeOption: string;
    readonly disableCustomProcessing: string;
    readonly disableProcessing: string;
    readonly disableMapsProcessingOption: string;
    readonly disableOtherProcessingOption: string;
    readonly disableSystemProcessingOption: string;
    readonly disablePluginsProcessingOption: string;
    readonly dontAskAgain: string;
    readonly readButtonText: string;
    readonly readingInAppendMode: string;
    readonly readingInForceMode: string;
    readonly readingModeNotSelected: string;
    readonly mapsProcessingMode: string;
    readonly defaultMapsMode: string;
    readonly separateMapsMode: string;
    readonly preserveMapsMode: string;
    readonly loggingOption: string;
    readonly generateJSONCheckbox: string;

    constructor(language: Language) {
        switch (language) {
            case Language.Russian:
                this.mode = "Режим чтения:";
                this.chooseReadingMode = "Выберите режим чтения";
                this.defaultReadingMode = "Стандартный";
                this.appendReadingMode = "Добавление";
                this.forceReadingMode = "Перезапись";
                this.appendModeDescription =
                    "В случае обновления игры, текст которой вы запарсили, либо же графического интерфейса, имеет смысл перечитать файлы в этом режиме, чтобы добавить новый текст к имеющемуся без потери прогресса.";
                this.forceModeDescription =
                    "Принудительно перезаписывает файлы перевода. Используйте, если вам нужно полностью перечитать файлы с определёнными настройками.";
                this.options = "Опции:";
                this.romanizeOption =
                    'Романизация текста. Если вы парсите текст из японской игры, содержащей символы вроде 「」,являющимися обычными японскими кавычками, они будут автоматически заменены на их европейские эквиваленты. (в данном случае, "")';
                this.disableCustomProcessing =
                    "Выключить индивидуальную обработку (используйте лишь если вы прочитали файлы без индивидуальной обработки)";
                this.disableProcessing = "Выключить обработку...";
                this.disableMapsProcessingOption = "Выключить обработку файлов maps";
                this.disableOtherProcessingOption = "Выключить обработку файлов other";
                this.disableSystemProcessingOption = "Выключить обработку файла system";
                this.disablePluginsProcessingOption = "Выключить обработку файла plugins/scripts";
                this.dontAskAgain = "Больше не спрашивать (вы можете вновь открыть это окно правой кнопкой мыши)";
                this.readButtonText = "Прочитать";
                this.readingInAppendMode = "Читаем в режиме добавления";
                this.readingInForceMode = "Читаем в режиме принудительной перезаписи";
                this.readingModeNotSelected = "Режим чтения не выбран.";
                this.mapsProcessingMode = "Режим обработки файлов maps";
                this.defaultMapsMode = "Стандартный";
                this.separateMapsMode = "Раздельный текст карт";
                this.preserveMapsMode = "Сохранять дубликаты";
                this.loggingOption =
                    "Включить логирование (Выводит информацию в консоль программы, F12/ПКМ > Просмотр)";
                this.generateJSONCheckbox = "Сгенерировать JSON репрезентации файлов старых движков";
                break;
            default:
                this.mode = "Reading mode:";
                this.chooseReadingMode = "Choose reading mode";
                this.defaultReadingMode = "Default";
                this.appendReadingMode = "Append";
                this.forceReadingMode = "Force rewrite";
                this.appendModeDescription =
                    "In case, when the game text you've parsed updates, or the GUI update, it makes sense to re-read files in this mode, to append new text to existing translation without overwriting the progress.";
                this.forceModeDescription =
                    "Forcefully rewrites translation files. Use, only if you need to completely re-read files using certain settings.";
                this.options = "Options:";
                this.romanizeOption =
                    'Whether to romanize text. If you parsing text from a Japanese game, that contains symbols like 「」, which are just the Japanese quotation marks, it automatically replaces these symbols by their roman equivalents. (in this case, "")';
                this.disableCustomProcessing =
                    "Disable custom processing (use only if you've read files without custom processing)";
                this.disableProcessing = "Disable processing of...";
                this.disableMapsProcessingOption = "Disable maps processing";
                this.disableOtherProcessingOption = "Disable other processing";
                this.disableSystemProcessingOption = "Disable system processing";
                this.disablePluginsProcessingOption = "Disable plugins/scripts processing";
                this.dontAskAgain = "Don't ask again (you can open this window again by right-clicking compile button)";
                this.readButtonText = "Read";
                this.readingInAppendMode = "Reading in append mode";
                this.readingInForceMode = "Reading in force rewrite mode";
                this.readingModeNotSelected = "Reading mode is not selected.";
                this.mapsProcessingMode = "Maps processing mode";
                this.defaultMapsMode = "Default";
                this.separateMapsMode = "Separate maps text";
                this.preserveMapsMode = "Preserve duplicates";
                this.loggingOption = "Enable logging (Outputs information to the program's console, F12/RMB > Inspect)";
                this.generateJSONCheckbox = "Generate JSON representations of older engines' files";
                break;
        }
    }
}

export type Localization =
    | MainWindowLocalization
    | HelpWindowLocalization
    | AboutWindowLocalization
    | ReadWindowLocalization
    | CompileWindowLocalization
    | SettingsWindowLocalization;
