import QtQuick
import QtQuick.Layouts
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

Rectangle {
    property bool borderless: ConfigOptions.appearance.borderless

    implicitWidth: columnLayout.implicitWidth + 10
    implicitHeight: columnLayout.implicitHeight
    color: borderless ? "transparent" : Appearance.colors.colLayer1
    radius: Appearance.rounding.small

    ColumnLayout {
        id: columnLayout

        spacing: 0

        StyledText {
            id: timeText

            font.pixelSize: Appearance.font.pixelSize.small * 1.1
            color: Appearance.colors.colOnLayer1
            text: DateTime.time
        }

        StyledText {
            id: dateText

            font.pixelSize: Appearance.font.pixelSize.smallest
            color: Appearance.colors.colOnLayer1
            opacity: 0.8
            text: DateTime.date
        }

    }

}
