'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import logo from '@/public/logo.png';
import { GOALS, SCHOOLS, schoolLabel, type Goal } from '@/lib/goals';
import { LENSES, SCORECARD_LEGEND, groupsForGoal, lensById } from '@/lib/lenses';
import BubbleMap from './BubbleMap';
import DetailDrawer from './DetailDrawer';
import GoalTable, { tableBuckets } from './GoalTable';

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
  const [printedOn, setPrintedOn] = useState('');
  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<string>>(new Set());

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
  // The map hides goals inside a collapsed umbrella; the table never does.
  const inScope = view === 'table' ? GOALS : visible;
  const shown = useMemo(() => inScope.filter(isMatch).length, [inScope, isMatch]);

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

  // Bucket ids belong to a lens, so a lens change starts everything expanded.
  useEffect(() => setCollapsedBuckets(new Set()), [lensId]);

  const shownBuckets = useMemo(() => tableBuckets(lens, isMatch), [lens, isMatch]);
  const allBucketsCollapsed =
    shownBuckets.length > 0 && shownBuckets.every((b) => collapsedBuckets.has(b.group.id));

  const toggleBucket = useCallback((groupId: string) => {
    setCollapsedBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  /**
   * Export by printing. The table is text, so the browser's own "Save as PDF"
   * paginates it better than a bundled PDF writer would — and it picks up the
   * current lens, filters, and search for free. The date is stamped here rather
   * than during render so the prerendered markup stays stable.
   */
  const exportPdf = useCallback(() => {
    setPrintedOn(
      new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    );
    setTimeout(() => window.print(), 60);
  }, []);

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
          <div className="search-field">
            <input
              type="search"
              value={query}
              placeholder="Search goals, conditions, measures…"
              aria-label="Search goals"
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="clear-search" onClick={() => setQuery('')} aria-label="Clear search">
                ×
              </button>
            )}
          </div>
          <span className="count">
            {shown} of {inScope.length}
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

        <div className="toolgroup map-actions">
          {view === 'map' ? (
            <>
              <button
                className="chip"
                onClick={() => setExpanded(allOpen ? new Set() : new Set(UMBRELLAS))}
              >
                {allOpen ? 'Collapse umbrellas' : 'Expand umbrellas'}
              </button>
              <button className="chip" onClick={() => setResetSignal((n) => n + 1)}>
                Reset layout
              </button>
            </>
          ) : (
            <>
              <button
                className="chip"
                onClick={() =>
                  setCollapsedBuckets(
                    allBucketsCollapsed
                      ? new Set()
                      : new Set(shownBuckets.map((b) => b.group.id)),
                  )
                }
              >
                {allBucketsCollapsed ? 'Expand all' : 'Collapse all'}
              </button>
              <button className="chip" onClick={exportPdf}>
                Export PDF
              </button>
            </>
          )}
        </div>
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

      {/* Print-only, so the exported PDF says what it is and what it was filtered to. */}
      <div className="print-header">
        <h2>Mamaronext — 2026-2027 School and District Goals</h2>
        <p>
          Mamaroneck Union Free School District · Arranged by {lens.label}
          {school ? ` · School: ${schoolLabel(school)}` : ''}
          {query.trim() ? ` · Search: “${query.trim()}”` : ''}
          {shown !== inScope.length ? ` · ${shown} of ${inScope.length} goals` : ''}
          {printedOn ? ` · ${printedOn}` : ''}
        </p>
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
          <GoalTable
            lens={lens}
            isMatch={isMatch}
            onSelect={setSelected}
            collapsed={collapsedBuckets}
            onToggleBucket={toggleBucket}
          />
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
