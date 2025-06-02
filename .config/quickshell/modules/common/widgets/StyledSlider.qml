import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell.Widgets

// Material 3 slider. See https://m3.material.io/components/sliders/overview
Slider {
    id: root
    property real scale: 1
    property real backgroundDotSize: 4 * scale
    property real backgroundDotMargins: 4 * scale
    property real handleMargins: 0 * scale
    // property real handleMargins: (root.pressed ? 0 : 2) * scale
    property real handleWidth: (root.pressed ? 3 : 0) * scale
    property real handleHeight: 44 * scale
    property real handleLimit: root.backgroundDotMargins
    property real trackHeight: 30 * scale
    property color highlightColor: Appearance.colors.colPrimary
    property color trackColor: Appearance.m3colors.m3secondaryContainer
    property color handleColor:  (root.pressed ? Appearance.m3colors.m3onSecondaryContainer : Appearance.colors.colLayer0)
    property real trackRadius: Appearance.rounding.normal * scale
    property real unsharpenRadius: Appearance.rounding.unsharpen

    property real limitedHandleRangeWidth: (root.availableWidth - handleWidth - root.handleLimit * 2)
    property string tooltipContent: `${Math.round(value * 100)}%`
    Layout.fillWidth: true
    from: 0
    to: 1

    Behavior on value { // This makes the adjusted value (like volume) shift smoothly
        SmoothedAnimation {
            velocity: Appearance.animation.elementMoveFast.velocity
        }
    }

    Behavior on handleMargins {
        NumberAnimation {
            duration: Appearance.animation.elementMoveFast.duration
            easing.type: Appearance.animation.elementMoveFast.type
            easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
        }
    }

    MouseArea {
        anchors.fill: parent
        onPressed: (mouse) => mouse.accepted = false
        cursorShape: root.pressed ? Qt.ClosedHandCursor : Qt.PointingHandCursor 
    }

    background: Item {
        anchors.verticalCenter: parent.verticalCenter
        implicitHeight: trackHeight
        
        // Fill left
        Rectangle {
            anchors.verticalCenter: parent.verticalCenter
            anchors.left: parent.left
            width: root.handleLimit * 2 + root.visualPosition * root.limitedHandleRangeWidth - (root.handleMargins + root.handleWidth / 2)
            height: trackHeight
            topLeftRadius: root.trackRadius
            bottomLeftRadius: root.trackRadius
            topRightRadius: root.unsharpenRadius
            bottomRightRadius: root.unsharpenRadius
               gradient: Gradient {
                orientation: Gradient.Horizontal
                GradientStop { position: 0.0; color: root.trackColor }
                GradientStop { position: 0.33; color: Appearance.colors.colPrimaryContainerActive }
                GradientStop { position: 1.0; color: Appearance.colors.colPrimaryActive }
            }
        }

        // Fill right
        Rectangle {
            anchors.verticalCenter: parent.verticalCenter
            anchors.right: parent.right
            width: root.handleLimit * 2 + (1 - root.visualPosition) * root.limitedHandleRangeWidth - (root.handleMargins + root.handleWidth / 2)
            height: trackHeight
            color: root.trackColor
            topLeftRadius: root.unsharpenRadius
            bottomLeftRadius: root.unsharpenRadius
            topRightRadius: root.trackRadius
            bottomRightRadius: root.trackRadius
        }

        // Dot at the end
        Rectangle {
            anchors.verticalCenter: parent.verticalCenter
            anchors.right: parent.right
            anchors.rightMargin: root.backgroundDotMargins * 5
            width: root.backgroundDotSize
            height: root.backgroundDotSize
            radius: Appearance.rounding.full
            color: root.handleColor
        }
    }

    handle: Rectangle {
        id: handle
        x: root.leftPadding + root.handleLimit + root.visualPosition * root.limitedHandleRangeWidth
        y: root.topPadding + root.availableHeight / 2 - height / 2
        implicitWidth: root.handleWidth
        implicitHeight: root.trackHeight
        radius: Appearance.rounding.full
        color: root.handleColor

        Behavior on implicitWidth {
            animation: Appearance?.animation.elementMoveFast.numberAnimation.createObject(this)
        }

        StyledToolTip {
            extraVisibleCondition: root.pressed
            content: root.tooltipContent
        }
    }
}