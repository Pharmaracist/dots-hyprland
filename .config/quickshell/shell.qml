//@ pragma UseQApplication
//@ pragma Env QT_QUICK_CONTROLS_STYLE=Basic
//@ pragma Env QS_NO_RELOAD_POPUP=1

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
    property bool enableCheatsheet: false
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
    property bool enableActivateLinux: true
    property bool enableSecondaryClockWidget: false
    property bool enableScreenTime: true

    // Force initialization of some singletons
    Component.onCompleted: {
        MaterialThemeLoader.reapplyTheme()
        ConfigLoader.loadConfig()
        PersistentStateManager.loadStates()
        Cliphist.refresh()
        // FirstRunExperience.load()
    }

    Loader { active: enableBar; sourceComponent: Bar {} }
    Loader { active: enableCheatsheet; sourceComponent: Cheatsheet {} }
    Loader { active: enableDock || ConfigOptions?.dock.enable; sourceComponent: Dock {} }
    Loader { active: enableGlance; sourceComponent: Glance {} }
    Loader { active: enableMediaControls; sourceComponent: MediaControls {} }
    Loader { active: enableNotificationPopup; sourceComponent: NotificationPopup {} }
    Loader { active: enableOnScreenDisplayBrightness; sourceComponent: OnScreenDisplayBrightness {} }
    Loader { active: enableOnScreenDisplayVolume; sourceComponent: OnScreenDisplayVolume {} }
    Loader { active: enableOnScreenKeyboard; sourceComponent: OnScreenKeyboard {} }
    Loader { active: enableOverview; sourceComponent: Overview {} }
    Loader { active: enableReloadPopup; sourceComponent: ReloadPopup {} }
    Loader { active: enableScreenCorners; sourceComponent: ScreenCorners {} }
    Loader { active: enableSession; sourceComponent: Session {} }
    Loader { active: enableSidebarLeft; sourceComponent: SidebarLeft {} }
    Loader { active: enableSidebarRight; sourceComponent: SidebarRight {} }
    Loader { active: enableWallpaperSelector; sourceComponent: Wallpaper {} }
    Loader { active: enableClockWidget; sourceComponent: ClockWidget {} }
    Loader { active: enableActivateLinux; sourceComponent: ActivateLinux {} }
    Loader { active: enableSecondaryClockWidget; sourceComponent: SecondaryClockWidget {} }
    Loader { active: enableDesktopIslands; sourceComponent: DesktopIslands {} }
}
