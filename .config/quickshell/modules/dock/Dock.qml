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

    property int defaultDockWidth: 380
    property int defaultDockHeight: 72
    property int defaultBackgroundWidth: 400
    property int defaultBackgroundHeight: 60

    property bool pinned: PersistentStates.dock.pinned
    property bool effectivePinned: !isSpecialContent && pinned
    property var focusedScreen: Quickshell?.screens.find(s => s.name === Hyprland.focusedMonitor?.name) ?? Quickshell.screens[0]
    property int frameThickness: Appearance.sizes.frameThickness
    property bool cornered: true

    property int currentContent: MprisController.activePlayer?.trackTitle?.length > 0 ? contentType.mediaPlayer :  PersistentStates.dock.currentContent ?? contentType.apps
    property int previousContent: contentType.apps
    readonly property int defaultContent: contentType.apps

    readonly property QtObject contentType: QtObject {
        readonly property int mediaPlayer: 0
        readonly property int apps: 1
        readonly property int powerMenu: 2
        readonly property int overview: 3
        readonly property int wallpaperSelector: 4

    }

    property int autoReturnDelay: 3000
    readonly property var autoReturnExceptions: [contentType.apps,contentType.mediaPlayer ,contentType.overview]
    readonly property var contentComponents: [mediaPlayer, normalDock, powerMenu, overview, wallpaperSelector]

    readonly property bool isSpecialContent: currentContent === contentType.overview || currentContent === contentType.wallpaperSelector 
    readonly property bool isOverviewMode: currentContent === contentType.overview
    readonly property bool isWallpaperMode: currentContent === contentType.wallpaperSelector
    
    function switchToContent(newContent) {
        if (newContent !== currentContent) {
            previousContent = currentContent
            currentContent = newContent
            PersistentStateManager.setState("dock.currentContent",newContent )
        }
    }

    function toggleContent(targetContent) {
        if (currentContent === targetContent) {
            switchToContent(defaultContent)
        } else {
            switchToContent(targetContent)
        }
    }

    function resetToDefault() {
        switchToContent(defaultContent)
    }

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

    onCurrentContentChanged: {
        resetAutoReturnTimer()
        if (currentContent === contentType.overview) {
            GlobalStates.overviewOpen = true
        } else if (previousContent === contentType.overview) {
            GlobalStates.overviewOpen = false
        }
    }

    Variants {
        model: effectivePinned ? Quickshell.screens : [focusedScreen]

        Loader {
            id: dockLoader
            required property var modelData
            active: ConfigOptions?.dock.hoverToReveal || (!ToplevelManager.activeToplevel?.activated)

            sourceComponent: PanelWindow {
                id: dock
                screen: dockLoader.modelData

                property bool shouldReveal: root.effectivePinned
                    || (ConfigOptions?.dock.hoverToReveal && mouseArea.containsMouse)
                    || (contentLoader.item && contentLoader.item.requestDockShow === true)
                    || (!ToplevelManager.activeToplevel?.activated)

                anchors { bottom: true; right: true; left: true }

                exclusiveZone: root.effectivePinned 
                    ? implicitHeight - (Appearance.sizes.hyprlandGapsOut * 2) + frameThickness
                    : -1

                implicitWidth: {
                    switch (root.currentContent) {
                        case root.contentType.overview: return 1386
                        case root.contentType.wallpaperSelector: return (screen.width * 0.9)
                        default: return Math.max(dockRow.implicitWidth + 36, root.defaultDockWidth)
                    }
                }
                implicitHeight: {
                    switch (root.currentContent) {
                        case root.contentType.overview: return 370
                        case root.contentType.wallpaperSelector: return 230
                        default: return Math.max(dockRow.implicitHeight + Appearance.sizes.hyprlandGapsOut, root.defaultDockHeight)
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

                    Behavior on anchors.topMargin {
                        animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
                    }

                    Item {
                        id: background
                        anchors.fill: parent

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

                        StyledRectangularShadow { target: dockRect }

                        Rectangle {
                            id: dockRect
                            anchors {
                                bottom: parent.bottom
                                bottomMargin: root.cornered ? 0 : Appearance.sizes.hyprlandGapsOut
                                horizontalCenter: parent.horizontalCenter
                            }
                            implicitWidth: background.implicitWidth
                            implicitHeight: background.implicitHeight - 5

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
                            radius: !root.cornered ? Appearance.rounding.screenRounding : undefined
                            topRightRadius: Appearance.rounding.screenRounding
                            topLeftRadius: Appearance.rounding.screenRounding

                            Item {
                                anchors.fill: parent

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
                                        visible: root.currentContent === contentType.apps && !root.isSpecialContent
                                        pinned: root.pinned
                                        enabled: !root.isSpecialContent
                                        onTogglePin: {
                                            PersistentStateManager.setState("dock.pinned", !root.pinned)
                                            root.resetAutoReturnTimer()
                                        }
                                        onTogglePowerMenu: {
                                            root.toggleContent(contentType.mediaPlayer)
                                        }
                                    }
                                    DockSeparator {
                                        visible: root.currentContent === contentType.apps && !root.isSpecialContent
                                    }
                                    Loader {
                                        id: normalContentLoader
                                        Layout.fillWidth: true
                                        Layout.fillHeight: true
                                        asynchronous: true
                                        active: !root.isSpecialContent && root.contentComponents[root.currentContent]
                                        sourceComponent: active ? root.contentComponents[root.currentContent] : null
                                    }
                                    DockSeparator {
                                        visible: root.currentContent === contentType.apps && !root.isSpecialContent
                                    }
                                    GroupButton {
                                       visible: root.currentContent === contentType.apps && !root.isSpecialContent
                                       baseWidth: 50
                                       baseHeight: 50
                                       buttonRadius: Appearance.rounding.normal
                                       color:  Appearance.colors.colLayer1Hover

                                        MouseArea {
                                            anchors.fill: parent
                                            acceptedButtons: Qt.LeftButton 
                                            onPressed: Hyprland.dispatch('global quickshell:launcherToggle')
                                        }

                                   contentItem: MaterialSymbol {
                                       id: m3Btn
                                       text: "apps"
                                       horizontalAlignment: Text.AlignHCenter
                                       font.pixelSize: 26
                                       color: Appearance.m3colors.m3outline
                                       anchors.centerIn: parent
                                   }
                                }                           
                            }
                                Loader {
                                    id: contentLoader
                                    anchors.fill: parent
                                    anchors.margins: root.isSpecialContent ? 10 : 0
                                    visible: root.isSpecialContent
                                    asynchronous: true
                                    active: root.isSpecialContent && root.contentComponents[root.currentContent]
                                    sourceComponent: active ? root.contentComponents[root.currentContent] : null

                                    onLoaded: {
                                        if (item && root.isOverviewMode) {
                                            item.panelWindow = dock
                                        }
                                    }
                                    RowLayout {
                                            anchors.right: parent.right
                                            z: 9
                                            Rectangle {
                                            id: hoverButton
                                            color: hovered ? Appearance.colors.colLayer3Hover : Appearance.colors.colLayer3
                                            radius: 99
                                            implicitWidth: 28
                                            implicitHeight: 28

                                            property bool hovered: false

                                            Behavior on color {
                                                ColorAnimation { duration: 150 }
                                            }

                                            MaterialSymbol {
                                                anchors.centerIn: parent
                                                font.pixelSize: parent.width - 8
                                                text: "keyboard_arrow_down"
                                                color: Appearance.colors.colOnLayer3
                                            }

                                            MouseArea {
                                                anchors.fill: parent
                                                hoverEnabled: true
                                                onEntered: hoverButton.hovered = true
                                                onExited: hoverButton.hovered = false
                                                onClicked: root.resetToDefault()
                                            }
                                            StyledRectangularShadow { target: parent }
                                        }
                                        Rectangle {
                                            id: shuffleButton
                                            visible: root.currentContent == 4
                                            color: hovered ? Appearance.colors.colLayer3Hover : Appearance.colors.colLayer3
                                            anchors.right: parent.right
                                            radius: 99
                                            implicitWidth: 28
                                            implicitHeight: 28
                                            z: 9

                                            property bool hovered: false

                                            Behavior on color {
                                                ColorAnimation { duration: 150 }
                                            }

                                            MaterialSymbol {
                                                anchors.centerIn: parent
                                                font.pixelSize: parent.width - 8
                                                text: "shuffle"
                                                color: Appearance.colors.colOnLayer3
                                            }

                                            MouseArea {
                                                anchors.fill: parent
                                                hoverEnabled: true
                                                onEntered: shuffleButton.hovered = true
                                                onExited: shuffleButton.hovered = false
                                                onClicked: Hyprland.dispatch(`exec ${Directories.wallpaperSwitchScriptPath} --random`)
                                            }
                                            StyledRectangularShadow { target: parent }
                                        }
                                
                                    }
                                   }
                            }
                        }

                        RoundCorner {
                            size: Appearance.rounding.screenRounding
                            corner: cornerEnum.bottomLeft
                            color: Appearance.colors.colLayer0
                            visible: cornered
                            anchors {
                                bottom: dockRect.bottom
                                left: dockRect.right
                                bottomMargin: Appearance.sizes.frameThickness - 1
                            }
                        }
                        RoundCorner {
                            visible: cornered
                            size: Appearance.rounding.screenRounding
                            corner: cornerEnum.bottomRight
                            color: Appearance.colors.colLayer0
                            anchors {
                                bottom: dockRect.bottom
                                right: dockRect.left
                                bottomMargin: Appearance.sizes.frameThickness - 1
                            }
                        }
                    }
                }
            }
        }
    }
    GlobalShortcut { name: "dockPinToggle"; description: qsTr("Toggle Dock Pin"); onPressed: { PersistentStateManager.setState("dock.pinned", !root.pinned); root.resetAutoReturnTimer() } }
    GlobalShortcut { name: "overviewToggle"; description: qsTr("Toggle Overview"); onPressed: root.toggleContent(contentType.overview) }
    GlobalShortcut { name: "wallpaperSelectorToggle"; description: qsTr("Toggle Wallpaper Selector"); onPressed: root.toggleContent(contentType.wallpaperSelector) }
    GlobalShortcut { name: "dockMediaControlToggle"; description: qsTr("Toggle Media Player"); onPressed: root.toggleContent(contentType.mediaPlayer) }
    GlobalShortcut { name: "dockSessionToggle"; description: qsTr("Toggle Power Menu"); onPressed: root.toggleContent(contentType.powerMenu) }

    Component { id: normalDock; DockApps {} }
    Component { id: powerMenu; DockPowerMenu {} }
    Component { id: overview; OverviewWidget { panelWindow: dock ; property bool requestDockShow: true} }
    Component { id: mediaPlayer; DockMediaPlayer {} }
    Component { id: wallpaperSelector; WallpaperSelector {property bool requestDockShow: true} }
}
