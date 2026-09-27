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

export const EvidenceLoupe: React.FC=()=><g>
 <circle cx="0" cy="-100" r="115" fill="#dce5d4" stroke="#304c4a" strokeWidth="18"/>
 <path d="M-90 -80H70V-10L85 8L67 24L45 0V-58H-90Z" fill="#b8c4ae" stroke="#3e5449" strokeWidth="7"/>
 <path d="M83 -17L200 100" stroke="#304c4a" strokeWidth="30" strokeLinecap="round"/>
</g>;

// Semantic plane equivalents for the dimensional desk and fixed roof cutaway.
export const ReviewWall: React.FC=()=><g><rect x="-500" y="-500" width="1000" height="1000" fill="#8caaa4"/></g>;
export const ReviewDesk: React.FC=()=><g><path d="M-450 -160H450L520 220H-520Z" fill="#586c6a"/><path d="M-520 220H520V255H-520Z" fill="#334f57"/></g>;
export const ReviewHand: React.FC=()=><g fill="#bc8b6b"><ellipse cx="0" cy="0" rx="55" ry="38"/>{[-35,-12,12,35].map(x=><rect key={x} x={x-8} y="-76" width="16" height="70" rx="8"/>)}<rect x="-40" y="20" width="80" height="130" rx="28"/><rect x="-49" y="110" width="98" height="70" rx="18" fill="#477080"/></g>;
export const FixedRoofFlashing: React.FC=()=><g><path d="M-220 -80H185V25L215 57L193 77L157 38V-48H-220Z" fill="#d7ded1" stroke="#52675d" strokeWidth="6"/></g>;
export const RoofFascia: React.FC=()=><g><rect x="-220" y="-20" width="440" height="130" fill="#a99271"/>{[-140,-70,0,70,140].map(x=><path key={x} d={'M'+x+' -20V110'} stroke="#756b56" strokeWidth="4"/>)}</g>;
