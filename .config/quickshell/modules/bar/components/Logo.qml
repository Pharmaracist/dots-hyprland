import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import Quickshell

Item {
    id: logoComponent
    
    property var barRoot
    
    Layout.alignment: Qt.AlignLeft | Qt.AlignVCenter
    Layout.preferredWidth: distroIcon.width + 10
    Layout.preferredHeight: parent.height
    
    Rectangle {
        id: distroBackground
        anchors.fill: parent
        radius: Appearance.rounding.full
        color: "transparent"
        
        Image {
            id: distroIcon
            anchors.centerIn: parent
            width: 24
            height: 24
            // Use system icon if custom logo is not available
            source: {
                if (ConfigOptions.bar.topLeftIcon === "distro") {
                    return "/usr/share/pixmaps/archlinux-logo.png";
                } else {
                    // Try to use Qt.resolvedUrl to find the logo in different locations
                    var customLogo = Qt.resolvedUrl("root:/assets/images/logo.svg");
                    // Fallback to a system icon that's likely to exist
                    return customLogo ? customLogo : "image://theme/system-run";
                }
            }
            sourceSize.width: width
            sourceSize.height: height
            fillMode: Image.PreserveAspectFit
            antialiasing: true
            
            MouseArea {
                anchors.fill: parent
                onClicked: {
                    Hyprland.dispatch("global quickshell:launcherToggle")
                }
            }
        }
    }
}
