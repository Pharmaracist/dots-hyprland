import "root:/modules/common"
import "root:/modules/common/widgets"
import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io

Item {
    required property string iconName
    required property double percentage
    property bool shown: true
        clip: true
        implicitWidth:  resourceColumnLayout.width
        implicitHeight: resourceColumnLayout.height
        
        ColumnLayout {
            spacing: 6
            id: resourceColumnLayout
            
            CircularProgress {
                Layout.alignment: Qt.AlignHCenter
                lineWidth: 2
                value: percentage
                size: 26
                secondaryColor: Appearance.m3colors.m3secondaryContainer
                primaryColor: Appearance.m3colors.m3onSecondaryContainer

                MaterialSymbol {
                    anchors.centerIn: parent
                    fill: 1
                    text: iconName
                    iconSize: Appearance.font.pixelSize.normal
                    color: Appearance.m3colors.m3onSecondaryContainer
                }

            }

            StyledText {
                Layout.alignment: Qt.AlignHCenter
                color: Appearance.colors.colOnLayer1
                text: `${Math.round(percentage * 100)}`
            }


    }

    Behavior on implicitWidth {
    NumberAnimation {
        duration: Appearance.animation.elementMove.duration
        easing.type: Appearance.animation.elementMove.type
        easing.bezierCurve: Appearance.animation.elementMove.bezierCurve
    }
}
}