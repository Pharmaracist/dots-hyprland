import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import { SearchAndWindows } from "./windowcontent.js";
import PopupWindow from '../.widgethacks/popupwindow.js';
import { clickCloseRegion } from '../.commonwidgets/clickcloseregion.js';

const createCloseRegion = (expand = false) => clickCloseRegion({
    name: 'overview',
    multimonitor: false,
    expand,
});

export default (id = '') => PopupWindow({
    name: `overview${id}`,
    keymode: 'on-demand',
    visible: false,
    anchor: ['top', 'bottom', 'left', 'right'],
    layer: 'top',
    child: Widget.Box({
        vertical: true,
        children: [
            createCloseRegion(),
            Widget.Box({
                css:`margin-top: 17.682rem;`,
                children: [
                    createCloseRegion(),
                    SearchAndWindows(),
                    createCloseRegion(),
                ]
            }),
            createCloseRegion(),
        ]
    }),
})
