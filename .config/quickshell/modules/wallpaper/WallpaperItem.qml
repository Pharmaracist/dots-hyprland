import QtQuick
import QtQuick.Controls
import QtMultimedia
import Qt5Compat.GraphicalEffects
import QtQuick.Effects
import "root:/modules/common"

Item {
    id: root
    
    // Public properties
    property string fileUrl
    property bool isVideo: {
        const url = fileUrl.toLowerCase()
        return url.endsWith(".mp4") || url.endsWith(".mkv") || url.endsWith(".webm")
    }
    property bool isGif: {
        const url = fileUrl.toLowerCase()
        return url.endsWith(".gif")
    }
    property bool isImage: !isVideo && !isGif
    property bool isVisible: false
    property bool forceLoad: false
    
    // Signals
    signal clicked()
    
    // Lazy loading logic
    readonly property bool shouldLoad: isVisible || forceLoad
    
    // Preview loader with lazy loading
    Loader {
        id: previewLoader
        anchors.fill: parent
        active: root.shouldLoad
        
        sourceComponent: {
            if (root.isVideo) return videoPreview
            if (root.isGif) return gifPreview
            return imagePreview
        }
        
        // GIF preview component
        Component {
            id: gifPreview
            
            AnimatedImage {
                id: gifObject
                anchors.fill: parent
                source: root.fileUrl
                fillMode: Image.PreserveAspectCrop
                playing: root.isVisible  // Only animate when visible
                cache: false
                asynchronous: true
                
                // Rounded corners mask
                layer.enabled: true
                layer.effect: OpacityMask {
                    maskSource: Rectangle {
                        width: root.width
                        height: root.height
                        radius: Appearance.rounding.small
                    }
                }
                
                // GIF controls overlay
                Rectangle {
                    anchors.fill: parent
                    color: "transparent"
                    radius: Appearance.rounding.small
                    
                    // Animation indicator
                    Rectangle {
                        anchors.bottom: parent.bottom
                        anchors.right: parent.right
                        anchors.margins: 4
                        width: 16
                        height: 16
                        radius: 8
                        color: Appearance.colors.colLayer1
                        opacity: 0.7
                        
                        Text {
                            anchors.centerIn: parent
                            text: gifObject.playing ? "⏸" : "▶"
                            color: Appearance.colors.colOnLayer1
                            font.pixelSize: 8
                        }
                    }
                    
                    // GIF indicator badge
                    Rectangle {
                        anchors.top: parent.top
                        anchors.left: parent.left
                        anchors.margins: 4
                        width: 24
                        height: 12
                        radius: 6
                        color: Appearance.colors.colSecondaryActive
                        opacity: 0.8
                        
                        Text {
                            anchors.centerIn: parent
                            text: "GIF"
                            color: "white"
                            font.pixelSize: 6
                            font.bold: true
                        }
                    }
                }
                
                // Loading indicator
                Rectangle {
                    anchors.centerIn: parent
                    width: 40
                    height: 40
                    radius: 20
                    color: Appearance.colors.colLayer1
                    opacity: gifObject.status === AnimatedImage.Loading ? 0.8 : 0
                    visible: opacity > 0
                    
                    Behavior on opacity {
                        NumberAnimation { duration: 200 }
                    }
                    
                    Text {
                        anchors.centerIn: parent
                        text: "..."
                        color: Appearance.colors.colOnLayer1
                        font.pixelSize: 12
                    }
                }
                
                // Error indicator
                Rectangle {
                    anchors.fill: parent
                    color: Appearance.colors.colLayer1
                    radius: Appearance.rounding.small
                    visible: gifObject.status === AnimatedImage.Error
                    
                    Text {
                        anchors.centerIn: parent
                        text: "Error\nLoading\nGIF"
                        color: Appearance.colors.colOnLayer1
                        font.pixelSize: 10
                        horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap
                    }
                }
            }
        }
        
        // Image preview component
        Component {
            id: imagePreview
            
            Image {
                id: imageObject
                anchors.fill: parent
                fillMode: Image.PreserveAspectCrop
                source: root.fileUrl
                asynchronous: true
                cache: false
                mipmap: true
                sourceSize: Qt.size(root.width, root.height)
                
                // Rounded corners mask
                layer.enabled: true
                layer.effect: OpacityMask {
                    maskSource: Rectangle {
                        width: root.width
                        height: root.height
                        radius: Appearance.rounding.small
                    }
                }
                
                // Loading indicator
                Rectangle {
                    anchors.centerIn: parent
                    width: 40
                    height: 40
                    radius: 20
                    color: Appearance.colors.colLayer1
                    opacity: imageObject.status === Image.Loading ? 0.8 : 0
                    visible: opacity > 0
                    
                    Behavior on opacity {
                        NumberAnimation { duration: 200 }
                    }
                    
                    Text {
                        anchors.centerIn: parent
                        text: "..."
                        color: Appearance.colors.colOnLayer1
                        font.pixelSize: 12
                    }
                }
                
                // Error indicator
                Rectangle {
                    anchors.fill: parent
                    color: Appearance.colors.colLayer1
                    radius: Appearance.rounding.small
                    visible: imageObject.status === Image.Error
                    
                    Text {
                        anchors.centerIn: parent
                        text: "Error\nLoading\nImage"
                        color: Appearance.colors.colOnLayer1
                        font.pixelSize: 10
                        horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap
                    }
                }
            }
        }
        
        // Video preview component
        Component {
            id: videoPreview
            
            Video {
                id: videoObject
                anchors.fill: parent
                source: root.fileUrl
                autoPlay: root.isVisible  // Only auto-play when visible
                loops: MediaPlayer.Infinite
                muted: true
                fillMode: VideoOutput.PreserveAspectCrop
                
                // Pause when not visible to save resources
                onPlaybackStateChanged: {
                    if (!root.isVisible && playbackState === MediaPlayer.PlayingState) {
                        pause()
                    }
                }
                
                // Rounded corners mask
                layer.enabled: true
                layer.effect: OpacityMask {
                    maskSource: Rectangle {
                        width: root.width
                        height: root.height
                        radius: Appearance.rounding.small
                    }
                }
                
                // Video controls overlay (hidden by default)
                Rectangle {
                    anchors.fill: parent
                    color: "transparent"
                    radius: Appearance.rounding.small
                    
                    // Play/pause indicator
                    Rectangle {
                        anchors.bottom: parent.bottom
                        anchors.right: parent.right
                        anchors.margins: 4
                        width: 16
                        height: 16
                        radius: 8
                        color: Appearance.colors.colLayer1
                        opacity: 0.7
                        
                        Text {
                            anchors.centerIn: parent
                            text: videoObject.playbackState === MediaPlayer.PlayingState ? "⏸" : "▶"
                            color: Appearance.colors.colOnLayer1
                            font.pixelSize: 8
                        }
                    }
                }
                
                // Loading indicator
                Rectangle {
                    anchors.centerIn: parent
                    width: 40
                    height: 40
                    radius: 20
                    color: Appearance.colors.colLayer1
                    opacity: videoObject.playbackState === MediaPlayer.StoppedState ? 0.8 : 0
                    visible: opacity > 0
                    
                    Behavior on opacity {
                        NumberAnimation { duration: 200 }
                    }
                    
                    Text {
                        anchors.centerIn: parent
                        text: "..."
                        color: Appearance.colors.colOnLayer1
                        font.pixelSize: 12
                    }
                }
                
                // Error indicator
                Rectangle {
                    anchors.fill: parent
                    color: Appearance.colors.colLayer1
                    radius: Appearance.rounding.small
                    visible: videoObject.error !== MediaPlayer.NoError
                    
                    Text {
                        anchors.centerIn: parent
                        text: "Error\nLoading\nVideo"
                        color: Appearance.colors.colOnLayer1
                        font.pixelSize: 10
                        horizontalAlignment: Text.AlignHCenter
                        wrapMode: Text.WordWrap
                    }
                }
            }
        }
    }
    
    // Placeholder when not loaded
    Rectangle {
        anchors.fill: parent
        color: Appearance.colors.colLayer1
        radius: Appearance.rounding.small
        visible: !root.shouldLoad
        
        Column {
            anchors.centerIn: parent
            spacing: 8
            
            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                text: {
                    if (root.isVideo) return "🎥"
                    if (root.isGif) return "🎞️"
                    return "🖼️"
                }
                font.pixelSize: 24
                color: Appearance.colors.colOnLayer1
            }
            
            Text {
                anchors.horizontalCenter: parent.horizontalCenter
                text: {
                    if (root.isVideo) return "Video"
                    if (root.isGif) return "GIF"
                    return "Image"
                }
                font.pixelSize: 10
                color: Appearance.colors.colOnLayer1
                opacity: 0.7
            }
        }
    }
    MouseArea {
        id: mouseArea
        anchors.fill: parent
        hoverEnabled: true
        cursorShape: Qt.PointingHandCursor
        
        onClicked: root.clicked()
        
        // Hover effect overlay
        Rectangle {
            anchors.fill: parent
            radius: Appearance.rounding.small
            color: mouseArea.containsMouse ? Appearance.colors.colLayer0 : "transparent"
            opacity: mouseArea.containsMouse ? 0.3 : 0
            
            border {
                color: mouseArea.containsMouse ? Appearance.colors.colSecondaryActive : "transparent"
                width: mouseArea.containsMouse ? 2 : 0
            }
            
            // Smooth transitions
            Behavior on opacity {
                NumberAnimation { duration: 150 }
            }
            
            Behavior on border.width {
                NumberAnimation { duration: 150 }
            }
        }
        
        // Click effect
        Rectangle {
            id: clickEffect
            anchors.centerIn: parent
            width: 0
            height: 0
            radius: width / 2
            color: Appearance.colors.colSecondaryActive
            opacity: 0
            
            SequentialAnimation {
                id: clickAnimation
                
                ParallelAnimation {
                    NumberAnimation {
                        target: clickEffect
                        property: "width"
                        from: 0
                        to: root.width * 1.2
                        duration: 200
                        easing.type: Easing.OutQuad
                    }
                    NumberAnimation {
                        target: clickEffect
                        property: "height"
                        from: 0
                        to: root.width * 1.2
                        duration: 200
                        easing.type: Easing.OutQuad
                    }
                    NumberAnimation {
                        target: clickEffect
                        property: "opacity"
                        from: 0.3
                        to: 0
                        duration: 200
                        easing.type: Easing.OutQuad
                    }
                }
            }
        }
        
        onPressed: {
            clickAnimation.start()
        }
    }
    
    // Accessibility
    Accessible.role: Accessible.Button
    Accessible.name: {
        const fileName = root.fileUrl.split('/').pop() || "Wallpaper"
        if (root.isVideo) return `Video wallpaper: ${fileName}`
        if (root.isGif) return `GIF wallpaper: ${fileName}`
        return `Image wallpaper: ${fileName}`
    }
    Accessible.description: "Click to set as wallpaper"
    Accessible.onPressAction: root.clicked()
}