/* =========================================================
   Batch 1 — Email & Microsoft 365
   Adds: mail world (mailboxes, shared mailboxes, lists,
   quarantine, message trace), 1 new user, 15 scenarios, KB.
   Loaded after js/scenarios.js.
   ========================================================= */
import { DIRECTORY } from './core.js';
export const MAIL_DOMAIN = 'xyz100.com.my';

  /* new user for this batch */
  // new user for this batch (added to the shared directory before mailboxes are built)
  DIRECTORY.niman = {
    callName: 'Iman',
    name: 'Nur Iman binti Azmi', dept: 'Marketing', title: 'Marketing Intern', empId: 'XYZ50033',
    groups: ['All-Staff', 'Marketing-RW'], enabled: true, locked: false, pwdExpired: false, mfa: 'Registered', phone: 'x4733'
  };

  /* every user gets a mailbox */
  const boxes = {};
  Object.keys(DIRECTORY).forEach(k => {
    boxes[k] = { size: +(4 + Math.random() * 22).toFixed(1), quota: 50, archive: false, licensed: true, rules: [], forward: null, autoReply: null, cal: [] };
  });
  boxes.niman.licensed = false;
  boxes.niman.size = 0;

export const MAIL = {
    licencesFree: 3,
    boxes,
    // shared mailboxes: full = Full Access (read/manage), sendAs = can send as the mailbox
    shared: {
      finance:   { name: 'Finance Team',      full: ['twming', 'fnadia', 'cortiz'].filter(k => boxes[k]), sendAs: ['twming'] },
      sales:     { name: 'Sales Enquiries',   full: ['azaki', 'ksoon', 'jwong'], sendAs: ['azaki'] },
      hr:        { name: 'Human Resources',   full: ['naisyah'], sendAs: ['naisyah'] },
      marketing: { name: 'Marketing',         full: ['kavitha', 'draj', 'psubra'], sendAs: ['kavitha'] }
    },
    // distribution lists
    dls: {
      'all-staff':     { name: 'All Staff', dynamic: true, members: [] },
      'sales-all':     { name: 'Sales Team', members: ['azaki', 'jwong', 'ksoon', 'htanaka'] },
      'marketing-all': { name: 'Marketing Team', members: ['kavitha', 'niman'] },
      'finance-all':   { name: 'Finance Team', members: ['twming', 'psubra', 'fnadia'] }
    },
    quarantine: [
      { id: 'q-prize', from: 'rewards@shopee-bonus-my.top', to: 'ksoon', subject: 'Tahniah! You won a RM5,000 voucher', reason: 'Phishing (high confidence)', time: '07:41', malicious: true, state: 'held',
        detail: 'SPF: fail · Sender domain registered 4 days ago · Link points to shopee-bonus-my.top/claim' },
      { id: 'q-news', from: 'news@techtrend-asia.com', to: 'twmin', subject: 'TechTrend Weekly: AI in ASEAN', reason: 'Bulk mail', time: '06:02', malicious: false, state: 'held',
        detail: 'SPF: pass · DKIM: pass · Newsletter the user subscribed to' }
    ],
    trace: [
      { id: 't-base1', time: '08:05', from: 'azaki', to: 'jwong', subject: 'Q4 targets', status: 'Delivered', detail: '250 2.0.0 OK. Delivered to inbox.' },
      { id: 't-base2', time: '08:20', from: 'billing@telco-provider.com.my', to: 'rosnah', subject: 'Your monthly bill', status: 'Delivered', detail: '250 2.0.0 OK. Delivered to inbox.' },
      { id: 't-base3', time: '08:31', from: 'kavitha', to: 'marketing-all', subject: 'Campaign calendar', status: 'Delivered', detail: 'Expanded to 2 members. Delivered.' }
    ]
  };

  const addTrace = (w, e) => w.mail.trace.push(e);
  const addQ = (w, q) => w.mail.quarantine.push(Object.assign({ state: 'held' }, q));

