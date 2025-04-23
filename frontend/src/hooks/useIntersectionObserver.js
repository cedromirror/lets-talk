import { useRef, useState, useEffect } from 'react';

/**
 * Custom hook for intersection observer
 * @param {Object} options - Intersection observer options
 * @param {number} options.threshold - Threshold for intersection observer
 * @param {boolean} options.triggerOnce - Whether to trigger only once
 * @param {string} options.rootMargin - Root margin for intersection observer
 * @returns {Array} - [ref, isIntersecting] tuple
 */
const useIntersectionObserver = (options = {}) => {
  const { 
    threshold = 0, 
    triggerOnce = false, 
    rootMargin = '0px' 
  } = options;
  
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        
        // If triggerOnce is true and element is intersecting, disconnect observer
        if (triggerOnce && entry.isIntersecting && observerRef.current) {
          observerRef.current.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    // Observe element
    const currentRef = ref.current;
    if (currentRef) {
      observerRef.current.observe(currentRef);
    }

    // Cleanup on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, triggerOnce, rootMargin]);

  return [ref, isIntersecting];
};

export default useIntersectionObserver;
