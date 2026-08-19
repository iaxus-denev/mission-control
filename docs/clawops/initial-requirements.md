# ClawOps Mission Control — Fork & Extension Brief

> **Document status:** Discovery-complete implementation brief
> **Canonical project workspace:** `~/.openclaw/workspace/projects/mission-control/`
> **Last validated:** 2026-08-19
> **Upstream baseline:** `robsannaa/mission-control@4c64bab32390e9e8f863df5279133dbc22350c04` (`@openclaw/dashboard` v0.15.0)

## Project name

**ClawOps**

---

# What we're building

Build my Mission Control for OpenClaw by **forking and extending the existing `robsannaa/mission-control` project**, not by creating a new dashboard from scratch.

Upstream source:

`https://github.com/robsannaa/mission-control`

The existing Mission Control should remain the technical foundation: OpenClaw discovery, gateway/CLI communication, agent runtime visibility, configuration management, system monitoring, memory, documents, cron, channels, security tooling, terminal, and the other capabilities that are already working.

Our work is primarily a new **project-management and orchestration layer** on top of that foundation.

The core product model should become:

**Projects → Jobs → Agents → Executions → Results**

Mission Control must let me understand, within seconds:

* what projects exist;
* what work exists inside each project;
* who owns each project;
* which agent is responsible for each Job;
* which agent is actually working right now;
* what subtasks were delegated and why;
* what OpenClaw executions resulted from those Jobs;
* what is blocked;
* what requires my input;
* what has been tested;
* and what was ultimately completed.

This is not intended to become a generic Jira/Trello clone.

It is an **operations console for an autonomous software organization running on OpenClaw**.

---

# Foundation: fork the existing Mission Control

Do not rebuild Mission Control from scratch.

Create a real fork of:

`https://github.com/robsannaa/mission-control`

Prefer:

* `origin` → my fork;
* `upstream` → `robsannaa/mission-control`.

Preserve the upstream Git history.

Preserve the MIT license and required attribution.

Before making changes, record:

* exact upstream commit SHA;
* package version;
* OpenClaw version;
* Node.js version;
* current workspace location;
* current Mission Control configuration.

The fork should remain structurally close enough to upstream that selective upstream fixes can still be merged/cherry-picked later.

Do not unnecessarily rewrite working upstream components.

If GitHub authentication prevents creation of the actual remote fork, clone the repository, configure `upstream`, and tell me exactly what GitHub access is required before pushing. Do not silently create some unrelated repository structure.

---

# Runtime environment

The server already has:

**Node.js v26.7.0**

This is the Node version this project should use.

Do not install nvm, downgrade Node, replace the system Node version, or introduce a second Node runtime unless I explicitly approve it.

Before implementation:

1. Verify `node --version` returns `v26.7.0`.
2. Verify `openclaw --version`.
3. Install the fork dependencies.
4. Run the existing tests/build before changing functionality.
5. Record existing failures separately from failures introduced by our changes.
6. Verify that Next.js and all dependencies actually run correctly under Node 26.7.0.

The fact that a package declares compatibility is not enough — verify the build and runtime.

If a dependency is incompatible with Node 26.7.0, first investigate upgrading or replacing that dependency rather than changing the server's Node version.

The final production/background service must use the same Node.js v26.7.0 binary that was tested.

---

# Primary architectural principle

Keep the philosophy of the original Mission Control:

**OpenClaw and its workspace remain the source of truth.**

Mission Control must remain removable without destroying the autonomous organization.

However, our project-management concepts — Projects, Jobs, task threads, requirements, assignments, project relationships, subtasks and decisions — require durable state that does not currently exist as native OpenClaw execution state.

Store that state inside the OpenClaw workspace.

Do not create an unrelated shadow database containing the only copy of this information.

My preference for phase 1 is:

**filesystem-first, human-readable state.**

Avoid introducing SQLite in phase 1 unless discovery reveals a compelling technical reason that cannot reasonably be solved through the filesystem.

---

# Mandatory project filesystem model

Every project created from Mission Control must create a new project directory under:

`~/.openclaw/workspace/projects/`

For example:

`~/.openclaw/workspace/projects/energy-optimizer/`

`~/.openclaw/workspace/projects/customer-portal/`

`~/.openclaw/workspace/projects/mission-control/`

That project directory is the **canonical project workspace**.

Project creation in the UI must not merely insert a database record.

Creating a project means creating a real project workspace that OpenClaw agents can read and work with.

Likewise, Mission Control must discover existing project directories there.

Use a safe normalized project slug and prevent path traversal. A project must never be able to escape:

`~/.openclaw/workspace/projects/`

Do not permanently delete a project directory from a normal UI delete/archive action. Prefer archive semantics unless an explicit destructive action is intentionally designed later.

---

# Internal project directory structure

Do not blindly impose a detailed file schema before inspecting how the existing OpenClaw workspace is organized.

However, the project directory must ultimately provide durable places for concepts such as:

* project identity and mission;
* Project Lead;
* Jobs;
* task requirements;
* task threads;
* subtask relationships;
* decisions;
* research;
* development outputs/references;
* test results;
* marketing work;
* project documentation;
* external references such as GitHub repositories.

Prefer Markdown for human-readable content and small structured JSON/YAML metadata only where machines genuinely need structured state.

The files should remain understandable if I open the project directory directly in a terminal or Obsidian.

