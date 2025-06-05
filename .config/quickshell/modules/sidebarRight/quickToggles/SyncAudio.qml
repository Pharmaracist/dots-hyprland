import "../"
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import "root:/modules/common"
import "root:/modules/common/widgets"

QuickToggleButton {
    id: syncAudio

    property bool enabled: false
    property string phoneLocalIP: ConfigOptions.hacks.phoneLocalIP

    toggled: enabled
    buttonIcon: "equalizer"
    onClicked: {
        syncAudio.enabled = !syncAudio.enabled;
        if (enabled)
            Hyprland.dispatch(`exec scrcpy --no-video --audio-codec=opus --tcpip='${phoneLocalIP}:5555' --no-control`)
        else
            Hyprland.dispatch('exec killall scrcpy')
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
