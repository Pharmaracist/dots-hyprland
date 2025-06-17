import "root:/modules/common"
import "root:/modules/common/widgets"
import QtQuick
import QtQuick.Layouts
import Quickshell.Wayland
import Quickshell.Hyprland
import "root:/modules/common/functions/string_utils.js" as StringUtils

Item {
    id: root
    required property var bar

    readonly property HyprlandMonitor monitor: Hyprland.monitorFor(bar.screen)
    readonly property string cleanTitle: StringUtils.cleanMusicTitle(activePlayer?.trackTitle) || qsTr("No media")
    readonly property Toplevel activeWindow: ToplevelManager.activeToplevel

    // App substitutions mapping (minimal)
    readonly property var appSubstitutions: ({
        "google-chrome": "Chrome",
        "code-oss": "VS Code",
        "telegram-desktop": "Telegram",
        "gnome-terminal": "Terminal",
        "org.kde.dolphin": "Files"
    })

    // App icons mapping using Nerd Font icons
    readonly property var appIcons: ({
        "firefox": "",
        "zen": "",
        "chromium": "",
        "Code": "󰘐",
        "code-oss": "󰘐",
        "discord": "",
        "spotify": "",
        "telegram-desktop": "",
        "nautilus": "",
        "org.kde.dolphin": "",
        "thunar": "",
        "alacritty": "",
        "gnome-terminal": "",
        "kitty": "",
        "wezterm": "",
        "gimp": "",
        "heroic": "󰊗",
        "steam": "",
        "vlc": "󰟞",
        "mpv": "󰟞",
        "Desktop": ""
    })

    readonly property string currentAppId: activeWindow?.activated ? activeWindow?.appId : ""
    readonly property string displayName: currentAppId ? (appSubstitutions[currentAppId] || currentAppId) : qsTr("󰟪 Desktop")
    readonly property string appIcon: currentAppId ? (appIcons[currentAppId] || "") : ""

    implicitHeight:barWidth * padding
    implicitWidth: barWidth * padding
    Layout.alignment: Qt.AlignHCenter
    RowLayout {
        id: rowLayout
        anchors.centerIn: parent
        spacing: 6 * bar.padding
        StyledText {
            font.pixelSize: Appearance.font.pixelSize.large + 2
            font.family: Appearance.font.family.iconNerd
            color: Appearance.colors.colOnLayer1
            text: root.appIcon
            Layout.alignment: Qt.AlignVCenter
            visible: root.appIcon !== ""
        }

        StyledText {
            font.pixelSize: Appearance.font.pixelSize.large
            font.family: Appearance.font.family.monospace
            font.weight: Font.DemiBold
            Layout.alignment: Qt.AlignVCenter
            color: Appearance.colors.colOnLayer1
            text: root.displayName
            elide: Text.ElideRight
        }
    }
}
