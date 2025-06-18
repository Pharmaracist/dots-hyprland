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

Rectangle {
    id: root
    width: 800
    height: 50
    color: "#2b2b2b"
    radius: 8
    border.color: "#555555"
    border.width: 1
    
    property string currentText: ""
    property string statusText: "Ready"
    property color statusColor: "#ffffff"
    
    Component.onCompleted: {
        // Connect to WhisperService signals
        WhisperService.transcriptionReady.connect(function(text) {
            root.currentText = text
            copyToClipboard(text)
        })
        
        WhisperService.error.connect(function(message) {
            root.statusText = "Error: " + message
            root.statusColor = "#ff4444"
            // Reset to ready state after showing error for a bit
            errorResetTimer.start()
        })
        
        WhisperService.recordingStateChanged.connect(function(recording) {
            root.statusText = recording ? "Recording..." : "Ready"
            root.statusColor = recording ? "#44ff44" : "#ffffff"
        })
        
        WhisperService.processingStateChanged.connect(function(processing) {
            if (processing) {
                root.statusText = "Processing..."
                root.statusColor = "#ffaa44"
            }
        })
    }
    
    // Timer to reset error messages
    Timer {
        id: errorResetTimer
        interval: 3000
        onTriggered: {
            if (!WhisperService.isRecording && !WhisperService.isProcessing) {
                root.statusText = "Ready"
                root.statusColor = "#ffffff"
            }
        }
    }
    
    function copyToClipboard(text) {
        if (!text || text.length === 0) return
        
        // Create a cleanup-safe process
        const clipboardProcess = clipboardComponent.createObject(root, {
            "textToCopy": text
        })
        if (clipboardProcess) {
            clipboardProcess.start()
        }
    }
    
    // Component for clipboard copying
    Component {
        id: clipboardComponent
        Process {
            property string textToCopy: ""
            command: ["sh", "-c", "echo \"" + textToCopy.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\" | xclip -selection clipboard"]
            
            
            Component.onCompleted: {
                // Auto-destroy after a delay to prevent memory leaks
                Qt.callLater(function() {
                    destroyTimer.start()
                })
            }
        }
    }
    
    RowLayout {
        anchors.fill: parent
        anchors.margins: 12
        spacing: 15
        
        // Record button
        Rectangle {
            id: recordButton
            Layout.preferredWidth: 70
            Layout.preferredHeight: 70
            radius: 35
            color: WhisperService.isRecording ? "#ff4444" : "#4444ff"
            border.color: "#ffffff"
            border.width: 2
            
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
            
            Text {
                anchors.centerIn: parent
                text: WhisperService.isRecording ? "⏹" : "🎤"
                font.pointSize: 16
                color: "#ffffff"
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
                
                // Disable button when processing
                enabled: !WhisperService.isProcessing
            }
        }
        
        // Status column
        ColumnLayout {
            Layout.preferredWidth: 120
            spacing: 4
            
            Text {
                text: "Status:"
                font.pointSize: 9
                color: "#aaaaaa"
            }
            
            Text {
                text: root.statusText
                font.pointSize: 11
                font.bold: true
                color: root.statusColor
                Layout.fillWidth: true
                elide: Text.ElideRight
            }
            
            // Additional status info
            Text {
                text: "Service: " + WhisperService.getStatus()
                font.pointSize: 8
                color: "#888888"
                Layout.fillWidth: true
                elide: Text.ElideRight
            }
        }
        
        // Transcription text
        Rectangle {
            Layout.fillWidth: true
            Layout.fillHeight: true
            color: "#3b3b3b"
            radius: 4
            border.color: "#555555"
            border.width: 1
            
            ScrollView {
                anchors.fill: parent
                anchors.margins: 8
                
                TextArea {
                    text: root.currentText
                    placeholderText: "Transcribed text will appear here..."
                    wrapMode: TextArea.Wrap
                    selectByMouse: true
                    readOnly: true
                    font.pointSize: 10
                    color: "#ffffff"
                    background: Item {}
                    
                    // Show placeholder styling
                    placeholderTextColor: "#666666"
                }
            }
        }
        
        // Controls column
        ColumnLayout {
            Layout.preferredWidth: 100
            spacing: 8
            
            Button {
                Layout.fillWidth: true
                text: "Clear"
                enabled: root.currentText.length > 0
                onClicked: {
                    root.currentText = ""
                    console.log("[WhisperUI] Text cleared")
                }
                
                background: Rectangle {
                    color: parent.enabled ? (parent.pressed ? "#666666" : "#555555") : "#333333"
                    radius: 4
                    border.color: "#777777"
                    border.width: 1
                }
                
                contentItem: Text {
                    text: parent.text
                    color: parent.enabled ? "#ffffff" : "#888888"
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    font.pointSize: 9
                }
            }
            
            Button {
                Layout.fillWidth: true
                text: "Copy"
                enabled: root.currentText.length > 0
                onClicked: {
                    copyToClipboard(root.currentText)
                    console.log("[WhisperUI] Text copied to clipboard")
                }
                
                background: Rectangle {
                    color: parent.enabled ? (parent.pressed ? "#666666" : "#555555") : "#333333"
                    radius: 4
                    border.color: "#777777"
                    border.width: 1
                }
                
                contentItem: Text {
                    text: parent.text
                    color: parent.enabled ? "#ffffff" : "#888888"
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    font.pointSize: 9
                }
            }
            
            Button {
                Layout.fillWidth: true
                text: "Stop"
                enabled: WhisperService.isRecording
                onClicked: {
                    WhisperService.stopRecording()
                    console.log("[WhisperUI] Recording stopped manually")
                }
                
                background: Rectangle {
                    color: parent.enabled ? (parent.pressed ? "#ff6666" : "#ff4444") : "#333333"
                    radius: 4
                    border.color: "#777777"
                    border.width: 1
                }
                
                contentItem: Text {
                    text: parent.text
                    color: parent.enabled ? "#ffffff" : "#888888"
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    font.pointSize: 9
                }
            }
        }
        
        // Settings column
        ColumnLayout {
            Layout.preferredWidth: 80
            spacing: 4
            
            Text {
                text: "Language:"
                font.pointSize: 8
                color: "#aaaaaa"
            }
            
            ComboBox {
                id: languageBox
                Layout.fillWidth: true
                model: ["auto", "en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh"]
                currentIndex: 0
                enabled: WhisperService.isReady()
                
                onCurrentTextChanged: {
                    if (WhisperService.isReady()) {
                        const success = WhisperService.setLanguage(currentText)
                        console.log("[WhisperUI] Language changed to:", currentText, "Success:", success)
                    }
                }
                
                background: Rectangle {
                    color: parent.enabled ? "#555555" : "#333333"
                    radius: 4
                    border.color: "#777777"
                    border.width: 1
                }
                
                contentItem: Text {
                    text: parent.displayText
                    color: parent.enabled ? "#ffffff" : "#888888"
                    font.pointSize: 8
                    verticalAlignment: Text.AlignVCenter
                    leftPadding: 8
                }
            }
            
            Text {
                text: "Model:"
                font.pointSize: 8
                color: "#aaaaaa"
            }
            
            ComboBox {
                id: modelBox
                Layout.fillWidth: true
                model: ["base", "small", "medium", "large"]
                currentIndex: 0
                enabled: WhisperService.isReady()
                
                onCurrentTextChanged: {
                    if (WhisperService.isReady()) {
                        const success = WhisperService.setModel(currentText)
                        console.log("[WhisperUI] Model changed to:", currentText, "Success:", success)
                    }
                }
                
                background: Rectangle {
                    color: parent.enabled ? "#555555" : "#333333"
                    radius: 4
                    border.color: "#777777"
                    border.width: 1
                }
                
                contentItem: Text {
                    text: parent.displayText
                    color: parent.enabled ? "#ffffff" : "#888888"
                    font.pointSize: 8
                    verticalAlignment: Text.AlignVCenter
                    leftPadding: 8
                }
            }
            
            Text {
                text: "Max Duration:"
                font.pointSize: 8
                color: "#aaaaaa"
            }
            
            SpinBox {
                Layout.fillWidth: true
                from: 5
                to: 120
                value: 30
                stepSize: 5
                enabled: WhisperService.isReady()
                
                onValueChanged: {
                    if (WhisperService.isReady()) {
                        const success = WhisperService.setMaxDuration(value)
                        console.log("[WhisperUI] Max duration changed to:", value, "seconds. Success:", success)
                    }
                }
                
                background: Rectangle {
                    color: parent.enabled ? "#555555" : "#333333"
                    radius: 4
                    border.color: "#777777"
                    border.width: 1
                }
                
                contentItem: TextInput {
                    text: parent.textFromValue(parent.value, parent.locale) + "s"
                    font.pointSize: 8
                    color: parent.enabled ? "#ffffff" : "#888888"
                    horizontalAlignment: Qt.AlignHCenter
                    verticalAlignment: Qt.AlignVCenter
                    readOnly: !parent.editable
                    validator: parent.validator
                    inputMethodHints: Qt.ImhFormattedNumbersOnly
                }
            }
        }
    }
}