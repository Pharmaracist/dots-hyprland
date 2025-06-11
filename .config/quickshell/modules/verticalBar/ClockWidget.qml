import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import QtQuick
import QtQuick.Layouts

Rectangle {
    property bool borderless: ConfigOptions?.bar.borderless ?? false
        implicitHeight: columnLayout.height + 20
        implicitWidth: parent.width
        color: borderless ? "transparent" : Appearance.colors.colLayer1
        radius: Appearance.rounding.small

        ColumnLayout {
            id: columnLayout
            spacing: 6
            anchors {
                centerIn: parent
            }
            Layout.fillWidth:true

            StyledText {
                font.pixelSize: Appearance.font.pixelSize.normal
                font.family:Appearance.font.family.monospace
                font.weight: 700
                color: Appearance.m3colors.m3tertiary
                text: DateTime.hour
                Layout.alignment:Qt.AlignHCenter
            }

            StyledText {
                font.family:Appearance.font.family.monospace
                font.pixelSize: Appearance.font.pixelSize.normal
                font.weight: 700
                color: Appearance.m3colors.m3primary
                text: DateTime.minute
                Layout.alignment:Qt.AlignHCenter

            }

            StyledText {
                visible: true
                font.family:Appearance.font.family.monospace
                font.pixelSize: Appearance.font.pixelSize.normal
                font.weight: 700
                color: Appearance.m3colors.m3primary
                text: DateTime.dayTime
                Layout.alignment:Qt.AlignHCenter

            }
        }

    }
