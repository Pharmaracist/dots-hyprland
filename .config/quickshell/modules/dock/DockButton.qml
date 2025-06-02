import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"

RippleButton {
    Layout.fillHeight: true
    implicitWidth: implicitHeight - topInset - bottomInset
    buttonRadius: Appearance.rounding.normal
    topInset: dockVisualBackground.margin + dockRow.padding
    bottomInset: dockVisualBackground.margin + dockRow.padding
}
