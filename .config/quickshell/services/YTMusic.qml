pragma Singleton
pragma ComponentBehavior: Bound
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/modules/common/functions/string_utils.js" as StringUtils
import "root:/modules/common/functions/file_utils.js" as FileUtils

import QtQuick
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland

Singleton {
    id: ytMusicService
    
    readonly property string downloadDir : FileUtils.trimFileProtocol(Directories.music)

    
    // Public API method to play a song
    function playSong(query) {
        // Create a clean command that:
        // 1. Kills any running VLC instances
        // 2. Uses yt-dlp to find the first video matching the search
        // 3. Pipes it to VLC with appropriate options
        const command = `pkill vlc 2>/dev/null; yt-dlp -f bestaudio --get-url "ytsearch1:${query}" | xargs -I {} vlc --play-and-exit --audio-visual=visual --extraintf rc --rc-host=localhost:9090 {} &>/dev/null &`
        
        Hyprland.dispatch(`exec ${command}`)
    }
    
    // Public API method to download a song
    function downloadSong(query) {
        // Create notification command to show progress
        const notifyStart = `notify-send "YouTube Music Downloader" "Downloading: ${query}..."`
        
        // Create download command that:
        // 1. Changes to the Music directory
        // 2. Uses yt-dlp to download the best audio and convert to mp3
        // 3. Shows a notification when complete
        const command = `${notifyStart} && cd ${downloadDir} && yt-dlp -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 --embed-thumbnail --add-metadata "ytsearch1:${query}" && notify-send "YouTube Music Downloader" "Downloaded: ${query}" &`
        console.log(downloadDir)        
        // Execute the command
        Hyprland.dispatch(`exec ${command}`)
    }
}
