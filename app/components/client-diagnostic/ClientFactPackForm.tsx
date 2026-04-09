"use client";

import { useState } from "react";

type ClientFactPackFormProps = {
  projectId: string;
  participantId: string;
  inviteToken: string;
  recipientName?: string;
};

type SystemRecord = {
  id: string;
  category:
    | "hris"
    | "lms"
    | "ats"
    | "case_management"
    | "service_platform"
    | "knowledge_base"
    | "identity"
    | "payroll"
    | "reporting"
    | "crm"
    | "finance_erp"
    | "other";
  systemName: string;
  vendor: string;
  functionalScope:
    | "limited"
    | "core_only"
    | "broad_operational"
    | "end_to_end"
    | "unknown";
  owner: "hr" | "it" | "shared" | "unknown";
  systemOfRecordStatus:
    | "primary_system_of_record"
    | "partial_system_of_record"
    | "supporting_only"
    | "unknown";
  integrationMethod:
    | "not_integrated"
    | "manual_transfer"
    | "basic_integration"
    | "workflow_or_api_integrated"
    | "unknown";
  workOutsideSystem: string;
  whyOutsideSystem: string;
  workaroundDrivers: Array<
    | "system_limitation"
    | "process_not_designed"
    | "local_preference"
    | "speed_or_convenience"
    | "lack_of_integration"
    | "control_requirement"
    | "legacy_habit"
    | "ownership_gap"
    | "other"
  >;
  workaroundConsequences: Array<
    | "duplicate_effort"
    | "weak_audit_trail"
    | "slower_turnaround"
    | "inconsistent_experience"
    | "data_quality_risk"
    | "ownership_confusion"
    | "reporting_issues"
    | "dependency_on_key_individuals"
  >;
  keyDependencies: string;
  keyLimitations: string;
};

type ChangeInitiative = {
  id: string;
  name: string;
  status: "approved" | "proposed" | "exploratory";
  scope: string;
  sponsor: string;
  timeline: string;
};

type FactPackFormState = {
  operatingContext: {
    workforceStructure:
      | "single_country_single_entity"
      | "multi_country_limited_entity_variation"
      | "multi_country_multiple_entities"
      | "complex_global_multi_regime";
    operatingModelShape:
      | "largely_local"
      | "partially_standardised"
      | "globally_standardised_with_local_variation"
      | "fully_centralised";
    geographicFootprint: string;
    regulatoryExposure: string;
    recentBusinessContext: string;
    mnaActivity:
      | "none_planned"
      | "passively_considering"
      | "actively_pursuing"
      | "likely_or_imminent"
      | "recent_or_active";
    mnaIntegrationComplexity:
      | "not_applicable"
      | "low"
      | "moderate"
      | "high"
      | "very_high";
    mnaComplexityAreas: Array<
      | "process_standardisation"
      | "data_unification"
      | "system_consolidation"
      | "policy_harmonisation"
      | "controls_and_approvals"
      | "local_entity_variation"
      | "other"
    >;
    mnaAdditionalContext: string;
  };
  systems: {
    records: SystemRecord[];
    primarySystemsFrictionPoints: string;
  };
  serviceDeliveryAndControl: {
    approvalControlClarity:
      | "unclear_or_localised"
      | "partially_defined"
      | "defined_but_inconsistently_followed"
      | "clearly_defined_and_controlled";
    processStandardisation:
      | "largely_local"
      | "partially_standardised"
      | "standardised_with_controlled_variation"
      | "highly_standardised";
    governanceNotes: string;
  };
  dataAndIntegration: {
    employeeDataSourceOfTruth:
      | "no_single_source"
      | "partial_with_duplication"
      | "mostly_centralised_with_some_duplication"
      | "fully_centralised_and_controlled";
    integrationQuality:
      | "not_integrated"
      | "manual_transfer"
      | "basic_integrations"
      | "automated_integrated_flows";
    reportingModel:
      | "manual_extracts_and_spreadsheets"
      | "mixed_manual_and_system_reporting"
      | "mostly_system_reporting"
      | "integrated_reporting_and_dashboards";
    recurringDataIssues: string;
    securityAuditRegulatoryConstraints: string;
  };
  changeAndFutureState: {
    transformationStatus:
      | "no_material_change_planned"
      | "minor_improvements_underway"
      | "significant_change_in_planning"
      | "major_transformation_in_progress";
    approvedFutureState: string;
    proposedFutureState: string;
    initiatives: ChangeInitiative[];
  };
  aiAndAutomation: {
    aiAdoption:
      | "none"
      | "early_exploration"
      | "pilots_underway"
      | "active_operational_usage";
    currentAiUsage: string;
    activeAiInitiatives: string;
    aiGovernanceMaturity: "defined" | "emerging" | "none";
    aiRiskConcerns: string;
  };
  advisoryContext: {
    biggestOperationalConstraint: string;
    highestValueImprovement: string;
    toleratedRisks: string;
    additionalInterpretationContext: string;
  };
};

type SubmitApiResponse =
  | {
      success: true;
      mode: "draft" | "submit";
      status: "in_progress" | "completed";
      message: string;
    }
  | {
      success: false;
      error: string;
      details?: string;
    };

