from materialyoucolor.scheme.dynamic_scheme import DynamicSchemeOptions, DynamicScheme
from materialyoucolor.scheme.variant import Variant
from materialyoucolor.palettes.tonal_palette import TonalPalette
from materialyoucolor.hct.hct import Hct

class SchemePredefined(DynamicScheme):
    # Predefined color palettes
    PALETTES = {
        'catppuccin': {
            'latte': {
                'rosewater': '#dc8a78',
                'flamingo': '#dd7878',
                'pink': '#ea76cb',
                'mauve': '#8839ef',
                'red': '#d20f39',
                'maroon': '#e64553',
                'peach': '#fe640b',
                'yellow': '#df8e1d',
                'green': '#40a02b',
                'teal': '#179299',
                'sky': '#04a5e5',
                'sapphire': '#209fb5',
                'blue': '#1e66f5',
                'lavender': '#7287fd',
                'text': '#4c4f69',
                'subtext1': '#5c5f77',
                'subtext0': '#6c6f85',
                'overlay2': '#7c7f93',
                'overlay1': '#8c8fa1',
                'overlay0': '#9ca0b0',
                'surface2': '#acb0be',
                'surface1': '#bcc0cc',
                'surface0': '#ccd0da',
                'base': '#eff1f5',
                'mantle': '#e6e9ef',
                'crust': '#dce0e8',
            },
            'mocha': {
                'rosewater': '#f5e0dc',
                'flamingo': '#f2cdcd',
                'pink': '#f5c2e7',
                'mauve': '#cba6f7',
                'red': '#f38ba8',
                'maroon': '#eba0ac',
                'peach': '#fab387',
                'yellow': '#f9e2af',
                'green': '#a6e3a1',
                'teal': '#94e2d5',
                'sky': '#89dceb',
                'sapphire': '#74c7ec',
                'blue': '#89b4fa',
                'lavender': '#b4befe',
                'text': '#cdd6f4',
                'subtext1': '#bac2de',
                'subtext0': '#a6adc8',
                'overlay2': '#9399b2',
                'overlay1': '#7f849c',
                'overlay0': '#6c7086',
                'surface2': '#585b70',
                'surface1': '#45475a',
                'surface0': '#313244',
                'base': '#1e1e2e',
                'mantle': '#181825',
                'crust': '#11111b',
            }
        },
        'dracula': {
            'background': '#282a36',
            'current_line': '#44475a',
            'selection': '#44475a',
            'foreground': '#f8f8f2',
            'comment': '#6272a4',
            'cyan': '#8be9fd',
            'green': '#50fa7b',
            'orange': '#ffb86c',
            'pink': '#ff79c6',
            'purple': '#bd93f9',
            'red': '#ff5555',
            'yellow': '#f1fa8c'
        }
    }

    def __init__(self, source_color_hct, is_dark, contrast_level, palette_name='catppuccin', variant='mocha'):
        # Get the selected palette
        if palette_name == 'catppuccin':
            palette = self.PALETTES[palette_name][variant]
            primary_color = palette['blue']
            secondary_color = palette['mauve']
            tertiary_color = palette['pink']
            neutral_color = palette['surface0']
            neutral_variant = palette['surface1']
        elif palette_name == 'dracula':
            palette = self.PALETTES[palette_name]
            primary_color = palette['purple']
            secondary_color = palette['pink']
            tertiary_color = palette['cyan']
            neutral_color = palette['current_line']
            neutral_variant = palette['selection']
        else:
            raise ValueError(f"Unknown palette: {palette_name}")

        # Convert hex to HCT
        primary_hct = Hct.from_int(int(primary_color.replace('#', ''), 16))
        secondary_hct = Hct.from_int(int(secondary_color.replace('#', ''), 16))
        tertiary_hct = Hct.from_int(int(tertiary_color.replace('#', ''), 16))
        neutral_hct = Hct.from_int(int(neutral_color.replace('#', ''), 16))
        neutral_variant_hct = Hct.from_int(int(neutral_variant.replace('#', ''), 16))

        super().__init__(
            DynamicSchemeOptions(
                source_color_argb=source_color_hct.to_int(),
                variant=Variant.VIBRANT,
                contrast_level=contrast_level,
                is_dark=is_dark,
                primary_palette=TonalPalette.from_hue_and_chroma(
                    primary_hct.hue,
                    primary_hct.chroma
                ),
                secondary_palette=TonalPalette.from_hue_and_chroma(
                    secondary_hct.hue,
                    secondary_hct.chroma
                ),
                tertiary_palette=TonalPalette.from_hue_and_chroma(
                    tertiary_hct.hue,
                    tertiary_hct.chroma
                ),
                neutral_palette=TonalPalette.from_hue_and_chroma(
                    neutral_hct.hue,
                    neutral_hct.chroma
                ),
                neutral_variant_palette=TonalPalette.from_hue_and_chroma(
                    neutral_variant_hct.hue,
                    neutral_variant_hct.chroma
                ),
            )
        )
