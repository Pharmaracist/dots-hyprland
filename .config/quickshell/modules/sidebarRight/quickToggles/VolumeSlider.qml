import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Wayland
import Quickshell.Services.Pipewire
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services/"

Item {
    id: root
    Layout.fillWidth: true
    Layout.preferredHeight: 40
    width: 200
    height: 40

    property var sink: Audio.sink
    property var audioReady: Audio.ready && !!sink && !!sink.audio

    MaterialSymbol {
        z: 2
        text: {
            if (volumeSlider.value <= 0.01) return "volume_off"
            else if (volumeSlider.value < 0.5) return "volume_down"
            else return "volume_up"
        }
        color: Appearance.m3colors.m3onPrimary
        font.pixelSize: Appearance.font.pixelSize.huge - 4
        anchors.verticalCenter: parent.verticalCenter
        anchors.left: volumeSlider.left
        anchors.leftMargin: 10
        opacity: volumeSlider.value > 0.05 ? 1 : 0.3

        ColorAnimation {
            duration: Appearance.animation.elementMove.duration
            easing.type: Appearance.animation.elementMove.type
        }
    }

    StyledSlider {
        id: volumeSlider

        anchors.fill: parent
        Layout.fillWidth: true
        Layout.preferredHeight: 40
        from: 0
        to: 1
        stepSize: 0.01
        z: 1

        property bool userChanging: false

        // Sync slider with external volume changes
        Connections {
            target: sink?.audio
            ignoreUnknownSignals: true

            function onVolumeChanged() {
                if (!pressed && sink?.audio && Math.abs(value - sink.audio.volume) > 0.005) {
                    value = sink.audio.volume;
                }
            }
        }

        onPressedChanged: if (!pressed) userChanging = false

        onValueChanged: {
            if (pressed && sink?.audio) {
                userChanging = true;
                sink.audio.volume = value;
            }
        }

        Component.onCompleted: {
            if (sink?.audio)
                value = sink.audio.volume;
        }
    }
}
