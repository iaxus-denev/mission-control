import { NextResponse } from "next/server";
import { withRoute } from "@/lib/api-route";
import { executionLookupSchema } from "@/lib/clawops-schemas";
import { findJobByExecution } from "@/lib/clawops-store";
import { notFound } from "@/lib/api-errors";
export const GET=withRoute({name:"/api/clawops/executions",querySchema:executionLookupSchema},async(_r,ctx)=>{const match=await findJobByExecution(ctx.query.id);return match?NextResponse.json(match):notFound("Execution is not linked to a ClawOps Job");});
