// default.qml - Default vertical bar layout
import Qt5Compat.GraphicalEffects
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Quickshell
import Quickshell.Hyprland
import Quickshell.Services.UPower
import Quickshell.Wayland
import Quickshell.Services.Mpris
import "root:/"
import "root:/modules/bar/components" as NormalComponents
import "root:/modules/common"
import "../components"
import "root:/modules/common/functions/color_utils.js" as ColorUtils
import "root:/modules/common/functions/string_utils.js" as StringUtils
import "root:/modules/common/widgets"
import "root:/services"

Item {
    id: root
    
    // Properties passed from the loader
    property var barRoot
    property var modelData
    // Window configuration for the loader
    readonly property real padding: 0.8
    property int barWidth: Appearance?.sizes.barWidth ?? 37
    property bool showBarBackground: ConfigOptions.bar.showBackground
    readonly property MprisPlayer activePlayer: MprisController.activePlayer
    readonly property string cleanedTitle: StringUtils.cleanMusicTitle(activePlayer?.trackTitle) || qsTr("No media")
    readonly property int windowWidth: (Appearance?.sizes.barWidth ?? 37) + Appearance.rounding.screenRounding
    readonly property int windowHeight: modelData.height
    readonly property int windowExclusiveZone: (Appearance?.sizes.barWidth ?? 37) - Appearance.sizes.frameThickness
    readonly property var windowAnchors: { top: true; bottom: true; left: true ;right:false}

    anchors {
        left: parent.left
        leftMargin: -10
    }
    
    // Background rectangle (behind content)
    Rectangle {
        anchors {
            top: parent.top
            bottom: parent.bottom
            left: parent.left
            leftMargin: 10    
        }
        width: Appearance?.sizes.barWidth ?? 37
        id: barBackground
        color: (ConfigOptions.bar.showBackground) ? Appearance.colors.colLayer0 : "transparent"
    }

    ColumnLayout {
        id: middleArea
        anchors.centerIn: parent
        CombinedTitle {
            bar: barRoot
            visible: !media.visible
            Layout.alignment: Qt.AlignVCenter

        }
        
        Media {
            id: media
            visible: ((!PersistentStates.dock.currentContent === 0 ) && MprisController.activePlayer?.trackTitle?.length > 0) // Dodge redunduncy
        }
        
        transform: Rotation {
            angle: -90
        }
    }

    ColumnLayout {
        id: barContent
        spacing: 0
        anchors {
            fill: parent
            margins: 0.8
            bottomMargin: 10
            topMargin: 10
        }
        
        ColumnLayout {
            id: topArea
            spacing: 0.8 * 10
            Layout.alignment: Qt.AlignTop | Qt.AlignHCenter

            NormalComponents.MinimalBattery {
                id: battery
                visible: UPower.displayDevice.isLaptopBattery
            }

            NormalComponents.Logo {
                visible: !battery.visible
            }

            Workspaces {
                bar: barRoot
            }
        }

        ColumnLayout {
            id: bottomArea
            spacing: 0.8 * 10
            Layout.alignment: Qt.AlignBottom | Qt.AlignHCenter
            Layout.fillWidth: true
            SysTray {
                bar:barRoot
                Layout.alignment:  Qt.AlignHCenter

            }
            StatusIcons {}

            ClockWidget {}

            PowerButton {}
        }
    }

    // Rounded corners (top left & bottom left)
    RoundCorner {
        size: Appearance.rounding.screenRounding
        corner: cornerEnum.topLeft
        color: (ConfigOptions.bar.showBackground) ? Appearance.colors.colLayer0 : "transparent"
        anchors {
            top: barBackground.top
            left: barBackground.right
            topMargin: Appearance.sizes.frameThickness
        }
    }

    RoundCorner {
        size: Appearance.rounding.screenRounding
        corner: cornerEnum.bottomLeft
        color: (ConfigOptions.bar.showBackground) ? Appearance.colors.colLayer0 : "transparent"
        anchors {
            bottom: barBackground.bottom
            left: barBackground.right
            bottomMargin: Appearance.sizes.frameThickness
        }
    }
}