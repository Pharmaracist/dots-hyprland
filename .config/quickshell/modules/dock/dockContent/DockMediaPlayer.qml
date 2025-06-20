import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "../dockComponents"
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
import Quickshell.Hyprland

Item {
    id: dockMediaPlayer

    // ─────── Player Management ───────
    property int selectedPlayerIndex: 0
    readonly property var realPlayers: Mpris.players.values.filter(player => isRealPlayer(player))
    readonly property var meaningfulPlayers: filterDuplicatePlayers(realPlayers)
    readonly property MprisPlayer player: meaningfulPlayers.length > 0 ? meaningfulPlayers[selectedPlayerIndex] : null
    property bool useVinylFallback: PersistentStates.dock.useVinyl
    
    property real progressRatio: {
        if (!player || !player.length || player.length <= 0 || !player.position) return 0
        return Math.max(0, Math.min(1, player.position / player.length))
    }
    property bool blurArtEnabled: PersistentStates.dock.useBlur ?? false  // Toggle property for blur art AND color generation
    property bool showPlayerSelector: true  // Toggle for player selector visibility
    property bool showVisualizer: true     // Toggle for visualizer visibility
    property list<real> visualizerPoints: []
    property real maxVisualizerValue: 1000
    property int visualizerSmoothing: 2
    property bool hasPlasmaIntegration: false

    // ─────── Adaptive Colors Properties ───────
    property var artUrl: player?.trackArtUrl
    property string artDownloadLocation: Directories.coverArt
    property string artFileName: Qt.md5(artUrl) + ".jpg"
    property string artFilePath: `${artDownloadLocation}/${artFileName}`
    property color artDominantColor: colorQuantizer?.colors[0] || Appearance.m3colors.m3secondaryContainer
    property bool downloaded: true

    implicitHeight: 45
    implicitWidth: ConfigOptions?.dock.mediaPlayer.width ?? 800
    visible: true

    // Reset selection when players change
    onMeaningfulPlayersChanged: {
        if (selectedPlayerIndex >= meaningfulPlayers.length) {
            selectedPlayerIndex = 0;
        }
    }

    // ─────── Cover Art Download Management ───────
    onArtUrlChanged: {
        if (dockMediaPlayer.artUrl.length == 0 || !blurArtEnabled) {
            dockMediaPlayer.artDominantColor = Appearance.m3colors.m3secondaryContainer
            return;
        }
        dockMediaPlayer.downloaded = false
        coverArtDownloader.running = true
    }

    // Also reset colors when blur is disabled
    onBlurArtEnabledChanged: {
        if (!blurArtEnabled) {
            dockMediaPlayer.artDominantColor = Appearance.m3colors.m3secondaryContainer
        } else if (dockMediaPlayer.artUrl.length > 0) {
            // Re-trigger color extraction when blur is re-enabled
            dockMediaPlayer.downloaded = false
            coverArtDownloader.running = true
        }
    }

    Process { // Cover art downloader
        id: coverArtDownloader
        property string targetFile: dockMediaPlayer.artUrl
        command: [ "bash", "-c", `[ -f ${artFilePath} ] || curl -sSL '${targetFile}' -o '${artFilePath}'` ]
        onExited: (exitCode, exitStatus) => {
            dockMediaPlayer.downloaded = true
        }
    }

    ColorQuantizer {
        id: colorQuantizer
        source:  Qt.resolvedUrl(artFilePath) 
        depth: 0 // 2^0 = 1 color
        rescaleSize: 1 // Rescale to 1x1 pixel for faster processing
    }

    property bool backgroundIsDark: artDominantColor.hslLightness < 0.5
    property QtObject blendedColors: QtObject {
        // Use default colors when blur/color generation is disabled
        property color colLayer0: blurArtEnabled ? 
            ColorUtils.mix(Appearance.colors.colLayer0, artDominantColor, (backgroundIsDark && Appearance.m3colors.darkmode) ? 0.6 : 0.5) :
            Appearance.colors.colLayer0
        property color colLayer1: blurArtEnabled ? 
            ColorUtils.mix(Appearance.colors.colLayer1, artDominantColor, 0.5) :
            Appearance.colors.colLayer1
        property color colOnLayer0: blurArtEnabled ? 
            ColorUtils.mix(Appearance.colors.colOnLayer0, artDominantColor, 0.5) :
            Appearance.colors.colOnLayer0
        property color colOnLayer1: blurArtEnabled ? 
            ColorUtils.mix(Appearance.colors.colOnLayer1, artDominantColor, 0.5) :
            Appearance.colors.colOnLayer1
        property color colSubtext: blurArtEnabled ? 
            ColorUtils.mix(Appearance.colors.colOnLayer1, artDominantColor, 0.5) :
            Appearance.colors.colOnLayer1
        property color colPrimary: blurArtEnabled ? 
            ColorUtils.mix(ColorUtils.adaptToAccent(Appearance.colors.colPrimary, artDominantColor), artDominantColor, 0.5) :
            Appearance.colors.colPrimary
        property color colPrimaryHover: blurArtEnabled ? 
            ColorUtils.mix(ColorUtils.adaptToAccent(Appearance.colors.colPrimaryHover, artDominantColor), artDominantColor, 0.3) :
            Appearance.colors.colPrimaryHover
        property color colPrimaryActive: blurArtEnabled ? 
            ColorUtils.mix(ColorUtils.adaptToAccent(Appearance.colors.colPrimaryActive, artDominantColor), artDominantColor, 0.3) :
            Appearance.colors.colPrimaryActive
        property color colSecondaryContainer: blurArtEnabled ? 
            ColorUtils.mix(Appearance.m3colors.m3secondaryContainer, artDominantColor, 0.15) :
            Appearance.m3colors.m3secondaryContainer
        property color colSecondaryContainerHover: blurArtEnabled ? 
            ColorUtils.mix(Appearance.colors.colSecondaryContainerHover, artDominantColor, 0.3) :
            Appearance.colors.colSecondaryContainerHover
        property color colSecondaryContainerActive: blurArtEnabled ? 
            ColorUtils.mix(Appearance.colors.colSecondaryContainerActive, artDominantColor, 0.5) :
            Appearance.colors.colSecondaryContainerActive
        property color colOnPrimary: blurArtEnabled ? 
            ColorUtils.mix(ColorUtils.adaptToAccent(Appearance.m3colors.m3onPrimary, artDominantColor), artDominantColor, 0.5) :
            Appearance.m3colors.m3onPrimary
        property color colOnSecondaryContainer: blurArtEnabled ? 
            ColorUtils.mix(Appearance.m3colors.m3onSecondaryContainer, artDominantColor, 0.5) :
            Appearance.m3colors.m3onSecondaryContainer
    }

    // ─────── Player Filtering Functions ───────
    function isRealPlayer(player) {
        return (
            !(hasPlasmaIntegration && player.dbusName.startsWith('org.mpris.MediaPlayer2.firefox')) &&
            !(hasPlasmaIntegration && player.dbusName.startsWith('org.mpris.MediaPlayer2.chromium')) &&
            !player.dbusName?.startsWith('org.mpris.MediaPlayer2.playerctld') &&
            !(player.dbusName?.endsWith('.mpd') && !player.dbusName.endsWith('MediaPlayer2.mpd'))
        );
    }
    function formatTimeSeconds(seconds) {
        if (!seconds || seconds < 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins + ":" + (secs < 10 ? "0" + secs : secs);
    }
    function filterDuplicatePlayers(players) {
        let filtered = [];
        let used = new Set();

        for (let i = 0; i < players.length; ++i) {
            if (used.has(i)) continue;
            let p1 = players[i];
            let group = [i];

            for (let j = i + 1; j < players.length; ++j) {
                let p2 = players[j];
                if (p1.trackTitle && p2.trackTitle &&
                    (p1.trackTitle.includes(p2.trackTitle) || p2.trackTitle.includes(p1.trackTitle))) {
                    group.push(j);
                }
            }

            let chosenIdx = group.find(idx => players[idx].trackArtUrl && players[idx].trackArtUrl.length > 0);
            if (chosenIdx === undefined) chosenIdx = group[0];

            filtered.push(players[chosenIdx]);
            group.forEach(idx => used.add(idx));
        }
        return filtered;
    }

    // ─────── Visualizer Process ───────
    Process {
        id: cavaProc
        running: showVisualizer && player && player.playbackState === MprisPlaybackState.Playing

        onRunningChanged: {
            if (!cavaProc.running) {
                dockMediaPlayer.visualizerPoints = [];
            }
        }

        command: [
            "cava",
            "-p",
            `${FileUtils.trimFileProtocol(Directories.config)}/quickshell/scripts/cava/raw_output_config.txt`
        ]

        stdout: SplitParser {
            onRead: data => {
                let points = data.split(";").map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
                dockMediaPlayer.visualizerPoints = points;
            }
        }
    }

    // ─────── Blurred Background Art ───────
    Image {
        id: blurredArt
        anchors.fill: parent
        anchors.margins: 15
        source: player && player.trackArtUrl && blurArtEnabled ? player.trackArtUrl : ""
        sourceSize.width: width
        sourceSize.height: height
        fillMode: Image.PreserveAspectCrop
        cache: false
        antialiasing: false
        asynchronous: true
        mipmap: true
        visible: source !== "" && blurArtEnabled

        layer.enabled: true
        layer.effect: MultiEffect {
            source: blurredArt
            saturation: 0.05
            blurEnabled: true
            blurMax: 50
            blur: 1
        }
        Behavior on opacity {
            NumberAnimation { duration: 300; easing.type: Easing.OutQuart }
        }
    }

    // ─────── Visualizer Overlay ───────
    WaveVisualizer {
        id: visualizerCanvas
        anchors.fill: parent
        anchors.margins: 3
        visible: showVisualizer && player && player.playbackState === MprisPlaybackState.Playing
        live: player?.isPlaying
        points: dockMediaPlayer.visualizerPoints
        maxVisualizerValue: dockMediaPlayer.maxVisualizerValue
        smoothing: dockMediaPlayer.visualizerSmoothing
        color: ColorUtils.transparentize(blendedColors.colPrimary, 0.6)
        // radius: Appearance.rounding.screenRounding
    }

    // ─────── Components ───────
    component DockMediaButton: RippleButton {
        implicitWidth: 25; implicitHeight: 25; buttonRadius: 11
        property string iconName: ""
        property bool isToggled: false
        
        colBackground: isToggled ? 
            ColorUtils.transparentize(blendedColors.colPrimary, 0.3) : 
            ColorUtils.transparentize(blendedColors.colSecondaryContainer, 0.7)
        colBackgroundHover: isToggled ? 
            blendedColors.colPrimaryHover : 
            blendedColors.colSecondaryContainerHover
        colRipple: isToggled ? 
            blendedColors.colSecondaryContainer : 
            blendedColors.colSecondaryContainerActive

        contentItem: MaterialSymbol {
            iconSize: Appearance.font.pixelSize.normal
            horizontalAlignment: Text.AlignHCenter
            color: !parent.isToggled ? 
                blendedColors.colOnSecondaryContainer : 
                blendedColors.colOnSecondaryContainer
            text: iconName
        }
    }

    Timer {
        running: player && player.playbackState === MprisPlaybackState.Playing
        interval: 1000; repeat: true
        onTriggered: if (player && typeof player.positionChanged === 'function') player.positionChanged()
    }

    // ─────── Player Selector Container ───────
    Rectangle {
        id: playerSelectorContainer
        visible: showPlayerSelector && meaningfulPlayers.length > 1
        anchors {
            right: parent.right
            verticalCenter: parent.verticalCenter
            rightMargin: 8
        }
        width: {
            if (meaningfulPlayers.length <= 2) return 24;
            if (meaningfulPlayers.length <= 4) return 48;
            if (meaningfulPlayers.length <= 6) return 72;
            return 96; // Max 4 columns
        }
        height: {
            if (meaningfulPlayers.length <= 2) return 44; // Stack vertically for 1-2 players
            if (meaningfulPlayers.length <= 4) return 44; // 2 rows for 3-4 players  
            return 66; // 3 rows for 5+ players
        }
        color: ColorUtils.transparentize(blendedColors.colSecondaryContainer, 0.8)
        radius: Appearance.rounding.small

        Grid {
            id: playerSelector
            anchors.centerIn: parent
            columns: {
                if (meaningfulPlayers.length <= 2) return 1; // Stack vertically first
                if (meaningfulPlayers.length <= 4) return 2; // Then 2 columns
                if (meaningfulPlayers.length <= 6) return 3; // Then 3 columns
                return 4; // Max 4 columns
            }
            spacing: 2

            Repeater {
                model: {
                    let tabs = [];
                    for (let i = 0; i < meaningfulPlayers.length; i++) {
                        let player = meaningfulPlayers[i];
                        let name = "Player " + (i + 1);
                        let icon = "music_note";
                        
                        if (player) {
                            // Get player display name
                            if (player.identity && player.identity.length > 0) {
                                name = player.identity;
                            } else if (player.dbusName) {
                                let dbusName = player.dbusName.replace('org.mpris.MediaPlayer2.', '');
                                name = dbusName.charAt(0).toUpperCase() + dbusName.slice(1);
                            }
                            
                            // Set icon based on player type
                            if (player.dbusName) {
                                if (player.dbusName.includes('spotify')) icon = "queue_music";
                                else if (player.dbusName.includes('firefox') || player.dbusName.includes('chromium')) icon = "web";
                                else if (player.dbusName.includes('vlc')) icon = "play_circle";
                                else if (player.dbusName.includes('mpv')) icon = "video_library";
                                else if (player.dbusName.includes('mpd')) icon = "library_music";
                            }
                        }
                        
                        tabs.push({"name": name, "icon": icon, "index": i});
                    }
                    return tabs;
                }

                delegate: RippleButton {
                    implicitWidth: 20
                    implicitHeight: 20
                    buttonRadius: 10
                    
                    property bool isSelected: modelData.index === selectedPlayerIndex
                    
                    colBackground: isSelected ? blendedColors.colPrimary : ColorUtils.transparentize(blendedColors.colSecondaryContainer, 0.6)
                    colBackgroundHover: isSelected ? blendedColors.colPrimaryHover : blendedColors.colSecondaryContainerHover
                    colRipple: isSelected ? blendedColors.colPrimaryActive : blendedColors.colSecondaryContainerActive

                    onClicked: selectedPlayerIndex = modelData.index

                    // Tooltip for player name
                    ToolTip.visible: hovered
                    ToolTip.text: modelData.name
                    ToolTip.delay: 500

                    contentItem: MaterialSymbol {
                        text: modelData.icon
                        iconSize: Appearance.font.pixelSize.smaller
                        horizontalAlignment: Text.AlignHCenter
                        color: parent.isSelected ? blendedColors.colOnPrimary : blendedColors.colOnSecondaryContainer
                    }
                }
            }
        }
    }

    // ─────── Seekbar ───────
    Rectangle {
        id: seekbarBackground
        anchors {
            left: parent.left
            right: parent.right
            bottom: parent.bottom
            leftMargin: 4
            rightMargin: 4
            bottomMargin: -4
        }
        height: 3
        color: ColorUtils.transparentize(blendedColors.colSecondaryContainer, 0.3)
        radius: Appearance.rounding.small

        Rectangle {
            id: progressBar
            anchors.left: parent.left
            anchors.bottom: parent.bottom
            width: parent.width * progressRatio
            height: parent.height
            color: blendedColors.colPrimary
            radius: parent.radius
            Behavior on width { 
                NumberAnimation { 
                    duration: seekArea.pressed ? 0 : 300
                    easing.type: Easing.OutQuart 
                } 
            }
        }

        // Seek handle (visible on hover)
        Rectangle {
            id: seekHandle
            anchors.verticalCenter: parent.verticalCenter
            x: Math.max(width/2, Math.min(parent.width - width/2, (parent.width * progressRatio) - width/2))
            width: seekArea.pressed ?  3 : 5
            height: parent.height
            radius: 2
            color: blendedColors.colLayer1
            opacity: seekArea.containsMouse || seekArea.pressed ? 1 : 0
            Behavior on width { NumberAnimation { duration: 150; easing.type: Easing.OutQuart } }
            Behavior on opacity { NumberAnimation { duration: 150; easing.type: Easing.OutQuart } }
        }

        MouseArea {
            id: seekArea
            anchors.fill: parent
            anchors.margins: -2 // Expand clickable area
            hoverEnabled: true
            enabled: player && player.canSeek && player.length > 0

            property bool isDragging: false

            onPressed: {
                isDragging = true;
                seekToPosition(mouse.x);
            }

            onPositionChanged: {
                if (isDragging) {
                    seekToPosition(mouse.x);
                }
            }

            onReleased: {
                isDragging = false;
            }

            function seekToPosition(x) {
                if (!player || !player.canSeek || !player.length) return;
                
                let ratio = Math.max(0, Math.min(1, x / width));
                let newPosition = ratio * player.length;
                
                try {
                    player.position = newPosition;
                } catch (e) {
                    console.log("Failed to seek:", e);
                }
            }
        }

        // Hover effect for background
        Behavior on height {
            NumberAnimation { duration: 150; easing.type: Easing.OutQuart }
        }
    }
    Loader {
        active: PersistentStates.dock.lyrics
        asynchronous: true
        sourceComponent: DockLyrics {}
        anchors.bottom: parent.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.bottomMargin: parent.height / 1.8
    }

  
RowLayout {
    id: contentRow

    anchors {
        left: parent.left
        right: playerSelectorContainer.visible ? playerSelectorContainer.left : parent.right
        top: parent.top
        bottom: seekbarBackground.top
        leftMargin: 8
        rightMargin: playerSelectorContainer.visible ? 5 : 8
        bottomMargin: 5
    }

    spacing: 8

    Rectangle {
        id: coverArtContainer
        Layout.preferredWidth: 40
        Layout.preferredHeight: 40
        antialiasing: true
        radius: Appearance.rounding.normal
        color: blendedColors.colSecondaryContainer
        clip: true

        StyledText {
            opacity: coverHovered.containsMouse ? 0.9 : 0
            anchors.centerIn: parent
            text: {
                if (!player || !player.length || player.length <= 0) return "0:00"
                let totalSeconds = player.length > 1000000 ? player.length / 1000000 : player.length
                let currentSeconds = player.position || (progressRatio * totalSeconds)
                let remaining = totalSeconds - currentSeconds
                return remaining > 0 ? "-" + formatTimeSeconds(remaining) : "0:00"
            }
            color: blendedColors.colOnSecondaryContainer
            font.pixelSize: Appearance.font.pixelSize.smallest + 1
            font.weight: Font.Medium
            horizontalAlignment: Text.AlignHCenter

            Behavior on opacity {
                NumberAnimation {
                    duration: 400
                    easing.type: Easing.InOutQuad
                }
            }
        }
        Loader {
            id: coverImageLoader
            anchors.fill: parent
            active: true
            sourceComponent: useVinylFallback ? vinylComponent : artComponent
        }
        MouseArea {
        id: coverHovered
        acceptedButtons: Qt.MiddleButton | Qt.BackButton | Qt.ForwardButton | Qt.RightButton | Qt.LeftButton
        anchors.fill: parent
        hoverEnabled: true
            onPressed: (event) => {
               if (event.button === Qt.MiddleButton) {
                   blurArtEnabled = !blurArtEnabled ;
                   PersistentStateManager.setState("dock.useBlur", blurArtEnabled)
               } else if (event.button === Qt.RightButton) {
                   activePlayer.next();
               } else if (event.button === Qt.LeftButton) {
                useVinylFallback = !useVinylFallback ;
                PersistentStateManager.setState("dock.useVinyl", useVinylFallback);
            }
    }}
    }

    Component {
        id: artComponent
        Image {
            anchors.fill: parent
            opacity: !coverHovered.containsMouse ? 0.9 : 0
            source: player && player.trackArtUrl ? player.trackArtUrl : ""
            asynchronous: true
            cache: false
            mipmap: true
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

            Behavior on opacity {
                NumberAnimation {
                    duration: 300
                    easing.type: Easing.InOutQuad
                }
            }
        }
    }
Component {
    id: vinylComponent
    Item {
        anchors.fill: parent
        opacity: !coverHovered.containsMouse ? 0.9 : 0
        visible: opacity > 0.05

        // transform: Rotation {      // High CPU OverHead
        //     id: vinylRotation
        // }

        // RotationAnimator on rotation {
        //     from: 0
        //     to: 360
        //     duration: 8000 
        //     loops: Animation.Infinite
        //     running: parent.visible && !coverHovered.containsMouse
        // }

        MaterialSymbol {
            anchors.centerIn: parent
            text: "graphic_eq"
            iconSize: Appearance.font.pixelSize.huge
            color: blendedColors.colOnSecondaryContainer
        }
    }
}

        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 1
            
            StyledText {
                Layout.maximumWidth: 220  // Increased to accommodate new buttons
                Layout.fillWidth: false
                Layout.minimumWidth: 1
                font.pixelSize: Appearance.font.pixelSize.small
                font.weight: Font.Medium
                elide: Text.ElideRight
                color: blendedColors.colOnLayer0
                text: player && player.trackTitle
                      ? StringUtils.cleanMusicTitle(player.trackTitle)
                      : "No Media Playing"
            }

            StyledText {
                Layout.fillWidth: true
                Layout.minimumWidth: 1
                font.pixelSize: Appearance.font.pixelSize.smaller
                elide: Text.ElideRight
                color: blendedColors.colSubtext
                Behavior on color { ColorAnimation { duration: 250; easing.type: Easing.OutQuad } }
                text: player && player.trackArtist
                      ? player.trackArtist
                      : meaningfulPlayers.length > 0 ? "Select a media player" : "No players available"
            }
        }
       
        RowLayout {
            id:mediaControls
            Layout.rightMargin: 10
            spacing: 3
             DockMediaButton {
                iconName: "download"
                enabled: true 
                opacity:  1
                onClicked: YTMusic.downloadSong(player.trackTitle)
                
            }
            DockMediaButton {
                iconName: "shuffle"
                enabled: !!player && player.canControl
                opacity: player ? 1 : 0.5
                isToggled: player ? player.shuffle : false
                onClicked: {
                    if (player && player.canControl) {
                        try {
                            player.shuffle = !player.shuffle;
                        } catch (e) {
                            console.log("Failed to set shuffle:", e);
                        }
                    }
                }
                
                // Tooltip
                ToolTip.visible: hovered
                ToolTip.text: "Shuffle " + (isToggled ? "On" : "Off")
                ToolTip.delay: 500
            }

            DockMediaButton {
                iconName: "skip_previous"
                enabled: !!player && player.canGoPrevious
                opacity: player && player.canGoPrevious ? 1 : 0.5
                onClicked: {
                    if (player && player.canGoPrevious) {
                        player.previous();
                    }
                }
            }

            RippleButton {
                implicitWidth: player && player.playbackState === MprisPlaybackState.Playing ?  100 : 32
                implicitHeight: 32
                buttonRadius: hovered ? 15 : 10
                Layout.rightMargin: 6
                Layout.leftMargin: 6
                enabled: true
                opacity: player && player.canPause ? 1 : 0.5

                colBackground: player && player.playbackState === MprisPlaybackState.Playing
                            ? blendedColors.colPrimary
                            : blendedColors.colSecondaryContainer
                colBackgroundHover: player && player.playbackState === MprisPlaybackState.Playing
                                   ? blendedColors.colPrimaryHover
                                   : blendedColors.colSecondaryContainerHover
                colRipple: player && player.playbackState === MprisPlaybackState.Playing
                           ? blendedColors.colPrimaryActive
                           : blendedColors.colSecondaryContainerActive

                onClicked: {
                    if (player && player.canPause) {
                        player.togglePlaying();
                    } else  {
                        Hyprland.dispatch(`exec elisa`)
                    }
                }
                Behavior on buttonRadius { animation: Appearance.animation.elementMove.numberAnimation.createObject(this) }
                Behavior on implicitWidth { animation: Appearance.animation.elementMove.numberAnimation.createObject(this) }

                contentItem: MaterialSymbol {
                    iconSize: Appearance.font.pixelSize.normal
                    fill: 1
                    horizontalAlignment: Text.AlignHCenter
                    color: player && player.playbackState === MprisPlaybackState.Playing
                           ? blendedColors.colOnPrimary
                           : blendedColors.colOnSecondaryContainer
                    text: player && player.playbackState === MprisPlaybackState.Playing
                          ? "pause" : "play_arrow"
                }
            }
            DockMediaButton {
                iconName: "skip_next"
                enabled: !!player && player.canGoNext
                opacity: player && player.canGoNext ? 1 : 0.5
                onClicked: {
                    if (player && player.canGoNext) {
                        player.next();
                    }
                }
            }
             DockMediaButton {
                id:lyrics
                enabled: !!player && player.canControl
                isToggled: PersistentStates.dock.lyrics
                iconName: lyrics.isToggled ? "lyrics" : "subtitles_off"
                opacity: lyrics.isToggled ? 1 : 0.5
               property bool showLyrics: PersistentStates.dock.lyrics

                onClicked: {
                    showLyrics = !showLyrics;
                    PersistentStateManager.setState("dock.lyrics", showLyrics);
                }

            }
            DockMediaButton {
                iconName: {
                    if (!player || !player.loopState) return "repeat";
                    switch (player.loopState) {
                        case MprisLoopState.None: return "repeat";
                        case MprisLoopState.Track: return "repeat_one";
                        case MprisLoopState.Playlist: return "repeat";
                        default: return "repeat";
                    }
                }
                enabled: !!player && player.canControl
                opacity: player ? 1 : 0.5
                isToggled: player ? (player.loopState !== MprisLoopState.None) : false
                onClicked: {
                    if (player && player.canControl) {
                        try {
                            // Cycle through loop states: None -> Playlist -> Track -> None
                            let currentState = player.loopState || MprisLoopState.None;
                            let nextState;
                            switch (currentState) {
                                case MprisLoopState.None:
                                    nextState = MprisLoopState.Playlist;
                                    break;
                                case MprisLoopState.Playlist:
                                    nextState = MprisLoopState.Track;
                                    break;
                                case MprisLoopState.Track:
                                    nextState = MprisLoopState.None;
                                    break;
                                default:
                                    nextState = MprisLoopState.Playlist;
                            }
                            player.loopState = nextState;
                        } catch (e) {
                            console.log("Failed to set loop state:", e);
                        }
                    }
                }

                // Tooltip
                ToolTip.visible: hovered
                ToolTip.text: {
                    if (!player || !player.loopState) return "Repeat Off";
                    switch (player.loopState) {
                        case MprisLoopState.None: return "Repeat Off";
                        case MprisLoopState.Track: return "Repeat Track";
                        case MprisLoopState.Playlist: return "Repeat Playlist";
                        default: return "Repeat Off";
                    }
                }
                ToolTip.delay: 500
            }
        }
    }
    Behavior on implicitWidth { NumberAnimation { duration: 200; easing.type: Easing.OutQuart } }
}