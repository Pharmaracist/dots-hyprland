import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js'
import cava from "../../../services/cava.js"

export default () => {
    // Create the visualization widget
    const visualizer = Widget.Box({
        class_name: 'cava-visualizer',
        spacing: 0,
    })

    // Update the widget
    const updateWidget = () => {
        const config = cava.getConfig()
        if (!cava.output) return

        // Analyze the output to determine high threshold dynamically
        const chars = cava.output.split('')
        const charCodes = chars.map(char => char.charCodeAt(0) - 9601)
        const maxHeight = Math.max(...charCodes)
        const highThreshold = maxHeight * 0.6  // 60% of max height is considered high

        // Create bar widgets with more nuanced representation
        const bars = chars.map(char => {
            const height = char.charCodeAt(0) - 9601 // Convert Unicode block to height (0-7)
            const isHigh = height >= highThreshold
            
            return Widget.Label({
                label: char,
                class_name: isHigh ? 'cava-bar-high' : 'cava-bar-low',
                css: `
                    opacity: ${isHigh ? 1 : 0.6};
                    margin: 0;
                    padding: 0;
                    border: 0;
                    outline: 0;
                    box-shadow: none;
                    line-height: 1;
                    transform: scaleY(${isHigh ? 1 : 0.8}) translateZ(0);
                    transition: all 0.1s ease;
                `
            })
        })

        visualizer.children = bars
    }

    // Create the container
    const container = Widget.Box({
        class_name: 'cava-module',
        child: visualizer,
        setup: self => {
            // Update on any change
            self.poll(100, () => {
                updateWidget()
                return true
            })

            // Initial update
            updateWidget()
        }
    })

    return container
}