Do not hide the project's actual knowledge inside an opaque database.

During discovery, propose the exact internal project-folder convention and explain why before implementing it.

---

# The central distinction: Job vs OpenClaw Execution

This distinction is fundamental.

Do **not** make our project-management Job synonymous with a native OpenClaw task.

They represent different things.

## Job

A **Job** describes work that needs to be accomplished.

It can exist before any agent begins executing it.

A Job may spend hours or days being discussed, researched, clarified, delegated and refined.

A Job has things such as:

* project;
* title;
* requirements;
* status;
* current assignee;
* Project Lead;
* parent Job;
* child Jobs;
* discussion thread;
* decisions;
* research results;
* implementation result;
* test result;
* timestamps/history;
* external references;
* related OpenClaw executions.

## OpenClaw Execution

An **Execution** represents an actual runtime attempt to perform work.

This may correspond to a native OpenClaw:

* task;
* TaskFlow;
* subagent execution;
* cron execution;
* heartbeat-triggered run;
* or another native runtime unit discovered in the installed OpenClaw version.

One Job may have multiple executions.

Example:

**JOB-142 — Implement competitor price monitoring**

could have:

**Execution 1:** Developer investigates API
**Execution 2:** Developer implements code
**Execution 3:** Tester performs security review
**Execution 4:** Developer fixes rejected implementation
**Execution 5:** Tester retests

The Job remains one coherent business/work item while runtime executions provide evidence of the actual work performed.

The UI should make this relationship visible.

---

# Job workflow

The required workflow is:

**New → Backlog → In Progress → Testing → Done**

Testing is conditional.

A Job that does not require testing may follow:

**New → Backlog → In Progress → Done**

A software implementation Job should normally follow:

**New → Backlog → In Progress → Testing → Done**

Do not add dozens of workflow states.

Conditions such as:

* blocked;
* waiting for me;
* failed execution;
* waiting for subtask;
* awaiting review;

should normally be represented as secondary operational indicators, ownership or execution state rather than unnecessarily expanding the main workflow.

---

# Status: New

Every normal Job begins in **New**.

New is not merely an inbox.

It is the **requirements/discovery phase**.

I interact primarily with the project's Project Lead through the Job thread.

A Job may initially contain only something simple such as:

**"Add competitor price monitoring."**

The Project Lead is responsible for turning that into sufficiently complete work.

It should:

* understand the request;
* identify ambiguities;
* ask me questions when my decision is genuinely required;
* inspect existing project context;
* delegate research;
* ask technical questions;
* investigate user demand;
* investigate security implications;
* investigate regulatory implications where relevant;
* combine the results;
* update the Job requirements.

The Project Lead must not silently invent important product decisions.

---

# Task thread

Every significant Job needs a persistent thread.

The thread is part of the Job, not a generic global chat.

For parent Jobs, my primary counterpart should normally be the **Project Lead**.

The thread should preserve:

**question → discussion → investigation → subtask → result → decision → updated requirement**

Months later, I should be able to understand why an implementation decision was made.

A thread should therefore be useful as project history, not merely as a transient chat transcript.

The Project Lead should be able to update the Job's synthesized requirements independently from the raw conversation.

The current specification should be easy to find without reading fifty messages.

---

# Subtasks

Jobs must support parent/child relationships.

While a parent Job is still in New, the Project Lead may create child Jobs such as:

**Researcher**

* investigate competitor implementations;
* study competitor audiences;
* identify frequently requested features;
* investigate market trends;
* investigate legal/regulatory constraints.

**Developer**

* investigate technical feasibility;
* inspect current architecture;
* evaluate APIs;
* estimate implementation complexity;
* identify environment/service requirements.

**Tester / Security**

* identify security implications;
* identify test requirements;
* investigate reliability risks.

**Marketing Specialist**

* investigate market value;
* analyze user/customer feedback;
* investigate positioning;
* provide customer-facing implications.

These child Jobs are **real Jobs**.

They must appear on the main Jobs board.

They must have:

* their own status;
* assignee;
* project;
* parent Job;
* result;
* execution history.

Do not hide delegated work inside agent prompts.

**Delegation itself is part of the observable system.**

---

# Finishing requirements discovery

When prerequisite research/subtasks finish, the Project Lead must consume those results and update the parent Job.

The parent Job should contain a synthesized actionable requirement rather than simply a collection of links and agent outputs.

Once sufficiently defined, the Project Lead can move it from:

**New → Backlog**

At this point an implementation agent should be able to understand what is expected without reconstructing the requirements from unrelated conversations.

---

# Backlog and heartbeat pickup

**Backlog** means the Job is sufficiently defined and eligible for execution.

Agents should inspect work assigned to them during their OpenClaw heartbeat.

A heartbeat should allow an agent to determine:

* Jobs assigned to it;
* project;
* priority/order;
* parent context;
* requirements;
* dependencies;
* whether it is allowed to begin work.

When an agent actually starts a Job:

**Backlog → In Progress**

and the real OpenClaw execution must be associated with that Job.

Do not change a Job to In Progress merely because an agent has been assigned to it.

There should be evidence that work actually started.

---

# In Progress

The UI must make it immediately obvious:

**Agent → current Job → Project**

If I open an agent, I should be able to see its work.

If I open a project, I should see everyone currently working on it.

If I open a Job, I should see its current assignee and actual executions.

---

# Testing

