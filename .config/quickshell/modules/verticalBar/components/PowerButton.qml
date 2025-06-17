import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell.Hyprland
import "root:/modules/common"
import "root:/modules/common/widgets"

Item {
    id: root

    property bool hovered: false

    implicitWidth: background.implicitWidth
    implicitHeight: background.implicitHeight

    Rectangle {
        id: background

        radius: Appearance.rounding.full
        implicitWidth: powerIcon.implicitWidth + 10
        implicitHeight: powerIcon.implicitHeight + 10
        color: hovered ? Qt.darker(Appearance.colors.colLayer1, 1.2) : Appearance.colors.colLayer1
        antialiasing: true

        MaterialSymbol {
            id: powerIcon

            text: "power_settings_new"
            font.pixelSize: Appearance.font.pixelSize.large
            anchors.centerIn: parent
            color: Appearance.m3colors.m3error
        }

        MouseArea {
            id: clickArea

            anchors.fill: parent
            cursorShape: Qt.PointingHandCursor
            hoverEnabled: true
            onClicked: Hyprland.dispatch("global quickshell:sessionToggle")
            onEntered: hovered = true
            onExited: hovered = false
        }

    }

}
