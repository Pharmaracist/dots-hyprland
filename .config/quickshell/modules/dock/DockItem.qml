import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects
import Quickshell
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

Rectangle {
    id: dockItem
    
    property string icon: ""
    property string tooltip: ""
    property bool isActive: false
    
    signal clicked()
    
    implicitWidth: dock.dockWidth - 10
    implicitHeight: dock.dockWidth - 10
    radius: Appearance.rounding.full
    color: mouseArea.pressed ? Appearance.colors.colLayer1Active : 
           mouseArea.containsMouse ? Appearance.colors.colLayer1Hover : 
           "transparent"
    
    Behavior on color {
        ColorAnimation {
            duration: Appearance.animation.elementMoveFast.duration
            easing.type: Appearance.animation.elementMoveFast.type
        }
    }
    
    Image {
        id: iconItem
        anchors.centerIn: parent
        width: parent.width * 0.85
        height: parent.height * 0.85
        source: "image://icon/" + dockItem.icon
        sourceSize.width: width
        sourceSize.height: height
        cache: true
        asynchronous: true
        smooth: true
        antialiasing: true
        anchors.bottomMargin: 10
    }
    
    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        acceptedButtons: Qt.LeftButton
        onClicked: dockItem.clicked()
        
        // Set the mouseOverDockItem property when hovering
        onEntered: {
            dock.mouseOverDockItem = true
        }
        
        onExited: {
            dock.mouseOverDockItem = false
        }
    }
    
    // Active indicator dot
    Rectangle {
        id: activeIndicator
        visible: isActive
        width: parent.width * 0.5
        height: 3
        radius: 10
        color: Appearance.colors.colPrimaryActive
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottom: parent.bottom
        anchors.topMargin: 10
        anchors.bottomMargin: -4.5
    }
    
    ToolTip {
        id: itemTooltip
        visible: mouseArea.containsMouse && dockItem.tooltip !== ""
        text: dockItem.tooltip
        delay: 500
        timeout: 5000
        contentItem: StyledText {
            text: itemTooltip.text
            color: Appearance.colors.colOnTooltip
            horizontalAlignment: Text.AlignHCenter
        }
        
        background: Rectangle {
            color: Appearance.colors.colTooltip
            radius: Appearance.rounding.small
        }
    }
}
