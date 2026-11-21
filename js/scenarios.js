/* =========================================================
   IT Support Journey — scenario & world data (Malaysia edition)
   Setting: XYZ100 Sdn Bhd, Level 12, Menara XYZ100, Kuala Lumpur.
   Each scenario mutates the "world" when its ticket spawns (setup)
   and is checked against the world when resolved (check).
   ========================================================= */

window.COMPANY = { name: 'XYZ100 Sdn Bhd', office: 'Menara XYZ100, Kuala Lumpur', domain: 'xyz100.local' };

window.GROUPS = [
  'All-Staff', 'Sales-RW', 'Finance-RW', 'HR-RW', 'Marketing-RW',
  'Engineering-RW', 'Legal-RW', 'Ops-RW', 'VPN-Users', 'Domain Admins'
];

window.TEAMS = ['Security', 'Infrastructure', 'Desktop L2'];

window.SOFTWARE = [
  { name: 'Zoom', policy: 'approved' },
  { name: 'Slack', policy: 'approved' },
  { name: '7-Zip', policy: 'approved' },
  { name: 'VS Code', policy: 'approved' },
  { name: 'Adobe Photoshop', policy: 'license' },
  { name: 'uTorrent', policy: 'blocked' }
];

const U = (name, dept, title, empId, groups, extra = {}) => Object.assign({
  name, dept, title, empId, groups,
  enabled: true, locked: false, pwdExpired: false, mfa: 'Registered',
  phone: 'x' + (4000 + Math.floor(Math.random() * 999))
}, extra);

window.DIRECTORY = {
  naisyah:  U('Nurul Aisyah binti Ahmad', 'HR', 'HR Executive', 'XYZ20417', ['All-Staff', 'HR-RW', 'VPN-Users']),
  nain:     U('Nurul Ain binti Razak', 'Operations', 'Warehouse Supervisor', 'XYZ31877', ['All-Staff', 'Ops-RW']),
  twming:   U('Tan Wei Ming', 'Finance', 'Senior Accountant', 'XYZ18820', ['All-Staff', 'Finance-RW', 'VPN-Users']),
  twmin:    U('Tan Wei Min', 'Engineering', 'Software Engineer', 'XYZ22901', ['All-Staff', 'Engineering-RW', 'VPN-Users']),
  psubra:   U('Priya a/p Subramaniam', 'Finance', 'Financial Analyst', 'XYZ25510', ['All-Staff', 'Marketing-RW']),
  lsling:   U('Lim Siew Ling', 'Operations', 'Ops Coordinator', 'XYZ19034', ['All-Staff', 'Ops-RW']),
  mfaiz:    U('Muhammad Faiz bin Osman', 'Engineering', 'QA Engineer', 'XYZ23345', ['All-Staff', 'Engineering-RW']),
  kavitha:  U('Kavitha a/p Rajan', 'Marketing', 'Content Lead', 'XYZ26677', ['All-Staff', 'Marketing-RW']),
  jwong:    U('Jason Wong Kah Hoe', 'Sales', 'Account Manager', 'XYZ27781', ['All-Staff', 'Sales-RW', 'VPN-Users']),
  shajar:   U('Siti Hajar binti Yusof', 'Legal', 'Legal Executive', 'XYZ21190', ['All-Staff', 'Legal-RW']),
  draj:     U('Daniel Raj a/l Kumar', 'Marketing', 'Graphic Designer', 'XYZ28802', ['All-Staff', 'Marketing-RW']),
  rosnah:   U('Rosnah binti Hassan', 'Operations', 'Office Manager', 'XYZ17723', ['All-Staff', 'Ops-RW']),
  azaki:    U('Ahmad Zaki bin Ismail', 'Sales', 'Sales Manager', 'XYZ15502', ['All-Staff', 'Sales-RW', 'VPN-Users']),
  ahakim:   U('Aiman Hakim bin Zulkifli', 'Sales', 'Sales Executive (new hire)', 'XYZ30001', [], { enabled: false, mfa: 'Not registered' }),
  cmeiyee:  U('Chong Mei Yee', 'Customer Support', 'Support Specialist', 'XYZ24456', ['All-Staff']),
  dkamal:   U("Dato' Kamal bin Ismail", 'Executive', 'Chief Executive Officer', 'XYZ00001', ['All-Staff', 'VPN-Users']),
  fnadia:   U('Farah Nadia binti Rahim', 'Finance', 'Payroll Executive', 'XYZ29934', ['All-Staff', 'Finance-RW']),
  arjun:    U('Arjun a/l Selvam', 'Customer Support', 'Team Lead', 'XYZ20088', ['All-Staff']),
  ksoon:    U('Khoo Soon Lee', 'Sales', 'Sales Executive', 'XYZ26001', ['All-Staff', 'Sales-RW']),
  htanaka:  U('Hiroshi Tanaka', 'Sales', 'Regional Sales Director (expat, Tokyo)', 'XYZ30112', ['All-Staff', 'Sales-RW']),
  rahman:   U('Rahman bin Yusof', 'Facilities', 'Security Guard (contractor)', 'XYZ40210', ['All-Staff'])
};

