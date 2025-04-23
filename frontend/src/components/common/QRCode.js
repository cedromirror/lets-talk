import React from 'react';

/**
 * Simple QR Code component implementation using CSS grid
 * @param {Object} props - Component props
 * @param {string} props.value - The value to encode in the QR code
 * @param {number} props.size - The size of the QR code in pixels
 * @param {string} props.level - The error correction level (not used in this implementation)
 * @param {boolean} props.includeMargin - Whether to include a margin around the QR code
 */
const QRCode = ({ value, size = 200, level = 'H', includeMargin = true }) => {
  // Create a simple QR code-like pattern using divs
  const cellSize = Math.floor(size / 25); // Approximate cell size
  const margin = includeMargin ? cellSize * 2 : 0;
  const totalSize = size + margin * 2;
  
  // Generate a deterministic pattern based on the value string
  const generatePattern = (value) => {
    const pattern = [];
    const hash = Array.from(value).reduce((acc, char) => {
      return (acc * 31 + char.charCodeAt(0)) & 0xFFFFFFFF;
    }, 0);
    
    // Create a 25x25 grid (standard QR code size)
    for (let i = 0; i < 25; i++) {
      const row = [];
      for (let j = 0; j < 25; j++) {
        // Always fill the corner squares (position detection patterns)
        if ((i < 7 && j < 7) || (i < 7 && j > 17) || (i > 17 && j < 7)) {
          // Position detection pattern
          if ((i === 0 || i === 6 || i === 18 || i === 24) ||
              (j === 0 || j === 6 || j === 18 || j === 24) ||
              (i >= 2 && i <= 4 && j >= 2 && j <= 4) ||
              (i >= 2 && i <= 4 && j >= 20 && j <= 22) ||
              (i >= 20 && i <= 22 && j >= 2 && j <= 4)) {
            row.push(1);
          } else {
            row.push(0);
          }
        } else {
          // Use hash to determine if cell should be filled
          const bitPos = i * 25 + j;
          const bit = (hash >> (bitPos % 32)) & 1;
          row.push(bit);
        }
      }
      pattern.push(row);
    }
    return pattern;
  };
  
  const pattern = generatePattern(value);
  
  return (
    <div style={{ 
      width: `${totalSize}px`, 
      height: `${totalSize}px`, 
      backgroundColor: '#fff',
      padding: `${margin}px`,
      boxSizing: 'border-box',
      display: 'inline-block'
    }}>
      <div style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        display: 'grid',
        gridTemplateColumns: `repeat(25, ${cellSize}px)`,
        gridTemplateRows: `repeat(25, ${cellSize}px)`
      }}>
        {pattern.flat().map((cell, index) => (
          <div 
            key={index} 
            style={{ 
              backgroundColor: cell ? '#000' : '#fff',
              width: `${cellSize}px`,
              height: `${cellSize}px`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default QRCode;
