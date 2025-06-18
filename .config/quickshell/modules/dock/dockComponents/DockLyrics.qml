import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"

Item {
    id: root
    property string lyricsFilePath: "/home/pharmaracist/.cache/lrcsync"
    property string lyricsText: ""

    // Start lrcsnc on component completion
    Component.onCompleted: {
        lrcsncProc.running = true
        updateTimer.running = true
    }

    Timer {
        id: updateTimer
        interval: 500
        repeat: true
        running: false
        onTriggered: readLyrics.running = true
    }

    Process {
        id: lrcsncProc
        command: ["lrcsnc", "-p", "-o", lyricsFilePath , "-c", "/home/pharmaracist/.config/lrcsync/config.toml"]
    }

    Process {
        id: readLyrics
        command: ["cat", lyricsFilePath]
        property string buffer: ""

        onStarted: buffer = ""

        stdout: SplitParser {
            onRead: data => {
                readLyrics.buffer += data + "\n"
            }
        }

        onExited: {
            root.lyricsText = readLyrics.buffer.trim()
            readLyrics.buffer = ""
        }
    }
        Text {
            font.pixelSize: Appearance.font.pixelSize.small
            color: Appearance.colors.colOnLayer1
            horizontalAlignment: Text.AlignHCenter
            text: root.lyricsText.length > 0 ? root.lyricsText : undefined
            font.family:Appearance.font.colOnLayer1
            opacity: 0.5
        }
}
