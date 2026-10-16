"""Complete both 2026-10-15 treatment boards from the director's plan and the builder's executed views.

Re-runnable: always starts from the retained director boards in out/dispatch/builder-notes/.
Writes out/dispatch/opening-a.json, opening-b.json and storyboard.json (= A, byte identical).
"""
import copy, hashlib, json, sys
from pathlib import Path

REPO = Path('/home/user/TexasAIDispatch')
sys.path.insert(0, str(REPO / 'scripts'))
import modern_film  # noqa: E402

D = REPO / 'out/dispatch'
base = {v: json.loads((D / f'evidence/pre-correction-1/opening-{v}.json').read_text()) for v in 'ab'}
bind = json.loads((D / 'vo_bindings.json').read_text())
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()

# ---------------------------------------------------------------- shared clock (provisional, authored)
# Every equal shot split lands on a whole native frame at 30 fps (a half frame leaves an uncovered frame).
SCENES = [('s1', 0.0, 7.8), ('s2', 7.8, 6.6), ('s3', 14.4, 6.0), ('s4', 20.4, 7.2), ('s5', 27.6, 9.4),
          ('s6', 37.0, 7.2), ('s7', 44.2, 7.4), ('s8', 51.6, 3.2), ('s9', 54.8, 3.9)]
CLAUSE_T = {'n1': (0.3, 7.5), 'n2': (8.1, 14.0), 'n3': (14.6, 20.1), 'n4': (20.7, 27.2), 'n5': (27.7, 36.7),
            'n6': (37.2, 43.7), 'n7': (44.3, 51.2), 'n8': (51.8, 54.4), 'n9': (55.0, 57.2)}
SENT = {s['id']: s for s in bind['sentences']}
CLAUSES = [('n1', 's1', 's1'), ('n2', 's2', 's2'), ('n3', 's3', 's3'), ('n4', 's4', 's4'), ('n5', 's5', 's5'),
           ('n6', 's6', 's6'), ('n7', 's8', 's7'), ('n8', 's9', 's8'), ('n9', 's10', 's9')]  # (clause, sentence, scene)
CHUNKS = {
 'n1': ['UT San Antonio says some people could have', 'ankle-deep water in their yard', 'before a flood warning sounds on their phone.'],
 'n2': ['So its researchers built a flood station', 'that charges itself from light', 'and needs no cell tower.'],
 'n3': ['Four optical sensors at different heights', 'watch the water, along with rain,', 'temperature, humidity and light.'],
 'n4': ['A small chip on the station runs the AI itself,', 'so it judges flood risk', 'without a central server.'],
 'n5': ['When the risk rises, a radio signal', 'can carry more than a half-mile', 'through city streets, and up to five miles', 'in open country, to a hub.'],
 'n6': ['At the hub, a second, larger AI model', 'draws a map of how flooding could spread,', 'for emergency responders.'],
 'n7': ['The university reports ninety eight point eight two percent', 'validation accuracy from early assessments', 'after training, and no field result.'],
 'n8': ['It names no town that has installed one.'],
 'n9': ['Deployment is still the goal.'],
}
ACTION = {'n1': 'yard-floods-before-warning', 'n2': 'self-power-no-tower', 'n3': 'sense-water-and-weather',
          'n4': 'judge-risk-on-chip', 'n5': 'carry-radio-to-hub', 'n6': 'draw-flood-map', 'n7': 'report-validation-only',
          'n8': 'no-town-named', 'n9': 'deployment-goal'}
SUBJECTS = {'n1': ['s1-water'], 'n2': ['s2-station', 's2-panel'], 'n3': ['s3-stack'], 'n4': ['s4-chip', 's4-traces'],
            'n5': ['s5-ring', 's5-tags'], 'n6': ['s6-dashboard', 's6-paths'], 'n7': ['s7-card', 's7-blank'],
            'n8': ['s8-map', 's8-nopin'], 'n9': ['s9-goal', 's9-station']}
ROLE = {'s1': 'hook', 's2': 'movement', 's3': 'mechanism', 's4': 'mechanism', 's5': 'scale', 's6': 'consequence',
        's7': 'limit', 's8': 'agency', 's9': 'close'}
CONTRACT_ROLE = {'s1': 'action', 's2': 'action', 's3': 'mechanism', 's4': 'mechanism', 's5': 'mechanism',
                 's6': 'consequence', 's7': 'limit', 's8': 'limit', 's9': 'answer'}
BEAT = {'s1': 'motion', 's2': 'revelation', 's3': 'motion', 's4': 'revelation', 's5': 'motion', 's6': 'revelation',
        's7': 'revelation', 's8': 'emotion', 's9': 'emotion'}

# ---------------------------------------------------------------- items drawn by the episode, per treatment
L = {  # item id -> label (the visible surface the item carries)
 's1-water': 'brown flood water ankle deep across the yard from the flooded street',
 's1-post': 'chain link fence post with an orange ankle high paint mark in the flooded yard',
 's1-phone': 'worn phone lying on the porch rail with a dark screen',
 's1-banner': 'flash flood warning banner lighting the phone late after the water',
 's1-station': 'solar flood station on its post at the curb',
 's1-marks': 'lowest optical sensor mark at ankle height on the station post lighting under water',
 's2-station': 'self powered solar flood station on its post at the curb',
 's2-post': 'galvanized station post standing in shallow flood water',
 's2-panel': 'small dark solar panel that charges itself from low sun light',
 's2-battery': 'battery bar window filling cell by cell as the station charges itself from light',
 's2-tower': 'far cell tower with a dashed line that stops short, no cell tower link',
 's3-stack': 'station sensors, four optical water marks and rain temperature humidity light sensing',
 's3-marks': 'four optical sensor marks at four different heights on the post',
 's3-water': 'brown flood water rising past the optical marks that watch the water',
 's3-weather': 'rain temperature humidity light weather lamps and labels on the housing',
 's4-traces': 'thin traces carrying sensor readings to the chip',
 's4-chip': 'small chip on the station running the AI, marked TinyML',
 's4-risk': 'amber flood risk lamp lit by the chip',
 's4-station': 'flood station with its glowing housing on the street',
 's4-server': 'dashed outline of a central server, dark, no line to it',
 's5-antenna': 'station whip antenna sending a radio signal pulse',
 's5-station-dot': 'station dot on the overhead street map sending radio rings',
 's5-ring': 'amber radio signal rings carrying out to the hub',
 's5-tags': 'more than a half mile and up to five miles range tags',
 's5-halfmile': 'more than a half mile tag through city streets',
 's5-fivemile': 'up to five miles in open country tag',
 's5-hub': 'hub building with a rooftop mast lamp',
 's6-dashboard': 'hub dashboard map from a second larger AI model',
 's6-dots': 'station dots arriving on the hub map',
 's6-paths': 'shaded flood paths showing how flooding could spread',
 's6-zones': 'dashed higher risk zones outlined on the map',
 's6-hand': 'emergency responder sleeved forearm and gloved hand at the hub desk',
 's7-card': 'validation accuracy card reading 98.82 percent, the university reported figure',
 's7-bar': 'validation accuracy bar filling to 98.82 percent',
 's7-tag': 'initial assessments after training tag',
 's7-blank': 'field result card left blank, none reported',
 's7-card2': 'second card for a field result',
 's8-map': 'paper street map of a Texas town with no pin',
 's8-nopin': 'no town has installed one, no installation pin, no installation named tag',
 's8-station': 'flood station by the street beside the map',
 's9-map': 'paper street map with no installed pin',
 's9-goal': 'dashed deployment goal pin that has not landed, deployment goal tag',
 's9-station': 'flood station still watching the street, a higher optical mark lighting',
 's8-search': 'dashed search ring sweeping the map for an installed station',
 's8-tag': 'no installation named tag pinned to the map',
 's8-fence': 'chain link fence where the map is pinned beside the station',
 's9-tag': 'deployment goal tag pinned beside the dashed pin',
 's9-fence': 'chain link fence where the map is pinned beside the station',
}

