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

    // Core properties
    readonly property int barHeight: Appearance.sizes.barHeight
    readonly property int barCenterSideModuleWidth: Appearance.sizes.barCenterSideModuleWidth
    readonly property string barPosition: ConfigOptions.bar.position
    readonly property bool showOnMainScreenOnly: ConfigOptions.bar.showOnMainScreenOnly || false
    // Layout definitions
    readonly property var barLayouts: ["default", "minimal", "media", "none", "floating", "knocks"]
    readonly property var layoutsWithCorners: ["minimal", "default"]
    readonly property var floatingLayouts: ["floating", "media", "knocks"]
    // Layout properties
    property int currentBarLayout: PersistentStates.bar.currentLayout
    property bool isTransitioning: false
    // Animation properties
    property int transitionDuration: 200
    property int fadeOutDuration: 100
    property int fadeInDuration: 100

    // Layout switching with animation
    function switchLayout(direction) {
        if (!PersistentStates.bar.enableLayoutSwitching)
            return ;

        isTransitioning = true;
        PersistentStateManager.setState("bar.currentLayout", (currentBarLayout + (direction === "next" ? 1 : -1) + barLayouts.length) % barLayouts.length);
        transitionTimer.restart();
    }

    Component.onCompleted: {
        Object.assign(PersistentStates.bar, {
            "availableLayouts": barLayouts,
            "layoutsWithCorners": layoutsWithCorners,
            "floatingLayouts": floatingLayouts
        });
        if (PersistentStates.bar.currentLayout === -1)
            PersistentStateManager.setState("bar.currentLayout", 0);

    }

    Timer {
        id: transitionTimer

        interval: Appearance.animation.elementMoveFast.duration
        repeat: false
        onTriggered: isTransitioning = false
    }

    // Keybinding for layout switching
    GlobalShortcut {
        name: "barLayoutSwitch"
        description: qsTr("Switch bar layout")
        onPressed: {
            switchLayout("next");
        }
    }

    // Watch for persistent state changes
    Connections {
        function onCurrentLayoutChanged() {
            currentBarLayout = PersistentStates.bar.currentLayout;
        }

        target: PersistentStates.bar
    }

    // For each monitor
    Variants {
        model: Quickshell.screens

        // Bar window
        PanelWindow {
            id: barRoot

            property ShellScreen modelData
            property var brightnessMonitor: Brightness.getMonitorForScreen(modelData)

            screen: modelData
            WlrLayershell.namespace: "quickshell:bar"
            implicitHeight: barHeight + Appearance.rounding.screenRounding
            exclusiveZone: barLayouts[currentBarLayout] === 'none' ? 0 : (bar.floatingLayouts.includes(barLayouts[currentBarLayout]) ? barHeight + Appearance.sizes.floatingMargin : barHeight)
            color: "transparent"

            anchors {
                left: true
                right: true
                top: barPosition === "top"
                bottom: barPosition === "bottom"
            }

            // Bar content container
            Item {
                id: barContent

                anchors.right: parent.right
                anchors.left: parent.left
                anchors.top: barPosition === "top" ? parent.top : undefined
                anchors.bottom: barPosition === "bottom" ? parent.bottom : undefined
                height: barLayouts[currentBarLayout] === 'none' ? 0 : barHeight
                // Special handling for floating layouts
                anchors.topMargin: bar.floatingLayouts.includes(barLayouts[currentBarLayout]) && barPosition === "top" ? Appearance.sizes.floatingMargin : 0
                anchors.bottomMargin: bar.floatingLayouts.includes(barLayouts[currentBarLayout]) && barPosition === "bottom" ? Appearance.sizes.floatingMargin : 0
                anchors.leftMargin: bar.floatingLayouts.includes(barLayouts[currentBarLayout]) ? Appearance.sizes.floatingMargin : 0
                anchors.rightMargin: bar.floatingLayouts.includes(barLayouts[currentBarLayout]) ? Appearance.sizes.floatingMargin : 0

                // Simple mouse area for layout switching with middle click
                MouseArea {
                    anchors.fill: parent
                    acceptedButtons: Qt.MiddleButton
                    enabled: PersistentStates.bar.enableLayoutSwitching
                    onClicked: {
                        switchLayout("next");
                    }
                }

                // Stack layout for different bar layouts
                StackLayout {
                    id: barLayoutStack

                    anchors.fill: parent
                    currentIndex: bar.currentBarLayout
                    opacity: bar.isTransitioning ? 0.85 : 1

                    // Layout 1: Default Layout
                    DefaultLayout {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        barRoot: barRoot
                    }

                    // Layout 2: Minimal Layout (lazy-loaded)
                    Loader {
                        id: minimalLayoutLoader

                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        asynchronous: true
                        active: bar.currentBarLayout === 1 || ConfigOptions.bar.preloadAllLayouts
                        onLoaded: {
                            item.barRoot = barRoot;
                        }

                        sourceComponent: MinimalLayout {
                        }

                    }

                    // Layout 3: Media Layout (lazy-loaded)
                    Loader {
                        id: mediaLayoutLoader

                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        asynchronous: true
                        active: bar.currentBarLayout === 2 || ConfigOptions.bar.preloadAllLayouts
                        onLoaded: {
                            item.barRoot = barRoot;
                        }

                        sourceComponent: MediaLayout {
                        }

                    }

                    // Layout 4: None Layout (lazy-loaded)
                    Loader {
                        id: noneLayoutLoader

                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        asynchronous: true
                        active: bar.currentBarLayout === 3 || ConfigOptions.bar.preloadAllLayouts
                        onLoaded: {
                            item.barRoot = barRoot;
                        }

                        sourceComponent: NoneLayout {
                        }

                    }

                    // Layout 5: Floating Layout (lazy-loaded)
                    Loader {
                        id: floatingLayoutLoader

                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        asynchronous: true
                        active: bar.currentBarLayout === 4 || ConfigOptions.bar.preloadAllLayouts
                        onLoaded: {
                            item.barRoot = barRoot;
                        }

                        sourceComponent: FloatingLayout {
                        }

                    }

                    // Layout 6: Knocks Layout (lazy-loaded)
                    Loader {
                        id: knocksLayoutLoader

                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        asynchronous: true
                        active: bar.currentBarLayout === 5 || ConfigOptions.bar.preloadAllLayouts
                        onLoaded: {
                            item.barRoot = barRoot;
                        }

                        sourceComponent: KnocksLayout {
                        }

                    }

                    // Add scale and opacity behaviors
                    Behavior on opacity {
                        NumberAnimation {
                            duration: Appearance.animation.elementMoveFast.duration
                            easing.type: Appearance.animation.elementMoveFast.type
                            easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
                        }

                    }

                    transform: Scale {
                        id: layoutScale

                        origin.x: barLayoutStack.width / 2
                        origin.y: barLayoutStack.height / 2
                        xScale: bar.isTransitioning ? 0.97 : 1
                        yScale: bar.isTransitioning ? 0.97 : 1

                        Behavior on xScale {
                            NumberAnimation {
                                duration: Appearance.animation.elementMoveFast.duration
                                easing.type: Appearance.animation.elementMoveFast.type
                                easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
                            }

                        }

                        Behavior on yScale {
                            NumberAnimation {
                                duration: Appearance.animation.elementMoveFast.duration
                                easing.type: Appearance.animation.elementMoveFast.type
                                easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
                            }

                        }

                    }

                }

            }

            // Round decorators
            Item {
                property bool shouldBeVisible: {
                    // Use a completely defensive approach to avoid any undefined errors
                    if (!barLayouts)
                        return true;

                    if (!Array.isArray(bar.layoutsWithCorners))
                        return true;

                    if (currentBarLayout < 0 || currentBarLayout >= barLayouts.length)
                        return true;

                    const currentLayout = barLayouts[currentBarLayout];
                    if (!currentLayout)
                        return true;

                    return bar.layoutsWithCorners.indexOf(currentLayout) >= 0;
                }

                anchors.left: parent.left
                anchors.right: parent.right
                anchors.top: barPosition === "top" ? barContent.bottom : undefined
                anchors.bottom: barPosition === "bottom" ? barContent.top : undefined
                height: Appearance.rounding.screenRounding
                opacity: shouldBeVisible ? 1 : 0
                visible: opacity > 0

                RoundCorner {
                    anchors.top: barPosition === "top" ? parent.top : undefined
                    anchors.bottom: barPosition === "bottom" ? parent.bottom : undefined
                    anchors.left: parent.left
                    size: Appearance.rounding.screenRounding
                    corner: barPosition === "top" ? cornerEnum.topLeft : cornerEnum.bottomLeft
                    color: Appearance.colors.colLayer0
                }

                RoundCorner {
                    anchors.top: barPosition === "top" ? parent.top : undefined
                    anchors.bottom: barPosition === "bottom" ? parent.bottom : undefined
                    anchors.right: parent.right
                    size: Appearance.rounding.screenRounding
                    corner: barPosition === "top" ? cornerEnum.topRight : cornerEnum.bottomRight
                    color: Appearance.colors.colLayer0
                }

                Behavior on opacity {
                    NumberAnimation {
                        duration: Appearance.animation.elementMoveFast.duration
                        easing.type: Appearance.animation.elementMoveFast.type
                        easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
                    }

                }

            }

            mask: Region {
                item: barContent
            }

        }

    }

}
