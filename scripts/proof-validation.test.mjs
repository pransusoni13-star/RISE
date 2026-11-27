import test from 'node:test';
import assert from 'node:assert/strict';
import { isProofUriReused, reflectionQuality, validateProofAsset, reviewProof } from '../src/services/proofValidation.ts';

test('a short completion claim is not a reflection', () => {
  assert.equal(reflectionQuality('I finished it.').passed, false);
});

test('two substantial sentences satisfy the reflection format', () => {
  assert.equal(reflectionQuality('I built a calculator and tested each button with several different numbers. I learned to handle invalid input and will improve the error messages next.').passed, true);
});

test('oversized and unsupported proof files are rejected', () => {
  assert.equal(validateProofAsset({type:'photo',uri:'file:///proof.jpg',fileSize:26*1024*1024}).allowed, false);
  assert.equal(validateProofAsset({type:'video',uri:'file:///proof.exe',fileName:'proof.exe'}).allowed, false);
  assert.equal(validateProofAsset({type:'photo',uri:'file:///proof.jpg',mimeType:'text/html'}).allowed, false);
});

test('supported screenshot file is accepted by file validation', () => {
  assert.equal(validateProofAsset({type:'photo',uri:'file:///proof.png',fileName:'proof.png',mimeType:'image/png',fileSize:1024}).allowed, true);
});

test('proof cannot pass without an attachment and attestations', () => {
  assert.equal(reviewProof({asset:null,reflection:'I finished it.',proofDescription:'',missionContext:'calculator',matchesMission:false,ownsWork:false}).passed, false);
});

test('the same local attachment cannot prove two different missions', () => {
  const records = [{ missionId: 'mission-one', proof: { uri: 'file:///proof.jpg' } }];
  assert.equal(isProofUriReused(records, 'file:///proof.jpg', 'mission-two'), true);
  assert.equal(isProofUriReused(records, 'file:///proof.jpg', 'mission-one'), false);
  assert.equal(isProofUriReused(records, 'file:///new.jpg', 'mission-two'), false);
});

test('proof rejects unreadable sizes, malformed metadata, and remote URLs', () => {
  const valid = {type:'photo',uri:'file:///proof.jpg',fileSize:20_000,width:400,height:400};
  for (const fileSize of [undefined, null, NaN, Infinity, -1, 0, 1.5]) {
    assert.equal(validateProofAsset({...valid,fileSize}).allowed, false, String(fileSize));
  }
  for (const uri of ['https://example.com/tracker.jpg','javascript:alert(1)','']) {
    assert.equal(validateProofAsset({...valid,uri}).allowed, false);
  }
  for (const changes of [{width:NaN},{height:Infinity},{duration:-1}]) {
    assert.equal(validateProofAsset({...valid,...changes}).allowed, false);
  }
  assert.equal(validateProofAsset({...valid,uri:'blob:https://rise.example/owned-file'}).allowed, true);
});
