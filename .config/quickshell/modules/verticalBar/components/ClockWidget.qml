import QtQuick
import QtQuick.Layouts
import "root:/modules/common"
import "root:/modules/common/functions/color_utils.js" as ColorUtils
import "root:/modules/common/widgets"
import "root:/services"

Rectangle {
    implicitHeight: columnLayout.height + 25
    implicitWidth: parent.width
    color: ColorUtils.transparentize(Appearance.m3colors.m3secondaryContainer, 0.4)
    radius: Appearance.rounding.small

    ColumnLayout {
        id: columnLayout

        spacing: 6

        anchors {
            centerIn: parent
        }

        StyledText {
            font.pixelSize: Appearance.font.pixelSize.normal
            font.family: Appearance.font.family.monospace
            font.weight: 700
            color: Appearance.m3colors.m3secondary
            text: DateTime.hour
            Layout.alignment: Qt.AlignHCenter
        }

        StyledText {
            font.family: Appearance.font.family.monospace
            font.pixelSize: Appearance.font.pixelSize.normal
            font.weight: 700
            color: Appearance.m3colors.m3primary
            text: DateTime.minute
            Layout.alignment: Qt.AlignHCenter
        }

        StyledText {
            visible: true
            font.family: Appearance.font.family.monospace
            font.pixelSize: Appearance.font.pixelSize.normal
            font.weight: 700
            color: Appearance.m3colors.m3tertiary
            text: DateTime.dayTime
            Layout.alignment: Qt.AlignHCenter
        }

    }

    MouseArea {
        anchors.fill: parent
        onClicked: Hyprland.dispatch('exec kclock')
        cursorShape: Qt.PointingHandCursor
        hoverEnabled: true
    }

}
