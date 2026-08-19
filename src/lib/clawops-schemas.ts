import { z } from "zod";
import { JOB_STATUSES } from "./clawops-types";

export const projectSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "invalid project slug");
export const jobIdSchema = z.string().regex(/^JOB-\d{4,}$/, "invalid Job ID");
const nonEmpty = z.string().trim().min(1).max(300);

export const createProjectSchema = z.object({
  slug: projectSlugSchema,
  name: nonEmpty,
  projectLeadAgentId: nonEmpty,
  mission: z.string().trim().max(20_000).default(""),
  repositories: z.array(z.string().url()).max(20).default([]),
});
export const projectRouteSchema = z.object({ slug: projectSlugSchema });
export const archiveProjectSchema = z.object({ archived: z.boolean(), actorId: nonEmpty.default("owner") });

export const createJobSchema = z.object({
  title: nonEmpty,
  type: z.enum(["discovery", "research", "implementation", "testing", "marketing", "operations"]).default("discovery"),
  assigneeId: nonEmpty,
  parentJobId: jobIdSchema.nullable().default(null),
  requiresTesting: z.boolean().default(false),
  priority: z.number().int().min(0).max(1000).default(100),
  requirements: z.string().trim().max(100_000).default(""),
  actorId: nonEmpty.default("owner"),
});
export const jobsQuerySchema = z.object({ project: projectSlugSchema.optional(), assignee: z.string().trim().min(1).optional(), status: z.enum(JOB_STATUSES).optional() });
export const jobRouteSchema = z.object({ slug: projectSlugSchema, jobId: jobIdSchema });
export const updateJobSchema = z.object({
  title: nonEmpty.optional(),
  assigneeId: nonEmpty.optional(),
  status: z.enum(JOB_STATUSES).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  indicators: z.object({ blocked: z.boolean(), needsOwnerInput: z.boolean(), waitingForSubtask: z.boolean() }).partial().optional(),
  result: z.string().trim().max(200_000).optional(),
  actorId: nonEmpty.default("owner"),
  correlationId: z.string().trim().min(1).max(200).optional(),
});
export const linkExecutionSchema = z.object({
  executionId: nonEmpty,
  runtime: z.enum(["task", "taskflow", "subagent", "cron", "heartbeat", "session", "other"]),
  agentId: nonEmpty,
  purpose: nonEmpty,
  actorId: nonEmpty.default("system"),
});
export const pickupQuerySchema = z.object({ agentId: z.string().trim().min(1).optional() });
export const claimJobSchema = z.object({ executionId: nonEmpty, runtime: z.enum(["task", "taskflow", "subagent", "cron", "heartbeat", "session", "other"]), agentId: nonEmpty, purpose: nonEmpty.default("implementation"), actorId: nonEmpty.default("heartbeat") });
export const executionLookupSchema = z.object({ id: nonEmpty });
