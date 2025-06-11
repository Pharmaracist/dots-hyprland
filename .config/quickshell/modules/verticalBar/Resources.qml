import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Services.Mpris

Rectangle {
    property bool borderless : false
    color:  Appearance.colors.colLayer2
    radius: Appearance.rounding.small
    implicitWidth: columnLayout.width + 4
    implicitHeight: columnLayout.height + 23
    anchors.horizontalCenter: parent.horizontalCenter                                    

    ColumnLayout {
        id: columnLayout
        anchors.centerIn: parent

        spacing: 10
        
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

    }

}
