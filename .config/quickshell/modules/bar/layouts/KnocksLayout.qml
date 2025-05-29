// Import bar components
import "../components" as Components
import Qt5Compat.GraphicalEffects
import QtNetwork
import QtQuick
import QtQuick.Controls
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
    property int chunkHeight: 44
    property real sideMargin: Appearance.rounding.screenRounding
    property real commonSpacing: 10
    property color backgroundColor: Appearance.colors.colLayer0
    property real commonRadius: Appearance.rounding.normal
    property color borderColor: Appearance.colors.colSubtext
    property int defaultBorderWidth: 0
    property int centerBorderWidth: 0
    property real useShortenedForm: (Appearance.sizes.barHellaShortenScreenWidthThreshold >= screen.width) ? 2 : (Appearance.sizes.barShortenScreenWidthThreshold >= screen.width) ? 1 : 0

    width: parent.width
    height: parent.height

    RowLayout {
        id: leftSection

        width: chunkWidth
        height: parent.height
        Layout.leftMargin: sideMargin

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
                // visible: barRoot.useShortenedForm === 0
                Layout.fillWidth: true
                bar: barRoot
                width: chunkWidth
                height: chunkHeight
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

            Layout.preferredWidth: media.implicitWidth > chunkWidth ? media.implicitWidth + 16 : chunkWidth
            Layout.preferredHeight: chunkHeight
            color: backgroundColor
            radius: commonRadius

            border {
                color: borderColor
                width: defaultBorderWidth
            }

            RowLayout {
                width: parent.width
                height: parent.height

                Components.Media {
                    id: media

                    Layout.fillHeight: true
                    Layout.alignment: Qt.AlignCenter
                }

            }

        }

        Rectangle {
            id: centerChunk

            Layout.preferredWidth: workspaces.width + 16
            Layout.preferredHeight: chunkHeight
            color: backgroundColor
            radius: commonRadius

            border {
                color: borderColor
                width: centerBorderWidth
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

            Layout.preferredWidth: rightChunkRow.implicitWidth > chunkWidth ? rightChunkRow.implicitWidth : chunkWidth
            Layout.preferredHeight: chunkHeight
            color: backgroundColor
            radius: commonRadius

            border {
                color: borderColor
                width: defaultBorderWidth
            }

            MouseArea {
                implicitWidth: parent.width
                implicitHeight: parent.height
                acceptedButtons: Qt.LeftButton
                onClicked: (event) => {
                    if (event.button === Qt.LeftButton)
                        Hyprland.dispatch('global quickshell:sidebarRightToggle');

                }
            }

            RowLayout {
                id: rightChunkRow

                width: chunkWidth
                height: chunkHeight

                RowLayout {
                    Layout.alignment: Qt.AlignCenter

                    Components.StackedClockWidget {
                        color: "transparent"
                    }

                    Components.StatusIcons {
                        id: statusIcons

                        width: Appearance.sizes.barCenterSideModuleWidth
                        height: chunkHeight
                        commonIconColor: Appearance.colors.colOnLayer1
                    }

                    Components.Resources {
                        Layout.preferredHeight: chunkHeight
                        width: Appearance.sizes.barCenterSideModuleWidth
                        height: parent.height
                        color: "transparent"
                    }

                    Components.MinimalBattery {
                        visible: UPower.displayDevice.isLaptopBattery
                        width: Appearance.sizes.barCenterSideModuleWidth
                        height: parent.height
                    }

                }

            }

        }

    }

    RowLayout {
        height: parent.height
        Layout.alignment: Qt.AlignRight
        Layout.rightMargin: sideMargin

        Components.SysTray {
            Layout.preferredWidth: chunkWidth
            Layout.preferredHeight: chunkHeight
            bar: barRoot
        }

    }

}
