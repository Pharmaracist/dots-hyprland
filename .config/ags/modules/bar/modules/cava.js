import Widget from 'resource:///com/github/Aylur/ags/widget.js'
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js'
import cava from "../../../services/cava.js"

export default () => {
    // Create the visualization widget
    const visualizer = Widget.Box({
        class_name: 'cava-visualizer',
        spacing: 0,
    })

    // Update the widget with the latest cava output
    const updateWidget = () => {
        const config = cava.getConfig()
        const output = cava.output
        if (!output) return

        // Analyze the output to determine high threshold dynamically
        const chars = output.split('')
        const charCodes = chars.map(char => char.charCodeAt(0) - 9601)
        const maxHeight = Math.max(...charCodes)
        const highThreshold = maxHeight * 0.6  // 60% of max height is considered high

        // Create bar widgets with dynamic classes
        const bars = chars.map(char => {
            const height = char.charCodeAt(0) - 9601
            const isHigh = height >= highThreshold
            
            return Widget.Label({
                label: char,
                class_name: `cava-bar ${isHigh ? 'cava-bar-high' : 'cava-bar-low'}`,
                css: `
                    margin: 0 1px;
                    transition: all 50ms ease;
                `
            })
        })

        visualizer.children = bars
    }

    // Create the container
    return Widget.Box({
        class_name: 'cava-module',
        child: visualizer,
        setup: self => {
            // Update on cava output changes
            self.hook(cava, (_, output) => {
                updateWidget()
            }, 'output-changed')

            // Also poll for updates in case we miss some
            self.poll(100, () => {
                updateWidget()
                return true
            })

            // Initial update
            updateWidget()
        }
    })
}