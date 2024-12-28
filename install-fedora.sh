#!/usr/bin/env bash

# ANSI color codes
MAGENTA='\e[35m'
BLUE='\e[34m'
GREEN='\e[32m'
RED='\e[31m'
CYAN='\e[36m'
YELLOW='\e[33m'
RESET='\e[0m'

clear
echo -e "${MAGENTA}"
echo '
██████╗ ██╗  ██╗ █████╗ ██████╗ ███╗   ███╗ █████╗ ██████╗  █████╗  ██████╗██╗███████╗████████╗
██╔══██╗██║  ██║██╔══██╗██╔══██╗████╗ ████║██╔══██╗██╔══██╗██╔══██╗██╔════╝██║██╔════╝╚══██╔══╝
██████╔╝███████║███████║██████╔╝██╔████╔██║███████║██████╔╝███████║██║     ██║███████╗   ██║   
██╔═══╝ ██╔══██║██╔══██║██╔══██╗██║╚██╔╝██║██╔══██║██╔══██╗██╔══██║██║     ██║╚════██║   ██║   
██║     ██║  ██║██║  ██║██║  ██║██║ ╚═╝ ██║██║  ██║██║  ██║██║  ██║╚██████╗██║███████║   ██║   
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝╚══════╝   ╚═╝   
'
echo -e "${GREEN}=====================================================================${RESET}"
echo -e "${BLUE}                     🚀 Welcome to the Installation! 🚀               ${RESET}"
echo -e "${YELLOW}                        Enhanced by Pharmaracist                      ${RESET}"
echo -e "${YELLOW}                        Fedora Edition 🎩                             ${RESET}"
echo -e "${GREEN}=====================================================================${RESET}"

# Fun loading messages
MESSAGES=(
    "🕌 Configuring Islamic prayer times and Quran features..."
    "🎨 Generating beautiful color schemes with pywal..."
    "🎵 Setting up Spotify theme integration..."
    "⚡ Optimizing system performance..."
    "🌙 Adding Hijri calendar support..."
    "🎉 Making things awesome..."
    "🚀 Preparing for launch..."
    "🌈 Adding some colors to your life..."
    "✨ Sprinkling some magic..."
    "🔧 Tightening the nuts and bolts..."
)

show_message() {
    echo -e "\n${CYAN}${MESSAGES[$((RANDOM % ${#MESSAGES[@]}))]}\n${RESET}"
}

cd "$(dirname "$0")"
export base="$(pwd)"

show_message
source ./scriptdata/environment-variables
source ./scriptdata/functions
source ./scriptdata/fedora-installers
source ./scriptdata/options

# Add log file setup at the beginning
LOG_FILE="./installation_$(date +%Y%m%d_%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE") 2>&1

echo -e "${CYAN}🕒 Installation started at $(date)${RESET}"
echo -e "${BLUE}💻 System information:${RESET}"
uname -a

show_message

#####################################################################################
if ! command -v dnf >/dev/null 2>&1; then 
  printf "${RED}[$0]: 🚫 Oops! This script needs dnf (Fedora). Are you on the right system? 🤔${RESET}\n"
  exit 1
fi
prevent_sudo_or_root

echo -e "${BLUE}Setting up sudo permissions...${RESET}"
echo -e "${YELLOW}We'll ask for your password once to avoid multiple prompts${RESET}"

# Create temporary sudoers file for our commands
echo -e "${CYAN}Creating temporary sudo rules...${RESET}"
SUDOERS_FILE="/etc/sudoers.d/illogical-impulse-temp"
sudo tee "$SUDOERS_FILE" > /dev/null << EOL
# Temporary sudo rules for illogical-impulse installation
$(whoami) ALL=(ALL) NOPASSWD: /usr/bin/dnf
$(whoami) ALL=(ALL) NOPASSWD: /usr/bin/chmod
$(whoami) ALL=(ALL) NOPASSWD: /usr/bin/cp
$(whoami) ALL=(ALL) NOPASSWD: /usr/bin/mkdir
$(whoami) ALL=(ALL) NOPASSWD: /usr/bin/tee
$(whoami) ALL=(ALL) NOPASSWD: /usr/bin/usermod
$(whoami) ALL=(ALL) NOPASSWD: /usr/bin/gpasswd
EOL

# Make sure the file is secure
sudo chmod 440 "$SUDOERS_FILE"

# Function to clean up sudo rules on script exit
cleanup_sudo() {
    echo -e "${YELLOW}Cleaning up temporary sudo rules...${RESET}"
    sudo rm -f "$SUDOERS_FILE"
}

# Register cleanup function to run on script exit
trap cleanup_sudo EXIT

# Keep sudo alive throughout the script
while true; do
  sudo -n true
  sleep 60
  kill -0 "$$" || exit
