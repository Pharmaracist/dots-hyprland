import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Services.UPower
import Quickshell.Wayland
import Quickshell.Services.Mpris
import "root:/"
import "root:/modules/bar/components" as NormalComponents
import "root:/modules/common"
import "root:/modules/common/functions/color_utils.js" as ColorUtils
import "root:/modules/common/functions/string_utils.js" as StringUtils
import "root:/modules/common/widgets"
import "root:/services"

Scope {
    id: bar
    readonly property real padding: 0.8
    property int barWidth: Appearance?.sizes.barWidth ?? 37
    readonly property int osdHideMouseMoveThreshold: 20
    property bool showBarBackground: ConfigOptions.bar.showBackground
    readonly property bool showOnMainScreenOnly: ConfigOptions.bar.showOnMainScreenOnly || false
    readonly property MprisPlayer activePlayer: MprisController.activePlayer
    readonly property string cleanedTitle: StringUtils.cleanMusicTitle(activePlayer?.trackTitle) || qsTr("No media")

    Variants {
        model: Quickshell.screens

        PanelWindow {
            id: barRoot

            property ShellScreen modelData
            readonly property real padding: bar.padding

            WlrLayershell.layer: WlrLayer.Top
            screen: modelData
            WlrLayershell.namespace: "quickshell:verticalBar"
            implicitHeight: screen.height
            implicitWidth: barWidth + Appearance.rounding.screenRounding
            exclusiveZone: barWidth - Appearance.sizes.frameThickness
            color: "transparent"

            anchors {
                top: true
                bottom: true
                left: true
            }

            // Background rectangle (behind content)
            Rectangle {
                id: barBackground
                anchors {
                    top: parent.top
                    bottom: parent.bottom
                    left: parent.left
                }
                width: barWidth
                color: Appearance.colors.colLayer0
            

            // Main content layout
            ColumnLayout {
                id: barContent
                anchors.fill: parent
                anchors.margins: padding 
                anchors.bottomMargin:10 
                anchors.topMargin: 10
                ColumnLayout {
                    id: topArea
                    spacing: padding * 10
                    Layout.alignment: Qt.AlignTop | Qt.AlignHCenter

                    NormalComponents.MinimalBattery {
                        id: battery
                        visible: UPower.displayDevice.isLaptopBattery
                    }

                    NormalComponents.Logo {
                        visible: !battery.visible
                    }

                    Workspaces {
                        bar: barRoot
                    }
                }

                ColumnLayout {
                    id: bottomArea
                    spacing: padding * 10
                    Layout.alignment: Qt.AlignBottom | Qt.AlignHCenter
                    Layout.fillWidth: true

                    StatusIcons {}

                    ClockWidget {}

                    PowerButton {}
                }
            }
            }
            // Rounded corners (top left & bottom left)
            RoundCorner {
                size: Appearance.rounding.screenRounding
                corner: cornerEnum.topLeft
                color: Appearance.colors.colLayer0
                anchors {
                    top: barBackground.top
                    left: barBackground.right
                    topMargin: Appearance.sizes.frameThickness
                }
            }

            RoundCorner {
                size: Appearance.rounding.screenRounding
                corner: cornerEnum.bottomLeft
                color: Appearance.colors.colLayer0
                anchors {
                    bottom: barBackground.bottom
                    left: barBackground.right
                    bottomMargin: Appearance.sizes.frameThickness
                }
            }
        }
    }
}
