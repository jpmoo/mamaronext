import {
  forceCollide,
  forceLink,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import { GOALS, schoolLabel, type Goal } from './goals';
import { groupsForGoal, themeColor, type Lens, type LensGroup } from './lenses';

export const LAYOUT = {
  gutter: 16,
  pad: 14,
  minRegionH: 150,
  minColumnW: 196,
  narrowBreakpoint: 900,
  titleSize: 14,
  titleLead: 17,
  titleTop: 21,
  metaGap: 15,
  headerPad: 10,
};

export type BubbleNode = SimulationNodeDatum & {
  /** Unique per drawn bubble: a goal can appear in several regions at once. */
  key: string;
  goal: Goal;
  group: string;
  color: string;
  r: number;
  x: number;
  y: number;
  /** Region center, the target of the positioning forces. */
  cx: number;
  cy: number;
  /** Region interior, clamped against on every tick. */
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type RegionBox = {
  group: LensGroup;
  x: number;
  y: number;
  w: number;
  h: number;
  count: number;
  titleLines: string[];
  titleH: number;
};

export type MapLayout = {
  width: number;
  height: number;
  scale: number;
  /** Shared by every bubble, so the map reads as one system. */
  labelFontSize: number;
  regions: RegionBox[];
  nodes: BubbleNode[];
  links: { source: BubbleNode; target: BubbleNode; color: string }[];
};

/**
 * Every goal draws at the same size. The only exception is a school goal that
 * hangs off an umbrella, which is smaller to read as part of its parent.
 */
export function radiusFor(goal: Goal): number {
  return goal.parent ? 34 : 50;
}

const area = (r: number) => Math.PI * r * r;

/** Greedy wrap against a pixel width, using an average glyph-width estimate. */
export function wrapToWidth(text: string, maxWidth: number, fontSize: number): string[] {
  const maxChars = Math.max(8, Math.floor(maxWidth / (fontSize * 0.55)));
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) line = next;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const headerHeight = (titleLines: number) =>
  LAYOUT.titleTop + titleLines * LAYOUT.titleLead + LAYOUT.metaGap + LAYOUT.headerPad;

/** What a bubble is labelled with: the school for an umbrella's children. */
export function bubbleLabel(goal: Goal): string {
  if (goal.parent) return schoolLabel(goal.schools[0]);
  return goal.shortTitle ?? goal.title;
}

/** Which goals are drawn, given the current expand/collapse state. */
export function visibleGoals(expanded: Set<string>): Goal[] {
  return GOALS.filter((g) => !g.parent || expanded.has(g.parent));
}

type Weighted = { group: LensGroup; count: number; weight: number };

function weigh(lens: Lens, goals: Goal[]): Weighted[] {
  return lens.groups.map((group) => {
    const members = goals.filter((g) => groupsForGoal(lens, g).includes(group.id));
    return {
      group,
      count: members.length,
      weight: members.reduce((s, g) => s + area(radiusFor(g)), 0),
    };
  });
}

/** Split one axis proportionally to weight, with a floor, summing exactly. */
function split(items: Weighted[], total: number, min: number): number[] {
  const totalWeight = items.reduce((s, r) => s + r.weight, 0);
  const usable = total - LAYOUT.gutter * (items.length - 1);
  let sizes = items.map((r) => Math.max(min, (r.weight / totalWeight) * usable));
  const sum = sizes.reduce((s, v) => s + v, 0);
  if (sum !== usable) sizes = sizes.map((v) => (v * usable) / sum);
  return sizes;
}

function finishRegion(
  w: Weighted,
  x: number,
  y: number,
  width: number,
  height: number,
): RegionBox {
  const titleLines = wrapToWidth(w.group.title, width - 34 - LAYOUT.pad, LAYOUT.titleSize);
  return {
    group: w.group,
    x,
    y,
    w: width,
    h: height,
    count: w.count,
    titleLines,
    titleH: headerHeight(titleLines.length),
  };
}

/**
 * Choose a grid width that wastes no cells if it can, and otherwise keeps cells
 * from getting too letter-boxed. Twelve regions on a wide screen want 4×3, not
 * 5×3 with three cells stranded empty.
 */
function bestColumnCount(count: number, width: number, height: number): number {
  const targetAspect = 1.3;
  let best = 2;
  let bestScore = Infinity;
  for (let cols = 2; cols <= Math.min(6, count); cols++) {
    const rows = Math.ceil(count / cols);
    const empty = cols * rows - count;
    const cellW = (width - LAYOUT.gutter * (cols - 1)) / cols;
    const cellH = (height - LAYOUT.gutter * (rows - 1)) / rows;
    const score = empty * 1.5 + Math.abs(cellW / cellH - targetAspect);
    if (score < bestScore) {
      bestScore = score;
      best = cols;
    }
  }
  return best;
}

/**
 * Region layout. Four groups or fewer get proportional columns (or rows when
 * narrow), which reads best for the initiative-style views. More than four —
 * the data-points view — fall back to an even grid.
 */
function computeRegions(
  width: number,
  height: number,
  lens: Lens,
  goals: Goal[],
): RegionBox[] {
  // A lens group with nothing in it (e.g. "Other" once everything is filed
  // elsewhere) would just be a blank plate, so it doesn't get drawn.
  const weights = weigh(lens, goals).filter((w) => w.count > 0);
  const narrow = width < LAYOUT.narrowBreakpoint;

  if (weights.length === 0) return [];

  if (weights.length <= 4) {
    if (narrow) {
      const heights = split(weights, height, LAYOUT.minRegionH);
      let y = 0;
      return weights.map((w, i) => {
        const h = i === weights.length - 1 ? height - y : Math.round(heights[i]);
        const box = finishRegion(w, 0, y, width, h);
        y += h + LAYOUT.gutter;
        return box;
      });
    }
    const widths = split(weights, width, LAYOUT.minColumnW);
    let x = 0;
    return weights.map((w, i) => {
      const cw = i === weights.length - 1 ? width - x : Math.round(widths[i]);
      const box = finishRegion(w, x, 0, cw, height);
      x += cw + LAYOUT.gutter;
      return box;
    });
  }

  const cols = narrow ? (width < 620 ? 1 : 2) : bestColumnCount(weights.length, width, height);
  const rows = Math.ceil(weights.length / cols);
  const cellW = (width - LAYOUT.gutter * (cols - 1)) / cols;
  const cellH = (height - LAYOUT.gutter * (rows - 1)) / rows;

  return weights.map((w, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return finishRegion(
      w,
      Math.round(col * (cellW + LAYOUT.gutter)),
      Math.round(row * (cellH + LAYOUT.gutter)),
      Math.round(cellW),
      Math.round(cellH),
    );
  });
}

/**
 * One scale factor for every bubble, chosen so the tightest region still fits
 * its largest bubble and its total bubble area. Scaling globally rather than per
 * region keeps size comparable across the map, so size still reads as "how big
 * a goal is". Allowed above 1 so a tall window grows the bubbles instead of
 * stranding whitespace, and floored so a cramped one stays readable.
 */
function computeScale(regions: RegionBox[], lens: Lens, goals: Goal[]): number {
  let scale = Infinity;
  for (const region of regions) {
    const members = goals.filter((g) => groupsForGoal(lens, g).includes(region.group.id));
    if (!members.length) continue;

    const maxR = Math.max(...members.map(radiusFor));
    const innerW = Math.max(1, region.w - LAYOUT.pad * 2);
    const innerH = Math.max(1, region.h - region.titleH - LAYOUT.pad * 2);
    const needed = members.reduce((s, g) => s + area(radiusFor(g)), 0) / 0.5;

    scale = Math.min(
      scale,
      innerH / (2 * maxR),
      innerW / (2 * maxR),
      Math.sqrt((innerW * innerH) / needed),
    );
  }
  return Math.max(0.42, Math.min(1.45, scale));
}

export type BuildOptions = {
  width: number;
  height: number;
  lens: Lens;
  expanded: Set<string>;
  /**
   * Positions to carry over, so expanding a group doesn't reshuffle the map.
   * `pinned` marks bubbles the user has dragged, which stay put.
   */
  previous?: Map<string, { x: number; y: number; pinned: boolean }>;
  /** Ticks to settle before returning. 0 keeps seeded positions for animation. */
  settleTicks?: number;
};

export function buildLayout(options: BuildOptions): MapLayout {
  const { width, height, lens, expanded, previous, settleTicks = 500 } = options;

  // Region geometry and bubble size are computed from every goal, not just the
  // visible ones. Otherwise expanding an umbrella changes the weights, which
  // resizes every region and rescales every bubble — stranding bubbles outside
  // plates that moved under them. Expanding is now purely additive.
  const regions = computeRegions(width, height, lens, GOALS);
  const scale = computeScale(regions, lens, GOALS);

  const goals = visibleGoals(expanded);

  const nodes: BubbleNode[] = [];

  for (const region of regions) {
    const members = goals.filter((g) => groupsForGoal(lens, g).includes(region.group.id));
    const innerTop = region.y + region.titleH;
    const cx = region.x + region.w / 2;
    const cy = (innerTop + region.y + region.h) / 2;

    members.forEach((goal, i) => {
      const key = `${goal.id}::${region.group.id}`;
      const r = radiusFor(goal) * scale;

      // Seed on a phyllotaxis spiral — distinct, deterministic starting points,
      // so no force ever needs to jiggle and repeat runs match.
      const angle = i * 2.399963;
      const spread = 14 * Math.sqrt(i + 0.5);
      let x = cx + spread * Math.cos(angle);
      let y = cy + spread * Math.sin(angle);

      const carried = previous?.get(key);
      if (carried) {
        x = carried.x;
        y = carried.y;
      } else if (goal.parent) {
        // A child popping out of its umbrella starts at the umbrella, nudged
        // just enough for the collision force to push it clear.
        const parentAt = previous?.get(`${goal.parent}::${region.group.id}`);
        if (parentAt) {
          x = parentAt.x + Math.cos(angle) * 6;
          y = parentAt.y + Math.sin(angle) * 6;
        }
      }

      const node: BubbleNode = {
        key,
        goal,
        group: region.group.id,
        color: themeColor(goal),
        r,
        x,
        y,
        cx,
        cy,
        minX: region.x + LAYOUT.pad,
        maxX: region.x + region.w - LAYOUT.pad,
        minY: innerTop,
        maxY: region.y + region.h - LAYOUT.pad,
      };

      if (carried?.pinned) {
        node.fx = x;
        node.fy = y;
      }

      nodes.push(node);
    });
  }

  const byKey = new Map(nodes.map((n) => [n.key, n]));
  const links: MapLayout['links'] = [];
  for (const node of nodes) {
    const parentId = node.goal.parent;
    if (!parentId) continue;
    const parent = byKey.get(`${parentId}::${node.group}`);
    // Only linked when both land in the same region — under some lenses a child
    // and its umbrella are filed apart, and a line across regions would mislead.
    if (parent) links.push({ source: parent, target: node, color: node.color });
  }

  if (settleTicks > 0) {
    // Settle each region on its own. Regions never overlap and every bubble is
    // clamped to its own box, so a shared simulation would only let collisions
    // leak across region boundaries.
    for (const region of regions) {
      const groupNodes = nodes.filter((n) => n.group === region.group.id);
      const groupLinks = links.filter((l) => l.source.group === region.group.id);
      const sim = createSimulation(groupNodes, groupLinks);
      for (let i = 0; i < settleTicks; i++) {
        sim.tick();
        clampNodes(groupNodes);
      }
      sim.stop();
    }
  }

  // Carried-over positions were measured against the previous layout, so clamp
  // unconditionally — a bubble must never be left sitting outside its plate.
  clampNodes(nodes);

  return {
    width,
    height,
    scale,
    labelFontSize: chooseLabelSize(nodes),
    regions,
    nodes,
    links,
  };
}

/** Keep every bubble inside its own region. Applied after each tick. */
export function clampNodes(nodes: BubbleNode[]): void {
  for (const n of nodes) {
    const x = Math.min(n.maxX - n.r, Math.max(n.minX + n.r, n.x));
    const y = Math.min(n.maxY - n.r, Math.max(n.minY + n.r, n.y));
    n.x = x;
    n.y = y;
    // A pinned node is held at fx/fy every tick, so the clamp has to move the
    // pin too — otherwise it would fight the bounds forever.
    if (n.fx != null) n.fx = x;
    if (n.fy != null) n.fy = y;
  }
}

/**
 * Push `node` clear of any bubble it is sitting on top of.
 *
 * The simulation resolves overlaps by moving whichever node is free, but a
 * bubble dropped onto another *pinned* bubble is a stand-off — neither can
 * move, and the overlap is permanent. So the one that just landed is the one
 * that gives way.
 */
export function separateFromNeighbours(node: BubbleNode, others: BubbleNode[]): void {
  for (let pass = 0; pass < 24; pass++) {
    let moved = false;

    for (const other of others) {
      if (other === node) continue;

      const gap = node.r + other.r + 6;
      let dx = node.x - other.x;
      let dy = node.y - other.y;
      let dist = Math.hypot(dx, dy);

      if (dist >= gap) continue;

      // Exactly coincident: pick a deterministic direction to escape along.
      if (dist === 0) {
        dx = 1;
        dy = 0;
        dist = 1;
      }

      const push = gap - dist;
      node.x = Math.min(node.maxX - node.r, Math.max(node.minX + node.r, node.x + (dx / dist) * push));
      node.y = Math.min(node.maxY - node.r, Math.max(node.minY + node.r, node.y + (dy / dist) * push));
      moved = true;
    }

    if (!moved) break;
  }

  if (node.fx != null) node.fx = node.x;
  if (node.fy != null) node.fy = node.y;
}

export function createSimulation(
  nodes: BubbleNode[],
  links: MapLayout['links'],
): Simulation<BubbleNode, SimulationLinkDatum<BubbleNode>> {
  const sim = forceSimulation(nodes)
    .force('collide', forceCollide<BubbleNode>((d) => d.r + 7).strength(0.92).iterations(3))
    .force('x', forceX<BubbleNode>((d) => d.cx).strength(0.055))
    .force('y', forceY<BubbleNode>((d) => d.cy).strength(0.055))
    .stop();

  if (links.length) {
    sim.force(
      'link',
      forceLink<BubbleNode, SimulationLinkDatum<BubbleNode>>(
        links.map((l) => ({ source: l.source, target: l.target })),
      )
        .distance((l) => (l.source as BubbleNode).r + (l.target as BubbleNode).r + 16)
        .strength(0.55),
    );
  }

  return sim;
}

const maxCharsFor = (r: number, fontSize: number) =>
  Math.max(4, Math.floor((r * 1.62) / (fontSize * 0.53)));

const maxLinesFor = (r: number, fontSize: number, reserveLines: number) =>
  Math.max(1, Math.min(5, Math.max(2, Math.floor((r * 1.5) / (fontSize * 1.18)))) - reserveLines);

/** Greedy word wrap at a given size, reporting whether it had to cut text. */
function wrapAt(
  text: string,
  r: number,
  fontSize: number,
  reserveLines: number,
): { lines: string[]; truncated: boolean } {
  const maxChars = maxCharsFor(r, fontSize);
  const maxLines = maxLinesFor(r, fontSize, reserveLines);

  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) line = next;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[\s,;:]+$/, '')}…`;
    return { lines: kept, truncated: true };
  }
  return { lines, truncated: false };
}

/** Wrap a label at a fixed size, ellipsizing anything that overflows. */
export function wrapLabel(
  text: string,
  r: number,
  fontSize: number,
  reserveLines = 0,
): string[] {
  return wrapAt(text, r, fontSize, reserveLines).lines;
}

/**
 * One font size for every bubble on the map.
 *
 * Uniform text reads as a single system, so rather than sizing each bubble
 * independently this picks the largest size that fits the great majority of
 * labels outright, and lets the few genuinely long ones ellipsize.
 */
function chooseLabelSize(nodes: BubbleNode[]): number {
  const FLOOR = 8;
  if (!nodes.length) return FLOOR;

  const start = Math.max(...nodes.map((n) => fontSizeFor(n.r)));
  const target = Math.ceil(nodes.length * 0.85);

  for (let fs = start; fs >= FLOOR - 0.001; fs -= 0.5) {
    let fitting = 0;
    for (const node of nodes) {
      const label = bubbleLabel(node.goal);
      const reserve = !node.goal.parent && node.goal.kind === 'school' ? 1 : 0;
      const longestWord = Math.max(...label.split(/\s+/).map((w) => w.length));
      if (maxCharsFor(node.r, fs) < longestWord) continue;
      if (!wrapAt(label, node.r, fs, reserve).truncated) fitting++;
    }
    if (fitting >= target) return fs;
  }
  return FLOOR;
}

function fontSizeFor(r: number): number {
  if (r >= 56) return 13.5;
  if (r >= 48) return 12.5;
  if (r >= 40) return 11.5;
  if (r >= 32) return 10.5;
  return 9.5;
}

/**
 * The page background, mirroring `--page` in globals.css. Needed in JS because
 * bubbles are drawn over a translucent region plate: to hide the link lines
 * behind them, each bubble needs an opaque disc of exactly the color it is
 * sitting on.
 */
export const PAGE_BG = '#f4f2ef';

const parseHex = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Flatten `fg` at `alpha` over `bg` into an opaque color. */
export function blend(bg: string, fg: string | undefined, alpha: number): string {
  if (!fg) return bg;
  const [br, bgg, bb] = parseHex(bg);
  const [fr, fg2, fb] = parseHex(fg);
  const mix = (b: number, f: number) => Math.round(b * (1 - alpha) + f * alpha);
  return `rgb(${mix(br, fr)}, ${mix(bgg, fg2)}, ${mix(bb, fb)})`;
}

export function hexToRgba(hex: string | undefined, alpha: number): string {
  if (!hex) return `rgba(137, 135, 129, ${alpha})`;
  const h = hex.replace('#', '');
  const n = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16,
  );
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
