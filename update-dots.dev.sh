#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
export base="$(pwd)"

start_time=$(date +%s%N)
source ./scriptdata/environment-variables

GREEN="\033[0;32m"
RED="\033[0;31m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RESET="\033[0m"

config_folders=(".config")
excludes=(".config/hypr/custom" ".config/ags/user_options.js" ".config/hypr/hyprland.conf")

# Parse command line arguments
RESET_AGS_CONFIG=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --reset-ags-config|-r)
            RESET_AGS_CONFIG=true
            shift
            ;;
        --help|-h)
            echo -e "\n${CYAN}Usage: $0 [OPTIONS]${RESET}"
            echo -e "\n${CYAN}Description:${RESET}"
            echo -e "  Updates your dotfiles while preserving your personal configurations."
            echo -e "  Automatically reloads Hyprland and AGS after the update."
            echo -e "\n${CYAN}Options:${RESET}"
            echo -e "  ${YELLOW}--reset-ags-config, -r${RESET}  Reset AGS settings to default"
            echo -e "  ${YELLOW}--help, -h${RESET}              Show this help message\n"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${RESET}"
            exit 1
            ;;
    esac
done

get_destination() {
    local file="$1"
    if [ "$(echo $file | cut -d/ -f1)" = ".config" ]; then
        printf "$XDG_CONFIG_HOME/$(echo $file | cut -d/ -f2-)"
    elif [ "$(echo $file | cut -d/ -f1-2)" = ".local/bin" ]; then
        printf "$XDG_BIN_HOME/$(echo $file | cut -d/ -f3-)"
    fi
}

file_in_excludes() {
    local file="$1"
    for exc in "${excludes[@]}"; do
        if [[ $file == "$exc"* ]]; then
            return 0
        fi
    done
    return 1
}

echo -e "${CYAN}Starting configuration update...${RESET}"
echo -e "${YELLOW}The following files and folders will be preserved:${RESET} ${excludes[@]}"

# Backup excluded files
temp_dir="/tmp/dots_backup"
for exc in "${excludes[@]}"; do
    if [ -e "$(get_destination "$exc")" ]; then
        echo -e "${BLUE}Saving ${exc}...${RESET}"
        mkdir -p "$temp_dir/$(dirname "$exc")"
        cp -r "$(get_destination "$exc")" "$temp_dir/$(dirname "$exc")/"
    fi
done

echo -e "${CYAN}Removing old configs...${RESET}"
for dir in "$base/.config"/*; do
    if [ -d "$dir" ]; then
        config_name=$(basename "$dir")
        target_dir="$XDG_CONFIG_HOME/$config_name"
        if [ -d "$target_dir" ]; then
            echo -e "${RED}Removing $target_dir${RESET}"
            rm -rf "$target_dir"
        fi
    fi
done

if [ -d "$temp_dir" ]; then
    echo -e "${BLUE}Restoring saved files...${RESET}"
    for exc in "${excludes[@]}"; do
        if [ -e "$temp_dir/$exc" ]; then
            mkdir -p "$(dirname "$(get_destination "$exc")")"
            cp -r "$temp_dir/$exc" "$(get_destination "$exc")"
        fi
    done
    rm -rf "$temp_dir"
fi

echo -e "${CYAN}Copying new files...${RESET}"

# Only reset AGS config if flag is provided
if [ "$RESET_AGS_CONFIG" = true ]; then
    echo -e "${YELLOW}Resetting AGS config...${RESET}"
    mkdir -p "$HOME/.ags"
    cp -f "$base/.config/ags/modules/.configuration/user_options.default.json" "$HOME/.ags/config.json"
else
    echo -e "${BLUE}Skipping AGS config reset${RESET}"
fi

mkdir -p "$XDG_BIN_HOME"
if [ -d "$base/.local/bin" ]; then
    cp -f "$base/.local/bin/"* "$XDG_BIN_HOME/"
    chmod +x "$XDG_BIN_HOME"/*
fi

for folder in "${config_folders[@]}"; do
    find "$folder" -type f -print0 | while IFS= read -r -d '' file; do
        if ! file_in_excludes "$file"; then
            destination="$(get_destination "$file")"
            echo -e "${BLUE}Copying \"$file\" to \"$destination\" ...${RESET}"
            mkdir -p "$(dirname "$destination")"
            cp -f "$base/$file" "$destination"
        else
            echo -e "${YELLOW}Skipping $file${RESET}"
        fi
    done
done

wait
clear

nohup hyprctl reload >/dev/null 2>&1 &
echo -e "${GREEN}Hyprland reloaded${RESET}"

echo -e "${CYAN}Restarting AGS...${RESET}"
ags -q >/dev/null 2>&1

temp_log="/tmp/ags_restart.log"
touch "$temp_log"
ags > "$temp_log" 2>&1 &

timeout=10
while [ $timeout -gt 0 ]; do
    if ags_load_time=$(grep "AGS loaded in" "$temp_log" | tail -n 1 | sed 's/.*AGS loaded in \([0-9.]*\)s/\1/'); then
        if [ ! -z "$ags_load_time" ]; then
            break
        fi
    fi
    sleep 0.5
    timeout=$((timeout - 1))
done

if [ $timeout -gt 0 ]; then
    echo -e "${GREEN}AGS restarted in ${CYAN}${ags_load_time}${GREEN} seconds${RESET}"
else
    echo -e "${RED}Timeout waiting for AGS to load${RESET}"
fi

rm -f "$temp_log"

end_time=$(date +%s%N)
execution_time=$(LC_NUMERIC=C printf "%.3f" $(echo "($end_time - $start_time) / 1000000000" | bc -l))
echo -e "\n${CYAN}✨ Configuration update completed:${RESET}"
echo -e "${GREEN}├─${RESET} Total time: ${CYAN}${execution_time}s${RESET}"
echo -e "${GREEN}└─${RESET} Status: ${GREEN}Done${RESET}\n"