#!/bin/bash

CONFIG_FILE="$HOME/.ags/config.json"

# Select image file using yad
PHOTO_PATH=$(yad --file --title="Select Profile Photo" --file-filter="Images | *.png *.jpg *.jpeg *.gif")

# Check if user selected a file
if [ -z "$PHOTO_PATH" ]; then
    yad --error --title="Error" --text="No file selected" --button=OK:0
    exit 1
fi

# Check if file exists
if [ ! -f "$PHOTO_PATH" ]; then
    yad --error --title="Error" --text="File does not exist: $PHOTO_PATH" --button=OK:0
    exit 1
fi

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "{}" > "$CONFIG_FILE"
fi

# Read current config
if [ -s "$CONFIG_FILE" ]; then
    CONFIG_CONTENT=$(cat "$CONFIG_FILE")
else
    CONFIG_CONTENT="{}"
fi

# Update config with new profile photo path
NEW_CONFIG=$(echo "$CONFIG_CONTENT" | jq --arg photo "$PHOTO_PATH" '.appearance.profilePhoto = $photo')

# Write new config
echo "$NEW_CONFIG" | jq '.' > "$CONFIG_FILE"

# Show success message
yad --info --title="Success" --text="Profile photo updated!\n\nPath: $PHOTO_PATH" --button=OK:0

# Reload AGS
killall ags
ags &
