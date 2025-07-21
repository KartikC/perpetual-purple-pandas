// Color utility functions for ensuring text visibility

// Calculate relative luminance (WCAG formula)
export const getLuminance = (r, g, b) => {
  const toLinear = (c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
};

// Calculate contrast ratio between two colors
export const getContrastRatio = (color1, color2) => {
  const l1 = getLuminance(color1[0], color1[1], color1[2]);
  const l2 = getLuminance(color2[0], color2[1], color2[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

// Check if color is considered "light" or "dark"
export const isLight = (r, g, b) => {
  const luminance = getLuminance(r, g, b);
  return luminance > 0.5;
};

// Adjust color brightness to ensure minimum contrast
export const adjustForContrast = (textColor, bgColor, minContrast = 4.5) => {
  let adjustedColor = [...textColor];
  let contrast = getContrastRatio(adjustedColor, bgColor);
  
  if (contrast >= minContrast) {
    return adjustedColor;
  }
  
  // Determine if we should make the text darker or lighter
  const bgIsLight = isLight(bgColor[0], bgColor[1], bgColor[2]);
  
  // Try making text darker or lighter based on background
  const adjustment = bgIsLight ? -15 : 15;
  let iterations = 0;
  const maxIterations = 15;
  
  while (contrast < minContrast && iterations < maxIterations) {
    adjustedColor = adjustedColor.map(c => {
      const newValue = c + adjustment;
      return Math.max(0, Math.min(255, newValue));
    });
    
    contrast = getContrastRatio(adjustedColor, bgColor);
    iterations++;
  }
  
  // If still not enough contrast, use high contrast fallbacks
  if (contrast < minContrast) {
    return bgIsLight ? [0, 0, 0] : [255, 255, 255];
  }
  
  return adjustedColor;
};

// Generate accessible color palette from extracted colors
export const createAccessiblePalette = (extractedColors) => {
  if (!extractedColors || extractedColors.length < 1) {
    return {
      bgColor: [240, 240, 240],
      topTextColor: [50, 50, 50],
      bottomTextColor: [100, 100, 100],
    };
  }
  
  // Use the most dominant color as background
  const bgColor = extractedColors[0];
  
  // Find the best contrasting colors for text
  let bestTopText = null;
  let bestBottomText = null;
  let bestTopContrast = 0;
  let bestBottomContrast = 0;
  
  // Check all extracted colors for the best text colors
  for (let i = 1; i < extractedColors.length; i++) {
    const contrast = getContrastRatio(extractedColors[i], bgColor);
    
    if (contrast > bestTopContrast) {
      bestBottomText = bestTopText; // Move previous best to bottom
      bestBottomContrast = bestTopContrast;
      
      bestTopText = extractedColors[i];
      bestTopContrast = contrast;
    } else if (contrast > bestBottomContrast) {
      bestBottomText = extractedColors[i];
      bestBottomContrast = contrast;
    }
  }
  
  // If we don't have good text colors, generate them
  if (!bestTopText) {
    bestTopText = isLight(bgColor[0], bgColor[1], bgColor[2]) ? [0, 0, 0] : [255, 255, 255];
  }
  
  if (!bestBottomText) {
    // Create a secondary text color that's between the bg and top text
    const bgIsLight = isLight(bgColor[0], bgColor[1], bgColor[2]);
    bestBottomText = bgIsLight ? [80, 80, 80] : [180, 180, 180];
  }
  
  // Ensure minimum contrast ratios
  const topTextColor = adjustForContrast(bestTopText, bgColor, 4.5); // WCAG AA
  const bottomTextColor = adjustForContrast(bestBottomText, bgColor, 3.0); // More relaxed for secondary text
  
  return {
    bgColor,
    topTextColor,
    bottomTextColor,
  };
};

// Convert RGB array to CSS rgb string
export const rgbToString = (rgb) => `rgb(${rgb.join(',')})`;

// Enhanced color extraction with accessibility
export const extractAccessibleColors = (colorCounts) => {
  // Get the most common colors
  const sortedColors = Object.entries(colorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6) // Get more colors to work with
    .map(([color]) => color.split(',').map(Number));
  
  // Create accessible palette
  const palette = createAccessiblePalette(sortedColors);
  
  return {
    bgColor: rgbToString(palette.bgColor),
    topTextColor: rgbToString(palette.topTextColor),
    bottomTextColor: rgbToString(palette.bottomTextColor),
  };
};