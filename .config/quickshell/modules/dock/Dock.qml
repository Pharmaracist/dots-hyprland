// Fixed Dock.qml with proper overview sizing
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
    property int currentContent: 4 // 0: media player, 1: apps, 2: power menu 3: overview 4: wallpaper selector
    property var focusedScreen: Quickshell?.screens.find(s => s.name === Hyprland.focusedMonitor?.name) ?? Quickshell.screens[0]
    property int frameThickness: Appearance.sizes.frameThickness
    property real commonRadius: Appearance.rounding.screenRounding + 10
    property int overviewHeight: 400
    property int overviewWidth: 1400

    readonly property var contentComponents: [ mediaPlayer,normalDock,powerMenu, overview,wallpaperSelector]
    
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
                
                exclusiveZone:(root.currentContent == 3)? -1 : root.pinned 
                    ? implicitHeight - (Appearance.sizes.hyprlandGapsOut * 2) + frameThickness
                    : -1
                
                // Dynamic sizing based on content
                implicitWidth: background.implicitWidth
                implicitHeight: background.implicitHeight +  Appearance.sizes.hyprlandGapsOut + frameThickness
                
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

                    function calculateTopMargin() {
                        if (dock.shouldReveal) return 0
                        if (ConfigOptions?.dock.hoverToReveal) {
                            return dock.implicitHeight - ConfigOptions.dock.hoverRegionHeight
                        }
                        return dock.implicitHeight + 1
                    }

                    Behavior on anchors.topMargin {
                        animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(mouseArea)
                    }

                    // Main dock container
                    Item {
                        id: background
                        anchors.fill: parent
                        
                        // Dynamic sizing based on content // 1386 , 340
                        implicitWidth: ([3, 4].includes(root.currentContent)) ? 1386  : dockRow.implicitWidth + 16
                        implicitHeight:([3, 4].includes(root.currentContent)) ? 200 : dockRow.implicitHeight + 10

                        StyledRectangularShadow { target: dockRect }

                        Rectangle {
                            id: dockRect
                            anchors {
                                bottom: parent.bottom
                                bottomMargin: frameThickness
                                horizontalCenter: parent.horizontalCenter
                            }
                            width: background.implicitWidth
                            height: background.implicitHeight
                            
                            color: Appearance.colors.colLayer0
                            radius: 0
                            topRightRadius:(root.currentContent == 3) ? 1.25 * commonRadius : commonRadius
                            topLeftRadius: (root.currentContent == 3) ? 1.25 * commonRadius : commonRadius

                            // Use different layouts for overview vs normal content
                            Item {
                                anchors.fill: parent
                                
                                // Normal dock row (hidden when showing overview)
                                RowLayout {
                                    id: dockRow
                                    anchors {
                                        bottom: parent.bottom
                                        horizontalCenter: parent.horizontalCenter
                                    }
                                    spacing: 5
                                    visible: !([3, 4].includes(root.currentContent))

                                    DockPinButton {
                                        visible: root.currentContent == 1 // Show when showing apps
                                        pinned: root.pinned
                                        onTogglePin: PersistentStateManager.setState("dock.pinned", !root.pinned)
                                        onTogglePowerMenu: {
                                            root.currentContent = (root.currentContent + 1) % root.contentComponents.length
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
                                
                                // Overview content (full size)
                                Loader {
                                    id: contentLoader
                                    anchors.fill: parent
                                    anchors.margins: ([3, 4].includes(root.currentContent)) ? 10 : 0
                                    
                                    sourceComponent: ([3, 4].includes(root.currentContent)) ? root.contentComponents[root.currentContent] : null
                                    visible: ([3, 4].includes(root.currentContent))
                                    
                                    Connections {
                                        target: root
                                        function onCurrentContentChanged() { 
                                            switchContent.start() 
                                        }
                                    }

                                    onLoaded: {
                                           if (item && root.currentContent === 3)
                                               item.panelWindow = dock
                                                root.overviewHeight = (dock.screen.height / 5) ?? 1410
                                                root.overviewWidth = (dock.screen.width * 1.34) ?? 330
                                                GlobalStates.overviewOpen = true
                                       }
                                    SequentialAnimation {
                                        id: switchContent
                                        PropertyAnimation {
                                            target: contentLoader
                                            property: "scale"
                                            from: 0.9
                                            to: 1
                                            duration: 100
                                        }
                                    }

                                    PropertyAnimation {
                                        id: scaleIn
                                        target: contentLoader
                                        property: "scale"
                                        from: 0.2
                                        to: 1.0
                                        duration: 100
                                        easing.type: Easing.OutBack
                                    }
                                }
                            }
                        }

                        // Corner decorations (only show for normal dock)
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
    
    // Shortcuts remain the same...
    GlobalShortcut {
        name: "dockPinToggle"
        description: qsTr("Toggle Dock Pin")
        onPressed: {
            PersistentStateManager.setState("dock.pinned", !root.pinned)
        }
    }
     GlobalShortcut {
        name: "overviewToggle"
        description: qsTr("Toggle Overveiw Pin")
        onPressed: {
            root.currentContent = root.currentContent === 0 ? 3 : 0
        }
    }
    GlobalShortcut {
        name: "wallpaperSelectorToggle"
        description: qsTr("Toggle Dock Pin")
        onPressed: {
            root.currentContent = root.currentContent === 0 ? 4 : 0

        }
    }
    
    GlobalShortcut {
        name: "dockContentToggle"
        description: qsTr("Cycle Dock Content")
        onPressed: {
            root.currentContent = (root.currentContent + 1) % root.contentComponents.length
        }
    }
    
    GlobalShortcut {
        name: "dockMediaControlToggle"
        description: qsTr("Toggle Media Player")
        onPressed: {
            root.currentContent = root.currentContent === 0 ? 1 : 0
        }
    }

    GlobalShortcut {
        name: "dockSessionToggle"
        description: qsTr("Toggle Power Menu")
        onPressed: {
            root.currentContent = root.currentContent === 2 ? 1 : 2
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
            property bool requestDockShow: false
        }
    }

    Component {
        id: overview
        OverviewWidget {
            panelWindow: dock
            property bool requestDockShow: true
            anchors.centerIn: parent
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