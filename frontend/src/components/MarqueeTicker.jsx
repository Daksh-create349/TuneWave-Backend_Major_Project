import React from 'react';

export default function MarqueeTicker({ theme = 'lime' }) {
  const items = [
    'Lossless High-Fidelity Audio',
    'Curated Artist Vault',
    'Real-Time Synchronized Listening',
    'Spatial Stereo Sound',
    'Studio Quality Streaming'
  ];

  return (
    <div className={`marquee-strip strip-${theme}`}>
      <div className="animate-marquee">
        {items.concat(items).map((item, index) => (
          <span key={index} className="marquee-item">
            <span className="marquee-dot">●</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

