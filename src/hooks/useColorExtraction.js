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
          self.onmessage = function(e) {
            const { imageData, id } = e.data;
            
            // Simple color extraction algorithm
            const extractDominantColors = (data) => {
              const colorMap = new Map();
              const step = 20; // Sample every 20th pixel for performance
              
              for (let i = 0; i < data.length; i += step * 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const alpha = data[i + 3];
                
                if (alpha > 128) { // Skip transparent pixels
                  const key = Math.floor(r/32)*32 + ',' + Math.floor(g/32)*32 + ',' + Math.floor(b/32)*32;
                  colorMap.set(key, (colorMap.get(key) || 0) + 1);
                }
              }
              
              // Get the 3 most common colors
              const sortedColors = Array.from(colorMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([color]) => color.split(',').map(Number));
              
              return sortedColors.length >= 3 ? sortedColors : [
                [240, 240, 240],
                [50, 50, 50],
                [100, 100, 100]
              ];
            };
            
            try {
              const palette = extractDominantColors(imageData.data);
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
              bgColor: `rgb(${palette[0].join(',')})`,
              topTextColor: `rgb(${palette[1].join(',')})`,
              bottomTextColor: `rgb(${palette[2].join(',')})`,
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
    if (!colorCache.has(imageUrl)) {
      await extractColors(imageUrl, false);
    }
    return colorCache.get(imageUrl) || DEFAULT_COLORS;
  }, [extractColors]);

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