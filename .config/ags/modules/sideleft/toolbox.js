import Widget from 'resource:///com/github/Aylur/ags/widget.js';
const { Box, Label, Scrollable } = Widget;
import QuickScripts from './tools/quickscripts.js';
import ColorPicker from './tools/colorpicker.js';
// import MusicControls from '././../indicators/musiccontrols.js';
import ModuleConfigure from '../sideright/centermodules/configure.js'
export default Scrollable({
    hscroll: "never",
    vscroll: "automatic",
    child: Box({
        vertical: true,
        spacing:10,
        children: [
            Widget.Box({ css:`margin-top:1.8rem`,child:ModuleConfigure()}),
            // Box({ vexpand: true }),
            QuickScripts(),
            ColorPicker(),
            // MusicControls(),
        ]
    })
});
