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
    id: root
    
    // Properties
    property bool verticalBar: PersistentStates.bar.verticalMode
    property string wallpaperPath: Directories.pictures
    property int widgetHeight: 260
    property string wallpaperSelector: FileUtils.trimFileProtocol(Directories.config + "/quickshell/scripts/switchwall.sh")
    property bool isOpen: false
    
    // Bind local state to global state
    onIsOpenChanged: GlobalStates.wallpaperSelectorOpen = isOpen
    
    // Main window
    PanelWindow {
        id: window
        visible: root.isOpen
        
        exclusiveZone: 0
        implicitHeight: root.widgetHeight
        WlrLayershell.namespace: "quickshell:wallpaperSelector"
        color: "transparent"
        
        anchors {
            top: true
            right: true
            left: true
        }
        
        function hide() {
            root.isOpen = false
        }
        
        // Content loader
        Loader {
            id: contentLoader
            active: true
            visible: GlobalStates.wallpaperSelectorOpen
            anchors.fill: parent
            
            sourceComponent: wallpaperContentComponent
        }
    }
    
    // Main wallpaper content component
    Component {
        id: wallpaperContentComponent
        
        Item {
            id: wallpaperContent
            
            // Constants
            readonly property int scrollItemCount: 5
            readonly property int itemWidth: 260
            readonly property int itemSpacing: 8
            readonly property int scrollAmount: (itemWidth + itemSpacing) * scrollItemCount
            
            // Shadow effect
            RectangularShadow {
                anchors.fill: parent
                blur: 1.2 * Appearance.sizes.elevationMargin
                spread: 1
                color: Appearance.colors.colShadow
            }
            
            // Main panel
            Rectangle {
                id: mainPanel
                anchors {
                    fill: parent
                    margins: Appearance.sizes.hyprlandGapsOut
                }
                radius: Appearance.rounding.screenRounding
                color: Appearance.colors.colLayer0
                
                // Secondary container
                Rectangle {
                    id: container
                    anchors {
                        fill: parent
                        margins: 10
                    }
                    color: Appearance.colors.colLayer2
                    radius: Appearance.rounding.normal
                    
                    // Wallpaper list
                    ListView {
                        id: wallpaperList
                        anchors {
                            fill: parent
                            margins: 10
                        }
                        
                        model: wallpaperModel.count
                        orientation: ListView.Horizontal
                        spacing: wallpaperContent.itemSpacing
                        clip: true
                        cacheBuffer: width * 2
                        reuseItems: true
                        
                        // Smooth scrolling
                        highlightRangeMode: ListView.StrictlyEnforceRange
                        preferredHighlightBegin: 0
                        preferredHighlightEnd: width
                        
                        Behavior on contentX {
                            NumberAnimation {
                                duration: 1500
                                easing.type: Easing.InOutQuad
                            }
                        }
                        
                        // Auto-scroll animation
                        NumberAnimation {
                            id: scrollAnimation
                            target: wallpaperList
                            property: "contentX"
                            duration: 1500
                            easing.type: Easing.InOutQuad
                        }
                        
                        // User interaction handlers
                        onMovementStarted: {
                            autoScroller.pauseScrolling()
                        }
                        
                        onMovementEnded: {
                            if (root.isOpen) {
                                autoScroller.resumeScrolling()
                            }
                        }
                        
                        delegate: WallpaperItem {
                            width: (container.height * 0.9 * 16) / 9
                            height: container.height * 0.9
                            
                            fileUrl: wallpaperModel.getRandomFile(index)
                            
                            // Lazy loading - only load when item is visible in viewport
                            isVisible: {
                                const itemX = x
                                const itemRight = x + width
                                const viewLeft = wallpaperList.contentX
                                const viewRight = wallpaperList.contentX + wallpaperList.width
                                
                                // Item is visible if it overlaps with the viewport
                                return itemRight > viewLeft && itemX < viewRight
                            }
                            
                            onClicked: {
                                const path = fileUrl.toString().replace("file://", "")
                                wallpaperRunner.runWallpaperScript(path)
                            }
                        }
                    }
                }
            }
            
            // Auto-scrolling logic
            QtObject {
                id: autoScroller
                
                property Timer resumeTimer: Timer {
                    interval: 1000
                    repeat: true
                    onTriggered: scrollTimer.restart()
                }
                
                property Timer scrollTimer: Timer {
                    interval: 1000
                    running: root.isOpen
                    repeat: true
                    onTriggered: {
                        if (wallpaperList.contentX >= wallpaperList.contentWidth - wallpaperList.width) {
                            wallpaperList.contentX = 0
                        } else {
                            scrollAnimation.to = wallpaperList.contentX + wallpaperContent.scrollAmount
                            scrollAnimation.start()
                        }
                    }
                }
                
                function pauseScrolling() {
                    resumeTimer.stop()
                    scrollTimer.stop()
                }
                
                function resumeScrolling() {
                    resumeTimer.restart()
                }
            }
            
            // Error dialog
            Rectangle {
                id: errorDialog
                anchors.centerIn: parent
                width: 300
                height: mainPanel.height * 0.9
                color: Appearance.colors.colLayer1
                border.color: Appearance.colors.colOutline
                border.width: 1
                radius: Appearance.rounding.small
                visible: false
                z: 100
                
                property string message
                
                function show(msg) {
                    message = msg
                    visible = true
                }
                
                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 10
                    
                    Text {
                        Layout.fillWidth: true
                        text: errorDialog.message
                        color: Appearance.colors.colOnLayer1
                        wrapMode: Text.Wrap
                    }
                    
                    Button {
                        text: "OK"
                        Layout.alignment: Qt.AlignHCenter
                        onClicked: {
                            errorDialog.visible = false
                            GlobalStates.wallpaperSelectorOpen = false
                        }
                    }
                }
            }
        }
    }
    
    // Wallpaper model
    FolderListModel {
        id: wallpaperModel
        folder: Directories.pictures + "/Wallpapers"
        nameFilters: ["*.png", "*.jpg", "*.mp4", "*.mkv", "*.jpeg", "*.svg", "*.webp", "*.gif"]
        showDirs: false
        showFiles: true
        sortField: FolderListModel.Unsorted
        
        property var randomIndices: []
        
        onCountChanged: {
            if (count > 0) {
                randomIndices = Array.from({length: count}, (_, i) => i)
                // Fisher-Yates shuffle
                for (let i = randomIndices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [randomIndices[i], randomIndices[j]] = [randomIndices[j], randomIndices[i]]
                }
            }
        }
        
        function getRandomFile(index) {
            if (index >= 0 && index < randomIndices.length) {
                return get(randomIndices[index], "fileUrl")
            }
            return ""
        }
    }
    
    // Wallpaper runner
    QtObject {
        id: wallpaperRunner
        
        function runWallpaperScript(path) {
            try {
                const command = `exec bash -c "${root.wallpaperSelector} ${path} &"`
                Hyprland.dispatch(command)
                Hyprland.dispatch('global quickshell:wallpaperSelectorClose')
            } catch (error) {
                console.error("Failed to run wallpaper script:", error)
                if (contentLoader.item && contentLoader.item.errorDialog) {
                    contentLoader.item.errorDialog.show("Failed to apply wallpaper: " + error)
                }
            }
        }
    }
    
    // Error handler
    QtObject {
        id: errorHandler
        
        function showError(message) {
            if (contentLoader.item && contentLoader.item.errorDialog) {
                contentLoader.item.errorDialog.show(message)
            }
        }
    }
    
    // IPC Handler
    IpcHandler {
        target: "wallpaperSelector"
        
        function toggle() {
            root.isOpen = !root.isOpen
        }
        
        function close() {
            root.isOpen = false
        }
        
        function open() {
            root.isOpen = true
        }
    }
    
    // Global shortcuts
    GlobalShortcut {
        name: "wallpaperSelectorToggle"
        description: qsTr("Toggles wallpaper selector on press")
        onPressed: root.isOpen = !root.isOpen
    }
    
    GlobalShortcut {
        name: "wallpaperSelectorOpen"
        description: qsTr("Opens wallpaper selector on press")
        onPressed: root.isOpen = true
    }
    
    GlobalShortcut {
        name: "wallpaperSelectorClose"
        description: qsTr("Closes wallpaper selector on press")
        onPressed: root.isOpen = false
    }
}