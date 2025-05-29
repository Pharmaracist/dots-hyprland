import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import Quickshell
import Quickshell.Hyprland
import Quickshell.Services.Mpris
import Quickshell.Io
import QtNetwork

RowLayout {
    id: indicatorsRowLayout
    
    // Common properties
    property real iconSpacing: 15
    property real commonIconSize: Appearance.font.pixelSize.larger
    property color commonIconColor: Appearance.colors.colOnLayer1
    property int animationDuration: Appearance.animation.elementMoveFast.duration
    property int animationType: Appearance.animation.elementMoveFast.type
    property var animationCurve: Appearance.animation.elementMoveFast.bezierCurve
    
    spacing: 0
    
    // KeyboardLayout {
    //     Layout.rightMargin: iconSpacing
    //     commonIconSize: indicatorsRowLayout.commonIconSize
    //     commonIconColor: indicatorsRowLayout.commonIconColor
    // }
    
    Revealer {
        reveal: Audio.sink?.audio?.muted ?? false
        Layout.fillHeight: true
        Layout.rightMargin: reveal ? iconSpacing : 0
        Behavior on Layout.rightMargin {
            NumberAnimation {
                duration: animationDuration
                easing.type: animationType
                easing.bezierCurve: animationCurve
            }
        }
        MaterialSymbol {
            text: "volume_off"
            iconSize: commonIconSize
            color: commonIconColor
        }
    }
    
    Revealer {
        reveal: Audio.source?.audio?.muted ?? false
        Layout.fillHeight: true
        Layout.rightMargin: reveal ? iconSpacing : 0
        Behavior on Layout.rightMargin {
            NumberAnimation {
                duration: animationDuration
                easing.type: animationType
                easing.bezierCurve: animationCurve
            }
        }
        MaterialSymbol {
            text: "mic_off"
            iconSize: commonIconSize
            color: commonIconColor
        }
    }
    
    MaterialSymbol {
        Layout.rightMargin: iconSpacing
        text: {
            if (NetworkInformation.TransportMedium.Ethernet) {
                return "lan";
            } else if (Network.networkName.length > 0 && Network.networkName !== "lo") {
                return Network.networkStrength > 80 ? "signal_wifi_4_bar" :
                    Network.networkStrength > 60 ? "network_wifi_3_bar" :
                    Network.networkStrength > 40 ? "network_wifi_2_bar" :
                    Network.networkStrength > 20 ? "network_wifi_1_bar" :
                    "signal_wifi_0_bar";
            } else {
                return "signal_wifi_off";
            }
        }
        iconSize: commonIconSize
        color: commonIconColor
    }
    
    MaterialSymbol {
        text: Bluetooth.bluetoothConnected ? "bluetooth_connected" : Bluetooth.bluetoothEnabled ? "bluetooth" : "bluetooth_disabled"
        iconSize: commonIconSize
        color: commonIconColor
    }
} 