done 2>/dev/null &

startask () {
  printf "${BLUE}[$0]: 👋 Hi there! Before we start:\n"
  printf "${YELLOW}This script requires:\n"
  printf "  1. 🐧 Fedora Linux\n"
  printf "  2. 💻 Basic terminal knowledge\n"
  printf "  3. 🧠 A functioning brain (very important!)\n${RESET}"
  
  printf "${MAGENTA}\nWould you like to create a backup? (recommended) [y/N]: ${RESET}"
  read -p " " backup_confirm
  case $backup_confirm in
    [yY][eE][sS]|[yY])
      echo -e "${GREEN}Smart choice! Backing up your configs... 📦${RESET}"
      backup_configs
      ;;
    *) echo -e "${YELLOW}Living dangerously, I see! Skipping backup... 🎲${RESET}"
      ;;
  esac

  printf '\n'
  printf "${CYAN}Do you want to confirm every command before execution?\n"
  printf "  y = Yes, I want to see everything (DEFAULT)\n"
  printf "  n = No, I trust you (YOLO mode 🎢 - we'll only ask for sudo once)\n"
  printf "  a = Actually, let me out of here! 🚪${RESET}\n"
  read -p "Choose wisely: " p
  case $p in
    n) 
      echo -e "${YELLOW}YOLO mode activated! 🎢${RESET}"
      echo -e "${CYAN}Don't worry about passwords - we'll handle sudo for you 🔐${RESET}"
      ask=false 
      ;;
    a) 
      echo -e "${RED}See you next time! 👋${RESET}"
      exit 1 
      ;;
    *) 
      echo -e "${GREEN}Playing it safe - good choice! 🛡️${RESET}"
      ask=true 
      ;;
  esac
}

case $ask in
  false)sleep 0 ;;
  *)startask ;;
esac

set -e
#####################################################################################
printf "${CYAN}[$0]: 1. Setting up RPM Fusion repositories and core packages\n${RESET}"

# Enable RPM Fusion repositories
if ! dnf repolist | grep -q "rpmfusion-free" || ! dnf repolist | grep -q "rpmfusion-nonfree"; then
    echo -e "${YELLOW}Setting up RPM Fusion repositories...${RESET}"
    v sudo dnf install -y https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm
    v sudo dnf install -y https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm
    v sudo dnf groupupdate -y core
fi

# System update
case $SKIP_SYSUPDATE in
  true) sleep 0;;
  *) 
    echo -e "${YELLOW}Updating system packages...${RESET}"
    v sudo dnf upgrade --refresh -y
    v sudo dnf groupupdate -y multimedia --setop="install_weak_deps=False" --exclude=PackageKit-gstreamer-plugin
    v sudo dnf groupupdate -y sound-and-video
    ;;
esac

# Install Development Tools and Libraries
echo -e "${YELLOW}Installing development tools and libraries...${RESET}"
v sudo dnf group install -y "Development Tools" "Development Libraries"
v sudo dnf install -y cmake gcc-c++ libxcb-devel libX11-devel pixman-devel cairo-devel pango-devel

# Install Wayland Development Packages
echo -e "${YELLOW}Installing Wayland development packages...${RESET}"
v sudo dnf install -y wayland-devel libwayland-client libwayland-cursor libwayland-egl wayland-protocols-devel

# Install XDG Desktop Portal
echo -e "${YELLOW}Installing XDG desktop portal and dependencies...${RESET}"
v sudo dnf install -y xdg-desktop-portal xdg-desktop-portal-gtk xdg-desktop-portal-wlr

# Install COPR for Hyprland
if ! dnf repolist | grep -q "solopasha-hyprland"; then
    echo -e "${YELLOW}Adding Hyprland COPR repository...${RESET}"
    v sudo dnf copr enable -y solopasha/hyprland
    v sudo dnf copr enable -y erikreider/SwayNotificationCenter
fi

# Install Hyprland and related packages
echo -e "${YELLOW}Installing Hyprland and related packages...${RESET}"
v sudo dnf install -y hyprland waybar wofi wlroots swww grim slurp wl-clipboard swaylock swayidle swaybg

# Install Additional Dependencies
echo -e "${YELLOW}Installing additional required packages...${RESET}"
v sudo dnf install -y \
    python3-pip \
    python3-gobject \
    gtk3 \
    gtk4 \
    polkit-gnome \
    network-manager-applet \
    brightnessctl \
    playerctl \
    pamixer \
    pavucontrol \
    blueman \
    NetworkManager-tui \
    xdg-user-dirs \
    xdg-utils \
    qt5-qtwayland \
    qt6-qtwayland \
    ripgrep \
    jq \
    ImageMagick \
    nodejs \
    npm \
    neofetch