const H = (owner, ip, extra = {}) => Object.assign({
  owner, ip, apipa: false, dnsStale: false, spooler: 'Running', queue: 0,
  disk: 40 + Math.floor(Math.random() * 25), outlook: 'Healthy',
  software: ['Microsoft 365', 'Chrome', 'Teams'], os: 'Windows 11 Pro 23H2'
}, extra);

window.HOSTS = {
  'XYZ-HR-022':    H('naisyah', '10.12.3.22'),
  'XYZ-FIN-010':   H('twming', '10.12.5.10'),
  'XYZ-FIN-031':   H('psubra', '10.12.5.31'),
  'XYZ-OPS-031':   H('lsling', '10.12.6.31'),
  'XYZ-ENG-007':   H('mfaiz', '10.12.7.7'),
  'XYZ-MKT-019':   H('kavitha', '10.12.8.19'),
  'XYZ-SLS-008':   H('jwong', '10.12.4.8'),
  'XYZ-LEG-004':   H('shajar', '10.12.9.4'),
  'XYZ-MKT-027':   H('draj', '10.12.8.27'),
  'XYZ-OPS-002':   H('rosnah', '10.12.6.2'),
  'XYZ-SLS-021':   H('ahakim', '10.12.4.21'),
  'XYZ-CS-005':    H('cmeiyee', '10.12.10.5'),
  'XYZ-CS-011':    H('arjun', '10.12.10.11'),
  'XYZ-SLS-030':   H('htanaka', '10.12.4.30'),
  'XYZ-SLS-014':   H('ksoon', '10.12.4.14'),
  // CCTV recorder in the Level 12 server room; cameras are powered over PoE
  'NVR-L12': {
    type: 'nvr', owner: null, ip: '10.12.20.10', os: 'NVR, 8-channel, firmware 4.2', disk: 71,
    apipa: false, dnsStale: false, software: [],
    cams: [
      { id: 'CAM-L12-LOBBY',   name: 'Lobby entrance', ip: '10.12.20.11', port: 1, status: 'Online' },
      { id: 'CAM-L12-PANTRY',  name: 'Pantry',         ip: '10.12.20.12', port: 2, status: 'Online' },
      { id: 'CAM-L12-SERVER',  name: 'Server room',    ip: '10.12.20.13', port: 3, status: 'Online' },
      { id: 'CAM-B2-CARPARK',  name: 'Car park B2',    ip: '10.12.20.14', port: 4, status: 'Online' }
    ]
  }
};

/* ---------------------------------------------------------
   answers keys: error, when, restart, computer, others, verify
   relevant: questions that earn a bonus when asked
   targets: accounts this ticket may legitimately change
   avoid: action kinds that are overkill for this ticket
   --------------------------------------------------------- */
