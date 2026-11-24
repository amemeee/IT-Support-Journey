/* =========================================================
   Batch 4 — Network & Wi-Fi
   Adds: the office network (internet line, firewall & web
   filter, switches, Wi-Fi, DHCP, VPN), 1 new user, 1 extra
   PC, 15 scenarios and KB articles.
   ========================================================= */
import { DIRECTORY, HOSTS } from './core.js';
import { MAIL } from './email.js';

// new user for this batch: the Penang branch admin
DIRECTORY.lckeong = {
  name: 'Lee Chee Keong', callName: 'Chee Keong', dept: 'Operations', title: 'Branch Admin (Penang)', empId: 'XYZ51207',
  groups: ['All-Staff', 'Ops-RW', 'VPN-Users'], enabled: true, locked: false, pwdExpired: false, mfa: 'Registered', phone: 'x8120'
};

MAIL.boxes.lckeong = { size: 7.2, quota: 50, archive: false, licensed: true, rules: [], forward: null, autoReply: null, cal: [] };

// Tan Wei Min's laptop joins the network list so it can be reached from the Terminal
HOSTS['XYZ-ENG-015'] = {
  owner: 'twmin', ip: '10.12.7.15', apipa: false, dnsStale: false, spooler: 'Running', queue: 0, disk: 48,
  outlook: 'Healthy', software: ['Microsoft 365', 'Chrome', 'Teams', 'VS Code'], os: 'Windows 11 Pro 23H2'
};

const port = (id, desc, mac = '', vendor = '', status = 'up', vlan = 10) => ({ id, desc, status, vlan, mac, vendor });

export const NETWORK = {
  wan: { isp: 'Business fibre 500 Mbps', status: 'Up', utilisation: 31, topTalkers: [
    { host: 'XYZ-FIN-010', what: 'Microsoft 365 / OneDrive', pct: 6 },
    { host: 'XYZ-MKT-027', what: 'Video streaming (Teams)', pct: 4 },
    { host: 'XYZ-ENG-007', what: 'GitHub', pct: 3 }
  ] },
  firewall: { name: 'FW-HQ-01', status: 'Online' },
  ups: { 'UPS-L12': 'Online', 'UPS-L3': 'Online' },
  tunnels: [{ name: 'HQ ↔ Penang branch', status: 'Up', detail: 'IPsec site-to-site, uptime 41 days' }],

  aps: {
    'AP-L12-E': { location: 'Level 12 east wing', status: 'Online', clients: 23, ch24: 1, ch5: 36, util24: 28, bandSteering: true },
    'AP-L12-W': { location: 'Level 12 west wing', status: 'Online', clients: 19, ch24: 6, ch5: 44, util24: 31, bandSteering: true },
    'AP-L12-P': { location: 'Level 12 pantry & meeting rooms', status: 'Online', clients: 14, ch24: 11, ch5: 149, util24: 22, bandSteering: true },
    'AP-L3-01': { location: 'Level 3 warehouse office', status: 'Online', clients: 9, ch24: 6, ch5: 52, util24: 18, bandSteering: true }
  },
  wifi: { staffSsid: 'XYZ100-Staff', staffPsk: 'Rimau-Kopi-2026!', guestSsid: 'XYZ100-Guest', vouchers: [], pskRevealed: false },

  switches: {
    'SW-L12-CORE': { location: 'Level 12 server room', status: 'Online', ports: [
      port('Gi1/0/1', 'Uplink to FW-HQ-01', '00:1b:17:00:01:01', 'Palo Alto Networks', 'up', 1),
      port('Gi1/0/2', 'AP-L12-E', '44:48:c1:22:10:0e', 'Hewlett Packard Enterprise'),
      port('Gi1/0/3', 'AP-L12-W', '44:48:c1:22:10:1f', 'Hewlett Packard Enterprise'),
      port('Gi1/0/4', 'AP-L12-P', '44:48:c1:22:10:2a', 'Hewlett Packard Enterprise'),
      port('Gi1/0/9', 'PRN-L12-01 (printer)', '00:80:77:5c:31:aa', 'Brother Industries', 'up', 20),
      port('Gi1/0/14', 'XYZ-ENG-007 desk', '3c:52:82:aa:07:07', 'Dell'),
      port('Gi1/0/17', 'Engineering lab bench', '24:0a:c4:11:3e:5d', 'Espressif Inc. (IoT board)'),
      port('Gi1/0/22', 'Meeting room Melati (wall port)', '', '', 'down'),
      port('Gi1/0/23', 'Meeting room Cempaka (wall port)', '', '', 'down'),
      port('Gi1/0/48', 'NVR-L12 (CCTV)', '00:40:8c:d4:20:10', 'Axis Communications', 'up', 30)
    ] },
    'SW-L3': { location: 'Level 3 comms cabinet', status: 'Online', ports: [
      port('Gi1/0/1', 'Uplink to SW-L12-CORE', '70:10:6f:aa:00:01', 'Cisco', 'up', 1),
      port('Gi1/0/2', 'AP-L3-01', '44:48:c1:22:30:01', 'Hewlett Packard Enterprise')
    ] }
  },

  dhcp: { scope: '10.12.0.0/16 (staff)', used: 412, total: 500, exclusions: [], reservations: [
    { name: 'NVR-L12', mac: '00:40:8c:d4:20:10', ip: '10.12.20.10' }
  ] },
  printers: { 'PRN-L12-01': { mac: '00:80:77:5c:31:aa', ip: '10.12.6.240', expectedIp: '10.12.6.240' } },

  filter: {
    blockedCategories: ['Gambling', 'Adult', 'Malware', 'Newly registered domains', 'Peer-to-peer'],
    exceptions: [],
    // what the filter says about some sites
    lookup: {
      'portal.majujaya-supplies.com.my': 'Newly registered domains',
      '4d-result-live.top': 'Gambling',
      'images.photostock-eu.com': 'Photography (allowed)',
      'google.com': 'Search engines (allowed)'
    }
  },

  vpn: {
    gateway: 'Online',
    profiles: { htanaka: 'IKEv2 (UDP 500/4500)', jwong: 'IKEv2 (UDP 500/4500)', twming: 'IKEv2 (UDP 500/4500)', azaki: 'IKEv2 (UDP 500/4500)' },
    failedLogins: []
  },

  traced: [],          // tracert targets the agent has run
  viewedTopTalkers: false
};

