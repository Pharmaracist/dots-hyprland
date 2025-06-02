import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import "root:/"
import "root:/modules/common"

Rectangle {
    Layout.topMargin: dockVisualBackground.margin + dockRow.padding + Appearance.rounding.small
    Layout.bottomMargin: dockVisualBackground.margin + dockRow.padding + Appearance.rounding.small
    Layout.fillHeight: true
    implicitWidth: 1
    color: Appearance.colors.colLayer3
}
