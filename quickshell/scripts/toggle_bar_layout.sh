#!/bin/bash

# Enhanced script to toggle bar layouts in Quickshell
# Usage: toggle_bar_layout.sh [next|prev]

DIRECTION="${1:-next}"
NOTIFICATION="Bar Layout Switch: $DIRECTION"
LOG_FILE="/tmp/quickshell_bar_layout.log"

# Log the call for debugging
echo "[$(date)] toggle_bar_layout.sh called with direction: $DIRECTION" >> "$LOG_FILE"

# Create a notification
notify-send "Quickshell" "$NOTIFICATION" -t 1000

# Try multiple methods to ensure the command gets through

# Method 1: Use hyprctl dispatch
echo "Using hyprctl dispatch..." >> "$LOG_FILE"
hyprctl dispatch global quickshell:barlayout "$DIRECTION"

# Method 2: Create a trigger file that Bar.qml can monitor
echo "Creating trigger file..." >> "$LOG_FILE"
echo "$DIRECTION" > /tmp/quickshell_bar_layout_direction
date +%s > /tmp/quickshell_bar_layout_trigger

# Method 3: Try using qdbus if available
if command -v qdbus &> /dev/null; then
    echo "Trying qdbus method..." >> "$LOG_FILE"
    qdbus org.quickshell.Shell /org/quickshell/Shell/Bar switchLayout "$DIRECTION" 2>> "$LOG_FILE"
fi

echo "Script completed" >> "$LOG_FILE"
exit 0
