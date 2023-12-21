// pages/api/get-border-color.js
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
  const { imageUrl } = req.query;

  try {
    // Fetch the image from the URL
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();

    // Use sharp to process the image buffer
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Calculate border size based on image dimensions
    const borderWidth = Math.ceil(Math.min(metadata.width, metadata.height) * 0.01); // 1% of the smallest dimension

    // Extract the border pixels
    const borderPixels = await getBorderPixels(image, borderWidth, metadata);

    // Analyze the pixels to find the most frequent color
    const mostFrequentColor = findMostFrequentColor(borderPixels);

    // Respond with the most frequent color
    res.status(200).json({ color: mostFrequentColor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getBorderPixels(image, borderWidth, metadata) {
  // Ensure the border width does not exceed half of the image's dimensions
  borderWidth = Math.min(borderWidth, Math.floor(metadata.width / 2), Math.floor(metadata.height / 2));

  // Extract pixels from the four borders
  const topBorder = await image.extract({ left: 0, top: 0, width: metadata.width, height: borderWidth }).raw().toBuffer();
  const bottomBorder = await image.extract({ left: 0, top: metadata.height - borderWidth, width: metadata.width, height: borderWidth }).raw().toBuffer();
  const leftBorder = await image.extract({ left: 0, top: borderWidth, width: borderWidth, height: metadata.height - 2 * borderWidth }).raw().toBuffer();
  const rightBorder = await image.extract({ left: metadata.width - borderWidth, top: borderWidth, width: borderWidth, height: metadata.height - 2 * borderWidth }).raw().toBuffer();

  // Combine the border pixel data
  const combinedBorders = Buffer.concat([topBorder, bottomBorder, leftBorder, rightBorder]);
  return combinedBorders;
}


function findMostFrequentColor(pixels) {
    // Convert the raw buffer to an array of RGB values
    const rgbValues = [];
    for (let i = 0; i < pixels.length; i += 4) { // Assuming RGBA, so step by 4
      rgbValues.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }
  
    // Count frequency of each color
    const colorFrequency = {};
    rgbValues.forEach((rgb) => {
      const colorKey = rgb.join(',');
      colorFrequency[colorKey] = (colorFrequency[colorKey] || 0) + 1;
    });
  
    // Find the most frequent color
    let mostFrequentColor = null;
    let maxFrequency = 0;
    Object.entries(colorFrequency).forEach(([color, freq]) => {
      if (freq > maxFrequency) {
        mostFrequentColor = color.split(',').map(Number); // Convert to numbers
        maxFrequency = freq;
      }
    });
  
    // Convert the most frequent color to hexadecimal
    const toHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
  
    return `#${toHex(mostFrequentColor[0])}${toHex(mostFrequentColor[1])}${toHex(mostFrequentColor[2])}`;
  }
  
