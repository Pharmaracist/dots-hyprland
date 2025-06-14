import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Services.Mpris
import Quickshell.Wayland
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
            exclusiveZone: frameCanvas.frameThickness // ✅ FIXED
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

                property real frameThickness: Appearance.sizes.frameThickness - 2
                property real cornerRadius: Appearance.rounding.screenRounding - 2
                property real innerRadius: cornerRadius + 2
                property color frameColor: Appearance.colors.colLayer0

                anchors.fill: parent
                onPaint: {
                    var ctx = getContext("2d");
                    ctx.clearRect(0, 0, width, height);
                    ctx.strokeStyle = frameColor;
                    ctx.lineWidth = frameThickness;
                    ctx.lineCap = "butt";
                    ctx.lineJoin = "miter";
                    var halfThickness = frameThickness / 2;
                    var outerRadius = Math.max(0, cornerRadius - halfThickness);
                    var innerR = Math.max(0, innerRadius);
                    ctx.beginPath();
                    // Top line
                    ctx.moveTo(0, halfThickness);
                    ctx.lineTo(width - halfThickness - outerRadius, halfThickness);
                    // Top-right corner
                    ctx.arcTo(width - halfThickness, halfThickness, width - halfThickness, halfThickness + outerRadius, outerRadius);
                    // Right line
                    ctx.lineTo(width - halfThickness, height - halfThickness - outerRadius);
                    // Bottom-right corner
                    ctx.arcTo(width - halfThickness, height - halfThickness, width - halfThickness - outerRadius, height - halfThickness, outerRadius);
                    // Bottom line
                    ctx.lineTo(0, height - halfThickness);
                    // Inner path for frame effect
                    if (innerR > 0 && frameThickness > 0) {
                        ctx.lineTo(frameThickness, height - frameThickness);
                        ctx.lineTo(width - frameThickness - innerR, height - frameThickness);
                        ctx.arcTo(width - frameThickness, height - frameThickness, width - frameThickness, height - frameThickness - innerR, innerR);
                        ctx.lineTo(width - frameThickness, frameThickness + innerR);
                        ctx.arcTo(width - frameThickness, frameThickness, width - frameThickness - innerR, frameThickness, innerR);
                        ctx.lineTo(frameThickness, frameThickness);
                        ctx.lineTo(0, halfThickness);
                    }
                    ctx.stroke();
                }
                onFrameThicknessChanged: requestPaint()
                onCornerRadiusChanged: requestPaint()
                onFrameColorChanged: requestPaint()
                onWidthChanged: requestPaint()
                onHeightChanged: requestPaint()
                Component.onCompleted: requestPaint()
            }

            mask: Region {
                item: frameCanvas // ✅ FIXED
            }

        }

    }

}
