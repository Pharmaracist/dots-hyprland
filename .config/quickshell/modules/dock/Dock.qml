// Fixed Dock.qml with proper auto-hide behavior
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
    property int currentContent: 0 // 0: media player, 1: apps, 2: power menu
    property var focusedScreen: Quickshell?.screens.find(s => s.name === Hyprland.focusedMonitor?.name) ?? Quickshell.screens[0]
    property int frameThickness: Appearance.sizes.frameThickness
    property real commonRadius: Appearance.rounding.screenRounding + 5
    
    readonly property var contentComponents: [mediaPlayer, normalDock, powerMenu]
    
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
                
                exclusiveZone: root.pinned 
                    ? implicitHeight - (Appearance.sizes.hyprlandGapsOut * 2) + frameThickness
                    : -1
                
                implicitWidth: background.implicitWidth
                implicitHeight: 75 + Appearance.sizes.hyprlandGapsOut - frameThickness
                
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
                        implicitWidth: dockRow.implicitWidth + 16
                        implicitHeight: dockRow.implicitHeight + 10

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
                            topRightRadius: commonRadius
                            topLeftRadius: commonRadius

                            RowLayout {
                                id: dockRow
                                anchors {
                                    bottom: parent.bottom
                                    horizontalCenter: parent.horizontalCenter
                                }
                                spacing: 5

                                DockPinButton {
                                    visible: root.currentContent == 1 // Hide when showing apps
                                    pinned: root.pinned
                                    onTogglePin: PersistentStateManager.setState("dock.pinned", !root.pinned)
                                    onTogglePowerMenu: {
                                        root.currentContent = (root.currentContent + 1) % root.contentComponents.length
                                    }
                                }

                                Loader {
                                    id: contentLoader
                                    Layout.fillWidth: true
                                    Layout.fillHeight: true
                                    Layout.minimumHeight: 45
                                    Layout.preferredHeight: 40
                                    
                                    sourceComponent: root.contentComponents[root.currentContent]
                                    
                                    Connections {
                                        target: root
                                        function onCurrentContentChanged() { 
                                            switchContent.start() 
                                        }
                                    }

                                    onLoaded: scaleIn.start()

                                    SequentialAnimation {
                                        id: switchContent
                                        PropertyAnimation {
                                            target: contentLoader
                                            property: "scale"
                                            from: 0.9
                                            to: 1
                                            duration: 100
                                        }
                                        ScriptAction {
                                            script: {
                                                contentLoader.sourceComponent = root.contentComponents[root.currentContent]
                                            }
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

                        // Corner decorations
                        RoundCorner {
                            size: commonRadius
                            corner: cornerEnum.bottomLeft
                            color: Appearance.colors.colLayer0
                            anchors {
                                bottom: parent.bottom
                                left: dockRect.right
                                bottomMargin: frameThickness
                            }
                        }

                        RoundCorner {
                            size: commonRadius
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
    
    GlobalShortcut {
        name: "dockPinToggle"
        description: qsTr("Toggle Dock Pin")
        onPressed: {
            PersistentStateManager.setState("dock.pinned", !root.pinned)
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
            anchors.fill: parent
            property bool requestDockShow: false
        }
    }

    Component {
        id: powerMenu
        DockPowerMenu { 
            anchors.fill: parent
            property bool requestDockShow: false
        }
    }
    
    Component {
        id: mediaPlayer
        DockMediaPlayer { 
            anchors.fill: parent
            property bool requestDockShow: true
        }
    }
}