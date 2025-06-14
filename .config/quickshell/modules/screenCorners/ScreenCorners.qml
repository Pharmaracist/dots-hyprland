import "root:/modules/common"
import "root:/modules/common/widgets"
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Wayland
import Quickshell.Hyprland

Scope {
    id: screenCorners
    readonly property Toplevel activeWindow: ToplevelManager.activeToplevel
    Variants {
        model: Quickshell.screens
        
        // Visual corners window (masked/hidden)
        PanelWindow {
            id: visualCorners
            visible: (ConfigOptions.appearance.fakeScreenRounding === 1 || 
                     (ConfigOptions.appearance.fakeScreenRounding === 2 && !activeWindow?.fullscreen))
            property var modelData
            screen: modelData
            exclusionMode: ExclusionMode.Ignore
            
            // Mask out the entire window to hide visual corners
            mask: Region {
                item: null // Empty mask = invisible
            }
            
            WlrLayershell.namespace: "quickshell:visualCorners"
            WlrLayershell.layer: WlrLayer.Bottom
            color: "transparent"
            
            anchors {
                top: true
                left: true
                right: true
                bottom: true
            }
            
            RoundCorner {
                id: topLeftCorner
                anchors.top: parent.top
                anchors.left: parent.left
                size: Appearance.rounding.screenRounding
                corner: cornerEnum.topLeft
            }
            
            RoundCorner {
                id: topRightCorner
                anchors.top: parent.top
                anchors.right: parent.right
                size: Appearance.rounding.screenRounding
                corner: cornerEnum.topRight
            }
            
            RoundCorner {
                id: bottomLeftCorner
                anchors.bottom: parent.bottom
                anchors.left: parent.left
                size: Appearance.rounding.screenRounding
                corner: cornerEnum.bottomLeft
            }
            
            RoundCorner {
                id: bottomRightCorner
                anchors.bottom: parent.bottom
                anchors.right: parent.right
                size: Appearance.rounding.screenRounding
                corner: cornerEnum.bottomRight
            }
        }
        
        // Separate invisible hot corners window
        PanelWindow {
            id: hotCorners
            visible: true
            property var modelData
            screen: modelData
            exclusionMode: ExclusionMode.Ignore
            
            // Only show the corner areas for interaction
            mask: Region {
                Region {
                    item: topLeftHot
                }
                Region {
                    item: topRightHot
                }
                Region {
                    item: bottomLeftHot
                }
                Region {
                    item: bottomRightHot
                }
            }
            
            WlrLayershell.namespace: "quickshell:hotCorners" 
            WlrLayershell.layer: WlrLayer.Overlay
            color: "transparent"
            
            anchors {
                top: true
                left: true
                right: true
                bottom: true
            }
            
            Rectangle {
                id: topLeftHot
                anchors.top: parent.top
                anchors.left: parent.left
                width: Appearance.rounding.screenRounding
                height: Appearance.rounding.screenRounding
                color: "transparent"
                
                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    onEntered: Hyprland.dispatch('global quickshell:sidebarLeftOpen')
                }
            }
            
            Rectangle {
                id: topRightHot
                anchors.top: parent.top
                anchors.right: parent.right
                width: Appearance.rounding.screenRounding
                height: Appearance.rounding.screenRounding
                color: "transparent"
                
                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    onClicked: {
                    }
                }
            }
            
            Rectangle {
                id: bottomLeftHot
                anchors.bottom: parent.bottom
                anchors.left: parent.left
                width: Appearance.rounding.screenRounding
                height: Appearance.rounding.screenRounding
                color: "transparent"
                
                   MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true 
                    onEntered: Hyprland.dispatch('hyprexpo:expo')
                }
            }
            
            Rectangle {
                id: bottomRightHot
                anchors.bottom: parent.bottom
                anchors.right: parent.right
                width: Appearance.rounding.screenRounding
                height: Appearance.rounding.screenRounding
                color: "transparent"
                
                MouseArea {
                    anchors.fill: parent
                    hoverEnabled: true
                    onClicked: {
                    }
                }
            }
        }
    }
}