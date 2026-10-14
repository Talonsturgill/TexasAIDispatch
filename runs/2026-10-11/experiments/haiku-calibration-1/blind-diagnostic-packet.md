# Blind code-review packet (read only)

Task: you are reviewing a caption layout preflight gate for a Remotion video renderer. The gate
should refuse any caption layout that the renderer would draw outside its allowed caption area
or with a different layout than the gate validated. Report ONLY real defects you can prove from the
code below. For each: the file and line, the exact input that triggers it, what the gate approves, and
what the renderer actually does. If a path is sound, say it is sound. Do not propose fixes. Do not
edit anything. Reply in JSON: {"findings":[{"file":..,"line":..,"trigger":..,"gate_says":..,"render_does":..}],"sound_paths":[..]}

Facts you may rely on: cues come from captions.json. A cue may carry an optional integer `max_lines`
of 2 or 3, default 2. Templates are chosen in Dispatch.tsx: template `alloy-loop-v1` renders through
AlloyLoopEpisode, every other template renders captions through SubtitleTrack. The preflight gate
runs once for the board whatever template it uses.

## video-engine/tests/caption_board_fit.mjs (lines 18-47)
18:   const {captionLayout, captionBandHeight, creditLayout, widthOf, CAPTION_TEXT_WIDTH, SAFE_RIGHT, SAFE_BOTTOM} = createRequire(import.meta.url)(outfile);
19:   const width = CAPTION_TEXT_WIDTH;
20:   // A cue may hold three lines only when captions.json declares max_lines 3 on it, the
21:   // renderer's own layout then gives at least 40, every line fits the safe width and the
22:   // band is never taller than three lines at the top size. Every other cue keeps two lines.
23:   const THIRD_LINE_MIN = 40;
24:   const tallest = captionBandHeight({lines: ['', '', ''], size: 44});
25:   const verdict = (cue, fit) => {
26:     const declared = cue.max_lines === undefined ? 2 : cue.max_lines;
27:     if (declared !== 2 && declared !== 3) return `caption ${cue.id} declares max_lines ${JSON.stringify(cue.max_lines)}; only 2 or 3 is allowed`;
28:     if (fit.lines.join(' ') !== cue.text.trim().replace(/\s+/g, ' ')) return `caption ${cue.id} would drop or alter spoken words`;
29:     if (fit.lines.some((line) => widthOf(line, fit.size, true) > width)) return `caption ${cue.id} has a line wider than the safe caption width`;
30:     if (fit.lines.length > 2) {
31:       if (declared !== 3) return `caption ${cue.id} takes ${fit.lines.length} lines without declaring max_lines 3`;
32:       if (fit.lines.length > 3) return `caption ${cue.id} takes ${fit.lines.length} lines; three is the most a declared cue may take`;
33:       if (fit.size < THIRD_LINE_MIN) return `caption ${cue.id} takes three lines at ${fit.size}, under ${THIRD_LINE_MIN}`;
34:     } else if (fit.size < 29) {
35:       return `caption ${cue.id} would exceed the lower two-line band`;
36:     }
37:     const top = SAFE_BOTTOM - captionBandHeight(fit);
38:     if (top < SAFE_BOTTOM - tallest - 1e-6) return `caption ${cue.id} band rises above the three-line caption seat`;
39:     return null;
40:   };
41:   const layoutOf = (cue) => captionLayout(cue.text, width, cue.max_lines === 3 ? 3 : 2);
42:   const check = (cue) => {
43:     if (typeof cue.text !== "string" || !cue.text.trim()) throw new Error("caption text is missing");
44:     let fit;
45:     try { fit = layoutOf(cue); } catch (e) { throw new Error(`caption ${cue.id} would exceed the lower two-line band`); }
46:     const problem = verdict(cue, fit);
47:     if (problem) throw new Error(problem);

## video-engine/src/lib/DispatchOverlays.tsx (lines 21-47)
21:   const f = useCurrentFrame();
22:   const t = f / fps;
23:   const layouts = React.useMemo(() => cues.map((cue) => capFit(cue.text, cue.max_lines)), [cues]);
24:   const index = cues.findIndex((cue) => t >= cue.start && t < cue.end);
25:   if (index < 0) return null;
26:   const cue = cues[index];
27:   const {lines, size} = layouts[index];
28:   const lead = size * 1.23;
29:   const h = captionBandHeight({lines, size});
30:   const settle = interpolate((t - cue.start) * fps, [0, 6], [-6, 0],
31:     {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
32:   // The whole measured cue is visible from its first frame. No simulated word clock,
33:   // typewriter reveal, or fade that steals reading time from its measured boundaries.
34:   return (
35:     <div aria-label="Narration captions" style={{position: 'absolute', left: CAP_X,
36:       top: SAFE_BOTTOM - h + settle, width: SAFE_RIGHT - CAP_X, height: h,
37:       background:'rgba(8,11,18,.91)',borderLeft:'4px solid #e0956a',borderRadius:5}}>
38:       {lines.map((line, i) => (
39:         <div key={i} style={{position: 'absolute', left: CAP_PAD_L, top: 9 + i * lead,
40:           width: 'max-content', maxWidth: CAP_W,
41:           fontFamily: FONT.body, fontSize: size, fontWeight: 700,
42:           lineHeight: `${lead - 3}px`, whiteSpace: 'pre',
43:           color: '#f2ede2'}}>{line}</div>
44:       ))}
45:     </div>
46:   );
47: };

## video-engine/src/lib/editorial.ts (lines 13-14)
13: export const captionBandHeight = (fit: {lines: string[]; size: number}): number =>
14:   fit.lines.length * (fit.size * 1.23) + 20;

## video-engine/src/Dispatch.tsx (lines 560-566)
560:       credits_s={credits_s} mode="pavement-inspection" />;
561:   }
562:   if (cinematic_template === 'alloy-loop-v1') {
563:     return <AlloyLoopEpisode scenes={scenes} captions={captions} credits={credits}
564:       credits_s={credits_s} />;
565:   }
566:   if (cinematic_template === 'irrigation-judgment-v1') {

## video-engine/src/AlloyLoopEpisode.tsx (lines 150-163)
150: const Captions: React.FC<{cues: Cue[]; t: number}> = ({cues, t}) => {
151:   const cue = cues.find((c) => t >= c.start && t < c.end);
152:   if (!cue) return null;
153:   const lines = wrapToWidth(cue.text, 850, 34).slice(0, 3);
154:   return (
155:     <g>
156:       <rect x="54" y={1670 - (lines.length - 1) * 40} width="900"
157:         height={92 + (lines.length - 1) * 40} rx="18" fill="#061019" opacity="0.92" />
158:       {lines.map((line, i) => <text key={line + i} x="88" y={1728 - (lines.length - 1) * 20 + i * 42}
159:         fontFamily={FONT.body} fontSize="34" fontWeight="650" fill="#fff7e7">{line}</text>)}
160:     </g>
161:   );
162: };
163: 
