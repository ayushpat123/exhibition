export function backColor(colors) {
  return colors.frame ?? colors.edge ?? colors.base;
}

function luminance(hex) {
  const linear = hex.slice(1).match(/../g).map(value => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

export function contrastRatio(a, b) {
  const light = luminance(a), dark = luminance(b);
  return (Math.max(light, dark) + 0.05) / (Math.min(light, dark) + 0.05);
}

export function noteColor(background) {
  // Use the quietest grey that stays readable, including on future light frames.
  const candidates = luminance(background) > 0.179
    ? ['#555555', '#333333', '#171717', '#000000']
    : ['#a3a3a3', '#c0c0c0', '#e0e0e0', '#ffffff'];
  return candidates.find(color => contrastRatio(background, color) >= 4.5);
}
