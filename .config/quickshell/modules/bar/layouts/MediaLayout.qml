import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Qt5Compat.GraphicalEffects
import "root:/"
import "root:/modules/common"
import "root:/modules/common/widgets"
import "root:/services"
import Quickshell
import Quickshell.Hyprland

// Import bar components
import "../components" as Components

Item {
    id: mediaLayout
    width: parent.width
    height: parent.height
    
    property var barRoot
    
    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: Appearance.rounding.screenRounding
        anchors.rightMargin: Appearance.rounding.screenRounding
        spacing: 10
        
        // Left section - logo and workspaces
        Item {
            Layout.alignment: Qt.AlignLeft | Qt.AlignVCenter
            Layout.fillHeight: true
            Layout.preferredWidth: leftSectionLayout.implicitWidth
            
            RowLayout {
                id: leftSectionLayout
                anchors.fill: parent
                spacing: 10
                
                // Logo
                Components.Logo {
                    barRoot: mediaLayout.barRoot
                }
                
                // Workspaces
                Components.Workspaces {
                    bar: barRoot
                    MouseArea {
                        anchors.fill: parent
                        acceptedButtons: Qt.RightButton
                        onPressed: function(event) {
                            if (event.button === Qt.RightButton) {
                                Hyprland.dispatch('global quickshell:overviewToggle')
                            }
                        }
                    }
                }
            }
        }
        
        // Center section - media controls
        Item {
            Layout.alignment: Qt.AlignCenter
            Layout.fillHeight: true
            Layout.fillWidth: true
            
            RowLayout {
                anchors.centerIn: parent
                spacing: 10
                
                // Media controls
                Components.Media {
                    Layout.alignment: Qt.AlignVCenter
                    Layout.preferredWidth: implicitWidth
                }
            }
        }
        
        // Right section - basic indicators
        Item {
            Layout.alignment: Qt.AlignRight | Qt.AlignVCenter
            Layout.fillHeight: true
            Layout.preferredWidth: rightSectionLayout.implicitWidth
            
            RowLayout {
                id: rightSectionLayout
                anchors.fill: parent
                spacing: 10
                
                // Battery
                Components.Battery {
                    Layout.alignment: Qt.AlignVCenter
                }
                
                // Clock
                Components.ClockWidget {
                    Layout.alignment: Qt.AlignVCenter
                }
            }
        }
    }
}
