import * as Utils from 'resource:///com/github/Aylur/ags/utils.js'
import Service from 'resource:///com/github/Aylur/ags/service.js';
import GLib from 'gi://GLib'

class AudioVisualizerService extends Service {
    static {
        Service.register(this, {
            'output-changed': ['string'],
        }, {
            'output': ['string'],
        });
    }

    #output = ""
    #proc = null
    #config = {}
    #configFile = GLib.build_filenamev([App.configDir, 'modules/.configuration/user_options.default.json'])

    constructor() {
        super()
        this.#loadConfig()
        this.#initCava()

        // Watch for config file changes
        Utils.monitorFile(this.#configFile, () => {
            console.log('Config file changed, reloading...')
            this.#loadConfig()
        })
    }

    #loadConfig() {
        try {
            const content = Utils.readFile(this.#configFile)
            const options = JSON.parse(content)
            if (options?.visualizer) {
                console.log('Loaded visualizer config:', options.visualizer)
                this.#config = options.visualizer
                this.#initCava()
            }
        } catch (error) {
            console.error('Error loading config:', error)
        }
    }

    getConfig() {
        return { ...this.#config }
    }

    #initCava() {
        if (this.#proc) {
            this.#proc.force_exit()
            this.#proc = null
        }

        // Determine the best audio source
        const audioSource = this.#detectAudioSource()

        // Create a temporary config file for cava
        const configPath = '/tmp/cava.config'
        const config = `
[general]
bars = ${this.#config.bars || 13}
framerate = ${this.#config.framerate || 60}
sensitivity = ${this.#config.sensitivity || 150}
mode = ${this.#config.mode || 'scientific'}
smoothing = ${this.#config.smoothing || 0.9}
barWidth = ${this.#config.barWidth || 4}
spacing = 0

[input]
method = pulse
source = ${audioSource}

[output]
method = raw
raw_target = /dev/stdout
data_format = ascii
channels = mono
ascii_max_range = 7

[smoothing]
monstercat = ${this.#config.monstercat || 1}
noise_reduction = ${this.#config.smoothing || 0.9}
sensitivity = ${this.#config.sensitivity || 100}

[eq]
1=1
2=1
3=1
4=1
5=1
6=1
7=1
8=1
9=1
10=1
11=1
12=1
13=1
14=1
15=1
16=1
17=1
18=1
19=1
20=1
`
        Utils.writeFile(config, configPath)
        console.log('Starting Cava with config:', this.#config, 'Source:', audioSource)

        this.#proc = Utils.subprocess([
            'cava',
            '-p', configPath
        ], output => {
            if (!output.trim()) return

            // Clean the output and convert numbers to bars
            const values = output.trim().split('').map(char => char.charCodeAt(0) - 48)
            
            // Take only the number of bars we want
            const bars = values.slice(0, this.#config.bars || 13)
                .map(n => {
                    // Logarithmic scaling to prevent maximum height artifacts
                    const scaledValue = Math.log1p(n) / Math.log1p(7)
                    const level = Math.min(Math.max(1, Math.floor(scaledValue * 7)))
                    return ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"][level]
                })
                .join('')

            if (bars !== this.#output) {
                this.#output = bars
                this.emit('output-changed', this.#output)
            }
        }, error => {
            console.error('Cava error:', error)
            this.#output = "▁".repeat(this.#config.bars || 13)
            this.emit('output-changed', this.#output)
        })
    }

    #detectAudioSource() {
        try {
            // Try to get default PulseAudio sink
            const paOutput = Utils.exec('pactl info')
            const defaultSinkMatch = paOutput.match(/Default Sink: (.+)/)
            if (defaultSinkMatch) {
                console.log('Using PulseAudio default sink:', defaultSinkMatch[1])
                return defaultSinkMatch[1] + '.monitor'
            }
        } catch (e) {
            console.error('Failed to get PulseAudio default sink:', e)
        }

        try {
            // Fallback to auto
            const sinks = Utils.exec('pactl list short sinks')
            const sinkLines = sinks.split('\n')
            if (sinkLines.length > 0) {
                const firstSink = sinkLines[0].split('\t')[1]
                console.log('Using first available sink:', firstSink)
                return firstSink + '.monitor'
            }
        } catch (e) {
            console.error('Failed to list PulseAudio sinks:', e)
        }

        // Absolute fallback
        console.log('Falling back to default source')
        return 'auto'
    }

    get output() { return this.#output }

    destroy() {
        if (this.#proc) {
            this.#proc.force_exit()
            this.#proc = null
        }
        super.destroy()
    }
}

export default new AudioVisualizerService()