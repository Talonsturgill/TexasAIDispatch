import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {FilmRenderProps} from '../../../modern/types';
import {Figure, castV2} from '../../../look/Figure';
import {lookActive} from '../../../look/tokens';

/**
 * look-v2-regions (written November 13th, 2026): the reference sheet for the ten v2 regions. Point a
 * board's scenes at any region and this episode stands one person in it, so the region, its horizon
 * and a grounded figure can be checked together. Under the old look it draws nothing, so the same
 * board renders the baked plate for the before. Not an edition.
 */
export const RegionsGallery: React.FC<FilmRenderProps> = ({board}) => {
  const frame = useCurrentFrame();
  if (!lookActive(board as never)) return null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
      <Figure frame={frame} x={330} y={1720} scale={1.25} {...castV2('rancher')} pose="wave" emotion="happy" turn={0.4} seed={5} />
    </svg>
  );
};
