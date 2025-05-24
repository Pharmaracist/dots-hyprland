import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import Quickshell
import Quickshell.Hyprland
import Quickshell.Services.Mpris
import Quickshell.Io
import QtNetwork
import "root:/modules/common/functions/string_utils.js" as StringUtils

Item {
    id: mediaLayout
    width: parent.width
    height: parent.height
    property bool borderless : ConfigOptions.appearance.borderless
    readonly property MprisPlayer activePlayer: MprisController.activePlayer
    readonly property string cleanedTitle: StringUtils.cleanMusicTitle(activePlayer?.trackTitle) || qsTr("No media")

Rectangle {
    width: parent.width
    height: parent.height
    color: "black"
    Timer {
        running: activePlayer?.playbackState == MprisPlaybackState.Playing
        interval: 1000
        repeat: true
        onTriggered: activePlayer.positionChanged()
    }

    MouseArea {
        anchors.fill: parent
        acceptedButtons: Qt.MiddleButton | Qt.BackButton | Qt.ForwardButton | Qt.RightButton | Qt.LeftButton
        onPressed: (event) => {
            if (event.button === Qt.MiddleButton) {
                activePlayer.togglePlaying();
            } else if (event.button === Qt.BackButton) {
                activePlayer.previous();
            } else if (event.button === Qt.ForwardButton || event.button === Qt.RightButton) {
                activePlayer.next();
            } else if (event.button === Qt.LeftButton) {
                Hyprland.dispatch("global quickshell:mediaControlsToggle")
            }
        }
    }
    RowLayout { // Real content
        id: rowLayout

        spacing: 4
        anchors.fill: parent

        CircularProgress {
            Layout.alignment: Qt.AlignVCenter
            Layout.leftMargin: rowLayout.spacing
            lineWidth: 2
            value: activePlayer?.position / activePlayer?.length
            size: 26
            secondaryColor: Appearance.m3colors.m3secondaryContainer
            primaryColor: Appearance.m3colors.m3onSecondaryContainer

            MaterialSymbol {
                anchors.centerIn: parent
                fill: 1
                text: activePlayer?.isPlaying ? "pause" : "play_arrow"
                iconSize: Appearance.font.pixelSize.normal
                color: Appearance.m3colors.m3onSecondaryContainer
            }

        }

        StyledText {
            width: rowLayout.width - (CircularProgress.size + rowLayout.spacing * 2)
            Layout.alignment: Qt.AlignVCenter
            Layout.fillWidth: true // Ensures the text takes up available space
            Layout.rightMargin: rowLayout.spacing
            horizontalAlignment: Text.AlignHCenter
            elide: Text.ElideRight // Truncates the text on the right
            color: Appearance.colors.colOnLayer1
            text: `${cleanedTitle}${activePlayer?.trackArtist ? ' • ' + activePlayer.trackArtist : ''}`
        }

    }
}

}