export const EMAIL_SCENARIOS = [
    {
      id: 'mailfull', title: 'Mailbox full, client emails bouncing', category: 'Email', priority: 'P2',
      user: 'shajar', host: 'XYZ-LEG-004',
      body: "Clients say their emails to me bounce back with 'mailbox full'. I keep every case email with attachments, cannot delete. Court filing this week!",
      setup: w => {
        w.mail.boxes.shajar.size = 49.4;
        addTrace(w, { id: 'mf1', time: '09:12', from: 'counsel@tanpartners-law.com.my', to: 'shajar', subject: 'RE: Case 2291 documents', status: 'Failed', detail: "552 5.2.2 Mailbox full. The recipient's mailbox is over its storage limit." });
      },
      check: w => { const b = w.mail.boxes.shajar; return b.size / b.quota < 0.9; },
      solve: w => { const b = w.mail.boxes.shajar; b.archive = true; b.size = +(b.size * 0.35).toFixed(1); },
      answers: {
        error: "The client forwarded the bounce: 'Mailbox full. The recipient's mailbox is over its storage limit.'",
        when: 'Since yesterday afternoon.',
        restart: 'Restarted Outlook, no difference.',
        computer: 'XYZ-LEG-004',
        others: 'Only me, I think.',
        verify: 'XYZ21190.'
      },
      relevant: ['error', 'others'],
      hint: 'Mail → Mailboxes → Siti Hajar. Look at the storage meter. The online archive moves old mail out of the main mailbox without deleting anything.',
      lesson: "A full mailbox rejects new mail with a 552 5.2.2 bounce. Enabling the online archive moves older mail out of the main mailbox, so nothing is deleted and she can still search it. That's the right fix for someone who must keep everything, like Legal.",
      kb: 'mailbox'
    },
    {
      id: 'sharedmbx', title: 'Needs access to finance@ mailbox', category: 'Email', priority: 'P3',
      user: 'psubra', host: 'XYZ-FIN-031',
      body: "Now that I'm in Finance, I need to see the finance@ shared mailbox for supplier invoices. Encik Hafiz approved, email attached. Terima kasih!",
      setup: () => {},
      check: w => w.mail.shared.finance.full.includes('psubra'),
      solve: w => { w.mail.shared.finance.full.push('psubra'); },
      answers: {
        error: "No error, it just doesn't appear in my Outlook folder list.",
        when: 'Since I joined Finance.',
        restart: 'Yes, restarted Outlook twice.',
        computer: 'XYZ-FIN-031',
        others: 'My teammates can all see it.',
        verify: 'XYZ25510.'
      },
      relevant: ['others'],
      hint: 'Mail → Shared & lists → finance@. Full Access lets someone open and read the mailbox. Send As is a separate permission, and nobody asked for it.',
      lesson: 'Shared mailboxes have two separate permissions: Full Access (open and read it) and Send As (send email that appears to come from it). Grant only what was approved. Outlook usually adds the mailbox automatically within an hour.',
      kb: 'sharedmbx'
    },
    {
      id: 'dlmissing', title: 'Not getting team announcements', category: 'Email', priority: 'P4',
      user: 'draj', host: 'XYZ-MKT-027',
      body: "Everyone in Marketing got the email about the new campaign schedule except me 😕 Kavitha says she sent it to the marketing team list.",
      setup: () => {},
      check: w => w.mail.dls['marketing-all'].members.includes('draj'),
      solve: w => { w.mail.dls['marketing-all'].members.push('draj'); },
      answers: {
        error: 'No error, I just never receive those emails.',
        when: "I think I've never got them, since I joined.",
        restart: "It's not my laptop lah, other emails come in fine.",
        computer: 'XYZ-MKT-027',
        others: 'Only me in the team. Even the intern got it.',
        verify: 'XYZ28802.'
      },
      relevant: ['others', 'when'],
      hint: 'Mail → Shared & lists → marketing-all. Is Daniel a member?',
      lesson: 'If one person misses emails sent to a team list, check the distribution list membership before touching their mailbox. People added after a list was created are often forgotten.',
      kb: 'sharedmbx'
    },
    {
      id: 'quarinvoice', title: 'Supplier invoice never arrived', category: 'Email', priority: 'P3',
      user: 'fnadia',
      body: "Our supplier Maju Jaya says they emailed the October invoice yesterday but I never got it. Not in junk also. Payment run is today!",
      setup: w => {
        addQ(w, { id: 'q-inv', from: 'accounts@majujaya-supplies.com.my', to: 'fnadia', subject: 'Invoice INV-2291 for October', reason: 'Spam (low confidence)', time: 'Yesterday 16:40', malicious: false,
          detail: 'SPF: pass · DKIM: pass · Known sender, 14 previous emails delivered · PDF attachment scanned clean' });
        addQ(w, { id: 'q-bank', from: 'payroll-update@xyz100-hr.com', to: 'fnadia', subject: 'ACTION REQUIRED: Confirm your bank details for salary', reason: 'Phishing (high confidence)', time: 'Yesterday 17:05', malicious: true,
          detail: 'SPF: fail · Look-alike domain xyz100-hr.com (ours is xyz100.com.my) · Link to a login page hosted overseas' });
        addTrace(w, { id: 'qi1', time: 'Yesterday 16:40', from: 'accounts@majujaya-supplies.com.my', to: 'fnadia', subject: 'Invoice INV-2291 for October', status: 'Quarantined', detail: 'Held by spam filter (low confidence). See Quarantine.' });
      },
      check: w => { const q = id => w.mail.quarantine.find(x => x.id === id); return q('q-inv').state === 'released' && q('q-bank').state !== 'released'; },
      solve: w => { w.mail.quarantine.find(x => x.id === 'q-inv').state = 'released'; },
      answers: {
        error: 'No error, it just never came.',
        when: 'Supplier says yesterday around 4.40pm.',
        restart: "Restarted, but I don't think it's my PC.",
        computer: 'XYZ-FIN-044.',
        others: 'Other suppliers emails come in fine.',
        verify: 'XYZ29934.'
      },
      relevant: ['when', 'others'],
      hint: 'Run a message trace for Farah Nadia, or check Quarantine. There are two emails held for her. Read the details before you release anything.',
      lesson: 'Spam filters sometimes hold legitimate mail. Check the details: a known sender with passing SPF and DKIM is safe to release. A look-alike domain asking for bank details is not, even if it is sitting right next to the real one.',
      kb: 'quarantine'
    },
    {
      id: 'inboxrule', title: 'Customer replies disappearing', category: 'Security', priority: 'P1',
      user: 'kavitha', host: 'XYZ-MKT-019',
      body: "Weird problem. Two customers say they replied about payment for the campaign, but I never see their replies. Not in junk. Did someone delete my emails?",
      setup: w => {
        const b = w.mail.boxes.kavitha;
        b.rules.push({ name: '..', cond: "subject or body contains 'invoice', 'payment' or 'bank'", action: 'move to RSS Feeds and mark as read' });
        b.forward = 'kav1tha.rajan@gmail-mail.com';
      },
      escalate: 'Security',
      check: () => false,
      answers: {
        error: 'No error. Emails just vanish.',
        when: 'Started maybe 3 or 4 days ago.',
        restart: 'Restarted, still the same.',
        computer: 'XYZ-MKT-019',
        others: "Don't think so.",
        verify: 'XYZ26677.'
      },
      relevant: ['when'],
      reveal: { key: 'hacker', name: 'Unknown attacker', text: "The attacker signed in to Kavitha's mailbox with a stolen password, created a hidden rule to bury payment emails, and forwarded everything to a look-alike Gmail address. The plan was to send customers fake bank details." },
      hint: 'Mail → Mailboxes → Kavitha. Look at her inbox rules and forwarding. Would Kavitha create a rule named ".." herself?',
      lesson: 'A hidden inbox rule that hides payment emails, plus forwarding to an outside address, is the classic sign of a compromised mailbox (business email compromise). Escalate to Security straight away. They need the evidence, so report what you found rather than quietly deleting it.',
      kb: 'inboxrules'
    },
    {
      id: 'typo', title: 'Client says quotation never arrived', category: 'Email', priority: 'P2',
      user: 'azaki',
      body: "I sent the quotation to Petrojaya procurement this morning, they say never received. Big deal, RM400k. Can check urgently?",
      setup: w => {
        addTrace(w, { id: 'typo1', time: '08:52', from: 'azaki', to: 'procurement@petrojya.com.my', subject: 'Quotation XYZ-Q-1187', status: 'Failed',
          detail: "550 5.1.1 Recipient address rejected: domain petrojya.com.my does not exist. (Did the sender mean petrojaya.com.my?)" });
      },
      check: w => w.traced.includes('typo1'),
      solve: w => { w.traced.push('typo1'); },
      answers: {
        error: "I got some email from 'Mail Delivery System' but I thought it was spam and deleted it.",
        when: 'Sent around 8.50 this morning.',
        restart: 'Not a computer problem, other emails OK.',
        computer: "My laptop is fine, other emails go out OK.",
        others: "Only this client, I think.",
        verify: 'XYZ15502.'
      },
      relevant: ['error', 'when'],
      hint: 'Mail → Trace. Search for Ahmad Zaki and open the failed message.',
      lesson: 'Message trace shows exactly what happened to an email. A 550 5.1.1 bounce means the address is wrong. Here the domain was misspelled. Tell the user the correct address, and remind people that "Mail Delivery System" emails are worth reading.',
      kb: 'trace'
    },
    {
      id: 'calendar', title: 'Let assistant edit my calendar', category: 'Email', priority: 'P4',
      user: 'arjun', targets: ['arjun', 'cmeiyee'],
      body: "Hi, can you let Mei Yee edit my calendar? She arranges the team's shift schedule and keeps asking me to add things. Thanks!",
      setup: () => {},
      check: w => w.mail.boxes.arjun.cal.some(c => c.u === 'cmeiyee' && c.role === 'Editor'),
      solve: w => { w.mail.boxes.arjun.cal.push({ u: 'cmeiyee', role: 'Editor' }); },
      answers: {
        error: 'No error, I just want her to be able to add and change meetings.',
        when: 'Whenever you can.',
        restart: 'Nothing to restart 😄',
        computer: 'XYZ-CS-011 is in for repair, using a loaner.',
        others: 'N/A',
        verify: 'XYZ20088.'
      },
      relevant: [],
      hint: 'Mail → Mailboxes → Arjun → Calendar permissions. Reviewer can only view. Editor can add and change events.',
      lesson: 'Calendar permissions are set on the owner\'s mailbox. Reviewer means read-only and Editor means they can create and change events. Give what the owner asked for, and only when the owner is the one asking.',
      kb: 'calendar'
    },
    {
      id: 'sendas', title: 'Send as sales@ for Jason', category: 'Email', priority: 'P3',
      user: 'azaki', targets: ['azaki', 'jwong'],
      body: "Please let Jason send emails as sales@xyz100.com.my. Customers should reply to the shared box, not his personal email. He already can see the mailbox.",
      setup: () => {},
      check: w => w.mail.shared.sales.sendAs.includes('jwong'),
      solve: w => { w.mail.shared.sales.sendAs.push('jwong'); },
      answers: {
        error: 'When he picks sales@ in the From field, Outlook says he doesn\'t have permission.',
        when: 'Since he tried yesterday.',
        restart: 'Not a PC problem.',
        computer: "Jason's laptop, XYZ-SLS-008.",
        others: 'I can send as sales@ fine.',
        verify: 'XYZ15502, I am the Sales Manager.'
      },
      relevant: ['error'],
      hint: 'Mail → Shared & lists → sales@. He already has Full Access. Send As is the missing permission.',
      lesson: 'Full Access lets someone read a shared mailbox. Send As lets them send from it. These are separate permissions, and a manager asking for the second one is the normal approval.',
      kb: 'sharedmbx'
    },
    {
      id: 'autoreply', title: 'Set out-of-office for absent colleague', category: 'Email', priority: 'P3',
      user: 'rosnah', targets: ['rosnah', 'lsling'],
      body: "Siew Ling had a family emergency in Ipoh and is on leave until Friday. She forgot to set out-of-office, and suppliers keep emailing her. Her manager asked me to ask you. Can set auto-reply for her?",
      setup: () => {},
      check: w => !!w.mail.boxes.lsling.autoReply,
      solve: w => { w.mail.boxes.lsling.autoReply = 'Out of office until Friday.'; },
      answers: {
        error: 'No error, just suppliers waiting for replies.',
        when: 'She left yesterday.',
        restart: 'Nothing to restart.',
        computer: 'Her laptop is with her.',
        others: 'Ops team is covering, emails can go to me.',
        verify: 'XYZ17723.'
      },
      relevant: ['others'],
      hint: 'Mail → Mailboxes → Lim Siew Ling → Automatic replies. Point people to the colleague who is covering.',
      lesson: "IT can switch on automatic replies for someone who is away, when their manager asks. A good message says when they're back and who to contact meanwhile. It shouldn't share personal details about why they're away.",
      kb: 'mailbox'
    },
    {
      id: 'tngscam', title: "Dato' asks for Touch 'n Go PINs", category: 'Security', priority: 'P1',
      user: 'ksoon',
      body: "Got email from Dato' Kamal asking me to buy 10 Touch 'n Go reload PINs, RM100 each, for client gifts, and email him the PIN numbers. Very urgent, he's in a meeting and can't talk. Is this real?",
      setup: w => {
        for (let i = 0; i < 4; i++) {
          const to = ['ksoon', 'jwong', 'lsling', 'draj'][i];
          addTrace(w, { id: 'tng' + i, time: '10:1' + i, from: 'dato.kamal.xyz100@gmail-mail.com', to, subject: 'Urgent and confidential', status: 'Delivered', detail: '250 2.0.0 Delivered. External sender. Display name "Dato\' Kamal bin Ismail".' });
        }
      },
      escalate: 'Security',
      check: () => false,
      answers: {
        error: "No error. The email says 'I need your help urgently and discreetly'.",
        when: 'About 10 minutes ago.',
        restart: 'Haha no.',
        computer: 'XYZ-SLS-014',
        others: 'Wait, Jason says he got one too!',
        verify: 'XYZ26001.'
      },
      relevant: ['others'],
      reveal: { key: 'hacker', name: 'Unknown attacker', text: "The email came from a free Gmail look-alike with the CEO's name as the display name. The attacker sent it to dozens of staff hoping one would buy reload PINs, which can't be traced or refunded." },
      hint: 'Check the sender address in Trace. Urgency, secrecy, gift cards or reload PINs, and an outside address are all classic signs.',
      lesson: "This is a gift card scam (CEO fraud). Real executives don't ask staff to buy reload PINs by email. Tell the user not to buy anything, and escalate to Security. Others received it too, so Security can warn everyone and block the sender.",
      kb: 'giftcard'
    },
    {
      id: 'licence', title: 'Intern has no mailbox', category: 'Email', priority: 'P3',
      user: 'niman',
      body: "Hi! I'm the new Marketing intern. I can log in to Windows, but Outlook says it cannot find my mailbox. Sorry if this is a silly question 🙏",
      setup: () => {},
      check: w => w.mail.boxes.niman.licensed,
      solve: w => { w.mail.boxes.niman.licensed = true; w.mail.licencesFree--; },
      answers: {
        error: '"Outlook cannot log on. Verify you are connected to the network and are using the proper server and mailbox name."',
        when: 'Since Monday, my first day.',
        restart: 'Yes, restarted twice.',
        computer: 'A shared laptop from the Marketing cabinet.',
        others: 'The other intern started in January, hers works.',
        verify: 'XYZ50033.'
      },
      relevant: ['error', 'when'],
      hint: 'Mail → Mailboxes → Nur Iman. No licence means no mailbox.',
      lesson: 'In Microsoft 365, a mailbox is only created once the user has a licence that includes Exchange. A Windows login that works but no mailbox usually means onboarding forgot the licence. It takes a few minutes to appear after you assign one.',
      kb: 'mailbox'
    },
    {
      id: 'bigattach', title: "Can't send video to client", category: 'Email', priority: 'P4',
      user: 'draj', host: 'XYZ-MKT-027',
      body: "Trying to email the final campaign video (80MB) to the client, but it keeps bouncing. Deadline 5pm!",
      setup: w => {
        addTrace(w, { id: 'big1', time: '11:03', from: 'draj', to: 'brand@kopikita-group.com.my', subject: 'Final video v7', status: 'Failed', detail: '552 5.3.4 Message size exceeds fixed maximum message size (35 MB).' });
      },
      check: w => w.traced.includes('big1'),
      solve: w => { w.traced.push('big1'); },
      answers: {
        error: "It says something like 'message too large'.",
        when: 'Tried three times since 11am.',
        restart: 'Restarted Outlook, same.',
        computer: 'XYZ-MKT-027',
        others: 'Small emails go through OK.',
        verify: 'XYZ28802.'
      },
      relevant: ['error'],
      hint: 'Run a message trace for Daniel. The bounce code tells you the limit.',
      lesson: 'Email has a size limit (35 MB here). Raising it is not the fix. Large files should go as a OneDrive or SharePoint link, which is faster for the client, and you can revoke access later.',
      kb: 'trace'
    },
    {
      id: 'removeaccess', title: 'Remove ex-team member from marketing@', category: 'Email', priority: 'P3',
      user: 'kavitha', targets: ['kavitha', 'psubra'],
      body: "Priya moved to Finance last month but she can still open the marketing@ mailbox. Our client quotes are confidential. Can remove her access? Nothing against her, just policy 🙂",
      setup: () => {},
      check: w => !w.mail.shared.marketing.full.includes('psubra'),
      solve: w => { w.mail.shared.marketing.full = w.mail.shared.marketing.full.filter(k => k !== 'psubra'); },
      answers: {
        error: 'No error.',
        when: 'She moved about a month ago.',
        restart: 'N/A',
        computer: 'N/A',
        others: 'Only Priya, everyone else in the list is still in Marketing.',
        verify: 'XYZ26677, I own the marketing mailbox.'
      },
      relevant: ['others'],
      hint: 'Mail → Shared & lists → marketing@. Remove Priya only.',
      lesson: "When people change teams, old access often stays behind (\"access creep\"). Removing it when the mailbox owner asks is routine least-privilege housekeeping. Remove only what was asked for.",
      kb: 'sharedmbx'
    },
    {
      id: 'courier', title: 'Release my parcel delivery email', category: 'Email', priority: 'P4',
      user: 'cmeiyee',
      body: "My parcel is stuck! There's an email in quarantine from the courier saying I must pay RM2.50 redelivery fee. Can you release it? I need my order 😭",
      setup: w => {
        addQ(w, { id: 'q-courier', from: 'redelivery@poslaju-track-my.info', to: 'cmeiyee', subject: 'Parcel on hold: pay RM2.50 redelivery fee', reason: 'Phishing (high confidence)', time: '09:58', malicious: true,
          detail: 'SPF: fail · Domain is not the courier\'s real domain · Link asks for card details' });
      },
      check: w => w.mail.quarantine.find(x => x.id === 'q-courier').state !== 'released',
      solve: () => {},
      passive: true, // the right move is to leave it in quarantine
      answers: {
        error: "The notification says the email is in quarantine.",
        when: 'This morning around 10.',
        restart: 'Nothing to restart lah.',
        computer: 'XYZ-CS-005',
        others: 'My friend also got the same SMS!',
        verify: 'XYZ24456.'
      },
      relevant: ['others'],
      hint: 'Open Quarantine and read the details for this message before deciding.',
      lesson: "Small \"redelivery fee\" messages pretending to be from couriers are among the most common scams in Malaysia, by SMS and email. The filter caught it, so leave it in quarantine, explain why to the user, and tell them to track parcels on the courier's official app or website.",
      kb: 'quarantine'
    },
    {
      id: 'payrollleak', title: 'Payroll file sent to all-staff', category: 'Security', priority: 'P1',
      user: 'fnadia',
      body: "ALAMAK. I accidentally sent the October payroll file (everyone's salary and IC numbers) to all-staff instead of finance-all!! Can recall?? Please help 😭😭",
      setup: w => {
        addTrace(w, { id: 'pay1', time: '14:02', from: 'fnadia', to: 'all-staff', subject: 'Payroll Oct - FINAL.xlsx', status: 'Delivered', detail: 'Expanded to 141 recipients. Delivered.' });
      },
      escalate: 'Security',
      check: () => false,
      answers: {
        error: 'No error, it sent successfully. That is the problem 😭',
        when: 'Two minutes ago!',
        restart: 'Restart won\'t help!!',
        computer: 'XYZ-FIN-044.',
        others: 'Already 3 people replied "I think this is not for me".',
        verify: 'XYZ29934.'
      },
      relevant: ['when'],
      hint: 'Check Trace to see how many people received it. Salaries and IC numbers going to 141 people is more than an email problem.',
      lesson: 'Sending personal data to the wrong people is a personal data breach under the PDPA, and Malaysia\'s 2024 amendments added a duty to report breaches. Outlook recall rarely works. Escalate to Security immediately so they can purge the message from every mailbox and handle notification.',
      kb: 'databreach'
    }
];

