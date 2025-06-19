import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import "../dockComponents"
import "root:/modules/common/functions/string_utils.js" as StringUtils
import "root:/modules/common/functions/color_utils.js" as ColorUtils
import "root:/modules/common/functions/file_utils.js" as FileUtils
import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Effects
import QtQuick.Layouts
import QtQuick.Controls
import Quickshell
import Quickshell.Io
import Quickshell.Services.Mpris
import Quickshell.Widgets

Item {
    id: root
    property string currentText: ""
    property string statusText: WhisperService.isRecording ? "Im Listening" : "Wanna Talk ?"
    property color statusColor: Appearance.colors.colOnLayer1
    Rectangle {
        anchors.fill: parent
        color:Appearance.colors.colLayer1
        radius:Appearance.rounding.screenRounding
    
    Component.onCompleted: {
        WhisperService.error.connect(function(message) {
            root.statusText = "Error: " + message
            root.statusColor = "#ff4444"
            // Reset to ready state after showing error for a bit
            errorResetTimer.start()
        })
    }
    
    
    RowLayout {
        anchors.fill: parent
        anchors.margins: 12
        spacing: 15
        
        // Record button
        Rectangle {
            id: recordButton
            Layout.preferredWidth: 50
            Layout.preferredHeight: 50
            radius: 35
            color: WhisperService.isRecording ? Appearance.m3colors.m3primary : Appearance.m3colors.m3onSurface  
            
            Behavior on color {
                ColorAnimation { duration: 200 }
            }
            
            // Pulsing animation when recording
            SequentialAnimation {
                running: WhisperService.isRecording
                loops: Animation.Infinite
                
                PropertyAnimation {
                    target: recordButton
                    property: "scale"
                    to: 1.1
                    duration: 800
                    easing.type: Easing.InOutQuad
                }
                PropertyAnimation {
                    target: recordButton
                    property: "scale"
                    to: 1.0
                    duration: 800
                    easing.type: Easing.InOutQuad
                }
            }
            
            MaterialSymbol {
                anchors.centerIn: parent
                text: WhisperService.isRecording ? "graphic_eq" : "mic"
                font.pixelSize: Appearance.font.pixelSize.huge
                color: WhisperService.isRecording ? Appearance.m3colors.m3onPrimary : Appearance.m3colors.m3surface 
            }
            
            MouseArea {
                anchors.fill: parent
                onClicked: {
                    console.log("[WhisperUI] Record button clicked, current status:", WhisperService.getStatus())
                    WhisperService.toggleRecording()
                }
                hoverEnabled: true                
                onEntered: parent.opacity = 0.8
                onExited: parent.opacity = 1.0
                enabled: !WhisperService.isProcessing
            }
        }
        
        ColumnLayout {
            Layout.preferredWidth: 120
            spacing: 4
            
            Text {
                text: root.statusText
                font.pixelSize: Appearance.font.pixelSize.normal
                font.bold: true
                color: root.statusColor
                Layout.fillWidth: true
                elide: Text.ElideRight
            }
        }
        
        // Transcription text
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: Appearance.colors.colLayer2
            radius: Appearance.rounding.small 
            implicitWidth: parent.width * 0.75
            ScrollView {
                anchors.fill: parent
                anchors.margins: 8
                
                TextArea {
                    text: root.currentText
                    placeholderText: "Transcribed text will appear here..."
                    wrapMode: TextArea.Wrap
                    selectByMouse: true
                    readOnly: true
                    font.pixelSize: Appearance.font.pixelSize.normal
                    opacity: 0.67
                    color: Appearance.colors.colOnLayer2
                    background: Item {}
                    
                    // Show placeholder styling
                    placeholderTextColor: Appearance.colors.colOnLayer2
                }
            }
        }
    }
}
}