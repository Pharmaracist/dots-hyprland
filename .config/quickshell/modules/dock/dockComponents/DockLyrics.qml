import QtQuick
import QtQuick.Controls
import Quickshell.Io
import "root:/"
import "root:/modules/common"

Item {
    id: root

    property string lyrics: ""

    Component.onCompleted: {
        readLyrics.running = true
    }

    Component.onDestruction: {
        readLyrics.running = false
    }

    // Run lrcsnc and read real-time output
    Process {
        id: readLyrics
        command: ["lrcsnc","-c","~/.config/lrcsnc/config.toml"]
        property string buffer: ""
        onStarted: buffer = ""

        stdout: SplitParser {
           onRead: data => {
                readLyrics.buffer = data
                root.lyrics = data
            }
        }
    }

Text {
    visible:PersistentStates.dock.lyrics
    id: lyricsDisplay
    anchors.centerIn: parent
    text: root.lyrics || ""
    font.pixelSize: Appearance.font.pixelSize.small - 1
    font.family: Appearance.font.family.title
    color: Appearance.colors.colOnLayer1
    horizontalAlignment: Text.AlignHCenter
    opacity: 0.5

    Behavior on text {
        SequentialAnimation {
            // Scale Up
            NumberAnimation {
                target: lyricsDisplay
                property: "scale"
                from: 1.0
                to: 1.05
                duration: Appearance.animation.clickBounce.duration
                easing.type: Appearance.animation.clickBounce.type
                easing.bezierCurve: Appearance.animation.clickBounce.bezierCurve
            }

            // Color Accent Transition
            ColorAnimation {
                target: lyricsDisplay
                property: "color"
                to: Appearance.colors.colPrimary
                duration: Appearance.animation.elementMoveFast.duration
                easing.type: Appearance.animation.elementMoveFast.type
                easing.bezierCurve: Appearance.animation.elementMoveFast.bezierCurve
            }

            // Scale Down
            NumberAnimation {
                target: lyricsDisplay
                property: "scale"
                to: 1.0
                duration: Appearance.animation.elementMoveEnter.duration
                easing.type: Appearance.animation.elementMoveEnter.type
                easing.bezierCurve: Appearance.animation.elementMoveEnter.bezierCurve
            }

            // Restore Color
            ColorAnimation {
                target: lyricsDisplay
                property: "color"
                to: Appearance.colors.colOnLayer1
                duration: Appearance.animation.elementMoveExit.duration
                easing.type: Appearance.animation.elementMoveExit.type
                easing.bezierCurve: Appearance.animation.elementMoveExit.bezierCurve
            }
        }
    }
}

}
