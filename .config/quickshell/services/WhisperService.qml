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
    property string tempTextFile: "/tmp/quickshell_whisper_recording.wav.txt"
    property int maxRecordingDuration: 30 // seconds
    
    // Status property for easier UI binding
    readonly property string status: {
        if (isRecording) return "recording"
        if (isProcessing) return "processing"
        return "ready"
    }
    
    // Signals - Fixed syntax
    signal transcriptionReady(text: string)
    signal error(message: string)
    signal recordingStateChanged(recording: bool)
    signal processingStateChanged(processing: bool)
    
    // Internal process references - make them QtObject for proper lifecycle
    property QtObject recordingProcess: null
    property QtObject whisperProcess: null
    
    // Cleanup timer to ensure processes don't hang
    Timer {
        id: cleanupTimer
        interval: 60000 // 1 minute timeout
        onTriggered: {
            console.log("[WhisperService] Cleanup timer triggered - forcing cleanup")
            forceCleanup()
        }
    }
    
    // FileReader for transcription results
    FileView {
        id: transcriptionReader
        path: ""
        
        onLoaded: {
            const transcription = text().trim()
            console.log("[WhisperService] Raw transcription length:", transcription.length)
            
            if (transcription.length > 0) {
                console.log("[WhisperService] Transcription completed:", transcription.substring(0, 100) + (transcription.length > 100 ? "..." : ""))
                whisperService.transcriptionReady(transcription)
            } else {
                console.log("[WhisperService] Empty transcription result")
                whisperService.error("No audio detected or transcription empty")
            }
        }
        
        onLoadFailed: function(errorMsg) {
            console.log("[WhisperService] Failed to read transcription file:", errorMsg)
            whisperService.error("Failed to read transcription: " + errorMsg)
        }
    }
    
    // Public API Methods
    function startRecording() {
        if (isRecording || isProcessing) {
            console.log("[WhisperService] Cannot start recording - currently", status)
            return false
        }
        
        console.log("[WhisperService] Starting audio recording...")
        
        // Clean up any previous files
        cleanupFiles()
        
        // Create recording process
        recordingProcess = recordingComponent.createObject(whisperService)
        if (!recordingProcess) {
            error("Failed to create recording process")
            return false
        }
        
        isRecording = true
        recordingStateChanged(true)
        cleanupTimer.start()
        
        return true
    }
    
    function stopRecording() {
        if (!isRecording) {
            console.log("[WhisperService] Not currently recording")
            return false
        }
        
        console.log("[WhisperService] Stopping audio recording...")
        
        // Just set the flag - the process will complete on its own
        // We can't forcefully terminate it in Quickshell
        
        return true
    }
    
    function toggleRecording() {
        return isRecording ? stopRecording() : startRecording()
    }
    
    function processAudio() {
        if (isProcessing) {
            console.log("[WhisperService] Already processing audio")
            return false
        }
        
        console.log("[WhisperService] Starting Whisper transcription...")
        
        // Check if audio file exists first
        checkFileExists(tempAudioFile, function(exists) {
            if (exists) {
                startWhisperProcess()
            } else {
                error("Audio file not found: " + tempAudioFile)
            }
        })
        
        return true
    }
    
    function setLanguage(lang) {
        if (isRecording || isProcessing) {
            console.log("[WhisperService] Cannot change language while", status)
            return false
        }
        language = lang
        console.log("[WhisperService] Language set to:", lang)
        return true
    }
    
    function setModel(model) {
        if (isRecording || isProcessing) {
            console.log("[WhisperService] Cannot change model while", status)
            return false
        }
        currentModel = model
        console.log("[WhisperService] Model set to:", model)
        return true
    }
    
    function setMaxDuration(seconds) {
        if (isRecording || isProcessing) {
            console.log("[WhisperService] Cannot change duration while", status)
            return false
        }
        maxRecordingDuration = Math.max(5, Math.min(300, seconds))
        console.log("[WhisperService] Max recording duration set to:", maxRecordingDuration, "seconds")
        return true
    }
    
    function isReady() {
        return status === "ready"
    }
    
    function getStatus() {
        return status
    }
    
    // Internal helper methods
    function cleanupFiles() {
        const cleanup = cleanupComponent.createObject(whisperService)
    }
    
    function forceCleanup() {
        console.log("[WhisperService] Force cleanup initiated")
        
        // Can't terminate processes in Quickshell, just clean up references
        if (recordingProcess) {
            recordingProcess.destroy()
            recordingProcess = null
        }
        
        if (whisperProcess) {
            whisperProcess.destroy()
            whisperProcess = null
        }
        
        isRecording = false
        isProcessing = false
        recordingStateChanged(false)
        processingStateChanged(false)
        cleanupTimer.stop()
        
        cleanupFiles()
    }
    
    function startWhisperProcess() {
        whisperProcess = whisperComponent.createObject(whisperService)
        if (!whisperProcess) {
            error("Failed to create whisper process")
            return
        }
        
        isProcessing = true
        processingStateChanged(true)
    }
    
    function handleRecordingComplete(exitCode) {
        console.log("[WhisperService] Recording completed with exit code:", exitCode)
        
        if (recordingProcess) {
            recordingProcess.destroy()
            recordingProcess = null
        }
        
        isRecording = false
        recordingStateChanged(false)
        
        if (exitCode === 0) {
            // Small delay before processing to ensure file is fully written
            processDelayTimer.start()
        } else {
            cleanupTimer.stop()
            error("Recording failed with exit code: " + exitCode)
        }
    }
    
    function handleWhisperComplete(exitCode) {
        console.log("[WhisperService] Whisper completed with exit code:", exitCode)
        
        if (whisperProcess) {
            whisperProcess.destroy()
            whisperProcess = null
        }
        
        isProcessing = false
        processingStateChanged(false)
        cleanupTimer.stop()
        
        if (exitCode === 0) {
            // Try to read the transcription file
            readTranscriptionFile()
        } else {
            error("Transcription failed with exit code: " + exitCode)
        }
    }
    
    function readTranscriptionFile() {
        // List of possible output file locations
        const possibleFiles = [
            tempTextFile,
            "/tmp/quickshell_whisper_recording.txt",
            tempAudioFile.replace('.wav', '.txt')
        ]
        
        console.log("[WhisperService] Looking for transcription in:", possibleFiles)
        
        // Try each file sequentially
        tryReadFile(possibleFiles, 0)
    }
    
    function tryReadFile(files, index) {
        if (index >= files.length) {
            error("No transcription file found")
            return
        }
        
        const filePath = files[index]
        checkFileExists(filePath, function(exists) {
            if (exists) {
                console.log("[WhisperService] Found transcription file:", filePath)
                transcriptionReader.path = filePath
                transcriptionReader.reload()
            } else {
                tryReadFile(files, index + 1)
            }
        })
    }
    
    function checkFileExists(filePath, callback) {
        const checker = fileCheckComponent.createObject(whisperService, {
            "filePath": filePath,
            "callback": callback
        })
    }
    
    // Delay timer for processing
    Timer {
        id: processDelayTimer
        interval: 1000
        onTriggered: processAudio()
    }
    
    // Component Definitions
    Component {
        id: recordingComponent
        Process {
            command: [
                "ffmpeg", "-y", 
                "-f", "pulse", "-i", "default",
                "-ac", "1", "-ar", "16000", 
                "-t", whisperService.maxRecordingDuration.toString(),
                whisperService.tempAudioFile
            ]
            
            Component.onCompleted: {
                console.log("[WhisperService] Recording command:", command.join(" "))
            }
            
            onExited: function(exitCode, exitStatus) {
                whisperService.handleRecordingComplete(exitCode)
            }
        }
    }
    
    Component {
        id: whisperComponent
        Process {
            property var cmd: {
                var command = [
                    "whisper", 
                    whisperService.tempAudioFile,
                    "--model", whisperService.currentModel,
                    "--output_format", "txt",
                    "--output_dir", "/tmp",
                    "--verbose", "False"
                ]
                
                if (whisperService.language !== "auto") {
                    command.push("--language", whisperService.language)
                }
                
                return command
            }
            
            command: cmd
            
            Component.onCompleted: {
                console.log("[WhisperService] Whisper command:", command.join(" "))
            }
            
            onExited: function(exitCode, exitStatus) {
                whisperService.handleWhisperComplete(exitCode)
            }
        }
    }
    
    Component {
        id: fileCheckComponent
        Process {
            property string filePath: ""
            property var callback: null
            
            command: ["test", "-f", filePath]
            
            onExited: function(exitCode, exitStatus) {
                if (callback) {
                    callback(exitCode === 0)
                }
                destroy()
            }
        }
    }
    
    Component {
        id: cleanupComponent
        Process {
            command: ["rm", "-f", whisperService.tempAudioFile, whisperService.tempTextFile]
            
            onExited: function(exitCode, exitStatus) {
                console.log("[WhisperService] Cleanup completed")
                destroy()
            }
        }
    }
    
    // Cleanup on destruction
    Component.onDestruction: {
        forceCleanup()
    }
}