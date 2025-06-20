import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Wayland
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services/"

Item {
    id: root
    Layout.fillWidth: true
    Layout.preferredHeight: 40

    property var focusedScreen: Quickshell.screens.find(s => s.name === Hyprland.focusedMonitor?.name)
    property var brightnessMonitor: Brightness.getMonitorForScreen(focusedScreen)

    MaterialSymbol {
        z: 2
        text: brightnessSlider.value > 0.5 ? "light_mode" : "dark_mode"
        color: Appearance.m3colors.m3onPrimary
        font.pixelSize: Appearance.font.pixelSize.huge - 4
        anchors.verticalCenter: parent.verticalCenter
        anchors.left: brightnessSlider.left
        anchors.leftMargin: 10
        opacity: brightnessSlider.value > 0.25 ? 1 : 0.3
    }

    StyledSlider {
        id: brightnessSlider

        anchors.fill: parent
        Layout.fillWidth: true
        Layout.preferredHeight: 40
        from: 0
        to: 1
        stepSize: 0.01

        property bool userChanging: false

        Connections {
            target: brightnessMonitor
            ignoreUnknownSignals: true

            function onBrightnessChanged() {
                if (!userChanging && brightnessMonitor)
                    brightnessSlider.value = brightnessMonitor.brightness;
            }
        }

        onPressedChanged: if (!pressed) userChanging = false

        onValueChanged: {
            if (pressed && brightnessMonitor) {
                userChanging = true;
                brightnessMonitor.setBrightness(value);
            }
        }

        Component.onCompleted: {
            if (brightnessMonitor?.ready)
                value = brightnessMonitor.brightness;
        }
    }
}
