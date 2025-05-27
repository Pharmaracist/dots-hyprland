// File: WallpaperPanel.qml
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
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

Scope {
    id: wallpaperScope

    Loader {
        id: wallpaperLoader

        active: false
        onActiveChanged: {
            GlobalStates.wallpaperSelectorOpen = wallpaperLoader.active;
        }

        PanelWindow {
            id: wallpaperWindow

            function hide() {
                wallpaperLoader.active = false;
            }

            exclusiveZone: 0
            implicitHeight: 180
            WlrLayershell.layer: WlrLayer.Overlay
            WlrLayershell.namespace: "quickshell:wallpaperPanel"
            color: "transparent"

            anchors {
                bottom: true
                right: true
                left: true
            }

            margins {
                left: 10
                top: 10
                right: 10
            }

            HyprlandFocusGrab {
                id: wallpaperFocusGrab

                windows: [wallpaperWindow]
                active: wallpaperWindow.visible
                onCleared: () => {
                    if (!active)
                        wallpaperWindow.hide();

                }
            }

            Rectangle {
                id: wallpaperPanel

                width: Screen.width
                anchors.top: parent.top
                color: Appearance.colors.colLayer0
                border.color: Appearance.colors.m3outline
                border.width: 1
                radius: Appearance.rounding.normal
                implicitHeight: 180

                // Custom dialog to replace MessageDialog
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
                    border.color: Appearance.colors.m3outline
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
                            onClicked: errorDialog.visible = false, wallpaperSelect.visible = false
                        }

                    }

                }

                // FolderListModel for wallpapers
                FolderListModel {
                    id: folderModel

                    folder: {
                        // var basePath = StandardPaths.writableLocation(StandardPaths.PicturesLocation);
                        var wallpaperPath = "/home/pc/Pictures/Wallpapers";
                        console.log("Wallpaper folder path:", wallpaperPath);
                        return wallpaperPath;
                    }
                    nameFilters: ["*.png", "*.jpg", "*.jpeg", "*.svg", "*.WEBP"]
                    showDirs: false
                    showFiles: true
                    sortField: FolderListModel.Name
                    onStatusChanged: {
                        if (status === FolderListModel.Ready) {
                            console.log("Current directory:", folder);
                            console.log("File count:", count);
                            if (count === 0)
                                console.warn("No wallpapers found. Place images in:", folder);

                        }
                    }
                }

                // Fallback for process execution
                QtObject {
                    id: runner

                    function runMatugen(path) {
                        Hyprland.dispatch(`exec matugen image ${path}`);
                        try {
                            var process = Qt.createQmlObject('import QtQuick; QtObject { Component.onCompleted: { console.log("Running matugen image ' + path + '"); } }', wallpaperPanel, "dynamicProcess");
                        } catch (error) {
                            console.error("Failed to run matugen:", error);
                            errorDialog.show("Failed to apply wallpaper: " + error);
                        }
                    }

                }

                Flickable {
                    id: flick

                    contentWidth: row.width
                    clip: true
                    flickableDirection: Flickable.HorizontalFlick

                    anchors {
                        fill: parent
                        leftMargin: 10
                        rightMargin: 10
                    }

                    Row {
                        id: row

                        spacing: 8
                        anchors.verticalCenter: parent.verticalCenter

                        Repeater {
                            model: folderModel

                            delegate: Item {
                                width: 260
                                height: 155

                                Image {
                                    anchors.fill: parent
                                    fillMode: Image.PreserveAspectCrop
                                    source: fileUrl
                                    cache: true
                                }

                                MouseArea {
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: {
                                        var path = fileUrl.toString().replace("file://", "");
                                        runner.runMatugen(path);
                                    }

                                    Rectangle {
                                        anchors.fill: parent
                                        color: parent.containsMouse ? Appearance.m3colors.m3surface : "transparent"
                                        opacity: 0.5
                                        border.color: parent.containsMouse ? Appearance.m3colors.m3outline : "transparent"
                                        border.width: 1
                                        radius: Appearance.rounding.small
                                        visible: parent.containsMouse
                                    }

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
            wallpaperLoader.active = !wallpaperLoader.active;
            if(wallpaperLoader.active) Notifications.timeoutAll();
        }

        function close(): void {
            wallpaperLoader.active = false;
        }

        function open(): void {
            wallpaperLoader.active = true;
            Notifications.timeoutAll();
        }
    }

    GlobalShortcut {
        name: "wallpaperSelectorToggle"
        description: qsTr("Toggles right sidebar on press")

        onPressed: {
            wallpaperLoader.active = !wallpaperLoader.active;
            if(wallpaperLoader.active) Notifications.timeoutAll();
        }
    }

}
