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
    | "other";
  systemName: string;
  vendor: string;
  owner: "hr" | "it" | "shared" | "unknown";
  isSystemOfRecord: "yes" | "no";
  keyLimitations: string;
  manualWorkarounds: string;
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
  operatingEnvironment: {
    headcountRange: "1-250" | "250-1000" | "1000-5000" | "5000+";
    regions: string;
    employmentComplexity: "low" | "moderate" | "high";
    regulatoryExposure: string;
    recentChangeContext: string;
    mnaActivity: "none" | "recent" | "active";
  };
  systems: {
    records: SystemRecord[];
    integrationMaturity: "low" | "partial" | "integrated";
    primaryFrictionPoints: string;
  };
  serviceModel: {
    modelType: "centralised" | "hybrid" | "decentralised";
    caseOwnership: "clear" | "mixed" | "unclear";
    escalationModel: "defined" | "informal" | "unclear";
    processOwnership: "clear" | "partial" | "unclear";
    governanceMaturity: "strong" | "developing" | "weak";
    notes: string;
  };
  dataAndControls: {
    systemOfRecordClarity: "clear" | "partial" | "unclear";
    accessControlMaturity: "strong" | "moderate" | "weak";
    auditTrailConfidence: "high" | "medium" | "low";
    recurringIssues: string;
    regulatoryConstraints: string;
  };
  changeLandscape: {
    initiatives: ChangeInitiative[];
    currentTransformationContext: string;
  };
  aiAndAutomation: {
    currentUsage: string;
    activeInitiatives: string;
    governanceMaturity: "defined" | "emerging" | "none";
    riskConcerns: string;
  };
  constraints: {
    capacityConstraint: "low" | "moderate" | "high";
    changeFatigue: "low" | "moderate" | "high";
    techDependency: "low" | "moderate" | "high";
    keyConstraints: string;
  };
  advisoryContext: {
    biggestConstraint: string;
    highestValueOpportunity: string;
    knownRisks: string;
    additionalContext: string;
  };
};

