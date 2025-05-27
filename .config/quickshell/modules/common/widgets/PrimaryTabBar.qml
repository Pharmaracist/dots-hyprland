import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import "root:/modules/common"

ColumnLayout {
    id: root

    required property var tabButtonList // Something like [{"icon": "notifications", "name": qsTr("Notifications")}, {"icon": "volume_up", "name": qsTr("Volume mixer")}]
    required property var externalTrackedTab
    property bool enableIndicatorAnimation: false

    signal currentIndexChanged(int index)

    spacing: 0

    TabBar {
        id: tabBar

        Layout.fillWidth: true
        currentIndex: root.externalTrackedTab
        onCurrentIndexChanged: {
            root.onCurrentIndexChanged(currentIndex);
        }

        Repeater {
            model: root.tabButtonList

            delegate: PrimaryTabButton {
                selected: (index == root.externalTrackedTab)
                buttonText: modelData.name
                buttonIcon: modelData.icon
            }

        }

        background: Item {
            WheelHandler {
                onWheel: (event) => {
                    if (event.angleDelta.y < 0)
                        tabBar.currentIndex = Math.min(tabBar.currentIndex + 1, root.tabButtonList.length - 1);
                    else if (event.angleDelta.y > 0)
                        tabBar.currentIndex = Math.max(tabBar.currentIndex - 1, 0);
                }
                acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
            }

        }

    }

    // Tab indicator
    Item {
        id: tabIndicator

        Layout.fillWidth: true
        height: 3

        Connections {
            function onExternalTrackedTabChanged() {
                root.enableIndicatorAnimation = true;
            }

            target: root
        }

        Rectangle {
            id: indicator

            property int tabCount: root.tabButtonList.length
            property real fullTabSize: root.width / tabCount
            property real targetWidth: tabBar.contentItem.children[0].children[tabBar.currentIndex].tabContentWidth

            implicitWidth: targetWidth
            x: tabBar.currentIndex * fullTabSize + (fullTabSize - targetWidth) / 2
            color: Appearance.m3colors.m3primary
            radius: Appearance.rounding.full

            anchors {
                top: parent.top
                bottom: parent.bottom
            }

            Behavior on x {
                animation: Appearance.animation.elementMove.numberAnimation.createObject(this)
            }

            Behavior on implicitWidth {
                animation: Appearance.animation.elementMove.numberAnimation.createObject(this)
            }

        }

    }

}
