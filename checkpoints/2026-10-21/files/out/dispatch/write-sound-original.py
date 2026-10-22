import json,pathlib,hashlib,re,yaml
root=pathlib.Path(__file__).resolve().parents[2]
packet=json.load(open(root/'out/dispatch/codex-sound-final-packet.json'))
board=json.load(open(packet['board']['path']))
film=packet['film']['sha256']
f1='At 6.68 to 8.74 seconds, n2a says The companies say AI alerts, but the picture only loads a neutral survey-flight display. The blue anomaly alert is absent throughout that clause and first becomes visible around 9.6 seconds in n2b. The narrated alert action is delayed beyond its measured clause window.'
f2='At 12.42 to 19.7 seconds, the approval scene trails the spoken referents. The September 30th, 2025 clause ends at 14.7 before the date impression appears around 16.4. The approval verb ends at 17.22 while only the date stamp has landed, and the Air Max clause at 17.48 to 19.7 has no pictured drone or identifying Air Max text. The Approved impression becomes readable around 20.2. Generic document handling does not supply these clause-specific subjects and changes.'
observations=[
'The enclosure opens at the illustrated Permian equipment site while the setting is stated.',
'The drone lifts and cruises over the pad; the map draws Permian Basin and Austin pins during this clause.',
f1,
'The blue anomaly flag grows beside pump pressure and the companies-say attribution tag attaches before the clause ends.',
'The letter enters without its date. The date is only stamped later, around 16.4 seconds.',
'The date stamp lands during the approval clause. The Approved mark has not landed by 17.22 seconds.',
'Only a dated generic letter and descending stamp are pictured. No drone or identifying Air Max text is present in this named-system clause.',
'The stamp lifts and reveals Approved beside Periodic methane screening, completing the pictured scope.',
'The same generic drone hovers with its dark camera pod underneath; the closer cut exposes its lens assembly.',
'The drone moves between dashed waypoints, reaches a highlighted ring and reveals an illustrative infrared valve inset.',
'A seated inspector faces the monitor as the same illustrative valve footage loads and remains visible.',
'The inspector moves the stylus around the plume, completing a dashed ring and green confirmation.',
'The inspector transfers a follow-up inspection tag from the monitor toward the physical-valve inset.',
'The letter scrolls to its protocol-title block, highlights AI and attaches a once-in-a-title callout.',
'A separate-program disclosure and certified-third-party reporting tag establish the new subject, with its calendar.',
'The calendar retains January 22, 2027 while the gold Delayed strip attaches to the reporting tag.',
'The calendar flips to October 7, an EPA release card arrives and an unstamped proposal tag clips to the same delayed program.',
'The inspector points at the circled plume and green confirmation while the empty AI box begins drawing.',
'The empty AI box remains beside confirmed footage and the human reviewer. A wider shot shows the dock outside without inventing a repair.'
]
failed={'n2a','n3a','n3b','n3c'}
modern={'film_sha256':film}
for key,passed,start,end,observed in [
('first_frame',True,0,1.4,'The dock begins opening by 0.8 seconds and exposes the drone by 1.2. The first frame is a quiet wide equipment setup, so the hook is modest.'),
('visual_progression',False,6.68,19.7,'The overall drone-to-record-to-inspector chain is recognizable, but neutral monitor loading under n2a and delayed date/approval staging in n3a to n3c fail exact clause picture progression.'),
('shot_variety',True,0,53.62,'Yard wide, monitor medium, close drone camera, letter closeup, inspector interaction and title detail provide useful scale changes.'),
('performed_turn',True,27.08,33.82,'The inspector traces the plume boundary, confirms it and transfers a follow-up tag toward the valve. A human action produces the depicted decision.'),
('pace',True,0,56.32,'Dock opening, launch, map connection, flag, stamps, route stop, inspector trace, title highlight and calendar changes provide successive developments. The final hold is deliberate resolution time.'),
('closing_answer',True,48.04,56.32,'The human confirmation holds beside the empty AI box, then the view widens to the dock. The answer preserves the unknown software contribution and claims no completed repair.'),
('finished_art',True,0,56.32,'Native samples show recognizable drone hardware, layered steel, supported monitor and stylus contact. Broad empty desk space weakens composition without making objects unrecognizable.')]:modern[key]={'pass':passed,'start_s':start,'end_s':end,'observed':observed}
axes={'hook':6.4,'story':7.5,'picture':6.5,'place':7.8,'craft':7.1,'voice':7.4}
weights=yaml.safe_load(open(root/'config/dispatch_rubric.yaml'))['rubric']['axes']
report={
'score':round(sum(axes[k]*weights[k]['weight'] for k in axes),3),'ship':False,'verdict':'REVISE','axes':axes,
'hard_fails':[f1,f2],'defects':[f1,f2],'weakest_axis':'hook',
'one_sentence_fix':'Stage the alert during n2a, show the date during n3a, perform the approval during n3b, and retain an identifiable disclosed drone subject during n3c while preserving the measured voice and caption clock.',
'reviewer_identity':'Codex sound scorer /root/sound_score_21, session 01a161da-5936-7ba3-ad86-eaf7742e1ac1, gpt-6.1-sol medium, packet d019bc294ac29ec42b4ebfb3df9310c09964409670353f304bc8b283628d2052',
'audiovisual_role':'sound','audiovisual_receipt_sha256':packet['av_receipt']['sha256'],
'packet_sha256':'d019bc294ac29ec42b4ebfb3df9310c09964409670353f304bc8b283628d2052',
'film_sha256':film,'story_sha256':packet['story_sha256'],'board_sha256':packet['board']['sha256'],'claims_sha256':packet['claims']['sha256'],
'quality_contract_sha256':'f54137adf7cf5181ff077cb8b9fd85a44131cee44b1fb8139def2f12a088fdfa',
'rubric_sha256':'51f9708042386bd74b35e455e06140dd9b126affea9164b159c88302f1788ca1',
'visual_basis':'All 62 ordered film-decoded pages, five samples per second plus final frame, viewed at original detail with immediate public annotations, plus three native samples, attention sheet and feed composite. No direct playback or listening.',
'audio_basis':'Own complete-film Gemini sound receipt and concatenated original raw response, plus mix.json and measured captions. Provider listening is distinct from this reviewer image access.',
'provider_corrections':[
'The sound response places the alert at 7.5/8.4 seconds. The visible monitor has no alert at 8.8; the flag becomes visible around 9.6. The mix cue begins 9.1.',
'The provider dates the stamp sound at 15.6 and calendar flip at 42.2; mix.json anchors those cues at 16.02 and 40.2355. The provider claim of precise foley contact is coarse evidence, not exact sync proof.',
'The provider places narration end at 56.5. The final measured caption ends at 53.62, so 56.5 describes the credit-transition vicinity rather than the speech endpoint.'
],
'limitations':[
'No personal direct MP4 playback or listening. Five sampled frames per second do not prove every 30fps motion join.',
'Native detail was inspected through three original full-resolution proof samples. No separate crop files were present.',
'The raw provider content was read by concatenating its actual text chunks. Stream wrappers and signatures are transport metadata.',
'The original helper refused all 67 image pairs because it expects exactly the 62 chronological pages. The interim chronological-only mechanical check passed; the complete unfiltered public export and refusal remain preserved for the owning helper correction.'
],
'attention_review':{'film_sha256':film,'pass':False,
'hook_observed':'The dock opens around 0.8 seconds and reveals the drone by 1.2, then the drone lifts around 2.8.',
'continuity_observed':'The same drone and yard survive launch and route cuts. The illustrative valve plume passes from the infrared inset at 26.2 into review footage at 27.6. The separate program is explicitly disclosed at 38.4.',
'pacing_observed':'The film develops through launch, map pins, monitor loading, flag, stamps, route and inspector marking. The alert and record referents are staged later than their spoken clauses; faster speech would worsen that mismatch.',
'comprehension_observed':'The complete film communicates that an inspector confirms emissions and the letter leaves AI contribution unspecified. Exact clause comprehension fails where neutral status rows accompany AI alerts and stamps trail the date, approval and named-system clauses.',
'remembered_image':'The inspector stylus circling the plume and green confirmation, later beside the empty AI box, carries the human decision and source limit.',
'weakest_interval':'12.42 to 19.7 seconds. Date, approval action and named system trail or lack their matching picture. Synchronize this record sequence to those clauses and retain an identifiable drone subject.',
'weakest_at_s':12.42,'weakest_end_s':19.7,'audio_basis':'Assigned independent Gemini sound observation and measured mix/caption evidence; no personal listening.'},
'modern_observations':modern,
'narration_picture_observations':{'film_sha256':film,'clauses':[{'id':c['id'],'text':c['text'],'pass':c['id'] not in failed,'start_s':c['start_s'],'end_s':c['end_s'],'observed':o} for c,o in zip(board['narration_picture']['clauses'],observations,strict=True)]},
'bounded_release':{'schema':'dispatch_creative_assessment/1','scope':'panel','retained_checks':{
'source':{'pass':True,'observed':'All five hash-verified source snapshots were read, including EPA method 12.1. Claims retain company attribution and distinguish the separate program from approved periodic screening.'},
'rights':{'pass':True,'observed':'Current authored hero/support provenance and illustration disclosures describe generic equipment and inspector. No agency seal or external photograph appears; credits attribute music.'},
'legibility':{'pass':True,'observed':'Phone sequence and native samples keep captions, stamps, inspector mark, title and calendar readable. The entering proposal tag settles before its clause ends.'},
'comprehension':{'pass':False,'observed':f1+' '+f2},
'technical_audio':{'pass':True,'observed':'Own provider reports clean unclipped speech and balanced music. Mix reports -16.08 LUFS, -1.99 dBTP, unchanged 2943360 samples at 48kHz and time_stretch 1.0. Provider timestamps remain coarse evidence.'},
'captions':{'pass':True,'observed':'Measured cue boundaries cover all 128 acoustic words. Visible caption changes follow those supplied windows, with no evidenced hand shift or speech stretch.'}},
'defects':[{'finding':f1,'category':'comprehension'},{'finding':f2,'category':'comprehension'}]},
'image_coverage':json.load(open(root/'out/dispatch/codex-sound-public-coverage/codex-image-coverage.json')),
'supplementary_public_evidence':{'path':str(root/'out/dispatch/codex-sound-public-coverage/all-public-image-events.json'),'sha256':'37ee0c59025d2d132c52b1d1df51a3fb4cca75e6051bb930f0cd532426a1d749','image_count':67},
'full_export_verification':'Pending owning-helper support for supplementary images. Original refusal preserved.'
}
f=root/'out/dispatch/codex-sound-original-report.json'
f.write_text(json.dumps(report,indent=2)+'\n')
assert not re.search(r'\b(?:matter|matters|mattered|mattering)\b',f.read_text(),re.I)
print(f,hashlib.sha256(f.read_bytes()).hexdigest(),report['score'])
