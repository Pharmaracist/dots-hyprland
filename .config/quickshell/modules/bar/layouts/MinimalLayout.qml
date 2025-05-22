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
    
    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: Appearance.rounding.screenRounding
        anchors.rightMargin: Appearance.rounding.screenRounding
        spacing: 10
        
        // Center - workspaces only
        Item {
            Layout.fillWidth: true
            Layout.fillHeight: true
            
            Components.Workspaces {
                anchors.left: parent.left
                bar: barRoot
            }
        }
        
        // Right - just clock
        Item {
            id: middleSection
            Layout.fillHeight: true
            Layout.preferredWidth: Components.ClockWidget.implicitWidth + 20
            
            Components.ClockWidget {
                Layout.alignment: Qt.AlignVCenter
                anchors.centerIn: parent
            }
        }
        
    // Right side container - ensure MouseArea captures all events
    MouseArea { 
        id: barRightSideMouseArea
        anchors.right: parent.right
        implicitHeight: barHeight
        width: (parent.width - middleSection.width) / 2
        
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
        
        Item {
            anchors.fill: parent
            implicitHeight: rightSectionRowLayout.implicitHeight 
            implicitWidth: rightSectionRowLayout.implicitWidth
            
            RowLayout {
                id: rightSectionRowLayout
                anchors.fill: parent
                spacing: 5
                layoutDirection: Qt.RightToLeft
                anchors.rightMargin:  - 0.5 * Appearance.rounding.screenRounding                
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
            }
        }
    }
}
