import { useCallback, useRef, useEffect } from 'react';

// Image cache for better performance
const imageCache = new Map();
const preloadQueue = [];
let isProcessingQueue = false;

export const useImagePreloader = () => {
  const preloadedImages = useRef(new Set());
  const abortControllers = useRef(new Map());

  // Process preload queue
  const processQueue = useCallback(async () => {
    if (isProcessingQueue || preloadQueue.length === 0) return;
    
    isProcessingQueue = true;
    
    while (preloadQueue.length > 0) {
      const { url, priority } = preloadQueue.shift();
      
      if (!imageCache.has(url) && !preloadedImages.current.has(url)) {
        try {
          await preloadSingleImage(url);
          preloadedImages.current.add(url);
        } catch (error) {
          console.warn(`Failed to preload image: ${url}`, error);
        }
      }
      
      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, priority === 'high' ? 0 : 10));
    }
    
    isProcessingQueue = false;
  }, []);

  const preloadSingleImage = useCallback((url) => {
    return new Promise((resolve, reject) => {
      if (imageCache.has(url)) {
        resolve(imageCache.get(url));
        return;
      }

      const img = new Image();
      const controller = new AbortController();
      
      // Store controller for potential cancellation
      abortControllers.current.set(url, controller);
      
      const cleanup = () => {
        abortControllers.current.delete(url);
        controller.abort();
      };

      img.onload = () => {
        imageCache.set(url, img);
        cleanup();
        resolve(img);
      };

      img.onerror = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${url}`));
      };

      // Handle abort
      controller.signal.addEventListener('abort', () => {
        reject(new Error('Image preload aborted'));
      });

      img.src = url;
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!imageCache.has(url)) {
          cleanup();
          reject(new Error('Image preload timeout'));
        }
      }, 10000);
    });
  }, []);

  const preloadImage = useCallback((url, priority = 'normal') => {
    if (imageCache.has(url) || preloadedImages.current.has(url)) {
      return Promise.resolve(imageCache.get(url));
    }

    // Add to queue
    preloadQueue.push({ url, priority });
    
    // Sort queue by priority
    preloadQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process queue
    processQueue();

    return preloadSingleImage(url);
  }, [processQueue]);

  const preloadImages = useCallback((urls, priority = 'normal') => {
    return Promise.allSettled(
      urls.map(url => preloadImage(url, priority))
    );
  }, [preloadImage]);

  const isImageCached = useCallback((url) => {
    return imageCache.has(url) || preloadedImages.current.has(url);
  }, []);

  const getCachedImage = useCallback((url) => {
    return imageCache.get(url);
  }, []);

  const clearCache = useCallback(() => {
    imageCache.clear();
    preloadedImages.current.clear();
  }, []);

  const cancelPreload = useCallback((url) => {
    const controller = abortControllers.current.get(url);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(url);
    }
    
    // Remove from queue
    const index = preloadQueue.findIndex(item => item.url === url);
    if (index > -1) {
      preloadQueue.splice(index, 1);
    }
  }, []);

  const getImageUrl = useCallback((color, animal) => {
    return `https://raw.githubusercontent.com/KartikC/perpetual-purple-pandas/main/public/animals/${color.toLowerCase()}%20${animal.toLowerCase()}.png`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all pending preloads
      const controllers = abortControllers.current;
      controllers.forEach(controller => controller.abort());
      controllers.clear();
    };
  }, []);

  return {
    preloadImage,
    preloadImages,
    isImageCached,
    getCachedImage,
    clearCache,
    cancelPreload,
    getImageUrl,
    cacheSize: imageCache.size,
  };
};