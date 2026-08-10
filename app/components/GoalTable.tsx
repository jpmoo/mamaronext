'use client';

import { GOALS, schoolLabel, type Goal } from '@/lib/goals';
import { CLASSIFICATIONS, SCORECARD_BUCKETS } from '@/lib/classifications';
import { visibleGoals } from '@/lib/layout';
import { groupsForGoal, scorecardColor, type Lens } from '@/lib/lenses';

type Props = {
  lens: Lens;
  isMatch: (goal: Goal) => boolean;
  onSelect: (goal: Goal) => void;
};

/**
 * The same buckets as the map, as text. This is also the accessibility relief
 * for the bubble view: every goal's identity is available without color.
 */
/**
 * An umbrella goal has no plan of its own — the work lives in each school's
 * version — so its semester cells list the schools' deliverables instead of a
 * dash.
 */
function SemesterCell({ goal, field }: { goal: Goal; field: 'fall' | 'spring' }) {
  const children = GOALS.filter((g) => g.parent === goal.id);

  const segments =
    children.length > 0
      ? children.map((child) => ({
          label: schoolLabel(child.schools[0]),
          text: child[field] ?? '—',
        }))
      : goal.bySchool?.[field];

  if (segments && segments.length > 0) {
    return (
      <ul className="perschool">
        {segments.map((segment) => (
          <li key={segment.label}>
            <strong>{segment.label}</strong>
            <span className="clamp">{segment.text}</span>
          </li>
        ))}
      </ul>
    );
  }

  return <div className="clamp">{goal[field] ?? '—'}</div>;
}

const scorecardTitle = (goal: Goal) =>
  SCORECARD_BUCKETS.find((b) => b.key === CLASSIFICATIONS[goal.id]?.scorecard)?.label ?? '';

export default function GoalTable({ lens, isMatch, onSelect }: Props) {
  // The table always lists every goal — collapsing an umbrella is a way of
  // simplifying the map, not of hiding rows from a document.
  const goals = GOALS;

  const buckets = lens.groups
    .map((group) => ({
      group,
      rows: goals.filter((g) => groupsForGoal(lens, g).includes(group.id) && isMatch(g)),
    }))
    .filter((b) => b.rows.length > 0);

  if (buckets.length === 0) {
    return (
      <div className="table-wrap">
        <p className="empty">No goals match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="goals">
        <thead>
          <tr>
            <th>Goal</th>
            <th>Scope</th>
            <th>Condition</th>
            <th>Fall Semester</th>
            <th>Spring Semester</th>
          </tr>
        </thead>
        {buckets.map(({ group, rows }) => (
          <tbody key={group.id}>
            <tr className="bucket-head">
              <th colSpan={5} scope="colgroup">
                {group.color && (
                  <span className="init-dot" style={{ background: group.color }} />
                )}
                {group.title}
                <span className="bucket-count">
                  {rows.length} goal{rows.length === 1 ? '' : 's'}
                </span>
              </th>
            </tr>
            {rows.map((goal) => (
              <tr key={goal.id}>
                <td className="goal-cell">
                  <button onClick={() => onSelect(goal)}>
                    {/* Same rule the map uses: the group's color when the lens
                        colors by group, otherwise the scorecard bucket's. */}
                    <span
                      className="init-dot"
                      style={{
                        background:
                          lens.colorMode === 'group' ? group.color : scorecardColor(goal),
                      }}
                      title={lens.colorMode === 'group' ? group.title : scorecardTitle(goal)}
                    />
                    {goal.parent ? '↳ ' : ''}
                    {goal.title}
                  </button>
                </td>
                <td className="narrow">{goal.scope}</td>
                <td className="long">
                  <div className="clamp">{goal.condition ?? '—'}</div>
                </td>
                <td className="long">
                  <SemesterCell goal={goal} field="fall" />
                </td>
                <td className="long">
                  <SemesterCell goal={goal} field="spring" />
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
