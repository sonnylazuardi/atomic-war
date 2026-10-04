// Match flow: new game, lord select, battle resolution, rounds.
import {
  LORD_CHOICES,
  PLAYER_COUNT,
  PLAYER_START_HP,
  incomeForRound,
  lossDamage,
} from '../constants.ts';
import { LORD_IDS } from '../ids.ts';
import { createRng } from '../rng.ts';
import { runBattle } from '../sim/battle.ts';
import type {
  BattleResult,
  BattleTeamInput,
  GameState,
  LordId,
  OwnedHero,
  Pairing,
  PlayerState,
  RoundReport,
  Team,
} from '../types.ts';
import { botPickLord, botPrepM } from './bots.ts';
import { applyLordPick, lordIncomeBonus, onLeavePrep, onRoundStart, teamModsFor } from './lords.ts';
import { emptyShop, rollShop } from './shop.ts';
import { fail, fighters, log, pure, withRng, type GS, type PendingGains } from './util.ts';

export const BOT_NAMES = [
  'Roshan',
  'Courier',
  'Aghanim',
  'Tango Tim',
  'Mango Max',
  'Aegis Ann',
  'Ward Bear',
  'Dire Wolf',
  'Radiant Rex',
  'Rune Hunter',
  'Smoke Gank',
  'Cheese',
];

export interface NewGameOptions {
  /** player 0 is also a bot (headless simulations / tests) */
  allBots?: boolean;
}

function makePlayer(id: number, name: string, isHuman: boolean, coins: number): PlayerState {
  return {
    id,
    name,
    isHuman,
    hp: PLAYER_START_HP,
    maxHp: PLAYER_START_HP,
    alive: true,
    placement: null,
    lordId: null,
    lordState: {},
    coins,
    shopLevel: 1,
    shop: emptyShop(),
    heroes: [],
    spellInventory: [],
    itemInventory: [],
    streak: 0,
    lastResult: null,
  };
}