# planes: far to near, per scene and treatment. (z, label, [item ids])
PLANES = {
 'a': {
  's1': [(900, 'Bexar sky and downtown skyline across the river', ['s1-station']), (700, 'flooded street and limestone curb', ['s1-water']),
         (500, 'chain link fence post with its orange ankle mark', ['s1-post']), (300, 'porch rail and the dark phone', ['s1-phone']),
         (150, 'phone screen and its late warning banner', ['s1-banner'])],
  's2': [(900, 'far cell tower on the horizon', ['s2-tower']), (700, 'flooded street at the curb', ['s2-post']),
         (500, 'the flood station on its post', ['s2-station']), (300, 'solar panel catching low sun', ['s2-panel']),
         (150, 'battery bar window on the housing', ['s2-battery'])],
  's3': [(900, 'post column climbing to the housing', ['s3-stack']), (700, 'four optical marks at four heights', ['s3-marks']),
         (500, 'weather sensors and lamps on the housing', ['s3-weather']), (300, 'brown water rising at the post', ['s3-water'])],
  's4': [(900, 'street and dark server outline', ['s4-server']), (700, 'station with its housing glowing', ['s4-station']),
         (500, 'opened housing and its traces', ['s4-traces']), (300, 'small chip at the board centre', ['s4-chip']),
         (150, 'amber risk lamp on the board edge', ['s4-risk'])],
  's5': [(900, 'open country and the hub building', ['s5-hub']), (700, 'street of bungalows and its corner tag', ['s5-halfmile']),
         (500, 'radio rings rolling out', ['s5-ring']), (300, 'range tags', ['s5-tags', 's5-fivemile']),
         (150, 'station antenna in the foreground', ['s5-antenna'])],
  's6': [(900, 'hub window onto the Bexar plate', ['s6-dashboard']), (700, 'station dots on the screen', ['s6-dots']),
         (500, 'shaded flood paths', ['s6-paths']), (300, 'dashed higher risk zones', ['s6-zones']),
         (150, 'responder forearm on the hub desk', ['s6-hand'])],
  's7': [(900, 'plain wall', ['s7-card2']), (700, 'validation card', ['s7-card']), (500, 'validation bar', ['s7-bar']),
         (300, 'assessment tag', ['s7-tag']), (150, 'blank field result card', ['s7-blank'])],
  's8': [(900, 'plain wall', ['s8-map']), (700, 'street grid and creek on the map', ['s8-nopin']),
         (500, 'search ring sweeping the map', ['s8-search']), (300, 'tag pinned to the map', ['s8-tag'])],
  's9': [(900, 'Bexar sky over the street', ['s9-station']), (700, 'chain link fence', ['s9-fence']),
         (500, 'paper map pinned to the fence', ['s9-map']), (300, 'dashed goal pin over the map', ['s9-goal']),
         (150, 'deployment goal tag', ['s9-tag'])],
 },
}
# B differs in s1 (adds the opening marks), s5 (overhead station dot) and s8/s9 (swapped views)
PLANES['b'] = copy.deepcopy(PLANES['a'])
PLANES['b']['s1'] = [(900, 'Bexar sky and downtown skyline across the river', ['s1-station']), (700, 'flooded yard and limestone curb', ['s1-water']),
                     (500, 'station post and the chain link post', ['s1-post']), (400, 'lowest optical mark at ankle height', ['s1-marks']),
                     (300, 'porch rail and the dark phone', ['s1-phone']), (150, 'phone screen and its late warning banner', ['s1-banner'])]
PLANES['b']['s5'] = [(900, 'open country and the hub building', ['s5-hub']), (700, 'overhead street map and station dot', ['s5-station-dot']),
                     (500, 'radio rings rolling out', ['s5-ring']), (300, 'street corner half-mile tag', ['s5-halfmile']),
                     (150, 'range tags', ['s5-tags', 's5-fivemile'])]
PLANES['b']['s8'] = [(900, 'Bexar sky over the street', ['s8-station']), (700, 'chain link fence', ['s8-fence']),
                     (500, 'paper map pinned to the fence', ['s8-map', 's8-nopin']), (300, 'search ring over the pinned map', ['s8-search']),
                     (150, 'tag pinned to the map', ['s8-tag'])]
PLANES['b']['s9'] = [(900, 'plain wall', ['s9-map']), (700, 'dashed goal pin over the map', ['s9-goal']),
                     (500, 'small station at the map corner', ['s9-station']), (300, 'deployment goal tag', ['s9-tag'])]

