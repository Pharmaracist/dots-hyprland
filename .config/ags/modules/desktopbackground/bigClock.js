const { GLib } = imports.gi;
import App from "resource:///com/github/Aylur/ags/app.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Service from "resource:///com/github/Aylur/ags/service.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import { StatusIcons } from "../.commonwidgets/statusicons.js";
import WeatherWidget from "./../bar/modules/weather.js";
import powerMode from "./../bar/modules/powermode.js";
import Variable from "resource:///com/github/Aylur/ags/variable.js";
const { execAsync, exec } = Utils;
const { Box, Label, Button, Revealer, EventBox, Icon } = Widget;
import { setupCursorHover } from "../.widgetutils/cursorhover.js";
import { quickLaunchItems } from "./data_quicklaunches.js";
import QuotesService from '../../services/quotes.js';

const QuotesBox = () => Box({
    className: "spacing-v-5",
    css: "margin-top: 1rem;",
    children: [
        Icon({
            className: "icon-material txt-bold sec-txt",
            css: "font-size: 1.5rem; margin-right: 1rem; opacity: 0.9;",
            vpack: "center",
            icon: "books-symbolic",
            size: 50,
        }),
        Box({
            vertical: true,
            vpack: "center",
            children: [
            Label({
            xalign: 0,
            className: "txt",
            wrap: true,
            wrapMode: "word",
            widthChars: 35,
            maxWidthChars: 50,
            css: "font-size: 1.5rem; opacity: 0.9;",
            label: QuotesService.content,
            setup: self => self.hook(QuotesService, () => {
                self.label = `"${QuotesService.content}"`;
            }),
        }),
        Label({
            xalign:0,
            className: "onSurfaceVariant txt-smallie",
            css: "opacity: 0.7;",
            label: QuotesService.author,
            setup: self => self.hook(QuotesService, () => {
                self.label = `  ${QuotesService.author}`;
            }),
        }),
    ]
}),
    
],
});

const BigTimeAndDate = () =>
    
    Box({
        vertical: true,
        className: "spacing-v--15",
        children: [
            Label({
            css: "font-size: 6.5rem;opacity:0.7;font-family: Good Timing;",
            className: "onSurfaceVariant",
            xalign: 0,
            label: GLib.DateTime.new_now_local().format(
                "%A"
            ),
            setup: (self) =>
              self.poll(userOptions.asyncGet().time.dateInterval, (label) => {
                label.label = GLib.DateTime.new_now_local().format(
                    userOptions.asyncGet().time.dateFormatLong,
                );
            }),
          }),
          Widget.Box({
            className: "onSurfaceVariant",
            children: [
                StatusIcons(),
              Box({
                className: "spacing-h-5",
                hpack: "start",
                vpack: "center",
                css:`margin: 0 0 -0.25rem 0.3rem;`,
                children: [
                  powerMode(),
                ]
              }),
              Label({label: "   |   ",className: "onSurfaceVariant txt-hugeass"}),
              Label({
                  className: "txt-smallie onSurfaceVariant",
                  css: "font-size: 2rem;opacity:0.7;font-weight:900;font-family:'Bitstream Vera Sans';",
                  xalign: 0,
                  vpack: "center",
                  label: GLib.DateTime.new_now_local().format(
                      "%d %B %Y / %I:%M"
                  ),
                setup: (self) =>
                    self.poll(userOptions.asyncGet().time.interval, (label) => {
                        label.label = GLib.DateTime.new_now_local().format(
                            "%d %B %Y / %I:%M"
                        );
                      }),
            }),
        ]}),
    //   Label({
    //     className: "",
    //     xalign: 0,
    //     label: GLib.DateTime.new_now_local().format(
    //       userOptions.asyncGet().time.dateFormatLong,
    //     ),
    //     setup: (self) =>
    //       self.poll(userOptions.asyncGet().time.dateInterval, (label) => {
    //         label.label = GLib.DateTime.new_now_local().format(
    //           userOptions.asyncGet().time.dateFormatLong,
    //         );
    //       }),
    //   }),
    ],
  });

const QuickLaunches = () =>
  Box({
    vertical: true,
    vpack: "start",
    className: "spacing-v-10",
    css: `margin-right:2.5rem`,
    children: [
      Box({
        hpack: "start",
        className: "spacing-v-15",
        vertical: true,
        children: quickLaunchItems.map((item, i) =>
          Button({
            onClicked: () => {
              execAsync(["bash", "-c", `${item["command"]}`]).catch(print);
            },
            className: "bg-quicklaunch-btn2 sec-txt",
            child: Icon({
              icon: item["icon"],
              size: 56,
            }),
            setup: (self) => {
              setupCursorHover(self);
            },
          }),
        ),
      }),
    ],
  });

export default () =>
  Box({
    hpack: "start",
    vpack: "center",
    css: "padding: 0 0 22rem 10rem;",
    className: "spacing-h-25",
    children: [
        QuickLaunches(),
    Box({
        vertical: true,
       children: [
            Box({
                css:`min-width: 3rem;padding: 0.7rem 2rem;min-height: 2rem;border:none;border-radius: 0.9rem;opacity:1;box-shadow: 0 2px 5px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05);`,
                className: "bar-knocks",
                hpack: "start",
                child:WeatherWidget(),
            }),
           BigTimeAndDate(),
           QuotesBox(),
       ] 
    }),
    ],
  });