Development work normally goes to **Testing** after Developer implementation.

The Tester / Security agent independently validates the work.

Its responsibilities include, where appropriate:

* functional testing;
* regression testing;
* code review;
* security review;
* configuration review;
* environment/deployment checks.

If testing fails:

**Testing → In Progress**

and assignment returns to the appropriate Developer with concrete findings attached.

The history must preserve that rejection.

Do not hide the loop by simply overwriting the task state.

When the Developer fixes the issue, it can return to Testing.

Non-code Jobs may skip Testing.

---

# Done

Done means the Job has an actual result.

A completed Job should retain the relevant outcome:

* summary;
* produced files;
* GitHub references;
* research;
* decisions;
* test report;
* final execution information;
* completion timestamp.

Do not treat "agent stopped running" as equivalent to "Job completed successfully."

---

# Assignee model

Every Job must have a current **assignee**.

The assignee represents:

**who currently has the ball.**

Possible assignees include:

* Chief of Staff;
* Project Lead;
* Developer;
* Researcher;
* Tester / Security;
* Marketing Specialist;
* temporary specialist subagent;
* **me**.

My user identity must be a valid assignee.

If the agent requires:

* an answer;
* decision;
* approval;
* credentials;
* business choice;
* requirement clarification;
* review;

the Job can become assigned to **me**.

The main UI must provide a strong:

**Needs My Attention**

view.

Do not create a hidden state where the agent says in chat that it is waiting for me but the dashboard still makes the task look actively owned by the agent.

---

# Extend NEEDS_INPUT into Job ownership

Investigate and reuse the existing Mission Control awareness / `NEEDS_INPUT` mechanism rather than replacing it.

Extend it so that when an execution related to a Job requires input from me:

1. the question remains durably visible;
2. the related Project and Job are known;
3. the Job is surfaced under **Needs My Attention**;
4. ownership/assignee becomes me when appropriate;
5. my answer returns into the relevant Job context;
6. responsibility can then return to the Project Lead or specialist agent.

Do not maintain two disconnected systems where Questions live in one inbox and Jobs know nothing about them.

---

# Agent crew

The organization should conceptually be:

**Me / Owner**

↓

**Chief of Staff**

↓

**Project Lead — one responsible lead per project**

↓

**Developer / Researcher / Tester-Security / Marketing Specialist / temporary specialist agents**

The hierarchy must be visible in Mission Control.

---

# Chief of Staff

The Chief of Staff coordinates the organization across projects.

Responsibilities include:

* awareness of all active projects;
* identifying stalled projects;
* cross-project prioritization;
* routing high-level work;
* escalating matters requiring my attention;
* ensuring projects have responsible Project Leads.

The Chief of Staff should not replace the Project Lead's responsibility for individual project execution.

---

# Project Lead

Every project must have **one clearly responsible Project Lead**.

The Project Lead owns the outcome of that project.

It is the local orchestrator.

It should:

* understand project objectives;
* maintain project context;
* discuss requirements with me;
* create Jobs;
* refine Jobs;
* create subtasks;
* delegate work;
* collect research;
* combine specialist results;
* decide when requirements are sufficiently clear;
* coordinate development and testing;
* work with Researcher and Marketing on future opportunities;
* monitor project progress;
* surface decisions requiring me.

When I discuss a parent Job, I should normally feel like I am speaking with one accountable person: the Project Lead.

---

# Developer

The Developer is responsible for technical execution.

Its scope includes:

* coding;
* architecture implementation;
* project configuration;
* development environment;
* services used by the project;
* integrations;
* database work;
* infrastructure directly associated with the project;
* deployment-related technical work where appropriate;
* technical investigation.

The Developer's work should always be attributable to a Job and Project.

---

# Researcher

The Researcher continuously supports the Project Lead with intelligence.

It should investigate:

* competitors;
* competitor features;
* competitor audiences;
* product positioning;
* customer complaints;
* requested functionality;
* emerging market expectations;
* new opportunities;
* relevant regulations;
* legal constraints when applicable.

Research output should answer:

**"What does this mean for our project?"**

not merely collect URLs.

Useful discoveries should be capable of generating proposed Jobs.

---

# Tester / Security

The Tester is independent from the Developer.

It validates implementation and performs security-oriented review.

It can reject Developer work.

Rejection should produce actionable findings and send the Job back through the visible workflow.

The Tester should not modify the Developer's implementation silently just to make tests pass unless explicitly assigned development work.

---

# Marketing Specialist

Marketing owns project growth and external communication under the Project Lead.

It should:

* develop marketing strategy;
* execute approved marketing work;
* observe customer feedback;
* monitor positioning;
* cooperate with Researcher;
* cooperate with Project Lead;
* identify feature opportunities;
* turn meaningful market feedback into proposed Jobs.

Marketing should be part of the product feedback loop, not a disconnected content generator.

---

# No invisible work rule

This rule is critical:

**Every meaningful piece of work performed by the autonomous project organization must be attributable to a Job.**

If an agent delegates meaningful work to a subagent:

**create child Job → assign it → run execution → attach result**

not:

**spawn hidden subagent → silently consume result**

Every Job must also identify its Project.

Avoid project-less work.

For legitimate organization-wide infrastructure or internal maintenance that does not belong to a customer/product project, use a clearly designated internal/Operations project rather than creating orphaned Jobs.

This is essential for accountability.

---

# Projects screen — IMPLEMENT NEW

