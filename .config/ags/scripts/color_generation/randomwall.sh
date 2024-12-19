#!/usr/bin/env bash

XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
CONFIG_DIR="$XDG_CONFIG_HOME/ags"

# Fallback function to prevent wallpaper from changing
fallback() {
    echo "No valid image found. Wallpaper not changed."
    exit 1
}

# Find a random image file with valid extensions
imgpath=$(fd . $HOME/Pictures/Wallpapers/ -e jpg -e jpeg -e png -e gif -E '**/thumbnails/**' | shuf -n 1)

# If no valid image file is found, call the fallback function
[ -z "$imgpath" ]

# Run the switchwall.sh script with the selected image
$CONFIG_DIR/scripts/color_generation/switchwall.sh "$imgpath" add
