# ================================================================ correction 1 (code critic REVISE A-1, B-1 to B-6)
# Every scene performs its events in clause order in BOTH treatments; B diverges by opening, staging,
# framing, camera and which view carries each clause. No station stands in the s1 yard; the close is an
# uninstalled outline at an empty curb or the same map close up, with no flood measurement.
SUBJECTS['n9'] = ['s9-goal', 's9-map']
L.update({
 's1-boots': 'worn rubber rain boots on the porch step, the water reaching their ankles',
 's1-marks': 'design detail of the lowest optical lens at ankle height going under and lighting',
 's1-post': 'chain link fence post with an orange ankle high paint mark in the flooded yard',
 's8-map': 'paper street map of a town pinned to the chain link fence, no pin on it',
 's8-fence': 'chain link fence at the curb where the paper map is pinned',
 's9-map': 'the same paper street map on the fence, no installed pin',
 's9-fence': 'chain link fence at the curb where the same map is pinned',
 's9-goal': 'dashed deployment goal pin that hovers and has not landed',
 's9-station': 'dashed uninstalled outline of the flood station where one could stand at the empty curb',
 's9-spot': 'dashed empty spot under the goal pin where a station could go',
 's9-notown': 'no installation named tag still pinned to the map',
 's9-tag': 'deployment goal tag pinned beside the dashed pin',
})
PLANES = {'a': {}, 'b': {}}
PLANES['a']['s1'] = [(900, 'flooded street and limestone curb across from the yard', ['s1-water']), (700, 'live oak and chain link post with its orange ankle mark', ['s1-post']),
                     (500, 'porch steps and rain boots', ['s1-boots']), (300, 'porch rail and the dark phone', ['s1-phone']),
                     (150, 'phone screen and its late warning banner', ['s1-banner'])]
PLANES['b']['s1'] = [(900, 'design detail of the lens column in brown water', ['s1-marks']), (800, 'flooded street and limestone curb across from the yard', ['s1-water']),
                     (700, 'live oak and chain link post with its orange ankle mark', ['s1-post']), (500, 'porch steps and rain boots', ['s1-boots']),
                     (300, 'porch rail and the dark phone', ['s1-phone']), (150, 'phone screen and its late warning banner', ['s1-banner'])]
for v in 'ab':
    PLANES[v]['s2'] = [(900, 'far cell tower on the horizon', ['s2-tower']), (700, 'flooded street at the curb', ['s2-post']),
                       (500, 'the prototype flood station on its post', ['s2-station']), (300, 'solar panel catching low sun', ['s2-panel']),
                       (150, 'battery bar window on the housing', ['s2-battery'])]
    PLANES[v]['s3'] = [(900, 'post column climbing to the housing', ['s3-stack']), (700, 'four optical marks at four heights', ['s3-marks']),
                       (500, 'weather sensors and lamps on the housing', ['s3-weather']), (300, 'brown water rising at the post', ['s3-water'])]
    PLANES[v]['s4'] = [(900, 'street and the far dark server outline', ['s4-server']), (700, 'station with its housing window glowing', ['s4-station']),
                       (500, 'opened housing and its traces', ['s4-traces']), (300, 'small chip at the board centre', ['s4-chip']),
                       (150, 'amber risk lamp on the board edge', ['s4-risk'])]
    PLANES[v]['s6'] = [(900, 'soft hub window light', ['s6-dashboard']), (700, 'station dots on the screen', ['s6-dots']),
                       (500, 'shaded flood paths', ['s6-paths']), (300, 'dashed higher risk zones', ['s6-zones']),
                       (150, 'responder forearm on the hub desk', ['s6-hand'])]
    PLANES[v]['s7'] = [(900, 'plain wall', ['s7-card2']), (700, 'validation card', ['s7-card']), (500, 'validation bar', ['s7-bar']),
                       (300, 'assessment tag', ['s7-tag']), (150, 'blank field result card', ['s7-blank'])]
    PLANES[v]['s8'] = [(900, 'chain link fence at the curb', ['s8-fence']), (700, 'paper map pinned to the fence', ['s8-map']),
                       (500, 'street grid and creek with no pin', ['s8-nopin']), (300, 'search ring sweeping the map', ['s8-search']),
                       (150, 'tag pinned to the map', ['s8-tag'])]
