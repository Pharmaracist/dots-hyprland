import "root:/modules/common"
import "root:/modules/common/widgets"
import QtQuick
import QtQuick.Layouts
import Quickshell.Wayland
import Quickshell.Hyprland

Item {
    id:root
    required property var bar
    readonly property HyprlandMonitor monitor: Hyprland.monitorFor(bar.screen)
    readonly property string cleanTitle: StringUtils.cleanMusicTitle(activePlayer?.trackTitle) || qsTr("No media")
    readonly property Toplevel activeWindow: ToplevelManager.activeToplevel
        height: parent.height
        Layout.alignment: Qt.AlignVCenter
        StyledText {
            anchors.centerIn: parent
            font.pixelSize: Appearance.font.pixelSize.large
            font.family: Appearance.font.family.monospace
            font.weight: 700
            Layout.alignment: Qt.AlignVCenter
            color: Appearance.colors.colOnLayer1
            // text: (MprisController.activePlayer?.trackTitle?.length > 0 ? cleanTitle || qsTr("No media") : activeWindow?.activated ? activeWindow?.appId : qsTr("Desktop") )
            text: activeWindow?.activated ? activeWindow?.appId : qsTr("Desktop")
        }

    }
