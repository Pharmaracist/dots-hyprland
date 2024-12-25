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
source ./scriptdata/installers
source ./scriptdata/options

# Add log file setup at the beginning
LOG_FILE="./installation_$(date +%Y%m%d_%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE") 2>&1

echo -e "${CYAN}🕒 Installation started at $(date)${RESET}"
echo -e "${BLUE}💻 System information:${RESET}"
uname -a

show_message

#####################################################################################
if ! command -v pacman >/dev/null 2>&1; then 
  printf "${RED}[$0]: 🚫 Oops! This script needs pacman (Arch Linux). Are you on the right system? 🤔${RESET}\n"
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
$(whoami) ALL=(ALL) NOPASSWD: /usr/bin/pacman
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
  printf "  1. 🐧 Arch Linux or Arch-based distro\n"
  printf "  2. 💻 Basic terminal knowledge\n"
  printf "  3. 🧠 A functioning brain (very important!)\n${RESET}"
  
  printf "${MAGENTA}\nWould you like to create a backup? (recommended) [y/N]: ${RESET}"
  read -p " " backup_confirm
  case $backup_confirm in
    [yY][eE][sS]|[yY])
      echo -e "${GREEN}Smart choice! Backing up your configs... 📦${RESET}"
      backup_configs
      ;;
    *)
      echo -e "${YELLOW}Living dangerously, I see! Skipping backup... 🎲${RESET}"
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
printf "${CYAN}[$0]: 1. Get packages and setup user groups/services\n${RESET}"

# Issue #363
case $SKIP_SYSUPDATE in
  true) sleep 0;;
  *) v sudo -n pacman -Syu;;
esac

remove_bashcomments_emptylines ${DEPLISTFILE} ./cache/dependencies_stripped.conf
readarray -t pkglist < ./cache/dependencies_stripped.conf

# Use yay. Because paru do not support cleanbuild.
# Also see https://wiki.hyprland.org/FAQ/#how-do-i-update
if ! command -v yay >/dev/null 2>&1;then
  echo -e "${YELLOW}[$0]: \"yay\" not found.\n${RESET}"
  showfun install-yay
  v install-yay
fi

# Install extra packages from dependencies.conf as declared by the user
if (( ${#pkglist[@]} != 0 )); then
	if $ask; then
		# execute per element of the array $pkglist
		for i in "${pkglist[@]}";do v yay -S --needed $i;done
	else
		# execute for all elements of the array $pkglist in one line
		v yay -S --needed --noconfirm ${pkglist[*]}
	fi
fi

# Convert old dependencies to non explicit dependencies so that they can be orphaned if not in meta packages
set-explicit-to-implicit() {
	remove_bashcomments_emptylines ./scriptdata/previous_dependencies.conf ./cache/old_deps_stripped.conf
	readarray -t old_deps_list < ./cache/old_deps_stripped.conf
	pacman -Qeq > ./cache/pacman_explicit_packages
	readarray -t explicitly_installed < ./cache/pacman_explicit_packages

	echo "Attempting to set previously explicitly installed deps as implicit..."
	for i in "${explicitly_installed[@]}"; do for j in "${old_deps_list[@]}"; do
		[ "$i" = "$j" ] && yay -D --asdeps "$i"
	done; done

	return 0
}

$ask && echo "Attempt to set previously explicitly installed deps as implicit? "
$ask && showfun set-explicit-to-implicit
v set-explicit-to-implicit

# https://github.com/end-4/dots-hyprland/issues/581
# yay -Bi is kinda hit or miss, instead cd into the relevant directory and manually source and install deps
install-local-pkgbuild() {
	local location=$1
	local installflags=$2

	x pushd $location

	source ./PKGBUILD
	x yay -S $installflags --asdeps "${depends[@]}"
	x makepkg -si --noconfirm

	x popd
}

# Install core dependencies from the meta-packages
metapkgs=(./arch-packages/illogical-impulse-{audio,backlight,basic,fonts-themes,gnome,gtk,portal,python,screencapture,widgets,extras,extras-aur})
metapkgs+=(./arch-packages/illogical-impulse-ags)
metapkgs+=(./arch-packages/illogical-impulse-microtex-git)
[[ -f /usr/share/icons/Bibata-Modern-Classic/index.theme ]] || \
  metapkgs+=(./arch-packages/illogical-impulse-bibata-modern-classic-bin)
try sudo pacman -R illogical-impulse-microtex

for i in "${metapkgs[@]}"; do
	metainstallflags="--needed"
	$ask && showfun install-local-pkgbuild || metainstallflags="$metainstallflags --noconfirm"
	v install-local-pkgbuild "$i" "$metainstallflags"
done

# https://github.com/end-4/dots-hyprland/issues/428#issuecomment-2081690658
# https://github.com/end-4/dots-hyprland/issues/428#issuecomment-2081701482
# https://github.com/end-4/dots-hyprland/issues/428#issuecomment-2081707099
case $SKIP_PYMYC_AUR in
  true) sleep 0;;
  *)
	  pymycinstallflags=""
	  $ask && showfun install-local-pkgbuild || pymycinstallflags="$pymycinstallflags --noconfirm"
	  v install-local-pkgbuild "./arch-packages/illogical-impulse-pymyc-aur" "$pymycinstallflags"
    ;;
esac


# Why need cleanbuild? see https://github.com/end-4/dots-hyprland/issues/389#issuecomment-2040671585
# Why install deps by running a seperate command? see pinned comment of https://aur.archlinux.org/packages/hyprland-git
case $SKIP_HYPR_AUR in
  true) sleep 0;;
  *)
	  hyprland_installflags="-S"
	  $ask || hyprland_installflags="$hyprland_installflags --noconfirm"
    v yay $hyprland_installflags --asdeps hyprutils-git hyprlang-git hyprcursor-git hyprwayland-scanner-git
    v yay $hyprland_installflags --answerclean=a hyprland-git
    ;;
