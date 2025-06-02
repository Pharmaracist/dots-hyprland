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
    property string wallpaperPath: Directories.pictures
    property string wallpaperSelector : FileUtils.trimFileProtocol(Directories.config + "/quickshell/scripts/switchwall.sh")
    property bool isOpen: false  

    // Bind local state to global state
    onIsOpenChanged: {
        GlobalStates.wallpaperSelectorOpen = isOpen
    }

    PanelWindow {
        id: wallpaperRoot
        visible: wallpaperScope.isOpen

        function hide() {
            wallpaperScope.isOpen = false;
        }

        exclusiveZone: 0
        implicitHeight: 200
        WlrLayershell.namespace: "quickshell:wallpaperSelector"
        color: "transparent"

        anchors {
            top: true
            bottom: false
            right: true
            left: true
        }

        margins {
            left: Appearance.sizes.floatingMargin   
            top: Appearance.sizes.floatingMargin
            right: Appearance.sizes.floatingMargin
            bottom: Appearance.sizes.floatingMargin
        }

        HyprlandFocusGrab {
            id: wallpaperFocusGrab
            windows: [wallpaperRoot]
            active: GlobalStates.wallpaperSelectorOpen
            onCleared: () => {
                if (!active)
                    wallpaperRoot.hide();
            }
        }

        Loader {
            id: wallpaperContentLoader
            active: true
            visible: GlobalStates.wallpaperSelectorOpen
            anchors.centerIn: parent
            width: wallpaperRoot.width
            height: wallpaperRoot.height
            
            sourceComponent: Item {
                id: wallpaperContent
                property alias wallpaperPanel: wallpaperPanel
                implicitHeight: wallpaperRoot.height
                implicitWidth: wallpaperRoot.width

                RectangularShadow {
                    anchors.fill: wallpaperRoot
                    radius: wallpaperRoot.radius
                    blur: 1.2 * Appearance.sizes.elevationMargin
                    spread: 1
                    color: Appearance.colors.colShadow
                }

                Rectangle {
                    id: wallpaperPanel
                    width: Screen.width
                    anchors.top: parent.top
                    color: Appearance.colors.colLayer0
                    border {
                        color: ConfigOptions.appearance.borderless ? "transparent" : Appearance.colors.colOutline 
                        width: ConfigOptions.appearance.borderless ? 0 : 1
                    }
                    radius: Appearance.rounding.normal
                    implicitHeight: wallpaperRoot.height

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
                        running: true
                        repeat: true
                        onTriggered: {
                            if (wallpaperList.contentX >= wallpaperList.contentWidth - wallpaperList.width) {
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

                        function show(message) {
                            errorText.text = message;
                            visible = true;
                        }

                        anchors.centerIn: parent
                        width: 300
                        height: 150
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
                        nameFilters: ["*.png", "*.jpg", "*.jpeg","*.svg", "*.webp"]
                        showDirs: false
                        showFiles: true
                        sortField: FolderListModel.Unsorted

                        property var randomIndices: []

                        onCountChanged: {
                            if (count > 0) {
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
                        function runMatugen(path) {
                            asynchronous:true
                            try {
                                const command = `exec bash -c "${wallpaperSelector} ${path} &"`
                                // var command = `exec matugen ${path}`
                                Hyprland.dispatch(command)
                                
                                console.log("running on",path)
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
                            if (wallpaperScope.isOpen) {
                                resumeScrollTimer.restart()
                            }
                        }

                        delegate: Item {
                            width: wallpaperPanel.itemWidth
                            height: 155

                            Image {
                                id: imageObject
                                anchors.fill: parent
                                fillMode: Image.PreserveAspectCrop
                                source: folderModel.get(folderModel.randomIndices[index], "fileUrl")
                                
                                // Image optimization
                                asynchronous: true
                                cache: true
                                mipmap: true
                                sourceSize {
                                    width: wallpaperPanel.itemWidth
                                    height: 155
                                }

                                // Rounded corners mask
                                layer.enabled: true
                                layer.effect: OpacityMask {
                                    maskSource: Rectangle {
                                        width: imageObject.width
                                        height: imageObject.height
                                        radius: Appearance.rounding.small
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
            }
        }
    }

    IpcHandler {
        target: "wallpaperSelector"

        function toggle(): void {
            wallpaperScope.isOpen = !wallpaperScope.isOpen;
        }

        function close(): void {
            wallpaperScope.isOpen = false;
        }

        function open(): void {
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
