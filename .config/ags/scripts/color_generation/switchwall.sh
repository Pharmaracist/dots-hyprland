#!/usr/bin/env bash

set -euo pipefail

XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
CONFIG_DIR="$XDG_CONFIG_HOME/ags"
WALLPAPERS_DIR="$HOME/Pictures/Wallpapers"

mkdir -p "$WALLPAPERS_DIR"

generate_colors() {
    local imgpath="$1"
    if [[ -z "$imgpath" || ! -f "$imgpath" ]]; then
        echo "Invalid image path: $imgpath" >&2
        return 1
    fi
    swww img "$imgpath" --transition-fps 240 --transition-type fade  --transition-duration 0.5 &&
    "$CONFIG_DIR/scripts/color_generation/colorgen.sh" "$imgpath" --apply 
}

main() {
    if [[ $# -gt 0 ]]; then
        generate_colors "$1" || exit $?
    else
        imgpath=$(yad --width 1200 --height 800 --file --add-preview --large-preview \
                 --title="Choose wallpaper" --file)
        [[ -n "$imgpath" && -f "$imgpath" ]] && generate_colors "$imgpath" || exit 1
    fi
}

main "$@"
