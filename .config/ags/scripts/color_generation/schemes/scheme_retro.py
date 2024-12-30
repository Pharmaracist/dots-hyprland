from materialyoucolor.scheme.dynamic_scheme import DynamicSchemeOptions, DynamicScheme
from materialyoucolor.scheme.variant import Variant
from materialyoucolor.palettes.tonal_palette import TonalPalette

class SchemeRetro(DynamicScheme):
    # Classic terminal-inspired hue points
    hues = [0.0, 120.0, 240.0, 60.0, 180.0, 300.0, 30.0, 210.0, 330.0]
    # Classic terminal color pairs
    secondary_rotations = [120.0, 120.0, 120.0, 120.0, 120.0, 120.0, 120.0, 120.0, 120.0]
    # Complementary accents
    tertiary_rotations = [180.0, 180.0, 180.0, 180.0, 180.0, 180.0, 180.0, 180.0, 180.0]

    def __init__(self, source_color_hct, is_dark, contrast_level):
        # Ensure good contrast but not too extreme
        retro_contrast = 1.2
        
        # Snap hue to classic terminal colors
        base_hue = round(source_color_hct.hue / 60.0) * 60.0
        
        # Adjust chroma based on dark/light mode
        base_chroma = 85.0 if is_dark else 70.0
        
        super().__init__(
            DynamicSchemeOptions(
                source_color_argb=source_color_hct.to_int(),
                variant=Variant.VIBRANT,
                contrast_level=retro_contrast,
                is_dark=is_dark,
                primary_palette=TonalPalette.from_hue_and_chroma(
                    base_hue,
                    base_chroma  # More balanced saturation
                ),
                secondary_palette=TonalPalette.from_hue_and_chroma(
                    (base_hue + 120.0) % 360.0,  # Classic terminal secondary
                    base_chroma * 0.85  # Slightly reduced for better readability
                ),
                tertiary_palette=TonalPalette.from_hue_and_chroma(
                    (base_hue + 240.0) % 360.0,  # Complete triad
                    base_chroma * 0.75  # Further reduced for accents
                ),
                neutral_palette=TonalPalette.from_hue_and_chroma(
                    base_hue,
                    4.0  # Slightly increased for better distinction
                ),
                neutral_variant_palette=TonalPalette.from_hue_and_chroma(
                    base_hue,
                    8.0  # More noticeable tint for variants
                ),
            )
        )