Build a first-class **Projects** domain and screen.

The upstream Mission Control is the foundation, but Projects is a new primary layer for this fork.

The Projects screen should answer:

* What are my projects?
* Who is responsible for each one?
* What is happening now?
* What is blocked?
* What requires me?
* What recently finished?
* What will move the project forward next?

Every project should correspond to its real directory under:

`~/.openclaw/workspace/projects/<project-slug>/`

Opening a project should provide a coherent operational view across:

**Project Lead + Jobs + agents + executions + documents + research + GitHub activity + project knowledge**

Do not display fake precision such as an arbitrary "73% complete" unless that percentage has a defensible underlying meaning.

Project progress should reflect real milestones/work state.

---

# Jobs screen — IMPLEMENT / REWORK

Our main work board should be called **Jobs** in the product terminology.

The existing native OpenClaw Tasks functionality should not be discarded.

Instead, change its role.

Mission Control needs two connected concepts:

### Jobs

Human/project-level units of work.

Workflow:

**New / Backlog / In Progress / Testing / Done**

### Executions

Native OpenClaw runtime activity proving what actually ran.

The primary Jobs interface should provide filters/views for:

* Project;
* assignee/agent;
* status;
* parent Job;
* Needs My Attention;
* active work.

I must be able to answer both:

**"What is Agent X doing?"**

and:

**"What work exists for Project Y?"**

without changing tools.

Retain a lower-level native execution view for diagnostics and auditing.

Do not destroy useful upstream OpenClaw task/TaskFlow visibility just because Jobs become the primary UX.

---

# Team / Agents screen — EXTEND

Do not replace the existing agent/runtime infrastructure.

Extend it into the **Team** concept.

The screen should show:

**Owner → Chief of Staff → Project Leads → Specialists**

Use the existing real OpenClaw agents and subagents wherever possible.

Each agent card should surface useful live context such as:

* role;
* parent/manager relationship;
* project;
* current Job;
* actual activity state;
* last activity;
* relevant runtime state.

An agent should not appear "working" simply because it exists or has a Job assigned.

Working status should be derived from real underlying activity.

---

# Existing functionality to KEEP and reuse

Do not rebuild working upstream functionality without a clear architectural reason.

Preserve the existing capability behind:

### Dashboard / system overview

Keep live OpenClaw/gateway/system visibility.

Later, enhance the main dashboard with Project/Job summaries, but do not destroy existing operational health information.

### Chat

Keep the ability to communicate with agents.

Our Job Thread is a contextual layer on top of project work; it does not mean generic agent chat must disappear.

### Cron

Keep existing native cron management and run history.

Cron is not part of phase-1 product redesign.

Eventually Jobs created/generated by cron may be linked to projects where appropriate.

### Usage / cost visibility

Keep existing token/model/agent usage capability.

Later, add Project/Job attribution where reliable.

### Memory

Keep existing memory browsing/editing/search capability.

Do not reimplement memory in phase 1.

Later, make project-specific memory/context easier to surface from a Project.

### Documents / Search

Keep the existing workspace document browser/search functionality.

Our project directories should naturally become visible to it.

### Models / credentials

Keep existing provider/model/account management.

### Doctor / Gateway

Keep existing health and diagnostics.

### Terminal

Keep the existing terminal functionality.

### Security / Permissions

Keep existing security audit and agent permission management.

These become particularly valuable with autonomous developer agents.

### Tailscale / remote access functionality

Preserve rather than rewrite it.

### Error isolation / error boundaries

Preserve upstream resilience patterns.

A broken Projects or Jobs view should not take down the entire Mission Control.

---

# Existing functionality to EXTEND

The following upstream areas should be reused but adapted to our model.

## Agents → Team

Keep real OpenClaw agent discovery and activity information.

Add:

* organization hierarchy;
* role;
* project responsibility;
* Project Lead ownership;
* current Job;
* work-by-agent views.

## Native Tasks → Executions underneath Jobs

Keep native task/TaskFlow information.

Associate it with our Jobs.

Native execution status must not replace Job workflow state.

## Questions / NEEDS_INPUT → Needs My Attention

Keep the durable input-request mechanism.

Connect questions directly to Project + Job + assignee.

## Heartbeat → Job pickup protocol

Extend agent heartbeat behavior so that agents discover Jobs assigned to them and eligible to run.

Do not replace native heartbeat infrastructure unnecessarily.

## Memory → project context

Keep global memory functionality.

Allow agents to reliably find and use project-specific context from:

`~/.openclaw/workspace/projects/<project>/`

## Documents → project-aware documents

Keep the document viewer/search.

Add project attribution when files belong to a project directory.

## Discord → operational notifications

Keep OpenClaw Discord/channel integration.

Add carefully selected Mission Control events rather than building a separate Discord stack.

---

# Functionality to IMPLEMENT NEW

The primary new capabilities are:

## Projects domain

Persistent project identity based on real project directories.

## Project creation

Creating a project creates:

`~/.openclaw/workspace/projects/<slug>/`

and establishes its initial project metadata/context.

## Project Lead ownership

Exactly one responsible Project Lead per project unless we later intentionally change the model.

## Jobs persistence

Durable project-management work items independent of temporary OpenClaw execution records.

## Job workflow

**New → Backlog → In Progress → Testing → Done**

## Job assignee

Including agents and me.

## Parent Jobs / child Jobs

