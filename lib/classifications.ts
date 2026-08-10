/**
 * Alternate organizing principles for the goals.
 *
 * IMPORTANT: unlike lib/goals.ts — which is a verbatim transcription of
 * resources/2026-2027_Goals_Chart.pdf — everything in this file is an editorial
 * judgment call about how each goal should be filed. The source chart only
 * assigns scorecard domains at the *initiative* level, and says nothing at all
 * about themes or data points. Edit freely; the views follow this file.
 *
 * - `theme`      one of personalization | mentorship | expertise
 * - `scorecard`  one of esl | adb | aeg | rii  (see resources/Scorecard.jpg)
 * - `dataPoints` every named data source the goal's plan or measure touches
 */

export type ThemeKey = 'personalization' | 'mentorship' | 'expertise';
export type ScorecardKey = 'esl' | 'adb' | 'aeg' | 'rii';

export type Classification = {
  theme: ThemeKey;
  scorecard: ScorecardKey;
  dataPoints: string[];
};

export const THEMES: { key: ThemeKey; label: string; blurb: string }[] = [
  {
    key: 'personalization',
    label: 'Personalization',
    blurb: 'Tailoring learning, intervention, and opportunity to the individual student.',
  },
  {
    key: 'mentorship',
    label: 'Mentorship',
    blurb: 'Relationship-based support — coaching adults, and adults knowing and supporting students.',
  },
  {
    key: 'expertise',
    label: 'Expertise',
    blurb: 'Building adult capacity and common, research-based practice at scale.',
  },
];

export const SCORECARD_BUCKETS: {
  key: ScorecardKey;
  label: string;
  short: string;
  blurb: string;
}[] = [
  {
    key: 'esl',
    label: 'Empowered and Skillful Learners',
    short: 'ESL',
    blurb:
      'All students develop the knowledge, skills, and confidence to take ownership of their learning through personalized, challenging, and authentic experiences.',
  },
  {
    key: 'adb',
    label: 'Actualized Dignity and Belonging',
    short: 'ADB',
    blurb:
      'All members of our learning community are respected, seen, and valued, and engage in a way that allows themselves and others to authentically and fully participate in school life with dignity and integrity.',
  },
  {
    key: 'aeg',
    label: 'Adult Expertise & Growth',
    short: 'AEG',
    blurb:
      "Adults continuously grow their practice through collaborative and research-based learning, feedback, and innovation aligned to Mamaroneck's mission.",
  },
  {
    key: 'rii',
    label: 'Reflective Inquiry & Continuous Enhancements',
    short: 'RII',
    blurb:
      'We institutionalize reflective practices and engage regularly, using data to inform decisions, improve practice, and align our efforts to common school and district goals.',
  },
];

export const DATA_POINTS: { key: string; label: string; blurb: string }[] = [
  {
    key: 'common-assessments',
    label: 'Common assessments & rubrics',
    blurb: 'Shared district assessments, common rubrics, and calibration results.',
  },
  {
    key: 'external-exams',
    label: 'State exams & PSAT',
    blurb: 'Regents, the Grade 5 state science assessment, and PSAT results.',
  },
  {
    key: 'screening',
    label: 'Screening & benchmark data',
    blurb: 'AIS/Tier II screening, literacy benchmarks, below-benchmark identification.',
  },
  {
    key: 'grades',
    label: 'Grades & grade distributions',
    blurb: 'Gradebook practice, grade distributions, students below a grade threshold.',
  },
  {
    key: 'observation',
    label: 'Walkthrough & observation data',
    blurb: 'Walkthroughs, look-fors, learning walks, and program-fidelity audits.',
  },
  {
    key: 'attendance',
    label: 'Attendance data',
    blurb: 'Period attendance, tardiness, and absence benchmarks.',
  },
  {
    key: 'discipline',
    label: 'Discipline & conduct data',
    blurb: 'DASA incidents, referrals, recidivism, and academic-integrity violations.',
  },
  {
    key: 'participation',
    label: 'Participation & enrollment',
    blurb: 'Advanced coursework, electives, internships, PD, and network participation.',
  },
  {
    key: 'team-practice',
    label: 'Team & meeting practice',
    blurb: 'Measures of teaming, data-meeting culture, and collaborative practice.',
  },
  {
    key: 'sentiment',
    label: 'Survey & sentiment data',
    blurb: 'Community and staff feedback, trust surveys, and retention data.',
  },
  {
    key: 'activities',
    label: 'Activities Completed',
    blurb:
      'Progress shown by completing the planned work itself, rather than by a separate data instrument.',
  },
];

