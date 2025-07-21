import { useState, useCallback, useRef } from 'react';

// Color cache to avoid re-extracting colors for the same images
const colorCache = new Map();

// Default fallback colors
const DEFAULT_COLORS = {
  bgColor: 'rgb(240, 240, 240)',
  topTextColor: 'rgb(50, 50, 50)',
  bottomTextColor: 'rgb(100, 100, 100)',
};

export const useColorExtraction = () => {
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [isExtracting, setIsExtracting] = useState(false);
  const workerRef = useRef(null);

  // Initialize web worker for color extraction (if available)
  const initWorker = useCallback(() => {
    if (typeof window !== 'undefined' && !workerRef.current) {
      try {
        // Create a simple worker for color extraction
        const workerBlob = new Blob([`
          // Color utility functions (duplicated in worker for performance)
          const getLuminance = (r, g, b) => {
            const toLinear = (c) => {
              c = c / 255;
              return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            };
            return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
          };
          
          const getContrastRatio = (color1, color2) => {
            const l1 = getLuminance(color1[0], color1[1], color1[2]);
            const l2 = getLuminance(color2[0], color2[1], color2[2]);
            const lighter = Math.max(l1, l2);
            const darker = Math.min(l1, l2);
            return (lighter + 0.05) / (darker + 0.05);
          };
          
          const isLight = (r, g, b) => {
            const luminance = getLuminance(r, g, b);
            return luminance > 0.5;
          };
          
          const adjustForContrast = (textColor, bgColor, minContrast = 4.5) => {
            let adjustedColor = [...textColor];
            let contrast = getContrastRatio(adjustedColor, bgColor);
            
            if (contrast >= minContrast) {
              return adjustedColor;
            }
            
            const bgIsLight = isLight(bgColor[0], bgColor[1], bgColor[2]);
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
            
            if (contrast < minContrast) {
              return bgIsLight ? [0, 0, 0] : [255, 255, 255];
            }
            
            return adjustedColor;
          };
          
          const createAccessiblePalette = (extractedColors) => {
            if (!extractedColors || extractedColors.length < 1) {
              return {
                bgColor: [240, 240, 240],
                topTextColor: [50, 50, 50],
                bottomTextColor: [100, 100, 100],
              };
            }
            
            const bgColor = extractedColors[0];
            let bestTopText = null;
            let bestBottomText = null;
            let bestTopContrast = 0;
            let bestBottomContrast = 0;
            
            for (let i = 1; i < extractedColors.length; i++) {
              const contrast = getContrastRatio(extractedColors[i], bgColor);
              
              if (contrast > bestTopContrast) {
                bestBottomText = bestTopText;
                bestBottomContrast = bestTopContrast;
                bestTopText = extractedColors[i];
                bestTopContrast = contrast;
              } else if (contrast > bestBottomContrast) {
                bestBottomText = extractedColors[i];
                bestBottomContrast = contrast;
              }
            }
            
            if (!bestTopText) {
              bestTopText = isLight(bgColor[0], bgColor[1], bgColor[2]) ? [0, 0, 0] : [255, 255, 255];
            }
            
            if (!bestBottomText) {
              const bgIsLight = isLight(bgColor[0], bgColor[1], bgColor[2]);
              bestBottomText = bgIsLight ? [80, 80, 80] : [180, 180, 180];
            }
            
            const topTextColor = adjustForContrast(bestTopText, bgColor, 4.5);
            const bottomTextColor = adjustForContrast(bestBottomText, bgColor, 3.0);
            
            return { bgColor, topTextColor, bottomTextColor };
          };
          
          self.onmessage = function(e) {
            const { imageData, id } = e.data;
            
            const extractAccessibleColors = (data) => {
              const colorCounts = {};
              const step = 20; // Sample every 20th pixel for performance
              
              for (let i = 0; i < data.length; i += step * 4) {
                const r = Math.floor(data[i] / 32) * 32;
                const g = Math.floor(data[i + 1] / 32) * 32;
                const b = Math.floor(data[i + 2] / 32) * 32;
                const alpha = data[i + 3];
                
                if (alpha > 128) {
                  const key = r + ',' + g + ',' + b;
                  colorCounts[key] = (colorCounts[key] || 0) + 1;
                }
              }
              
              // Get the most common colors
              const sortedColors = Object.entries(colorCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([color]) => color.split(',').map(Number));
              
              return createAccessiblePalette(sortedColors);
            };
            
            try {
              const palette = extractAccessibleColors(imageData.data);
              self.postMessage({ 
                success: true, 
                palette, 
                id 
              });
            } catch (error) {
              self.postMessage({ 
                success: false, 
                error: error.message, 
                id 
              });
            }
          };
        `], { type: 'application/javascript' });
        
        workerRef.current = new Worker(URL.createObjectURL(workerBlob));
        
        workerRef.current.onmessage = (e) => {
          const { success, palette, id } = e.data;
          if (success) {
            const newColors = {
              bgColor: `rgb(${palette.bgColor.join(',')})`,
              topTextColor: `rgb(${palette.topTextColor.join(',')})`,
              bottomTextColor: `rgb(${palette.bottomTextColor.join(',')})`,
            };
            setColors(newColors);
            // Cache the result
            colorCache.set(id, newColors);
          } else {
            setColors(DEFAULT_COLORS);
          }
          setIsExtracting(false);
        };
      } catch (error) {
        console.warn('Web Worker not available, falling back to main thread');
      }
    }
  }, []);

  const extractColors = useCallback(async (imageUrl, skipCache = false) => {
    if (!skipCache && colorCache.has(imageUrl)) {
      setColors(colorCache.get(imageUrl));
      return;
    }

    setIsExtracting(true);
    
    try {
      // Initialize worker if not already done
      initWorker();

      if (workerRef.current) {
        // Use web worker for better performance
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Resize for performance while maintaining aspect ratio
          const maxSize = 150;
          const scale = Math.min(maxSize / img.width, maxSize / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          workerRef.current.postMessage({ imageData, id: imageUrl });
        };
        
        img.onerror = () => {
          setColors(DEFAULT_COLORS);
          setIsExtracting(false);
        };
        
        img.src = imageUrl;
      } else {
        // Fallback to main thread with reduced processing
        const { extractColorsMainThread } = await import('./colorExtractionFallback');
        const newColors = await extractColorsMainThread(imageUrl);
        setColors(newColors);
        colorCache.set(imageUrl, newColors);
        setIsExtracting(false);
      }
    } catch (error) {
      console.error('Color extraction error:', error);
      setColors(DEFAULT_COLORS);
      setIsExtracting(false);
    }
  }, [initWorker]);

  const preloadColors = useCallback(async (imageUrl) => {
    // Check cache first
    if (colorCache.has(imageUrl)) {
      return colorCache.get(imageUrl);
    }

    // Extract colors without updating current state
    return new Promise((resolve) => {
      try {
        initWorker();

        if (workerRef.current) {
          // Use web worker for better performance
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Resize for performance while maintaining aspect ratio
            const maxSize = 150;
            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Create a one-time message handler for this specific preload
            const handleMessage = (e) => {
              const { success, palette, id } = e.data;
              if (id === imageUrl) {
                workerRef.current.removeEventListener('message', handleMessage);
                
                if (success) {
                  const newColors = {
                    bgColor: `rgb(${palette.bgColor.join(',')})`,
                    topTextColor: `rgb(${palette.topTextColor.join(',')})`,
                    bottomTextColor: `rgb(${palette.bottomTextColor.join(',')})`,
                  };
                  // Cache but don't update current colors
                  colorCache.set(imageUrl, newColors);
                  resolve(newColors);
                } else {
                  resolve(DEFAULT_COLORS);
                }
              }
            };
            
            workerRef.current.addEventListener('message', handleMessage);
            workerRef.current.postMessage({ imageData, id: imageUrl });
          };
          
          img.onerror = () => {
            resolve(DEFAULT_COLORS);
          };
          
          img.src = imageUrl;
        } else {
          // Fallback to main thread
          import('./colorExtractionFallback').then(({ extractColorsMainThread }) => {
            extractColorsMainThread(imageUrl).then(colors => {
              colorCache.set(imageUrl, colors);
              resolve(colors);
            }).catch(() => {
              resolve(DEFAULT_COLORS);
            });
          });
        }
      } catch (error) {
        console.error('Preload color extraction error:', error);
        resolve(DEFAULT_COLORS);
      }
    });
  }, [initWorker]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return {
    colors,
    isExtracting,
    extractColors,
    preloadColors,
    cleanup,
    setColors, // Allow manual color setting for immediate updates
  };
};