# Install fonts
echo -e "${YELLOW}Installing required fonts...${RESET}"
v sudo dnf install -y \
    google-noto-fonts-common \
    google-noto-sans-fonts \
    google-noto-serif-fonts \
    jetbrains-mono-fonts \
    fontawesome-fonts \
    liberation-fonts \
    mozilla-fira-*-fonts

# Read dependencies from configuration
remove_bashcomments_emptylines ${DEPLISTFILE} ./cache/dependencies_stripped.conf
readarray -t pkglist < ./cache/dependencies_stripped.conf

# Install core packages
if (( ${#pkglist[@]} != 0 )); then
    if $ask; then
        for i in "${pkglist[@]}"; do
            v sudo dnf install -y $i
        done
    else
        v sudo dnf install -y ${pkglist[*]}
    fi
fi

# Theme integration packages
install_theme_integrations() {
    if $ask; then
        echo -e "${YELLOW}[$0]: Would you like to install theme integration for Discord? [y/N]\n${RESET}"
        read -p "====> " discord
        case $discord in
            [yY]) 
                v pip install --user pywal-discord-git
                echo -e "${GREEN}Discord theme integration installed!${RESET}"
                echo -e "${YELLOW}Note: You'll need to restart Discord after installation${RESET}"
                ;;
            *) echo "Skipping Discord theme integration" ;;
        esac

        echo -e "${YELLOW}[$0]: Would you like to install theme integration for Firefox? [y/N]\n${RESET}"
        read -p "====> " firefox
        case $firefox in
            [yY]) 
                v pip install --user pywalfox
                echo -e "${GREEN}Firefox theme integration installed!${RESET}"
                echo -e "${YELLOW}Note: You'll need to install the Pywalfox extension from Firefox Add-ons${RESET}"
                echo -e "${YELLOW}Visit: https://addons.mozilla.org/en-US/firefox/addon/pywalfox/${RESET}"
                ;;
            *) echo "Skipping Firefox theme integration" ;;
        esac

        echo -e "${YELLOW}[$0]: Would you like to install theme integration for Spotify? [y/N]\n${RESET}"
        read -p "====> " spotify
        case $spotify in
            [yY]) 
                # Install Spotify from RPM Fusion if not already installed
                if ! command -v spotify &> /dev/null; then
                    echo -e "${YELLOW}Installing Spotify from RPM Fusion...${RESET}"
                    v sudo dnf install -y spotify-client
                fi
                
                # Install Spicetify
                echo -e "${YELLOW}Installing Spicetify...${RESET}"
                v curl -fsSL https://raw.githubusercontent.com/spicetify/spicetify-cli/master/install.sh | sh
                
                # Install Pywal for Spicetify
                v pip install --user python-pywal-spicetify-git
                
                echo -e "${GREEN}Spotify theme integration installed!${RESET}"
                echo -e "${YELLOW}Note: You'll need to restart Spotify after installation${RESET}"
                ;;
            *) echo "Skipping Spotify theme integration" ;;
        esac
    else
        # Non-interactive installation
        echo -e "${YELLOW}Installing all theme integrations...${RESET}"
        v pip install --user pywal-discord-git pywalfox python-pywal-spicetify-git
        
        # Install Spotify and Spicetify
        if ! command -v spotify &> /dev/null; then
            v sudo dnf install -y spotify-client
        fi
        v curl -fsSL https://raw.githubusercontent.com/spicetify/spicetify-cli/master/install.sh | sh
        
        echo -e "${GREEN}All theme integrations installed!${RESET}"
        echo -e "${YELLOW}Notes:${RESET}"
        echo -e "${YELLOW}- Restart Discord and Spotify after installation${RESET}"
        echo -e "${YELLOW}- Install the Pywalfox extension from: https://addons.mozilla.org/en-US/firefox/addon/pywalfox/${RESET}"
    fi
}

v install_theme_integrations

v sudo -n usermod -aG video,i2c,input "$(whoami)"
v bash -c "echo i2c-dev | sudo -n tee /etc/modules-load.d/i2c-dev.conf"
v systemctl --user enable ydotool --now
v gsettings set org.gnome.desktop.interface font-name 'Rubik 11'

# Install custom fonts
echo -e "${BLUE}[$0]: Installing custom fonts... 🔤${RESET}"
if [ -d "$DOTS_DIR/.fonts" ] && [ "$(ls -A $DOTS_DIR/.fonts)" ]; then
    mkdir -p "$HOME/.local/share/fonts"
    if cp -r "$DOTS_DIR/.fonts/"* "$HOME/.local/share/fonts/"; then
        fc-cache -f
        echo -e "${GREEN}[$0]: Custom fonts installed successfully! ✨${RESET}"
    else
        echo -e "${RED}[$0]: Error copying fonts to local directory${RESET}"
    fi
