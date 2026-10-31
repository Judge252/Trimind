import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newAssessment, questionsFor, setAssessmentAnswer, submitAssessment, scoreAssessment} from '../src/logic/assessment';
import {validDraft, validSubmission, hydratePlanning} from '../src/services/planning-storage';
import {buildDemoPlan,validatePlanResult} from '../src/logic/planning';
import {courses} from '../src/content/courses';
import {aiRequest,compileRecommendation} from '../server/ai';
function complete(ambition='build') {
 let d=newAssessment();
 for(const [key,value] of Object.entries({ambition,experience:'practical',motivation:'career',preference:'practice',availability:'light',challenge:'consistency'})) d=setAssessmentAnswer(d,key,value);
 const q=questionsFor(d).find(q=>q.track)!;
 return setAssessmentAnswer(d,q.id,q.correctOptionId!);
}
test('discovery has exactly seven bilingual questions and only one relevant scenario per track',()=>{
 for(const [goal,track] of [['build','builder'],['business','founder'],['money','investor'],['explore','builder']]) {
  const d=complete(goal),q=questionsFor(d);assert.equal(q.length,7);assert.equal(q.filter(q=>q.track).length,1);assert.equal(q.find(q=>q.track)?.track,track);assert.ok(q.every(q=>q.title.en&&q.title.ar));assert.ok(validDraft(d));assert.ok(validSubmission(submitAssessment(d)));
 }
});
test('one correct answer and claimed practical experience never imply demonstrated proficiency',()=>{
 const d=complete(); const points=scoreAssessment(d);assert.equal(points.find(p=>p.track==='builder')?.correct,1);assert.ok(points.every(p=>p.level!=='ready'));assert.equal(points.find(p=>p.track==='investor')?.total,0);
});
test('changing ambition drops the hidden scenario from submission without reinterpreting it',()=>{
 const d=setAssessmentAnswer(complete(),'ambition','money');const s=submitAssessment(d);assert.ok(!s.answers['discovery-builder-task']);assert.equal(scoreAssessment(s).find(p=>p.track==='investor')?.answered,0);
});
test('discovery compiles canonical prerequisites and real capacity with minimal AI inputs',()=>{
 for(const goal of ['build','business','money']){
  const s=submitAssessment(complete(goal));const {base,messages}=aiRequest(s,'ar');assert.equal(base.learningPlan.sessionMinutes,20);assert.equal(base.learningPlan.daysPerWeek,2);assert.ok(base.learnerProfile.discovery);assert.ok(validatePlanResult(base,courses));
  const p=compileRecommendation(base,{primaryPath:base.learningPlan.primaryPath,activityOrder:base.learningPlan.activities.map(a=>a.id),summary:{en:'A practical beginner journey based on your interests.',ar:'رحلة عملية للمبتدئين مبنية على اهتماماتك ووقتك.'},reasons:[{en:'A small sample cannot establish proficiency.',ar:'لا يمكن لعينة صغيرة أن تثبت الإتقان الكامل.'},{en:'Short sessions support your weekly availability.',ar:'جلسات قصيرة تدعم الوقت المتاح لك كل أسبوع.'}]});assert.equal(p.learningPlan.source,'server');assert.ok(messages[1].content.includes('statedExperience'));assert.ok(!messages[1].content.includes(s.id));
 }
});
test('assessment versions remain separate; legacy drafts survive hydration unchanged',()=>{
 const legacy=newAssessment('assessment-1');assert.equal(questionsFor(legacy).length,20);assert.deepEqual(hydratePlanning({schemaVersion:1,draft:legacy,submissions:[],plans:[]}).draft,legacy);
 assert.equal(validDraft({...complete(),assessmentVersion:'assessment-99'}),false);
 assert.equal(validDraft({...complete(),assessmentVersion:'assessment-1'}),false);
});
