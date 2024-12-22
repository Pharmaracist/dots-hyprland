#!/usr/bin/env gjs

imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Adw = '1';

const { Gtk, Gdk, Gio, GObject, Adw } = imports.gi;
const App = imports.gi.Ags.App;

const BAR_MODES = [
    { id: 1, name: 'Pads' },
    { id: 2, name: 'Knocks' },
    { id: 3, name: 'Docks' },
    { id: 4, name: 'Floating' },
    { id: 5, name: 'Short' },
    { id: 6, name: 'Shorter' },
    { id: 7, name: 'Normal' },
    { id: 8, name: 'Minimal' },
    { id: 9, name: 'Scrollable' },
];

class BarPreview extends Gtk.Box {
    static {
        GObject.registerClass(this);
    }

    constructor() {
        super({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
            css_classes: ['bar-preview'],
        });

        this._init_ui();
        this._setup_drop_targets();
    }

    _init_ui() {
        this.leftBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            css_classes: ['preview-section', 'left-section'],
            hexpand: true,
        });

        this.centerBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            css_classes: ['preview-section', 'center-section'],
            hexpand: true,
            halign: Gtk.Align.CENTER,
        });

        this.rightBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            css_classes: ['preview-section', 'right-section'],
            hexpand: true,
            halign: Gtk.Align.END,
        });

        this.append(this.leftBox);
        this.append(this.centerBox);
        this.append(this.rightBox);
    }

    _setup_drop_targets() {
        [this.leftBox, this.centerBox, this.rightBox].forEach(box => {
            const dropTarget = new Gtk.DropTarget({
                actions: Gdk.DragAction.MOVE,
                formats: Gdk.ContentFormats.new_for_gtype(GObject.TYPE_OBJECT),
            });

            dropTarget.connect('drop', (target, value, x, y) => {
                if (value instanceof Gtk.Widget) {
                    const position = this._get_drop_position(box, y);
                    if (value.get_parent()) {
                        value.unparent();
                    }
                    box.insert_child_after(value, position);
                    return true;
                }
                return false;
            });

            box.add_controller(dropTarget);
        });
    }

    _get_drop_position(container, y) {
        const children = container.get_children();
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const [, childY] = child.translate_coordinates(container, 0, 0);
            if (y < childY + child.get_allocated_height() / 2) {
                return i > 0 ? children[i - 1] : null;
            }
        }
        return children[children.length - 1];
    }

    destroy() {
        this.leftBox?.unparent();
        this.centerBox?.unparent();
        this.rightBox?.unparent();
        super.destroy();
    }
}

class ModuleWidget extends Gtk.Box {
    static {
        GObject.registerClass(this);
    }

    constructor(name) {
        super({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            css_classes: ['module-box'],
        });

        this.label = new Gtk.Label({ label: name });
        this.removeButton = new Gtk.Button({
            icon_name: 'user-trash-symbolic',
            css_classes: ['flat'],
        });

        this.append(this.label);
        this.append(this.removeButton);

        this.removeButton.connect('clicked', () => {
            this.unparent();
        });

        // Make draggable
        const dragSource = new Gtk.DragSource({
            actions: Gdk.DragAction.MOVE,
        });

        dragSource.connect('prepare', () => {
            return Gdk.ContentProvider.new_for_value(this);
        });

        this.add_controller(dragSource);
    }

    destroy() {
        this.label?.unparent();
        this.removeButton?.unparent();
        super.destroy();
    }
}

class LayoutEditorWindow extends Adw.ApplicationWindow {
    static {
        GObject.registerClass(this);
    }

    constructor(application) {
        super({ application });
        this.title = 'AGS Bar Layout Editor';
        this.set_default_size(1000, 700);
        this._init_ui();
    }

    _init_ui() {
        const mainBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            margin_top: 12,
            margin_bottom: 12,
            margin_start: 12,
            margin_end: 12,
        });

        // Header bar
        const headerBar = new Adw.HeaderBar();
        const saveButton = new Gtk.Button({
            label: 'Save Layout',
            css_classes: ['suggested-action'],
        });
        headerBar.pack_end(saveButton);
        mainBox.append(headerBar);

        // Content
        const content = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 12,
        });

        // Sidebar
        const sidebar = this._create_sidebar();
        content.append(sidebar);

        // Preview
        const previewGroup = new Adw.PreferencesGroup({
            title: 'Bar Preview',
            description: 'Drag modules between sections',
            hexpand: true,
        });

        this.barPreview = new BarPreview();
        previewGroup.add(this.barPreview);
        content.append(previewGroup);

        mainBox.append(content);
        this.set_content(mainBox);
    }

    _create_sidebar() {
        const sidebar = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 12,
            width_request: 250,
        });

        // Bar modes
        const modesGroup = new Adw.PreferencesGroup({
            title: 'Bar Modes',
            description: 'Select a mode to edit',
        });
        
        const modesList = new Gtk.ListBox({
            selection_mode: Gtk.SelectionMode.SINGLE,
            css_classes: ['boxed-list'],
        });
        
        BAR_MODES.forEach(mode => {
            const row = new Gtk.ListBoxRow({
                child: new Adw.ActionRow({
                    title: `${mode.id}. ${mode.name}`,
                    activatable: true,
                }),
            });
            modesList.append(row);
        });

        modesGroup.add(modesList);
        sidebar.append(modesGroup);

        // Modules list
        const modulesGroup = new Adw.PreferencesGroup({
            title: 'Available Modules',
            description: 'Click to add to preview',
        });

        const modulesList = new Gtk.ListBox({
            selection_mode: Gtk.SelectionMode.SINGLE,
            css_classes: ['boxed-list'],
        });

        const modules = [
            'Clock', 'Workspaces', 'SystemTray', 'Battery', 
            'Volume', 'Network', 'Memory', 'CPU', 'Weather',
            'Media', 'Notifications', 'Power'
        ];

        modules.forEach(module => {
            const row = new Gtk.ListBoxRow({
                child: new Adw.ActionRow({
                    title: module,
                    activatable: true,
                }),
            });
            modulesList.append(row);
        });

        modulesList.connect('row-activated', (list, row) => {
            const moduleName = row.get_child().title;
            const moduleWidget = new ModuleWidget(moduleName);
            this.barPreview.leftBox.append(moduleWidget);
        });

        modulesGroup.add(modulesList);
        sidebar.append(modulesGroup);

        return sidebar;
    }

    destroy() {
        this.barPreview?.destroy();
        super.destroy();
    }
}

class LayoutEditor extends Adw.Application {
    static {
        GObject.registerClass(this);
    }

    constructor() {
        super({
            application_id: 'com.github.ags.layout-editor',
            flags: Gio.ApplicationFlags.FLAGS_NONE,
        });
    }

    vfunc_activate() {
        let window = this.active_window;
        
        if (!window) {
            window = new LayoutEditorWindow(this);
        }
        
        window.present();
    }
}

// Run the application
const app = new LayoutEditor();
app.run([imports.system.programInvocationName].concat(ARGV));
