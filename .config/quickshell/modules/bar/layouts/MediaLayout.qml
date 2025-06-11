// Import bar components
import "../components" as Components
import Qt5Compat.GraphicalEffects
import QtNetwork
import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Services.Mpris
import Quickshell.Services.UPower
import Quickshell.Services.SystemTray
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

Item {
    id: mediaLayout

    property var barRoot
    property int chunkWidth: 350
        property int chunkHeight: Appearance.sizes.barHeight
            property real sideMargin: Appearance.rounding.screenRounding
                property real commonSpacing: 10
                    property real commonRadius: Appearance.rounding.normal

                        width: parent.width
                        height: parent.height

                        RowLayout {
                            width: chunkWidth
                            height: parent.height
                            anchors.leftMargin: -Appearance.rounding.screenRounding

                            MouseArea {
                                anchors.fill:parent
                                acceptedButtons: Qt.LeftButton
                                onClicked: (event) => {
                                if (event.button === Qt.LeftButton)
                                    Hyprland.dispatch('global quickshell:sidebarLeftToggle');
                            }
                        }

                    }

                    RowLayout {
                        width: parent.implicitWidth
                        height: parent.height
                        // anchors.centerIn: parent
                        spacing: commonSpacing
                        // Circular Icons on Left
                        Components.Logo {
                            id:logo
                            visible:!battery.visible
                        }
                        Components.MinimalBattery {
                            id: battery
                            visible: UPower.displayDevice.isLaptopBattery
                        }

                        Rectangle {
                            id: wsChunk

                            Layout.preferredWidth: workspaces.width + 16
                            Layout.preferredHeight: chunkHeight
                            color: Appearance.colors.colLayer0
                            radius: commonRadius

                            RectangularShadow {
                                visible: !PersistentStates.temp.enableTransparency
                                anchors.fill: wsChunk
                                radius: knocksLayout.radius
                                blur: 1.2 * Appearance.sizes.elevationMargin
                                spread: 2
                                color: Appearance.colors.colShadow

                            }

                            MouseArea {
                                width: wsChunk.width
                                height: wsChunk.height
                                acceptedButtons: Qt.RightButton
                                onClicked: (event) => {
                                if (event.button === Qt.RightButton)
                                    Hyprland.dispatch('global quickshell:overviewToggle');

                            }
                        }

                        RowLayout {
                            width: parent.width
                            height: parent.height

                            Components.Workspaces {
                                id: workspaces

                                Layout.alignment: Qt.AlignCenter
                                bar: barRoot
                            }

                        }
                    }
                }
                Rectangle {
                    id: centerChunk
                    width:clock.width + 16
                    height:chunkHeight
                    color: Appearance.colors.colLayer0
                    radius: commonRadius
                    anchors.centerIn:parent
                    RectangularShadow {
                        visible: !PersistentStates.temp.enableTransparency
                        anchors.fill: parent
                        radius: parent.radius
                        blur: 1.2 * Appearance.sizes.elevationMargin
                        spread: 2
                        color: Appearance.colors.colShadow

                    }

                    MouseArea {
                        width: parent.width
                        height: parent.height
                        acceptedButtons: Qt.RightButton | Qt.LeftButton
                        onClicked: (event) => {
                        if (event.button === Qt.RightButton)
                            Hyprland.dispatch('global quickshell:overviewToggle');
                        if (event.button === Qt.LeftButton)
                            Hyprland.dispatch('global quickshell:glanceToggle');

                    }
                }
                Components.ClockWidget {
                    id :clock
                    anchors.centerIn:centerChunk
                }
            }
            Rectangle {
                id: rightChunk
                anchors.right:parent.right
                width:indicatorsAreaRow.width + 50
                height:chunkHeight
                color: Appearance.colors.colLayer0
                radius: commonRadius
                RectangularShadow {
                    visible: !PersistentStates.temp.enableTransparency
                    anchors.fill: parent
                    radius: parent.radius
                    blur: 1.2 * Appearance.sizes.elevationMargin
                    spread: 2
                    color: Appearance.colors.colShadow

                }

                MouseArea {
                    width: parent.width
                    height: parent.height
                    acceptedButtons: Qt.RightButton | Qt.LeftButton
                    onClicked: (event) => {
                    if (event.button === Qt.RightButton)
                        Hyprland.dispatch('global quickshell:overviewToggle');
                    if (event.button === Qt.LeftButton)
                        Hyprland.dispatch('global quickshell:glanceToggle');

                }
            }
            RowLayout {
                id: indicatorsAreaRow
                spacing: commonSpacing
                anchors.centerIn:parent
                Layout.fillWidth:true

                Components.SysTray {
                    bar: barRoot
                    visible: SystemTray.items.values.length > 0
                }

                Components.StatusIcons {}

            }
        }

    }