else
    echo -e "${YELLOW}[$0]: No custom fonts found in .fonts directory${RESET}"
fi

# Set up Spotify permissions and customization
echo -e "${BLUE}[$0]: Setting up Spotify and Spicetify... 🎵${RESET}"
v sudo -n chmod a+wr /opt/spotify
v sudo -n chmod a+wr /opt/spotify/Apps -R

# Run spicetify script
echo -e "${CYAN}Running Spicetify customization script...${RESET}"
v chmod +x ./scriptdata/spicetify.sh
v ./scriptdata/spicetify.sh

show_message

echo -e "${GREEN}=====================================================================${RESET}"
echo -e "${BLUE}                   ☪️  Islamic Features Setup                         ${RESET}"
echo -e "${GREEN}=====================================================================${RESET}"
echo -e "${CYAN}Setting up Islamic features:${RESET}"
echo -e "${YELLOW}1. 🕌 Prayer times integration${RESET}"
echo -e "${YELLOW}2. 📖 Quran reader and references${RESET}"

echo -e "${GREEN}=====================================================================${RESET}"
echo -e "${BLUE}                   🎨 Color Harmony Setup                            ${RESET}"
echo -e "${GREEN}=====================================================================${RESET}"
echo -e "${CYAN}Configuring pywal integration:${RESET}"
echo -e "${YELLOW}1. 🖼️ Dynamic color generation from wallpapers${RESET}"
echo -e "${YELLOW}2. 🎵 Spotify theme synchronization${RESET}"
echo -e "${YELLOW}3. 📝 Terminal and application theme matching${RESET}"
echo -e "${YELLOW}4. 🔄 Real-time color updates${RESET}"

#####################################################################################
printf "${CYAN}[$0]: Finished. See the \"Import Manually\" folder and grab anything you need.\n${RESET}"
printf "\n"
printf "${CYAN}If you are new to Hyprland, please read\n"
printf "https://sh1zicus.github.io/dots-hyprland-wiki/en/i-i/01setup/#post-installation\n"
printf "for hints on launching Hyprland.\n${RESET}"
printf "\n"

echo -e "${GREEN}=====================================================================${RESET}"
echo -e "${MAGENTA}                   🎉 Installation Complete! 🎉                     ${RESET}"
echo -e "${GREEN}=====================================================================${RESET}"
echo -e "${CYAN}What's next?${RESET}"
echo -e "${YELLOW}1. 🔄 Log out and log back in to apply all changes${RESET}"
echo -e "${YELLOW}2. 🕌 Check your prayer times widget (Alt+P)${RESET}"
echo -e "${YELLOW}3. 📖 Open the Quran reader (Alt+Q)${RESET}"
echo -e "${YELLOW}4. 🎨 Try changing wallpapers to see pywal in action${RESET}"
echo -e "${YELLOW}5. 🌙 Configure your local prayer times in the settings${RESET}"
echo -e "${YELLOW}6. ⭐ Don't forget to star the repo if you like it!${RESET}"

echo -e "\n${BLUE}Useful Keyboard Shortcuts:${RESET}"
echo -e "${CYAN}Alt + P${RESET} → ${YELLOW}Prayer Times Widget${RESET}"
echo -e "${CYAN}Alt + Q${RESET} → ${YELLOW}Quran Reader${RESET}"
echo -e "${CYAN}Alt + W${RESET} → ${YELLOW}Change Wallpaper (auto-updates themes)${RESET}"

echo -e "\n${BLUE}Need help? Check out:${RESET}"
echo -e "${CYAN}https://sh1zicus.github.io/dots-hyprland-wiki/en/i-i/01setup/#post-installation${RESET}"
echo -e "\n${GREEN}May Allah bless your journey! 🌙${RESET}\n"

case $existed_ags_opt in
  y) printf "\n${YELLOW}[$0]: Warning: \"$XDG_CONFIG_HOME/ags/user_options.js\" already existed before and we didn't overwrite it. \n${RESET}";;
esac
case $existed_hypr_conf in
  y) printf "\n${YELLOW}[$0]: Warning: \"$XDG_CONFIG_HOME/hypr/hyprland.conf\" already existed before and we didn't overwrite it. \n${RESET}"
     printf "${YELLOW}Please use \"$XDG_CONFIG_HOME/hypr/hyprland.conf.new\" as a reference for a proper format.\n${RESET}"
     printf "${YELLOW}If this is your first time installation, you must overwrite \"$XDG_CONFIG_HOME/hypr/hyprland.conf\" with \"$XDG_CONFIG_HOME/hypr/hyprland.conf.new\".\n${RESET}"
;;esac
