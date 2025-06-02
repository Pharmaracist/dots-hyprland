import "../"
import Quickshell
import Quickshell.Io
import "root:/modules/common"
import "root:/modules/common/widgets"

QuickToggleButton {
    id: darkModeButton

    property bool darkModeEnabled: false

    toggled: darkModeEnabled
    buttonIcon: "contrast" // Or a relevant icon
    onClicked: {
        darkModeButton.darkModeEnabled = !darkModeButton.darkModeEnabled;
        if (darkModeEnabled)
            enableDarkMode.startDetached();
        else
            disableDarkMode.startDetached();
    }

    Process {
        id: enableDarkMode

        command: ["bash", "-c", "/home/pc/.config/quickshell/scripts/switchwall.sh --mode dark --noswitch"]
    }

    Process {
        id: disableDarkMode

        command: ["bash", "-c", "/home/pc/.config/quickshell/scripts/switchwall.sh --mode light --noswitch"]
    }
    // Detect current dark mode state using gsettings

    Process {
        id: updateDarkModeState

        running: true
        command: ["bash", "-c", "gsettings get org.gnome.desktop.interface color-scheme"]

        stdout: SplitParser {
            onRead: (data) => {
                // Typical output: "'prefer-dark'\n" or "'default'"
                darkModeButton.darkModeEnabled = data.includes("prefer-dark");
            }
        }

    }

    StyledToolTip {
        content: qsTr("Dark Mode")
    }

}
