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
            // WlrLayershell.layer: WlrLayer.Bottom
            // WlrLayershell.namespace: "quickshell:screenFrame"

            id: root

            property ShellScreen modelData

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

                // Helper function to draw rounded rectangles
                function roundedRect(ctx, x, y, width, height, radius) {
                    if (width <= 0 || height <= 0)
                        return ;

                    if (radius > width / 2)
                        radius = width / 2;

                    if (radius > height / 2)
                        radius = height / 2;

                    if (radius < 0)
                        radius = 0;

                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(x + width - radius, y);
                    ctx.arcTo(x + width, y, x + width, y + radius, radius);
                    ctx.lineTo(x + width, y + height - radius);
                    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
                    ctx.lineTo(x + radius, y + height);
                    ctx.arcTo(x, y + height, x, y + height - radius, radius);
                    ctx.lineTo(x, y + radius);
                    ctx.arcTo(x, y, x + radius, y, radius);
                    ctx.closePath();
                }

                anchors.fill: parent
                onPaint: {
                    var ctx = getContext("2d");
                    ctx.clearRect(0, 0, width, height);
                    // Set frame properties
                    ctx.strokeStyle = frameColor;
                    ctx.lineWidth = frameThickness;
                    ctx.lineCap = "butt";
                    ctx.lineJoin = "miter";
                    // Calculate adjusted radius for the stroke position
                    var adjustedRadius = Math.max(0, cornerRadius - frameThickness / 2);
                    // Draw only the frame border (stroke, not fill)
                    ctx.beginPath();
                    roundedRect(ctx, frameThickness / 2, frameThickness / 2, width - frameThickness, height - frameThickness, adjustedRadius);
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
