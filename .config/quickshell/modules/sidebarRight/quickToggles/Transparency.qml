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
    property real hyprlandOpacity: root.toggled ? 1 - Appearance.transparency : 1
    
    buttonName: toggled ? "Transluscent" : "opaque"
    toggled: PersistentStates.temp.enableTransparency
    buttonIcon: toggled ? "blur_on" : "blur_off"
    
    onClicked: {
        PersistentStateManager.setState("temp.enableTransparency", !toggled);
        
        // Update kitty transparency
        Hyprland.dispatch(`exec sed -i '10s/.*/background_opacity ${kittyOpacity}/' /home/pharmaracist/.config/kitty/kitty.conf`);
        
        // Set transparency for specific applications
        if (toggled) {
            // Enable transparency for various apps
            Hyprland.dispatch(`exec hyprctl setprop class:^.* alpha ${hyprlandOpacity}`);
        } else {
            // Disable transparency (set to opaque)
            Hyprland.dispatch(`exec hyprctl setprop class:kitty alpha 1`);
        }
    }
}