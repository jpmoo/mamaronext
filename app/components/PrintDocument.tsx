'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GOALS, schoolLabel, type Goal, type PlanSegment } from '@/lib/goals';
import { groupsForGoal, type Lens, type LensGroup } from '@/lib/lenses';

/**
 * A pre-paginated version of the table, for printing.
 *
 * Browsers disagree badly about how to fragment a long table — the same
 * document printed clean in one engine and emitted dozens of blank pages in
 * another. So the browser doesn't get to decide: this measures every row at the
 * printed width, packs whole rows into fixed page-sized blocks, and puts an
 * explicit page break after each. Nothing can straddle a page boundary, so
 * there is nothing left to fragment.
 */

/**
 * The printable area, in CSS pixels at 96dpi, sized to the *smaller* of Letter
 * and A4 in landscape with 10mm margins — so a page block fits either paper
 * without spilling onto a second sheet.
 *
 *   Letter landscape: 11in x 8.5in  -> 980 x 740
 *   A4 landscape:     297 x 210mm   -> 1047 x 715
 */
export const PRINT_PAGE = { width: 980, height: 715 };

/** Column widths, as percentages, identical on every page. */
const COLUMNS = [
  { label: 'Goal', width: '15%' },
  { label: 'Scope', width: '11%' },
  { label: 'Condition', width: '24%' },
  { label: 'Fall Semester', width: '25%' },
  { label: 'Spring Semester', width: '25%' },
];

type Item =
  | { kind: 'bucket'; key: string; group: LensGroup; count: number }
  | { kind: 'goal'; key: string; goal: Goal };

type Props = {
  lens: Lens;
  isMatch: (goal: Goal) => boolean;
  collapsed: Set<string>;
  subtitle: string;
};

/** Fall/spring text, broken out per school where the goal is written that way. */
function semesterContent(goal: Goal, field: 'fall' | 'spring') {
  const children = GOALS.filter((g) => g.parent === goal.id);
  const segments: PlanSegment[] | undefined =
    children.length > 0
      ? children.map((child) => ({
          label: schoolLabel(child.schools[0]),
          text: child[field] ?? '—',
        }))
      : goal.bySchool?.[field];

  if (segments && segments.length > 0) {
    return (
      <>
        {segments.map((segment, i) => (
          <span key={segment.label}>
            {i > 0 ? ' ' : ''}
            <strong>{segment.label}:</strong> {segment.text}
          </span>
        ))}
      </>
    );
  }
  return <>{goal[field] ?? '—'}</>;
}

function GoalRow({ goal }: { goal: Goal }) {
  return (
    <tr className="p-row">
      <td className="p-goal">
        {goal.parent ? '↳ ' : ''}
        {goal.title}
      </td>
      <td className="p-scope">{goal.scope}</td>
      <td>{goal.condition ?? '—'}</td>
      <td>{semesterContent(goal, 'fall')}</td>
      <td>{semesterContent(goal, 'spring')}</td>
    </tr>
  );
}

function BucketRow({ group, count }: { group: LensGroup; count: number }) {
  return (
    <tr className="p-bucket">
      <th colSpan={5}>
        {group.title}
        <span className="p-bucket-count">
          {count} goal{count === 1 ? '' : 's'}
        </span>
      </th>
    </tr>
  );
}

function ItemRow({ item }: { item: Item }) {
  return item.kind === 'bucket' ? (
    <BucketRow group={item.group} count={item.count} />
  ) : (
    <GoalRow goal={item.goal} />
  );
}

function PageTable({ items }: { items: Item[] }) {
  return (
    <table className="p-table">
      <colgroup>
        {COLUMNS.map((c) => (
          <col key={c.label} style={{ width: c.width }} />
        ))}
      </colgroup>
      <thead>
        <tr>
          {COLUMNS.map((c) => (
            <th key={c.label}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <ItemRow key={item.key} item={item} />
        ))}
      </tbody>
    </table>
  );
}

export default function PrintDocument({ lens, isMatch, collapsed, subtitle }: Props) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<Item[][]>([]);

  // The same buckets the on-screen table shows, flattened into a single run of
  // rows: a bucket heading followed by its goals.
  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    for (const group of lens.groups) {
      if (collapsed.has(group.id)) continue;
      const rows = GOALS.filter((g) => groupsForGoal(lens, g).includes(group.id) && isMatch(g));
      if (!rows.length) continue;
      out.push({ kind: 'bucket', key: `b:${group.id}`, group, count: rows.length });
      for (const goal of rows) out.push({ kind: 'goal', key: `${group.id}:${goal.id}`, goal });
    }
    return out;
  }, [lens, isMatch, collapsed]);

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) {
      setPages([]);
      return;
    }

    const head = root.querySelector('thead');
    const rows = [...root.querySelectorAll<HTMLTableRowElement>('tbody tr')];
    if (rows.length !== items.length) return;

    const headHeight = head?.getBoundingClientRect().height ?? 0;
    const heights = rows.map((r) => r.getBoundingClientRect().height);
    const headerHeight = root.querySelector('.p-header')?.getBoundingClientRect().height ?? 0;

    const packed: Item[][] = [];
    let current: Item[] = [];
    let used = 0;

    const budget = () =>
      PRINT_PAGE.height - headHeight - (packed.length === 0 ? headerHeight : 0) - 2;

    items.forEach((item, i) => {
      const height = heights[i];

      // Never leave a bucket heading stranded at the foot of a page.
      const needed = item.kind === 'bucket' ? height + Math.min(heights[i + 1] ?? 0, 90) : height;

      if (current.length > 0 && used + needed > budget()) {
        packed.push(current);
        current = [];
        used = 0;
      }

      current.push(item);
      used += height;
    });

    if (current.length) packed.push(current);
    setPages(packed);
  }, [items, subtitle]);

  return (
    <div className="print-doc" aria-hidden="true">
      {/* Off-screen pass: one table of every row, at the printed width, so each
          row's height is known before anything is assigned to a page. */}
      <div className="p-measure" ref={measureRef} style={{ width: PRINT_PAGE.width }}>
        <div className="p-header">
          <h2>Mamaronext — 2026-2027 School and District Goals</h2>
          <p>{subtitle}</p>
        </div>
        <PageTable items={items} />
      </div>

      {pages.map((pageItems, i) => (
        <div
          className="p-page"
          key={i}
          style={{ width: PRINT_PAGE.width, height: PRINT_PAGE.height }}
        >
          {i === 0 && (
            <div className="p-header">
              <h2>Mamaronext — 2026-2027 School and District Goals</h2>
              <p>{subtitle}</p>
            </div>
          )}
          <PageTable items={pageItems} />
        </div>
      ))}
    </div>
  );
}
