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
                const fileUrl = get(randomIndices[index], "fileUrl")
                console.log("Getting file at index", index, "->", randomIndices[index], ":", fileUrl)
                return fileUrl
            }
            console.log("Invalid index:", index, "randomIndices length:", randomIndices.length)
            return ""
        }
        
        function shuffleWallpapers() {
            if (count <= 0) return
            
            // Create array of indices
            randomIndices = Array.from({length: count}, (_, i) => i)
            
            // Fisher-Yates shuffle algorithm
            for (let i = randomIndices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [randomIndices[i], randomIndices[j]] = [randomIndices[j], randomIndices[i]]
            }
            
            shuffled = true
        }
        
        onCountChanged: {
            console.log("Wallpaper model count changed:", count)
            if (count > 0 && !shuffled) {
                console.log("Shuffling wallpapers...")
                shuffleWallpapers()
                console.log("Shuffle complete. First few files:")
                for (let i = 0; i < Math.min(3, count); i++) {
                    console.log("  ", i, ":", getRandomFile(i))
                }
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
                const command = `exec bash -c "${root.wallpaperSelector} ${path} &"`
                Hyprland.dispatch(command)
                Hyprland.dispatch('global quickshell:wallpaperSelectorClose')
                wallpaperChanged(path)
            } catch (error) {
                console.error("Failed to apply wallpaper:", error)
                errorOccurred("Failed to apply wallpaper: " + error.toString())
            }
        }
    }
    
    // Error handling
    QtObject {
        id: errorHandler
        
        function handleError(message) {
            console.error("Wallpaper Selector Error:", message)
            // Could emit a signal here for external error handling
        }
    }
    
    // Main content container
    Rectangle {
        id: contentContainer
        anchors.fill: parent
        radius: Appearance.rounding.screenRounding
        color: Appearance.colors.colLayer2
        
        // Header section (optional - for future enhancements)
        Rectangle {
            id: header
            anchors {
                top: parent.top
                left: parent.left
                right: parent.right
            }
            height: 60
            color: "transparent"
            visible: false // Hidden for now, but structure is there
            
            Text {
                anchors.centerIn: parent
                text: "Wallpaper Selector"
                color: Appearance.colors.textPrimary
                font.pixelSize: 18
                font.weight: Font.Medium
            }
        }
        
        // Main wallpaper list
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
            
            // Performance optimizations
            cacheBuffer: 0
            reuseItems: false
            
            // Smooth scrolling
            snapMode: ListView.SnapToItem
            highlightRangeMode: ListView.StrictlyEnforceRange
            
            delegate: WallpaperItem {
                id: wallpaperDelegate
                
                width: root.itemWidth
                height: root.itemHeight
                fileUrl: wallpaperModel.getRandomFile(index)
                
                // Enable loading by setting isVisible to true
                isVisible: true
                // Alternative: you could use forceLoad: true instead
                
                // Debug the fileUrl
                Component.onCompleted: {
                    console.log("WallpaperItem", index, "created with fileUrl:", fileUrl)
                }
                
                // Enhanced interaction
                onClicked: {
                    if (fileUrl) {
                        console.log("Clicked wallpaper:", fileUrl)
                        wallpaperRunner.applyWallpaper(fileUrl)
                    } else {
                        console.log("No fileUrl for index:", index)
                        errorHandler.handleError("No wallpaper file available at index: " + index)
                    }
                }
            }
            
            // Loading indicator (if needed)
            BusyIndicator {
                id: loadingIndicator
                anchors.centerIn: parent
                visible: wallpaperModel.count === 0
                running: visible
            }
        }
        
        // Empty state message
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
    
    // Connections for external event handling
    Connections {
        target: wallpaperRunner
        
        function onWallpaperChanged(path) {
            console.log("Wallpaper changed to:", path)
        }
        
        function onErrorOccurred(message) {
            errorHandler.handleError(message)
        }
    }
    
    // Component initialization
    Component.onCompleted: {
        console.log("Wallpaper Selector initialized")
        console.log("Wallpaper path:", root.wallpaperPath)
        console.log("Available wallpapers:", wallpaperModel.count)
    }
}