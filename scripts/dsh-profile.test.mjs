import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveDshProfile } from '../src/host.js'

test('unset / missing DSH_PROFILE → web', () => {
  assert.equal(resolveDshProfile({}), 'web')
  assert.equal(resolveDshProfile({ OTHER: 'x' }), 'web')
})

test('empty string → web', () => {
  assert.equal(resolveDshProfile({ DSH_PROFILE: '' }), 'web')
})

test('whitespace only → web', () => {
  assert.equal(resolveDshProfile({ DSH_PROFILE: '   ' }), 'web')
})

test('desktop → desktop', () => {
  assert.equal(resolveDshProfile({ DSH_PROFILE: 'desktop' }), 'desktop')
})

test('trimmed desktop → desktop', () => {
  assert.equal(resolveDshProfile({ DSH_PROFILE: '  desktop  ' }), 'desktop')
})

test('non-string DSH_PROFILE ignored → web', () => {
  assert.equal(resolveDshProfile({ DSH_PROFILE: 42 }), 'web')
})

test('resolveDshProfile() with no args uses process.env', () => {
  const prev = process.env.DSH_PROFILE
  try {
    process.env.DSH_PROFILE = 'desktop'
    assert.equal(resolveDshProfile(), 'desktop')
  } finally {
    if (prev === undefined) delete process.env.DSH_PROFILE
    else process.env.DSH_PROFILE = prev
  }
})
