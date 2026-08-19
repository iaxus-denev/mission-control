import { mkdir, open, readFile, readdir, realpath, rename, stat, writeFile } from "fs/promises";
import { dirname, join, relative, resolve, sep } from "path";
import { randomUUID } from "crypto";
import { getDefaultWorkspace } from "./paths";
import { projectSlugSchema, jobIdSchema } from "./clawops-schemas";
import type { JobExecutionLink, JobHistoryEvent, JobManifest, JobStatus, ProjectManifest } from "./clawops-types";
import { JOB_SCHEMA_VERSION, PROJECT_SCHEMA_VERSION } from "./clawops-types";

const locks = new Map<string, Promise<void>>();
const transitions: Record<JobStatus, JobStatus[]> = {
  new: ["backlog"], backlog: ["in_progress"], in_progress: ["testing", "done"], testing: ["in_progress", "done"], done: [],
};

async function exclusive<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((r) => { release = r; });
  locks.set(key, previous.then(() => current));
  await previous;
  try { return await operation(); } finally { release(); if (locks.get(key) === current) locks.delete(key); }
}
async function root() { return join(await getDefaultWorkspace(), "projects"); }
async function bounded(...parts: string[]) {
  const base = resolve(await root());
  const target = resolve(base, ...parts);
  const rel = relative(base, target);
  if (rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !rel.startsWith(sep))) return target;
  throw new Error("path escapes projects root");
}
async function assertNoSymlinkEscape(path: string) {
  const base = resolve(await root());
  let existing = path;
  while (existing !== dirname(existing)) {
    try { const canonical = await realpath(existing); const rel = relative(base, canonical); if (rel === ".." || rel.startsWith(`..${sep}`)) throw new Error("symlink escapes projects root"); return; } catch (e: unknown) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; }
    existing = dirname(existing);
  }
}
async function atomicJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true }); await assertNoSymlinkEscape(path);
  const temp = join(dirname(path), `.${randomUUID()}.tmp`);
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o664, flag: "wx" });
  await rename(temp, path);
}
async function json<T>(path: string): Promise<T> { return JSON.parse(await readFile(path, "utf8")) as T; }
async function exists(path: string) { try { await stat(path); return true; } catch (e: unknown) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return false; throw e; } }
async function appendEvent(path: string, event: JobHistoryEvent) { const h = await open(path, "a", 0o664); try { await h.writeFile(`${JSON.stringify(event)}\n`, "utf8"); await h.sync(); } finally { await h.close(); } }
function event(type: string, actorId: string, data: Record<string, unknown>, correlationId?: string): JobHistoryEvent { return { schemaVersion: 1, eventId: randomUUID(), type, at: new Date().toISOString(), actorId, ...(correlationId ? { correlationId } : {}), data }; }
function validateProject(value: ProjectManifest) { if (value.schemaVersion !== 1 || !projectSlugSchema.safeParse(value.slug).success) throw new Error("invalid project manifest"); return value; }
function validateJob(value: JobManifest) { if (value.schemaVersion !== 1 || !jobIdSchema.safeParse(value.id).success || !projectSlugSchema.safeParse(value.projectSlug).success) throw new Error("invalid Job manifest"); return value; }

