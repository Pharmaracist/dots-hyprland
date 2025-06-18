import QtQuick
import QtQuick.Controls
import "root:/modules/common"
import "root:/modules/common/widgets"

VerticalButtonGroup {
    id: pinButtonGroup
    property bool pinned: false
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
        color: toggled ? Appearance.m3colors.m3primary : Appearance.colors.colLayer1Hover
        
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
        
        contentItem: MaterialSymbol {
            id: m3Btn
            text: "keep"
            horizontalAlignment: Text.AlignHCenter
            font.pixelSize: 26
            color: pinButton.toggled ? Appearance.m3colors.m3onPrimary : Appearance.m3colors.m3outline
            anchors.centerIn: parent
        }
    }
}