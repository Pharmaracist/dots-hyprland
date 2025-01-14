const { Gio, GLib } = imports.gi;
import App from 'resource:///com/github/Aylur/ags/app.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { execAsync, exec } = Utils;
import Todo from "../../services/todo.js";
import { darkMode } from '../.miscutils/system.js';
import Hyprland from 'resource:///com/github/Aylur/ags/service/hyprland.js';
import userOptions from '../.configuration/user_options.js';
import { currentShellMode, updateMonitorShellMode } from '../../variables.js';

export const hasUnterminatedBackslash = str => /\\+$/.test(str);

export function launchCustomCommand(command) {
    const [cmd, ...args] = command.toLowerCase().split(' ');
    const execScript = (script, params = '') => 
        execAsync([`bash`, `-c`, `${App.configDir}/scripts/${script}`, params]).catch(print);
        
    const commands = {
        '>raw': () => {
            Utils.execAsync('hyprctl -j getoption input:accel_profile')
                .then(output => {
                    const value = JSON.parse(output).str.trim();
                    execAsync(['bash', '-c', 
                        `hyprctl keyword input:accel_profile '${value != "[[EMPTY]]" && value != "" ? "[[EMPTY]]" : "flat"}'`
                    ]).catch(print);
                });
        },
        '>bar': () => {
            if (!args[0]) return;
            const mode = parseInt(args[0]);
            if (isNaN(mode)) return;
            
            const monitor = Hyprland.active.monitor.id || 0;
            updateMonitorShellMode(currentShellMode, monitor, mode.toString());
        },
        '>bard': () => {
            if (!args[0]) return;
            const mode = parseInt(args[0]);
            if (isNaN(mode)) return;
            
            const configPath = GLib.get_home_dir() + '/.ags/config.json';
            
            // Update all monitors
            const monitors = Hyprland.monitors;
            monitors.forEach((_, index) => {
                updateMonitorShellMode(currentShellMode, index, mode.toString());
            });

            // Update config.json for persistence
            execAsync(['bash', '-c', `
                if [ -f "${configPath}" ]; then
                    # Update existing config
                    jq '.bar.modes = "${mode}"' "${configPath}" > "${configPath}.tmp" && mv "${configPath}.tmp" "${configPath}"
                else
                    # Create new config
                    mkdir -p "$(dirname "${configPath}")" &&
                    echo '{"bar":{"position":"top","modes":"${mode}"}}' > "${configPath}"
                fi
            `]).catch(print);
        },
        '>img': () => execScript('color_generation/switchwall.sh', '&'),
        '>color': () => {
            if (!args[0]) execScript('color_generation/switchcolor.sh --pick', '&');
            else if (args[0][0] === '#') execScript(`color_generation/switchcolor.sh "${args[0]}"`, '&');
        },
        '>light': () => darkMode.value = false,
        '>dark': () => darkMode.value = true,
        '>badapple': () => {
            const userStateDir = GLib.get_user_state_dir();
            execAsync([`bash`, `-c`, 
                `mkdir -p ${userStateDir}/ags/user && 
                 sed -i "3s/.*/monochrome/" ${userStateDir}/ags/user/colormode.txt`])
                .then(() => execScript('color_generation/switchcolor.sh'))
                .catch(print);
        },
        '>adw': () => execScript('color_generation/switchcolor.sh "#3584E4" --no-gradience', '&'),
        '>adwaita': () => execScript('color_generation/switchcolor.sh "#3584E4" --no-gradience', '&'),
        '>grad': () => execScript('color_generation/switchcolor.sh - --yes-gradience', '&'),
        '>gradience': () => execScript('color_generation/switchcolor.sh - --yes-gradience', '&'), 
        '>nograd': () => execScript('color_generation/switchcolor.sh - --no-gradience', '&'),
        '>nogradience': () => execScript('color_generation/switchcolor.sh - --no-gradience', '&'),
        '>material': () => {
            const userStateDir = GLib.get_user_state_dir();
            execAsync([`bash`, `-c`, 
                `mkdir -p ${userStateDir}/ags/user && 
                 echo "material" > ${userStateDir}/ags/user/colorbackend.txt`])
                .then(() => execScript('color_generation/switchwall.sh --noswitch'))
                .catch(print);
        },
        '>pywal': () => {
            const userStateDir = GLib.get_user_state_dir();
            execAsync([`bash`, `-c`, 
                `mkdir -p ${userStateDir}/ags/user && 
                 echo "pywal" > ${userStateDir}/ags/user/colorbackend.txt`])
                .then(() => execScript('color_generation/switchwall.sh --noswitch'))
                .catch(print);
        },
        '>todo': () => Todo.add(args.join(' ')),
        '>shutdown': () => execAsync(['bash', '-c', 'systemctl poweroff || loginctl poweroff']).catch(print),
        '>reboot': () => execAsync(['bash', '-c', 'systemctl reboot || loginctl reboot']).catch(print),
        '>sleep': () => execAsync(['bash', '-c', 'systemctl suspend || loginctl suspend']).catch(print),
        '>logout': () => execAsync(['bash', '-c', 'pkill Hyprland || pkill sway']).catch(print),
        '>addgpt': () => {
            if (!args || args.length < 1) {
                print("Usage: >addgpt <model_name> [provider]");
                return;
            }

            const modelName = args[0];
            // If provider not provided, use model name as provider (lowercase)
            const provider = args[1] || modelName.toLowerCase().replace(/[^a-z0-9]/g, '-');

            // Always use OpenRouter settings
            const baseUrl = "https://openrouter.ai/api/v1/chat/completions";
            const keyGetUrl = "https://openrouter.ai/keys";

            // Prepare model config
            const modelConfig = {
                name: modelName,
                logo_name: "openrouter-symbolic",
                description: `${modelName} via OpenRouter`,
                base_url: baseUrl,
                key_get_url: keyGetUrl,
                key_file: "openrouter_key.txt",  // Always use OpenRouter key
                model: modelName
            };

            try {
                // Update user_options.default.json
                const defaultConfigPath = GLib.get_home_dir() + '/.ags/config.json';
                let defaultConfig = JSON.parse(Utils.readFile(defaultConfigPath));
                
                // Ensure the path exists
                if (!defaultConfig.sidebar) defaultConfig.sidebar = {};
                if (!defaultConfig.sidebar.ai) defaultConfig.sidebar.ai = {};
                if (!defaultConfig.sidebar.ai.__custom) defaultConfig.sidebar.ai.__custom = ["extraGptModels"];
                if (!defaultConfig.sidebar.ai.extraGptModels) defaultConfig.sidebar.ai.extraGptModels = {};
                
                // Add the model
                defaultConfig.sidebar.ai.extraGptModels[provider] = modelConfig;
                Utils.writeFile(JSON.stringify(defaultConfig, null, 2), defaultConfigPath);

                print(`Added OpenRouter model: ${modelName} (provider: ${provider})`);
            } catch (error) {
                print(`Error adding GPT model: ${error.message}`);
            }
        },
        '>': () => {}
    };

    commands[cmd]?.();
}

