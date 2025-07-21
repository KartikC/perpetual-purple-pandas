// Fallback color extraction for when web workers are not available
export const extractColorsMainThread = async (imageUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Use a small canvas for performance
        const size = 50;
        canvas.width = size;
        canvas.height = size;
        
        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;
        
        // Simple and fast color extraction
        const colorCounts = {};
        const step = 8; // Sample fewer pixels for performance
        
        for (let i = 0; i < data.length; i += step * 4) {
          const r = Math.floor(data[i] / 32) * 32;
          const g = Math.floor(data[i + 1] / 32) * 32;
          const b = Math.floor(data[i + 2] / 32) * 32;
          const alpha = data[i + 3];
          
          if (alpha > 128) {
            const key = `${r},${g},${b}`;
            colorCounts[key] = (colorCounts[key] || 0) + 1;
          }
        }
        
        // Get top 3 colors
        const sortedColors = Object.entries(colorCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([color]) => color.split(',').map(Number));
        
        if (sortedColors.length >= 3) {
          resolve({
            bgColor: `rgb(${sortedColors[0].join(',')})`,
            topTextColor: `rgb(${sortedColors[1].join(',')})`,
            bottomTextColor: `rgb(${sortedColors[2].join(',')})`,
          });
        } else {
          // Fallback colors
          resolve({
            bgColor: 'rgb(240, 240, 240)',
            topTextColor: 'rgb(50, 50, 50)',
            bottomTextColor: 'rgb(100, 100, 100)',
          });
        }
      } catch (error) {
        console.error('Fallback color extraction error:', error);
        resolve({
          bgColor: 'rgb(240, 240, 240)',
          topTextColor: 'rgb(50, 50, 50)',
          bottomTextColor: 'rgb(100, 100, 100)',
        });
      }
    };
    
    img.onerror = () => {
      resolve({
        bgColor: 'rgb(240, 240, 240)',
        topTextColor: 'rgb(50, 50, 50)',
        bottomTextColor: 'rgb(100, 100, 100)',
      });
    };
    
    img.src = imageUrl;
  });
};