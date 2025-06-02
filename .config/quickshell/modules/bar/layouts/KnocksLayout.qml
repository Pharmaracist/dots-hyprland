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
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

Item {
    id: knocksLayout

    // Common properties
    property var barRoot
    property int chunkWidth: 350
    property int chunkHeight: parent.height
    property real sideMargin: Appearance.rounding.screenRounding
    property real commonSpacing: 10
    property real commonRadius: Appearance.rounding.normal

    width: parent.width
    height: parent.height

    RowLayout {
        id: leftSection

        width: chunkWidth
        height: parent.height

        MouseArea {
            Layout.fillWidth: true
            Layout.fillHeight: true
            Layout.leftMargin: sideMargin
            acceptedButtons: Qt.LeftButton
            onClicked: (event) => {
                if (event.button === Qt.LeftButton)
                    Hyprland.dispatch('global quickshell:sidebarLeftToggle');

            }

            Components.ActiveWindow {
                bar: barRoot
                anchors.leftMargin: -Appearance.rounding.screenRounding
                anchors.left: parent.left
            }

        }

    }

    RowLayout {
        id: centerSectionRowLayout

        width: implicitWidth
        height: parent.height
        anchors.centerIn: parent
        spacing: commonSpacing

        Rectangle {
            id: leftChunk

            implicitWidth: chunkWidth
            Layout.preferredHeight: chunkHeight
            color: Appearance.colors.colLayer0
            radius: commonRadius

            RectangularShadow {
                anchors.fill: leftChunk
                radius: knocksLayout.radius
                blur: 1.2 * Appearance.sizes.elevationMargin
                spread: 2
                color: Appearance.colors.colShadow
                cached: true
            }

            RowLayout {
                height: parent.height
                implicitWidth: chunkWidth

                Components.Media {
                    id: media

                    implicitWidth: chunkWidth - resources.implicitWidth - 16
                    Layout.fillHeight: true
                }

                Rectangle {
                    id: resourcesRec

                    color: Appearance.colors.colLayer2
                    radius: commonRadius
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                    height: 40
                    implicitWidth: resources.width
                    Layout.margins: 3

                    Components.Resources {
                        id: resources

                        implicitHeight: resourcesRec.height
                    }

                }

            }

        }

        Rectangle {
            id: centerChunk

            Layout.preferredWidth: workspaces.width + 16
            Layout.preferredHeight: chunkHeight
            color: Appearance.colors.colLayer0
            radius: commonRadius

            RectangularShadow {
                anchors.fill: centerChunk
                radius: knocksLayout.radius
                blur: 1.2 * Appearance.sizes.elevationMargin
                spread: 2
                color: Appearance.colors.colShadow
                cached: true
            }

            MouseArea {
                width: centerChunk.width
                height: centerChunk.height
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

        Rectangle {
            id: rightChunk

            Layout.preferredWidth: chunkWidth + (sysTrayRevealer.reveal ? sysTrayRevealer.width : 0)
            Layout.preferredHeight: chunkHeight
            color: Appearance.colors.colLayer0
            radius: commonRadius

            RectangularShadow {
                anchors.fill: rightChunk
                radius: knocksLayout.radius
                blur: 1.2 * Appearance.sizes.elevationMargin
                spread: 2
                color: Appearance.colors.colShadow
                cached: false
            }

            Components.StackedClockWidget {
                id: clock

                anchors {
                    verticalCenter: parent.verticalCenter
                    leftMargin: 18
                    left: parent.left
                }

                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        Hyprland.dispatch('global quickshell:glanceToggle');
                    }
                }

            }

            Rectangle {
                id: indicatorsAreaRec

                color: Appearance.colors.colLayer2
                height: chunkHeight * 0.8
                implicitWidth: parent.width - clock.width - 20
                radius: commonRadius

                anchors {
                    rightMargin: 3
                    verticalCenter: parent.verticalCenter
                    left: clock.right
                    leftMargin: 10
                    right: parent.right
                }

                Rectangle {
                    radius: commonRadius
                    color: Appearance.colors.colLayer3
                    height: parent.height * 0.8
                    anchors.verticalCenter: parent.verticalCenter
                    width: utils.width + 10
                    anchors.left: indicatorsAreaRec.left
                    anchors.leftMargin: 4

                    Components.UtilButtons {
                        id: utils
                    }

                }

                RowLayout {
                    id: indicatorsArea

                    anchors.right: parent.right
                    anchors.rightMargin: battery.visible ? 0 : 20
                    height: indicatorsAreaRec.height

                    Row {
                        id: indicatorsAreaRow

                        spacing: commonSpacing

                        Revealer {
                            id: sysTrayRevealer

                            Layout.rightMargin: reveal ? 15 : 0
                            reveal: false
                            Layout.fillWidth: true
                            height: parent.height

                            Components.SysTray {
                                bar: barRoot
                            }

                            Behavior on Layout.rightMargin {
                                NumberAnimation {
                                    duration: Appearance.animation.elementMoveFast.duration
                                    easing.type: Appearance.animation.elementMoveFast.type
                                    easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
                                }

                            }

                        }

                        Components.StatusIcons {
                            MouseArea {
                                anchors.fill: parent
                                onClicked: {
                                    sysTrayRevealer.reveal = !sysTrayRevealer.reveal;
                                }
                            }

                        }

                    }

                    Components.MinimalBattery {
                        id: battery

                        visible: UPower.displayDevice.isLaptopBattery
                    }

                }

            }

        }

    }

    MouseArea {
        height: parent.height
        width: chunkWidth
        anchors.right: parent.right
        onClicked: {
            Hyprland.dispatch('global quickshell:sidebarRightToggle');
        }
    }

}
