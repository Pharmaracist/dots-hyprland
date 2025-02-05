#!/usr/bin/env bash

XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
XDG_CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}"
XDG_STATE_HOME="${XDG_STATE_HOME:-$HOME/.local/state}"
CONFIG_DIR="$XDG_CONFIG_HOME/ags"
CACHE_DIR="$XDG_CACHE_HOME/ags"
STATE_DIR="$XDG_STATE_HOME/ags"

COLORMODE_FILE_DIR="$STATE_DIR/user/colormode.txt"
firstline=$(sed -n '1p' "$COLORMODE_FILE_DIR")

if [ "$1" == "--pick" ]; then
  color=$(hyprpicker --no-fancy)
elif [[ "$1" = "#"* ]]; then # this is a color
  color=$1
else
  color=$(cut -f1 "$STATE_DIR/user/color.txt")
fi

sed -i "1s/.*/$color/" "$STATE_DIR/user/color.txt"

# Use Gradience?
colormodelines=$(wc -l "$COLORMODE_FILE_DIR"  | awk '{print $1}' )
if [ "$2" == "--no-gradience" ]; then
  if [ "$colormodelines" == "3" ]; then
    echo 'nogradience' >> "$COLORMODE_FILE_DIR"
  else
    sed -i "4s/.*/nogradience/" "$COLORMODE_FILE_DIR"
  fi
elif [ "$2" == "--yes-gradience" ]; then
  if [ "$colormodelines" == "3" ]; then
    echo 'yesgradience' >> "$COLORMODE_FILE_DIR"
  else
    sed -i "4s/.*/yesgradience/" "$COLORMODE_FILE_DIR"
  fi
fi

# Get the color mode
colormode=$(sed -n '1p' "$COLORMODE_FILE_DIR")
if [[ "$colormode" == "light" ]]; then
    colormode="-m light"
else
    colormode="-m dark"
fi

# Get the color mode
firstline=$(sed -n '1p' "$COLORMODE_FILE_DIR")

# Generate colors for ags n stuff
if [[ "$1" = "#"* ]]; then
  "$CONFIG_DIR"/scripts/color_generation/colorgen.sh "${color}" --apply &
else
  # Get the stored image path
  image_source=$(cat "$STATE_DIR/user/current_wallpaper.txt")
  "$CONFIG_DIR"/scripts/color_generation/colorgen.sh "${image_source}" --apply &
fi

# Wait for all background processes
# wait # todo

if [[ "$1" = "#"* ]]; then
  "$CONFIG_DIR"/scripts/color_generation/colorgen.sh "${color}" --apply
else
  # Use the stored image path
  image_source=$(cat "$STATE_DIR/user/current_wallpaper.txt")
  "$CONFIG_DIR"/scripts/color_generation/colorgen.sh "${image_source}" --apply
fi

