export const GROUP_LABELS = {
  ops: "Employee support and administration",
  bp: "Manager and business support",
  tech: "Systems and digital work",
  office: "Reception and office services",
};
export const AREA_HELP: Record<string, string> = {
  ops_01:
    "Answer employee questions and help people find the right information or support.",
  ops_02:
    "Prepare, check or issue employment contracts, letters and other employee documents.",
  ops_03: "Arrange the steps and information needed when an employee joins.",
  ops_04:
    "Arrange records, documents and practical steps when an employee leaves.",
  ops_05:
    "Update employee records, such as job, pay, location or reporting information.",
  ops_06:
    "Administer leave, absence records and time-off processes. Do not include personal health details.",
  ops_07:
    "Enter or check payroll information, prepare inputs and help resolve payroll questions.",
  ops_08: "Administer employee benefits, enrolments and related questions.",
  ops_09:
    "Arrange meetings, letters, records or process steps for employee relations work. Do not include individual case details.",
  ops_10:
    "Arrange interviews, candidate records, recruitment documents or other hiring administration.",
  ops_11:
    "Coordinate employee moves between countries, work permits or immigration administration.",
  ops_12:
    "Complete local employment administration, required checks and compliance records.",
  ops_13: "Prepare, check or share reports and employee information.",
  ops_14: "Write, update or explain policies and practical guidance.",
  ops_15:
    "Receive, organise, answer or route requests through a People support queue.",
  ops_16:
    "Coordinate services, information or follow-up with external suppliers.",
  ops_17:
    "Other employee support or administration that is not covered by the choices above.",
  ops_18:
    "Arrange employee events, team activities or local employee gatherings.",
  bp_01:
    "Help managers think through people questions and take appropriate action.",
  bp_02:
    "Handle employee relations matters, advise on complex situations or coordinate their resolution. Do not describe individual cases.",
  bp_03:
    "Support agreed organisation changes and the related people processes.",
  bp_04:
    "Help the business understand its staffing needs and plan its workforce.",
  bp_05:
    "Support goal setting, performance conversations or the performance process.",
  bp_06:
    "Support talent discussions, development priorities or succession planning.",
  bp_07:
    "Understand employee feedback and help improve the employee experience.",
  bp_08:
    "Provide business or local input to pay, reward or compensation decisions.",
  bp_09:
    "Work with hiring managers and recruitment teams on hiring needs and decisions.",
  bp_10: "Help managers and employees understand and implement agreed changes.",
  bp_11:
    "Interpret people information and discuss what it means for the business.",
  bp_12:
    "Support local decision processes, required consultation or people governance.",
  bp_13:
    "Carry out employee administration alongside manager or business support. This is counted as Operations activity in analysis.",
  bp_14: "Other manager or business support not covered by the choices above.",
  tech_01: "Maintain a People platform and its everyday administration.",
  tech_02: "Change system settings, forms, rules or configuration.",
  tech_03: "Help users understand or resolve problems with systems.",
  tech_04:
    "Connect systems or maintain the transfer of information between them.",
  tech_05:
    "Build or maintain workflows that move work or information automatically.",
  tech_06:
    "Use or develop artificial intelligence tools and other digital solutions.",
  tech_07:
    "Find, correct or prevent problems with information held in systems.",
  tech_08: "Build or maintain reports, dashboards or analysis tools.",
  tech_09: "Manage who can access a system and what they are allowed to do.",
  tech_10: "Maintain standards, decisions and controls for technology use.",
  tech_11: "Manage the working relationship with a technology supplier.",
  tech_12:
    "Plan or deliver a system project, implementation or significant improvement.",
  tech_13:
    "Create or maintain system instructions, documentation or shared knowledge.",
  tech_14: "Other systems or digital work not covered by the choices above.",
  office_01: "Run the reception desk and provide front-of-house support.",
  office_02: "Welcome visitors and coordinate their visit.",
  office_03: "Receive, send or distribute mail and deliveries.",
  office_04: "Order and maintain office supplies.",
  office_05: "Arrange or manage access to a building or workplace.",
  office_06: "Issue or manage badges, passes and similar access items.",
  office_07: "Arrange maintenance, repairs or responses to workplace problems.",
  office_08: "Coordinate office moves, changes to space or desk arrangements.",
  office_09: "Coordinate suppliers who provide workplace services.",
  office_10:
    "Maintain workplace health and safety administration and records. Do not include personal health information.",
  office_11: "Arrange practical office tasks, equipment or local logistics.",
  office_12: "Coordinate meeting rooms and everyday office services.",
  office_13: "Coordinate workplace activities and local office requirements.",
  office_14: "Other reception or office work not covered by the choices above.",
};
export const OPTION_HELP: Record<string, string> = {
  ops: "Employee support, payroll inputs, documents, events and other People administration.",
  bp: "Manager advice, employee relations, planning and other business support.",
  tech: "Systems, integrations, data and digital tools.",
  office:
    "Reception, facilities and everyday workplace services. Analysis includes this work within People Operations.",
  one_entity: "Your regular work supports one brand, business or legal entity.",
  multiple_entities:
    "Your regular work supports more than one brand, business or legal entity.",
  all_group:
    "Your work serves the Group across team.blue, rather than a specific set of entities.",
  most_days: "This is normally part of your working day.",
  most_weeks: "You normally do this work one or more times each week.",
  most_months: "You normally do this work during each month.",
  few_times_year:
    "This normally happens several times during the year, rather than every month.",
  when_needed:
    "A request, event or issue starts this work. It does not follow a regular schedule.",
  project_based:
    "You do this work as part of a time-limited project or implementation.",
  final_result:
    "You are the person expected to make sure the work is completed correctly, even when other people help.",
  lead_part:
    "You organise a significant part of the work. Someone else is responsible for the whole result.",
  contribute:
    "You complete part of the work alongside others. You do not coordinate the whole activity.",
  advice_approval:
    "You give guidance, review an action or approve it. You do not normally carry out the whole activity.",
  administration_support:
    "You prepare information, update records, arrange steps or complete administration to support the work.",
  not_sure:
    "Choose this when you cannot give a clear answer from your current experience.",
  people_operations:
    "The team or colleagues who provide employee support and People administration.",
  business_partnering:
    "Colleagues who advise managers and support the business on people matters.",
  people_technology:
    "Colleagues who manage People systems, digital tools or integrations.",
  reward_specialist:
    "Reward, payroll, benefits or another specialist People team.",
  manager_business: "A line manager or business leader involved in this work.",
  finance:
    "The Finance team, including accounting or financial administration.",
  it: "The Information Technology team.",
  legal: "Internal legal colleagues or external legal advisers.",
  procurement: "Colleagues who support purchasing and supplier arrangements.",
  external_provider: "An external company or individual providing a service.",
  local_office: "Reception, facilities or local workplace colleagues.",
  other:
    "Choose this when the available choices do not describe your answer. Add a short explanation if useful.",
  local_employment:
    "Knowledge of employment requirements or practices in a particular country.",
  payroll: "Knowledge of payroll inputs, checks, rules or processes.",
  benefits: "Knowledge of employee benefits and how they are administered.",
  employee_relations:
    "Knowledge of how to handle employee relations matters and related processes.",
  people_systems: "Knowledge of People platforms, configuration or system use.",
  data_reporting: "Knowledge of employee information, reporting or analysis.",
  office_facilities:
    "Knowledge of reception, workplace services or facilities.",
  country_business:
    "Knowledge of a particular country, brand, business or legal entity.",
  specialist_process:
    "Knowledge of a specific process that colleagues rely on you to explain or complete.",
  ticket:
    "Work first reaches you through a People support ticket or Jira request.",
  email: "Work first reaches you through an email request.",
  chat: "Work first reaches you through a chat message, such as Slack or Teams.",
  employees:
    "An employee contacts you directly, outside the other routes you have selected.",
  managers:
    "A manager contacts or assigns work to you directly, outside the other routes you have selected.",
  in_person_phone:
    "Work reaches you through an in-person conversation or telephone call.",
  system_task: "A system creates or assigns a task to you.",
  planned: "A regular process or schedule tells you what needs to be done.",
  project: "A project plan or project team brings work to you.",
  hibob: "HiBob, if you use it for employee information or People processes.",
  jira_jsm:
    "Jira or Jira Service Management, including requests and support tickets.",
  confluence: "Confluence pages or shared documentation.",
  teamtailor: "Teamtailor recruitment tools.",
  excel: "Excel spreadsheets, including manual records or checks.",
  power_bi: "Power BI reports, dashboards or analysis.",
  culture_amp: "Culture Amp tools and information.",
  navan: "Navan travel or expense tools.",
  payroll_system:
    "Any payroll system you use regularly. Add its name if useful.",
  slack: "Slack messages, channels or workflows used in your work.",
  claude: "Claude, if you use it to help with your work.",
  blueai: "BlueAI, if you use it to help with your work.",
  none: "You do not use a system or tool regularly for this work.",
};
