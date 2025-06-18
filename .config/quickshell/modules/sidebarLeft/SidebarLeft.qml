import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Io
import Quickshell.Wayland
import Quickshell.Widgets

Scope {
    id: root

    property int sidebarPadding: 15
    property bool detach: false
    property bool pinned: PersistentStates.sidebar.attachments.pinned ?? true
    property Component contentComponent: SidebarLeftContent { }
    property Item sidebarContent

    Component.onCompleted: {
        root.sidebarContent = contentComponent.createObject(null, {
            "scopeRoot": root,
        });
        sidebarLoader.item.contentParent.children = [root.sidebarContent];
    }

    onDetachChanged: {
        if (root.detach) {
            sidebarContent.parent = null;
            sidebarLoader.active = false;
            detachedSidebarLoader.active = true;
            detachedSidebarLoader.item.contentParent.children = [sidebarContent];
        } else {
            sidebarContent.parent = null;
            detachedSidebarLoader.active = false;
            sidebarLoader.active = true;
            sidebarLoader.item.contentParent.children = [sidebarContent];
        }
    }

    Loader {
        id: sidebarLoader
        active: true

        sourceComponent: PanelWindow {
            id: sidebarRoot
            visible: GlobalStates.sidebarLeftOpen
            readonly property bool dockPinned: PersistentStates.dock.pinned
            property bool extend: PersistentStates.sidebar.attachments.extended
            property real sidebarWidth: sidebarRoot.extend ? Appearance.sizes.sidebarWidthExtended : Appearance.sizes.sidebarWidth
            property var contentParent: sidebarLeftBackground

            function hide() {
                GlobalStates.sidebarLeftOpen = false
            }

            exclusiveZone: root.pinned ? (sidebarWidth - Appearance.sizes.hyprlandGapsOut) : 0
            implicitWidth: Appearance.sizes.sidebarWidthExtended + Appearance.sizes.elevationMargin
            WlrLayershell.namespace: "quickshell:sidebarLeft"
            color: "transparent"

            anchors {
                top: true
                left: true
                bottom: true
            }
            mask: Region {
                item: sidebarLeftBackground
            }

            HyprlandFocusGrab {
                id: grab
                windows: [ sidebarRoot ]
                active: sidebarRoot.visible
                onActiveChanged: {
                    if (active) sidebarLeftBackground.children[0].focusActiveItem()
                }
                onCleared: () => {
                if (!root.pinned && !active) {
                    sidebarRoot.hide();
                }
                }

            }

            StyledRectangularShadow {
                target: sidebarLeftBackground
                radius: sidebarLeftBackground.radius
            }

            Rectangle {
                id: sidebarLeftBackground
                anchors.top: parent.top
                anchors.left: parent.left
                anchors.topMargin: Appearance.sizes.hyprlandGapsOut
                anchors.leftMargin: Appearance.sizes.hyprlandGapsOut
                width: sidebarRoot.sidebarWidth - Appearance.sizes.hyprlandGapsOut - Appearance.sizes.elevationMargin
                height: parent.height - Appearance.sizes.hyprlandGapsOut * 2
                color: Appearance.colors.colLayer0
                radius: Appearance.rounding.screenRounding

                Behavior on width {
                    animation: Appearance.animation.elementMove.numberAnimation.createObject(this)
                }

                Keys.onPressed: (event) => {
                    if (event.key === Qt.Key_Escape) {
                        sidebarRoot.hide();
                    }
                    if (event.modifiers === Qt.ControlModifier) {
                        if (event.key === Qt.Key_O) {
                            sidebarRoot.extend = !sidebarRoot.extend;
                            PersistentStateManager.setState("sidebar.attachments.extended", sidebarRoot.extend)
                    } else if (event.key === Qt.Key_I) {
                            root.detach = !root.detach;
                        } else if (event.key === Qt.Key_P) {
                            root.pinned = !root.pinned;
                            PersistentStateManager.setState("sidebar.attachments.pinned", root.pinned)
                        }
                        event.accepted = true;
                    }
                }
            }
        }
    }

    Loader {
        id: detachedSidebarLoader
        active: false

        sourceComponent: FloatingWindow {
            id: detachedSidebarRoot
            visible: GlobalStates.sidebarLeftOpen
            property var contentParent: detachedSidebarBackground

            Rectangle {
                id: detachedSidebarBackground
                anchors.fill: parent
                color: Appearance.m3colors.m3background

                Keys.onPressed: (event) => {
                    if (event.modifiers === Qt.ControlModifier) {
                        if (event.key === Qt.Key_I) {
                            root.detach = !root.detach;
                        }
                        event.accepted = true;
                    }
                }
            }
        }
    }

    IpcHandler {
        target: "sidebarLeft"

        function toggle(): void {
            GlobalStates.sidebarLeftOpen = !GlobalStates.sidebarLeftOpen
        }

        function close(): void {
            GlobalStates.sidebarLeftOpen = false
        }

        function open(): void {
            GlobalStates.sidebarLeftOpen = true
        }
    }

    GlobalShortcut {
        name: "sidebarLeftToggle"
        description: qsTr("Toggles left sidebar on press")
        onPressed: GlobalStates.sidebarLeftOpen = !GlobalStates.sidebarLeftOpen;
    }

    GlobalShortcut {
        name: "sidebarLeftOpen"
        description: qsTr("Opens left sidebar on press")
        onPressed: GlobalStates.sidebarLeftOpen = true;
    }

    GlobalShortcut {
        name: "sidebarLeftClose"
        description: qsTr("Closes left sidebar on press")
        onPressed: GlobalStates.sidebarLeftOpen = false;
    }

    GlobalShortcut {
        name: "sidebarLeftToggleDetach"
        description: qsTr("Detach left sidebar into a window/Attach it back")
        onPressed: root.detach = !root.detach;
    }
}
