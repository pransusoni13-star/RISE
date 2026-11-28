import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function harness() {
  const data=new Map(), secure=new Map(), modules=new Map();
  const failRead=new Set(), failWrite=new Set();
  let secureFailure=false;
  let cloud=null;
  let memberLocked=false;
  const progressEvents=[];
  const storage={
    getItem:async key=>{if(failRead.has(key)) throw new Error('read failed'); return data.get(key)??null;},
    setItem:async(key,value)=>{if(failWrite.has(key)) throw new Error('write failed'); data.set(key,value);},
    removeItem:async key=>{if(failWrite.has(key))throw new Error('remove failed');data.delete(key);},
  };
  const nativeSecure={
    WHEN_UNLOCKED_THIS_DEVICE_ONLY:'device-only',
    getItemAsync:async key=>{if(secureFailure) throw new Error('secure storage unavailable');return secure.get(key)??null;},
    setItemAsync:async(key,value)=>{if(secureFailure)throw new Error('secure storage unavailable');secure.set(key,value);},
    deleteItemAsync:async key=>{if(secureFailure)throw new Error('secure storage unavailable');secure.delete(key);},
  };
  function load(name) {
    if(modules.has(name))return modules.get(name);
    const exports={};modules.set(name,exports);
    const source=ts.transpileModule(readFileSync(new URL(`../src/services/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    vm.runInNewContext(source,{exports,console,require:dependency=>{
      if(dependency==='@react-native-async-storage/async-storage')return {__esModule:true,default:storage};
      if(dependency==='react-native')return {Platform:{OS:'ios'}};
      if(dependency==='expo-secure-store')return nativeSecure;
      if(dependency==='./auth')return {syncUserProfile:async()=>{},getCloudProfile:async()=>cloud,isMemberDataLocked:async()=>memberLocked,recordProgressEvent:async event=>{progressEvents.push(event);}};
      assert.match(dependency,/^\.\/[\w]+$/);
      return load(dependency.slice(2));
    }});
    return exports;
  }
  return {load,data,secure,failRead,failWrite,progressEvents,setLocked:value=>{memberLocked=value;},setSecureFailure:value=>{secureFailure=value;},setCloud:value=>{cloud=value;}};
}

test('both progress entry points preserve unreadable data instead of inventing zero XP',async()=>{
  const h=harness(), engine=h.load('progressEngine'), repo=h.load('progressRepository').progressRepository;
  for(const raw of ['{broken','null','[]','{}','{"totalXP":"broken"}']) {
    h.data.set('RISE_PROGRESS',raw);
    await assert.rejects(engine.progressRepository.load());
    await assert.rejects(repo.update(current=>({...current,coins:10})));
    assert.equal(h.data.get('RISE_PROGRESS'),raw);
  }
  h.data.delete('RISE_PROGRESS');h.failRead.add('RISE_PROGRESS');
  await assert.rejects(repo.load(),/read failed/);
  h.failRead.clear();
  assert.equal((await repo.load()).totalXP,0);
});

test('concurrent XP and coin mutations share one queue across both repository imports',async()=>{
  const h=harness(), engine=h.load('progressEngine'), repo=h.load('progressRepository').progressRepository;
  await Promise.all(Array.from({length:20},(_,i)=>(i%2?repo:engine.progressRepository).update(current=>engine.addXP(current,10,'proof',`Attempt ${i}`,2,{source:`attempt-${i}`}))));
  const saved=await repo.load();
  assert.equal(saved.totalXP,200);assert.equal(saved.coins,40);assert.equal(saved.events.length,20);
  h.failWrite.add('RISE_PROGRESS');
  await assert.rejects(repo.update(current=>({...current,coins:0})),/write failed/);
  h.failWrite.clear();
  await repo.update(current=>({...current,coins:current.coins+1}));
  assert.equal((await repo.load()).coins,41);
});

test('reward persistence cannot grant a badge before payment or charge twice after a marker failure',async()=>{
  const h=harness(), engine=h.load('progressEngine'), rewards=h.load('rewards');
  const reward=rewards.COIN_REWARDS[0];
  await engine.progressRepository.save({...engine.createDefaultProgress(),coins:100});
  h.failWrite.add('RISE_PROGRESS');
  await assert.rejects(rewards.redeemCoinReward(reward),/write failed/);
  assert.equal(h.data.has('RISE_REWARD_REDEMPTIONS'),false);
  h.failWrite.clear();h.failWrite.add('RISE_REWARD_REDEMPTIONS');
  await assert.rejects(rewards.redeemCoinReward({...reward,cost:0}),/write failed/);
  assert.equal((await engine.progressRepository.load()).coins,75);
  h.failWrite.clear();
  const retried=await rewards.redeemCoinReward(reward);
  assert.equal(retried.reason,'already');assert.equal(retried.progress.coins,75);
  assert.deepEqual(JSON.parse(h.data.get('RISE_REWARD_REDEMPTIONS')),[reward.id]);
});

test('cloud restoration keeps protected preferences out of ordinary profile storage',async()=>{
  const h=harness(), profile=h.load('personalization');
  h.secure.set('RISE_SENSITIVE_PROFILE',JSON.stringify({spiritualTradition:'Private tradition',trustedSources:'Private guidance'}));
  h.setCloud({selected_goals:['music'],custom_goal:'Practise piano',focus_skills:['Rhythm']});
  const restored=await profile.hydrateProfileFromCloud();
  assert.equal(restored.spiritualTradition,'Private tradition');
  const ordinary=JSON.parse(h.data.get('RISE_PERSONALIZATION'));
  assert.equal('spiritualTradition' in ordinary,false);assert.equal('trustedSources' in ordinary,false);
  assert.equal(JSON.parse(h.secure.get('RISE_SENSITIVE_PROFILE')).trustedSources,'Private guidance');
});

test('failed protected migration keeps the legacy copy and profile updates preserve concurrent fields',async()=>{
  const h=harness(), profile=h.load('personalization');
  const raw=JSON.stringify({selectedGoals:['music'],customGoal:'Practise piano',spiritualTradition:'Private tradition'});
  h.data.set('RISE_PERSONALIZATION',raw);h.setSecureFailure(true);
  await assert.rejects(profile.loadProfile(),/secure storage unavailable/);
  assert.equal(h.data.get('RISE_PERSONALIZATION'),raw);
  await assert.rejects(profile.updateProfile({lastBlocker:'time'}));
  assert.equal(h.data.get('RISE_PERSONALIZATION'),raw);
  h.setSecureFailure(false);
  await Promise.all([profile.updateProfile({lastBlocker:'time'}),profile.updateProfile({lastMissionUseful:false})]);
  const saved=await profile.loadProfile();
  assert.equal(saved.lastBlocker,'time');assert.equal(saved.lastMissionUseful,false);
  assert.equal('spiritualTradition' in JSON.parse(h.data.get('RISE_PERSONALIZATION')),false);
});

test('partial migrations retain both protected fields and malformed preferences remain deletable',async()=>{
  const h=harness(), profile=h.load('personalization'), sensitive=h.load('sensitiveStorage');
  h.data.set('RISE_PERSONALIZATION',JSON.stringify({selectedGoals:['music'],trustedSources:'Legacy private guidance'}));
  h.secure.set('RISE_SENSITIVE_PROFILE',JSON.stringify({spiritualTradition:'Protected tradition'}));
  const loaded=await profile.loadProfile();
  assert.equal(loaded.spiritualTradition,'Protected tradition');assert.equal(loaded.trustedSources,'Legacy private guidance');
  h.secure.set('RISE_SENSITIVE_PROFILE','{broken');
  await assert.rejects(sensitive.loadSensitiveProfile());
  assert.equal(await sensitive.deleteSensitiveProfile(),true);
  assert.equal(h.secure.has('RISE_SENSITIVE_PROFILE'),false);
});

test('unreadable profile and reward markers cannot be replaced by defaults during an update',async()=>{
  const h=harness(), profile=h.load('personalization'), engine=h.load('progressEngine'), rewards=h.load('rewards');
  for(const raw of ['{broken','{}','[]','{"selectedGoals":4}','{"customGoal":{}}']) {
    h.data.set('RISE_PERSONALIZATION',raw);
    await assert.rejects(profile.updateProfile({availableTime:'10 minutes'}));
    assert.equal(h.data.get('RISE_PERSONALIZATION'),raw);
  }
  h.failRead.add('RISE_PERSONALIZATION');
  await assert.rejects(profile.hasSavedProfile(),/read failed/);
  await engine.progressRepository.save({...engine.createDefaultProgress(),coins:100});
  h.data.set('RISE_REWARD_REDEMPTIONS','{broken');
  await assert.rejects(rewards.redeemCoinReward(rewards.COIN_REWARDS[0]));
  assert.equal((await engine.progressRepository.load()).coins,100);
  assert.equal(h.data.get('RISE_REWARD_REDEMPTIONS'),'{broken');
});

async function taskHarness() {
  const h=harness();
  await h.load('consentRepository').consentRepository.save();
  const profile=await h.load('personalization').updateProfile(h.load('quickStart').quickStartProfile('study',5));
  const plan=h.load('missionPlanner').createSevenDayPlan(profile);
  return {...h,plan,missions:h.load('missionRepository').missionRepository,completion:h.load('missionCompletion'),engine:h.load('progressEngine')};
}

test('a task completes without a required note or media and repeated taps cannot repeat rewards',async()=>{
  const h=await taskHarness(), mission=h.plan[0];
  await h.missions.patch(mission.id,{completedSteps:mission.steps.map((_,index)=>index),status:'proof_required'});
  const results=await Promise.all(Array.from({length:3},()=>h.completion.completeMission(mission.id,'')));
  assert.equal(results.reduce((sum,result)=>sum+result.xp,0),mission.reward);
  const saved=await h.missions.get(mission.id);
  assert.equal(saved.status,'completed');assert.equal(saved.reflection,'');assert.equal(saved.proof.type,'text');assert.equal(saved.proof.uri,'');
  assert.equal((await h.engine.progressRepository.load()).events.length,1);
  assert.equal(h.progressEvents.length,1);
});

test('quick completion still enforces steps, daily locks, consent and retained account ownership',async()=>{
  const h=await taskHarness();
  await assert.rejects(h.completion.completeMission(h.plan[0].id,''),/Finish each task step/);
  await h.missions.patch(h.plan[1].id,{completedSteps:[0,1]});
  await assert.rejects(h.completion.completeMission(h.plan[1].id,''),/daily wait/);
  await h.missions.patch(h.plan[0].id,{completedSteps:[0,1]});
  h.setLocked(true);
  await assert.rejects(h.completion.completeMission(h.plan[0].id,''),/account that owns/);
  h.setLocked(false);h.data.delete('RISE_CONSENT');
  await assert.rejects(h.completion.completeMission(h.plan[0].id,''),/privacy and age/);
  assert.equal((await h.engine.progressRepository.load()).totalXP,0);
});

test('retry after a failed completion record preserves the reward once and keeps private notes out of sync',async()=>{
  const h=await taskHarness(), mission=h.plan[0];
  await h.missions.patch(mission.id,{completedSteps:[0,1]});
  h.failWrite.add('RISE_MISSION_RECORDS');
  await assert.rejects(h.completion.completeMission(mission.id,'A private note.'),/write failed/);
  h.failWrite.clear();
  assert.equal((await h.completion.completeMission(mission.id,'A private note.')).xp,0);
  assert.equal((await h.engine.progressRepository.load()).totalXP,mission.reward);
  assert.equal((await h.missions.get(mission.id)).reflection,'A private note.');
  assert.equal(JSON.stringify(h.progressEvents).includes('A private note.'),false);
});
