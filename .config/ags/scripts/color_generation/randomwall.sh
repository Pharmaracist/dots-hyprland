#!/usr/bin/env bash

WallSwitch="$HOME/.config/ags/scripts/color_generation/switchwall.sh"

# Fallback function to prevent wallpaper from changing
fallback() {
    echo "No valid image found. Wallpaper not changed."
    exit 1
}

# Find a random image file with valid extensions, excluding the .thumbnails folder
imgpath=$(find "$HOME/Pictures/Wallpapers/" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" \) ! -path "*/thumbnails/*" -print0 | shuf -zn 1 | xargs -0 -I {} echo {})

# If no valid image file is found, call the fallback function
[ -z "$imgpath" ] && fallback

# Run the switchwall.sh script with the selected image
$WallSwitch "$imgpath"
