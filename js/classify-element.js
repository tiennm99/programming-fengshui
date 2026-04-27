// Algorithm: plans/reports/researcher-260427-0854-nguhanh-color-classifier.md §2
// Pure HSL classifier mapping a hex color to one of the 5 Ngũ Hành elements.

export const ELEMENTS = [
  { key: 'kim',  label: 'KIM'  },
  { key: 'moc',  label: 'MỘC'  },
  { key: 'thuy', label: 'THUỶ' },
  { key: 'hoa',  label: 'HOẢ'  },
  { key: 'tho',  label: 'THỔ'  },
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function hexToHsl(hex) {
  if (typeof hex !== 'string' || !HEX_RE.test(hex)) {
    throw new TypeError(`hexToHsl: expected '#RRGGBB', got ${hex}`);
  }
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d) + (g < b ? 6 : 0); break;
      case g: h = ((b - r) / d) + 2; break;
      case b: h = ((r - g) / d) + 4; break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function classify(hex) {
  const { h, s, l } = hexToHsl(hex);

  // Step 2: grayscale (very low saturation)
  if (s < 5) {
    if (l < 20) return 'thuy';
    if (l < 70) return 'tho';
    return 'kim';
  }

  // Step 3: hue ranges
  if (h < 20) return 'hoa';
  if (h < 40) return (s >= 60 && l >= 50) ? 'hoa' : 'tho';
  if (h < 70) return 'tho';
  if (h < 200) return 'moc';
  if (h < 260) return 'thuy';
  return 'hoa';
}
