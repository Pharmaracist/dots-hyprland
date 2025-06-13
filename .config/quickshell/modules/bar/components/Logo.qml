import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects
import Qt5Compat.GraphicalEffects
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

    Layout.preferredHeight: distroIcon.width + 12
    Layout.preferredWidth: distroIcon.width + 12

    Rectangle {
        id: background
        radius: Appearance.rounding.full
        color: Appearance.m3colors.m3secondaryContainer
        width: distroIcon.width + 12
        height: distroIcon.height + 9

        scale: hovered ? 1.1 : 1.0
        Behavior on scale {
            NumberAnimation {
                duration: 200
                easing.type: Easing.InOutQuad
            }
        }

        MouseArea {
            anchors.fill: parent
            hoverEnabled: true
            cursorShape: Qt.PointingHandCursor
            onEntered: logoComponent.hovered = true
            onExited: logoComponent.hovered = false
            onClicked: Hyprland.dispatch('global quickshell:sidebarLeftToggle')
        }

        CustomIcon {
            id: distroIcon
            anchors.centerIn: parent
            width: parent.height * 0.6
            height: parent.height * 0.5
            source: SystemInfo.distroIcon
        }

        ColorOverlay {
            id: overlay
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
    }
}
