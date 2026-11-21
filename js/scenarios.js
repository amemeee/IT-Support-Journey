/* =========================================================
   IT Support Journey — scenario & world data (Malaysia edition)
   Setting: Kenanga Digital Sdn Bhd, Level 12, Menara KD, Kuala Lumpur.
   Each scenario mutates the "world" when its ticket spawns (setup)
   and is checked against the world when resolved (check).
   ========================================================= */

window.COMPANY = { name: 'Kenanga Digital Sdn Bhd', office: 'Menara KD, Kuala Lumpur', domain: 'kdigital.local' };

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
  naisyah:  U('Nurul Aisyah binti Ahmad', 'HR', 'HR Executive', 'KD20417', ['All-Staff', 'HR-RW', 'VPN-Users']),
  nain:     U('Nurul Ain binti Razak', 'Operations', 'Warehouse Supervisor', 'KD31877', ['All-Staff', 'Ops-RW']),
  twming:   U('Tan Wei Ming', 'Finance', 'Senior Accountant', 'KD18820', ['All-Staff', 'Finance-RW', 'VPN-Users']),
  twmin:    U('Tan Wei Min', 'Engineering', 'Software Engineer', 'KD22901', ['All-Staff', 'Engineering-RW', 'VPN-Users']),
  psubra:   U('Priya a/p Subramaniam', 'Finance', 'Financial Analyst', 'KD25510', ['All-Staff', 'Marketing-RW']),
  lsling:   U('Lim Siew Ling', 'Operations', 'Ops Coordinator', 'KD19034', ['All-Staff', 'Ops-RW']),
  mfaiz:    U('Muhammad Faiz bin Osman', 'Engineering', 'QA Engineer', 'KD23345', ['All-Staff', 'Engineering-RW']),
  kavitha:  U('Kavitha a/p Rajan', 'Marketing', 'Content Lead', 'KD26677', ['All-Staff', 'Marketing-RW']),
  jwong:    U('Jason Wong Kah Hoe', 'Sales', 'Account Manager', 'KD27781', ['All-Staff', 'Sales-RW', 'VPN-Users']),
  shajar:   U('Siti Hajar binti Yusof', 'Legal', 'Legal Executive', 'KD21190', ['All-Staff', 'Legal-RW']),
  draj:     U('Daniel Raj a/l Kumar', 'Marketing', 'Graphic Designer', 'KD28802', ['All-Staff', 'Marketing-RW']),
  rosnah:   U('Rosnah binti Hassan', 'Operations', 'Office Manager', 'KD17723', ['All-Staff', 'Ops-RW']),
  azaki:    U('Ahmad Zaki bin Ismail', 'Sales', 'Sales Manager', 'KD15502', ['All-Staff', 'Sales-RW', 'VPN-Users']),
  ahakim:   U('Aiman Hakim bin Zulkifli', 'Sales', 'Sales Executive (new hire)', 'KD30001', [], { enabled: false, mfa: 'Not registered' }),
  cmeiyee:  U('Chong Mei Yee', 'Customer Support', 'Support Specialist', 'KD24456', ['All-Staff']),
  dkamal:   U("Dato' Kamal bin Ismail", 'Executive', 'Chief Executive Officer', 'KD00001', ['All-Staff', 'VPN-Users']),
  fnadia:   U('Farah Nadia binti Rahim', 'Finance', 'Payroll Executive', 'KD29934', ['All-Staff', 'Finance-RW']),
  arjun:    U('Arjun a/l Selvam', 'Customer Support', 'Team Lead', 'KD20088', ['All-Staff']),
  ksoon:    U('Khoo Soon Lee', 'Sales', 'Sales Executive', 'KD26001', ['All-Staff', 'Sales-RW']),
  htanaka:  U('Hiroshi Tanaka', 'Sales', 'Regional Sales Director (expat, Tokyo)', 'KD30112', ['All-Staff', 'Sales-RW'])
};

