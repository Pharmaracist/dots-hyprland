import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Widgets
import Quickshell.Wayland
import Quickshell.Hyprland
import "root:/GlobalStates.qml" as GlobalStates
import "root:/modules/common/functions/string_utils.js" as StringUtils
import "root:/modules/bar/components/" 
Scope {
    id: root
    property bool visible: false
    readonly property real osdWidth: Appearance.sizes.osdWidth
    readonly property real widgetWidth: Appearance.sizes.mediaControlsWidth
    readonly property real widgetHeight: Appearance.sizes.mediaControlsHeight
    property real contentPadding: 13
    property real popupRounding: Appearance.rounding.screenRounding - Appearance.sizes.elevationMargin + 1
    // Layout constants
    readonly property real horizontalPadding: 20
    readonly property real verticalPadding: 10
    readonly property real elementSpacing: 5

    Loader {
        id: glanceLoader
        active: false

        sourceComponent: PanelWindow {
            id: glanceRoot
            visible: glanceLoader.active

            exclusiveZone: 0
            implicitWidth: widgetWidth
            implicitHeight: widgetHeight + 30 // 30 is the margin from the top of the bar
            color: "transparent"
            WlrLayershell.namespace: "quickshell:glance"

            anchors {
                top: true
                right: true
                left: true

            }

            Rectangle {
                id: background
                implicitWidth: Appearance.sizes.mediaControlsWidth
                implicitHeight: contentContainer.implicitHeight +20
                color: Appearance.colors.colLayer1
                radius: Appearance.rounding.windowRounding
                anchors.rightMargin: widgetWidth
                anchors.right: parent.right
                anchors.top: parent.top
                anchors.topMargin: Appearance.sizes.elevationMargin

                Behavior on color {
                    ColorAnimation {
                        duration: Appearance.animation.elementMoveFast.duration
                        easing.type: Appearance.animation.elementMoveFast.type
                        easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
                    }
                }

                layer.enabled: true
                layer.effect: DropShadow {
                    transparentBorder: true
                    horizontalOffset: 0
                    verticalOffset: Appearance.sizes.fabShadowRadius
                    radius: Appearance.sizes.fabShadowRadius * 2
                    samples: 17
                    color: Appearance.colors.colShadow
                }

                Rectangle {
                    id: innerShadow
                    anchors.fill: parent
                    radius: Appearance.rounding.windowRounding
                    color: "transparent"
                    border.color: Appearance.colors.colOnLayer1
                    border.width: 1
                    opacity: 0.1
                }

                // Common styles for indicator boxes
                Component {
                    id: indicatorBox
                    RippleButton {
                        property alias content: loader.sourceComponent
                        property string type
                        buttonRadius: Appearance.rounding.small
                        implicitHeight: 30
                        colBackground: Appearance.colors.colLayer2
                        colBackgroundHover: Appearance.colors.colLayer2Hover
                        colBackgroundToggled: Appearance.colors.colLayer2Active
                        colRipple: Appearance.colors.colLayer2Active

                        onClicked: {
                            if (type === "tasks") {
                                Hyprland.dispatch("global quickshell:sidebarRightOpen")
                                GlobalStates.sidebarRight.todoExpanded = true;
                                Hyprland.dispatch("global quickshell:glanceClose")
                                Notifications.timeoutAll();
                            }
                        }

                        Loader {
                            id: loader
                            anchors.centerIn: parent
                        }
                    }
                }
        Component {
                id: weatherContent
                    
                    Rectangle {
                        id: weatherButton
                        anchors.centerIn: parent
                        color: Appearance.colors.colLayer2
                        implicitWidth: 80
                        implicitHeight: 30
                        radius: Appearance.rounding.small
                    
                    Weather {
                        anchors.centerIn: parent
                    }
                }
                
            }     
                Item {
                    id: contentContainer
                    anchors.fill: parent
                    anchors.margins: root.horizontalPadding
            
                    implicitWidth: Math.max(logo.width + root.horizontalPadding, 
                                          glanceColumnLayout.implicitWidth + indicatorsRow.implicitWidth + root.horizontalPadding)
                    implicitHeight: Math.max(logo.height,
                                           glanceColumnLayout.implicitHeight + indicatorsRow.implicitHeight + root.verticalPadding)

                    RowLayout {
                        id: indicatorsRow

                        anchors {
                            top: parent.top
                            left: parent.left
                            leftMargin:-10
                        }
                        spacing: root.elementSpacing

                        Loader {
                            id: tasksLoader
                            sourceComponent: indicatorBox
                            onLoaded: {
                                item.implicitWidth = 80
                                item.content = tasksContent
                                item.type = "tasks"
                            }
                        }

                        Loader {
                            id: notificationsLoader
                            sourceComponent: indicatorBox
                            onLoaded: {
                                item.implicitWidth = 80
                                item.content = notificationsContent
                                item.type = "notifications"
                            }
                        }
                        Loader {
                            id: weatherLoader
                            sourceComponent: weatherContent
                        }
                    }

                    CustomIcon {
                        id: logo
                        anchors.right: parent.right
                        anchors.bottom: parent.bottom
                        source: SystemInfo.distroIcon
                        width: background.implicitHeight * 0.7
                        height: background.implicitHeight * 0.7
                        antialiasing: true
                        layer {
                            enabled: true
                            smooth: true
                            effect: ColorOverlay {
                                anchors.fill: logo
                                source: logo
                                color: Appearance.colors.colOnLayer1
                            }
                            
                        }
                    }

                    RowLayout {
                        id: glanceColumnLayout
                        anchors {
                            bottom: logo.bottom
                            left: parent.left
                        }
                        spacing: root.elementSpacing

                        ColumnLayout {
                            id: columnLayout
                            spacing: root.elementSpacing
                            Layout.topMargin: 25
                            Loader {
                                sourceComponent: commonText
                                onLoaded: {
                                    item.font.pixelSize = Appearance.font.pixelSize.title + 10
                                    item.color = Appearance.colors.colOnLayer2
                                    item.text = DateTime.time
                                }
                            }

                            Loader {
                                sourceComponent: commonText
                                onLoaded: {
                                    item.font.pixelSize = Appearance.font.pixelSize.larger
                                    item.text = DateTime.date
                                }
                            }

                            Loader {
                                sourceComponent: commonText
                                onLoaded: {
                                    item.font.pixelSize = Appearance.font.pixelSize.smaller
                                    item.text = StringUtils.format(qsTr("Uptime: {0}"), DateTime.uptime)
                                    item.textFormat = Text.MarkdownText
                                }
                            }
                        }
                    }
                }
            }

            // Common text style
            Component {
                id: commonText
                StyledText {
                    font.family: Appearance.font.family.niche
                    color: Appearance.colors.colOnLayer1
                }
            }

            // Content components for indicators
            Component {
                id: tasksContent
                RowLayout {
                    anchors.top: parent.top
                    id: tasksRow
                    spacing: root.elementSpacing
                    property int remainingTasks: Todo.list.filter(task => !task.done).length

                    MaterialSymbol {
                        text: "inventory"
                        iconSize: Appearance.font.pixelSize.larger
                        color: parent.parent.hovered ? Appearance.colors.colOnLayer2Hover :
                               Appearance.colors.colOnLayer2
                    }

                    StyledText {
                        font.family: Appearance.font.family.niche
                        color: parent.parent.hovered ? Appearance.colors.colOnLayer2Hover :
                               Appearance.colors.colOnLayer2
                        font.pixelSize: Appearance.font.pixelSize.large
                        text: tasksRow.remainingTasks
                    }
                }
            }

            Component {
                id: notificationsContent
                RowLayout {
                    anchors.top: parent.top
                    id: notificationsRow
                    spacing: root.elementSpacing

                    MaterialSymbol {
                        text: "notifications"
                        iconSize: Appearance.font.pixelSize.large
                        color: parent.parent.hovered ? Appearance.colors.colOnLayer2Hover :
                               Appearance.colors.colOnLayer2
                    }

                    StyledText {
                        font.family: Appearance.font.family.niche
                        color: parent.parent.hovered ? Appearance.colors.colOnLayer2Hover :
                               Appearance.colors.colOnLayer2
                        font.pixelSize: Appearance.font.pixelSize.large
                        text: Notifications.list.length
                   
                    }
                }
                
            }
           
            mask: Region {
                item: glanceColumnLayout
            }
        }
    }

    IpcHandler {
        target: "glance"

        function toggle(): void {
            glanceLoader.active = !glanceLoader.active;
            if(glanceLoader.active) Notifications.timeoutAll();
        }

        function close(): void {
            glanceLoader.active = false;
        }

        function open(): void {
            glanceLoader.active = true;
            Notifications.timeoutAll();
        }
    }

    GlobalShortcut {
        name: "glanceToggle"
        description: qsTr("Toggles glance on press")

        onPressed: {
            glanceLoader.active = !glanceLoader.active;
            if(glanceLoader.active) Notifications.timeoutAll();
        }
    }
    GlobalShortcut {
        name: "glanceOpen"
        description: qsTr("Opens glance on press")

        onPressed: {
            glanceLoader.active = true;
            Notifications.timeoutAll();
        }
    }
    GlobalShortcut {
        name: "glanceClose"
        description: qsTr("Closes glance on press")

        onPressed: {
            glanceLoader.active = false;
        }
    }
}