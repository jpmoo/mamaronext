'use client';

import { useEffect } from 'react';
import {
  BOE_FOCUS,
  CLASSIFICATIONS,
  DATA_POINTS,
  SCORECARD_BUCKETS,
  THEMES,
} from '@/lib/classifications';
import { GOALS, initiativeById, schoolLabel, type Goal, type PlanSegment } from '@/lib/goals';

type Props = {
  goal: Goal;
  onClose: () => void;
  onNavigate: (goal: Goal) => void;
};

/** Renders a plan or measure, breaking it out per school when the goal is written that way. */
function PlanBody({ text, segments }: { text?: string; segments?: PlanSegment[] }) {
  if (segments && segments.length > 0) {
    return (
      <ul className="perschool">
        {segments.map((segment) => (
          <li key={segment.label}>
            <strong>{segment.label}</strong>
            <span>{segment.text}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <>{text}</>;
}

export default function DetailDrawer({ goal, onClose, onNavigate }: Props) {
  const init = initiativeById(goal.initiative);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      // Inside the panel: leave it alone.
      if (target.closest('.drawer')) return;

      // Another goal — an interactive bubble, or a row in the table. Don't
      // close; the click that follows swaps this panel's contents instead.
      if (target.closest('.bubble:not(.is-dimmed)')) return;
      if (target.closest('.goal-cell button')) return;

      onClose();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [onClose]);

  const cls = CLASSIFICATIONS[goal.id];
  const theme = THEMES.find((t) => t.key === cls?.theme);
  const bucket = SCORECARD_BUCKETS.find((b) => b.key === cls?.scorecard);
  const points = (cls?.dataPoints ?? [])
    .map((key) => DATA_POINTS.find((d) => d.key === key))
    .filter(Boolean);
  const focus = (cls?.boeFocus ?? [])
    .map((key) => BOE_FOCUS.find((f) => f.key === key))
    .filter(Boolean);
  const appliesTo = goal.schools.filter((s) => s !== 'district');

  const children = GOALS.filter((g) => g.parent === goal.id);
  const parent = goal.parent ? GOALS.find((g) => g.id === goal.parent) : undefined;
  const siblings = parent ? GOALS.filter((g) => g.parent === parent.id && g.id !== goal.id) : [];

  return (
    <>
      {/* Deliberately non-modal: the map stays visible and draggable while the
          panel is open, so an expanded umbrella's schools remain in view. */}
      <aside className="drawer" role="complementary" aria-label={`${goal.title} details`}>
        <header>
          <h2>{goal.title}</h2>
          <div className="scope">{goal.scope}</div>
          {goal.kind === 'district' && appliesTo.length > 0 && (
            <div className="applies-to">
              Applies at {appliesTo.map(schoolLabel).join(', ')}
            </div>
          )}
          <div className="tagrow">
            <span className="tag">{init.title}</span>
            {theme && (
              <span className="tag" title={theme.blurb}>
                {theme.label}
              </span>
            )}
            {bucket && (
              <span className="tag" title={bucket.blurb}>
                {bucket.short} · {bucket.label}
              </span>
            )}
          </div>
          {focus.length > 0 && (
            <div className="tagrow tagrow--data">
              <span className="tagrow-label">BoE focus</span>
              {focus.map((f) => (
                <span className="tag" key={f!.key} title={f!.blurb}>
                  {f!.label}
                </span>
              ))}
            </div>
          )}
          {points.length > 0 && (
            <div className="tagrow tagrow--data">
              <span className="tagrow-label">Data points</span>
              {points.map((p) => (
                <span className="tag tag--data" key={p!.key} title={p!.blurb}>
                  {p!.label}
                </span>
              ))}
            </div>
          )}
          <button className="close" onClick={onClose} aria-label="Close details">
            ×
          </button>
        </header>

        <div className="body">
          {goal.condition && (
            <div className="field condition">
              <h3>Condition</h3>
              <p>{goal.condition}</p>
            </div>
          )}

          {goal.fall && (
            <section className="semester">
              <h3>Fall Semester</h3>
              <div className="plan">
                <PlanBody text={goal.fall} segments={goal.bySchool?.fall} />
              </div>
              {goal.fallProgress && (
                <div className="measure">
                  <strong>Progress to present</strong>
                  <PlanBody text={goal.fallProgress} segments={goal.bySchool?.fallProgress} />
                </div>
              )}
            </section>
          )}

          {goal.spring && (
            <section className="semester">
              <h3>Spring Semester</h3>
              <div className="plan">
                <PlanBody text={goal.spring} segments={goal.bySchool?.spring} />
              </div>
              {goal.springProgress && (
                <div className="measure">
                  <strong>Progress to present</strong>
                  <PlanBody text={goal.springProgress} segments={goal.bySchool?.springProgress} />
                </div>
              )}
            </section>
          )}

          {children.length > 0 && (
            <div className="related">
              <h3>School goals under this umbrella</h3>
              {children.map((c) => (
                <button key={c.id} onClick={() => onNavigate(c)}>
                  {c.title}
                  <span>{c.scope}</span>
                </button>
              ))}
            </div>
          )}

          {parent && (
            <div className="related">
              <h3>Part of</h3>
              <button onClick={() => onNavigate(parent)}>
                {parent.title}
                <span>{parent.scope}</span>
              </button>
              {siblings.length > 0 && <h3 style={{ marginTop: 14 }}>Alongside</h3>}
              {siblings.map((s) => (
                <button key={s.id} onClick={() => onNavigate(s)}>
                  {s.title}
                  <span>{s.scope}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