export const execAndClose = (command, terminal) => {
    App.closeWindow('overview');
    if (terminal) {
        execAsync(['bash', '-c', `${userOptions.value.apps.terminal} fish -C "${command}"`, '&']).catch(print);
    } else {
        execAsync(command).catch(print);
    }
};

export const couldBeMath = str => /^[0-9.+*/-]/.test(str);

export const expandTilde = path => path.startsWith('~') ? GLib.get_home_dir() + path.slice(1) : path;

const getFileIcon = fileInfo => fileInfo.get_icon()?.get_names()[0] || 'text-x-generic';

export function ls({ path = '~', silent = false }) {
    try {
        const expandedPath = expandTilde(path).replace(/\/$/, '');
        const folder = Gio.File.new_for_path(expandedPath);
        const enumerator = folder.enumerate_children('standard::*', Gio.FileQueryInfoFlags.NONE, null);
        
        const contents = [];
        let fileInfo;
        while ((fileInfo = enumerator.next_file(null))) {
            const fileName = fileInfo.get_display_name();
            const isDirectory = fileInfo.get_file_type() === Gio.FileType.DIRECTORY;
            
            contents.push({
                parentPath: expandedPath,
                name: fileName,
                type: isDirectory ? 'folder' : fileName.split('.').pop(),
                icon: getFileIcon(fileInfo)
            });
        }
        
        return contents.sort((a, b) => {
            const aIsFolder = a.type === 'folder';
            const bIsFolder = b.type === 'folder';
            return aIsFolder === bIsFolder ? a.name.localeCompare(b.name) : bIsFolder ? 1 : -1;
        });
    } catch (e) {
        if (!silent) console.log(e);
        return [];
    }
}