window.SCENARIOS = [
  {
    id: 'lockout', title: 'Locked out after Raya leave', category: 'Account', priority: 'P3',
    user: 'naisyah', host: 'XYZ-HR-022',
    body: "Hi IT, saya baru balik cuti Raya and Windows says my account is locked. I think I keyed in my old password too many times 😅",
    setup: w => { w.users.naisyah.locked = true; },
    check: w => !w.users.naisyah.locked && w.users.naisyah.enabled,
    solve: w => { w.users.naisyah.locked = false; },
    answers: {
      error: 'It says "The referenced account is currently locked out and may not be logged on to."',
      when: 'Pagi tadi, first thing when I tried to log in.',
      restart: 'Dah restart twice already. Same message.',
      computer: 'The sticker says XYZ-HR-022.',
      others: 'Rasanya just me.',
      verify: 'Boleh, my staff ID is XYZ20417.'
    },
    relevant: ['error'],
    avoid: { resetPwd: { label: 'Unnecessary password reset (user knows their password)', pts: -10 } },
    hint: 'Search "Nurul" in Directory — there are two! A locked account only needs Unlock.',
    lesson: 'Lockouts come from repeated wrong passwords (very common after long leave like Raya or CNY). Unlock the account; only reset the password if the user actually forgot it. Always confirm you picked the right person — Malaysian names are often similar.',
    kb: 'lockout'
  },
  {
    id: 'pwdexpired', title: 'Password expired while WFH', category: 'Account', priority: 'P2',
    user: 'twming', host: 'XYZ-FIN-010', sensitive: true,
    body: "My password expired while I was WFH on my Unifi and now cannot change at the login screen. Month-end closing today, please help urgently!",
    setup: w => { w.users.twming.pwdExpired = true; },
    check: w => !w.users.twming.pwdExpired,
    solve: w => { w.users.twming.pwdExpired = false; },
    answers: {
      error: '"Your password has expired and must be changed." Then it says cannot reach the domain.',
      when: 'Since last night.',
      restart: 'Yes, still the same lah.',
      computer: 'XYZ-FIN-010',
      others: 'No, only me.',
      verify: 'Sure — staff ID XYZ18820.'
    },
    relevant: ['error', 'verify'],
    hint: 'Password resets are sensitive: ask for the staff ID and compare it with Directory (watch out for Tan Wei Min vs Tan Wei Ming), then Reset password with "must change at next logon".',
    lesson: 'Before any password reset, verify identity. Issue a temporary password and force a change at next logon. Under the PDPA, only collect what you need — a staff ID is enough; no need for full MyKad numbers.',
    kb: 'password'
  },
  {
    id: 'share', title: 'Access denied on Finance drive', category: 'Access', priority: 'P3',
    user: 'psubra', host: 'XYZ-FIN-031',
    body: "I transferred to Finance last week but get 'Access denied' on \\\\fs01\\finance. My manager Encik Hafiz already approved — approval email attached.",
    setup: () => {},
    check: w => w.users.psubra.groups.includes('Finance-RW'),
    solve: w => { w.users.psubra.groups.push('Finance-RW'); },
    answers: {
      error: '"You do not have permission to access \\\\fs01\\finance. Contact your network administrator."',
      when: 'Since my first day in the team.',
      restart: 'Yes, still denied.',
      computer: 'XYZ-FIN-031',
      others: 'My teammates can open it, no problem.',
      verify: 'XYZ25510.'
    },
    relevant: ['error', 'others'],
    hint: 'Shared folder access comes from security groups. Check Priya\'s groups and add the Finance one. Approval is attached.',
    lesson: 'Grant access through groups, only what was approved. When someone transfers departments, old access should be reviewed too — and never hand out admin groups.',
    kb: 'groups'
  },
  {
    id: 'printer', title: 'Print jobs stuck', category: 'Hardware', priority: 'P3',
    user: 'lsling', host: 'XYZ-OPS-031',
    body: "The Level 12 printer cannot print from my laptop. I sent my report 5 times already, nothing come out!",
    setup: w => { const h = w.hosts['XYZ-OPS-031']; h.spooler = 'Stuck'; h.queue = 14; },
    check: w => { const h = w.hosts['XYZ-OPS-031']; return h.spooler === 'Running' && h.queue === 0; },
    solve: w => { const h = w.hosts['XYZ-OPS-031']; h.spooler = 'Running'; h.queue = 0; },
    answers: {
      error: 'No error, the documents just stuck at "Printing...".',
      when: 'About one hour ago.',
      restart: "Haven't restart, I'm in the middle of work.",
      computer: "It's XYZ-OPS-031.",
      others: 'Kak Rosnah beside me printed fine 10 minutes ago.'
    },
    relevant: ['computer', 'others'],
    hint: 'Others can print, so the printer is fine — it\'s this laptop. Get the computer name, connect via Remote, and restart the Print Spooler (or net stop/start spooler in Terminal).',
    lesson: 'If colleagues can print, the problem is local. A stuck Print Spooler holds the queue; restarting it clears stuck jobs.',
    kb: 'spooler'
  },
  {
    id: 'nointernet', title: 'No network on desktop', category: 'Network', priority: 'P2',
    user: 'mfaiz', host: 'XYZ-ENG-007',
    body: "Bro, my desktop got no internet and no network drive since this morning. The network icon got yellow warning triangle.",
    setup: w => { w.hosts['XYZ-ENG-007'].apipa = true; },
    check: w => !w.hosts['XYZ-ENG-007'].apipa,
    solve: w => { w.hosts['XYZ-ENG-007'].apipa = false; },
    answers: {
      error: 'Hover the icon it says "No Internet access".',
      when: 'Since I came in this morning.',
      restart: 'Dah reboot once. Cable plugged in, the light blinking.',
      computer: 'XYZ-ENG-007',
      others: 'Everyone else around me online.'
    },
    relevant: ['computer', 'restart'],
    hint: 'Connect to XYZ-ENG-007 and run ipconfig. 169.254.x.x means it never got an IP from DHCP — try ipconfig /release then ipconfig /renew.',
    lesson: 'A 169.254.x.x (APIPA) address means DHCP failed. Releasing and renewing the lease usually fixes it; if not, check cabling/switch port.',
    kb: 'apipa'
  },
  {
    id: 'dns', title: 'HR portal cannot load', category: 'Network', priority: 'P3',
    user: 'kavitha', host: 'XYZ-MKT-019',
    body: "portal.xyz100.local cannot load for me, but Google and everything else OK. My colleague can open the portal. I need to apply leave for Deepavali!",
    setup: w => { w.hosts['XYZ-MKT-019'].dnsStale = true; },
    check: w => !w.hosts['XYZ-MKT-019'].dnsStale,
    solve: w => { w.hosts['XYZ-MKT-019'].dnsStale = false; },
    answers: {
      error: '"This site can\'t be reached — took too long to respond."',
      when: 'Since IT moved the portal to the new server on Monday, I think?',
      restart: "Haven't try, I got like 40 tabs open.",
      computer: 'XYZ-MKT-019',
      others: 'No, my colleague can open it.'
    },
    relevant: ['computer', 'others', 'when'],
    hint: 'The portal moved servers. Connect to XYZ-MKT-019, compare "ping portal.xyz100.local" with "nslookup portal.xyz100.local", check ipconfig /displaydns, then ipconfig /flushdns.',
    lesson: 'One site failing for one user after a server move = likely stale DNS cache. ipconfig /flushdns clears it.',
    kb: 'dns'
  },
  {
    id: 'phishing', title: '"LHDN e-Invoice" email', category: 'Security', priority: 'P1',
    user: 'jwong', host: 'XYZ-SLS-008',
    body: "Got email from 'LHDN MyInvois' saying our e-Invoice got problem, must login at myinvois-lhdn-verify.com with my Microsoft 365 account. I keyed in my password then the page went blank... is that normal?",
    setup: () => {},
    escalate: 'Security',
    check: () => false,
    answers: {
      error: 'No error, the page just went white after I login.',
      when: 'About 15 minutes ago.',
      restart: 'Should I? Haven\'t yet.',
      computer: 'XYZ-SLS-008',
      others: 'A few people in Sales got the same email also.',
      verify: 'XYZ27781.'
    },
    relevant: ['when', 'others'],
    hint: 'The user entered their password on a fake site pretending to be a government agency. This is a security incident — not a normal L1 fix.',
    lesson: 'Scammers often impersonate LHDN, banks or PDRM. Credentials entered on a phishing site = security incident: escalate to Security immediately so they can reset credentials, revoke sessions, block the sender, and report to MyCERT (CyberSecurity Malaysia) if needed.',
    kb: 'phishing'
  },
  {
    id: 'outlook', title: 'Outlook crashes on launch', category: 'Software', priority: 'P3',
    user: 'shajar', host: 'XYZ-LEG-004',
    body: "Outlook crash every time I open it. Teams and others are fine. I need my email for a court filing deadline today!",
    setup: w => { w.hosts['XYZ-LEG-004'].outlook = 'Crashing (profile corrupt)'; },
    check: w => w.hosts['XYZ-LEG-004'].outlook === 'Healthy',
    solve: w => { w.hosts['XYZ-LEG-004'].outlook = 'Healthy'; },
    answers: {
      error: '"Microsoft Outlook has stopped working." Then it closes.',
      when: 'After my laptop updated last night.',
      restart: 'Yes, twice.',
      computer: 'XYZ-LEG-004',
      others: 'Others are fine. Outlook web on browser works for me too.'
    },
    relevant: ['error', 'computer', 'others'],
    hint: 'Webmail works, so the mailbox is fine — it\'s the local Outlook profile. Connect via Remote and rebuild the Outlook profile.',
    lesson: 'If webmail works but desktop Outlook crashes, the mailbox is fine and the local profile is the suspect. Rebuilding the profile is a safe fix.',
    kb: 'outlook'
  },
  {
    id: 'software', title: 'Need Zoom and Photoshop', category: 'Software', priority: 'P4',
    user: 'draj', host: 'XYZ-MKT-027',
    body: "Hi boss! Can help install Zoom and Adobe Photoshop on my laptop? Client call this afternoon and I want to edit some images. Thanks ya!",
    setup: () => {},
    check: w => { const s = w.hosts['XYZ-MKT-027'].software; return s.includes('Zoom') && !s.includes('Adobe Photoshop'); },
    solve: w => { w.hosts['XYZ-MKT-027'].software.push('Zoom'); },
    answers: {
      error: 'No error, just don\'t have the apps.',
      when: 'Need by 2pm if can!',
      restart: 'Not broken lah, just need apps 🙂',
      computer: 'XYZ-MKT-027',
      others: 'N/A'
    },
    relevant: ['computer'],
    hint: 'Check software policy in Remote > Software Center. Approved apps can be installed; licensed apps need approval first.',
    lesson: 'Install only approved software. Paid apps need manager + license approval — guide the user to request it. Unlicensed software is a legal risk for the company (and pirated software is a common malware source).',
    kb: 'software'
  },
  {
    id: 'outage', title: 'Email down for whole floor', category: 'Outage', priority: 'P1',
    user: 'rosnah', host: 'XYZ-OPS-002',
    body: "Habis! Nobody on Level 12 can get email! Outlook says 'Disconnected' for everyone and phones also cannot.",
    setup: w => { w.outage = true; },
    escalate: 'Infrastructure',
    check: () => false,
    answers: {
      error: 'Outlook says "Disconnected" at the bottom bar.',
      when: 'About 10 minutes ago, all at once.',
      restart: 'A few people restarted, nothing changed.',
      computer: 'XYZ-OPS-002, but it\'s everyone.',
      others: 'Yes! Whole floor, maybe more. Phones also.'
    },
    relevant: ['others', 'when'],
    hint: 'Many users + phones affected at once = server-side. Try "ping mail.xyz100.local" from your own terminal.',
    lesson: 'When many users break at once, it\'s an outage. Confirm quickly, then escalate to Infrastructure — don\'t troubleshoot desktops one by one.',
    kb: 'escalation'
  },
  {
    id: 'newhire', title: 'New hire cannot log in', category: 'Account', priority: 'P2',
    user: 'azaki', targets: ['ahakim', 'azaki'], host: 'XYZ-SLS-021',
    body: "Aiman Hakim starts in my team today and cannot log in. HR already completed onboarding — please enable his account and give standard Sales access (All-Staff + Sales-RW). Terima kasih!",
    setup: () => {},
    check: w => { const u = w.users.ahakim; return u.enabled && u.groups.includes('All-Staff') && u.groups.includes('Sales-RW'); },
    solve: w => { const u = w.users.ahakim; u.enabled = true; u.groups.push('All-Staff', 'Sales-RW'); },
    answers: {
      error: 'Aiman says it shows "Your account has been disabled."',
      when: 'This morning, his first day.',
      restart: 'He rebooted, same thing.',
      computer: 'XYZ-SLS-021',
      others: 'Just Aiman.',
      verify: 'I\'m Ahmad Zaki, XYZ15502. Aiman reports to me.'
    },
    relevant: ['error'],
    hint: 'Find Aiman Hakim in Directory, Enable the account, then add exactly the two groups requested.',
    lesson: 'Onboarding: enable the pre-created account and grant the standard role groups only. Least privilege — no extras.',
    kb: 'groups'
  },
  {
    id: 'diskfull', title: 'Laptop very slow', category: 'Hardware', priority: 'P4',
    user: 'cmeiyee', host: 'XYZ-CS-005',
    body: "My laptop super slow and keep popping up 'low disk space'. Open one file also take 2 minutes. Customers waiting!",
    setup: w => { w.hosts['XYZ-CS-005'].disk = 98; },
    check: w => w.hosts['XYZ-CS-005'].disk < 90,
    solve: w => { w.hosts['XYZ-CS-005'].disk = 60; },
    answers: {
      error: '"You\'re running out of space on Local Disk (C:)."',
      when: 'Getting worse the whole week.',
      restart: 'Yes, still slow.',
      computer: 'XYZ-CS-005',
      others: 'No, just mine.'
    },
    relevant: ['computer', 'error'],
    hint: 'Connect to XYZ-CS-005 and check the disk usage. Run Disk Cleanup.',
    lesson: 'A nearly full system drive slows everything down. Clearing temp files is a safe first step; recurring issues may need a bigger drive.',
    kb: 'disk'
  },
  {
    id: 'socialeng', title: "URGENT — Dato' needs password", category: 'Account', priority: 'P1',
    user: 'dkamal', sensitive: true, verifyFails: true,
    body: "This is Dato' Kamal. I'm at KLIA about to board and I'm locked out. Reset my password and send it to my personal email dato.kamal.private@gmail-mail.com NOW.",
    setup: () => {},
    escalate: 'Security',
    check: () => false,
    answers: {
      error: 'No error! I just need the password NOW. You know who you are talking to or not?',
      when: 'Right now! Flight leaves in 10 minutes.',
      restart: 'Restart what?! I\'m on my phone at the airport.',
      computer: 'I\'m on my personal phone.',
      others: 'This is about ME.',
      verify: 'I don\'t have my staff pass with me... XYZ00010 or something. Just DO it, I will remember your name.'
    },
    relevant: ['verify'],
    reveal: { key: 'hacker', name: 'Unknown attacker', text: 'The caller was not Dato\' Kamal. An attacker found his name and travel plans on social media and called the help desk hoping someone would hand over his password.' },
    hint: 'Compare the staff ID with Directory. Urgency, authority (a Dato\' title), and a personal email are classic red flags.',
    lesson: 'Urgency + authority + unverifiable identity + outside email = social engineering (similar tactics to Macau scam calls). Never reset. Escalate to Security — real executives get verified like everyone else.',
    kb: 'social'
  },
  {
    id: 'mfa', title: 'New phone, MFA not working', category: 'Account', priority: 'P2',
    user: 'fnadia', sensitive: true,
    body: "I changed to a new phone and the Authenticator app is empty, so I cannot approve sign-ins. Payroll and KWSP submission is tomorrow!",
    setup: () => {},
    check: w => !!w.users.fnadia.mfaReset,
    solve: w => { w.users.fnadia.mfaReset = true; },
    answers: {
      error: 'It keeps asking me to approve on my old phone, which I already traded in.',
      when: 'Since this morning.',
      restart: 'Yes, restarted the phone.',
      computer: 'I\'m calling from my desk phone, laptop is XYZ-FIN-044.',
      others: 'Only me.',
      verify: 'Of course — XYZ29934.'
    },
    relevant: ['verify'],
    hint: 'MFA resets are sensitive — verify identity first, then use Reset MFA in Directory.',
    lesson: 'Resetting MFA lets someone register a new device, so verify identity just as carefully as for a password reset.',
    kb: 'mfa'
  },
  {
    id: 'hardware', title: 'Teh tarik spilled on laptop', category: 'Hardware', priority: 'P2',
    user: 'arjun', host: 'XYZ-CS-011',
    body: "Alamak, my teh tarik tumpah on my laptop 😭 Half the keys not working and it smells a bit burnt. How??",
    setup: () => {},
    escalate: 'Desktop L2',
    check: () => false,
    answers: {
      error: 'Keys on the left side cannot type, the trackpad jumping.',
      when: 'Five minutes ago.',
      restart: 'Should I restart it?',
      computer: 'XYZ-CS-011',
      others: 'Just me (and my pants).'
    },
    relevant: ['when'],
    hint: 'No software fix here. Liquid damage needs a hardware swap from the desk-side team.',
    lesson: 'Liquid damage: tell the user to power off and unplug immediately, then escalate to Desktop L2 for a loaner and repair. Never troubleshoot remotely.',
    kb: 'escalation'
  },
  {
    id: 'expatvpn', title: 'New expat needs VPN', category: 'Access', priority: 'P3',
    user: 'htanaka', host: 'XYZ-SLS-030',
    body: "Hello. I am Tanaka, new Regional Director, I moved from Tokyo office last week. Next week I go to Singapore and Jakarta, so I need VPN. My manager already approve, email is attached. Sorry for trouble, thank you very much.",
    setup: () => {},
    check: w => w.users.htanaka.groups.includes('VPN-Users'),
    solve: w => { w.users.htanaka.groups.push('VPN-Users'); },
    answers: {
      error: 'The VPN application says "You are not authorized to connect." I think my account is not ready?',
      when: 'I tried yesterday first time. My flight is Monday.',
      restart: 'Yes, I restart the laptop. Same message.',
      computer: 'XYZ-SLS-030. It is new laptop from IT.',
      others: 'My team can use VPN, only me cannot.',
      verify: 'Yes, my staff ID is XYZ30112.'
    },
    relevant: ['error', 'others'],
    hint: 'VPN access comes from a group. Check which groups Hiroshi has. Approval is attached. Keep your replies in clear, simple English.',
    lesson: 'Remote access is granted through a group (VPN-Users here). With international staff, use plain English and avoid slang or BM, and confirm what you did in writing so nothing gets lost in translation.',
    kb: 'groups'
  },
  {
    id: 'mfafatigue', title: 'Dozens of MFA prompts at 2am', category: 'Security', priority: 'P1',
    user: 'ksoon', host: 'XYZ-SLS-014',
    body: "Since 2am my phone keep getting 'Approve sign-in?' notifications, like 30 times already. I wasn't logging in. Half asleep I pressed Approve once just to make it stop... is that bad ah?",
    setup: () => {},
    escalate: 'Security',
    check: () => false,
    answers: {
      error: 'No error. Just "Approve sign-in request?" again and again, location says somewhere overseas.',
      when: 'Started around 2am, stopped after I pressed Approve.',
      restart: 'I switched off my phone for a while, when I on back it continued.',
      computer: 'XYZ-SLS-014, but this is on my phone.',
      others: "Don't know, I only noticed mine.",
      verify: 'XYZ26001.'
    },
    relevant: ['when', 'error'],
    reveal: { key: 'hacker', name: 'Unknown attacker', text: "The attacker already had Soon Lee's password, bought from an old data leak, and kept sending MFA requests until he approved one. That approval gave them a live session in his mailbox." },
    hint: 'Many unexpected MFA prompts mean someone else has the password. One was approved, so this is an active compromise.',
    lesson: "This is an MFA fatigue attack: the attacker has the password and spams prompts hoping for one approval. Escalate to Security immediately so they can revoke sessions, reset the password and check the mailbox. Remind users to press Deny on prompts they didn't start.",
    kb: 'mfa'
  },
  {
    id: 'cctv', title: 'Lobby CCTV shows "No Signal"', category: 'Hardware', priority: 'P2',
    user: 'rahman', host: 'NVR-L12',
    body: "Assalamualaikum IT. CCTV monitor at guard post, the lobby camera show 'No Signal' since morning. Other camera all OK. Building management want lobby recording working, cannot leave like this.",
    setup: w => { w.hosts['NVR-L12'].cams[0].status = 'Offline'; },
    check: w => w.hosts['NVR-L12'].cams[0].status === 'Online',
    solve: w => { w.hosts['NVR-L12'].cams[0].status = 'Online'; },
    answers: {
      error: 'Black screen, white words "No Signal" on the lobby one. Pantry, server room, car park all got picture.',
      when: 'Since about 7am when I start my shift. Night guard said got blackout around 3am, power trip.',
      restart: 'I switched off the monitor and on back. Same.',
      computer: 'The CCTV box in the server room, the sticker says NVR-L12. Lobby camera name is CAM-L12-LOBBY.',
      others: 'Only the lobby camera. The other three OK.',
      verify: 'XYZ40210. I am contractor from the security company.'
    },
    relevant: ['computer', 'others', 'when'],
    hint: 'Try "ping CAM-L12-LOBBY" and compare it with another camera. If only one camera is dead after a power trip, connect to NVR-L12 and power-cycle that camera\'s PoE port.',
    lesson: 'IP cameras get power and data from one network cable (PoE). After a power trip a camera can hang. If ping fails for one camera but the others reply, power-cycling its PoE port is the usual first fix. If it still won\'t come back, it\'s a cabling or hardware job for the vendor.',
    kb: 'cctv'
  },
  {
    id: 'cctvfootage', title: 'Request for pantry CCTV footage', category: 'Security', priority: 'P4',
    user: 'cmeiyee', host: 'XYZ-CS-005',
    body: "Someone keep stealing my Milo from the pantry fridge!! Third time this month 😤 Can you send me the pantry CCTV recording from yesterday 2pm to 4pm? I want to see who.",
    setup: () => {},
    escalate: 'Security',
    check: () => false,
    answers: {
      error: 'No error, I just want the video.',
      when: 'Yesterday afternoon, between 2 and 4.',
      restart: 'Huh? Nothing to restart.',
      computer: 'My laptop is XYZ-CS-005, but I just need the video file lah.',
      others: 'Kak Rosnah also lost her yogurt last week!',
      verify: 'XYZ24456.'
    },
    relevant: ['when'],
    hint: 'You have access to the NVR, but should you hand out recordings of colleagues to whoever asks?',
    lesson: 'CCTV footage shows identifiable people, so it is personal data under the PDPA. Viewing or exporting it needs a proper request through Security or HR, not a help desk ticket. Escalate to Security, and tell the user how to raise a formal incident.',
    kb: 'cctv'
  }
];

