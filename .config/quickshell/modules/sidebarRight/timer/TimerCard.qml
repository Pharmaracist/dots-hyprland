import "root:/modules/common"
import "root:/modules/common/widgets"
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects

Item {
    id: root
    height: 120
    property int timerId: -1
    property string timerName: ""
    property int originalDuration: 0
    property int remainingTime: 0
    property bool isRunning: false
    property bool isPaused: false
    property color timerColor: Appearance.m3colors.m3primary

    property string timerIcon: "timer"
    property real progressPercentage: 0

    signal startRequested()
    signal pauseRequested()
    signal resetRequested()
    signal removeRequested()

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        
        if (hours > 0) {
            return hours + ":" + (minutes < 10 ? "0" : "") + minutes + ":" + (secs < 10 ? "0" : "") + secs
        } else {
            return minutes + ":" + (secs < 10 ? "0" : "") + secs
        }
    }

    StyledRectangularShadow {
        target: cardBackground
        radius: Appearance.rounding.normal
    }

    Rectangle {
        id: cardBackground
        anchors.fill: parent
        radius: Appearance.rounding.normal
        color: Appearance.m3colors.m3surfaceContainerLow

        // Progress bar background
        Rectangle {
            id: progressBackground
            anchors {
            left: parent.left
            right: parent.right
            bottom: parent.bottom
            leftMargin: 16
            rightMargin: 16
            bottomMargin: 16
            }
            height: 10
            radius: Appearance.rounding.normal
            color: Appearance.m3colors.m3surfaceContainerHighest
        }

        // Progress bar fill
        Rectangle {
            id: progressFill
            anchors.left: progressBackground.left
            anchors.bottom: progressBackground.bottom
            height: progressBackground.height
            width: progressBackground.width * (root.progressPercentage / 100)
            radius: Appearance.rounding.normal
            color: root.timerColor
            
            Behavior on width {
                NumberAnimation {
                    duration: 200
                    easing.type: Easing.OutCubic
                }
            }
        }

        RowLayout {
            anchors.fill: parent
            anchors.margins: 16
            anchors.bottomMargin: 20
            spacing: 16

            // Timer icon and info
            ColumnLayout {
                Layout.fillWidth: true
                spacing: 4

                RowLayout {
                    spacing: 12

                    Rectangle {
                        width: 40
                        height: 40
                        radius: 20
                        color: root.timerColor
                        opacity: 0.2

                        MaterialSymbol {
                            anchors.centerIn: parent
                            text: root.timerIcon
                            font.pixelSize: 24
                            color: root.timerColor
                        }
                    }

                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 2

                        StyledText {
                            Layout.fillWidth: true
                            text: root.timerName
                            color: Appearance.m3colors.m3onSurface
                            font.pixelSize: Appearance.font.pixelSize.small
                            // elide: Text.ElideRight
                        }

                        StyledText {
                            text: root.formatTime(root.remainingTime)
                            color: root.remainingTime === 0 ? "#e74c3c" : (root.isRunning ? root.timerColor : Appearance.m3colors.m3onSurfaceVariant)
                            font.pixelSize: Appearance.font.pixelSize.large
                        }
                    }
                }

                // Status indicator
                StyledText {
                    text: {
                        if (root.remainingTime === 0) return qsTr("Finished")
                        if (root.isRunning) return qsTr("Running")
                        if (root.isPaused) return qsTr("Paused")
                        return qsTr("Ready")
                    }
                    color: {
                        if (root.remainingTime === 0) return "#e74c3c"
                        if (root.isRunning) return root.timerColor
                        return Appearance.m3colors.m3onSurfaceVariant
                    }
                    font.pixelSize: Appearance.font.pixelSize.small
                }
            }

            // Control buttons
            RowLayout {
                spacing: 8

                // Play/Pause button
                Button {
                    id: playPauseButton
                    width: 40
                    height: 40
                    enabled: root.remainingTime > 0
                    PointingHandInteraction {}
                    onClicked: {
                        if (root.isRunning) {
                            root.pauseRequested()
                        } else {
                            root.startRequested()
                        }
                    }

                    background: BouncyShapeBackground {
                          anchors.fill: parent
                          backgroundRadius: root.isRunning ? 12 : 99
                          backgroundColor: !playPauseButton.enabled
                              ? Appearance.m3colors.m3surfaceContainerHighest
                              : playPauseButton.down
                                  ? Qt.darker(root.timerColor, 1.2)
                                  : playPauseButton.hovered
                                      ? Qt.lighter(root.timerColor, 1.2)
                                      : root.timerColor
                          backgroundOpacity: playPauseButton.enabled ? 1.0 : 0.3
                        }

                    contentItem: MaterialSymbol {
                        text: root.isRunning ? "pause" : "play_arrow"
                        font.pixelSize: 20
                        color: playPauseButton.enabled ? Appearance.m3colors.m3secondaryContainer : Appearance.m3colors.m3outline
                        anchors.centerIn: parent
                    }
                }

                // Reset button
                Button {
                    id: resetButton
                    width: 40
                    height: 40
                    enabled: root.remainingTime !== root.originalDuration
                    PointingHandInteraction {}

                    onClicked: root.resetRequested()

                    background: Rectangle {
                        anchors.fill: parent
                        radius: 20
                        color: {
                            if (!resetButton.enabled) return Appearance.m3colors.m3surfaceContainer
                            if (resetButton.down) return Appearance.m3colors.m3surfaceContainerHigh
                            if (resetButton.hovered) return Appearance.m3colors.m3surfaceContainer
                            return Appearance.m3colors.m3surfaceContainerLow
                        }

                        Behavior on color {
                            ColorAnimation { duration: 150 }
                        }
                    }

                    contentItem: MaterialSymbol {
                        text: "refresh"
                        font.pixelSize: 18
                        color: resetButton.enabled ? Appearance.m3colors.m3onSurface : Appearance.m3colors.m3outline
                        anchors.centerIn: parent
                    }
                }

                // Remove button
                Button {
                    id: removeButton
                    width: 40
                    height: 40
                    PointingHandInteraction {}

                    onClicked: root.removeRequested()

                    background: Rectangle {
                        anchors.fill: parent
                        radius: 20
                        color: {
                            if (removeButton.down) return Appearance.m3colors.m3errorContainer
                            if (removeButton.hovered) return Qt.lighter(Appearance.m3colors.m3errorContainer, 1.5)
                            return Appearance.m3colors.m3surfaceContainer
                        }

                        Behavior on color {
                            ColorAnimation { duration: 150 }
                        }
                    }

                    contentItem: MaterialSymbol {
                        text: "delete"
                        font.pixelSize: 18
                        color: removeButton.hovered ? Appearance.m3colors.m3error : Appearance.m3colors.m3onSurfaceVariant
                        anchors.centerIn: parent
                    }
                }
            }
        }
    }
}