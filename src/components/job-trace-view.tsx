"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Wrench } from "lucide-react";
import { groupRunsFromEvents, type AuditEvent } from "@/lib/audit-grouping";
import { Badge } from "@/components/ui/badge";

type AuditResponse = { available:boolean; reason?:string; events:AuditEvent[] };

export function JobTraceView({executionId}:{executionId:string}) {
  const [data,setData]=useState<AuditResponse|null>(null),[error,setError]=useState<string|null>(null);
  useEffect(()=>{let active=true;fetch(`/api/audit?runId=${encodeURIComponent(executionId)}&limit=500`,{cache:"no-store"}).then(async r=>{const body=await r.json();if(!r.ok)throw new Error(body?.error||`Audit request failed (${r.status})`);if(active)setData(body);}).catch(e=>{if(active)setError(e instanceof Error?e.message:String(e));});return()=>{active=false};},[executionId]);
  const runs=useMemo(()=>groupRunsFromEvents(data?.events||[]),[data]);
  if(error)return <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="size-3"/>{error}</p>;
  if(!data)return <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin"/>Loading OpenClaw audit trace…</p>;
  if(!data.available)return <p className="text-xs text-muted-foreground">Audit unavailable: {data.reason||"OpenClaw did not expose audit events."}</p>;
  if(!runs.length)return <p className="text-xs text-muted-foreground">No audit events matched this execution ID.</p>;
  return <div className="space-y-2">{runs.map(run=><div key={run.runId} className="rounded-lg border bg-secondary/30 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium">{run.agentId||"OpenClaw run"}</span><Badge variant={run.status==="succeeded"?"default":"secondary"}>{run.status}</Badge></div><p className="mt-1 text-[11px] text-muted-foreground">{new Date(run.startedAt).toLocaleString()} · {run.tools.length} tool calls</p>{run.tools.length>0&&<div className="mt-2 space-y-1">{run.tools.map(tool=><div key={tool.toolCallId} className="flex items-center gap-2 text-xs"><Wrench className="size-3 text-muted-foreground"/><span className="min-w-0 flex-1 truncate">{tool.toolName}</span>{tool.status==="succeeded"&&<CheckCircle2 className="size-3 text-success"/>}<span className="text-[10px] text-muted-foreground">{tool.durationMs===undefined?tool.status:`${tool.durationMs}ms`}</span></div>)}</div>}</div>)}</div>;
}
