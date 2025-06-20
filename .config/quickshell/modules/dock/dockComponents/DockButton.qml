import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"

RippleButton {
    Layout.fillHeight: true
    Layout.topMargin: Appearance.sizes.elevationMargin - Appearance.sizes.hyprlandGapsOut
    implicitWidth: implicitHeight - topInset - bottomInset
    buttonRadius: Appearance.rounding.normal
    topInset: Appearance.sizes.hyprlandGapsOut - 15
    bottomInset: Appearance.sizes.hyprlandGapsOut - 15
}
