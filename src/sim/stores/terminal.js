/* =========================================================
   Terminal: Windows network commands on a connected PC, plus
   PowerShell-style admin commands for Active Directory,
   Exchange Online, Microsoft Graph and Intune.
   Command names and parameters follow the real cmdlets where
   possible; anything invented is marked "(simulator)".
   ========================================================= */
import * as DATA from '../../data/index.js';
import { useGame } from './game.js';
import { useOps, NET_DOMAIN as D, mailAddr, deviceIssues, SKU } from './ops.js';
import { term, termPrint, termSlow, termClear } from '../lib/termout.js';
import { rand, sleep } from '../lib/util.js';

const LOCAL = 'HELPDESK-01';
const pad = (s, n) => String(s ?? '').padEnd(n).slice(0, n);
const TF = b => (b ? 'True' : 'False');

/* ---------- argument parsing ----------
   Handles "quoted strings", 'single quotes', (ConvertTo-SecureString ...)
   and @{ hashtables } / @( arrays ) as single tokens, and -Name value / -Switch. */
const SWITCHES = new Set(['reset', 'archive', 'confirm', 'force', 'releasetoall', 'all']);
function parseArgs(line) {
  const toks = [...line.matchAll(/@\{[^}]*\}|@\([^)]*\)|\((?:[^()]|\([^()]*\))*\)|"([^"]*)"|'([^']*)'|(\S+)/g)]
    .map(m => m[1] ?? m[2] ?? m[3] ?? m[0]);
  toks.shift(); // the command itself
  const pos = [], named = {};
  for (let i = 0; i < toks.length; i++) {
    const m = /^-([A-Za-z]+)(?::(.*))?$/.exec(toks[i]);
    if (!m) { pos.push(toks[i]); continue; }
    const key = m[1].toLowerCase();
    if (m[2] !== undefined) named[key] = m[2];
    else if (SWITCHES.has(key) || i + 1 >= toks.length || /^-[A-Za-z]/.test(toks[i + 1])) named[key] = true;
    else named[key] = toks[++i];
  }
  return { pos, named };
}
const isTrue = v => v === true || /^\$?true$/i.test(String(v));

const ADMIN_HELP = {
  ad: [
    'Active Directory',
    '  Get-ADUser <user>                         account status',
    '  Get-ADUser -Filter "Name -like \'*nurul*\'"  search by name or staff ID',
    '  Unlock-ADAccount <user>',
    '  Enable-ADAccount <user> / Disable-ADAccount <user>',
    '  Set-ADAccountPassword <user> -Reset -NewPassword (ConvertTo-SecureString "Temp-Pass-12!" -AsPlainText -Force)',
    '  Set-ADUser <user> -ChangePasswordAtLogon $true   force a change at next sign-in',
    '  Get-ADPrincipalGroupMembership <user>',
    '  Add-ADGroupMember -Identity <group> -Members <user>   quote names with spaces: "Domain Admins"',
    '  Remove-ADGroupMember -Identity <group> -Members <user>',
    '  Reset-MFA <user>   (simulator; real: Entra admin center → Authentication methods → Require re-register MFA)',
    '<user> can be a username, email or staff ID, e.g. naisyah or XYZ20417'
  ],
  mail: [
    'Exchange Online & licences',
    '  Get-Mailbox <user> / Get-MailboxStatistics <user>',
    '  Enable-Mailbox <user> -Archive',
    '  Get-MgSubscribedSku                       licence SKUs and how many are free',
    '  Set-MgUserLicense -UserId <user> -AddLicenses @{SkuId = "<SkuId>"} -RemoveLicenses @()',
    '  Get-InboxRule -Mailbox <user>',
    '  Remove-InboxRule -Mailbox <user> -Identity "<rule name>"',
    '  Set-Mailbox <user> -ForwardingSmtpAddress $null',
    '  Set-MailboxAutoReplyConfiguration <user> -AutoReplyState Enabled -InternalMessage "..."',
    '  Get-/Add-/Remove-MailboxFolderPermission -Identity <owner>:\\Calendar -User <user> -AccessRights Editor',
    '  Get-MailboxPermission <shared>',
    '  Add-/Remove-MailboxPermission -Identity <shared> -User <user> -AccessRights FullAccess',
    '  Add-/Remove-RecipientPermission -Identity <shared> -Trustee <user> -AccessRights SendAs',
    '  Get-/Add-/Remove-DistributionGroupMember -Identity <list> -Member <user>',
    '  Get-MessageTraceV2 -SenderAddress <x> | -RecipientAddress <x>   (Get-MessageTrace also works)',
    '  Get-QuarantineMessage [-Identity <id>]',
    '  Release-QuarantineMessage -Identity <id> -ReleaseToAll / Delete-QuarantineMessage -Identity <id>'
  ],
  apps: [
    'Rooms & Teams',
    '  Get-CalendarProcessing <room>',
    '  Set-CalendarProcessing <room> -AutomateProcessing AutoAccept -AllowConflicts $false',
    '  Get-TeamUser -GroupId "<team>"',
    '  Add-TeamUser -GroupId "<team>" -User <user> -Role Owner',
    '(Real Add-TeamUser takes the team\'s GroupId GUID; here the team name works too.)',
    'OneDrive, SharePoint, app consents and portals are in the Apps tab.'
  ],
  devices: [
    'Devices (Microsoft Graph / Intune)',
    '  Get-MgDeviceManagementManagedDevice [-Filter "deviceName eq \'XYZ-FIN-010\'"]',
    '  Get-MgInformationProtectionBitlockerRecoveryKey                   list key IDs (no keys)',
    '  Get-MgInformationProtectionBitlockerRecoveryKey -BitlockerRecoveryKeyId <id> -Property key',
    '     sensitive: verify the owner and match the key ID on their screen first',
    '  w32tm /query /status                     clock offset on the connected PC',
    '  w32tm /resync                            resync the clock (connect first)',
    'Lock, wipe, isolate, USB and updates are in the Devices tab.'
  ]
};

