#!/usr/bin/env python3
"""Read an image and print gallery colour metadata; never modifies the image.

Requires Pillow. Example:
  python3 scripts/sample-colors.py site/assets/blue-seascape.jpg --frame '#000000'
"""
import argparse
import json
import math
import re
from PIL import Image, ImageOps


def oklch(rgb):
    r, g, b = [
        channel / 255 / 12.92 if channel / 255 <= 0.04045
        else ((channel / 255 + 0.055) / 1.055) ** 2.4
        for channel in rgb
    ]
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
    a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
    b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    return {
        'l': round(lightness, 4),
        'c': round(math.hypot(a, b), 4),
        'h': round(math.degrees(math.atan2(b, a)) % 360, 2) % 360,
    }


def sample(path, frame):
    with Image.open(path) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
    image.thumbnail((100, 100))
    quantized = image.quantize(colors=5, method=Image.Quantize.MEDIANCUT)
    palette = quantized.getpalette()
    total = image.width * image.height
    swatches = []
    for count, index in sorted(quantized.getcolors(), reverse=True):
        rgb = palette[index * 3:index * 3 + 3]
        swatches.append({
            'hex': '#' + ''.join(f'{channel:02x}' for channel in rgb),
            'weight': round(count / total, 5),
            'oklch': oklch(rgb),
        })
    return {
        'frame': frame,
        'base': swatches[0]['hex'],
        'palette': swatches,
        'source': 'sampled-image',
        'method': 'median-cut-5-srgb',
        'sampleMaxEdge': 100,
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('image')
    parser.add_argument('--frame', help='Exact six-digit frame hex; omit for frameless images')
    args = parser.parse_args()
    if args.frame and not re.fullmatch(r'#[0-9a-fA-F]{6}', args.frame):
        parser.error('--frame must be a six-digit hex colour')
    print(json.dumps(sample(args.image, args.frame), indent=2))