export async function listProjects(): Promise<ProjectManifest[]> {
  const base = await root(); await mkdir(base, { recursive: true });
  const entries = await readdir(base, { withFileTypes: true }); const out: ProjectManifest[] = [];
  for (const e of entries) if (e.isDirectory() && projectSlugSchema.safeParse(e.name).success) { try { out.push(validateProject(await json(join(base, e.name, "project.json")))); } catch { /* directories without manifests are not Projects yet */ } }
  return out.sort((a,b) => a.name.localeCompare(b.name));
}
export async function getProject(slug: string) { projectSlugSchema.parse(slug); return validateProject(await json(await bounded(slug, "project.json"))); }
export async function createProject(input: { slug: string; name: string; projectLeadAgentId: string; mission: string; repositories: string[] }) {
  projectSlugSchema.parse(input.slug); const dir = await bounded(input.slug);
  return exclusive(dir, async () => { if (await exists(join(dir, "project.json"))) throw new Error("project already exists"); const now = new Date().toISOString(); const p: ProjectManifest = { schemaVersion: PROJECT_SCHEMA_VERSION, slug: input.slug, name: input.name, status: "active", projectLeadAgentId: input.projectLeadAgentId, repositories: input.repositories, createdAt: now, updatedAt: now };
    for (const d of ["jobs","decisions","research","development","testing","marketing","references"]) await mkdir(join(dir,d), { recursive: true });
    await atomicJson(join(dir,"project.json"),p); await writeFile(join(dir,"README.md"),`# ${input.name}\n\n${input.mission || "Project mission has not been synthesized yet."}\n`,{flag:"wx"}); await writeFile(join(dir,"AGENTS.md"),`# Project agents\n\nProject Lead: \`${input.projectLeadAgentId}\`\n`,{flag:"wx"}); await atomicJson(join(dir,"references","github.json"),{schemaVersion:1,repositories:input.repositories}); return p; });
}
export async function setProjectArchived(slug: string, archived: boolean) { const dir = await bounded(slug); return exclusive(dir, async()=>{ const p=await getProject(slug); const next={...p,status:archived?"archived":"active" as const,updatedAt:new Date().toISOString()}; await atomicJson(join(dir,"project.json"),next); return next; }); }
async function nextJobId(slug: string) { const dir=await bounded(slug,"jobs"); await mkdir(dir,{recursive:true}); const names=await readdir(dir); const max=names.map(n=>/^JOB-(\d+)$/.exec(n)?.[1]).filter(Boolean).map(Number).reduce((a,b)=>Math.max(a,b),0); return `JOB-${String(max+1).padStart(4,"0")}`; }
export async function listJobs(filter: {project?:string;assignee?:string;status?:JobStatus}={}) { const projects=filter.project?[await getProject(filter.project)]:await listProjects(); const out:JobManifest[]=[]; for(const p of projects){const d=await bounded(p.slug,"jobs"); for(const e of await readdir(d,{withFileTypes:true})){if(!e.isDirectory()||!jobIdSchema.safeParse(e.name).success)continue; try{const j=validateJob(await json(join(d,e.name,"job.json"))); if(filter.assignee&&j.assigneeId!==filter.assignee)continue;if(filter.status&&j.status!==filter.status)continue;out.push(j);}catch{}}} return out.sort((a,b)=>a.priority-b.priority||b.updatedAt.localeCompare(a.updatedAt)); }
export async function getJob(slug:string,id:string){projectSlugSchema.parse(slug);jobIdSchema.parse(id);return validateJob(await json(await bounded(slug,"jobs",id,"job.json")));}
export async function createJob(slug:string,input:{title:string;type:JobManifest["type"];assigneeId:string;parentJobId:string|null;requiresTesting:boolean;priority:number;requirements:string;actorId:string}) { const p=await getProject(slug); const jobsDir=await bounded(slug,"jobs"); return exclusive(jobsDir,async()=>{let parent:JobManifest|null=null;if(input.parentJobId)parent=await getJob(slug,input.parentJobId);const id=await nextJobId(slug),dir=join(jobsDir,id),now=new Date().toISOString();const j:JobManifest={schemaVersion:JOB_SCHEMA_VERSION,id,projectSlug:slug,title:input.title,type:input.type,status:"new",assigneeId:input.assigneeId,projectLeadAgentId:p.projectLeadAgentId,parentJobId:input.parentJobId,childJobIds:[],requiresTesting:input.requiresTesting,priority:input.priority,indicators:{blocked:false,needsOwnerInput:false,waitingForSubtask:false},createdAt:now,updatedAt:now,completedAt:null};await mkdir(join(dir,"attachments"),{recursive:true});await atomicJson(join(dir,"job.json"),j);await writeFile(join(dir,"requirements.md"),`# Requirements\n\n${input.requirements || "Requirements discovery is pending."}\n`);await writeFile(join(dir,"thread.md"),"# Job thread\n\n");await writeFile(join(dir,"result.md"),"# Result\n\nNo result yet.\n");await atomicJson(join(dir,"executions.json"),{schemaVersion:1,executions:[]});await appendEvent(join(dir,"history.jsonl"),event("job.created",input.actorId,{title:j.title,parentJobId:j.parentJobId}));if(parent){const updated={...parent,childJobIds:[...parent.childJobIds,id],updatedAt:now};await atomicJson(join(jobsDir,parent.id,"job.json"),updated);await appendEvent(join(jobsDir,parent.id,"history.jsonl"),event("child.created",input.actorId,{childJobId:id}));}return j;}); }
export async function updateJob(slug:string,id:string,patch:{title?:string;assigneeId?:string;status?:JobStatus;priority?:number;indicators?:Partial<JobManifest["indicators"]>;result?:string;actorId:string;correlationId?:string}) {const dir=await bounded(slug,"jobs",id);return exclusive(dir,async()=>{const current=await getJob(slug,id);if(patch.status&&patch.status!==current.status){if(!transitions[current.status].includes(patch.status))throw new Error(`invalid transition ${current.status} -> ${patch.status}`);if(patch.status==="in_progress"){const links=(await json<{executions:JobExecutionLink[]}>(join(dir,"executions.json"))).executions;if(links.length===0)throw new Error("In Progress requires linked execution evidence");}if(patch.status==="done"&&patch.result===undefined){const content=await readFile(join(dir,"result.md"),"utf8");if(content.includes("No result yet."))throw new Error("Done requires a durable result");}}
const now=new Date().toISOString();const next:JobManifest={...current,...(patch.title?{title:patch.title}:{}),...(patch.assigneeId?{assigneeId:patch.assigneeId}:{}),...(patch.status?{status:patch.status}:{}),...(patch.priority!==undefined?{priority:patch.priority}:{}),indicators:{...current.indicators,...patch.indicators},updatedAt:now,completedAt:patch.status==="done"?now:current.completedAt};if(patch.result!==undefined)await writeFile(join(dir,"result.md"),`# Result\n\n${patch.result}\n`);await atomicJson(join(dir,"job.json"),next);await appendEvent(join(dir,"history.jsonl"),event("job.updated",patch.actorId,{from:{status:current.status,assigneeId:current.assigneeId},to:{status:next.status,assigneeId:next.assigneeId}},patch.correlationId));return next;});}
export async function linkExecution(slug:string,id:string,link:Omit<JobExecutionLink,"linkedAt">,actorId:string){const dir=await bounded(slug,"jobs",id);return exclusive(dir,async()=>{await getJob(slug,id);const path=join(dir,"executions.json"),state=await json<{schemaVersion:1;executions:JobExecutionLink[]}>(path);if(state.executions.some(e=>e.executionId===link.executionId))return state;const next={...state,executions:[...state.executions,{...link,linkedAt:new Date().toISOString()}]};await atomicJson(path,next);await appendEvent(join(dir,"history.jsonl"),event("execution.linked",actorId,link));return next;});}
