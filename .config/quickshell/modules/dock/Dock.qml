// Refactored Dock.qml - Cleaner and more concise
import "root:/"
import "root:/services"
import "root:/modules/common"
import "root:/modules/common/widgets"
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
    property bool showPowerMenu: false
    property var focusedScreen: Quickshell?.screens.find(s => s.name === Hyprland.focusedMonitor?.name) ?? Quickshell.screens[0]
    property int frameThickness: Appearance.sizes.frameThickness

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
                    || (contentLoader.item?.requestDockShow)
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
                            topRightRadius: Appearance.rounding.screenRounding
                            topLeftRadius: Appearance.rounding.screenRounding

                            RowLayout {
                                id: dockRow
                                anchors {
                                    bottom: parent.bottom
                                    horizontalCenter: parent.horizontalCenter
                                }
                                spacing: 5

                                DockPinButton {
                                    pinned: root.pinned
                                    onTogglePin: PersistentStateManager.setState("dock.pinned", !root.pinned)
                                    onTogglePowerMenu: root.showPowerMenu = !root.showPowerMenu
                                }

                                Loader {
                                    id: contentLoader
                                    Layout.fillWidth: true
                                    Layout.fillHeight: true
                                    Layout.minimumHeight: ConfigOptions.dock.height ?? 50
                                    Layout.preferredHeight: ConfigOptions.dock.height ?? 50
                                    
                                    sourceComponent: root.showPowerMenu ? powerMenu : normalDock
                                    
                                    Connections {
                                        target: root
                                        function onShowPowerMenuChanged() { switchContent.start() }
                                    }

                                    onLoaded: scaleIn.start()

                                    SequentialAnimation {
                                        id: switchContent
                                        PropertyAnimation {
                                            target: contentLoader
                                            property: "scale"
                                            to: 0.94
                                            duration: 120
                                        }
                                        ScriptAction {
                                            script: contentLoader.sourceComponent = root.showPowerMenu ? powerMenu : normalDock
                                        }
                                    }

                                    PropertyAnimation {
                                        id: scaleIn
                                        target: contentLoader
                                        property: "scale"
                                        from: 1.08; to: 1.0
                                        duration: 180
                                        easing.type: Easing.OutBack
                                    }
                                }
                            }
                        }

                        // Corner decorations
                        RoundCorner {
                            size: Appearance.rounding.screenRounding
                            corner: cornerEnum.bottomLeft
                            color: Appearance.colors.colLayer0
                            anchors {
                                bottom: parent.bottom
                                left: dockRect.right
                                bottomMargin: frameThickness
                            }
                        }

                        RoundCorner {
                            size: Appearance.rounding.screenRounding
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

    // Components
    Component {
        id: normalDock
        DockApps { anchors.fill: parent }
    }

    Component {
        id: powerMenu
        DockPowerMenu { anchors.fill: parent }
    }
}