export const EMAIL_KB = [
    { id: 'mailbox', title: 'Mailbox size, archive & licences', body: 'Mailboxes here hold 50 GB. Near the limit, new mail bounces with <code>552 5.2.2</code>. Enabling the <b>online archive</b> moves older mail out without deleting it. No mailbox at all usually means <b>no licence</b>. Automatic replies can be set by IT when a manager asks.' },
    { id: 'sharedmbx', title: 'Shared mailboxes & distribution lists', body: '<b>Full Access</b> lets someone open a shared mailbox. <b>Send As</b> lets them send from it. They are separate. A <b>distribution list</b> just delivers copies to its members. If one person misses team emails, check list membership first. Remove access when people change teams.' },
    { id: 'quarantine', title: 'Quarantine: release or not?', body: 'Read the details. <b>Release</b> when the sender is known and SPF/DKIM pass. <b>Never release</b> look-alike domains, payment or "verify your details" requests, or anything rated phishing, even if the user insists. Explain why instead.' },
    { id: 'trace', title: 'Message trace & bounce codes', body: 'Trace shows what happened to an email. <code>550 5.1.1</code> = address doesn\'t exist (often a typo). <code>552 5.2.2</code> = recipient mailbox full. <code>552 5.3.4</code> = message too big (send a OneDrive link). <b>Quarantined</b> = held by the filter.' },
    { id: 'inboxrules', title: 'Suspicious inbox rules & forwarding', body: 'Attackers in a mailbox often create rules with odd names (".", "..") that move payment emails to obscure folders, and set forwarding to outside addresses. That means the mailbox is compromised: escalate to <b>Security</b> and report what you found.' },
    { id: 'giftcard', title: 'Gift card & reload PIN scams', body: 'An "executive" emailing from an outside address asking staff to buy gift cards or Touch \'n Go reload PINs urgently and secretly is always a scam. Tell users not to buy anything, and escalate to <b>Security</b>.' },
    { id: 'calendar', title: 'Calendar permissions', body: 'Set on the owner\'s mailbox. <b>Reviewer</b> = view only. <b>Editor</b> = create and change events. Only grant what the calendar owner asks for.' },
    { id: 'databreach', title: 'Accidental data leaks (PDPA)', body: 'Personal data sent to the wrong people (salaries, IC numbers, medical info) is a <b>data breach</b>. Recall rarely works. Escalate to <b>Security</b> immediately: they purge the message from all mailboxes and handle the PDPA breach notification.' }
];
