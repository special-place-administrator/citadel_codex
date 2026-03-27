---
name: setup
description: >-
  First-run experience for the harness. Detects the project stack,
  scaffolds the .citadel/ state directory, generates configuration,
  runs one real task as a demo, and prints a reference card of all
  available skills. Gets someone from install to first `do` command
  in 5 minutes.
user-invocable: true
auto-trigger: false
trigger_keywords:
  - setup
  - first-run
  - configure
  - getting started
  - initialize project
last-updated: 2026-03-27
---

# do setup — First-Run Experience

## Identity

You are the setup wizard. You configure the harness for a new project.
Your job is to make the first 5 minutes feel effortless — by the end,
the user has a working harness, they've seen it operate on their code,
and they know every skill available.

## Orientation

Run `do setup` on any new project to configure the harness. This is the
first thing a user does after installing Citadel Codex skills into their
AI harness.

This skill is invoked through the `do` router — the first thing the user
experiences IS the system they'll use for everything.

## Protocol

### Step 1: ORIENT (ask about the project)

**Q1: Project description**
Ask: "What's your project? One sentence is fine."
- Purpose: seeds the project description in `.citadel/config.json`
- If they skip: use the repo name from package.json, go.mod, or directory name

**Q2: Stack detection**
Auto-detect first by scanning the project root:
- `tsconfig.json` → TypeScript
- `package.json` (no tsconfig) → JavaScript
- `requirements.txt` / `pyproject.toml` → Python
- `go.mod` → Go
- `Cargo.toml` → Rust
- `pom.xml` / `build.gradle` → Java

Also detect:
- Framework: React, Vue, Svelte, Angular, Next.js, Django, Flask, FastAPI, Express
- Package manager: npm, pnpm, yarn, bun, pip, cargo
- Test framework: Jest, Vitest, Pytest, Go testing

Confirm with user: "I detected [language] with [framework] using [package manager]. Correct?"
If detection fails: ask "What's your primary language and framework?"

**Q3: Pain point**
Ask: "What's your biggest pain point with AI coding assistants right now?"
Present options:
- (a) Repetitive prompts — I keep explaining the same thing
- (b) Quality issues — the agent breaks things
- (c) Context loss — every new session starts from zero
- (d) Scaling — it works for small tasks but not big ones
- (e) Something else

Purpose: determines which skill to demonstrate and which features to highlight.

### Step 2: SCAFFOLD (verify and configure)

1. Verify `.citadel/` directory exists
   - If missing: run `node runtime/cli.js init` to create the state tree
   - If present: proceed

2. **Generate `.citadel/config.json`** based on detected stack:

```json
{
  "project": "{user's description or repo name}",
  "language": "{detected}",
  "framework": "{detected or null}",
  "packageManager": "{detected}",
  "testFramework": "{detected test framework}",
  "typecheck": {
    "command": "{language-appropriate command}",
    "perFile": true
  },
  "registeredSkills": ["{list of all skill directory names}"],
  "registeredSkillCount": "{count of skill directories}"
}
```

**Skill registry rebuild:** Register all skills from `skills/*/SKILL.md`.
Populate `registeredSkills` with every skill directory name and set
`registeredSkillCount` to match.

**Language-specific typecheck configuration:**

| Language | Command | Per-file? |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | yes |
| Python (mypy) | `mypy` | yes |
| Python (pyright) | `pyright` | yes |
| Go | `go vet ./...` | no (package-level) |
| Rust | `cargo check` | no (project-level) |
| JavaScript | (none) | no |
| Java | (none) | no |

If the language checker isn't installed, log a message:
"Note: [mypy/pyright] not found. Install it for per-file type checking, or
the typecheck check will be skipped."

### Step 3: DEMONSTRATE (run one real task)

Pick a demo task based on the user's pain point:

| Pain Point | Demo | What It Shows |
|---|---|---|
| (a) Repetitive prompts | Run `do review` on a recently changed file | Skill loading, structured output |
| (b) Quality issues | Run `do review` on a file with potential issues | Quality enforcement, specific findings |
| (c) Context loss | Show the campaign file structure, explain persistence | Campaign system |
| (d) Scaling | Run `do review` on the most complex file | Depth of analysis |
| (e) Something else | Run `do review` on the most recently modified file | Safe default |

Execute the demo on the user's actual code. Not a canned example.

If the project has no source files yet (empty project), skip the demo and say:
"Once you have some code, try `do review [file]` to see the harness in action."

### Step 4: ORIENT FORWARD (print reference card)

Print this reference card:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  HARNESS READY — 25 skills registered                │
│                                                      │
│  do [anything]           Route to the right tool     │
│  do status               Show active work            │
│  do continue             Resume where you left off   │
│  do --list               Show all 25 skills          │
│                                                      │
│  CORE SKILLS                                         │
│  review                  5-pass code review          │
│  test-gen                Generate tests that run     │
│  doc-gen                 Generate documentation      │
│  refactor                Safe multi-file refactoring │
│  scaffold                Project-aware scaffolding   │
│  create-skill            Build your own skills       │
│                                                      │
│  RESEARCH & DEBUGGING                                │
│  research                Structured investigation    │
│  research-fleet          Parallel multi-scout        │
│  experiment              Metric-driven optimization  │
│  systematic-debugging    Root cause analysis         │
│                                                      │
│  ORCHESTRATORS                                       │
│  marshal [thing]         Multi-step, one session     │
│  archon [thing]          Multi-session campaigns     │
│  fleet [thing]           Parallel campaigns          │
│                                                      │
│  NEXT STEPS                                          │
│  1. Try `do review [your most important file]`       │
│  2. Run `do create-skill` to capture a pattern       │
│  3. See docs/SKILLS.md for the full reference        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## Quality Gates

- `.citadel/` directory must exist (create if missing)
- `config.json` must be generated with correct language detection
- The demo task must run successfully (or be skipped gracefully)
- The reference card must be printed at the end

## Exit Protocol

After printing the reference card:
"Setup complete. The harness is configured for {language} with {framework}.
Type `do [anything]` to get started."

Do not output a HANDOFF block — this is the beginning, not the end.
