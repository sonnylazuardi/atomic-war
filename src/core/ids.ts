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
  'dragon_knight',
  'windranger',
  'jakiro',
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
  dragon_knight: 'elder_dragon_form',
  windranger: 'focus_fire',
  jakiro: 'macropyre',
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

// New spells needed so every hero has its real Dota kit (see HERO_KITS). Split in three groups so
// three agents can author data + VFX in parallel (src/core/data/kitA|B|C.ts, src/art/vfx/kitA|B|C.ts).
export const KIT_SPELL_IDS_A = [
  'dismember', 'berserkers_call', 'earthshock', 'overpower', 'dark_pact', 'pounce', 'shadow_dance',
  'stifling_dagger', 'phantom_strike', 'blur', 'blade_fury', 'healing_ward', 'blade_dance',
  'arcane_curse', 'last_word', 'fiery_soul',
] as const;
export const KIT_SPELL_IDS_B = [
  'lightning_bolt', 'static_field', 'malefice', 'demonic_conversion', 'midnight_pulse',
  'heat_seeking_missile', 'defense_matrix', 'rearm', 'mystic_snake', 'mana_shield', 'stone_gaze',
  'frost_arrows', 'gust', 'multishot',
] as const;
export const KIT_SPELL_IDS_C = [
  'shrapnel', 'headshot', 'take_aim', 'arcane_aura', 'poison_touch', 'shadow_wave', 'bad_juju',
  'breathe_fire', 'dragon_tail', 'dragon_blood', 'shackleshot', 'powershot', 'windrun',
  'dual_breath', 'ice_path', 'liquid_fire',
] as const;
export type KitSpellIdA = (typeof KIT_SPELL_IDS_A)[number];
export type KitSpellIdB = (typeof KIT_SPELL_IDS_B)[number];
export type KitSpellIdC = (typeof KIT_SPELL_IDS_C)[number];
/** spells authored in src/core/data/spells.ts (hero signatures + the original shop spells) */
export type BaseSpellId = (typeof SIGNATURE_SPELLS)[HeroId] | (typeof SHOP_SPELL_IDS)[number];

export const SPELL_IDS = [
  ...Object.values(SIGNATURE_SPELLS),
  ...SHOP_SPELL_IDS,
  ...KIT_SPELL_IDS_A,
  ...KIT_SPELL_IDS_B,
  ...KIT_SPELL_IDS_C,
] as const;
export type SpellId = BaseSpellId | KitSpellIdA | KitSpellIdB | KitSpellIdC;

/**
 * Every hero's default abilities, like Dota: [Q, W, E, R] — three normal skills then the ULTIMATE
 * (the most mana-hungry, `ultimate: true`). A new hero starts with these in slots 0-3; slot 4 is free.
 * Kit spells are innate: they can be reordered or replaced, but a replaced/sold innate spell is lost
 * (it never goes to the inventory — otherwise buying a hero would be a spell-coin exploit).
 */
export const HERO_KITS = {
  pudge: ['meat_hook', 'rot', 'flesh_heap', 'dismember'],
  axe: ['berserkers_call', 'battle_hunger', 'counter_helix', 'culling_blade'],
  ursa: ['earthshock', 'overpower', 'fury_swipes', 'enrage'],
  slark: ['dark_pact', 'pounce', 'essence_shift', 'shadow_dance'],
  phantom_assassin: ['stifling_dagger', 'phantom_strike', 'blur', 'coup_de_grace'],
  juggernaut: ['blade_fury', 'healing_ward', 'blade_dance', 'omnislash'],
  silencer: ['arcane_curse', 'glaives_of_wisdom', 'last_word', 'global_silence'],
  lina: ['dragon_slave', 'light_strike_array', 'fiery_soul', 'laguna_blade'],
  zeus: ['arc_lightning', 'lightning_bolt', 'static_field', 'thundergods_wrath'],
  enigma: ['malefice', 'demonic_conversion', 'midnight_pulse', 'black_hole'],
  tinker: ['laser', 'heat_seeking_missile', 'defense_matrix', 'rearm'],
  medusa: ['split_shot', 'mystic_snake', 'mana_shield', 'stone_gaze'],
  drow_ranger: ['frost_arrows', 'gust', 'multishot', 'marksmanship'],
  sniper: ['shrapnel', 'headshot', 'take_aim', 'assassinate'],
  crystal_maiden: ['crystal_nova', 'frostbite', 'arcane_aura', 'freezing_field'],
  dazzle: ['poison_touch', 'shallow_grave', 'shadow_wave', 'bad_juju'],
  dragon_knight: ['breathe_fire', 'dragon_tail', 'dragon_blood', 'elder_dragon_form'],
  windranger: ['shackleshot', 'powershot', 'windrun', 'focus_fire'],
  jakiro: ['dual_breath', 'ice_path', 'liquid_fire', 'macropyre'],
} as const satisfies Record<HeroId, readonly [SpellId, SpellId, SpellId, SpellId]>;

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