const N = w => w.net;

export const NETWORK_SCENARIOS = [
  {
    id: 'apdown', title: 'Wi-Fi connected but no internet (east wing)', category: 'Network', priority: 'P2',
    user: 'shajar',
    body: "Wi-Fi shows connected but nothing loads. Same for everyone in Legal on the east side. Our laptops can't print or open email!",
    setup: w => { Object.assign(N(w).aps['AP-L12-E'], { status: 'Not responding', clients: 0 }); },
    check: w => N(w).aps['AP-L12-E'].status === 'Online',
    solve: w => { Object.assign(N(w).aps['AP-L12-E'], { status: 'Online', clients: 23 }); },
    answers: {
      error: 'The Wi-Fi icon has a little globe, "No internet". It still says XYZ100-Staff.',
      when: 'About 20 minutes ago.',
      restart: 'Two of us restarted our laptops. Same.',
      computer: 'XYZ-LEG-004, but it is everyone near me.',
      others: 'Everyone on the east side, about 20 people. The west side is fine.',
      verify: 'XYZ21190.'
    },
    relevant: ['others'],
    hint: 'Many people, one area, others fine: look at the access point that covers the east wing (Network → Wi-Fi).',
    lesson: 'When everyone in one area loses Wi-Fi but other areas are fine, suspect the access point covering that area, not the laptops or the core network. Reboot that one AP; never the core switch during working hours.',
    kb: 'wifi'
  },
  {
    id: 'guestwifi', title: 'Visitor wants the staff Wi-Fi password', category: 'Network', priority: 'P4',
    user: 'rosnah',
    body: "Our visitor from the bank needs Wi-Fi for her presentation at 3pm in Melati room. She asked for the staff Wi-Fi password. What is it ah?",
    setup: () => {},
    check: w => N(w).wifi.vouchers.length > 0 && !N(w).wifi.pskRevealed,
    solve: w => { N(w).wifi.vouchers.push({ for: 'Visitor (bank)', valid: '1 day' }); },
    answers: {
      error: 'No error, she just needs internet for her slides.',
      when: 'Presentation at 3pm today.',
      restart: 'Nothing to restart.',
      computer: "It's her own laptop from the bank.",
      others: 'Just her.',
      verify: 'XYZ17723.'
    },
    relevant: ['computer'],
    hint: 'Visitors never get the staff network. Network → Wi-Fi has a guest voucher option.',
    lesson: 'Visitors and personal devices go on the guest network, which is separated from company systems. Give a time-limited guest voucher. The staff Wi-Fi password lets a device onto the internal network, and changing it later means reconnecting every staff device.',
    kb: 'wifi'
  },
  {
    id: 'hotelvpn', title: 'VPN fails at a Jakarta hotel', category: 'Network', priority: 'P2',
    user: 'htanaka',
    body: "Hello. I am in Jakarta for the client meeting. Hotel Wi-Fi works for websites, but VPN says error 809. In KL office and my home it works. Sorry for trouble.",
    setup: () => {},
    check: w => N(w).vpn.profiles.htanaka.startsWith('SSL'),
    solve: w => { N(w).vpn.profiles.htanaka = 'SSL (TCP 443)'; },
    answers: {
      error: '"Error 809: The network connection between your computer and the VPN server could not be established."',
      when: 'Since I arrived at the hotel last night.',
      restart: 'Yes, restarted laptop. Same error.',
      computer: 'XYZ-SLS-030.',
      others: 'My colleague at the same hotel also cannot connect.',
      verify: 'XYZ30112.'
    },
    relevant: ['error', 'others'],
    hint: 'Error 809 usually means the network in between blocks the VPN ports (UDP 500/4500). Network → VPN: is there a profile that uses port 443 instead?',
    lesson: 'Hotel and guest networks often block the UDP ports IKEv2 VPNs use, which shows up as error 809. Switching the user to an SSL VPN profile on TCP 443 (the same port as normal HTTPS) usually gets through.',
    kb: 'vpn'
  },
  {
    id: 'homeunifi', title: 'No internet at home (WFH)', category: 'Network', priority: 'P3',
    user: 'kavitha', passive: true,
    body: "Working from home today and my home internet is down since morning. The Unifi router has a red blinking LOS light. Can IT fix it? I have a client call at 2pm 😩",
    setup: () => {},
    check: () => true,
    solve: () => {},
    answers: {
      error: 'Router shows LOS blinking red. Phone on mobile data works.',
      when: 'Since about 8am.',
      restart: 'Restarted the router twice already.',
      computer: 'XYZ-MKT-019, but laptop is fine, it is the internet.',
      others: 'My neighbour also complained in the residents WhatsApp group!',
      verify: 'XYZ26677.'
    },
    relevant: ['error', 'others'],
    hint: 'LOS (loss of signal) on a home fibre router means the fibre line itself. Is that something the company network team can fix?',
    lesson: "A red LOS light means the fibre signal isn't reaching the home router: a fault for the internet provider, not the company. Help the user: give them the provider's fault line, suggest a mobile hotspot for the client call, and close the ticket. Escalating to Infrastructure wastes their time.",
    kb: 'homeinternet'
  },
  {
    id: 'printerip', title: 'Level 12 printer offline for everyone', category: 'Network', priority: 'P2',
    user: 'lsling',
    body: "Since the power cut this morning, nobody in Ops can print to the Level 12 printer. Windows says 'Printer offline'. The printer screen looks normal!",
    setup: w => { N(w).printers['PRN-L12-01'].ip = '10.12.6.188'; },
    check: w => N(w).printers['PRN-L12-01'].ip === N(w).printers['PRN-L12-01'].expectedIp,
    solve: w => { N(w).dhcp.reservations.push({ name: 'PRN-L12-01', mac: '00:80:77:5c:31:aa', ip: '10.12.6.240' }); N(w).printers['PRN-L12-01'].ip = '10.12.6.240'; },
    answers: {
      error: '"Printer offline" on every laptop.',
      when: 'Since the power cut at 8.30am.',
      restart: 'We restarted the printer and laptops. Still offline.',
      computer: 'All of Ops, my laptop is XYZ-OPS-031.',
      others: 'Everyone in Ops, maybe 15 people.',
      verify: 'XYZ19034.'
    },
    relevant: ['when', 'others'],
    hint: "Everyone's printer setting points to 10.12.6.240. After the power cut, what IP did the printer get? Network → DHCP.",
    lesson: 'Printers should never get a random address from DHCP: after a restart they can come back with a new IP, and every PC still points at the old one. Create a DHCP reservation so the printer always gets the same IP.',
    kb: 'dhcp'
  },
  {
    id: 'dupip', title: '"IP address conflict" on a laptop', category: 'Network', priority: 'P3',
    user: 'twmin', host: 'XYZ-ENG-015',
    body: "Windows keeps saying 'IP address conflict' and my network drops every few minutes. Started after the lab moved their test boards next to my desk 🤔",
    setup: w => { w.hosts['XYZ-ENG-015'].conflict = true; },
    check: w => !w.hosts['XYZ-ENG-015'].conflict,
    solve: w => { N(w).dhcp.exclusions.push('10.12.7.15'); w.hosts['XYZ-ENG-015'].conflict = false; w.hosts['XYZ-ENG-015'].ip = '10.12.7.88'; },
    answers: {
      error: '"Windows has detected an IP address conflict. Another system on this network is using your computer\'s IP address."',
      when: 'This morning, after the lab moved the test boards.',
      restart: 'Restarted, came back after a few minutes.',
      computer: 'XYZ-ENG-015.',
      others: "Only me I think. The lab guys set their boards with fixed IPs, don't know which.",
      verify: 'XYZ22901.'
    },
    relevant: ['error', 'computer'],
    hint: 'Connect to XYZ-ENG-015 and run arp -a. A lab board has a fixed IP inside the DHCP range. Exclude that IP in DHCP (Network → DHCP), then ipconfig /renew on the laptop.',
    lesson: 'An IP conflict means two devices use the same address, often a device set to a fixed IP inside the DHCP range. Exclude that address from DHCP so it is never handed out again, then renew the PC. Ask the lab to use addresses outside the range.',
    kb: 'dhcp'
  },
  {
    id: 'filterwork', title: 'Supplier portal blocked by web filter', category: 'Network', priority: 'P3',
    user: 'fnadia',
    body: "Maju Jaya moved their invoice portal to a new site and our web filter blocks it: 'Newly registered domain'. I need to download invoices for payment run. Encik Hafiz approved (email attached).",
    setup: () => {},
    check: w => N(w).filter.exceptions.includes('portal.majujaya-supplies.com.my'),
    solve: w => { N(w).filter.exceptions.push('portal.majujaya-supplies.com.my'); },
    answers: {
      error: 'Block page: "portal.majujaya-supplies.com.my, category: Newly registered domains".',
      when: 'Today, they sent the new link last week.',
      restart: 'Not a PC problem.',
      computer: 'XYZ-FIN-044.',
      others: 'Everyone in Finance gets the same block.',
      verify: 'XYZ29934.'
    },
    relevant: ['error'],
    hint: 'Known supplier, business reason, manager approval. Network → Firewall: add an exception for exactly that site.',
    lesson: "New domains are blocked because scammers use them, so check it really is the supplier (the email came from their known address and the manager approved). Then allow only that exact site, never the whole category.",
    kb: 'webfilter'
  },
  {
    id: 'filtergamble', title: 'Unblock a 4D results site', category: 'Network', priority: 'P4',
    user: 'ksoon', passive: true,
    body: "Eh bro, can unblock 4d-result-live.top? My uncle asked me to check his numbers 😅 Just for today only.",
    setup: () => {},
    check: w => !N(w).filter.exceptions.includes('4d-result-live.top'),
    solve: () => {},
    answers: {
      error: 'Block page says category Gambling.',
      when: 'Just now.',
      restart: 'Haha no need.',
      computer: 'XYZ-SLS-014.',
      others: 'Dunno.',
      verify: 'XYZ26001.'
    },
    relevant: [],
    hint: 'Is there a business reason? What category is it?',
    lesson: 'Blocked categories like gambling are company policy, not a technical fault. Politely decline and close the ticket. Exceptions are only for business needs with approval.',
    kb: 'webfilter'
  },
  {
    id: 'teamschoppy', title: 'Teams calls choppy for the whole office', category: 'Outage', priority: 'P1',
    user: 'rosnah',
    body: "All Teams calls since 9am are breaking up, everybody complaining. Internet also super slow for everyone on Level 12.",
    setup: w => {
      N(w).wan.utilisation = 97;
      N(w).wan.topTalkers.unshift({ host: 'XYZ-SRV-BK01', what: 'Cloud backup upload (job started 09:00)', pct: 88 });
    },
    escalate: 'Infrastructure',
    check: () => false,
    bonus: { check: w => N(w).viewedTopTalkers, label: 'Found the cause in the firewall traffic view', pts: 15 },
    answers: {
      error: 'Teams says "poor network quality" and people sound like robots.',
      when: 'Since about 9am.',
      restart: 'Restarted Teams, no difference.',
      computer: 'Everyone.',
      others: 'The whole of Level 12.',
      verify: 'XYZ17723.'
    },
    relevant: ['when', 'others'],
    hint: 'The whole office at once points to the internet line. Network → Firewall shows what is using it.',
    lesson: "When the whole office is slow at once, check the internet line's usage before touching any PC. A backup job running in office hours can fill the line. Escalate to Infrastructure with what you found, because rescheduling server jobs is their change to make.",
    kb: 'bandwidth'
  },
  {
    id: 'rogueport', title: 'Unknown box under the meeting room table', category: 'Security', priority: 'P1',
    user: 'rahman',
    body: "Assalamualaikum IT. During my round I found a small box with blinking lights plugged into the wall socket under the table in Melati meeting room. Not ours I think. Can check?",
    setup: w => { Object.assign(N(w).switches['SW-L12-CORE'].ports.find(p => p.id === 'Gi1/0/22'), { status: 'up', mac: 'b8:27:eb:4a:11:02', vendor: 'Raspberry Pi Trading' }); },
    escalate: 'Security',
    check: () => false,
    bonus: { check: w => N(w).switches['SW-L12-CORE'].ports.find(p => p.id === 'Gi1/0/22').status === 'shutdown', label: 'Shut down the switch port first', pts: 20 },
    forbid: { portEnable: { label: 'Re-enabled the port with the unknown device', pts: -40 } },
    answers: {
      error: 'No error. Small black box, size of a deck of cards, cable to the wall, green light blinking.',
      when: 'Found it at 7am round. Meeting room was used by visitors yesterday.',
      restart: "I didn't touch it.",
      computer: 'Melati meeting room, the wall port under the table.',
      others: 'Only that room.',
      verify: 'XYZ40210.'
    },
    relevant: ['when', 'computer'],
    reveal: { key: 'hacker', name: 'Unknown attacker', text: 'Yesterday\'s "visitor" left a small computer plugged into the meeting room wall port. It quietly gave them a way into the internal network from outside.' },
    hint: 'Network → Switches: which port is the Melati wall port, and what is plugged into it? Cut it off, then escalate.',
    lesson: "An unknown device on an internal port is a security incident. Shut the switch port to cut it off, don't unplug or take it home (it is evidence), tell the guard to leave it in place, and escalate to Security.",
    kb: 'rogue'
  },
  {
    id: 'wifiband', title: 'Wi-Fi drops every lunchtime near the pantry', category: 'Network', priority: 'P3',
    user: 'cmeiyee',
    body: "Every day around lunch time the Wi-Fi in the meeting rooms near pantry keeps dropping. My customer video calls freeze. Other times OK. Very weird!",
    setup: w => { Object.assign(N(w).aps['AP-L12-P'], { bandSteering: false, util24: 94 }); },
    check: w => N(w).aps['AP-L12-P'].bandSteering,
    solve: w => { N(w).aps['AP-L12-P'].bandSteering = true; },
    answers: {
      error: 'Teams says "Your network is unstable" then the video freezes.',
      when: 'Every day about 12.30 to 1.30.',
      restart: 'Restarted laptop, no change.',
      computer: 'XYZ-CS-005.',
      others: 'Everyone in the rooms near the pantry. Lunch time the pantry is packed with people heating food.',
      verify: 'XYZ24456.'
    },
    relevant: ['when', 'others'],
    hint: 'Lunchtime, pantry, microwaves: microwave ovens interfere with 2.4 GHz Wi-Fi. Network → Wi-Fi → AP-L12-P. Move clients to 5 GHz.',
    lesson: 'Microwave ovens leak noise in the 2.4 GHz band. Turning on band steering pushes laptops and phones to 5 GHz, which microwaves don\'t affect. A pattern tied to a time of day is a great clue.',
    kb: 'wifi'
  },
  {
    id: 'powertrip', title: 'Level 3 offline after the storm', category: 'Outage', priority: 'P1',
    user: 'nain',
    body: "After the thunderstorm and power trip just now, the whole Level 3 warehouse office has no network. Lights are back on already but computers and Wi-Fi all no internet.",
    setup: w => { N(w).switches['SW-L3'].status = 'Unreachable since 15:42'; N(w).ups['UPS-L3'] = 'Shut down (battery exhausted)'; N(w).aps['AP-L3-01'].status = 'Unreachable'; },
    escalate: 'Infrastructure',
    check: () => false,
    answers: {
      error: 'Every PC says "No internet". The Wi-Fi name disappeared too.',
      when: 'Since the power trip around 3.40pm.',
      restart: 'We restarted a few PCs. Same.',
      computer: 'All of Level 3.',
      others: 'Everyone on Level 3. Level 12 is fine I heard.',
      verify: 'XYZ31877.'
    },
    relevant: ['when', 'others'],
    hint: 'Network → Overview: look at the Level 3 switch and its UPS.',
    lesson: "A whole floor down after a power cut usually means the floor switch or its UPS didn't come back. The help desk can't power-cycle equipment in a locked comms cabinet. Escalate to Infrastructure with the switch and UPS status, and tell users the time of the next update.",
    kb: 'outage'
  },
  {
    id: 'vpnattack', title: 'VPN account locked overnight', category: 'Security', priority: 'P1',
    user: 'jwong',
    body: "My VPN and email login both say account locked. I was sleeping, didn't try anything! Please unlock fast, I have a client presentation at 10.",
    setup: w => {
      w.users.jwong.locked = true;
      N(w).vpn.failedLogins.push({ user: 'jwong', count: 412, from: '185.220.101.x, 45.134.26.x (overseas)', when: '01:12–04:40' });
    },
    escalate: 'Security',
    check: () => false,
    forbid: { unlock: { label: 'Unlocked an account under active attack', pts: -60 } },
    answers: {
      error: '"Your account has been locked." Both VPN and Outlook web.',
      when: 'Noticed when I woke up at 7.',
      restart: 'Restarted laptop and phone, same.',
      computer: 'XYZ-SLS-008.',
      others: "Don't know.",
      verify: 'XYZ27781.'
    },
    relevant: ['when'],
    reveal: { key: 'hacker', name: 'Unknown attacker', text: "Someone tried 412 passwords against Jason's VPN login overnight from overseas servers: a password-guessing attack. The lockout is what stopped them." },
    hint: "He says he didn't try. Network → VPN shows failed sign-ins. Who caused the lockout?",
    lesson: 'Hundreds of failed sign-ins from overseas at night is a password-guessing attack, and the lockout is protection working. Don\'t simply unlock. Escalate to Security, who will block the source IPs, reset the password and check that MFA held.',
    kb: 'vpn'
  },
  {
    id: 'branchvpn', title: "Penang branch can't reach file server", category: 'Outage', priority: 'P2',
    user: 'lckeong',
    body: "Hi from Penang. Since this morning our branch cannot open the shared drives at HQ. Internet and email are OK. The 6 of us are stuck, cannot process orders.",
    setup: w => { N(w).tunnels[0].status = 'Down'; N(w).tunnels[0].detail = 'IPsec phase 1 failed since 08:05 (peer not responding)'; },
    escalate: 'Infrastructure',
    check: () => false,
    answers: {
      error: '"\\\\fs01 is not accessible. The network path was not found."',
      when: 'Since we came in at 8am.',
      restart: 'Restarted all PCs and the branch router. Same.',
      computer: 'All 6 PCs at the branch.',
      others: 'Everyone in Penang branch. KL is fine?',
      verify: 'XYZ51207.'
    },
    relevant: ['error', 'others'],
    hint: 'Internet works but HQ servers don\'t: what connects the branch to HQ? Network → Overview.',
    lesson: 'If a branch has internet but cannot reach HQ systems, the site-to-site VPN tunnel between them is the usual suspect. Tunnels are configured on the firewalls at both ends, which is Infrastructure work. Escalate with the tunnel status and error.',
    kb: 'vpn'
  },
  {
    id: 'slowsite', title: '"Internet is very slow"', category: 'Network', priority: 'P4',
    user: 'draj', host: 'XYZ-MKT-027',
    body: "Internet super slow today!! The stock photo site takes forever to load images. Can you make it faster?",
    setup: () => {},
    check: w => N(w).traced.includes('images.photostock-eu.com'),
    solve: w => { N(w).traced.push('images.photostock-eu.com'); },
    answers: {
      error: 'No error, images.photostock-eu.com just loads very slowly.',
      when: 'Since this morning.',
      restart: 'Restarted, same.',
      computer: 'XYZ-MKT-027.',
      others: 'Other websites are fast actually. YouTube OK, Google OK.',
      verify: 'XYZ28802.'
    },
    relevant: ['others'],
    hint: 'Only one site is slow, everything else is fast. Where is the delay? Try tracert images.photostock-eu.com in the Terminal.',
    lesson: "If only one site is slow, the problem is usually on the way to that site or at the site itself, not in the office. tracert shows where the delay starts. Explain that to the user rather than restarting things, and suggest trying again later.",
    kb: 'tracert'
  }
];

