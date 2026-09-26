import React from 'react';

/** Generic roof-edge attachment illustration, also staged dimensionally in the episode. */
export const RoofEdgeIllustration: React.FC=()=><g>
 <path d="M-180 -120H180V0H-180Z" fill="#a2795e"/>
 {Array.from({length:5},(_,r)=><path key={r} d={`M-180 ${-110+r*24}H180`} stroke="#ccb491" strokeWidth="3"/>)}
 <path d="M-180 -200H150L180 -135H-180Z" fill="#3c5b55"/>
 <path d="M-180 -143H185V-116L194 -109L190 -101L175 -108V-131H-180Z" fill="#cad5c8"/>
 <path d="M-8 -250H8V-115H-8Z" fill="#778f80"/>
 <path d="M-28 -250H28V-236H-28Z" fill="#cbd5c4"/>
 <path d="M-5 -300H5V-250H-5Z" fill="#9fae9f"/>
 <rect x="-23" y="-390" width="46" height="90" rx="10" fill="#cb8a47"/>
</g>;


export const RoofBackdrop: React.FC=()=><g><rect x="-500" y="-500" width="1000" height="1000" fill="#17323d"/></g>;
export const RoofSubstrate: React.FC=()=><g>
 <rect x="-220" y="-50" width="440" height="110" fill="#94765d"/>
 <path d="M-220 -50H220" stroke="#425c53" strokeWidth="12"/>
 {[-130,-45,45,130].map(x=><path key={x} d={`M${x} -42V58`} stroke="#b79772" strokeWidth="3"/>)}
</g>;
export const RoofDriver: React.FC=()=><g>
 <path d="M-5 -110H5V20H-5Z" fill="#9fada0"/>
 <rect x="-24" y="-240" width="48" height="132" rx="12" fill="#cf8d48"/>
 <path d="M20 -210H130V-155H20Z" fill="#b58769"/>
 {[0,1,2,3].map(i=><path key={i} d={`M25 ${-209+i*15}Q-35 ${-217+i*15} -15 ${-192+i*15}`} fill="none" stroke="#bd9071" strokeWidth="11" strokeLinecap="round"/>)}
 <rect x="94" y="-211" width="130" height="57" rx="8" fill="#477080"/>
</g>;
