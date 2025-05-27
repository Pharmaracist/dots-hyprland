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
import "root:/modules/common/functions/string_utils.js" as StringUtils

Scope {
    id: wallpaperScope
    property bool wallpaperSelectorOpen: false

    Component.onCompleted: {
        if (typeof GlobalStates.wallpaperSelectorOpen === "undefined") {
            GlobalStates.wallpaperSelectorOpen = false;
        }
    }

    PanelWindow {
        id: wallpaperRoot
        visible: GlobalStates.wallpaperSelectorOpen

        function hide() {
            wallpaperRoot.visible = false;
        }

        exclusiveZone: 0
        implicitHeight: 180
        WlrLayershell.layer: WlrLayer.Overlay
        WlrLayershell.namespace: "quickshell:wallpaperSelector"
        color: "transparent"

        anchors {
            top: true
            bottom: false
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
            windows: [wallpaperRoot]
            active: GlobalStates.wallpaperSelectorOpen
            onCleared: () => {
                if (!active)
                    wallpaperRoot.hide();
            }
        }

        Loader {
            id: wallpaperContentLoader
            active: GlobalStates.wallpaperSelectorOpen
            anchors.centerIn: parent
            width: wallpaperRoot.width
            height: wallpaperRoot.height
            
            sourceComponent: Item {
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
                    border.color: Appearance.colors.m3outline
                    border.width: 1
                    radius: Appearance.rounding.normal
                    implicitHeight: wallpaperRoot.height

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
                                onClicked: errorDialog.visible = false, GlobalStates.wallpaperSelectorOpen = false
                            }
                        }
                    }

                    FolderListModel {
                        id: folderModel
                        folder: "/home/pc/Pictures/Wallpapers"
                        nameFilters: ["*.png", "*.jpg", "*.jpeg", "*.svg", "*.webp"]
                        showDirs: false
                        showFiles: true
                        sortField: FolderListModel.Name

                        onStatusChanged: {
                            if (status === FolderListModel.Ready && count === 0)
                                console.warn("No wallpapers found. Place images in:", folder);
                        }
                    }

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

                    ListView {
                        id: wallpaperList
                        model: folderModel
                        orientation: ListView.Horizontal
                        anchors.fill: parent
                        anchors.margins: 10
                        spacing: 8
                        cacheBuffer: 2000
                        boundsBehavior: Flickable.StopAtBounds
                        snapMode: ListView.SnapToItem

                        delegate: Item {
                            width: 260
                            height: 155

                            Image {
                                id: imageObject
                                anchors.fill: parent
                                fillMode: Image.PreserveAspectCrop
                                source: fileUrl
                                asynchronous: true
                                cache: false
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

    IpcHandler {
        target: "wallpaperSelector"

        function toggle(): void {
            GlobalStates.wallpaperSelectorOpen = !GlobalStates.wallpaperSelectorOpen;
        }

        function close(): void {
            GlobalStates.wallpaperSelectorOpen = false;
        }

        function open(): void {
            GlobalStates.wallpaperSelectorOpen = true;
        }
    }

    GlobalShortcut {
        name: "wallpaperSelectorToggle"
        description: qsTr("Toggles wallpaper selector on press")

        onPressed: {
            if (typeof GlobalStates.wallpaperSelectorOpen === "undefined") {
                GlobalStates.wallpaperSelectorOpen = false;
            }
            GlobalStates.wallpaperSelectorOpen = !GlobalStates.wallpaperSelectorOpen;
        }
    }

    GlobalShortcut {
        name: "wallpaperSelectorOpen"
        description: qsTr("Opens wallpaper selector on press")

        onPressed: {
            GlobalStates.wallpaperSelectorOpen = true;
        }
    }

    GlobalShortcut {
        name: "wallpaperSelectorClose"
        description: qsTr("Closes wallpaper selector on press")

        onPressed: {
            GlobalStates.wallpaperSelectorOpen = false;
        }
    }
}
