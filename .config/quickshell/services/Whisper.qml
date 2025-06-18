// WhisperService.qml - Singleton Whisper Voice-to-Text Service
pragma Singleton
pragma ComponentBehavior: Bound
import QtQuick 
import Quickshell 
import Quickshell.Io

Singleton {
    id: whisperService
    
    // Properties
    property bool isRecording: false
    property bool isProcessing: false
    property string currentModel: "base"
    property string language: "auto"
    property string tempAudioFile: "/tmp/quickshell_whisper_recording.wav"
    property string tempTextFile: "/tmp/quickshell_whisper_recording.txt"
    property int maxRecordingDuration: 30 // seconds
    
    // Signals
    signal transcriptionReady(string text)
    signal error(string message)
    signal recordingStateChanged(bool recording)
    signal processingStateChanged(bool processing)
    
    // Audio recording process
    property var recordingProcess: Process {
        id: recordProc
        command: [
            "ffmpeg", "-y", 
            "-f", "pulse", "-i", "default",
            "-ac", "1", "-ar", "16000", 
            "-t", whisperService.maxRecordingDuration.toString(),
            whisperService.tempAudioFile
        ]
    }
    
    // Whisper transcription process
    property var whisperProcess: Process {
        id: whisperProc
    }
    
    // Timers to check process completion
    property var recordingCheckTimer: Timer {
        interval: 1000
        repeat: true
        onTriggered: {
            if (!recordProc.running && isRecording) {
                stop()
                isRecording = false
                recordingStateChanged(false)
                console.log("[WhisperService] Recording completed")
                processAudio()
            }
        }
    }
    
    property var processingCheckTimer: Timer {
        interval: 1000
        repeat: true
        onTriggered: {
            if (!whisperProc.running && isProcessing) {
                stop()
                isProcessing = false
                processingStateChanged(false)
                console.log("[WhisperService] Processing completed")
                readTranscriptionFile()
            }
        }
    }
    
    // FileView to read transcription result
    property var transcriptionReader: FileView {
        id: textFileView
        path: whisperService.tempTextFile
        
        onLoaded: {
            const transcription = textFileView.text().trim()
            if (transcription.length > 0) {
                console.log("[WhisperService] Transcription completed:", transcription)
                whisperService.transcriptionReady(transcription)
            } else {
                whisperService.error("No audio detected or transcription empty")
            }
        }
        
        onLoadFailed: function(error) {
            console.log("[WhisperService] Failed to read transcription file:", error)
            whisperService.error("Failed to read transcription: " + error)
        }
    }
    
    // Public methods
    function startRecording() {
        if (isRecording || isProcessing) {
            console.log("[WhisperService] Already recording or processing")
            return false
        }
        
        console.log("[WhisperService] Starting audio recording...")
        isRecording = true
        recordingStateChanged(true)
        recordProc.start()
        
        // Set up a timer to check when recording is done
        recordingCheckTimer.start()
        return true
    }
    
    function stopRecording() {
        if (!isRecording) {
            console.log("[WhisperService] Not currently recording")
            return false
        }
        
        console.log("[WhisperService] Stopping audio recording...")
        recordProc.kill()
        recordingCheckTimer.stop()
        isRecording = false
        recordingStateChanged(false)
        return true
    }
    
    function toggleRecording() {
        if (isRecording) {
            return stopRecording()
        } else {
            return startRecording()
        }
    }
    
    function processAudio() {
        if (isProcessing) {
            console.log("[WhisperService] Already processing audio")
            return false
        }
        
        console.log("[WhisperService] Starting Whisper transcription...")
        isProcessing = true
        processingStateChanged(true)
        
        // Clean up any existing text file
        cleanup()
        
        var whisperCmd = [
            "whisper", 
            tempAudioFile,
            "--model", currentModel,
            "--output_format", "txt",
            "--output_dir", "/tmp",
            "--verbose", "False"
        ]
        
        if (language !== "auto") {
            whisperCmd.push("--language")
            whisperCmd.push(language)
        }
        
        whisperProc.command = whisperCmd
        whisperProc.start()
        
        // Set up a timer to check when processing is done
        processingCheckTimer.start()
        return true
    }
    
    function readTranscriptionFile() {
        // Reload the file view to read the transcription
        textFileView.reload()
    }
    
    function setLanguage(lang) {
        if (!isRecording && !isProcessing) {
            language = lang
            console.log("[WhisperService] Language set to:", lang)
            return true
        }
        return false
    }
    
    function setModel(model) {
        if (!isRecording && !isProcessing) {
            currentModel = model
            console.log("[WhisperService] Model set to:", model)
            return true
        }
        return false
    }
    
    function setMaxDuration(seconds) {
        if (!isRecording && !isProcessing) {
            maxRecordingDuration = Math.max(1, Math.min(300, seconds)) // 1-300 seconds
            console.log("[WhisperService] Max recording duration set to:", maxRecordingDuration, "seconds")
            return true
        }
        return false
    }
    
    function getStatus() {
        if (isRecording) return "recording"
        if (isProcessing) return "processing"
        return "ready"
    }
    
    function isReady() {
        return !isRecording && !isProcessing
    }
    
    // Cleanup temporary files
    function cleanup() {
        const cleanupProc = cleanupComponent.createObject(whisperService)
        if (cleanupProc) {
            cleanupProc.start()
        }
    }
    
    // Component for cleanup process
    Component {
        id: cleanupComponent
        Process {
            command: ["rm", "-f", whisperService.tempAudioFile, whisperService.tempTextFile]
        }
    }
    
    // Component cleanup
    Component.onDestruction: {
        if (isRecording) {
            recordProc.kill()
        }
        if (isProcessing) {
            whisperProc.kill()
        }
        cleanup()
    }
}