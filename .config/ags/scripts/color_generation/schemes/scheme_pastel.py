from materialyoucolor.scheme.dynamic_scheme import DynamicSchemeOptions, DynamicScheme
from materialyoucolor.scheme.variant import Variant
from materialyoucolor.palettes.tonal_palette import TonalPalette

class SchemePastel(DynamicScheme):
    # Soft color hue points based on natural phenomena
    hues = [0.0, 30.0, 60.0, 90.0, 120.0, 150.0, 180.0, 210.0, 240.0]
    # Golden angle-based rotations for harmony
    secondary_rotations = [30.0, 30.0, 30.0, 30.0, 30.0, 30.0, 30.0, 30.0, 30.0]
    # Analogous color rotations
    tertiary_rotations = [60.0, 60.0, 60.0, 60.0, 60.0, 60.0, 60.0, 60.0, 60.0]

    def __init__(self, source_color_hct, is_dark, contrast_level):
        # Calculate analogous hue
        analogous_hue = (source_color_hct.hue + 30.0) % 360.0
        
        # Base chroma value adjusted for dark mode
        base_chroma = 45.0 if is_dark else 35.0
        
        super().__init__(
            DynamicSchemeOptions(
                source_color_argb=source_color_hct.to_int(),
                variant=Variant.EXPRESSIVE,
                contrast_level=min(contrast_level, 0.8),  # Reduce contrast for softer look
                is_dark=is_dark,
                primary_palette=TonalPalette.from_hue_and_chroma(
                    source_color_hct.hue,
                    base_chroma  # Base chroma for pastel effect
                ),
                secondary_palette=TonalPalette.from_hue_and_chroma(
                    analogous_hue,  # Use analogous color
                    base_chroma * 0.9  # Slightly reduced chroma
                ),
                tertiary_palette=TonalPalette.from_hue_and_chroma(
                    DynamicScheme.get_rotated_hue(
                        source_color_hct,
                        SchemePastel.hues,
                        SchemePastel.tertiary_rotations,
                    ),
                    base_chroma * 0.8  # Further reduced chroma
                ),
                neutral_palette=TonalPalette.from_hue_and_chroma(
                    source_color_hct.hue,
                    3.0  # Very low chroma for neutrals
                ),
                neutral_variant_palette=TonalPalette.from_hue_and_chroma(
                    analogous_hue,  # Use analogous color for variants
                    5.0  # Slightly higher chroma for neutral variants
                ),
            )
        )
