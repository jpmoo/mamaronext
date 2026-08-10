/**
 * Organizing principles ("lenses"). Each lens defines the regions on the map and
 * decides which region(s) a goal belongs to. A goal may belong to more than one
 * region — in the data-points lens it usually does — in which case it draws once
 * per region it touches.
 */

import {
  BOE_FOCUS,
  CLASSIFICATIONS,
  DATA_POINTS,
  SCORECARD_BUCKETS,
  THEMES,
} from './classifications';
import { GOALS, INITIATIVES, type Goal } from './goals';

export type LensGroup = {
  id: string;
  title: string;
  blurb?: string;
  /** Only set for lenses that color by group (4 or fewer groups). */
  color?: string;
};

export type Lens = {
  id: string;
  label: string;
  groups: LensGroup[];
  groupsFor: (goal: Goal) => string[];
  /**
   * 'group' colors bubbles by their region — only valid at 4 groups or fewer,
   * where the categorical palette validates. 'scorecard' colors bubbles by the
   * goal's scorecard bucket and leaves the region plates neutral, for lenses
   * with too many regions to color safely.
   */
  colorMode: 'group' | 'scorecard';
};

/**
 * The validated four-slot categorical palette (see README). Any lens using
 * `colorMode: 'group'` must have at most four groups so these hold.
 */
const PALETTE = ['#2a78d6', '#1baf7a', '#4a3aa7', '#008300'];

const UNCLASSIFIED = 'unclassified';

const classify = (goal: Goal) => CLASSIFICATIONS[goal.id];

export const LENSES: Lens[] = [
  {
    id: 'themes',
    label: 'Personalization / Mentorship / Expertise',
    colorMode: 'group',
    groups: THEMES.map((t, i) => ({
      id: t.key,
      title: t.label,
      blurb: t.blurb,
      color: PALETTE[i],
    })),
    groupsFor: (goal) => [classify(goal)?.theme ?? UNCLASSIFIED],
  },
  {
    id: 'scorecard',
    label: 'Scorecard buckets',
    colorMode: 'group',
    groups: SCORECARD_BUCKETS.map((b, i) => ({
      id: b.key,
      title: b.label,
      blurb: b.blurb,
      color: PALETTE[i],
    })),
    groupsFor: (goal) => [classify(goal)?.scorecard ?? UNCLASSIFIED],
  },
  {
    id: 'initiatives',
    label: "Superintendent's initiatives",
    colorMode: 'group',
    groups: INITIATIVES.map((init, i) => ({
      id: init.id,
      title: init.title,
      blurb: init.blurb,
      color: PALETTE[i],
    })),
    groupsFor: (goal) => [goal.initiative],
  },
  {
    id: 'boe-focus',
    label: 'Board of Education focus areas',
    colorMode: 'scorecard',
    groups: BOE_FOCUS.map((f) => ({ id: f.key, title: f.label, blurb: f.blurb })),
    groupsFor: (goal) => {
      const focus = classify(goal)?.boeFocus;
      return focus && focus.length ? focus : [UNCLASSIFIED];
    },
  },
  {
    id: 'data-points',
    label: 'Data points touched',
    colorMode: 'scorecard',
    groups: DATA_POINTS.map((d) => ({ id: d.key, title: d.label, blurb: d.blurb })),
    groupsFor: (goal) => {
      const points = classify(goal)?.dataPoints;
      return points && points.length ? points : [UNCLASSIFIED];
    },
  },
];

export const lensById = (id: string) => LENSES.find((l) => l.id === id) ?? LENSES[0];

/**
 * Which regions a goal belongs to under a lens.
 *
 * A school goal under an umbrella always sits with its umbrella, so expanding
 * one always pops out the whole family in one place. Where the child's own
 * filing overlaps the parent's, that overlap wins; otherwise it simply follows
 * the parent. Its own classification still shows on its detail panel.
 */
export function groupsForGoal(lens: Lens, goal: Goal): string[] {
  const own = lens.groupsFor(goal);
  if (!goal.parent) return own;

  const parent = GOALS.find((g) => g.id === goal.parent);
  if (!parent) return own;

  const parentGroups = lens.groupsFor(parent);
  const shared = own.filter((g) => parentGroups.includes(g));
  return shared.length ? shared : parentGroups;
}

/**
 * Scorecard-bucket color, used for bubbles whenever a lens has too many regions
 * to color by region. Slots match the scorecard lens, so a goal keeps the same
 * color across both views.
 */
export const scorecardColor = (goal: Goal) => {
  const bucket = classify(goal)?.scorecard;
  const i = SCORECARD_BUCKETS.findIndex((b) => b.key === bucket);
  return PALETTE[i] ?? '#898781';
};

/** The scorecard palette as a legend-ready list. */
export const SCORECARD_LEGEND = SCORECARD_BUCKETS.map((b, i) => ({
  id: b.key,
  title: b.label,
  short: b.short,
  color: PALETTE[i],
}));
