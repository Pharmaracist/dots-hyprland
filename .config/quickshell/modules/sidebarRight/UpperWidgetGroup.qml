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
    // Negative velocity = upward swipe = expand
    // Fast swipe - use velocity direction
    // Slow drag - use position threshold
    // swipe up = expand

    id: root

    property bool collapsed: PersistentStates.sidebar.upperGroup.collapsed
    property int rowHeight: 50 // Height of one toggle row including spacing
    property int maxVisibleToggles: collapsed ? 2 : 7 // Show 2 toggles when collapsed, all when expanded
    property real dragProgress: 0 // 0 = collapsed, 1 = expanded
    readonly property int collapsedHeight: rowHeight + 64 // Single row + padding + drag bar
    readonly property int expandedHeight: Math.ceil(togglesList.length / buttonGrid.columns) * rowHeight + 100
    // List of all toggles for counting
    readonly property var togglesList: ["NetworkToggle", "BluetoothToggle", "NightLight", "GameMode", "IdleInhibitor", "SyncAudio", "Transparency"]

    function setCollapsed(state) {
        console.log("Setting collapsed to:", state);
        collapsed = state;
        // Save the state using PersistentStateManager
        PersistentStateManager.setState("sidebar.upperGroup.collapsed", state);
        dragProgress = Math.max(0, Math.min(1, (collapsed ? -deltaY : maxDragDistance - deltaY) / maxDragDistance));
    }

    function handleDragEnd(velocityY) {
        const progressThreshold = 0;
        const velocityThreshold = 4;
        let shouldExpand;
        if (Math.abs(velocityY) > velocityThreshold)
            shouldExpand = velocityY < 0;
        else
            shouldExpand = dragProgress >= progressThreshold;
        setCollapsed(!shouldExpand);
    }

    Layout.bottomMargin: 0
    radius: Appearance.rounding.normal
    color: "transparent"
    clip: true
    implicitHeight: dragHandler.active ? collapsedHeight + (expandedHeight - collapsedHeight) * dragProgress : (collapsed ? collapsedHeight : expandedHeight)

    Timer {
        id: collapseCleanFadeTimer

        interval: Appearance.animation.elementMove.duration / 2
        repeat: false
        onTriggered: {
            if (collapsed)
                collapsedView.opacity = 1;
            else
                expandedView.opacity = 1;
        }
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
        // Visual feedback when dragging
        states: [
            State {
                when: dragHandler.active

                PropertyChanges {
                    target: handleRect
                    opacity: 0.6
                    color: Appearance.colors.colAccent
                }

            },
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

        DragHandler {
            id: dragHandler

            property real startY: 0
            property real maxDragDistance: expandedHeight - collapsedHeight
            property bool hasDragged: false

            target: null
            yAxis.enabled: true
            xAxis.enabled: false
            dragThreshold: 2
            onActiveChanged: {
                if (active) {
                    startY = centroid.position.y;
                    hasDragged = false;
                } else {
                    if (hasDragged)
                        handleDragEnd(point.velocity.y);
                    else
                        root.setCollapsed(!root.collapsed);
                }
            }
            onCentroidChanged: {
                if (active && maxDragDistance > 0) {
                    const deltaY = centroid.position.y - startY;
                    const absDelta = Math.abs(deltaY);
                    if (absDelta > dragThreshold)
                        hasDragged = true;

                    if (hasDragged) {
                        if (collapsed)
                            dragProgress = Math.max(0, Math.min(1, -deltaY / maxDragDistance));
                        else
                            dragProgress = Math.max(0, Math.min(1, 1 - deltaY / (maxDragDistance * 0.6)));
                    }
                }
            }
        }

    }

    // Collapsed View - Single row
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
                id: upperRow

                Layout.fillHeight: false
                Layout.topMargin: -10
                Layout.margins: 5

                Item {
                    implicitWidth: distroIcon.width
                    implicitHeight: distroIcon.height

                    CustomIcon {
                        id: distroIcon

                        width: 25
                        height: 25
                        source: SystemInfo.distroIcon
                    }

                    ColorOverlay {
                        anchors.fill: distroIcon
                        source: distroIcon
                        color: Appearance.colors.colOnLayer0
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
                // Settings

                Button {
                    width: 45
                    height: 45
                    onClicked: {
                        Hyprland.dispatch(`exec ${ConfigOptions.apps.settings}`);
                        Hyprland.dispatch(`global quickshell:sidebarRightClose`);
                    }

                    PointingHandInteraction {
                    }

                    background: Rectangle {
                        radius: 99
                        anchors.fill: parent
                        color: Appearance.m3colors.m3surfaceContainer
                    }

                    contentItem: MaterialSymbol {
                        text: "settings"
                        font.pixelSize: Appearance.font.pixelSize.large
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
                        font.pixelSize: Appearance.font.pixelSize.large
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
                        font.pixelSize: Appearance.font.pixelSize.large
                        color: Appearance.m3colors.m3onSurfaceVariant
                        anchors.centerIn: parent
                    }

                }

            }

            RowLayout {
                anchors.horizontalCenter: parent.horizontalCenter
                spacing: 5
                Layout.fillHeight: false

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

    // Expanded View - Full grid
    Item {
        id: expandedView

        anchors.fill: parent
        anchors.bottomMargin: 50 // Space for drag bar
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

                StyledText {
                    text: qsTr("Quick Settings")
                    font.pixelSize: Appearance.font.pixelSize.huge
                    font.family: Appearance.font.family.title
                    color: Appearance.colors.colOnLayer1
                }

                Item {
                    Layout.fillWidth: true
                }

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

        }

        Behavior on opacity {
            NumberAnimation {
                duration: Appearance.animation.elementMove.duration / 2
                easing.type: Appearance.animation.elementMove.type
                easing.bezierCurve: Appearance.animation.elementMove.bezierCurve
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
