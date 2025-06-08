//@ pragma UseQApplication
//@ pragma Env QT_QUICK_CONTROLS_STYLE=Basic
//@ pragma Env QS_NO_RELOAD_POPUP=1

import "./modules/common/"
import "./modules/backgroundWidgets/"
import "./modules/bar/"
import "./modules/cheatsheet/"
import "./modules/desktopbackground/"
import "./modules/dock/"
import "./modules/glance/"
import "./modules/mediaControls/"
import "./modules/notificationPopup/"
import "./modules/onScreenDisplay/"
import "./modules/onScreenKeyboard/"
import "./modules/overview/"
import "./modules/screenCorners/"
import "./modules/session/"
import "./modules/sidebarLeft/"
import "./modules/sidebarRight/"
import "./services/"
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Window
import Quickshell

ShellRoot {
    // Enable/disable modules here
    property bool enableBar: true
    property bool enableCheatsheet: true
    property bool enableBackgroundWidgets: true
    property bool enableDock: true
    property bool enableGlance: true
    property bool enableMediaControls: true
    property bool enableNotificationPopup: true
    property bool enableOnScreenDisplayBrightness: false
    property bool enableOnScreenDisplayVolume: true
    property bool enableOnScreenKeyboard: true
    property bool enableOverview: true
    property bool enableWallpaperSelector: true
    property bool enableReloadPopup: true
    property bool enableScreenCorners: true
    property bool enableSession: true
    property bool enableSidebarLeft: true
    property bool enableSidebarRight: true
    property bool enableClockWidget: true
    property bool enableActivateLinux: false
    property bool enableSecondaryClockWidget: false
    property bool enableScreenTime: true
    property bool enableDesktopIslands : false
    // Force initialization of some singletons
    Component.onCompleted: {
        MaterialThemeLoader.reapplyTheme()
        ConfigLoader.loadConfig()
        PersistentStateManager.loadStates()
        Cliphist.refresh()
        FirstRunExperience.load()
    }

LazyLoader { active: enableWallpaperSelector; component: Wallpaper {} }
LazyLoader { active: enableActivateLinux; component: ActivateLinux {} }
LazyLoader { active: enableSecondaryClockWidget; component: SecondaryClockWidget {} }
LazyLoader { active: enableDesktopIslands; component: DesktopIslands {} }
LazyLoader { active: enableGlance; component: Glance {} }
LazyLoader { active: enableClockWidget; component: ClockWidget {} }
    LazyLoader { active: enableBar; component: Bar {} }
    LazyLoader { active: enableBackgroundWidgets; component: BackgroundWidgets {} }
    LazyLoader { active: enableCheatsheet; component: Cheatsheet {} }
    LazyLoader { active: (enableDock && ConfigOptions?.dock.enable); component: Dock {} }
    LazyLoader { active: enableMediaControls; component: MediaControls {} }
    LazyLoader { active: enableNotificationPopup; component: NotificationPopup {} }
    LazyLoader { active: enableOnScreenDisplayBrightness; component: OnScreenDisplayBrightness {} }
    LazyLoader { active: enableOnScreenDisplayVolume; component: OnScreenDisplayVolume {} }
    LazyLoader { active: enableOnScreenKeyboard; component: OnScreenKeyboard {} }
    LazyLoader { active: enableOverview; component: Overview {} }
    LazyLoader { active: enableReloadPopup; component: ReloadPopup {} }
    LazyLoader { active: enableScreenCorners; component: ScreenCorners {} }
    LazyLoader { active: enableSession; component: Session {} }
    LazyLoader { active: enableSidebarLeft; component: SidebarLeft {} }
    LazyLoader { active: enableSidebarRight; component: SidebarRight {} }
}
