import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "./calendar"
import "./todo"
import "./timer"
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell

Rectangle {
    id: root
    radius: Appearance.rounding.normal
    color: Appearance.colors.colLayer1
    clip: true
    implicitHeight: collapsed ? collapsedBottomWidgetGroupRow.implicitHeight : bottomWidgetGroupRow.implicitHeight

    property int selectedTab: PersistentStates.sidebar.bottomGroup.selectedTab ?? 0
    property bool collapsed: PersistentStates.sidebar.bottomGroup.collapsed ?? false

    property var tabs: [
        { "type": "calendar", "name": "Calendar", "icon": "calendar_month", "widget": calendarWidget },
        { "type": "todo", "name": "To Do", "icon": "done_outline", "widget": todoWidget },
        { "type": "timer", "name": "Timers", "icon": "hourglass_bottom", "widget": timerWidget }
    ]

    Component.onCompleted: {
        if (selectedTab < 0 || selectedTab >= tabs.length)
            selectedTab = 0
        tabStack.currentIndex = selectedTab
        tabStack.realIndex = selectedTab
    }

    Behavior on implicitHeight {
        NumberAnimation {
            duration: Appearance.animation.elementMove.duration
            easing.type: Appearance.animation.elementMove.type
            easing.bezierCurve: Appearance.animation.elementMove.bezierCurve
        }
    }

    function setCollapsed(state) {
        PersistentStateManager.setState("sidebar.bottomGroup.collapsed", state)
        if (state) {
            bottomWidgetGroupRow.opacity = 0
        } else {
            collapsedBottomWidgetGroupRow.opacity = 0
        }
        collapseCleanFadeTimer.start()
    }

    Timer {
        id: collapseCleanFadeTimer
        interval: Appearance.animation.elementMove.duration / 2
        repeat: false
        onTriggered: {
            if (collapsed) {
                collapsedBottomWidgetGroupRow.opacity = 1
            } else {
                bottomWidgetGroupRow.opacity = 1
            }
        }
    }

    Keys.onPressed: (event) => {
        if ((event.key === Qt.Key_PageDown || event.key === Qt.Key_PageUp)
            && event.modifiers === Qt.ControlModifier) {
            if (event.key === Qt.Key_PageDown) {
                selectedTab = Math.min(selectedTab + 1, tabs.length - 1)
            } else if (event.key === Qt.Key_PageUp) {
                selectedTab = Math.max(selectedTab - 1, 0)
            }
            PersistentStateManager.setState("sidebar.bottomGroup.selectedTab", selectedTab)
            event.accepted = true
        }
    }

    // Collapsed View
    RowLayout {
        id: collapsedBottomWidgetGroupRow
        opacity: collapsed ? 1 : 0
        visible: opacity > 0

        Behavior on opacity {
            NumberAnimation {
                duration: Appearance.animation.elementMove.duration / 2
                easing.type: Appearance.animation.elementMove.type
                easing.bezierCurve: Appearance.animation.elementMove.bezierCurve
            }
        }

        spacing: 15

        CalendarHeaderButton {
            Layout.margins: 10
            Layout.rightMargin: 0
            forceCircle: true
            onClicked: root.setCollapsed(false)
            contentItem: MaterialSymbol {
                text: "keyboard_arrow_up"
                iconSize: Appearance.font.pixelSize.larger
                horizontalAlignment: Text.AlignHCenter
                color: Appearance.colors.colOnLayer1
            }
        }

        StyledText {
            property int remainingTasks: Todo.list.filter(task => !task.done).length
            Layout.margins: 10
            Layout.leftMargin: 0
            text: `${DateTime.collapsedCalendarFormat} • ${remainingTasks} task${remainingTasks > 1 ? "s" : ""}`
            font.pixelSize: Appearance.font.pixelSize.large
            color: Appearance.colors.colOnLayer1
        }
    }

    // Expanded View
    RowLayout {
        id: bottomWidgetGroupRow
        opacity: collapsed ? 0 : 1
        visible: opacity > 0

        Behavior on opacity {
            NumberAnimation {
                duration: Appearance.animation.elementMove.duration / 2
                easing.type: Appearance.animation.elementMove.type
                easing.bezierCurve: Appearance.animation.elementMove.bezierCurve
            }
        }

        anchors.fill: parent
        height: tabStack.height
        spacing: 10

        // Sidebar / Nav Rail
        Item {
            Layout.fillHeight: true
            Layout.fillWidth: false
            Layout.leftMargin: 10
            Layout.topMargin: 10
            width: tabBar.width

            ColumnLayout {
                anchors.verticalCenter: parent.verticalCenter
                anchors.left: parent.left
                anchors.leftMargin: 5
                id: tabBar
                spacing: 15

                Repeater {
                    model: tabs
                    NavRailButton {
                        toggled: selectedTab == index
                        buttonText: modelData.name
                        buttonIcon: modelData.icon
                        onClicked: {
                            selectedTab = index
                            PersistentStateManager.setState("sidebar.bottomGroup.selectedTab", index)
                        }
                    }
                }
            }

            CalendarHeaderButton {
                anchors.left: parent.left
                anchors.top: parent.top
                forceCircle: true
                onClicked: root.setCollapsed(true)
                contentItem: MaterialSymbol {
                    text: "keyboard_arrow_down"
                    iconSize: Appearance.font.pixelSize.larger
                    horizontalAlignment: Text.AlignHCenter
                    color: Appearance.colors.colOnLayer1
                }
            }
        }

        // Tab Content Area
        StackLayout {
            id: tabStack
            Layout.fillWidth: true
            Layout.alignment: Qt.AlignVCenter
            property int realIndex: selectedTab
            property int animationDuration: Appearance.animation.elementMoveFast.duration * 1.5
            height: tabStack.children[0]?.tabLoader?.implicitHeight

            Connections {
                target: root
                function onSelectedTabChanged() {
                    delayedStackSwitch.restart()
                    tabStack.realIndex = selectedTab
                }
            }

            Timer {
                id: delayedStackSwitch
                interval: tabStack.animationDuration / 2
                repeat: false
                onTriggered: tabStack.currentIndex = selectedTab
            }

            Repeater {
                model: tabs
                Item {
                    id: tabItem
                    property int tabIndex: index
                    property int animDistance: 5
                    property var tabLoader: tabLoader

                    opacity: (tabStack.currentIndex === tabIndex && tabStack.realIndex === tabIndex) ? 1 : 0
                    y: (tabStack.realIndex === tabIndex) ? 0 : (tabStack.realIndex < tabIndex ? animDistance : -animDistance)

                    Behavior on opacity {
                        NumberAnimation {
                            duration: tabStack.animationDuration / 2
                            easing.type: Easing.OutCubic
                        }
                    }

                    Behavior on y {
                        NumberAnimation {
                            duration: tabStack.animationDuration
                            easing.type: Easing.OutExpo
                        }
                    }

                    Loader {
                        id: tabLoader
                        anchors.fill: parent
                        sourceComponent: modelData.widget
                        focus: selectedTab === tabIndex
                    }
                }
            }
        }
    }

    // Widget Components
    Component {
        id: calendarWidget
        CalendarWidget {
            anchors.centerIn: parent
        }
    }

    Component {
        id: todoWidget
        TodoWidget {
            anchors.fill: parent
            anchors.margins: 5
        }
    }

    Component {
        id: timerWidget
        TimerWidget {
            anchors.fill: parent
            anchors.margins: 5
        }
    }
}
