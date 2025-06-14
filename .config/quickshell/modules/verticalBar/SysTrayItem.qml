import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Services.SystemTray
import Quickshell.Widgets
import "root:/modules/common/"
import "root:/modules/common/functions/color_utils.js" as ColorUtils

Item {
    id: root

    required property var bar
    required property SystemTrayItem item
    property bool targetMenuOpen: false
    property int trayItemWidth: 18

    implicitWidth: trayItemWidth
    implicitHeight: trayItemWidth // Assume square tray item
    Layout.alignment: Qt.AlignHCenter

    MouseArea {
        id: clickArea

        anchors.fill: parent
        acceptedButtons: Qt.LeftButton | Qt.RightButton
        onClicked: (event) => {
            switch (event.button) {
            case Qt.LeftButton:
                item.activate();
                break;
            case Qt.RightButton:
                if (item.hasMenu)
                    menu.open();

                break;
            }
            event.accepted = true;
        }
    }

    QsMenuAnchor {
        id: menu

        menu: root.item.menu
        anchor.window: bar
        anchor.rect.x: root.x + bar.width
        anchor.rect.y: root.y + bar.height / 2.8
        anchor.rect.height: root.height
        anchor.edges: Edges.Bottom
    }

    IconImage {
        id: trayIcon

        anchors.fill: parent
        source: root.item.icon
        visible: !ConfigOptions.bar.desaturateTray
    }

    Desaturate {
        id: desaturatedIcon

        anchors.fill: parent
        source: trayIcon
        desaturation: 1
        visible: ConfigOptions.bar.desaturateTray
    }

    ColorOverlay {
        anchors.fill: parent
        source: ConfigOptions.bar.desaturateTray ? desaturatedIcon : trayIcon
        color: ColorUtils.transparentize(Appearance.m3colors.m3primary, 0.3)
    }

}
