const { Gtk, GObject } = imports.gi;
const Resource = GObject.registerClass(
    class Resource extends Gtk.Box {
        constructor(icon, name, value) {
            super({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 8,
                css_classes: ['resource-bar']
            });

            this.icon = new Gtk.Image({
                icon_name: icon,
                pixel_size: 16,
                css_classes: ['resource-icon']
            });

            this.progressBar = new Gtk.ProgressBar({
                fraction: value / 100,
                css_classes: ['resource-progress']
            });

            this.append(this.icon);
            this.append(this.progressBar);
        }

        update(value) {
            this.progressBar.fraction = value / 100;
        }
    }
);

const ResourcesWidget = GObject.registerClass(
    class ResourcesWidget extends Gtk.Box {
        constructor() {
            super({
                orientation: Gtk.Orientation.VERTICAL,
                spacing: 4,
                css_classes: ['resources-widget']
            });

            this.cpu = new Resource('processor', 'CPU', 0);
            this.memory = new Resource('memory', 'Memory', 0);
            this.disk = new Resource('drive-harddisk', 'Disk', 0);

            this.append(this.cpu);
            this.append(this.memory);
            this.append(this.disk);

            // Update resources every 2 seconds
            this._timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 2000, () => {
                this._updateResources();
                return GLib.SOURCE_CONTINUE;
            });
        }

        _updateResources() {
            // TODO: Implement actual resource monitoring
            // For now using dummy values
            this.cpu.update(Math.random() * 100);
            this.memory.update(Math.random() * 100);
            this.disk.update(Math.random() * 100);
        }
    }
);

export default ResourcesWidget;
