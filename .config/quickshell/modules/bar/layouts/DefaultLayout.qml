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
    id: defaultLayoutItem
    width: parent.width
    height: parent.height
    
    property var barRoot
    property int barHeight: Appearance.sizes.barHeight
    property int osdHideMouseMoveThreshold: 20
   Rectangle {
    color: Appearance.colors.colLayer0
    width: parent.width
    height: parent.height 
    MouseArea { // Left side | scroll to change brightness
        id: barLeftSideMouseArea
        anchors.left: parent.left
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
            barLeftSideMouseArea.hovered = true
        }
        
        onExited: (event) => {
            barLeftSideMouseArea.hovered = false
            barLeftSideMouseArea.trackingScroll = false
        }
        
        onPressed: (event) => {
            if (event.button === Qt.LeftButton) {
                Hyprland.dispatch('global quickshell:sidebarLeftOpen')
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
                if (Math.sqrt(dx*dx + dy*dy) > osdHideMouseMoveThreshold) {
                    Hyprland.dispatch('global quickshell:osdBrightnessHide')
                    barLeftSideMouseArea.trackingScroll = false;
                }
            }
        }
        
        Item {  // Left section
            visible: Quickshell.screens.indexOf(barRoot.modelData) === 0
            anchors.fill: parent
            implicitHeight: leftSectionRowLayout.implicitHeight
            implicitWidth: leftSectionRowLayout.implicitWidth
            
            Components.ScrollHint {
                reveal: barLeftSideMouseArea.hovered
                icon: "light_mode"
                tooltipText: qsTr("Scroll to change brightness")
                side: "left"
                anchors.left: parent.left
                anchors.verticalCenter: parent.verticalCenter
            }
            
            RowLayout { // Content
                id: leftSectionRowLayout
                anchors.fill: parent
                spacing: 10
                
                Rectangle {
                    Layout.alignment: Qt.AlignLeft | Qt.AlignVCenter
                    Layout.leftMargin: Appearance.rounding.screenRounding
                    Layout.fillWidth: false
                    
                    // Layout.fillHeight: true
                    radius: Appearance.rounding.full
                    color: (barLeftSideMouseArea.pressed || GlobalStates.sidebarLeftOpen) ? Appearance.colors.colLayer1Active : barLeftSideMouseArea.hovered ? Appearance.colors.colLayer1Hover : "transparent"
                    implicitWidth: distroIcon.width + 5*2
                    implicitHeight: distroIcon.height + 5*2
                    
                    CustomIcon {
                        id: distroIcon
                        anchors.centerIn: parent
                        width: 19.5
                        height: 19.5
                        source: ConfigOptions.bar.topLeftIcon == 'distro' ? 
                            SystemInfo.distroIcon : "spark-symbolic"
                    }
                    
                    ColorOverlay {
                        anchors.fill: distroIcon
                        source: distroIcon
                        color: Appearance.colors.colOnLayer0
                    }
                }
                
                Components.ActiveWindow {
                    Layout.rightMargin: Appearance.rounding.screenRounding
                    Layout.fillWidth: true
                    bar: barRoot
                }
            }
        }
    }
    
    RowLayout { // Middle section
        id: middleSection
        anchors.centerIn: parent
        spacing: 8
        
        RowLayout {
            Layout.preferredWidth: Appearance.sizes.barCenterSideModuleWidth
            spacing: 4
            Layout.fillHeight: true
            implicitWidth: 350
            
            Components.Resources {
            }
            
            Components.Media {
                Layout.fillWidth: true
            }
        }
        
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            
            Components.Workspaces {
                bar: barRoot
                MouseArea { // Right-click to toggle overview
                    anchors.fill: parent
                    acceptedButtons: Qt.RightButton
                    
                    onPressed: (event) => {
                        if (event.button === Qt.RightButton) {
                            Hyprland.dispatch('global quickshell:overviewToggle')
                        }
                    }
                }
            }
        }
        
        RowLayout {
            Layout.preferredWidth: Appearance.sizes.barCenterSideModuleWidth + 30 
            Layout.fillHeight: true
            spacing: 4
            
            Components.ClockWidget {
                id: clockWidget
                Layout.alignment: Qt.AlignVCenter
                Layout.fillWidth: true
                MouseArea {
                    anchors.fill: clockWidget
                    acceptedButtons: Qt.LeftButton
                    onClicked: (event) => {
                        Hyprland.dispatch('global quickshell:glanceToggle')
                    }
                }
            }            
            Components.UtilButtons {
                Layout.alignment: Qt.AlignVCenter
            }
        }
    }
    
    MouseArea { // Right side | scroll to change volume
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
            
            Components.ScrollHint {
                reveal: barRightSideMouseArea.hovered
                icon: "volume_up"
                tooltipText: qsTr("Scroll to change volume")
                side: "right"
                anchors.right: parent.right
                anchors.verticalCenter: parent.verticalCenter
            }
            
            RowLayout {
                visible: Quickshell.screens.indexOf(barRoot.modelData) === 0
                id: rightSectionRowLayout
                anchors.fill: parent
                spacing: 5
                layoutDirection: Qt.RightToLeft
                
                Rectangle {
                    Layout.margins: 4
                    Layout.rightMargin: Appearance.rounding.screenRounding
                    Layout.fillHeight: true
                    implicitWidth: indicatorsRowLayout.implicitWidth + 10*2
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
    }}
}