Required for delegation.

## Job threads

Persistent contextual discussions.

## Requirements synthesis

Project Lead must be able to convert discussion and research into a maintained current specification.

## Job results

Specialist output becomes a durable result consumed by parent Jobs.

## Job ↔ execution mapping

Connect project-management work to real OpenClaw runtime evidence.

## Job history / audit trail

Important state changes should remain understandable:

* assignment;
* status change;
* delegation;
* execution;
* rejection;
* approval;
* completion.

## Project-level work views

Jobs by Project.

## Agent-level work views

Jobs by Agent.

## Needs My Attention

A first-class view of work currently waiting on me.

## Project creation/discovery protocol

Mission Control and agents must agree that:

`~/.openclaw/workspace/projects/`

is the canonical location for project workspaces.

---

# GitHub integration — day one

GitHub is required.

Do not build a generic replacement for GitHub.

First inspect what GitHub/OpenClaw integration, credentials and skills already exist on the server.

A Project should be able to reference its actual GitHub repository or repositories.

Development Jobs should be able to expose relationships to relevant:

* branch;
* commit;
* issue;
* pull request;
* review.

Where practical, establish a predictable correlation convention so Git activity can be traced back to a Job.

For example, branch/PR/commit naming or metadata can contain the Job identifier.

Do not force every research or marketing Job to create a GitHub issue.

GitHub linkage should serve development traceability, not bureaucracy.

The important chain is:

**Project → Job → Developer → Code Change → Tester → Result**

Use real GitHub data.

No mocked repository information.

---

# Discord integration — day one

Discord is required.

Reuse the existing OpenClaw channel integration rather than creating an unrelated messaging implementation.

Mission Control should send useful operational notifications, particularly:

* Needs My Attention;
* important blocker;
* failed critical execution;
* testing rejection;
* meaningful completion;
* high-value Project Lead question.

Avoid sending every heartbeat, subagent message or trivial state transition.

Mission Control is the canonical operations interface.

Discord is the notification/communication bridge.

---

# Obsidian integration — day one

Obsidian is required, but implement it filesystem-first.

The project workspace should contain human-readable Markdown that can be consumed naturally by Obsidian.

Do not create a second proprietary knowledge store just for Obsidian.

During discovery:

1. determine whether an Obsidian vault already exists;
2. determine how it relates to `~/.openclaw/workspace/`;
3. inspect existing file conventions;
4. propose the safest integration.

Prefer interoperability through Markdown/filesystem structure.

Do not move an existing vault, create destructive symlinks, or reorganize existing notes without approval.

The desired outcome is that useful project knowledge can be viewed both through Mission Control and through Obsidian without maintaining two divergent copies.

---

# Visual direction

Match the supplied inspiration screenshots closely in visual language, while adapting the layouts to our information architecture.

The references show:

* very dark navy / blue-black background;
* fixed dark left navigation;
* cyan/electric-blue active borders and glow;
* restrained violet/magenta accents;
* red/yellow for operational warning states;
* dark layered cards;
* thin borders;
* restrained rounded corners;
* compact status badges;
* small glowing state dots;
* clean sans-serif primary typography;
* monospace treatment for operational metadata;
* strong hierarchy labels;
* pixel-art agent identities.

The overall feeling should be:

**cyberpunk operations center × serious developer tooling × autonomous organization**

not:

**generic SaaS admin template**

Do not sacrifice information density or readability for neon decoration.

---

# Pixel-art agents

Give persistent agents recognizable pixel-art identities inspired by the screenshots.

The references use small colorful octopus-like agent characters.

We can use the same general motif without copying the source artwork exactly.

Each agent should become visually recognizable over time.

Use avatar/color differentiation for:

* Chief of Staff;
* Project Leads;
* Developer;
* Researcher;
* Tester/Security;
* Marketing.

Do not make it childish.

These agent identities should later be reusable if we implement the Visual Office screen.

Do not build Visual Office in phase 1.

---

# Navigation priority

Projects, Jobs and Team are the primary product surfaces.

The rest of the existing Mission Control capabilities should remain accessible, but they are secondary to the operational workflow.

A sensible information hierarchy is more important than preserving the exact existing sidebar ordering.

Do not delete mature functionality just to make the sidebar smaller.

Group lower-level OpenClaw/system-management functions logically if necessary.

---

# Use REAL OpenClaw data from day one

This requirement is non-negotiable.

**Do not use mock data to build the product.**

Before implementing the new screens, inspect the real machine.

Explore at least:

`~/.openclaw/`

`~/.openclaw/workspace/`

`~/.openclaw/workspace/projects/`

`memory/YYYY-MM-DD.md`

`MEMORY.md`

`USER.md`

`AGENTS.md`

OpenClaw configuration

OpenClaw agents

subagents

native tasks

TaskFlows

heartbeats

cron jobs

Mission Control Questions

OpenClaw plugins

skills

documents

logs/activity

existing GitHub configuration

existing Discord configuration

existing Obsidian/vault structure

existing project-like directories or conventions

Do not assume the installation exactly matches upstream documentation.

Inspect what is really installed.

---

# Discovery classification

For Projects, Jobs and Team, explicitly classify every required data source as:

**Existing**
Already present in OpenClaw/Mission Control and can be reused.

**Derivable**
Not explicitly stored but can be reliably derived from existing state.

**Needs durable state**
Does not currently exist and requires a new filesystem convention.