# ---------------------------------------------------------------- events: (id, start, dur, items, what, curve)
E = {}
E['a'] = {
 's1': [('s1-event-1', .30, 1.10, ['s1-water', 's1-post'], 'Brown water tops the limestone curb, spreads across the San Antonio yard and climbs a chain link post to its orange ankle mark.', 'linear'),
        ('s1-event-2', 2.20, 1.20, ['s1-phone', 's1-water'], 'The water keeps rising toward the porch steps while the phone on the porch rail stays dark.', 'travel'),
        ('s1-event-3', 4.60, 1.20, ['s1-phone', 's1-banner'], 'The flash flood warning banner finally slides onto the phone, after the water is already in the yard.', 'contact')],
 's2': [('s2-event-1', .30, 1.10, ['s2-station', 's2-post'], 'The view tilts up from the wet foot to the whole flood station at the curb and a prototype tag pins beside its housing.', 'travel'),
        ('s2-event-2', 2.50, 1.20, ['s2-panel', 's2-battery'], 'Low sun reaches the small dark solar panel, a glint crosses its cells and the battery bar fills cell by cell.', 'travel'),
        ('s2-event-3', 4.60, 1.20, ['s2-station', 's2-tower'], 'A dashed line leaves the antenna toward a far cell tower and stops halfway with an open ring.', 'contact')],
 's3': [('s3-event-1', .30, 1.10, ['s3-stack', 's3-marks'], 'The view climbs the post past four optical marks at four different heights, each lens catching the low light in turn.', 'travel'),
        ('s3-event-2', 2.25, 1.20, ['s3-marks', 's3-water'], 'Brown water rises past the lit first mark and reaches the second, which lights as it goes under.', 'linear'),
        ('s3-event-3', 4.25, 1.15, ['s3-stack', 's3-weather'], 'Rain, temperature, humidity and light lamps come on one by one on the housing, each with its label.', 'smoothstep')],
 's4': [('s4-event-1', .30, 1.20, ['s4-traces', 's4-chip'], 'In the opened housing, readings run in along thin traces from the four marks and four weather sensors to one small chip.', 'linear'),
        ('s4-event-2', 2.00, 1.20, ['s4-chip', 's4-risk'], 'The chip glows, the amber risk lamp lights on the board and a judged on the station tag pins.', 'contact'),
        ('s4-event-3', 4.40, 1.20, ['s4-server', 's4-station'], 'Beside the station a dashed outline of a central server draws itself and stays dark, with no line running to it.', 'smoothstep')],
 's5': [('s5-event-1', .30, 1.20, ['s5-antenna', 's5-ring'], 'A pulse flashes at the antenna tip and amber radio rings leave it.', 'linear'),
        ('s5-event-2', 2.90, 1.20, ['s5-ring', 's5-halfmile'], 'The rings run down the street of bungalows and pass the half-mile tag on the far corner post.', 'linear'),
        ('s5-event-3', 6.20, 1.20, ['s5-ring', 's5-hub', 's5-fivemile'], 'Across open country the ring reaches the five-mile tag and lands on the hub\'s rooftop mast, whose lamp lights.', 'contact')],
 's6': [('s6-event-1', .30, 1.20, ['s6-dots', 's6-dashboard'], 'Dots from several stations arrive on the hub dashboard and a tag names the second, larger model as the responder\'s arm comes to rest.', 'travel'),
        ('s6-event-2', 3.80, 1.20, ['s6-paths', 's6-dashboard'], 'Shaded flood paths spread out from the first dots along the creek and the low streets.', 'smoothstep'),
        ('s6-event-3', 5.30, 1.20, ['s6-zones', 's6-dashboard'], 'Higher-risk zones outline themselves in dashed amber and a for emergency responders tag pins.', 'contact')],
 's7': [('s7-event-1', .80, 1.20, ['s7-bar', 's7-card'], 'The validation bar fills across its card and the university\'s reported figure appears.', 'travel'),
        ('s7-event-2', 2.50, 1.00, ['s7-tag', 's7-card'], 'An initial assessments after training tag pins under the card.', 'contact'),
        ('s7-event-3', 5.40, 1.20, ['s7-blank', 's7-card2'], 'The field result card stays blank and a none reported stamp presses onto it.', 'contact')],
 's8': [('s8-event-1', .35, .70, ['s8-map'], 'A paper street map settles on the wall, streets and a creek with no pin on it.', 'contact'),
        ('s8-event-2', 1.10, .80, ['s8-search', 's8-nopin'], 'A dashed search ring sweeps the map and finds no installed station.', 'smoothstep'),
        ('s8-event-3', 2.00, .80, ['s8-tag', 's8-map'], 'A no installation named tag pins to the map.', 'contact')],
 's9': [('s9-event-1', .30, .60, ['s9-goal', 's9-map'], 'Over the map pinned to the fence a dashed goal pin hovers and does not land.', 'smoothstep'),
        ('s9-event-2', .95, .70, ['s9-station'], 'The water rises to the station\'s third mark and it lights, the station still watching the street.', 'linear'),
        ('s9-event-3', 1.70, .65, ['s9-tag', 's9-goal'], 'A deployment goal tag pins beside the dashed pin.', 'contact')],
}
E['b'] = {
 's1': [('s1-event-0', .30, 1.05, ['s1-water', 's1-post', 's1-marks'], 'In the water at the post, brown water climbs over the station\'s lowest optical mark at ankle height and the mark lights as it goes under.', 'linear'),
        ('s1-event-1', 2.80, 1.20, ['s1-water', 's1-post'], 'The view pulls back from the post as the same brown water spreads across the San Antonio yard past the orange ankle mark on the chain link post.', 'travel'),
        ('s1-event-2', 4.10, .90, ['s1-phone', 's1-water'], 'The water keeps rising toward the porch steps while the phone on the porch rail stays dark.', 'travel'),
        ('s1-event-3', 5.60, 1.20, ['s1-phone', 's1-banner'], 'The flash flood warning banner finally slides onto the phone, after the water is already in the yard.', 'contact')],
 's2': [('s2-event-2', .30, 1.20, ['s2-panel', 's2-battery'], 'Low sun reaches the small dark solar panel, a glint crosses its cells and the battery bar fills cell by cell.', 'travel'),
        ('s2-event-1', 3.50, 1.00, ['s2-station', 's2-post'], 'The view pulls back from the panel to the whole flood station at the curb and a prototype tag pins beside its housing.', 'travel'),
        ('s2-event-3', 4.90, 1.10, ['s2-station', 's2-tower'], 'A dashed line leaves the antenna toward a far cell tower and stops halfway with an open ring.', 'contact')],
 's3': [('s3-event-3', .30, 1.10, ['s3-stack', 's3-weather'], 'Rain, temperature, humidity and light lamps come on one by one on the housing, each with its label.', 'smoothstep'),
        ('s3-event-1', 3.20, .80, ['s3-stack', 's3-marks'], 'The view settles back on the column, four optical marks at four different heights catching the light in turn.', 'travel'),
        ('s3-event-2', 4.20, 1.20, ['s3-marks', 's3-water'], 'Brown water rises past the lit first mark and reaches the second, which lights as it goes under.', 'linear')],
 's4': [('s4-event-3', .30, 1.20, ['s4-server', 's4-station'], 'Beside the station a dashed outline of a central server draws itself and stays dark, with no line running to it.', 'smoothstep'),
        ('s4-event-1', 3.80, 1.00, ['s4-traces', 's4-chip'], 'In the opened housing, readings run in along thin traces from the four marks and four weather sensors to one small chip.', 'linear'),
        ('s4-event-2', 5.00, 1.20, ['s4-chip', 's4-risk'], 'The chip glows, the amber risk lamp lights on the board and a judged on the station tag pins.', 'contact')],
 's5': [('s5-event-1', .30, 1.20, ['s5-station-dot', 's5-ring'], 'From above, amber rings leave the station dot on the street map toward the dashed half-mile and five-mile circles.', 'linear'),
        ('s5-event-2', 3.40, 1.20, ['s5-ring', 's5-halfmile'], 'At street level the rings run down the street of bungalows and pass the half-mile tag on the far corner post.', 'linear'),
        ('s5-event-3', 6.60, 1.20, ['s5-ring', 's5-hub', 's5-fivemile'], 'Across open country the ring reaches the five-mile tag and lands on the hub\'s rooftop mast, whose lamp lights.', 'contact')],
 's6': [('s6-event-1', .30, 1.20, ['s6-dots', 's6-dashboard'], 'On the hub\'s screen, dots from several stations arrive on the street map.', 'travel'),
        ('s6-event-2', 1.90, 1.20, ['s6-paths', 's6-dashboard'], 'Shaded flood paths spread out from the first dots along the creek and the low streets, and a for emergency responders tag pins.', 'smoothstep'),
        ('s6-event-3', 4.00, 1.20, ['s6-zones', 's6-hand'], 'At the desk the dashed higher-risk outlines settle on the screen and a responder\'s sleeved forearm comes to rest beside it.', 'contact')],
 's7': [('s7-event-3', .60, 1.20, ['s7-blank', 's7-card2'], 'The field result card stays blank and a none reported stamp presses onto it.', 'contact'),
        ('s7-event-1', 4.20, 1.20, ['s7-bar', 's7-card'], 'Beside it the validation bar fills across its card and the university\'s reported figure appears.', 'travel'),
        ('s7-event-2', 5.80, 1.00, ['s7-tag', 's7-card'], 'An initial assessments after training tag pins under the card.', 'contact')],
 's8': [('s8-event-1', .35, .70, ['s8-map', 's8-station'], 'A paper street map swings onto the chain link fence beside the station, with no pin on it.', 'contact'),
        ('s8-event-2', 1.10, .80, ['s8-search', 's8-nopin'], 'A dashed search ring sweeps the map and finds no installed station.', 'smoothstep'),
        ('s8-event-3', 2.00, .80, ['s8-tag', 's8-map'], 'A no installation named tag pins to the map.', 'contact')],
 's9': [('s9-event-1', .30, .60, ['s9-goal', 's9-map'], 'Over the paper map a dashed goal pin hovers and does not land.', 'smoothstep'),
        ('s9-event-2', .95, .70, ['s9-station'], 'At the map\'s corner the small station\'s third mark lights as the water reaches it, the station still watching.', 'linear'),
        ('s9-event-3', 1.70, .65, ['s9-tag', 's9-goal'], 'A deployment goal tag pins beside the dashed pin.', 'contact')],
}
# ---------------------------------------------------------------- shots: (view, framing, transition, event)
SHOTS = {
 'a': {'s1': [('street-yard', 'wide', 'cut', 's1-event-1'), ('phone-late', 'close', 'cut', 's1-event-3')],
       's2': [('station-wide', 'wide', 'cut', 's2-event-1'), ('panel-charge', 'close', 'cut', 's2-event-2'), ('no-tower', 'wide', 'cut', 's2-event-3')],
       's3': [('sensor-stack', 'medium', 'match', 's3-event-1'), ('water-marks', 'close', 'continuous', 's3-event-2'), ('weather-row', 'close', 'cut', 's3-event-3')],
       's4': [('chip-glow', 'close', 'cut', 's4-event-1'), ('no-server', 'wide', 'cut', 's4-event-3')],
       's5': [('radio-rings', 'wide', 'cut', 's5-event-1'), ('radio-open', 'wide', 'cut', 's5-event-3')],
       's6': [('hub-desk', 'medium', 'cut', 's6-event-1'), ('flood-paths', 'overhead', 'match', 's6-event-2')],
       's7': [('validation-card', 'close', 'cut', 's7-event-1'), ('no-field-card', 'detail', 'cut', 's7-event-3')],
       's8': [('empty-map', 'overhead', 'cut', 's8-event-1')],
       's9': [('station-return', 'wide', 'cut', 's9-event-1')]},
 'b': {'s1': [('water-marks', 'detail', 'cut', 's1-event-0'), ('street-yard', 'wide', 'continuous', 's1-event-1'), ('phone-late', 'close', 'cut', 's1-event-3')],
       's2': [('panel-charge', 'close', 'cut', 's2-event-2'), ('station-wide', 'wide', 'continuous', 's2-event-1')],
       's3': [('weather-row', 'close', 'cut', 's3-event-3'), ('water-marks', 'detail', 'cut', 's3-event-2')],
       's4': [('no-server', 'wide', 'cut', 's4-event-3'), ('chip-glow', 'detail', 'cut', 's4-event-2')],
       's5': [('radio-map', 'overhead', 'cut', 's5-event-1'), ('radio-rings', 'wide', 'cut', 's5-event-2'), ('hub-wide', 'medium', 'cut', 's5-event-3')],
       's6': [('flood-paths', 'overhead', 'cut', 's6-event-2'), ('hub-desk', 'medium', 'cut', 's6-event-3')],
       's7': [('no-field-card', 'close', 'cut', 's7-event-3'), ('validation-card', 'close', 'cut', 's7-event-1')],
       's8': [('station-return', 'wide', 'cut', 's8-event-1')],
       's9': [('empty-map', 'overhead', 'cut', 's9-event-1')]},
}
PURPOSE = {  # view -> what new information the shot gives
 'street-yard': 'Brown water spreads across a San Antonio yard and climbs a fence post to its ankle mark while the porch phone stays dark.',
 'phone-late': 'The phone on the porch rail lights its flash flood warning only now, with the water already in the yard.',
 'station-wide': 'The whole self-powered flood station stands at the curb in shallow water, a prototype of the described design.',
 'panel-charge': 'Low sun reaches the small solar panel and the battery bar fills, the station charging itself from light.',
 'no-tower': 'A dashed line from the antenna toward a far cell tower stops halfway, the station needing no tower.',
 'sensor-stack': 'The view climbs past four optical marks set at four different heights on the post.',
 'water-marks': 'Brown water reaches the optical marks and each lights as it goes under, the sensing seen directly.',
 'weather-row': 'Rain, temperature, humidity and light lamps come on one by one, the other things the station watches.',
 'chip-glow': 'Readings run along thin traces into one small chip, which lights the amber risk lamp on the station itself.',
 'no-server': 'A dashed central server outline stays dark with no line to the station, so the judgment is made locally.',
 'radio-rings': 'Radio rings leave the antenna and run down a city street past a more than a half-mile tag.',
 'radio-open': 'In open country the ring reaches an up to five miles tag and lands on the hub mast, which lights.',
 'radio-map': 'From above, rings leave the station dot toward the dashed half-mile and five-mile circles and the hub.',
 'hub-wide': 'The ring reaches the five-mile tag and lands on the hub building, whose rooftop mast lamp lights.',
 'hub-desk': 'At the hub desk the dashboard fills with station dots and a responder works beside the screen.',
 'flood-paths': 'The second, larger model shades how flooding could spread and outlines the higher-risk zones.',
 'validation-card': 'The validation bar fills to the university\'s reported figure and an after training tag pins under it.',
 'no-field-card': 'The field result card stays blank and takes a none reported stamp, the limit made visible.',
 'empty-map': 'A paper street map carries no installed pin; at the close a dashed goal pin hovers and does not land.',
 'station-return': 'The same station stands by the street beside a paper map on the fence that carries no installed pin.',
}
CARRY = {
 's1': 'The same brown waterline that will reach the station\'s marks, in the same San Antonio yard',
 's2': 'The same flood station at the same curb, its lowest mark already lit by the water',
 's3': 'The same station post and its four marks, the waterline rising from the first mark',
 's4': 'The same station housing, now opened, carrying the readings from the marks it just lit',
 's5': 'The same station antenna and its risk judgment, carried out by radio toward the hub',
 's6': 'The same radio ring arriving as one of the station dots on the hub map',
 's7': 'The same station\'s design, now measured only by the university\'s reported validation figure',
 's8': 'The same station and the map where its installation would be pinned, with none',
 's9': 'The same station by the same street, still watching, beside the map with no pin',
}
REWARD_KIND = {1: 'action', 2: 'reveal', 3: 'consequence', 0: 'action'}
CHANGE_TYPE = {'s1': 'location_reveal', 's2': 'reveal', 's3': 'mechanism', 's4': 'mechanism', 's5': 'mechanism',
               's6': 'consequence', 's7': 'evidence', 's8': 'evidence', 's9': 'resolution'}
