/* =========================================================
   Batch 5 — Apps & collaboration
   Adds: OneDrive, SharePoint sites, Teams, meeting rooms,
   enterprise app consents, external portals, per-PC apps
   (running apps, Teams mic, Office add-ins, browser
   extensions), 15 scenarios and KB articles.
   ========================================================= */
import { HOSTS, SOFTWARE } from './core.js';

// every managed PC gets app details the Remote panel can show
Object.values(HOSTS).forEach(h => {
  if (h.type === 'nvr') return;
  Object.assign(h, {
    running: ['Microsoft Teams', 'Outlook', 'Chrome'],
    mics: ['Headset (Jabra Evolve2 65)', 'Laptop microphone array', 'Monitor speakers (HDMI)'],
    teamsMic: 'Headset (Jabra Evolve2 65)',
    addins: [{ name: 'Microsoft Teams Meeting Add-in', app: 'Outlook', on: true }],
    extensions: [{ name: 'Microsoft Single Sign On', perms: 'Sign you in to Microsoft sites' }]
  });
});

SOFTWARE.push({ name: 'WhatsApp Desktop', policy: 'blocked' });

// characters a OneDrive / SharePoint file name can't contain
export const BAD_NAME = /["*:<>?/\\|]/;

export const APPS = {
  onedrive: {
    twming: { files: [{ name: 'Budget: Q3 final?.xlsx', sync: 'Error: name not allowed' }, { name: 'Month-end checklist.docx', sync: 'Synced' }] },
    psubra: { files: [{ name: 'Cashflow FY26.xlsx', sync: 'Synced', current: 'v5 · today 10:12', versions: ['v5 · today 10:12', 'v4 · yesterday 17:40', 'v3 · Mon 09:05'], restored: null }] },
    fnadia: { files: [{ name: 'Payroll Oct.xlsx', sync: 'Synced', link: 'Specific people' }, { name: 'KWSP contribution Oct.pdf', sync: 'Synced', link: null }] }
  },
  sites: {
    'Raya Campaign 2026': { owners: ['kavitha'], members: ['niman'], visitors: [], recycle: [] },
    'Finance Team': { owners: ['twming'], members: ['fnadia', 'psubra'], visitors: [], recycle: [] }
  },
  teams: {
    'Sales APAC': { owners: ['kevintan (left)'], members: ['jwong', 'ksoon', 'htanaka'] },
    'Legal Matters': { owners: ['shajar'], members: [] }
  },
  rooms: {
    Melati: { capacity: 8, autoAccept: true, allowConflicts: false },
    Cempaka: { capacity: 12, autoAccept: true, allowConflicts: false }
  },
  enterpriseApps: [
    { name: 'Zoom', publisher: 'Zoom Video Communications (verified)', perms: 'Sign in and read user profile', consentedBy: 'admin' }
  ],
  externalAccess: { allowedDomains: [] },
  portals: [
    { name: 'MyInvois (LHDN e-Invoice)', owner: 'Finance Manager (Encik Hafiz)', how: 'Users and roles are added inside MyInvois by the company\'s registered administrator.' },
    { name: 'KWSP i-Akaun (Employer)', owner: 'HR Manager', how: 'Employer users are managed in i-Akaun by the HR Manager.' },
    { name: 'Business banking', owner: 'Finance Manager with the bank', how: 'User tokens and limits are set up by the bank on the Finance Manager\'s request.' }
  ],
  viewedPortals: false
};

const A = w => w.apps;
const file = (w, k, name) => A(w).onedrive[k].files.find(f => f.name === name);

export const APP_SCENARIOS = [
  {
    id: 'onedrivesync', title: 'OneDrive red X, file not syncing', category: 'Apps', priority: 'P3',
    user: 'twming', host: 'XYZ-FIN-010',
    body: "One of my budget files has a red X in OneDrive and is not syncing. My manager can't see the latest version. Month-end!",
    setup: () => {},
    check: w => A(w).onedrive.twming.files.every(f => !BAD_NAME.test(f.name) && f.sync === 'Synced'),
    solve: w => { Object.assign(A(w).onedrive.twming.files[0], { name: 'Budget Q3 final.xlsx', sync: 'Synced' }); },
    answers: {
      error: 'Hover the red X: "This item can\'t be synced. The file name contains characters that aren\'t allowed."',
      when: 'Since I saved it this morning.',
      restart: 'Restarted OneDrive and laptop. Still red X.',
      computer: 'XYZ-FIN-010.',
      others: 'Only this one file. Other files sync fine.',
      verify: 'XYZ18820.'
    },
    relevant: ['error'],
    hint: 'Apps → OneDrive → Tan Wei Ming. Look at the file name. Which characters are not allowed?',
    lesson: 'OneDrive and SharePoint reject file names containing " * : < > ? / \\ |. Renaming the file without those characters fixes the sync. Explain it to the user so it doesn\'t keep happening.',
    kb: 'onedrive'
  },
  {
    id: 'publiclink', title: 'Salary file shared with "Anyone with the link"', category: 'Security', priority: 'P1',
    user: 'naisyah', targets: ['naisyah', 'fnadia'],
    body: "Urgent from HR: someone forwarded us a link to the October payroll file in Farah's OneDrive. It opens without signing in! The link was posted in a supplier's WhatsApp group 😱",
    setup: w => { file(w, 'fnadia', 'Payroll Oct.xlsx').link = 'Anyone with the link (no sign-in)'; },
    escalate: 'Security',
    check: () => false,
    bonus: { check: w => !file(w, 'fnadia', 'Payroll Oct.xlsx').link, label: 'Removed the public link first', pts: 20 },
    answers: {
      error: 'The link opens the file straight away, no login.',
      when: 'We found out 10 minutes ago. Farah thinks she shared it last week by mistake.',
      restart: 'Nothing to restart.',
      computer: "It's in Farah's OneDrive.",
      others: 'It was posted in a supplier WhatsApp group with about 40 people.',
      verify: 'XYZ20417.'
    },
    relevant: ['when', 'others'],
    hint: 'Stop more people opening it (Apps → OneDrive → Farah → remove the link), then this is a possible PDPA breach for Security.',
    lesson: 'An "Anyone" link with personal data that has been seen outside the company is a possible data breach. Remove the link straight away to stop further access, then escalate to Security: they check the access logs and decide on PDPA breach notification.',
    kb: 'sharing'
  },
  {
    id: 'spsite', title: 'Add Daniel to the Raya campaign site', category: 'Apps', priority: 'P4',
    user: 'kavitha', targets: ['kavitha', 'draj'],
    body: "Can add Daniel to our 'Raya Campaign 2026' SharePoint site? He needs to edit the design files. I'm the site owner. Thanks!",
    setup: () => {},
    check: w => A(w).sites['Raya Campaign 2026'].members.includes('draj'),
    solve: w => { A(w).sites['Raya Campaign 2026'].members.push('draj'); },
    forbid: { spOwner: { label: 'Gave owner rights when edit access was asked for', pts: -20 } },
    answers: {
      error: 'He gets "Access required" when he opens the site.',
      when: 'He joined the campaign this week.',
      restart: 'N/A',
      computer: 'N/A',
      others: 'Only Daniel. The intern already has access.',
      verify: 'XYZ26677, I own the site.'
    },
    relevant: ['error'],
    hint: 'Apps → SharePoint → Raya Campaign 2026. "Edit" means the Members group, not Owners.',
    lesson: 'SharePoint sites have three standard groups: Owners (full control), Members (edit) and Visitors (read). Add people to the group that matches what was asked. Edit access is Members.',
    kb: 'sharepoint'
  },
  {
    id: 'teamscamera', title: 'Teams camera not working', category: 'Apps', priority: 'P3',
    user: 'jwong', host: 'XYZ-SLS-008',
    body: "Teams says 'We can't access your camera' 5 minutes before my client call! It worked yesterday. Please help fast 😰",
    setup: w => { w.hosts['XYZ-SLS-008'].running.push('Zoom (background, using camera)'); },
    check: w => !w.hosts['XYZ-SLS-008'].running.some(a => a.startsWith('Zoom')),
    solve: w => { const h = w.hosts['XYZ-SLS-008']; h.running = h.running.filter(a => !a.startsWith('Zoom')); },
    answers: {
      error: '"We can\'t access your camera. It might be in use by another app."',
      when: 'Just now. Yesterday I had a Zoom call with another client and it was fine.',
      restart: 'No time to restart, call is in 5 minutes!',
      computer: 'XYZ-SLS-008.',
      others: 'Only me.',
      verify: 'XYZ27781.'
    },
    relevant: ['error', 'when'],
    hint: '"In use by another app": connect via Remote and check what is running.',
    lesson: 'A laptop camera can only be used by one app at a time. Apps like Zoom keep running in the background after a call. Ending the other app frees the camera without a restart.',
    kb: 'teams'
  },
  {
    id: 'teamsmic', title: 'Customers can\'t hear me on Teams', category: 'Apps', priority: 'P3',
    user: 'cmeiyee', host: 'XYZ-CS-005',
    body: "Since I plugged into the new monitor, customers on Teams say they can't hear me at all. My headset is plugged in and I can hear them fine.",
    setup: w => { w.hosts['XYZ-CS-005'].teamsMic = 'Monitor speakers (HDMI)'; },
    check: w => w.hosts['XYZ-CS-005'].teamsMic.startsWith('Headset'),
    solve: w => { w.hosts['XYZ-CS-005'].teamsMic = 'Headset (Jabra Evolve2 65)'; },
    answers: {
      error: 'No error. The mic icon is not muted, but nobody hears me.',
      when: 'Since they installed the new monitor this morning.',
      restart: 'Restarted Teams, same.',
      computer: 'XYZ-CS-005.',
      others: 'Only me.',
      verify: 'XYZ24456.'
    },
    relevant: ['when'],
    hint: 'A new monitor can change the default audio device. Remote → Teams devices: which microphone is Teams using?',
    lesson: 'Plugging in a monitor or dock can switch the audio device. Check the device selected in Teams (Settings → Devices) before anything else. A monitor usually has speakers but no microphone.',
    kb: 'teams'
  },
  {
    id: 'sprestore', title: 'Deleted the Audit 2025 folder by mistake', category: 'Apps', priority: 'P2',
    user: 'twming',
    body: "Aiyo, I deleted the 'Audit 2025' folder on the Finance Team SharePoint while tidying up. The auditors come tomorrow! Can recover?",
    setup: w => { A(w).sites['Finance Team'].recycle.push({ item: 'Audit 2025 (folder, 214 files)', deletedBy: 'twming', when: 'Today 11:20', restored: false }); },
    check: w => A(w).sites['Finance Team'].recycle.some(r => r.item.startsWith('Audit 2025') && r.restored),
    solve: w => { A(w).sites['Finance Team'].recycle[0].restored = true; },
    answers: {
      error: 'No error, the folder is just gone.',
      when: 'About 11.20 this morning.',
      restart: 'N/A',
      computer: 'XYZ-FIN-010.',
      others: 'Everyone in Finance lost it, it was on the shared site.',
      verify: 'XYZ18820.'
    },
    relevant: ['when'],
    hint: 'Apps → SharePoint → Finance Team → Recycle bin.',
    lesson: 'Deleted SharePoint and OneDrive items go to the recycle bin and can be restored for 93 days. Restore it from there rather than asking for a backup restore.',
    kb: 'sharepoint'
  },
  {
    id: 'versionhistory', title: 'Overwrote the cashflow spreadsheet', category: 'Apps', priority: 'P3',
    user: 'psubra',
    body: "I accidentally pasted over half the Cashflow FY26 sheet and it autosaved 😭 Yesterday's version was correct. Can get it back?",
    setup: () => {},
    check: w => file(w, 'psubra', 'Cashflow FY26.xlsx').restored === 'v4 · yesterday 17:40',
    solve: w => { file(w, 'psubra', 'Cashflow FY26.xlsx').restored = 'v4 · yesterday 17:40'; },
    answers: {
      error: 'No error, the numbers are just wrong now.',
      when: 'This morning around 10am. Yesterday evening it was correct.',
      restart: 'N/A',
      computer: 'XYZ-FIN-031.',
      others: 'Only my file.',
      verify: 'XYZ25510.'
    },
    relevant: ['when'],
    hint: 'Apps → OneDrive → Priya → Cashflow FY26.xlsx → versions. Pick the one from before the mistake.',
    lesson: 'OneDrive and SharePoint keep earlier versions of every file. Restoring the last good version is quicker and safer than any backup restore. Check the times carefully to pick the right one.',
    kb: 'onedrive'
  },
  {
    id: 'myinvois', title: 'Need access to the MyInvois portal', category: 'Apps', priority: 'P4',
    user: 'psubra',
    body: "I need access to the MyInvois portal to issue e-Invoices for our customers. Can IT give me access? My manager said ask IT.",
    setup: () => {},
    check: w => A(w).viewedPortals,
    solve: w => { A(w).viewedPortals = true; },
    answers: {
      error: 'No error, I just don\'t have a login with our company in MyInvois.',
      when: 'Need it by next week.',
      restart: 'N/A',
      computer: 'XYZ-FIN-031.',
      others: 'Fatimah in Finance has access already.',
      verify: 'XYZ25510.'
    },
    relevant: ['others'],
    hint: 'Is MyInvois a system IT manages? Apps → Portals shows who looks after each external portal.',
    lesson: "Government and bank portals like MyInvois, KWSP i-Akaun and business banking are managed by the company's own registered admin, not IT. Point the user to the right person (here the Finance Manager) and close the ticket.",
    kb: 'portals'
  },
  {
    id: 'exceladdin', title: 'Excel crashes when opening files', category: 'Apps', priority: 'P3',
    user: 'shajar', host: 'XYZ-LEG-004',
    body: "Excel closes by itself every time I open a spreadsheet. Started after I installed a 'PDF Converter' thing yesterday to convert court documents.",
    setup: w => { w.hosts['XYZ-LEG-004'].addins.push({ name: 'QuickPDF Converter (COM add-in)', app: 'Excel', on: true, crash: true }); },
    check: w => !w.hosts['XYZ-LEG-004'].addins.some(a => a.crash && a.on),
    solve: w => { w.hosts['XYZ-LEG-004'].addins.find(a => a.crash).on = false; },
    answers: {
      error: 'Excel opens, shows the file for 1 second, then closes. No message.',
      when: 'Since yesterday after installing QuickPDF Converter.',
      restart: 'Restarted twice.',
      computer: 'XYZ-LEG-004.',
      others: 'Only me. Word works fine.',
      verify: 'XYZ21190.'
    },
    relevant: ['when'],
    hint: 'A crash that started right after installing an add-on: Remote → Office add-ins.',
    lesson: 'When an Office app crashes right after a new add-in was installed, disable the add-in (File → Options → Add-ins → COM Add-ins). Starting Excel in safe mode (excel /safe) is a quick way to confirm an add-in is the cause.',
    kb: 'officeaddins'
  },
  {
    id: 'chromeext', title: 'Browser full of ads and weird search', category: 'Security', priority: 'P3',
    user: 'draj', host: 'XYZ-MKT-027',
    body: "My Chrome suddenly shows ads everywhere and Google searches go to some weird search site. I installed a 'PDF Converter Pro' extension yesterday, could it be?",
    setup: w => { w.hosts['XYZ-MKT-027'].extensions.push({ name: 'PDF Converter Pro', perms: 'Read and change all your data on all websites; change search settings', bad: true }); },
    check: w => !w.hosts['XYZ-MKT-027'].extensions.some(e => e.bad),
    solve: w => { const h = w.hosts['XYZ-MKT-027']; h.extensions = h.extensions.filter(e => !e.bad); },
    answers: {
      error: 'Pop-up ads on every site, and the search page is "search-quick-results.example".',
      when: 'Since yesterday afternoon.',
      restart: 'Restarted Chrome and laptop, still the same.',
      computer: 'XYZ-MKT-027.',
      others: 'Only me.',
      verify: 'XYZ28802.'
    },
    relevant: ['when'],
    hint: 'Remote → Browser extensions. Look at what each extension is allowed to do.',
    lesson: 'Extensions that can "read and change all your data on all websites" can see every page, including company systems. Remove the bad one, reset the search engine, and change any passwords typed in Chrome since it was installed.',
    kb: 'extensions'
  },
  {
    id: 'roombooking', title: 'Melati room double-booked again', category: 'Apps', priority: 'P3',
    user: 'rosnah',
    body: "Melati meeting room got double-booked AGAIN. Two teams showed up at 10am. Booking in Outlook says accepted for both. Can fix the room?",
    setup: w => { Object.assign(A(w).rooms.Melati, { autoAccept: false, allowConflicts: true }); },
    check: w => A(w).rooms.Melati.autoAccept && !A(w).rooms.Melati.allowConflicts,
    solve: w => { Object.assign(A(w).rooms.Melati, { autoAccept: true, allowConflicts: false }); },
    answers: {
      error: 'No error. Both bookings show the room as accepted.',
      when: 'Third time this month. Cempaka room never has this problem.',
      restart: 'N/A',
      computer: 'N/A',
      others: 'Only the Melati room.',
      verify: 'XYZ17723.'
    },
    relevant: ['others'],
    hint: 'Compare Melati with Cempaka in Apps → Rooms, or use Get-CalendarProcessing Melati in the Terminal.',
    lesson: 'Room mailboxes should auto-accept bookings and decline conflicts. That is set with Set-CalendarProcessing -AutomateProcessing AutoAccept -AllowConflicts $false. Comparing with a room that works shows the difference quickly.',
    kb: 'rooms'
  },
  {
    id: 'whatsappdesktop', title: 'Install WhatsApp Desktop for client chats', category: 'Apps', priority: 'P4',
    user: 'jwong', host: 'XYZ-SLS-008', passive: true,
    body: "Can install WhatsApp Desktop on my laptop? My clients all WhatsApp me and typing on the phone is slow. Thanks bro!",
    setup: () => {},
    check: w => !w.hosts['XYZ-SLS-008'].software.includes('WhatsApp Desktop'),
    solve: () => {},
    answers: {
      error: 'No error, just a request.',
      when: 'Whenever you can.',
      restart: 'N/A',
      computer: 'XYZ-SLS-008.',
      others: 'Whole Sales team uses WhatsApp with clients.',
      verify: 'XYZ27781.'
    },
    relevant: ['others'],
    hint: 'Check the policy in Remote → Software Center. Where should client conversations be kept?',
    lesson: "Client conversations need to be kept on company systems (email, Teams) for record-keeping and data protection. WhatsApp Desktop is blocked by policy here. Decline politely, explain why, and suggest the approved option.",
    kb: 'software'
  },
  {
    id: 'teamsexternal', title: 'Chat with partner company in Teams', category: 'Security', priority: 'P3',
    user: 'azaki',
    body: "We're starting a joint project with a partner company, they use Teams too. Can you allow our team to chat with their domain (partnerco.com.my)? Want to start today.",
    setup: () => {},
    escalate: 'Security',
    check: () => false,
    forbid: { externalAllow: { label: 'Opened external Teams access without Security approval', pts: -40 } },
    answers: {
      error: 'No error, when we search their names it says external chat is blocked.',
      when: 'Project starts today.',
      restart: 'N/A',
      computer: 'N/A',
      others: 'The 4 of us in the project.',
      verify: 'XYZ15502.'
    },
    relevant: [],
    hint: 'This changes who outside the company can contact staff. Is there an approval? Who decides that?',
    lesson: 'Allowing an outside domain to chat with staff changes the company\'s security settings. It needs a request reviewed and approved by Security (and often the partner contract checked). Raise it to them rather than changing it yourself.',
    kb: 'teams'
  },
  {
    id: 'teamsowner', title: "Team has no owner, can't add members", category: 'Apps', priority: 'P3',
    user: 'azaki', targets: ['azaki'],
    body: "The 'Sales APAC' team's owner Kevin resigned last month. Now nobody can add new members. I'm the Sales Manager, please make me the owner.",
    setup: () => {},
    check: w => A(w).teams['Sales APAC'].owners.includes('azaki'),
    solve: w => { A(w).teams['Sales APAC'].owners.push('azaki'); },
    answers: {
      error: '"Only team owners can add members."',
      when: 'Since Kevin left on 15 November.',
      restart: 'N/A',
      computer: 'N/A',
      others: 'All of us in the team.',
      verify: 'XYZ15502, I manage Sales.'
    },
    relevant: ['error'],
    hint: 'Apps → Teams → Sales APAC. Add Ahmad Zaki as an owner (in the Terminal: Add-TeamUser -Role Owner).',
    lesson: 'Every team needs at least one current owner (ideally two). When an owner leaves, the manager can request ownership. Add them with Add-TeamUser -Role Owner or in the Teams admin center.',
    kb: 'teams'
  },
  {
    id: 'oauthconsent', title: 'Free calendar app wants to read my email', category: 'Security', priority: 'P2',
    user: 'ksoon',
    body: "I clicked a link to a free 'Smart Calendar Helper' app and it asked Microsoft permission to read my email and calendar. I clicked Accept. Now I'm not sure it's legit…",
    setup: w => { A(w).enterpriseApps.push({ name: 'Smart Calendar Helper', publisher: 'Unverified publisher', perms: 'Read your mail, read and write your calendar, maintain access (offline_access)', consentedBy: 'ksoon', bad: true }); },
    escalate: 'Security',
    check: () => false,
    bonus: { check: w => !A(w).enterpriseApps.some(a => a.bad), label: 'Revoked the app\'s access first', pts: 20 },
    answers: {
      error: 'It showed a Microsoft "Permissions requested" page, I clicked Accept.',
      when: 'About 30 minutes ago.',
      restart: 'N/A',
      computer: 'XYZ-SLS-014.',
      others: 'The link came in an email to the whole Sales team.',
      verify: 'XYZ26001.'
    },
    relevant: ['when', 'others'],
    reveal: { key: 'hacker', name: 'Unknown attacker', text: 'No password was stolen this time. The "app" asked Soon Lee to grant it permission to read his mailbox, which gives the attacker ongoing access to his email even if he changes his password.' },
    hint: 'Apps → Enterprise apps: who published it and what can it do? Revoke it, then escalate. Others got the same link.',
    lesson: 'This is a consent phishing attack: the attacker gets permissions instead of a password. Revoke the app\'s consent straight away, then escalate to Security. They will check who else accepted and can block users from consenting to unverified apps.',
    kb: 'consent'
  }
];

export const APP_KB = [
  { id: 'onedrive', title: 'OneDrive sync & version history', body: 'File names can\'t contain <code>" * : &lt; &gt; ? / \\ |</code>. Rename to fix a red X. Overwritten a file? <b>Version history</b> keeps earlier versions: restore the last good one.' },
  { id: 'sharing', title: 'Sharing links', body: '<b>Specific people</b> links are safest. <b>Anyone with the link</b> needs no sign-in. If personal data was exposed, <b>remove the link</b> immediately and escalate to <b>Security</b> (possible PDPA breach).' },
  { id: 'sharepoint', title: 'SharePoint sites', body: 'Three groups: <b>Owners</b> (full control), <b>Members</b> (edit), <b>Visitors</b> (read). Add people to the group that matches the request. Deleted items stay in the site <b>recycle bin</b> for 93 days.' },
  { id: 'teams', title: 'Teams problems', body: 'Camera "in use by another app": end the other app (often Zoom in the background). Nobody hears you: check the <b>microphone</b> selected in Teams. Ownerless team: add a new owner. External domains need <b>Security</b> approval.' },
  { id: 'rooms', title: 'Meeting room bookings', body: 'Room mailboxes should <b>auto-accept</b> and <b>not allow conflicts</b>: <code>Set-CalendarProcessing &lt;room&gt; -AutomateProcessing AutoAccept -AllowConflicts $false</code>.' },
  { id: 'portals', title: 'External portals (MyInvois, KWSP, banking)', body: 'These are managed by the company\'s own registered admins (Finance or HR), not IT. Point the user to the right person.' },
  { id: 'officeaddins', title: 'Office add-ins', body: 'Office app crashing after something new was installed: disable the add-in (File → Options → Add-ins → COM Add-ins). <code>excel /safe</code> starts without add-ins to confirm.' },
  { id: 'extensions', title: 'Browser extensions', body: 'Extensions that can <b>read and change all your data on all websites</b> can see company systems. Remove unknown ones, reset the search engine, and change passwords typed since.' },
  { id: 'consent', title: 'Consent phishing', body: 'A fake app asks the user to <b>grant permissions</b> (read mail, offline access) instead of stealing a password. Revoke the app\'s consent and escalate to <b>Security</b>.' }
];
