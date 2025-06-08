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
        exclusiveZone: -1
        WlrLayershell.layer: WlrLayer.Bottom
        color: "transparent"
        implicitHeight: 180
        implicitWidth: 1000

        anchors {
            left: true
            bottom: true
        }

        margins {
            left: 50
        }

        ColumnLayout {
            spacing: 5

            Text {
                // font
                font.family: Appearance.font.family.niche
                color: Appearance.colors.colOnLayer2
                font.pixelSize: 80
                opacity: 0.85
                Layout.alignment: Qt.AlignLeft
                text: DateTime.time
            }

            Text {
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
