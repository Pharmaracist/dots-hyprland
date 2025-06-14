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
import "root:/modules/verticalBar/" as VerticalComponents
import "root:/services"

Item {
    id: knocksLayout

    property var barRoot
    property int chunkWidth: 350
    property int chunkHeight: parent.height
    property real commonSpacing: 12
    property real padding: 0.75
    property real commonRadius: Appearance.rounding.full

    implicitWidth: parent.width
    implicitHeight: parent.height

    RowLayout {
        id: leftSection

        anchors.left: parent.left
        anchors.leftMargin: Appearance.rounding.screenRounding
        spacing: commonSpacing

        Components.ActiveWindow {
            id: activeWindow

            bar: barRoot
            implicitHeight: barHeight
            implicitWidth: chunkWidth
        }

    }

    RowLayout {
        id: chunksRow

        anchors.centerIn: parent
        spacing: commonSpacing

        Rectangle {
            id: leftChunk

            implicitWidth: chunkWidth
            implicitHeight: chunkHeight
            color: Appearance.colors.colLayer0
            radius: commonRadius
            border.color: Appearance.colors.colOutline

            RectangularShadow {
                visible: !PersistentStates.temp.enableTransparency
                anchors.fill: leftChunk
                radius: knocksLayout.radius
                blur: 1.2 * Appearance.sizes.elevationMargin
                spread: 2
                color: Appearance.colors.colShadow
            }

            RowLayout {
                Layout.alignment: Qt.AlignVCenter | Qt.AlignHCenter
                Layout.fillWidth: true
                implicitWidth: chunkWidth

                Components.Media {
                    Layout.preferredWidth: chunkWidth - resources.implicitWidth
                }

                Components.Resources {
                    id: resources
                }

            }

        }

        Components.Workspaces {
            id: workspaces

            implicitHeight: barHeight * padding
            anchors.centerIn: parent
            bar: barRoot

            RectangularShadow {
                visible: !PersistentStates.temp.enableTransparency
                anchors.fill: parent
                radius: commonRadius
                blur: 1.2 * Appearance.sizes.elevationMargin
                spread: 2
                color: Appearance.colors.colShadow
            }

            MouseArea {
                anchors.fill: parent
                acceptedButtons: Qt.RightButton
                onClicked: (event) => {
                    if (event.button === Qt.RightButton)
                        Hyprland.dispatch('global quickshell:overviewToggle');

                }
            }

        }

        Rectangle {
            id: rightChunk

            implicitWidth: chunkWidth
            Layout.fillWidth: true
            implicitHeight: barHeight
            color: Appearance.colors.colLayer0
            radius: commonRadius
            border.color: Appearance.colors.colOutline

            RectangularShadow {
                visible: !PersistentStates.temp.enableTransparency
                anchors.fill: parent
                radius: commonRadius
                blur: 1.2 * Appearance.sizes.elevationMargin
                spread: 2
                color: Appearance.colors.colShadow
            }

            RowLayout {
                spacing: commonSpacing
                anchors.leftMargin: commonSpacing * 2
                anchors.rightMargin: 5
                anchors.fill: parent

                Components.StackedClockWidget {
                    MouseArea {
                        anchors.fill: parent
                        onClicked: {
                            Hyprland.dispatch('global quickshell:sidebarRightToggle');
                        }
                    }

                }

                Components.UtilButtons {
                    implicitHeight: barHeight * padding
                }

                Item {
                    Layout.fillWidth: true
                }

                Revealer {
                    id: sysTrayRevealer

                    reveal: false
                    implicitHeight: barHeight

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

                Components.MinimalBattery {
                    id: battery

                    visible: UPower.displayDevice.isLaptopBattery
                }

                Rectangle {
                    color: Appearance.colors.colLayer1
                    radius: commonRadius
                    implicitHeight: barHeight * padding
                    implicitWidth: statusIcons.implicitWidth + 25

                    Components.StatusIcons {
                        id: statusIcons

                        Layout.alignment: Qt.AlignVCenter | Qt.AlignHCenter
                    }

                    MouseArea {
                        anchors.fill: parent
                        onClicked: {
                            sysTrayRevealer.reveal = !sysTrayRevealer.reveal;
                        }
                    }

                }

            }

        }

    }

}
