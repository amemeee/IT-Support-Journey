/* =========================================================
   Batch 2 — Device management
   Adds: device inventory (laptops & phones managed by the
   company), 15 scenarios, KB. Loaded after email.js.
   ========================================================= */
(() => {
  'use strict';

  // 48-digit BitLocker recovery key, grouped in 8 blocks of 6
  const keyFrom = seed => {
    let x = seed, out = [];
    for (let i = 0; i < 8; i++) { x = (x * 9301 + 49297) % 233280; out.push(String(100000 + (x % 899999)).slice(0, 6)); }
    return out.join('-');
  };
  let seed = 7;
  const dev = (name, owner, extra = {}) => Object.assign({
    name, owner, type: 'Laptop', model: 'Dell Latitude 5440', os: 'Windows 11 Pro 23H2', ownership: 'Corporate',
    encrypted: true, keyId: (0x1A2B3C4D + seed * 7919).toString(16).toUpperCase().slice(0, 8), key: keyFrom(seed++),
    firewall: true, update: 'Up to date', driver: null, usb: 'Blocked',
    locked: false, lost: false, wiped: null, isolated: false, keyRevealed: false, lastSync: 'Today 08:12'
  }, extra);

  window.DEVICES = {};
  // every managed PC from the network list gets a device record
  Object.entries(window.HOSTS).forEach(([name, h]) => {
    if (h.type === 'nvr') return;
    window.DEVICES[name] = dev(name, h.owner, { type: name.startsWith('XYZ-ENG-007') || name.startsWith('XYZ-OPS-002') ? 'Desktop' : 'Laptop', model: name.includes('-ENG-007') || name.includes('-OPS-002') ? 'Dell OptiPlex 7010' : 'Dell Latitude 5440' });
  });
  Object.assign(window.DEVICES, {
    'XYZ-FIN-002':  dev('XYZ-FIN-002', 'twming', { model: 'Dell Latitude 5420 (old, spare)', lastSync: '3 weeks ago' }),
    'XYZ-SLS-001':  dev('XYZ-SLS-001', 'azaki'),
    'XYZ-ENG-015':  dev('XYZ-ENG-015', 'twmin', { model: 'Lenovo ThinkPad T14' }),
    'XYZ-SLS-022':  dev('XYZ-SLS-022', null, { lastSync: 'Never (new, in box)' }),
    'XYZ-MKT-040':  dev('XYZ-MKT-040', 'niman', { model: 'Dell Latitude 3440 (shared pool)' }),
    'PH-FNADIA':    dev('PH-FNADIA', 'fnadia', { type: 'Phone', model: 'Samsung Galaxy A55', os: 'Android 14 (work profile)', ownership: 'Personal', keyId: null, key: null, usb: 'n/a' }),
    'PH-KSOON':     dev('PH-KSOON', 'ksoon', { type: 'Phone', model: 'iPhone 13', os: 'iOS 17.6', ownership: 'Corporate', keyId: null, key: null, usb: 'n/a' })
  });

  // a device is compliant when encryption, firewall and updates are all OK
  window.deviceIssues = d => [
    !d.encrypted && 'Disk encryption off',
    !d.firewall && 'Firewall off',
    d.update !== 'Up to date' && d.type !== 'Phone' && 'OS updates overdue'
  ].filter(Boolean);

  const D = w => w.devices;

  window.SCENARIOS.push(
    {
      id: 'bitlocker', title: 'BitLocker recovery screen', category: 'Device', priority: 'P2',
      user: 'twming', host: 'XYZ-FIN-010', sensitive: true,
      body: "My laptop restarted after an update and now shows a blue BitLocker screen asking for a 48-digit recovery key. I never set any key! Month-end close, please help 😰",
      setup: w => { D(w)['XYZ-FIN-010'].recovery = true; },
      check: w => D(w)['XYZ-FIN-010'].keyRevealed && !D(w)['XYZ-FIN-002'].keyRevealed,
      solve: w => { D(w)['XYZ-FIN-010'].keyRevealed = true; },
      answers: {
        error: w => `"Enter the recovery key for this drive. Recovery key ID: ${w.devices['XYZ-FIN-010'].keyId}…" Something like that.`,
        when: 'After a BIOS update installed this morning.',
        restart: 'Restarted, same blue screen.',
        computer: 'The sticker says XYZ-FIN-010. My old laptop is in the drawer, not using that one.',
        others: 'Just me.',
        verify: 'Sure, staff ID XYZ18820.'
      },
      relevant: ['error', 'verify', 'computer'],
      hint: 'Verify his identity first. Then open Devices and match the Recovery key ID on his screen to the right laptop. He has two laptops.',
      lesson: 'BitLocker asks for the recovery key after firmware or hardware changes. The key unlocks the whole disk, so verify the caller first, then match the Key ID on their screen to the device record before reading out the key.',
      kb: 'bitlocker'
    },
    {
      id: 'bitlockerother', title: "Colleague wants someone else's BitLocker key", category: 'Security', priority: 'P3',
      user: 'jwong', host: 'XYZ-SLS-008', passive: true,
      body: "Soon Lee is on leave in Sabah and his laptop is asking for a BitLocker key. I need the proposal file on it today. Can you give me his recovery key? He said OK on WhatsApp.",
      setup: () => {},
      check: w => !D(w)['XYZ-SLS-014'].keyRevealed,
      solve: () => {},
      forbid: { revealKey: { label: "Gave a BitLocker key for someone else's laptop", pts: -100 } },
      answers: {
        error: 'His laptop shows the blue recovery screen.',
        when: 'I tried to open it this morning.',
        restart: 'Restarted, same.',
        computer: "His laptop, XYZ-SLS-014. Mine is fine.",
        others: 'No.',
        verify: "I'm Jason, XYZ27781. Soon Lee can confirm on WhatsApp if you want."
      },
      relevant: ['computer'],
      hint: "The key belongs to Soon Lee's device. Is Jason the right person to receive it, even with a WhatsApp message?",
      lesson: "Recovery keys go only to the device's owner after verification, never to a colleague, even a friendly one with a WhatsApp screenshot. Suggest Soon Lee shares the file from OneDrive, or call him to verify himself.",
      kb: 'bitlocker'
    },
    {
      id: 'lostlaptop', title: 'Laptop left in a Grab car', category: 'Device', priority: 'P1',
      user: 'draj', host: 'XYZ-MKT-027',
      body: "I left my laptop in a Grab car last night 😭 The driver isn't answering. It has the client campaign files. What should I do?",
      setup: () => {},
      check: w => { const d = D(w)['XYZ-MKT-027']; return d.locked && d.lost && !d.wiped; },
      solve: w => { const d = D(w)['XYZ-MKT-027']; d.locked = true; d.lost = true; },
      forbid: { wipe: { label: 'Wiped a laptop that may still be recovered', pts: -50 } },
      answers: {
        error: 'No error, the laptop is just gone.',
        when: 'Around 10pm last night, Bangsar to Cheras.',
        restart: 'I wish I could 😅',
        computer: 'XYZ-MKT-027.',
        others: 'Only me.',
        verify: 'XYZ28802.'
      },
      relevant: ['when', 'computer'],
      hint: 'Devices → XYZ-MKT-027. The laptop might still come back from Grab. Protect the data without destroying it yet.',
      lesson: 'For a lost device that may be recovered, lock it remotely and mark it lost first. BitLocker keeps the data encrypted. A full wipe is the last step, once it is clearly stolen or Security asks for it. Also tell the user to report it to Grab and to Security.',
      kb: 'lostdevice'
    },
    {
      id: 'stolenwipe', title: 'Stolen laptop: Security approved wipe', category: 'Device', priority: 'P1',
      user: 'azaki', host: 'XYZ-SLS-001',
      body: "My car was broken into at the mall last night and my laptop was stolen. Police report done. Security says please wipe it remotely, ref SEC-2240.",
      setup: () => {},
      check: w => D(w)['XYZ-SLS-001'].wiped === 'full',
      solve: w => { D(w)['XYZ-SLS-001'].wiped = 'full'; },
      answers: {
        error: 'No error. The window is smashed and the laptop is gone.',
        when: 'Last night, about 9pm.',
        restart: 'Nothing to restart.',
        computer: 'XYZ-SLS-001.',
        others: 'Only my laptop was taken.',
        verify: 'XYZ15502. Security ref is SEC-2240.'
      },
      relevant: ['verify', 'computer'],
      hint: 'This one is confirmed stolen, with a police report and Security approval. Devices → XYZ-SLS-001.',
      lesson: "When theft is confirmed and Security approves, a remote wipe protects company data. Record the police report and Security reference in the ticket. That's the difference between this ticket and a laptop left in a Grab.",
      kb: 'lostdevice'
    },
    {
      id: 'usbblocked', title: 'USB drive not working', category: 'Device', priority: 'P4',
      user: 'kavitha', host: 'XYZ-MKT-019', passive: true,
      body: "I need to copy the event slides to a USB drive for the venue's laptop, but Windows says 'This device is blocked by your organisation'. Can unblock for me? Event is tomorrow!",
      setup: () => {},
      check: w => D(w)['XYZ-MKT-019'].usb === 'Blocked',
      solve: () => {},
      forbid: { usbAllow: { label: 'Allowed USB storage without Security approval', pts: -60 } },
      answers: {
        error: '"This device is blocked by your organisation\'s policy."',
        when: 'Just now.',
        restart: 'Restarted, still blocked.',
        computer: 'XYZ-MKT-019.',
        others: "I don't know, nobody uses USB anymore.",
        verify: 'XYZ26677.'
      },
      relevant: ['error'],
      hint: 'USB storage is blocked on purpose. Is there an approval? Is there another way to get the slides to the venue?',
      lesson: "USB storage is blocked to stop data leaks and malware. Without Security approval, leave the block in place and offer an alternative: a OneDrive or SharePoint share link the venue can open, or presenting from her own laptop.",
      kb: 'usb'
    },
    {
      id: 'usbapproved', title: 'Auditor USB exception (approved)', category: 'Device', priority: 'P3',
      user: 'twming', host: 'XYZ-FIN-010',
      body: "External auditors need the year-end ledgers on their encrypted USB drive. Security approved a 1-day exception for my laptop, ref SEC-2231 (attached).",
      setup: () => {},
      check: w => D(w)['XYZ-FIN-010'].usb === 'Allowed (temporary)',
      solve: w => { D(w)['XYZ-FIN-010'].usb = 'Allowed (temporary)'; },
      answers: {
        error: '"This device is blocked by your organisation\'s policy."',
        when: 'Auditors are here today only.',
        restart: 'N/A',
        computer: 'XYZ-FIN-010.',
        others: 'Only my laptop needs it.',
        verify: 'XYZ18820. Approval SEC-2231.'
      },
      relevant: ['computer'],
      hint: 'Approved this time. Devices → XYZ-FIN-010 → USB storage. Only his laptop, and only temporarily.',
      lesson: 'With written Security approval, a temporary USB exception on the one named device is fine. Note the reference in the ticket and let it expire automatically.',
      kb: 'usb'
    },
    {
      id: 'updatestuck', title: 'Windows Update stuck for days', category: 'Device', priority: 'P3',
      user: 'twmin', host: 'XYZ-ENG-015',
      body: "Windows Update has been stuck at 0% for a week. Now Outlook on my laptop says my device doesn't meet company requirements 🙄",
      setup: w => { D(w)['XYZ-ENG-015'].update = 'Stuck at 0% (KB5044284), 9 days'; },
      check: w => D(w)['XYZ-ENG-015'].update === 'Up to date',
      solve: w => { D(w)['XYZ-ENG-015'].update = 'Up to date'; },
      answers: {
        error: '"Your device doesn\'t meet your organisation\'s requirements." Update says 0% forever.',
        when: 'About a week.',
        restart: 'Restarted many times, still 0%.',
        computer: 'XYZ-ENG-015.',
        others: 'Others seem fine.',
        verify: 'XYZ22901.'
      },
      relevant: ['error', 'restart'],
      hint: "Devices → XYZ-ENG-015. Overdue updates make the device non-compliant, which blocks email. Clear the update cache and retry.",
      lesson: 'Company apps check device compliance. A stuck update makes the device non-compliant, and access gets blocked. Clearing the update cache (SoftwareDistribution) and retrying fixes most stuck updates.',
      kb: 'compliance'
    },
    {
      id: 'firewalloff', title: "Teams: 'device doesn't meet requirements'", category: 'Device', priority: 'P3',
      user: 'lsling', host: 'XYZ-OPS-031',
      body: "Teams and Outlook suddenly say my laptop doesn't meet requirements. Yesterday I installed the label printer software, it asked me to turn something off… is that related?",
      setup: w => { D(w)['XYZ-OPS-031'].firewall = false; },
      check: w => D(w)['XYZ-OPS-031'].firewall,
      solve: w => { D(w)['XYZ-OPS-031'].firewall = true; },
      answers: {
        error: '"Your device doesn\'t meet your organisation\'s requirements. Contact IT."',
        when: 'Since this morning.',
        restart: 'Restarted, same.',
        computer: 'XYZ-OPS-031.',
        others: 'Only me.',
        verify: 'XYZ19034.'
      },
      relevant: ['error', 'when'],
      hint: 'Devices → XYZ-OPS-031. Check the compliance reasons. What did the printer installer ask her to turn off?',
      lesson: "Turning off the firewall makes a device non-compliant, which blocks company apps. Turn it back on. If an app really needs a port open, that's a firewall rule for L2, not switching the firewall off.",
      kb: 'compliance'
    },
    {
      id: 'bsod', title: 'Blue screen after driver update', category: 'Device', priority: 'P2',
      user: 'shajar', host: 'XYZ-LEG-004',
      body: "My laptop keeps getting a blue screen every time I plug in the second monitor. Started after an update yesterday. Court documents due!",
      setup: w => { D(w)['XYZ-LEG-004'].driver = 'Intel Graphics 31.0.101.5590 (updated yesterday): crashes'; },
      check: w => !D(w)['XYZ-LEG-004'].driver,
      solve: w => { D(w)['XYZ-LEG-004'].driver = null; },
      answers: {
        error: 'Blue screen: "VIDEO_TDR_FAILURE", then it restarts.',
        when: 'Since yesterday afternoon, after updates.',
        restart: 'It restarts itself every time 😩',
        computer: 'XYZ-LEG-004.',
        others: 'Only me I think.',
        verify: 'XYZ21190.'
      },
      relevant: ['error', 'when'],
      hint: 'VIDEO_TDR_FAILURE is a graphics driver crash, and it started after an update. Devices → XYZ-LEG-004.',
      lesson: 'If blue screens start right after a driver update and name the graphics driver, roll back to the previous driver. Report the bad version to L2 so it can be blocked for everyone.',
      kb: 'drivers'
    },
    {
      id: 'battery', title: 'Laptop lid not closing, case bulging', category: 'Hardware', priority: 'P2',
      user: 'cmeiyee', host: 'XYZ-CS-005',
      body: "My laptop lid doesn't close properly anymore and the bottom is bulging a bit. The touchpad also feels raised. It's still working though, can I continue using?",
      setup: () => {},
      escalate: 'Desktop L2',
      check: () => false,
      answers: {
        error: 'No error, it works. Just looks puffy underneath.',
        when: 'Noticed this week, getting worse.',
        restart: 'Restart works fine.',
        computer: 'XYZ-CS-005.',
        others: 'Just my laptop.',
        verify: 'XYZ24456.'
      },
      relevant: ['when'],
      hint: 'A bulging case and a raised touchpad are physical symptoms. What is swelling inside a laptop?',
      lesson: 'A swollen lithium battery is a fire risk. Tell the user to stop using it, shut it down, unplug it and keep it away from heat. Escalate to Desktop L2 for a replacement and safe disposal. No remote fix exists.',
      kb: 'escalation'
    },
    {
      id: 'ransomware', title: 'Files renamed, ransom note on screen', category: 'Security', priority: 'P1',
      user: 'psubra', host: 'XYZ-FIN-031',
      body: "All my files suddenly have a weird extension (.lockd) and there's a text file saying pay Bitcoin to get them back!!! What is happening??",
      setup: () => {},
      escalate: 'Security',
      check: () => false,
      bonus: { check: w => D(w)['XYZ-FIN-031'].isolated, label: 'Isolated the laptop from the network first', pts: 20 },
      forbid: { wipe: { label: 'Wiped the laptop and destroyed the evidence', pts: -60 } },
      answers: {
        error: 'The note says "Your files are encrypted. Pay 0.5 BTC". Files end with .lockd.',
        when: 'Started 10 minutes ago after I opened an invoice attachment.',
        restart: 'Should I restart?? I haven\'t.',
        computer: 'XYZ-FIN-031.',
        others: "Don't know… the Finance shared drive also has .lockd files now 😨",
        verify: 'XYZ25510.'
      },
      relevant: ['when', 'others'],
      reveal: { key: 'hacker', name: 'Unknown attacker', text: "The \"invoice\" attachment ran ransomware that began encrypting her files and the Finance shared drive. Every minute the laptop stays on the network, more shared files get encrypted." },
      hint: 'This is ransomware spreading to the shared drive. Stop the spread first (Devices → Isolate), then escalate. Don\'t wipe: Security needs the evidence.',
      lesson: "Ransomware: isolate the device from the network immediately to stop it spreading, tell the user not to turn it off or pay, and escalate to Security at once. Don't wipe or reimage. The evidence matters, and backups are restored by Security and L2.",
      kb: 'ransomware'
    },
    {
      id: 'timeskew', title: 'Sign-in fails: clock wrong', category: 'Device', priority: 'P3',
      user: 'htanaka', host: 'XYZ-SLS-030',
      body: "Hello. My laptop clock shows wrong time, 17 minutes slow. Now Teams and the VPN say 'sign-in failed'. I set time manually but it change back. Sorry for trouble.",
      setup: w => { w.hosts['XYZ-SLS-030'].clockSkew = 17; },
      check: w => !w.hosts['XYZ-SLS-030'].clockSkew,
      solve: w => { w.hosts['XYZ-SLS-030'].clockSkew = 0; },
      answers: {
        error: '"Sign-in failed. The time on your device is incorrect."',
        when: 'Since I came back from Tokyo on Sunday.',
        restart: 'Yes, still 17 minutes slow.',
        computer: 'XYZ-SLS-030.',
        others: 'Only me.',
        verify: 'XYZ30112.'
      },
      relevant: ['error', 'computer'],
      hint: 'Sign-in (Kerberos) fails when the clock is more than 5 minutes off. Connect to XYZ-SLS-030 in Terminal and resync Windows Time: w32tm /resync',
      lesson: 'Windows sign-in breaks when the clock is more than 5 minutes off. Instead of setting it by hand, resync with the domain time source: w32tm /resync. Check the time zone is right too, especially after travel.',
      kb: 'time'
    },
    {
      id: 'assigndevice', title: "New laptop: 'device not assigned'", category: 'Device', priority: 'P3',
      user: 'ahakim', host: 'XYZ-SLS-022',
      body: "Hi, I got my new laptop today. When I sign in with my work account it says 'This device isn't assigned to you' and stops. My manager is Encik Zaki.",
      setup: () => {},
      check: w => D(w)['XYZ-SLS-022'].owner === 'ahakim',
      solve: w => { D(w)['XYZ-SLS-022'].owner = 'ahakim'; },
      answers: {
        error: '"Something went wrong. This device isn\'t assigned to you. Contact your administrator."',
        when: 'Just now, first time opening it.',
        restart: 'Restarted, same screen.',
        computer: 'The box says XYZ-SLS-022.',
        others: 'Only my laptop, others got theirs set up already.',
        verify: 'XYZ30001.'
      },
      relevant: ['error', 'computer'],
      hint: 'Devices → XYZ-SLS-022. Who is it assigned to?',
      lesson: 'New laptops are pre-registered and must be assigned to their user before setup can finish. Assign the device, then ask the user to restart the setup.',
      kb: 'compliance'
    },
    {
      id: 'encryptionoff', title: "Shared laptop blocked: 'encryption required'", category: 'Device', priority: 'P3',
      user: 'niman', host: 'XYZ-MKT-040',
      body: "The shared Marketing laptop won't let me open Outlook. It says encryption is required? I don't know what that means 🙈",
      setup: w => { D(w)['XYZ-MKT-040'].encrypted = false; },
      check: w => D(w)['XYZ-MKT-040'].encrypted,
      solve: w => { D(w)['XYZ-MKT-040'].encrypted = true; },
      answers: {
        error: '"Your device must be encrypted to access company resources."',
        when: 'Today, first time using this laptop.',
        restart: 'Restarted, same.',
        computer: 'Sticker says XYZ-MKT-040.',
        others: "Not sure, it's from the shared cabinet.",
        verify: 'XYZ50033.'
      },
      relevant: ['error', 'computer'],
      hint: 'Devices → XYZ-MKT-040. Encryption is off, so start BitLocker.',
      lesson: "Unencrypted laptops are non-compliant, because a lost laptop could leak data. Starting BitLocker fixes it, and it runs in the background while she works. Shared pool laptops are easy to miss in onboarding.",
      kb: 'bitlocker'
    },
    {
      id: 'lostphone', title: 'Lost personal phone with work apps', category: 'Device', priority: 'P2',
      user: 'fnadia', host: 'PH-FNADIA',
      body: "I lost my phone on the LRT this morning 😭 It's my own phone but has Outlook and Teams for work. Can you remove the company stuff? Please don't erase my baby photos!!",
      setup: () => {},
      check: w => { const d = D(w)['PH-FNADIA']; return d.wiped === 'selective'; },
      solve: w => { D(w)['PH-FNADIA'].wiped = 'selective'; },
      answers: {
        error: 'No error, I just lost it.',
        when: 'This morning on the Kelana Jaya line.',
        restart: 'Haha cannot.',
        computer: "It's my personal Samsung, it shows as PH-FNADIA in the app.",
        others: 'Just me.',
        verify: 'XYZ29934.'
      },
      relevant: ['verify'],
      hint: "It's her personal phone (BYOD). Devices → PH-FNADIA. There's a wipe that only removes the work profile.",
      lesson: "On personal (BYOD) phones the company only manages the work profile. A selective wipe removes company apps and data and leaves personal photos alone. A full wipe of someone's own phone is never the help desk's call.",
      kb: 'lostdevice'
    }
  );

  window.KB.push(
    { id: 'bitlocker', title: 'BitLocker & recovery keys', body: 'BitLocker encrypts the whole disk. After firmware or hardware changes it asks for the 48-digit <b>recovery key</b>. Verify the caller is the <b>device owner</b>, match the <b>Key ID</b> on their screen to the device, then read out the key. Never give a key to a colleague. Unencrypted laptops are non-compliant: start encryption.' },
    { id: 'lostdevice', title: 'Lost & stolen devices', body: '<b>Lost, may be recovered</b>: remote lock and mark as lost. <b>Confirmed stolen with Security approval</b>: full wipe. <b>Personal phone (BYOD)</b>: selective wipe of the work profile only. Always tell Security.' },
    { id: 'usb', title: 'USB storage policy', body: 'USB storage is blocked to prevent data leaks and malware. Only allow a <b>temporary exception</b> on the named device with <b>written Security approval</b>. Otherwise, offer a OneDrive or SharePoint link.' },
    { id: 'compliance', title: 'Device compliance', body: 'Company apps only open on <b>compliant</b> devices: encrypted, firewall on, updates current, assigned to the user. "Your device doesn\'t meet requirements" means check the compliance reasons in Devices and fix the cause.' },
    { id: 'drivers', title: 'Blue screens & drivers', body: 'If blue screens start right after a driver update (e.g. <code>VIDEO_TDR_FAILURE</code> = graphics), <b>roll back</b> to the previous driver and report the bad version to L2.' },
    { id: 'ransomware', title: 'Ransomware', body: 'Renamed files plus a ransom note: <b>isolate the device</b> from the network right away, tell the user not to pay or turn it off, and escalate to <b>Security</b>. Never wipe: Security needs the evidence.' },
    { id: 'time', title: 'Clock out of sync', body: 'Windows sign-in fails if the clock is more than 5 minutes off. Check with <code>w32tm /query /status</code> and fix with <code>w32tm /resync</code>. Check the time zone after travel.' }
  );
})();
