import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "root:/modules/common/functions/string_utils.js" as StringUtils
import "root:/modules/common/functions/color_utils.js" as ColorUtils
import "root:/modules/common/functions/file_utils.js" as FileUtils
import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Effects
import QtQuick.Layouts
import QtQuick.Controls
import Quickshell
import Quickshell.Io
import Quickshell.Services.Mpris
import Quickshell.Widgets

Item {
    id: dockMediaPlayer

    property MprisPlayer player: Mpris.players.values.length > 0 ? Mpris.players.values[0] : null
    property real progressRatio: {
        if (!player || !player.length || player.length <= 0 || !player.position) return 0
        return Math.max(0, Math.min(1, player.position / player.length))
    }

    implicitHeight: 80
    implicitWidth: 600
    visible: true

    component DockMediaButton: RippleButton {
        implicitWidth: 25; implicitHeight: 25; buttonRadius: 11
        property string iconName: ""
        colBackground: ColorUtils.transparentize(Appearance.m3colors.m3secondaryContainer, 0.7)
        colBackgroundHover: Appearance.colors.colSecondaryContainerHover
        colRipple: Appearance.colors.colSecondaryContainerActive

        contentItem: MaterialSymbol {
            iconSize: Appearance.font.pixelSize.normal
            horizontalAlignment: Text.AlignHCenter
            color: Appearance.m3colors.m3onSecondaryContainer
            text: iconName
        }
    }

    Timer {
        running: player && player.playbackState === MprisPlaybackState.Playing
        interval: 1000; repeat: true
        onTriggered: if (player && typeof player.positionChanged === 'function') player.positionChanged()
    }

    Rectangle {
        id: background
        anchors.fill: parent
        color: ColorUtils.transparentize(Appearance.m3colors.m3secondaryContainer, 0.3)
        radius: Appearance.rounding.screenRounding

        Rectangle {
            id: progressBar
            anchors.left: parent.left
            anchors.bottom: parent.bottom
            width: parent.width * progressRatio
            height: parent.height
            color: Appearance.colors.colPrimary
            radius: parent.radius
            Behavior on width { NumberAnimation { duration: 300; easing.type: Easing.OutQuart } }
        }
    }

    RowLayout {
        id: contentRow
        anchors {
                fill: parent
                leftMargin: 10
                rightMargin: 10
            }
            spacing: 8

        Rectangle {
            id: coverArtContainer
            Layout.preferredWidth: 36
            Layout.preferredHeight: 36
            Layout.minimumWidth: 32
            Layout.minimumHeight: 32
            radius: Appearance.rounding.normal
            color: Appearance.m3colors.m3secondaryContainer
            clip: true

            // Show actual cover art when available:
            Image {
                anchors.fill: parent
                source: player && player.trackArtUrl ? player.trackArtUrl : ""
                asynchronous: true
                cache: false
                fillMode: Image.PreserveAspectCrop
                visible: source !== ""
                antialiasing: true            
                layer.enabled: true
                   layer.effect: OpacityMask {
                       maskSource: Rectangle {
                           width: coverArtContainer.width
                           height: coverArtContainer.height
                           radius: Appearance.rounding.small
                       }
                   }
            }

            // Fallback icon:
            MaterialSymbol {
                anchors.centerIn: parent
                text: "music_note"
                color: Appearance.m3colors.m3onSecondaryContainer
                iconSize: Appearance.font.pixelSize.normal
                visible: !player || !player.trackArtUrl
            }
        }

        ColumnLayout {
            Layout.fillWidth: true; Layout.fillHeight: true
            Layout.minimumWidth: 120; spacing: 1

            StyledText {
                Layout.fillWidth: true; Layout.minimumWidth: 1
                font.pixelSize: Appearance.font.pixelSize.small
                font.weight: Font.Medium
                elide: Text.ElideRight
                color: (progressRatio > 0.15) ? Appearance.colors.colLayer0 : Appearance.colors.colOnLayer0
                Behavior on color { ColorAnimation { duration: 250; easing.type: Easing.OutQuad } }
                text: player && player.trackTitle
                      ? StringUtils.cleanMusicTitle(player.trackTitle)
                      : "No Media Playing"
            }

            StyledText {
                Layout.fillWidth: true; Layout.minimumWidth: 1
                font.pixelSize: Appearance.font.pixelSize.smaller
                elide: Text.ElideRight
                color: (progressRatio > 0.15) ? Appearance.colors.colLayer0 : Appearance.colors.colSubtext
                Behavior on color { ColorAnimation { duration: 250; easing.type: Easing.OutQuad } }
                text: player && player.trackArtist
                      ? player.trackArtist
                      : "Select a media player"
            }
        }

        RowLayout {
            Layout.minimumWidth: 96; spacing: 3

            DockMediaButton {
                iconName: "skip_previous"
                enabled: !!player; opacity: player ? 1 : 0.5
                onClicked: player && player.previous()
            }

            RippleButton {
                implicitWidth: 32; implicitHeight: 32
                buttonRadius: hovered ? 15 : 7
                enabled: !!player; opacity: player ? 1 : 0.5

                colBackground: player && player.playbackState === MprisPlaybackState.Playing
                              ? (progressRatio > 0.85
                                 ? Appearance.colors.colLayer0
                                 : Appearance.colors.colSecondary)
                              : Appearance.colors.colSecondaryContainer
                colBackgroundHover: player && player.playbackState === MprisPlaybackState.Playing
                                   ? Appearance.colors.colPrimaryHover
                                   : Appearance.colors.colSecondaryContainerHover
                colRipple: player && player.playbackState === MprisPlaybackState.Playing
                           ? Appearance.colors.colPrimaryActive
                           : Appearance.colors.colSecondaryContainerActive

                onClicked: player && player.togglePlaying()
                Behavior on buttonRadius { animation: Appearance.animation.elementMove.numberAnimation.createObject(this) }

                contentItem: MaterialSymbol {
                    iconSize: Appearance.font.pixelSize.normal
                    fill: 1
                    horizontalAlignment: Text.AlignHCenter
                    color: player && player.playbackState === MprisPlaybackState.Playing
                           ? (progressRatio > 0.85
                              ? Appearance.m3colors.m3secondary
                              : Appearance.m3colors.m3secondaryContainer)
                           : Appearance.m3colors.m3onSecondaryContainer
                    text: player && player.playbackState === MprisPlaybackState.Playing
                          ? "pause" : "play_arrow"
                }
            }

            DockMediaButton {
                iconName: "skip_next"
                enabled: !!player; opacity: player ? 1 : 0.5
                onClicked: player && player.next()
            }
        }
    }

    Behavior on implicitWidth { NumberAnimation { duration: 200; easing.type: Easing.OutQuart } }
}
