/**
 * FROZEN CONTRACT — owned by WP-0 (integrator).
 *
 * Every work package codes against this file. No work package may edit it. If a brief seems to
 * require a change here, stop and report to the integrator instead of editing.
 *
 * Conventions that hold throughout: positions are world-space floats on a single lane
 * (see LANE_LENGTH), all time values are SECONDS (never milliseconds), and nothing in src/sim/
 * may touch the DOM, canvas, Date.now(), or Math.random().
 */

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------

/** Stable identifier for a roster entry, e.g. 'zeus'. Lowercase, no spaces. */
export type DeityId = string;

/** Relations only resolve between units of the SAME pantheon — this is a core design rule. */
export type Pantheon = 'greek' | 'norse' | 'egyptian';

/** Cost/power bracket. Chaff deliberately has zero relations so procs read as special. */
export type Tier = 'chaff' | 'demigod' | 'god' | 'titan';

/** Behavioural flags that override or extend default relation handling. */
export type Trait = 'devourer' | 'healer' | 'charmer' | 'shielder';

/**
 * Directed relation kinds. Symmetric kinds ('sibling', 'spouse', 'lover', 'rival') are stored
 * ONCE and must be treated as bidirectional by the resolver. Asymmetric kinds ('parent',
 * 'slain_by', 'persecutes') are stored in the direction named below and their inverses are
 * DERIVED, never stored:
 *   parent:     from IS THE PARENT OF to     (inverse: to is the child of from)
 *   slain_by:   from WAS SLAIN BY to         (inverse: from slew to)
 *   persecutes: from PERSECUTES to           (inverse: to is persecuted by from)
 */
export type RelationKind = 'parent' | 'sibling' | 'spouse' | 'lover' | 'slain_by' | 'persecutes' | 'rival';

/** One edge in the genealogy graph. */
export interface Edge {
  readonly from: DeityId;
  readonly to: DeityId;
  readonly kind: RelationKind;
}

/** A roster entry. Pure data — no behaviour, no functions. */
export interface Deity {
  readonly id: DeityId;
  readonly name: string;
  readonly pantheon: Pantheon;
  readonly tier: Tier;
  /** Faith cost to summon. */
  readonly cost: number;
  readonly hp: number;
  /** Damage per attack, before modifiers. */
  readonly damage: number;
  /** Seconds between attacks, before modifiers. Lower is faster. */
  readonly attackInterval: number;
  /** Attack reach in world units. */
  readonly range: number;
  /** Movement in world units per second. */
  readonly speed: number;
  /** Flat damage reduction applied after multipliers. Ignored when a modifier sets armorPen. */
  readonly armor: number;
  readonly traits: readonly Trait[];
}

/** Lookup from id to roster entry. Built by the integrator from the WP-3 roster. */
export type DeityIndex = ReadonlyMap<DeityId, Deity>;

/**
 * Indexed genealogy graph. Construct ONLY via buildGraph() — the index must stay in sync with
 * the edge list, and hand-built graphs will silently miss derived inverse relations.
 */
export interface RelationGraph {
  readonly edges: readonly Edge[];
  /** Key is `${from}|${to}`. Includes derived inverse entries for asymmetric kinds. */
  readonly byPair: ReadonlyMap<string, readonly Edge[]>;
}

// ---------------------------------------------------------------------------
// Modifiers — the relational engine's output
// ---------------------------------------------------------------------------

/** Combat modifiers fire when A attacks an ENEMY B. Aura modifiers fire between ALLIES. */
export type ModifierName =
  // combat
  | 'Reluctance'
  | 'Filicide'
  | 'Usurpation'
  | 'Rivalry'
  | 'Entranced'
  | 'Vengeance'
  | 'Bound'
  | 'Wrath'
  | 'Defiance'
  // aura
  | 'Blessed'
  | 'Kinship'
  | 'Devoted'
  | 'Jealousy'
  | 'Resented';

/**
 * A single active relational effect. Multipliers are neutral at 1. Modifiers stack
 * multiplicatively; the caller is responsible for applying MAX_DAMAGE_MULT as a ceiling.
 */
export interface Modifier {
  readonly name: ModifierName;
  /** Multiplies outgoing damage. */
  readonly damageMult: number;
  /** Multiplies attack rate. >1 means attacks land more often. */
  readonly attackSpeedMult: number;
  /** Multiplies the defender-side armor value of whichever unit the modifier applies to. */
  readonly armorMult: number;
  /** When true, the target's armor is ignored entirely. */
  readonly armorPen: boolean;
  /** When true, the attacker will not attack and both units halt (Entranced). */
  readonly suppress: boolean;
  /** Hex colour driving the tether line and floating proc tag for this modifier. */
  readonly color: string;
}

// ---------------------------------------------------------------------------
// Runtime simulation state
// ---------------------------------------------------------------------------

export type Side = 'player' | 'enemy';

