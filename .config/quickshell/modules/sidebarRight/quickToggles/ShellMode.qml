import "../"
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"


QuickToggleButton {
    id: darkModeButton

    property bool darkModeEnabled: false
    property string currentMode: PersistentStates.temp.currentScheme

    toggled: darkModeEnabled
    buttonIcon: toggled ? "dark_mode" : "light_mode" // Or a relevant icon
    buttonName: toggled ? "Dark" : "Light"
    onClicked: {
        darkModeButton.darkModeEnabled = !darkModeButton.darkModeEnabled;
        if (darkModeEnabled) {

            PersistentStateManager.setState("temp.enableDarkMode", true);
            Hyprland.dispatch(`exec ${Directories.wallpaperSwitchScriptPath} --type '${currentMode}' --lastused --mode dark`);
        } else {
            PersistentStateManager.setState("temp.enableDarkMode", false);
            Hyprland.dispatch(`exec ${Directories.wallpaperSwitchScriptPath} --type '${currentMode}' --lastused --mode light`);

        }
    }

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
