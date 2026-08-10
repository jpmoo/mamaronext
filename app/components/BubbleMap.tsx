'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { schoolAbbr, type Goal } from '@/lib/goals';
import type { Lens } from '@/lib/lenses';
import {
  LAYOUT,
  buildLayout,
  clampNodes,
  createSimulation,
  PAGE_BG,
  blend,
  bubbleLabel,
  hexToRgba,
  wrapLabel,
  type BubbleNode,
  type MapLayout,
} from '@/lib/layout';

type Props = {
  lens: Lens;
  isMatch: (goal: Goal) => boolean;
  selectedId: string | null;
  expanded: Set<string>;
  onToggleExpand: (goal: Goal) => void;
  onSelect: (goal: Goal) => void;
  onHover: (goal: Goal | null, x: number, y: number) => void;
  /** Bumping this re-runs the layout from scratch. */
  resetSignal: number;
};

const NEUTRAL = '#898781';

export default function BubbleMap({
  lens,
  isMatch,
  selectedId,
  expanded,
  onToggleExpand,
  onSelect,
  onHover,
  resetSignal,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<BubbleNode[]>([]);
  // One simulation per region. Regions are independent — dragging or expanding
  // inside one must not stir the others.
  const simsRef = useRef<Map<string, ReturnType<typeof createSimulation>>>(new Map());
  const dragRef = useRef<{
    node: BubbleNode;
    moved: boolean;
    sim?: ReturnType<typeof createSimulation>;
    groupNodes: BubbleNode[];
  } | null>(null);
  const previousBuild = useRef<string>('');
  const previousKeys = useRef<Map<string, Set<string>>>(new Map());

  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [layout, setLayout] = useState<MapLayout | null>(null);
  // Bumped on every simulation tick; node positions are mutated in place.
  const [, setFrame] = useState(0);

  // Measure synchronously — deferring to requestAnimationFrame would leave the
  // map blank in a tab that isn't currently rendering (rAF never fires there).
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      const w = Math.round(frame.clientWidth);
      const h = Math.round(frame.clientHeight);
      if (w < 200 || h < 200) return;
      setSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    };

    measure();

    let timer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(measure, 120);
    });
    observer.observe(frame);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const expandedKey = useMemo(() => [...expanded].sort().join(','), [expanded]);

  useEffect(() => {
    if (!size) return;

    // Same lens at the same size means this is an expand/collapse: keep every
    // existing bubble where it is and let the new ones push out from their
    // umbrella. Anything else is a fresh, fully settled layout.
    const signature = `${lens.id}|${size.w}x${size.h}|${resetSignal}`;
    const incremental = previousBuild.current === signature;
    previousBuild.current = signature;

    const previous = new Map(
      nodesRef.current.map((n) => [
        n.key,
        { x: n.x, y: n.y, pinned: n.fx != null || n.fy != null },
      ]),
    );

    const next = buildLayout({
      width: size.w,
      height: size.h,
      lens,
      expanded,
      previous: incremental ? previous : undefined,
      settleTicks: incremental ? 0 : 500,
    });

    nodesRef.current = next.nodes;
    setLayout(next);

    for (const sim of simsRef.current.values()) sim.stop();

    const keysByGroup = new Map<string, Set<string>>();
    for (const node of next.nodes) {
      if (!keysByGroup.has(node.group)) keysByGroup.set(node.group, new Set());
      keysByGroup.get(node.group)!.add(node.key);
    }

    const sims = new Map<string, ReturnType<typeof createSimulation>>();
    for (const region of next.regions) {
      const id = region.group.id;
      const groupNodes = next.nodes.filter((n) => n.group === id);
      const groupLinks = next.links.filter((l) => l.source.group === id);

      const sim = createSimulation(groupNodes, groupLinks);
      sim.on('tick', () => {
        clampNodes(groupNodes);
        setFrame((f) => f + 1);
      });
      sims.set(id, sim);

      // Only reheat a region whose membership actually changed — expanding an
      // umbrella shouldn't nudge bubbles in any other bucket.
      if (incremental) {
        const before = previousKeys.current.get(id);
        const after = keysByGroup.get(id)!;
        const changed =
          !before || before.size !== after.size || [...after].some((k) => !before.has(k));
        if (changed) sim.alpha(0.55).restart();
      }
    }

    previousKeys.current = keysByGroup;
    simsRef.current = sims;

    return () => {
      for (const sim of sims.values()) sim.stop();
    };
    // `expanded` is covered by expandedKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, lens, expandedKey, resetSignal]);

  const toSvgPoint = useCallback((clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const activate = useCallback(
    (goal: Goal) => {
      // An umbrella both pops its schools out and opens its own detail panel.
      if (goal.kind === 'umbrella') onToggleExpand(goal);
      else onSelect(goal);
    },
    [onToggleExpand, onSelect],
  );

  const handlePointerDown = (e: React.PointerEvent, node: BubbleNode) => {
    if (e.button !== 0) return;
    if (!isMatch(node.goal)) return;
    e.preventDefault();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture is a nicety; dragging still works without it.
    }
    const sim = simsRef.current.get(node.group);
    dragRef.current = {
      node,
      moved: false,
      sim,
      groupNodes: nodesRef.current.filter((n) => n.group === node.group),
    };
    node.fx = node.x;
    node.fy = node.y;
    sim?.alphaTarget(0.3).restart();
  };

  const handlePointerMove = (e: React.PointerEvent, node: BubbleNode) => {
    const drag = dragRef.current;
    if (!drag) {
      onHover(node.goal, e.clientX, e.clientY);
      return;
    }
    const { x, y } = toSvgPoint(e.clientX, e.clientY);
    const n = drag.node;
    if (Math.hypot(x - n.x, y - n.y) > 2) drag.moved = true;

    n.fx = Math.min(n.maxX - n.r, Math.max(n.minX + n.r, x));
    n.fy = Math.min(n.maxY - n.r, Math.max(n.minY + n.r, y));
    n.x = n.fx;
    n.y = n.fy;

    // Step and repaint from the pointer stream rather than waiting on the
    // simulation's own timer, which is requestAnimationFrame-backed and can be
    // starved. Only this bubble's own region is stepped.
    if (drag.sim) {
      drag.sim.tick();
      clampNodes(drag.groupNodes);
    }
    setFrame((f) => f + 1);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    try {
      (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore — capture may never have been granted.
    }
    drag.sim?.alphaTarget(0);
    dragRef.current = null;

    if (drag.moved) {
      // Leave fx/fy set so the bubble stays where it was dropped. "Reset
      // layout" is what releases every pin.
      drag.sim?.alpha(0.15).restart();
    } else {
      drag.node.fx = null;
      drag.node.fy = null;
      activate(drag.node.goal);
    }
  };

  // The opaque equivalent of each region's translucent plate.
  const plateFill = useMemo(() => {
    const fills = new Map<string, string>();
    for (const region of layout?.regions ?? []) {
      fills.set(region.group.id, blend(PAGE_BG, region.group.color ?? NEUTRAL, 0.05));
    }
    return fills;
  }, [layout]);

  const regionCounts = useMemo(() => {
    const counts = new Map<string, { shown: number; total: number }>();
    if (!layout) return counts;
    for (const n of layout.nodes) {
      const entry = counts.get(n.group) ?? { shown: 0, total: 0 };
      entry.total += 1;
      if (isMatch(n.goal)) entry.shown += 1;
      counts.set(n.group, entry);
    }
    return counts;
  }, [layout, isMatch]);

  return (
    <div
      className="map"
      ref={frameRef}
      // Narrow screens stack the regions into rows; the taller the lens, the
      // taller the map needs to be (see the max-width media query).
      style={{ ['--map-rows' as string]: Math.max(4, Math.ceil(lens.groups.length / 2)) }}
    >
      {layout && (
        <svg
          ref={svgRef}
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="group"
          aria-label={`Goals by ${lens.label}`}
          onMouseLeave={() => onHover(null, 0, 0)}
        >
          {layout.regions.map((region) => {
            // Read the color off the region, not off the lens: `layout` is set
            // in an effect, so for one render after a lens switch the new lens
            // is paired with the previous lens's regions.
            const tint = region.group.color ?? NEUTRAL;
            const counts = regionCounts.get(region.group.id) ?? { shown: 0, total: 0 };
            return (
              <g key={region.group.id} className="region-plate">
                {/* Inset by half the stroke: regions tile edge to edge, so a
                    centred 1px stroke would be clipped along the outer sides. */}
                <rect
                  x={region.x + 0.5}
                  y={region.y + 0.5}
                  width={region.w - 1}
                  height={region.h - 1}
                  rx={16}
                  fill={hexToRgba(tint, 0.05)}
                  stroke={hexToRgba(tint, 0.28)}
                  strokeWidth={1}
                />
                <circle
                  cx={region.x + 20}
                  cy={region.y + LAYOUT.titleTop - 5}
                  r={6}
                  fill={tint}
                />
                <text
                  className="region-title"
                  x={region.x + 34}
                  y={region.y + LAYOUT.titleTop}
                  fill="var(--ink)"
                  fontSize={LAYOUT.titleSize}
                >
                  {region.titleLines.map((line, i) => (
                    <tspan key={i} x={region.x + 34} dy={i === 0 ? 0 : LAYOUT.titleLead}>
                      {line}
                    </tspan>
                  ))}
                </text>
                <text
                  className="region-meta"
                  x={region.x + 34}
                  y={
                    region.y +
                    LAYOUT.titleTop +
                    (region.titleLines.length - 1) * LAYOUT.titleLead +
                    LAYOUT.metaGap
                  }
                >
                  {counts.shown === counts.total
                    ? `${counts.total} goal${counts.total === 1 ? '' : 's'}`
                    : `${counts.shown} of ${counts.total} shown`}
                </text>
              </g>
            );
          })}

          {layout.links.map((link, i) => {
            const visible = isMatch(link.source.goal) && isMatch(link.target.goal);
            // Draw only the gap between the two circles, not centre to centre.
            const dx = link.target.x - link.source.x;
            const dy = link.target.y - link.source.y;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;
            return (
              <line
                key={i}
                className="link-line"
                x1={link.source.x + ux * link.source.r}
                y1={link.source.y + uy * link.source.r}
                x2={link.target.x - ux * link.target.r}
                y2={link.target.y - uy * link.target.r}
                stroke={link.color}
                strokeWidth={2}
                opacity={visible ? 0.35 : 0.06}
              />
            );
          })}

          {layout.nodes.map((node) => {
            const { goal } = node;
            const dimmed = !isMatch(goal);
            const selected = selectedId === goal.id;
            const isUmbrella = goal.kind === 'umbrella';
            const isOpen = isUmbrella && expanded.has(goal.id);

            const label = bubbleLabel(goal);
            const showScope = !goal.parent && goal.kind === 'school' && node.r >= 30;
            const fs = layout.labelFontSize;
            const lines = wrapLabel(label, node.r, fs, showScope ? 1 : 0);
            const blockH = lines.length * fs * 1.18 + (showScope ? fs * 1.05 : 0);
            const startY = node.y - blockH / 2 + fs * 0.92;

            return (
              <g
                key={node.key}
                className={`bubble${dimmed ? ' is-dimmed' : ''}${
                  selected ? ' is-selected' : ''
                }${isUmbrella ? ' is-umbrella' : ''}`}
                role="button"
                tabIndex={dimmed ? -1 : 0}
                aria-label={
                  isUmbrella
                    ? `${goal.title} — ${goal.scope}. ${isOpen ? 'Expanded' : 'Collapsed'}, activate to ${isOpen ? 'collapse' : 'expand'}`
                    : `${goal.title} — ${goal.scope}`
                }
                aria-expanded={isUmbrella ? isOpen : undefined}
                aria-disabled={dimmed || undefined}
                onKeyDown={(e) => {
                  if (dimmed) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    activate(goal);
                  }
                }}
                onPointerDown={(e) => handlePointerDown(e, node)}
                onPointerMove={(e) => handlePointerMove(e, node)}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onMouseLeave={() => onHover(null, 0, 0)}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill={plateFill.get(node.group) ?? PAGE_BG}
                />
                <circle
                  className="body"
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill={hexToRgba(node.color, selected ? 0.28 : 0.13)}
                  stroke={node.color}
                  strokeWidth={2}
                  strokeDasharray={isUmbrella ? '7 4' : undefined}
                />
                <text x={node.x} y={startY} textAnchor="middle" fontSize={fs}>
                  {lines.map((line, i) => (
                    <tspan key={i} x={node.x} dy={i === 0 ? 0 : fs * 1.18}>
                      {line}
                    </tspan>
                  ))}
                </text>
                {showScope && (
                  <text
                    className="scope-tag"
                    x={node.x}
                    y={startY + lines.length * fs * 1.18 - fs * 0.1}
                    textAnchor="middle"
                    fontSize={fs * 0.86}
                  >
                    {goal.schools.map(schoolAbbr).join(' + ')}
                  </text>
                )}
                {isUmbrella && (
                  <text
                    className="expander"
                    x={node.x}
                    y={node.y + node.r - 7}
                    textAnchor="middle"
                    fontSize={11}
                    fill={node.color}
                  >
                    {isOpen ? '– collapse' : '+ expand'}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
