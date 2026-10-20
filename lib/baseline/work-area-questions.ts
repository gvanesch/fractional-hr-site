// Respondent-facing questions vary by the work. These are separate from frozen
// campaign dictionaries, so existing responses retain their original meaning.
export type AreaQuestions = {
  intro: string;
  contributions?: string[][];
  scope?: [string, string];
  local?: [string, string];
  nextStep?: [string, string, string[]];
  collaboration?: [string, string];
  volume?: [string, string];
};
const common = (lead: string, deliver: string, advise: string) => [
  ["accountable", lead],
  ["steps", "Own a defined part of the work"],
  ["deliver", deliver],
  ["coordinate", "Coordinate work with other people"],
  ["advise", advise],
  ["unknown", "Not sure"],
];
const people = ["managers", "local_people", "regional_people", "group_people"];
const choices = (...extra: string[]) => [
  ...people,
  ...extra,
  "other",
  "none",
  "unknown",
];
export const AREA_QUESTIONS: Record<string, AreaQuestions> = {
  lifecycle: {
    intro:
      "Think about the employee changes you personally handle, such as joining, leaving, contracts or absence records.",
    contributions: common(
      "Lead the lifecycle service",
      "Prepare documents or update employee records",
      "Give advice or check exceptions",
    ),
    local: [
      "Country or language needs for this work (optional)",
      "For example, prepare contracts in Finnish or apply a country's leave rules. Describe the requirement, not individual employee cases.",
    ],
    nextStep: [
      "Whose action or approval do you need to complete an employee change?",
      "Select the teams you rely on when handling a joiner, leaver or contract change. For example, a manager confirms the leaving date, Payroll updates final pay, or IT removes system access. Select all that apply across your usual work. Choose No other team needed if you can complete it without anyone else taking action or giving approval.",
      choices("finance", "it", "legal"),
    ],
    collaboration: [
      "A hand-off that causes delay or repeated work (optional)",
      "For example, contract preparation waits for a manager to confirm the start date. Explain the step and team; do not name an employee.",
    ],
    volume: [
      "Number of lifecycle items you handle (optional estimate)",
      "Choose one common type: joiners, leavers, contract changes or absence updates. State which type you counted. Count your own work, not the whole team's work.",
    ],
  },
  recruitment: {
    intro:
      "Include the recruitment steps you personally carry out or support. Hiring decisions can be shared with the hiring manager.",
    contributions: common(
      "Lead the recruitment process",
      "Source candidates, arrange interviews or prepare offers",
      "Advise hiring managers or assess candidates",
    ),
    scope: [
      "Size or frequency of your recruitment work (optional)",
      "For example, support 8 open vacancies, arrange 15 interviews per month, or run two graduate hiring rounds per year. Include only your own involvement.",
    ],
    local: [
      "Country or language needs for recruitment (optional)",
      "For example, interviews in Spanish or country-specific requirements for offers. A short example is enough.",
    ],
    nextStep: [
      "Who must take the next recruitment step or give approval?",
      "For example, a hiring manager selects a candidate or a People specialist approves an offer. A successful candidate receiving an offer is not a team hand-off. Choose No hand-off if no one else needs to act.",
      choices("legal", "provider"),
    ],
    collaboration: [
      "Where does recruitment work wait or return to you? (optional)",
      "For example, interviews wait for hiring-manager availability or an offer returns because the agreed salary is missing.",
    ],
  },
  pay_benefits: {
    intro:
      "Select the pay and benefits work you do. If you handle payroll, the Payroll responsibilities section asks about your part in each payroll stage; you do not need to repeat it here.",
    scope: [
      "Size or frequency of your pay and benefits work (optional)",
      "For example, check payroll changes for 150 employees each month, handle 10 benefit enrolments per month, or support one annual salary-review cycle. Separate different types of work.",
    ],
    local: [
      "Country-specific pay or benefits needs (optional)",
      "For example, statutory benefit enrolment in Italy or local payroll deadlines in Sweden. Do not include salary or other employee details.",
    ],
    collaboration: [
      "Who do you work with on benefits or salary reviews, and what do they do? (optional)",
      "For example, Finance confirms the salary-review budget, a benefits provider processes enrolments, or a People specialist advises on reward policy. Payroll stages are covered separately.",
    ],
  },
  advice_cases: {
    intro:
      "Think about advice to managers and support for employee situations. Cases vary in complexity; a case count alone does not describe the work.",
    contributions: common(
      "Lead advice or case support",
      "Prepare case information or carry out agreed actions",
      "Advise managers or provide specialist guidance",
    ),
    scope: [
      "Types of advice or cases you support (optional)",
      "For example, weekly advice to line managers, several absence cases at a time, or occasional restructuring support. Explain the type and frequency. Do not include names or case details.",
    ],
    local: [
      "Local knowledge or language needed for this advice (optional)",
      "For example, country employment rules, consultation with employee representatives or advice in the local language.",
    ],
    collaboration: [
      "When do you need input or a decision from someone else? (optional)",
      "For example, Legal advises on an unusual employment-law issue, or a People lead agrees an exception. Employees receiving support are not a hand-off.",
    ],
  },
  planning_development: {
    intro:
      "Include planning, performance reviews, talent discussions and learning. Describe the cycles or programmes you support, rather than treating them as routine transactions.",
    contributions: common(
      "Lead a planning, performance or development programme",
      "Run activities or prepare information for a cycle",
      "Advise leaders, facilitate discussions or coach",
    ),
    scope: [
      "Which cycles or programmes do you support, and at what scale? (optional)",
      "For example, coordinate annual performance reviews for 3 businesses, support talent discussions for 6 teams, or arrange 4 learning sessions each quarter. Use the example that fits your work; no single item count is needed.",
    ],
    collaboration: [
      "Who provides input or works with you on these cycles? (optional)",
      "For example, managers complete performance reviews, leaders agree workforce plans, or a learning provider delivers training. Say what each party contributes. Participants attending training are beneficiaries, not a process hand-off.",
    ],
  },
  experience: {
    intro:
      "Include listening, surveys, communications, recognition and events. The employees who attend an event or receive a message are the audience; this does not mean you pass work to them.",
    contributions: common(
      "Lead an engagement or employee-experience activity",
      "Organise events, surveys or communications",
      "Advise on engagement or interpret employee feedback",
    ),
    scope: [
      "What do you deliver, and how often? (optional)",
      "For example, organise 2 employee events per year, run a quarterly listening survey for 3 businesses, or prepare a monthly employee newsletter. Mention the audience or reach if useful.",
    ],
    collaboration: [
      "Who helps you plan or deliver these activities? (optional)",
      "For example, Communications helps prepare a message, a local office colleague organises an event, or a supplier provides a venue. Paying an invoice is relevant only if you personally manage that step. You do not need to list the employees who attend.",
    ],
  },
  policies: {
    intro:
      "Include writing and maintaining policies, local compliance, audits, consultation and mandatory training. Some work happens annually or only when rules change.",
    contributions: common(
      "Lead policy or compliance work",
      "Draft updates, organise consultation or prepare audit information",
      "Interpret rules or provide specialist advice",
    ),
    scope: [
      "Main policies, checks or cycles you support (optional)",
      "For example, update 5 country policies each year, coordinate an annual compliance audit, or organise required training for new starters. A short description is enough.",
    ],
    local: [
      "Countries or local rules relevant to this work (optional)",
      "For example, French consultation requirements, a German works agreement or a country-specific leave policy. Explain the requirement briefly.",
    ],
    nextStep: [
      "Who needs to review, approve or act on this work?",
      "For example, Legal reviews a policy, employee representatives are consulted, or the policy owner approves an update. Employees reading the finished policy are the audience, not an approval step.",
      choices("legal"),
    ],
    collaboration: [
      "Any important review or approval dependency? (optional)",
      "For example, publication waits for local consultation to finish. Say which step depends on whom.",
    ],
  },
  systems_data: {
    intro:
      "This work is delivered as a shared Group service. The Your technology work section asks about platforms, activities and your involvement. Responsibilities can be shared across the team, including with the team lead.",
    scope: [
      "Anything important about your systems, data or improvement work not covered elsewhere? (optional)",
      "For example, a HiBob reporting project, a cross-system integration or ongoing data-quality work. Mention the systems or businesses involved. Do not repeat the platform and activity selections in Your technology work.",
    ],
    collaboration: [
      "Key working relationships or dependencies (optional)",
      "For example, work with the team lead on priorities, IT on an integration or Finance on report definitions. Explain the contribution; shared work does not need one person to own the whole process.",
    ],
  },
  office: {
    intro:
      "Include practical reception, workplace and facilities work. Sites, cover and the type of service are often more useful than a single count of items.",
    contributions: common(
      "Lead office or facilities services",
      "Provide reception or practical workplace support",
      "Advise on workplace arrangements or safety requirements",
    ),
    scope: [
      "Which offices or services do you cover, and how often? (optional)",
      "For example, provide reception cover in Milan 3 days a week, support 2 offices, or arrange regular building maintenance. If useful, give a typical number of visitors, deliveries or supplier requests.",
    ],
    nextStep: [
      "Whose action or approval do you need to complete an office or facilities request?",
      "Select the teams you rely on for a request you handle or arrange. For example, IT sets up equipment, Finance approves spending, or a building supplier carries out a repair. Select all that apply across your usual work. Choose No other team needed if you can complete requests without anyone else taking action or giving approval.",
      choices("it", "finance", "provider"),
    ],
    collaboration: [
      "Any important service dependency or recurring delay? (optional)",
      "For example, repairs wait for a building supplier or an urgent purchase needs budget approval. Name the step or team.",
    ],
  },
  people_management: {
    intro:
      "The Managing your team section covers management activities and time. Use this space only for extra context about the team you manage.",
    scope: [
      "Anything about your management responsibilities not covered elsewhere? (optional)",
      "For example, manage a team across 3 countries or coordinate cover across different working patterns. Do not repeat names or direct-report numbers already provided.",
    ],
  },
  other: {
    intro: "Use your own words for work that does not fit the named areas.",
  },
};

export function areaQuestions(area: string) {
  return AREA_QUESTIONS[area] ?? AREA_QUESTIONS.other;
}

export function asksRework(area: string, tasks: string[]) {
  // Corrections are meaningful for repeated document/record processing, not
  // engagement, advice, development, projects or office services.
  return (
    area === "lifecycle" &&
    tasks.some((t) => ["changes", "documents"].includes(t))
  );
}
