//@ pragma UseQApplication
//@ pragma Env QT_QUICK_CONTROLS_STYLE=Basic
//@ pragma Env QS_NO_RELOAD_POPUP=1

import "./modules/bar/"
import "./modules/cheatsheet/"
import "./modules/desktopbackground/"
import "./modules/dock/"
import "./modules/mediaControls/"
import "./modules/notificationPopup/"
import "./modules/onScreenDisplay/"
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
    // Enable/disable modules here. False = not loaded at all, so rest assured
    // no unnecessary stuff will take up memory if you decide to only use, say, the overview.
    property bool enableBar: true
    property bool enableCheatsheet: true
    property bool enableDock: true
    property bool enableMediaControls: true
    property bool enableNotificationPopup: true
    property bool enableOnScreenDisplayBrightness: true
    property bool enableOnScreenDisplayVolume: true
    property bool enableOverview: true
    property bool enableWallpaperSelector: true
    property bool enableReloadPopup: true
    property bool enableScreenCorners: true
    property bool enableSession: true
    property bool enableSidebarLeft: true
    property bool enableSidebarRight: true
    property bool enableClockWidget: true
    property bool enableActivateLinux: true

    Component.onCompleted: {
        MaterialThemeLoader.reapplyTheme();
        ConfigLoader.loadConfig();
        PersistentStateManager.loadStates();
        Cliphist.refresh();
    }

    Loader {
        active: enableBar

        sourceComponent: Bar {
        }

    }

    Loader {
        active: enableCheatsheet

        sourceComponent: Cheatsheet {
        }

    }

    Loader {
        active: enableDock

        sourceComponent: Dock {
        }

    }

    Loader {
        active: enableMediaControls

        sourceComponent: MediaControls {
        }

    }

    Loader {
        active: enableNotificationPopup

        sourceComponent: NotificationPopup {
        }

    }

    Loader {
        active: enableOnScreenDisplayBrightness

        sourceComponent: OnScreenDisplayBrightness {
        }

    }

    Loader {
        active: enableOnScreenDisplayVolume

        sourceComponent: OnScreenDisplayVolume {
        }

    }

    Loader {
        active: enableOverview

        sourceComponent: Overview {
        }

    }

    Loader {
        active: enableReloadPopup

        sourceComponent: ReloadPopup {
        }

    }

    Loader {
        active: enableScreenCorners

        sourceComponent: ScreenCorners {
        }

    }

    Loader {
        active: enableSession

        sourceComponent: Session {
        }

    }

    Loader {
        active: enableSidebarLeft

        sourceComponent: SidebarLeft {
        }

    }

    Loader {
        active: enableSidebarRight

        sourceComponent: SidebarRight {
        }

    }

    Loader {
        active: enableWallpaperSelector

        sourceComponent: Wallpaper {
        }

    }

    Loader {
        active: enableClockWidget

        sourceComponent: ClockWidget {
        }

    }

    Loader {
        active: enableActivateLinux

        sourceComponent: ActivateLinux {
        }

    }

}
