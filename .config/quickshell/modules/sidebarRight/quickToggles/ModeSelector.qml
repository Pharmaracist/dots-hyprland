import QtQuick
import QtQuick.Controls
import Quickshell.Hyprland
import "root:/"
import "root:/modules/common/"
import "root:/modules/common/widgets"
import "root:/services"

Item {
    id: root
    property var modes: [
        "scheme-tonal-spot",
        "scheme-neutral",
        "scheme-expressive",
        "scheme-fidelity",
        "scheme-content",
        "scheme-monochrome",
        "scheme-rainbow",
        "scheme-fruit-salad"
    ]
    property string currentMode: PersistentStates.temp.currentScheme
    signal modeChanged(string mode)
    
    implicitWidth: parent.width - 45
    implicitHeight: 45
    
    ListView {
        anchors.fill: parent
        model: modes
        orientation: ListView.Horizontal
        spacing: 5
        clip: false
        
        delegate: Button {
            required property string modelData
            width: 45
            height: 45
            
            background: Rectangle {
                id: bg
                radius: width / 2
                color: modelData === currentMode ?
                    Appearance.m3colors.m3primary :
                    Appearance.m3colors.m3surfaceContainer
            }
            
            contentItem: Item {
                width: parent.width
                height: parent.height
                
                MaterialSymbol {
                    text: getIcon(modelData)
                    font.pixelSize: Appearance.font.pixelSize.huge
                    color: modelData === currentMode ?
                        Appearance.m3colors.m3onPrimary :
                        Appearance.m3colors.m3onSurfaceVariant
                    
                    // Multiple centering approaches
                    anchors.centerIn: parent
                    width: parent.width
                    height: parent.height
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                }
            }
            
            StyledToolTip {
            ToolTip.visible: hovered
                content:  getTooltipText(modelData)
                ToolTip.delay: 500
            }

            onClicked: {
                currentMode = modelData;
                modeChanged(modelData);
                PersistentStateManager.setState("temp.currentScheme", currentMode)
                Hyprland.dispatch(`exec ${Directories.wallpaperSwitchScriptPath} --lastused --type '${currentMode}'`);
            }
            
            function getIcon(mode) {
                switch(mode) {
                    case "scheme-tonal-spot": return "palette";
                    case "scheme-neutral": return "contrast";
                    case "scheme-expressive": return "colorize";
                    case "scheme-fidelity": return "tune";
                    case "scheme-content": return "image";
                    case "scheme-monochrome": return "monochrome_photos";
                    case "scheme-rainbow": return "gradient";
                    case "scheme-fruit-salad": return "nature";
                    default: return "palette";
                }
            }
            
            function getTooltipText(mode) {
                switch(mode) {
                    case "scheme-tonal-spot": return "Tonal Spot";
                    case "scheme-neutral": return "Neutral";
                    case "scheme-expressive": return "Expressive";
                    case "scheme-fidelity": return "Fidelity";
                    case "scheme-content": return "Content";
                    case "scheme-monochrome": return "Monochrome";
                    case "scheme-rainbow": return "Rainbow";
                    case "scheme-fruit-salad": return "Fruit Salad";
                    default: return "Color Scheme";
                }
            }
        }
    }
}