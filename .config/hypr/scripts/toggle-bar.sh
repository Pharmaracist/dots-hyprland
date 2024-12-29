#!/bin/bash

# File to track the current state
STATE_FILE="$HOME/.config/hypr/.bar_state"

# Function to start AGS and kill Waybar
start_ags() {
    pkill waybar
    ags &
    echo "ags" > "$STATE_FILE"
}

# Function to start Waybar and kill AGS
start_waybar() {
    pkill ags
    waybar &
    echo "waybar" > "$STATE_FILE"
}

# Check if state file exists, if not create it with default state as ags
if [ ! -f "$STATE_FILE" ]; then
    echo "ags" > "$STATE_FILE"
fi

# Read current state
CURRENT_STATE=$(cat "$STATE_FILE")

# Toggle between the two states
if [ "$CURRENT_STATE" = "ags" ]; then
    start_waybar
else
    start_ags
fi
