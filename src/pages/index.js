import { useState, useEffect, useCallback, useRef } from 'react';
import { initialColors, initialAnimals } from '../constants/data';
import Image from 'next/image';
import ColorThief from 'colorthief';

export default function Home() {
  const [currentCombination, setCurrentCombination] = useState({ color: 'purple', animal: 'panda' });
  const [nextCombination, setNextCombination] = useState({});
  const [usedAnimals, setUsedAnimals] = useState(['panda']);
  const [colors, setColors] = useState({
    bgColor: 'white',
    topTextColor: 'black',
    bottomTextColor: 'grey'
  });

  const imgRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const shuffleArray = useCallback((array) => {
    const newArray = array.slice();
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  const pickNewAnimal = useCallback((animals) => {
    return animals[Math.floor(Math.random() * animals.length)];
  }, []);

  const prepareNextCombination = useCallback(() => {
    let availableAnimals = initialAnimals.filter(animal => !usedAnimals.includes(animal));
    if (availableAnimals.length === 0) {
      availableAnimals = shuffleArray(initialAnimals);
      setUsedAnimals(['panda']);
    }
    const nextAnimal = pickNewAnimal(availableAnimals);
    const nextColor = pickNewAnimal(initialColors);
    //const nextImageSrc = `https://raw.githubusercontent.com/KartikC/perpetual-purple-pandas/main/public/animals/${nextColor.toLowerCase()}%20${nextAnimal.toLowerCase()}.png`;
    //preloadImage(nextImageSrc);

    setNextCombination({ color: nextColor, animal: nextAnimal });
    setUsedAnimals(prevUsedAnimals => [...prevUsedAnimals, nextAnimal]);
  }, [usedAnimals, pickNewAnimal, shuffleArray]);

  const updateColors = () => {
    if (imgRef.current && imageLoaded) {
      const imgEl = imgRef.current.querySelector('img');
      if (imgEl && imgEl.complete) {
        const colorThief = new ColorThief();
        // Use the color thief library to get the color palette
        const palette = colorThief.getPalette(imgEl, 3); // Get the top 3 dominant colors
        setColors({
          bgColor: `rgb(${palette[0].join(',')})`,
          topTextColor: `rgb(${palette[1].join(',')})`,
          bottomTextColor: `rgb(${palette[2].join(',')})`
        });
      }
    }
  };

  useEffect(() => {
    prepareNextCombination();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (imageLoaded) {
      updateColors();
    }
  }, [imageLoaded]);

  const goToNextPage = () => {
    setImageLoaded(false); // Reset image loaded state
    setCurrentCombination(nextCombination);
    prepareNextCombination();
  };

  // Helper function to capitalize the first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

  return (
    <div onClick={goToNextPage} className="flex flex-col h-screen justify-between items-center pl-5 pr-5 pt-5 pb-20 bg-cover" style={{ backgroundColor: colors.bgColor }}>
<h1 className="text-2xl font-bold self-start" style={{ color: colors.topTextColor }}>
  {capitalizeFirstLetter(currentCombination.color)} {capitalizeFirstLetter(currentCombination.animal)}, {capitalizeFirstLetter(currentCombination.color)} {capitalizeFirstLetter(currentCombination.animal)}, <br/>What do you see?
</h1>

      {/* Image container - flex-grow to take available space, max-w and max-h to prevent overflow */}
      <div className="flex-grow w-full flex items-center justify-center p-2">
        <div className="relative w-full h-3/4" ref={imgRef}>
          <Image
            src={`https://raw.githubusercontent.com/KartikC/perpetual-purple-pandas/main/public/animals/${currentCombination.color.toLowerCase()}%20${currentCombination.animal.toLowerCase()}.png`} 
            alt={`${currentCombination.color} ${currentCombination.animal}`}
            layout="fill" // Use 'fill' layout for responsive image size
            objectFit="contain" // Contain the image within the element
            priority={true}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      </div>

      {nextCombination.color && nextCombination.animal && (
        <p className="text-2xl font-light self-end" style={{ color: colors.bottomTextColor }}>
          I see a {nextCombination.color} {nextCombination.animal} looking at me.
        </p>
      )}
    </div>
  );

  
}