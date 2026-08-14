---
title: How I build now
date: 2026-08-14
description: Agentic first. Claude Code does the typing, I do the thinking.
---

Somewhere in the last year the job changed shape. I still decide what gets built, how it's structured, and what good looks like when it's done. I just don't type most of it anymore.

The loop is simple. I write down what I want, sharply enough that it can't be misread. Claude Code runs inside VS Code with the whole repo in view: it plans, edits, runs the checks, and hands me a diff. I read that diff the way I'd review a teammate's pull request. Anything sloppy goes back with a note. Then it ships.

None of that works on vibes. It works because the repo is built for it. Here's what a project of mine actually carries.

**CLAUDE.md** sits at the root. It's the file the agent reads before anything else, and the first section is a resume protocol: read the status file, check the last few commits, run the gate, and if the gate is red, fix that before starting anything new. Below that live the commands, the non-negotiables, and the layout of the repo. The non-negotiables are the decisions I never want relitigated: the product lines that don't move, the engineering rules that don't bend. An agent with fresh context every session needs the constitution written down, or it will cheerfully reinvent last month's mistakes.

**STATUS.md** holds a cursor: one line naming the single next piece of work. Sessions end by moving it. If a session has to stop in the middle, it commits whatever is green and writes a mid-slice note saying what's done and what the next concrete step is, so the following session starts in seconds instead of re-deriving state. There's also a session log, one row per session, which turns out to be the most honest project history I've ever had.

**docs/** is the plan, as numbered files: what the product is, how it's architected, the roadmap, how testing works. The roadmap stays coarse on purpose. Each unit of work gets its own slice doc under docs/slices/, and those are written just in time, at the phase boundary, not months ahead. A detailed plan for work that's six weeks out is fiction with good formatting.

**One verify command** runs the whole gate: lint, typecheck, build, unit tests, end-to-end tests. It has to be green before a slice is ticked, and it's the same command locally and in CI. Budgets live next to it as committed files, coverage floors and performance ceilings in JSON, so "we got slower" or "we got less tested" shows up as a red diff instead of a feeling. The floors are deliberately tight. A ratchet with slack in it isn't a ratchet.

**Sizing** is the quiet rule that makes the rest work. One slice per session, sized to fit in one context window. If a slice looks bigger than a session, it gets split in the doc before anyone starts. Quality falls off a cliff when the task outgrows the head it has to fit in, and that's as true for agents as it was for me.

When there's more work than one session can hold, I fan out. Each stream runs in its own git worktree with its own service stack, fenced to its own files, and one orchestrator session does no coding at all: it delegates, relays, and reconciles. A batch of parallel agents with an idle architect in the middle beats four agents racing each other on coupled code, every time.

And the docs stay honest or they die. If code diverges from a doc, the doc changes in the same commit. A recorded number carries the command and date that produced it, because numbers rot. When something bites, the lesson gets written into the repo where the next session will read it, so a mistake only costs once.

One layer up from any repo sits a **global CLAUDE.md** in my home directory: the house rules that follow me into every project. It carries the testing doctrine, the important half of which is what not to do: tests serve the spec, not the code, so an expected value is never pasted in from whatever the implementation happens to produce, and a failing test's default suspect is the code, never the assertion. It carries verification discipline: any sha, ID, or count I assert gets copied from command output, never typed from memory, and claims about external state get settled by a live probe, not by what sounds plausible. Rules like these exist because each one is a scar. Every line in that file is a mistake I watched happen and don't intend to fund twice.

The same file sets the default working mode: [ponytail](https://ponytail.dev/), a ruleset that makes the agent write the least code that works, like a senior dev who's been paged at 3am one too many times. Lazy, where lazy means efficient. Before writing anything the agent climbs a ladder and stops at the first rung that holds: does this need to exist at all, does the codebase already have it, does the stdlib do it, does the platform, does a dependency we already ship, can it be one line. Only then the minimum code that works. No unrequested abstractions, no scaffolding for later, deletion over addition, boring over clever. Deliberate shortcuts get a comment naming the ceiling so future me knows the corner was cut on purpose. The best code is code never written, and an agent has to be told that explicitly, or it will hand you a framework when you asked for a function.

This site is a fair example of the loop end to end. The CRT terminal, the plain-HTML twins, the Cloudflare Pages deploys: I picked the direction and set the constraints, the agent did most of the typing, and every line got read before it went live. Eleven pages, a few KB each, built in an afternoon of review instead of a week of writing.

The surprise is that the senior skills got more valuable, not less. Cutting scope, smelling a wrong abstraction in a diff, knowing which corner is safe to cut and which one isn't: that was always the actual job. The typing was never the hard part.

It bites if you let it. An agent will happily build the wrong thing, beautifully. It will also happily tell you a test passed against a build that predates your change, or read the wrong container's database and report a defect that doesn't exist. So the rules I hold: the spec comes from me, tests come from the spec and not from the code, a guard test doesn't count until I've watched it fail, every claim gets verified by running the real thing against the artifact that actually contains the change, and diffs stay small enough to actually read. Review is the whole game now.

```
$ ps
  PID TTY   CMD
    1 tty1  -zsh
   42 tty1  claude code
```
