import { describe, expect, test } from 'bun:test';
import { LORD_CHOICES, PLAYER_COUNT } from '../src/core/constants.ts';
import { runBattle } from '../src/core/sim/battle.ts';
import * as G from '../src/core/game/index.ts';
import type { GameState } from '../src/core/types.ts';

const HUMANS = [{ name: 'Ann' }, { name: 'Bob' }, { name: 'Cy' }];

function prep3(seed = 11): GameState {
  return G.autoPickLords(G.newGame(seed, { humans: HUMANS }));
}

/** Play an online match where every human seat is on autopilot. */
function playOut(s: GameState, maxRounds = 80): GameState {
  s = { ...s, players: s.players.map((p) => (p.isHuman ? { ...p, autopilot: true } : p)) };
  while (s.phase !== 'game_over' && s.round <= maxRounds) {
    s = G.readyForBattle(s, { record: false });
    s = G.finishBattle(s);
    if (s.phase === 'results') s = G.nextRound(s);
  }
  return s;
}

describe('online newGame', () => {
  test('3 humans + 5 bots with per-human lord choices', () => {
    const s = G.newGame(5, { humans: HUMANS });
    expect(s.online).toBe(true);
    expect(s.phase).toBe('lord_select');
    expect(s.players.length).toBe(PLAYER_COUNT);
    expect(s.players.filter((p) => p.isHuman).map((p) => p.name)).toEqual(['Ann', 'Bob', 'Cy']);
    for (const p of s.players.slice(0, 3)) {
      expect(p.lordId).toBeNull();
      expect(p.lordChoices!.length).toBe(LORD_CHOICES);
      expect(new Set(p.lordChoices).size).toBe(LORD_CHOICES);
      expect(p.lordRerollUsed).toBe(false);
    }
    // first two humans get disjoint offers (8 lords, 4 each)
    const [a, b] = [s.players[0]!.lordChoices!, s.players[1]!.lordChoices!];
    expect(a.some((l) => b.includes(l))).toBe(false);
    for (const p of s.players.slice(3)) {
      expect(p.isHuman).toBe(false);
      expect(p.lordId).not.toBeNull();
    }
    expect(JSON.stringify(G.newGame(5, { humans: HUMANS }))).toBe(JSON.stringify(s));
  });

  test('stays in lord_select until every human picked; per-player reroll', () => {
    let s = G.newGame(6, { humans: HUMANS });
    const bad = s.players[1]!.lordChoices!.find((l) => !s.players[0]!.lordChoices!.includes(l))!;
    expect(G.pickLord(s, bad, 0).players[0]!.lordId).toBeNull(); // not on seat 0's offer
    const before = s.players[2]!.lordChoices!;
    s = G.rerollLords(s, 2);
    expect(s.players[2]!.lordRerollUsed).toBe(true);
    expect(s.players[2]!.lordChoices).not.toEqual(before);
    expect(s.players[0]!.lordRerollUsed).toBe(false);
    expect(G.rerollLords(s, 2).players[2]!.lordChoices).toEqual(s.players[2]!.lordChoices);
    s = G.pickLord(s, s.players[0]!.lordChoices![0]!, 0);
    expect(s.phase).toBe('lord_select');
    s = G.pickLord(s, s.players[1]!.lordChoices![1]!, 1);
    expect(s.phase).toBe('lord_select');
    expect(s.players[1]!.lordId).toBe(s.players[1]!.lordChoices![1]!);
    s = G.pickLord(s, s.players[2]!.lordChoices![0]!, 2);
    expect(s.phase).toBe('prep');
  });

  test('autoPickLords gives first choice to humans without a lord', () => {
    let s = G.newGame(7, { humans: HUMANS });
    s = G.pickLord(s, s.players[1]!.lordChoices![2]!, 1);
    s = G.autoPickLords(s);
    expect(s.phase).toBe('prep');
    expect(s.players[0]!.lordId).toBe(s.players[0]!.lordChoices![0]!);
    expect(s.players[1]!.lordId).toBe(s.players[1]!.lordChoices![2]!);
    expect(s.players[2]!.lordId).toBe(s.players[2]!.lordChoices![0]!);
  });

  test('autopilot human gets bot purchases, a normal human does not', () => {
    let s = prep3(13);
    s = { ...s, players: s.players.map((p) => (p.id === 1 ? { ...p, autopilot: true } : p)) };
    s = G.readyForBattle(s, { record: false });
    expect(s.players[0]!.heroes.length).toBe(0);
    expect(s.players[2]!.heroes.length).toBe(0);
    expect(s.players[1]!.heroes.length).toBeGreaterThan(0);
    expect(s.humanBattle).toBeNull();
  });

  test('pairingInputs + report.seed replay reproduces the server battle', () => {
    let s = prep3(21);
    s = { ...s, players: s.players.map((p) => ({ ...p, autopilot: true })) };
    s = G.readyForBattle(s, { record: false });
    expect(s.reports.length).toBe(4);
    for (const r of s.reports) {
      expect(typeof r.seed).toBe('number');
      const { left, right } = G.pairingInputs(s, r.pairing);
      if (left.heroes.length === 0 || right.heroes.length === 0) continue;
      const res = runBattle(left, right, r.seed!, { record: true });
      expect(res.winner).toBe(r.winner);
      expect(res.duration).toBe(r.duration);
    }
  });

  test('viewFor hides other seats', () => {
    let s = G.newGame(8, { humans: HUMANS });
    const v = G.viewFor(s, 1);
    expect(v.selfId).toBe(1);
    expect(v.rngState).toBe(0);
    expect(v.lordChoices).toEqual(s.players[1]!.lordChoices!);
    expect(v.lordRerollUsed).toBe(false);
    expect(v.players[1]!.shop).toEqual(s.players[1]!.shop);
    for (const p of v.players) {
      if (p.id === 1) continue;
      expect(p.shop.heroOffers.every((x) => x === null)).toBe(true);
      expect(p.shop.spellOffers.every((x) => x === null)).toBe(true);
      expect(p.shop.itemOffers.every((x) => x === null)).toBe(true);
      expect(p.shop.locked).toBe(false);
      expect(p.spellInventory).toEqual([]);
      expect(p.itemInventory).toEqual([]);
      expect(p.lordChoices).toBeUndefined();
      expect(p.name).toBe(s.players[p.id]!.name);
      expect(p.lordId).toBe(s.players[p.id]!.lordId);
    }
    expect(s.rngState).not.toBe(0); // original untouched
    s = G.readyForBattle(G.autoPickLords(s));
    const vb = G.viewFor(s, 2);
    expect(vb.humanBattle).toBeNull();
    expect((vb as G.GS).pendingResult).toBeUndefined();
  });

  test('full 3-human autopilot game terminates with unique placements', () => {
    const s = playOut(prep3(31));
    expect(s.phase).toBe('game_over');
    expect(G.alivePlayers(s).length <= 1 || G.allHumansDead(s)).toBe(true);
    const placements = s.players.map((p) => p.placement);
    expect([...placements].sort((a, b) => a! - b!)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  }, 60_000);

  test('1-human online game works', () => {
    let s = G.newGame(41, { humans: [{ name: 'Solo' }] });
    expect(s.players.filter((p) => p.isHuman).length).toBe(1);
    expect(s.phase).toBe('lord_select');
    s = G.pickLord(s, s.players[0]!.lordChoices![0]!, 0);
    expect(s.phase).toBe('prep');
    s = playOut(s);
    expect(s.phase).toBe('game_over');
    const placements = s.players.map((p) => p.placement);
    expect([...placements].sort((a, b) => a! - b!)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  }, 60_000);

  test('offline seat 0 mirrors lord choices', () => {
    let s = G.newGame(3);
    expect(s.online).toBeUndefined();
    expect(s.players[0]!.lordChoices).toEqual(s.lordChoices);
    s = G.rerollLords(s);
    expect(s.players[0]!.lordChoices).toEqual(s.lordChoices);
    expect(s.players[0]!.lordRerollUsed).toBe(true);
    const v = G.viewFor(s, 0);
    expect(v.lordChoices).toEqual(s.lordChoices);
  });
});

describe('lord battle inputs', () => {
  test('summons, team mods and hero mods replay identically from pairingInputs', () => {
    const lords = ['juggernaut_lord', 'zeus_lord', 'naga_siren', 'spirit_breaker', 'riki', 'sniper_lord', 'luna', 'axe_lord'] as const;
    let s = G.newGame(31, { allBots: true });
    s = structuredClone(s);
    s.players.forEach((p, i) => G.applyLordPick(s, p, lords[i]!));
    // a few rounds so bots bind targets, buy bolts/blessings, summons scale
    for (let r = 0; r < 4 && s.phase !== 'game_over'; r++) {
      s = G.readyForBattle(s, { record: false });
      for (const rep of s.reports) {
        const { left, right } = G.pairingInputs(s, rep.pairing);
        // view-side replay (what a client sees) must equal the server inputs
        const v = G.viewFor(s, rep.pairing.left);
        const vi = G.pairingInputs(v, rep.pairing);
        expect(vi.left).toEqual(left);
        expect(vi.right).toEqual(right);
        if (left.heroes.length === 0 || right.heroes.length === 0) continue;
        const res = runBattle(left, right, rep.seed!, { record: false });
        expect(res.winner).toBe(rep.winner);
        expect(res.duration).toBe(rep.duration);
      }
      const jug = s.players[0]!;
      if (jug.alive && s.round >= 3) {
        const io = G.pairingInputs(s, s.pairings.find((p) => p.left === 0 || p.right === 0)!);
        const mine = io.left.playerId === 0 ? io.left : io.right;
        expect(mine.heroes.some((h) => h.summon)).toBe(true);
      }
      s = G.finishBattle(s);
      expect(s.players.every((p) => p.heroes.every((h) => !h.summon))).toBe(true);
      if (s.phase === 'results') s = G.nextRound(s);
    }
  });
});