PLANES['a']['s5'] = [(900, 'open country and the hub building', ['s5-hub']), (700, 'street of bungalows and its corner tag', ['s5-halfmile']),
                     (500, 'radio rings rolling out', ['s5-ring']), (300, 'range tags', ['s5-tags', 's5-fivemile']),
                     (150, 'station antenna in the foreground', ['s5-antenna'])]
PLANES['b']['s5'] = [(900, 'open country and the hub building', ['s5-hub']), (700, 'overhead street map and station dot', ['s5-station-dot']),
                     (500, 'radio rings rolling out', ['s5-ring']), (300, 'street corner half-mile tag', ['s5-halfmile']),
                     (150, 'range tags', ['s5-tags', 's5-fivemile']), (100, 'station antenna at street level', ['s5-antenna'])]
PLANES['a']['s9'] = [(900, 'chain link fence at the empty curb', ['s9-fence']), (800, 'the same paper map on the fence', ['s9-map']),
                     (700, 'no installation named tag still pinned', ['s9-notown']), (500, 'dashed goal pin over the map', ['s9-goal']),
                     (300, 'dashed uninstalled station outline at the curb', ['s9-station']), (150, 'deployment goal tag', ['s9-tag'])]
PLANES['b']['s9'] = [(900, 'chain link fence behind the map', ['s9-fence']), (800, 'the same paper map close up', ['s9-map']),
                     (700, 'no installation named tag still pinned', ['s9-notown']), (500, 'dashed goal pin over the map', ['s9-goal']),
                     (300, 'dashed empty spot under the pin', ['s9-spot']), (150, 'deployment goal tag', ['s9-tag'])]

_W = {  # shared event meanings, in clause order
 's1-event-1': (['s1-water', 's1-post'], 'Brown water tops the limestone curb, spreads across a San Antonio yard with no station in it and climbs a chain link post to its orange ankle mark.', 'linear'),
 's1-event-2': (['s1-phone', 's1-water', 's1-boots'], 'The water keeps rising to the rain boots on the porch step while the phone on the porch rail stays dark.', 'travel'),
 's1-event-3': (['s1-phone', 's1-banner'], 'The flash flood warning banner finally slides onto the phone, after the water is already in the yard.', 'contact'),
 's2-event-1': (['s2-station', 's2-post'], 'The whole prototype flood station is revealed on its post at a curb in shallow water and a prototype tag pins beside its housing.', 'travel'),
 's2-event-2': (['s2-panel', 's2-battery'], 'Low sun reaches the small dark solar panel, a glint crosses its cells and the battery bar fills cell by cell.', 'travel'),
 's2-event-3': (['s2-station', 's2-tower'], 'A dashed line leaves the antenna toward a far cell tower and stops halfway, and a no cell tower needed tag pins.', 'contact'),
 's3-event-1': (['s3-stack', 's3-marks'], 'Four optical lenses at four different heights on the post catch the low light in turn.', 'travel'),
 's3-event-2': (['s3-marks', 's3-water'], 'Brown water rises past the lit first lens and reaches the second, which lights as it goes under.', 'linear'),
 's3-event-3': (['s3-stack', 's3-weather'], 'Rain, temperature, humidity and light lamps come on one by one on the housing, each with its label.', 'smoothstep'),
 's4-event-1': (['s4-traces', 's4-chip'], 'Readings run in along thin traces from the four lenses and four weather sensors to one small chip, which begins to glow.', 'linear'),
 's4-event-2': (['s4-chip', 's4-risk'], 'The chip lights the amber risk lamp on the board and a judged on the station tag pins.', 'contact'),
 's4-event-3': (['s4-server', 's4-station'], 'Far from the station a dashed outline of a central server draws itself and stays dark, with no line running to it.', 'smoothstep'),
 's6-event-1': (['s6-dots', 's6-dashboard'], 'Dots from several stations arrive on the hub dashboard and a tag names the second, larger model.', 'travel'),
 's6-event-2': (['s6-paths', 's6-dashboard'], 'Shaded flood paths spread out from the first dots along the creek and the low streets.', 'smoothstep'),
 's7-event-1': (['s7-bar', 's7-card'], 'The validation bar fills across its card and the university\'s reported figure appears and holds.', 'travel'),
 's7-event-2': (['s7-tag', 's7-card'], 'An initial assessments after training tag pins under the validation card.', 'contact'),
 's7-event-3': (['s7-blank', 's7-card2'], 'The field result card stays blank and a none reported stamp presses onto it.', 'contact'),
 's8-event-1': (['s8-map', 's8-fence'], 'A paper street map pinned to the chain link fence at the curb settles, streets and a creek with no pin on it.', 'contact'),
 's8-event-2': (['s8-search', 's8-nopin'], 'A dashed search ring sweeps the map and finds no installed station.', 'smoothstep'),
 's8-event-3': (['s8-tag', 's8-map'], 'A no installation named tag pins to the map.', 'contact'),
 's9-event-1': (['s9-goal', 's9-map'], 'Over the same map a dashed goal pin hovers and does not land.', 'smoothstep'),
 's9-event-3': (['s9-tag', 's9-goal'], 'A deployment goal tag pins beside the dashed pin.', 'contact'),
}
def _ev(eid, at, d, override=None):
    items, what, curve = _W[eid] if override is None else override
    return (eid, at, d, items, what, curve)
