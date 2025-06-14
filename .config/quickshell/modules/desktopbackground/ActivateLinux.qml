import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Wayland

// Component to show a translucent activation reminder per screen
PanelWindow {
    id: w

    WlrLayershell.layer: WlrLayer.Background
    color: "transparent"
    exclusiveZone: -1
    implicitWidth: content.implicitWidth
    implicitHeight: content.implicitHeight

    anchors {
        right: true
        bottom: true
    }

    margins {
        right: 50
        bottom: 45
    }

    ColumnLayout {
        id: content

        spacing: 8

        Text {
            text: "Activate Linux"
            color: "#50ffffff"
            font.pointSize: 22
            horizontalAlignment: Text.AlignHCenter
        }

        Text {
            text: "Go to Settings to activate Linux"
            color: "#50ffffff"
            font.pointSize: 14
            horizontalAlignment: Text.AlignHCenter
        }

    }

    // Make the panel click-through
    mask: Region {
    }

}
