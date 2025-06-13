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
    width: 200
    height: 40

    // Define the focused screen
    property var focusedScreen: Quickshell.screens.find(s => s.name === Hyprland.focusedMonitor?.name)
    MaterialSymbol {
            z:2
            text: brightnessSlider.value > 0.5 ? "light_mode" : "dark_mode"
            color:Appearance.m3colors.m3onPrimary
            font.pixelSize:Appearance.font.pixelSize.huge - 4
            anchors.verticalCenter: parent.verticalCenter
            anchors.left: brightnessSlider.left
            anchors.leftMargin: 10
            opacity:brightnessSlider.value > 0.25 ? 1 : 0  
        
    }
    StyledSlider {
        id: brightnessSlider

        anchors.fill: parent
        from: 0
        to: 1
        stepSize: 0.01
        z:1
        property var brightnessMonitor: Brightness.getMonitorForScreen(focusedScreen)
        property bool userChanging: false

        // Sync with monitor brightness when changed externally
        Connections {
            target: brightnessMonitor
            ignoreUnknownSignals: true

            onBrightnessChanged: {
                if (!brightnessSlider.userChanging) {
                    brightnessSlider.value = brightnessMonitor?.brightness ?? 0.5;
                }
            }
        }

        // Handle user interaction
        onPressedChanged: {
            if (!pressed) userChanging = false;
        }

        onValueChanged: {
            if (pressed && brightnessMonitor) {
                userChanging = true;
                brightnessMonitor.setBrightness(value);
            }
        }

        // Set initial value
        Component.onCompleted: {
            if (brightnessMonitor && brightnessMonitor.ready)
                value = brightnessMonitor.brightness;
        }
    }
}
