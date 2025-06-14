import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Layouts
import Quickshell.Hyprland
import Quickshell.Services.SystemTray
import Quickshell.Wayland
import Quickshell.Widgets
import "root:/modules/common"
import "root:/modules/common/widgets"

Item {
    id: root

    required property var bar

    width: parent.width
    implicitHeight: 90

    ColumnLayout {
        id: columnLayout

        anchors.fill: parent
        spacing: 4

        Repeater {
            model: SystemTray.items

            SysTrayItem {
                required property SystemTrayItem modelData

                Layout.alignment: Qt.AlignHCenter
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
