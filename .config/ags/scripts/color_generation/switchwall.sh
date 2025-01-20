#!/usr/bin/env bash

set -euo pipefail

XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
CONFIG_DIR="$XDG_CONFIG_HOME/ags"
WALLPAPERS_DIR="$HOME/Pictures/Wallpapers"

# Create wallpapers directory if it doesn't exist
mkdir -p "$WALLPAPERS_DIR"

generate_colors() {
    local imgpath="$1"
    if [[ -z "$imgpath" || ! -f "$imgpath" ]]; then
        echo "Invalid image path: $imgpath" >&2
        return 1
    fi
    
    # Run everything in parallel
    swww img "$imgpath" --transition-fps 165 --transition-type grow --transition-duration 0.5 &
    "$CONFIG_DIR/scripts/color_generation/colorgen.sh" "$imgpath" --apply & 
}

main() {
    if [[ $# -gt 0 ]]; then
        generate_colors "$1" || exit $?
    else
        imgpath=$(yad --width 1200 --height 800 --file --add-preview --large-preview \
                 --title="Choose wallpaper" --directory "$WALLPAPERS_DIR")
        [[ -n "$imgpath" && -f "$imgpath" ]] && generate_colors "$imgpath" || exit 1
    fi
}

main "$@"