export function useTerminal() {
  const g = useGame();
  const ops = useOps();
  const W = () => g.world;
  const ps = r => termPrint([r.msg], r.ok ? 'ok' : 'bad');

  /* ---------- lookups ---------- */
  // username, DOMAIN\username, email address, staff ID, or "user:\Calendar"
  function findUser(x) {
    if (!x || x === true) return null;
    const v = String(x).toLowerCase().replace(/:[\\/]?calendar$/, '').replace(/^.*\\/, '');
    const U = W().users, local = v.split('@')[0];
    if (U[v]) return v;
    if (v.includes('@') && U[local]) return local;
    return Object.keys(U).find(k => U[k].empId.toLowerCase() === v) || null;
  }
  const findIn = (obj, x) => { const v = String(x || '').toLowerCase().split('@')[0]; return obj[v] ? v : null; };
  const needUser = v => { const k = findUser(v); if (!k) throw new Error(`Cannot find an object with identity: '${v === true || !v ? '' : v}'.`); return k; };
  const needShared = v => { const k = findIn(W().mail.shared, v); if (!k) throw new Error(`The operation couldn't be performed because object '${v || ''}' couldn't be found (shared mailboxes: ${Object.keys(W().mail.shared).join(', ')}).`); return k; };
  const needList = v => { const k = findIn(W().mail.dls, v); if (!k) throw new Error(`Couldn't find distribution group '${v || ''}' (lists: ${Object.keys(W().mail.dls).join(', ')}).`); return k; };
  const needGroup = v => { const x = DATA.GROUPS.find(n => n.toLowerCase() === String(v || '').toLowerCase()); if (!x) throw new Error(`Cannot find an object with identity: '${v || ''}'. Groups: ${DATA.GROUPS.join(', ')}.`); return x; };
  const idOf = p => p.named.identity || p.named.mailbox || p.pos[0];
  const filterValue = f => String(f || '').match(/'([^']*)'|"([^"]*)"/)?.slice(1).find(Boolean) || '';

  const curHost = () => (g.session ? W().hosts[g.session.host] : null);
  function camByName(name) {
    for (const h of Object.values(W().hosts)) {
      if (h.type !== 'nvr') continue;
      const c = h.cams.find(c => c.id.toLowerCase() === name);
      if (c) return c;
    }
    return null;
  }
  function resolveName(name) {
    const h = curHost();
    name = name.toLowerCase();
    if (name === 'portal.' + D) return h && h.dnsStale ? '10.12.0.99' : '10.12.0.20';
    if (name === 'mail.' + D) return '10.12.0.25';
    if (name === 'fs01.' + D || name === 'fs01') return '10.12.0.30';
    if (name === 'google.com') return '142.250.4.100';
    if (name === 'images.photostock-eu.com') return '185.42.18.77';
    if (name === 'vpn.xyz100.com.my') return '203.82.14.10';
    if (name === 'portal.majujaya-supplies.com.my') return '103.18.44.21';
    const cam = camByName(name.replace('.' + D, ''));
    if (cam) return cam.ip;
    if (name === 'nvr-l12' || name === 'nvr-l12.' + D) return '10.12.20.10';
    if (/^\d+\.\d+\.\d+\.\d+$/.test(name)) return name;
    return null;
  }

  /* ---------- admin cmdlets ---------- */
  const ADMIN = {
    /* Active Directory */
    'get-aduser'(p) {
      if (p.named.filter) {
        const f = (filterValue(p.named.filter) || String(p.named.filter)).toLowerCase().replace(/[*'"{}]/g, '').trim();
        const rows = Object.entries(W().users).filter(([k, u]) => !f || (k + ' ' + u.name + ' ' + u.empId).toLowerCase().includes(f));
        termPrint([pad('SamAccountName', 11) + ' ' + pad('Name', 27) + ' ' + pad('EmployeeID', 10) + ' Enabled LockedOut', '-'.repeat(68),
          ...rows.map(([k, u]) => pad(k, 11) + ' ' + pad(u.name, 27) + ' ' + pad(u.empId, 10) + ' ' + pad(TF(u.enabled), 7) + ' ' + TF(u.locked))]);
        return;
      }
      const k = needUser(idOf(p)), u = W().users[k];
      termPrint([
        `DistinguishedName : CN=${u.name},OU=${u.dept},DC=${D.split('.')[0]},DC=local`,
        `Name              : ${u.name}`, `SamAccountName    : ${k}`, `EmployeeID        : ${u.empId}`,
        `Title             : ${u.title}`, `Department        : ${u.dept}`,
        `Enabled           : ${TF(u.enabled)}`, `LockedOut         : ${TF(u.locked)}`,
        `PasswordExpired   : ${TF(u.pwdExpired)}`, `MFA               : ${u.mfa}`
      ]);
    },
    'unlock-adaccount': p => ps(ops.unlock(needUser(idOf(p)))),
    'enable-adaccount': p => ps(ops.setEnabled(needUser(idOf(p)), true)),
    'disable-adaccount': p => ps(ops.setEnabled(needUser(idOf(p)), false)),
    'set-adaccountpassword'(p) {
      if (!p.named.reset) throw new Error('Use -Reset to reset a password (without it, the old password is required).');
      if (!p.named.newpassword || p.named.newpassword === true) throw new Error('Missing -NewPassword. Example: -NewPassword (ConvertTo-SecureString "Temp-Pass-12!" -AsPlainText -Force)');
      const pw = String(p.named.newpassword).match(/"([^"]+)"|'([^']+)'/)?.slice(1).find(Boolean) || 'the new password';
      ps(ops.resetPwd(needUser(idOf(p)), false, pw));
      termPrint(['Tip: run Set-ADUser <user> -ChangePasswordAtLogon $true so only the user knows the final password.'], 'muted');
    },
    'set-aduser'(p) {
      if (!('changepasswordatlogon' in p.named)) throw new Error('Supported here: Set-ADUser <user> -ChangePasswordAtLogon $true');
      ps(ops.setChangeAtLogon(needUser(idOf(p)), isTrue(p.named.changepasswordatlogon)));
    },
    'get-adprincipalgroupmembership'(p) {
      const k = needUser(idOf(p));
      termPrint(['name', '----', ...(W().users[k].groups.length ? W().users[k].groups : ['(none)'])]);
    },
    'add-adgroupmember': p => ps(ops.addGroup(needUser(p.named.members || p.pos[1]), needGroup(p.named.identity || p.pos[0]))),
    'remove-adgroupmember': p => ps(ops.removeGroup(needUser(p.named.members || p.pos[1]), needGroup(p.named.identity || p.pos[0]))),
    'reset-mfa': p => ps(ops.resetMfa(needUser(idOf(p)))),

    /* Exchange Online */
    'get-mailbox'(p) {
      const k = needUser(idOf(p)), b = W().mail.boxes[k];
      termPrint([
        `Name                  : ${g.uname(k)}`, `PrimarySmtpAddress    : ${mailAddr(k)}`,
        `Licensed              : ${TF(b.licensed)}`, `ArchiveStatus         : ${b.archive ? 'Active' : 'None'}`,
        `ForwardingSmtpAddress : ${b.forward || ''}`, `AutoReplyState        : ${b.autoReply ? 'Enabled' : 'Disabled'}`
      ], b.forward ? 'warn' : '');
    },
    'get-mailboxstatistics'(p) {
      const k = needUser(idOf(p)), b = W().mail.boxes[k];
      if (!b.licensed) throw new Error(`${g.uname(k)} has no mailbox.`);
      termPrint([`DisplayName   : ${g.uname(k)}`, `TotalItemSize : ${b.size.toFixed(1)} GB`, `Quota         : ${b.quota} GB (${Math.round(b.size / b.quota * 100)}% used)`], b.size / b.quota >= .9 ? 'warn' : '');
    },
    'enable-mailbox'(p) {
      if (!p.named.archive) throw new Error('Use -Archive to enable the online archive.');
      ps(ops.archive(needUser(idOf(p))));
    },
    'get-mgsubscribedsku'() {
      const free = W().mail.licencesFree;
      termPrint([pad('SkuPartNumber', 14) + ' ' + pad('SkuId', 37) + ' Prepaid Consumed', '-'.repeat(68),
        pad(SKU.part, 14) + ' ' + pad(SKU.id, 37) + ' ' + pad(SKU.prepaid, 7) + ' ' + (SKU.prepaid - free),
        `(${SKU.name}: ${free} free)`]);
    },
    'set-mguserlicense'(p) {
      const k = needUser(p.named.userid || p.pos[0]);
      const add = String(p.named.addlicenses || '');
      if (!add || add === 'true') throw new Error('Missing -AddLicenses. Example: -AddLicenses @{SkuId = "<SkuId from Get-MgSubscribedSku>"} -RemoveLicenses @()');
      if (!add.toLowerCase().includes(SKU.id)) throw new Error('License assignment failed: unknown SkuId. Run Get-MgSubscribedSku to see the SkuId.');
      ps(ops.licence(k));
    },
    'get-inboxrule'(p) {
      const k = needUser(p.named.mailbox || p.pos[0]), rules = W().mail.boxes[k].rules;
      termPrint(rules.length ? [pad('Name', 10) + ' Description', '-'.repeat(60), ...rules.map(r => pad(`"${r.name}"`, 10) + ` If ${r.cond}, ${r.action}`)] : ['(no inbox rules)'], rules.length ? 'warn' : '');
    },
    'remove-inboxrule': p => ps(ops.ruleRemove(needUser(p.named.mailbox || p.pos[0]), String(p.named.identity || p.pos[1] || ''))),
    'set-mailbox'(p) {
      const k = needUser(idOf(p));
      if ('forwardingsmtpaddress' in p.named) {
        if (String(p.named.forwardingsmtpaddress).toLowerCase() !== '$null') throw new Error('In this simulator forwarding can only be cleared: -ForwardingSmtpAddress $null');
        return ps(ops.forwardOff(k));
      }
      throw new Error('Supported here: Set-Mailbox <user> -ForwardingSmtpAddress $null');
    },
    'set-mailboxautoreplyconfiguration'(p) {
      const k = needUser(idOf(p)), state = String(p.named.autoreplystate || '').toLowerCase();
      if (state === 'enabled') return ps(ops.autoReply(k, String(p.named.internalmessage || p.named.externalmessage || 'Out of office.')));
      if (state === 'disabled') return ps(ops.autoReply(k, null));
      throw new Error('Use -AutoReplyState Enabled -InternalMessage "..."  or  -AutoReplyState Disabled');
    },
    'get-mailboxfolderpermission'(p) {
      const k = needUser(idOf(p)), cal = W().mail.boxes[k].cal;
      termPrint([pad('User', 28) + ' AccessRights', '-'.repeat(42), pad('Owner', 28) + ' Owner', ...cal.map(c => pad(g.uname(c.u), 28) + ' ' + c.role)]);
    },
    'add-mailboxfolderpermission'(p) {
      const role = String(p.named.accessrights || '');
      ps(ops.calAdd(needUser(idOf(p)), needUser(p.named.user), role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()));
    },
    'remove-mailboxfolderpermission': p => ps(ops.calRemove(needUser(idOf(p)), needUser(p.named.user))),
    'get-mailboxpermission'(p) {
      const box = needShared(idOf(p)), s = W().mail.shared[box];
      termPrint([pad('User', 28) + ' AccessRights', '-'.repeat(42), ...s.full.map(k => pad(g.uname(k), 28) + ' FullAccess'), ...s.sendAs.map(k => pad(g.uname(k), 28) + ' SendAs')]);
    },
    'add-mailboxpermission'(p) {
      if (String(p.named.accessrights || '').toLowerCase() !== 'fullaccess') throw new Error('Use -AccessRights FullAccess (Send As is Add-RecipientPermission).');
      ps(ops.sharedAdd(needShared(idOf(p)), needUser(p.named.user), 'Full Access'));
    },
    'remove-mailboxpermission': p => ps(ops.sharedRemove(needShared(idOf(p)), needUser(p.named.user), 'Full Access')),
    'add-recipientpermission'(p) {
      if (String(p.named.accessrights || '').toLowerCase() !== 'sendas') throw new Error('Use -AccessRights SendAs.');
      ps(ops.sharedAdd(needShared(idOf(p)), needUser(p.named.trustee), 'Send As'));
    },
    'remove-recipientpermission': p => ps(ops.sharedRemove(needShared(idOf(p)), needUser(p.named.trustee), 'Send As')),
    'get-distributiongroupmember'(p) {
      const l = needList(idOf(p)), d = W().mail.dls[l];
      termPrint(d.dynamic ? ['(dynamic list: every enabled staff account)'] : ['Name', '----', ...(d.members.length ? d.members.map(g.uname) : ['(no members)'])]);
    },
    'add-distributiongroupmember': p => ps(ops.dlAdd(needList(idOf(p)), needUser(p.named.member || p.pos[1]))),
    'remove-distributiongroupmember': p => ps(ops.dlRemove(needList(idOf(p)), needUser(p.named.member || p.pos[1]))),
    'get-messagetracev2'(p) {
      const sender = p.named.senderaddress, recip = p.named.recipientaddress;
      if (!sender && !recip) throw new Error('Use -SenderAddress <address> or -RecipientAddress <address>.');
      const side = (x, v) => { const k = findUser(v); return k ? x === k : mailAddr(x).toLowerCase().includes(String(v).toLowerCase()); };
      const res = ops.trace(sender || recip).filter(e => (!sender || side(e.from, sender)) && (!recip || side(e.to, recip)));
      if (!res.length) { termPrint(['(no messages found in the last 10 days)']); return; }
      res.forEach(e => {
        termPrint([`${pad(e.time, 15)} ${pad(e.status, 11)} ${e.subject}`, `    ${mailAddr(e.from)} -> ${mailAddr(e.to)}`], e.status === 'Delivered' ? '' : 'warn');
        termPrint([`    ${e.detail}`], 'muted');
      });
      g.act('trace', `Ran a message trace for ${sender || recip}`);
    },
    'get-quarantinemessage'(p) {
      const Q = W().mail.quarantine;
      if (p.named.identity) {
        const q = Q.find(x => x.id === p.named.identity); if (!q) throw new Error(`No quarantined message with identity ${p.named.identity}.`);
        termPrint([`Identity  : ${q.id}`, `Subject   : ${q.subject}`, `Sender    : ${q.from}`, `Recipient : ${mailAddr(q.to)}`, `Type      : ${q.reason}`, `State     : ${q.state}`, `Details   : ${q.detail}`]);
        return;
      }
      const held = Q.filter(q => q.state === 'held');
      termPrint(held.length ? [pad('Identity', 11) + ' ' + pad('Type', 26) + ' Subject', '-'.repeat(70), ...held.map(q => pad(q.id, 11) + ' ' + pad(q.reason, 26) + ' ' + q.subject)] : ['(quarantine is empty)']);
    },
    'release-quarantinemessage'(p) {
      if (!p.named.releasetoall && !p.named.user) throw new Error('Specify -ReleaseToAll (or -User <recipient>) to say who receives the message.');
      ps(ops.qRelease(String(p.named.identity || p.pos[0] || '')));
    },
    'delete-quarantinemessage': p => ps(ops.qDelete(String(p.named.identity || p.pos[0] || ''))),

    /* Microsoft Graph / Intune */
    'get-mgdevicemanagementmanageddevice'(p) {
      const want = filterValue(p.named.filter).toUpperCase();
      const list = Object.values(W().devices).filter(d => !want || d.name === want);
      if (want && !list.length) throw new Error(`No managed device named '${want}'.`);
      if (want) {
        const d = list[0], iss = deviceIssues(d);
        termPrint([`DeviceName        : ${d.name}`, `UserPrincipalName : ${d.owner ? mailAddr(d.owner) : ''}`, `Model             : ${d.model}`,
          `ManagedDeviceOwnerType : ${d.ownership === 'Personal' ? 'personal' : 'company'}`, `OperatingSystem   : ${d.os}`,
          `ComplianceState   : ${iss.length ? 'noncompliant (' + iss.join(', ') + ')' : 'compliant'}`, `IsEncrypted       : ${TF(d.encrypted)}`,
          `AzureAdDeviceId   : ${d.deviceId || ''}`, `LastSyncDateTime  : ${d.lastSync}`], iss.length ? 'warn' : '');
        return;
      }
      termPrint([pad('DeviceName', 13) + ' ' + pad('User', 24) + ' ' + pad('Type', 8) + ' Compliance', '-'.repeat(58),
        ...list.map(d => pad(d.name, 13) + ' ' + pad(d.owner ? g.uname(d.owner) : '(unassigned)', 24) + ' ' + pad(d.type, 8) + ' ' + (deviceIssues(d).length ? 'noncompliant' : 'compliant'))]);
    },
    'get-mginformationprotectionbitlockerrecoverykey'(p) {
      const keyed = Object.values(W().devices).filter(d => d.keyId);
      const id = p.named.bitlockerrecoverykeyid;
      if (!id) {
        termPrint([pad('Id', 37) + ' DeviceId', '-'.repeat(75), ...keyed.map(d => pad(d.keyId, 37) + ' ' + d.deviceId)]);
        termPrint(['Match the first 8 characters of the Id with the key ID on the user\'s screen.'], 'muted');
        return;
      }
      const d = keyed.find(x => x.keyId.toLowerCase() === String(id).toLowerCase());
      if (!d) throw new Error(`Recovery key '${id}' not found. Use the full Id from the list (the screen only shows the first 8 characters).`);
      if (String(p.named.property || '').toLowerCase() !== 'key') {
        termPrint([`Id       : ${d.keyId}`, `DeviceId : ${d.deviceId}`, 'Key      :', 'Add -Property key to read the recovery key (this is audited).'], 'muted');
        return;
      }
      ps(ops.devRevealKey(d.name));
    }
  };
  ADMIN['test-netconnection'] = p => {
    const name = String(p.named.computername || p.pos[0] || '').toLowerCase();
    const portNo = parseInt(p.named.port, 10);
    if (!name) throw new Error('Usage: Test-NetConnection <host> -Port <number>');
    const ip = resolveName(name);
    if (!ip) throw new Error(`Name resolution of ${name} failed.`);
    const ok = !portNo || [80, 443].includes(portNo) || (portNo === 3389 && ip.startsWith('10.'));
    termPrint([`ComputerName     : ${name}`, `RemoteAddress    : ${ip}`, ...(portNo ? [`RemotePort       : ${portNo}`, `TcpTestSucceeded : ${TF(ok)}`] : ['PingSucceeded    : True'])], ok ? '' : 'warn');
  };
  const needRoom = v => { const r = Object.keys(W().apps.rooms).find(x => x.toLowerCase() === String(v || '').toLowerCase().split('@')[0]); if (!r) throw new Error(`Couldn't find room mailbox '${v || ''}' (rooms: ${Object.keys(W().apps.rooms).join(', ')}).`); return r; };
  const needTeam = v => { const t = Object.keys(W().apps.teams).find(x => x.toLowerCase() === String(v || '').toLowerCase()); if (!t) throw new Error(`Team '${v || ''}' not found (teams: ${Object.keys(W().apps.teams).join(', ')}).`); return t; };
  ADMIN['get-calendarprocessing'] = p => {
    const r = needRoom(idOf(p)), x = W().apps.rooms[r];
    termPrint([`Identity           : ${r}`, `AutomateProcessing : ${x.autoAccept ? 'AutoAccept' : 'AutoUpdate'}`, `AllowConflicts     : ${TF(x.allowConflicts)}`, `BookingWindowInDays: 180`], !x.autoAccept || x.allowConflicts ? 'warn' : '');
  };
  ADMIN['set-calendarprocessing'] = p => {
    const r = needRoom(idOf(p)), x = W().apps.rooms[r];
    const ap = p.named.automateprocessing ? String(p.named.automateprocessing).toLowerCase() : null;
    if (ap && !['autoaccept', 'autoupdate', 'none'].includes(ap)) throw new Error('-AutomateProcessing must be AutoAccept, AutoUpdate or None.');
    const auto = ap ? ap === 'autoaccept' : x.autoAccept;
    const conflicts = 'allowconflicts' in p.named ? isTrue(p.named.allowconflicts) : x.allowConflicts;
    ps(ops.roomSet(r, auto, conflicts));
  };
  ADMIN['get-teamuser'] = p => {
    const t = needTeam(p.named.groupid || p.pos[0]), x = W().apps.teams[t];
    termPrint([pad('User', 26) + ' Role', '-'.repeat(36), ...x.owners.map(k => pad(W().users[k] ? g.uname(k) : k, 26) + ' Owner'), ...x.members.filter(k => !x.owners.includes(k)).map(k => pad(g.uname(k), 26) + ' Member')]);
  };
  ADMIN['add-teamuser'] = p => {
    const t = needTeam(p.named.groupid || p.pos[0]), k = needUser(p.named.user);
    if (String(p.named.role || 'member').toLowerCase() !== 'owner') {
      const x = W().apps.teams[t];
      if (!x.members.includes(k)) x.members.push(k);
      g.act('teamMember', `Added ${k} to the ${t} team`, { user: k });
      termPrint([`${g.uname(k)} added to ${t} as Member.`], 'ok');
      return;
    }
    ps(ops.teamOwnerAdd(t, k));
  };
  ADMIN['get-messagetrace'] = ADMIN['get-messagetracev2']; // legacy name

  async function runAdmin(cmd, line) {
    await sleep(250);
    try { await ADMIN[cmd](parseArgs(line)); }
    catch (e) { termPrint([`${line.split(/\s+/)[0]} : ${e.message}`], 'bad'); }
  }

  /* ---------- Windows commands ---------- */
  async function run(raw) {
    const line = raw.trim();
    termPrint([prompt() + ' ' + line], 'cmd');
    if (!line) return;
    term.hist.push(line); term.hi = term.hist.length;
    const [c0, ...args] = line.split(/\s+/);
    const c = c0.toLowerCase(), a = args.join(' ').toLowerCase();
    const h = curHost();
    const where = g.session ? g.session.host : LOCAL;
    const user = h ? h.owner : null;

    if (c === 'help' && ADMIN_HELP[a]) { termPrint(ADMIN_HELP[a], 'muted'); return; }
    if (Object.prototype.hasOwnProperty.call(ADMIN, c)) { await runAdmin(c, line); return; }

    switch (c) {
      case 'help':
        termPrint([
          'connect <host>        open a remote session',
          'disconnect            close the session',
          'hostname | whoami     identify the machine/user',
          'ipconfig [/all]       show IP configuration',
          'ipconfig /release     release DHCP lease',
          'ipconfig /renew       renew DHCP lease',
          'ipconfig /displaydns  show DNS cache',
          'ipconfig /flushdns    clear DNS cache',
          'ping <host>           test connectivity',
          'nslookup <name>       query the DNS server',
          'net stop|start spooler  control Print Spooler',
          'sc query spooler      service status',
          'systeminfo            OS & disk info',
          'gpupdate /force       refresh group policy',
          'w32tm /query /status | w32tm /resync   Windows Time',
          'tracert <host>        show each hop to a host',
          'arp -a                show IP-to-MAC table (find IP conflicts)',
          'Test-NetConnection <host> -Port <n>   test a TCP port',
          'cls                   clear screen',
          '',
          'help ad               Active Directory commands',
          'help mail             Exchange Online & licence commands',
          'help devices          Intune & BitLocker commands',
          'help apps             meeting rooms & Teams commands'
        ], 'muted'); break;
      case 'cls': case 'clear': termClear(); break;
      case 'connect':
        if (!args[0]) termPrint(['Usage: connect <hostname>'], 'warn');
        else { termPrint(['Connecting…'], 'muted'); await sleep(700); if (!ops.connect(args[0])) termPrint([`Host ${args[0]} not found.`], 'bad'); }
        break;
      case 'disconnect': case 'exit':
        if (g.session) ops.disconnect(); else termPrint(['No active session.'], 'muted');
        break;
      case 'hostname': termPrint([where]); break;
      case 'whoami': termPrint([`${D.split('.')[0]}\\${user || 'helpdesk'}`]); break;
      case 'ipconfig': {
        if (a === '/release') {
          if (!h) { termPrint(["That would release the help desk PC's own lease. Connect to a user host first."], 'warn'); break; }
          await termSlow(['Releasing DHCP lease…'], 'muted', 600);
          h.released = true;
          g.act('release', `ipconfig /release on ${where}`, { user });
          termPrint(['Ethernet adapter Ethernet: IPv4 address released.']);
        } else if (a === '/renew') {
          if (!h) { termPrint(['Renewed lease for HELPDESK-01 (10.12.1.50).']); break; }
          await termSlow(['Contacting DHCP server…', 'Waiting for offer…'], 'muted', 700);
          if (h.conflict) {
            g.act('renew', `ipconfig /renew on ${where}`, { user });
            if (!W().net.dhcp.exclusions.includes(h.ip)) { termPrint([`DHCP offered ${h.ip} again.`, 'Windows has detected an IP address conflict (the other device still uses this address).'], 'bad'); break; }
            h.conflict = false; h.ip = '10.12.7.88';
            termPrint([`IPv4 Address. . . . : ${h.ip}`, 'Subnet Mask . . . . : 255.255.255.0', 'Default Gateway . . : 10.12.7.1', 'No conflict detected.'], 'ok');
            break;
          }
          h.apipa = false; h.released = false;
          if (g.session) g.session.guided = false;
          g.act('renew', `ipconfig /renew on ${where}`, { user });
          termPrint([`IPv4 Address. . . . : ${h.ip}`, 'Subnet Mask . . . . : 255.255.255.0', `Default Gateway . . : ${h.ip.replace(/\.\d+$/, '.1')}`], 'ok');
        } else if (a === '/flushdns') {
          if (h) { h.dnsStale = false; g.act('flushdns', `ipconfig /flushdns on ${where}`, { user }); }
          termPrint(['Successfully flushed the DNS Resolver Cache.'], 'ok');
        } else if (a === '/displaydns') {
          termPrint(['Windows IP Configuration', '', `    portal.${D}`, '    ----------------------------------------',
            '    Record Type . . . : 1', '    Time To Live  . . : 81244',
            `    A (Host) Record . : ${h && h.dnsStale ? '10.12.0.99' : '10.12.0.20'}`, '',
            `    mail.${D}`, '    A (Host) Record . : 10.12.0.25']);
        } else {
          const ip = h ? (h.released ? '0.0.0.0' : h.apipa ? '169.254.88.12' : h.ip) : '10.12.1.50';
          const gw = h && (h.apipa || h.released) ? '' : ip.replace(/\.\d+$/, '.1');
          termPrint(['Windows IP Configuration', '', 'Ethernet adapter Ethernet:', `   IPv4 Address. . . . . . . : ${ip}${h && h.conflict ? '(Duplicate)' : ''}`,
            `   Subnet Mask . . . . . . . : ${h && h.apipa ? '255.255.0.0' : '255.255.255.0'}`, `   Default Gateway . . . . . : ${gw}`,
            ...(a === '/all' ? ['   DHCP Enabled. . . . . . . : Yes', '   DNS Servers . . . . . . . : 10.12.0.53', `   Host Name . . . . . . . . : ${where}`] : [])], h && h.apipa ? 'warn' : '');
        }
        break;
      }
      case 'ping': {
        if (!args[0]) { termPrint(['Usage: ping <host>'], 'warn'); break; }
        const name = args[0].toLowerCase(), ip = resolveName(name);
        if (h && (h.apipa || h.released)) { await termSlow(Array(3).fill('PING: transmit failed. General failure.'), 'bad'); break; }
        if (!ip) { termPrint([`Ping request could not find host ${name}. Please check the name and try again.`], 'bad'); break; }
        const cam = camByName(name.replace('.' + D, ''));
        const down = (name.startsWith('mail') && W().outage) || ip === '10.12.0.99' || (cam && cam.status !== 'Online');
        termPrint([`Pinging ${name} [${ip}] with 32 bytes of data:`]);
        for (let i = 0; i < 4; i++) {
          await sleep(450);
          termPrint([down ? 'Request timed out.' : `Reply from ${ip}: bytes=32 time=${Math.floor(rand(1, ip.startsWith('10.') ? 4 : 18))}ms TTL=${ip.startsWith('10.') ? 128 : 117}`], down ? 'bad' : '');
        }
        termPrint([`Packets: Sent = 4, Received = ${down ? 0 : 4}, Lost = ${down ? '4 (100% loss)' : '0 (0% loss)'}`], down ? 'bad' : 'ok');
        break;
      }
      case 'nslookup': {
        if (!args[0]) { termPrint(['Usage: nslookup <name>'], 'warn'); break; }
        const name = args[0].toLowerCase();
        let ip = resolveName(name);
        if (name.startsWith('portal')) ip = '10.12.0.20'; // the DNS server always has the current record
        await sleep(400);
        termPrint([`Server:  dc01.${D}`, 'Address:  10.12.0.53', '']);
        termPrint(ip ? [`Name:    ${name}`, `Address:  ${ip}`] : [`*** dc01.${D} can't find ${name}: Non-existent domain`], ip ? '' : 'bad');
        break;
      }
      case 'net': {
        const [verb, svc] = args.map(x => x.toLowerCase());
        if (svc !== 'spooler' || !['stop', 'start'].includes(verb)) { termPrint(['Usage: net stop spooler | net start spooler'], 'warn'); break; }
        if (!h) { termPrint(["Connect to the user's computer first."], 'warn'); break; }
        if (verb === 'stop') {
          await termSlow(['The Print Spooler service is stopping.', 'The Print Spooler service was stopped successfully.'], '', 600);
          h.spooler = 'Stopped'; h.queue = 0;
          g.act('spoolerStop', `net stop spooler on ${where}`, { user });
        } else {
          await termSlow(h.spooler === 'Stuck' ? ['The Print Spooler service is starting.'] : ['The Print Spooler service is starting.', 'The Print Spooler service was started successfully.'], 'ok', 600);
          g.act('spoolerStart', `net start spooler on ${where}`, { user });
          if (h.spooler === 'Stuck') termPrint(['System error 1056: An instance of the service is already running (hung). Stop it first.'], 'warn');
          else h.spooler = 'Running';
        }
        break;
      }
      case 'sc':
        termPrint(h ? ['SERVICE_NAME: Spooler', `        STATE              : ${h.spooler === 'Running' ? '4  RUNNING' : h.spooler === 'Stopped' ? '1  STOPPED' : '4  RUNNING (NOT RESPONDING)'}`, `        JOBS IN QUEUE      : ${h.queue}`]
          : ['SERVICE_NAME: Spooler', '        STATE              : 4  RUNNING']);
        break;
      case 'systeminfo':
        await termSlow(['Loading…'], 'muted', 500);
        termPrint([`Host Name:      ${where}`, `OS Name:        ${h ? h.os : 'Windows 11 Enterprise'}`, `Domain:         ${D}`, 'Time Zone:      (UTC+08:00) Kuala Lumpur, Singapore', `Disk C: used:   ${h ? h.disk : 41}%`]);
        break;
      case 'gpupdate':
        await termSlow(['Updating policy…', '', 'Computer Policy update has completed successfully.', 'User Policy update has completed successfully.'], '', 500);
        if (h) g.act('gpupdate', `gpupdate /force on ${where}`, { user });
        break;
      case 'shutdown':
        termPrint([h ? 'Use the Restart PC button in Remote.' : 'That would restart your own PC. Connect to a user host first.'], h ? 'muted' : 'warn');
        break;
      case 'w32tm': {
        const skew = h ? (h.clockSkew || 0) : 0;
        if (a === '/resync' || a === '/resync /force') {
          await termSlow(['Sending resync command to local computer...'], 'muted', 700);
          if (h && skew) { h.clockSkew = 0; g.act('timesync', `Resynced the clock on ${where} (was ${skew} min off)`, { user }); }
          termPrint(['The command completed successfully.'], 'ok');
        } else if (a.startsWith('/query')) {
          termPrint([`Source: dc01.${D}`, `Last Successful Sync Time: ${skew ? '3 days ago' : 'a few minutes ago'}`, `Phase Offset: ${skew ? '-' + skew * 60 + '.0000000s' : '0.0004215s'}`], skew ? 'warn' : '');
        } else termPrint(['Usage: w32tm /query /status   |   w32tm /resync'], 'warn');
        break;
      }
      case 'arp': {
        if (a !== '-a') { termPrint(['Usage: arp -a'], 'warn'); break; }
        const me = h ? h.ip : '10.12.1.50', gw = me.replace(/\.\d+$/, '.1');
        const rows = [`Interface: ${me} --- 0x9`, '  Internet Address      Physical Address      Type',
          `  ${pad(gw, 21)} 00-1b-17-00-01-01     dynamic`, `  ${pad('10.12.0.53', 21)} 00-15-5d-0a-35-01     dynamic`];
        if (h && h.conflict) rows.push(`  ${pad(h.ip, 21)} 24-0a-c4-11-3e-5d     dynamic   <- also answers for this PC's own IP (Espressif IoT board)`);
        termPrint(rows, h && h.conflict ? 'warn' : '');
        break;
      }
      case 'tracert': {
        if (!args[0]) { termPrint(['Usage: tracert <host>'], 'warn'); break; }
        const name = args[0].toLowerCase(), ip = resolveName(name);
        if (!ip) { termPrint([`Unable to resolve target system name ${name}.`], 'bad'); break; }
        termPrint([`Tracing route to ${name} [${ip}] over a maximum of 30 hops:`, '']);
        const far = name === 'images.photostock-eu.com';
        const hops = ip.startsWith('10.')
          ? [['1 ms', '10.12.1.1 (core switch)'], ['1 ms', ip]]
          : [['1 ms', '10.12.1.1 (core switch)'], ['2 ms', '10.12.0.1 (FW-HQ-01)'], ['5 ms', 'isp-gw.kl.example.net.my'], ['7 ms', 'myix-kl.example.net.my'],
            ...(far ? [['14 ms', 'sg-ix.example.net'], ['186 ms', 'fra-ix.example.net (Frankfurt)'], ['*', 'Request timed out.'], ['241 ms', ip]] : [['9 ms', ip]])];
        for (const [i, [ms, host]] of hops.entries()) {
          await sleep(far && i > 4 ? 700 : 350);
          termPrint([`  ${String(i + 1).padStart(2)}  ${pad(ms, 7)} ${host}`], parseInt(ms, 10) > 100 ? 'warn' : '');
        }
        termPrint(['', 'Trace complete.']);
        if (!W().net.traced.includes(name)) W().net.traced.push(name);
        g.act('tracert', `tracert ${name}`);
        break;
      }
      default: termPrint([`'${c0}' is not recognized as an internal or external command. Type "help".`], 'bad');
    }
  }

  function prompt() {
    return (g.session ? g.session.host + (g.session.guided ? '(guided)' : '') : LOCAL) + '>';
  }

  return { run, prompt };
}
