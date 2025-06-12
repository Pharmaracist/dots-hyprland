import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import QtQuick.Layouts
import "root:/modules/common"
import "root:/modules/common/functions/color_utils.js" as ColorUtils
import "root:/modules/common/widgets"
import "root:/services"

Item {
    id: root

    property int currentTab: 0
    property var tabButtonList: [{
        "icon": "checklist",
        "name": qsTr("Unfinished")
    }, {
        "name": qsTr("Done"),
        "icon": "check_circle"
    }]
    property bool showAddDialog: false
    property int dialogMargins: 20
    property int fabSize: 48
    property int fabMargins: 14

    Keys.onPressed: (event) => {
        // Open add dialog on "N" (any modifiers)
        // Close dialog on Esc if open

        if ((event.key === Qt.Key_PageDown || event.key === Qt.Key_PageUp) && event.modifiers === Qt.NoModifier) {
            if (event.key === Qt.Key_PageDown)
                currentTab = Math.min(currentTab + 1, root.tabButtonList.length - 1);
            else if (event.key === Qt.Key_PageUp)
                currentTab = Math.max(currentTab - 1, 0);
            event.accepted = true;
        } else if (event.key === Qt.Key_N) {
            root.showAddDialog = true;
            event.accepted = true;
        } else if (event.key === Qt.Key_Escape && root.showAddDialog) {
            root.showAddDialog = false;
            event.accepted = true;
        }
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        TabBar {
            id: tabBar

            Layout.fillWidth: true
            currentIndex: currentTab
            onCurrentIndexChanged: currentTab = currentIndex

            Repeater {
                model: root.tabButtonList

                delegate: SecondaryTabButton {
                    selected: (index == currentTab)
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

            property bool enableIndicatorAnimation: false

            Layout.fillWidth: true
            height: 3

            Connections {
                function onCurrentTabChanged() {
                    tabIndicator.enableIndicatorAnimation = true;
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
                color: Appearance.colors.colPrimary
                radius: Appearance.rounding.full

                anchors {
                    top: parent.top
                    bottom: parent.bottom
                }

                Behavior on x {
                    enabled: tabIndicator.enableIndicatorAnimation
                    animation: Appearance.animation.elementMove.numberAnimation.createObject(this)
                }

                Behavior on implicitWidth {
                    enabled: tabIndicator.enableIndicatorAnimation
                    animation: Appearance.animation.elementMove.numberAnimation.createObject(this)
                }

            }

        }

        SwipeView {
            id: swipeView

            Layout.topMargin: 10
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 10
            clip: true
            currentIndex: currentTab
            onCurrentIndexChanged: {
                tabIndicator.enableIndicatorAnimation = true;
                currentTab = currentIndex;
            }

            // To Do tab
            TaskList {
                listBottomPadding: root.fabSize + root.fabMargins * 2
                emptyPlaceholderIcon: "check_circle"
                emptyPlaceholderText: qsTr("Add TODOs to Obsidian")
                taskList: Todo.list.map(function(item, i) {
                    return Object.assign({
                    }, item, {
                        "originalIndex": i
                    });
                }).filter(function(item) {
                    return !item.done;
                })
            }

            TaskList {
                listBottomPadding: root.fabSize + root.fabMargins * 2
                emptyPlaceholderIcon: "checklist"
                emptyPlaceholderText: qsTr("Finished tasks will go here")
                taskList: Todo.list.map(function(item, i) {
                    return Object.assign({
                    }, item, {
                        "originalIndex": i
                    });
                }).filter(function(item) {
                    return item.done;
                })
            }

        }

    }

    // + FAB
    StyledRectangularShadow {
        target: fabButton
        radius: Appearance.rounding.normal
    }

    Button {
        id: fabButton

        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.rightMargin: root.fabMargins
        anchors.bottomMargin: root.fabMargins
        width: root.fabSize
        height: root.fabSize
        onClicked: root.showAddDialog = true

        PointingHandInteraction {
        }

        background: Rectangle {
            id: fabBackground

            anchors.fill: parent
            radius: Appearance.rounding.normal
            color: (fabButton.down) ? Appearance.colors.colPrimaryContainerActive : (fabButton.hovered ? Appearance.colors.colPrimaryContainerHover : Appearance.colors.colPrimaryContainer)

            Behavior on color {
                animation: Appearance.animation.elementMoveFast.colorAnimation.createObject(this)
            }

        }

        contentItem: CustomIcon {
            source: "obsidian-symbolic"
            height: 80
            width: 80

            ColorOverlay {
                anchors.fill: parent
                color: Appearance.colors.colPrimaryActive
            }

        }

    }

    Item {
        anchors.fill: parent
        z: 9999
        visible: opacity > 0
        opacity: root.showAddDialog ? 1 : 0
        onVisibleChanged: {
            if (!visible) {
                todoInput.text = "";
                fabButton.focus = true;
            }
        }

        // Scrim
        Rectangle {
            anchors.fill: parent
            radius: Appearance.rounding.small
            color: Appearance.colors.colScrim

            MouseArea {
                hoverEnabled: true
                anchors.fill: parent
                preventStealing: true
                propagateComposedEvents: false
            }

        }

        // The dialog
        Rectangle {
            id: dialog

            function addTask() {
                if (todoInput.text.length > 0) {
                    Todo.addTask(todoInput.text);
                    todoInput.text = "";
                    root.showAddDialog = false;
                    root.currentTab = 0; // Show unfinished tasks
                }
            }

            anchors.left: parent.left
            anchors.right: parent.right
            anchors.verticalCenter: parent.verticalCenter
            anchors.margins: root.dialogMargins
            implicitHeight: dialogColumnLayout.implicitHeight
            color: Appearance.colors.colSurfaceContainerHigh
            radius: Appearance.rounding.normal

            ColumnLayout {
                id: dialogColumnLayout

                anchors.fill: parent
                spacing: 16

                StyledText {
                    Layout.topMargin: 16
                    Layout.leftMargin: 16
                    Layout.rightMargin: 16
                    Layout.alignment: Qt.AlignLeft
                    color: Appearance.m3colors.m3onSurface
                    font.pixelSize: Appearance.font.pixelSize.larger
                    text: qsTr("Add task")
                }

                TextField {
                    id: todoInput

                    Layout.fillWidth: true
                    Layout.leftMargin: 16
                    Layout.rightMargin: 16
                    padding: 10
                    color: activeFocus ? Appearance.m3colors.m3onSurface : Appearance.m3colors.m3onSurfaceVariant
                    renderType: Text.NativeRendering
                    selectedTextColor: Appearance.m3colors.m3onSecondaryContainer
                    selectionColor: Appearance.colors.colSecondaryContainer
                    placeholderText: qsTr("Task description")
                    placeholderTextColor: Appearance.m3colors.m3outline
                    focus: root.showAddDialog
                    onAccepted: dialog.addTask()

                    background: Rectangle {
                        anchors.fill: parent
                        radius: Appearance.rounding.verysmall
                        border.width: 2
                        border.color: todoInput.activeFocus ? Appearance.colors.colPrimary : Appearance.m3colors.m3outline
                        color: "transparent"
                    }

                    cursorDelegate: Rectangle {
                        width: 1
                        color: todoInput.activeFocus ? Appearance.colors.colPrimary : "transparent"
                        radius: 1
                    }

                }

                RowLayout {
                    Layout.bottomMargin: 16
                    Layout.leftMargin: 16
                    Layout.rightMargin: 16
                    Layout.alignment: Qt.AlignRight
                    spacing: 5

                    DialogButton {
                        buttonText: qsTr("Cancel")
                        onClicked: root.showAddDialog = false
                    }

                    DialogButton {
                        buttonText: qsTr("Add")
                        enabled: todoInput.text.length > 0
                        onClicked: dialog.addTask()
                    }

                }

            }

        }

        Behavior on opacity {
            NumberAnimation {
                duration: Appearance.animation.elementMoveFast.duration
                easing.type: Appearance.animation.elementMoveFast.type
                easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
            }

        }

    }

}
