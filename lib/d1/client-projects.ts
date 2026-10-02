import { getD1Database } from "./database";

export type D1ClientProjectListItem = {
  project_id: string;
  project_name: string | null;
  company_name: string;
  project_status: "active" | "closed" | "archived";
  created_at: string;
};

export async function listD1ClientProjects(
  ascending = false,
): Promise<D1ClientProjectListItem[]> {
  const direction = ascending ? "ASC" : "DESC";
  const result = await getD1Database()
    .prepare(
      `SELECT
        project_id,
        project_name,
        company_name,
        project_status,
        created_at
      FROM client_projects
      ORDER BY created_at ${direction}`,
    )
    .all<D1ClientProjectListItem>();

  return result.results;
}
