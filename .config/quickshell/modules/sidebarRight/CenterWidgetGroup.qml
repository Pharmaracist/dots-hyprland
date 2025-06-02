import "./calendar"
import "./notifications"
import "./todo"
import "./volumeMixer"
import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

Rectangle {
    id: root

    property int selectedTab: PersistentStates.sidebar.centerGroup.selectedTab
    property var tabButtonList: [{
        "icon": "notifications",
        "name": qsTr("Notifications")
    }, {
        "icon": "volume_up",
        "name": qsTr("Volume mixer")
    }]

    onSelectedTabChanged: {
        PersistentStateManager.setState("sidebar.centerGroup.selectedTab", selectedTab);
    }
    radius: Appearance.rounding.normal
    color: Appearance.colors.colLayer1
    Keys.onPressed: (event) => {
        if (event.key === Qt.Key_PageDown || event.key === Qt.Key_PageUp) {
            if (event.key === Qt.Key_PageDown)
                root.selectedTab = Math.min(root.selectedTab + 1, root.tabButtonList.length - 1);
            else if (event.key === Qt.Key_PageUp)
                root.selectedTab = Math.max(root.selectedTab - 1, 0);
            event.accepted = true;
        }
        if (event.modifiers === Qt.ControlModifier) {
            if (event.key === Qt.Key_Tab)
                root.selectedTab = (root.selectedTab + 1) % root.tabButtonList.length;
            else if (event.key === Qt.Key_Backtab)
                root.selectedTab = (root.selectedTab - 1 + root.tabButtonList.length) % root.tabButtonList.length;
            event.accepted = true;
        }
    }

    ColumnLayout {
        anchors.margins: 5
        anchors.fill: parent
        spacing: 0

        PrimaryTabBar {
            id: tabBar

            function onCurrentIndexChanged(currentIndex) {
                root.selectedTab = currentIndex;
            }

            tabButtonList: root.tabButtonList
            externalTrackedTab: root.selectedTab
        }

        SwipeView {
            id: swipeView

            Layout.topMargin: 5
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 10
            currentIndex: root.selectedTab
            onCurrentIndexChanged: {
                tabBar.enableIndicatorAnimation = true;
                root.selectedTab = currentIndex;
            }
            clip: true
            layer.enabled: true

            NotificationList {
            }

            VolumeMixer {
            }

            layer.effect: OpacityMask {

                maskSource: Rectangle {
                    width: swipeView.width
                    height: swipeView.height
                    radius: Appearance.rounding.small
                }

            }

        }

    }

}
