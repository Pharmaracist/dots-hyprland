import "../"
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import "root:/modules/common"
import "root:/modules/common/widgets"

QuickToggleButton {
    // --start-app=+?rimusic

    id: syncAudio

    property bool enabled: false
    property string phoneLocalIP: "192.168.1.30"
    property string phoneLocalPort: "5555"

    buttonName: enabled ? "Syncing.." : "Sync"
    toggled: enabled
    buttonIcon: "equalizer"
    onClicked: {
        syncAudio.enabled = !syncAudio.enabled;
        if (enabled)
            Hyprland.dispatch(`exec scrcpy --no-video --audio-codec=opus --tcpip='${phoneLocalIP}:${phoneLocalPort}'`);
        else
            Hyprland.dispatch('exec killall scrcpy');
    }

    Process {
        id: syncAudioOn

        command: ["scrcpy"]
    }

    Process {
        id: syncAudioOff

        command: ["killall", "scrcpy"]
    }

    Process {
        id: updateSyncAudioState

        running: true
        command: ["pidof", "scrcpy"]

        stdout: SplitParser {
            onRead: (data) => {
                // if not empty then set toggled to true
                syncAudio.enabled = data.length > 0;
            }
        }

    }

    StyledToolTip {
        content: qsTr("Mirror Audio Of Phone")
    }

}
