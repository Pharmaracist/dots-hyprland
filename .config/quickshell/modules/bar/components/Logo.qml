import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

Item {
    id: logoComponent

    property var barRoot
    property bool hovered: false
    readonly property int iconSize: 16

    // For Layouts (e.g., in a ColumnLayout)
    Layout.alignment: Qt.AlignHCenter
    Layout.preferredWidth: background.implicitWidth
    Layout.preferredHeight: background.implicitHeight
    // For standalone anchoring or parent layouting
    implicitWidth: background.implicitWidth
    implicitHeight: background.implicitHeight

    Rectangle {
        id: background

        // Final visual size
        width: iconSize + 12
        height: width
        radius: Appearance.rounding.full
        color: Appearance.m3colors.m3secondaryContainer
        scale: hovered ? 1.1 : 1
        implicitWidth: width
        implicitHeight: height

        MouseArea {
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onEntered: hovered = true
            onExited: hovered = false
            onClicked: Hyprland.dispatch("global quickshell:sidebarLeftToggle")
        }

        CustomIcon {
            id: distroIcon

            anchors.centerIn: parent
            width: background.width * 0.6
            height: background.height * 0.5
            source: SystemInfo.distroIcon
        }

        ColorOverlay {
            anchors.fill: distroIcon
            source: distroIcon
            color: hovered ? Appearance.m3colors.m3primary : Appearance.m3colors.m3onSecondaryContainer

            Behavior on color {
                ColorAnimation {
                    duration: Appearance.animation.elementMove.duration
                    easing.type: Appearance.animation.elementMove.type
                }

            }

        }

        Behavior on scale {
            NumberAnimation {
                duration: 200
                easing.type: Easing.InOutQuad
            }

        }

    }

}
