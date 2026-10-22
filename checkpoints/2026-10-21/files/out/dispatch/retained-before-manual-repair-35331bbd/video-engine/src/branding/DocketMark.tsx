import React from 'react';

/** Native version of Docket's existing scripts/site/mark.py flag, not a new logo.
 * Same 300 by 200 field, one-third hoist and regular, upright faceted Lone Star.
 * Colours come from the sibling's config/brand.yaml. No fetched asset at render time. */
export const DocketMark: React.FC = () => {
  const center = {x: 50, y: 100};
  const radius = 37.5;
  const inner = Math.cos(2 * Math.PI / 5) / Math.cos(Math.PI / 5);
  const points = Array.from({length: 10}, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const r = radius * (i % 2 ? inner : 1);
    return `${center.x + r * Math.cos(angle)},${center.y + r * Math.sin(angle)}`;
  });
  return <svg width={180} height={120} viewBox="0 0 300 200" role="img" aria-label="Texas AI Docket Lone Star flag">
    <path d="M100 0H300V100H100Z" fill="#ffffff"/>
    <path d="M100 100H300V200H100Z" fill="#BF0A30"/>
    <path d="M0 0H100V200H0Z" fill="#00205B"/>
    <polygon points={points.join(' ')} fill="#ffffff"/>
    {Array.from({length: 5}, (_, i) => <polygon key={i}
      points={`50,100 ${points[2 * i]} ${points[(2 * i + 1) % 10]}`} fill="#dce2ea"/>)}
  </svg>;
};
