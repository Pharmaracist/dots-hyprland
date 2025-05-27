import QtQuick
import QtQuick.Controls
import Quickshell.Hyprland
import "root:/modules/common"
import "root:/modules/common/widgets"

Menu {
    id: contextMenu
    property var appInfo
    property bool isPinned: false
    property var menuHeight
    property var dockRoot
    property bool isRunning: false
    property bool isWindowActive: false
    
    signal pinApp()
    signal unpinApp()
    
    height: menuHeight
    margins: {
        right: 5
        left: 5
    }
    
    MenuItem {
        id: menu
        contentItem: Text {
            text: isPinned ? "Unpin from Dock" : "Pin to Dock"
            color: Appearance.colors.colOnLayer1
            font.pixelSize: 14
            verticalAlignment: Text.AlignVCenter
            anchors.leftMargin: 12
        }

        Timer {
            id: autoCloseTimer
            interval: 300
            repeat: false
            onTriggered: contextMenu.close()
        }

        MouseArea {
            id: hoverArea
            anchors.fill: menu
            hoverEnabled: true
            onEntered: autoCloseTimer.stop()
            onExited: autoCloseTimer.start()
            acceptedButtons: Qt.NoButton
        }
        
        background: Rectangle {
            color: Appearance.colors.colLayer1
        }
        
        height: isRunning ? menuHeight / 2.1 : menuHeight
        onTriggered: isPinned ? unpinApp() : pinApp()
    }
  MenuItem {
        contentItem: Text {
            text: "Launch New Instance"
            color: Appearance.colors.colOnLayer0
            font.pixelSize: 14
            verticalAlignment: Text.AlignVCenter
            anchors.leftMargin: 12
        }
        
        background: Rectangle {
            color: Appearance.colors.colLayer1
        }
        
        visible: isWindowActive || true
        height: menuHeight / 2.1
        onTriggered: {
            try {
                Hyprland.dispatch(`exec ${appInfo.command}`)
            } catch (e) {
                console.log("[DockItemMenu] Error launching new instance: " + e)
            }
        }
    }
    MenuItem {
        contentItem: Text {
            text: "Close"
            color: Appearance.colors.colOnLayer0
            font.pixelSize: 14
            verticalAlignment: Text.AlignVCenter
            anchors.leftMargin: 12
        }
        
        background: Rectangle {
            color: Appearance.colors.colLayer1
        }
        
        visible: isWindowActive || true
        height:  menuHeight / 2
        onTriggered: {
            try {
                Hyprland.dispatch(`closewindow class:^${appInfo.class}$`)
            } catch (e) {
                console.log("[DockItemMenu] Error closing window: " + e)
            }
        }
    }
}