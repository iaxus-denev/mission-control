import { NextResponse } from "next/server";
import { withRoute } from "@/lib/api-route";
import { archiveProjectSchema, projectRouteSchema } from "@/lib/clawops-schemas";
import { getProject, setProjectArchived } from "@/lib/clawops-store";
export const GET = withRoute({ name: "/api/projects/[slug]", routeSchema: projectRouteSchema }, async (_r,ctx)=>NextResponse.json({project:await getProject(ctx.params.slug)}));
export const PATCH = withRoute({ name: "/api/projects/[slug]", routeSchema: projectRouteSchema, bodySchema: archiveProjectSchema }, async (_r,ctx)=>NextResponse.json({project:await setProjectArchived(ctx.params.slug,ctx.body.archived)}));