Do this before designing the final persistence format.

---

# No competing source of truth

Avoid architecture like:

**OpenClaw thinks Agent A is doing X**

while:

**Mission Control database thinks Agent A is doing Y.**

The dashboard must distinguish between:

### Intent / management state

Project, Job, workflow, assignment, requirements.

and:

### Runtime truth

What OpenClaw is actually executing.

Mission Control can combine these two layers, but it must not confuse them.

---

# Activity truth

Do not mark an agent as **Active / Working** solely because:

* it exists;
* it has a Job assigned;
* its status field says "busy";
* a mock timer is running.

Working state should be based on real runtime evidence.

Likewise:

**Job In Progress** and **agent currently executing** are related but not identical concepts.

A Job may remain In Progress while waiting between executions.

Represent this distinction clearly.

---

# Project progress

Do not invent a percentage merely because dashboards usually have progress bars.

Project progress must be defensible.

Prefer useful indicators such as:

* active Jobs;
* completed Jobs;
* current milestone;
* blocked work;
* Needs My Attention;
* recent progress;
* testing failures;
* last meaningful activity.

If a numeric percentage is used, document exactly how it is calculated.

---

# Phase 1 scope

Phase 1 should deliver a working vertical slice, not three disconnected mock screens.

The minimum useful chain is:

**real project directory**

→ **real Project**

→ **real Project Lead**

→ **real Job**

→ **real assignee**

→ **real Job workflow**

→ **heartbeat pickup**

→ **real OpenClaw execution**

→ **visible result**

→ **testing/rejection where applicable**

→ **Done**

A good demonstration would be one real development Job that moves through this chain.

---

# Phase 1 should NOT focus on

Do not spend phase-1 effort building:

* Calendar redesign;
* Visual Office;
* a new Memory application;
* a new Documents application;
* sophisticated analytics;
* custom reporting;
* decorative animations;
* enterprise multi-tenancy;
* unnecessary databases;
* Kubernetes/container orchestration for Mission Control itself.

Existing upstream screens may remain.

The priority is getting the **Project/Job/Agent operational model correct**.

---

# What we're deliberately reusing as-is vs extending vs implementing

Think about the fork in three categories.

## KEEP / REUSE

Preserve working infrastructure and functionality for:

**OpenClaw connection and discovery
Gateway/CLI transport
Dashboard health information
Chat
Cron management
Usage/cost tracking
Memory
Documents/Search
Models
Accounts/Credentials
Doctor/Gateway diagnostics
Terminal
Channels
Security
Permissions
Tailscale
Error boundaries / resilience
existing setup/service infrastructure**

Fix upstream bugs where necessary, but do not redesign these simply because we can.

## EXTEND

Build on top of existing functionality for:

**Agents → Team / organization hierarchy**

**native OpenClaw Tasks/TaskFlows → Execution layer linked to Jobs**

**Questions / NEEDS_INPUT → Needs My Attention + Job assignment**

**Heartbeat → assigned Job discovery/pickup**

**Documents → project attribution**

**Memory → project context awareness**

**Discord → project/job operational notifications**

**Dashboard → project/job operational summary**

**Usage → eventual Project/Job attribution where reliable**

## IMPLEMENT NEW

Create:

**Projects domain**

**`~/.openclaw/workspace/projects/<slug>/` convention**

**Project creation/discovery**

**Project Lead ownership**

**Jobs domain**

**Job workflow**

**Job assignees**

**parent/child Jobs**

**Job threads**

**requirements synthesis**

**Job results**

**Job history/audit trail**

**Job ↔ OpenClaw Execution relationship**

**Jobs by Project**

**Jobs by Agent**

**Needs My Attention**

**GitHub project/job traceability**

**Obsidian project knowledge integration**

These distinctions are architectural guidance, not an excuse to preserve poor upstream implementation. If something must change to support the model cleanly, explain why.

---

# Testing expectations

Before changing the codebase, establish the upstream baseline.

After implementation, verify at minimum:

* application builds under Node.js v26.7.0;
* application starts successfully;
* existing important Mission Control screens still load;
* real OpenClaw connection works;
* project creation creates the correct filesystem directory;
* invalid project slugs cannot escape the projects directory;
* project discovery works after application restart;
* Job state survives application restart;
* parent/child Jobs survive restart;
* thread survives restart;
* assignee survives restart;
* heartbeat can discover eligible assigned work;
* real execution can be correlated to a Job;
* agent view shows work by agent;
* project view shows work by project;
* NEEDS_INPUT can surface a related Job to me;
* Developer → Tester → Developer rejection loop is preserved in history;
* Discord integration does not spam;
* GitHub references use real data;
* no test/demo/mock project appears in my real production project list.

Use automated tests where they provide value, especially for state transitions and filesystem safety.

---

# Migration / compatibility

Do not destroy existing upstream user state.

Before changing Tasks behavior, determine what state the currently installed Mission Control already has and how it is stored.

If migration is necessary:

* make it explicit;
* make it reversible where practical;
* back up affected small state files;
* explain what changed.

Existing native OpenClaw task history should remain accessible.

The fork should be installable over the existing environment without deleting OpenClaw state.

---

# What I'm NOT going to specify

I am deliberately not specifying the exact React component hierarchy, file names inside each project, TypeScript interfaces, API route layout, thread serialization format, state-management library, exact sidebar structure, exact card layout, animation implementation, or every metadata field.

