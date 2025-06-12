import "../"
import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

QuickToggleButton {
    id: root

    property real kittyOpacity: root.toggled ? Appearance.transparency : 1

    toggled: PersistentStates.temp.enableTransparency
    buttonIcon: toggled ? "blur_on" : "blur_off"
    onClicked: {
        PersistentStateManager.setState("temp.enableTransparency", !toggled);
        Hyprland.dispatch(`exec sed -i '10s/.*/background_opacity ${kittyOpacity}/' /home/pharmaracist/.config/kitty/kitty.conf`);
    }
}
