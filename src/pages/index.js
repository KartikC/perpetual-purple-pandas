import { useState, useEffect, useCallback } from 'react';
import { initialColors, initialAnimals } from './data';

export default function Home() {
  // const initialColors = ['red', 'green', 'blue', 'yellow', 'pink', 'purple'];
  // const initialAnimals = ['panda', 'bear', 'cat', 'dog', 'elephant', 'frog'];

  // State for the current and next combinations
  const [currentCombination, setCurrentCombination] = useState({ color: 'purple', animal: 'panda' });
  const [nextCombination, setNextCombination] = useState({});
  const [usedAnimals, setUsedAnimals] = useState(['panda']); // Track used animals as an array

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
  }, [usedAnimals, initialAnimals, initialColors, pickNewAnimal, shuffleArray]);

  // Initialize the next combination on component mount
  useEffect(() => {
    prepareNextCombination();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this effect only runs once after initial render

  // Function to handle page turn
  const goToNextPage = () => {
    setCurrentCombination(nextCombination);
    prepareNextCombination();
  };

  // Render the component
  return (
    <div onClick={goToNextPage} className="flex flex-col h-screen justify-between items-center p-4 bg-white text-black">
      <h1 className="text-xl font-bold pt-8">
        {currentCombination.color} {currentCombination.animal}, What do you see?
      </h1>
      
      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="w-full max-w-sm h-64 bg-gray-200 flex items-center justify-center">
          <div className="text-5xl text-gray-500">{currentCombination.animal}</div>
        </div>
      </div>
      
      {/* Check that nextCombination is not an empty object before rendering */}
      {nextCombination.color && nextCombination.animal && (
        <p className="text-xl font-light pb-8">
          I see a {nextCombination.color} {nextCombination.animal} looking at me.
        </p>
      )}
    </div>
  );
}
