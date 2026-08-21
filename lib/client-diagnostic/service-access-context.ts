export const serviceAccessRoutes = [
  "hr_portal_or_case_system",
  "shared_hr_email",
  "specialist_hr_email",
  "named_hr_contact_email",
  "internal_messaging_platform",
  "telephone",
  "in_person",
  "through_manager",
  "self_service_or_knowledge_platform",
  "other",
] as const;

export type ServiceAccessRoute = (typeof serviceAccessRoutes)[number];

export const serviceAccessRouteLabels: Record<ServiceAccessRoute, string> = {
  hr_portal_or_case_system: "HR portal or case management system",
  shared_hr_email: "Shared HR email address",
  specialist_hr_email: "Specific HR team or specialist email address",
  named_hr_contact_email: "Email to a named HR contact",
  internal_messaging_platform: "Internal messaging platform, e.g. Teams or Slack",
  telephone: "Telephone",
  in_person: "In person",
  through_manager: "Through my manager",
  self_service_or_knowledge_platform: "Self-service or knowledge platform",
  other: "Other",
};

export const intendedAccessModels = [
  "single_default_route",
  "different_routes_by_request",
  "different_routes_by_group",
  "no_clearly_defined_model",
  "other",
] as const;

export type IntendedAccessModel = (typeof intendedAccessModels)[number];

export const intendedAccessModelLabels: Record<IntendedAccessModel, string> = {
  single_default_route: "One default route is used for most HR requests",
  different_routes_by_request:
    "Different routes are used depending on the type of request",
  different_routes_by_group:
    "Different routes are used for different employee, manager or workforce groups",
  no_clearly_defined_model: "There is no clearly defined access model",
  other: "Other",
};

export type ServiceAccessContext = {
  routesUsed: ServiceAccessRoute[];
  usualRoute?: ServiceAccessRoute;
  usualRouteEffectiveness?: 1 | 2 | 3 | 4 | 5;
  intendedAccessModel?: IntendedAccessModel;
  intendedPrimaryRoute?: ServiceAccessRoute;
  specificRouteDetail?: string;
};

export function isServiceAccessRoute(
  value: unknown,
): value is ServiceAccessRoute {
  return (
    typeof value === "string" &&
    serviceAccessRoutes.includes(value as ServiceAccessRoute)
  );
}
