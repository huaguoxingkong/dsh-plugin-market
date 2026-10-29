import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveDshProfile } from '../src/host.js'

const ctxOf = (value) => ({ get: (key) => (key === 'profileContext' ? value : undefined) })

test('context name wins over env', () => {
  const got = resolveDshProfile({ ctx: ctxOf({ name: 'desktop' }), env: { DSH_PROFILE: 'web' } })
  assert.deepEqual(got, { name: 'desktop', source: 'context' })
})

test('trimmed context name', () => {
  const got = resolveDshProfile({ ctx: ctxOf({ name: '  desktop  ' }), env: {} })
  assert.deepEqual(got, { name: 'desktop', source: 'context' })
})

test('blank / missing context name falls through to env', () => {
  assert.deepEqual(
    resolveDshProfile({ ctx: ctxOf({ name: '' }), env: { DSH_PROFILE: 'desktop' } }),
    { name: 'desktop', source: 'env' },
  )
  assert.deepEqual(
    resolveDshProfile({ ctx: ctxOf({ name: '   ' }), env: { DSH_PROFILE: 'desktop' } }),
    { name: 'desktop', source: 'env' },
  )
  assert.deepEqual(
    resolveDshProfile({ ctx: ctxOf({}), env: { DSH_PROFILE: 'desktop' } }),
    { name: 'desktop', source: 'env' },
  )
  assert.deepEqual(
    resolveDshProfile({ ctx: ctxOf(undefined), env: { DSH_PROFILE: 'desktop' } }),
    { name: 'desktop', source: 'env' },
  )
})

test('ctx.get throws → env, must not throw', () => {
  const ctx = { get: () => { throw new Error('cannot get property without inject') } }
  assert.deepEqual(resolveDshProfile({ ctx, env: { DSH_PROFILE: 'desktop' } }), { name: 'desktop', source: 'env' })
  assert.deepEqual(resolveDshProfile({ ctx, env: {} }), { name: 'web', source: 'fallback' })
})

test('ctx without get is ignored', () => {
  assert.deepEqual(resolveDshProfile({ ctx: {}, env: { DSH_PROFILE: 'desktop' } }), { name: 'desktop', source: 'env' })
})

test('env desktop when context absent', () => {
  assert.deepEqual(resolveDshProfile({ env: { DSH_PROFILE: 'desktop' } }), { name: 'desktop', source: 'env' })
})

test('trimmed env', () => {
  assert.deepEqual(resolveDshProfile({ env: { DSH_PROFILE: '  desktop  ' } }), { name: 'desktop', source: 'env' })
})

test('empty / whitespace / non-string env → fallback', () => {
  assert.deepEqual(resolveDshProfile({ env: {} }), { name: 'web', source: 'fallback' })
  assert.deepEqual(resolveDshProfile({ env: { OTHER: 'x' } }), { name: 'web', source: 'fallback' })
  assert.deepEqual(resolveDshProfile({ env: { DSH_PROFILE: '' } }), { name: 'web', source: 'fallback' })
  assert.deepEqual(resolveDshProfile({ env: { DSH_PROFILE: '   ' } }), { name: 'web', source: 'fallback' })
  assert.deepEqual(resolveDshProfile({ env: { DSH_PROFILE: 42 } }), { name: 'web', source: 'fallback' })
})

test('no args uses process.env (env or fallback)', () => {
  const prev = process.env.DSH_PROFILE
  try {
    process.env.DSH_PROFILE = 'desktop'
    assert.deepEqual(resolveDshProfile(), { name: 'desktop', source: 'env' })
    delete process.env.DSH_PROFILE
    assert.deepEqual(resolveDshProfile(), { name: 'web', source: 'fallback' })
  } finally {
    if (prev === undefined) delete process.env.DSH_PROFILE
    else process.env.DSH_PROFILE = prev
  }
})
