// Match flow: new game, lord select, battle resolution, rounds.
import {
  LORD_CHOICES,
  PLAYER_COUNT,
  PLAYER_START_HP,
  incomeForRound,
  streakBonus,
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
import { applyLordPick, heroModsFor, lordIncomeBonus, lordSummon, onLeavePrep, onRoundStart, teamModsFor } from './lords.ts';
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
  /** online match: seats 0..n-1 are these humans (1..8), the remaining seats are bots */
  humans?: { name: string }[];
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
  const humans = opts.humans?.slice(0, PLAYER_COUNT);
  if (humans && humans.length > 0) {
    // online: seats 0..n-1 humans, the rest bots
    s.online = true;
    const n = humans.length;
    for (let i = 0; i < PLAYER_COUNT; i++) {
      const name = i < n ? humans[i]!.name : names[(i - n) % names.length]!;
      s.players.push(makePlayer(i, name, i < n, income));
    }
    for (const p of s.players) rollShop(s, p);
    for (const p of s.players) if (!p.isHuman) applyLordPick(s, p, botPickLord(s));
    // deal each human its own choices, disjoint from earlier humans' while the pool lasts
    let dealt: LordId[] = [];
    for (const p of s.players) {
      if (!p.isHuman) continue;
      if (LORD_IDS.length - dealt.length < LORD_CHOICES) dealt = [];
      p.lordChoices = rollLordChoices(s, dealt);
      p.lordRerollUsed = false;
      dealt.push(...p.lordChoices);
    }
    log(s, 'Choose your Lord.');
    return s;
  }
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
    // offline: seat 0 mirrors the top-level choices
    s.players[0]!.lordChoices = [...s.lordChoices];
    s.players[0]!.lordRerollUsed = false;
    log(s, 'Choose your Lord.');
  } else {
    s.phase = 'prep';
  }
  return s;
}

/** Lords offered to a seat: per player online, the top-level list offline. */
function choicesOf(s: GameState, p: PlayerState): LordId[] {
  return s.online ? (p.lordChoices ?? []) : s.lordChoices;
}

/** lord_select -> prep once every human seat has a lord. */
function maybeStartPrep(s: GS) {
  if (s.phase !== 'lord_select') return;
  if (s.players.some((p) => p.isHuman && p.lordId === null)) return;
  s.phase = 'prep';
  log(s, `Round ${s.round}: prepare for battle!`);
}

export function pickLordM(s: GS, pid: number, lordId: LordId) {
  const p = s.players[pid];
  if (!p) return;
  if (s.phase !== 'lord_select' || (s.online && p.lordId !== null)) return fail(s, p, 'Lord already chosen.');
  if (p.isHuman && !choicesOf(s, p).includes(lordId)) return fail(s, p, 'That lord is not on offer.');
  applyLordPick(s, p, lordId);
  if (s.online) log(s, `${p.name} chose a lord.`);
  if (s.online) maybeStartPrep(s);
  else {
    s.phase = 'prep';
    log(s, `Round ${s.round}: prepare for battle!`);
  }
}

export function rerollLordsM(s: GS, pid: number) {
  const p = s.players[pid];
  if (!p || s.phase !== 'lord_select') return;
  if (s.online) {
    if (!p.isHuman || p.lordId !== null) return;
    if (p.lordRerollUsed) return fail(s, p, 'Reroll already used.');
    p.lordRerollUsed = true;
    p.lordChoices = rollLordChoices(s, p.lordChoices ?? []);
    return;
  }
  if (s.lordRerollUsed) return fail(s, p, 'Reroll already used.');
  s.lordRerollUsed = true;
  s.lordChoices = rollLordChoices(s, s.lordChoices);
  p.lordRerollUsed = true;
  p.lordChoices = [...s.lordChoices];
}

/** Lord-select timeout: every human without a lord gets its first offered lord -> prep. */
export function autoPickLordsM(s: GS) {
  if (s.phase !== 'lord_select') return;
  for (const p of s.players) {
    if (!p.isHuman || p.lordId !== null) continue;
    const pick = choicesOf(s, p)[0] ?? LORD_IDS[0]!;
    applyLordPick(s, p, pick);
  }
  maybeStartPrep(s);
}

// ---------------------------------------------------------------- battles

/** One side's battle input: board heroes + lord summon, team mods and per-hero lord mods.
 *  The single source for both readyForBattle and pairingInputs (client replays must match exactly). */
function teamInput(s: GameState, p: PlayerState): BattleTeamInput {
  const heroes = structuredClone(fighters(p, s.round));
  const summon = lordSummon(p, s.round);
  if (summon) heroes.push(summon);
  return { playerId: p.id, heroes, mods: teamModsFor(p), heroMods: heroModsFor(p, s.round) };
}

