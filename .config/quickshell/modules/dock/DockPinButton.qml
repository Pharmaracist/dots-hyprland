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

        contentItem: AnimatedImage {
            anchors.fill: parent
            anchors.margins: 4
            cache: true
            mipmap: true
            source: "root:/assets/gif/avatar.gif"
            speed: pinButtonGroup.pinned ? 2 : 1.25
        }

    }

}
