import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "root:/services" as Services
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
    
Rectangle {
    anchors.fill: parent
    radius: Appearance.rounding.screenRounding
    color: Appearance.colors.colLayer0
 
    Rectangle {
        id: leftGradientRect
        anchors {
            left: parent.left
            leftMargin: Appearance.rounding.screenRounding * 0.25
            verticalCenter: parent.verticalCenter
        }
        radius: Appearance.rounding.full
        width: leftSection.implicitWidth * 1.02 // Add some padding
        height: parent.height * 0.75
        color: isHovered ? Appearance.colors.colSecondaryContainerActive : Appearance.colors.colPrimaryContainerActive
        Behavior on color { ColorAnimation { duration: 600 } }
        
        property bool isHovered: false
        
        MouseArea {
            anchors.fill: parent
            hoverEnabled: true
            acceptedButtons: Qt.LeftButton | Qt.RightButton
            onEntered: leftGradientRect.isHovered = true
            onExited: leftGradientRect.isHovered = false
            onClicked: (event) => {
                if (event.button === Qt.LeftButton) {
                    Hyprland.dispatch('global quickshell:sidebarLeftToggle')
                }
                else if (event.button === Qt.RightButton) {
                    Hyprland.dispatch('global quickshell:overviewToggle')
                }
            }
            // Pass through to inner mouse areas
            propagateComposedEvents: true
        }
        
        RowLayout {
            id: leftSection
            Layout.fillWidth: true
            anchors.verticalCenter: parent.verticalCenter
            spacing: 10
            
            RowLayout {
                Layout.alignment: Qt.AlignLeft | Qt.AlignVCenter
                Components.MinimalBattery {
                    id: battery
                    visible: Services.SystemInfo.hasBattery
                }
                Components.Workspaces {
                    id: workspaces
                    bar: barRoot
                }
            }
        }
    }
    Components.InlineWindowTitle {
        bar: barRoot
        anchors.left: leftGradientRect.right
        anchors.leftMargin: 10
        anchors.verticalCenter: parent.verticalCenter
        visible: Quickshell.screens.indexOf(barRoot.modelData) === 1

    }
    MouseArea {
        id: barLeftSideMouseArea
        acceptedButtons: Qt.LeftButton
        anchors.left: leftGradientRect.right
        anchors.leftMargin: 10
        width: clockWidget.x - anchors.leftMargin - leftGradientRect.width - leftGradientRect.anchors.leftMargin
        height: parent.height
        
        property bool hovered: false
        property real lastScrollX: 0
        property real lastScrollY: 0
        property bool trackingScroll: false
        property int osdHideMouseMoveThreshold: 20
        
        hoverEnabled: true
        propagateComposedEvents: true
        
        onEntered: (event) => {
            barLeftSideMouseArea.hovered = true
        }
        
        onExited: (event) => {
            barLeftSideMouseArea.hovered = false
            barLeftSideMouseArea.trackingScroll = false
        }
        
        onPressed: (event) => {
            if (event.button === Qt.LeftButton) {
                Hyprland.dispatch('global quickshell:sidebarLeftToggle')
            }
        }
        
        // Scroll to change brightness
        WheelHandler {
            onWheel: (event) => {
                if (event.angleDelta.y < 0)
                    barRoot.brightnessMonitor.setBrightness(barRoot.brightnessMonitor.brightness - 0.05);
                else if (event.angleDelta.y > 0)
                    barRoot.brightnessMonitor.setBrightness(barRoot.brightnessMonitor.brightness + 0.05);
                // Store the mouse position and start tracking
                barLeftSideMouseArea.lastScrollX = event.x;
                barLeftSideMouseArea.lastScrollY = event.y;
                barLeftSideMouseArea.trackingScroll = true;
            }
            acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
        }
        
        onPositionChanged: (mouse) => {
            if (barLeftSideMouseArea.trackingScroll) {
                const dx = mouse.x - barLeftSideMouseArea.lastScrollX;
                const dy = mouse.y - barLeftSideMouseArea.lastScrollY;
                if (Math.sqrt(dx*dx + dy*dy) > barLeftSideMouseArea.osdHideMouseMoveThreshold) {
                    Hyprland.dispatch('global quickshell:osdBrightnessHide')
                    barLeftSideMouseArea.trackingScroll = false;
                }
            }
        }
        
        Components.ScrollHint {
            reveal: barLeftSideMouseArea.hovered
            icon: "light_mode"
            tooltipText: qsTr("Scroll to change brightness")
            side: "left"
            anchors.left: parent.left
            anchors.leftMargin: 10
            anchors.verticalCenter: parent.verticalCenter
        }
    }
    MouseArea {
        anchors.centerIn: parent
        acceptedButtons: Qt.LeftButton | Qt.RightButton
        width: parent.width / 10
        height: parent.height
        onPressed: (event) => {
            if (event.button === Qt.LeftButton) {
                Hyprland.dispatch('global quickshell:overviewToggle')
            }
            else if (event.button === Qt.RightButton) {
                Hyprland.dispatch('global quickshell:mediaControlsToggle')
            }
        }
    }
    Rectangle {
        id: middleSection
        anchors {
            centerIn: parent
            verticalCenter: parent.verticalCenter
        }
        width: Appearance.sizes.barCenterSideModuleWidth * 0.8
        height: leftGradientRect.height
         color:"transparent"
    }
    Components.ClockWidget {
        id: clockWidget
        anchors.centerIn: middleSection
    }
    Rectangle {
        id: rightGradientRect
        anchors {
            right: parent.right
            rightMargin: Appearance.rounding.screenRounding * 0.25
            verticalCenter: parent.verticalCenter
        }
        width: rightSectionRowLayout.implicitWidth 
        height: leftGradientRect.height
        color: isHovered ? 
            (Appearance.colors.colSecondaryContainerActive) : 
            (Appearance.colors.colPrimaryContainerActive)
        Behavior on color { ColorAnimation { duration: 300 } }
        
        property bool isHovered: false
        
        MouseArea {
            anchors.fill: parent
            hoverEnabled: true
            acceptedButtons: Qt.LeftButton | Qt.RightButton
            onEntered: rightGradientRect.isHovered = true
            onExited: rightGradientRect.isHovered = false
            onClicked: (event) => {
                if (event.button === Qt.LeftButton) {
                    Hyprland.dispatch('global quickshell:sidebarRightOpen')
                }
                else if (event.button === Qt.RightButton) {
                    MprisController.activePlayer.next()
                }
            }
            propagateComposedEvents: true
        }
        
        RowLayout {
            id: rightSectionRowLayout
            anchors.fill: rightGradientRect
            Layout.alignment: Qt.AlignRight | Qt.AlignVCenter
            spacing: 10
            
            Components.SysTray {
                bar: barRoot
                Layout.fillHeight: true
            }
            
            Rectangle {
                Layout.rightMargin: 20
                Layout.fillHeight: true
                implicitWidth: indicatorsRowLayout.implicitWidth 
                radius: Appearance.rounding.full
                color: "transparent"
                
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
        }
    }
}
}