_S5 = {'a': [('s5-event-1', .30, 1.20, ['s5-antenna', 's5-ring'], 'A pulse flashes at the antenna tip and amber radio rings leave it.', 'linear'),
             ('s5-event-2', 2.90, 1.20, ['s5-ring', 's5-halfmile'], 'The rings run down the street of bungalows and pass the half-mile tag on the far corner post.', 'linear'),
             ('s5-event-3', 6.20, 1.20, ['s5-ring', 's5-hub', 's5-fivemile'], 'Across open country the leading ring reaches the hub\'s rooftop mast, its lamp lights as the ring arrives and the five-mile tag pins.', 'contact')],
       'b': [('s5-event-1', .30, 1.20, ['s5-station-dot', 's5-ring'], 'From above, amber rings leave the station dot on the street map, the half-mile and five-mile labels appearing as each circle is reached.', 'linear'),
             ('s5-event-2', 3.40, 1.20, ['s5-ring', 's5-halfmile'], 'At street level the rings run down the street of bungalows and pass the half-mile tag on the far corner post.', 'linear'),
             ('s5-event-3', 6.60, 1.20, ['s5-ring', 's5-hub', 's5-fivemile'], 'Across open country the leading ring reaches the hub\'s rooftop mast, its lamp lights as the ring arrives and the five-mile tag pins.', 'contact')]}
