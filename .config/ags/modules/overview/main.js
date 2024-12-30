import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { SearchAndWindows } from "./windowcontent.js";
import PopupWindow from '../.widgethacks/popupwindow.js';
import { clickCloseRegion } from '../.commonwidgets/clickcloseregion.js';
const { Box } = Widget;

export default (id = '') => PopupWindow({
    name: `overview${id}`,
    keymode: 'on-demand',
    visible: false,
    anchor: ['top', 'bottom', 'left', 'right'],
    layer: 'top',
    child: Box({
        vertical: true,
        children: [
            Box({
                hpack: 'center',
                css: 'margin-top: 17.682rem',
                child: SearchAndWindows(),
            }),
            clickCloseRegion({ name: `overview${id}`, multimonitor: false, fillMonitor: 'both' }),
        ]
    }),
});