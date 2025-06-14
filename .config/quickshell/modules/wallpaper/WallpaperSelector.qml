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

Scope {
    id: root

    // Properties
    property string wallpaperPath: Directories.pictures
    property int widgetHeight: expand ? 400 : 260  // Dynamic height based on expand state
    property string wallpaperSelector: FileUtils.trimFileProtocol(Directories.config + "/quickshell/scripts/switchwall.sh")
    property bool isOpen: false
    property bool expand: true

    // Bind local state to global state
    onIsOpenChanged: GlobalStates.wallpaperSelectorOpen = isOpen

    // Main window
    PanelWindow {
        id: window

        function hide() {
            root.isOpen = false;
        }

        visible: root.isOpen
        exclusiveZone: 0
        implicitHeight: root.widgetHeight
        WlrLayershell.namespace: "quickshell:wallpaperSelector"
        color: "transparent"

        anchors {
            top: true
            right: true
            left: true
            bottom: expand ?? false
        }

        // Content loader
        Loader {
            id: contentLoader

            active: true
            visible: GlobalStates?.wallpaperSelectorOpen ?? true
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
            readonly property int itemWidth: 200
            readonly property int itemHeight: 120
            readonly property int itemSpacing: 8
            readonly property int columns: Math.floor((container.width - 20) / (itemWidth + itemSpacing))

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

                radius: Appearance.rounding.screenRounding
                color: Appearance.colors.colLayer0

                anchors {
                    fill: parent
                    margins: Appearance.sizes.hyprlandGapsOut
                }

                // Secondary container
                Rectangle {
                    id: container

                    color: Appearance.colors.colLayer2
                    radius: Appearance.rounding.normal

                    anchors {
                        fill: parent
                        margins: 10
                    }

                    // Conditional view based on expand state
                    Loader {
                        id: viewLoader
                        anchors {
                            fill: parent
                            margins: 10
                        }
                        sourceComponent: root.expand ? gridViewComponent : listViewComponent
                    }
                }
            }

            // List view component (single row when not expanded)
            Component {
                id: listViewComponent
                
                ListView {
                    id: wallpaperList

                    model: wallpaperModel.count
                    orientation: ListView.Horizontal
                    spacing: wallpaperContent.itemSpacing
                    clip: true
                    cacheBuffer: 0  // No caching
                    reuseItems: false  // Don't reuse items

                    delegate: WallpaperItem {
                        width: (parent.height * 0.9 * 16) / 9
                        height: parent.height * 0.9
                        fileUrl: wallpaperModel.getRandomFile(index)
                        // Always visible - no lazy loading
                        isVisible: true
                        onClicked: {
                            const path = fileUrl.toString().replace("file://", "");
                            wallpaperRunner.runWallpaperScript(path);
                        }
                    }
                }
            }

            // Grid view component (multiple rows when expanded)
            Component {
                id: gridViewComponent
                
                GridView {
                    id: wallpaperGrid

                    model: wallpaperModel.count
                    cellWidth: wallpaperContent.itemWidth + wallpaperContent.itemSpacing
                    cellHeight: wallpaperContent.itemHeight + wallpaperContent.itemSpacing
                    clip: true
                    cacheBuffer: 0  // No caching buffer
                    reuseItems: false  // Don't reuse items to avoid loading delays
                    
                    // Enable smooth scrolling
                    flickDeceleration: 3000
                    maximumFlickVelocity: 5000

                    // Scrollbar
                    ScrollBar.vertical: ScrollBar {
                        policy: wallpaperGrid.contentHeight > wallpaperGrid.height ? ScrollBar.AsNeeded : ScrollBar.AlwaysOff
                        anchors.right: parent.right
                        anchors.rightMargin: 2
                    }

                    delegate: WallpaperItem {
                        width: wallpaperContent.itemWidth
                        height: wallpaperContent.itemHeight
                        fileUrl: wallpaperModel.getRandomFile(index)
                        
                        // Always visible - no lazy loading
                        isVisible: true
                        
                        onClicked: {
                            const path = fileUrl.toString().replace("file://", "");
                            wallpaperRunner.runWallpaperScript(path);
                        }
                    }

                    // Grid flow from left to right, top to bottom
                    flow: GridView.FlowLeftToRight
                    layoutDirection: Qt.LeftToRight
                }
            }

            // Error dialog
            Rectangle {
                id: errorDialog

                property string message

                function show(msg) {
                    message = msg;
                    visible = true;
                }

                anchors.centerIn: parent
                width: 300
                height: mainPanel.height * 0.6
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
                        Layout.fillWidth: true
                        text: errorDialog.message
                        color: Appearance.colors.colOnLayer1
                        wrapMode: Text.Wrap
                    }

                    Button {
                        text: "OK"
                        Layout.alignment: Qt.AlignHCenter
                        onClicked: {
                            errorDialog.visible = false;
                            GlobalStates.wallpaperSelectorOpen = false;
                        }
                    }
                }
            }
        }
    }

    // Wallpaper model
    FolderListModel {
        id: wallpaperModel

        property var randomIndices: []
        property bool shuffled: false

        function getRandomFile(index) {
            if (index >= 0 && index < randomIndices.length)
                return get(randomIndices[index], "fileUrl");

            return "";
        }

        folder: Directories.pictures + "/Wallpapers"
        nameFilters: ["*.png", "*.jpg", "*.mp4", "*.mkv", "*.jpeg", "*.svg", "*.webp", "*.gif"]
        showDirs: false
        showFiles: true
        sortField: FolderListModel.Unsorted
        
        onCountChanged: {
            if (count > 0 && !shuffled) {
                shuffled = true;
                randomIndices = Array.from({
                    "length": count
                }, (_, i) => {
                    return i;
                });
                // Fisher-Yates shuffle - only done once
                for (let i = randomIndices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [randomIndices[i], randomIndices[j]] = [randomIndices[j], randomIndices[i]];
                }
            }
        }
    }

    // Wallpaper runner
    QtObject {
        id: wallpaperRunner

        function runWallpaperScript(path) {
            try {
                const command = `exec bash -c "${root.wallpaperSelector} ${path} &"`;
                Hyprland.dispatch(command);
                Hyprland.dispatch('global quickshell:wallpaperSelectorClose');
            } catch (error) {
                console.error("Failed to run wallpaper script:", error);
                if (contentLoader.item && contentLoader.item.errorDialog)
                    contentLoader.item.errorDialog.show("Failed to apply wallpaper: " + error);
            }
        }
    }

    // Error handler
    QtObject {
        id: errorHandler

        function showError(message) {
            if (contentLoader.item && contentLoader.item.errorDialog)
                contentLoader.item.errorDialog.show(message);
        }
    }

    // IPC Handler
    IpcHandler {
        function toggle() {
            root.isOpen = !root.isOpen;
        }

        function close() {
            root.isOpen = false;
        }

        function open() {
            root.isOpen = true;
        }

        target: "wallpaperSelector"
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

    GlobalShortcut {
        name: "wallpaperSelectorExpand"
        description: qsTr("Expand wallpaper selector on press")
        onPressed: root.expand = !root.expand
    }
}