#!/usr/bin/env bash

XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
XDG_CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}"
XDG_STATE_HOME="${XDG_STATE_HOME:-$HOME/.local/state}"
CONFIG_DIR="$XDG_CONFIG_HOME/ags"
CACHE_DIR="$XDG_CACHE_HOME/ags"
STATE_DIR="$XDG_STATE_HOME/ags"
colormodefile="$STATE_DIR/user/colormode.txt"

if [ ! -d "$CACHE_DIR"/user/generated ]; then
    mkdir -p "$CACHE_DIR"/user/generated
fi
cd "$CONFIG_DIR" || exit

colornames=''
colorstrings=''
colorlist=()
colorvalues=()


# Fetch second line from color mode file
secondline=$(sed -n '2p' "$colormodefile")

# Determine terminal opacity based on the second line
if [[ "$secondline" == *"transparent"* ]]; then # Set for transparent background
    term_alpha=75 
    hypr_opacity=0.9
    rofi_alpha=#00000090
    rofi_alpha_element=#00000025
else #Opaque Stuff
    term_alpha=100 
    hypr_opacity=1
    rofi_alpha="var(surface)"
    rofi_alpha_element="var(surface-container-low)"
fi

transparentize() {
  local hex="$1"
  local alpha="$2"
  local red green blue

  red=$((16#${hex:1:2}))
  green=$((16#${hex:3:2}))
  blue=$((16#${hex:5:2}))

  printf 'rgba(%d, %d, %d, %.2f)\n' "$red" "$green" "$blue" "$alpha"
}

get_light_dark() {
    lightdark=""
    if [ ! -f "$STATE_DIR/user/colormode.txt" ]; then
        echo "" > "$STATE_DIR/user/colormode.txt"
    else
        lightdark=$(sed -n '1p' "$STATE_DIR/user/colormode.txt")
    fi
    echo "$lightdark"
}
apply_rofi() {
    sed -i "s/wbg:.*;/wbg:$rofi_alpha;/" ~/.local/share/rofi/themes/style-4.rasi
    sed -i "s/element-bg:.*;/element-bg:$rofi_alpha_element;/" ~/.local/share/rofi/themes/style-4.rasi
}
apply_term() {
    # Check if terminal escape sequence template exists
    if [ ! -f "scripts/templates/terminal/sequences.txt" ]; then
        echo "Template file not found for Terminal. Skipping that."
        return
    fi
    # Copy template
    mkdir -p "$CACHE_DIR"/user/generated/terminal
    cp "scripts/templates/terminal/sequences.txt" "$CACHE_DIR"/user/generated/terminal/sequences.txt
    # Apply colors
    for i in "${!colorlist[@]}"; do
        sed -i "s/${colorlist[$i]} #/${colorvalues[$i]#\#}/g" "$CACHE_DIR"/user/generated/terminal/sequences.txt
    done
   sed -i "s/\$alpha/$term_alpha/g" "$CACHE_DIR/user/generated/terminal/sequences.txt"
    for file in /dev/pts/*; do
      if [[ $file =~ ^/dev/pts/[0-9]+$ ]]; then
        cat "$CACHE_DIR"/user/generated/terminal/sequences.txt > "$file"
      fi
    done
}

apply_hyprland() {
    # Check if scripts/templates/hypr/hyprland/colors.conf exists
    if [ ! -f "scripts/templates/hypr/hyprland/colors.conf" ]; then
        echo "Template file not found for Hyprland colors. Skipping that."
        return
    fi
    # Copy template
    mkdir -p "$CACHE_DIR"/user/generated/hypr/hyprland
    cp "scripts/templates/hypr/hyprland/colors.conf" "$CACHE_DIR"/user/generated/hypr/hyprland/colors.conf
    # Apply colors
    for i in "${!colorlist[@]}"; do
        sed -i "s/{{ ${colorlist[$i]} }}/${colorvalues[$i]#\#}/g" "$CACHE_DIR"/user/generated/hypr/hyprland/colors.conf
    done
    sed -i "s/windowrule = opacity .*\ override/windowrule = opacity $hypr_opacity override/" ~/.config/hypr/hyprland/rules/default.conf     
    cp "$CACHE_DIR"/user/generated/hypr/hyprland/colors.conf "$XDG_CONFIG_HOME"/hypr/hyprland/colors.conf
}

apply_lightdark() {
    lightdark=$(get_light_dark)
    if [ "$lightdark" = "light" ]; then
        gsettings set org.gnome.desktop.interface color-scheme 'prefer-light'
    else
        gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'
    fi
}

apply_gtk() { # Using gradience-cli
    usegradience=$(sed -n '4p' "$STATE_DIR/user/colormode.txt")
    if [[ "$usegradience" = "nogradience" ]]; then 
        rm "$XDG_CONFIG_HOME/gtk-3.0/gtk.css"
        rm "$XDG_CONFIG_HOME/gtk-4.0/gtk.css"
        return
    fi

    # Copy template
    mkdir -p "$CACHE_DIR"/user/generated/gradience
    cp "scripts/templates/gradience/preset.json" "$CACHE_DIR"/user/generated/gradience/preset.json

    # Apply colors
    for i in "${!colorlist[@]}"; do
        sed -i "s/{{ ${colorlist[$i]} }}/${colorvalues[$i]}/g" "$CACHE_DIR"/user/generated/gradience/preset.json
    done

    mkdir -p "$XDG_CONFIG_HOME/presets" # create gradience presets folder
    gradience-cli apply -p "$CACHE_DIR"/user/generated/gradience/preset.json --gtk both

    # And set GTK theme manually as Gradience defaults to light adw-gtk3
    # (which is unreadable when broken when you use dark mode)
    lightdark=$(get_light_dark)
    if [ "$lightdark" = "light" ]; then
        gsettings set org.gnome.desktop.interface gtk-theme 'adw-gtk3'
    else
        gsettings set org.gnome.desktop.interface gtk-theme adw-gtk3-dark
    fi
}

apply_ags() {
    ags run-js "handleStyles(false);"
    # ags run-js 'openColorScheme.value = true; Utils.timeout(2000, () => openColorScheme.value = false);'
}


colornames=$(cat $STATE_DIR/scss/_material.scss | cut -d: -f1)
colorstrings=$(cat $STATE_DIR/scss/_material.scss | cut -d: -f2 | cut -d ' ' -f2 | cut -d ";" -f1)
IFS=$'\n'
colorlist=( $colornames ) # Array of color names
colorvalues=( $colorstrings ) # Array of color values

apply_ags &
apply_hyprland &
apply_lightdark &
apply_gtk &
apply_term &
apply_rofi &