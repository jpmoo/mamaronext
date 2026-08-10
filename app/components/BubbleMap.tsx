'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { schoolAbbr, schoolLabel, type Goal } from '@/lib/goals';
import type { Lens } from '@/lib/lenses';
import {
  LAYOUT,
  buildLayout,
  clampNodes,
  createSimulation,
  fitLabel,
  hexToRgba,
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

/** Child bubbles are identified by their school; everything else by goal title. */
function labelFor(goal: Goal): string {
  if (goal.parent) return schoolLabel(goal.schools[0]);
  return goal.shortTitle ?? goal.title;
}

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
  const simRef = useRef<ReturnType<typeof createSimulation> | null>(null);
  const dragRef = useRef<{ node: BubbleNode; moved: boolean } | null>(null);
  const previousBuild = useRef<string>('');

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

    simRef.current?.stop();
    const sim = createSimulation(next.nodes, next.links);
    sim.on('tick', () => {
      clampNodes(next.nodes);
      setFrame((f) => f + 1);
    });
    simRef.current = sim;

    if (incremental) sim.alpha(0.55).restart();

    return () => {
      sim.stop();
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
    e.preventDefault();
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture is a nicety; dragging still works without it.
    }
    dragRef.current = { node, moved: false };
    node.fx = node.x;
    node.fy = node.y;
    simRef.current?.alphaTarget(0.3).restart();
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
    // starved. Neighbours still get pushed aside on every move.
    const sim = simRef.current;
    if (sim) {
      sim.tick();
      clampNodes(nodesRef.current);
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
    simRef.current?.alphaTarget(0);
    dragRef.current = null;

    if (drag.moved) {
      // Leave fx/fy set so the bubble stays where it was dropped. "Reset
      // layout" is what releases every pin.
      simRef.current?.alpha(0.15).restart();
    } else {
      drag.node.fx = null;
      drag.node.fy = null;
      activate(drag.node.goal);
    }
  };

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
            const tint = lens.colorMode === 'group' ? region.group.color! : NEUTRAL;
            const counts = regionCounts.get(region.group.id) ?? { shown: 0, total: 0 };
            return (
              <g key={region.group.id} className="region-plate">
                <rect
                  x={region.x}
                  y={region.y}
                  width={region.w}
                  height={region.h}
                  rx={16}
                  fill={hexToRgba(tint, lens.colorMode === 'group' ? 0.045 : 0.05)}
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
            return (
              <line
                key={i}
                className="link-line"
                x1={link.source.x}
                y1={link.source.y}
                x2={link.target.x}
                y2={link.target.y}
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

            const label = labelFor(goal);
            const showScope = !goal.parent && goal.kind === 'school' && node.r >= 30;
            const { fontSize: fs, lines } = fitLabel(label, node.r, showScope ? 1 : 0);
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
                onKeyDown={(e) => {
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
