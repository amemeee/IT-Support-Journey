# IT Support Journey

A **Level 1 IT help desk simulator** set in a Malaysian workplace: XYZ100 Sdn Bhd (a fictional company), Kuala Lumpur.

Built with **Vue 3 + Pinia + Vite**. No backend: everything runs in the browser.

## Run it
```
npm install
npm run dev              # local dev server with hot reload (open the URL it prints)
npm run build            # production build into dist/
npm run preview          # serve the production build locally
npm run test:scenarios   # check every scenario's data and logic
```
Opening `index.html` straight from the folder no longer works, because Vite has to bundle the code first.

## What you do
- Work a **live ticket queue** (P1–P4) with SLA timers.
- **Chat with users** who write in English, BM and Manglish. Question chips show the BM phrase too.
- **Work like a real service desk:**
  - set tickets to **In progress** or **Awaiting user**; "Awaiting user" pauses the SLA
  - add **internal notes** that only your team sees, separate from replies to the user
  - some users are **in a meeting** and reply later, so work another ticket meanwhile
- Fix problems with real-feeling tools:
  - **Directory**: unlock accounts, reset passwords and MFA, enable/disable accounts, manage groups.
  - **Terminal**: `ipconfig`, `ping`, `nslookup`, `tracert`, `arp -a`, `Test-NetConnection`, `net stop|start spooler`, `w32tm`…, plus admin cmdlets (below).
  - **Remote**: services, disk cleanup, Outlook profile rebuild, and a Software Center that enforces licence policy.
  - **Mail**: mailboxes, shared mailboxes and lists, quarantine, message trace.
  - **Devices**: compliance, BitLocker keys, updates, drivers, USB policy, lock, isolate and wipe.
  - **Network**: internet line and UPS overview, Wi-Fi access points and guest vouchers, switch ports, DHCP reservations and exclusions, web filter, VPN profiles and tunnels.
  - **CCTV**: connect to the NVR for a live guard-post monitor and PoE power-cycling.
  - **Apps**: OneDrive files, sharing links and versions, SharePoint sites and recycle bins, Teams owners and external access, meeting rooms, app consents, and who manages external portals. The Remote panel also shows running apps, the Teams microphone, Office add-ins and browser extensions.
  - **KB**: short articles, including PDPA-aware identity checks and a BM phrasebook.
- **Resolve or escalate** each ticket (Security / Infrastructure / Desktop L2), then get a points breakdown, CSAT stars, a lesson and an **"On the job"** note on how it works at a real company.
- Three modes: **Standard** (SLA timers), **Training** (no clock, free hints) and **Expert** (type everything, no hints, +25% points).
- Earn XP across shifts (saved in `localStorage`) and climb from Trainee to IT Support Lead.

### Terminal admin commands
Type `help ad`, `help mail`, `help devices` or `help apps`. The commands follow the real cmdlets, for example:
```
Get-ADUser -Filter "Name -like '*nurul*'"
Set-ADAccountPassword twming -Reset -NewPassword (ConvertTo-SecureString "Temp-Pass-12!" -AsPlainText -Force)
Set-ADUser twming -ChangePasswordAtLogon $true
Get-MgSubscribedSku
Set-MgUserLicense -UserId niman -AddLicenses @{SkuId = "<SkuId>"} -RemoveLicenses @()
Get-InboxRule -Mailbox kavitha
Get-MessageTraceV2 -SenderAddress azaki@xyz100.com.my
Release-QuarantineMessage -Identity q-inv -ReleaseToAll
Get-MgInformationProtectionBitlockerRecoveryKey -BitlockerRecoveryKeyId <id> -Property key
```
They do exactly what the buttons do and are graded the same way. Anything simplified or invented is marked "(simulator)" in the help.

## Scenarios (79)
**Core** (`src/data/core.js`): account lockout after Raya leave · expired password while WFH · shared-drive access · stuck print spooler · APIPA/DHCP · stale DNS cache · LHDN e-Invoice phishing · Outlook crash · software licensing · email outage · new-hire onboarding · disk full · fake "Dato'" social engineering · MFA reset · teh tarik spill · expat VPN access · MFA fatigue attack · CCTV camera offline (NVR + PoE) · CCTV footage request (PDPA).

**Email & Microsoft 365** (`src/data/email.js`): mailbox full · shared mailbox access · missing from a distribution list · invoice stuck in quarantine · hidden inbox rule (compromised mailbox) · bounced email (typo) · calendar permissions · Send As · out-of-office for a colleague · Touch 'n Go PIN scam · intern without a licence · attachment too big · removing old access · courier scam release request · payroll file sent to all-staff (PDPA breach).

