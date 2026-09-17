import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hardResetPulse } from './esp-reset.js';

test('hard reset pulses RTS high then low with DTR low, 100 ms apart', async () => {
  const calls = [];
  const transport = { setDTR: async (v) => calls.push(`DTR=${v}`), setRTS: async (v) => calls.push(`RTS=${v}`) };
  await hardResetPulse(transport, async (ms) => calls.push(`sleep ${ms}`));
  assert.deepEqual(calls, ['DTR=false', 'RTS=true', 'sleep 100', 'RTS=false']);
});
