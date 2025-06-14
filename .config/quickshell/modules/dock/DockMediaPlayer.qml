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
    id: dockPlayer
    required property MprisPlayer player
    
    property var artUrl: player?.trackArtUrl
    property string artDownloadLocation: Directories.coverArt
    property string artFileName: Qt.md5(artUrl) + ".jpg"
    property string artFilePath: `${artDownloadLocation}/${artFileName}`
    property color artDominantColor: colorQuantizer?.colors[0] || Appearance.m3colors.m3secondaryContainer
    property bool downloaded: false
    
    implicitHeight: 50
    implicitWidth: Math.max(320, contentRow.implicitWidth + 20)

    component DockButton: RippleButton {
        implicitWidth: 32
        implicitHeight: 32
        buttonRadius: 16
        
        property string iconName
        colBackground: ColorUtils.transparentize(blendedColors.colSecondaryContainer, 0.8)
        colBackgroundHover: blendedColors.colSecondaryContainerHover
        colRipple: blendedColors.colSecondaryContainerActive

        contentItem: MaterialSymbol {
            iconSize: Appearance.font.pixelSize.normal
            horizontalAlignment: Text.AlignHCenter
            color: blendedColors.colOnSecondaryContainer
            text: iconName
        }
    }

    onArtUrlChanged: {
        if (artUrl?.length) {
            downloaded = false
            coverArtDownloader.running = true
        } else {
            artDominantColor = Appearance.m3colors.m3secondaryContainer
        }
    }

    Process {
        id: coverArtDownloader
        command: ["bash", "-c", `[ -f ${artFilePath} ] || curl -sSL '${artUrl}' -o '${artFilePath}'`]
        onExited: downloaded = true
    }

    ColorQuantizer {
        id: colorQuantizer
        source: downloaded ? Qt.resolvedUrl(artFilePath) : ""
        depth: 0
        rescaleSize: 1
    }

    property QtObject blendedColors: QtObject {
        property color colLayer0: ColorUtils.mix(Appearance.colors.colLayer0, artDominantColor, 0.3)
        property color colOnLayer0: ColorUtils.mix(Appearance.colors.colOnLayer0, artDominantColor, 0.4)
        property color colSubtext: ColorUtils.mix(Appearance.colors.colOnLayer1, artDominantColor, 0.3)
        property color colPrimary: ColorUtils.mix(Appearance.colors.colPrimary, artDominantColor, 0.4)
        property color colPrimaryHover: ColorUtils.mix(Appearance.colors.colPrimaryHover, artDominantColor, 0.3)
        property color colPrimaryActive: ColorUtils.mix(Appearance.colors.colPrimaryActive, artDominantColor, 0.3)
        property color colSecondaryContainer: ColorUtils.mix(Appearance.m3colors.m3secondaryContainer, artDominantColor, 0.2)
        property color colSecondaryContainerHover: ColorUtils.mix(Appearance.colors.colSecondaryContainerHover, artDominantColor, 0.2)
        property color colSecondaryContainerActive: ColorUtils.mix(Appearance.colors.colSecondaryContainerActive, artDominantColor, 0.3)
        property color colOnPrimary: ColorUtils.mix(Appearance.m3colors.m3onPrimary, artDominantColor, 0.4)
        property color colOnSecondaryContainer: ColorUtils.mix(Appearance.m3colors.m3onSecondaryContainer, artDominantColor, 0.2)
    }

    Rectangle {
        id: background
        anchors.fill: parent
        color: blendedColors.colLayer0
        radius: Appearance.rounding.normal
        
        // Subtle background art
        Image {
            anchors.fill: parent
            source: downloaded ? Qt.resolvedUrl(artFilePath) : ""
            fillMode: Image.PreserveAspectCrop
            opacity: 0.1
            
            layer.enabled: true
            layer.effect: MultiEffect {
                saturation: 0.3
                blurEnabled: true
                blur: 0.8
            }
        }

        RowLayout {
            id: contentRow
            anchors {
                fill: parent
                margins: 8
            }
            spacing: 8

            // Album art
            Rectangle {
                Layout.preferredWidth: 34
                Layout.preferredHeight: 34
                radius: Appearance.rounding.small
                color: blendedColors.colSecondaryContainer
                
                Image {
                    anchors.fill: parent
                    source: downloaded ? Qt.resolvedUrl(artFilePath) : ""
                    fillMode: Image.PreserveAspectCrop
                    
                    layer.enabled: true
                    layer.effect: OpacityMask {
                        maskSource: Rectangle {
                            width: parent.width
                            height: parent.height
                            radius: parent.radius
                        }
                    }
                }
                
                MaterialSymbol {
                    anchors.centerIn: parent
                    visible: !downloaded
                    text: "music_note"
                    color: blendedColors.colOnSecondaryContainer
                    iconSize: Appearance.font.pixelSize.normal
                }
            }

            // Track info
            ColumnLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                spacing: 0

                StyledText {
                    Layout.fillWidth: true
                    font.pixelSize: Appearance.font.pixelSize.small
                    font.weight: Font.Medium
                    color: blendedColors.colOnLayer0
                    elide: Text.ElideRight
                    text: StringUtils.cleanMusicTitle(player?.trackTitle) || "No Title"
                }
                
                StyledText {
                    Layout.fillWidth: true
                    font.pixelSize: Appearance.font.pixelSize.smaller
                    color: blendedColors.colSubtext
                    elide: Text.ElideRight
                    text: player?.trackArtist || "Unknown Artist"
                }
            }

            // Progress indicator (mini)
            Rectangle {
                Layout.preferredWidth: 2
                Layout.fillHeight: true
                color: blendedColors.colSecondaryContainer
                radius: 1
                
                Rectangle {
                    anchors.bottom: parent.bottom
                    width: parent.width
                    height: parent.height * (player?.position / Math.max(player?.length, 1) || 0)
                    color: blendedColors.colPrimary
                    radius: parent.radius
                    
                    Behavior on height {
                        NumberAnimation { duration: 200 }
                    }
                }
            }

            // Controls
            RowLayout {
                spacing: 4
                
                DockButton {
                    iconName: "skip_previous"
                    onClicked: player?.previous()
                }
                
                RippleButton {
                    implicitWidth: 36
                    implicitHeight: 36
                    buttonRadius: 18
                    
                    colBackground: player?.isPlaying ? blendedColors.colPrimary : blendedColors.colSecondaryContainer
                    colBackgroundHover: player?.isPlaying ? blendedColors.colPrimaryHover : blendedColors.colSecondaryContainerHover
                    colRipple: player?.isPlaying ? blendedColors.colPrimaryActive : blendedColors.colSecondaryContainerActive
                    
                    onClicked: player?.togglePlaying()
                    
                    contentItem: MaterialSymbol {
                        iconSize: Appearance.font.pixelSize.large
                        horizontalAlignment: Text.AlignHCenter
                        color: player?.isPlaying ? blendedColors.colOnPrimary : blendedColors.colOnSecondaryContainer
                        text: player?.isPlaying ? "pause" : "play_arrow"
                    }
                }
                
                DockButton {
                    iconName: "skip_next"
                    onClicked: player?.next()
                }
            }
        }
    }
    
    // Hover effect for more info
    MouseArea {
        anchors.fill: parent
        hoverEnabled: true
        acceptedButtons: Qt.NoButton
        
        ToolTip {
            visible: parent.containsMouse && player?.trackTitle
            text: `${player?.trackTitle || "Unknown"}\n${player?.trackArtist || "Unknown Artist"}\n${StringUtils.friendlyTimeForSeconds(player?.position)} / ${StringUtils.friendlyTimeForSeconds(player?.length)}`
            delay: 800
        }
    }
}