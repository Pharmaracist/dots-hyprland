import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "layouts"
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects
import Quickshell
import Quickshell.Wayland
import Quickshell.Hyprland
import Quickshell.Services.Mpris



Scope {
    id: bar

    // Core properties
    readonly property int barHeight: Appearance.sizes.barHeight
    readonly property int barCenterSideModuleWidth: Appearance.sizes.barCenterSideModuleWidth
    readonly property bool showBarBackground: ConfigOptions.bar.showBackground
    readonly property string barPosition: ConfigOptions.bar.position
    readonly property var barLayouts: ConfigOptions.bar.availableLayouts
    
    // Layout properties
    property int currentBarLayout: getInitialLayout()
    property bool isTransitioning: false
    
    // Layout switching function
    function switchLayout(direction) {
        if (!ConfigOptions.bar.enableLayoutSwitching || isTransitioning) return;
        
        isTransitioning = true;
        
        // Update layout index
        if (direction === "next") {
            currentBarLayout = (currentBarLayout + 1) % barLayouts.length;
        } else if (direction === "prev") {
            currentBarLayout = (currentBarLayout - 1 + barLayouts.length) % barLayouts.length;
        }
        
        // Show notification and reset transition state
        Hyprland.dispatch('global quickshell:notification "Bar Layout: ' + barLayouts[currentBarLayout] + '"');
        Qt.callLater(function() { isTransitioning = false; });
    }
    
    // Get initial layout index
    function getInitialLayout() {
        const index = barLayouts.indexOf(ConfigOptions.bar.defaultLayout);
        return index >= 0 ? index : 0;
    }
    
    // Legacy methods for compatibility
    function switchToNextLayout() { switchLayout("next"); }
    function switchToPreviousLayout() { switchLayout("prev"); }

    // Basic handler for layout commands
    Connections {
        target: Hyprland
        
        function onDispatch(args) {
            const dispatch = args.join(" ");
            
            if (dispatch === "global quickshell:barlayout next") {
                switchLayout("next");
            } else if (dispatch === "global quickshell:barlayout prev") {
                switchLayout("prev");
            }
        }
    }
    
    Variants { // For each monitor
        model: Quickshell.screens

        PanelWindow { // Bar window
            id: barRoot

            property ShellScreen modelData
            property var brightnessMonitor: Brightness.getMonitorForScreen(modelData)

            screen: modelData
            WlrLayershell.namespace: "quickshell:bar"
            implicitHeight: barHeight + Appearance.rounding.screenRounding
            exclusiveZone: showBarBackground ? barHeight : (barHeight - 4)
            mask: Region {
                item: barContent
            }
            color: "transparent"

            anchors {
                left: true
                right: true
                top: barPosition === "top"
                bottom: barPosition === "bottom"
            }

            Rectangle { // Bar background
                id: barContent
                anchors.right: parent.right
                anchors.left: parent.left
                anchors.top: barPosition === "top" ? parent.top : undefined
                anchors.bottom: barPosition === "bottom" ? parent.bottom : undefined
                color: showBarBackground ? Appearance.colors.colLayer0 : "transparent"
                height: barHeight
                
                // Layout switching enabled without visual indicator
                
                // Simple mouse area for layout switching with middle click
                MouseArea {
                    anchors.fill: parent
                    acceptedButtons: Qt.MiddleButton
                    enabled: ConfigOptions.bar.enableLayoutSwitching
                    onClicked: {
                        switchLayout("next");
                    }
                    

                }
                
                // Stack layout for different bar layouts
                StackLayout {
                    id: barLayoutStack
                    anchors.fill: parent
                    currentIndex: bar.currentBarLayout
                    opacity: bar.isTransitioning ? 0.8 : 1.0
                    
                    Behavior on opacity {
                        NumberAnimation { duration: 100 }
                    }
                
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
                        active: bar.currentBarLayout === 1 || (ConfigOptions.bar.preloadAllLayouts === true)
                        sourceComponent: MinimalLayout {}
                        onLoaded: {
                            item.barRoot = barRoot;
                        }
                    }
                    
                    // Layout 3: Media Layout (lazy-loaded)
                    Loader {
                        id: mediaLayoutLoader
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        asynchronous: true
                        active: bar.currentBarLayout === 2 || (ConfigOptions.bar.preloadAllLayouts === true)
                        sourceComponent: MediaLayout {}
                        onLoaded: {
                            item.barRoot = barRoot;
                        }
                    }
                }
            }

            // Basic layout shortcut (original one from config)
            Shortcut {
                sequence: ConfigOptions.bar.layoutSwitchShortcut
                enabled: ConfigOptions.bar.enableLayoutSwitching
                onActivated: switchLayout("next")
            }
            
            // Round decorators
            Item {
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.top: barPosition === "top" ? barContent.bottom : undefined
                anchors.bottom: barPosition === "bottom" ? barContent.top : undefined
                height: Appearance.rounding.screenRounding

                RoundCorner {
                    anchors.top: barPosition === "top" ? parent.top : undefined
                    anchors.bottom: barPosition === "bottom" ? parent.bottom : undefined
                    anchors.left: parent.left
                    size: Appearance.rounding.screenRounding
                    corner: barPosition === "top" ? cornerEnum.topLeft : cornerEnum.bottomLeft
                    color: showBarBackground ? Appearance.colors.colLayer0 : "transparent"
                }
                RoundCorner {
                    anchors.top: barPosition === "top" ? parent.top : undefined
                    anchors.bottom: barPosition === "bottom" ? parent.bottom : undefined
                    anchors.right: parent.right
                    size: Appearance.rounding.screenRounding
                    corner: barPosition === "top" ? cornerEnum.topRight : cornerEnum.bottomRight
                    color: showBarBackground ? Appearance.colors.colLayer0 : "transparent"
                }
            }

        }

    }
    }
