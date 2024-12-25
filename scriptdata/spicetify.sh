#!/bin/bash

# ANSI color codes
RED='\e[31m'
GREEN='\e[32m'
BLUE='\e[34m'
MAGENTA='\e[35m'
CYAN='\e[36m'
YELLOW='\e[33m'
RESET='\e[0m'

echo -e "${MAGENTA}"
echo '
███████╗██████╗ ██╗ ██████╗███████╗████████╗██╗███████╗██╗   ██╗
██╔════╝██╔══██╗██║██╔════╝██╔════╝╚══██╔══╝██║██╔════╝╚██╗ ██╔╝
███████╗██████╔╝██║██║     █████╗     ██║   ██║█████╗   ╚████╔╝ 
╚════██║██╔═══╝ ██║██║     ██╔══╝     ██║   ██║██╔══╝    ╚██╔╝  
███████║██║     ██║╚██████╗███████╗   ██║   ██║██║        ██║   
╚══════╝╚═╝     ╚═╝ ╚═════╝╚══════╝   ╚═╝   ╚═╝╚═╝        ╚═╝   
'
echo -e "${GREEN}=====================================================================${RESET}"
echo -e "${BLUE}                🎵 Spicing up your Spotify! 🎵                      ${RESET}"
echo -e "${GREEN}=====================================================================${RESET}"

# 1. Install curl
echo -e "${CYAN}Installing curl...${RESET}"
sudo -n pacman -S curl --noconfirm

# 2. Install Spicetify
echo -e "${CYAN}Installing Spicetify...${RESET}"
curl -fsSL https://raw.githubusercontent.com/spicetify/spicetify-cli/master/install.sh | sh

# 3. Find Spotify's Flatpak path
echo -e "${CYAN}Locating Spotify's directory...${RESET}"
flatpak_path=$(flatpak --installations | grep com.spotify.Client | awk '{print $2}')

# 4. Construct the path to Spotify's files
spotify_path="x86_64/stable/active/files/extra/share/spotify"
full_spotify_path="$flatpak_path/$spotify_path"

# 5. Check if the constructed path exists
if [ ! -d "$full_spotify_path" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Default Spotify path not found. Please check manually.${RESET}"
else
    echo -e "${GREEN}✅ Found Spotify at: $full_spotify_path${RESET}"
fi

# 6. Find Spotify's preferences file
echo -e "${CYAN}Locating Spotify's preferences file...${RESET}"
prefs_path=$(find ~/.var/app/com.spotify.Client/config/spotify -maxdepth 1 -name 'prefs' -type f)
echo -e "${GREEN}✅ Found preferences file at: $prefs_path${RESET}"

# 7. Configure Spicetify
echo -e "${CYAN}Configuring Spicetify...${RESET}"
awk -v prefs_path="$prefs_path" '{ 
    if ($1 == "prefs_path") {
        $3 = prefs_path
    } 
    print $0
}' ~/.config/spicetify/config-xpui.ini > ~/.config/spicetify/config-xpui.ini.tmp
mv ~/.config/spicetify/config-xpui.ini.tmp ~/.config/spicetify/config-xpui.ini

# 8. Install Spicetify Marketplace
echo -e "${CYAN}Installing Spicetify Marketplace...${RESET}"
curl -fsSL https://raw.githubusercontent.com/spicetify/spicetify-marketplace/main/resources/install.sh | sh

# 9. Grant write permissions BEFORE `spicetify backup apply`
echo -e "${CYAN}Granting permissions to Spicetify...${RESET}"
sudo -n chmod a+wr /var/lib/flatpak/app/com.spotify.Client/x86_64/stable/active/files/extra/share/spotify
sudo -n chmod a+wr -R /var/lib/flatpak/app/com.spotify.Client/x86_64/stable/active/files/extra/share/spotify/Apps

# 10. Apply Spicetify 
echo -e "${CYAN}Applying Spicetify...${RESET}"
spicetify backup apply 

echo -e "${GREEN}=====================================================================${RESET}"
echo -e "${BLUE}                🎉 Spicetify setup complete! 🎉                     ${RESET}"
echo -e "${YELLOW}          Start Spotify to see your spicy new theme! 🔥             ${RESET}"
echo -e "${GREEN}=====================================================================${RESET}"
