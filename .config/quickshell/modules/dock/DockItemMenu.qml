import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import "root:/modules/common"

Menu {
    id: dockItemMenu
    
    property var appInfo: ({})
    property bool isPinned: false
    property int timeout: 1000 // Auto-close menu after 3 seconds
    
    // Signal emitted when user wants to pin an app
    signal pinApp()
    
    // Signal emitted when pinning has been processed
    signal pinAppProcessed()
    
    // Signal emitted when user wants to unpin an app
    signal unpinApp()
    
    // Signal emitted when user wants to close an app
    signal closeApp()
    
    // Timer to automatically close the menu after timeout
    Timer {
        id: autoCloseTimer
        interval: dockItemMenu.timeout
        repeat: false
        running: false
        onTriggered: dockItemMenu.dismiss()
    }
    
    // Start timer when menu appears
    onOpened: {
        autoCloseTimer.restart()
    }
    
    MenuItem {
        text: isPinned ? qsTr("Unpin from dock") : qsTr("Pin to dock")
        onTriggered: {
            if (isPinned) {
                dockItemMenu.unpinApp()
            } else {
                dockItemMenu.pinApp()
            }
        }
    }
    
    MenuItem {
        text: qsTr("Launch new instance")
        onTriggered: {
            var command = appInfo.command || appInfo.class.toLowerCase()
            Hyprland.dispatch(`exec ${command}`)
        }
    }
    
    MenuItem {
        text: qsTr("Close")
        onTriggered: {
            if (appInfo.address) {
                Hyprland.dispatch(`dispatch closewindow address:${appInfo.address}`)
            } else if (appInfo.pid) {
                Hyprland.dispatch(`dispatch closewindow pid:${appInfo.pid}`)
            } else {
                Hyprland.dispatch(`dispatch closewindow class:${appInfo.class}`)
            }
            dockItemMenu.closeApp()
        }
    }
    
    // Detect when any key is pressed to reset the timer
    Keys.onPressed: {
        autoCloseTimer.restart()
    }
    
    // Detect when menu is being interacted with to reset the timer
    onVisibleChanged: {
        if (visible) {
            autoCloseTimer.restart()
        }
    }
}