const H = (owner, ip, extra = {}) => Object.assign({
  owner, ip, apipa: false, dnsStale: false, spooler: 'Running', queue: 0,
  disk: 40 + Math.floor(Math.random() * 25), outlook: 'Healthy',
  software: ['Microsoft 365', 'Chrome', 'Teams'], os: 'Windows 11 Pro 23H2'
}, extra);

window.HOSTS = {
  'KD-HR-022':    H('naisyah', '10.12.3.22'),
  'KD-FIN-010':   H('twming', '10.12.5.10'),
  'KD-FIN-031':   H('psubra', '10.12.5.31'),
  'KD-OPS-031':   H('lsling', '10.12.6.31'),
  'KD-ENG-007':   H('mfaiz', '10.12.7.7'),
  'KD-MKT-019':   H('kavitha', '10.12.8.19'),
  'KD-SLS-008':   H('jwong', '10.12.4.8'),
  'KD-LEG-004':   H('shajar', '10.12.9.4'),
  'KD-MKT-027':   H('draj', '10.12.8.27'),
  'KD-OPS-002':   H('rosnah', '10.12.6.2'),
  'KD-SLS-021':   H('ahakim', '10.12.4.21'),
  'KD-CS-005':    H('cmeiyee', '10.12.10.5'),
  'KD-CS-011':    H('arjun', '10.12.10.11'),
  'KD-SLS-030':   H('htanaka', '10.12.4.30'),
  'KD-SLS-014':   H('ksoon', '10.12.4.14')
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
    user: 'naisyah', host: 'KD-HR-022',
    body: "Hi IT, saya baru balik cuti Raya and Windows says my account is locked. I think I keyed in my old password too many times 😅",
    setup: w => { w.users.naisyah.locked = true; },
    check: w => !w.users.naisyah.locked && w.users.naisyah.enabled,
    answers: {
      error: 'It says "The referenced account is currently locked out and may not be logged on to."',
      when: 'Pagi tadi, first thing when I tried to log in.',
      restart: 'Dah restart twice already. Same message.',
      computer: 'The sticker says KD-HR-022.',
      others: 'Rasanya just me.',
      verify: 'Boleh, my staff ID is KD20417.'
    },
    relevant: ['error'],
    avoid: { resetPwd: { label: 'Unnecessary password reset (user knows their password)', pts: -10 } },
    hint: 'Search "Nurul" in Directory — there are two! A locked account only needs Unlock.',
    lesson: 'Lockouts come from repeated wrong passwords (very common after long leave like Raya or CNY). Unlock the account; only reset the password if the user actually forgot it. Always confirm you picked the right person — Malaysian names are often similar.',
    kb: 'lockout'
  },
  {
    id: 'pwdexpired', title: 'Password expired while WFH', category: 'Account', priority: 'P2',
    user: 'twming', host: 'KD-FIN-010', sensitive: true,
    body: "My password expired while I was WFH on my Unifi and now cannot change at the login screen. Month-end closing today, please help urgently!",
    setup: w => { w.users.twming.pwdExpired = true; },
    check: w => !w.users.twming.pwdExpired,
    answers: {
      error: '"Your password has expired and must be changed." Then it says cannot reach the domain.',
      when: 'Since last night.',
      restart: 'Yes, still the same lah.',
      computer: 'KD-FIN-010',
      others: 'No, only me.',
      verify: 'Sure — staff ID KD18820.'
    },
    relevant: ['error', 'verify'],
    hint: 'Password resets are sensitive: ask for the staff ID and compare it with Directory (watch out for Tan Wei Min vs Tan Wei Ming), then Reset password with "must change at next logon".',
    lesson: 'Before any password reset, verify identity. Issue a temporary password and force a change at next logon. Under the PDPA, only collect what you need — a staff ID is enough; no need for full MyKad numbers.',
    kb: 'password'
  },
  {
    id: 'share', title: 'Access denied on Finance drive', category: 'Access', priority: 'P3',
    user: 'psubra', host: 'KD-FIN-031',
    body: "I transferred to Finance last week but get 'Access denied' on \\\\fs01\\finance. My manager Encik Hafiz already approved — approval email attached.",
    setup: () => {},
    check: w => w.users.psubra.groups.includes('Finance-RW'),
    answers: {
      error: '"You do not have permission to access \\\\fs01\\finance. Contact your network administrator."',
      when: 'Since my first day in the team.',
      restart: 'Yes, still denied.',
      computer: 'KD-FIN-031',
      others: 'My teammates can open it, no problem.',
      verify: 'KD25510.'
    },
    relevant: ['error', 'others'],
    hint: 'Shared folder access comes from security groups. Check Priya\'s groups and add the Finance one. Approval is attached.',
    lesson: 'Grant access through groups, only what was approved. When someone transfers departments, old access should be reviewed too — and never hand out admin groups.',
    kb: 'groups'
  },
  {
    id: 'printer', title: 'Print jobs stuck', category: 'Hardware', priority: 'P3',
    user: 'lsling', host: 'KD-OPS-031',
    body: "The Level 12 printer cannot print from my laptop. I sent my report 5 times already, nothing come out!",
    setup: w => { const h = w.hosts['KD-OPS-031']; h.spooler = 'Stuck'; h.queue = 14; },
    check: w => { const h = w.hosts['KD-OPS-031']; return h.spooler === 'Running' && h.queue === 0; },
    answers: {
      error: 'No error, the documents just stuck at "Printing...".',
      when: 'About one hour ago.',
      restart: "Haven't restart, I'm in the middle of work.",
      computer: "It's KD-OPS-031.",
      others: 'Kak Rosnah beside me printed fine 10 minutes ago.'
    },
    relevant: ['computer', 'others'],
    hint: 'Others can print, so the printer is fine — it\'s this laptop. Get the computer name, connect via Remote, and restart the Print Spooler (or net stop/start spooler in Terminal).',
    lesson: 'If colleagues can print, the problem is local. A stuck Print Spooler holds the queue; restarting it clears stuck jobs.',
    kb: 'spooler'
  },
  {
    id: 'nointernet', title: 'No network on desktop', category: 'Network', priority: 'P2',
    user: 'mfaiz', host: 'KD-ENG-007',
    body: "Bro, my desktop got no internet and no network drive since this morning. The network icon got yellow warning triangle.",
    setup: w => { w.hosts['KD-ENG-007'].apipa = true; },
    check: w => !w.hosts['KD-ENG-007'].apipa,
    answers: {
      error: 'Hover the icon it says "No Internet access".',
      when: 'Since I came in this morning.',
      restart: 'Dah reboot once. Cable plugged in, the light blinking.',
      computer: 'KD-ENG-007',
      others: 'Everyone else around me online.'
    },
    relevant: ['computer', 'restart'],
    hint: 'Connect to KD-ENG-007 and run ipconfig. 169.254.x.x means it never got an IP from DHCP — try ipconfig /release then ipconfig /renew.',
    lesson: 'A 169.254.x.x (APIPA) address means DHCP failed. Releasing and renewing the lease usually fixes it; if not, check cabling/switch port.',
    kb: 'apipa'
  },
  {
    id: 'dns', title: 'HR portal cannot load', category: 'Network', priority: 'P3',
    user: 'kavitha', host: 'KD-MKT-019',
    body: "portal.kdigital.local cannot load for me, but Google and everything else OK. My colleague can open the portal. I need to apply leave for Deepavali!",
    setup: w => { w.hosts['KD-MKT-019'].dnsStale = true; },
    check: w => !w.hosts['KD-MKT-019'].dnsStale,
    answers: {
      error: '"This site can\'t be reached — took too long to respond."',
      when: 'Since IT moved the portal to the new server on Monday, I think?',
      restart: "Haven't try, I got like 40 tabs open.",
      computer: 'KD-MKT-019',
      others: 'No, my colleague can open it.'
    },
    relevant: ['computer', 'others', 'when'],
    hint: 'The portal moved servers. Connect to KD-MKT-019, compare "ping portal.kdigital.local" with "nslookup portal.kdigital.local", check ipconfig /displaydns, then ipconfig /flushdns.',
    lesson: 'One site failing for one user after a server move = likely stale DNS cache. ipconfig /flushdns clears it.',
    kb: 'dns'
  },
  {
    id: 'phishing', title: '"LHDN e-Invoice" email', category: 'Security', priority: 'P1',
    user: 'jwong', host: 'KD-SLS-008',
    body: "Got email from 'LHDN MyInvois' saying our e-Invoice got problem, must login at myinvois-lhdn-verify.com with my Microsoft 365 account. I keyed in my password then the page went blank... is that normal?",
    setup: () => {},
    escalate: 'Security',
    check: () => false,
    answers: {
      error: 'No error, the page just went white after I login.',
      when: 'About 15 minutes ago.',
      restart: 'Should I? Haven\'t yet.',
      computer: 'KD-SLS-008',
      others: 'A few people in Sales got the same email also.',
      verify: 'KD27781.'
    },
    relevant: ['when', 'others'],
    hint: 'The user entered their password on a fake site pretending to be a government agency. This is a security incident — not a normal L1 fix.',
    lesson: 'Scammers often impersonate LHDN, banks or PDRM. Credentials entered on a phishing site = security incident: escalate to Security immediately so they can reset credentials, revoke sessions, block the sender, and report to MyCERT (CyberSecurity Malaysia) if needed.',
    kb: 'phishing'
  },
  {
    id: 'outlook', title: 'Outlook crashes on launch', category: 'Software', priority: 'P3',
    user: 'shajar', host: 'KD-LEG-004',
    body: "Outlook crash every time I open it. Teams and others are fine. I need my email for a court filing deadline today!",
    setup: w => { w.hosts['KD-LEG-004'].outlook = 'Crashing (profile corrupt)'; },
    check: w => w.hosts['KD-LEG-004'].outlook === 'Healthy',
    answers: {
      error: '"Microsoft Outlook has stopped working." Then it closes.',
      when: 'After my laptop updated last night.',
      restart: 'Yes, twice.',
      computer: 'KD-LEG-004',
      others: 'Others are fine. Outlook web on browser works for me too.'
    },
    relevant: ['error', 'computer', 'others'],
    hint: 'Webmail works, so the mailbox is fine — it\'s the local Outlook profile. Connect via Remote and rebuild the Outlook profile.',
    lesson: 'If webmail works but desktop Outlook crashes, the mailbox is fine and the local profile is the suspect. Rebuilding the profile is a safe fix.',
    kb: 'outlook'
  },
  {
    id: 'software', title: 'Need Zoom and Photoshop', category: 'Software', priority: 'P4',
    user: 'draj', host: 'KD-MKT-027',
    body: "Hi boss! Can help install Zoom and Adobe Photoshop on my laptop? Client call this afternoon and I want to edit some images. Thanks ya!",
    setup: () => {},
    check: w => { const s = w.hosts['KD-MKT-027'].software; return s.includes('Zoom') && !s.includes('Adobe Photoshop'); },
    answers: {
      error: 'No error, just don\'t have the apps.',
      when: 'Need by 2pm if can!',
      restart: 'Not broken lah, just need apps 🙂',
      computer: 'KD-MKT-027',
      others: 'N/A'
    },
    relevant: ['computer'],
    hint: 'Check software policy in Remote > Software Center. Approved apps can be installed; licensed apps need approval first.',
    lesson: 'Install only approved software. Paid apps need manager + license approval — guide the user to request it. Unlicensed software is a legal risk for the company (and pirated software is a common malware source).',
    kb: 'software'
  },
  {
    id: 'outage', title: 'Email down for whole floor', category: 'Outage', priority: 'P1',
    user: 'rosnah', host: 'KD-OPS-002',
    body: "Habis! Nobody on Level 12 can get email! Outlook says 'Disconnected' for everyone and phones also cannot.",
    setup: w => { w.outage = true; },
    escalate: 'Infrastructure',
    check: () => false,
    answers: {
      error: 'Outlook says "Disconnected" at the bottom bar.',
      when: 'About 10 minutes ago, all at once.',
      restart: 'A few people restarted, nothing changed.',
      computer: 'KD-OPS-002, but it\'s everyone.',
      others: 'Yes! Whole floor, maybe more. Phones also.'
    },
    relevant: ['others', 'when'],
    hint: 'Many users + phones affected at once = server-side. Try "ping mail.kdigital.local" from your own terminal.',
    lesson: 'When many users break at once, it\'s an outage. Confirm quickly, then escalate to Infrastructure — don\'t troubleshoot desktops one by one.',
    kb: 'escalation'
  },
  {
    id: 'newhire', title: 'New hire cannot log in', category: 'Account', priority: 'P2',
    user: 'azaki', targets: ['ahakim', 'azaki'], host: 'KD-SLS-021',
    body: "Aiman Hakim starts in my team today and cannot log in. HR already completed onboarding — please enable his account and give standard Sales access (All-Staff + Sales-RW). Terima kasih!",
    setup: () => {},
    check: w => { const u = w.users.ahakim; return u.enabled && u.groups.includes('All-Staff') && u.groups.includes('Sales-RW'); },
    answers: {
      error: 'Aiman says it shows "Your account has been disabled."',
      when: 'This morning, his first day.',
      restart: 'He rebooted, same thing.',
      computer: 'KD-SLS-021',
      others: 'Just Aiman.',
      verify: 'I\'m Ahmad Zaki, KD15502. Aiman reports to me.'
    },
    relevant: ['error'],
    hint: 'Find Aiman Hakim in Directory, Enable the account, then add exactly the two groups requested.',
    lesson: 'Onboarding: enable the pre-created account and grant the standard role groups only. Least privilege — no extras.',
    kb: 'groups'
  },
  {
    id: 'diskfull', title: 'Laptop very slow', category: 'Hardware', priority: 'P4',
    user: 'cmeiyee', host: 'KD-CS-005',
    body: "My laptop super slow and keep popping up 'low disk space'. Open one file also take 2 minutes. Customers waiting!",
    setup: w => { w.hosts['KD-CS-005'].disk = 98; },
    check: w => w.hosts['KD-CS-005'].disk < 90,
    answers: {
      error: '"You\'re running out of space on Local Disk (C:)."',
      when: 'Getting worse the whole week.',
      restart: 'Yes, still slow.',
      computer: 'KD-CS-005',
      others: 'No, just mine.'
    },
    relevant: ['computer', 'error'],
    hint: 'Connect to KD-CS-005 and check the disk usage. Run Disk Cleanup.',
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
      verify: 'I don\'t have my staff pass with me... KD00010 or something. Just DO it, I will remember your name.'
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
    answers: {
      error: 'It keeps asking me to approve on my old phone, which I already traded in.',
      when: 'Since this morning.',
      restart: 'Yes, restarted the phone.',
      computer: 'I\'m calling from my desk phone, laptop is KD-FIN-044.',
      others: 'Only me.',
      verify: 'Of course — KD29934.'
    },
    relevant: ['verify'],
    hint: 'MFA resets are sensitive — verify identity first, then use Reset MFA in Directory.',
    lesson: 'Resetting MFA lets someone register a new device, so verify identity just as carefully as for a password reset.',
    kb: 'mfa'
  },
  {
    id: 'hardware', title: 'Teh tarik spilled on laptop', category: 'Hardware', priority: 'P2',
    user: 'arjun', host: 'KD-CS-011',
    body: "Alamak, my teh tarik tumpah on my laptop 😭 Half the keys not working and it smells a bit burnt. How??",
    setup: () => {},
    escalate: 'Desktop L2',
    check: () => false,
    answers: {
      error: 'Keys on the left side cannot type, the trackpad jumping.',
      when: 'Five minutes ago.',
      restart: 'Should I restart it?',
      computer: 'KD-CS-011',
      others: 'Just me (and my pants).'
    },
    relevant: ['when'],
    hint: 'No software fix here. Liquid damage needs a hardware swap from the desk-side team.',
    lesson: 'Liquid damage: tell the user to power off and unplug immediately, then escalate to Desktop L2 for a loaner and repair. Never troubleshoot remotely.',
    kb: 'escalation'
  },
  {
    id: 'expatvpn', title: 'New expat needs VPN', category: 'Access', priority: 'P3',
    user: 'htanaka', host: 'KD-SLS-030',
    body: "Hello. I am Tanaka, new Regional Director, I moved from Tokyo office last week. Next week I go to Singapore and Jakarta, so I need VPN. My manager already approve, email is attached. Sorry for trouble, thank you very much.",
    setup: () => {},
    check: w => w.users.htanaka.groups.includes('VPN-Users'),
    answers: {
      error: 'The VPN application says "You are not authorized to connect." I think my account is not ready?',
      when: 'I tried yesterday first time. My flight is Monday.',
      restart: 'Yes, I restart the laptop. Same message.',
      computer: 'KD-SLS-030. It is new laptop from IT.',
      others: 'My team can use VPN, only me cannot.',
      verify: 'Yes, my staff ID is KD30112.'
    },
    relevant: ['error', 'others'],
    hint: 'VPN access comes from a group. Check which groups Hiroshi has. Approval is attached. Keep your replies in clear, simple English.',
    lesson: 'Remote access is granted through a group (VPN-Users here). With international staff, use plain English and avoid slang or BM, and confirm what you did in writing so nothing gets lost in translation.',
    kb: 'groups'
  },
  {
    id: 'mfafatigue', title: 'Dozens of MFA prompts at 2am', category: 'Security', priority: 'P1',
    user: 'ksoon', host: 'KD-SLS-014',
    body: "Since 2am my phone keep getting 'Approve sign-in?' notifications, like 30 times already. I wasn't logging in. Half asleep I pressed Approve once just to make it stop... is that bad ah?",
    setup: () => {},
    escalate: 'Security',
    check: () => false,
    answers: {
      error: 'No error. Just "Approve sign-in request?" again and again, location says somewhere overseas.',
      when: 'Started around 2am, stopped after I pressed Approve.',
      restart: 'I switched off my phone for a while, when I on back it continued.',
      computer: 'KD-SLS-014, but this is on my phone.',
      others: "Don't know, I only noticed mine.",
      verify: 'KD26001.'
    },
    relevant: ['when', 'error'],
    reveal: { key: 'hacker', name: 'Unknown attacker', text: "The attacker already had Soon Lee's password, bought from an old data leak, and kept sending MFA requests until he approved one. That approval gave them a live session in his mailbox." },
    hint: 'Many unexpected MFA prompts mean someone else has the password. One was approved, so this is an active compromise.',
    lesson: "This is an MFA fatigue attack: the attacker has the password and spams prompts hoping for one approval. Escalate to Security immediately so they can revoke sessions, reset the password and check the mailbox. Remind users to press Deny on prompts they didn't start.",
    kb: 'mfa'
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
  { id: 'escalation', title: 'When to escalate', body: '<b>Infrastructure</b>: outages, servers, many users affected. <b>Security</b>: phishing, compromised accounts, suspicious requests. <b>Desktop L2</b>: physical damage, hardware swaps. Fix L1 issues yourself — unneeded escalations get bounced back.' },
  { id: 'bm', title: 'BM phrasebook for support calls', body: '<ul class="phrase"><li><b>Boleh saya dapatkan ID pekerja anda?</b> — May I have your staff ID?</li><li><b>Tunggu sekejap ya.</b> — Please hold on a moment.</li><li><b>Sila mulakan semula komputer anda.</b> — Please restart your computer.</li><li><b>Apa mesej ralat yang keluar?</b> — What error message appears?</li><li><b>Boleh cuba sekali lagi sekarang?</b> — Can you try again now?</li><li><b>Saya akan escalate kepada pasukan Security.</b> — I\'ll escalate to the Security team.</li><li><b>Masalah dah selesai?</b> — Is the problem solved?</li><li><b>Terima kasih atas kesabaran anda.</b> — Thank you for your patience.</li></ul>' }
];
