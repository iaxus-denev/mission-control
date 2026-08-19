export const PROJECT_SCHEMA_VERSION = 1 as const;
export const JOB_SCHEMA_VERSION = 1 as const;

export const JOB_STATUSES = ["new", "backlog", "in_progress", "testing", "done"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export type ProjectManifest = {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  slug: string;
  name: string;
  status: "active" | "archived";
  projectLeadAgentId: string;
  repositories: string[];
  createdAt: string;
  updatedAt: string;
};

export type JobManifest = {
  schemaVersion: typeof JOB_SCHEMA_VERSION;
  id: string;
  projectSlug: string;
  title: string;
  type: "discovery" | "research" | "implementation" | "testing" | "marketing" | "operations";
  status: JobStatus;
  assigneeId: string;
  projectLeadAgentId: string;
  parentJobId: string | null;
  childJobIds: string[];
  requiresTesting: boolean;
  priority: number;
  indicators: { blocked: boolean; needsOwnerInput: boolean; waitingForSubtask: boolean };
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type JobExecutionLink = {
  executionId: string;
  runtime: "task" | "taskflow" | "subagent" | "cron" | "heartbeat" | "session" | "other";
  agentId: string;
  purpose: string;
  linkedAt: string;
};

export type JobHistoryEvent = {
  schemaVersion: 1;
  eventId: string;
  type: string;
  at: string;
  actorId: string;
  correlationId?: string;
  data: Record<string, unknown>;
};
