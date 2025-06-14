import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

ShellRoot {
    property string time

    PanelWindow {
        WlrLayershell.layer: WlrLayer.Bottom
        color: "transparent"
        implicitWidth: clock.width + 100
        implicitHeight: date.height + clock.height + Appearance.sizes.hyprlandGapsOut + 30
        exclusiveZone: -1

        anchors {
            left: true
            bottom: true
        }

        ColumnLayout {
            anchors.leftMargin: PersistentStates.bar.verticalMode ? Appearance.sizes.barWidth + Appearance.sizes.hyprlandGapsOut + Appearance.sizes.frameThickness + 20 : Appearance.sizes.frameThickness
            anchors.left: parent.left
            anchors.bottomMargin: 20 + Appearance.sizes.hyprlandGapsOut + Appearance.sizes.frameThickness
            anchors.bottom: parent.bottom

            Text {
                id: clock

                // font
                font.family: Appearance.font.family.niche
                color: Appearance.colors.colOnLayer2
                font.pixelSize: 80
                opacity: 0.85
                Layout.alignment: Qt.AlignLeft
                text: DateTime.time
            }

            Text {
                id: date

                // Date
                font.family: Appearance.font.family.niche
                color: Appearance.colors.colOnLayer1
                font.pixelSize: 40
                opacity: 0.6
                Layout.alignment: Qt.AlignLeft
                text: DateTime.date
            }

        }

        mask: Region {
        }

    }

}
