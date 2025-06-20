import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Services.Mpris

Rectangle {
    property bool borderless : ConfigOptions.appearance.borderless
    implicitWidth: rowLayout.implicitWidth + rowLayout.anchors.leftMargin + rowLayout.anchors.rightMargin
    implicitHeight: barHeight
    color: borderless ? "transparent" : Appearance.colors.colLayer1
    radius: Appearance.rounding.small

    RowLayout {
        id: rowLayout

        spacing: 0
        anchors.fill: parent
        anchors.leftMargin: 12
        anchors.rightMargin: 12

        Resource {
            iconName: "memory"
            percentage: ResourceUsage.memoryUsedPercentage
        }

        Resource {
            iconName: "swap_horiz"
            percentage: ResourceUsage.swapUsedPercentage
            shown: (ConfigOptions.bar.resources.alwaysShowSwap && percentage > 0) || (MprisController.activePlayer?.trackTitle == null)
            Layout.leftMargin: shown ? 4 : 0
        }

        Resource {
            iconName: "settings_slow_motion"
            percentage: ResourceUsage.cpuUsage
            shown: ConfigOptions.bar.resources.alwaysShowCpu || !(MprisController.activePlayer?.trackTitle?.length > 0)
            Layout.leftMargin: shown ? 4 : 0
        }

    }

}
