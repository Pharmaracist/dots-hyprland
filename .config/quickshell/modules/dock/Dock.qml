// Performance-optimized Dock.qml with minimal, essential animations
import "root:/"
import "root:/services"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/modules/dock/dockComponents"
import "root:/modules/dock/dockContent"
import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import QtQuick.Layouts
import Quickshell.Io
import Quickshell
import Quickshell.Widgets
import Quickshell.Wayland
import Quickshell.Hyprland

Scope {
    id: root
    
    property bool pinned: PersistentStates.dock.pinned
    property int currentContent: 1 // 0: media player, 1: apps, 2: power menu 3: overview 4: wallpaper selector
    property int defaultContent: 1 // Default mode to return to
    property var focusedScreen: Quickshell?.screens.find(s => s.name === Hyprland.focusedMonitor?.name) ?? Quickshell.screens[0]
    property int frameThickness: Appearance.sizes.frameThickness
    property real commonRadius: Appearance.rounding.screenRounding + 10
    property int overviewHeight: 400
    property int overviewWidth: 1400
    property bool animating: false // Prevent multiple animations
    
    // Auto-return timer configuration
    property int autoReturnDelay: 3000
    property var autoReturnExceptions: [1, 3] // Modes that don't auto-return (apps, overview)
    
    readonly property var contentComponents: [mediaPlayer, normalDock, powerMenu, overview, wallpaperSelector]
    
    // Timer for auto-return to default mode
    Timer {
        id: autoReturnTimer
        interval: root.autoReturnDelay
        repeat: false
        running: false
        
        onTriggered: {
            if (!root.autoReturnExceptions.includes(root.currentContent)) {
                root.currentContent = root.defaultContent
            }
        }
    }
    
    function resetAutoReturnTimer() {
        if (!root.autoReturnExceptions.includes(root.currentContent)) {
            autoReturnTimer.restart()
        } else {
            autoReturnTimer.stop()
        }
    }
    
    onCurrentContentChanged: {
        resetAutoReturnTimer()
    }
    
    Variants {
        model: pinned ? Quickshell.screens : [focusedScreen]

        Loader {
            id: dockLoader
            required property var modelData
            active: ConfigOptions?.dock.hoverToReveal || (!ToplevelManager.activeToplevel?.activated)

            sourceComponent: PanelWindow {
                id: dock
                screen: dockLoader.modelData
                
                property bool shouldReveal: root.pinned
                    || (ConfigOptions?.dock.hoverToReveal && mouseArea.containsMouse)
                    || (contentLoader.item && contentLoader.item.requestDockShow === true)
                    || (!ToplevelManager.activeToplevel?.activated)

                anchors { bottom: true; left: true; right: true }
                
                // Simplified exclusiveZone - no elevation issues
                exclusiveZone: root.pinned 
                    ? implicitHeight - (Appearance.sizes.hyprlandGapsOut * 2) + frameThickness
                    : -1
                
                // Animated sizing for smooth transitions
                implicitWidth: {
                    if (root.currentContent == 3) return 1386
                    if (root.currentContent == 4) return 1440
                    return (dockRow.implicitWidth + 16)
                }
                implicitHeight: {
                    if (root.currentContent == 3) return 355
                    if (root.currentContent == 4) return 200
                    return (dockRow.implicitHeight + 20)
                }
                
                WlrLayershell.namespace: "quickshell:dock"
                color: "transparent"
                mask: Region { item: mouseArea }

                MouseArea {
                    id: mouseArea
                    anchors {
                        top: parent.top
                        left: parent.left
                        right: parent.right
                        topMargin: calculateTopMargin()
                    }
                    height: parent.height
                    hoverEnabled: true
                    
                    onEntered: root.resetAutoReturnTimer()
                    onPositionChanged: root.resetAutoReturnTimer()

                    function calculateTopMargin() {
                        if (dock.shouldReveal) return 0
                        if (ConfigOptions?.dock.hoverToReveal) {
                            return dock.implicitHeight - ConfigOptions.dock.hoverRegionHeight
                        }
                        return dock.implicitHeight + 1
                    }

                    // Main dock container
                    Item {
                        id: background
                        anchors.fill:  parent
                        // Animated size calculation
                        implicitWidth: {
                            if (root.currentContent == 3) return 1386
                            if (root.currentContent == 4) return 1440
                            return (dockRow.implicitWidth + 16)
                        }
                        implicitHeight: {
                            if (root.currentContent == 3) return 355
                            if (root.currentContent == 4) return 200
                            return (dockRow.implicitHeight + 20)
                        }
                        
                        // Smooth background size transitions
                        Behavior on implicitWidth {
                                                       NumberAnimation {
                                    duration: Appearance.animation.elementMoveFast.duration 
                                    easing.type: Appearance.animation.elementMove.bezierCurve 
                                }

                       
                       
                        }
                        
                        Behavior on implicitHeight {
                                NumberAnimation {
                                    duration: Appearance.animation.elementMoveFast.duration
                                    easing.type: Appearance.animation.elementMove.bezierCurve 
                                }

                        }
                        
                        StyledRectangularShadow { target: dockRect }

                        Rectangle {
                            id: dockRect
                            anchors {
                                bottom: parent.bottom
                                horizontalCenter: parent.horizontalCenter
                            }
                            // Animated binding for smooth size changes
                            width: background.implicitWidth
                            height: background.implicitHeight
                            
                            // Smooth dock rectangle size transitions
                            Behavior on width {
                                NumberAnimation {
                                    duration: Appearance.animation.elementMoveFast.duration + 50
                                    easing.type: Appearance.animation.elementMove.bezierCurve 
                                }
                            }
                             Behavior on height {
                                NumberAnimation {
                                    duration: Appearance.animation.elementMoveFast.duration + 50
                                    easing.type: Appearance.animation.elementMove.bezierCurve 
                                }
                            }
                            
                            color: Appearance.colors.colLayer0
                            topRightRadius: (root.currentContent == 3) ? 1.25 * commonRadius : commonRadius
                            topLeftRadius: (root.currentContent == 3) ? 1.25 * commonRadius : commonRadius

                            // Content container - simplified
                            Item {
                                anchors.fill: parent
                                
                                // Normal dock row
                                RowLayout {
                                    id: dockRow
                                    anchors {
                                        bottom: parent.bottom
                                        horizontalCenter: parent.horizontalCenter
                                        bottomMargin:frameThickness                                    
                                    }
                                    spacing: 5
                                    visible: !([3, 4].includes(root.currentContent))

                                    DockPinButton {
                                        visible: root.currentContent == 1
                                        pinned: root.pinned
                                        onTogglePin: {
                                            PersistentStateManager.setState("dock.pinned", !root.pinned)
                                            root.resetAutoReturnTimer()
                                        }
                                        onTogglePowerMenu: {
                                            root.currentContent = (root.currentContent + 1) % root.contentComponents.length
                                            root.resetAutoReturnTimer()
                                        }
                                    }

                                    Loader {
                                        id: normalContentLoader
                                        Layout.fillWidth: true
                                        Layout.fillHeight: true
                                        Layout.minimumHeight: 45
                                        Layout.preferredHeight: 40
                                        
                                        sourceComponent: !([3, 4].includes(root.currentContent)) ? root.contentComponents[root.currentContent] : null
                                    
                                    }
                                }
                                
                                // Special content (overview/wallpaper)
                                Loader {
                                    id: contentLoader
                                    anchors.fill: parent
                                    anchors.margins: ([3, 4].includes(root.currentContent)) ? 10 : 0
                                    visible: ([3, 4].includes(root.currentContent))
                                    sourceComponent: ([3, 4].includes(root.currentContent)) ? root.contentComponents[root.currentContent] : null
                                    
                                    onLoaded: {
                                        if (item && root.currentContent === 3) {
                                            item.panelWindow = dock
                                            root.overviewHeight = (dock.screen.height / 5) ?? 1410
                                            root.overviewWidth = (dock.screen.width * 1.34) ?? 330
                                            GlobalStates.overviewOpen = true
                                        }
                                    }
                                }
                            }
                        }

                        // Corner decorations - no animations
                        RoundCorner {
                            size: (root.currentContent == 3) ? 1.76 * commonRadius : commonRadius
                            corner: cornerEnum.bottomLeft
                            color: Appearance.colors.colLayer0
                            anchors {
                                bottom: parent.bottom
                                left: dockRect.right
                                bottomMargin: frameThickness
                            }
                        }

                        RoundCorner {
                            size: (root.currentContent == 3) ? 1.76 * commonRadius : commonRadius
                            corner: cornerEnum.bottomRight
                            color: Appearance.colors.colLayer0
                            anchors {
                                bottom: parent.bottom
                                right: dockRect.left
                                bottomMargin: frameThickness
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Shortcuts
    GlobalShortcut {
        name: "dockPinToggle"
        description: qsTr("Toggle Dock Pin")
        onPressed: {
            PersistentStateManager.setState("dock.pinned", !root.pinned)
            root.resetAutoReturnTimer()
        }
    }
    
    GlobalShortcut {
        name: "overviewToggle"
        description: qsTr("Toggle Overview")
        onPressed: {
            root.currentContent = root.currentContent === 0 ? 3 : 0
            root.resetAutoReturnTimer()
        }
    }
    
    GlobalShortcut {
        name: "wallpaperSelectorToggle"
        description: qsTr("Toggle Wallpaper Selector")
        onPressed: {
            root.currentContent = root.currentContent === 0 ? 4 : 0
            root.resetAutoReturnTimer()
        }
    }
    
    GlobalShortcut {
        name: "dockContentToggle"
        description: qsTr("Cycle Dock Content")
        onPressed: {
            root.currentContent = (root.currentContent + 1) % root.contentComponents.length
            root.resetAutoReturnTimer()
        }
    }
    
    GlobalShortcut {
        name: "dockMediaControlToggle"
        description: qsTr("Toggle Media Player")
        onPressed: {
            root.currentContent = root.currentContent === 0 ? 1 : 0
            root.resetAutoReturnTimer()
        }
    }

    GlobalShortcut {
        name: "dockSessionToggle"
        description: qsTr("Toggle Power Menu")
        onPressed: {
            root.currentContent = root.currentContent === 2 ? 1 : 2
            root.resetAutoReturnTimer()
        }
    }
    
    // Components
    Component {
        id: normalDock
        DockApps { 
            property bool requestDockShow: false
        }
    }

    Component {
        id: powerMenu
        DockPowerMenu { 
            property bool requestDockShow: true
        }
    }

    Component {
        id: overview
        OverviewWidget {
            panelWindow: dock
            property bool requestDockShow: true
        }
    }
    
    Component {
        id: mediaPlayer
        DockMediaPlayer { 
            property bool requestDockShow: true
        }
    }

    Component {
        id: wallpaperSelector
        WallpaperSelector { 
            anchors.fill: parent
            property bool requestDockShow: true
        }
    }
}