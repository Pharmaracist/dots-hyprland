#!/bin/bash

# Clone the repository and run the installation
install_custom() {
    echo "Starting custom Hyprland installation..."
    
    # Create temporary directory
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"

    # Clone the repository
    git clone https://github.com/pharmaracist/dots-hyprland.git
    cd dots-hyprland

    # Make scripts executable
    chmod +x install.sh
    chmod +x scriptdata/*

    # Run installation with automatic mode
    export ask=true  # Enable confirmation prompts
    ./install.sh
}

# Run the installation
install_custom
