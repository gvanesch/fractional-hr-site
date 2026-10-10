import { notFound, redirect } from "next/navigation";
import { requireAdvisorUser } from "@/lib/advisor-auth";
import { baselineEnv } from "@/lib/baseline/server";
import AdminPanel from "./panel";
export const dynamic = "force-dynamic";
export const metadata = {title:"team.blue baseline administration",robots:{index:false,follow:false}};
export default async function Page(){try{baselineEnv();}catch{notFound();}if(!await requireAdvisorUser())redirect("/advisor/login");return <AdminPanel/>;}
