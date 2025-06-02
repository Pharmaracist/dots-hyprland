import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

Item {
    id: logoComponent

    property var barRoot

    // Layout.alignment: Qt.AlignLeft | Qt.AlignVCenter
    Layout.preferredWidth: distroIcon.width + 10
    Layout.preferredHeight: parent.height * 0.75

    Rectangle {
        radius: Appearance.rounding.full
        color: Appearance.colors.colLayer3
        width: distroIcon.width + 9
        height: distroIcon.height + 9

        CustomIcon {
            id: distroIcon

            anchors.centerIn: parent
            width: parent.height * 0.5
            height: parent.height * 0.5
            source: ConfigOptions.bar.topLeftIcon != 'distro' ? SystemInfo.distroIcon : "spark-symbolic"
        }

        ColorOverlay {
            anchors.fill: distroIcon
            source: distroIcon
            color: Appearance.colors.colPrimaryActive
        }

    }

}
