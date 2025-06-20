import "root:/"
import "root:/services/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/modules/common/functions/color_utils.js" as ColorUtils
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Wayland
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Widgets
import Qt5Compat.GraphicalEffects

Item {
    required property var bar
    property bool borderless: ConfigOptions.bar.borderless
    readonly property HyprlandMonitor monitor: Hyprland.monitorFor(bar.screen)
    readonly property Toplevel activeWindow: ToplevelManager.activeToplevel

    readonly property int workspaceGroup: Math.floor((monitor.activeWorkspace?.id - 1) / ConfigOptions.bar.workspaces.shown)
    property list<bool> workspaceOccupied: []
    property int widgetPadding: 0
    property int workspaceButtonHeight: 27
    property real workspaceIconSize: workspaceButtonHeight * 0.6
    property real workspaceIconSizeShrinked: workspaceButtonHeight * 0.5 
    property real workspaceIconOpacityShrinked: 1
    property real workspaceIconMarginShrinked: -6 // how far will the icon goes
    property int workspaceIndexInGroup: (monitor.activeWorkspace?.id - 1) % ConfigOptions.bar.workspaces.shown

    // Japanese number mappings
    property var japaneseNumbers: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"]
    property var kanjiNumbers: ["壱", "弐", "参", "四", "五", "六", "七", "八", "九", "拾"]
    property var hiraganaNumbers: ["いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう", "じゅう"]
    
    // Configuration for Japanese display
    readonly property bool useJapanese: true // Set to false to use regular numbers
    property string japaneseStyle: "kanji" // Options: "kanji", "hiragana", "formal"
    
    function getJapaneseNumber(num) {
        if (!useJapanese || num < 1 || num > 10) return num.toString()
        
        switch(japaneseStyle) {
            case "hiragana":
                return hiraganaNumbers[num - 1] || num.toString()
            case "formal":
                return kanjiNumbers[num - 1] || num.toString()
            case "kanji":
            default:
                return japaneseNumbers[num - 1] || num.toString()
        }
    }

    function updateWorkspaceOccupied() {
        workspaceOccupied = Array.from({ length: ConfigOptions.bar.workspaces.shown }, (_, i) => {
            return Hyprland.workspaces.values.some(ws => ws.id === workspaceGroup * ConfigOptions.bar.workspaces.shown + i + 1);
        })
    }

    Component.onCompleted: updateWorkspaceOccupied()

    Connections {
        target: Hyprland.workspaces
        function onValuesChanged() {
            updateWorkspaceOccupied();
        }
    }

    Layout.fillWidth: true
    implicitHeight: columnLayout.implicitHeight + widgetPadding * 2
    implicitWidth: 40

    Rectangle {
        z: 0
        anchors.centerIn: parent
        implicitWidth: 32
        implicitHeight: columnLayout.implicitHeight + widgetPadding * 2
        radius: Appearance.rounding.small
        color: borderless ? "transparent" : Appearance.colors.colLayer1
    }

    WheelHandler {
        onWheel: (event) => {
            if (event.angleDelta.y < 0)
                Hyprland.dispatch(`workspace r+1`);
            else if (event.angleDelta.y > 0)
                Hyprland.dispatch(`workspace r-1`);
        }
        acceptedDevices: PointerDevice.Mouse | PointerDevice.TouchPad
    }

    MouseArea {
        anchors.fill: parent
        acceptedButtons: Qt.BackButton
        onPressed: (event) => {
            if (event.button === Qt.BackButton) {
                Hyprland.dispatch(`togglespecialworkspace`);
            } 
        }
    }

    ColumnLayout {
        id: columnLayout
        z: 1
        spacing: 0
        anchors.fill: parent

        Repeater {
            model: ConfigOptions.bar.workspaces.shown

            Rectangle {
                z: 1
                Layout.alignment: Qt.AlignHCenter
                implicitHeight: workspaceButtonHeight
                implicitWidth: 32 * 0.8
                radius: Appearance.rounding.full

                property var radiusTop: (workspaceOccupied[index-1] && !(!activeWindow?.activated && monitor.activeWorkspace?.id === index)) ? 0 : Appearance.rounding.full
                property var radiusBottom: (workspaceOccupied[index+1] && !(!activeWindow?.activated && monitor.activeWorkspace?.id === index+2)) ? 0 : Appearance.rounding.full

                topLeftRadius: radiusTop
                topRightRadius: radiusTop
                bottomLeftRadius: radiusBottom
                bottomRightRadius: radiusBottom

                color: ColorUtils.transparentize(Appearance.m3colors.m3secondaryContainer, 0.4)
                opacity: (workspaceOccupied[index] && !(!activeWindow?.activated && monitor.activeWorkspace?.id === index+1)) ? 1 : 0

                Behavior on opacity {
                    animation: Appearance.animation.elementMove.numberAnimation.createObject(this)
                }
                Behavior on radiusTop {
                    animation: Appearance.animation.elementMove.numberAnimation.createObject(this)
                }
                Behavior on radiusBottom {
                    animation: Appearance.animation.elementMove.numberAnimation.createObject(this)
                }
            }
        }
    }

    Rectangle {
        z: 2
        property real activeWorkspaceMargin: 2
        implicitWidth: workspaceButtonHeight - activeWorkspaceMargin * 2
        radius: Appearance.rounding.full
        color: Appearance.colors.colPrimary
        anchors.horizontalCenter: parent.horizontalCenter

        property real idx1: workspaceIndexInGroup
        property real idx2: workspaceIndexInGroup
        y: Math.min(idx1, idx2) * workspaceButtonHeight + activeWorkspaceMargin
        implicitHeight: Math.abs(idx1 - idx2) * workspaceButtonHeight + workspaceButtonHeight - activeWorkspaceMargin * 2

        Behavior on activeWorkspaceMargin {
            animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
        }
        Behavior on idx1 {
            NumberAnimation { duration: 100; easing.type: Easing.OutSine }
        }
        Behavior on idx2 {
            NumberAnimation { duration: 300; easing.type: Easing.OutSine }
        }
    }

    ColumnLayout {
        id: columnLayoutNumbers
        z: 3
        spacing: 0
        anchors.fill: parent

        Repeater {
            model: ConfigOptions.bar.workspaces.shown

            Button {
                id: button
                property int workspaceValue: workspaceGroup * ConfigOptions.bar.workspaces.shown + index + 1
                Layout.fillWidth: true
                height: workspaceButtonHeight
                onPressed: Hyprland.dispatch(`workspace ${workspaceValue}`)

                background: Item {
                    id: workspaceButtonBackground
                    implicitHeight: workspaceButtonHeight

                    property var biggestWindow: {
                        const windows = HyprlandData.windowList.filter(w => w.workspace.id == button.workspaceValue)
                        return windows.reduce((maxWin, win) => {
                            const maxArea = (maxWin?.size?.[0] ?? 0) * (maxWin?.size?.[1] ?? 0)
                            const winArea = (win?.size?.[0] ?? 0) * (win?.size?.[1] ?? 0)
                            return winArea > maxArea ? win : maxWin
                        }, null)
                    }

                    property var mainAppIconSource: Quickshell.iconPath(AppSearch.guessIcon(biggestWindow?.class), "image-missing")

                    StyledText {
                        opacity: (ConfigOptions.bar.workspaces.alwaysShowNumbers || GlobalStates.workspaceShowNumbers || !workspaceButtonBackground.biggestWindow) ? 0.8 : 0
                        anchors.centerIn: parent
                        font.family: useJapanese ? "Noto Sans CJK JP" : "Rubik" // Japanese font support
                        font.weight: 300
                        // Adjust font size for Japanese characters
                        font.pixelSize: {
                            let baseSize = Appearance.font.pixelSize.small
                        }
                        text: getJapaneseNumber(button.workspaceValue)
                        color: (monitor.activeWorkspace?.id == button.workspaceValue) ? 
                            Appearance.m3colors.m3onPrimary : 
                            (workspaceOccupied[index] ? Appearance.m3colors.m3onSecondaryContainer : Appearance.colors.colOnLayer1Inactive)

                        Behavior on opacity {
                            animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
                        }
                    }

                    IconImage {
                        id: mainAppIcon
                        anchors.bottom: parent.bottom
                        anchors.right: parent.right
                        anchors.bottomMargin: (!GlobalStates.workspaceShowNumbers && !ConfigOptions.bar.workspaces.alwaysShowNumbers) ? 
                            (workspaceButtonHeight - workspaceIconSize) / 1.8 : workspaceIconMarginShrinked
                        anchors.rightMargin: (!GlobalStates.workspaceShowNumbers && !ConfigOptions.bar.workspaces.alwaysShowNumbers) ? 
                            (workspaceButtonHeight - workspaceIconSize) / 0.6 : workspaceIconMarginShrinked

                        opacity: (workspaceButtonBackground.biggestWindow && !GlobalStates.workspaceShowNumbers && !ConfigOptions.bar.workspaces.alwaysShowNumbers) ? 
                            1 : workspaceButtonBackground.biggestWindow ? workspaceIconOpacityShrinked : 0
                        visible: opacity > 0
                        source: workspaceButtonBackground.mainAppIconSource
                        implicitSize: (!GlobalStates.workspaceShowNumbers && !ConfigOptions.bar.workspaces.alwaysShowNumbers) ? workspaceIconSize : workspaceIconSizeShrinked

                        Behavior on opacity {
                            animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
                        }
                        Behavior on anchors.bottomMargin {
                            animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
                        }
                        Behavior on anchors.rightMargin {
                            animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
                        }
                        Behavior on implicitSize {
                            animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
                        }
                    }
                }
            }
        }
    }
}