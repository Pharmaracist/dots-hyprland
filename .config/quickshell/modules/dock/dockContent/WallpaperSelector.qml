import Qt.labs.folderlistmodel
import Qt5Compat.GraphicalEffects
import QtMultimedia
import QtNetwork
import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Services.Mpris
import Quickshell.Services.UPower
import Quickshell.Wayland
import Quickshell.Widgets
import "root:/"
import "root:/modules/common"
import "root:/modules/common/functions/file_utils.js" as FileUtils
import "root:/modules/common/widgets"
import "root:/services"

Item {
    id: root

    // Properties
    property string wallpaperPath: Directories.pictures + "/Wallpapers"
    property string wallpaperSelector: FileUtils.trimFileProtocol(Directories.config + "/quickshell/scripts/switchwall.sh")

    // Constants
    readonly property int itemWidth: 300
    readonly property int itemHeight: 150
    readonly property int itemSpacing: 8

    // Wallpaper model with shuffling capability
    FolderListModel {
        id: wallpaperModel

        property var randomIndices: []
        property bool shuffled: false

        folder: root.wallpaperPath
        nameFilters: ["*.png", "*.jpg", "*.mp4", "*.mkv", "*.jpeg", "*.svg", "*.webp", "*.gif"]
        showDirs: false
        showFiles: true
        sortField: FolderListModel.Unsorted

        function getRandomFile(index) {
            if (index >= 0 && index < randomIndices.length) {
                return get(randomIndices[index], "fileUrl")
            }
            return ""
        }

        function shuffleWallpapers() {
            if (count <= 0) return
            randomIndices = Array.from({length: count}, (_, i) => i)
            for (let i = randomIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                ;[randomIndices[i], randomIndices[j]] = [randomIndices[j], randomIndices[i]]
            }
            shuffled = true
        }

        onCountChanged: {
            if (count > 0 && !shuffled) {
                shuffleWallpapers()
            }
        }
    }

    // Wallpaper script runner
    QtObject {
        id: wallpaperRunner

        signal wallpaperChanged(string path)
        signal errorOccurred(string message)

        function applyWallpaper(fileUrl) {
            if (!fileUrl) {
                errorOccurred("Invalid wallpaper path")
                return
            }

            const path = fileUrl.toString().replace("file://", "")

            try {
                const command = `exec bash -c "${root.wallpaperSelector} ${path} --type ${PersistentStates.temp.currentScheme} &"`
                Hyprland.dispatch(command)
                Hyprland.dispatch('global quickshell:wallpaperSelectorClose')
                wallpaperChanged(path)
            } catch (error) {
                errorOccurred("Failed to apply wallpaper: " + error.toString())
            }
        }
    }

    // Error handling
    QtObject {
        id: errorHandler

        function handleError(message) {
            // Centralized error handler stub
        }
    }

    // Main content container
    Rectangle {
        id: contentContainer
        anchors.fill: parent
        radius: Appearance.rounding.screenRounding
        color: Appearance.colors.colLayer2

        Rectangle {
            id: header
            anchors {
                top: parent.top
                left: parent.left
                right: parent.right
            }
            height: 60
            color: "transparent"
            visible: false

            Text {
                anchors.centerIn: parent
                text: "Wallpaper Selector"
                color: Appearance.m3colors.m3primary
                font.pixelSize: 18
                font.weight: Font.Medium
            }
        }

        ListView {
            id: wallpaperList

            anchors {
                fill: parent
                margins: root.itemSpacing
                topMargin: header.visible ? header.height + root.itemSpacing : root.itemSpacing
            }

            model: wallpaperModel.count
            orientation: ListView.Horizontal
            spacing: root.itemSpacing
            clip: true

            cacheBuffer: 0
            reuseItems: false
            snapMode: ListView.SnapToItem
            highlightRangeMode: ListView.StrictlyEnforceRange

            delegate: WallpaperItem {
                id: wallpaperDelegate

                width: root.itemWidth
                height: root.itemHeight
                fileUrl: wallpaperModel.getRandomFile(index)
                isVisible: true

                onClicked: {
                    if (fileUrl) {
                        wallpaperRunner.applyWallpaper(fileUrl)
                    } else {
                        errorHandler.handleError("No wallpaper file available at index: " + index)
                    }
                }
            }

            BusyIndicator {
                id: loadingIndicator
                anchors.centerIn: parent
                visible: wallpaperModel.count === 0
                running: visible
            }
        }

        Text {
            id: emptyStateText
            anchors.centerIn: parent
            visible: wallpaperModel.count === 0 && !loadingIndicator.running
            text: "No wallpapers found in " + root.wallpaperPath
            color: Appearance.colors.textPrimary || "#888888"
            font.pixelSize: 16
            horizontalAlignment: Text.AlignHCenter
        }
    }

    Connections {
        target: wallpaperRunner

        function onWallpaperChanged(path) {
            // Optional signal usage
        }

        function onErrorOccurred(message) {
            errorHandler.handleError(message)
        }
    }

    Component.onCompleted: {
        // Initialization logic if needed
    }
}
