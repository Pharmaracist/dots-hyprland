import QtQuick
import QtQuick.Controls
import Quickshell.Hyprland
import QtQuick.Layouts
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
    
    implicitWidth: parent.width
    implicitHeight: 45
    ListView {
        anchors.fill: parent
        anchors.horizontalCenter: parent.horizontalCenter
        model: modes
        orientation: ListView.Horizontal
        spacing: 5
        clip: false
        
        delegate: Button {
            required property string modelData
            width:  modelData === currentMode ? 150 : 45
            height: 45
            Behavior on width {
                NumberAnimation {
                   easing.type: Appearance?.animation.elementMoveFast.type ?? Easing.BezierSpline
                   easing.bezierCurve: Appearance?.animation.elementMoveFast.bezierCurve ?? [0.34, 0.80, 0.34, 1.00, 1, 1]      
                }
            }
            background: Rectangle {
                id: bg
                radius: modelData === currentMode ? 25 : width / 4
                color: modelData === currentMode ?
                    Appearance.m3colors.m3primary :
                    Appearance.m3colors.m3surfaceContainer
            
            Behavior on radius {
                NumberAnimation {
                   easing.type: Appearance?.animation.elementMoveFast.type ?? Easing.BezierSpline
                   easing.bezierCurve: Appearance?.animation.elementMoveFast.bezierCurve ?? [0.34, 0.80, 0.34, 1.00, 1, 1]      
                }
            }
            }
            contentItem: Rectangle {
                width: parent.width
                height: parent.height
                color:"transparent"
                RowLayout {
                    id:content
                    anchors.fill: parent
                MaterialSymbol {
                    text: getIcon(modelData)
                    font.pixelSize: Appearance.font.pixelSize.huge
                    color: modelData === currentMode ?
                        Appearance.m3colors.m3onPrimary :
                        Appearance.m3colors.m3onSurfaceVariant
                    
                        Layout.alignment: modelData !== currentMode ? Qt.AlignHCenter : Qt.AlignLeft
                    width: parent.width
                    height: parent.height
                }
                StyledText {
                    id: titleText
                    visible:modelData === currentMode
                    color: modelData === currentMode ?
                        Appearance.m3colors.m3onPrimary :
                        Appearance.m3colors.m3onSurfaceVariant
                    text: getTooltipText(modelData)
                    font.pixelSize: Appearance.font.pixelSize.small
                    font.family: Appearance.font.family.title
            }
            }
            }
            StyledToolTip {
                content:  getTooltipText(modelData)
            }
            MouseArea {
                hoverEnabled:true
                acceptedButtons: Qt.RightButton | Qt.LeftButton
                anchors.fill: parent
                onPressed: (event) => {
             if (event.button === Qt.LeftButton){
                currentMode = modelData;
                modeChanged(modelData);
                PersistentStateManager.setState("temp.currentScheme", currentMode)
                Hyprland.dispatch(`exec ${Directories.wallpaperSwitchScriptPath} --lastused --type '${currentMode}'&`);
            } else if (event.button === Qt.RightButton) {
                Hyprland.dispatch("exec matugen color hex $(hyprpicker -n -f hex -r -d)")
            }
        }
            
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