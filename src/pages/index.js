import { useState, useEffect, useCallback, useRef } from "react";
import { initialColors, initialAnimals } from "../constants/data";
import Image from "next/image";
import ColorThief from "colorthief";

export default function Home() {
  const [currentCombination, setCurrentCombination] = useState({
    color: "purple",
    animal: "panda",
  });
  const [nextCombination, setNextCombination] = useState({});
  const [usedAnimals, setUsedAnimals] = useState(["panda"]);
  const [colors, setColors] = useState({
    bgColor: "white",
    topTextColor: "black",
    bottomTextColor: "grey",
  });
  const [loading, setLoading] = useState(true); // Set initial loading to true

  const imgRef = useRef(null);

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
    let availableAnimals = initialAnimals.filter(
      (animal) => !usedAnimals.includes(animal)
    );
    if (availableAnimals.length === 0) {
      availableAnimals = shuffleArray(initialAnimals);
      setUsedAnimals(["panda"]);
    }
    const nextAnimal = pickNewAnimal(availableAnimals);
    const nextColor = pickNewAnimal(initialColors);

    setNextCombination({ color: nextColor, animal: nextAnimal });
    setUsedAnimals((prevUsedAnimals) => [...prevUsedAnimals, nextAnimal]);
  }, [usedAnimals, pickNewAnimal, shuffleArray]);

  const updateColors = () => {
    if (imgRef.current) {
      const imgEl = imgRef.current.querySelector("img");
      if (imgEl && imgEl.complete) {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(imgEl, 3);
        setColors({
          bgColor: `rgb(${palette[0].join(",")})`,
          topTextColor: `rgb(${palette[1].join(",")})`,
          bottomTextColor: `rgb(${palette[2].join(",")})`,
        });
        setLoading(false); // Update loading state here as well
      }
    }
  };

  useEffect(() => {
    prepareNextCombination();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!loading) {
      updateColors();
    }
  }, [loading]);

  const goToNextPage = () => {
    setCurrentCombination(nextCombination);
    setLoading(true); // Ensure loading is true while preparing the next combination
    prepareNextCombination();
  };

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const handleImageLoad = () => {
    setLoading(false); // Image loaded, set loading to false
  };

  return (
    <div
      onClick={goToNextPage}
      className="flex flex-col h-screen justify-between items-center pl-5 pr-5 pt-5 pb-20 bg-cover"
      style={{ backgroundColor: colors.bgColor }}
    >
      <h1
        className="text-2xl font-bold self-start"
        style={{ color: colors.topTextColor }}
      >
        {!loading && (
          <>
            {capitalizeFirstLetter(currentCombination.color)}{" "}
            {capitalizeFirstLetter(currentCombination.animal)},{" "}
            {capitalizeFirstLetter(currentCombination.color)}{" "}
            {capitalizeFirstLetter(currentCombination.animal)}, What do you see?
          </>
        )}
      </h1>

      <div className="flex-grow w-full flex items-center justify-center p-2">
        <div className="relative w-full h-3/4" ref={imgRef}>
          <Image
            src={`https://raw.githubusercontent.com/KartikC/perpetual-purple-pandas/main/public/animals/${currentCombination.color.toLowerCase()}%20${currentCombination.animal.toLowerCase()}.png`}
            alt={`${currentCombination.color} ${currentCombination.animal}`}
            layout="fill"
            objectFit="contain"
            priority={true}
            onLoad={handleImageLoad}
          />
        </div>
      </div>

      {!loading && nextCombination.color && nextCombination.animal && (
        <p
          className="text-xl font-light self-end pb-10"
          style={{ color: colors.bottomTextColor }}
        >
          I see a {nextCombination.color} {nextCombination.animal} looking at
          me.
        </p>
      )}
    </div>
  );
}
