import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Services.Mpris
import Quickshell.Wayland
import "layouts"
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

Scope {
    id: bar

    readonly property int barHeight: Appearance.sizes.barHeight
        readonly property int barCenterSideModuleWidth: Appearance.sizes.barCenterSideModuleWidth
            readonly property string barPosition: ConfigOptions.bar.position
                readonly property bool showOnMainScreenOnly: ConfigOptions.bar.showOnMainScreenOnly || false
                    readonly property var barLayouts: ["default", "minimal", "media", "floating", "knocks"]
                    readonly property var standardLayouts: ["default", "minimal"]
                    property int currentBarLayout: PersistentStates.bar.currentLayout
                        property bool isTransitioning: false
                            readonly property bool isCurrentLayoutStandard: standardLayouts.includes(barLayouts[currentBarLayout])
                            readonly property int currentExclusiveZone: !isCurrentLayoutStandard ? barHeight + Appearance.sizes.floatingMargin : barHeight
                                readonly property int transitionDuration: Appearance.animation.elementMoveFast.duration
                                    readonly property int transitionEasing: Appearance.animation.elementMoveFast.type
                                        readonly property var transitionBezier: Appearance.animation.elementMoveFast.bezierCurve

                                            // Layout switching
                                            function switchLayout(direction)
                                            {
                                                isTransitioning = true;
                                                const nextIndex = (currentBarLayout + (direction === "next" ? 1 : -1) + barLayouts.length) % barLayouts.length;
                                                PersistentStateManager.setState("bar.currentLayout", nextIndex);
                                                transitionTimer.restart();
                                            }

                                            Component.onCompleted: {
                                                if (PersistentStates.bar.currentLayout === -1)
                                                    PersistentStateManager.setState("bar.currentLayout", 0);

                                            }

                                            Timer {
                                                id: transitionTimer

                                                interval: transitionDuration
                                                repeat: false
                                                onTriggered: isTransitioning = false
                                            }

                                            GlobalShortcut {
                                                name: "barLayoutSwitch"
                                                description: qsTr("Switch bar layout")
                                                onPressed: switchLayout("next")
                                            }

                                            GlobalShortcut {
                                                name: "barLayoutSwitchPrevious"
                                                description: qsTr("Switch bar layout")
                                                onPressed: switchLayout("previous")
                                            }

                                            Connections {
                                                function onCurrentLayoutChanged()
                                                {
                                                    currentBarLayout = PersistentStates.bar.currentLayout;
                                                }

                                                target: PersistentStates.bar
                                            }

                                            Variants {
                                                model: showOnMainScreenOnly ? [Quickshell.screens[0]] : Quickshell.screens

                                                PanelWindow {
                                                    // mask: Region {
                                                    //     item: barContent
                                                    // }

                                                    id: barRoot

                                                    property ShellScreen modelData
                                                    property var brightnessMonitor: Brightness.getMonitorForScreen(modelData)

                                                    screen: showOnMainScreenOnly ? Quickshell.screens[0] : modelData
                                                    WlrLayershell.namespace: "quickshell:bar"
                                                    implicitHeight: barHeight + Appearance.rounding.screenRounding
                                                    exclusiveZone: currentExclusiveZone
                                                    color: "transparent"

                                                    anchors {
                                                        left: true
                                                        right: true
                                                        top: barPosition === "top"
                                                        bottom: barPosition === "bottom"
                                                    }

                                                    Item {
                                                        id: barContent

                                                        readonly property real floatingOffset: !isCurrentLayoutStandard ? Appearance.sizes.floatingMargin : 0

                                                            height: barHeight

                                                            anchors {
                                                                right: parent.right
                                                                left: parent.left
                                                                top: barPosition === "top" ? parent.top : undefined
                                                                bottom: barPosition === "bottom" ? parent.bottom : undefined
                                                                topMargin: barPosition === "top" ? floatingOffset : 0
                                                                bottomMargin: barPosition === "bottom" ? floatingOffset : 0
                                                                leftMargin: floatingOffset * 3
                                                                rightMargin: floatingOffset * 3
                                                            }

                                                            MouseArea {
                                                                anchors.fill: parent
                                                                acceptedButtons: Qt.MiddleButton
                                                                onClicked: switchLayout("next")
                                                            }

                                                            StackLayout {
                                                                // Default layout (always loaded)

                                                                id: barLayoutStack

                                                                anchors.fill: parent
                                                                currentIndex: currentBarLayout
                                                                opacity: isTransitioning ? 0.85 : 1

                                                                DefaultLayout {
                                                                    Layout.fillWidth: true
                                                                    Layout.fillHeight: true
                                                                    barRoot: barRoot
                                                                    visible: currentBarLayout === 0
                                                                }

                                                                MinimalLayout {
                                                                    Layout.fillWidth: true
                                                                    Layout.fillHeight: true
                                                                    barRoot: barRoot
                                                                    visible: currentBarLayout === 1
                                                                }

                                                                MediaLayout {
                                                                    Layout.fillWidth: true
                                                                    Layout.fillHeight: true
                                                                    barRoot: barRoot
                                                                    visible: currentBarLayout === 2
                                                                }

                                                                FloatingLayout {
                                                                    Layout.fillWidth: true
                                                                    Layout.fillHeight: true
                                                                    barRoot: barRoot
                                                                    visible: currentBarLayout === 3
                                                                }

                                                                KnocksLayout {
                                                                    Layout.fillWidth: true
                                                                    Layout.fillHeight: true
                                                                    barRoot: barRoot
                                                                    visible: currentBarLayout === 4
                                                                }

                                                                Behavior on opacity {
                                                                NumberAnimation {
                                                                    duration: transitionDuration
                                                                    easing.type: transitionEasing
                                                                    easing.bezierCurve: transitionBezier
                                                                }

                                                            }

                                                            transform: Scale {
                                                                id: layoutScale

                                                                origin.x: barLayoutStack.width / 2
                                                                origin.y: barLayoutStack.height / 2
                                                                xScale: isTransitioning ? 0.78 : 1
                                                                yScale: isTransitioning ? 0.78 : 1

                                                                Behavior on xScale {
                                                                NumberAnimation {
                                                                    duration: transitionDuration
                                                                    easing.type: transitionEasing
                                                                    easing.bezierCurve: transitionBezier
                                                                }

                                                            }

                                                            Behavior on yScale {
                                                            NumberAnimation {
                                                                duration: transitionDuration
                                                                easing.type: transitionEasing
                                                                easing.bezierCurve: transitionBezier
                                                            }

                                                        }

                                                    }

                                                }

                                            }

                                            Item {
                                                id: cornerDecorators

                                                property bool shouldBeVisible: {
                                                    if (!barLayouts || !Array.isArray(standardLayouts))
                                                        return true;

                                                    if (currentBarLayout < 0 || currentBarLayout >= barLayouts.length)
                                                        return true;

                                                    return isCurrentLayoutStandard;
                                                }

                                                height: Appearance.rounding.screenRounding
                                                visible: shouldBeVisible

                                                anchors {
                                                    left: parent.left
                                                    right: parent.right
                                                    top: barPosition === "top" ? barContent.bottom : undefined
                                                    bottom: barPosition === "bottom" ? barContent.top : undefined
                                                }

                                                RoundCorner {
                                                    size: Appearance.rounding.screenRounding
                                                    corner: barPosition === "top" ? cornerEnum.topLeft : cornerEnum.bottomLeft
                                                    color: Appearance.colors.colLayer0

                                                    anchors {
                                                        top: barPosition === "top" ? parent.top : undefined
                                                        bottom: barPosition === "bottom" ? parent.bottom : undefined
                                                        left: parent.left
                                                    }

                                                }

                                                RoundCorner {
                                                    size: Appearance.rounding.screenRounding
                                                    corner: barPosition === "top" ? cornerEnum.topRight : cornerEnum.bottomRight
                                                    color: Appearance.colors.colLayer0

                                                    anchors {
                                                        top: barPosition === "top" ? parent.top : undefined
                                                        bottom: barPosition === "bottom" ? parent.bottom : undefined
                                                        right: parent.right
                                                    }

                                                }

                                            }

                                        }

                                    }

                                }