function createSystemRecord(): SystemRecord {
  return {
    id: crypto.randomUUID(),
    category: "hris",
    systemName: "",
    vendor: "",
    owner: "unknown",
    isSystemOfRecord: "no",
    keyLimitations: "",
    manualWorkarounds: "",
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
  operatingEnvironment: {
    headcountRange: "250-1000",
    regions: "",
    employmentComplexity: "moderate",
    regulatoryExposure: "",
    recentChangeContext: "",
    mnaActivity: "none",
  },
  systems: {
    records: [createSystemRecord()],
    integrationMaturity: "partial",
    primaryFrictionPoints: "",
  },
  serviceModel: {
    modelType: "hybrid",
    caseOwnership: "mixed",
    escalationModel: "informal",
    processOwnership: "partial",
    governanceMaturity: "developing",
    notes: "",
  },
  dataAndControls: {
    systemOfRecordClarity: "partial",
    accessControlMaturity: "moderate",
    auditTrailConfidence: "medium",
    recurringIssues: "",
    regulatoryConstraints: "",
  },
  changeLandscape: {
    initiatives: [createChangeInitiative()],
    currentTransformationContext: "",
  },
  aiAndAutomation: {
    currentUsage: "",
    activeInitiatives: "",
    governanceMaturity: "emerging",
    riskConcerns: "",
  },
  constraints: {
    capacityConstraint: "moderate",
    changeFatigue: "moderate",
    techDependency: "moderate",
    keyConstraints: "",
  },
  advisoryContext: {
    biggestConstraint: "",
    highestValueOpportunity: "",
    knownRisks: "",
    additionalContext: "",
  },
};

export default function ClientFactPackForm({
  recipientName,
}: ClientFactPackFormProps) {
  const [formState, setFormState] = useState<FactPackFormState>(INITIAL_STATE);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "not_ready">("idle");

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
    value: string,
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
      changeLandscape: {
        ...current.changeLandscape,
        initiatives: current.changeLandscape.initiatives.map((initiative) =>
          initiative.id === id ? { ...initiative, [field]: value } : initiative,
        ),
      },
    }));
  }

  function addChangeInitiative() {
    setFormState((current) => ({
      ...current,
      changeLandscape: {
        ...current.changeLandscape,
        initiatives: [
          ...current.changeLandscape.initiatives,
          createChangeInitiative(),
        ],
      },
    }));
  }

  function removeChangeInitiative(id: string) {
    setFormState((current) => ({
      ...current,
      changeLandscape: {
        ...current.changeLandscape,
        initiatives:
          current.changeLandscape.initiatives.length === 1
            ? current.changeLandscape.initiatives
            : current.changeLandscape.initiatives.filter(
                (initiative) => initiative.id !== id,
              ),
      },
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("not_ready");
    setSubmitMessage(
      "The strengthened fact pack structure is now in place. Persistence and advisor rendering are the next batch.",
    );
  }

  return (
    <section className="brand-light-section">
      <div className="brand-container py-10 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <form onSubmit={handleSubmit} className="space-y-10">
            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Fact pack overview</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Current systems, operating model, and delivery context
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                {recipientName
                  ? `Please complete this based on your current understanding of the organisation’s live environment, ${recipientName}.`
                  : "Please complete this based on the organisation’s live environment."}
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700">
                This fact pack is used to strengthen interpretation of the wider
                diagnostic. It captures current-state systems, governance,
                delivery constraints, approved and proposed change, and broader
                operational context. It is not included in scored statistical
                analysis.
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Operating environment</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Organisational complexity and context
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <SelectField
                  label="Headcount range"
                  value={formState.operatingEnvironment.headcountRange}
                  onChange={(value) =>
                    updateSectionField(
                      "operatingEnvironment",
                      "headcountRange",
                      value as FactPackFormState["operatingEnvironment"]["headcountRange"],
                    )
                  }
                  options={[
                    ["1-250", "1 to 250"],
                    ["250-1000", "250 to 1,000"],
                    ["1000-5000", "1,000 to 5,000"],
                    ["5000+", "5,000+"],
                  ]}
                />

                <SelectField
                  label="Employment complexity"
                  value={formState.operatingEnvironment.employmentComplexity}
                  onChange={(value) =>
                    updateSectionField(
                      "operatingEnvironment",
                      "employmentComplexity",
                      value as FactPackFormState["operatingEnvironment"]["employmentComplexity"],
                    )
                  }
                  options={[
                    ["low", "Low"],
                    ["moderate", "Moderate"],
                    ["high", "High"],
                  ]}
                />

                <SelectField
                  label="M&A activity"
                  value={formState.operatingEnvironment.mnaActivity}
                  onChange={(value) =>
                    updateSectionField(
                      "operatingEnvironment",
                      "mnaActivity",
                      value as FactPackFormState["operatingEnvironment"]["mnaActivity"],
                    )
                  }
                  options={[
                    ["none", "None"],
                    ["recent", "Recent"],
                    ["active", "Active"],
                  ]}
                />

                <TextAreaField
                  label="Primary regions or countries in scope"
                  placeholder="Example: UK, Ireland, Germany, US"
                  value={formState.operatingEnvironment.regions}
                  onChange={(value) =>
                    updateSectionField("operatingEnvironment", "regions", value)
                  }
                />

                <TextAreaField
                  label="Regulatory or compliance exposure"
                  placeholder="Example: GDPR, SOX, FCA / PRA, works councils"
                  value={formState.operatingEnvironment.regulatoryExposure}
                  onChange={(value) =>
                    updateSectionField(
                      "operatingEnvironment",
                      "regulatoryExposure",
                      value,
                    )
                  }
                />

                <TextAreaField
                  label="Recent business or organisational context"
                  placeholder="Acquisitions, restructuring, growth, centralisation, transformation, entity changes"
                  value={formState.operatingEnvironment.recentChangeContext}
                  onChange={(value) =>
                    updateSectionField(
                      "operatingEnvironment",
                      "recentChangeContext",
                      value,
                    )
                  }
                />
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="brand-section-kicker">Systems and architecture</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    Current platform landscape
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
                          ["identity", "Identity / access"],
                          ["payroll", "Payroll"],
                          ["reporting", "Reporting / BI"],
                          ["other", "Other"],
                        ]}
                      />

                      <TextInputField
                        label="System or platform name"
                        value={record.systemName}
                        onChange={(value) =>
                          updateSystemRecord(record.id, "systemName", value)
                        }
                        placeholder="Example: Workday"
                      />

                      <TextInputField
                        label="Vendor or product"
                        value={record.vendor}
                        onChange={(value) =>
                          updateSystemRecord(record.id, "vendor", value)
                        }
                        placeholder="Example: Workday HCM"
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
                        label="System of record?"
                        value={record.isSystemOfRecord}
                        onChange={(value) =>
                          updateSystemRecord(record.id, "isSystemOfRecord", value)
                        }
                        options={[
                          ["yes", "Yes"],
                          ["no", "No"],
                        ]}
                      />

                      <TextAreaField
                        label="Known limitations"
                        placeholder="Key design gaps, usability issues, missing workflow support, data or reporting problems"
                        value={record.keyLimitations}
                        onChange={(value) =>
                          updateSystemRecord(record.id, "keyLimitations", value)
                        }
                      />

                      <TextAreaField
                        label="Manual workarounds or dependencies"
                        placeholder="Where people rely on spreadsheets, shared mailboxes, manual approvals, rekeying, or off-system work"
                        value={record.manualWorkarounds}
                        onChange={(value) =>
                          updateSystemRecord(record.id, "manualWorkarounds", value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <SelectField
                  label="Overall integration maturity"
                  value={formState.systems.integrationMaturity}
                  onChange={(value) =>
                    updateSectionField(
                      "systems",
                      "integrationMaturity",
                      value as FactPackFormState["systems"]["integrationMaturity"],
                    )
                  }
                  options={[
                    ["low", "Low"],
                    ["partial", "Partial"],
                    ["integrated", "Integrated"],
                  ]}
                />

                <TextAreaField
                  label="Primary systems friction points"
                  placeholder="Where the current systems environment most obviously creates operational friction"
                  value={formState.systems.primaryFrictionPoints}
                  onChange={(value) =>
                    updateSectionField("systems", "primaryFrictionPoints", value)
                  }
                />
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Service model and governance</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Delivery model, ownership, and escalation
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <SelectField
                  label="Service model type"
                  value={formState.serviceModel.modelType}
                  onChange={(value) =>
                    updateSectionField(
                      "serviceModel",
                      "modelType",
                      value as FactPackFormState["serviceModel"]["modelType"],
                    )
                  }
                  options={[
                    ["centralised", "Centralised"],
                    ["hybrid", "Hybrid"],
                    ["decentralised", "Decentralised"],
                  ]}
                />

                <SelectField
                  label="Case ownership clarity"
                  value={formState.serviceModel.caseOwnership}
                  onChange={(value) =>
                    updateSectionField(
                      "serviceModel",
                      "caseOwnership",
                      value as FactPackFormState["serviceModel"]["caseOwnership"],
                    )
                  }
                  options={[
                    ["clear", "Clear"],
                    ["mixed", "Mixed"],
                    ["unclear", "Unclear"],
                  ]}
                />

                <SelectField
                  label="Escalation model"
                  value={formState.serviceModel.escalationModel}
                  onChange={(value) =>
                    updateSectionField(
                      "serviceModel",
                      "escalationModel",
                      value as FactPackFormState["serviceModel"]["escalationModel"],
                    )
                  }
                  options={[
                    ["defined", "Defined"],
                    ["informal", "Informal"],
                    ["unclear", "Unclear"],
                  ]}
                />

                <SelectField
                  label="Process ownership clarity"
                  value={formState.serviceModel.processOwnership}
                  onChange={(value) =>
                    updateSectionField(
                      "serviceModel",
                      "processOwnership",
                      value as FactPackFormState["serviceModel"]["processOwnership"],
                    )
                  }
                  options={[
                    ["clear", "Clear"],
                    ["partial", "Partial"],
                    ["unclear", "Unclear"],
                  ]}
                />

                <SelectField
                  label="Governance maturity"
                  value={formState.serviceModel.governanceMaturity}
                  onChange={(value) =>
                    updateSectionField(
                      "serviceModel",
                      "governanceMaturity",
                      value as FactPackFormState["serviceModel"]["governanceMaturity"],
                    )
                  }
                  options={[
                    ["strong", "Strong"],
                    ["developing", "Developing"],
                    ["weak", "Weak"],
                  ]}
                />

                <TextAreaField
                  label="Additional service model or governance notes"
                  placeholder="Anything important about routing, approvals, exceptions, ownership, or organisational boundaries"
                  value={formState.serviceModel.notes}
                  onChange={(value) =>
                    updateSectionField("serviceModel", "notes", value)
                  }
                />
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Data, controls, and risk</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Data environment, access, and control maturity
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <SelectField
                  label="Clarity of system of record by data domain"
                  value={formState.dataAndControls.systemOfRecordClarity}
                  onChange={(value) =>
                    updateSectionField(
                      "dataAndControls",
                      "systemOfRecordClarity",
                      value as FactPackFormState["dataAndControls"]["systemOfRecordClarity"],
                    )
                  }
                  options={[
                    ["clear", "Clear"],
                    ["partial", "Partial"],
                    ["unclear", "Unclear"],
                  ]}
                />

                <SelectField
                  label="Access control maturity"
                  value={formState.dataAndControls.accessControlMaturity}
                  onChange={(value) =>
                    updateSectionField(
                      "dataAndControls",
                      "accessControlMaturity",
                      value as FactPackFormState["dataAndControls"]["accessControlMaturity"],
                    )
                  }
                  options={[
                    ["strong", "Strong"],
                    ["moderate", "Moderate"],
                    ["weak", "Weak"],
                  ]}
                />

                <SelectField
                  label="Confidence in audit trail or traceability"
                  value={formState.dataAndControls.auditTrailConfidence}
                  onChange={(value) =>
                    updateSectionField(
                      "dataAndControls",
                      "auditTrailConfidence",
                      value as FactPackFormState["dataAndControls"]["auditTrailConfidence"],
                    )
                  }
                  options={[
                    ["high", "High"],
                    ["medium", "Medium"],
                    ["low", "Low"],
                  ]}
                />

                <TextAreaField
                  label="Recurring control, data, or reconciliation issues"
                  placeholder="Examples: duplicate entry, poor auditability, unclear ownership, recurring data fixes"
                  value={formState.dataAndControls.recurringIssues}
                  onChange={(value) =>
                    updateSectionField("dataAndControls", "recurringIssues", value)
                  }
                />

                <TextAreaField
                  label="Regulatory, privacy, audit, or security constraints"
                  placeholder="Anything that materially shapes how HR operations can be designed or delivered"
                  value={formState.dataAndControls.regulatoryConstraints}
                  onChange={(value) =>
                    updateSectionField(
                      "dataAndControls",
                      "regulatoryConstraints",
                      value,
                    )
                  }
                />
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="brand-section-kicker">Change landscape</p>
                  <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                    Approved, proposed, and exploratory initiatives
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

              <div className="mt-8 space-y-6">
                {formState.changeLandscape.initiatives.map((initiative, index) => (
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
                        disabled={formState.changeLandscape.initiatives.length === 1}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-5 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                      <TextInputField
                        label="Initiative name"
                        value={initiative.name}
                        onChange={(value) =>
                          updateChangeInitiative(initiative.id, "name", value)
                        }
                        placeholder="Example: ServiceNow HR workflow redesign"
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
                        value={initiative.sponsor}
                        onChange={(value) =>
                          updateChangeInitiative(initiative.id, "sponsor", value)
                        }
                        placeholder="Example: CHRO, CIO, COO"
                      />

                      <TextInputField
                        label="Timeline"
                        value={initiative.timeline}
                        onChange={(value) =>
                          updateChangeInitiative(initiative.id, "timeline", value)
                        }
                        placeholder="Example: Q3 2026, under review, not defined"
                      />

                      <TextAreaField
                        label="Scope or description"
                        placeholder="What the initiative is intended to change"
                        value={initiative.scope}
                        onChange={(value) =>
                          updateChangeInitiative(initiative.id, "scope", value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <TextAreaField
                  label="Major transformation already affecting HR operations today"
                  placeholder="Anything currently live or underway that is already shaping the operating environment"
                  value={formState.changeLandscape.currentTransformationContext}
                  onChange={(value) =>
                    updateSectionField(
                      "changeLandscape",
                      "currentTransformationContext",
                      value,
                    )
                  }
                />
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">AI and automation</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Current usage, initiatives, and governance
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <TextAreaField
                  label="Current AI or automation usage"
                  placeholder="Where AI, automation, copilots, workflow automation, or digital assistants are already in use"
                  value={formState.aiAndAutomation.currentUsage}
                  onChange={(value) =>
                    updateSectionField("aiAndAutomation", "currentUsage", value)
                  }
                />

                <TextAreaField
                  label="Active AI or automation initiatives"
                  placeholder="Current pilots, proposed use cases, or active transformation work"
                  value={formState.aiAndAutomation.activeInitiatives}
                  onChange={(value) =>
                    updateSectionField(
                      "aiAndAutomation",
                      "activeInitiatives",
                      value,
                    )
                  }
                />

                <SelectField
                  label="AI governance maturity"
                  value={formState.aiAndAutomation.governanceMaturity}
                  onChange={(value) =>
                    updateSectionField(
                      "aiAndAutomation",
                      "governanceMaturity",
                      value as FactPackFormState["aiAndAutomation"]["governanceMaturity"],
                    )
                  }
                  options={[
                    ["defined", "Defined"],
                    ["emerging", "Emerging"],
                    ["none", "None"],
                  ]}
                />

                <TextAreaField
                  label="Main AI or automation risks or concerns"
                  placeholder="Examples: data privacy, control gaps, shadow AI, quality risk, weak governance"
                  value={formState.aiAndAutomation.riskConcerns}
                  onChange={(value) =>
                    updateSectionField("aiAndAutomation", "riskConcerns", value)
                  }
                />
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Delivery constraints</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Practical delivery reality
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <SelectField
                  label="Capacity constraint"
                  value={formState.constraints.capacityConstraint}
                  onChange={(value) =>
                    updateSectionField(
                      "constraints",
                      "capacityConstraint",
                      value as FactPackFormState["constraints"]["capacityConstraint"],
                    )
                  }
                  options={[
                    ["low", "Low"],
                    ["moderate", "Moderate"],
                    ["high", "High"],
                  ]}
                />

                <SelectField
                  label="Change fatigue"
                  value={formState.constraints.changeFatigue}
                  onChange={(value) =>
                    updateSectionField(
                      "constraints",
                      "changeFatigue",
                      value as FactPackFormState["constraints"]["changeFatigue"],
                    )
                  }
                  options={[
                    ["low", "Low"],
                    ["moderate", "Moderate"],
                    ["high", "High"],
                  ]}
                />

                <SelectField
                  label="Dependency on IT or other teams"
                  value={formState.constraints.techDependency}
                  onChange={(value) =>
                    updateSectionField(
                      "constraints",
                      "techDependency",
                      value as FactPackFormState["constraints"]["techDependency"],
                    )
                  }
                  options={[
                    ["low", "Low"],
                    ["moderate", "Moderate"],
                    ["high", "High"],
                  ]}
                />

                <TextAreaField
                  label="Key practical constraints"
                  placeholder="What most limits the organisation’s ability to improve HR operations right now"
                  value={formState.constraints.keyConstraints}
                  onChange={(value) =>
                    updateSectionField("constraints", "keyConstraints", value)
                  }
                />
              </div>
            </section>

            <section className="brand-surface-card p-6 sm:p-8">
              <p className="brand-section-kicker">Advisory context</p>
              <h2 className="brand-heading-sm mt-3 text-[var(--brand-light-text)]">
                Judgement and interpretation prompts
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <TextAreaField
                  label="What most constrains HR operations today?"
                  placeholder="The biggest practical or structural blocker"
                  value={formState.advisoryContext.biggestConstraint}
                  onChange={(value) =>
                    updateSectionField(
                      "advisoryContext",
                      "biggestConstraint",
                      value,
                    )
                  }
                />

                <TextAreaField
                  label="What would create the highest-value improvement in the next 6 to 12 months?"
                  placeholder="The most meaningful improvement opportunity"
                  value={formState.advisoryContext.highestValueOpportunity}
                  onChange={(value) =>
                    updateSectionField(
                      "advisoryContext",
                      "highestValueOpportunity",
                      value,
                    )
                  }
                />

                <TextAreaField
                  label="What risks are being tolerated today?"
                  placeholder="Operational, control, service, or organisational risks"
                  value={formState.advisoryContext.knownRisks}
                  onChange={(value) =>
                    updateSectionField("advisoryContext", "knownRisks", value)
                  }
                />

                <TextAreaField
                  label="Any additional context that should shape interpretation?"
                  placeholder="Anything else that would materially affect how the diagnostic should be read"
                  value={formState.advisoryContext.additionalContext}
                  onChange={(value) =>
                    updateSectionField(
                      "advisoryContext",
                      "additionalContext",
                      value,
                    )
                  }
                />
              </div>
            </section>

            {submitMessage ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700">
                {submitMessage}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button type="submit" className="brand-button-primary">
                Save fact pack
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function TextInputField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
      />
    </label>
  );
}

function TextAreaField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-900">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-900"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}