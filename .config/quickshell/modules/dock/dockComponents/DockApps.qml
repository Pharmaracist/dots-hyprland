import "root:/"
import "root:/services"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/modules/common/functions/color_utils.js" as ColorUtils
import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Effects
import QtQuick.Layouts
import Quickshell.Io
import Quickshell
import Quickshell.Widgets
import Quickshell.Wayland
import Quickshell.Hyprland

Item {
    id: root
    property real maxWindowPreviewHeight: 200
    property real maxWindowPreviewWidth: 300
    property real windowControlsHeight: 30

    property Item lastHoveredButton
    property bool buttonHovered: false
    property bool requestDockShow: previewPopup.show

    Layout.fillHeight: true
    Layout.topMargin: Appearance.sizes.hyprlandGapsOut
    implicitWidth: listView.implicitWidth
    
    StyledListView {
        id: listView
        spacing: 2
        orientation: ListView.Horizontal
        anchors {
            top: parent.top
            bottom: parent.bottom
        }
        implicitWidth: contentWidth

        Behavior on implicitWidth {
            animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
        }

        model: ScriptModel {
            objectProp: "appId"
            values: {
                const pinned = ConfigOptions?.dock.pinnedApps ?? [];
                const values = [];
                const pinnedSet = new Set();

                // Add pinned apps
                for (const appId of pinned) {
                    const id = appId.toLowerCase();
                    pinnedSet.add(id);
                    values.push({
                        appId: id,
                        pinned: true,
                        toplevels: ToplevelManager.toplevels.values.filter(t => t.appId.toLowerCase() === id)
                    });
                }

                // Check if there are unpinned open apps
                const unpinnedApps = ToplevelManager.toplevels.values.filter(t => !pinnedSet.has(t.appId.toLowerCase()));

                if (pinned.length > 0 && unpinnedApps.length > 0) {
                    values.push({ appId: "SEPARATOR", pinned: false, toplevels: [] });
                }

                // Add unpinned open apps
                const seen = new Set();
                for (const toplevel of unpinnedApps) {
                    const id = toplevel.appId.toLowerCase();
                    if (!seen.has(id)) {
                        seen.add(id);
                        values.push({
                            appId: id,
                            pinned: false,
                            toplevels: unpinnedApps.filter(t => t.appId.toLowerCase() === id)
                        });
                    }
                }

                return values;
            }
        }
        
        delegate: DockAppButton {
            required property var modelData
            appToplevel: modelData
            appListRoot: root
        }
    }

    PopupWindow {
        id: previewPopup
        property var appTopLevel: root.lastHoveredButton?.appToplevel
        property bool allPreviewsReady: false
        
        Connections {
            target: root
            function onLastHoveredButtonChanged() {
                previewPopup.allPreviewsReady = false;
            } 
        }
        
        function updatePreviewReadiness() {
            for(var i = 0; i < previewRowLayout.children.length; i++) {
                const view = previewRowLayout.children[i];
                if (view.hasContent === false) {
                    allPreviewsReady = false;
                    return;
                }
            }
            allPreviewsReady = true;
        }
        
        property bool shouldShow: {
            const hoverConditions = (popupMouseArea.containsMouse || root.buttonHovered)
            return hoverConditions && allPreviewsReady;
        }
        property bool show: false

        onShouldShowChanged: {
            updateTimer.restart();
        }
        
        Timer {
            id: updateTimer
            interval: 100
            onTriggered: previewPopup.show = previewPopup.shouldShow
        }
        
        anchor {
            window: root.QsWindow?.window
            adjustment: PopupAdjustment.None
            gravity: Edges.Top | Edges.Right
            edges: Edges.Top | Edges.Left
        }
        
        visible: popupBackground.visible && root.QsWindow?.window
        color: "transparent"
        implicitWidth: root.QsWindow?.window?.width ?? 1
        implicitHeight: popupMouseArea.implicitHeight + root.windowControlsHeight + Appearance.sizes.elevationMargin * 2

        MouseArea {
            id: popupMouseArea
            anchors.bottom: parent.bottom
            implicitWidth: popupBackground.implicitWidth + Appearance.sizes.elevationMargin * 2
            implicitHeight: root.maxWindowPreviewHeight + root.windowControlsHeight + Appearance.sizes.elevationMargin * 2
            hoverEnabled: true
            
            x: {
                // Safe mapping with null checks
                if (!root.QsWindow?.window || !root.lastHoveredButton) {
                    return 0;
                }
                
                try {
                    const itemCenter = root.QsWindow.mapFromItem(
                        root.lastHoveredButton, 
                        root.lastHoveredButton.width / 2, 
                        0
                    );
                    return itemCenter ? itemCenter.x - width / 2 : 0;
                } catch (e) {
                    console.warn("Mapping error:", e);
                    return 0;
                }
            }
            
            StyledRectangularShadow {
                target: popupBackground
                opacity: previewPopup.show ? 1 : 0
                visible: opacity > 0
                Behavior on opacity {
                    animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
                }
            }
            
            Rectangle {
                id: popupBackground
                property real padding: 5
                opacity: previewPopup.show ? 1 : 0
                visible: opacity > 0
                
                Behavior on opacity {
                    animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
                }
                
                clip: true
                color: Appearance.colors.colSurfaceContainer
                radius: Appearance.rounding.normal
                anchors.bottom: parent.bottom
                anchors.bottomMargin: Appearance.sizes.elevationMargin
                anchors.horizontalCenter: parent.horizontalCenter
                implicitHeight: previewRowLayout.implicitHeight + padding * 2
                implicitWidth: previewRowLayout.implicitWidth + padding * 2
                
                Behavior on implicitWidth {
                    animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
                }
                Behavior on implicitHeight {
                    animation: Appearance.animation.elementMoveFast.numberAnimation.createObject(this)
                }

                RowLayout {
                    id: previewRowLayout
                    anchors.centerIn: parent
                    
                    Repeater {
                        model: ScriptModel {
                            values: previewPopup.appTopLevel?.toplevels ?? []
                        }
                        
                        RippleButton {
                            id: windowButton
                            required property var modelData
                            padding: 0
                            
                            middleClickAction: () => windowButton.modelData?.close()
                            onClicked: windowButton.modelData?.activate()
                            
                            contentItem: ColumnLayout {
                                implicitWidth: screencopyView.implicitWidth
                                implicitHeight: screencopyView.implicitHeight

                                ButtonGroup {
                                    contentWidth: parent.width - anchors.margins * 2
                                    
                                    WrapperRectangle {
                                        Layout.fillWidth: true
                                        color: ColorUtils.transparentize(Appearance.colors.colSurfaceContainer)
                                        radius: Appearance.rounding.small
                                        margin: 5
                                        
                                        StyledText {
                                            Layout.fillWidth: true
                                            font.pixelSize: Appearance.font.pixelSize.small
                                            text: windowButton.modelData?.title
                                            elide: Text.ElideRight
                                            color: Appearance.m3colors.m3onSurface
                                        }
                                    }
                                    
                                    GroupButton {
                                        id: closeButton
                                        colBackground: ColorUtils.transparentize(Appearance.colors.colSurfaceContainer)
                                        baseWidth: windowControlsHeight
                                        baseHeight: windowControlsHeight
                                        buttonRadius: Appearance.rounding.full
                                        
                                        contentItem: MaterialSymbol {
                                            anchors.centerIn: parent
                                            horizontalAlignment: Text.AlignHCenter
                                            text: "close"
                                            iconSize: Appearance.font.pixelSize.normal
                                            color: Appearance.m3colors.m3onSurface
                                        }
                                        
                                        onClicked: windowButton.modelData?.close()
                                    }
                                }
                                
                                ScreencopyView {
                                    id: screencopyView
                                    captureSource: previewPopup ? windowButton.modelData : undefined
                                    live: true
                                    paintCursor: true
                                    constraintSize: Qt.size(root.maxWindowPreviewWidth, root.maxWindowPreviewHeight)
                                    
                                    onHasContentChanged: previewPopup.updatePreviewReadiness()
                                    
                                    layer.enabled: true
                                    layer.effect: OpacityMask {
                                        maskSource: Rectangle {
                                            width: screencopyView.width
                                            height: screencopyView.height
                                            radius: Appearance.rounding.small
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}