/* --------------------------- Knowledge base --------------------------- */
window.KB = [
  { id: 'lockout', title: 'Account lockouts', body: 'Accounts lock after too many failed sign-ins — very common after long leave (Raya, CNY, Deepavali). <b>Unlock</b> in Directory. If the user knows their password, no reset is needed. Repeated lockouts often come from an old password saved on a phone.' },
  { id: 'password', title: 'Password resets & identity (PDPA)', body: 'Always <b>verify identity</b> before a reset: ask for the staff ID and compare it with Directory. Issue a temporary password with <b>"must change at next logon"</b>. Never send passwords to personal email. Under Malaysia\'s <b>Personal Data Protection Act 2010 (PDPA)</b>, collect only the data you need — don\'t ask for full MyKad numbers or banking details in chat.' },
  { id: 'groups', title: 'Granting access with groups', body: 'Access to shared folders and apps comes from security groups. Add only what was <b>approved</b> by the manager. <b>Domain Admins</b> is never granted by the help desk.' },
  { id: 'spooler', title: 'Print queue stuck', body: 'If colleagues can print, the problem is local. Restart the <b>Print Spooler</b> service (Remote tool, or <code>net stop spooler</code> then <code>net start spooler</code>) to clear stuck jobs.' },
  { id: 'apipa', title: 'APIPA / 169.254.x.x address', body: 'A 169.254.x.x address means the PC never got an IP from DHCP. Run <code>ipconfig /release</code> then <code>ipconfig /renew</code>. If it persists, check the cable and switch port.' },
  { id: 'dns', title: 'Stale DNS cache', body: 'If a single site fails for a single user after a server change, compare <code>ping</code> (uses the local cache) with <code>nslookup</code> (asks the DNS server). <code>ipconfig /displaydns</code> shows the cache; <code>ipconfig /flushdns</code> clears it.' },
  { id: 'phishing', title: 'Phishing (LHDN, bank & courier scams)', body: 'Common lures in Malaysia impersonate <b>LHDN</b> (tax refund / e-Invoice), banks, PDRM, or courier companies. If a user <b>entered credentials</b> or opened an attachment, escalate to <b>Security</b> immediately. Security can report to <b>MyCERT</b> (CyberSecurity Malaysia) if required. Thank the user — reporting fast is exactly right.' },
  { id: 'social', title: 'Social engineering red flags', body: 'Urgency, authority ("Dato\' needs this now"), refusing verification, and requests to send credentials to outside addresses. These match Macau-scam style pressure tactics. Do not comply — escalate to <b>Security</b>.' },
  { id: 'outlook', title: 'Outlook crashes', body: 'If Outlook on the web works, the mailbox is healthy. A corrupt local profile is the usual cause — <b>rebuild the Outlook profile</b>.' },
  { id: 'software', title: 'Software requests', body: '<b>Approved</b> apps can be installed from Software Center. <b>Licensed</b> apps need manager + license approval first. <b>Blocked</b> apps are never installed — unlicensed software is a legal and malware risk.' },
  { id: 'disk', title: 'Low disk space', body: 'A system drive above ~90% slows Windows down. Run <b>Disk Cleanup</b> to remove temp files and update leftovers.' },
  { id: 'mfa', title: 'MFA resets & MFA fatigue', body: 'Resetting MFA lets the user register a new device — verify identity first. After reset, the user re-registers at next sign-in. <b>MFA fatigue</b>: a burst of prompts the user didn\'t start means someone has their password. If any prompt was approved, escalate to <b>Security</b> immediately.' },
  { id: 'cctv', title: 'CCTV, NVRs and footage requests', body: 'IP cameras connect to an <b>NVR</b> (network video recorder) and usually get power through the network cable (<b>PoE</b>). If one camera shows "No Signal" and <code>ping</code> to it fails while the others reply, <b>power-cycle its PoE port</b> on the NVR. If that fails, it\'s cabling or hardware for the vendor. <b>Footage is personal data under the PDPA</b>: never export or share it from a help desk ticket. Requests go to <b>Security</b> or HR.' },
  { id: 'escalation', title: 'When to escalate', body: '<b>Infrastructure</b>: outages, servers, many users affected. <b>Security</b>: phishing, compromised accounts, suspicious requests. <b>Desktop L2</b>: physical damage, hardware swaps. Fix L1 issues yourself — unneeded escalations get bounced back.' },
  { id: 'bm', title: 'BM phrasebook for support calls', body: '<ul class="phrase"><li><b>Boleh saya dapatkan ID pekerja anda?</b> — May I have your staff ID?</li><li><b>Tunggu sekejap ya.</b> — Please hold on a moment.</li><li><b>Sila mulakan semula komputer anda.</b> — Please restart your computer.</li><li><b>Apa mesej ralat yang keluar?</b> — What error message appears?</li><li><b>Boleh cuba sekali lagi sekarang?</b> — Can you try again now?</li><li><b>Saya akan escalate kepada pasukan Security.</b> — I\'ll escalate to the Security team.</li><li><b>Masalah dah selesai?</b> — Is the problem solved?</li><li><b>Terima kasih atas kesabaran anda.</b> — Thank you for your patience.</li></ul>' }
];
