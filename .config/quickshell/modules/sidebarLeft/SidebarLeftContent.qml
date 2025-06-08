import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Wayland
import Quickshell.Widgets
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

Item {
    id: root

    required property var scopeRoot
    property var tabButtonList: [{
        "icon": "neurology",
        "name": qsTr("ChatBot")
    }, {
    "icon": "g_translate",
    "name": qsTr("Translate")
}, {
"icon": "bookmark_heart",
"name": qsTr("Anime")
}]
property int selectedTab: 0

    function focusActiveItem()
    {
        swipeView.currentItem.forceActiveFocus();
    }

    anchors.fill: parent
    Keys.onPressed: (event) => {
    if (event.modifiers === Qt.ControlModifier)
    {
        if (event.key === Qt.Key_PageDown)
        {
            root.selectedTab = Math.min(root.selectedTab + 1, root.tabButtonList.length - 1);
            event.accepted = true;
        } else if (event.key === Qt.Key_PageUp) {
        root.selectedTab = Math.max(root.selectedTab - 1, 0);
        event.accepted = true;
    } else if (event.key === Qt.Key_Tab) {
    root.selectedTab = (root.selectedTab + 1) % root.tabButtonList.length;
    event.accepted = true;
} else if (event.key === Qt.Key_Backtab) {
root.selectedTab = (root.selectedTab - 1 + root.tabButtonList.length) % root.tabButtonList.length;
event.accepted = true;
}
}
}

ColumnLayout {
    anchors.fill: parent
    anchors.margins: sidebarPadding
    spacing: sidebarPadding

    // Tab strip
    PrimaryTabBar {
        id: tabBar

        function onCurrentIndexChanged(currentIndex)
        {
            root.selectedTab = currentIndex;
        }

        tabButtonList: root.tabButtonList
        externalTrackedTab: root.selectedTab
    }

    // Content pages
    SwipeView {
        id: swipeView

        Layout.topMargin: 5
        Layout.fillWidth: true
        Layout.fillHeight: true
        spacing: 10
        currentIndex: tabBar.externalTrackedTab
        onCurrentIndexChanged: {
            tabBar.enableIndicatorAnimation = true;
            root.selectedTab = currentIndex;
        }
        clip: true
        layer.enabled: true

        AiChat {
        }

        Translator {
        }

        Anime {
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
