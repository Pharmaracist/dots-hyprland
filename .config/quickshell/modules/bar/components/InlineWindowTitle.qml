import "root:/modules/common"
import "root:/modules/common/widgets"
import QtQuick
import QtQuick.Layouts
import Quickshell.Wayland
import Quickshell.Hyprland

Item {
    required property var bar
    readonly property HyprlandMonitor monitor: Hyprland.monitorFor(bar.screen)
    readonly property Toplevel activeWindow: ToplevelManager.activeToplevel
        height: parent.height
        Layout.alignment: Qt.AlignVCenter

        StyledText {
            anchors.centerIn: parent
            font.pixelSize: Appearance.font.pixelSize.large
            font.family: Appearance.font.family.monospace
            color: Appearance.colors.colOnLayer1
            font.weight: 700
            text: activeWindow?.activated ? activeWindow?.appId : qsTr("Desktop")
            elide: Text.ElideLeft
        }
    }