/** A live entity on the lane. Bases are units with isBase=true, speed 0 and no attack. */
export interface Unit {
  id: number;
  readonly deityId: DeityId;
  readonly side: Side;
  /** World-space position along the lane, 0..LANE_LENGTH. */
  x: number;
  hp: number;
  readonly maxHp: number;
  /** Seconds remaining until this unit may attack again. */
  cooldown: number;
  targetId: number | null;
  readonly isBase: boolean;
}

/**
 * Things the sim did during a tick, drained by the renderer each frame. This is how a pure sim
 * communicates with the view layer — the sim never draws.
 */
export type SimEvent =
  | {
      readonly kind: 'hit';
      readonly attackerId: number;
      readonly defenderId: number;
      readonly damage: number;
      readonly modifiers: readonly ModifierName[];
    }
  | { readonly kind: 'death'; readonly unitId: number }
  | { readonly kind: 'spawn'; readonly unitId: number };

export type Outcome = 'ongoing' | 'victory' | 'defeat';

/** Complete mutable simulation state. Serialisable; contains no functions. */
export interface World {
  /** Seconds elapsed since battle start. */
  time: number;
  units: Unit[];
  faith: number;
  faithMax: number;
  /** Faith gained per second. */
  faithRegen: number;
  nextUnitId: number;
  outcome: Outcome;
  /** Drained (emptied) by the render layer every frame. */
  events: SimEvent[];
}

/** Seeded random source. Injected so the sim stays deterministic and testable. */
export interface Rng {
  /** Returns a float in [0, 1). */
  next(): number;
}

// ---------------------------------------------------------------------------
// Stage scripting
// ---------------------------------------------------------------------------

/** One scripted spawn on the battle timeline. */
export interface StageWave {
  /** Battle time in seconds at which this unit spawns. */
  readonly at: number;
  readonly deityId: DeityId;
  readonly side: Side;
}

export interface Stage {
  readonly id: string;
  readonly name: string;
  /** What the player may summon, in HUD order. */
  readonly playerDeck: readonly DeityId[];
  readonly waves: readonly StageWave[];
  readonly startingFaith: number;
  readonly faithMax: number;
  readonly faithRegen: number;
  readonly playerBaseHp: number;
  readonly enemyBaseHp: number;
}

// ---------------------------------------------------------------------------
// Frozen function signatures
// ---------------------------------------------------------------------------
// Implementations MUST be typed with these aliases, e.g.
//   export const resolveCombat: ResolveCombat = (attacker, defender, graph) => { ... };
// This makes contract drift a compile error rather than an integration surprise.

/** WP-1. Builds the indexed graph, including derived inverse edges. */
export type BuildGraph = (edges: readonly Edge[]) => RelationGraph;

/** WP-1. Modifiers applying to `attacker` when it attacks enemy `defender`. */
export type ResolveCombat = (attacker: Deity, defender: Deity, graph: RelationGraph) => Modifier[];

/**
 * WP-1. Modifiers applying TO `subject` from allies around it.
 * `nearbyAllies` are within AURA_RADIUS; `fieldAllies` is every ally alive (Jealousy is
 * field-wide, not proximity-based). Neither list includes `subject`.
 */
export type ResolveAuras = (
  subject: Deity,
  nearbyAllies: readonly Deity[],
  fieldAllies: readonly Deity[],
  graph: RelationGraph,
) => Modifier[];

/** WP-2. Builds initial world state from a stage definition, including both base units. */
export type CreateWorld = (stage: Stage, deities: DeityIndex) => World;

/** WP-2. Advances the world by exactly one fixed step. Mutates `world` in place. */
export type TickWorld = (
  world: World,
  dt: number,
  graph: RelationGraph,
  deities: DeityIndex,
  rng: Rng,
) => void;

/** WP-2. Appends a unit to the world and emits a 'spawn' event. Returns the new unit. */
export type SpawnUnit = (world: World, deity: Deity, side: Side) => Unit;

/** WP-4. Draws lane, bases, units and health. Must not mutate `world`. */
export type DrawWorld = (
  ctx: CanvasRenderingContext2D,
  world: World,
  deities: DeityIndex,
) => void;

/**
 * WP-5. Draws relational tethers, floating proc tags and damage numbers.
 * Called after drawWorld. Owns its own animation state internally; `dt` is real elapsed
 * seconds for the frame. Must not mutate `world`.
 */
export type DrawEffects = (
  ctx: CanvasRenderingContext2D,
  world: World,
  deities: DeityIndex,
  graph: RelationGraph,
  dt: number,
) => void;

/** WP-6. Live HUD handle returned by mountHud. */
export interface HudHandle {
  /** Called once per rendered frame with current state. */
  update(world: World): void;
}

/** WP-6. Builds the faith bar and summon buttons into `root`. */
export type MountHud = (
  root: HTMLElement,
  deck: readonly Deity[],
  onSummon: (deityId: DeityId) => void,
) => HudHandle;
