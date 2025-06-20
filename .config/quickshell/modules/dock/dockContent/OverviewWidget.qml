import "root:/"
import "root:/services/"
import "root:/modules/common"
import "root:/modules/dock/"
import "root:/modules/common/widgets"
import "root:/modules/common/functions/color_utils.js" as ColorUtils
import QtQuick
import QtQuick.Effects
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Widgets
import Quickshell.Wayland
import Quickshell.Hyprland

Item {
    id: root
    required property var panelWindow
    readonly property HyprlandMonitor monitor: panelWindow ? Hyprland.monitorFor(panelWindow.screen) : null
    readonly property var toplevels: ToplevelManager.toplevels
    readonly property int workspacesShown: ConfigOptions.overview.numOfRows * ConfigOptions.overview.numOfCols
    readonly property int workspaceGroup: Math.floor(((monitor?.activeWorkspace?.id ?? 1) - 1) / workspacesShown)
    property bool monitorIsFocused: (Hyprland.focusedMonitor?.id === monitor?.id)
    property var windows: HyprlandData.windowList
    property var windowByAddress: HyprlandData.windowByAddress
    property var windowAddresses: HyprlandData.addresses
    property var monitorData: HyprlandData.monitors.find(m => m.id === root.monitor?.id) ?? null
    property real scale: 0.18
    property color activeBorderColor: Appearance.colors.colSecondary

    // Add null safety checks for monitor and monitorData properties
    property real workspaceImplicitWidth: {
        if (!monitorData || !monitor) return 200; // fallback width
        return (monitorData.transform % 2 === 1) ? 
            ((monitor.height - (monitorData.reserved?.[0] ?? 0) - (monitorData.reserved?.[2] ?? 0)) * root.scale / monitor.scale) / 1.265 :
            ((monitor.width - (monitorData.reserved?.[0] ?? 0) - (monitorData.reserved?.[2] ?? 0)) * root.scale / monitor.scale) / 1.265
    }
    
    property real workspaceImplicitHeight: {
        if (!monitorData || !monitor) return 150; // fallback height
        return (monitorData.transform % 2 === 1) ? 
            ((monitor.width - (monitorData.reserved?.[1] ?? 0) - (monitorData.reserved?.[3] ?? 0)) * root.scale / monitor.scale) / 1.27:
            ((monitor.height - (monitorData.reserved?.[1] ?? 0) - (monitorData.reserved?.[3] ?? 0)) * root.scale / monitor.scale)/ 1.27
    }

    property real workspaceNumberMargin: 80
    property real workspaceNumberSize: Math.min(workspaceImplicitHeight, workspaceImplicitWidth) * (monitor?.scale ?? 1)
    property int workspaceZ: 0
    property int windowZ: 1
    property int windowDraggingZ: 99999
    property real workspaceSpacing: 5

    property int draggingFromWorkspace: -1
    property int draggingTargetWorkspace: -1

    
    anchors.fill: parent
    property Component windowComponent: OverviewWindow {}
    property list<OverviewWindow> windowWidgets: []

    ColumnLayout { // Workspaces
        id: workspaceColumnLayout
        anchors.fill: parent
        z: root.workspaceZ
        anchors.centerIn: parent
        spacing: workspaceSpacing
        Repeater {
            model: ConfigOptions.overview.numOfRows
            delegate: RowLayout {
                id: row
                property int rowIndex: index
                spacing: workspaceSpacing

                Repeater { // Workspace repeater
                    model: ConfigOptions.overview.numOfCols
                    Rectangle { // Workspace
                        id: workspace
                        property int colIndex: index
                        property int workspaceValue: root.workspaceGroup * workspacesShown + rowIndex * ConfigOptions.overview.numOfCols + colIndex + 1
                        property color defaultWorkspaceColor: ColorUtils.transparentize(Appearance.m3colors.m3secondaryContainer, 0.86) // TODO: reconsider this color for a cleaner look
                        property color hoveredWorkspaceColor: ColorUtils.mix(defaultWorkspaceColor, Appearance.colors.colLayer1Hover, 0.1)
                        property color hoveredBorderColor: Appearance.colors.colLayer2Hover
                        property bool hoveredWhileDragging: false

                        implicitWidth: root.workspaceImplicitWidth
                        implicitHeight: root.workspaceImplicitHeight
                        color: hoveredWhileDragging ? hoveredWorkspaceColor : defaultWorkspaceColor
                        radius: Appearance.rounding.screenRounding 
                        border.width: 2
                        border.color: hoveredWhileDragging ? hoveredBorderColor : "transparent"

                        StyledText {
                            anchors.centerIn: parent
                            text: workspaceValue
                            font.pixelSize: root.workspaceNumberSize * root.scale
                            font.weight: Font.DemiBold
                            color: ColorUtils.transparentize(Appearance.colors.colOnLayer1, 0.8)
                            horizontalAlignment: Text.AlignHCenter
                            verticalAlignment: Text.AlignVCenter
                        }

                        MouseArea {
                            id: workspaceArea
                            anchors.fill: parent
                            acceptedButtons: Qt.LeftButton
                            onClicked: {
                                if (root.draggingTargetWorkspace === -1) {
                                    // Hyprland.dispatch(`exec qs ipc call overview close`)
                                    GlobalStates.overviewOpen = false
                                    Hyprland.dispatch(`workspace ${workspaceValue}`)
                                }
                            }
                        }

                        DropArea {
                            anchors.fill: parent
                            onEntered: {
                                root.draggingTargetWorkspace = workspaceValue
                                if (root.draggingFromWorkspace == root.draggingTargetWorkspace) return;
                                hoveredWhileDragging = true
                            }
                            onExited: {
                                hoveredWhileDragging = false
                                if (root.draggingTargetWorkspace == workspaceValue) root.draggingTargetWorkspace = -1
                            }
                        }
                    }
                }
            }
        }
    }

    Item { // Windows & focused workspace indicator
        id: windowSpace
        anchors.centerIn: parent
        implicitWidth: workspaceColumnLayout.implicitWidth
        implicitHeight: workspaceColumnLayout.implicitHeight

        Repeater { // Window repeater
            model: ScriptModel {
                values: {
                    // console.log(JSON.stringify(ToplevelManager.toplevels.values.map(t => t), null, 2))
                    return ToplevelManager.toplevels.values.filter((toplevel) => {
                        const address = `0x${toplevel.HyprlandToplevel.address}`
                        // console.log(`Checking window with address: ${address}`)
                        var win = windowByAddress[address]
                        return win && win.workspace && (root.workspaceGroup * root.workspacesShown < win.workspace.id && win.workspace.id <= (root.workspaceGroup + 1) * root.workspacesShown)
                    })
                }
            }
            delegate: OverviewWindow {
                required property var modelData
                property var address: `0x${modelData.HyprlandToplevel.address}`
                id: window
                windowData: windowByAddress[address]
                toplevel: modelData
                monitorData: root.monitorData
                scale: 0.141
                availableWorkspaceWidth: root.workspaceImplicitWidth
                availableWorkspaceHeight: root.workspaceImplicitHeight

                property bool atInitPosition: (initX == x && initY == y)
                restrictToWorkspace: Drag.active || atInitPosition

                // Add null safety for workspace calculations
                property int workspaceColIndex: (windowData?.workspace?.id !== undefined) ? 
                    (windowData.workspace.id - 1) % ConfigOptions.overview.numOfCols : 0
                property int workspaceRowIndex: (windowData?.workspace?.id !== undefined) ? 
                    Math.floor((windowData.workspace.id - 1) % root.workspacesShown / ConfigOptions.overview.numOfCols) : 0
                    
                xOffset: (root.workspaceImplicitWidth + workspaceSpacing) * workspaceColIndex
                yOffset: (root.workspaceImplicitHeight + workspaceSpacing) * workspaceRowIndex

                Timer {
                    id: updateWindowPosition
                    interval: ConfigOptions.hacks.arbitraryRaceConditionDelay
                    repeat: false
                    running: false
                    onTriggered: {
                        // Add comprehensive null checks
                        if (windowData?.at && monitorData?.reserved && windowData.at.length >= 2 && monitorData.reserved.length >= 4) {
                            window.x = Math.round(Math.max((windowData.at[0] - monitorData.reserved[0]) * root.scale, 0) + xOffset)
                            window.y = Math.round(Math.max((windowData.at[1] - monitorData.reserved[1]) * root.scale, 0) + yOffset)
                        }
                    }
                }

                z: atInitPosition ? root.windowZ : root.windowDraggingZ
                Drag.hotSpot.x: targetWindowWidth / 2
                Drag.hotSpot.y: targetWindowHeight / 2
                MouseArea {
                    id: dragArea
                    anchors.fill: parent
                    hoverEnabled: true
                    onEntered: hovered = true // For hover color change
                    onExited: hovered = false // For hover color change
                    acceptedButtons: Qt.LeftButton | Qt.MiddleButton
                    drag.target: parent
                    onPressed: {
                        if (windowData?.workspace?.id !== undefined) {
                            root.draggingFromWorkspace = windowData.workspace.id
                        }
                        window.pressed = true
                        window.Drag.active = true
                        window.Drag.source = window
                    }
                    onReleased: {
                        const targetWorkspace = root.draggingTargetWorkspace
                        window.pressed = false
                        window.Drag.active = false
                        root.draggingFromWorkspace = -1
                        if (targetWorkspace !== -1 && windowData?.workspace?.id !== undefined && targetWorkspace !== windowData.workspace.id) {
                            Hyprland.dispatch(`movetoworkspacesilent ${targetWorkspace}, address:${window.windowData.address}`)
                            updateWindowPosition.restart()
                        }
                        else {
                            window.x = window.initX
                            window.y = window.initY
                        }
                    }
                    onClicked: (event) => {
                        if (!windowData) return;

                        if (event.button === Qt.LeftButton) {
                            GlobalStates.overviewOpen = false
                            Hyprland.dispatch(`focuswindow address:${windowData.address}`)
                            event.accepted = true
                        } else if (event.button === Qt.MiddleButton) {
                            Hyprland.dispatch(`closewindow address:${windowData.address}`)
                            event.accepted = true
                        }
                    }

                    StyledToolTip {
                        extraVisibleCondition: false
                        alternativeVisibleCondition: dragArea.containsMouse && !window.Drag.active
                        content: windowData ? `${windowData.title ?? ""}\n[${windowData.class ?? ""}] ${windowData.xwayland ? "[XWayland] " : ""}\n` : ""
                    }
                }
            }
        }

        Rectangle { // Focused workspace indicator
            id: focusedWorkspaceIndicator
            // Add null safety for active workspace calculations
            property int activeWorkspaceInGroup: (monitor?.activeWorkspace?.id !== undefined) ? 
                monitor.activeWorkspace.id - (root.workspaceGroup * root.workspacesShown) : 1
            property int activeWorkspaceRowIndex: Math.floor((activeWorkspaceInGroup - 1) / ConfigOptions.overview.numOfCols)
            property int activeWorkspaceColIndex: (activeWorkspaceInGroup - 1) % ConfigOptions.overview.numOfCols
            x: (root.workspaceImplicitWidth + workspaceSpacing) * activeWorkspaceColIndex
            y: (root.workspaceImplicitHeight + workspaceSpacing) * activeWorkspaceRowIndex
            z: root.windowZ
            width: root.workspaceImplicitWidth
            height: root.workspaceImplicitHeight
            color: "transparent"
            radius: Appearance.rounding.screenRounding 
            border.width: 2
            border.color: root.activeBorderColor
            Behavior on x {
                animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
            }
            Behavior on y {
                animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
            }
        }
    }
}