/**
 * 2026-2027 Mamaroneck UFSD District and School Goals.
 * Transcribed from resources/2026-2027_Goals_Chart.pdf.
 *
 * Structure: four Superintendent Initiatives (regions) contain goals.
 * A goal is either district-wide, an umbrella spanning several schools
 * (with child goals), or scoped to a single school.
 */

export type GoalKind = 'district' | 'umbrella' | 'school';

export type Initiative = {
  id: string;
  title: string;
  blurb: string;
  /** Scorecard domains this initiative reports into. */
  scorecard: string[];
  color: string;
};

/** One school's slice of a district-wide plan, for goals written per school. */
export type PlanSegment = { label: string; text: string };

export type Goal = {
  id: string;
  initiative: string;
  title: string;
  kind: GoalKind;
  /** Verbatim scope text from the chart. */
  scope: string;
  /** Normalized school keys, for filtering. */
  schools: string[];
  /** Umbrella goal this belongs to, if any. */
  parent?: string;
  /** Compact label for the bubble, when the full title is too long to fit. */
  shortTitle?: string;
  condition?: string;
  fall?: string;
  fallProgress?: string;
  spring?: string;
  springProgress?: string;
  /**
   * Set when the chart writes a goal as separate work per school. The plain
   * `fall`/`spring` strings stay as written so search still matches them; these
   * are what gets displayed, so every per-school breakdown looks the same.
   */
  bySchool?: {
    fall?: PlanSegment[];
    fallProgress?: PlanSegment[];
    spring?: PlanSegment[];
    springProgress?: PlanSegment[];
  };
};

export const SCHOOLS: { key: string; label: string; short: string; abbr: string }[] = [
  { key: 'district', label: 'District-Wide', short: 'District-Wide', abbr: 'District-Wide' },
  { key: 'central', label: 'Central Elementary', short: 'Central', abbr: 'Central' },
  {
    key: 'chatsworth',
    label: 'Chatsworth Avenue Elementary',
    short: 'Chatsworth Ave',
    abbr: 'Chatsworth Ave',
  },
  {
    key: 'mamaroneck-ave',
    label: 'Mamaroneck Avenue Elementary',
    short: 'Mamaroneck Ave',
    abbr: 'Mam. Ave',
  },
  { key: 'murray', label: 'Murray Avenue Elementary', short: 'Murray Ave', abbr: 'Murray Ave' },
  { key: 'hommocks', label: 'Hommocks Middle School', short: 'Hommocks', abbr: 'HMX' },
  { key: 'mhs', label: 'Mamaroneck High School', short: 'MHS', abbr: 'MHS' },
];

export const INITIATIVES: Initiative[] = [
  {
    id: 'aligned-system',
    title: 'An Aligned System for Continual Improvement',
    blurb:
      'Next levels of work involve leveraging data, achieving consistency in practice, and enforcing common assessment toward identification of gaps and more personalized practice. Requires leadership to facilitate educator ownership and collaboration toward common goals. Scale must be universal. Impacts must be measurable through student achievement.',
    scorecard: ['ESL', 'AEG', 'RII'],
    color: '#2a78d6',
  },
  {
    id: 'leadership-capacity',
    title: 'Leadership Capacity',
    blurb:
      'Next levels of work involve coaching, unifying practice across the district, improving transitions, and promoting common and deliberate approaches to problem-solving. Requires leadership to identify problems or practice and collaborate across schools to solve them. Scale must be universal. Impacts must be measurable through evidence of educator practice.',
    scorecard: ['AEG', 'RII'],
    color: '#1baf7a',
  },
  {
    id: 'expanding-opportunities',
    title: 'Expanding Opportunities for All Students',
    blurb:
      'Next levels of work involve closing specific gaps, identifying students for acceleration, and building special interest pathways, supported by facilities renovations. Impacts must be measurable through student achievement and student participation in opportunities.',
    scorecard: ['ESL'],
    color: '#4a3aa7',
  },
  {
    id: 'relational-trust',
    title: 'Relational Trust with the Community',
    blurb:
      'Next levels of work involve adjusting communications and partnering with the community on issues in which school and home, together, have impacts upon students. While some of the projects above (e.g., technology plan implementation, pathways expansion) all have operations in this goal area, the projects below are exclusive to it. Impact will show primarily through data on student experience (particularly in discipline) and community and student feedback.',
    scorecard: ['ADB'],
    color: '#008300',
  },
];

