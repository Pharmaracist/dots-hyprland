from materialyoucolor.scheme.dynamic_scheme import DynamicSchemeOptions, DynamicScheme
from materialyoucolor.scheme.variant import Variant
from materialyoucolor.palettes.tonal_palette import TonalPalette

class SchemeNature(DynamicScheme):
    # Natural color hue points
    hues = [30.0, 60.0, 120.0, 170.0, 210.0, 240.0, 280.0, 320.0, 350.0]
    # Forest and foliage accents
    secondary_rotations = [60.0, 60.0, 60.0, 60.0, 60.0, 60.0, 60.0, 60.0, 60.0]
    # Sky and water accents
    tertiary_rotations = [180.0, 180.0, 180.0, 180.0, 180.0, 180.0, 180.0, 180.0, 180.0]

    def __init__(self, source_color_hct, is_dark, contrast_level):
        # Snap to natural color ranges
        base_hue = source_color_hct.hue
        if 15 <= base_hue <= 45:  # Earth browns
            base_hue = 30.0
        elif 45 <= base_hue <= 75:  # Warm yellows
            base_hue = 60.0
        elif 75 <= base_hue <= 165:  # Forest greens
            base_hue = 120.0
        elif 165 <= base_hue <= 195:  # Ocean teals
            base_hue = 180.0
        elif 195 <= base_hue <= 225:  # Sky blues
            base_hue = 210.0
        
        # Adjust chroma for readability
        nature_chroma = 50.0 if is_dark else 40.0
        
        super().__init__(
            DynamicSchemeOptions(
                source_color_argb=source_color_hct.to_int(),
                variant=Variant.EXPRESSIVE,
                contrast_level=0.95,  # Increased contrast for readability
                is_dark=is_dark,
                primary_palette=TonalPalette.from_hue_and_chroma(
                    base_hue,
                    nature_chroma  # Balanced earth tones
                ),
                secondary_palette=TonalPalette.from_hue_and_chroma(
                    (base_hue + 60.0) % 360.0,  # Natural complement
                    nature_chroma * 0.8  # Slightly muted
                ),
                tertiary_palette=TonalPalette.from_hue_and_chroma(
                    (base_hue + 180.0) % 360.0,  # Complementary accent
                    nature_chroma * 0.9  # Balanced accent
                ),
                neutral_palette=TonalPalette.from_hue_and_chroma(
                    30.0,  # Warm earth tone
                    6.0  # Subtle but visible
                ),
                neutral_variant_palette=TonalPalette.from_hue_and_chroma(
                    45.0,  # Slightly warmer
                    10.0  # More noticeable
                ),
            )
        )
