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
    property ShellScreen modelData: Quickshell.screens[1]

    PanelWindow {
        exclusiveZone: -1
        screen: modelData
        WlrLayershell.layer: WlrLayer.Background
        color: "transparent"
        implicitWidth: clock.width
        implicitHeight: clock.height

        anchors {
            top: true
        }

        margins {
            top: 500
        }

        ColumnLayout {
            id: clock

            spacing: 5

            Text {
                // font
                font.family: "stretch pro"
                color: Appearance.colors.colOnLayer2
                font.pixelSize: 100
                opacity: 0.85
                Layout.alignment: Qt.AlignHCenter
                text: DateTime.time
            }

            Text {
                // Date
                font.family: "stretch pro"
                color: Appearance.colors.colOnLayer1
                font.pixelSize: 30
                opacity: 0.6
                Layout.alignment: Qt.AlignCenter
                text: DateTime.date
            }

        }

        mask: Region {
        }

    }

}
