const { Gio, GLib } = imports.gi;
import App from 'resource:///com/github/Aylur/ags/app.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { execAsync, exec } = Utils;
import Todo from "../../services/todo.js";
import { darkMode } from '../.miscutils/system.js';
import Timer from '../../services/timers.js';
import Media from '../../services/media.js';

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
        '>yt': () => {
            if (!args[0]) return;
            const searchQuery = args.join(' ');
            execAsync(['pkill', 'mpv']).catch(print);
            execAsync(['bash', '-c', `python3 -c "
from ytmusicapi import YTMusic
ytm = YTMusic()
results = ytm.search('${searchQuery}', filter='songs', limit=1)
if results:
    video_id = results[0]['videoId']
    print(f'https://music.youtube.com/watch?v={video_id}')
"`]).then(url => {
                if (url.trim()) {
                    execAsync(['mpv', '--no-video', url.trim()]).catch(print);
                }
            }).catch(print);
        },
        '>ytd': () => {
            if (!args[0]) return;
            const searchQuery = args.join(' ');
            execAsync(['bash', '-c', `python3 -c "
from ytmusicapi import YTMusic;
ytm = YTMusic()
results = ytm.search('${searchQuery}', filter='songs', limit=1)
if results:
    video_id = results[0]['videoId']
    title = results[0]['title']
    print(f'https://music.youtube.com/watch?v={video_id}\\n{title}')
"`]).then(output => {
                const [url, title] = output.trim().split('\n');
                if (url) {
                    const musicDir = GLib.get_home_dir() + '/Music';
                    execAsync(['pkill', 'mpv']).catch(print);
                    execAsync(['notify-send', `Downloading "${title}"`, 'Starting download...']).catch(print);
                    execAsync(['yt-dlp', 
                        '--extract-audio',
                        '--audio-format', 'mp3',
                        '--audio-quality', '0',
                        '--output', `${musicDir}/%(title)s.%(ext)s`,
                        url.trim()
                    ]).then(() => {
                        execAsync(['mpv', '--no-video', url.trim()]).catch(print);
                        execAsync(['notify-send', `Downloaded "${title}"`, 'Saved to Music folder']).catch(print);
                    }).catch(print);
                }
            }).catch(print);
        },
        '>yta': () => {
            if (!args[0]) return;
            const searchQuery = args.join(' ');
            execAsync(['pkill', 'mpv']).catch(print);
            execAsync(['bash', '-c', `python3 -c "
from ytmusicapi import YTMusic
ytm = YTMusic()
results = ytm.search('${searchQuery}', filter='songs', limit=10)
if results:
    for result in results:
        video_id = result['videoId']
        print(f'https://music.youtube.com/watch?v={video_id}')
"`]).then(urls => {
                const playlist = urls.trim().split('\n');
                if (playlist.length > 0) {
                    const socketPath = '/tmp/mpvsocket';
                    execAsync(['mpv', 
                        '--no-video', 
                        '--loop-playlist',
                        '--input-ipc-server=' + socketPath,
                        '--script=' + App.configDir + '/scripts/mpv-notify.lua',
                        ...playlist
                    ]).catch(print);
                }
            }).catch(print);
        },
        '>skip': () => {
            execAsync(['playerctl', 'next']).catch(print);
            execAsync(['bash', '-c', 'sleep 0.1 && playerctl position 0']).catch(print);
        },
        '>prev': () => {
            execAsync(['playerctl', 'previous']).catch(print);
        },
        '>pin': () => {
            if (!args[0]) return;
            const appName = args.join(' ').toLowerCase();
            const configPath = `${App.configDir}/modules/.configuration/user_options.default.json`;
            
            try {
                const config = JSON.parse(Utils.readFile(configPath));
                if (!config.dock) config.dock = {};
                if (!config.dock.pinnedApps) config.dock.pinnedApps = [];
                
                if (!config.dock.pinnedApps.includes(appName)) {
                    config.dock.pinnedApps.push(appName);
                    Utils.writeFile(JSON.stringify(config, null, 2), configPath);
                    execAsync(['bash', '-c', 'ags -q; ags']).catch(print);
                }
            } catch (error) {
                print('Error pinning app:', error);
            }
        },
        '>unpin': () => {
            if (!args[0]) return;
            const appName = args.join(' ').toLowerCase();
            const configPath = `${App.configDir}/modules/.configuration/user_options.default.json`;
            
            try {
                const config = JSON.parse(Utils.readFile(configPath));
                if (config.dock?.pinnedApps) {
                    const index = config.dock.pinnedApps.indexOf(appName);
                    if (index > -1) {
                        config.dock.pinnedApps.splice(index, 1);
                        Utils.writeFile(JSON.stringify(config, null, 2), configPath);
                        execAsync(['bash', '-c', 'ags -q; ags']).catch(print);
                    }
                }
            } catch (error) {
                print('Error unpinning app:', error);
            }
        },
        '>pins': () => {
            const configPath = `${App.configDir}/modules/.configuration/user_options.default.json`;
            
            // Read current config
            try {
                const contents = Utils.readFile(configPath);
                const config = JSON.parse(contents);
                const pinnedApps = config.dock?.pinnedApps || [];
                if (pinnedApps.length > 0) {
                    print('Pinned apps:', pinnedApps.join(', '));
                } else {
                    print('No apps are currently pinned');
                }
            } catch (error) {
                print('Error reading config:', error);
            }
        },
        '>tm': () => {
            if (!args[0]) return;
            
            let duration = args[0].toLowerCase();
            let seconds = 0;
            
            // Parse duration
            if (duration.endsWith('h')) {
                seconds = parseInt(duration) * 3600;
            } else if (duration.endsWith('m')) {
                seconds = parseInt(duration) * 60;
            } else {
                seconds = parseInt(duration) * 60; // Default to minutes if no unit specified
            }
            
            if (isNaN(seconds) || seconds <= 0) return;
            
            // Get timer name (rest of the arguments after duration)
            const timerName = args.slice(1).join(' ') || 'Timer';
            
            // Add timer to the service and start it
            const timerId = Timer.addTimer(timerName, seconds);
            Timer.startTimer(timerId);
            
            // Show notification that timer started
            execAsync(['notify-send', `${timerName} Started`, `Will complete in ${args[0]}`]).catch(print);
        },
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
        '>lofi': () => {
            const musicDir = GLib.get_home_dir() + '/Music';
            
            // Kill any existing mpv instance
            execAsync(['pkill', 'mpv']).catch(print);
            
            // Find all music files
            execAsync(['bash', '-c', `find "${musicDir}" -type f -iname "*.mp3" -o -iname "*.m4a" -o -iname "*.flac" -o -iname "*.opus"`])
                .then(files => {
                    if (!files.trim()) {
                        execAsync(['notify-send', 'No Music Found', 'No music files found in Music directory']).catch(print);
                        return;
                    }
                    
                    // Create a playlist file
                    const playlist = files.trim().split('\n');
                    const playlistFile = '/tmp/lofi_playlist.txt';
                    Utils.writeFile(playlist.join('\n'), playlistFile);
                    
                    // Start playing with mpv
                    execAsync([
                        'mpv',
                        '--no-video',
                        '--shuffle',
                        '--loop-playlist=inf',
                        '--playlist=' + playlistFile
                    ]).catch(print);
                    
                    execAsync(['notify-send', 'Lofi Started', 'Playing music in shuffle mode']).catch(print);
                })
                .catch(print);
        },
        '>dnd': () => {
            // Toggle dunst notifications
            execAsync(['dunstctl', 'is-paused']).then(output => {
                const isPaused = output.trim() === 'true';
                execAsync(['dunstctl', 'set-paused', (!isPaused).toString()]).then(() => {
                    execAsync(['notify-send', 
                        isPaused ? 'Notifications Enabled' : 'Notifications Disabled',
                        isPaused ? 'Do Not Disturb mode is off' : 'Do Not Disturb mode is on'
                    ]).catch(print);
                }).catch(print);
            }).catch(print);
        },
        '>weather': () => {
            // Update and show weather
            execAsync(['curl', 'wttr.in?format="%l:+%c+%t+%h+%w"']).then(weather => {
                execAsync(['notify-send', 'Weather', weather.trim().replace(/"/g, '')]).catch(print);
            }).catch(print);
        },
        '>ss': () => {
            // Take screenshot with Hyprland
            const screenshotDir = GLib.get_home_dir() + '/Pictures/Screenshots';
            execAsync(['mkdir', '-p', screenshotDir]).then(() => {
                const fileName = `Screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
                execAsync(['hyprshot', '-m', 'region', '-o', screenshotDir, '-f', fileName]).then(() => {
                    execAsync(['notify-send', 'Screenshot Taken', `Saved to ${screenshotDir}/${fileName}`]).catch(print);
                }).catch(print);
            }).catch(print);
        },
        '>ssf': () => {
            // Take full screenshot with Hyprland
            const screenshotDir = GLib.get_home_dir() + '/Pictures/Screenshots';
            execAsync(['mkdir', '-p', screenshotDir]).then(() => {
                const fileName = `Screenshot_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
                execAsync(['hyprshot', '-m', 'output', '-o', screenshotDir, '-f', fileName]).then(() => {
                    execAsync(['notify-send', 'Screenshot Taken', `Saved to ${screenshotDir}/${fileName}`]).catch(print);
                }).catch(print);
            }).catch(print);
        },
        '>top': () => {
            // Show system resource usage
            execAsync(['bash', '-c', `
                cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%//')
                mem_usage=$(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
                disk_usage=$(df -h / | awk 'NR==2{print $5}')
                notify-send "System Resources" "CPU: ${cpu_usage}%\nMemory: ${mem_usage}\nDisk: ${disk_usage}"
            `]).catch(print);
        },
        '>todo': () => {
            // Add a quick todo
            if (!args[0]) return;
            const todo = args.join(' ');
            Todo.addTodo(todo);
            execAsync(['notify-send', 'Todo Added', todo]).catch(print);
        },
        '>net': () => {
            // Show network info
            execAsync(['bash', '-c', `
                wifi_name=$(iwgetid -r || echo "Not connected")
                ip_addr=$(ip -4 addr show | grep -oP '(?<=inet\\s)\\d+(\\.\\d+){3}' | grep -v '127.0.0.1' | head -n1 || echo "No IP")
                notify-send "Network Info" "WiFi: $wifi_name\nIP: $ip_addr"
            `]).catch(print);
        },
        '>vol': () => {
            // Quick volume control
            if (!args[0]) return;
            const vol = args[0];
            if (vol === 'mute' || vol === 'm') {
                execAsync(['wpctl', 'set-mute', '@DEFAULT_AUDIO_SINK@', 'toggle']).catch(print);
            } else {
                const volume = parseInt(vol);
                if (!isNaN(volume) && volume >= 0 && volume <= 100) {
                    execAsync(['wpctl', 'set-volume', '@DEFAULT_AUDIO_SINK@', (volume/100).toString()]).catch(print);
                }
            }
        },
        '>calc': () => {
            // Quick calculator
            if (!args[0]) return;
            const expr = args.join(' ');
            execAsync(['bash', '-c', `echo "${expr}" | bc -l`]).then(result => {
                execAsync(['notify-send', 'Calculator', `${expr} = ${result.trim()}`]).catch(print);
            }).catch(print);
        },
        '>kill': () => {
            // Kill a process by name
            if (!args[0]) return;
            const processName = args[0];
            execAsync(['pkill', '-f', processName]).then(() => {
                execAsync(['notify-send', 'Process Killed', `Terminated process: ${processName}`]).catch(print);
            }).catch(print);
        },
        '>disk': () => {
            // Show disk usage for home directory
            execAsync(['bash', '-c', `
                df -h ~ | awk 'NR==2{printf "Used: %s\\nFree: %s\\nTotal: %s", $3, $4, $2}'
            `]).then(usage => {
                execAsync(['notify-send', 'Disk Usage (Home)', usage]).catch(print);
            }).catch(print);
        },
        '>update': () => {
            // Check for system updates
            execAsync(['bash', '-c', `
                updates=$(checkupdates | wc -l)
                aur_updates=$(yay -Qua | wc -l)
                notify-send "System Updates" "Official: $updates updates\\nAUR: $aur_updates updates"
            `]).catch(print);
        },
        '>vpn': () => {
            // Toggle Wireguard VPN
            if (!args[0]) return;
            const vpnName = args[0];
            execAsync(['bash', '-c', `
                if wg show "${vpnName}" 2>/dev/null; then
                    sudo wg-quick down "${vpnName}"
                    notify-send "VPN" "${vpnName} disconnected"
                else
                    sudo wg-quick up "${vpnName}"
                    notify-send "VPN" "${vpnName} connected"
                fi
            `]).catch(print);
        },
        '>clean': () => {
            // Clean system
            execAsync(['bash', '-c', `
                rm -rf ~/.cache/thumbnails/*
                rm -rf ~/.local/share/Trash/files/*
                rm -rf ~/.local/share/Trash/info/*
                notify-send "System Cleaned" "Cleared thumbnails and trash"
                journalctl --vacuum-size=100M
                notify-send "System Cleaned" "Cleared old logs"
            `]).catch(print);
        },
        '>bt': () => {
            // Bluetooth quick controls
            if (!args[0]) {
                execAsync(['bluetoothctl', 'show']).then(info => {
                    execAsync(['notify-send', 'Bluetooth Status', info]).catch(print);
                }).catch(print);
                return;
            }
            const cmd = args[0];
            if (cmd === 'on') {
                execAsync(['bluetoothctl', 'power', 'on']).then(() => {
                    execAsync(['notify-send', 'Bluetooth', 'Powered on']).catch(print);
                }).catch(print);
            } else if (cmd === 'off') {
                execAsync(['bluetoothctl', 'power', 'off']).then(() => {
                    execAsync(['notify-send', 'Bluetooth', 'Powered off']).catch(print);
                }).catch(print);
            }
        },
        '>wall': () => {
            // Set random wallpaper from Pictures/Wallpapers
            const wallpaperDir = GLib.get_home_dir() + '/Pictures/Wallpapers';
            execAsync(['bash', '-c', `
                wall=$(find "${wallpaperDir}" -type f \\( -name "*.jpg" -o -name "*.png" \\) | shuf -n 1)
                if [ -n "$wall" ]; then
                    swww img "$wall" --transition-fps 60 --transition-type grow --transition-pos "$(hyprctl cursorpos)"
                    notify-send "Wallpaper" "Set new wallpaper: $(basename "$wall")"
                else
                    notify-send "Error" "No wallpapers found in ${wallpaperDir}"
                fi
            `]).catch(print);
        },
        '>mic': () => {
            // Microphone controls
            if (!args[0]) return;
            const cmd = args[0];
            if (cmd === 'mute' || cmd === 'm') {
                execAsync(['wpctl', 'set-mute', '@DEFAULT_AUDIO_SOURCE@', 'toggle']).catch(print);
            } else {
                const volume = parseInt(cmd);
                if (!isNaN(volume) && volume >= 0 && volume <= 100) {
                    execAsync(['wpctl', 'set-volume', '@DEFAULT_AUDIO_SOURCE@', (volume/100).toString()]).catch(print);
                }
            }
        },
        '>gpu': () => {
            // GPU information
            execAsync(['bash', '-c', `
                gpu_info=$(nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits)
                IFS=',' read -r temp util mem_used mem_total <<< "$gpu_info"
                notify-send "GPU Status" "Temperature: ${temp}°C\nUtilization: ${util}%\nMemory: ${mem_used}MB / ${mem_total}MB"
            `]).catch(() => {
                // Fallback for non-NVIDIA GPUs
                execAsync(['bash', '-c', `
                    gpu_info=$(glxinfo | grep "OpenGL renderer")
                    notify-send "GPU Info" "$gpu_info"
                `]).catch(print);
            });
        },
        '>wifi': () => {
            // WiFi management
            if (!args[0]) {
                execAsync(['bash', '-c', `
                    nmcli -t -f SSID,SIGNAL,RATE,SECURITY device wifi list | head -n 5 | 
                    awk -F: '{print $1 " (" $2"% " $3 " " $4 ")"}' | 
                    notify-send "Available WiFi Networks" "$(cat -)"
                `]).catch(print);
                return;
            }
            const cmd = args[0];
            if (cmd === 'off') {
                execAsync(['nmcli', 'radio', 'wifi', 'off']).then(() => {
                    execAsync(['notify-send', 'WiFi', 'Turned off']).catch(print);
                }).catch(print);
            } else if (cmd === 'on') {
                execAsync(['nmcli', 'radio', 'wifi', 'on']).then(() => {
                    execAsync(['notify-send', 'WiFi', 'Turned on']).catch(print);
                }).catch(print);
            }
        },
        '>monitor': () => {
            // Monitor management
            if (!args[0]) {
                execAsync(['bash', '-c', `hyprctl monitors`]).then(monitors => {
                    execAsync(['notify-send', 'Active Monitors', monitors]).catch(print);
                }).catch(print);
                return;
            }
            const cmd = args[0];
            if (cmd === 'mirror') {
                execAsync(['bash', '-c', `
                    primary=$(hyprctl monitors -j | jq -r '.[0].name')
                    secondary=$(hyprctl monitors -j | jq -r '.[1].name')
                    hyprctl keyword monitor "$secondary,mirror,$primary"
                    notify-send "Monitors" "Mirroring enabled"
                `]).catch(print);
            } else if (cmd === 'extend') {
                execAsync(['bash', '-c', `
                    primary=$(hyprctl monitors -j | jq -r '.[0].name')
                    secondary=$(hyprctl monitors -j | jq -r '.[1].name')
                    hyprctl keyword monitor "$secondary,auto,auto"
                    notify-send "Monitors" "Extended mode enabled"
                `]).catch(print);
            }
        },
        '>record': () => {
            // Screen recording
            if (!args[0]) {
                execAsync(['bash', '-c', `
                    pid=$(pgrep wf-recorder)
                    if [ -n "$pid" ]; then
                        notify-send "Recording" "Already recording (PID: $pid)"
                    else
                        notify-send "Recording" "Usage: >record start/stop"
                    fi
                `]).catch(print);
                return;
            }
            const recordingDir = GLib.get_home_dir() + '/Videos/Recordings';
            const cmd = args[0];
            
            if (cmd === 'start') {
                execAsync(['mkdir', '-p', recordingDir]).then(() => {
                    const fileName = `Recording_${new Date().toISOString().replace(/[:.]/g, '-')}.mp4`;
                    execAsync(['bash', '-c', `
                        wf-recorder -f "${recordingDir}/${fileName}" &
                        notify-send "Recording" "Started recording to ${fileName}"
                    `]).catch(print);
                }).catch(print);
            } else if (cmd === 'stop') {
                execAsync(['bash', '-c', `
                    pkill -SIGINT wf-recorder
                    notify-send "Recording" "Saved to ${recordingDir}"
                `]).catch(print);
            }
        },
        '>lock': () => {
            // Advanced screen lock
            execAsync(['bash', '-c', `
                swaylock \
                    --screenshots \
                    --clock \
                    --indicator \
                    --effect-blur 7x5 \
                    --effect-vignette 0.5:0.5 \
                    --grace 2 \
                    --fade-in 0.2
            `]).catch(print);
        },
        '>clip': () => {
            // Clipboard manager
            if (!args[0]) {
                execAsync(['bash', '-c', `
                    cliphist list | head -n 5 | 
                    notify-send "Recent Clipboard" "$(cat -)"
                `]).catch(print);
                return;
            }
            const cmd = args[0];
            if (cmd === 'clear') {
                execAsync(['bash', '-c', `
                    cliphist wipe
                    notify-send "Clipboard" "History cleared"
                `]).catch(print);
            }
        },
        '>night': () => {
            // Night light toggle
            execAsync(['bash', '-c', `
                if pgrep wlsunset; then
                    pkill wlsunset
                    notify-send "Night Light" "Disabled"
                else
                    wlsunset -T 4500 &
                    notify-send "Night Light" "Enabled (4500K)"
                fi
            `]).catch(print);
        },
        '>game': () => {
            // Gaming mode
            if (!args[0]) {
                execAsync(['notify-send', 'Gaming Mode', 'Usage: >game on/off']).catch(print);
                return;
            }
            const cmd = args[0];
            if (cmd === 'on') {
                execAsync(['bash', '-c', `
                    systemctl --user stop pipewire pipewire-pulse
                    hyprctl keyword misc:no_vfr true
                    hyprctl keyword misc:disable_autoreload true
                    notify-send "Gaming Mode" "Enabled - Audio services stopped, VFR disabled"
                `]).catch(print);
            } else if (cmd === 'off') {
                execAsync(['bash', '-c', `
                    systemctl --user start pipewire pipewire-pulse
                    hyprctl keyword misc:no_vfr false
                    hyprctl keyword misc:disable_autoreload false
                    notify-send "Gaming Mode" "Disabled - Normal settings restored"
                `]).catch(print);
            }
        },
        '>backup': () => {
            // Quick backup utility
            if (!args[0]) {
                execAsync(['notify-send', 'Backup', 'Usage: >backup [config/docs/pics/full]']).catch(print);
                return;
            }
            const backupDir = GLib.get_home_dir() + '/Backups';
            const date = new Date().toISOString().split('T')[0];
            const cmd = args[0];
            
            execAsync(['mkdir', '-p', backupDir]).then(() => {
                if (cmd === 'config') {
                    execAsync(['bash', '-c', `
                        tar -czf "${backupDir}/config_${date}.tar.gz" \
                            ~/.config/ags \
                            ~/.config/hypr \
                            ~/.config/waybar \
                            ~/.config/kitty \
                            ~/.config/nvim \
                            ~/.zshrc \
                            ~/.bashrc
                        notify-send "Backup" "Config files backed up to ${backupDir}/config_${date}.tar.gz"
                    `]).catch(print);
                } else if (cmd === 'docs') {
                    execAsync(['bash', '-c', `
                        tar -czf "${backupDir}/documents_${date}.tar.gz" ~/Documents
                        notify-send "Backup" "Documents backed up to ${backupDir}/documents_${date}.tar.gz"
                    `]).catch(print);
                } else if (cmd === 'pics') {
                    execAsync(['bash', '-c', `
                        tar -czf "${backupDir}/pictures_${date}.tar.gz" ~/Pictures
                        notify-send "Backup" "Pictures backed up to ${backupDir}/pictures_${date}.tar.gz"
                    `]).catch(print);
                } else if (cmd === 'full') {
                    execAsync(['bash', '-c', `
                        notify-send "Backup" "Starting full backup..."
                        tar -czf "${backupDir}/full_${date}.tar.gz" \
                            --exclude="node_modules" \
                            --exclude=".git" \
                            --exclude=".cache" \
                            --exclude=".local/share/Trash" \
                            ~/
                        notify-send "Backup" "Full backup completed: ${backupDir}/full_${date}.tar.gz"
                    `]).catch(print);
                }
            }).catch(print);
        },
        '>theme': () => {
            // Theme switcher
            if (!args[0]) {
                execAsync(['bash', '-c', `
                    themes=$(ls ~/.config/ags/themes)
                    notify-send "Available Themes" "$themes"
                `]).catch(print);
                return;
            }
            const theme = args[0];
            execAsync(['bash', '-c', `
                if [ -f ~/.config/ags/themes/${theme}.js ]; then
                    ln -sf ~/.config/ags/themes/${theme}.js ~/.config/ags/style.js
                    hyprctl reload
                    notify-send "Theme" "Switched to ${theme}"
                else
                    notify-send "Error" "Theme ${theme} not found"
                fi
            `]).catch(print);
        },
        '>power': () => {
            // Advanced power management
            if (!args[0]) {
                execAsync(['bash', '-c', `
                    cpu_gov=$(cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor)
                    bat_status=$(cat /sys/class/power_supply/BAT0/status)
                    bat_percent=$(cat /sys/class/power_supply/BAT0/capacity)
                    notify-send "Power Status" "CPU Governor: $cpu_gov\nBattery: $bat_status ($bat_percent%)"
                `]).catch(print);
                return;
            }
            const cmd = args[0];
            if (cmd === 'save') {
                execAsync(['bash', '-c', `
                    sudo cpupower frequency-set -g powersave
                    brightnessctl set 30%
                    hyprctl keyword misc:vfr true
                    notify-send "Power" "Power save mode enabled"
                `]).catch(print);
            } else if (cmd === 'perf') {
                execAsync(['bash', '-c', `
                    sudo cpupower frequency-set -g performance
                    brightnessctl set 100%
                    hyprctl keyword misc:vfr false
                    notify-send "Power" "Performance mode enabled"
                `]).catch(print);
            }
        },
        '>workspace': () => {
            // Workspace management
            if (!args[0]) {
                execAsync(['bash', '-c', `
                    hyprctl workspaces -j | jq -r '.[] | "Workspace \\(.id): \\(.windows) windows"' |
                    notify-send "Workspaces" "$(cat -)"
                `]).catch(print);
                return;
            }
            const cmd = args[0];
            if (cmd === 'save') {
                execAsync(['bash', '-c', `
                    layout=$(hyprctl activewindow -j | jq -r .workspace.layout)
                    windows=$(hyprctl clients -j | jq -r '.[] | select(.workspace.id == 1) | .class')
                    echo "Layout: $layout" > ~/.config/hypr/saved_workspace
                    echo "Windows:" >> ~/.config/hypr/saved_workspace
                    echo "$windows" >> ~/.config/hypr/saved_workspace
                    notify-send "Workspace" "Current layout saved"
                `]).catch(print);
            } else if (cmd === 'load') {
                execAsync(['bash', '-c', `
                    if [ -f ~/.config/hypr/saved_workspace ]; then
                        layout=$(grep "Layout:" ~/.config/hypr/saved_workspace | cut -d' ' -f2)
                        hyprctl keyword general:layout $layout
                        notify-send "Workspace" "Layout restored"
                    fi
                `]).catch(print);
            }
        },
        '>music': () => {
            // Advanced music control
            if (!args[0]) {
                execAsync(['bash', '-c', `
                    playerctl metadata --format "Now Playing: {{ artist }} - {{ title }}\nAlbum: {{ album }}\nPosition: {{ duration(position) }}/{{ duration(mpris:length) }}" |
                    notify-send "Music Status" "$(cat -)"
                `]).catch(print);
                return;
            }
            const cmd = args[0];
            if (cmd === 'like') {
                execAsync(['bash', '-c', `
                    song=$(playerctl metadata --format "{{ artist }} - {{ title }}")
                    echo "$song" >> ~/.config/favorite_songs
                    notify-send "Music" "Added to favorites: $song"
                `]).catch(print);
            } else if (cmd === 'lyrics') {
                execAsync(['bash', '-c', `
                    song=$(playerctl metadata --format "{{ artist }} - {{ title }}")
                    curl -s "https://api.lyrics.ovh/v1/$(echo $song | tr ' ' '+')" |
                    jq -r .lyrics |
                    notify-send "Lyrics" "$(cat -)"
                `]).catch(print);
            }
        },
        '>focus': () => {
            // Focus mode
            if (!args[0]) {
                execAsync(['notify-send', 'Focus Mode', 'Usage: >focus [on/off] [duration in minutes]']).catch(print);
                return;
            }
            const cmd = args[0];
            const duration = args[1] ? parseInt(args[1]) : 25; // Default 25 minutes
            
            if (cmd === 'on') {
                execAsync(['bash', '-c', `
                    notify-send "Focus Mode" "Enabled for ${duration} minutes"
                    hyprctl keyword animations:enabled 0
                    wpctl set-volume @DEFAULT_AUDIO_SINK@ 0
                    dunstctl set-paused true
                    (sleep ${duration}m && notify-send "Focus Mode" "Time's up!" && \
                     hyprctl keyword animations:enabled 1 && \
                     dunstctl set-paused false) &
                `]).catch(print);
            } else if (cmd === 'off') {
                execAsync(['bash', '-c', `
                    hyprctl keyword animations:enabled 1
                    dunstctl set-paused false
                    notify-send "Focus Mode" "Disabled"
                `]).catch(print);
            }
        },
        '>ytdl': () => {
            const socketPath = '/tmp/mpvsocket';
            const cacheDir = GLib.get_user_cache_dir() + '/ytmusic';
            execAsync(['bash', '-c', `
                mkdir -p "${cacheDir}"
                current_url=$(echo '{"command": ["get_property", "path"]}' | socat - ${socketPath} | jq -r .data)
                if [ ! -z "$current_url" ]; then
                    title=$(yt-dlp --get-title "$current_url")
                    notify-send "Downloading \"$title\"" "Starting download..."
                    cd "${cacheDir}" && yt-dlp \
                        --extract-audio \
                        --audio-format mp3 \
                        --audio-quality 0 \
                        --output "%(title)s.%(ext)s" \
                        "$current_url" && \
                    notify-send "Downloaded \"$title\"" "Saved to YouTube Music cache"
                else
                    notify-send "Error" "No media currently playing"
                fi
            `]).catch(print);
        },
    };

    commands[cmd]?.();
}

export const execAndClose = (command, terminal) => {
    App.closeWindow('overview');
    if (terminal) {
        execAsync(['bash', '-c', `${userOptions.asyncGet().apps.terminal} fish -C "${command}"`, '&']).catch(print);
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
