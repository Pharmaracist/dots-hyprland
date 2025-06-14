import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "root:/modules/common/functions/string_utils.js" as StringUtils
import "root:/modules/common/functions/color_utils.js" as ColorUtils
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
    
    // Fixed property declarations with safer fallbacks
    property string artUrl: (player && player.trackArtUrl) ? player.trackArtUrl : ""
    property string artDownloadLocation: Directories.coverArt || "/tmp"
    property string artFileName: artUrl ? Qt.md5(artUrl) + ".jpg" : ""
    property string artFilePath: artFileName ? `${artDownloadLocation}/${artFileName}` : ""
    property bool downloaded: false
    property bool requestDockShow: true
    
    // Always visible in dock with fixed dimensions
    implicitHeight: 45
    implicitWidth: 600
    visible: true

    component DockMediaButton: RippleButton {
        implicitWidth: 25
        implicitHeight: 25
        buttonRadius: 11
        
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

    // Fixed timer with better null checks
    Timer {
        running: player && player.playbackState === MprisPlaybackState.Playing
        interval: 1000
        repeat: true
        onTriggered: {
            if (player && typeof player.positionChanged === 'function') {
                try {
                    player.positionChanged()
                } catch (e) {
                    console.warn("Error updating position:", e)
                }
            }
        }
    }

    // Fixed art URL change handler
    onArtUrlChanged: {
        if (!artUrl || artUrl.length === 0) {
            downloaded = false
            return
        }
        downloaded = false
        coverArtDownloader.running = true
    }

    // Safer process handling following the reference pattern
    Process {
        id: coverArtDownloader
        command: [ "bash", "-c", `[ -f ${artFilePath} ] || curl -sSL '${artUrl}' -o '${artFilePath}'` ]
        onExited: (exitCode, exitStatus) => {
            downloaded = true
        }
    }

    Rectangle {
        id: background
        anchors.fill: parent
        color: Appearance.colors.colLayer0
        radius: Appearance.rounding.normal
        visible: parent.visible
        
        // Subtle background art with error handling
        Image {
            anchors.fill: parent
            source: (downloaded && artFilePath) ? Qt.resolvedUrl(artFilePath) : ""
            fillMode: Image.PreserveAspectCrop
            opacity: 0.3
            asynchronous: true
            cache: false // Prevent caching issues during song changes
            
            onStatusChanged: {
                if (status === Image.Error) {
                    console.warn("Failed to load background image:", source)
                }
            }
            
            layer.enabled: source !== ""
            layer.effect: MultiEffect {
                saturation: 0.3
                blurEnabled: true
                blur: 1.4
            }
        }

        // Progress bar with safer calculations
        Rectangle {
            anchors {
                left: parent.left
                right: parent.right
                bottom: parent.bottom
                leftMargin: 6
                rightMargin: 6
                bottomMargin: 1
            }
            height: 5
            color: ColorUtils.transparentize(Appearance.m3colors.m3secondaryContainer, 0.3)
            radius: 9
            
            Rectangle {
                anchors.left: parent.left
                anchors.bottom: parent.bottom
                width: {
                    if (!player || !player.length || player.length <= 0 || !player.position) return 0
                    let progress = Math.max(0, Math.min(1, player.position / player.length))
                    return parent.width * progress
                }
                height: parent.height
                color: Appearance.colors.colPrimary
                radius: parent.radius
                
                Behavior on width {
                    NumberAnimation { duration: 300; easing.type: Easing.OutQuart }
                }
            }
        }

        RowLayout {
            id: contentRow
            anchors {
                fill: parent
                leftMargin: 15
                rightMargin: 15
                bottomMargin: 8
            }
            spacing: 8

            // Album art with better error handling
            Rectangle {
                id: coverArtContainer
                Layout.preferredWidth: 36
                Layout.preferredHeight: 36
                Layout.minimumWidth: 32
                Layout.minimumHeight: 32
                radius: Appearance.rounding.normal
                color: Appearance.m3colors.m3secondaryContainer
                clip: true
                
                Image {
                    id: coverImage
                    mipmap: true
                    cache: false // Prevent caching issues
                    asynchronous: true
                    anchors.fill: parent
                    source: (downloaded && artFilePath) ? Qt.resolvedUrl(artFilePath) : ""
                    fillMode: Image.PreserveAspectCrop
                    
                    onStatusChanged: {
                        if (status === Image.Error) {
                            console.warn("Failed to load cover art:", source)
                        }
                    }
                    
                    layer.enabled: status === Image.Ready
                    layer.effect: OpacityMask {
                        maskSource: Rectangle {
                            width: coverArtContainer.width
                            height: coverArtContainer.height
                            radius: Appearance.rounding.small
                        }
                    }
                }
                
                MaterialSymbol {
                    anchors.centerIn: parent
                    visible: !downloaded || !artFilePath || coverImage.status !== Image.Ready
                    text: "music_note"
                    color: Appearance.m3colors.m3onSecondaryContainer
                    iconSize: Appearance.font.pixelSize.normal
                }
            }

            // Track info with safer text handling
            ColumnLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                Layout.minimumWidth: 120
                spacing: 1

                StyledText {
                    Layout.fillWidth: true
                    Layout.minimumWidth: 1
                    font.pixelSize: Appearance.font.pixelSize.small
                    font.weight: Font.Medium
                    color: Appearance.colors.colOnLayer0
                    elide: Text.ElideRight
                    text: {
                        if (player && player.trackTitle) {
                            return StringUtils.cleanMusicTitle(player.trackTitle)
                        }
                        return "No Media Playing"
                    }
                }
                
                StyledText {
                    Layout.fillWidth: true
                    Layout.minimumWidth: 1
                    font.pixelSize: Appearance.font.pixelSize.smaller
                    color: Appearance.colors.colSubtext
                    elide: Text.ElideRight
                    text: (player && player.trackArtist) ? player.trackArtist : "Select a media player"
                }
            }

            // Controls with better error handling
            RowLayout {
                Layout.minimumWidth: 96
                spacing: 3
                
                DockMediaButton {
                    iconName: "skip_previous"
                    enabled: player !== null
                    opacity: player !== null ? 1.0 : 0.5
                    onClicked: {
                        if (player && typeof player.previous === 'function') {
                            try {
                                player.previous()
                            } catch (e) {
                                console.warn("Error calling previous:", e)
                            }
                        }
                    }
                }
                
                RippleButton {
                    implicitWidth: 32
                    implicitHeight: 32
                    buttonRadius: 9
                    enabled: player !== null
                    opacity: player !== null ? 1.0 : 0.5
                    
                    colBackground: (player && player.playbackState === MprisPlaybackState.Playing) ? 
                        Appearance.colors.colPrimary : Appearance.m3colors.m3secondaryContainer
                    colBackgroundHover: (player && player.playbackState === MprisPlaybackState.Playing) ? 
                        Appearance.colors.colPrimaryHover : Appearance.colors.colSecondaryContainerHover
                    colRipple: (player && player.playbackState === MprisPlaybackState.Playing) ? 
                        Appearance.colors.colPrimaryActive : Appearance.colors.colSecondaryContainerActive
                    
                    onClicked: {
                        if (player && typeof player.togglePlaying === 'function') {
                            try {
                                player.togglePlaying()
                            } catch (e) {
                                console.warn("Error toggling playback:", e)
                            }
                        }
                    }
                    
                    contentItem: MaterialSymbol {
                        iconSize: Appearance.font.pixelSize.normal
                        horizontalAlignment: Text.AlignHCenter
                        color: (player && player.playbackState === MprisPlaybackState.Playing) ? 
                            Appearance.m3colors.m3onPrimary : Appearance.m3colors.m3onSecondaryContainer
                        text: (player && player.playbackState === MprisPlaybackState.Playing) ? "pause" : "play_arrow"
                    }
                }
                
                DockMediaButton {
                    iconName: "skip_next"
                    enabled: player !== null
                    opacity: player !== null ? 1.0 : 0.5
                    onClicked: {
                        if (player && typeof player.next === 'function') {
                            try {
                                player.next()
                            } catch (e) {
                                console.warn("Error calling next:", e)
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Subtle scale animation on state changes
    Behavior on implicitWidth {
        NumberAnimation { duration: 200; easing.type: Easing.OutQuart }
    }
}