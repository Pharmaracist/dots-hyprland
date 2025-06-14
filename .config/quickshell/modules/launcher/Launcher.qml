import "root:/"
import "root:/services"
import "root:/modules/common"
import "root:/modules/common/widgets"
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import Quickshell.Hyprland

Scope {
    id: launcherScope
    property var activeScreen: Quickshell?.screens.find(s => s.name === Hyprland.focusedMonitor?.name) ?? Quickshell.screens[0]
    property bool preventAutoCancel: false
    property string pendingQueryText: ""
    
    Variants {
        id: launcherVariants
        model: !ConfigOptions.launcher.showOnMainScreenOnly ? Quickshell.screens : [activeScreen]
        
        PanelWindow {
            id: launcherWindow
            required property var modelData
            property string queryText: ""
            readonly property HyprlandMonitor currentMonitor: Hyprland.monitorFor(launcherWindow.screen)
            property bool isMonitorActive: (Hyprland.focusedMonitor?.id == currentMonitor.id)
            
            screen: modelData
            visible: GlobalStates.launcherVisible

            WlrLayershell.namespace: "quickshell:launcher"
            WlrLayershell.layer: WlrLayer.Overlay
            WlrLayershell.keyboardFocus: GlobalStates.launcherVisible ? WlrKeyboardFocus.OnDemand : WlrKeyboardFocus.None
            color: "transparent"

            mask: Region {
                item: GlobalStates.launcherVisible ? mainLayout : null
            }
            HyprlandWindow.visibleMask: Region {
                item: GlobalStates.launcherVisible ? mainLayout : null
            }

            anchors {
                top: true
                left: true
                right: true
                bottom: true
            }

            HyprlandFocusGrab {
                id: focusGrabber
                windows: [ launcherWindow ]
                property bool canActivate: launcherWindow.isMonitorActive
                active: false
                onCleared: () => {
                    if (!active) GlobalStates.launcherVisible = false
                }
            }

            Connections {
                target: GlobalStates
                function onLauncherVisibleChanged() {
                    if (!GlobalStates.launcherVisible) {
                        queryWidget.disableExpandAnimation()
                        launcherScope.preventAutoCancel = false;
                        launcherScope.pendingQueryText = "";
                    } else {
                        if (!launcherScope.preventAutoCancel) {
                            queryWidget.cancelSearch()
                        }
                        
                        // Force immediate focus for special searches
                        if (launcherScope.preventAutoCancel && launcherScope.pendingQueryText !== "") {
                            queryWidget.forceActiveFocus()
                            // Set the pending text after a brief moment to ensure focus is established
                            Qt.callLater(() => {
                                queryWidget.setSearchingText(launcherScope.pendingQueryText);
                                launcherScope.pendingQueryText = "";
                            });
                        } else {
                            activationTimer.start()
                            // Force focus on the search widget
                            queryWidget.forceActiveFocus()
                        }
                    }
                }
            }

            Timer {
                id: activationTimer
                interval: ConfigOptions.hacks.arbitraryRaceConditionDelay
                repeat: false
                onTriggered: {
                    if (!focusGrabber.canActivate) return
                    focusGrabber.active = GlobalStates.launcherVisible
                }
            }

            implicitWidth: mainLayout.implicitWidth
            implicitHeight: mainLayout.implicitHeight

            function updateQueryText(text) {
                queryWidget.setSearchingText(text);
            }

            ColumnLayout {
                id: mainLayout
                visible: GlobalStates.launcherVisible
                focus: true
                anchors {
                    horizontalCenter: parent.horizontalCenter
                    top: parent.top
                    topMargin: screen.height / 4
                }

                Keys.onPressed: (event) => {
                    if (event.key === Qt.Key_Escape) {
                        GlobalStates.launcherVisible = false;
                    }
                }

                Item {
                    height: 1
                    width: 1
                }

                SearchWidget {
                    id: queryWidget
                    Layout.alignment: Qt.AlignHCenter
                    onSearchingTextChanged: (text) => {
                        launcherWindow.queryText = searchingText
                    }
                }
            }
        }
    }

    IpcHandler {
        target: "launcher"

        function toggle() {
            GlobalStates.launcherVisible = !GlobalStates.launcherVisible
        }
        function close() {
            GlobalStates.launcherVisible = false
        }
        function open() {
            GlobalStates.launcherVisible = true
        }
        function disableReleaseToggle() {
            GlobalStates.superReleaseMightTrigger = false
        }
    }

    GlobalShortcut {
        name: "launcherToggle"
        description: qsTr("Toggles application launcher")
        onPressed: {
            GlobalStates.launcherVisible = !GlobalStates.launcherVisible   
        }
    }
    
    GlobalShortcut {
        name: "launcherClose"
        description: qsTr("Closes application launcher")
        onPressed: {
            GlobalStates.launcherVisible = false
        }
    }
    
    GlobalShortcut {
        name: "launcherReleaseToggle"
        description: qsTr("Toggles launcher on key release")
        onPressed: {
            GlobalStates.superReleaseMightTrigger = true
        }
        onReleased: {
            if (!GlobalStates.superReleaseMightTrigger) {
                GlobalStates.superReleaseMightTrigger = true
                return
            }
            GlobalStates.launcherVisible = !GlobalStates.launcherVisible   
        }
    }
    
    GlobalShortcut {
        name: "launcherReleaseInterrupt"
        description: qsTr("Prevents launcher toggle on release")
        onPressed: {
            GlobalStates.superReleaseMightTrigger = false
        }
    }
    
    GlobalShortcut {
        name: "launcherClipboard"
        description: qsTr("Open launcher with clipboard search")
        onPressed: {
            if (GlobalStates.launcherVisible && launcherScope.preventAutoCancel) {
                GlobalStates.launcherVisible = false;
                return;
            }
            
            launcherScope.preventAutoCancel = true;
            launcherScope.pendingQueryText = ConfigOptions.search.prefix.clipboard;
            GlobalStates.launcherVisible = true;
        }
    }

    GlobalShortcut {
        name: "launcherEmoji"
        description: qsTr("Open launcher with emoji search")
        onPressed: {
            if (GlobalStates.launcherVisible && launcherScope.preventAutoCancel) {
                GlobalStates.launcherVisible = false;
                return;
            }
            
            launcherScope.preventAutoCancel = true;
            launcherScope.pendingQueryText = ConfigOptions.search.prefix.emojis;
            GlobalStates.launcherVisible = true;
        }
    }
}