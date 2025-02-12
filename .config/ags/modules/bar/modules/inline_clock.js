import Widget from "resource:///com/github/Aylur/ags/widget.js";
const { GLib } = imports.gi;
const options = userOptions.asyncGet();
const timeFormat = "%I:%M %p";
const dateFormat = options.time.dateFormatLong;

const time = Variable("", {
  poll: [
    options.time.interval,
    () => GLib.DateTime.new_now_local().format(timeFormat),
  ],
});

const date = Variable("", {
  poll: [
    options.time.dateInterval,
    () => GLib.DateTime.new_now_local().format(dateFormat),
  ],
});

const InLineClock = () =>
  Widget.Label({
    css:`font-family:"Iosevka"`,
    className: "txt-norm onSurfaceVariant txt-semibold ",
    label: time.bind(),
  });
export default () => InLineClock();
