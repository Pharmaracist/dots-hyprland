import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import { showMusicControls } from "../../../variables.js";
const { Box, Label } = Widget;
const { GLib } = imports.gi;
import MusicStuff from "./music.js";
const options = userOptions.asyncGet();
const timeFormat = options.time.format;
const dateFormat = options.time.dateFormatLong;
import { Revealer } from "resource:///com/github/Aylur/ags/widget.js";
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

const BarClock = () =>
  Widget.Box({
    vpack: "center",
    className: "spacing-h-4 bar-clock-box",
    children: [
      Widget.Label({
        className: "bar-time",
        label: time.bind(),
      }),
      Widget.Label({
        className: "txt-small txt-onLayer1",
        label: "•",
      }),
      Widget.Label({
        className: "txt-smallie bar-date",
        label: date.bind(),
      }),
    ],
  });

const musicRevealer = Revealer({
  transitionDuration: options.animations.durationLarge,
  transition: "slide_right",
  revealChild: false, // Initially hidden
  child: MusicStuff(),
});

export default () =>
  Widget.EventBox({
    onPrimaryClick: () => {
      //More robust handling of the animation
      musicRevealer.revealChild = !musicRevealer.revealChild;
      //Optionally add a callback to handle animation completion if needed for complex scenarios
      //musicRevealer.onTransitionEnd(()=>{/*Do something after the animation*/})
    },
    onSecondaryClick: () => App.toggleWindow("wallselect"),
    onMiddleClick: () => {
      Utils.execAsync(["hyprpicker", "-a"]).catch(print);
    },
    child: Widget.Box({
      children: [BarClock(), musicRevealer],
    }),
  }); // thats a clock module for ags bar i want to make a module that shows battery wattage
