const { Gdk, Gtk } = imports.gi;
import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import GLib from "gi://GLib";
import Gio from 'gi://Gio';
import Applications from 'resource:///com/github/Aylur/ags/service/applications.js';
const { execAsync, exec, readFile } = Utils;
import { execAndClose, expandTilde, hasUnterminatedBackslash, couldBeMath, launchCustomCommand, fzfSearch, specialPaths, findDirectories, findFiles } from './miscfunctions.js';
import {
    CalculationResultButton, CustomCommandButton, DirectoryButton,
    DesktopEntryButton, ExecuteCommandButton, SearchButton, AiButton, NoResultButton,
} from './searchbuttons.js';
import { checkKeybind } from '../.widgetutils/keybind.js';
import GeminiService from '../../services/gemini.js';
import { Writable, writable, waitLastAction } from '../.miscutils/store.js';

// Добавляем математические функции
const { abs, sin, cos, tan, cot, asin, acos, atan, acot } = Math;
const pi = Math.PI;
// Тригонометрические функции для градусов
const sind = x => sin(x * pi / 180);
const cosd = x => cos(x * pi / 180);
const tand = x => tan(x * pi / 180);
const cotd = x => cot(x * pi / 180);
const asind = x => asin(x) * 180 / pi;
const acosd = x => acos(x) * 180 / pi;
const atand = x => atan(x) * 180 / pi;
const acotd = x => acot(x) * 180 / pi;

const CONFIG = JSON.parse(readFile('/home/pharmaracist/.config/ags/config.json'));
const searchConfig = CONFIG.overview.searchOptions;

const MAX_RESULTS = searchConfig.maxResults.applications; // Уменьшаем количество результатов
const OVERVIEW_SCALE = 0.18;
const OVERVIEW_WS_NUM_SCALE = 0.09;
const OVERVIEW_WS_NUM_MARGIN_SCALE = 0.07;
const TARGET = [Gtk.TargetEntry.new('text/plain', Gtk.TargetFlags.SAME_APP, 0)];

// Кэшируем тему иконок
const iconTheme = Gtk.IconTheme.get_default();
function iconExists(iconName) {
    return iconTheme.has_icon(iconName);
}

const OptionalOverview = async () => {
    try {
        return (await import('./overview_hyprland.js')).default();
    } catch {
        return Widget.Box({});
    }
};

const overviewContent = await OptionalOverview();

/**
 * @type {Gio.FileMonitor[]}
 */
let monitors = [];
/**
 * @type {GLib.Source|null}
 */
let waitToRereadDesktop = null;

const watchersOption = writable ([]);

watchersOption.subscribe (/*** @param {string[]} paths */ (paths) => {
    for (const monitor of monitors) {
        monitor.cancel();
    }

    monitors = [];

    for (const path of paths) {
        const monitor = Utils.monitorFile (expandTilde(path), () => {
            waitToRereadDesktop = waitLastAction (waitToRereadDesktop, 500, () => {
                Applications.reload();
                waitToRereadDesktop = null;
            });
        });
        if (monitor !== null) { monitors.push(monitor); }
    }
});

userOptions.subscribe ((n) => {
    watchersOption.set (n.search.watchers ?? []);
});

