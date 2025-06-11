import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects

Item {
    id: root
    property var presetList: []
    property string emptyPlaceholderText: qsTr("No presets")
    property string emptyPlaceholderIcon: "apps"
    property int listBottomPadding: 0

    signal createFromPreset(var preset)

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        
        if (hours > 0) {
            return hours + "h " + minutes + "m"
        } else if (minutes > 0) {
            return minutes + "m"
        } else {
            return secs + "s"
        }
    }

    GridView {
        id: gridView
        anchors.fill: parent
        anchors.topMargin: 10
        anchors.leftMargin: 10
        anchors.rightMargin: 10
        anchors.bottomMargin: root.listBottomPadding
        cellWidth: Math.floor(width / Math.max(1, Math.floor(width / 160)))
        cellHeight: 100
        model: root.presetList
        clip: true

        delegate: Item {
            width: gridView.cellWidth
            height: gridView.cellHeight

            Rectangle {
                id: presetCard
                anchors.fill: parent
                anchors.margins: 4
                radius: Appearance.rounding.normal
                color: Appearance.m3colors.m3surfaceContainerLow
                border.width: presetMouseArea.containsMouse ? 2 : 0
                border.color: modelData.color

                StyledRectangularShadow {
                    target: parent
                    radius: Appearance.rounding.normal
                }

                MouseArea {
                    id: presetMouseArea
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor

                    onClicked: root.createFromPreset(modelData)

                    Rectangle {
                        anchors.fill: parent
                        radius: parent.parent.radius
                        color: modelData.color
                        opacity: presetMouseArea.pressed ? 0.1 : (presetMouseArea.containsMouse ? 0.05 : 0)

                        Behavior on opacity {
                            NumberAnimation { duration: 150 }
                        }
                    }
                }

                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 16
                    spacing: 8

                    Rectangle {
                        Layout.alignment: Qt.AlignHCenter
                        width: 48
                        height: 48
                        radius: 24
                        color: modelData.color
                        opacity: 0.2
                        MaterialSymbol {
                            text: modelData.icon 
                            font.pixelSize:28
                            anchors.centerIn: parent
                            color: Appearance.m3colors.m3onSurface 
                        }
                    }

                    StyledText {
                        Layout.fillWidth: true
                        Layout.alignment: Qt.AlignHCenter
                        text: modelData.name
                        color: Appearance.m3colors.m3onSurface
                        font.pixelSize: Appearance.font.pixelSize.normal
                        font.weight: Font.Medium
                        horizontalAlignment: Text.AlignHCenter
                        elide: Text.ElideRight
                        wrapMode: Text.WordWrap
                        maximumLineCount: 2
                    }

                    StyledText {
                        Layout.alignment: Qt.AlignHCenter
                        text: root.formatTime(modelData.duration)
                        color: modelData.color
                        font.pixelSize: Appearance.font.pixelSize.small
                        font.weight: Font.Bold
                        horizontalAlignment: Text.AlignHCenter
                    }
                }

             }
        }

    }
}