// Performance-optimized Dock.qml with fixed toggles and refactored structure
import "root:/"
import "root:/services"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/modules/dock/dockComponents"
import "root:/modules/dock/dockContent"
import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import QtQuick.Layouts
import Quickshell.Io
import Quickshell
import Quickshell.Widgets
import Quickshell.Wayland
import Quickshell.Hyprland

Scope {
    id: root
    
    // Default sizes for normal content
    property int defaultDockWidth: 380
    property int defaultDockHeight: 72
    property int defaultBackgroundWidth: 400
    property int defaultBackgroundHeight: 60
    
    // Core properties
    property bool pinned: PersistentStates.dock.pinned
    property var focusedScreen: Quickshell?.screens.find(s => s.name === Hyprland.focusedMonitor?.name) ?? Quickshell.screens[0]
    property int frameThickness: Appearance.sizes.frameThickness
    property real commonRadius: Appearance.rounding.screenRounding 
    
    // Content management
    property int currentContent: contentType.apps
    property int previousContent: contentType.apps
    readonly property int defaultContent: contentType.apps
    
    // Content type enumeration for better maintainability
    readonly property QtObject contentType: QtObject {
        readonly property int mediaPlayer: 0
        readonly property int apps: 1
        readonly property int powerMenu: 2
        readonly property int overview: 3
        readonly property int wallpaperSelector: 4
    }
    
    // Auto-return configuration
    property int autoReturnDelay: 10000
    readonly property var autoReturnExceptions: [contentType.apps, contentType.overview]
    
    // Content components array
    readonly property var contentComponents: [mediaPlayer, normalDock, powerMenu, overview, wallpaperSelector]
    
    // Computed properties for layout
    readonly property bool isSpecialContent: currentContent === contentType.overview || currentContent === contentType.wallpaperSelector
    readonly property bool isOverviewMode: currentContent === contentType.overview
    readonly property bool isWallpaperMode: currentContent === contentType.wallpaperSelector
    
    // Content management functions
    function switchToContent(newContent) {
        if (newContent !== currentContent) {
            previousContent = currentContent
            currentContent = newContent
        }
    }
    
    function toggleContent(targetContent) {
        if (currentContent === targetContent) {
            switchToContent(defaultContent)
        } else {
            switchToContent(targetContent)
        }
    }
    
    function cycleContent() {
        const nextContent = (currentContent + 1) % contentComponents.length
        switchToContent(nextContent)
    }
    
    function resetToDefault() {
        switchToContent(defaultContent)
    }
    
    // Auto-return timer management
    Timer {
        id: autoReturnTimer
        interval: root.autoReturnDelay
        repeat: false
        
        onTriggered: {
            if (!root.autoReturnExceptions.includes(root.currentContent)) {
                root.resetToDefault()
            }
        }
    }
    
    function resetAutoReturnTimer() {
        if (!root.autoReturnExceptions.includes(root.currentContent)) {
            autoReturnTimer.restart()
        } else {
            autoReturnTimer.stop()
        }
    }
    
    // Auto-reset timer when content changes
    onCurrentContentChanged: {
        resetAutoReturnTimer()
        
        // Handle special state changes
        if (currentContent === contentType.overview) {
            GlobalStates.overviewOpen = true
        } else if (previousContent === contentType.overview) {
            GlobalStates.overviewOpen = false
        }
    }
    
    function calculateCornerSize() {
        return isOverviewMode ? 1.76 * commonRadius : commonRadius
    }
    
    function calculateTopLeftRadius() {
        return isOverviewMode ? 1.25 * commonRadius : commonRadius
    }
    
    function calculateTopRightRadius() {
        return isOverviewMode ? 1.25 * commonRadius : commonRadius
    }
    
    Variants {
        model: pinned ? Quickshell.screens : [focusedScreen]

        Loader {
            id: dockLoader
            required property var modelData
            active: ConfigOptions?.dock.hoverToReveal || (!ToplevelManager.activeToplevel?.activated)

            sourceComponent: PanelWindow {
                id: dock
                screen: dockLoader.modelData
                
                property bool shouldReveal: root.pinned
                    || (ConfigOptions?.dock.hoverToReveal && mouseArea.containsMouse)
                    || (contentLoader.item && contentLoader.item.requestDockShow === true)
                    || (!ToplevelManager.activeToplevel?.activated)

                anchors { bottom: true; left: true; right: true }
                
                exclusiveZone: root.pinned 
                    ? implicitHeight - (Appearance.sizes.hyprlandGapsOut * 2) + frameThickness
                    : -1
                
                // Dynamic sizing based on content
                implicitWidth: {
                    switch (root.currentContent) {
                        case root.contentType.overview: return 1386
                        case root.contentType.wallpaperSelector: return (screen.width * 0.9)
                        default: return Math.max(dockRow.implicitWidth + 16, root.defaultDockWidth)
                    }
                }
                implicitHeight: {
                    switch (root.currentContent) {
                        case root.contentType.overview: return 370
                        case root.contentType.wallpaperSelector: return 230
                        default: return Math.max(dockRow.implicitHeight + 32, root.defaultDockHeight)
                    }
                }
                
                WlrLayershell.namespace: "quickshell:dock"
                color: "transparent"
                mask: Region { item: mouseArea }

                MouseArea {
                    id: mouseArea
                    anchors {
                        top: parent.top
                        left: parent.left
                        right: parent.right
                        topMargin: calculateTopMargin()
                    }
                    height: parent.height
                    hoverEnabled: true
                    
                    onEntered: root.resetAutoReturnTimer()
                    onPositionChanged: root.resetAutoReturnTimer()

                    function calculateTopMargin() {
                        if (dock.shouldReveal) return 0
                        if (ConfigOptions?.dock.hoverToReveal) {
                            return dock.implicitHeight - ConfigOptions.dock.hoverRegionHeight
                        }
                        return dock.implicitHeight + 1
                    }

                    Item {
                        id: background
                        anchors.fill: parent
                        
                        // Dynamic background sizing
                        implicitWidth: {
                            switch (root.currentContent) {
                                case root.contentType.overview: return 1386
                                case root.contentType.wallpaperSelector: return (screen.width * 0.9)
                                default: return Math.max(dockRow.implicitWidth + 16, root.defaultBackgroundWidth)
                            }
                        }
                        implicitHeight: {
                            switch (root.currentContent) {
                                case root.contentType.overview: return 355
                                case root.contentType.wallpaperSelector: return 200
                                default: return Math.max(dockRow.implicitHeight + 20, root.defaultBackgroundHeight)
                            }
                        }
                        
                        Behavior on implicitWidth {
                            NumberAnimation {
                                duration: Appearance.animation.elementMoveFast.duration - 50
                                easing.type: Appearance.animation.elementMove.bezierCurve 
                            }
                        }
                        
                        Behavior on implicitHeight {
                            NumberAnimation {
                                duration: Appearance.animation.elementMoveFast.duration - 50 
                                easing.type: Appearance.animation.elementMove.bezierCurve 
                            }
                        }
                        
                        StyledRectangularShadow { target: dockRect }

                        Rectangle {
                            id: dockRect
                            anchors {
                                bottom: parent.bottom
                                horizontalCenter: parent.horizontalCenter
                            }
                            width: background.implicitWidth
                            height: background.implicitHeight
                            
                            Behavior on width {
                                NumberAnimation {
                                    duration: Appearance.animation.elementMoveFast.duration - 50
                                    easing.type: Appearance.animation.elementMove.bezierCurve 
                                }
                            }
                            
                            Behavior on height {
                                NumberAnimation {
                                    duration: Appearance.animation.elementMoveFast.duration - 50
                                    easing.type: Appearance.animation.elementMove.bezierCurve 
                                }
                            }
                            
                            color: Appearance.colors.colLayer0
                            topRightRadius: root.calculateTopRightRadius()
                            topLeftRadius: root.calculateTopLeftRadius()

                            Item {
                                anchors.fill: parent
                                
                                // Normal dock row (apps, media, power menu)
                                RowLayout {
                                    id: dockRow
                                    anchors {
                                        bottom: parent.bottom
                                        horizontalCenter: parent.horizontalCenter
                                        bottomMargin: frameThickness                                    
                                    }
                                    spacing: 5
                                    visible: !root.isSpecialContent

                                    DockPinButton {
                                        visible: root.currentContent === contentType.apps
                                        pinned: root.pinned
                                        onTogglePin: {
                                            PersistentStateManager.setState("dock.pinned", !root.pinned)
                                            root.resetAutoReturnTimer()
                                        }
                                        onTogglePowerMenu: {
                                            root.toggleContent(contentType.powerMenu)
                                        }
                                    }

                                    Loader {
                                        id: normalContentLoader
                                        Layout.fillWidth: true
                                        Layout.fillHeight: true
                                        Layout.minimumHeight: 45
                                        Layout.preferredHeight: 40
                                        
                                        // Lazy loading - only load when content is active and not special
                                        asynchronous: true
                                        active: !root.isSpecialContent && root.contentComponents[root.currentContent]
                                        sourceComponent: active ? root.contentComponents[root.currentContent] : null
                                    }
                                }
                                
                                // Special content (overview/wallpaper) with lazy loading
                                Loader {
                                    id: contentLoader
                                    anchors.fill: parent
                                    anchors.margins: root.isSpecialContent ? 10 : 0
                                    visible: root.isSpecialContent
                                    
                                    // Lazy loading for special content
                                    asynchronous: true
                                    active: root.isSpecialContent && root.contentComponents[root.currentContent]
                                    sourceComponent: active ? root.contentComponents[root.currentContent] : null
                                    
                                    onLoaded: {
                                        if (item && root.isOverviewMode) {
                                            item.panelWindow = dock
                                        }
                                    }
                                }
                            }
                        }

                        // Corner decorations
                        RoundCorner {
                            size: root.calculateCornerSize()
                            corner: cornerEnum.bottomLeft
                            color: Appearance.colors.colLayer0
                            anchors {
                                bottom: parent.bottom
                                left: dockRect.right
                                bottomMargin: frameThickness
                            }
                        }

                        RoundCorner {
                            size: root.calculateCornerSize()
                            corner: cornerEnum.bottomRight
                            color: Appearance.colors.colLayer0
                            anchors {
                                bottom: parent.bottom
                                right: dockRect.left
                                bottomMargin: frameThickness
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Global shortcuts with consistent toggle behavior
    GlobalShortcut {
        name: "dockPinToggle"
        description: qsTr("Toggle Dock Pin")
        onPressed: {
            PersistentStateManager.setState("dock.pinned", !root.pinned)
            root.resetAutoReturnTimer()
        }
    }
    
    GlobalShortcut {
        name: "overviewToggle"
        description: qsTr("Toggle Overview")
        onPressed: root.toggleContent(contentType.overview)
    }
    
    GlobalShortcut {
        name: "wallpaperSelectorToggle"
        description: qsTr("Toggle Wallpaper Selector")
        onPressed: root.toggleContent(contentType.wallpaperSelector)
    }
    
    GlobalShortcut {
        name: "dockContentToggle"
        description: qsTr("Cycle Dock Content")
        onPressed: root.cycleContent()
    }
    
    GlobalShortcut {
        name: "dockMediaControlToggle"
        description: qsTr("Toggle Media Player")
        onPressed: root.toggleContent(contentType.mediaPlayer)
    }

    GlobalShortcut {
        name: "dockSessionToggle"
        description: qsTr("Toggle Power Menu")
        onPressed: root.toggleContent(contentType.powerMenu)
    }
    
    // Content components - simplified without nested loaders
    Component {
        id: normalDock
        DockApps { 
            property bool requestDockShow: false
        }
    }

    Component {
        id: powerMenu
        DockPowerMenu { 
            property bool requestDockShow: true
        }
    }

    Component {
        id: overview
        OverviewWidget {
            panelWindow: dock
            anchors.fill: parent
            property bool requestDockShow: true
        }
    }
    
    Component {
        id: mediaPlayer
        DockMediaPlayer { 
            property bool requestDockShow: true
        }
    }

    Component {
        id: wallpaperSelector
        WallpaperSelector { 
            anchors.fill: parent
            property bool requestDockShow: true
        }
    }
}