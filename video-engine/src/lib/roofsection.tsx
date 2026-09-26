import React from 'react';

/** Generic roof-edge water illustration, also staged dimensionally in the episode. */
export const RoofEdgeIllustration: React.FC=()=><g>
 <path d="M-180 -120H180V0H-180Z" fill="#a2795e"/>
 {Array.from({length:5},(_,r)=><path key={r} d={`M-180 ${-110+r*24}H180`} stroke="#ccb491" strokeWidth="3"/>)}
 <path d="M-180 -200H150L180 -135H-180Z" fill="#3c5b55"/>
 <path d="M-180 -143H185V-116L194 -109L190 -101L175 -108V-131H-180Z" fill="#cad5c8"/>
 <path d="M-75 -195H55L80 -136H-80Z" fill="#64c4ce" opacity=".6"/>
 <path d="M-80 -136H80V-100L100 -20H-55L-80 -100Z" fill="#79d0d8" opacity=".6"/>
</g>;
