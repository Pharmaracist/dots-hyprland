import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Wayland

ShellRoot {
    Variants {
        // Create the panel once on each monitor.
        model: Quickshell.screens

        PanelWindow {
            id: w

            property var modelData

        WlrLayershell.layer: WlrLayer.Background
            screen: modelData
            implicitWidth: content.width
            implicitHeight: content.height
            color: "transparent"
            // Use the wlroots specific layer property to ensure it displays over
            // fullscreen windows.
            anchors {
                right: true
                bottom: true
            }

            margins {
                right: 50
                bottom: 50
            }

            ColumnLayout {
                id: content

                Text {
                    text: "Activate Linux"
                    color: "#50ffffff"
                    font.pointSize: 22
                }

                Text {
                    text: "Go to Settings to activate Linux"
                    color: "#50ffffff"
                    font.pointSize: 14
                }

            }

            // Give the window an empty click mask so all clicks pass through it.
            mask: Region {
            }

        }

    }

}
