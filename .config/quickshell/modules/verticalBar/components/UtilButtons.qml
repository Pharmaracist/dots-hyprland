import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/modules/bar/components"
Rectangle {
    id: root

    property bool borderless: ConfigOptions.appearance.borderless
        property string phoneLocalIP: ConfigOptions.hacks.phoneLocalIP
            property string phoneLocalPort: ConfigOptions.hacks.phoneLocalPort

                Layout.alignment: Qt.AlignVCenter
                implicitWidth: 30 //columnLayout.implicitWidth + columnLayout.spacing * 2
                implicitHeight: 100 //parent.height
                color: borderless ? "transparent" : Appearance.colors.colLayer1
                radius: Appearance.rounding.small
                ColumnLayout {
                    id: columnLayout

                    spacing: 4
                    anchors.centerIn: parent


                    CircleUtilButton {
                        Layout.alignment: Qt.AlignVCenter
                        onClicked: Hyprland.dispatch("exec hyprshot --freeze --clipboard-only --mode region --silent")

                        MaterialSymbol {
                            horizontalAlignment: Qt.AlignHCenter
                            fill: 1
                            text: "screenshot_region"
                            iconSize: Appearance.font.pixelSize.large
                            color: Appearance.colors.colOnLayer2
                        }

                    }

                    CircleUtilButton {
                        Layout.alignment: Qt.AlignVCenter
                        onClicked: Hyprland.dispatch("global quickshell:oskToggle")

                        MaterialSymbol {
                            horizontalAlignment: Qt.AlignHCenter
                            fill: 0
                            text: "keyboard"
                            iconSize: Appearance.font.pixelSize.large
                            color: Appearance.colors.colOnLayer2
                        }

                    }

                    CircleUtilButton {
                        Layout.alignment: Qt.AlignVCenter
                        onClicked: Hyprland.dispatch('global quickshell:wallpaperSelectorToggle')

                        MaterialSymbol {
                            horizontalAlignment: Qt.AlignHCenter
                            fill: 1
                            text: "dashboard"
                            iconSize: Appearance.font.pixelSize.normal
                            color: Appearance.colors.colOnLayer2
                        }

                    }
                    CircleUtilButton {
                        Layout.alignment: Qt.AlignVCenter
                        onClicked: Hyprland.dispatch(`exec killall scrcpy && scrcpy --tcpip='${phoneLocalIP}:${phoneLocalPort}' --audio-codec=opus --video-codec=h265 --max-fps=60 -K`)
                        MaterialSymbol {
                            horizontalAlignment: Qt.AlignHCenter
                            fill: 0
                            text: "phone_iphone"
                            iconSize: Appearance.font.pixelSize.large
                            color: Appearance.colors.colOnLayer2
                        }

                    }

                }

            }