SOUND_ACTION = {
 's1': 'Rain on asphalt and a low trickle over the curb; the phone stays silent until its banner lands.',
 's2': 'A soft warm swell as the sun reaches the panel and small ticks as each battery cell fills.',
 's3': 'Water lapping on steel and a small soft tone each time a mark lights.',
 's4': 'A quiet electric run of clicks along the traces and a low hum as the chip lights.',
 's5': 'A clean radio pulse at the antenna that thins as the rings travel outward.',
 's6': 'A quiet room tone at the hub and soft map shading strokes.',
 's7': 'A paper tap as the tag pins and a dull stamp on the blank card.',
 's8': 'A paper slide onto the wall and a quiet sweep as the search ring passes.',
 's9': 'Music settles; water laps at the post and a soft tone marks the third mark.',
}

DISC = {
 's1': 'Illustration. Map shows the county, not a station site',
 's2': 'Illustration. Not an installed station or a real street',
 's3': 'Illustration of the described sensors',
 's4': 'Illustration of the described chip, not real hardware',
 's5': 'Illustration. Ranges as the university describes them',
 's6': 'Illustration. Not a real hub, dashboard or responder',
 's7': 'Illustration. The university\'s reported figure',
 's8': 'Illustration. Not a real town map',
 's9': 'Illustration. Not an installed station',
}
CAMERA = {'a': {'s1': 'dollyThrough', 's2': 'riseWith', 's3': 'craneDown', 's4': 'dollyThrough', 's5': 'truckAcross',
                's6': 'orbitReveal', 's7': 'dollyThrough', 's8': 'craneDown', 's9': 'dollyThrough'},
          'b': {'s1': 'craneDown', 's2': 'dollyThrough', 's3': 'riseWith', 's4': 'truckAcross', 's5': 'craneDown',
                's6': 'riseWith', 's7': 'truckAcross', 's8': 'dollyThrough', 's9': 'craneDown'}}