export const NETWORK_KB = [
  { id: 'wifi', title: 'Wi-Fi problems', body: 'One area down while others work: suspect that <b>access point</b>, reboot it (never the core switch in office hours). Drops at fixed times near a pantry: microwave interference on <b>2.4 GHz</b>, so enable <b>band steering</b> to 5 GHz. Visitors get a <b>guest voucher</b>, never the staff password.' },
  { id: 'vpn', title: 'VPN problems', body: 'Error <b>809</b> on hotel or guest networks: the UDP ports are blocked, so switch to the <b>SSL VPN (TCP 443)</b> profile. Many failed sign-ins from overseas: an attack, escalate to <b>Security</b>. Branch can reach the internet but not HQ: the <b>site-to-site tunnel</b> is down, escalate to <b>Infrastructure</b>.' },
  { id: 'homeinternet', title: 'Home internet (WFH)', body: 'A red <b>LOS</b> light on a home fibre router means the fibre signal is lost: a provider fault. Give the user the provider\'s fault line and suggest a mobile hotspot. Not an Infrastructure ticket.' },
  { id: 'dhcp', title: 'DHCP, reservations & conflicts', body: 'Printers and other shared devices need a <b>DHCP reservation</b> so their IP never changes. <b>IP conflict</b>: find the other device with <code>arp -a</code>, <b>exclude</b> its fixed IP from DHCP, then <code>ipconfig /renew</code>.' },
  { id: 'webfilter', title: 'Web filter requests', body: 'Allow an <b>exact site</b> only when there is a business need and approval (e.g. a known supplier on a new domain). Never unblock categories like <b>Gambling</b> or <b>Adult</b>: politely decline.' },
  { id: 'bandwidth', title: 'Whole office slow', body: 'Check internet line usage and <b>top talkers</b> on the firewall before touching PCs. A backup or big upload in office hours can fill the line. Escalate to <b>Infrastructure</b> with what you found.' },
  { id: 'rogue', title: 'Unknown device on the network', body: 'Shut the <b>switch port</b> to cut it off, leave the device in place as evidence, and escalate to <b>Security</b>. Don\'t unplug it and take it away.' },
  { id: 'outage', title: 'Floor or site outages', body: 'Whole floor down after a power cut: check the <b>floor switch</b> and its <b>UPS</b> on the network overview, then escalate to <b>Infrastructure</b> with the status. Give users regular updates.' },
  { id: 'tracert', title: 'One website slow: tracert', body: '<code>tracert &lt;site&gt;</code> lists each hop on the way. If the delay only starts far outside our network, the problem is on the internet route or at the site, not in the office.' }
];
