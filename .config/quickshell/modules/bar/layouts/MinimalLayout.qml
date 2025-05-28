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

// Import bar components
import "../components" as Components

Item {
    id: minimalLayout
    width: parent.width
    height: parent.height
    property var barRoot
    
    MouseArea {
        id: sidebarLeftArea
        acceptedButtons: Qt.LeftButton
        anchors {
            right: leftSectionRowLayout.left
            rightMargin: Appearance.rounding.screenRounding
        }
        implicitWidth: 20
        height: parent.height
        onPressed: (event) => {
            if (event.button === Qt.LeftButton) {
                Hyprland.dispatch('global quickshell:sidebarLeftToggle')
            }
        }
    }
    Rectangle {
        width: parent.width
        height: parent.height
        color: Appearance.colors.colLayer0

    RowLayout {
        id: leftSectionRowLayout
        anchors.left: parent.left
        anchors.leftMargin: Appearance.rounding.screenRounding 
        spacing: Appearance.sizes.spacing

        Components.MinimalBattery {
            visible: SystemInfo.hasBattery 
            id: battery
        }
        Components.Workspaces {
            id: workspaces
            bar: barRoot
        }
    }
    
    MouseArea {
        acceptedButtons: Qt.LeftButton
        anchors.left: leftSectionRowLayout.right
        anchors.leftMargin: 10
        width: parent.width - leftSectionRowLayout.implicitWidth
        height: parent.height
        onPressed: (event) => {
            if (event.button === Qt.LeftButton) {
                Hyprland.dispatch('global quickshell:sidebarLeftToggle')
            }
        }
    }
    
    MouseArea {
        anchors.centerIn: parent
        acceptedButtons: Qt.LeftButton | Qt.RightButton
        width: Appearance.sizes.barCenterSideModuleWidth
        height: parent.height
        onPressed: (event) => {
            if (event.button === Qt.LeftButton) {
                Hyprland.dispatch('global quickshell:mediaControlsToggle')
            }
            else if (event.button === Qt.RightButton) {
                Hyprland.dispatch('global quickshell:overviewToggle')
            }
        }
    }
    
    Components.ClockWidget {
        id: clockWidget
        Layout.alignment: Qt.AlignVCenter
        anchors.centerIn: parent
    }
    
    MouseArea { 
        id: barRightSideMouseArea
        anchors.left: clockWidget.right
        implicitHeight: barHeight
        width: parent.width / 2
        
        property bool hovered: false
        property real lastScrollX: 0
        property real lastScrollY: 0
        property bool trackingScroll: false
        
        acceptedButtons: Qt.LeftButton
        hoverEnabled: true
        propagateComposedEvents: true
        
        onEntered: (event) => {
            barRightSideMouseArea.hovered = true
        }
        
        onExited: (event) => {
            barRightSideMouseArea.hovered = false
            barRightSideMouseArea.trackingScroll = false
        }
        
        onPressed: (event) => {
            if (event.button === Qt.LeftButton) {
                Hyprland.dispatch('global quickshell:sidebarRightOpen')
            }
            else if (event.button === Qt.RightButton) {
                MprisController.activePlayer.next()
            }
        }
        
        // Scroll to change volume
        WheelHandler {
            onWheel: (event) => {
                const currentVolume = Audio.value;
                const step = currentVolume < 0.1 ? 0.01 : 0.02 || 0.2;
                if (event.angleDelta.y < 0)
                    Audio.sink.audio.volume -= step;
                else if (event.angleDelta.y > 0)
                    Audio.sink.audio.volume = Math.min(1, Audio.sink.audio.volume + step);
                // Store the mouse position and start tracking
                barRightSideMouseArea.lastScrollX = event.x;
                barRightSideMouseArea.lastScrollY = event.y;
                barRightSideMouseArea.trackingScroll = true;
            }
            acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
        }
        
        onPositionChanged: (mouse) => {
            if (barRightSideMouseArea.trackingScroll) {
                const dx = mouse.x - barRightSideMouseArea.lastScrollX;
                const dy = mouse.y - barRightSideMouseArea.lastScrollY;
                if (Math.sqrt(dx*dx + dy*dy) > osdHideMouseMoveThreshold) {
                    Hyprland.dispatch('global quickshell:osdVolumeHide')
                    barRightSideMouseArea.trackingScroll = false;
                }
            }
        }
        
        RowLayout {
            id: rightSectionRowLayout
            layoutDirection: Qt.RightToLeft
            height: parent.height
            anchors {
                right: parent.right
                rightMargin: 80 + Appearance.rounding.screenRounding
            }
            Layout.fillWidth: true
            
            Rectangle {
                Layout.margins: 4
                Layout.rightMargin: Appearance.rounding.screenRounding
                Layout.fillHeight: true
                implicitWidth: indicatorsRowLayout.implicitWidth + 20
                radius: Appearance.rounding.full
                color: (barRightSideMouseArea.pressed || GlobalStates.sidebarRightOpen) ? Appearance.colors.colLayer1Active : barRightSideMouseArea.hovered ? Appearance.colors.colLayer1Hover : "transparent"
                
                RowLayout {
                    id: indicatorsRowLayout
                    anchors.centerIn: parent
                    property real realSpacing: 15
                    spacing: 0
                    
                    Revealer {
                        reveal: Audio.sink?.audio?.muted ?? false
                        Layout.fillHeight: true
                        Layout.rightMargin: reveal ? indicatorsRowLayout.realSpacing : 0
                        Behavior on Layout.rightMargin {
                            NumberAnimation {
                                duration: Appearance.animation.elementMoveFast.duration
                                easing.type: Appearance.animation.elementMoveFast.type
                                easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
                            }
                        }
                        MaterialSymbol {
                            text: "volume_off"
                            iconSize: Appearance.font.pixelSize.larger
                            color: Appearance.colors.colOnLayer0
                        }
                    }
                    
                    Revealer {
                        reveal: Audio.source?.audio?.muted ?? false
                        Layout.fillHeight: true
                        Layout.rightMargin: reveal ? indicatorsRowLayout.realSpacing : 0
                        Behavior on Layout.rightMargin {
                            NumberAnimation {
                                duration: Appearance.animation.elementMoveFast.duration
                                easing.type: Appearance.animation.elementMoveFast.type
                                easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
                            }
                        }
                        MaterialSymbol {
                            text: "mic_off"
                            iconSize: Appearance.font.pixelSize.larger
                            color: Appearance.colors.colOnLayer0
                        }
                    }
                    
                    MaterialSymbol {
                        Layout.rightMargin: indicatorsRowLayout.realSpacing
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
                        iconSize: Appearance.font.pixelSize.larger
                        color: Appearance.colors.colOnLayer0
                    }
                    
                    MaterialSymbol {
                        text: Bluetooth.bluetoothConnected ? "bluetooth_connected" : Bluetooth.bluetoothEnabled ? "bluetooth" : "bluetooth_disabled"
                        iconSize: Appearance.font.pixelSize.larger
                        color: Appearance.colors.colOnLayer0
                    }
                }
            }
            
            Components.SysTray {
                bar: barRoot
                Layout.fillWidth: false
                Layout.fillHeight: true
            }
            
            Item {
                Layout.fillWidth: true
                Layout.fillHeight: true
            }
        }
    }}
}