E = {'a': {
 's1': [_ev('s1-event-1', .30, 1.10), _ev('s1-event-2', 2.20, 1.20), _ev('s1-event-3', 4.90, 1.20)],
 's2': [_ev('s2-event-1', .30, 1.10), _ev('s2-event-2', 2.80, 1.10), _ev('s2-event-3', 4.60, 1.20)],
 's3': [_ev('s3-event-1', .30, 1.10), _ev('s3-event-2', 2.25, 1.20), _ev('s3-event-3', 4.25, 1.15)],
 's4': [_ev('s4-event-1', .30, 1.20), _ev('s4-event-2', 3.75, 1.00), _ev('s4-event-3', 5.50, 1.10)],
 's5': _S5['a'],
 's6': [_ev('s6-event-1', .30, 1.20), _ev('s6-event-2', 3.80, 1.20),
        _ev('s6-event-3', 5.60, 1.00, (['s6-zones', 's6-dashboard'], 'Higher-risk zones outline themselves in dashed amber and a for emergency responders tag pins.', 'contact'))],
 's7': [_ev('s7-event-1', .80, 1.20), _ev('s7-event-2', 3.50, 1.00), _ev('s7-event-3', 6.00, .90)],
 's8': [_ev('s8-event-1', .35, .70), _ev('s8-event-2', 1.10, .80), _ev('s8-event-3', 2.00, .80)],
 's9': [_ev('s9-event-1', .30, .60), _ev('s9-event-2', .95, .70, (['s9-station'], 'At the empty curb a dashed outline of the station draws itself where one could stand, uninstalled.', 'travel')),
        _ev('s9-event-3', 1.70, .65)],
}, 'b': {
 's1': [('s1-event-0', .30, 1.05, ['s1-water', 's1-post', 's1-marks'], 'A disclosed design detail with no yard around it: brown water climbs over the lowest optical lens at ankle height and the lens lights as it goes under.', 'linear'),
        _ev('s1-event-1', 2.80, 1.20, (['s1-water', 's1-post'], 'On the same ankle height the picture cuts to a San Antonio yard with no station in it, the water spreading past the orange ankle mark on a chain link post as the view pulls back.', 'travel')),
        _ev('s1-event-2', 4.20, .80), _ev('s1-event-3', 5.60, 1.20)],
 's2': [_ev('s2-event-1', .30, 1.10, (['s2-station', 's2-post'], 'The view cranes down from the antenna tip and reveals the whole prototype flood station at a curb, and a prototype tag pins.', 'travel')),
        _ev('s2-event-2', 3.50, 1.00), _ev('s2-event-3', 4.80, 1.00)],
 's3': [_ev('s3-event-1', .30, 1.00), _ev('s3-event-2', 2.10, .85), _ev('s3-event-3', 4.30, 1.10)],
 's4': [_ev('s4-event-1', .30, 1.20, (['s4-traces', 's4-chip', 's4-station'], 'Seen from the street through the housing window, readings run along the thin traces to the small chip.', 'linear')),
        _ev('s4-event-2', 3.75, 1.00), _ev('s4-event-3', 5.50, 1.10)],
 's5': _S5['b'],
 's6': [_ev('s6-event-1', .30, 1.20, (['s6-dots', 's6-dashboard'], 'On the hub\'s screen, dots from several stations arrive and a tag names the second, larger model.', 'travel')),
        _ev('s6-event-2', 2.95, .60),
        _ev('s6-event-3', 5.60, 1.00, (['s6-zones', 's6-hand'], 'At the desk the dashed higher-risk outlines settle on the screen, a responder\'s sleeved forearm comes to rest beside it and a for emergency responders tag pins.', 'contact'))],
 's7': [_ev('s7-event-1', .80, 1.20), _ev('s7-event-2', 3.80, .90), _ev('s7-event-3', 6.00, .90)],
 's8': [_ev('s8-event-1', .35, .70, (['s8-map', 's8-fence'], 'Wide on the empty curb after the flood, the paper street map pinned to the chain link fence settles, with no pin on it.', 'contact')),
        _ev('s8-event-2', 1.10, .80), _ev('s8-event-3', 2.00, .80)],
 's9': [_ev('s9-event-1', .30, .60), _ev('s9-event-2', .95, .70, (['s9-spot'], 'Close on the same map, a dashed ring draws itself on the empty spot beneath the hovering pin where a station could go.', 'travel')),
        _ev('s9-event-3', 1.70, .65)],
}}
SHOTS = {
 'a': {'s1': [('street-yard', 'wide', 'cut', 's1-event-1'), ('phone-late', 'close', 'cut', 's1-event-3')],
       's2': [('station-wide', 'wide', 'cut', 's2-event-1'), ('panel-charge', 'close', 'cut', 's2-event-2'), ('no-tower', 'wide', 'cut', 's2-event-3')],
       's3': [('sensor-stack', 'medium', 'match', 's3-event-1'), ('water-marks', 'close', 'continuous', 's3-event-2'), ('weather-row', 'close', 'cut', 's3-event-3')],
       's4': [('chip-glow', 'close', 'cut', 's4-event-1'), ('chip-glow', 'detail', 'continuous', 's4-event-2'), ('no-server', 'wide', 'cut', 's4-event-3')],
       's5': [('radio-rings', 'wide', 'cut', 's5-event-1'), ('radio-open', 'wide', 'cut', 's5-event-3')],
       's6': [('hub-desk', 'close', 'cut', 's6-event-1'), ('flood-paths', 'overhead', 'match', 's6-event-2')],
       's7': [('validation-card', 'close', 'cut', 's7-event-1'), ('validation-card', 'detail', 'continuous', 's7-event-2'), ('no-field-card', 'detail', 'cut', 's7-event-3')],
       's8': [('empty-map', 'close', 'cut', 's8-event-1')],
       's9': [('station-return', 'wide', 'cut', 's9-event-1')]},
 'b': {'s1': [('water-marks', 'detail', 'cut', 's1-event-0'), ('street-yard', 'wide', 'match', 's1-event-1'), ('phone-late', 'close', 'cut', 's1-event-3')],
       's2': [('station-wide', 'wide', 'cut', 's2-event-1'), ('panel-charge', 'close', 'cut', 's2-event-2')],
       's3': [('water-marks', 'detail', 'cut', 's3-event-2'), ('weather-row', 'close', 'cut', 's3-event-3')],
       's4': [('no-server', 'close', 'cut', 's4-event-1'), ('chip-glow', 'detail', 'cut', 's4-event-2'), ('no-server', 'wide', 'cut', 's4-event-3')],
       's5': [('radio-map', 'overhead', 'cut', 's5-event-1'), ('radio-rings', 'wide', 'cut', 's5-event-2'), ('hub-wide', 'medium', 'cut', 's5-event-3')],
       's6': [('flood-paths', 'overhead', 'cut', 's6-event-2'), ('hub-desk', 'close', 'cut', 's6-event-3')],
       's7': [('validation-card', 'close', 'cut', 's7-event-1'), ('no-field-card', 'close', 'cut', 's7-event-3')],
       's8': [('station-return', 'wide', 'cut', 's8-event-1')],
       's9': [('empty-map', 'close', 'cut', 's9-event-1')]},
}
PURPOSE.update({
 'street-yard': 'Brown water spreads across a San Antonio yard with no station in it and climbs a fence post to its ankle mark while the porch phone stays dark.',
 'water-marks': 'Brown water reaches the optical lenses and each lights as it goes under; in B s1 a disclosed design detail with no yard around it.',
 'chip-glow': 'Readings run along thin traces into one small chip, and in the detail framing the chip lights the amber risk lamp on the board.',
 'no-server': 'From the street the housing window glows as readings arrive; wide, a dashed central server far off stays dark with no line to the station.',
 'empty-map': 'Close on the one paper map pinned to the fence: no installed pin is found, and at the close a dashed goal pin hovers over an empty spot.',
 'station-return': 'The empty curb after the flood with the same map on the fence; at the close a dashed outline of the station draws itself, uninstalled.',
 'validation-card': 'The validation bar fills to the university\'s reported figure, which holds, and an after training tag pins under it.',
 'no-field-card': 'Both cards side by side: the figure stays readable while the field result card takes its none reported stamp.',
})
CARRY.update({
 's1': 'The same brown water and the same ankle height that the station\'s lowest lens will mark; no station stands in this yard',
 's8': 'The one paper map pinned to the chain link fence at the curb, the same map in close up and wide',
 's9': 'The same paper map on the same fence, still with no installation named',
})
DISC = {
 's1': 'Illustration. Map marks the county',
 's2': 'Illustration of the prototype',
 's3': 'Illustration of the described sensors',
 's4': 'Illustration. Not real hardware',
 's5': 'Illustration. Ranges as described',
 's6': 'Illustration. Not a real hub',
 's7': 'Illustration. The university\'s figure',
 's8': 'Illustration. Not a real town map',
 's9': 'Illustration. No station installed',
}
SOUND_ACTION.update({
 's8': 'A paper flutter on the fence wire and a quiet sweep as the search ring passes.',
 's9': 'Music settles; a soft paper tap as the deployment goal tag pins, with no water and no station sound.',
})
SUBJECT_TEXT['s1'] = {'a': 'A flooded San Antonio yard with no station in it, the orange ankle mark on a chain link post and the phone on the porch rail',
                      'b': 'A disclosed design detail of the lowest lens going under, then a flooded yard with no station in it and the phone on the porch rail'}