/** The exact battle inputs readyForBattle used for `pairing` (ghost side = copy of that player's team).
 *  Valid between readyForBattle and finishBattle; replay with runBattle(left, right, report.seed, …). */
export function pairingInputs(s: GameState, pairing: Pairing): { left: BattleTeamInput; right: BattleTeamInput } {
  return { left: teamInput(s, s.players[pairing.left]!), right: teamInput(s, s.players[pairing.right]!) };
}

export interface ReadyOptions {
  /** record the viewer's (selfId ?? 0, if human) battle into humanBattle. Default true; the server passes false. */
  record?: boolean;
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

export function readyForBattleM(s: GS, opts: ReadyOptions = {}) {
  if (s.phase !== 'prep') return;
  for (const p of s.players) if (p.alive && (!p.isHuman || p.autopilot === true)) botPrepM(s, p.id);
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
  const viewerId = s.selfId ?? 0;
  const viewer = opts.record !== false && s.players[viewerId]?.isHuman ? viewerId : -1;
  const gains: Record<number, PendingGains> = {};
  const damage: Record<number, number> = {};
  const results: Record<number, 'win' | 'loss' | 'draw'> = {};

  pairings.forEach((pr, i) => {
    const lp = s.players[pr.left]!;
    const rp = s.players[pr.right]!;
    const left = teamInput(s, lp);
    const right = teamInput(s, rp);
    const humanSide: Team | null =
      pr.left === viewer ? 'left' : pr.right === viewer && !pr.ghost ? 'right' : null;
    const res = resolve(left, right, seeds[i]!, humanSide !== null);
    if (humanSide) {
      s.humanBattle = res;
      s.humanSide = humanSide;
    }
    // gains
    const pick = (team: BattleTeamInput): PendingGains => {
      const out: PendingGains = {};
      for (const h of team.heroes) {
        if (h.summon) continue; // lord summons keep nothing
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
    const report: RoundReport = { round: s.round, pairing: pr, winner: res.winner, damageToLoser, duration: res.duration, seed: seeds[i]! };
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
    if (p.isHuman && r && !s.online) {
      const d = damage[p.id] ?? 0;
      log(s, r === 'win' ? `Round ${s.round}: victory!` : `Round ${s.round}: ${r} — you lose ${d} HP.`);
    }
  }

  const dead = aliveBefore.filter((p) => p.hp <= 0).sort((a, b) => a.hp - b.hp || b.id - a.id);
  let place = aliveBefore.length;
  for (const p of dead) {
    p.alive = false;
    p.placement = place--;
    if (!p.isHuman || s.online) log(s, `${p.name} has been eliminated (#${p.placement}).`);
  }
  for (const p of s.players) p.hp = Math.max(0, p.hp);

  s.pendingGains = undefined;
  s.pendingDamage = undefined;
  s.pendingResult = undefined;
  delete s.pendingGains;
  delete s.pendingDamage;
  delete s.pendingResult;

  const alive = alivePlayers(s);
  const human = s.online ? undefined : s.players.find((p) => p.isHuman);
  const over = s.online ? alive.length <= 1 || allHumansDead(s) : alive.length <= 1 || (human && !human.alive);
  if (over) {
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

export function alivePlayers(s: GameState): PlayerState[] {
  return s.players.filter((p) => p.alive);
}

/** true when the match has human seats and none of them is alive */
export function allHumansDead(s: GameState): boolean {
  const humans = s.players.filter((p) => p.isHuman);
  return humans.length > 0 && humans.every((p) => !p.alive);
}

export function nextRoundM(s: GS) {
  if (s.phase !== 'results') return;
  s.round++;
  s.humanBattle = null;
  for (const p of s.players) {
    if (!p.alive) continue;
    p.coins = incomeForRound(s.round) + streakBonus(p.streak) + lordIncomeBonus(p);
    onRoundStart(s, p);
    if (p.shop.locked) p.shop.locked = false;
    else rollShop(s, p);
  }
  s.phase = 'prep';
  log(s, `Round ${s.round}: prepare for battle!`);
}

export const pickLord = (state: GameState, lordId: LordId, pid = 0) => pure(pickLordM)(state, pid, lordId);
export const rerollLords = (state: GameState, pid = 0) => pure(rerollLordsM)(state, pid);
export const autoPickLords = (state: GameState): GameState => pure(autoPickLordsM)(state);
export const readyForBattle = (state: GameState, opts?: ReadyOptions): GameState => pure(readyForBattleM)(state, opts);
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