SUBJECT_TEXT = {
 's1': {'a': 'A flooded San Antonio yard, the orange ankle mark on a chain link post and the phone on the porch rail',
        'b': 'The station post\'s lowest mark going under, then the flooded yard and the phone on the porch rail'},
 's2': {'a': 'The whole flood station at the curb, its solar panel and battery bar, and a far cell tower',
        'b': 'The solar panel and battery bar, then the whole station at the curb and a far cell tower'},
 's3': {'a': 'The station post\'s four optical marks, the rising water and the housing\'s weather lamps',
        'b': 'The housing\'s weather lamps, then the four optical marks and the rising water'},
 's4': {'a': 'The opened housing with its traces, chip and risk lamp, then the dark central server outline',
        'b': 'The dark central server outline beside the station, then the opened housing and its chip'},
 's5': {'a': 'Radio rings from the station antenna down a city street to the hub in open country',
        'b': 'Radio rings from above, down the street and across open country to the hub'},
 's6': {'a': 'The hub desk and its dashboard, then the flood path map with its risk zones',
        'b': 'The flood path map on the hub screen, then the desk and the responder\'s forearm'},
 's7': {'a': 'The validation card with its bar and tag, then the blank field result card',
        'b': 'The blank field result card, then the validation card with its bar and tag'},
 's8': {'a': 'A paper street map on the wall with no installed pin',
        'b': 'The station by the street and the paper map on the fence with no pin'},
 's9': {'a': 'The station by the street with a dashed goal pin over the map on the fence',
        'b': 'The paper map with a dashed goal pin and the small station at its corner'},
}
EMOTION = {'s1': 'Unease as the water arrives before the warning.', 's2': 'Curiosity as a self-powered answer appears.',
           's3': 'Watchfulness as each mark lights.', 's4': 'The turn, a decision made right on the station.',
           's5': 'Reach, a signal travelling with no tower.', 's6': 'Use, a map someone could act on.',
           's7': 'Restraint, a lab figure and no field result.', 's8': 'Plainness, no town named.',
           's9': 'Open ending, the goal not yet met.'}

