#!/bin/bash

# Rofi command and options
ROFI_CMD="rofi -show drun -show-icons"

# Check if Rofi is already running
if pgrep -x "rofi" > /dev/null; then
    # Kill all running Rofi processes
    pkill -x rofi
else
    # Launch Rofi with the specified command
    $ROFI_CMD &
fi
