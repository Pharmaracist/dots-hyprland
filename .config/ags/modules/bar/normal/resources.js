const { GLib } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
const { Box, Button, Label, EventBox, Overlay } = Widget; // Ensure EventBox is included
const { execAsync } = Utils;
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";

// Helper function for resource display
const BarResource = (
  name,
  icon,
  command,
  circprogClassName = "bar-batt-circprog",
  textClassName = "txt-onSurfaceVariant",
  iconClassName = "bar-batt",
) => {
  const resourceCircProg = AnimatedCircProg({
    className: `${circprogClassName}`,
    vpack: "center",
    hpack: "center",
  });
  const resourceLabel = Label({
    className: `txt-smallie ${textClassName}`,
  });
  const widget = Button({
    onClicked: () =>
      Utils.execAsync([
        "bash",
        "-c",
        `${userOptions.asyncGet().apps.taskManager}`,
      ]).catch(print),
    child: Box({
      className: `spacing-h-4 ${textClassName}`,
      children: [
        Box({
          homogeneous: true,
          children: [
            Overlay({
              child: Box({
                vpack: "center",
                className: `${iconClassName}`,
                homogeneous: true,
                children: [MaterialIcon(icon, "small")],
              }),
              overlays: [resourceCircProg],
            }),
          ],
        }),
        resourceLabel,
      ],
      setup: (self) =>
        self.poll(5000, () => {
          execAsync(["bash", "-c", command])
            .then((output) => {
              const value = Math.round(Number(output));
              resourceCircProg.css = `font-size: ${value}px;`;
              // resourceLabel.label = `${value}%`;
              widget.tooltipText = `${name}: ${value}%`;
            })
            .catch(print);
        }),
    }),
  });
  return widget;
};

// System resource widgets
const SystemResources = () => {
  return Box({
    className: "",
    hexpand: false,
    children: [
      BarResource(
        "RAM Usage",
        "",
        `LANG=C free | awk '/^Mem/ {printf("%.2f\\n", ($3/$2) * 100)}'`,
        "bar-ram-circprog",
        "bar-ram-txt",
        "bar-ram-icon",
      ),
      BarResource(
        "CPU Usage",
        "",
        `LANG=C top -bn1 | grep Cpu | sed 's/\\,/\\./g' | awk '{print $2}'`,
        "bar-cpu-circprog",
        "bar-cpu-txt",
        "bar-cpu-icon",
      ),
      BarResource(
        "GPU Usage",
        "",
        `nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits`,
        "bar-cpu-circprog",
        "bar-cpu-txt",
        "bar-cpu-icon",
      ),
      BarResource(
        "GPU Temperature",
        "",
        `nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits`,
        "bar-cpu-circprog",
        "bar-cpu-txt",
        "bar-cpu-icon",
      ),
    ],
  });
};

// Main display
export default () => {
  return EventBox({
    child: Box({
      className: "spacing-h-4",
      children: [SystemResources()],
    }),
  });
};
