# R12 diff: accepted board bytes (25e8ae1d, authored timing, runtime 54.1) to the R12 measured diagnostic board

runtime_s 54.1 -> 59.4

## Scenes (start, duration)
- s1: 0.0 / 7.76 -> 0.0 / 8.68; events ['s1-event-1', 's1-event-2', 's1-event-3'] -> ['s1-event-1', 's1-event-2', 's1-event-3']
- s2: 7.76 / 6.8 -> 8.68 / 6.94; events ['s2-event-1', 's2-event-2', 's2-event-3'] -> ['s2-event-1', 's2-event-2', 's2-event-3']
- s3: 14.56 / 3.56 -> 15.62 / 4.04; events ['s3-event-1', 's3-event-2', 's3-event-3'] -> ['s3-event-1', 's3-event-2', 's3-event-3']
- s4: 18.12 / 7.44 -> 19.66 / 7.42; events ['s4-event-1', 's4-event-2', 's4-event-3'] -> ['s4-event-1', 's4-event-2', 's4-event-3']
- s5: 25.56 / 8.08 -> 27.08 / 8.18; events ['s5-event-1', 's5-event-2', 's5-event-3'] -> ['s5-event-1', 's5-event-2', 's5-event-3']
- s6: 33.64 / 4.52 -> 35.26 / 5.68; events ['s6-event-1', 's6-event-2', 's6-event-3'] -> ['s6-event-1', 's6-event-2', 's6-event-3']
- s7: 38.16 / 8.76 -> 40.94 / 8.26; events ['s7-event-1', 's7-event-2', 's7-event-3'] -> ['s7-event-1', 's7-event-2', 's7-event-3']
- s8: 46.92 / 3.24 -> 49.2 / 6.3; events ['s8-event-1', 's8-event-2', 's8-event-3'] -> ['s8-event-0', 's8-event-1', 's8-event-2', 's8-event-3']
- s9: 50.16 / 3.94 -> 55.5 / 3.9; events ['s9-event-1', 's9-event-2', 's9-event-3'] -> ['s9-event-1', 's9-event-2', 's9-event-3']

## Clauses
- n1a (s1) 0.58-3.58 events ['s1-event-1', 's1-event-2'] subjects ['s1-water']: Some people could have ankle-deep water in their yard.
- n1b (s1) 4.24-8.28 events ['s1-event-3'] subjects ['s1-water']: UT San Antonio says the phone warning can come after that.
- n2a (s2) 8.96-11.22 events ['s2-event-1'] subjects ['s2-station', 's2-panel']: So its researchers built a flood station.
- n2b (s2) 11.9-14.96 events ['s2-event-2', 's2-event-3'] subjects ['s2-station', 's2-panel']: It charges itself from light and needs no cell tower.
- n3a (s3) 15.9-19.14 events ['s3-event-1', 's3-event-2', 's3-event-3'] subjects ['s3-stack']: Four optical sensors at different heights watch the water.
- n4a (s4) 19.94-23.18 events ['s4-event-1'] subjects ['s4-chip', 's4-traces']: A small chip on the station runs the AI itself.
- n4b (s4) 23.8-26.52 events ['s4-event-2', 's4-event-3'] subjects ['s4-chip', 's4-traces']: So it judges flood risk without a central server.
- n5a (s5) 27.36-30.7 events ['s5-event-1', 's5-event-2'] subjects ['s5-ring', 's5-tags']: Its radio signal can carry more than a half-mile in streets.
- n5b (s5) 31.56-34.74 events ['s5-event-3'] subjects ['s5-ring', 's5-tags']: In open country, up to five miles, to a hub.
- n6a (s6) 35.54-40.24 events ['s6-event-1', 's6-event-2', 's6-event-3'] subjects ['s6-dashboard', 's6-paths']: At the hub, a second, larger AI maps flood paths for responders.
- n7a (s7) 41.22-44.52 events ['s7-event-1'] subjects ['s7-card', 's7-blank']: The university reports early chip AI validation.
- n7b (s7) 45.24-48.48 events ['s7-event-2', 's7-event-3'] subjects ['s7-card', 's7-blank']: Accuracy was ninety eight point eight two percent.
- n8a (s8) 49.48-51.82 events ['s8-event-0'] subjects ['s8-valcard', 's8-blank']: The announcement reports no field result.
- n8b (s8) 52.5-54.8 events ['s8-event-1', 's8-event-2', 's8-event-3'] subjects ['s8-map', 's8-nopin']: It names no town with an installed station.
- n9a (s9) 55.78-57.36 events ['s9-event-1', 's9-event-2', 's9-event-3'] subjects ['s9-goal', 's9-map']: Deployment is still the goal.

## Shots
- s1-shot-1 s1 street-yard wide 0.0 +3.91 ['n1a']
- s1-shot-2 s1 phone-late close 3.91 +4.77 ['n1b']
- s2-shot-1 s2 station-wide wide 8.68 +2.880000000000001 ['n2a']
- s2-shot-2 s2 panel-charge close 11.56 +2.0299999999999994 ['n2b']
- s2-shot-3 s2 no-tower wide 13.59 +2.0299999999999994 ['n2b']
- s3-shot-1 s3 sensor-stack medium 15.62 +1.3467000000000002 ['n3a']
- s3-shot-2 s3 water-marks close 16.9667 +1.3466000000000022 ['n3a']
- s3-shot-3 s3 weather-row close 18.3133 +1.3466999999999985 ['n3a']
- s4-shot-1 s4 chip-glow close 19.66 +3.8299999999999983 ['n4a']
- s4-shot-2 s4 chip-glow detail 23.49 +1.7950000000000017 ['n4b']
- s4-shot-3 s4 no-server wide 25.285 +1.7949999999999982 ['n4b']
- s5-shot-1 s5 radio-rings wide 27.08 +4.050000000000001 ['n5a']
- s5-shot-2 s5 radio-open wide 31.13 +4.129999999999999 ['n5b']
- s6-shot-1 s6 hub-desk close 35.26 +2.8400000000000034 ['n6a']
- s6-shot-2 s6 flood-paths overhead 38.1 +2.8399999999999963 ['n6a']
- s7-shot-1 s7 validation-card close 40.94 +3.940000000000005 ['n7a']
- s7-shot-2 s7 validation-card detail 44.88 +4.32 ['n7b']
- s8-shot-1 s8 no-field-card detail 49.2 +2.9599999999999937 ['n8a']
- s8-shot-2 s8 empty-map close 52.16 +3.3400000000000034 ['n8b']
- s9-shot-1 s9 station-return wide 55.5 +3.8999999999999986 ['n9a']
