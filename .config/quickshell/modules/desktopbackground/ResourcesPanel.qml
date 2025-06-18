import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "root:/modules/bar/components"

Scope {
    PanelWindow {
        WlrLayershell.layer: WlrLayer.Bottom
        color: "transparent"
        exclusiveZone: -1
        WlrLayershell.namespace: "quickshell:resourcesPanel"
        implicitHeight:100
        implicitWidth: rowLayout.width + 300
        anchors {
            right: true
            bottom: true
        }
        Rectangle {
            id:bg
            anchors.right: parent.right
            anchors.bottom: parent.bottom
            implicitHeight:46
            implicitWidth: rowLayout.width + 100
            color: Appearance.colors.colLayer0
            topLeftRadius: Appearance.rounding.screenRounding

        Rectangle {
            implicitWidth: rowLayout.width +50
            implicitHeight:60
            radius: Appearance.rounding.screenRounding
            color: Appearance.colors.colLayer1
            anchors.margins: 8
            anchors.fill: parent
            RowLayout {
            id: rowLayout
            spacing: 10
            anchors.centerIn:  parent
            anchors.margins: 10
            Resource {
                iconName: "memory"
                percentage: ResourceUsage.memoryUsedPercentage
            }

            Resource {
                iconName: "swap_horiz"
                percentage: ResourceUsage.swapUsedPercentage
            }

            Resource {
                iconName: "settings_slow_motion"
                percentage: ResourceUsage.cpuUsage
            }

            Resource {
                iconName: "memory_alt"
                percentage: ResourceUsage.gpuUsage
            }
            }
        }    
        }

    RoundCorner {
        size: Appearance.rounding.screenRounding -5
        corner: cornerEnum.bottomRight
        color:  Appearance.colors.colLayer0 
        anchors {
            bottom: bg.top
            right: bg.right
            rightMargin: Appearance.sizes.frameThickness
        }
    }
    RoundCorner {
        size: Appearance.rounding.screenRounding - 5
        corner: cornerEnum.bottomRight
        color:  Appearance.colors.colLayer0 
        anchors {
            bottom: bg.bottom
            right: bg.left
            bottomMargin: Appearance.sizes.frameThickness
        }
    }
    mask: Region {
    }

    }

}