function createSystemRecord(): SystemRecord {
  return {
    id: crypto.randomUUID(),
    category: "hris",
    systemName: "",
    vendor: "",
    functionalScope: "unknown",
    owner: "unknown",
    systemOfRecordStatus: "unknown",
    integrationMethod: "unknown",
    workOutsideSystem: "",
    whyOutsideSystem: "",
    workaroundDrivers: [],
    workaroundConsequences: [],
    keyDependencies: "",
    keyLimitations: "",
  };
}

function createChangeInitiative(): ChangeInitiative {
  return {
    id: crypto.randomUUID(),
    name: "",
    status: "proposed",
    scope: "",
    sponsor: "",
    timeline: "",
  };
}

const INITIAL_STATE: FactPackFormState = {
  operatingContext: {
    workforceStructure: "multi_country_limited_entity_variation",
    operatingModelShape: "partially_standardised",
    geographicFootprint: "",
    regulatoryExposure: "",
    recentBusinessContext: "",
    mnaActivity: "none_planned",
    mnaIntegrationComplexity: "not_applicable",
    mnaComplexityAreas: [],
    mnaAdditionalContext: "",
  },
  systems: {
    records: [createSystemRecord()],
    primarySystemsFrictionPoints: "",
  },
  serviceDeliveryAndControl: {
    approvalControlClarity: "partially_defined",
    processStandardisation: "partially_standardised",
    governanceNotes: "",
  },
  dataAndIntegration: {
    employeeDataSourceOfTruth: "partial_with_duplication",
    integrationQuality: "basic_integrations",
    reportingModel: "mixed_manual_and_system_reporting",
    recurringDataIssues: "",
    securityAuditRegulatoryConstraints: "",
  },
  changeAndFutureState: {
    transformationStatus: "minor_improvements_underway",
    approvedFutureState: "",
    proposedFutureState: "",
    initiatives: [createChangeInitiative()],
  },
  aiAndAutomation: {
    aiAdoption: "early_exploration",
    currentAiUsage: "",
    activeAiInitiatives: "",
    aiGovernanceMaturity: "emerging",
    aiRiskConcerns: "",
  },
  advisoryContext: {
    biggestOperationalConstraint: "",
    highestValueImprovement: "",
    toleratedRisks: "",
    additionalInterpretationContext: "",
  },
};

const CONTROL_CLASS =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900";

