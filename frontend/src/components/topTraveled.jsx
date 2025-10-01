import React, { useState, useEffect, useRef } from 'react';

const TopTraveled = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const scrollContainerRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);

  // Detect screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const allImages = [
    '/gallery/bus1.jpg',
    '/gallery/bus2.jpg',
    '/gallery/bus3.jpg',
    '/gallery/bus4.jpg',
    '/gallery/bus5.jpg',
    '/gallery/bus6.jpg',
    '/gallery/bus7.jpg',
    '/gallery/bus8.jpg',
    '/gallery/bus9.jpg',
    '/gallery/bus10.jpg',
    '/gallery/bus11.jpg',
    '/gallery/intercity1.jpg',
    '/gallery/intercity2.jpg',
    '/gallery/intercity3.jpg',
    '/gallery/intercity4.jpg',
    '/gallery/intercity5.jpg',
    '/gallery/intercity6.jpg',
    '/gallery/art.jpg',
    '/gallery/mwanawasa.jpg',
    '/gallery/rail.jpg',
    '/gallery/sun1.jpg',
    '/gallery/victoria.jpg',
    '/gallery/savana.jpg',
  ];

  // Create an infinite loop by tripling the images
  const displayImages = [...allImages, ...allImages, ...allImages];
  const totalSlides = allImages.length;

  // Start from the middle set
  useEffect(() => {
    setCurrentIndex(totalSlides);
  }, [totalSlides]);

  // Handle infinite loop reset
  useEffect(() => {
    if (currentIndex >= totalSlides * 2) {
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(totalSlides);
        setTimeout(() => setIsTransitioning(true), 50);
      }, 1000);
    } else if (currentIndex <= 0) {
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(totalSlides);
        setTimeout(() => setIsTransitioning(true), 50);
      }, 1000);
    }
  }, [currentIndex, totalSlides]);

  // Auto-scroll functionality
  useEffect(() => {
    if (isAutoScrolling) {
      autoScrollIntervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, 5000);
    }

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [isAutoScrolling]);

  const handleScroll = (direction) => {
    setIsAutoScrolling(false);
    setCurrentIndex((prevIndex) => {
      return direction === 'left' ? prevIndex - 1 : prevIndex + 1;
    });
    setTimeout(() => setIsAutoScrolling(true), 5000);
  };

  const handleDotClick = (index) => {
    setIsAutoScrolling(false);
    setCurrentIndex(totalSlides + index);
    setTimeout(() => setIsAutoScrolling(true), 5000);
  };

  // Calculate which dot should be active (normalized to original array)
  const activeDotIndex = ((currentIndex % totalSlides) + totalSlides) % totalSlides;

  // Adjust transform percentage based on screen size
  // For mobile (100% width slides): move 100% per slide
  // For desktop (50% width slides): move 50% per slide
  const transformPercentage = isMobile ? currentIndex * 100 : currentIndex * 50;

  return (
    <div style={styles.container}>
      <h2 style={{...styles.title, color: 'green'}}>Bus Gallery</h2>
      
      <div style={styles.wrapper}>
        <button 
          style={{...styles.arrow, ...styles.arrowLeft}}
          onClick={() => handleScroll('left')}
          aria-label="Previous image"
        >
          ‹
        </button>

        <div style={styles.imagesContainer} ref={scrollContainerRef}>
          <div 
            style={{
              ...styles.track,
              transform: `translateX(-${transformPercentage}%)`,
              transition: isTransitioning ? 'transform 1s ease-in-out' : 'none'
            }}
          >
            {displayImages.map((image, index) => (
              <div 
                key={`${image}-${index}`} 
                style={{
                  ...styles.slide,
                  minWidth: isMobile ? '100%' : '50%'
                }}
              >
                <img 
                  src={image} 
                  alt={`Bus ${(index % totalSlides) + 1}`}
                  style={styles.image}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x500?text=Image+Not+Found';
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <button 
          style={{...styles.arrow, ...styles.arrowRight}}
          onClick={() => handleScroll('right')}
          aria-label="Next image"
        >
          ›
        </button>
      </div>

      <div style={styles.dotsContainer}>
        {allImages.map((_, index) => (
          <button
            key={index}
            style={{
              ...styles.dot,
              ...(index === activeDotIndex ? styles.dotActive : {})
            }}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      <div style={styles.controls}>
        <button 
          style={styles.toggleButton}
          onClick={() => setIsAutoScrolling(!isAutoScrolling)}
        >
          {isAutoScrolling ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  title: {
    textAlign: 'center',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '30px',
    color: '#333',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'
  },
  wrapper: {
    position: 'relative',
    width: '100%',
    height: '450px',
    overflow: 'hidden',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    backgroundColor: '#ffffff'
  },
  imagesContainer: {
    width: '100%',
    height: '100%',
    position: 'relative'
  },
  track: {
    display: 'flex',
    height: '100%'
  },
  slide: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '15px',
    boxSizing: 'border-box',
    flexShrink: 0
  },
  image: {
    width: '100%',
    height: '100%',
    maxWidth: '600px',
    maxHeight: '400px',
    objectFit: 'contain',
    objectPosition: 'center',
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    border: 'none',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    fontSize: '2rem',
    cursor: 'pointer',
    zIndex: 10,
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  arrowLeft: {
    left: '20px'
  },
  arrowRight: {
    right: '20px'
  },
  dotsContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '20px',
    flexWrap: 'wrap',
    maxHeight: '100px',
    overflowY: 'auto',
    padding: '10px'
  },
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid #666',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    padding: 0,
    flexShrink: 0
  },
  dotActive: {
    background: '#666',
    transform: 'scale(1.3)'
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '20px'
  },
  toggleButton: {
    background: 'rgba(100, 100, 100, 0.9)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '25px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
  }
};

export default TopTraveled;