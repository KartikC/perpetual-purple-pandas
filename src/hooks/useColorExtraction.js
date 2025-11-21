import { useState, useCallback } from 'react';
import colorMap from '../constants/color-map.json';

const DEFAULT_COLORS = {
  bgColor: 'rgb(240, 240, 240)',
  topTextColor: 'rgb(100, 100, 100)',
  bottomTextColor: 'rgb(50, 50, 50)',
};

export const useColorExtraction = () => {
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [isExtracting, setIsExtracting] = useState(false);

  const extractColors = useCallback(async (imageUrl) => {
    if (!imageUrl) return;

    // imageUrl is like "/animals/purple panda.png"
    // map keys are "purple panda.png"
    const filename = imageUrl.split('/').pop();
    // Decode URI component in case of spaces like %20
    const decodedFilename = decodeURIComponent(filename);

    const mappedColors = colorMap[decodedFilename];

    if (mappedColors) {
      // Ensure format matches
      if (typeof mappedColors === 'string') {
        setColors({
          bgColor: mappedColors,
          topTextColor: "black",
          bottomTextColor: "grey"
        });
      } else {
        setColors({
          bgColor: mappedColors.bgColor,
          topTextColor: mappedColors.bottomTextColor,
          bottomTextColor: mappedColors.topTextColor
        });
      }
    } else {
      setColors(DEFAULT_COLORS);
    }
  }, []);

  const preloadColors = useCallback(async (imageUrl) => {
    if (!imageUrl) return DEFAULT_COLORS;

    const filename = imageUrl.split('/').pop();
    const decodedFilename = decodeURIComponent(filename);
    const mappedColors = colorMap[decodedFilename];

    if (mappedColors) {
      return {
        bgColor: mappedColors.bgColor,
        topTextColor: mappedColors.bottomTextColor,
        bottomTextColor: mappedColors.topTextColor
      };
    }
    return DEFAULT_COLORS;
  }, []);

  const cleanup = useCallback(() => { }, []);

  return {
    colors,
    isExtracting,
    extractColors,
    preloadColors,
    cleanup,
    setColors,
  };
};