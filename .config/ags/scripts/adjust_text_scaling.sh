#!/bin/bash

# Function to display usage
usage() {
    echo "Usage: $0 [up|down]"
    exit 1
}

# Validate argument
if [ $# -ne 1 ]; then
    usage
fi

# Get the current scaling factor
CURRENT_SCALE=$(gsettings get org.gnome.desktop.interface text-scaling-factor)
CURRENT_SCALE=$(echo "$CURRENT_SCALE" | tr -d "'") # Remove quotes if any

# Adjust scaling factor
if [ "$1" == "up" ]; then
    NEW_SCALE=$(echo "$CURRENT_SCALE + 0.1" | bc)
elif [ "$1" == "down" ]; then
    NEW_SCALE=$(echo "$CURRENT_SCALE - 0.1" | bc)
else
    usage
fi

# Apply the new scaling factor
gsettings set org.gnome.desktop.interface text-scaling-factor "$NEW_SCALE"

# Confirm the change
echo "Text scaling factor adjusted to $NEW_SCALE"
