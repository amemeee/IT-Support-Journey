# IT Support Journey 🎧

An interactive, animated **Level 1 IT help desk simulator** set in a Malaysian workplace: Kenanga Digital Sdn Bhd (a fictional company), Kuala Lumpur.

It's plain HTML, CSS and JavaScript, with no build step and no backend. Open `index.html` in a browser, or host it on GitHub Pages.

## What you do
- Work a **live ticket queue** (P1–P4) with SLA timers.
- **Chat with users** who write in English, BM and Manglish. Question chips show the BM phrase too.
- Fix problems with real-feeling tools:
  - **Directory**: unlock accounts, reset passwords and MFA, enable/disable accounts, manage groups.
  - **Terminal**: `ipconfig`, `/release`, `/renew`, `/flushdns`, `/displaydns`, `ping`, `nslookup`, `net stop|start spooler`, `systeminfo`…
  - **Remote**: services, disk cleanup, Outlook profile rebuild, and a Software Center that enforces license policy.
  - **KB**: short articles, including PDPA-aware identity checks and a BM phrasebook.
- **Resolve or escalate** each ticket (Security / Infrastructure / Desktop L2), then get a points breakdown, CSAT stars and a lesson.
- Earn XP across shifts (saved in `localStorage`) and climb from Trainee to IT Support Lead.

## Scenarios (17)
Account lockout after Raya leave · expired password while WFH · shared-drive access · stuck print spooler · APIPA/DHCP · stale DNS cache · LHDN e-Invoice phishing · Outlook crash · software licensing · email outage · new-hire onboarding · disk full · fake "Dato'" social engineering · MFA reset · teh tarik spill · expat VPN access · MFA fatigue attack.

Link straight to one scenario with `sim.html?s=<id>` (e.g. `sim.html?s=socialeng`).

## Structure
```
index.html        animated landing page
sim.html          the simulator
css/style.css     shared + landing styles
css/sim.css       simulator styles
js/landing.js     landing animations (live queue, typewriter terminal, flip cards…)
js/scenarios.js   company directory, hosts, scenarios, KB  ← add new tickets here
js/sim.js         game engine (queue, chat, tools, grading, XP, effects)
```

## Adding a scenario
Add an object to `SCENARIOS` in `js/scenarios.js`. Set `setup(world)` to break something, `check(world)` to detect the fix (or `escalate: 'Team'` instead), then add `answers`, `hint` and `lesson`.

## Avatars
1. Save the full-size portrait as `assets/avatars/source/<username>.png` (e.g. `naisyah.png`, `agent.png`).
2. Run `python tools/build-avatars.py` (needs `pip install pillow`).

The script crops each portrait to the head and writes a 192×192 greyscale WebP to `assets/avatars/`, which is what the site loads (about 8 KB each). Missing avatars fall back to initials. Prompts for every character are in [assets/avatars/PROMPTS.md](assets/avatars/PROMPTS.md).

## Deploy on GitHub Pages
Go to Settings → Pages → Deploy from branch → `main` / root.
