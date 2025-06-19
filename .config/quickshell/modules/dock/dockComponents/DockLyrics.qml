import QtQuick
import QtQuick.Controls
import Quickshell.Io
import "root:/"
import "root:/modules/common"

Item {
    id: root
    
    property string lyricsPath: "/home/pharmaracist/.cache/lrcsync"
    property string lyrics: readLyrics.buffer
    
    Component.onCompleted: {
        lrcsync.running = true
        timer.start()
    }
    
    Component.onDestruction: {
        timer.stop()
        lrcsync.kill()
        readLyrics.kill()
    }
    
    // Start lrcsync process
    Process {
        id: lrcsync
        command: ["lrcsnc", "-p", "-o", root.lyricsPath, "-c", 
                 "/home/pharmaracist/.config/lrcsync/config.toml"]
    }
    
    // Read lyrics file periodically
    Timer {
        id: timer
        interval: 750
        repeat: true
        onTriggered: readLyrics.running = true
    }
    
    Process {
        id: readLyrics
        command: ["cat", root.lyricsPath]
        property string buffer: ""
        
        onStarted: buffer = ""
        stdout: SplitParser {
            onRead: data => readLyrics.buffer += data
        }
    }
    
    // Display lyrics
    Text {
        id:lyrics
        anchors.centerIn: parent
        text: root.lyrics || ""
        font.pixelSize: Appearance.font.pixelSize.normal
        font.family: Appearance.font.family.main
        color: Appearance.colors.colOnLayer1
        horizontalAlignment: Text.AlignHCenter
        opacity: 0.5
        
        Behavior on text {
            SequentialAnimation {
                ParallelAnimation {
                    NumberAnimation {
                        target: lyrics
                        property: "scale"
                        to: 1.05
                        duration: 150
                        easing.type: Easing.OutQuad
                    }
                    ColorAnimation {
                        target: lyrics
                        property: "color"
                        to: Appearance.colors.accent || "#ffffff"
                        duration: 150
                    }
                }
                ParallelAnimation {
                    NumberAnimation {
                        target: lyrics
                        property: "scale"
                        to: 1.0
                        duration: 300
                        easing.type: Easing.OutElastic
                    }
                    ColorAnimation {
                        target: lyrics
                        property: "color"
                        to: Appearance.colors.colOnLayer1
                        duration: 300
                    }
                }
            }
        }
    }
}