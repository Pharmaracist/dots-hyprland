import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "root:/modules/common/functions/color_utils.js" as ColorUtils
import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects

Item {
    id: root
    property int currentTab: 0
    property var tabButtonList: [{"icon": "timer", "name": qsTr("Active")}, {"name": qsTr("Presets"), "icon": "apps"}]
    property bool showAddDialog: false
    property bool showCustomDialog: false
    property int dialogMargins: 20
    property int fabSize: 48
    property int fabMargins: 14

    // Timer service connection
    Connections {
        target: Timer
        function onTimerFinished(timerId, name) {
            // Show notification or handle timer completion
            console.log("Timer finished:", name)
            // Could trigger system notification here
        }
    }

    Keys.onPressed: (event) => {
        if ((event.key === Qt.Key_PageDown || event.key === Qt.Key_PageUp) && event.modifiers === Qt.NoModifier) {
            if (event.key === Qt.Key_PageDown) {
                currentTab = Math.min(currentTab + 1, root.tabButtonList.length - 1)
            } else if (event.key === Qt.Key_PageUp) {
                currentTab = Math.max(currentTab - 1, 0)
            }
            event.accepted = true;
        }
        // Open add dialog on "N" (any modifiers)
        else if (event.key === Qt.Key_N) {
            root.showAddDialog = true
            event.accepted = true;
        }
        // Close dialog on Esc if open
        else if (event.key === Qt.Key_Escape && (root.showAddDialog || root.showCustomDialog)) {
            root.showAddDialog = false
            root.showCustomDialog = false
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

            background: Item {
                WheelHandler {
                    onWheel: (event) => {
                        if (event.angleDelta.y < 0)
                            tabBar.currentIndex = Math.min(tabBar.currentIndex + 1, root.tabButtonList.length - 1)
                        else if (event.angleDelta.y > 0)
                            tabBar.currentIndex = Math.max(tabBar.currentIndex - 1, 0)
                    }
                    acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
                }
            }

            Repeater {
                model: root.tabButtonList
                delegate: SecondaryTabButton {
                    selected: (index == currentTab)
                    buttonText: modelData.name
                    buttonIcon: modelData.icon
                }
            }
        }

        Item { // Tab indicator
            id: tabIndicator
            Layout.fillWidth: true
            height: 3
            property bool enableIndicatorAnimation: false
            
            Connections {
                target: root
                function onCurrentTabChanged() {
                    tabIndicator.enableIndicatorAnimation = true
                }
            }

            Rectangle {
                id: indicator
                property int tabCount: root.tabButtonList.length
                property real fullTabSize: root.width / tabCount;
                property real targetWidth: tabBar.contentItem.children[0].children[tabBar.currentIndex].tabContentWidth

                implicitWidth: targetWidth
                anchors {
                    top: parent.top
                    bottom: parent.bottom
                }

                x: tabBar.currentIndex * fullTabSize + (fullTabSize - targetWidth) / 2

                color: Appearance.colors.colPrimary
                radius: Appearance.rounding.full

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
                tabIndicator.enableIndicatorAnimation = true
                currentTab = currentIndex
            }

            // Active Timers tab
            TimerList {
                listBottomPadding: 0 
                emptyPlaceholderIcon: "timer"
                timerList: TimerService.timers
                onStartTimer: (timerId) => TimerService.startTimer(timerId)
                onPauseTimer: (timerId) => TimerService.pauseTimer(timerId)
                onResetTimer: (timerId) => TimerService.resetTimer(timerId)
                onRemoveTimer: (timerId) => TimerService.removeTimer(timerId)
            ColumnLayout {
               visible: TimerService.timers.length === 0
               anchors.centerIn: parent
               spacing: 8
               opacity: 0.6

               MaterialSymbol {
                   text: "timer_off"
                   font.pixelSize: 48
                   color: Appearance.m3colors.m3onSurfaceVariant
                   anchors.horizontalCenter: parent.horizontalCenter
               }

               StyledText {
                   text: qsTr("No active timers")
                   font.pixelSize: Appearance.font.pixelSize.large
                   color: Appearance.m3colors.m3onSurfaceVariant
                   horizontalAlignment: Text.AlignHCenter
                   anchors.horizontalCenter: parent.horizontalCenter
               }

               StyledText {
                   text: qsTr("Click the + button to create one.")
                   font.pixelSize: Appearance.font.pixelSize.normal
                   color: Appearance.m3colors.m3onSurfaceVariant
                   horizontalAlignment: Text.AlignHCenter
                   anchors.horizontalCenter: parent.horizontalCenter
               }
            }       
            }

            // Presets tab
            PresetList {
                listBottomPadding:0
                emptyPlaceholderIcon: "apps"
                emptyPlaceholderText: qsTr("Timer presets")
                presetList: TimerService.presets
                onCreateFromPreset: (preset) => {
                    TimerService.addTimer(preset.name, preset.duration, preset)
                    root.currentTab = 0 // Switch to active timers
                }
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
        z:100
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.rightMargin: root.fabMargins
        anchors.bottomMargin: root.fabMargins
        width: root.fabSize
        height: root.fabSize
        PointingHandInteraction {}

        onClicked: root.showAddDialog = true

        background: Rectangle {
            id: fabBackground
            anchors.fill: parent
            radius: Appearance.rounding.normal
            color: (fabButton.down) ? Appearance.colors.colPrimaryContainerActive : (fabButton.hovered ? Appearance.colors.colPrimaryContainerHover : Appearance.colors.colPrimaryContainer)

            Behavior on color {
                animation: Appearance.animation.elementMoveFast.colorAnimation.createObject(this)
            }
        }

        contentItem: MaterialSymbol {
            text: "add"
            font.pixelSize:32
            anchors.centerIn: fabBackground.center
            color: Appearance.m3colors.m3onPrimaryContainer
        }
    }
    
    // Add Timer Dialog
    Item {
        anchors.fill: parent
        z: 9999

        visible: opacity > 0
        opacity: root.showAddDialog ? 1 : 0
        Behavior on opacity {
            NumberAnimation {
                duration: Appearance.animation.elementMoveFast.duration
                easing.type: Appearance.animation.elementMoveFast.type
                easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
            }
        }

        onVisibleChanged: {
            if (!visible) {
                timerNameInput.text = ""
                timerMinutesInput.text = ""
                timerSecondsInput.text = ""
                fabButton.focus = true
            }
        }

        Rectangle { // Scrim
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

        Rectangle { // The dialog
            id: addDialog
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.verticalCenter: parent.verticalCenter
            anchors.margins: root.dialogMargins
            implicitHeight: addDialogColumnLayout.implicitHeight

            color: Appearance.m3colors.m3surfaceContainerHigh
            radius: Appearance.rounding.normal

            function addCustomTimer() {
                const minutes = parseInt(timerMinutesInput.text) || 0
                const seconds = parseInt(timerSecondsInput.text) || 0
                const totalSeconds = minutes * 60 + seconds
                const name = timerNameInput.text || qsTr("Custom Timer")

                if (totalSeconds > 0) {
                    TimerService.addTimer(name, totalSeconds, null)
                    timerNameInput.text = ""
                    timerMinutesInput.text = ""
                    timerSecondsInput.text = ""
                    root.showAddDialog = false
                    root.currentTab = 0 // Show active timers
                }
            }

            ColumnLayout {
                id: addDialogColumnLayout
                anchors.fill: parent
                spacing: 16

                StyledText {
                    Layout.topMargin: 16
                    Layout.leftMargin: 16
                    Layout.rightMargin: 16
                    Layout.alignment: Qt.AlignLeft
                    color: Appearance.m3colors.m3onSurface
                    font.pixelSize: Appearance.font.pixelSize.larger
                    text: qsTr("Add Custom Timer")
                }

                TextField {
                    id: timerNameInput
                    Layout.fillWidth: true
                    Layout.leftMargin: 16
                    Layout.rightMargin: 16
                    padding: 10
                    color: activeFocus ? Appearance.m3colors.m3onSurface : Appearance.m3colors.m3onSurfaceVariant
                    renderType: Text.NativeRendering
                    selectedTextColor: Appearance.m3colors.m3onSecondaryContainer
                    selectionColor: Appearance.m3colors.m3secondaryContainer
                    placeholderText: qsTr("Timer name")
                    placeholderTextColor: Appearance.m3colors.m3outline
                    focus: root.showAddDialog

                    background: Rectangle {
                        anchors.fill: parent
                        radius: Appearance.rounding.verysmall
                        border.width: 2
                        border.color: timerNameInput.activeFocus ? Appearance.colors.colPrimary : Appearance.m3colors.m3outline
                        color: "transparent"
                    }

                    cursorDelegate: Rectangle {
                        width: 1
                        color: timerNameInput.activeFocus ? Appearance.colors.colPrimary : "transparent"
                        radius: 1
                    }
                }

                RowLayout {
                    Layout.leftMargin: 16
                    Layout.rightMargin: 16
                    spacing: 15
                   RowLayout {
                     spacing:8
                     TextField {
                        id: timerMinutesInput
                        Layout.preferredWidth: 60
                        padding: 10
                        inputMethodHints: Qt.ImhDigitsOnly
                        validator: IntValidator { bottom: 0; top: 999 }
                        placeholderText: "0"
                        placeholderTextColor: Appearance.m3colors.m3outline
                        color: activeFocus ? Appearance.m3colors.m3onSurface : Appearance.m3colors.m3onSurfaceVariant

                        background: Rectangle {
                            anchors.fill: parent
                            radius: Appearance.rounding.verysmall
                            border.width: 2
                            border.color: timerMinutesInput.activeFocus ? Appearance.colors.colPrimary : Appearance.m3colors.m3outline
                            color: "transparent"
                        }
                    }

                    StyledText {
                        text: qsTr("min")
                        color: Appearance.m3colors.m3onSurfaceVariant
                    }
}
                    RowLayout {
                        spacing : 8
                        TextField {
                        id: timerSecondsInput
                        Layout.preferredWidth: 60
                        padding: 10
                        inputMethodHints: Qt.ImhDigitsOnly
                        validator: IntValidator { bottom: 0; top: 59 }
                        placeholderText: "0"
                        placeholderTextColor: Appearance.m3colors.m3outline
                        color: activeFocus ? Appearance.m3colors.m3onSurface : Appearance.m3colors.m3onSurfaceVariant

                        background: Rectangle {
                            anchors.fill: parent
                            radius: Appearance.rounding.verysmall
                            border.width: 2
                            border.color: timerSecondsInput.activeFocus ? Appearance.colors.colPrimary : Appearance.m3colors.m3outline
                            color: "transparent"
                        }
                    }

                    StyledText {
                        Layout.fillWidth:true
                        text: qsTr("sec")
                        color: Appearance.m3colors.m3onSurfaceVariant
                    }
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
                        buttonText: qsTr("Add Timer")
                        enabled: (parseInt(timerMinutesInput.text) || 0) > 0 || (parseInt(timerSecondsInput.text) || 0) > 0
                        onClicked: addDialog.addCustomTimer()
                    }
                }
            }
        }
    }
}