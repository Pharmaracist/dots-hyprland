import "../"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io

QuickToggleButton {
    toggled: PersistentStates.temp.enableTransparency
    buttonIcon: toggled ? "blur_on" : "blur_off"
    onClicked: {
        PersistentStateManager.setState("temp.enableTransparency", !toggled)
    }

}