esac


## Optional dependencies
if pacman -Qs ^plasma-browser-integration$ ;then SKIP_PLASMAINTG=true;fi
case $SKIP_PLASMAINTG in
  true) sleep 0;;
  *)
    if $ask;then
      echo -e "${YELLOW}[$0]: NOTE: The size of \"plasma-browser-integration\" is about 250 MiB.\n${RESET}"
      echo -e "${YELLOW}It is needed if you want playtime of media in Firefox to be shown on the music controls widget.\n${RESET}"
      echo -e "${YELLOW}Install it? [y/N]\n${RESET}"
      read -p "====> " p
    else
      p=y
    fi
    case $p in
      y) x sudo pacman -S --needed --noconfirm plasma-browser-integration ;;
      *) echo "Ok, won't install"
    esac
    ;;
esac

# Theme integration packages
install_theme_integrations() {
    if $ask; then
        echo -e "${YELLOW}[$0]: Would you like to install theme integration for Discord? [y/N]\n${RESET}"
        read -p "====> " discord
        case $discord in
            [yY]) v yay -S --needed pywal-discord-git ;;
            *) echo "Skipping Discord theme integration" ;;
        esac

        echo -e "${YELLOW}[$0]: Would you like to install theme integration for Telegram? [y/N]\n${RESET}"
        read -p "====> " telegram
        case $telegram in
            [yY]) v yay -S --needed wal-telegram-git ;;
            *) echo "Skipping Telegram theme integration" ;;
        esac

        echo -e "${YELLOW}[$0]: Would you like to install theme integration for Firefox? [y/N]\n${RESET}"
        read -p "====> " firefox
        case $firefox in
            [yY]) v yay -S --needed pywalfox ;;
            *) echo "Skipping Firefox theme integration" ;;
        esac

        echo -e "${YELLOW}[$0]: Would you like to install theme integration for Spotify? [y/N]\n${RESET}"
        read -p "====> " spotify
        case $spotify in
            [yY]) v yay -S --needed spicetify-cli python-pywal-spicetify-git ;;
            *) echo "Skipping Spotify theme integration" ;;
        esac
    else
        v yay -S --needed --noconfirm pywal-discord-git wal-telegram-git pywalfox spicetify-cli python-pywal-spicetify-git
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
echo -e "${YELLOW}3. 🌙 Hijri calendar${RESET}"
echo -e "${YELLOW}4. 🎨 Islamic-themed color schemes${RESET}"

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
  y) printf "\n${YELLOW}[$0]: Warning: \"$XDG_CONFIG_HOME/ags/user_options.js\" already existed before and we didn't overwrite it. \n${RESET}"
#    printf "\e[33mPlease use \"$XDG_CONFIG_HOME/ags/user_options.js.new\" as a reference for a proper format.\e[0m\n"
;;esac
case $existed_hypr_conf in
  y) printf "\n${YELLOW}[$0]: Warning: \"$XDG_CONFIG_HOME/hypr/hyprland.conf\" already existed before and we didn't overwrite it. \n${RESET}"
     printf "${YELLOW}Please use \"$XDG_CONFIG_HOME/hypr/hyprland.conf.new\" as a reference for a proper format.\n${RESET}"
     printf "${YELLOW}If this is your first time installation, you must overwrite \"$XDG_CONFIG_HOME/hypr/hyprland.conf\" with \"$XDG_CONFIG_HOME/hypr/hyprland.conf.new\".\n${RESET}"
;;esac

if [[ ! -z "${warn_files[@]}" ]]; then
  printf "\n${RED}[$0]: \!! Important \!! : Please delete \n${RESET} ${warn_files[*]} \n${RED} manually as soon as possible, since we\'re now using AUR package or local PKGBUILD to install them for Arch(based) Linux distros, and they'll take precedence over our installation, or at least take up more space.\n${RESET}"
fi

echo "Installation completed at $(date)"
