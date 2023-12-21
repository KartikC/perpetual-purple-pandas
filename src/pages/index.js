import { useState, useEffect, useCallback } from 'react';
import { initialColors, initialAnimals } from './data';
import Image from 'next/image';

export default function Home() {
  // State for the current and next combinations
  const [currentCombination, setCurrentCombination] = useState({ color: 'purple', animal: 'panda' });
  const [nextCombination, setNextCombination] = useState({});
  const [usedAnimals, setUsedAnimals] = useState(['panda']); // Track used animals as an array
  const [bgColor, setBgColor] = useState('white'); // Initial bg color set to white

  // Function to shuffle an array
  const shuffleArray = useCallback((array) => {
    const newArray = array.slice();
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]]; // Swap elements
    }
    return newArray;
  }, []);

  // Function to pick a new animal
  const pickNewAnimal = useCallback((animals) => {
    return animals[Math.floor(Math.random() * animals.length)];
  }, []);

  // Function to prepare the next combination
  const prepareNextCombination = useCallback(() => {
    let availableAnimals = initialAnimals.filter(animal => !usedAnimals.includes(animal));

    if (availableAnimals.length === 0) {
      availableAnimals = shuffleArray(initialAnimals);
      setUsedAnimals(['panda']); // Reset used animals but keep 'panda' since it's the initial animal
    }

    const nextAnimal = pickNewAnimal(availableAnimals);
    const nextColor = pickNewAnimal(initialColors);
    setNextCombination({ color: nextColor, animal: nextAnimal });
    // Update the used animals with the new animal
    setUsedAnimals(prevUsedAnimals => [...prevUsedAnimals, nextAnimal]);
  }, [usedAnimals, pickNewAnimal, shuffleArray]);

  // Function to fetch the border color of the current image
  const fetchBorderColor = useCallback(async (animal, color) => {
    if (!animal || !color) {
      console.error('Animal or color is undefined.');
      return;
    }
  
    const imagePath = `/animals/${color.toLowerCase()} ${animal.toLowerCase()}.png`;
    const imageUrl = `${window.location.origin}${imagePath}`;
  
    try {
      const response = await fetch(`/api/get-border-color?imageUrl=${encodeURIComponent(imageUrl)}`);
      const data = await response.json();
      if (response.ok) {
        setBgColor(data.color);
      } else {
        throw new Error(data.error || 'API did not return a valid color.');
      }
    } catch (error) {
      console.error('fetchBorderColor error:', error);
      setBgColor('white');
    }
  }, []);
  
  


  useEffect(() => {
    prepareNextCombination();
    // No need to call fetchBorderColor here, it will be called in the useEffect below
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Call fetchBorderColor when currentCombination changes
    fetchBorderColor(currentCombination.animal, currentCombination.color);
  }, [currentCombination, fetchBorderColor]); // fetchBorderColor should be stable and not change on every render

  const goToNextPage = () => {
    setCurrentCombination(nextCombination);
    prepareNextCombination();
    // No need to call fetchBorderColor here, it will be called in the useEffect above
  };

   // Render the component
   return (
    <div onClick={goToNextPage} className="flex flex-col h-screen justify-between items-center p-4" style={{ backgroundColor: bgColor }}>
      <h1 className="text-xl text-black font-bold pt-8">
        {currentCombination.color} {currentCombination.animal}, {currentCombination.color} {currentCombination.animal}, What do you see?
      </h1>

      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="w-full max-w-sm h-64 flex items-center justify-center relative">
          <Image
            src={`/animals/${currentCombination.color.toLowerCase()} ${currentCombination.animal.toLowerCase()}.png`}
            alt={`${currentCombination.color} ${currentCombination.animal}`}
            width={500}
            height={320}
          />
        </div>
      </div>

      {nextCombination.color && nextCombination.animal && (
        <p className="text-xl text-black font-light pb-8">
          I see a {nextCombination.color} {nextCombination.animal} looking at me.
        </p>
      )}
    </div>
  );
}