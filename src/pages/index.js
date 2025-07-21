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

    // Immediately apply preloaded colors if available
    if (nextColors) {
      setColors(nextColors);
    }

    transitionTimeoutRef.current = setTimeout(() => {
      // Update combination
      setCurrentCombination(nextCombination);
      
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
    setColors
  ]);

  // Initialize Ko-fi widget
  useEffect(() => {
    if (kofiLoaded) return;

    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.async = true;
    script.onload = () => {
      if (typeof kofiWidgetOverlay !== 'undefined') {
        kofiWidgetOverlay.draw("sathaxe", {
          type: "floating-chat",
          "floating-chat.donateButton.text": "Tip Me",
          "floating-chat.donateButton.background-color": "#323842",
          "floating-chat.donateButton.text-color": "#fff",
        });
        setKofiLoaded(true);
      }
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [kofiLoaded]);

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
      className="flex flex-col h-screen cursor-pointer no-select smooth-bg-transition"
      style={{ backgroundColor: colors.bgColor }}
      role="button"
      tabIndex={0}
      aria-label="Click or press space to see next animal combination"
    >
      {/* Header */}
      <header className="h-16 pl-5 pr-5 pt-5">
        <h1
          className="text-2xl font-bold fixed-height-text smooth-text-transition loading-fade"
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
      <main className="flex-1 flex items-center justify-center p-2" style={{ minHeight: '60vh' }}>
        <div className="relative w-full h-full" style={{ maxHeight: '70vh' }}>
          {!loading && (
            <Image
              src={currentImageUrl}
              alt={`${currentCombination.color} ${currentCombination.animal}`}
              fill
              style={{
                objectFit: 'contain',
              }}
              className={`smooth-image-transition optimized-image ${
                transitioning ? 'opacity-70' : 'opacity-100'
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
      <footer className="h-24 pl-5 pr-5 pb-10 flex justify-end">
        <p
          className="w-1/2 text-l font-bold fixed-height-paragraph smooth-text-transition loading-fade"
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
    </div>
  );
}
