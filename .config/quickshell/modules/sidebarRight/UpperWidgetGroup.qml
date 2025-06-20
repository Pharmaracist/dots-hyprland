import "./quickToggles/"
import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Wayland
import Quickshell.Widgets
import "root:/"
import "root:/modules/common"
import "root:/modules/common/functions/string_utils.js" as StringUtils
import "root:/modules/common/widgets"
import "root:/services"

Rectangle {
    id: root

    property bool collapsed: PersistentStates.sidebar.upperGroup.collapsed
    property int rowHeight: 50 // Height of one toggle row including spacing
    property int maxVisibleToggles: collapsed ? 2 : 10 // Show 2 toggles when collapsed, all when expanded
    readonly property int collapsedHeight: rowHeight + 80 // Single row + padding + drag bar
    readonly property int expandedHeight: Math.ceil(togglesList.length / 2) * rowHeight + 268
    // List of all toggles for counting
    readonly property var togglesList: ["NetworkToggle", "BluetoothToggle", "NightLight", "GameMode", "IdleInhibitor", "SyncAudio", "Transparency"]

    function setCollapsed(state) {
        console.log("Setting collapsed to:", state);
        collapsed = state;
        // Save the state using PersistentStateManager
        PersistentStateManager.setState("sidebar.upperGroup.collapsed", state);
    }

    Layout.bottomMargin: 0
    radius: Appearance.rounding.normal
    color: "transparent"
    clip: true
    implicitHeight: collapsed ? collapsedHeight : expandedHeight

    Timer {
        id: collapseCleanFadeTimer

        interval: Appearance.animation.elementMove.duration / 2
        repeat: false
        onTriggered: {
            if (collapsed) {
                expandedLoader.active = false;
                collapsedLoader.active = true;
            } else {
                collapsedLoader.active = false;
                expandedLoader.active = true;
            }
        }
    }

    // Initialize the correct loader on startup
    Component.onCompleted: {
        if (collapsed) {
            collapsedLoader.active = true;
            expandedLoader.active = false;
        } else {
            expandedLoader.active = true;
            collapsedLoader.active = false;
        }
    }

    // Watch for collapsed state changes
    onCollapsedChanged: {
        collapseCleanFadeTimer.restart();
    }

    // Drag Handle Bar at the bottom
    Rectangle {
        id: dragBar

        property bool hovered: false

        anchors.bottom: parent.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        height: 10
        color: "transparent"
        z: 100
        // Visual feedback states
        states: [
            State {
                when: dragBar.hovered

                PropertyChanges {
                    target: handleRect
                    opacity: 0.5
                    color: Appearance.colors.colOnLayer1
                }

            }
        ]

        // Hover detection
        HoverHandler {
            id: hoverHandler

            acceptedDevices: PointerDevice.Mouse
            onHoveredChanged: dragBar.hovered = hovered
        }

        // Click to toggle
        TapHandler {
            acceptedButtons: Qt.LeftButton
            onTapped: root.setCollapsed(!root.collapsed)
        }

        // Visual drag indicator
        Rectangle {
            id: handleRect

            anchors.horizontalCenter: parent.horizontalCenter
            anchors.bottom: parent.bottom
            width: collapsed ? 40 : 200
            height: 4
            radius: 2
            color: Appearance.m3colors.m3onSurfaceVariant
            opacity: 0.3

            DropShadow {
                anchors.fill: handleRect
                horizontalOffset: 0
                verticalOffset: 1
                radius: 6
                samples: 15
                color: "#60000000"
                source: handleRect
                visible: hoverHandler.hovered
            }

            Behavior on height {
                NumberAnimation {
                    duration: 150
                }

            }

            Behavior on radius {
                NumberAnimation {
                    duration: 150
                }

            }

            Behavior on opacity {
                NumberAnimation {
                    duration: 150
                }

            }

            Behavior on width {
                NumberAnimation {
                    duration: 150
                }

            }

            Behavior on color {
                ColorAnimation {
                    duration: 150
                }

            }

        }

    }

    // Collapsed View Loader
    Loader {
        id: collapsedLoader
        
        anchors.fill: parent
        active: false
        asynchronous: true
        
        sourceComponent: Component {
            Item {
                id: collapsedView

                anchors.fill: parent
                opacity: collapsed ? 1 : 0
                visible: opacity > 0
                anchors.margins: 7

                ColumnLayout {
                    anchors.centerIn: parent
                    spacing: 10
                    anchors.margins: 5

                    RowLayout {
                        // Settings

                        id: upperRow

                        Layout.fillHeight: false
                        Layout.topMargin: -10
                        Layout.margins: 5
                        spacing: 10

                        Item {
                            implicitWidth: distroIcon.width
                            implicitHeight: distroIcon.height

                            CustomIcon {
                                id: distroIcon

                                anchors.centerIn: parent
                                width: parent.height
                                height: parent.height
                                source: SystemInfo.distroIcon
                            }

                            ColorOverlay {
                                anchors.fill: distroIcon
                                source: distroIcon
                                color: Appearance.m3colors.m3primary
                            }

                        }

                        StyledText {
                            font.pixelSize: Appearance.font.pixelSize.normal
                            font.family: Appearance.font.family.title
                            color: Appearance.colors.colOnLayer0
                            text: StringUtils.format(qsTr("Uptime: {0}"), DateTime.uptime)
                            textFormat: Text.MarkdownText
                        }

                        Item {
                            Layout.fillWidth: true
                        }

                        Button {
                            width: 45
                            height: 45
                            onClicked: {
                                Hyprland.dispatch(`exec qs -p '${Directories.settings}'`);
                                Hyprland.dispatch(`global quickshell:sidebarRightClose`);
                            }

                            PointingHandInteraction {
                            }

                            background: Rectangle {
                                radius: 99
                                color: Appearance.m3colors.m3surfaceContainer
                            }

                            contentItem: MaterialSymbol {
                                text: "settings"
                                font.pixelSize: Appearance.font.pixelSize.larger
                                color: Appearance.m3colors.m3onSurfaceVariant
                                anchors.centerIn: parent
                            }

                        }

                        Button {
                            width: 45
                            height: 45
                            onClicked: Hyprland.dispatch("global quickshell:sessionOpen")

                            PointingHandInteraction {
                            }

                            background: Rectangle {
                                radius: 99
                                anchors.fill: parent
                                color: Appearance.m3colors.m3surfaceContainer
                            }

                            contentItem: MaterialSymbol {
                                text: "power_settings_new"
                                font.pixelSize: Appearance.font.pixelSize.larger
                                color: Appearance.m3colors.m3onSurface
                                anchors.centerIn: parent
                            }

                        }

                        Button {
                            width: 45
                            height: 45
                            onClicked: {
                                Hyprland.dispatch("reload");
                                Quickshell.reload(true);
                            }

                            PointingHandInteraction {
                            }

                            background: Rectangle {
                                radius: 99
                                anchors.fill: parent
                                color: Appearance.m3colors.m3surfaceContainer
                            }

                            contentItem: MaterialSymbol {
                                text: "restart_alt"
                                font.pixelSize: Appearance.font.pixelSize.larger + 3
                                color: Appearance.m3colors.m3onSurfaceVariant
                                anchors.centerIn: parent
                            }

                        }

                    }

                    RowLayout {
                        spacing: 10
                        Layout.fillHeight: false
                        Layout.alignment: Qt.AlignHCenter

                        // First two toggles
                        NetworkToggle {
                        }

                        BluetoothToggle {
                        }

                    }

                }

                Behavior on opacity {
                    NumberAnimation {
                        duration: Appearance.animation.elementMove.duration / 2
                        easing.type: Appearance.animation.elementMove.type
                        easing.bezierCurve: Appearance.animation.elementMove.bezierCurve
                    }

                }

            }
        }
    }

    // Expanded View Loader
    Loader {
        id: expandedLoader
        
        anchors.fill: parent
        anchors.bottomMargin: 50 // Space for drag bar
        active: false
        asynchronous: true
        
        sourceComponent: Component {
            Item {
                id: expandedView

                anchors.fill: parent
                opacity: collapsed ? 0 : 1
                visible: opacity > 0

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 15
                    spacing: 10

                    // Header
                    RowLayout {
                        Layout.fillWidth: true
                        Layout.bottomMargin: 10

                        ColumnLayout {
                            spacing: 0

                            StyledText {
                                text: DateTime.time
                                font.pixelSize: Appearance.font.pixelSize.huge + 5
                                font.family: Appearance.font.family.title
                                color: Appearance.colors.colOnLayer1
                            }

                            StyledText {
                                text: DateTime.date
                                font.pixelSize: Appearance.font.pixelSize.normal
                                font.family: Appearance.font.family.title
                                color: Appearance.colors.colOnLayer1
                            }

                        }

                        Item {
                            Layout.fillWidth: true
                        }

                        Item {
                            Layout.fillWidth: false
                            Layout.rightMargin: 60
                            Layout.bottomMargin: 50

                            AnimatedImage {
                                id: avatar

                                cache: true
                                mipmap: true
                                height: 60
                                width: 60
                                source: "root:/assets/gif/avatar6.gif"
                                speed: mouseArea.containsMouse ? 1 : 0.5

                                MouseArea {
                                    id: mouseArea

                                    anchors.fill: parent
                                    hoverEnabled: true
                                }

                            }

                        }

                    }

                    BrightnessSlider {
                        Layout.fillWidth: true
                    }

                    VolumeSlider {
                        Layout.fillWidth: true
                    }
                    // Full grid of toggles

                    Grid {
                        id: buttonGrid

                        Layout.alignment: Qt.AlignHCenter
                        columns: 2
                        rowSpacing: 10
                        columnSpacing: 10

                        NetworkToggle {
                        }

                        BluetoothToggle {
                        }

                        NightLight {
                        }

                        ShellMode {
                        }

                        GameMode {
                        }

                        IdleInhibitor {
                        }

                        SyncAudio {
                        }

                        Transparency {
                        }

                    }

                    ModeSelector {
                        Layout.alignment: Qt.AlignHCenter
                        onModeChanged: function(newMode) {
                            console.log("Theme mode changed to:", newMode);
                            // Here you would call your matugen service
                            // For example: MatugenService.setMode(newMode);
                        }
                    }

                }

                Behavior on opacity {
                    NumberAnimation {
                        duration: Appearance.animation.elementMove.duration / 2
                        easing.type: Appearance.animation.elementMove.type
                        easing.bezierCurve: Appearance.animation.elementMove.bezierCurve
                    }

                }

            }
        }
    }

    Behavior on implicitHeight {
        NumberAnimation {
            duration: Appearance.animation.elementMove.duration
            easing.type: Appearance.animation.elementMove.type
            easing.bezierCurve: Appearance.animation.elementMove.bezierCurve
        }

    }

}