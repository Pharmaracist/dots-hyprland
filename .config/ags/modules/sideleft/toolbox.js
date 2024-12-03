import Widget from "resource:///com/github/Aylur/ags/widget.js";
const { Box, Label, Scrollable } = Widget;
import QuickScripts from "./tools/quickscripts.js";
import ColorPicker from "./tools/colorpicker.js";
import ModuleConfigure from "./tools/configure.js";

export default Scrollable({
  hscroll: "never",
  vscroll: "automatic",
  child: Box({
    vertical: true,
    // className: "spacing-v-10",
    css: "margin-top:1.5rem;",
    children: [ModuleConfigure(), QuickScripts(), ColorPicker()],
  }),
});
