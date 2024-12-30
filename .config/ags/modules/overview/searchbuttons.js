const { Gtk, Gdk } = imports.gi;
import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { execAsync, exec, readFile, writeFile } = Utils;
import { searchItem } from './searchitem.js';
import { execAndClose, couldBeMath, launchCustomCommand, expandTilde, findDirectories } from './miscfunctions.js';
import GeminiService from '../../services/gemini.js';
import ChatGPTService from '../../services/gpt.js';

// Read config directly
const configPath = `${App.configDir}/modules/.configuration/user_options.default.json`;
const readConfig = () => {
    try {
        return JSON.parse(Utils.readFile(configPath));
    } catch (error) {
        print('Error reading config:', error);
        return { animations: {}, search: {}, ai: {} };
    }
};

const options = readConfig();
const animations = options.animations || {};
const searchConfig = options.search || {};
const aiConfig = options.ai || {};

let lastOpenTime = 0;
const DEBOUNCE_DELAY = 300; // ms

function shouldPreventDoubleOpen() {
    const now = Date.now();
    if (now - lastOpenTime < DEBOUNCE_DELAY) {
        return true;
    }
    lastOpenTime = now;
    return false;
}

export const NoResultButton = () => searchItem({
    materialIconName: 'Error',
    name: "Search invalid",
    content: "No results found!",
    onActivate: () => App.closeWindow('overview'),
});

export const DirectoryButton = ({ parentPath, name, type, icon }) => {
    const actionText = Widget.Revealer({
        revealChild: false,
        transition: "crossfade", 
        transitionDuration: animations.durationLarge || 300,
        child: Widget.Label({
            className: 'overview-search-results-txt txt txt-small txt-action',
            label: 'Open',
        })
    });
    
    const actionTextRevealer = Widget.Revealer({
        revealChild: false,
        transition: "slide_left",
        transitionDuration: animations.durationSmall || 150,
        child: actionText,
    });

    return Widget.Button({
        className: 'overview-search-result-btn',
        onClicked: () => {
            if (shouldPreventDoubleOpen()) return;
            App.closeWindow('overview');
            execAsync(['xdg-open', `${parentPath}/${name}`]).catch(print);
        },
        child: Widget.Box({
            children: [
                Widget.Box({
                    vertical: false,
                    children: [
                        Widget.Box({
                            className: 'overview-search-results-icon',
                            homogeneous: true,
                            child: Widget.Icon({ icon }),
                        }),
                        Widget.Label({
                            className: 'overview-search-results-txt txt txt-norm',
                            label: name,
                        }),
                        Widget.Box({ hexpand: true }),
                        actionTextRevealer,
                    ]
                })
            ]
        }),
        setup: (self) => self
            .on('focus-in-event', () => {
                actionText.revealChild = true;
                actionTextRevealer.revealChild = true;
            })
            .on('focus-out-event', () => {
                actionText.revealChild = false;
                actionTextRevealer.revealChild = false;
            }),
    })
}

export const CalculationResultButton = ({ result, text }) => searchItem({
    materialIconName: 'calculate',
    name: `= ${result}`,
    content: text,
    onActivate: () => {
        Utils.writeText(result.toString());
        App.closeWindow('overview');
    },
});

