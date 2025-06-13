import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/modules/common/functions/color_utils.js" as ColorUtils
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell.Io

GroupButton {
    id: button
    property string buttonIcon
    property string buttonName
    baseWidth: (Appearance.sizes.sidebarWidth / 2) - 40 
    baseHeight: 45
    clickedWidth: baseWidth + 20
    toggled: false
    buttonRadius: (altAction && toggled) ? Appearance.rounding.large : Math.min(baseHeight, baseWidth) / 2
    buttonRadiusPressed: Appearance?.rounding?.small

    contentItem:RowLayout {
        spacing: 10
        anchors.horizontalCenter: parent.horizontalCenter
        MaterialSymbol {
              iconSize: Appearance.font.pixelSize.larger
              fill: toggled ? 1 : 0
              color: toggled ? Appearance.m3colors.m3onPrimary : Appearance.colors.colOnLayer1
              horizontalAlignment: Text.AlignHLeft
              verticalAlignment: Text.AlignVCenter
              Layout.leftMargin: parent.spacing /2
              text: buttonIcon

              Behavior on color {
                  animation: Appearance.animation.elementMoveFast.colorAnimation.createObject(this)
              }
          }
        StyledText {
                Layout.fillWidth: true
                horizontalAlignment: windowRoot.textHorizontalAlignment
                font.pixelSize: Appearance.font.pixelSize.normal
                font.family:Appearance.font.family.title
                color: toggled ? Appearance.m3colors.m3onPrimary : Appearance.colors.colOnLayer1
                text: buttonName
        }
    } 
  

}
