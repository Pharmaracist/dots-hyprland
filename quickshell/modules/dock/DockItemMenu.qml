import QtQuick
import QtQuick.Controls
import Quickshell.Hyprland
import "root:/modules/common"
import "root:/modules/common/widgets"

Menu {
    id: contextMenu
    property var appInfo
    property bool isPinned: false
    property var menuHeight: 55
    // color:"transparent"
    signal pinApp()
    signal unpinApp()
    height:menuHeight
    margins:1
    MenuItem {
        contentItem: Text {
            text: "Pin to Dock" 
            color: Appearance.colors.colOnLayer1
            font.pixelSize: 14
            verticalAlignment: Text.AlignVCenter
            anchors.verticalCenter: parent.verticalCenter
            anchors.left: parent.left
            anchors.leftMargin: 12
        }
        background: Rectangle {
            // radius: Appearance.rounding.small
            color: Appearance.colors.colLayer1
        }   
        implicitHeight:menuHeight /2 
        onTriggered: isPinned ? unpinApp() : pinApp()
    }
    // MenuItem {
    //     contentItem: Text {
    //         text: "Close"
    //         color: Appearance.colors.colOnLayer0
    //         font.pixelSize: 14
    //         verticalAlignment: Text.AlignVCenter
    //         anchors.verticalCenter: parent.verticalCenter
    //         anchors.left: parent.left
    //         anchors.leftMargin: 12
    //     }
    //     background: Rectangle {
    //         // radius: Appearance.rounding.small
    //         color: Appearance.colors.colLayer0
    //     }   
    //     implicitHeight:menuHeight /2 
    //     visible: dockRoot.isWindowActive(appInfo.class)
    //     onTriggered: {
    //         try {
    //             Hyprland.dispatch(`closewindow class:^${appInfo.class}$`)
    //         } catch (e) {
    //             console.log("[DockItemMenu] Error closing window: " + e)
    //         }
    //     }
    // }
    MenuItem {
        contentItem: Text {
            text: "Cancel"
            color: Appearance.colors.colOnLayer0
            font.pixelSize: 14
            verticalAlignment: Text.AlignVCenter
            anchors.verticalCenter: parent.verticalCenter
            anchors.left: parent.left
            anchors.leftMargin: 12
        }
        background: Rectangle {
            // radius:Appearance.rounding.small
            color: Appearance.colors.colLayer0
        }   
        onTriggered: contextMenu.close()
    }
}