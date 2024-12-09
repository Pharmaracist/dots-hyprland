#!/usr/bin/env bash

XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
CONFIG_DIR="$XDG_CONFIG_HOME/ags"
LINK_DIR="$HOME/.cache/ags/user/generated"
LINK_PATH="$LINK_DIR/image_link"

# Function to set the wallpaper
switch() {
    local imgpath=$1

    # Get screen and cursor position details
    read scale screenx screeny screensizey < <(hyprctl monitors -j | jq '.[] | select(.focused) | .scale, .x, .y, .height' | xargs)

    # Get cursor position and adjust for screen scaling
    cursorposx=$(hyprctl cursorpos -j | jq '.x' 2>/dev/null || echo 960)
    cursorposx=$(bc <<< "scale=0; ($cursorposx - $screenx) * $scale / 1")
    cursorposy=$(hyprctl cursorpos -j | jq '.y' 2>/dev/null || echo 540)
    cursorposy=$(bc <<< "scale=0; ($cursorposy - $screeny) * $scale / 1")
    cursorposy_inverted=$((screensizey - cursorposy))

    # Check if image path is provided
    [ -z "$imgpath" ] && exit 1

    # Set wallpaper with adjusted animation parameters
    swww img "$imgpath" --transition-step 100 --transition-fps 120 \
        --transition-type grow --transition-angle 30 --transition-duration 0.5 \
        --transition-pos "$cursorposx,$cursorposy_inverted" >/dev/null 2>&1
}

# Function to generate and apply colors
generate_colors() {
    local imgpath=$1
    [ -z "$imgpath" ] && return 1

    # Silent execution of color generation commands
    "$CONFIG_DIR"/scripts/color_generation/colorgen.sh "$imgpath" --apply --smart >/dev/null 2>&1
    wal -s -i"$imgpath" --saturate 0.8 >/dev/null 2>&1

    # Refresh applications asynchronously, ensuring all output is suppressed
    (pywal-discord -p ~/.config/vesktop/themes >/dev/null 2>&1 &)
    (wal-telegram >/dev/null 2>&1 &)
    (pywalfox update >/dev/null 2>&1 &)
    (pywal-spicetify "default" >/dev/null 2>&1 &)
}

# Execute the custom script in /home/pharmaracist/zed-theme-wal
execute_custom_script() {
    local script_path="/home/pharmaracist/zed-theme-wal/apply_theme.sh"
    if [ -f "$script_path" ]; then
        bash "$script_path" >/dev/null 2>&1
    else
        echo "Script $script_path not found."
    fi
}

# Function to remove old symbolic link if it exists
remove_old_link() {
    if [ -L "$LINK_PATH" ]; then
        rm -f "$LINK_PATH" >/dev/null 2>&1
    fi
}

# Main Script Logic
if [ "$1" == "--noswitch" ]; then
    imgpath=$(swww query | awk -F 'image: ' '{print $2}')
    [ -z "$imgpath" ] && exit 1
elif [ -n "$1" ]; then
    switch "$1"
    generate_colors "$1"

    # Remove old symbolic link if it exists
    remove_old_link

    # Extract the file extension from the image path
    img_extension="${1##*.}"

    # Create symbolic link for the image with the correct extension
    ln -sf "$1" "$LINK_PATH.$img_extension" >/dev/null 2>&1

    # Execute the custom script after processing
    execute_custom_script
else
    # Prompt user to select an image
    cd "$(xdg-user-dir PICTURES)" || exit 1
    imgpath=$(yad --width 1200 --height 800 --file --add-preview --large-preview --title="Choose wallpaper")
    [ -n "$imgpath" ] && switch "$imgpath" && generate_colors "$imgpath" && remove_old_link && ln -sf "$imgpath" "$LINK_PATH.${imgpath##*.}" >/dev/null 2>&1

    # Execute the custom script after processing
    execute_custom_script
fi
