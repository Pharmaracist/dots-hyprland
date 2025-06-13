import "root:/"
import "root:/services"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/modules/common/functions/string_utils.js" as StringUtils
import "./quickToggles/"
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects
import Qt5Compat.GraphicalEffects
import Quickshell.Io
import Quickshell
import Quickshell.Widgets
import Quickshell.Wayland
import Quickshell.Hyprland

Scope {
    property int sidebarWidth: Appearance.sizes.sidebarWidth
        property int sidebarPadding: 13
        readonly property bool dockPinned: PersistentStates.dock.pinned

            PanelWindow {
                id: sidebarRoot
                visible: GlobalStates.sidebarRightOpen

                function hide()
                {
                    GlobalStates.sidebarRightOpen = false
                }

                exclusiveZone: dockPinned ? -1 : 0 
                implicitWidth: sidebarWidth
                WlrLayershell.namespace: "quickshell:sidebarRight"
                // Hyprland 0.49: Focus is always exclusive and setting this breaks mouse focus grab
                // WlrLayershell.keyboardFocus: WlrKeyboardFocus.Exclusive
                color: "transparent"

                anchors {
                    top: true
                    right: true
                    bottom: true
                }

                HyprlandFocusGrab {
                    id: grab
                    windows: [ sidebarRoot ]
                    active: GlobalStates.sidebarRightOpen
                    onCleared: () => {
                    if (!active) sidebarRoot.hide()
                        }
                }

                Loader {
                    id: sidebarContentLoader
                    active: GlobalStates.sidebarRightOpen
                    anchors {
                        top: parent.top
                        bottom: parent.bottom
                        right: parent.right
                        left: parent.left
                        topMargin: Appearance.sizes.hyprlandGapsOut
                        rightMargin: Appearance.sizes.hyprlandGapsOut
                        bottomMargin: Appearance.sizes.hyprlandGapsOut
                        leftMargin: Appearance.sizes.elevationMargin
                    }
                    width: sidebarWidth - Appearance.sizes.hyprlandGapsOut - Appearance.sizes.elevationMargin
                    height: parent.height - Appearance.sizes.hyprlandGapsOut * 2

                    sourceComponent: Item {
                        implicitHeight: sidebarRightBackground.implicitHeight
                        implicitWidth: sidebarRightBackground.implicitWidth

                        StyledRectangularShadow {
                            target: sidebarRightBackground
                        }
                        Rectangle {
                            id: sidebarRightBackground

                            anchors.fill: parent
                            implicitHeight: parent.height - Appearance.sizes.hyprlandGapsOut * 2
                            implicitWidth: sidebarWidth - Appearance.sizes.hyprlandGapsOut * 2
                            color: Appearance.colors.colLayer0
                            radius: Appearance.rounding.screenRounding 

                            Keys.onPressed: (event) => {
                            if (event.key === Qt.Key_Escape)
                            {
                                sidebarRoot.hide();
                            }
                        }


                        ColumnLayout {
                            spacing: sidebarPadding
                            anchors.fill: parent
                            anchors.margins: sidebarPadding
                            UpperWidgetGroup {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillHeight: false
                                Layout.fillWidth: true
                            }
                            // Center widget group
                            CenterWidgetGroup {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillHeight: true
                                focus: sidebarRoot.visible
                                Layout.fillWidth: true
                            }

                            BottomWidgetGroup {
                                Layout.alignment: Qt.AlignHCenter
                                Layout.fillHeight: false
                                Layout.fillWidth: true
                                Layout.preferredHeight: implicitHeight
                            }
                        }
                    }
                }
            }


        }

        IpcHandler {
            target: "sidebarRight"

            function toggle(): void
            {
                GlobalStates.sidebarRightOpen = !GlobalStates.sidebarRightOpen;
                if (GlobalStates.sidebarRightOpen) Notifications.timeoutAll();
            }

            function close(): void
            {
                GlobalStates.sidebarRightOpen = false;
            }

            function open(): void
            {
                GlobalStates.sidebarRightOpen = true;
                Notifications.timeoutAll();
            }
        }

        GlobalShortcut {
            name: "sidebarRightToggle"
            description: qsTr("Toggles right sidebar on press")

            onPressed: {
                GlobalStates.sidebarRightOpen = !GlobalStates.sidebarRightOpen;
                if (GlobalStates.sidebarRightOpen) Notifications.timeoutAll();
            }
        }
        GlobalShortcut {
            name: "sidebarRightOpen"
            description: qsTr("Opens right sidebar on press")

            onPressed: {
                GlobalStates.sidebarRightOpen = true;
                Notifications.timeoutAll();
            }
        }
        GlobalShortcut {
            name: "sidebarRightClose"
            description: qsTr("Closes right sidebar on press")

            onPressed: {
                GlobalStates.sidebarRightOpen = false;
            }
        }

    }