CUE_SOUND = [
 {'id': 'curb-trickle', 'event': 's1-event-1', 'role': 'environment', 'duration_s': 1.2,
  'intent': 'Rain on asphalt and a low trickle as brown water tops the limestone curb and spreads into the yard.',
  'provenance': 'Original designed ambience, not recorded at any San Antonio street.'},
 {'id': 'banner-tone', 'event': 's1-event-3', 'role': 'contact', 'duration_s': .4,
  'intent': 'A short soft designed tone as the warning banner lands on the phone, late.',
  'provenance': 'Original designed foley, not a real wireless emergency alert tone.'},
 {'id': 'mark-tone', 'event': 's3-event-2', 'role': 'sonification', 'duration_s': .6,
  'intent': 'A small rising tone as the second optical mark goes under and lights.',
  'provenance': 'Original designed sonification, not a sound the prototype makes.'},
 {'id': 'chip-hum', 'event': 's4-event-2', 'role': 'contact', 'duration_s': .5,
  'intent': 'A low warm hum as the chip lights the amber risk lamp on the station.',
  'provenance': 'Original designed foley, not recorded from real hardware.'},
 {'id': 'radio-pulse', 'event': 's5-event-1', 'role': 'sonification', 'duration_s': .6,
  'intent': 'A clean thin pulse as the rings leave the antenna, thinning as they travel.',
  'provenance': 'Original designed sonification, not a recorded LoRa signal.'},
 {'id': 'blank-card-quiet', 'event': 's7-event-3', 'role': 'quiet', 'duration_s': 1.2, 'gain': .3,
  'intent': 'Pull the music back while the field result card stays blank and takes its none reported stamp.',
  'provenance': 'Authored event-clock background contrast.'},
]
SOUND = {
 'perspective': 'Designed illustration sound for rain, water, steel, paper and a quiet hub room. Never recorded at a UT San Antonio site, a real station or a real alert.',
 'music_arc': 'A tense low pulse under the rising water, lifting as the sun charges the panel, steady through the marks and the chip, opening out with the radio rings, dropping away at the blank field card and returning softly for the goal.',
 'voice_arc': 'Plain and close over the flooded yard, quicker through the station and its marks, a lift on the chip turn, steady through the radio ranges, then slower and level on the validation figure and the close.',
}


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


def ev_rows(v, sid):
    return E[v][sid]


