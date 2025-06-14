import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "root:/modules/common/functions/string_utils.js" as StringUtils
import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Services.Mpris
import Quickshell.Hyprland

Item {
    id: root
    property bool borderless : ConfigOptions.appearance.borderless
    readonly property MprisPlayer activePlayer: MprisController.activePlayer
    readonly property string cleanedTitle: StringUtils.cleanMusicTitle(activePlayer?.trackTitle) || qsTr("No media")
    Timer {
        running: activePlayer?.playbackState == MprisPlaybackState.Playing
        interval: 1000
        repeat: true
        onTriggered: activePlayer.positionChanged()
    }
    Rectangle {
    id:background
        anchors.centerIn: parent
        implicitWidth: 340
        implicitHeight:barWidth * padding
        radius: Appearance.rounding.small
        color: Appearance.colors.colLayer1

RowLayout {
    id:rowLayout
    anchors.fill: parent
    spacing:20
   CircularProgress {
    id:progress
            Layout.alignment: Qt.AlignVCenter
            Layout.leftMargin:10
            lineWidth: 2
            value: activePlayer?.position / activePlayer?.length
            size: 26
            secondaryColor: Appearance.colors.colSecondaryContainer
            primaryColor: Appearance.m3colors.m3onSecondaryContainer

            MaterialSymbol {
                anchors.centerIn: parent
                fill: 1
                text: activePlayer?.isPlaying ? "pause" : "music_note"
                iconSize: Appearance.font.pixelSize.normal
                color: Appearance.m3colors.m3onSecondaryContainer
            }

        }
        StyledText {
                Layout.alignment: Qt.AlignVCenter |Qt.AlignHCenter  
                Layout.fillWidth: true // Ensures the text takes up available space
                Layout.fillHeight:true
                Layout.rightMargin: 10
                horizontalAlignment: Text.AlignHCenter
               elide: Text.ElideRight // Truncates the text on the right
               color: Appearance.colors.colOnLayer1
               text: `${cleanedTitle}${activePlayer?.trackArtist ? ' • ' + activePlayer.trackArtist : ''}`
             }
             
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


}
}