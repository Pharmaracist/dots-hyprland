const { Gtk, GLib } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
const timeFormat = userOptions.asyncGet().time.format;
const dateFormat = userOptions.asyncGet().time.dateFormatLong;

const time = new Variable("", {
  poll: [1000, () => GLib.DateTime.new_now_local().format(timeFormat)],
});

const date = new Variable("", {
  poll: [1000, () => GLib.DateTime.new_now_local().format(dateFormat)],
});

const simpleClock = () =>
  Widget.Box({
    vpack: "center",
    className: "spacing-h-4 bar-clock-box",
    children: [
      Widget.Label({
        className: "bar-time",
        label: time.bind(),
        tooltipText: date.bind(),
      }),
    ],
  });
export default () =>
  Widget.Box({
    children: [simpleClock()],
  });
