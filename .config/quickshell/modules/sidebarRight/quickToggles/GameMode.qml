import "../"
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import "root:/modules/common"
import "root:/modules/common/widgets"

QuickToggleButton {
    // gameModeOn.running = true

    property bool enabled: false

    buttonIcon: "gamepad"
    buttonName: "GameMode"
    toggled: enabled
    onClicked: {
        enabled = !enabled;
        if (enabled)
            Hyprland.dispatch(`exec hyprctl --batch "keyword animations:enabled 0; keyword decoration:shadow:enabled 0; keyword decoration:blur:enabled 0; keyword general:gaps_in 0; keyword general:gaps_out 0; keyword general:border_size 1; keyword input: sensitivity 0;  keyword decoration:rounding 0; keyword general:allow_tearing 1"`);
        else
            Hyprland.dispatch("exec hyprctl reload");
    }

    StyledToolTip {
        content: qsTr("Game mode")
    }

}