export default function ClientFactPackForm({
  projectId,
  participantId,
  inviteToken,
  recipientName,
}: ClientFactPackFormProps) {
  const [formState, setFormState] = useState<FactPackFormState>(INITIAL_STATE);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitState, setSubmitState] = useState<
    "idle" | "saving_draft" | "submitting" | "success" | "error"
  >("idle");

  const hasMnaActivity = formState.operatingContext.mnaActivity !== "none_planned";

  function updateSectionField<
    TSection extends keyof FactPackFormState,
    TField extends keyof FactPackFormState[TSection],
  >(section: TSection, field: TField, value: FactPackFormState[TSection][TField]) {
    setFormState((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  }

  function updateSystemRecord(
    id: string,
    field: keyof SystemRecord,
    value: string | string[],
  ) {
    setFormState((current) => ({
      ...current,
      systems: {
        ...current.systems,
        records: current.systems.records.map((record) =>
          record.id === id ? { ...record, [field]: value } : record,
        ),
      },
    }));
  }

  function toggleSystemMultiSelect<
    TField extends "workaroundDrivers" | "workaroundConsequences",
  >(id: string, field: TField, value: SystemRecord[TField][number]) {
    setFormState((current) => ({
      ...current,
      systems: {
        ...current.systems,
        records: current.systems.records.map((record) => {
          if (record.id !== id) {
            return record;
          }

          const currentValues = record[field] as string[];
          const exists = currentValues.includes(value);

          return {
            ...record,
            [field]: exists
              ? currentValues.filter((item) => item !== value)
              : [...currentValues, value],
          };
        }),
      },
    }));
  }

  function toggleMnaComplexityArea(
    value: FactPackFormState["operatingContext"]["mnaComplexityAreas"][number],
  ) {
    setFormState((current) => {
      const exists = current.operatingContext.mnaComplexityAreas.includes(value);

      return {
        ...current,
        operatingContext: {
          ...current.operatingContext,
          mnaComplexityAreas: exists
            ? current.operatingContext.mnaComplexityAreas.filter(
                (item) => item !== value,
              )
            : [...current.operatingContext.mnaComplexityAreas, value],
        },
      };
    });
  }

  function addSystemRecord() {
    setFormState((current) => ({
      ...current,
      systems: {
        ...current.systems,
        records: [...current.systems.records, createSystemRecord()],
      },
    }));
  }

  function removeSystemRecord(id: string) {
    setFormState((current) => ({
      ...current,
      systems: {
        ...current.systems,
        records:
          current.systems.records.length === 1
            ? current.systems.records
            : current.systems.records.filter((record) => record.id !== id),
      },
    }));
  }

  function updateChangeInitiative(
    id: string,
    field: keyof ChangeInitiative,
    value: string,
  ) {
    setFormState((current) => ({
      ...current,
      changeAndFutureState: {
        ...current.changeAndFutureState,
        initiatives: current.changeAndFutureState.initiatives.map((initiative) =>
          initiative.id === id ? { ...initiative, [field]: value } : initiative,
        ),
      },
    }));
  }

  function addChangeInitiative() {
    setFormState((current) => ({
      ...current,
      changeAndFutureState: {
        ...current.changeAndFutureState,
        initiatives: [
          ...current.changeAndFutureState.initiatives,
          createChangeInitiative(),
        ],
      },
    }));
  }

  function removeChangeInitiative(id: string) {
    setFormState((current) => ({
      ...current,
      changeAndFutureState: {
        ...current.changeAndFutureState,
        initiatives:
          current.changeAndFutureState.initiatives.length === 1
            ? current.changeAndFutureState.initiatives
            : current.changeAndFutureState.initiatives.filter(
                (initiative) => initiative.id !== id,
              ),
      },
    }));
  }

  async function saveFactPack(mode: "draft" | "submit") {
    setSubmitState(mode === "draft" ? "saving_draft" : "submitting");
    setSubmitMessage("");

    try {
      const response = await fetch("/api/client-fact-pack-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          participantId,
          inviteToken,
          responseJson: formState,
          mode,
        }),
      });

      const result = (await response.json()) as SubmitApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          "error" in result ? result.error : "Unable to save fact pack.",
        );
      }

      setSubmitState("success");
      setSubmitMessage(result.message);
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(
        error instanceof Error ? error.message : "Unable to save fact pack.",
      );
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveFactPack("submit");
  }

  return (
    <section className="brand-light-section">
      <div className="brand-container py-10 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <form onSubmit={handleSubmit} className="space-y-10">
            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Fact pack overview</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Operating context, systems reality, and future-state direction
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                {recipientName
                  ? `Please complete this based on your current understanding of the live environment, ${recipientName}.`
                  : "Please complete this based on the organisation’s live environment."}
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700">
                This fact pack is used to strengthen interpretation of the wider
                diagnostic. It captures how HR operations are currently enabled,
                constrained, governed, and expected to evolve. It is not used in
                scored statistical analysis.
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Operating context</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Workforce structure, operating model, and business context
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <SelectField
                  label="Which best reflects the current workforce and entity footprint?"
                  helpText="Choose the option that best reflects the current operating footprint."
                  value={formState.operatingContext.workforceStructure}
                  onChange={(value) =>
                    updateSectionField(
                      "operatingContext",
                      "workforceStructure",
                      value as FactPackFormState["operatingContext"]["workforceStructure"],
                    )
                  }
                  options={[
                    [
                      "single_country_single_entity",
                      "Single country, single legal entity",
                    ],
                    [
                      "multi_country_limited_entity_variation",
                      "Multi-country, limited entity variation",
                    ],
                    [
                      "multi_country_multiple_entities",
                      "Multi-country, multiple entities",
                    ],
                    [
                      "complex_global_multi_regime",
                      "Complex global structure across multiple regulatory regimes",
                    ],
                  ]}
                />

                <SelectField
                  label="How would you describe the current HR operating model?"
                  helpText="Choose the option that best reflects how work is currently organised."
                  value={formState.operatingContext.operatingModelShape}
                  onChange={(value) =>
                    updateSectionField(
                      "operatingContext",
                      "operatingModelShape",
                      value as FactPackFormState["operatingContext"]["operatingModelShape"],
                    )
                  }
                  options={[
                    ["largely_local", "Largely local or decentralised"],
                    [
                      "partially_standardised",
                      "Partially standardised with variation by region or business unit",
                    ],
                    [
                      "globally_standardised_with_local_variation",
                      "Globally standardised with controlled local variation",
                    ],
                    ["fully_centralised", "Fully centralised or shared service led"],
                  ]}
                />

                <TextAreaField
                  label="Primary regions or countries in scope"
                  helpText="List the main geographies that shape how HR operations are delivered."
                  placeholder="Example: UK, Ireland, Germany, US, APAC"
                  value={formState.operatingContext.geographicFootprint}
                  onChange={(value) =>
                    updateSectionField(
                      "operatingContext",
                      "geographicFootprint",
                      value,
                    )
                  }
                  size="md"
                />

                <TextAreaField
                  label="Regulatory, compliance, or control exposure"
                  helpText="Include anything material that shapes the operating environment."
                  placeholder="Example: GDPR, SOX, FCA / PRA, works councils"
                  value={formState.operatingContext.regulatoryExposure}
                  onChange={(value) =>
                    updateSectionField(
                      "operatingContext",
                      "regulatoryExposure",
                      value,
                    )
                  }
                  size="md"
                />

                <div className="md:col-span-2">
                  <TextAreaField
                    label="Recent business or organisational context"
                    placeholder="Acquisitions, restructuring, scale-up, centralisation, transformation, entity changes"
                    value={formState.operatingContext.recentBusinessContext}
                    onChange={(value) =>
                      updateSectionField(
                        "operatingContext",
                        "recentBusinessContext",
                        value,
                      )
                    }
                    size="lg"
                  />
                </div>

                <SelectField
                  label="Has M&A activity shaped, or is it likely to shape, the HR operating environment?"
                  helpText="Answer based on current, likely, or actively pursued activity."
                  value={formState.operatingContext.mnaActivity}
                  onChange={(value) =>
                    updateSectionField(
                      "operatingContext",
                      "mnaActivity",
                      value as FactPackFormState["operatingContext"]["mnaActivity"],
                    )
                  }
                  options={[
                    ["none_planned", "No planned M&A activity"],
                    ["passively_considering", "Passively considering M&A opportunities"],
                    ["actively_pursuing", "Actively pursuing M&A opportunities"],
                    ["likely_or_imminent", "M&A likely or imminent"],
                    ["recent_or_active", "Recent M&A already affecting operations"],
                  ]}
                />
              </div>

              {hasMnaActivity ? (
                <div className="mt-8 rounded-2xl border border-[var(--brand-border)] bg-white p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand-text-muted)]">
                    M&A follow-up
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Use this section to capture anticipated or current integration
                    complexity.
                  </p>

                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <SelectField
                      label="How complex is integration likely to be, or has it proved to be, across HR processes?"
                      value={formState.operatingContext.mnaIntegrationComplexity}
                      onChange={(value) =>
                        updateSectionField(
                          "operatingContext",
                          "mnaIntegrationComplexity",
                          value as FactPackFormState["operatingContext"]["mnaIntegrationComplexity"],
                        )
                      }
                      options={[
                        ["low", "Low"],
                        ["moderate", "Moderate"],
                        ["high", "High"],
                        ["very_high", "Very high"],
                      ]}
                    />

                    <CheckboxGroup
                      label="Which areas are most likely to create integration complexity?"
                      options={[
                        ["process_standardisation", "Process standardisation"],
                        ["data_unification", "Data unification"],
                        ["system_consolidation", "System consolidation"],
                        ["policy_harmonisation", "Policy harmonisation"],
                        ["controls_and_approvals", "Controls and approvals"],
                        ["local_entity_variation", "Local entity variation"],
                        ["other", "Other"],
                      ]}
                      values={formState.operatingContext.mnaComplexityAreas}
                      onToggle={(value) =>
                        toggleMnaComplexityArea(
                          value as FactPackFormState["operatingContext"]["mnaComplexityAreas"][number],
                        )
                      }
                    />

                    <div className="md:col-span-2">
                      <TextAreaField
                        label="Additional M&A context"
                        placeholder="Anything important about anticipated or current integration complexity"
                        value={formState.operatingContext.mnaAdditionalContext}
                        onChange={(value) =>
                          updateSectionField(
                            "operatingContext",
                            "mnaAdditionalContext",
                            value,
                          )
                        }
                        size="md"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="brand-section-kicker">Systems and architecture</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    Current system landscape and operational realities
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={addSystemRecord}
                  className="brand-button-dark"
                >
                  Add system
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700">
                Capture the live architecture, not just product names. Focus on
                what each system is doing, what sits outside it, and why.
              </div>

              <div className="mt-8 space-y-6">
                {formState.systems.records.map((record, index) => (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-[var(--brand-border)] bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-semibold text-slate-900">
                        System {index + 1}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeSystemRecord(record.id)}
                        className="text-sm font-medium text-slate-500 hover:text-slate-900"
                        disabled={formState.systems.records.length === 1}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-5 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                      <SelectField
                        label="System category"
                        value={record.category}
                        onChange={(value) =>
                          updateSystemRecord(record.id, "category", value)
                        }
                        options={[
                          ["hris", "HRIS"],
                          ["lms", "LMS"],
                          ["ats", "ATS"],
                          ["case_management", "Case management"],
                          ["service_platform", "Service platform"],
                          ["knowledge_base", "Knowledge base"],
                          ["identity", "Identity and access"],
                          ["payroll", "Payroll"],
                          ["reporting", "Reporting and BI"],
                          ["crm", "CRM"],
                          ["finance_erp", "Finance or ERP"],
                          ["other", "Other"],
                        ]}
                      />

                      <TextInputField
                        label="System or platform name"
                        placeholder="Example: Workday, ServiceNow, Cornerstone"
                        value={record.systemName}
                        onChange={(value) =>
                          updateSystemRecord(record.id, "systemName", value)
                        }
                      />

                      <TextInputField
                        label="Vendor or product"
                        placeholder="Example: Workday HCM, ServiceNow HRSD"
                        value={record.vendor}
                        onChange={(value) =>
                          updateSystemRecord(record.id, "vendor", value)
                        }
                      />

                      <SelectField
                        label="Functional scope"
                        value={record.functionalScope}
                        onChange={(value) =>
                          updateSystemRecord(record.id, "functionalScope", value)
                        }
                        options={[
                          ["limited", "Limited point solution"],
                          ["core_only", "Core record or narrow process scope"],
                          ["broad_operational", "Broad operational support"],
                          ["end_to_end", "End-to-end process coverage"],
                          ["unknown", "Unknown"],
                        ]}
                      />

                      <SelectField
                        label="Primary owner"
                        value={record.owner}
                        onChange={(value) =>
                          updateSystemRecord(record.id, "owner", value)
                        }
                        options={[
                          ["hr", "HR"],
                          ["it", "IT"],
                          ["shared", "Shared"],
                          ["unknown", "Unknown"],
                        ]}
                      />

                      <SelectField
                        label="System-of-record status"
                        value={record.systemOfRecordStatus}
                        onChange={(value) =>
                          updateSystemRecord(
                            record.id,
                            "systemOfRecordStatus",
                            value,
                          )
                        }
                        options={[
                          [
                            "primary_system_of_record",
                            "Primary system of record",
                          ],
                          [
                            "partial_system_of_record",
                            "Authoritative for part of the data or process",
                          ],
                          ["supporting_only", "Supporting system only"],
                          ["unknown", "Unknown"],
                        ]}
                      />

                      <SelectField
                        label="Integration method"
                        helpText="Choose the option that best reflects how this system exchanges data or workflow with the rest of the environment."
                        value={record.integrationMethod}
                        onChange={(value) =>
                          updateSystemRecord(record.id, "integrationMethod", value)
                        }
                        options={[
                          ["not_integrated", "Not integrated"],
                          ["manual_transfer", "Manual transfer or rekeying"],
                          ["basic_integration", "Basic integrations"],
                          [
                            "workflow_or_api_integrated",
                            "Workflow or API integrated",
                          ],
                          ["unknown", "Unknown"],
                        ]}
                      />

                      <div className="xl:col-span-3 grid gap-6 md:grid-cols-2">
                        <TextAreaField
                          label="What parts of the process still happen outside this system?"
                          placeholder="Examples: approvals, case tracking, onboarding tasks, data correction, reporting, provisioning, exception handling"
                          value={record.workOutsideSystem}
                          onChange={(value) =>
                            updateSystemRecord(record.id, "workOutsideSystem", value)
                          }
                          size="md"
                        />

                        <TextAreaField
                          label="Why does that work sit outside the system?"
                          placeholder="Describe why the workaround or off-system process exists"
                          value={record.whyOutsideSystem}
                          onChange={(value) =>
                            updateSystemRecord(record.id, "whyOutsideSystem", value)
                          }
                          size="md"
                        />
                      </div>

                      <div className="xl:col-span-3 grid gap-6 md:grid-cols-2">
                        <CheckboxGroup
                          label="What most drives the workaround pattern?"
                          options={[
                            ["system_limitation", "System limitation"],
                            ["process_not_designed", "Process not yet designed"],
                            ["local_preference", "Local preference"],
                            ["speed_or_convenience", "Speed or convenience"],
                            ["lack_of_integration", "Lack of integration"],
                            ["control_requirement", "Control requirement"],
                            ["legacy_habit", "Legacy habit"],
                            ["ownership_gap", "Ownership gap"],
                            ["other", "Other"],
                          ]}
                          values={record.workaroundDrivers}
                          onToggle={(value) =>
                            toggleSystemMultiSelect(
                              record.id,
                              "workaroundDrivers",
                              value as SystemRecord["workaroundDrivers"][number],
                            )
                          }
                        />

                        <CheckboxGroup
                          label="What does that workaround most often create?"
                          options={[
                            ["duplicate_effort", "Duplicate effort"],
                            ["weak_audit_trail", "Weak audit trail"],
                            ["slower_turnaround", "Slower turnaround"],
                            ["inconsistent_experience", "Inconsistent experience"],
                            ["data_quality_risk", "Data quality risk"],
                            ["ownership_confusion", "Ownership confusion"],
                            ["reporting_issues", "Reporting issues"],
                            [
                              "dependency_on_key_individuals",
                              "Dependency on key individuals",
                            ],
                          ]}
                          values={record.workaroundConsequences}
                          onToggle={(value) =>
                            toggleSystemMultiSelect(
                              record.id,
                              "workaroundConsequences",
                              value as SystemRecord["workaroundConsequences"][number],
                            )
                          }
                        />
                      </div>

                      <div className="xl:col-span-3 grid gap-6 md:grid-cols-2">
                        <TextAreaField
                          label="Key dependencies"
                          placeholder="Which other systems, teams, or controls this system depends on"
                          value={record.keyDependencies}
                          onChange={(value) =>
                            updateSystemRecord(record.id, "keyDependencies", value)
                          }
                          size="sm"
                        />

                        <TextAreaField
                          label="Key limitations"
                          placeholder="Usability issues, workflow gaps, reporting weaknesses, poor fit to the real process, control gaps"
                          value={record.keyLimitations}
                          onChange={(value) =>
                            updateSystemRecord(record.id, "keyLimitations", value)
                          }
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <TextAreaField
                  label="Where does the current systems environment create the most operational friction?"
                  helpText="Focus on workflow breaks, data flow issues, control bottlenecks, or repeated off-system activity."
                  placeholder="Examples: onboarding handoffs, approvals, provisioning, policy access, data transfer, reporting"
                  value={formState.systems.primarySystemsFrictionPoints}
                  onChange={(value) =>
                    updateSectionField(
                      "systems",
                      "primarySystemsFrictionPoints",
                      value,
                    )
                  }
                  size="lg"
                />
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">
                Service delivery and control model
              </p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Governance, approvals, and process design
              </h2>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700">
                This section is about formal design and control structure, not
                how users feel about the service.
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <SelectField
                  label="How clearly are approvals and control points defined?"
                  value={formState.serviceDeliveryAndControl.approvalControlClarity}
                  onChange={(value) =>
                    updateSectionField(
                      "serviceDeliveryAndControl",
                      "approvalControlClarity",
                      value as FactPackFormState["serviceDeliveryAndControl"]["approvalControlClarity"],
                    )
                  }
                  options={[
                    ["unclear_or_localised", "Unclear or locally interpreted"],
                    ["partially_defined", "Partially defined"],
                    [
                      "defined_but_inconsistently_followed",
                      "Defined but inconsistently followed",
                    ],
                    [
                      "clearly_defined_and_controlled",
                      "Clearly defined and controlled",
                    ],
                  ]}
                />

                <SelectField
                  label="How standardised are core HR operational processes?"
                  value={formState.serviceDeliveryAndControl.processStandardisation}
                  onChange={(value) =>
                    updateSectionField(
                      "serviceDeliveryAndControl",
                      "processStandardisation",
                      value as FactPackFormState["serviceDeliveryAndControl"]["processStandardisation"],
                    )
                  }
                  options={[
                    ["largely_local", "Largely local and variable"],
                    ["partially_standardised", "Partially standardised"],
                    [
                      "standardised_with_controlled_variation",
                      "Standardised with controlled variation",
                    ],
                    ["highly_standardised", "Highly standardised"],
                  ]}
                />

                <div className="md:col-span-2">
                  <TextAreaField
                    label="Additional notes on governance, approvals, or exceptions"
                    placeholder="Anything important about approval design, exception handling, formal ownership, or control boundaries"
                    value={formState.serviceDeliveryAndControl.governanceNotes}
                    onChange={(value) =>
                      updateSectionField(
                        "serviceDeliveryAndControl",
                        "governanceNotes",
                        value,
                      )
                    }
                    size="md"
                  />
                </div>
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Data, integration, and risk</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Source-of-truth, data flow, and control environment
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <SelectField
                  label="Is there a single source of truth for employee data?"
                  value={formState.dataAndIntegration.employeeDataSourceOfTruth}
                  onChange={(value) =>
                    updateSectionField(
                      "dataAndIntegration",
                      "employeeDataSourceOfTruth",
                      value as FactPackFormState["dataAndIntegration"]["employeeDataSourceOfTruth"],
                    )
                  }
                  options={[
                    ["no_single_source", "No, multiple conflicting sources"],
                    [
                      "partial_with_duplication",
                      "Partial, with duplication across systems",
                    ],
                    [
                      "mostly_centralised_with_some_duplication",
                      "Mostly centralised with some duplication",
                    ],
                    [
                      "fully_centralised_and_controlled",
                      "Fully centralised and controlled",
                    ],
                  ]}
                />

                <SelectField
                  label="How are systems connected in practice?"
                  value={formState.dataAndIntegration.integrationQuality}
                  onChange={(value) =>
                    updateSectionField(
                      "dataAndIntegration",
                      "integrationQuality",
                      value as FactPackFormState["dataAndIntegration"]["integrationQuality"],
                    )
                  }
                  options={[
                    ["not_integrated", "Not integrated"],
                    ["manual_transfer", "Manual data transfer"],
                    ["basic_integrations", "Basic integrations"],
                    [
                      "automated_integrated_flows",
                      "Automated integrated data flows",
                    ],
                  ]}
                />

                <SelectField
                  label="How is reporting typically produced?"
                  value={formState.dataAndIntegration.reportingModel}
                  onChange={(value) =>
                    updateSectionField(
                      "dataAndIntegration",
                      "reportingModel",
                      value as FactPackFormState["dataAndIntegration"]["reportingModel"],
                    )
                  }
                  options={[
                    [
                      "manual_extracts_and_spreadsheets",
                      "Manual extracts and spreadsheets",
                    ],
                    [
                      "mixed_manual_and_system_reporting",
                      "Mixed manual and system reporting",
                    ],
                    [
                      "mostly_system_reporting",
                      "Mostly system-generated reporting",
                    ],
                    [
                      "integrated_reporting_and_dashboards",
                      "Integrated dashboards and reporting",
                    ],
                  ]}
                />

                <TextAreaField
                  label="Recurring data, reconciliation, or control issues"
                  placeholder="Examples: duplicate records, unclear data ownership, recurring manual correction, poor auditability"
                  value={formState.dataAndIntegration.recurringDataIssues}
                  onChange={(value) =>
                    updateSectionField(
                      "dataAndIntegration",
                      "recurringDataIssues",
                      value,
                    )
                  }
                  size="md"
                />

                <div className="md:col-span-2">
                  <TextAreaField
                    label="Security, audit, privacy, or regulatory constraints that materially affect HR operations"
                    placeholder="Examples: access restrictions, segregation of duties, retention rules, privacy constraints, regulated approvals"
                    value={formState.dataAndIntegration.securityAuditRegulatoryConstraints}
                    onChange={(value) =>
                      updateSectionField(
                        "dataAndIntegration",
                        "securityAuditRegulatoryConstraints",
                        value,
                      )
                    }
                    size="lg"
                  />
                </div>
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="brand-section-kicker">Change and future state</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    Approved direction, proposed change, and active initiatives
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={addChangeInitiative}
                  className="brand-button-dark"
                >
                  Add initiative
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700">
                Separate what is approved from what is being discussed.
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <SelectField
                  label="How much active change is already affecting HR operations?"
                  value={formState.changeAndFutureState.transformationStatus}
                  onChange={(value) =>
                    updateSectionField(
                      "changeAndFutureState",
                      "transformationStatus",
                      value as FactPackFormState["changeAndFutureState"]["transformationStatus"],
                    )
                  }
                  options={[
                    [
                      "no_material_change_planned",
                      "No material change planned",
                    ],
                    [
                      "minor_improvements_underway",
                      "Minor improvements underway",
                    ],
                    [
                      "significant_change_in_planning",
                      "Significant transformation in planning",
                    ],
                    [
                      "major_transformation_in_progress",
                      "Major transformation actively in progress",
                    ],
                  ]}
                />

                <TextAreaField
                  label="Approved future state"
                  helpText="Capture what is already approved, funded, or committed."
                  placeholder="What has already been approved and is expected to happen"
                  value={formState.changeAndFutureState.approvedFutureState}
                  onChange={(value) =>
                    updateSectionField(
                      "changeAndFutureState",
                      "approvedFutureState",
                      value,
                    )
                  }
                  size="md"
                />

                <TextAreaField
                  label="Proposed or exploratory future state"
                  helpText="Capture what is being shaped or discussed, but is not yet committed."
                  placeholder="What is being proposed, explored, or designed"
                  value={formState.changeAndFutureState.proposedFutureState}
                  onChange={(value) =>
                    updateSectionField(
                      "changeAndFutureState",
                      "proposedFutureState",
                      value,
                    )
                  }
                  size="md"
                />
              </div>

              <div className="mt-8 space-y-6">
                {formState.changeAndFutureState.initiatives.map(
                  (initiative, index) => (
                    <div
                      key={initiative.id}
                      className="rounded-2xl border border-[var(--brand-border)] bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-semibold text-slate-900">
                          Initiative {index + 1}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeChangeInitiative(initiative.id)}
                          className="text-sm font-medium text-slate-500 hover:text-slate-900"
                          disabled={
                            formState.changeAndFutureState.initiatives.length ===
                            1
                          }
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-5 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                        <TextInputField
                          label="Initiative name"
                          placeholder="Example: ServiceNow HR workflow redesign"
                          value={initiative.name}
                          onChange={(value) =>
                            updateChangeInitiative(initiative.id, "name", value)
                          }
                        />

                        <SelectField
                          label="Status"
                          value={initiative.status}
                          onChange={(value) =>
                            updateChangeInitiative(initiative.id, "status", value)
                          }
                          options={[
                            ["approved", "Approved"],
                            ["proposed", "Proposed"],
                            ["exploratory", "Exploratory"],
                          ]}
                        />

                        <TextInputField
                          label="Sponsor"
                          placeholder="Example: CHRO, CIO, COO"
                          value={initiative.sponsor}
                          onChange={(value) =>
                            updateChangeInitiative(
                              initiative.id,
                              "sponsor",
                              value,
                            )
                          }
                        />

                        <TextInputField
                          label="Timeline"
                          placeholder="Example: Q3 2026, under review, not defined"
                          value={initiative.timeline}
                          onChange={(value) =>
                            updateChangeInitiative(
                              initiative.id,
                              "timeline",
                              value,
                            )
                          }
                        />

                        <div className="lg:col-span-2 xl:col-span-3">
                          <TextAreaField
                            label="Scope or description"
                            placeholder="What the initiative is intended to change"
                            value={initiative.scope}
                            onChange={(value) =>
                              updateChangeInitiative(initiative.id, "scope", value)
                            }
                            size="md"
                          />
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">AI and automation</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Current usage, active initiatives, and governance
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <SelectField
                  label="How would you describe current AI or automation adoption in HR operations?"
                  value={formState.aiAndAutomation.aiAdoption}
                  onChange={(value) =>
                    updateSectionField(
                      "aiAndAutomation",
                      "aiAdoption",
                      value as FactPackFormState["aiAndAutomation"]["aiAdoption"],
                    )
                  }
                  options={[
                    ["none", "No meaningful current use"],
                    ["early_exploration", "Early exploration"],
                    ["pilots_underway", "Pilots underway"],
                    ["active_operational_usage", "Active operational usage"],
                  ]}
                />

                <TextAreaField
                  label="Current AI or automation usage"
                  placeholder="Where AI, copilots, workflow automation, classification, summarisation, search, or digital assistants are already in use"
                  value={formState.aiAndAutomation.currentAiUsage}
                  onChange={(value) =>
                    updateSectionField("aiAndAutomation", "currentAiUsage", value)
                  }
                  size="md"
                />

                <TextAreaField
                  label="Active AI or automation initiatives"
                  placeholder="Pilots, proposed use cases, enterprise initiatives, or in-flight change that may affect HR operations"
                  value={formState.aiAndAutomation.activeAiInitiatives}
                  onChange={(value) =>
                    updateSectionField(
                      "aiAndAutomation",
                      "activeAiInitiatives",
                      value,
                    )
                  }
                  size="md"
                />

                <SelectField
                  label="AI governance maturity"
                  value={formState.aiAndAutomation.aiGovernanceMaturity}
                  onChange={(value) =>
                    updateSectionField(
                      "aiAndAutomation",
                      "aiGovernanceMaturity",
                      value as FactPackFormState["aiAndAutomation"]["aiGovernanceMaturity"],
                    )
                  }
                  options={[
                    ["defined", "Defined"],
                    ["emerging", "Emerging"],
                    ["none", "None"],
                  ]}
                />

                <div className="md:col-span-2">
                  <TextAreaField
                    label="Main AI or automation risks or concerns"
                    placeholder="Examples: privacy, access control, weak governance, shadow AI, quality or decision risk"
                    value={formState.aiAndAutomation.aiRiskConcerns}
                    onChange={(value) =>
                      updateSectionField(
                        "aiAndAutomation",
                        "aiRiskConcerns",
                        value,
                      )
                    }
                    size="md"
                  />
                </div>
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Advisory context</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                High-value interpretation prompts
              </h2>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700">
                These prompts are intended to capture structural and contextual
                signal, not to replace scored diagnostic evidence.
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <TextAreaField
                  label="What most constrains HR operations today?"
                  placeholder="The biggest operational, structural, or cross-functional blocker"
                  value={formState.advisoryContext.biggestOperationalConstraint}
                  onChange={(value) =>
                    updateSectionField(
                      "advisoryContext",
                      "biggestOperationalConstraint",
                      value,
                    )
                  }
                  size="md"
                />

                <TextAreaField
                  label="What would create the highest-value improvement in the next 6 to 12 months?"
                  placeholder="The improvement that would most materially improve delivery, control, or enablement"
                  value={formState.advisoryContext.highestValueImprovement}
                  onChange={(value) =>
                    updateSectionField(
                      "advisoryContext",
                      "highestValueImprovement",
                      value,
                    )
                  }
                  size="md"
                />

                <TextAreaField
                  label="What risks are being tolerated today?"
                  placeholder="Operational, service, control, governance, or data risks that are known but currently tolerated"
                  value={formState.advisoryContext.toleratedRisks}
                  onChange={(value) =>
                    updateSectionField(
                      "advisoryContext",
                      "toleratedRisks",
                      value,
                    )
                  }
                  size="md"
                />

                <TextAreaField
                  label="Any additional context that should shape interpretation of the diagnostic?"
                  placeholder="Anything else that materially changes how the scored diagnostic should be read"
                  value={formState.advisoryContext.additionalInterpretationContext}
                  onChange={(value) =>
                    updateSectionField(
                      "advisoryContext",
                      "additionalInterpretationContext",
                      value,
                    )
                  }
                  size="md"
                />
              </div>
            </section>

            {submitMessage ? (
              <div
                className={`rounded-2xl px-5 py-4 text-sm ${
                  submitState === "error"
                    ? "border border-rose-200 bg-rose-50 text-rose-700"
                    : "border border-blue-200 bg-blue-50 text-blue-700"
                }`}
              >
                {submitMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => void saveFactPack("draft")}
                disabled={
                  submitState === "saving_draft" || submitState === "submitting"
                }
                className="brand-button-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitState === "saving_draft" ? "Saving draft..." : "Save draft"}
              </button>

              <button
                type="submit"
                disabled={
                  submitState === "saving_draft" || submitState === "submitting"
                }
                className="brand-button-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitState === "submitting"
                  ? "Submitting..."
                  : "Submit fact pack"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function FieldShell({
  label,
  helpText,
  children,
}: {
  label: string;
  helpText?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="min-h-[4.5rem]">
        <span className="block text-sm font-medium text-slate-900">{label}</span>
        {helpText ? (
          <p className="mt-2 text-xs leading-6 text-slate-500">{helpText}</p>
        ) : null}
      </div>
      {children}
    </label>
  );
}

function TextInputField({
  label,
  placeholder,
  value,
  onChange,
  helpText,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
}) {
  return (
    <FieldShell label={label} helpText={helpText}>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={CONTROL_CLASS}
      />
    </FieldShell>
  );
}

function TextAreaField({
  label,
  placeholder,
  value,
  onChange,
  helpText,
  size = "md",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
  size?: "sm" | "md" | "lg";
}) {
  const rowsBySize = {
    sm: 4,
    md: 5,
    lg: 7,
  } as const;

  return (
    <FieldShell label={label} helpText={helpText}>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rowsBySize[size]}
        placeholder={placeholder}
        className={CONTROL_CLASS}
      />
    </FieldShell>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  helpText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  helpText?: string;
}) {
  return (
    <FieldShell label={label} helpText={helpText}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={CONTROL_CLASS}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function CheckboxGroup({
  label,
  options,
  values,
  onToggle,
}: {
  label: string;
  options: Array<[string, string]>;
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <FieldShell label={label}>
      <div className="rounded-xl border border-slate-300 bg-white px-4 py-4">
        <div className="grid gap-3">
          {options.map(([optionValue, optionLabel]) => {
            const checked = values.includes(optionValue);

            return (
              <label
                key={optionValue}
                className="flex items-start gap-3 text-sm text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(optionValue)}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <span>{optionLabel}</span>
              </label>
            );
          })}
        </div>
      </div>
    </FieldShell>
  );
}