Those decisions are yours.

Treat this as a brief for a senior engineer/product collaborator, not a step-by-step specification for a junior developer.

Make strong technical decisions.

Prefer simple architecture.

Prefer existing OpenClaw primitives.

Prefer filesystem-readable state.

Avoid duplication.

Ask me only about genuinely ambiguous product decisions that materially change behavior.

Do not ask me questions whose answers you can determine by inspecting the repository or server.

---

# Process I want

## Step 1 — Inspect upstream

Understand the fork before changing it.

Identify:

* architecture;
* OpenClaw abstraction layer;
* native Tasks/TaskFlows;
* Agents;
* Heartbeat;
* Questions/NEEDS_INPUT;
* Documents;
* Memory;
* Channels;
* Discord;
* current persistence files;
* API routes;
* test structure;
* setup/systemd behavior.

Do not begin with visual redesign.

---

## Step 2 — Inspect my real OpenClaw workspace

Inspect the actual server and tell me what exists.

Especially inspect:

`~/.openclaw/workspace/`

and:

`~/.openclaw/workspace/projects/`

Do not create fake projects just to populate the UI.

---

## Step 3 — Gap analysis

For each requested capability, tell me:

**reuse as-is / extend / implement new**

and explain briefly why.

Also tell me what data will be canonical and where it will live.

---

## Step 4 — Propose filesystem model

Propose the internal structure of:

`~/.openclaw/workspace/projects/<project>/`

including how you intend to persist:

* project metadata;
* Jobs;
* threads;
* parent-child relationships;
* results;
* history.

Keep it simple and human-readable.

Wait for approval if the choice has meaningful long-term consequences.

---

## Step 5 — Propose phased build

Do not immediately generate a huge implementation.

Propose a sequence of vertical slices.

Phase 1 must prove:

**Project → Job → Agent → OpenClaw Execution → Result**

with real data.

---

## Step 6 — Wait for approval

Show me:

* what you found;
* what you intend to reuse;
* what you intend to extend;
* what you intend to implement;
* proposed persistence structure;
* proposed phases;
* genuine unresolved questions.

Then wait.

---

## Step 7 — Implement phase 1

After approval, implement against the real server and workspace.

Do not use mock data.

Do not silently change Node.js.

Do not silently replace working upstream OpenClaw functionality.

---

## Step 8 — Demonstrate with real work

Create or use a real project and demonstrate an actual workflow.

I want to see something like:

**Project**

→ parent Job in New

→ Project Lead discussion

→ Researcher child Job

→ real Researcher execution

→ result returned

→ requirements updated

→ Backlog

→ Developer execution

→ Testing

→ Tester rejection or approval

→ Done

The result must survive application restart.

---

## Step 9 — Review and iterate

Show me:

* what changed;
* new files/directories;
* modifications to upstream;
* what data is real;
* what is derived;
* what state Mission Control added;
* how OpenClaw finds Jobs;
* how heartbeat pickup works;
* how assignments work;
* how executions map back to Jobs;
* what remains for phase 2.

Then get feedback before expanding scope.

---

# Mission statement

**Build an autonomous project organization whose work remains completely understandable and controllable by me. Mission Control must let me see what every agent is doing, what work exists inside every project, why that work exists, how responsibilities are delegated, and exactly when my input is required.**

The goal is not maximum autonomous activity.

The goal is:

**useful autonomous progress with visible responsibility, traceable delegation and verifiable execution.**

---

# North-star test

At every product and architecture decision, ask:

> **Can I open Mission Control and understand the true state of my autonomous organization within 30 seconds?**

I should immediately understand:

**What is happening?
Who owns it?
For which project?
Why is it happening?
What is blocked?
What needs me?
What actually ran?
What happens next?**

If Mission Control cannot answer those questions, improve the model before adding more visual features.

The most important feature is not pixel art.

It is the connection:

**Project intent → accountable Job → assigned agent → real execution → observable result.**

---

# Validated discovery and implementation decisions

The initial discovery gate has been completed against the real server and upstream source. The following facts and decisions are now part of this specification.

## Validated runtime baseline

* Node.js: `v26.7.0` — mandatory for development and production.
* OpenClaw: `2026.7.1-2` (`0790d9f`).
* Workspace: `~/.openclaw/workspace/`.
* Canonical project directory: `~/.openclaw/workspace/projects/mission-control/`.
* Upstream commit: `4c64bab32390e9e8f863df5279133dbc22350c04`.
* Upstream package: `@openclaw/dashboard` v0.15.0.
* Upstream production build succeeds under Node.js v26.7.0.
* Baseline test result: 373 passed, 3 failed, 1 skipped. The failures predate ClawOps changes and concern the awareness interaction store, principally the missing system `sqlite3` executable. They must remain classified separately from regressions introduced by ClawOps.
* GitHub CLI is authenticated as `iaxus-denev`; creation of the actual remote fork remains an explicit external action.
* `~/.openclaw/workspace/projects/` exists and contained no pre-existing projects before this project directory was created.
* No Obsidian vault was discovered under the user home directory.
* No Discord channel/account is currently configured in OpenClaw.
* Only the real persistent OpenClaw agent `main` is currently configured. Organizational roles must not be represented as active runtime agents until corresponding agents actually exist.

## Canonical state boundaries

Mission Control must expose two explicitly separate layers:

1. **Management intent:** Projects, Jobs, requirements, assignee, workflow state, dependencies and decisions. This is canonical in human-readable project workspace files.
2. **Runtime truth:** sessions, native tasks, TaskFlows, subagents, cron and heartbeat executions. This remains canonical in OpenClaw and is referenced rather than copied.

A Job may be `In Progress` while no execution is currently running. Conversely, an uncorrelated OpenClaw execution must not silently create or mutate a Job. The UI must communicate this distinction clearly.

## Approved phase-1 persistence convention

Unless implementation uncovers a concrete blocker, use this filesystem-first schema:

```text
~/.openclaw/workspace/projects/<slug>/
├── project.json
├── README.md
├── AGENTS.md
├── jobs/
│   └── JOB-0001/
│       ├── job.json
│       ├── requirements.md
│       ├── thread.md
│       ├── result.md
│       ├── history.jsonl
│       ├── executions.json
│       └── attachments/
├── decisions/
├── research/
├── development/
├── testing/
├── marketing/
└── references/
    └── github.json
```

Rules:

* Do not maintain a separate mutable `jobs/index.json`; derive board indexes from canonical Job directories.
* JSON contains compact machine state; Markdown contains knowledge intended for people and agents.
* `history.jsonl` is append-only and records status, assignment, delegation, execution, input, rejection, approval and completion events.
* `executions.json` stores correlation references only; live execution state remains in OpenClaw.
* Writes must be atomic and concurrency-safe.
* Normal deletion is archive-only.
* Schema files carry `schemaVersion`, and future migrations must be explicit and testable.

## Identifier and path-safety contract

* Project slug: lowercase ASCII letters, digits and internal hyphens only; recommended validation: `^[a-z0-9]+(?:-[a-z0-9]+)*$`.
* Job IDs are immutable and project-local, formatted `JOB-0001`, `JOB-0002`, and so on.
* User-provided paths, IDs and filenames must never be interpolated directly into filesystem paths.
* Resolve and canonicalize every target; reject anything outside the canonical projects root.
* Reject absolute paths, dot segments, slash/backslash traversal, encoded traversal and symlink escape.
* Project discovery must survive application restart and must not depend on an in-memory-only index.

## Workflow invariants

* New Jobs begin in `New`.
* `New → Backlog` requires actionable synthesized requirements.
* Assignment alone never moves a Job to `In Progress`.
* `Backlog → In Progress` requires recorded runtime start evidence and an associated execution.
* Software implementation normally requires `Testing`; skipping it must be explicit and auditable.
* Testing rejection records concrete findings, returns the Job to `In Progress`, and assigns responsibility to the appropriate Developer.
* `Done` requires a durable result and completion timestamp; runtime termination alone is insufficient.
* Parent completion must not silently erase or conceal incomplete child Jobs.
* Any meaningful delegated execution requires a visible child Job before execution begins.
* An input request that genuinely transfers responsibility must assign the Job to the owner and appear in Needs My Attention. Answering it must be capable of returning responsibility to the previous agent.

## Execution correlation contract

Each launched execution associated with a Job must carry a stable correlation envelope where supported:

* project slug;
* Job ID;
* execution purpose (`research`, `implementation`, `testing`, `fix`, or another explicit value);
* responsible agent ID;
* parent execution ID where relevant.

Mission Control must preserve both directions of navigation:

* Job → all related executions;
* Execution → related Project and Job.

Correlation failure must be visible as `unlinked` rather than guessed.

## Phase-1 delivery gates

Phase 1 is complete only when all of the following are demonstrated with real state:

1. The actual GitHub fork preserves history and has `origin` pointing to the owner's fork and `upstream` to `robsannaa/mission-control`.
2. Baseline environment and pre-existing failures are captured in the repository.
3. Project creation/discovery and path-safety tests pass.
4. Job, child Job, thread, requirements, assignee, result and history survive application restart.
5. A heartbeat can discover eligible assigned Backlog work without treating assignment as execution.
6. A real OpenClaw execution is linked to its Job and changes the runtime evidence shown in the UI.
7. Projects, Jobs, Team and Needs My Attention use real filesystem/OpenClaw data only.
8. The Developer → Tester → Developer rejection loop is preserved in append-only history.
9. GitHub references resolve to real repository data.
10. Discord behavior is implemented through OpenClaw channels, is deduplicated/rate-limited, and degrades honestly while Discord is unconfigured.
11. Existing important upstream screens still load and the production build succeeds under Node.js v26.7.0.
12. No test fixture or demo project appears in the production project list.

# Discovery gate — completed

The original first-response discovery requirements below have been fulfilled. They remain as historical process requirements and do not need to be repeated before Phase 0/Phase 1 begins.

Your first response to this brief must NOT be finished code.

First:

**(a)** inspect the fork/upstream repository and describe the relevant architecture you found;

**(b)** inspect my real OpenClaw installation and `~/.openclaw/workspace/`;

**(c)** describe what already exists versus what needs extending versus what needs implementing;

**(d)** propose the project-directory/persistence model;

**(e)** confirm Node.js v26.7.0 and baseline build/test status;

**(f)** propose a phased implementation plan;

**(g)** ask only genuinely unresolved clarifying questions.

Then wait for my approval before implementing phase 1.

**Paste this brief to your OpenClaw agent / Claude Code / Cursor together with the inspiration screenshots.**
