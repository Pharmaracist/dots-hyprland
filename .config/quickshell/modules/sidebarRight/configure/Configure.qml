import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Widgets
import Quickshell.Services.Pipewire


Item {
    id: root

    ColumnLayout {
        anchors.fill: parent
        Item {
            Layout.fillWidth: true
            Layout.fillHeight: true
            Flickable {
                id: flickable
                anchors.fill: parent
                contentHeight: volumeMixerColumnLayout.height

                clip: true
                layer.enabled: true
                layer.effect: OpacityMask {
                    maskSource: Rectangle {
                        width: flickable.width
                        height: flickable.height
                        radius: Appearance.rounding.normal
                    }
                }

        }
    }
    }

}