export const DesktopEntryButton = (app) => {
    const actionText = Widget.Label({
        className: 'overview-search-results-txt txt txt-small txt-action',
        label: 'Launch (Enter)',
    });

    const getPinStatus = () => {
        const config = readConfig();
        const appName = app.name.toLowerCase();
        return config.dock?.pinnedApps?.includes(appName) || false;
    };

    const pinText = Widget.Label({
        className: 'overview-search-results-txt txt txt-small txt-action',
        label: `${getPinStatus() ? 'Unpin' : 'Pin'} (Shift+Enter)`,
    });

    const actionTextRevealer = Widget.Revealer({
        revealChild: false,
        transition: "slide_left",
        transitionDuration: animations.durationSmall || 150,
        child: Widget.Box({
            children: [
                actionText,
                Widget.Label({
                    className: 'overview-search-results-txt txt txt-small txt-action',
                    label: ' | ',
                }),
                pinText,
            ],
        }),
    });

    const isFile = app.iconName !== null && app.iconName.startsWith('~') || app.iconName.startsWith('.') || app.iconName.startsWith('/');
    const css = `background-size:cover;background-image:${isFile ? `url('${expandTilde(app.iconName)}')` : 'none'};`;

    const togglePin = () => {
        try {
            const config = readConfig();
            if (!config.dock) config.dock = {};
            if (!config.dock.pinnedApps) config.dock.pinnedApps = [];
            
            const appName = app.name.toLowerCase();
            const index = config.dock.pinnedApps.indexOf(appName);
            
            if (index > -1) {
                // Unpin
                config.dock.pinnedApps.splice(index, 1);
                pinText.label = 'Pin (Shift+Enter)';
            } else {
                // Pin
                config.dock.pinnedApps.push(appName);
                pinText.label = 'Unpin (Shift+Enter)';
            }
            
            Utils.writeFile(JSON.stringify(config, null, 2), configPath);
            execAsync(['bash', '-c', 'ags -q; ags']).catch(print);
        } catch (error) {
            print('Error toggling pin:', error);
        }
    };

    return Widget.Button({
        className: 'overview-search-result-btn',
        child: Widget.Box({
            children: [
                Widget.Box({
                    vertical: false,
                    children: [
                        Widget.Box({
                            className: 'overview-search-results-icon',
                            homogeneous: true,
                            css: css,
                            children: isFile ? [] : [Widget.Icon ({
                                icon: app.iconName
                            })],
                        }),
                        Widget.Label({
                            className: 'overview-search-results-txt txt txt-norm',
                            label: app.name,
                        }),
                        Widget.Box({ hexpand: true }),
                        actionTextRevealer,
                    ]
                })
            ]
        }),
        setup: (self) => self
            .on('focus-in-event', () => {
                actionTextRevealer.revealChild = true;
            })
            .on('focus-out-event', () => {
                actionTextRevealer.revealChild = false;
            })
            .on('key-press-event', (_, event) => {
                if (event.get_state()[1] & Gdk.ModifierType.SHIFT_MASK) {
                    togglePin();
                    App.closeWindow('overview');
                    return true;
                }
                return false;
            })
            .on('clicked', () => {
                if (shouldPreventDoubleOpen()) return;
                App.closeWindow('overview');
                app.launch();
            }),
    });
};

export const ExecuteCommandButton = ({ command, terminal = false }) => searchItem({
    materialIconName: terminal ? 'terminal' : 'settings_b_roll',
    name: 'Run command',
    actionName: `Execute ${terminal ? 'in terminal' : ''}`,
    content: command,
    onActivate: () => execAndClose(command, terminal),
    extraClassName: 'techfont',
})

export const CustomCommandButton = ({ text = '' }) => searchItem({
    materialIconName: 'settings_suggest',
    name: 'Action',
    actionName: 'Run',
    content: text,
    onActivate: () => {
        App.closeWindow('overview');
        launchCustomCommand(text);
    },
});

export const SearchButton = ({ text }) => searchItem({
    materialIconName: 'search',
    name: "Search",
    content: `Search the web for "${text}"`,
    onActivate: () => {
        execAsync(['xdg-open', `https://www.google.com/search?q=${encodeURIComponent(text)}`]).catch(print);
        App.closeWindow('overview');
    },
});

export const AiButton = ({ text }) => searchItem({
    materialIconName: 'psychology',
    name: "Ask AI",
    content: `Ask AI about "${text}"`,
    onActivate: () => {
        if (aiConfig.provider === 'gemini') {
            GeminiService.ask(text);
        } else {
            ChatGPTService.ask(text);
        }
        App.closeWindow('overview');
    },
});

export const GoToDirectoryButton = ({ text }) => {
    const cleanText = text.replace(/^[/~]/, '').trim();
    return searchItem({
        materialIconName: 'folder_open',
        name: "Go to Directory",
        content: `Search for directory: "${cleanText}"`,
        onActivate: () => {
            if (shouldPreventDoubleOpen()) return;
            App.closeWindow('overview');
            findDirectories(cleanText).then(results => {
                if (results.length > 0) {
                    const firstResult = results[0];
                    execAsync(['xdg-open', `${firstResult.parentPath}/${firstResult.name}`]).catch(print);
                }
            }).catch(print);
        },
    });
};
