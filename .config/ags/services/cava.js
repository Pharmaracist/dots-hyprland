import * as Utils from 'resource:///com/github/Aylur/ags/utils.js'
import Service from 'resource:///com/github/Aylur/ags/service.js';
import GLib from 'gi://GLib'
import App from 'resource:///com/github/Aylur/ags/app.js'

class AudioVisualizerService extends Service {
    static {
        Service.register(this, {
            'output-changed': ['string'],
        });
    }

    #output = "▁".repeat(13)
    #proc = null
    #config = {}
    #configFile = GLib.build_filenamev([App.configDir, 'modules/.configuration/user_options.default.json'])

    constructor() {
        super()
        
        // Set default config
        this.#config = {
            bars: 30,
            framerate: 30,
            sensitivity: 100,
            mode: 'scientific',
            channels: 'mono',
            smoothing: 0.85,
            noise_reduction: 0.85,
            barWidth: 1 ,
            monstercat: 1,
            gravity: 1
        }
        
        this.#loadConfig()
        this.#initCava()

        // Watch for config file changes
        Utils.monitorFile(this.#configFile, () => {
            this.#loadConfig()
            this.#initCava()
        })
    }

    #loadConfig() {
        try {
            const content = Utils.readFile(this.#configFile)
            if (!content) return
            
            const options = JSON.parse(content)
            if (options?.visualizer) {
                this.#config = { ...this.#config, ...options.visualizer }
            }
        } catch (error) {
            console.error('Failed to load cava config:', error)
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
bars = ${this.#config.bars}
framerate = ${this.#config.framerate}
sensitivity = ${this.#config.sensitivity}
mode = ${this.#config.mode}
smoothing = ${this.#config.smoothing}
barWidth = ${this.#config.barWidth}
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
monstercat = ${this.#config.monstercat}
noise_reduction = ${this.#config.noise_reduction}

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
14=1.2 
15=1
`
        Utils.writeFile(config, configPath)

        // Start cava with error handling
        try {
            this.#proc = Utils.subprocess([
                'cava',
                '-p', configPath
            ], output => {
                if (!output?.trim()) return

                // Clean the output and convert numbers to bars
                const values = output.trim().split('').map(char => char.charCodeAt(0) - 48)
                
                // Take only the number of bars we want
                const bars = values.slice(0, this.#config.bars)
                    .map(n => {
                        // Logarithmic scaling to prevent maximum height artifacts
                        const scaledValue = Math.log1p(n) / Math.log1p(7)
                        const level = Math.min(Math.max(0, Math.floor(scaledValue * 8)))
                        return ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"][level]
                    })
                    .join('')

                if (bars !== this.#output) {
                    this.#output = bars
                    this.emit('output-changed', bars)
                }
            }, error => {
                console.error('Cava error:', error)
                if (!this.#output) {
                    this.#output = "▁".repeat(this.#config.bars)
                    this.emit('output-changed', this.#output)
                }
            })
        } catch (error) {
            console.error('Failed to start cava:', error)
            this.#output = "▁".repeat(this.#config.bars)
            this.emit('output-changed', this.#output)
        }
    }

    #detectAudioSource() {
        try {
            // Try to get default PulseAudio sink
            const paOutput = Utils.exec('pactl info')
            const defaultSinkMatch = paOutput.match(/Default Sink: (.+)/)
            if (defaultSinkMatch) {
                return defaultSinkMatch[1] + '.monitor'
            }
        } catch (e) {
            console.error('Failed to detect default sink:', e)
        }

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