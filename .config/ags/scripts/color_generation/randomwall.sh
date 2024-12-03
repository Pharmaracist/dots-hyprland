#!/usr/bin/env bash

XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
CONFIG_DIR="$XDG_CONFIG_HOME/ags"


# Find a random image file with valid extensions
imgpath=$(fd . $HOME/Pictures/Wallpapers/ -e jpg -e jpeg -e png -e gif | shuf -n 1)
# Run the switchwall.sh script with the selected image
$CONFIG_DIR/scripts/color_generation/switchwall.sh "$imgpath" add
