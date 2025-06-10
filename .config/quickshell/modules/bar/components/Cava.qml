import "root:/modules/common"
import "root:/modules/common/widgets"
import QtQuick
import QtQuick.Layouts
import Quickshell.Wayland
import Quickshell.Hyprland
import "root:/services/Cava.qml" as Cava

Item {
    id: root
    property list<int> values: Cava.values

    // Simple bar visualizer
    Row {
        id: visualizer
        anchors.centerIn: parent
        spacing: 2

        Repeater {
            model: root.values.length

            Rectangle {
                width: Math.max(1, (root.width - (root.values.length * 2)) / root.values.length)
                height: Math.max(5, (root.values[index] || 0) * 2)

                color: Qt.hsla(
                    (root.values[index] || 0) / 100 * 0.8, // Hue based on value
                    0.8, // Saturation
                    0.6, // Lightness
                    0.9  // Alpha
                )

                anchors.bottom: parent.bottom

                Behavior on height {
                NumberAnimation {
                    duration: 50
                    easing.type: Easing.OutQuad
                }
            }
        }
    }
}

// Debug info text
Text {
    anchors.top: parent.top
    anchors.left: parent.left
    anchors.margins: 10
    color: "#888"
    text: `Bars: ${root.values.length} | Peak: ${Math.max(...root.values) || 0} | Values: ${JSON.stringify(root.values.slice(0, 5))}`
    font.family: "monospace"
}

// Debug the cava service
Component.onCompleted: {
    console.log("Cava values:", Cava.values)
    console.log("Cava values length:", Cava.values.length)
}

// Monitor changes
onValuesChanged: {
    console.log("Values updated:", root.values.length, "values")
    if (root.values.length > 0)
    {
        console.log("First 5 values:", root.values.slice(0, 5))
    }
}
}