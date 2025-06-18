import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Wayland
import "root:/"
import "root:/modules/common"
import "root:/modules/verticalBar/layouts"
import "root:/services"

Scope {
    id: bar
    readonly property bool showOnMainScreenOnly: ConfigOptions.bar.showOnMainScreenOnly 

    // Layout switching
    property string currentLayout: "Default"
    
    function setLayout(layoutName) {
        currentLayout = layoutName
    }

    Variants {
        model: Quickshell.screens

        PanelWindow {
            id: barRoot
            property ShellScreen modelData

            WlrLayershell.layer: WlrLayer.Top
            screen: modelData
            WlrLayershell.namespace: "quickshell:Bar"
            color: "transparent"
            anchors {
                left:true
                top:true
                bottom:true
            }
            // Simple lazy loader
            Loader {
                id: layoutLoader
                anchors {
                    fill: parent
                    horizontalCenter: parent.horizontalCenter
                }
                source: `./layouts/${currentLayout}.qml`
                asynchronous: true
                onLoaded: {
                    if (item) {
                        item.barRoot = barRoot
                        item.modelData = modelData
                        
                        if (item.windowWidth !== undefined) {
                            barRoot.implicitWidth = item.windowWidth
                        }
                        if (item.windowHeight !== undefined) {
                            barRoot.implicitHeight = item.windowHeight
                        }
                        if (item.windowExclusiveZone !== undefined) {
                            barRoot.exclusiveZone = item.windowExclusiveZone
                        }
                    }
                }
            }
        }
    }
}