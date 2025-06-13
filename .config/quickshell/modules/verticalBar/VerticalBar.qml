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
    readonly property int barWidth: Appearance.sizes.barWidth
    readonly property int osdHideMouseMoveThreshold: 20
    property bool showBarBackground: ConfigOptions.bar.showBackground
    readonly property bool showOnMainScreenOnly: ConfigOptions.bar.showOnMainScreenOnly || false
    readonly property MprisPlayer activePlayer: MprisController.activePlayer
    readonly property string cleanedTitle: StringUtils.cleanMusicTitle(activePlayer?.trackTitle) || qsTr("No media")

    // For each monitor
    Variants {
        model: Quickshell.screens

        // Bar window
        PanelWindow {
            id: barRoot

            property ShellScreen modelData

            WlrLayershell.layer: WlrLayer.Top
            screen: modelData
            WlrLayershell.namespace: "quickshell:verticalBar"
            height: screen.height
            width: barContent.width + Appearance.rounding.screenRounding
            exclusiveZone: barWidth - Appearance.sizes.frameThickness
            color: "transparent"

            anchors {
                top: true
                bottom: true
                left: true
            }

            // Bar background
            Rectangle {
                id: barContent

                color: Appearance.colors.colLayer0
                width: barWidth

                anchors {
                    top: parent.top
                    bottom: parent.bottom
                    left: parent.left
                }

                ColumnLayout {
                    spacing: 10
                    anchors.top: parent.top
                    anchors.topMargin: Appearance.rounding.screenRounding
                    anchors.horizontalCenter: parent.horizontalCenter

                    NormalComponents.MinimalBattery {
                        id: battery

                        visible: UPower.displayDevice.isLaptopBattery
                    }

                    NormalComponents.Logo {
                        visible: !battery.visible
                        anchors.horizontalCenter: parent.horizontalCenter


                    }

                    Workspaces {
                        id:ws
                        bar: barRoot
                    }

                }  
                RowLayout {
                    id:rowLayout
                    anchors.centerIn: parent
                    Media {
                        id:media
                        visible: MprisController.activePlayer?.trackTitle?.length > 0
                    }
                    CombinedTitle {
                        bar: barRoot
                        visible:!media.visible
                    }
                    transform: Rotation {
                        angle: -90
                    }

                }

                ColumnLayout {
                    id: bottomArea

                    spacing: 20
                    anchors.bottom: parent.bottom
                    anchors.bottomMargin: 1.75 * Appearance.rounding.screenRounding
                    anchors.horizontalCenter: parent.horizontalCenter
                    implicitWidth: parent.width * 0.69

                    SysTray {
                        bar: barRoot
                    }

                    StatusIcons {
                    }

                    ClockWidget {
                        id: clock

                        MouseArea {
                            anchors.fill: parent
                            onClicked: Hyprland.dispatch('exec kclock')
                            cursorShape: Qt.PointingHandCursor
                            hoverEnabled: true
                        }

                    }

                    Item {
                        id: powerButton

                        anchors {
                            top: clock.bottom
                            topMargin: Appearance.rounding.screenRounding / 2.5
                            bottom: parent.bottom
                            bottomMargin: Appearance.rounding.screenRounding
                        }

                        Rectangle {
                            radius: Appearance.rounding.full
                            width: powerIcon.width + 8
                            height: powerIcon.height + 8
                            color: Appearance.colors.colLayer1

                            MaterialSymbol {
                                id: powerIcon

                                text: "power_settings_new"
                                font.pixelSize: Appearance.font.pixelSize.large
                                Layout.alignment: Qt.AlignHCenter | Qt.AlignVCenter
                                anchors.centerIn: parent
                                color: Appearance.m3colors.m3error
                            }

                            MouseArea {
                                anchors.fill: parent
                                cursorShape: Qt.PointingHandCursor
                                hoverEnabled: true
                                onClicked: Hyprland.dispatch('global quickshell:sessionToggle')
                            }

                        }

                    }

                }

            }

            RoundCorner {
                size: Appearance.rounding.screenRounding
                corner: cornerEnum.topLeft
                color: Appearance.colors.colLayer0

                anchors {
                    top: barContent.top
                    left: barContent.right
                    topMargin: Appearance.sizes.frameThickness
                }

            }

            RoundCorner {
                size: Appearance.rounding.screenRounding
                corner: cornerEnum.bottomLeft
                color: Appearance.colors.colLayer0

                anchors {
                    bottom: barContent.bottom
                    left: barContent.right
                    bottomMargin: Appearance.sizes.frameThickness
                }

            }

        }

    }

}
