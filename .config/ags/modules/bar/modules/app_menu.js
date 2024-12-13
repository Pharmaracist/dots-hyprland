import Widget from "resource:///com/github/Aylur/ags/widget.js";
import App from "resource:///com/github/Aylur/ags/app.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Hyprland from "resource:///com/github/Aylur/ags/service/hyprland.js";

let currentPopup = null;
let isMenuOpen = false;

const closeCurrentPopup = () => {
    if (currentPopup) {
        currentPopup.destroy();
        currentPopup = null;
        isMenuOpen = false;
    }
};

const execCmd = (cmd) => {
    Utils.exec(cmd);
    closeCurrentPopup();
};

// Application-specific menu configurations
const appMenus = {
    'firefox': {
        'File': [
            { label: 'New Tab', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k t"') },
            { label: 'New Window', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k n"') },
            { label: 'Save Page As...', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -M shift -k s"') },
            { label: 'Print...', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k p"') },
        ],
        'Edit': [
            { label: 'Undo', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k z"') },
            { label: 'Redo', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -M shift -k z"') },
            { label: 'Cut', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k x"') },
            { label: 'Copy', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k c"') },
            { label: 'Paste', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k v"') },
        ],
        'View': [
            { label: 'Zoom In', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k plus"') },
            { label: 'Zoom Out', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k minus"') },
            { label: 'Actual Size', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k 0"') },
        ],
    },
    'code': {
        'File': [
            { label: 'New File', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k n"') },
            { label: 'Save', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k s"') },
            { label: 'Save All', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k s"') },
            { label: 'Close Editor', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k w"') },
        ],
        'Edit': [
            { label: 'Undo', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k z"') },
            { label: 'Redo', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -M shift -k z"') },
            { label: 'Find', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k f"') },
            { label: 'Replace', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k h"') },
        ],
    },
    'kitty': {
        'File': [
            { label: 'New Window', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -M shift -k n"') },
            { label: 'New Tab', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -M shift -k t"') },
            { label: 'Close Tab', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -M shift -k w"') },
        ],
        'Edit': [
            { label: 'Copy', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -M shift -k c"') },
            { label: 'Paste', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -M shift -k v"') },
            { label: 'Clear', action: () => execCmd('hyprctl dispatch exec "wtype -k ctrl+l"') },
        ],
    },
    'default': {
        'File': [
            { label: 'New Window', action: () => execCmd('hyprctl dispatch exec xterm') },
            { label: 'Close', action: () => execCmd('hyprctl dispatch killactive') },
        ],
        'Edit': [
            { label: 'Cut', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k x"') },
            { label: 'Copy', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k c"') },
            { label: 'Paste', action: () => execCmd('hyprctl dispatch exec "wtype -M ctrl -k v"') },
        ],
        'Window': [
            { label: 'Minimize', action: () => execCmd('hyprctl dispatch movetoworkspace special') },
            { label: 'Toggle Float', action: () => execCmd('hyprctl dispatch togglefloating') },
            { label: 'Toggle Fullscreen', action: () => execCmd('hyprctl dispatch fullscreen 1') },
        ],
    },
};

const getAppMenus = (appClass) => {
    const lowerAppClass = appClass?.toLowerCase() || '';
    return appMenus[lowerAppClass] || appMenus['default'];
};

const createMenuItem = (label, submenu = []) => {
    let hoverTimeout;
    
    const menuButton = Widget.Button({
        className: 'menu-item-button',
        onClicked: () => {
            if (currentPopup && isMenuOpen) {
                closeCurrentPopup();
            } else if (submenu.length > 0) {
                showSubmenu();
            }
        },
        onHover: () => {
            if (isMenuOpen && submenu.length > 0) {
                if (hoverTimeout) clearTimeout(hoverTimeout);
                hoverTimeout = setTimeout(showSubmenu, 100);
            }
        },
        child: Widget.Label({
            className: 'menu-item-label',
            label: label,
        }),
    });

    const showSubmenu = () => {
        closeCurrentPopup();
        
        if (submenu.length > 0) {
            const menuPopup = Widget.Window({
                className: 'menu-popup',
                anchor: ['top', 'left'],
                layer: 'overlay',
                focusable: true,
                child: Widget.Box({
                    vertical: true,
                    children: submenu.map(item => Widget.Button({
                        className: 'submenu-item',
                        child: Widget.Label({ label: item.label }),
                        onClicked: () => {
                            if (item.action) item.action();
                            closeCurrentPopup();
                        },
                    })),
                }),
            });
            
            const [x, y] = menuButton.get_mapped_position();
            const buttonAlloc = menuButton.get_allocation();
            menuPopup.popup_at_point(x, y + buttonAlloc.height);
            currentPopup = menuPopup;
            isMenuOpen = true;
        }
    };

    return menuButton;
};

const AppMenu = () => {
    const menuBox = Widget.Box({
        className: 'app-menu-box',
    });

    const updateMenus = () => {
        const activeWindow = Hyprland.active.client;
        const appClass = activeWindow?.class || 'default';
        const currentMenus = getAppMenus(appClass);
        
        // Update app name button
        const appNameButton = Widget.Button({
            className: 'app-name-button',
            onClicked: () => {
                if (currentPopup) {
                    closeCurrentPopup();
                }
            },
            child: Widget.Label({
                className: 'app-name-label',
                label: activeWindow?.class || 'Desktop',
            }),
        });

        // Create menu items for current application
        const menuItems = Object.entries(currentMenus).map(([label, submenu]) => 
            createMenuItem(label, submenu)
        );

        // Update menu box children
        menuBox.children = [appNameButton, ...menuItems];
    };

    // Listen for active window changes
    Hyprland.connect('active-client-changed', updateMenus);
    
    // Initial update
    updateMenus();

    return menuBox;
};

export default AppMenu;
