// Exact declaration comparison protects the approved physical action during extraction.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const declarations=(file)=>{
 const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const out=new Map();
 for(const statement of source.statements){
  if(ts.isVariableStatement(statement))for(const declaration of statement.declarationList.declarations){
   if(ts.isIdentifier(declaration.name))out.set(declaration.name.text,statement.getText(source));
  }
  if(ts.isTypeAliasDeclaration(statement))out.set(statement.name.text,statement.getText(source));
 }
 return out;
};
const old=declarations('src/BrushCameraEpisode.tsx');
const current=declarations('src/lib/production/ProvenActions.tsx');
assert.ok(current.size>20,'all action dependencies must travel with the action');
for(const [name,body] of current)assert.equal(body,old.get(name),'approved declaration changed: '+name);
for(const name of ['Street','NoticeQueue','DebrisCapture','CapturedDebrisAnalysis'])assert.ok(current.has(name));
for(const name of ['Cleanup','SiteInspection','EncounterHand','Body'])assert.ok(!current.has(name),'rejected performance must stay outside the daily library');
const route=readFileSync('src/DailyActionsEpisode.tsx','utf8');
for(const name of ['StreetCapture','DocumentAccumulation','CurbCapture','ConditionSelection'])
 assert.match(route,new RegExp('<'+name+'\\b'),'the route must call '+name);
assert.match(route,/CinematicStage/);
assert.match(route,/SubtitleTrack cues=\{captions\} fps=\{fps\}/);
console.log('proven actions: exact approved declarations, dependency closure, retired-rig exclusion and real renderer calls pass');
