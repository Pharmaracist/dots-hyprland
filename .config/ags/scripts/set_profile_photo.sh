#!/bin/bash

CONFIG_FILE="$HOME/.ags/config.json"
PHOTO_PATH="$1"

# Check if photo path was provided
if [ -z "$PHOTO_PATH" ]; then
    echo "Error: No photo path provided"
    exit 1
fi

# Check if file exists
if [ ! -f "$PHOTO_PATH" ]; then
    echo "Error: File does not exist: $PHOTO_PATH"
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

# Reload AGS
killall ags
ags &
