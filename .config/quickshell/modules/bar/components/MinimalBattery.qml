import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Io
import Quickshell.Services.UPower
import "root:/modules/common"
import "root:/modules/common/widgets"

RowLayout {
        id: rowLayout
        readonly property var chargeState: UPower.displayDevice.state
        readonly property bool isCharging: chargeState == UPowerDeviceState.Charging
        readonly property bool isPluggedIn: isCharging || chargeState == UPowerDeviceState.PendingCharge
        readonly property real percentage: UPower.displayDevice.percentage
        readonly property bool isLow: percentage <= ConfigOptions.bar.batteryLowThreshold / 100
        readonly property color batteryLowBackground: Appearance.m3colors.darkmode ? Appearance.m3colors.m3error : Appearance.m3colors.m3errorContainer
        readonly property color batteryLowOnBackground: Appearance.m3colors.darkmode ? Appearance.m3colors.m3errorContainer : Appearance.m3colors.m3error
        

        Item {
            Layout.fillWidth: true
            Layout.fillHeight: true

            MouseArea {
                anchors.fill: parent
                hoverEnabled: true
                onEntered: ToolTip.show()
                onExited: ToolTip.hide()
            }

        }

        CircularProgress {
            Layout.alignment: Qt.AlignHCenter
            lineWidth: 2
            value: percentage
            size: 26
            secondaryColor: (isLow && !isCharging) ? batteryLowBackground : Appearance.m3colors.m3secondaryContainer
            primaryColor: (isLow && !isCharging) ? batteryLowOnBackground : Appearance.m3colors.m3onSecondaryContainer
            fill: (isLow && !isCharging)

            MaterialSymbol {
                anchors.centerIn: parent
                text: "bolt"
                iconSize: Appearance.font.pixelSize.normal
                color: Appearance.m3colors.m3onSecondaryContainer
                visible: isCharging
            }

            // Show battery_full icon when 100%, otherwise show percentage
            Item {
                anchors.centerIn: parent
                visible: !isCharging
                width: parent.width
                height: parent.height

                StyledText {
                    anchors.centerIn: parent
                    color: Appearance.colors.colOnLayer1
                    text: `${Math.round(percentage * 100)}`
                    font.pixelSize: Appearance.font.pixelSize.normal - 3.6
                    visible: Math.round(percentage * 100) < 100
                }

                MaterialSymbol {
                    anchors.centerIn: parent
                    text: "battery_full"
                    iconSize: Appearance.font.pixelSize.normal
                    color: Appearance.colors.colOnLayer1
                    visible: Math.round(percentage * 100) >= 100
                }

            }

        }

    }

