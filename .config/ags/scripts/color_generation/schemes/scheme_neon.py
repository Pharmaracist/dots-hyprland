from materialyoucolor.scheme.dynamic_scheme import DynamicSchemeOptions, DynamicScheme
from materialyoucolor.scheme.variant import Variant
from materialyoucolor.palettes.tonal_palette import TonalPalette

class SchemeNeon(DynamicScheme):
    # Cyberpunk-inspired hue points optimized for neon effect
    hues = [0.0, 45.0, 90.0, 135.0, 180.0, 225.0, 270.0, 315.0, 360.0]
    # Golden ratio-based rotations for dynamic effect
    secondary_rotations = [34.0, 55.0, 89.0, 144.0, 89.0, 55.0, 34.0, 21.0, 13.0]
    # Complementary rotations for maximum impact
    tertiary_rotations = [180.0, 180.0, 180.0, 180.0, 180.0, 180.0, 180.0, 180.0, 180.0]

    def __init__(self, source_color_hct, is_dark, contrast_level):
        # Calculate complementary hue for accent
        complement_hue = (source_color_hct.hue + 180.0) % 360.0
        
        super().__init__(
            DynamicSchemeOptions(
                source_color_argb=source_color_hct.to_int(),
                variant=Variant.VIBRANT,
                contrast_level=max(contrast_level, 1.0),  # Ensure minimum contrast
                is_dark=is_dark,
                primary_palette=TonalPalette.from_hue_and_chroma(
                    source_color_hct.hue,
                    180.0  # Higher chroma for neon effect
                ),
                secondary_palette=TonalPalette.from_hue_and_chroma(
                    DynamicScheme.get_rotated_hue(
                        source_color_hct,
                        SchemeNeon.hues,
                        SchemeNeon.secondary_rotations,
                    ),
                    140.0,  # High chroma for secondary colors
                ),
                tertiary_palette=TonalPalette.from_hue_and_chroma(
                    complement_hue,  # Use complementary color
                    160.0,  # Very high chroma for tertiary colors
                ),
                neutral_palette=TonalPalette.from_hue_and_chroma(
                    source_color_hct.hue,
                    4.0  # Very low chroma for stark contrast
                ),
                neutral_variant_palette=TonalPalette.from_hue_and_chroma(
                    complement_hue,  # Use complementary color for variants
                    8.0  # Slightly higher chroma for neutral variants
                ),
            )
        )
