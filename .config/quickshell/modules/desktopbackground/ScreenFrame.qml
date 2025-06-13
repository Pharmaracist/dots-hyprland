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

            WlrLayershell.layer: WlrLayer.Bottom
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

                property real frameThickness: Appearance.sizes.frameThickness - 2 // idk why but its nicer that way
                property real cornerRadius: Appearance.rounding.screenRounding - 2
                property real innerRadius: cornerRadius + 2
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
                    var outerRadius = Math.max(0, cornerRadius - halfThickness);
                    var innerR = Math.max(0, innerRadius);
                    // Draw outer frame path
                    ctx.beginPath();
                    // Top line (from left edge to right, no left corner)
                    ctx.moveTo(0, halfThickness);
                    ctx.lineTo(width - halfThickness - outerRadius, halfThickness);
                    // Top-right corner (outer)
                    ctx.arcTo(width - halfThickness, halfThickness, width - halfThickness, halfThickness + outerRadius, outerRadius);
                    // Right line
                    ctx.lineTo(width - halfThickness, height - halfThickness - outerRadius);
                    // Bottom-right corner (outer)
                    ctx.arcTo(width - halfThickness, height - halfThickness, width - halfThickness - outerRadius, height - halfThickness, outerRadius);
                    // Bottom line (from right to left edge, no left corner)
                    ctx.lineTo(0, height - halfThickness);
                    // Now draw the inner path in reverse to create the frame effect
                    if (innerR > 0 && frameThickness > 0) {
                        // Move to inner bottom-left
                        ctx.lineTo(frameThickness, height - frameThickness);
                        // Inner bottom line (left to right)
                        ctx.lineTo(width - frameThickness - innerR, height - frameThickness);
                        // Inner bottom-right corner
                        ctx.arcTo(width - frameThickness, height - frameThickness, width - frameThickness, height - frameThickness - innerR, innerR);
                        // Inner right line
                        ctx.lineTo(width - frameThickness, frameThickness + innerR);
                        // Inner top-right corner
                        ctx.arcTo(width - frameThickness, frameThickness, width - frameThickness - innerR, frameThickness, innerR);
                        // Inner top line (right to left)
                        ctx.lineTo(frameThickness, frameThickness);
                        // Close the path back to start
                        ctx.lineTo(0, halfThickness);
                    }
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
