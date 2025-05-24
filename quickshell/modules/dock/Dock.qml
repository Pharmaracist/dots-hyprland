import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Wayland
import Qt5Compat.GraphicalEffects
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "root:/modules/common/functions/icons.js" as Icons
import Qt.labs.platform

Scope {
    id: dock

    // Dock dimensions and appearance
    readonly property int dockHeight: Appearance.sizes.barHeight * 1.5
    readonly property int dockWidth: Appearance.sizes.barHeight * 1.5
    readonly property int dockSpacing: Appearance.sizes.elevationMargin
    
    
    // Auto-hide properties
    property bool autoHide: true
    property int hideDelay: 200 // Hide timer interval
    property int showDelay: 50 // Show timer interval
    property int animationDuration: Appearance.animation.elementMoveFast.duration // Animation speed for dock sliding
    property int approachRegionHeight: 18 // Height of the approach region in pixels
    property var menuHeight : dockHeight * 0.9
    property var activeWindows: []
    property var dockRoot
    property var dockContainer
    // Property to track if mouse is over any dock item
    property bool mouseOverDockItem: false
    
    // Default pinned apps to use if no saved settings exist
    readonly property var defaultPinnedApps: [
        "nautilus",
        "clocks",
        "obsidian",
        "lollypop",
]
    
    // Pinned apps list - will be loaded from file
    property var pinnedApps: []
    
    // Settings file path
    property string configFilePath: `${XdgDirectories.cache}/dock_config.json`
    function saveConfig() {
        var config = {
            pinnedApps: pinnedApps,
            autoHide: autoHide
        }
        dockConfigView.setText(JSON.stringify(config, null, 2))
        console.log("[Dock] Config file path: " + configFilePath)
    }
    
    function savePinnedApps() {
        saveConfig()
    }
    
    // Toggle dock auto-hide (exclusive mode)
    function toggleDockExclusive() {
        // Toggle auto-hide state
        autoHide = !autoHide
        
        // If we're toggling to pinned mode (auto-hide off), ensure the dock is visible
        if (!autoHide) {
            // Force show the dock
            if (dockContainer) {
                dockContainer.y = dockRoot.height - dockHeight
                // Stop any hide timers
                hideTimer.stop()
            }
        }
        
        // Save the configuration
        saveConfig()
    }
       function addPinnedApp(appClass) {
        // Check if app is already pinned
        if (!pinnedApps.includes(appClass)) {
            // Create a new array to trigger QML reactivity
            var newPinnedApps = pinnedApps.slice()
            newPinnedApps.push(appClass)
            pinnedApps = newPinnedApps
            savePinnedApps()
        }
    }
    
    function removePinnedApp(appClass) {
        var index = pinnedApps.indexOf(appClass)
        if (index !== -1) {
            var newPinnedApps = pinnedApps.slice()
            newPinnedApps.splice(index, 1)
            pinnedApps = newPinnedApps
            savePinnedApps()
        }
    }
    
    // FileView for persistence
    FileView {
        id: dockConfigView
        path: configFilePath
        
        onLoaded: {
            try {
                const fileContents = dockConfigView.text()
                const config = JSON.parse(fileContents)
                if (config) {
                    // Load pinned apps
                    if (config.pinnedApps) {
                        dock.pinnedApps = config.pinnedApps.filter(function(app) {
                            return typeof app === "string" && app.trim() !== ""
                        })
                    }
                    
                    // Load auto-hide setting if available
                    if (config.autoHide !== undefined) {
                        dock.autoHide = config.autoHide
                    }
                }
            } catch (e) {
                console.log("[Dock] Error parsing config: " + e)
                dock.pinnedApps = defaultPinnedApps
                savePinnedApps()
            }
        }
        
        onLoadFailed: (error) => {
            console.log("[Dock] Config load failed: " + error)
            dock.pinnedApps = defaultPinnedApps
            savePinnedApps()
        }
    }
    
    Component.onCompleted: {
        // Load config when component is ready
        dockConfigView.reload()
    }
    
    Variants {
        model: Quickshell.screens

        PanelWindow {
            id: dockRoot
            margins {
                top: Appearance.sizes.elevationMargin
                bottom: Appearance.sizes.elevationMargin
            }
            property ShellScreen modelData
            
            screen: modelData
            WlrLayershell.namespace: "quickshell:dock"
            implicitHeight: dockHeight
            implicitWidth: dockItemsLayout.implicitWidth + Appearance.rounding.screenRounding * 2
            
            // Basic configuration - never take keyboard focus to avoid interfering with other windows
            WlrLayershell.layer: WlrLayer.Top
            exclusiveZone: 0
            WlrLayershell.keyboardFocus: WlrKeyboardFocus.None
            // WlrLayershell.keyboard_interactivity: WlrKeyboardInteractivity.None
            
            // Track active windows
            property var activeWindows: []
            
            // Update when window list changes
            Connections {
                target: HyprlandData
                function onWindowListChanged() { updateActiveWindows() }
            }
            
            Component.onCompleted: {
                updateActiveWindows()
                refreshTimer.start() // Fallback timer
                
                // Initialize dock position based on auto-hide setting
                if (dock.autoHide && dockContent) {
                    // Use the actual panel height instead of parent.height
                    dockContent.y = dockRoot.height 
                }
            }
            
            Timer {
                id: refreshTimer
                interval: 2000
                repeat: true
                onTriggered: updateActiveWindows()
            }
            
            function updateActiveWindows() {
                try {
                    // Get mapped and non-hidden windows
                    activeWindows = HyprlandData.windowList
                        .filter(w => w.mapped && !w.hidden)
                        .map(w => ({
                            class: w.class,
                            title: w.title,
                            command: w.class.toLowerCase(),
                            address: w.address,
                            pid: w.pid,
                            workspace: w.workspace
                        }))
                } catch (e) {
                    /* Error getting running apps */
                    activeWindows = []
                }
            }
            
            function getIconForClass(windowClass) {
                // With the new format, we just use the Icons helper directly
                return Icons.noKnowledgeIconGuess(windowClass) || windowClass.toLowerCase()
            }
            function isWindowActive(windowClass) {
                if (!windowClass) return false;
                const targetClass = windowClass.toLowerCase();
                return activeWindows.some(w => {
                    const c = w.class;
                    return typeof c === "string" && c.toLowerCase() === targetClass;
                });
            }

function isGtk(appInfo) {
  // Ensure appInfo and appInfo.class are valid before proceeding
  if (!appInfo || typeof appInfo.class !== 'string') {
    console.error("Invalid appInfo or appInfo.class provided to isGtk");
    return false;
  }
  const lowerCaseClass = appInfo.class.toLowerCase();
  return (
    lowerCaseClass.startsWith("org.gtk.") ||
    lowerCaseClass.startsWith("org.gtk3.") ||
    lowerCaseClass.startsWith("org.gtk4.") ||
    lowerCaseClass.startsWith("org.gnome.")
  );
}
function focusOrLaunchApp(appInfo) {
  // Ensure appInfo and appInfo.class are valid
  if (!appInfo || typeof appInfo.class !== 'string') {
    console.error("Invalid appInfo or appInfo.class provided to focusOrLaunchApp");
    return;
  }

  if (typeof isWindowActive !== 'function') {
    console.error("isWindowActive function is not defined. Please define it.");
    // Fallback: attempt to launch if isWindowActive is missing, to prevent complete failure.
    // This might lead to duplicate instances if the app is already running.
     const launchCommand = isGtk(appInfo) ?
      `exec bash -c 'gtk-launch ${appInfo.class}'` :
      `exec bash -c '${appInfo.class}'`;
    console.warn(`Hyprland.dispatch call: ${launchCommand} (isWindowActive missing)`);
    // Hyprland.dispatch(launchCommand); // Uncomment when Hyprland is available
    return;
  }

  const command = isWindowActive(appInfo.class)
    ? `focuswindow class:${appInfo.class}`
    : isGtk(appInfo)
    ? `exec bash -c 'gtk-launch ${appInfo.class}'`
    : `exec bash -c '${appInfo.class}'`;

  // Placeholder for Hyprland.dispatch.
  // Replace this with your actual Hyprland binding.
  // Example: const Hyprland = { dispatch: (cmd) => console.log(`Dispatching: ${cmd}`) };
  if (typeof Hyprland !== 'object' || typeof Hyprland.dispatch !== 'function') {
      console.error("Hyprland.dispatch function is not defined. Please define it.");
      console.warn(`Intended Hyprland.dispatch call: ${command}`);
      return;
  }

  Hyprland.dispatch(command);
}

            // Set anchors
            anchors.left: false
            anchors.right: false
            anchors.top: false
            anchors.bottom: true
            color: "transparent"
            
            // Simple detection area - covers approach region and dock
            MouseArea {
                id: proximityArea
                anchors.left: parent.left
                anchors.right: parent.right
                anchors.bottom: parent.bottom
                height: dock.approachRegionHeight + dockHeight * 10
                hoverEnabled: true
                propagateComposedEvents: true
                
                onEntered: {
                    if (dock.autoHide) {
                        hideTimer.stop()
                        showTimer.restart()
                    }
                }
                
                onExited: {
                    if (dock.autoHide) {
                        showTimer.stop()
                        hideTimer.restart()
                    }
                }
            }
            
            // Simple timers to prevent rapid hide/show
            Timer {
                id: showTimer
                interval: dock.showDelay // Use the dock property
                onTriggered: {
                    if (dock.autoHide) {
                        dockContainer.y = dockRoot.height - dockHeight
                    }
                }
            }
            
            Timer {
                id: hideTimer
                interval: dock.hideDelay // Use the dock property
                onTriggered: {
                    // Only hide if mouse is not over any dock item and auto-hide is enabled
                    if (dock.autoHide && !dock.mouseOverDockItem) {
                        dockContainer.y = dockRoot.height
                    } else if (!dock.autoHide) {
                        // If we're in pinned mode, make sure the dock remains visible
                        dockContainer.y = dockRoot.height - dockHeight
                    }
                }
            }
            
            
            // Using Qt anchors for positioning

            Item { // Container for shadow + content
                id: dockContainer
                anchors.right: undefined
                anchors.left: undefined
                anchors.top: undefined
                anchors.bottom: undefined
                anchors.horizontalCenter: parent.horizontalCenter
                width: dockItemsLayout.implicitWidth + Appearance.rounding.screenRounding
                height: dockHeight
                y: parent.height - dockHeight // Default position
                
                // Add smooth slide animation
                Behavior on y {
                    NumberAnimation {
                        duration: dock.animationDuration
                        easing.type: Appearance.animation.elementMove.type
                        easing.bezierCurve: Appearance.animation.elementMove.bezierCurve
                    }
                }

                // Visible dock with shadow
                Rectangle {
                    id: dockContent
                    anchors.fill: parent
                    radius: Appearance.rounding.small
                    color: Appearance.colors.colLayer0
                    border.color: ConfigOptions.appearance.borderless ? "transparent" : Appearance.colors.colLayer2Hover
                    border.width: ConfigOptions.appearance.borderless ? 0 : 1
                    
                    // Apply shadow
                    layer.enabled: true
                    layer.effect: DropShadow {
                        transparentBorder: true
                        horizontalOffset: 0
                        verticalOffset: 2
                        radius: Appearance.sizes.fabShadowRadius
                        samples: Math.round(radius * 2)
                        color: Appearance.colors.colShadow
                    }
                }
                

                
                // Main dock layout
                GridLayout {
                    id: dockItemsLayout
                    anchors.centerIn: dockContent
                    anchors.margins: Appearance.rounding.small
                    width: implicitWidth
                    height: dockHeight - Appearance.rounding.small
                    flow: GridLayout.LeftToRight
                    columns: -1
                    rows: 1
                    
                    // Dock pin/unpin button
                    Item {
                        Layout.preferredWidth: dockHeight * 0.8
                        Layout.preferredHeight: dockHeight * 0.8
                        
                        Rectangle {
                            id: pinButton
                            anchors.fill: parent
                            anchors.margins: 6
                            radius: Appearance.rounding.full
                            color: "transparent"
                            opacity: pinMouseArea.containsMouse ? 0.8 : 0.5
                            
                            // Pin icon using MaterialSymbol component
                            // MaterialSymbol {
                            //     anchors.centerIn: parent
                            //     text: "keyboard_command_key" // Material icon name
                            //     fill: autoHide ? 0 : 1 // 0 for outline, 1 for filled
                            //     iconSize: parent.height 
                            //     color: Appearance.colors.colOnLayer1
                            // }
                            CustomIcon {
                                id: distroIcon
                                Layout.fillHeight: true
                                width: parent.width * 0.9
                                height: parent.height * 0.9
                                source: SystemInfo.distroIcon 
                            }

                            ColorOverlay {
                                anchors.fill: distroIcon
                                source: distroIcon
                                color: Appearance.colors.colOnLayer0
                            }

                            // Hover effects
                            Behavior on opacity {
                                NumberAnimation { 
                                    duration: Appearance.animation.elementMoveFast.duration
                                    easing.type: Appearance.animation.elementMoveFast.type
                                }
                            }
                        }
                        
                        MouseArea {
                            id: pinMouseArea
                            anchors.fill: pinButton
                            hoverEnabled: true
                            acceptedButtons: Qt.LeftButton | Qt.RightButton | Qt.MiddleButton | Qt.BackButton | Qt.ForwardButton
                            // Track hover state to prevent auto-hide
                            onEntered: dock.mouseOverDockItem = true
                            onExited: dock.mouseOverDockItem = false
                            onPressed: (event) => {
                                if (event.button === Qt.MiddleButton) {
                                    Hyprland.dispatch("exec kitty nvim ~/.config/quickshell/modules/common/ConfigOptions.qml")
                                } else if (event.button === Qt.BackButton) {
                                    Hyprland.dispatch("global quickshell:sidebarLeftOpen")
                                } else if (event.button === Qt.ForwardButton || event.button === Qt.RightButton) {
                                    Hyprland.dispatch("global quickshell:sidebarRightOpen")
                                }
                            }
                            // Toggle auto-hide when clicked
                            onClicked: {
                                dock.toggleDockExclusive()
                            }
                            // Show tooltip on hover
                            ToolTip.visible: containsMouse
                            ToolTip.text: autoHide ? "Pin dock (always visible)" : "Unpin dock (auto-hide)"
                            ToolTip.delay: 500
                        }
                    }
                    
                    // Left separator
                    // Rectangle {
                    //     id: leftSeparator
                    //     Layout.preferredWidth: 1.3
                    //     Layout.preferredHeight: dockHeight * 0.7
                    //     color: Appearance.colors.colOnLayer0
                    //     opacity: 0.3
                    // }
                    
                    // Pinned apps
                    Repeater {
                        model: dock.pinnedApps
                        
                    DockItem {
    icon: Icons.noKnowledgeIconGuess(modelData) || (typeof modelData === "string" ? modelData.toLowerCase() : modelData.class.toLowerCase())
    tooltip: typeof modelData === "string" ? modelData : modelData.class
    isActive: dockRoot.isWindowActive(typeof modelData === "string" ? modelData : modelData.class)
    onClicked: dockRoot.focusOrLaunchApp({
        class: typeof modelData === "string" ? modelData : modelData.class,
        command: (typeof modelData === "string" ? modelData : modelData.class).toLowerCase()
    })
        
                            // Add right-click menu for pinned apps
                     MouseArea {
    anchors.fill: parent
    acceptedButtons: Qt.RightButton | Qt.MiddleButton
    onClicked: (mouse) => {
        // Create a context menu for the app
        var component = Qt.createComponent("DockItemMenu.qml")
        if (component.status === Component.Ready) {
            var isPinned = dock.pinnedApps.some(pinnedClass => 
    typeof pinnedClass === "string" &&
    pinnedClass.toLowerCase() === (typeof modelData === "string" ? modelData.toLowerCase() : modelData.class.toLowerCase())
);

var menu = component.createObject(parent, {
    "appInfo": {
    class: typeof modelData === "string" ? modelData : modelData.class,
    command: typeof modelData === "string" ? modelData.toLowerCase() : modelData.command
}
,
    "isPinned": isPinned,
    "isRunning": dockRoot.isWindowActive(modelData),
    "menuHeight": menuHeight,
    "dockRoot": dockRoot
})

            // Handle unpin app action
            menu.unpinApp.connect(function() {
                // Remove from pinned apps
                dock.removePinnedApp(modelData)
            })

            // Position relative to mouse cursor
            menu.popup(Qt.point(mouse.x, mouse.y))
        }
    }
}

                        }
                    }
                    
                    // Right separator (only visible if there are non-pinned apps)
                    Rectangle {
                        id: rightSeparator
                        visible: nonPinnedAppsRepeater.count > 0
                        Layout.preferredWidth: 1
                        Layout.preferredHeight: dockHeight * 0.5
                        color: Appearance.colors.colOnLayer0
                        opacity: 0.3
                    }
                    
                    // Right side - Active but not pinned apps
                    Repeater {
                        id: nonPinnedAppsRepeater
                        model: {
                            var nonPinnedApps = []
                            for (var i = 0; i < dockRoot.activeWindows.length; i++) {
                                var activeWindow = dockRoot.activeWindows[i]
                                var isPinned = false
                                
                                for (var j = 0; j < dock.pinnedApps.length; j++) {
                              if (typeof dock.pinnedApps[j] === "string" && typeof activeWindow.class === "string" &&
    dock.pinnedApps[j].toLowerCase() === activeWindow.class.toLowerCase()) {

                                        isPinned = true
                                        break
                                    }
                                }
                                
                                if (!isPinned) {
                                    nonPinnedApps.push(activeWindow)
                                    // Debug logging removed
                                }
                            }
                            
                            return nonPinnedApps
                        }
                        
                        DockItem {
                            icon: Icons.noKnowledgeIconGuess(modelData.class) || modelData.class.toLowerCase()
                            tooltip: modelData.title || modelData.class
                            isActive: true
                            onClicked: {
                                // Use address for more precise window focusing when available
                                if (modelData.address) {
                                    Hyprland.dispatch(`focuswindow address:${modelData.address}`)
                                } else {
                                    Hyprland.dispatch(`focuswindow class:${modelData.class}`)
                                }
                            }
                            // Add right-click menu for non-pinned apps
                            MouseArea {
                                anchors.fill: parent
                                acceptedButtons: Qt.RightButton
                                onClicked: {
                                    // Create a context menu for the app
                                    var component = Qt.createComponent("DockItemMenu.qml")
                                    if (component.status === Component.Ready) {
                                        var menu = component.createObject(parent, {
                                            "appInfo": modelData,
                                            "isPinned": false
                                        })
                                        
                                        // Handle pin app action - just use the original approach
                                        menu.pinApp.connect(function() {
                                            // Add to pinned apps - just adding the class name
                                            dock.addPinnedApp(modelData.class)
                                        })
                                        menu.popup()
                                    }
                                }
                            }
                        }
                    }
                }
            }

        }
    }
}