/** Every school in the district, for goals that apply K-12. */
const ALL_SCHOOLS = [
  'district',
  'central',
  'chatsworth',
  'mamaroneck-ave',
  'murray',
  'hommocks',
  'mhs',
];

/** The four elementary schools, for goals that apply K-5. */
const ELEMENTARY = ['district', 'central', 'chatsworth', 'mamaroneck-ave', 'murray'];

export const GOALS: Goal[] = [
  // ── An Aligned System for Continual Improvement ─────────────────────────
  {
    id: 'k12-math',
    initiative: 'aligned-system',
    title: 'K-12 Math consistency',
    kind: 'district',
    scope: 'District-Wide',
    schools: ALL_SCHOOLS,
    condition:
      'Noting a gap in K-12 math intervention consistency: little consistent standards-based data collection across secondary grade levels.',
    fall:
      "Elementary: audit and adjust to ensure compliance with assessment calendar and data collection/analysis practices. HMX: launch the new curriculum's assessment platform and establish routines for reviewing standards-level data in team/department meetings; MHS: align on classroom gradebook, homework, and assessment practices, with continued development and deployment of common assessments.",
    fallProgress:
      "Assessment-calendar/data-routine compliance underway at Elementary; HMX's new assessment platform launched; MHS gradebook/assessment alignment begun.",
    spring:
      'Elementary: review standards-level trends across grades/classrooms, focusing on summative standards, and set expectations for intervention plans; revisit performance on the same standards post-intervention at EOY. HMX: use data to identify trends by standard/skill and adjust the program, then adjust 27-28 sequencing; MHS: identify large-scale curriculum revision options/timeline to follow elementary and middle school curriculum adoptions.',
    springProgress:
      'Change in student performance on shared math standards, and whether achievement gaps by standard narrowed.',
    bySchool: {
      fall: [
        {
          label: 'Elementary',
          text: 'Audit and adjust to ensure compliance with assessment calendar and data collection/analysis practices.',
        },
        {
          label: 'Hommocks',
          text: "Launch the new curriculum's assessment platform and establish routines for reviewing standards-level data in team/department meetings.",
        },
        {
          label: 'MHS',
          text: 'Align on classroom gradebook, homework, and assessment practices, with continued development and deployment of common assessments.',
        },
      ],
      fallProgress: [
        {
          label: 'Elementary',
          text: 'Assessment-calendar/data-routine compliance underway.',
        },
        { label: 'Hommocks', text: 'New assessment platform launched.' },
        { label: 'MHS', text: 'Gradebook/assessment alignment begun.' },
      ],
      spring: [
        {
          label: 'Elementary',
          text: 'Review standards-level trends across grades/classrooms, focusing on summative standards, and set expectations for intervention plans; revisit performance on the same standards post-intervention at EOY.',
        },
        {
          label: 'Hommocks',
          text: 'Use data to identify trends by standard/skill and adjust the program, then adjust 27-28 sequencing.',
        },
        {
          label: 'MHS',
          text: 'Identify large-scale curriculum revision options/timeline to follow elementary and middle school curriculum adoptions.',
        },
      ],
    },
  },
  {
    id: 'k5-science',
    initiative: 'aligned-system',
    title: 'K-5 Science consistency',
    kind: 'district',
    scope: 'District-Wide',
    schools: ELEMENTARY,
    condition:
      'Noting gaps in elementary science achievement: limited standards-based data prior to the Grade 5 state assessment.',
    fall: 'Determine target grade level(s) for benchmarks.',
    fallProgress: 'Target grade level(s) confirmed and benchmark development complete.',
    spring:
      "Administer the benchmarks at midyear, with data analysis informing EOY review and following years' pacing.",
    springProgress:
      'Benchmark results and how they compare to Grade 5 state science assessment performance.',
  },
  {
    id: 'k12-writing',
    initiative: 'aligned-system',
    title: 'K-12 Writing consistency',
    kind: 'district',
    scope: 'District-Wide',
    schools: ALL_SCHOOLS,
    condition:
      'Building on progress in K-12 writing curriculum consistency: K-12 rubrics, assessment practices, and curricular expectations are not yet standard across grade levels, or articulated K-12.',
    fall:
      'Continue development of common rubrics and common intervention/enrichment toolboxes; audit teacher compliance with writing programs (Patterns of Power, etc.).',
    fallProgress:
      'Common rubrics drafted, utilized; program-compliance audit (Patterns of Power, etc.) complete.',
    spring:
      'Administer common assessments and convene Lit Think Tank and department meetings to calibrate assessment on rubrics, with identification of exemplar papers.',
    springProgress:
      'Common-assessment writing scores and calibration results against the shared rubric, district-wide. Grade bands & courses.',
  },
  {
    id: 'k12-pe',
    initiative: 'aligned-system',
    title: 'K-12 PE assessment consistency',
    kind: 'district',
    scope: 'District-Wide',
    schools: ALL_SCHOOLS,
    condition:
      'Noting a gap in PE assessment consistency and misaligned grade distributions: curriculum maps and assessment protocols not yet aligned across the 4 elementary schools and across secondary teachers.',
    fall:
      "Build a shared, side-by-side understanding of each school's curriculum maps and assessment protocols; audit assessment rubrics to bring standardization.",
    fallProgress: 'Cross-school protocol review and rubric audit complete.',
    spring:
      'Deploy, refine, trim, or add toward commitment to a consistent K-12 PE assessment strategy, with predictable grade-to-grade practices.',
    springProgress:
      'Adoption of one consistent K-12 PE assessment approach and resulting grade-distribution consistency across schools.',
  },
  {
    id: 'goal-setting-framework',
    initiative: 'aligned-system',
    title: 'Common goal-setting framework',
    kind: 'district',
    scope: 'District-Wide',
    schools: ['district'],
    condition:
      'Building on strength in shared goal-setting structure: all 6 schools now share one framework, up from inconsistent school-goal processes in prior years.',
    fall:
      'Apply the shared, scorecard-aligned framework as schools set 2026-2027 goals through the June/July retreat, with focus on bringing to scale and measuring outcomes.',
    fallProgress:
      'All six schools set 2026-2027 goals using the shared framework at the June/July retreat.',
    spring:
      'Use the now-common framework to report actual outcome impacts on student achievement/experience; ensure compliance and growth through data meetings at every level.',
    springProgress:
      "Actual student-outcome results achieved against each school's stated goal, not just goal-setting or activity completion.",
  },
  {
    id: 'elementary-literacy',
    initiative: 'aligned-system',
    title: 'Elementary Literacy achievement',
    kind: 'umbrella',
    scope: 'Four elementary schools',
    schools: ['district', 'central', 'chatsworth', 'mamaroneck-ave', 'murray'],
    condition:
      'A shared literacy goal carried by each of the four elementary schools, with a distinct condition, plan, and measure at each building.',
  },
  {
    id: 'literacy-central',
    initiative: 'aligned-system',
    title: 'AIS/Tier II literacy growth',
    kind: 'school',
    scope: 'Central Elementary',
    schools: ['central'],
    parent: 'elementary-literacy',
    condition:
      "Noting a gap in literacy growth: ~55% of AIS-screened students (gr. 1-4) and ≥10% of non-screened K-4 students did not achieve a year's growth in 25-26.",
    fall:
      "Use Open Architects to identify AIS/Tier II students who did not make a year's growth; beginning-of-year faculty meetings tie the goal to teacher capacity and data, with measurement of teacher team meeting practices toward effective collaboration.",
    fallProgress:
      'AIS/Tier II student identification and beginning-of-year faculty meetings complete.',
    spring:
      '1:1 data/collaboration meetings in which teachers share successes and growth areas and deploy intervention strategies; confirm progress via Open Architects.',
    springProgress:
      "Percentage of identified students who achieved a year's literacy growth, against the 55%/10% 25-26 baseline gap.",
  },
  {
    id: 'literacy-chatsworth',
    initiative: 'aligned-system',
    title: 'Below-benchmark literacy',
    kind: 'school',
    scope: 'Chatsworth Avenue Elementary',
    schools: ['chatsworth'],
    parent: 'elementary-literacy',
    condition:
      'Noting a gap in literacy achievement: ~15% of students remained below benchmark on literacy achievement data across 25-26.',
    fall:
      'Identify students below benchmark within the first 3 weeks and gather baseline data; admin team builds collaboration/joint-accountability structures.',
    fallProgress: 'Below-benchmark students identified within 3 weeks; baseline data gathered.',
    spring:
      'Compare baseline, midyear, and spring literacy data; confirm progress via Open Architects.',
    springProgress:
      'Year-end literacy achievement data compared to the ~15% below-benchmark baseline.',
  },
  {
    id: 'literacy-mamaroneck-ave',
    initiative: 'aligned-system',
    title: 'Instructional consistency in literacy',
    kind: 'school',
    scope: 'Mamaroneck Avenue Elementary',
    schools: ['mamaroneck-ave'],
    parent: 'elementary-literacy',
    condition:
      'Noting a gap in instructional consistency: uneven learning experiences from inconsistent curriculum implementation in literacy leading to uneven student achievement across grade level classrooms.',
    fall:
      "Establish a shared vision for instructional coherence during Superintendent's Conference Days; begin leveraging existing strengths (e.g., highly and effectively collaborative teams) and grade-level liaisons to develop school-wide expectations for practice and assessment.",
    fallProgress:
      "Shared instructional expectations established at Superintendent's Conference Days.",
    spring:
      'Review evidence of coherence (student achievement in Open Architects, walkthrough data); confirm more consistent, comparable learning experiences district-wide via student achievement in Open Architects.',
    springProgress:
      'Evidence of more consistent, comparable student achievement/learning experiences across classrooms.',
  },
  {
    id: 'literacy-murray',
    initiative: 'aligned-system',
    title: "ELA 'of concern' exit rate",
    kind: 'school',
    scope: 'Murray Avenue Elementary',
    schools: ['murray'],
    parent: 'elementary-literacy',
    condition:
      'Noting a gap in ELA concern category exit rate: small number of students of concern exiting that designation throughout 25-26.',
    fall:
      'Strengthen intervention and IST cohesiveness over the summer; focus on delivery of whole-class executive-functioning lessons, Tier 1 effective practice, and educator data analysis to personalize intervention.',
    fallProgress: 'IST coordination strengthened; executive-functioning lessons delivered.',
    spring:
      'Review evidence of student progress in Open Architects; gather best practices in DIP and other intervention opportunities; conduct targeted intervention in spring to graduate students from concern category.',
    springProgress:
      "Change in the number of ELA students in the 'of concern' category, against the baseline.",
  },
  {
    id: 'data-literacy-hommocks',
    initiative: 'aligned-system',
    title: 'Data literacy toward consistent practice',
    shortTitle: 'Data literacy',
    kind: 'school',
    scope: 'Hommocks Middle School',
    schools: ['hommocks'],
    condition:
      'Noting a gap in data-driven meeting culture as a cause of student achievement concerns (number of students below 75% in more than one class at midyear).',
    fall:
      'Grade-level administrator facilitates regular meetings modeling data review and grading calibration; chairs partner with coordinators on weekly meetings to build the data skills and tie to consistent practice.',
    fallProgress: 'Regular, admin-led data-review meetings underway.',
    spring:
      'Track impact of intervention and personalized approaches in Formative, Open Architects, and other clearinghouse/assessment tools; share best practices into a consistent Tier 1 toolbox.',
    springProgress:
      'Change in the number of students below 75 in more than one class, against the midyear baseline.',
  },
  {
    id: 'attendance-mhs',
    initiative: 'aligned-system',
    title: 'Attendance measurement and expectations',
    shortTitle: 'Attendance expectations',
    kind: 'school',
    scope: 'Mamaroneck High School',
    schools: ['mhs'],
    condition:
      'Noting a gap in student achievement tied to attendance/tardiness, and lack of consistent practices for identifying and supporting students at various attendance benchmarks (e.g., > 10 absences).',
    fall:
      'Communicate the attendance/achievement connection to all staff; standardize period-attendance documentation and parent outreach; monitor hallway lateness and idling toward reduction of class tardiness.',
    fallProgress: 'Standardized attendance documentation and staff communication complete.',
    spring:
      'Utilize Open Architects to: review midyear intervention data for effectiveness; compare ongoing attendance to baseline and analyze the attendance-achievement relationship.',
    springProgress:
      'Year-end attendance data and its relationship to student achievement, against baseline.',
  },

  // ── Leadership Capacity ─────────────────────────────────────────────────
  {
    id: 'instructional-coaching',
    initiative: 'leadership-capacity',
    title: 'Instructional coaching',
    kind: 'district',
    scope: 'District-Wide',
    schools: ['district'],
    condition:
      'Noting a gap in PD-to-practice transfer: walkthroughs and focus groups with educators show improvable rates in transfer of professional learning to broad teacher practice.',
    fall:
      'Train administrators, district-wide coaches, and new school-based coaches (e.g., math and reading specialists, chairs, etc.) on coaching systems, research-based impact cycles; identify opportunities for broader application of impact cycles.',
    fallProgress: 'Administrator/coach training on the shared coaching model complete.',
    spring:
      'Midyear/EOY reflection meetings with coaches and administrators on coaching-data trends; non-evaluative learning walks; classroom-teacher feedback collection.',
    springProgress:
      'Coaching-cycle data trends and evidence of PD-to-practice transfer from learning walks and teacher feedback.',
  },
  {
    id: 'science-of-learning',
    initiative: 'leadership-capacity',
    title: 'Science of learning',
    kind: 'district',
    scope: 'District-Wide',
    schools: ALL_SCHOOLS,
    condition:
      'Noting a gap in shared understanding and measurement of student engagement: persistent lack of common language on intersections of learning science and practice through effortful thinking.',
    fall:
      'Train administrative team on classroom look-fors for and evaluation of teacher practices toward common practice; design walkthrough instruments.',
    fallProgress: 'Administrator training on classroom look-fors complete.',
    spring:
      'Deploy district-wide tools for measurement of engagement; identify leading edge practitioners for innovation; track proliferation of classroom practices.',
    springProgress:
      'District-wide engagement-measurement data and identified practice proliferation.',
  },
  {
    id: 'avid',
    initiative: 'leadership-capacity',
    title: 'AVID',
    kind: 'school',
    scope: 'Hommocks Middle School',
    schools: ['hommocks'],
    condition:
      "Implementing AVID in the middle school: need for fidelity to AVID's core components has not yet been established, with equal progress in intensive cohort and in school-wide impacts on teacher practice aligned to science of learning.",
    fall: 'Train staff on AVID methods and develop WICOR-aligned walkthrough and evaluation tools.',
    fallProgress: 'Staff training on AVID methods complete.',
    spring:
      'Conduct WICOR-rubric walkthroughs, closing gaps and misalignments in practice as discovered; develop school-wide AVID manual aligned to district and school goals.',
    springProgress:
      "WICOR-rubric walkthrough results and fidelity to AVID's core components school-wide.",
  },
  {
    id: 'technology-plan',
    initiative: 'leadership-capacity',
    title: 'Technology plan implementation',
    kind: 'district',
    scope: 'District-Wide',
    schools: ALL_SCHOOLS,
    condition:
      'Implementing district-wide technology playbook: need for rapid scaling of practice aligned to the four promises outlined in the plan.',
    fall:
      'Begin implementation plan, with focus on curriculum revision toward more deliberate technology integration; develop and implement walkthrough and other auditing strategies K-12.',
    fallProgress: 'K-12 rollout of the technology playbook begun.',
    spring: 'Measure and audit as directed in playbook implementation plan.',
    springProgress: "Audit results measuring implementation against the playbook's four promises.",
  },
  {
    id: 'network-participation',
    initiative: 'leadership-capacity',
    title: 'Larger network participation',
    kind: 'district',
    scope: 'District-Wide',
    schools: ['district'],
    condition:
      'Building on strength in external leadership networks: ongoing participation, including targeted presentation, school visit, and conference participation opportunities.',
    fall:
      'Continue participation and site visits on workforce development, AI, and other priorities; support teams presenting in nationwide conferences (e.g., NCTE, ENL).',
    fallProgress: 'Continued network participation and conference presentations.',
    spring:
      'Continue to identify opportunities for contribution and learning with partners near and far; articulate learnings from completed opportunities.',
    springProgress:
      'Specific practices or learnings brought back into district leadership as a result.',
  },

  // ── Expanding Opportunities for All Students ────────────────────────────
  {
    id: 'ell-sheltered',
    initiative: 'expanding-opportunities',
    title: 'ELL sheltered protocol training',
    kind: 'district',
    scope: 'District-Wide',
    schools: ALL_SCHOOLS,
    condition:
      'Noting gaps in ELL 8th grade science Regents achievement, in secondary coursework, and in elementary literacy performance: need for educator PD on sheltered instructional protocols, with coaching support.',
    fall:
      'Data analysis and case study to determine specific PD needs; work with consultants to provide teacher PD.',
    fallProgress: 'PD-needs diagnosis complete; outside expertise engaged.',
    spring:
      "Continue PD with coaching/classroom visits; monitor common assessment data; review Regents outcomes at year's end and refine supports for 27-28.",
    springProgress: 'Regents outcomes for ELL students compared to the 9% baseline pass rate.',
  },
  {
    id: 'students-of-promise',
    initiative: 'expanding-opportunities',
    title: 'Students of Promise',
    kind: 'district',
    scope: 'District-Wide',
    schools: ALL_SCHOOLS,
    condition:
      'Noting a gap in advanced-coursework access for students with various demographic and other opportunity barriers: need for systems to identify and nurture academic promise at earlier grade levels, and provide support for successful participation in advanced coursework in middle and high school.',
    fall:
      'Expand dashboarding in Open Architects to ensure early identification and implementation of supports in elementary and middle school; tutoring and mentorship program with high school students as mentors.',
    fallProgress: 'Earlier-identification dashboarding and student mentoring program launched.',
    spring:
      'Audit student data points at midyear to confirm advanced-coursework readiness; identify middle and high school students for enrollment in advanced coursework; review full-year data on students on track for advanced coursework.',
    springProgress:
      'Number/percentage of identified students enrolled in advanced coursework.',
  },
  {
    id: 'psat-gaps',
    initiative: 'expanding-opportunities',
    title: 'PSAT gaps & opportunities',
    kind: 'school',
    scope: 'Hommocks Middle School & Mamaroneck High School',
    schools: ['hommocks', 'mhs'],
    condition:
      'Noting gaps in specific 8th grade writing skills and in specific skills in 8th grade math, as well as opportunities to recognize exceptional achievement: need to provide more personalized support in transitions to 9th grade, and curriculum revision grades 6-8 in literacy and math.',
    fall:
      'Training to refresh practice and expectations for Patterns of Power; collaborative work on common writing and math assessment; development of more specific, consistent, and prescriptive intervention practices through MTSS; implementation of intervention practices tied to new math curriculum.',
    fallProgress:
      'Patterns of Power retraining and 6-8 math/writing intervention alignment complete.',
    spring:
      'Continued cycles of assessment, analysis, and intervention toward increased student achievement; adjustment of curricular and MTSS programs as needed heading into 27-28.',
    springProgress:
      'Common-assessment data showing writing/math gap closure compared to PSAT baseline.',
  },
  {
    id: 'hs-pathways',
    initiative: 'expanding-opportunities',
    title: 'High School Pathways',
    kind: 'school',
    scope: 'Mamaroneck High School',
    schools: ['mhs'],
    condition:
      'Building on strength in expanded AP access, dual enrollment expansion, and senior internship redesign: need for stronger course pathways connected to co-curricular activities and opportunities, supported by a more focused and embedded internship program.',
    fall:
      'Work with Big Picture Learning on internship and pathways audit; develop pathways of related/tiered coursework with specific co-curricular activities; formalize and advertise availability of summer course opportunities, as well as opportunities for credit by examination and independent study.',
    fallProgress: 'Internship/pathways audit with Big Picture Learning complete.',
    spring:
      'Plan future facilities renovations and staffing changes to support pathways; implement audit recommendations as appropriate toward more flexible/embedded internships.',
    springProgress:
      'Student participation rates in the new tiered pathways and internship program.',
  },
  {
    id: 'ms-pathways',
    initiative: 'expanding-opportunities',
    title: 'Middle School Pathways',
    kind: 'school',
    scope: 'Hommocks Middle School',
    schools: ['hommocks'],
    condition:
      'Noting gaps in opportunities for middle school students to engage in advanced coursework related to areas of interest and passion: need to provide scheduling flexibility, more individualized enrichment choice, and provide facilities to support.',
    fall:
      'Plan facilities renovations in the library and other spaces to support career interest coursework; plan for scheduling to offer broader enrichment choice (currently dominated by music) and broader access for students in special education; convene teams of middle and high school faculty with career representatives to plan 6-12 sequences.',
    fallProgress: 'Facilities/scheduling plans for expanded enrichment access complete.',
    spring:
      'Convene curriculum teams to plan for programming in new spaces; identify opportunities for (and implement) cross-age opportunities between middle and high school students; advertise availability of specific electives and career-interest pre-pathways in middle school. Hiring engaged as needed.',
    springProgress:
      'Student participation rates in new enrichment/elective offerings, especially outside music.',
  },

  // ── Relational Trust with the Community ─────────────────────────────────
  {
    id: 'budgeting-transparency',
    initiative: 'relational-trust',
    title: 'Budgeting transparency model',
    kind: 'district',
    scope: 'District-Wide',
    schools: ['district'],
    condition:
      'Building on strength in public budget transparency: the 5-part presentation process is already established and public, but can be aligned more closely to strategic framework, scorecard, and goals for scale and a focus on outcomes.',
    fall:
      'Explicitly align budgeting process to scorecard goals, with specific budgeting requests tied to specific outcomes in student achievement/experience and scale; redo district website to carry this messaging.',
    fallProgress: 'Budget requests explicitly tied to scorecard goals; website refresh underway.',
    spring:
      'Continue focusing on school and Board presentations on connection of dollars spent to results achieved — tied to budget presentations.',
    springProgress: "Specific student-outcome results tied to this year's funded budget priorities.",
  },
  {
    id: 'dasa-response',
    initiative: 'relational-trust',
    title: 'DASA & Response Protocol',
    kind: 'district',
    scope: 'District-Wide',
    schools: ALL_SCHOOLS,
    condition:
      'Noting a gap in response consistency: need for consistent response protocols that addresses needs of victim and perpetrator; need for data analysis cycles to promote targeted improvement in implementation.',
    fall:
      'PD for staff, particularly in secondary, on need and response; unification of response best practices across all schools into a single manual, including expectations and protocols for communication with the Office of DEIB.',
    fallProgress: 'Staff training complete; unified response manual published.',
    spring:
      'Cycles of analysis leading to end-of-year data review, with lessons learned cycled into opportunities for improvement in 27-28.',
    springProgress:
      'Year-end DASA incident data and evidence of more consistent response across schools.',
  },
  {
    id: 'labor-relations',
    initiative: 'relational-trust',
    title: 'Labor relations',
    kind: 'district',
    scope: 'District-Wide',
    schools: ['district'],
    condition:
      'Building on strength in labor partnership: successful collective-bargaining agreements already reached with both MTA and MAA.',
    fall:
      'Sustain relationships with labor units through implementation of successor agreements; begin revision of teacher evaluation to achieve more strategic alignment.',
    fallProgress: 'Implementation of new agreement terms underway.',
    spring:
      'Continue implementing negotiated terms (schedule/parity changes for MTA; summer pay/workday terms for MAA) as evidence of ongoing trust.',
    springProgress:
      'Staff/community sentiment or retention data reflecting the labor-trust relationship.',
  },
  {
    id: 'strategic-communication',
    initiative: 'relational-trust',
    title: 'Strategic communication',
    kind: 'district',
    scope: 'District-Wide',
    schools: ['district'],
    condition:
      'Building on developments in stakeholder communication: opportunity for ongoing video communications, State of the Schools and Board of Education presentations, and revised website.',
    fall:
      'Continue video communications and strategic-framework updates; incorporate into a new website tailored to lead to easier access to measurements, "slices of life," curriculum documents, and more.',
    fallProgress: 'Revised website, particularly C&I live; video updates continuing.',
    spring:
      'Deliver State of the Schools presentations and budget communications, extending the model toward scorecard/outcomes reporting.',
    springProgress:
      'Community engagement/feedback data (e.g., survey results) on trust and transparency.',
  },
  {
    id: 'discipline-recidivism',
    initiative: 'relational-trust',
    title: 'Discipline recidivism',
    kind: 'school',
    scope: 'Hommocks Middle School',
    schools: ['hommocks'],
    condition:
      'Noting a gap in first level behavioral recidivism: need for more consistent referral process, communication and enforcement of expectations.',
    fall:
      'Train on streamlined referral process; PD on classroom interventions and relationship-building practices; team-level data collection toward dashboarding in Open Architects.',
    fallProgress: 'Streamlined referral process and relationship-building PD complete.',
    spring:
      'Identification of lessons learned from mid-year data analysis toward adjustments in practice, and communications/revisions of handbook toward 27-28.',
    springProgress: 'Change in Tier I referral/recidivism rate compared to the baseline.',
  },
  {
    id: 'academic-dishonesty',
    initiative: 'relational-trust',
    title: 'Academic dishonesty',
    kind: 'school',
    scope: 'Hommocks Middle School & Mamaroneck High School',
    schools: ['hommocks', 'mhs'],
    condition:
      'Noting a rise in reports of cheating, some involving the use of artificial intelligence or other digital technologies: need for tiered and consistent prevention and response in both middle and high schools.',
    fall:
      'Identification of model practices and policies from peer schools; redesign and communication of secondary policies and specific departmental variations, articulating with implementation of the technology plan; auditing of and training on plagiarism-prevention tools and services.',
    fallProgress:
      'Peer-policy review and plagiarism-tool audit complete. Revisions to code of conduct as needed/identified.',
    spring:
      'Continued implementation, adjustment, and communication; expansion of (and selection of new, if necessary) plagiarism-prevention tools and services; leveraging of lessons learned into assessment design geared toward authentic displays of mastery.',
    springProgress:
      "Data on cheating incidents/policy violations compared to this year's baseline.",
  },
];

export const initiativeById = (id: string) => INITIATIVES.find((i) => i.id === id)!;
export const goalById = (id: string) => GOALS.find((g) => g.id === id);
export const schoolLabel = (key: string) =>
  SCHOOLS.find((s) => s.key === key)?.short ?? key;
export const schoolAbbr = (key: string) =>
  SCHOOLS.find((s) => s.key === key)?.abbr ?? key;