SUBJECT_TEXT['s2'] = {'a': 'The whole prototype station at a curb, its solar panel and battery bar, and a far cell tower',
                      'b': 'The prototype station revealed from its antenna down, then its panel and battery bar with a far cell tower behind'}
SUBJECT_TEXT['s3'] = {'a': 'The station post\'s four optical lenses, the rising water and the housing\'s weather lamps',
                      'b': 'The lens column framed low and right with the rising water, then the housing\'s weather lamps'}
SUBJECT_TEXT['s4'] = {'a': 'The opened housing with its traces and chip, a push in on the risk lamp, then the far dark server outline',
                      'b': 'The housing window from the street as readings arrive, the chip lighting its risk lamp, then the far dark server outline'}
SUBJECT_TEXT['s7'] = {'a': 'The validation card with its bar, figure and tag, then both cards with the blank field result card stamped',
                      'b': 'The validation card with its bar and figure, then both cards side by side, the tag pinning and the blank card stamped'}
SUBJECT_TEXT['s8'] = {'a': 'The paper street map pinned to the chain link fence, close, with no installed pin',
                      'b': 'The empty curb after the flood and the paper map pinned to the fence with no pin'}
SUBJECT_TEXT['s9'] = {'a': 'The empty curb with a dashed station outline drawing itself beside the same map and its dashed goal pin',
                      'b': 'The same map close up with the dashed goal pin over an empty dashed spot'}
EMOTION['s9'] = 'Open ending, the goal not yet met and nothing installed.'
