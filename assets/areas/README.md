# Landscape artwork

No artwork is bundled or generated. Supply the finished local landscape sketches here:

- limestone-canyon.webp
- weir-canyon.webp
- agua-chinon.webp
- red-rock.webp
- gypsum-canyon.webp
- saddleback.webp
- default.webp

Each supported area tries its own sketch, then default.webp, then plain ivory paper. Other locations and no location try default.webp, then plain paper. These are optional assets; missing files never block PNG export. Use self-contained WebP files with suitable reuse rights. Prefer transparent monochrome landscape sketches. The renderer also desaturates landscapes and applies opacity and an elliptical edge fade.

See js/badge-design.js for mapping, opacity, fade, placement, sizes, and typography. Artwork paths are relative to the site root (including a GitHub Pages project subpath). Bird artwork remains in assets/birds and should have a transparent background; the renderer preserves the entire image and its proportions. Existing opaque temporary bird SVGs are intentionally unchanged and will obscure any landscape beneath their opaque pixels until replaced.