**Device management** (`src/data/devices.js`): BitLocker recovery (verify, match the key ID) · colleague asking for someone else's key · laptop left in a Grab (lock, don't wipe) · stolen laptop (approved wipe) · USB blocked (no approval) · approved USB exception · Windows Update stuck · firewall turned off · blue screen after a driver update · swollen battery · ransomware (isolate, escalate) · clock out of sync (`w32tm /resync`) · new laptop not assigned · encryption off · lost personal phone (wipe work data only).

**Network & Wi-Fi** (`src/data/network.js`): Wi-Fi down in one wing (reboot the AP, not the core switch) · visitor wants Wi-Fi (guest voucher) · VPN error 809 at a hotel (SSL on 443) · home fibre LOS (provider, not us) · printer IP changed (DHCP reservation) · IP conflict (`arp -a`, exclusion, renew) · supplier site blocked (exact-site exception) · 4D gambling site (decline) · Teams choppy for everyone (top talkers, escalate) · unknown box in a meeting room (shut the port, escalate) · Wi-Fi drops at lunch (microwaves, band steering) · floor offline after a storm (escalate) · overnight VPN password attack (don't unlock, escalate) · branch can't reach HQ (tunnel down, escalate) · one website slow (`tracert`).

**Apps & collaboration** (`src/data/apps.js`): OneDrive red X (bad characters in the name) · salary file with an "Anyone" link (remove it, escalate) · SharePoint site access (Members, not Owners) · Teams camera in use by Zoom · Teams using the monitor as a mic · deleted SharePoint folder (recycle bin) · overwritten spreadsheet (version history) · MyInvois access (Finance's portal admin, not IT) · Excel crashing after an add-in · browser extension hijacking search · meeting room double-booked (`Set-CalendarProcessing`) · WhatsApp Desktop request (decline) · Teams chat with a partner company (Security) · team with no owner (`Add-TeamUser -Role Owner`) · consent phishing app (revoke, escalate).

Link straight to one scenario with `sim.html?s=<id>` (e.g. `sim.html?s=socialeng`).

## Structure
```
index.html, sim.html        page entry points (Vite builds both)
src/
  data/                     everything the game knows (shared with the validator)
    core.js                 company, directory, PCs, core scenarios, KB
    email.js, devices.js,   one file per scenario batch        ← add new tickets here
    network.js, apps.js
    realworld.js            "On the job" note for each scenario
    index.js                combines all of the above
  sim/                      the simulator (Vue)
    main.js, App.vue        entry and layout
    stores/game.js          Pinia store: shift, tickets, chat, workflow, grading
    stores/ops.js           every admin action (buttons and commands share these)
    stores/terminal.js      terminal commands and PowerShell-style cmdlets
    components/             TopBar, QueuePanel, TicketPane, ToolsPanel, tabs/, modals/
    lib/                    helpers, sound and confetti, CCTV drawing, questions
  landing/main.js           landing page (live queue, terminal demo, mini ticket)
  styles/                   style.css (shared + landing), sim.css (simulator)
public/assets/avatars/      the small avatar images the site loads
art/avatars/                full-size portraits and the prompts used to make them
tools/                      test-scenarios.js (validator), build-avatars.py
```

## Adding a scenario
Add an object to the scenario list in a file under `src/data/` (new batch files also need importing in `src/data/index.js`).
- `setup(world)` breaks something, `check(world)` detects the fix, `solve(world)` applies the correct fix (used by the validator).
- For tickets that must be escalated, set `escalate: 'Team'` instead of `solve`.
- Add `answers`, `hint`, `lesson`, a `kb` article id, and an "On the job" note in `src/data/realworld.js`.

Then run `npm run test:scenarios`.

## Avatars
1. Save the full-size portrait as `art/avatars/source/<username>.png` (e.g. `naisyah.png`, `agent.png`).
2. Run `python tools/build-avatars.py` (needs `pip install pillow`).

The script crops each portrait to the head and writes a 192×192 greyscale WebP to `public/assets/avatars/` (about 8 KB each). Missing avatars fall back to initials. Prompts for every character are in [art/avatars/PROMPTS.md](art/avatars/PROMPTS.md).

## Deploy on GitHub Pages
A GitHub Action (`.github/workflows/deploy.yml`) runs the validator, builds the site and publishes it on every push to `main`.

One-time setup: repo **Settings → Pages → Source: GitHub Actions**.
