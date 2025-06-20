import "root:/modules/common"
import "root:/modules/common/widgets"
import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Hyprland
import Quickshell.Services.Pipewire

Rectangle {
    id: root
    property bool borderless: ConfigOptions.bar.borderless
    Layout.alignment: Qt.AlignVCenter 
    implicitWidth: rowLayout.implicitWidth + rowLayout.spacing * 2
    implicitHeight: barHeight
    color: borderless ? "transparent" : Appearance.colors.colLayer1
    radius: Appearance.rounding.small

    RowLayout {
        id: rowLayout

        spacing: 4
        anchors.centerIn: parent

        Loader {
            active: ConfigOptions.bar.utilButtons.showScreenSnip
            visible: ConfigOptions.bar.utilButtons.showScreenSnip
            sourceComponent: CircleUtilButton {
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
        }

         Loader {
             active: ConfigOptions.bar.utilButtons.showColorPicker
             visible: ConfigOptions.bar.utilButtons.showColorPicker
             sourceComponent: CircleUtilButton {
                 Layout.alignment: Qt.AlignVCenter
                 onClicked: Hyprland.dispatch("exec hyprpicker -a")
                 MaterialSymbol {
                     horizontalAlignment: Qt.AlignHCenter
                     fill: 1
                     text: "colorize"
                     iconSize: Appearance.font.pixelSize.large
                     color: Appearance.colors.colOnLayer2
                 }
             }
         }

        Loader {
            active: ConfigOptions.bar.utilButtons.showMicToggle
            visible: ConfigOptions.bar.utilButtons.showMicToggle
            sourceComponent: CircleUtilButton {
                Layout.alignment: Qt.AlignVCenter
                onClicked: Hyprland.dispatch("exec wpctl set-mute @DEFAULT_SOURCE@ toggle")
                MaterialSymbol {
                    horizontalAlignment: Qt.AlignHCenter
                    fill: 0
                    text: Pipewire.defaultAudioSource?.audio?.muted ? "mic_off" : "mic"
                    iconSize: Appearance.font.pixelSize.large
                    color: Appearance.colors.colOnLayer2
                }
            }
        }
    }
}
