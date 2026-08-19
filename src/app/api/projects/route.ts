import { NextResponse } from "next/server";
import { withRoute } from "@/lib/api-route";
import { createProjectSchema } from "@/lib/clawops-schemas";
import { createProject, listProjects } from "@/lib/clawops-store";
import { conflict } from "@/lib/api-errors";

export const GET = withRoute({ name: "/api/projects" }, async () => NextResponse.json({ projects: await listProjects() }));
export const POST = withRoute({ name: "/api/projects", bodySchema: createProjectSchema }, async (_request, ctx) => {
  try { return NextResponse.json({ project: await createProject(ctx.body) }, { status: 201 }); }
  catch (error) { if (error instanceof Error && error.message === "project already exists") return conflict(error.message); throw error; }
});
