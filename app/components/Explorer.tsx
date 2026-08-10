'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import logo from '@/public/logo.png';
import { GOALS, SCHOOLS, type Goal } from '@/lib/goals';
import { LENSES, SCORECARD_LEGEND, groupsForGoal, lensById } from '@/lib/lenses';
import BubbleMap from './BubbleMap';
import DetailDrawer from './DetailDrawer';
import GoalTable from './GoalTable';

type View = 'map' | 'table';

const UMBRELLAS = GOALS.filter((g) => g.kind === 'umbrella').map((g) => g.id);

export default function Explorer() {
  const [view, setView] = useState<View>('map');
  const [lensId, setLensId] = useState(LENSES[0].id);
  const [school, setSchool] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Goal | null>(null);
  const [hover, setHover] = useState<{ goal: Goal; x: number; y: number } | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [resetSignal, setResetSignal] = useState(0);

  const lens = lensById(lensId);

  const isMatch = useCallback(
    (goal: Goal) => {
      if (school && !goal.schools.includes(school)) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return [
        goal.title,
        goal.scope,
        goal.condition,
        goal.fall,
        goal.fallProgress,
        goal.spring,
        goal.springProgress,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    },
    [school, query],
  );

  // Goals hidden inside a collapsed umbrella shouldn't count as "shown".
  const visible = useMemo(
    () => GOALS.filter((g) => !g.parent || expanded.has(g.parent)),
    [expanded],
  );
  const shown = useMemo(() => visible.filter(isMatch).length, [visible, isMatch]);

  // Only legend entries that actually have goals behind them.
  const activeGroups = useMemo(
    () => lens.groups.filter((g) => visible.some((goal) => groupsForGoal(lens, goal).includes(g.id))),
    [lens, visible],
  );

  const onHover = useCallback(
    (goal: Goal | null, x: number, y: number) => setHover(goal ? { goal, x, y } : null),
    [],
  );

  const toggleExpand = useCallback(
    (goal: Goal) => {
      const willExpand = !expanded.has(goal.id);
      setExpanded((prev) => {
        const next = new Set(prev);
        if (willExpand) next.add(goal.id);
        else next.delete(goal.id);
        return next;
      });
      // Expanding also opens the umbrella's own panel; collapsing closes it.
      setSelected((prev) => (willExpand ? goal : prev?.id === goal.id ? null : prev));
    },
    [expanded],
  );

  const allOpen = UMBRELLAS.every((id) => expanded.has(id));

  // A search or school filter that only matches hidden children is confusing —
  // open the umbrellas so the matches are actually on screen.
  useEffect(() => {
    if (!school && !query.trim()) return;
    const hiddenMatch = GOALS.some((g) => g.parent && isMatch(g) && !expanded.has(g.parent));
    if (hiddenMatch) {
      setExpanded((prev) => {
        const next = new Set(prev);
        for (const g of GOALS) if (g.parent && isMatch(g)) next.add(g.parent);
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school, query]);

  return (
    <div className="shell">
      <header className="masthead">
        {/* Static import, not a literal "/logo.png": the imported URL carries
            the basePath/assetPrefix, so the logo still resolves when the app is
            served under a sub-path. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo.src}
          width={logo.width}
          height={logo.height}
          alt="Mamaroneck Union Free School District"
        />
        <div>
          <h1>
            <span className="wordmark">
              Mamaro<em>next</em>
            </span>{' '}
            2026-2027 School and District Goals
          </h1>
          <p className="tagline">Mamaroneck Union Free School District</p>
        </div>
      </header>

      <div className="toolbar">
        <div className="toolgroup">
          <span className="label">Arrange by</span>
          <select
            className="lens-select"
            value={lensId}
            aria-label="Organizing principle"
            onChange={(e) => setLensId(e.target.value)}
          >
            {LENSES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="toolgroup">
          <span className="label">View</span>
          <div className="segmented">
            <button aria-pressed={view === 'map'} onClick={() => setView('map')}>
              Bubble map
            </button>
            <button aria-pressed={view === 'table'} onClick={() => setView('table')}>
              Table
            </button>
          </div>
        </div>

        <div className="search">
          <input
            type="search"
            value={query}
            placeholder="Search goals, conditions, measures…"
            aria-label="Search goals"
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="count">
            {shown} of {visible.length}
          </span>
        </div>
      </div>

      <div className="toolbar toolbar--secondary">
        <div className="toolgroup">
          <span className="label">School</span>
          <button aria-pressed={school === null} className="chip" onClick={() => setSchool(null)}>
            All
          </button>
          {SCHOOLS.map((s) => (
            <button
              key={s.key}
              className="chip"
              aria-pressed={school === s.key}
              onClick={() => setSchool(school === s.key ? null : s.key)}
            >
              {s.short}
            </button>
          ))}
        </div>

        {view === 'map' && (
          <div className="toolgroup map-actions">
            <button
              className="chip"
              onClick={() => setExpanded(allOpen ? new Set() : new Set(UMBRELLAS))}
            >
              {allOpen ? 'Collapse umbrellas' : 'Expand umbrellas'}
            </button>
            <button className="chip" onClick={() => setResetSignal((n) => n + 1)}>
              Reset layout
            </button>
          </div>
        )}
      </div>

      <div className="legend">
        {lens.colorMode === 'group' ? (
          activeGroups.map((group) => (
            <span className="item" key={group.id}>
              <span className="swatch" style={{ background: group.color }} />
              {group.title}
            </span>
          ))
        ) : (
          <>
            <span className="legend-note">Colored by scorecard bucket:</span>
            {SCORECARD_LEGEND.map((b) => (
              <span className="item" key={b.id}>
                <span className="swatch" style={{ background: b.color }} />
                {b.short} · {b.title}
              </span>
            ))}
          </>
        )}
        <span className="sizes">
          <span className="dot" style={{ width: 18, height: 18, borderStyle: 'dashed' }} /> Umbrella
          — click to expand
          <span className="dot" style={{ width: 11, height: 11 }} /> School goal under an umbrella
        </span>
      </div>

      <main className={`stage${view === 'table' ? ' is-table' : ''}`}>
        {view === 'map' ? (
          <BubbleMap
            lens={lens}
            isMatch={isMatch}
            selectedId={selected?.id ?? null}
            expanded={expanded}
            onToggleExpand={toggleExpand}
            onSelect={setSelected}
            onHover={onHover}
            resetSignal={resetSignal}
          />
        ) : (
          <GoalTable lens={lens} expanded={expanded} isMatch={isMatch} onSelect={setSelected} />
        )}
      </main>

      {hover && (
        <div
          className="tooltip"
          style={{
            left: Math.min(
              hover.x + 14,
              typeof window !== 'undefined' ? window.innerWidth - 314 : hover.x,
            ),
            top: hover.y + 16,
          }}
        >
          <div>{hover.goal.title}</div>
          <div className="t-scope">{hover.goal.scope}</div>
          {hover.goal.kind === 'umbrella' && (
            <div className="t-scope">
              {expanded.has(hover.goal.id) ? 'Click to collapse' : 'Click to expand'}
            </div>
          )}
        </div>
      )}

      {selected && (
        <DetailDrawer goal={selected} onClose={() => setSelected(null)} onNavigate={setSelected} />
      )}
    </div>
  );
}
