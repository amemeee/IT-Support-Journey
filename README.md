# IT Support Journey 🎧

An interactive, animated **Level 1 IT help desk simulator** set in a Malaysian workplace: XYZ100 Sdn Bhd (a fictional company), Kuala Lumpur.

It's plain HTML, CSS and JavaScript, with no build step and no backend. Open `index.html` in a browser, or host it on GitHub Pages.

## What you do
- Work a **live ticket queue** (P1–P4) with SLA timers.
- **Chat with users** who write in English, BM and Manglish. Question chips show the BM phrase too.
- Fix problems with real-feeling tools:
  - **Directory**: unlock accounts, reset passwords and MFA, enable/disable accounts, manage groups.
  - **Terminal**: `ipconfig`, `/release`, `/renew`, `/flushdns`, `/displaydns`, `ping`, `nslookup`, `net stop|start spooler`, `systeminfo`…
  - **Remote**: services, disk cleanup, Outlook profile rebuild, and a Software Center that enforces license policy.
  - **KB**: short articles, including PDPA-aware identity checks and a BM phrasebook.
  - **Mail**: mailboxes, shared mailboxes and lists, quarantine, message trace.
  - **CCTV**: connect to the NVR for a live guard-post monitor and PoE power-cycling.
- Prefer typing? The Terminal also takes PowerShell-style admin commands: `help ad` (Get-ADUser, Unlock-ADAccount, Add-ADGroupMember…) and `help mail` (Get-Mailbox, Get-InboxRule, Get-MessageTrace, Release-QuarantineMessage…). They do exactly what the buttons do.
- Three modes: **Standard** (SLA timers), **Training** (no clock, free hints) and **Expert** (no question buttons, no hints, no greyed-out buttons or warning dots, +25% points).
- **Resolve or escalate** each ticket (Security / Infrastructure / Desktop L2), then get a points breakdown, CSAT stars and a lesson.
- Earn XP across shifts (saved in `localStorage`) and climb from Trainee to IT Support Lead.

## Scenarios (34)
**Core:** account lockout after Raya leave · expired password while WFH · shared-drive access · stuck print spooler · APIPA/DHCP · stale DNS cache · LHDN e-Invoice phishing · Outlook crash · software licensing · email outage · new-hire onboarding · disk full · fake "Dato'" social engineering · MFA reset · teh tarik spill · expat VPN access · MFA fatigue attack · CCTV camera offline (NVR + PoE) · CCTV footage request (PDPA).

**Email & Microsoft 365** (`js/scenarios/email.js`): mailbox full · shared mailbox access · missing from a distribution list · invoice stuck in quarantine · hidden inbox rule (compromised mailbox) · bounced email (typo) · calendar permissions · Send As · out-of-office for a colleague · Touch 'n Go PIN scam · intern without a licence · attachment too big · removing old access · courier scam release request · payroll file sent to all-staff (PDPA breach).

Link straight to one scenario with `sim.html?s=<id>` (e.g. `sim.html?s=socialeng`).

## Structure
```
index.html        animated landing page
sim.html          the simulator
css/style.css     shared + landing styles
css/sim.css       simulator styles
js/landing.js     landing animations (live queue, typewriter terminal, flip cards…)
js/scenarios.js   company directory, hosts, core scenarios, KB
js/scenarios/     one file per scenario batch (email.js, …)  ← add new tickets here
tools/            test-scenarios.js (validator), build-avatars.py
js/sim.js         game engine (queue, chat, tools, grading, XP, effects)
```

## Adding a scenario
Add an object to `window.SCENARIOS` in a file under `js/scenarios/` (and a `<script>` tag for new files in `sim.html`).
- `setup(world)` breaks something, `check(world)` detects the fix, `solve(world)` applies the correct fix (used by the validator).
- For tickets that must be escalated, set `escalate: 'Team'` instead of `solve`.
- Add `answers`, `hint`, `lesson` and a `kb` article id.

Then run the validator, which checks every scenario's data and logic:
```
node tools/test-scenarios.js
```

## Avatars
1. Save the full-size portrait as `assets/avatars/source/<username>.png` (e.g. `naisyah.png`, `agent.png`).
2. Run `python tools/build-avatars.py` (needs `pip install pillow`).

The script crops each portrait to the head and writes a 192×192 greyscale WebP to `assets/avatars/`, which is what the site loads (about 8 KB each). Missing avatars fall back to initials. Prompts for every character are in [assets/avatars/PROMPTS.md](assets/avatars/PROMPTS.md).

## Deploy on GitHub Pages
Go to Settings → Pages → Deploy from branch → `main` / root.
