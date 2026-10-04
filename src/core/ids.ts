// Manifest of every content id. All modules (data, sim, art, ui) key off these.
// Adding content = add the id here first, then data + art.

export const HERO_IDS = [
  'pudge',
  'axe',
  'ursa',
  'slark',
  'phantom_assassin',
  'juggernaut',
  'silencer',
  'lina',
  'zeus',
  'enigma',
  'tinker',
  'medusa',
  'drow_ranger',
  'sniper',
  'crystal_maiden',
  'dazzle',
] as const;
export type HeroId = (typeof HERO_IDS)[number];

// Each hero's innate signature spell (slot 0, cannot be removed). Also buyable in the shop.
export const SIGNATURE_SPELLS = {
  pudge: 'flesh_heap',
  axe: 'counter_helix',
  ursa: 'enrage',
  slark: 'essence_shift',
  phantom_assassin: 'coup_de_grace',
  juggernaut: 'omnislash',
  silencer: 'glaives_of_wisdom',
  lina: 'laguna_blade',
  zeus: 'thundergods_wrath',
  enigma: 'black_hole',
  tinker: 'laser',
  medusa: 'split_shot',
  drow_ranger: 'marksmanship',
  sniper: 'assassinate',
  crystal_maiden: 'freezing_field',
  dazzle: 'shallow_grave',
} as const satisfies Record<HeroId, string>;

export const SHOP_SPELL_IDS = [
  'berserkers_blood',
  'global_silence',
  'dragon_slave',
  'light_strike_array',
  'arc_lightning',
  'crystal_nova',
  'frostbite',
  'purification',
  'blink_strike',
  'battle_hunger',
  'culling_blade',
  'fury_swipes',
  'time_lock',
  'rot',
  'meat_hook',
  'chain_frost',
] as const;

export const SPELL_IDS = [...Object.values(SIGNATURE_SPELLS), ...SHOP_SPELL_IDS] as const;
export type SpellId = (typeof SIGNATURE_SPELLS)[HeroId] | (typeof SHOP_SPELL_IDS)[number];

export const ITEM_IDS = [
  // tier 1
  'broadsword',
  'chainmail',
  'ogre_axe',
  'blade_of_alacrity',
  'staff_of_wizardry',
  'ring_of_health',
  // tier 2
  'vladmirs_offering',
  'desolator',
  'blink_dagger',
  'bloodstone',
  'skull_basher',
  'maelstrom',
  // tier 3
  'black_king_bar',
  'daedalus',
  'heart_of_tarrasque',
  'assault_cuirass',
  'shivas_guard',
  'aghanims_scepter',
  // tier 4
  'refresher_orb',
  'satanic',
  'butterfly',
  'monkey_king_bar',
  'abyssal_blade',
  'scythe_of_vyse',
  // tier 5
  'radiance',
  'divine_rapier',
  // lord-only (Ursa lord forge)
  'broken_sword',
  'divine_sword_of_the_sun',
] as const;
export type ItemId = (typeof ITEM_IDS)[number];

export const LORD_IDS = [
  'alchemist',
  'ursa_lord',
  'pudge_lord',
  'bounty_hunter',
  'omniknight',
  'tinker_lord',
  'axe_lord',
  'rubick',
] as const;
export type LordId = (typeof LORD_IDS)[number];
