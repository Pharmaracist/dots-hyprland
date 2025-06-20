import "../"
import Quickshell
import Quickshell.Io
import "root:/modules/common"
import "root:/modules/common/widgets"

QuickToggleButton {
    id: nightLightButton

    property bool enabled: false

    toggled: enabled
    buttonName: "NightLight"
    buttonIcon: "nightlight"
    onClicked: {
        nightLightButton.enabled = !nightLightButton.enabled;
        if (enabled)
            nightLightOn.startDetached();
        else
            nightLightOff.startDetached();
    }

    Process {
        id: nightLightOn

        command: ["bash","-c","hyprsunset -t 5000"]
    }

    Process {
        id: nightLightOff

        command: ["pkill", "hyprsunset"]
    }

    Process {
        id: updateNightLightState

        running: true
        command: ["pidof", "hyprsunset"]

        stdout: SplitParser {
            onRead: (data) => {
                // if not empty then set toggled to true
                nightLightButton.enabled = data.length > 0;
            }
        }

    }

    StyledToolTip {
        content: qsTr("Night Light")
    }

}
