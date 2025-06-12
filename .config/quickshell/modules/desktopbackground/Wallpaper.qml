import Qt.labs.folderlistmodel
import Qt5Compat.GraphicalEffects
import QtNetwork
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Services.Mpris
import QtMultimedia
import Quickshell.Services.UPower
import Quickshell.Wayland
import Quickshell.Widgets
import QtQuick.Effects
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "root:/modules/common/functions/file_utils.js" as FileUtils

Scope {
    id: wallpaperScope
    property bool verticalBar : PersistentStates.bar.verticalMode 
    property string wallpaperPath: Directories.pictures
        property int widgetHeight: 220;
            property string wallpaperSelector: FileUtils.trimFileProtocol(Directories.config + "/quickshell/scripts/switchwall.sh")
            property bool isOpen: false
                // Bind local state to global state
                onIsOpenChanged: {
                    GlobalStates.wallpaperSelectorOpen = isOpen
                }

                PanelWindow {
                    id: wallpaperRoot
                    visible: wallpaperScope.isOpen

                    function hide()
                    {
                        wallpaperScope.isOpen = false;
                    }

                    exclusiveZone: verticalBar ? -1 : 0
                    implicitHeight: widgetHeight
                    implicitWidth:QuickShell.screen.width
                    WlrLayershell.namespace: "quickshell:wallpaperSelector"
                    color: "transparent"
                    anchors {
                        top: true
                        right: true
                        left: true
                    }
                    margins.top:verticalBar ? 0 : Appearance.sizes.floatingMargin



                    Loader {
                        id: wallpaperContentLoader
                        active: true
                        visible: GlobalStates.wallpaperSelectorOpen
                        width: wallpaperRoot.width
                        height: wallpaperRoot.height

                        sourceComponent: Item {
                            id: wallpaperContent
                            property alias wallpaperPanel: wallpaperPanel
                                implicitHeight: wallpaperRoot.height
                                implicitWidth: wallpaperRoot.width

                                RectangularShadow {
                                    anchors.fill: wallpaperRoot
                                    blur: 1.2 * Appearance.sizes.elevationMargin
                                    spread: 1
                                    color: Appearance.colors.colShadow
                                }
                                ColumnLayout {
                                    id:widgetContent
                                    Layout.fillWidth:true
                                    Layout.fillHeight:true
                                    spacing:0
                                    Rectangle {
                                        id: wallpaperPanel
                                        width: Screen.width
                                        anchors.top: parent.top
                                        topRightRadius:Appearance.rounding.screenRounding
                                        topLeftRadius:Appearance.rounding.screenRounding
                                        color: Appearance.colors.colLayer0
                                        implicitHeight: wallpaperRoot.height - cornerBox.height

                                        // Auto-scroll configuration
                                        readonly property int scrollItemCount: 5
                                            readonly property int itemWidth: 260
                                                readonly property int itemSpacing: 8
                                                    readonly property int scrollAmount: (itemWidth + itemSpacing) * scrollItemCount


                                                        Timer {
                                                            id: resumeScrollTimer
                                                            interval: 1000
                                                            repeat: true
                                                            onTriggered: autoScrollTimer.restart()
                                                        }

                                                        Timer {
                                                            id: autoScrollTimer
                                                            interval: 1000
                                                            running: false
                                                            repeat: true
                                                            onTriggered: {
                                                                if (wallpaperList.contentX >= wallpaperList.contentWidth - wallpaperList.width)
                                                                {
                                                                    wallpaperList.contentX = 0
                                                                } else {
                                                                scrollAnimation.to = wallpaperList.contentX + wallpaperPanel.scrollAmount
                                                                scrollAnimation.start()
                                                            }
                                                        }
                                                    }

                                                    Rectangle {
                                                        id: secondaryContainer
                                                        anchors {
                                                            fill: wallpaperPanel
                                                            centerIn: wallpaperPanel
                                                            margins: 10
                                                        }
                                                        height: wallpaperPanel.height + 10
                                                        color: Appearance.colors.colLayer2
                                                        radius: Appearance.rounding.normal
                                                    }

                                                    Rectangle {
                                                        id: errorDialog

                                                        function show(message)
                                                        {
                                                            errorText.text = message;
                                                            visible = true;
                                                        }

                                                        anchors.centerIn: parent
                                                        width: 300
                                                        height: wallpaperPanel.height * 0.75
                                                        color: Appearance.colors.colLayer1
                                                        border.color: Appearance.colors.colOutline
                                                        border.width: 1
                                                        radius: Appearance.rounding.small
                                                        visible: false
                                                        z: 100

                                                        ColumnLayout {
                                                            anchors.fill: parent
                                                            anchors.margins: 10

                                                            Text {
                                                                id: errorText
                                                                Layout.fillWidth: true
                                                                color: Appearance.colors.colOnLayer1
                                                                wrapMode: Text.Wrap
                                                            }

                                                            Button {
                                                                text: "OK"
                                                                Layout.alignment: Qt.AlignHCenter
                                                                onClicked: errorDialog.visible = false, GlobalStates.wallpaperSelectorOpen = false
                                                            }
                                                        }
                                                    }

                                                    FolderListModel {
                                                        id: folderModel
                                                        folder: Directories.pictures + "/Wallpapers"
                                                        nameFilters: ["*.png", "*.jpg", "*.mp4", "*.mkv", "*.jpeg", "*.svg", "*.webp"]
                                                        showDirs: false
                                                        showFiles: true
                                                        sortField: FolderListModel.Unsorted

                                                        property var randomIndices: []

                                                        onCountChanged: {
                                                            if (count > 0)
                                                            {
                                                                randomIndices = Array.from({length: count}, (_, i) => i);
                                                                for (let i = randomIndices.length - 1; i > 0; i--) {
                                                                    const j = Math.floor(Math.random() * (i + 1));
                                                                    [randomIndices[i], randomIndices[j]] = [randomIndices[j], randomIndices[i]];
                                                                }
                                                            }
                                                        }
                                                    }

                                                    QtObject {
                                                        id: runner
                                                        function runMatugen(path)
                                                        {
                                                            asynchronous:true
                                                            try {
                                                                // var command = `exec matugen ${path}`
                                                                const command = `exec bash -c "${wallpaperSelector} ${path} &"`
                                                                Hyprland.dispatch(command)
                                                                Hyprland.dispatch('global quickshell:wallpaperSelectorClose')

                                                            } catch (error) {
                                                            console.error("Failed to run matugen:", error);
                                                            errorDialog.show("Failed to apply wallpaper: " + error);
                                                        }
                                                    }
                                                }

                                                ListView {
                                                    id: wallpaperList
                                                    model: folderModel.count > 0 ? folderModel.count : 0
                                                    orientation: ListView.Horizontal
                                                    anchors {
                                                        fill: secondaryContainer
                                                        margins: 10
                                                    }

                                                    // Visual properties
                                                    spacing: wallpaperPanel.itemSpacing
                                                    clip: true
                                                    cacheBuffer: width * 2
                                                    reuseItems: true

                                                    // Smooth scrolling configuration
                                                    highlightRangeMode: ListView.StrictlyEnforceRange
                                                    preferredHighlightBegin: 0
                                                    preferredHighlightEnd: width

                                                    // Smooth scrolling animation
                                                    NumberAnimation {
                                                        id: scrollAnimation
                                                        target: wallpaperList
                                                        property: "contentX"
                                                        duration: 1500
                                                        easing {
                                                            type: Easing.InOutQuad
                                                            amplitude: 1.0
                                                            period: 0.5
                                                        }
                                                    }

                                                    // Smooth reset animation
                                                    Behavior on contentX {
                                                    NumberAnimation {
                                                        duration: 1500
                                                        easing.type: Easing.InOutQuad
                                                    }
                                                }

                                                // User interaction handlers
                                                onMovementStarted: {
                                                    resumeScrollTimer.stop()
                                                    autoScrollTimer.stop()
                                                }

                                                onMovementEnded: {
                                                    if (wallpaperScope.isOpen)
                                                    {
                                                        resumeScrollTimer.restart()
                                                    }
                                                }

                                                delegate: Item {
                                                    width: wallpaperPanel.itemWidth
                                                    height: 155

                                                    Loader {
                                                        id: loader
                                                        anchors.fill: parent

                                                        property string fileUrl: folderModel.get(folderModel.randomIndices[index], "fileUrl").toString()
                                                        sourceComponent: {
                                                            const url = loader.fileUrl.toLowerCase()
                                                            return (url.endsWith(".mp4") || url.endsWith(".mkv") || url.endsWith(".webm"))
                                                            ? videoPreview
                                                            : imagePreview
                                                        }
                                                        Component {
                                                            id: imagePreview
                                                            Image {
                                                                id: imageObject
                                                                anchors.fill: parent
                                                                fillMode: Image.PreserveAspectCrop
                                                                source: loader.fileUrl
                                                                asynchronous: true
                                                                cache: false
                                                                mipmap: true
                                                                sourceSize {
                                                                    width: wallpaperPanel.itemWidth
                                                                    height: wallpaperPanel.height * 0.9
                                                                }
                                                                layer.enabled: true
                                                                layer.effect: OpacityMask {
                                                                    maskSource: Rectangle {
                                                                        width: imageObject.width
                                                                        height: imageObject.height
                                                                        radius: Appearance.rounding.small
                                                                    }
                                                                }
                                                            }
                                                        }

                                                        Component {
                                                            id: videoPreview
                                                            Video {
                                                                id: videoObject
                                                                anchors.fill: parent
                                                                source: loader.fileUrl
                                                                autoPlay: true
                                                                loops: MediaPlayer.Infinite
                                                                muted: true
                                                                fillMode: VideoOutput.PreserveAspectCrop
                                                                layer.enabled: true
                                                                layer.effect: OpacityMask {
                                                                    maskSource: Rectangle {
                                                                        width: videoObject.width
                                                                        height: videoObject.height
                                                                        radius: Appearance.rounding.small
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }

                                                    MouseArea {
                                                        anchors.fill: parent
                                                        hoverEnabled: true
                                                        onClicked: {
                                                            var path = folderModel.get(folderModel.randomIndices[index], "fileUrl")
                                                            .toString()
                                                            .replace("file://", "")
                                                            runner.runMatugen(path)
                                                        }

                                                        Rectangle {
                                                            anchors.fill: parent
                                                            radius: Appearance.rounding.small
                                                            color: parent.containsMouse ? Appearance.colors.colLayer0 : "transparent"
                                                            opacity: parent.containsMouse ? 0.3 : 0
                                                            border {
                                                                color: parent.containsMouse ? Appearance.colors.colSecondaryActive : "transparent"
                                                                width: parent.containsMouse ? 1 : 0
                                                            }
                                                            visible: parent.containsMouse
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        RowLayout {
                                            id:cornerBox
                                            Layout.fillHeight:true
                                            Layout.fillWidth:true

                                            RoundCorner {
                                                size: Appearance.rounding.screenRounding
                                                corner: cornerEnum.topLeft
                                                color: Appearance.colors.colLayer0

                                                anchors {
                                                    top: wallpaperPanel.bottom
                                                    left:wallpaperPanel.left
                                                }

                                            }
                                            Item { Layout.fillWidth:true}
                                            RoundCorner {
                                                size: Appearance.rounding.screenRounding
                                                corner: cornerEnum.topRight
                                                color: Appearance.colors.colLayer0

                                                anchors {
                                                    top: wallpaperPanel.bottom
                                                    right:wallpaperPanel.right
                                                }

                                            }
                                        }
                                    }
                                }

                            }
                        }

                        IpcHandler {
                            target: "wallpaperSelector"

                            function toggle(): void
                            {
                                wallpaperScope.isOpen = !wallpaperScope.isOpen;
                            }

                            function close(): void
                            {
                                wallpaperScope.isOpen = false;
                            }

                            function open(): void
                            {
                                wallpaperScope.isOpen = true;
                            }
                        }

                        GlobalShortcut {
                            name: "wallpaperSelectorToggle"
                            description: qsTr("Toggles wallpaper selector on press")

                            onPressed: {
                                wallpaperScope.isOpen = !wallpaperScope.isOpen;
                            }
                        }

                        GlobalShortcut {
                            name: "wallpaperSelectorOpen"
                            description: qsTr("Opens wallpaper selector on press")

                            onPressed: {
                                wallpaperScope.isOpen = true;
                            }
                        }

                        GlobalShortcut {
                            name: "wallpaperSelectorClose"
                            description: qsTr("Closes wallpaper selector on press")

                            onPressed: {
                                wallpaperScope.isOpen = false;
                            }
                        }
                    }
