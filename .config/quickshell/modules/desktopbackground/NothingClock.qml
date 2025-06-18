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
        implicitHeight: date.height + clock.height + Appearance.sizes.hyprlandGapsOut 
        exclusiveZone: -1

        anchors {
            left: true
            bottom: true
        }

        ColumnLayout {
            anchors {
                fill: parent
                leftMargin: 80
                bottomMargin: 80
            }
            spacing: -20 
            Text {
                id: clock

                // font
                font.family: Appearance.font.family.niche
                color: Appearance.colors.colOnLayer2
                font.pixelSize: 100
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
