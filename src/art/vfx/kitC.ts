// Kit-C VFX bundle (KIT_SPELL_IDS_C). Components live in ./kitC/*.tsx.
import type { VfxBundle } from '../types.ts';
import { BreatheFireProjectile, BreatheFireVfx, DragonBloodVfx, DragonTailVfx } from './kitC/dragon.tsx';
import { DualBreathProjectile, DualBreathVfx, IcePathVfx, IcePathZone, LiquidFireVfx } from './kitC/jakiro.tsx';
import { HeadshotVfx, ShrapnelVfx, ShrapnelZone, TakeAimVfx } from './kitC/sniper.tsx';
import { ArcaneAuraVfx, BadJujuVfx, PoisonTouchVfx, ShadowWaveVfx } from './kitC/support.tsx';
import { PowershotProjectile, PowershotVfx, ShackleshotVfx, WindrunVfx } from './kitC/wind.tsx';

export const kitCVfx: VfxBundle = {
  vfx: {
    shrapnel: ShrapnelVfx,
    headshot: HeadshotVfx,
    take_aim: TakeAimVfx,
    arcane_aura: ArcaneAuraVfx,
    poison_touch: PoisonTouchVfx,
    shadow_wave: ShadowWaveVfx,
    bad_juju: BadJujuVfx,
    breathe_fire: BreatheFireVfx,
    dragon_tail: DragonTailVfx,
    dragon_blood: DragonBloodVfx,
    shackleshot: ShackleshotVfx,
    powershot: PowershotVfx,
    windrun: WindrunVfx,
    dual_breath: DualBreathVfx,
    ice_path: IcePathVfx,
    liquid_fire: LiquidFireVfx,
  },
  zones: { shrapnel: ShrapnelZone, ice_path: IcePathZone },
  projectiles: { breathe_fire: BreatheFireProjectile, dual_breath: DualBreathProjectile, powershot: PowershotProjectile },
};
