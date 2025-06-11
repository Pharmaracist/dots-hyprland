import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects

Item {
    id: root
    property var timerList: []
    property string emptyPlaceholderIcon: "timer"
        property int listBottomPadding: 0

            signal startTimer(int timerId)
            signal pauseTimer(int timerId)
            signal resetTimer(int timerId)
            signal removeTimer(int timerId)

            ListView {
                id: listView
                anchors.fill: parent
                anchors.topMargin: 10
                anchors.leftMargin: 10
                anchors.rightMargin: 10
                anchors.bottomMargin: root.listBottomPadding
                spacing: 8
                model: root.timerList
                clip: true

                delegate: TimerCard {
                    width: listView.width
                    timerId: modelData.id
                    timerName: modelData.name
                    originalDuration: modelData.originalDuration
                    remainingTime: modelData.remainingTime
                    isRunning: modelData.isRunning
                    isPaused: modelData.isPaused
                    timerColor: modelData.color
                    timerIcon: modelData.icon
                    progressPercentage: ((modelData.originalDuration - modelData.remainingTime) / modelData.originalDuration) * 100

                    onStartRequested: root.startTimer(timerId)
                    onPauseRequested: root.pauseTimer(timerId)
                    onResetRequested: root.resetTimer(timerId)
                    onRemoveRequested: root.removeTimer(timerId)
                }

                // Empty state
                Item {
                    anchors.centerIn: parent
                    // visible: root.timerList.length === 0
                    width: parent.width
                    height: 200

                }
            }
        }