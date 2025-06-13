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

Scope { // Scope
    id: root
    property bool pinned: PersistentStates.dock.pinned 
    property bool cornered: ConfigOptions?.dock.cornered ?? true
    property var focusedScreen: Quickshell.screens.find(s => s.name === Hyprland.focusedMonitor?.name)
    Variants { // For each monitor
        model: pinned ? [Quickshell.screens[focusedScreen]]:[focusedScreen]

        Loader {
            id: dockLoader
            required property var modelData
            active: ConfigOptions?.dock.hoverToReveal || (!ToplevelManager.activeToplevel?.activated)

            sourceComponent: PanelWindow { // Window
                id: dockRoot
                screen: dockLoader.modelData
                
                property bool reveal: root.pinned 
                    || (ConfigOptions?.dock.hoverToReveal && dockMouseArea.containsMouse) 
                    || dockApps.requestDockShow 
                    || (!ToplevelManager.activeToplevel?.activated)

                anchors {
                    bottom: true
                    left: true
                    right: true
                }

                exclusiveZone: root.pinned ? implicitHeight 
                    - (Appearance.sizes.hyprlandGapsOut) 
                    - (Appearance.sizes.hyprlandGapsOut - Appearance.sizes.frameThickness  ) : 0

                implicitWidth: dockBackground.implicitWidth
                WlrLayershell.namespace: "quickshell:dock"
                color: "transparent"

                implicitHeight: (ConfigOptions?.dock.height ?? 70)  + Appearance.sizes.hyprlandGapsOut + (cornered ?? Appearance.sizes.frameThickness)

                mask: Region {
                    item: dockMouseArea
                }

                MouseArea {
                    id: dockMouseArea
                    anchors.top: parent.top
                    height: parent.height
                    anchors.topMargin: dockRoot.reveal ? 0 : 
                        ConfigOptions?.dock.hoverToReveal ? (dockRoot.implicitHeight - ConfigOptions.dock.hoverRegionHeight) :
                        (dockRoot.implicitHeight + 1)
                    anchors.left: parent.left
                    anchors.right: parent.right
                    hoverEnabled: true

                    Behavior on anchors.topMargin {
                        animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
                    }

                    Item {
                        id: dockHoverRegion
                        anchors.fill: parent
                        RoundCorner {
                            visible:cornered
                            size: Appearance.rounding.screenRounding
                            corner: cornerEnum.bottomRight
                            color: Appearance.colors.colLayer0
        
                            anchors {
                                bottom: dockBackground.bottom
                                right:dockBackground.left
                            
                            }
        
                        }
                        RoundCorner {
                            visible:cornered
                            size: Appearance.rounding.screenRounding
                            corner: cornerEnum.bottomLeft
                            color: Appearance.colors.colLayer0
        
                            anchors {
                                bottom: dockBackground.bottom
                                left:dockBackground.right

                            }
        
                        }
                        Item { // Wrapper for the dock background
                            id: dockBackground
                            anchors {
                                top: parent.top
                                bottom: parent.bottom
                                horizontalCenter: parent.horizontalCenter
                                bottomMargin: Appearance.sizes.frameThickness
                            }
                            implicitWidth: dockRow.implicitWidth + 5 * 2
                            height: parent.height - Appearance.sizes.elevationMargin - Appearance.sizes.hyprlandGapsOut

                            StyledRectangularShadow {
                                target: dockVisualBackground
                            }
                            Rectangle { // The real rectangle that is visible
                                id: dockVisualBackground
                                property real margin: Appearance.sizes.elevationMargin
                                anchors {
                                    fill: parent
                                    bottom:parent
                                    topMargin: Appearance.sizes.hyprlandGapsOut + 2
                                    bottomMargin: -Appearance.sizes.hyprlandGapsOut
                                
                                }
                                color: Appearance.colors.colLayer0
                                radius: cornered ? 0 : Appearance.rounding.large
                                topRightRadius:Appearance.rounding.screenRounding
                                topLeftRadius:Appearance.rounding.screenRounding
                                border.color:cornered ? "transparent" :Appearance.colors.colOutline
                            }

                            RowLayout {
                                id: dockRow
                                anchors.top: parent.top
                                anchors.bottom: parent.bottom
                                anchors.bottomMargin: cornered ? -Appearance.sizes.elevationMargin : 0
                                anchors.horizontalCenter: parent.horizontalCenter
                                spacing: 3
                                property real padding: 5

                                VerticalButtonGroup {
                                    Layout.topMargin: Appearance.sizes.hyprlandGapsOut  // why does this work
                                    GroupButton { // Pin button
                                        baseWidth: 50
                                        baseHeight: 50
                                        clickedWidth: baseWidth
                                        clickedHeight: baseHeight 
                                        buttonRadius: Appearance.rounding.normal
                                        toggled: root.pinned
                                        onClicked: PersistentStateManager.setState("dock.pinned", !root.pinned)
                                        contentItem:AnimatedImage {
                                            anchors.fill: parent
                                            anchors.margins: 4
                                            cache: true
                                            mipmap: true
                                            height: parent.height
                                            width: parent.width
                                            source: "root:/assets/gif/avatar.gif"
                                            speed: root.pinned ? 2 : 1.25
                                        }

                                    }
                                }
                                DockSeparator {}
                                DockApps { id: dockApps; }
                            }
                        }    
                    }

                }
            }
        }
    }
}
