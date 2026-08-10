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
 * - `boeFocus`   the Board of Education focus area(s) a goal pulls on
 */

export type ThemeKey = 'personalization' | 'mentorship' | 'expertise';
export type ScorecardKey = 'esl' | 'adb' | 'aeg' | 'rii';

export type Classification = {
  theme: ThemeKey;
  scorecard: ScorecardKey;
  dataPoints: string[];
  boeFocus: string[];
};

/**
 * The five "threads to pull" listed under Board of Education Presentations at
 * the end of the goals chart. Labels and sub-points are the chart's own.
 */
export const BOE_FOCUS: { key: string; label: string; blurb: string }[] = [
  {
    key: 'consistency',
    label: 'Consistency in teaching, learning, grading',
    blurb:
      'Articulated curriculum maps, common assessments, and rubrics with expectations for fidelity; teaming, interdisciplinary versus disciplinary; materials.',
  },
  {
    key: 'integrity',
    label: 'Academic Integrity and Honesty',
    blurb: 'Honest work, and the prevention and response practices around it.',
  },
  {
    key: 'community',
    label: 'Community Expectations and Standards',
    blurb: 'Relationship and collaboration — what the district and its community expect of each other.',
  },
  {
    key: 'technology',
    label: 'Technology',
    blurb: 'Changes as they occur toward fulfillment of the technology playbook.',
  },
  {
    key: 'empowerment',
    label: 'Personalization toward Empowerment',
    blurb:
      'Pathways are both academic and outside the classroom — co- and extra-curricular involvement, and engaging students through their own skills and interests.',
  },
];

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
    boeFocus: ['consistency'],
  },
  'k5-science': {
    theme: 'expertise',
    scorecard: 'esl',
    dataPoints: ['common-assessments', 'external-exams'],
    boeFocus: ['consistency'],
  },
  'k12-writing': {
    theme: 'expertise',
    scorecard: 'esl',
    dataPoints: ['common-assessments', 'observation'],
    boeFocus: ['consistency'],
  },
  'k12-pe': {
    theme: 'expertise',
    scorecard: 'aeg',
    dataPoints: ['common-assessments', 'grades'],
    boeFocus: ['consistency'],
  },
  'goal-setting-framework': {
    theme: 'expertise',
    scorecard: 'rii',
    dataPoints: ['team-practice'],
    boeFocus: ['community'],
  },
  'budgeting-transparency': {
    theme: 'mentorship',
    scorecard: 'rii',
    dataPoints: ['activities'],
    boeFocus: ['community'],
  },
  'elementary-literacy': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['screening'],
    boeFocus: ['empowerment'],
  },
  'literacy-central': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['screening', 'team-practice'],
    boeFocus: ['empowerment'],
  },
  'literacy-chatsworth': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['screening'],
    boeFocus: ['empowerment'],
  },
  'literacy-mamaroneck-ave': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['screening', 'observation'],
    boeFocus: ['empowerment'],
  },
  'literacy-murray': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['screening'],
    boeFocus: ['empowerment'],
  },
  'data-literacy-hommocks': {
    theme: 'expertise',
    scorecard: 'rii',
    dataPoints: ['grades', 'team-practice'],
    boeFocus: ['consistency'],
  },
  'attendance-mhs': {
    theme: 'mentorship',
    scorecard: 'adb',
    dataPoints: ['attendance'],
    boeFocus: ['community'],
  },
  'instructional-coaching': {
    theme: 'mentorship',
    scorecard: 'aeg',
    dataPoints: ['observation', 'sentiment'],
    boeFocus: ['consistency'],
  },
  'science-of-learning': {
    theme: 'expertise',
    scorecard: 'aeg',
    dataPoints: ['observation'],
    boeFocus: ['consistency'],
  },
  avid: {
    theme: 'expertise',
    scorecard: 'aeg',
    dataPoints: ['observation'],
    boeFocus: ['consistency'],
  },
  'technology-plan': {
    theme: 'expertise',
    scorecard: 'aeg',
    dataPoints: ['observation'],
    boeFocus: ['technology'],
  },
  'network-participation': {
    theme: 'expertise',
    scorecard: 'aeg',
    dataPoints: ['participation'],
    boeFocus: ['community'],
  },
  'ell-sheltered': {
    theme: 'expertise',
    scorecard: 'esl',
    dataPoints: ['external-exams', 'common-assessments'],
    boeFocus: ['consistency'],
  },
  'students-of-promise': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['participation'],
    boeFocus: ['empowerment'],
  },
  'psat-gaps': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['external-exams', 'common-assessments'],
    boeFocus: ['empowerment'],
  },
  'hs-pathways': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['participation'],
    boeFocus: ['empowerment'],
  },
  'ms-pathways': {
    theme: 'personalization',
    scorecard: 'esl',
    dataPoints: ['participation'],
    boeFocus: ['empowerment'],
  },
  'dasa-response': {
    theme: 'mentorship',
    scorecard: 'adb',
    dataPoints: ['discipline'],
    boeFocus: ['community'],
  },
  'labor-relations': {
    theme: 'mentorship',
    scorecard: 'adb',
    dataPoints: ['sentiment'],
    boeFocus: ['community'],
  },
  'strategic-communication': {
    theme: 'mentorship',
    scorecard: 'adb',
    dataPoints: ['sentiment'],
    boeFocus: ['community'],
  },
  'discipline-recidivism': {
    theme: 'mentorship',
    scorecard: 'adb',
    dataPoints: ['discipline'],
    boeFocus: ['community'],
  },
  'academic-dishonesty': {
    theme: 'mentorship',
    scorecard: 'adb',
    dataPoints: ['discipline'],
    boeFocus: ['integrity', 'technology'],
  },
};
