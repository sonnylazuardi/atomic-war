// Lord-granted spells (lordOnly: never rolled in the Mystery shop) — owned by content agent.
import type { LordSpellId } from '../ids.ts';
import type { SpellDef } from '../types.ts';

export const LORD_SPELLS: Record<LordSpellId, SpellDef> = {
  charge_of_darkness: {
    id: 'charge_of_darkness',
    name: 'Charge of Darkness',
    glyph: '🐂',
    description: 'Charges the enemy backline: crashes into the target for 80 physical damage + 100% attack damage and stuns it for 1.8s.',
    kind: 'active',
    ultimate: false,
    stars: 4,
    lordOnly: true,
    manaCost: 100,
    cooldown: 14,
    castRange: 900,
    castPoint: 0.3,
    target: 'backline_enemy',
    ai: { minBattleTime: 0.5 },
    effects: [
      { t: 'leap', to: 'target' },
      { t: 'damage', amount: 80, dmgType: 'physical', attackMult: 1 },
      { t: 'stun', duration: 1.8 },
    ],
    levelScaling: 0.05,
    aghanim: {
      description: 'Cooldown 9s; the impact stuns and damages every enemy within 150 of the target.',
      patch: {
        cooldown: 9,
        effects: [
          { t: 'leap', to: 'target' },
          { t: 'damage', amount: 80, dmgType: 'physical', attackMult: 1, area: { shape: 'circle', radius: 150, center: 'target' } },
          { t: 'stun', duration: 1.8, area: { shape: 'circle', radius: 150, center: 'target' } },
        ],
      },
    },
    vfx: { kind: 'at_target', duration: 0.8, color: '#5b3fa8' },
  },
  sleight_of_fist: {
    id: 'sleight_of_fist',
    name: 'Sleight of Fist',
    glyph: '👊',
    description: 'Dashes through every enemy within 180 of a point, striking each for 100% attack damage + 40 physical.',
    kind: 'active',
    ultimate: false,
    stars: 4,
    lordOnly: true,
    manaCost: 60,
    cooldown: 10,
    castRange: 450,
    castPoint: 0.1,
    target: 'enemy_cluster',
    aoeRadius: 180,
    ai: { minEnemiesInRange: 2 },
    effects: [
      { t: 'damage', amount: 40, dmgType: 'physical', attackMult: 1, area: { shape: 'circle', radius: 180, center: 'target' } },
    ],
    levelScaling: 0.05,
    aghanim: {
      description: 'Radius 260, cooldown 6s, strikes for 130% attack damage + 60 physical.',
      patch: {
        cooldown: 6,
        aoeRadius: 260,
        effects: [
          { t: 'damage', amount: 60, dmgType: 'physical', attackMult: 1.3, area: { shape: 'circle', radius: 260, center: 'target' } },
        ],
      },
    },
    vfx: { kind: 'chain', duration: 0.8, color: '#ff6a2a' },
  },
};
