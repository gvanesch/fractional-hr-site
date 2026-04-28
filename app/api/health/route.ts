import { createClient } from "@supabase/supabase-js";

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        const { error } = await supabase
            .from("client_projects")
            .select("id")
            .limit(1);

        if (error) {
            throw error;
        }

        return new Response(
            JSON.stringify({
                status: "ok",
                supabase: "connected",
            }),
            {
                headers: { "Content-Type": "application/json" },
            },
        );
    } catch (err) {
        return new Response(
            JSON.stringify({
                status: "error",
                message: (err as Error).message,
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}