export const SearchAndWindows = () => {
    let _appSearchResults = [];
    const options = userOptions.asyncGet();
    
    const resultsBox = Widget.Box({
        className: 'overview-search-results',
        vertical: true,
    });

    const resultsRevealer = Widget.Revealer({
        transitionDuration: options.animations.durationSmall || 150,
        revealChild: false,
        transition: 'slide_down',
        hpack: 'center',
        child: resultsBox,
    });

    const entryPromptRevealer = Widget.Revealer({
        transition: 'crossfade', 
        transitionDuration: options.animations.durationSmall,
        revealChild: true,
        hpack: 'center',
        child: Widget.Label({
            className: 'overview-search-prompt txt-small txt',
            label: getString('Start The Journey')
        }),
    });

    const entryIconRevealer = Widget.Revealer({
        transition: 'crossfade',
        transitionDuration: options.animations.durationSmall,
        revealChild: false,
        hpack: 'end',
        child: Widget.Label({
            className: 'txt txt-large icon-material overview-search-icon',
            label: 'search',
        }),
    });
    const entryIcon = Widget.Box({
        className: 'overview-search-prompt-box',
        setup: box => box.pack_start(entryIconRevealer, true, true, 0),
    });

    const entry = Widget.Entry({
        className: 'overview-search-box txt-small txt',
        hpack: 'center',
        onAccept: (self) => {
            resultsBox.children[0]?.onClicked();
        },
        onChange: (entry) => {
            const text = entry.text;
            const isAction = text[0] === '>';
            const isDir = ['/', '~'].includes(text[0]);
            const isFile = text[0] === "'";

            resultsBox.get_children().forEach(ch => ch.destroy());

            if (!text) {
                resultsRevealer.revealChild = false;
                overviewContent.revealChild = true;
                entryPromptRevealer.revealChild = true;
                entryIconRevealer.revealChild = false;
                entry.toggleClassName('overview-search-box-extended', false);
                return;
            }

            resultsRevealer.revealChild = true;
            overviewContent.revealChild = false;
            entryPromptRevealer.revealChild = false;
            entryIconRevealer.revealChild = true;
            entry.toggleClassName('overview-search-box-extended', true);

            // Handle subfolder search
            let currentPath = null;
            if (text.includes('/')) {
                const parts = text.split('/');
                const basePath = parts.slice(0, -1).join('/');
                if (basePath) {
                    currentPath = basePath.startsWith('~') 
                        ? basePath.replace('~', GLib.get_home_dir())
                        : basePath;
                }
            }

            // Prepare all results in parallel
            Promise.all([
                // Get app results (first)
                !isFile ? Promise.resolve(Applications.query(text)) : Promise.resolve([]),
                // Get directory results (second)
                text.length >= 1 && !isFile ? findDirectories(text, currentPath) : Promise.resolve([]),
                // Get file results if ' prefix
                isFile ? findFiles(text, currentPath) : Promise.resolve([]),
                // Get directory listing for / or ~ paths (third)
                isDir || text in specialPaths ? Promise.resolve(ls({ path: text, silent: true })) : Promise.resolve([])
            ]).then(([appResults, dirResults, fileResults, listResults]) => {
                if (entry.text !== text) return; // Skip if text has changed

                // Store first result for Enter key
                let firstResult = null;
                const seenPaths = new Set();

                // Show calculator result if applicable
                if (!isFile && searchConfig.features.calculator && options.search.enableFeatures.mathResults && couldBeMath(text)) {
                    try {
                        const calcResult = {
                            type: 'calculator',
                            result: eval(text.replace(/\^/g, "**")),
                            text: text
                        };
                        firstResult = firstResult || calcResult;
                        resultsBox.add(CalculationResultButton({ 
                            result: calcResult.result,
                            text: calcResult.text 
                        }));
                    } catch {}
                }

                // 1. Show application results first (only if not file search)
                if (!isFile && !currentPath && searchConfig.features.applications && appResults.length > 0) {
                    const uniqueApps = appResults.filter((app, index, self) =>
                        index === self.findIndex(a => a.id === app.id)
                    );
                    
                    firstResult = firstResult || { type: 'app', app: uniqueApps[0] };
                    uniqueApps.slice(0, searchConfig.maxResults.applications)
                        .forEach(app => resultsBox.add(DesktopEntryButton(app)));
                }

                // 2. Show directory/file results
                if (searchConfig.features.directories) {
                    // Show file search results
                    if (fileResults.length > 0) {
                        firstResult = firstResult || { type: 'file', file: fileResults[0] };
                        fileResults.forEach(item => {
                            if (!seenPaths.has(item.path)) {
                                seenPaths.add(item.path);
                                resultsBox.add(DirectoryButton(item));
                            }
                        });
                    }
                    
                    // Show directory search results
                    if (dirResults.length > 0) {
                        firstResult = firstResult || { type: 'directory', dir: dirResults[0] };
                        dirResults.forEach(item => {
                            if (!seenPaths.has(item.path)) {
                                seenPaths.add(item.path);
                                resultsBox.add(DirectoryButton(item));
                            }
                        });
                    }
                    
                    // Show directory listing results
                    if (listResults.length > 0) {
                        firstResult = firstResult || { type: 'directory', dir: listResults[0] };
                        listResults.forEach(item => {
                            if (!seenPaths.has(item.path)) {
                                seenPaths.add(item.path);
                                resultsBox.add(DirectoryButton(item));
                            }
                        });
                    }
                }

                // 3. Show command execution option
                if (searchConfig.features.commands && options.search.enableFeatures.commands && !isAction && 
                    !hasUnterminatedBackslash(text) && 
                    exec(`bash -c "command -v ${text.split(' ')[0]}"`) !== '') {
                    const cmdResult = { type: 'command', command: text };
                    firstResult = firstResult || cmdResult;
                    resultsBox.add(ExecuteCommandButton({ 
                        command: text,
                        terminal: text.startsWith('sudo')
                    }));
                }

                // 4. Show custom command if it's an action
                if (options.search.enableFeatures.actions && isAction) {
                    const customResult = { type: 'custom', command: text };
                    firstResult = firstResult || customResult;
                    resultsBox.add(CustomCommandButton({ text }));
                }

                // 5. Show AI and web search options last
                if (searchConfig.features.aiSearch && options.search.enableFeatures.aiSearch) {
                    const aiResult = { type: 'ai', query: text };
                    firstResult = firstResult || aiResult;
                    resultsBox.add(AiButton({ text }));
                }
                if (searchConfig.features.webSearch && options.search.enableFeatures.webSearch) {
                    const webResult = { type: 'web', query: text };
                    firstResult = firstResult || webResult;
                    resultsBox.add(SearchButton({ text }));
                }

                // Show no results message if nothing found
                if (resultsBox.children.length === 0) {
                    resultsBox.add(NoResultButton());
                }

                resultsBox.show_all();

                // Store first result for Enter key handling
                entry._firstResult = firstResult;
            }).catch(console.error);
        },
    });

    // Add Enter key handler
    let lastEnterTime = 0;
    entry.connect('activate', () => {
        const currentTime = Date.now();
        if (currentTime - lastEnterTime < 500) return;
        lastEnterTime = currentTime;

        const firstResult = entry._firstResult;
        if (!firstResult) return;

        switch (firstResult.type) {
            case 'calculator':
                Utils.writeText(firstResult.result.toString());
                App.closeWindow('overview');
                break;
            case 'app':
                firstResult.app.launch();
                App.closeWindow('overview');
                break;
            case 'directory':
                execAsync(['xdg-open', firstResult.dir.path]).catch(console.error);
                App.closeWindow('overview');
                break;
            case 'file':
                execAsync(['xdg-open', firstResult.file.path]).catch(console.error);
                App.closeWindow('overview');
                break;
            case 'command':
                launchCustomCommand(firstResult.command);
                App.closeWindow('overview');
                break;
            case 'custom':
                launchCustomCommand(firstResult.command);
                App.closeWindow('overview');
                break;
            case 'ai':
                // Handle AI search
                App.closeWindow('overview');
                break;
            case 'web':
                execAsync(['xdg-open', `https://www.google.com/search?q=${encodeURIComponent(firstResult.query)}`]).catch(console.error);
                App.closeWindow('overview');
                break;
        }
    });

    return Widget.Box({
        vertical: true,
        children: [
            Widget.Box({
                hpack: 'center',
                hexpand: true,
                children: [
                    entry,
                    Widget.Box({
                        className: 'overview-search-icon-box',
                        setup: box => box.pack_start(entryPromptRevealer, true, true, 0),
                    }),
                    entryIcon,
                ]
            }),
            // overviewContent,
            resultsRevealer,
        ],
        setup: (self) => self
            .hook(App, (_b, name, visible) => {
                if (name === 'overview' && !visible) {
                    resultsBox.children = [];
                    entry.set_text('');
                }
            })
            .on('key-press-event', (widget, event) => {
                const keyval = event.get_keyval()[1];
                const modstate = event.get_state()[1];

                if (checkKeybind(event, options.keybinds.overview.altMoveLeft))
                    entry.set_position(Math.max(entry.get_position() - 1, 0));
                else if (checkKeybind(event, options.keybinds.overview.altMoveRight))
                    entry.set_position(Math.min(entry.get_position() + 1, entry.get_text().length));
                else if (checkKeybind(event, options.keybinds.overview.deleteToEnd)) {
                    const pos = entry.get_position();
                    entry.set_text(entry.get_text().slice(0, pos));
                    entry.set_position(pos);
                }
                else if (!(modstate & Gdk.ModifierType.CONTROL_MASK) && 
                    keyval >= 32 && keyval <= 126 && widget !== entry) {
                    Utils.timeout(1, () => {
                        entry.grab_focus();
                        entry.set_text(entry.text + String.fromCharCode(keyval));
                        entry.set_position(-1);
                    });
                }
            }),
    });
};
