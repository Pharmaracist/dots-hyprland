import QtQuick
import QtQuick.Layouts
import Quickshell.Hyprland
import Quickshell.Services.SystemTray
import Quickshell.Wayland
import Quickshell.Widgets
import Qt5Compat.GraphicalEffects
import "root:/modules/common"
import "root:/modules/common/widgets"

// TODO: More fancy animation
Item {
    id: root

    required property var bar

    width: parent.width
    implicitHeight: columnLayout.height + 30
    ColumnLayout {
        id: columnLayout

        anchors.fill: parent
        spacing: 4

        Repeater {
            model: SystemTray.items

            SysTrayItem {
                id: sysTrayIcon
                required property SystemTrayItem modelData
                anchors.horizontalCenter: parent.horizontalCenter
                bar: root.bar
                item: modelData
            }
        }

        StyledText {
            Layout.alignment: Qt.AlignHCenter
            font.pixelSize: Appearance.font.pixelSize.larger
            color: Appearance.colors.colSubtext
            text: "•"
            visible: SystemTray.items.values.length > 0
        }
    }
}
