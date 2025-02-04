import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import App from "resource:///com/github/Aylur/ags/app.js";
import userOptions from "../.configuration/user_options.js";
import GLib from 'gi://GLib';
const { Box, Label, EventBox, Scrollable, Button } = Widget;
import ColorPicker from "../bar/modules/color_picker.js";
// Constants
const CONFIG_DIR = GLib.get_home_dir() + '/.config/ags';
const WALLPAPER_DIR = GLib.get_home_dir() + (userOptions.asyncGet().wallselect.wallpaperFolder || '/Pictures/wallpapers');
const THUMBNAIL_DIR = GLib.build_filenamev([WALLPAPER_DIR, "thumbnails"]);

// Cached Variables
let wallpaperPathsPromise = null;
let cachedContent = null;

// Wallpaper Button
const WallpaperButton = (path) => 
    Widget.Button({
        child: Box({ className: "preview-box", css: `background-image: url("${path}");` }),
        onClicked: async () => {
            try {
                await Utils.execAsync(['sh', `${CONFIG_DIR}/scripts/color_generation/switchwall.sh`, path.replace("thumbnails", "")]);
                App.closeWindow("wallselect");
            } catch (error) {
                console.error("Error switching wallpaper:", error);
            }
        },
    });

// Get Wallpaper Paths
const getWallpaperPaths = () => {
    if (wallpaperPathsPromise) return wallpaperPathsPromise;
    wallpaperPathsPromise = Utils.execAsync(
        `find ${GLib.shell_quote(THUMBNAIL_DIR)} -type f \\( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.gif" -o -iname "*.webp" -o -iname "*.tga" -o -iname "*.tiff" -o -iname "*.bmp" -o -iname "*.ico" \\)`
    ).then(files => files.split("\n").filter(Boolean));
    return wallpaperPathsPromise;
};

// Create Content
const createContent = async () => {
    if (cachedContent) return cachedContent;

    try {
        const wallpaperPaths = await getWallpaperPaths();

        if (wallpaperPaths.length === 0) {
            return createPlaceholder();
        }

        cachedContent = EventBox({
            onPrimaryClick: () => App.closeWindow("wallselect"),
            onSecondaryClick: () => App.closeWindow("wallselect"),
            onMiddleClick: () => App.closeWindow("wallselect"),
            child: Scrollable({
                hexpand: true,
                vexpand: false,
                hscroll: "always",
                vscroll: "never",
                child: Box({
                    className: "wallpaper-list",
                    children: wallpaperPaths.map(WallpaperButton),
                }),
            }),
        });

        return cachedContent;

    } catch (error) {
        console.error("Error creating content:", error);
        return Box({
            className: "wallpaper-error",
            vexpand: true,
            hexpand: true,
            children: [
                Label({ label: "Error loading wallpapers. Check the console for details.", className: "txt-large txt-error", }),
            ],
        });
    }
};

// Placeholder content when no wallpapers found
const createPlaceholder = () => Box({
    className: 'wallpaper-placeholder',
    vertical: true,
    vexpand: true,
    hexpand: true,
    spacing: 10,
    children: [
        Box({
            vertical: true,
            vpack: 'center',
            hpack: 'center',
            vexpand: true,
            children: [
                Label({ label: 'No wallpapers found.', className: 'txt-large txt-bold', }),
                Label({ label: 'Generate thumbnails to get started.', className: 'txt-norm txt-subtext', }),
            ],
        }),
    ],
});

// Generate Thumbnails Button
const GenerateButton = () => Widget.Button({
    className: 'button-accent generate-thumbnails',
    child: Box({
        children: [
            Widget.Icon({ icon: 'view-refresh-symbolic', size: 16, }),
            Widget.Label({ label: ' Generate Thumbnails', }),
        ],
    }),
    tooltipText: 'Regenerate all wallpaper thumbnails',
    onClicked: () => {
        Utils.execAsync([`bash`, `${CONFIG_DIR}/scripts/generate_thumbnails.sh`])
            .then(() => {
                cachedContent = null; // Invalidate cache
                App.closeWindow('wallselect');
                App.openWindow('wallselect');
            })
            .catch((error) => console.error("Error generating thumbnails:", error));
    },
});

// Toggle Wallselect Window
const toggleWindow = () => {
    const win = App.getWindow('wallselect');
    if (!win) return;
    win.visible = !win.visible;
};
const ColorPickerBox = () => Box({
    vertical: true,
    css:`padding:2px 12px;border-radius:25px`,
    className: 'bar-group bar-group-standalone',
    child:ColorPicker()
});
export { toggleWindow };

// Main Window
export default () => Widget.Window({
    name: "wallselect",
    anchor: ['top', 'bottom', 'right', 'left'],
    layer: 'overlay',
    visible: false,
    child: Widget.Overlay({
        child: EventBox({
            onPrimaryClick: () => App.closeWindow("wallselect"),
            onSecondaryClick: () => App.closeWindow("wallselect"),
            onMiddleClick: () => App.closeWindow("wallselect"),
            child: Box({ css: 'min-height: 1000px;', }),
        }),
        overlays: [
            Box({
                vertical: true,
                className: "sidebar-right spacing-v-15",
                vpack: userOptions.asyncGet().bar.position === "top" ? 'start' : 'end',
                children: [
                    Box({
                        className: "wallselect-header",
                        children: [
                            ColorPickerBox(),
                            Box({ hexpand: true }),
                            GenerateButton(),
                        ],
                    }),
                    Box({
                        vertical: true,
                        className: "sidebar-module",
                        setup: (self) =>
                            self.hook(
                                App,
                                async (_, name, visible) => {
                                    if (name === "wallselect" && visible) {
                                        const content = await createContent();
                                        self.children = [content];
                                    }
                                },
                                "window-toggled",
                            ),
                    }),
                ],
            }),
        ],
    }),
});