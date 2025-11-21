import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { initialColors, initialAnimals } from "../constants/data";
import Image from "next/image";
import { useColorExtraction } from "../hooks/useColorExtraction";
import { useImagePreloader } from "../hooks/useImagePreloader";

// Memoized utility functions outside component to prevent recreations
const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const shuffleArray = (array) => {
  const newArray = array.slice();
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const pickRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

import KoFiWidget from "../components/KoFiWidget";

export default function Home() {
  // State management
  const [currentCombination, setCurrentCombination] = useState({
    color: "purple",
    animal: "panda",
  });
  const [nextCombination, setNextCombination] = useState({});
  const [usedAnimals, setUsedAnimals] = useState(["panda"]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [nextColors, setNextColors] = useState(null);
  const [kofiLoaded, setKofiLoaded] = useState(false);

  // Custom hooks
  const {
    colors,
    extractColors,
    preloadColors,
    setColors,
    cleanup: cleanupColors
  } = useColorExtraction();

  const {
    preloadImage,
    getImageUrl,
    isImageCached
  } = useImagePreloader();

  // Refs
  const transitionTimeoutRef = useRef(null);
  const preloadTimeoutRef = useRef(null);

  // Memoized values
  const currentImageUrl = useMemo(() =>
    getImageUrl(currentCombination.color, currentCombination.animal),
    [currentCombination, getImageUrl]
  );

  const nextImageUrl = useMemo(() =>
    nextCombination.color && nextCombination.animal
      ? getImageUrl(nextCombination.color, nextCombination.animal)
      : null,
    [nextCombination, getImageUrl]
  );

  // Generate next combination
  const generateNextCombination = useCallback(() => {
    let availableAnimals = initialAnimals.filter(
      (animal) => !usedAnimals.includes(animal)
    );

    if (availableAnimals.length === 0) {
      availableAnimals = shuffleArray(initialAnimals);
      setUsedAnimals([currentCombination.animal]);
    }

    const nextAnimal = pickRandomItem(availableAnimals);
    const nextColor = pickRandomItem(initialColors);

    const newCombination = { color: nextColor, animal: nextAnimal };
    setNextCombination(newCombination);
    setUsedAnimals((prev) => [...prev, nextAnimal]);

    return newCombination;
  }, [usedAnimals, currentCombination.animal]);

  // Preload next image and colors
  const preloadNext = useCallback(async (combination) => {
    if (!combination.color || !combination.animal) return;

    const imageUrl = getImageUrl(combination.color, combination.animal);

    try {
      // Preload image with high priority
      await preloadImage(imageUrl, 'high');

      // Preload colors
      const preloadedColors = await preloadColors(imageUrl);
      setNextColors(preloadedColors);
    } catch (error) {
      console.warn('Failed to preload next combination:', error);
    }
  }, [getImageUrl, preloadImage, preloadColors]);

  // Smooth transition to next combination
  const goToNextPage = useCallback(() => {
    if (transitioning || loading) return;

    setTransitioning(true);

    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = setTimeout(async () => {
      // Update combination
      setCurrentCombination(nextCombination);

      // Apply preloaded colors or extract new ones
      const newCurrentImageUrl = getImageUrl(nextCombination.color, nextCombination.animal);

      if (nextColors) {
        // Use preloaded colors immediately for smooth transition
        setColors(nextColors);
      } else {
        // Fallback: extract colors if not preloaded
        await extractColors(newCurrentImageUrl);
      }

      // Reset nextColors since we've used them
      setNextColors(null);

      // Generate and preload next combination
      const newNext = generateNextCombination();

      // Preload the next one after a short delay
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
      preloadTimeoutRef.current = setTimeout(() => {
        preloadNext(newNext);
      }, 100);

      // End transition
      setTimeout(() => {
        setTransitioning(false);
      }, 200);
    }, 300);
  }, [
    transitioning,
    loading,
    nextColors,
    nextCombination,
    generateNextCombination,
    preloadNext,
    setColors,
    getImageUrl,
    extractColors
  ]);

  // Initialize Ko-fi widget
  // Removed manual script injection in favor of KoFiWidget component

  // Initial setup

  // Initial setup
  useEffect(() => {
    const initialize = async () => {
      // Generate next combination
      const next = generateNextCombination();

      // Extract colors from current image
      await extractColors(currentImageUrl);
      setLoading(false);

      // Preload next combination
      setTimeout(() => {
        preloadNext(next);
      }, 500);
    };

    initialize();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupColors();
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, [cleanupColors]);

  // Handle image load
  const handleImageLoad = useCallback(() => {
    if (loading) {
      setLoading(false);
    }
  }, [loading]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space' || event.key === 'Enter') {
        event.preventDefault();
        goToNextPage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNextPage]);

  return (
    <div
      onClick={goToNextPage}
      className="min-h-screen flex flex-col cursor-pointer no-select smooth-bg-transition overflow-hidden"
      style={{ backgroundColor: colors.bgColor }}
      role="button"
      tabIndex={0}
      aria-label="Click or press space to see next animal combination"
    >
      {/* Header */}
      <header className="flex-none p-4 md:p-8 flex justify-center items-center z-10">
        <h1
          className="text-3xl md:text-5xl lg:text-6xl font-bold text-center leading-tight smooth-text-transition loading-fade enhanced-text max-w-4xl mx-auto"
          style={{
            color: colors.topTextColor,
            opacity: transitioning ? 0.7 : 1,
          }}
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
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative w-full overflow-hidden">
        <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {!loading && (
            <Image
              src={currentImageUrl}
              alt={`${currentCombination.color} ${currentCombination.animal}`}
              fill
              style={{
                objectFit: 'contain',
                padding: '20px',
              }}
              className={`smooth-image-transition optimized-image ${transitioning ? 'opacity-70' : 'opacity-100'
                }`}
              priority={true}
              onLoad={handleImageLoad}
              quality={85}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
          )}

          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-xl" style={{ color: colors.topTextColor }}>
                Loading...
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-none p-6 md:p-10 flex justify-center items-center z-10">
        <p
          className="text-xl md:text-3xl font-bold text-center smooth-text-transition loading-fade enhanced-text max-w-3xl mx-auto"
          style={{
            color: colors.bottomTextColor,
            opacity: transitioning ? 0.7 : 1,
          }}
        >
          {!loading && nextCombination.color && nextCombination.animal && (
            <>I see a {nextCombination.color} {nextCombination.animal} looking at me.</>
          )}
        </p>
      </footer>

      <KoFiWidget />
    </div>
  );
}
