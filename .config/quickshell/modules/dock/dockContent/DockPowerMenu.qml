import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell.Hyprland
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"

RowLayout {
    id: powerMenuRoot

    spacing: 8
    Repeater {
        id: buttonRepeater

        model: [{
            "icon": "lock",
            "tooltip": qsTr("Lock"),
            "command": "exec hyprlock",
            "containerColor": Appearance.colors.colSecondaryContainer,
            "iconColor": Appearance.colors.colOnSecondaryContainer,
            "hoverContainerColor": Appearance.colors.colSecondaryContainerHover,
            "hoverIconColor": Appearance.colors.colOnSecondaryContainer
        }, {
            "icon": "arrow_warm_up",
            "tooltip": qsTr("Reboot to UEFI"),
            "command": "exec systemctl reboot --firmware-setup",
            "containerColor": Qt.rgba(Appearance.m3colors.m3error.r, Appearance.m3colors.m3error.g, Appearance.m3colors.m3error.b, 0.15),
            "iconColor": Appearance.m3colors.m3error,
            "hoverContainerColor": Qt.rgba(Appearance.m3colors.m3error.r, Appearance.m3colors.m3error.g, Appearance.m3colors.m3error.b, 0.25),
            "hoverIconColor": Appearance.m3colors.m3error
        }, {
            "icon": "dark_mode",
            "tooltip": qsTr("Sleep"),
            "command": "exec systemctl suspend || loginctl suspend",
            "containerColor": Appearance.colors.colLayer2,
            "iconColor": Appearance.colors.colOnLayer2,
            "hoverContainerColor": Appearance.colors.colLayer2Hover,
            "hoverIconColor": Appearance.colors.colOnLayer2
        }, {
            "icon": "logout",
            "tooltip": qsTr("Logout"),
            "command": "exec pkill Hyprland",
            "containerColor": Qt.rgba(Appearance.m3colors.term11.r, Appearance.m3colors.term11.g, Appearance.m3colors.term11.b, 0.15),
            "iconColor": Appearance.m3colors.term11,
            "hoverContainerColor": Qt.rgba(Appearance.m3colors.term11.r, Appearance.m3colors.term11.g, Appearance.m3colors.term11.b, 0.25),
            "hoverIconColor": Appearance.m3colors.term11
        }, {
            "icon": "restart_alt",
            "tooltip": qsTr("Restart"),
            "command": "exec reboot || loginctl reboot",
            "containerColor": Qt.rgba(Appearance.m3colors.term3.r, Appearance.m3colors.term3.g, Appearance.m3colors.term3.b, 0.15),
            "iconColor": Appearance.m3colors.term3,
            "hoverContainerColor": Qt.rgba(Appearance.m3colors.term3.r, Appearance.m3colors.term3.g, Appearance.m3colors.term3.b, 0.25),
            "hoverIconColor": Appearance.m3colors.term3
        }, {
            "icon": "power_settings_new",
            "tooltip": qsTr("Shutdown"),
            "command": "exec systemctl poweroff || loginctl poweroff",
            "containerColor": Qt.rgba(Appearance.m3colors.m3error.r, Appearance.m3colors.m3error.g, Appearance.m3colors.m3error.b, 0.15),
            "iconColor": Appearance.m3colors.m3error,
            "hoverContainerColor": Qt.rgba(Appearance.m3colors.m3error.r, Appearance.m3colors.m3error.g, Appearance.m3colors.m3error.b, 0.25),
            "hoverIconColor": Appearance.m3colors.m3error
        }
        ]

        delegate: Item {
            id: buttonContainer

            property bool isPressed: false
            property bool isHovered: false

            Layout.preferredWidth: 50
            Layout.preferredHeight: 50

            Rectangle {
                // ToolTip {
                //     id: toolTip
                //     visible: mouseArea.containsMouse
                //     text: modelData.tooltip
                //     padding: 8
                //     font.pixelSize: Appearance.font.family.title
                //     y: -100
                //     background: Rectangle {
                //         radius: Appearance.rounding.verysmall
                //         color: Appearance.colors.colLayer0
                //         width: parent.width + 15
                //         anchors.fill: parent
                //     }
                //     // Optional: smooth fade in/out
                //     Behavior on visible {
                //         NumberAnimation {
                //             duration: 150
                //             easing.type: Easing.InOutQuad
                //         }
                //     }
                // }

                id: button

                anchors.fill: parent
                radius: Appearance.rounding.normal
                color: buttonContainer.isHovered ? modelData.hoverContainerColor : modelData.containerColor
                scale: buttonContainer.isHovered ? 1.2 : 1

                MaterialSymbol {
                    id: icon

                    anchors.centerIn: parent
                    color: buttonContainer.isHovered ? modelData.hoverIconColor : modelData.iconColor
                    horizontalAlignment: Text.AlignHCenter
                    iconSize: 24
                    text: modelData.icon
                    rotation: buttonContainer.isHovered ? 15 : 0
                    scale: buttonContainer.isHovered ? 1.5 : 1
                    y: buttonContainer.isHovered ? -4 : 0

                    Behavior on rotation {
                        NumberAnimation {
                            duration: 300
                            easing.type: Easing.InOutQuad
                        }

                    }

                    Behavior on scale {
                        NumberAnimation {
                            duration: 300
                            easing.type: Easing.InOutQuad
                        }

                    }

                    Behavior on y {
                        NumberAnimation {
                            duration: 300
                            easing.type: Easing.OutBounce
                        }

                    }

                    Behavior on color {
                        ColorAnimation {
                            duration: Appearance.animation.elementMoveFast.duration
                            easing.type: Appearance.animation.elementMoveFast.type
                            easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
                        }

                    }

                }

                MouseArea {
                    id: mouseArea

                    anchors.fill: parent
                    hoverEnabled: true
                    onEntered: {
                        buttonContainer.isHovered = true;
                    }
                    onExited: {
                        buttonContainer.isHovered = false;
                    }
                    onPressed: {
                        buttonContainer.isPressed = true;
                    }
                    onReleased: {
                        buttonContainer.isPressed = false;
                    }
                    onClicked: {
                        Hyprland.dispatch(modelData.command);
                        console.log(modelData.tooltip + " clicked");
                    }
                }

                Behavior on scale {
                    NumberAnimation {
                        duration: 300
                        easing.type: Easing.InOutQuad
                    }

                }

                Behavior on color {
                    ColorAnimation {
                        duration: Appearance.animation.elementMoveFast.duration
                        easing.type: Appearance.animation.elementMoveFast.type
                        easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
                    }

                }

            }

        }

    }

}
