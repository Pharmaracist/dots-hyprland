//@ pragma UseQApplication
//@ pragma Env QT_QUICK_CONTROLS_STYLE=Basic
//@ pragma Env QS_NO_RELOAD_POPUP=1

import "./modules/backgroundWidgets/"
import "./modules/bar/"
import "./modules/common/"
import "./modules/desktopbackground/"
import "./modules/dock/"
import "./modules/launcher/"
import "./modules/mediaControls/"
import "./modules/notificationPopup/"
import "./modules/onScreenDisplay/"
import "./modules/overview/"
import "./modules/screenCorners/"
import "./modules/sidebarLeft/"
import "./modules/sidebarRight/"
import "./modules/verticalBar/"
import "./modules/wallpaper/"
import "./services/"
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Window
import Quickshell

ShellRoot {
    // Enable/disable modules here
    property bool enableLauncher: true
    property bool enableVerticalBar: ConfigOptions.bar.verticalMode | PersistentStates.bar.verticalMode
    property bool enableBar: !enableVerticalBar
    property bool enableDock: true
    property bool enableMediaControls: false
    property bool enableNotificationPopup: true
    property bool enableOnScreenDisplayBrightness: false
    property bool enableOnScreenDisplayVolume: false
    property bool enableOverview: true
    property bool enableWallpaperSelector: true
    property bool enableReloadPopup: true
    property bool enableScreenCorners: true
    property bool enableSidebarLeft: true
    property bool enableSidebarRight: true
    property bool enableNothingClock: true
    property bool enableActivateLinux: true
    property bool enableScreenFrame: enableVerticalBar

    // Force initialization of some singletons
    Component.onCompleted: {
        MaterialThemeLoader.reapplyTheme();
        ConfigLoader.loadConfig();
        PersistentStateManager.loadStates();
        Cliphist.refresh();
        FirstRunExperience.load();
    }

    LazyLoader {
        active: enableVerticalBar

        component: VerticalBar {
        }

    }

    LazyLoader {
        active: enableWallpaperSelector

        component: WallpaperSelector {
        }

    }

    LazyLoader {
        active: enableActivateLinux

        component: ActivateLinux {
        }

    }

    LazyLoader {
        active: enableNothingClock

        component: NothingClock {
        }

    }

    LazyLoader {
        active: enableLauncher

        component: Launcher {
        }

    }
    LazyLoader {
        active: enableBar

        component: Bar {
        }

    }

    LazyLoader {
        active: enableDock

        component: Dock {
        }

    }

    LazyLoader {
        active: enableMediaControls

        component: MediaControls {
        }

    }

    LazyLoader {
        active: enableNotificationPopup

        component: NotificationPopup {
        }

    }

    LazyLoader {
        active: enableOnScreenDisplayBrightness

        component: OnScreenDisplayBrightness {
        }

    }

    LazyLoader {
        active: enableOnScreenDisplayVolume

        component: OnScreenDisplayVolume {
        }

    }

    LazyLoader {
        active: enableOverview

        component: Overview {
        }

    }

    LazyLoader {
        active: enableLauncher

        component: SearchWidget {
        }

    }

    LazyLoader {
        active: enableReloadPopup

        component: ReloadPopup {
        }

    }

    LazyLoader {
        active: enableScreenCorners

        component: ScreenCorners {
        }

    }

    LazyLoader {
        active: enableSidebarLeft

        component: SidebarLeft {
        }

    }

    LazyLoader {
        active: enableSidebarRight

        component: SidebarRight {
        }

    }

    LazyLoader {
        active: enableScreenFrame

        component: ScreenFrame {
        }

    }

}
