import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

RippleButton {
    Layout.fillHeight: true
    implicitWidth: background.height
    buttonRadius: Appearance.rounding.normal

    topInset: dockVisualBackground.margin + dockRow.padding
    bottomInset: dockVisualBackground.margin + dockRow.padding
}