function rollLordChoices(s: GameState, exclude: readonly LordId[] = []): LordId[] {
  return withRng(s, (rng) => {
    let pool = LORD_IDS.filter((l) => !exclude.includes(l));
    if (pool.length < LORD_CHOICES) pool = [...LORD_IDS];
    return rng.shuffle([...pool]).slice(0, LORD_CHOICES);
  });
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

export function newGame(seed: number = randomSeed(), opts: NewGameOptions = {}): GameState {
  const rng = createRng(seed);
  const names = rng.shuffle([...BOT_NAMES]);
  const s: GS = {
    seed,
    rngState: rng.state(),
    phase: 'lord_select',
    round: 1,
    players: [],
    lordChoices: [],
    lordRerollUsed: false,
    pairings: [],
    reports: [],
    humanBattle: null,
    humanSide: 'left',
    log: [],
  };
  const income = incomeForRound(1);
  for (let i = 0; i < PLAYER_COUNT; i++) {
    const human = i === 0 && !opts.allBots;
    s.players.push(makePlayer(i, i === 0 ? 'You' : names[(i - 1) % names.length]!, human, income));
  }
  for (const p of s.players) rollShop(s, p);
  for (const p of s.players) {
    if (p.isHuman) continue;
    applyLordPick(s, p, botPickLord(s));
  }
  if (s.players.some((p) => p.isHuman)) {
    s.lordChoices = rollLordChoices(s);
    log(s, 'Choose your Lord.');
  } else {
    s.phase = 'prep';
  }
  return s;
}

export function pickLordM(s: GS, pid: number, lordId: LordId) {
  const p = s.players[pid];
  if (!p) return;
  if (s.phase !== 'lord_select') return fail(s, p, 'Lord already chosen.');
  if (p.isHuman && !s.lordChoices.includes(lordId)) return fail(s, p, 'That lord is not on offer.');
  applyLordPick(s, p, lordId);
  s.phase = 'prep';
  log(s, `Round ${s.round}: prepare for battle!`);
}

export function rerollLordsM(s: GS, pid: number) {
  const p = s.players[pid];
  if (s.phase !== 'lord_select') return;
  if (s.lordRerollUsed) return fail(s, p, 'Reroll already used.');
  s.lordRerollUsed = true;
  s.lordChoices = rollLordChoices(s, s.lordChoices);
}

// ---------------------------------------------------------------- battles

function teamInput(s: GameState, p: PlayerState): BattleTeamInput {
  return { playerId: p.id, heroes: structuredClone(fighters(p, s.round)), mods: teamModsFor(p) };
}

function syntheticResult(left: BattleTeamInput, right: BattleTeamInput, seed: number): BattleResult {
  const l = left.heroes.length;
  const r = right.heroes.length;
  return {
    winner: l === r ? 'draw' : l > r ? 'left' : 'right',
    duration: 0,
    seed,
    frames: [],
    events: [],
    survivors: { left: left.heroes.map((h) => h.uid), right: right.heroes.map((h) => h.uid) },
    gains: {},
    damageDealt: {},
  };
}

function resolve(left: BattleTeamInput, right: BattleTeamInput, seed: number, record: boolean): BattleResult {
  if (left.heroes.length === 0 || right.heroes.length === 0) {
    if (record && left.heroes.length + right.heroes.length > 0) {
      try {
        return runBattle(left, right, seed, { record });
      } catch {
        /* fall through */
      }
    }
    return syntheticResult(left, right, seed);
  }
  return runBattle(left, right, seed, { record });
}

function survivorLevels(team: BattleTeamInput, uids: string[]): number[] {
  const byUid = new Map<string, OwnedHero>(team.heroes.map((h) => [h.uid, h]));
  return uids.map((u) => byUid.get(u)?.level).filter((x): x is number => x !== undefined);
}

export function readyForBattleM(s: GS) {
  if (s.phase !== 'prep') return;
  for (const p of s.players) if (p.alive && !p.isHuman) botPrepM(s, p.id);
  for (const p of s.players) if (p.alive) onLeavePrep(p);

  const alive = s.players.filter((p) => p.alive).map((p) => p.id);
  const pairings: Pairing[] = [];
  const seeds: number[] = [];
  withRng(s, (rng) => {
    const order = rng.shuffle([...alive]);
    for (let i = 0; i + 1 < order.length; i += 2) pairings.push({ left: order[i]!, right: order[i + 1]!, ghost: false });
    if (order.length % 2 === 1 && order.length > 1) {
      const last = order[order.length - 1]!;
      const others = alive.filter((id) => id !== last);
      pairings.push({ left: last, right: rng.pick(others), ghost: true });
    }
    for (let i = 0; i < pairings.length; i++) seeds.push(rng.int(0, 0x7fffffff));
  });

  s.pairings = pairings;
  s.reports = [];
  s.humanBattle = null;
  s.humanSide = 'left';
  const gains: Record<number, PendingGains> = {};
  const damage: Record<number, number> = {};
  const results: Record<number, 'win' | 'loss' | 'draw'> = {};

  pairings.forEach((pr, i) => {
    const lp = s.players[pr.left]!;
    const rp = s.players[pr.right]!;
    const left = teamInput(s, lp);
    const right = teamInput(s, rp);
    const humanSide: Team | null = lp.isHuman ? 'left' : rp.isHuman && !pr.ghost ? 'right' : null;
    const res = resolve(left, right, seeds[i]!, humanSide !== null);
    if (humanSide) {
      s.humanBattle = res;
      s.humanSide = humanSide;
    }
    // gains
    const pick = (team: BattleTeamInput): PendingGains => {
      const out: PendingGains = {};
      for (const h of team.heroes) {
        const g = res.gains[h.uid];
        if (g) out[h.uid] = { ...g };
      }
      return out;
    };
    gains[pr.left] = pick(left);
    if (!pr.ghost) gains[pr.right] = pick(right);

    const dmgToLeft = lossDamage(s.round, survivorLevels(right, res.survivors.right));
    const dmgToRight = lossDamage(s.round, survivorLevels(left, res.survivors.left));
    let damageToLoser = 0;
    if (res.winner === 'left') {
      damageToLoser = dmgToRight;
      results[pr.left] = 'win';
      if (!pr.ghost) {
        damage[pr.right] = dmgToRight;
        results[pr.right] = 'loss';
      }
    } else if (res.winner === 'right') {
      damageToLoser = dmgToLeft;
      damage[pr.left] = dmgToLeft;
      results[pr.left] = 'loss';
      if (!pr.ghost) results[pr.right] = 'win';
    } else {
      damageToLoser = Math.floor(dmgToLeft / 2);
      damage[pr.left] = Math.floor(dmgToLeft / 2);
      results[pr.left] = 'draw';
      if (!pr.ghost) {
        damage[pr.right] = Math.floor(dmgToRight / 2);
        results[pr.right] = 'draw';
      }
    }
    const report: RoundReport = { round: s.round, pairing: pr, winner: res.winner, damageToLoser, duration: res.duration };
    s.reports.push(report);
  });

  s.pendingGains = gains;
  s.pendingDamage = damage;
  s.pendingResult = results;
  s.phase = 'battle';
}

export function finishBattleM(s: GS) {
  if (s.phase !== 'battle') return;
  const gains = s.pendingGains ?? {};
  const damage = s.pendingDamage ?? {};
  const results = s.pendingResult ?? {};
  const aliveBefore = s.players.filter((p) => p.alive);

  for (const p of aliveBefore) {
    const g = gains[p.id] ?? {};
    for (const h of p.heroes) {
      const x = g[h.uid];
      if (!x) continue;
      h.stacks.str += x.str;
      h.stacks.agi += x.agi;
      h.stacks.int += x.int;
      h.kills += x.kills;
    }
    p.hp -= damage[p.id] ?? 0;
    const r = results[p.id];
    if (r) {
      p.lastResult = r;
      if (r === 'win') p.streak = Math.max(0, p.streak) + 1;
      else if (r === 'loss') p.streak = Math.min(0, p.streak) - 1;
      else p.streak = 0;
    }
    if (p.isHuman && r) {
      const d = damage[p.id] ?? 0;
      log(s, r === 'win' ? `Round ${s.round}: victory!` : `Round ${s.round}: ${r} — you lose ${d} HP.`);
    }
  }

  const dead = aliveBefore.filter((p) => p.hp <= 0).sort((a, b) => a.hp - b.hp || b.id - a.id);
  let place = aliveBefore.length;
  for (const p of dead) {
    p.alive = false;
    p.placement = place--;
    if (!p.isHuman) log(s, `${p.name} has been eliminated (#${p.placement}).`);
  }
  for (const p of s.players) p.hp = Math.max(0, p.hp);

  s.pendingGains = undefined;
  s.pendingDamage = undefined;
  s.pendingResult = undefined;
  delete s.pendingGains;
  delete s.pendingDamage;
  delete s.pendingResult;

  const alive = s.players.filter((p) => p.alive);
  const human = s.players.find((p) => p.isHuman);
  if (alive.length <= 1 || (human && !human.alive)) {
    // rank everyone still standing by hp
    alive
      .sort((a, b) => b.hp - a.hp || a.id - b.id)
      .forEach((p, i) => {
        p.placement = i + 1;
      });
    s.phase = 'game_over';
    const winner = s.players.find((p) => p.placement === 1);
    if (human) log(s, human.placement === 1 ? 'You are the last lord standing!' : `Game over — you placed #${human.placement}.`);
    else if (winner) log(s, `${winner.name} wins!`);
    return;
  }
  s.phase = 'results';
}

export function nextRoundM(s: GS) {
  if (s.phase !== 'results') return;
  s.round++;
  s.humanBattle = null;
  for (const p of s.players) {
    if (!p.alive) continue;
    p.coins = incomeForRound(s.round) + lordIncomeBonus(p);
    onRoundStart(p);
    if (p.shop.locked) p.shop.locked = false;
    else rollShop(s, p);
  }
  s.phase = 'prep';
  log(s, `Round ${s.round}: prepare for battle!`);
}

export const pickLord = (state: GameState, lordId: LordId, pid = 0) => pure(pickLordM)(state, pid, lordId);
export const rerollLords = (state: GameState, pid = 0) => pure(rerollLordsM)(state, pid);
export const readyForBattle = pure(readyForBattleM);
export const finishBattle = pure(finishBattleM);
export const nextRound = pure(nextRoundM);

/** Run a whole match headlessly (all bots). Returns the final state. */
export function simulateGame(seed: number, maxRounds = 80): GameState {
  let s = newGame(seed, { allBots: true });
  while (s.phase !== 'game_over' && s.round <= maxRounds) {
    s = readyForBattle(s);
    s = finishBattle(s);
    if (s.phase === 'results') s = nextRound(s);
  }
  return s;
}
