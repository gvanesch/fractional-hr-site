export default function RosterGuide() {
  return (
    <details className="tb-process">
      <summary>CSV fields needed for launch</summary>
      <p>
        Required for invitation and access: name, email, country, region and
        manages_people. Use yes or no for manages_people. For managers, include
        direct_reports; use 0 for non-managers.
      </p>
      <p>
        Complete these for useful reporting: job_title, job_level (current TB
        grade), entity, team, location, manager_name and manager_email.
      </p>
      <p>
        For regional dashboards, complete regional_leader_name and
        regional_leader_email for each assigned respondent. Access follows the
        leader’s work email, not the region label. Respondents without an
        assignment appear only on the full-campaign dashboard.
      </p>
      <p>
        Use country codes such as GB, DE or IT. For an isolated country outside
        the core list, use its two-letter code, or OTHER if the code is
        unavailable. Use Northern Europe, Western Europe, Southern Europe or
        Central and Eastern Europe consistently; use Group for Group roles.
      </p>
      <p>
        working_fraction is optional HRIS data for capacity analysis: 1 means
        full time, 0.8 means 80%, and 0.5 means half time. Weekly hours are not
        needed if you supply the fraction. Other HRIS columns remain optional
        and can be added using the full template. Salary, date of birth and
        private contact details are not needed.
      </p>
      <a
        href="/advisor/baseline/api/roster-template?full=1"
        download="baseline-roster-full-template.csv"
      >
        Download full optional-field template
      </a>
    </details>
  );
}