export const CLASSIFICATIONS: Record<string, Classification> = {
  'k12-math': {
    theme: 'expertise',
    scorecard: 'esl',
    dataPoints: ['common-assessments', 'grades'],
  },
  'k5-science': {
    theme: 'expertise',
    scorecard: 'esl',
    dataPoints: ['common-assessments', 'external-exams'],
  },
  'k12-writing': {
    theme: 'expertise',
    scorecard: 'esl',
    dataPoints: ['common-assessments', 'observation'],
  },
  'k12-pe': {
    theme: 'expertise',
    scorecard: 'aeg',
    dataPoints: ['common-assessments', 'grades'],
  },
  'goal-setting-framework': {
    theme: 'expertise',
    scorecard: 'rii',
    dataPoints: ['team-practice'],
  },
  'budgeting-transparency': {
    theme: 'mentorship',
    scorecard: 'rii',
    dataPoints: ['activities'],
  },
  'elementary-literacy': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['screening'],
  },
  'literacy-central': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['screening', 'team-practice'],
  },
  'literacy-chatsworth': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['screening'],
  },
  'literacy-mamaroneck-ave': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['screening', 'observation'],
  },
  'literacy-murray': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['screening'],
  },
  'data-literacy-hommocks': {
    theme: 'expertise',
    scorecard: 'rii',
    dataPoints: ['grades', 'team-practice'],
  },
  'attendance-mhs': {
    theme: 'mentorship',
    scorecard: 'adb',
    dataPoints: ['attendance'],
  },
  'instructional-coaching': {
    theme: 'mentorship',
    scorecard: 'aeg',
    dataPoints: ['observation', 'sentiment'],
  },
  'science-of-learning': {
    theme: 'expertise',
    scorecard: 'aeg',
    dataPoints: ['observation'],
  },
  avid: {
    theme: 'expertise',
    scorecard: 'aeg',
    dataPoints: ['observation'],
  },
  'technology-plan': {
    theme: 'expertise',
    scorecard: 'aeg',
    dataPoints: ['observation'],
  },
  'network-participation': {
    theme: 'expertise',
    scorecard: 'aeg',
    dataPoints: ['participation'],
  },
  'ell-sheltered': {
    theme: 'expertise',
    scorecard: 'esl',
    dataPoints: ['external-exams', 'common-assessments'],
  },
  'students-of-promise': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['participation'],
  },
  'psat-gaps': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['external-exams', 'common-assessments'],
  },
  'hs-pathways': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['participation'],
  },
  'ms-pathways': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['participation'],
  },
  'dasa-response': {
    theme: 'mentorship',
    scorecard: 'adb',
    dataPoints: ['discipline'],
  },
  'labor-relations': {
    theme: 'mentorship',
    scorecard: 'adb',
    dataPoints: ['sentiment'],
  },
  'strategic-communication': {
    theme: 'mentorship',
    scorecard: 'adb',
    dataPoints: ['sentiment'],
  },
  'discipline-recidivism': {
    theme: 'mentorship',
    scorecard: 'adb',
    dataPoints: ['discipline'],
  },
  'academic-dishonesty': {
    theme: 'mentorship',
    scorecard: 'adb',
    dataPoints: ['discipline'],
  },
};
