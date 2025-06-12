import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Services.Mpris
import Quickshell.Wayland
import "layouts"
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"

Scope {
    id: screenFrame

    // For each monitor
    Variants {
        model: Quickshell.screens

        PanelWindow {
            id: root

            property ShellScreen modelData

            // WlrLayershell.layer: WlrLayer.Bottom
            WlrLayershell.namespace: "quickshell:screenFrame"
            exclusiveZone: frameCanvas
            screen: modelData
            color: "transparent"

            anchors {
                top: true
                bottom: true
                right: true
                left: true
            }

            Canvas {
                id: frameCanvas

                property real frameThickness: Appearance.sizes.frameThickness
                property real cornerRadius: Appearance.rounding.screenRounding - 2
                property color frameColor: Appearance.colors.colLayer0

                anchors.fill: parent
                onPaint: {
                    var ctx = getContext("2d");
                    ctx.clearRect(0, 0, width, height);
                    // Set frame properties
                    ctx.strokeStyle = frameColor;
                    ctx.lineWidth = frameThickness;
                    ctx.lineCap = "butt";
                    ctx.lineJoin = "miter";
                    // Calculate positions
                    var halfThickness = frameThickness / 2;
                    var adjustedRadius = Math.max(0, cornerRadius - halfThickness);
                    // Draw frame without left side and left corners
                    ctx.beginPath();
                    // Top line (from left edge to right, no left corner)
                    ctx.moveTo(0, halfThickness);
                    ctx.lineTo(width - halfThickness, halfThickness);
                    // Top-right corner
                    ctx.arcTo(width - halfThickness, halfThickness, width - halfThickness, halfThickness + adjustedRadius, adjustedRadius);
                    // Right line
                    ctx.lineTo(width - halfThickness, height - halfThickness - adjustedRadius);
                    // Bottom-right corner
                    ctx.arcTo(width - halfThickness, height - halfThickness, width - halfThickness - adjustedRadius, height - halfThickness, adjustedRadius);
                    // Bottom line (from right to left edge, no left corner)
                    ctx.lineTo(0, height - halfThickness);
                    // Stop here - no left side or left corners
                    ctx.stroke();
                }
                // Redraw when properties change
                onFrameThicknessChanged: requestPaint()
                onCornerRadiusChanged: requestPaint()
                onFrameColorChanged: requestPaint()
                onWidthChanged: requestPaint()
                onHeightChanged: requestPaint()
                Component.onCompleted: requestPaint()
            }

            mask: Region {
                item: screenFrame
            }

        }

    }

}
