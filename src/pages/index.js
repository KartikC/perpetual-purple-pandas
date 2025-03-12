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
  const [transitioning, setTransitioning] = useState(false); // Add transitioning state for smooth transitions
  
  const imgRef = useRef(null);
  const preloadImageRef = useRef(null); // Add preload image ref to preload next image

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
      if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
        try {
          const colorThief = new ColorThief();
          // Try to get a palette, but handle potential errors
          const palette = colorThief.getPalette(imgEl, 3) || [
            [200, 200, 200], // Default light gray for background
            [50, 50, 50],   // Default dark gray for text
            [100, 100, 100]  // Default medium gray for bottom text
          ];
          
          setColors({
            bgColor: `rgb(${palette[0].join(",")})`,
            topTextColor: `rgb(${palette[1].join(",")})`,
            bottomTextColor: `rgb(${palette[2].join(",")})`,
          });
        } catch (error) {
          console.error("Error extracting colors:", error);
          // Set fallback colors if ColorThief fails
          setColors({
            bgColor: "rgb(240, 240, 240)",
            topTextColor: "rgb(50, 50, 50)",
            bottomTextColor: "rgb(100, 100, 100)",
          });
        }
        setLoading(false);
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
  
  // State for preloaded colors
  const [preloadedColors, setPreloadedColors] = useState({
    bgColor: 'white',
    topTextColor: 'black',
    bottomTextColor: 'grey',
  });

  // Preload the next image and extract colors when nextCombination changes
  useEffect(() => {
    if (nextCombination.color && nextCombination.animal && typeof window !== 'undefined') {
      const preloadImg = new window.Image(); // Use window.Image to avoid conflict with Next.js Image component
      
      // When the preloaded image loads, extract its colors
      preloadImg.onload = () => {
        try {
          // Create a temporary canvas to draw the image for ColorThief
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = preloadImg.width;
          canvas.height = preloadImg.height;
          ctx.drawImage(preloadImg, 0, 0);
          
          // Extract colors using ColorThief
          const colorThief = new ColorThief();
          const palette = colorThief.getPalette(preloadImg, 3) || [
            [200, 200, 200], // Default light gray for background
            [50, 50, 50],   // Default dark gray for text
            [100, 100, 100]  // Default medium gray for bottom text
          ];
          
          // Store the preloaded colors
          setPreloadedColors({
            bgColor: `rgb(${palette[0].join(",")})`,
            topTextColor: `rgb(${palette[1].join(",")})`,
            bottomTextColor: `rgb(${palette[2].join(",")})`,
          });
        } catch (error) {
          console.error("Error preloading colors:", error);
          // Use fallback colors if extraction fails
          setPreloadedColors({
            bgColor: "rgb(240, 240, 240)",
            topTextColor: "rgb(50, 50, 50)",
            bottomTextColor: "rgb(100, 100, 100)",
          });
        }
      };
      
      // Set the source to start loading
      preloadImg.crossOrigin = "Anonymous"; // Enable CORS for the image
      preloadImg.src = `https://raw.githubusercontent.com/KartikC/perpetual-purple-pandas/main/public/animals/${nextCombination.color.toLowerCase()}%20${nextCombination.animal.toLowerCase()}.png`;
      preloadImageRef.current = preloadImg;
    }
  }, [nextCombination]);

  useEffect(() => {
    // Load Ko-fi script and initialize the widget
    const scriptId = "ko-fi-script";

    if (document.getElementById(scriptId)) {
      // Script already loaded
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.async = true;
    script.onload = () => {
      kofiWidgetOverlay.draw("sathaxe", {
        type: "floating-chat",
        "floating-chat.donateButton.text": "Tip Me",
        "floating-chat.donateButton.background-color": "#323842",
        "floating-chat.donateButton.text-color": "#fff",
      });
    };

    document.body.appendChild(script);
  }, []);

  const goToNextPage = () => {
    if (transitioning) return; // Prevent multiple clicks during transition
    
    setTransitioning(true);
    
    // Apply preloaded colors immediately for smoother transition
    setColors(preloadedColors);
    
    // Use a simple fade transition
    setTimeout(() => {
      setCurrentCombination(nextCombination);
      // No need to set loading to true since we already have the colors
      // Just prepare the next combination for the next transition
      prepareNextCombination();
      
      // End transition after a short delay
      setTimeout(() => {
        setTransitioning(false);
      }, 400);
    }, 400);
  };

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const handleImageLoad = () => {
    // Only needed for the initial load now
    // For subsequent loads, we're using preloaded colors
    if (loading) {
      updateColors(); // Update colors for initial load
      setLoading(false);
    }
  };

  return (
    <div
      onClick={goToNextPage}
      className="flex flex-col h-screen bg-cover cursor-pointer"
      style={{ 
        backgroundColor: colors.bgColor,
        transition: 'background-color 0.5s ease-in-out'
      }}
    >
      {/* Fixed height header area */}
      <div className="h-16 pl-5 pr-5 pt-5">
        <h1
          className="text-2xl font-bold"
          style={{ 
            color: colors.topTextColor,
            opacity: transitioning ? 0 : 1,
            transition: 'opacity 0.4s ease-in-out, color 0.4s ease-in-out',
            height: '1.5em', /* Fixed height to prevent layout shifts */
            display: 'block'
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
      </div>

      {/* Fixed height for image container */}
      <div className="flex-1 flex items-center justify-center p-2" style={{ minHeight: '60vh' }}>
        <div className="relative w-full h-full" ref={imgRef} style={{ maxHeight: '70vh' }}>
          <Image
            src={`https://raw.githubusercontent.com/KartikC/perpetual-purple-pandas/main/public/animals/${currentCombination.color.toLowerCase()}%20${currentCombination.animal.toLowerCase()}.png`}
            alt={`${currentCombination.color} ${currentCombination.animal}`}
            fill
            style={{
              objectFit: 'contain',
              transition: 'opacity 0.4s ease-in-out'
            }}
            priority={true}
            onLoad={handleImageLoad}
            className={transitioning ? 'opacity-70' : 'opacity-100'}
          />
        </div>
      </div>

      {/* Fixed height footer area */}
      <div className="h-24 pl-5 pr-5 pb-10 flex justify-end">
        <p
          className="w-1/2 text-l font-bold"
          style={{ 
            color: colors.bottomTextColor,
            opacity: transitioning ? 0 : 1,
            transition: 'opacity 0.4s ease-in-out, color 0.4s ease-in-out',
            height: '3em', /* Fixed height to prevent layout shifts */
            display: 'block'
          }}
        >
          {!loading && nextCombination.color && nextCombination.animal && (
            <>I see a {nextCombination.color} {nextCombination.animal} looking at me.</>
          )}
        </p>
      </div>
    </div>
  );
}