def build(v):
    b = copy.deepcopy(base[v])
    other = 'b' if v == 'a' else 'a'
    clauses_by_scene = {sc: n for n, _, sc in CLAUSES}
    scenes = []
    item_scene = {}
    for sid, start, dur in SCENES:
        n = clauses_by_scene[sid]
        cs, ce = CLAUSE_T[n]
        clen = ce - cs
        sent = SENT[[x for x in CLAUSES if x[0] == n][0][1]]
        events = []
        for eid, at, d, items, what, curve in ev_rows(v, sid):
            fs = round((start + at - cs) / clen, 4)
            fe = round((start + at + d - cs) / clen, 4)
            assert -1e-6 <= fs < fe <= 1 + 1e-6, (v, eid, fs, fe)
            events.append({'id': eid, 'at_s_authored': at, 'duration_s_authored': d, 'item_ids': items, 'what': what,
                           'motion': {'curve': curve, 'anticipation': 0, 'settle': .03 if curve != 'linear' else 0},
                           'narration_id': n, 'clause_fraction_start': fs, 'clause_fraction_end': fe,
                           'at_s': at, 'duration_s': d})
        planes = []
        for z, label, ids in PLANES[v][sid]:
            planes.append({'z': z, 'label': label, 'items': [
                {'id': i, 'kind': 'applicationRecord', 'x': 540, 'y': 900, 'scale': 1, 'props': {'label': L[i]}} for i in ids]})
        drawn = {i for _, _, ids in PLANES[v][sid] for i in ids}
        for e in events:
            assert set(e['item_ids']) <= drawn, (v, sid, e['id'])
        chron = sorted(events, key=lambda e: e['at_s'])
        on = ' '.join(e['what'] for e in chron)
        must, change = [], None
        principal = next(e for e in events if e['id'] == {'s1': 's1-event-1', 's9': 's9-event-1'}.get(sid, sid + '-event-2'))
        must_spec = {
         's1': [('ankle deep water in the yard', ['s1-water', 's1-post']), ('flood warning on the phone', ['s1-phone', 's1-banner'])],
         's2': [('self powered flood station', ['s2-station']), ('charges itself from light', ['s2-panel', 's2-battery']), ('no cell tower', ['s2-tower'])],
         's3': [('four optical sensors at different heights', ['s3-marks']), ('watch the water', ['s3-water', 's3-marks']), ('rain temperature humidity and light', ['s3-weather'])],
         's4': [('small chip on the station runs the AI', ['s4-chip', 's4-traces']), ('judges flood risk', ['s4-risk', 's4-chip']), ('without a central server', ['s4-server'])],
         's5': [('radio signal rings', ['s5-ring']), ('more than a half mile through city streets', ['s5-halfmile']), ('up to five miles in open country', ['s5-fivemile']), ('to a hub', ['s5-hub'])],
         's6': [('second larger AI model map', ['s6-dashboard']), ('how flooding could spread', ['s6-paths']), ('emergency responders at the hub', ['s6-hand'])],
         's7': [('ninety eight point eight two percent validation accuracy', ['s7-card', 's7-bar']), ('early assessments after training', ['s7-tag']), ('no field result', ['s7-blank'])],
         's8': [('no town has installed one', ['s8-nopin']), ('street map with no pin', ['s8-map'])],
         's9': [('deployment goal pin', ['s9-goal']), ('map with no installation named', ['s9-map', 's9-notown'])],
        }[sid]
        must = [{'concept': c, 'item_ids': ids} for c, ids in must_spec]
        change = {'description': principal['what'], 'item_ids': principal['item_ids']}
        scene = {
         'id': sid, 'start_s': start, 'duration_s': dur, 'duration_authored': dur, 'county': 'Bexar', 'region': 'blackland',
         'interior': sid == 's6', 'cast': [], 'beat': BEAT[sid], 'story_role': ROLE[sid], 'vo': sent['text'],
         'vo_claims': sent['claim_ids'], 'super': '', 'caption': '', 'on_screen': on, 'what_moves': on,
         'production_disclosure': DISC[sid], 'visual_events': events, 'camera_strategy': CAMERA[v][sid],
         'visual_family': f'flood-{sid}-{v}', 'payload_mode': 'picture', 'treatment': v,
         'hero': 'solar flood station with four optical marks', 'place_plate': 'blackland-san-antonio',
         'visual_sentence': {'subject': SUBJECT_TEXT[sid][v], 'action': on, 'emotion': EMOTION[sid],
                             'annotation': DISC[sid]},
         'planes': planes,
         'visual_proof': {'mute_takeaway': principal['what'], 'must_show': must, 'change': change},
        }
        if sid == 's1':
            scene['hook_strategy'] = 'human_stakes' if v == 'a' else 'visual_anomaly'
            scene['hook_payoff_s'] = 1.2
        scenes.append(scene)
    b['scenes'] = scenes
    b['runtime_s'] = 58.7

    # ---- captions: the explicit provisional cue plan for the silent comparison only
    caps = []
    clause_cues = {}
    for n, _, sid in CLAUSES:
        cs, ce = CLAUSE_T[n]
        chunks = CHUNKS[n]
        words = [len(c.split()) for c in chunks]
        total = sum(words)
        at, ids = cs, []
        for k, (txt, w) in enumerate(zip(chunks, words)):
            end = ce if k == len(chunks) - 1 else round(at + (ce - cs) * w / total, 3)
            cid = f'{n}-{chr(97 + k)}'
            caps.append({'id': cid, 'start': round(at, 3), 'end': round(end, 3), 'text': txt, 'source': 'authored_estimate'})
            ids.append(cid)
            at = end
        clause_cues[n] = ids
    b['captions'] = caps

    # ---- narration-picture contract
    clauses, cursor = [], 0
    for n, sent_id, sid in CLAUSES:
        text = SENT[sent_id]['text']
        assert ' '.join(CHUNKS[n]) == text, n
        count = len(modern_film.narration_tokens(text))
        cs, ce = CLAUSE_T[n]
        clauses.append({'id': n, 'text': text, 'cue_ids': clause_cues[n], 'scene_id': sid, 'subject_ids': SUBJECTS[n],
                        'action_id': ACTION[n], 'claim_ids': SENT[sent_id]['claim_ids'],
                        'event_ids': [e['id'] for e in sorted(next(s for s in scenes if s['id'] == sid)['visual_events'], key=lambda e: e['at_s'])],
                        'start_s': cs, 'end_s': ce, 'word_range': [cursor, cursor + count]})
        cursor += count
    b['narration_picture'] = {'version': 'narration-picture-v1', 'timing_mode': 'authored',
        'cue_plan': base[v]['narration_picture']['cue_plan'], 'clauses': clauses}

    # ---- the executed shot timeline: equal subdivisions of each one-clause scene, as compile_narration derives
    shots, rewards = [], []
    for sid, start, dur in SCENES:
        rows = SHOTS[v][sid]
        n = clauses_by_scene[sid]
        k = len(rows)
        scene = next(s for s in scenes if s['id'] == sid)
        for i, (view, framing, trans, eid) in enumerate(rows):
            a, z = start + dur * i / k, start + dur * (i + 1) / k
            shots.append({'id': f'{sid}-shot-{i + 1}', 'scene_id': sid, 'start_s': round(a, 4), 'duration_s': round(z - a, 4),
                          'framing': framing, 'transition': trans, 'view': view, 'event_id': eid,
                          'purpose': PURPOSE[view], 'carry': CARRY[sid], 'narration_ids': [n],
                          'scene_fraction_start': round(i / k, 6), 'scene_fraction_end': round((i + 1) / k, 6)})
        for e in scene['visual_events']:
            t = start + e['at_s'] + e['duration_s'] * .6
            owner = next(s for s in shots if s['scene_id'] == sid and s['start_s'] - .001 <= t < s['start_s'] + s['duration_s'] + .001)
            num = int(e['id'].rsplit('-', 1)[1])
            rewards.append({'shot_id': owner['id'], 'event_id': e['id'], 'at_s': round(t, 4),
                            'kind': REWARD_KIND[num] if sid not in ('s7', 's8', 's9') else ('evidence' if sid != 's9' else 'consequence'),
                            'visible_change': e['what'], 'event_fraction': .6})
    for use in [u for r in base[v]['story_art']['requests'] for u in r['action_uses']]:
        ev = next(e for s2 in scenes for e in s2['visual_events'] if e['id'] == use['event_id'])
        sc0 = next(s2 for s2 in scenes if s2['id'] == use['scene_id'])
        a0, a1 = sc0['start_s'] + ev['at_s'], sc0['start_s'] + ev['at_s'] + ev['duration_s']
        hosts = [x for x in shots if x['view'] == use['view'] and x['start_s'] - .001 <= a0 and a1 <= x['start_s'] + x['duration_s'] + .001]
        assert hosts, (v, use)
    rewards.sort(key=lambda r: r['at_s'])
    fd = b['film_direction']
    fd['shots'] = shots
    fd['rewards'] = rewards
    fd['renderer_inputs'] = modern_film.renderer_inputs('flood-station-v1')
    if v == 'b':
        fd['angle'] = 'The viewer starts on a disclosed design detail, the lowest optical lens going under at ankle height, then cuts on that height to a flooded yard with no station in it and the late phone.'
    # ---- story art: identical in both treatments; every scene uses both groups
    # story_art (requests and recorded entries) is left exactly as the director recorded it
    # ---- story contract: rows for nine scenes and their cuts
    sc = b['story_contract']
    sc['scenes'] = [{'scene_id': s['id'], 'role': CONTRACT_ROLE[s['id']], 'claim_ids': s['vo_claims'],
                     'advances': s['on_screen']} for s in scenes]
    tr = []
    for x, y in zip(scenes, scenes[1:]):
        tr.append({'from': x['id'], 'to': y['id'], 'kind': 'causal-consequence' if y['id'] in ('s5', 's6') else 'same-subject',
                   'because': {'s2': 'The yard the warning reached late leads to the station the researchers built.',
                               's3': 'The same station is climbed from its panel and battery down to the marks that watch the water.',
                               's4': 'The readings from the marks just lit run into the same station\'s chip.',
                               's5': 'The chip\'s risk judgment is what the same station\'s antenna sends.',
                               's6': 'The radio ring that reached the hub arrives as a station dot on its map.',
                               's7': 'After the map, the same design is measured only by its reported validation figure.',
                               's8': 'After the figure, the map shows where the station is installed, which is nowhere named.',
                               's9': 'After no town is named, the same map carries the goal the university states.'}[y['id']],
                   'visible_bridge': {'s2': 'The same brown flood water carries from the yard to the prototype standing at a curb.',
                                      's3': 'The same post and its lit first mark stay in frame.',
                                      's4': 'The same housing opens, with the marks\' readings arriving on its traces.',
                                      's5': 'The same station and its lit amber risk lamp send the rings.',
                                      's6': 'The amber ring and station dots carry onto the hub screen.',
                                      's7': 'The amber accent of the map carries onto the validation bar.',
                                      's8': 'The blank field card gives way to a map with nothing pinned.',
                                      's9': 'The same paper map on the same chain link fence stays in frame across the cut.'}[y['id']]})
    sc['transitions'] = tr
    # ---- cinematic contract, documentary, cinema
    cc = b['cinematic_contract']
    cc['throughline']['scene_ids'] = [s[0] for s in SCENES]
    if v == 'b':
        cc['throughline']['closing_state'] = 'Close on the paper map pinned to the fence, still with no installation named, a dashed goal pin hovers over an empty dashed spot and the deployment goal tag pins.'
    else:
        cc['throughline']['closing_state'] = 'At the empty curb after the flood, a dashed outline of the station draws itself where one could stand, beside the map on the fence with no installation named and a dashed goal pin.'
    b['documentary']['hook_payoff_event'] = 's1-event-1' if v == 'a' else 's1-event-0'
    # ---- creative direction: policy binding, ordered edits with sentence-to-shot, sound
    cd = b['creative_direction']
    cd['policy_sha256'] = sha(REPO / 'config/creative_production.json')
    edits = []
    for i, s in enumerate(scenes):
        chron = sorted(s['visual_events'], key=lambda e: e['at_s'])
        nxt = scenes[i + 1] if i + 1 < len(scenes) else None
        n = clauses_by_scene[s['id']]
        edits.append({'scene_id': s['id'], 'enter_on': chron[0]['what'], 'leave_on': chron[-1]['what'],
                      'cut_after_event_id': chron[-1]['id'],
                      'next_connection': (f"From {SUBJECT_TEXT[s['id']][v][0].lower() + SUBJECT_TEXT[s['id']][v][1:]} to {SUBJECT_TEXT[nxt['id']][v][0].lower() + SUBJECT_TEXT[nxt['id']][v][1:]}."
                                          if nxt else 'The film closes on the unlanded goal pin and the station still watching, then the sourced credits.'),
                      'sentence_to_shot': {'clause': s['vo'], 'subject': SUBJECT_TEXT[s['id']][v], 'relationship': s['on_screen'],
                                           'source_limit': b['story_contract']['source_limit']}})
    cd['edits'] = edits
    cd['sound'] = dict(SOUND, cues=[{k: c[k] for k in ('id', 'role', 'duration_s', 'intent', 'provenance') } | {'event_id': c['event']} | ({'gain': c['gain']} if 'gain' in c else {}) for c in CUE_SOUND])
    # ---- quality plan
    b['quality_plan'] = {'contract_sha256': sha(REPO / 'config/quality_contract.json'), 'scenes': [
        {'scene_id': s['id'], 'medium': 'diagram', 'subject': SUBJECT_TEXT[s['id']][v],
         'action': sorted(s['visual_events'], key=lambda e: e['at_s'])[0]['what'],
         'consequence': sorted(s['visual_events'], key=lambda e: e['at_s'])[-1]['what'],
         'source_basis': 'Claims ' + ', '.join(s['vo_claims']) + '. ' + b['story_contract']['source_limit'],
         'medium_evidence': 'Registered flood-station-v1 with the fresh authored FloodStationHero and StreetHubSupport groups performing board events on the film clock.'}
        for s in scenes]}
    # ---- attention beats, one per performed event
    beats = []
    for s in scenes:
        for e in sorted(s['visual_events'], key=lambda e: e['at_s']):
            beats.append({'id': e['id'] + '-attention', 'event_id': e['id'], 'item_ids': e['item_ids'],
                          'change_type': CHANGE_TYPE[s['id']], 'visible_change': e['what'], 'viewer_reward': e['what'],
                          'continuity_from': CARRY[s['id']] + '.', 'sound_action': SOUND_ACTION[s['id']]})
    b['attention_beats'] = beats
    # ---- art direction: subjects that exist, a flat shot for the new close scene
    ad = b['art_direction']
    ad['hero']['subject_ids'] = ['s2-panel', 's3-marks', 's4-chip', 's2-station']
    ad['flat_shots']['s9'] = dict(ad['flat_shots']['s8'])
    # ---- top-level hook mirrors the opening scene
    b['divergence_note'] = ('A opens wide in a flooded yard with no station and pushes in on the orange ankle mark, tilts up the prototype, climbs its column, enters its chip, '
        'follows the radio at street level into open country, reads the hub desk before its map, and closes at the empty curb where a dashed station outline draws itself. '
        'B opens on a disclosed design detail of the lowest lens going under, match cuts on ankle height to the same kind of yard, cranes down the prototype, holds the panel close through the tower beat, '
        'sees the readings arrive through the housing window from the street, reads the radio from above, the hub map before the desk, both cards side by side, and closes on the same map close up. '
        'Both perform every event in clause order; they differ in opening, staging, framing, camera and which view carries each clause.')
    b['hook_strategy'] = scenes[0]['hook_strategy']
    b['hook_payoff_s'] = 1.2
    return b


boards = {v: build(v) for v in 'ab'}
# story art must be identical in both treatments
assert boards['a']['story_art'] == boards['b']['story_art'] == base['a']['story_art']
assert all(boards[v]['native_media'] == base[v]['native_media'] and boards[v]['visual_research'] == base[v]['visual_research'] for v in 'ab')
for v in 'ab':
    text = json.dumps(boards[v], indent=1, ensure_ascii=False) + '\n'
    (D / f'opening-{v}.json').write_text(text)
(D / 'storyboard.json').write_text((D / 'opening-a.json').read_text())
for v in 'ab':
    for sh in boards[v]['film_direction']['shots']:
        for edge in (sh['start_s'], sh['start_s'] + sh['duration_s']):
            assert abs((edge * 30) % 1 - .5) > .1, (v, sh["id"], edge)
print('written', {v: hashlib.sha256((D / f'opening-{v}.json').read_bytes()).hexdigest() for v in 'ab'})
