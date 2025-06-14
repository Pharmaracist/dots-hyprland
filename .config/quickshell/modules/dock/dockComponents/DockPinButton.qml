import QtQuick
import QtQuick.Controls
import "root:/modules/common"
import "root:/modules/common/widgets"

VerticalButtonGroup {
    id: pinButtonGroup
    property bool pinned: false
    property bool useGif: true
    signal togglePin()
    signal togglePowerMenu()
    
    GroupButton {
        id: pinButton
        baseWidth: 50
        baseHeight: 50
        clickedWidth: baseWidth
        clickedHeight: baseHeight
        buttonRadius: Appearance.rounding.normal
        toggled: pinButtonGroup.pinned
        color: useGif ? (toggled ? Appearance.m3colors.m3secondaryContainer : "transparent") : Appearance.colors.colLayer1Hover
        
        MouseArea {
            anchors.fill: parent
            acceptedButtons: Qt.LeftButton | Qt.RightButton
            onPressed: (event) => {
                if (event.button === Qt.RightButton)
                    pinButtonGroup.togglePowerMenu();
                else if (event.button === Qt.LeftButton)
                    pinButtonGroup.togglePin();
            }
        }
        
        contentItem: useGif ? gifBtn : m3Btn
        
        MaterialSymbol {
            visible:!useGif
            id: m3Btn
            text: "keep"
            horizontalAlignment: Text.AlignHCenter
            font.pixelSize: 26
            color: pinButton.toggled ? Appearance.m3colors.m3onSecondaryContainer : Appearance.m3colors.m3outline
            anchors.centerIn: parent
        }
        
        AnimatedImage {
            id: gifBtn
            visible:useGif
            anchors.fill: parent
            anchors.margins: 1
            horizontalAlignment: Text.AlignHCenter
            cache: true
            mipmap: true
            source: "root:/assets/gif/avatar.gif"
            speed: pinButtonGroup.pinned ? 2 : 1.25
        }
    }
}