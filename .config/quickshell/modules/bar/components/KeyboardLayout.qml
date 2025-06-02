import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import "root:/modules/common"
import "root:/modules/common/widgets"

Item {
    id: root

    // Common properties
    property real commonIconSize: Appearance.font.pixelSize.larger
    property color commonIconColor: Appearance.colors.colOnLayer0
    property color backgroundColor: "transparent"
    property string currentLayout: "EN"

    // Function to update layout
    function updateLayout() {
        if (Hyprland.devices && Hyprland.devices.keyboards) {
            for (const keyboard of Hyprland.devices.keyboards) {
                if (keyboard.main && keyboard.active_keymap) {
                    root.currentLayout = keyboard.active_keymap.substring(0, 2).toUpperCase();
                    break;
                }
            }
        }
    }

    implicitWidth: row.implicitWidth + 16
    implicitHeight: parent.height
    // Initial layout check
    Component.onCompleted: {
        updateLayout();
    }

    RowLayout {
        id: row

        spacing: 4
        anchors.centerIn: parent

        MaterialSymbol {
            text: "keyboard"
            iconSize: commonIconSize
            color: commonIconColor

            MouseArea {
                anchors.fill: parent
                onClicked: {
                    if (Hyprland.devices && Hyprland.devices.keyboards) {
                        const mainKeyboard = Hyprland.devices.keyboards.find((kb) => {
                            return kb.main;
                        });
                        if (mainKeyboard)
                            Hyprland.sendMessage("switchxkblayout " + mainKeyboard.name + " next");

                    }
                }
            }

        }

        StyledText {
            text: root.currentLayout
            color: commonIconColor
            font.pixelSize: commonIconSize * 0.8
        }

    }

    // Monitor keyboard layout changes
    Connections {
        function onPropertyChanged(name, value) {
            if (name === "devices")
                updateLayout();

        }

        target: Hyprland
    }

    // Watch for keyboard device changes
    Connections {
        function onEvent(name, data) {
            if (name === "activelayout")
                updateLayout();

        }

        target: Hyprland
    }

    // Fallback timer
    Timer {
        interval: 2000
        running: true
        repeat: true
        onTriggered: updateLayout()
    }

}
