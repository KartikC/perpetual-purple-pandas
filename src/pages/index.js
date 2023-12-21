import { useState, useEffect, useCallback, useRef } from 'react';
import { initialColors, initialAnimals } from './data';
import Image from 'next/image';
import ColorThief from 'colorthief';

export default function Home() {
  const [currentCombination, setCurrentCombination] = useState({ color: 'purple', animal: 'panda' });
  const [nextCombination, setNextCombination] = useState({});
  const [usedAnimals, setUsedAnimals] = useState(['panda']);
  const [bgColor, setBgColor] = useState('white');

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
    setNextCombination({ color: nextColor, animal: nextAnimal });
    setUsedAnimals(prevUsedAnimals => [...prevUsedAnimals, nextAnimal]);
  }, [usedAnimals, pickNewAnimal, shuffleArray]);

  const updateBgColor = () => {
    if (imgRef.current && imageLoaded) {
      const imgEl = imgRef.current.querySelector('img');
      // Make sure the image is loaded and not tainted by cross-origin restrictions
      if (imgEl && imgEl.complete) {
        try {
          const colorThief = new ColorThief();
          const dominantColor = colorThief.getColor(imgEl);
          setBgColor(`rgb(${dominantColor.join(',')})`);
        } catch (e) {
          console.error('Error extracting color:', e);
        }
      }
    }
  };

  useEffect(() => {
    prepareNextCombination();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (imageLoaded) {
      updateBgColor();
    }
  }, [imageLoaded]);

  const goToNextPage = () => {
    setImageLoaded(false); // Reset image loaded state
    setCurrentCombination(nextCombination);
    prepareNextCombination();
  };

  return (
    <div onClick={goToNextPage} className="flex flex-col h-screen justify-between items-center p-4" style={{ backgroundColor: bgColor }}>
      <h1 className="text-xl text-black font-bold pt-8">
        {currentCombination.color} {currentCombination.animal}, {currentCombination.color} {currentCombination.animal}, What do you see?
      </h1>

      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="w-full max-w-sm h-64 flex items-center justify-center relative" ref={imgRef}>
          <Image
            src={`https://raw.githubusercontent.com/KartikC/perpetual-purple-pandas/main/public/animals/${currentCombination.color.toLowerCase()}%20${currentCombination.animal.toLowerCase()}.png`} 
            alt={`${currentCombination.color} ${currentCombination.animal}`}
            width={500}
            height={320}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      </div>

      {nextCombination.color && nextCombination.animal && (
        <p className="text-xl text-black mb-8">
          Next: {nextCombination.color} {nextCombination.animal} looking at me.
        </p>
      )}
    </div>
  );
}
