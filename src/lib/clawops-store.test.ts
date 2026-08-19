import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, symlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
let workspace: string;
vi.mock("./paths", () => ({ getDefaultWorkspace: async () => workspace }));
import { createJob, createProject, getJob, linkExecution, listProjects, updateJob } from "./clawops-store";
const project={slug:"safe-project",name:"Safe",projectLeadAgentId:"lead",mission:"Mission",repositories:[]};
beforeEach(async()=>{workspace=await mkdtemp(join(tmpdir(),"clawops-"));});
afterEach(async()=>{await rm(workspace,{recursive:true,force:true});});
describe("ClawOps filesystem store",()=>{
 it("creates and rediscovers canonical project state",async()=>{await createProject(project);expect((await listProjects())[0].slug).toBe("safe-project");});
 it("persists parent-child Jobs and audit history",async()=>{await createProject(project);const parent=await createJob("safe-project",{title:"Parent",type:"discovery",assigneeId:"lead",parentJobId:null,requiresTesting:false,priority:1,requirements:"R",actorId:"owner"});const child=await createJob("safe-project",{title:"Child",type:"research",assigneeId:"researcher",parentJobId:parent.id,requiresTesting:false,priority:2,requirements:"Find",actorId:"lead"});expect((await getJob("safe-project",parent.id)).childJobIds).toEqual([child.id]);expect(await readFile(join(workspace,"projects","safe-project","jobs",parent.id,"thread.md"),"utf8")).toContain("Job thread");});
 it("requires execution evidence before In Progress and a result before Done",async()=>{await createProject(project);const job=await createJob("safe-project",{title:"Implement",type:"implementation",assigneeId:"dev",parentJobId:null,requiresTesting:true,priority:1,requirements:"Build",actorId:"owner"});await updateJob("safe-project",job.id,{status:"backlog",actorId:"lead"});await expect(updateJob("safe-project",job.id,{status:"in_progress",actorId:"dev"})).rejects.toThrow("linked execution");await linkExecution("safe-project",job.id,{executionId:"session:1",runtime:"session",agentId:"dev",purpose:"implementation"},"system");await updateJob("safe-project",job.id,{status:"in_progress",actorId:"dev"});await updateJob("safe-project",job.id,{status:"testing",actorId:"dev"});await expect(updateJob("safe-project",job.id,{status:"done",actorId:"tester"})).rejects.toThrow("durable result");expect((await updateJob("safe-project",job.id,{status:"done",result:"Passed",actorId:"tester"})).status).toBe("done");});
 it("rejects traversal slugs before touching the filesystem",async()=>{await expect(createProject({...project,slug:"../escape"})).rejects.toThrow();});
 it("rejects a project symlink escaping the projects root",async()=>{await symlink(tmpdir(),join(workspace,"projects","evil"),"dir").catch(async()=>{const {mkdir}=await import("fs/promises");await mkdir(join(workspace,"projects"),{recursive:true});await symlink(tmpdir(),join(workspace,"projects","evil"),"dir");});await expect(createProject({...project,slug:"evil"})).rejects.toThrow("symlink escapes");});
});
