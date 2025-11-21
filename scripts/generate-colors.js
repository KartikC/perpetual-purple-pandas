const fs = require('fs');
const path = require('path');
const ColorThief = require('colorthief');

const animalsDir = path.join(__dirname, '../public/animals');
const outputFile = path.join(__dirname, '../src/constants/color-map.json');

async function generateColorMap() {
    if (!fs.existsSync(animalsDir)) {
        console.error(`Directory not found: ${animalsDir}`);
        return;
    }

    const files = fs.readdirSync(animalsDir);
    const colorMap = {};

    console.log(`Found ${files.length} files. Processing...`);

    for (const file of files) {
        if (file.endsWith('.png')) {
            const filePath = path.join(animalsDir, file);
            try {
                const palette = await ColorThief.getPalette(filePath, 3);
                colorMap[file] = {
                    bgColor: `rgb(${palette[0].join(',')})`,
                    topTextColor: `rgb(${palette[1].join(',')})`,
                    bottomTextColor: `rgb(${palette[2].join(',')})`
                };
            } catch (err) {
                console.error(`Error processing ${file}:`, err);
                // Fallback
                colorMap[file] = {
                    bgColor: 'white',
                    topTextColor: 'black',
                    bottomTextColor: 'grey'
                };
            }
        }
    }

    fs.writeFileSync(outputFile, JSON.stringify(colorMap, null, 2));
    console.log(`Color map generated at ${outputFile}`);
}

generateColorMap();
