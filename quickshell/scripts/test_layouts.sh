#!/bin/bash

# A direct test script for bar layouts
# This will trigger layout switches directly with notifications

echo "Testing bar layout switching..."

# Function to switch layout
switch_layout() {
  direction=$1
  echo "Switching to $direction layout..."
  
  # Create direct trigger file
  echo "$direction" > /tmp/quickshell_bar_layout_direction
  date +%s > /tmp/quickshell_bar_layout_trigger
  
  # Show notification
  notify-send "Layout Test" "Switching to $direction layout" -t 1000
  
  # Sleep to allow UI to update
  sleep 1
}

# Test next layout
switch_layout "next"
sleep 2

# Test prev layout 
switch_layout "prev"
sleep 2

# Test next layout again
switch_layout "next"

echo "Test complete!"
