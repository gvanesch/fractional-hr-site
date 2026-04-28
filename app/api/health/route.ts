import { createClient } from "@supabase/supabase-js";

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        const { error } = await supabase
            .from("client_projects")
            .select("project_id")
            .limit(1);

        if (error) {
            throw error;
        }

        return Response.json({
            status: "ok",
            supabase: "connected",
        });
    } catch (error) {
        return Response.json(
            {
                status: "error",
                message:
                    error instanceof Error ? error.message : "Unknown health check error",
            },
            { status: 500 },
        );
    }
}