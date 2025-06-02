import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Effects
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Wayland
import "root:/modules/common"
import "root:/modules/common/functions/file_utils.js" as FileUtils
import "root:/modules/common/functions/string_utils.js" as StringUtils
import "root:/modules/common/widgets"
import "root:/services"

Scope {
    property string time
    property ShellScreen modelData: Quickshell.screens[0]
    property int commonRadius: Appearance.rounding.screenRounding
    property int iconSize: 45

    PanelWindow {
        id: root

        exclusiveZone: -1
        screen: modelData
        WlrLayershell.layer: WlrLayer.Background
        color: "transparent"
        implicitWidth: Quickshell.screens[0].width
        implicitHeight: Quickshell.screens[0].height

        anchors {
            top: true
            left: true
        }

        margins {
            top: 10 * Appearance.sizes.floatingMargin
            left: 3 * Appearance.sizes.floatingMargin
        }

        ColumnLayout {
            spacing: 30

            CustomIcon {
                id: computerIcon

                width: iconSize
                height: iconSize
                source: "desktop-symbolic"

                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        Hyprland.dispatch("exec dolphin --new-window");
                    }
                }

                ColorOverlay {
                    anchors.fill: parent
                    source: parent
                    color: Appearance.colors.colOnLayer0
                }

            }

            CustomIcon {
                id: trash

                width: iconSize
                height: iconSize
                source: "trash-symbolic"

                MouseArea {
                    anchors.fill: trash
                    onClicked: {
                        Hyprland.dispatch("exec dolphin --new-window trash:/");
                    }
                }

                ColorOverlay {
                    anchors.fill: parent
                    source: parent
                    color: Appearance.colors.colOnLayer3
                }

            }

        }

    }

}
