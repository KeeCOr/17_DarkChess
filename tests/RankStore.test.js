import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { getAccount, normalizeName, recordResult } = require('../server/rankStore.cjs');

function tempRankFile() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'chesssummon-ranks-')), 'ranks.json');
}

describe('rankStore', () => {
  it('normalizes nickname accounts and creates 1000 point ranks', () => {
    const file = tempRankFile();
    const account = getAccount(file, '  Alice   Knight  ');

    expect(account).toMatchObject({ name: 'Alice Knight', rankPoints: 1000, wins: 0, losses: 0 });
    expect(normalizeName('')).toBe('Player');
  });

  it('records winner and loser rank point changes', () => {
    const file = tempRankFile();
    const result = recordResult(file, 'Alice', 'Bob');

    expect(result.winner.rankPoints).toBe(1015);
    expect(result.winner.wins).toBe(1);
    expect(result.loser.rankPoints).toBe(985);
    expect(result.loser.losses).toBe(1);
  });
});
