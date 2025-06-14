import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "root:/modules/common/functions/string_utils.js" as StringUtils
import "root:/modules/common/functions/file_utils.js" as FileUtils
import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Layouts
import QtQuick.Controls
import Quickshell
import Quickshell.Io
import Quickshell.Services.Mpris
import Quickshell.Widgets
import Quickshell.Wayland
import Quickshell.Hyprland

Scope {
    id: root

    property bool hovered: false
    property bool visible: false
    property int selectedPlayerIndex: 0
    readonly property MprisPlayer activePlayer: MprisController.activePlayer
    readonly property var realPlayers: Mpris.players.values.filter(player => isRealPlayer(player))
    readonly property var meaningfulPlayers: filterDuplicatePlayers(realPlayers)
    readonly property MprisPlayer currentPlayer: meaningfulPlayers.length > 0 ? meaningfulPlayers[selectedPlayerIndex] : null

    readonly property real osdWidth: Appearance.sizes.osdWidth
    readonly property real widgetWidth: Appearance.sizes.mediaControlsWidth
    readonly property real widgetHeight: Appearance.sizes.mediaControlsHeight

    property real contentPadding: 13
    property real popupRounding: Appearance.rounding.screenRounding - Appearance.sizes.elevationMargin + 1
    property real artRounding: Appearance.rounding.verysmall
    property list<real> visualizerPoints: []

    property bool hasPlasmaIntegration: false

    // Reset selection when players change
    onMeaningfulPlayersChanged: {
        if (selectedPlayerIndex >= meaningfulPlayers.length) {
            selectedPlayerIndex = 0;
        }
    }

    function isRealPlayer(player) {
        return (
            !(hasPlasmaIntegration && player.dbusName.startsWith('org.mpris.MediaPlayer2.firefox')) &&
            !(hasPlasmaIntegration && player.dbusName.startsWith('org.mpris.MediaPlayer2.chromium')) &&
            !player.dbusName?.startsWith('org.mpris.MediaPlayer2.playerctld') &&
            !(player.dbusName?.endsWith('.mpd') && !player.dbusName.endsWith('MediaPlayer2.mpd'))
        );
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

    Process {
        id: cavaProc
        running: mediaControlsLoader.active

        onRunningChanged: {
            if (!cavaProc.running) {
                root.visualizerPoints = [];
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
                root.visualizerPoints = points;
            }
        }
    }
    
    Variants {
        model: Quickshell.screens 

        PanelWindow {
            property ShellScreen modelData
            screen: modelData
            id: hoverPanel
            anchors {
                left: true
                right: true
                top: true
            }
            implicitWidth: 500
            implicitHeight: 1
            color: "transparent"
            exclusiveZone: -1
        
           MouseArea {
               id: hoverArea
               anchors.fill: parent
               hoverEnabled: true
               onEntered: root.hovered = !root.hovered
            }           
        }
    }
    
    Loader {
        id: mediaControlsLoader
        active: root.hovered 

        sourceComponent: PanelWindow {
            id: mediaControlsRoot
            exclusiveZone: -1
            implicitWidth: mediaControlsRoot.screen.width
            implicitHeight: mainLayout.implicitHeight + 30
            color: "transparent"
            WlrLayershell.namespace: "quickshell:mediaControls"

            anchors {
                top: true
                left: true
                right: true
                bottom: true
            }
            
            MouseArea {
                anchors.fill: parent
                onClicked: Hyprland.dispatch('global quickshell:mediaControlsClose')
            } 
            
            Rectangle {
                implicitWidth: mainLayout.implicitWidth
                implicitHeight: mainLayout.implicitHeight
                anchors.horizontalCenter: parent.horizontalCenter
                color: Appearance.colors.colLayer0
                bottomRightRadius: Appearance.rounding.screenRounding
                bottomLeftRadius: Appearance.rounding.screenRounding

                StyledRectangularShadow {
                    target: parent
                }
                
                RoundCorner {
                    size: Appearance.rounding.screenRounding
                    corner: cornerEnum.topLeft
                    color: Appearance.colors.colLayer0
                    anchors {
                        top: parent.top
                        topMargin: Appearance.sizes.frameThickness
                        left: parent.right
                    }
                }

                RoundCorner {
                    size: Appearance.rounding.screenRounding
                    corner: cornerEnum.topRight
                    color: Appearance.colors.colLayer0
                    anchors {
                        top: parent.top
                        topMargin: Appearance.sizes.frameThickness
                        right: parent.left
                    }
                }

                ColumnLayout {
                    id: mainLayout
                    anchors.horizontalCenter: parent.horizontalCenter
                    spacing: root.contentPadding

                    // Player Selector using TabBar
                    TabBar {
                        visible: root.meaningfulPlayers.length > 1
                        Layout.fillWidth: true
                        Layout.alignment:Qt.AlignVCenter 
                        Layout.topMargin:10
                        Layout.bottomMargin:-10
                        Layout.rightMargin: 30
                        Layout.leftMargin: 30
                        currentIndex: root.selectedPlayerIndex
                        onCurrentIndexChanged: root.selectedPlayerIndex = currentIndex
                        
                        Repeater {
                            model: {
                                let tabs = [];
                                for (let i = 0; i < root.meaningfulPlayers.length; i++) {
                                    let player = root.meaningfulPlayers[i];
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
                                    
                                    tabs.push({"name": name, "icon": icon});
                                }
                                return tabs;
                            }
                            
                            delegate: SecondaryTabButton {
                                selected: (index == root.selectedPlayerIndex)
                                buttonText: modelData.name
                                buttonIcon: modelData.icon
                            }
                        }
                        
                        background: Item {
                            WheelHandler {
                                onWheel: (event) => {
                                    if (event.angleDelta.y < 0)
                                        parent.currentIndex = Math.min(parent.currentIndex + 1, root.meaningfulPlayers.length - 1);
                                    else if (event.angleDelta.y > 0)
                                        parent.currentIndex = Math.max(parent.currentIndex - 1, 0);
                                }
                                acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
                            }
                        }
                    }

                    // Single Player Control
                    PlayerControl {
                        visible: root.currentPlayer !== null
                        player: root.currentPlayer
                        visualizerPoints: root.visualizerPoints
                        Layout.alignment: Qt.AlignHCenter
                    }
                    
                    // No players message
                    Text {
                        visible: root.meaningfulPlayers.length === 0
                        Layout.alignment: Qt.AlignHCenter
                        text: qsTr("No media players found")
                        color: Appearance.colors.colTextMuted
                        font.pixelSize: 14
                    }
                }
            }
        }
    }

    IpcHandler {
        target: "mediaControls"

        function toggle(): void {
            root.hovered = !root.hovered;
            if (root.hovered) Notifications.timeoutAll();
        }

        function close(): void {
            root.hovered = false;
        }

        function open(): void {
            root.hovered = true;
            Notifications.timeoutAll();
        }
        
        function nextPlayer(): void {
            if (root.meaningfulPlayers.length > 1) {
                root.selectedPlayerIndex = (root.selectedPlayerIndex + 1) % root.meaningfulPlayers.length;
            }
        }
        
        function previousPlayer(): void {
            if (root.meaningfulPlayers.length > 1) {
                root.selectedPlayerIndex = root.selectedPlayerIndex === 0 ? 
                                         root.meaningfulPlayers.length - 1 : 
                                         root.selectedPlayerIndex - 1;
            }
        }
    }

    GlobalShortcut {
        name: "mediaControlsToggle"
        description: qsTr("Toggles media controls on press")

        onPressed: {
            if (!root.hovered && Mpris.players.values.filter(player => isRealPlayer(player)).length === 0) {
                return;
            }
            root.hovered = !root.hovered;
            if (root.hovered) Notifications.timeoutAll();
        }
    }

    GlobalShortcut {
        name: "mediaControlsOpen"
        description: qsTr("Opens media controls on press")

        onPressed: {
            root.hovered = true;
            Notifications.timeoutAll();
        }
    }

    GlobalShortcut {
        name: "mediaControlsClose"
        description: qsTr("Closes media controls on press")

        onPressed: {
            root.hovered = false;
        }
    }
    
    GlobalShortcut {
        name: "mediaControlsNextPlayer"
        description: qsTr("Switch to next media player")

        onPressed: {
            if (root.meaningfulPlayers.length > 1) {
                root.selectedPlayerIndex = (root.selectedPlayerIndex + 1) % root.meaningfulPlayers.length;
            }
        }
    }
    
    GlobalShortcut {
        name: "mediaControlsPreviousPlayer"
        description: qsTr("Switch to previous media player")

        onPressed: {
            if (root.meaningfulPlayers.length > 1) {
                root.selectedPlayerIndex = root.selectedPlayerIndex === 0 ? 
                                         root.meaningfulPlayers.length - 1 : 
                                         root.selectedPlayerIndex - 1;
            }
        }
    }
}