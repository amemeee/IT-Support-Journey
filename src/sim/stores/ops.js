/* =========================================================
   Admin actions. Every change made from the Directory, Mail,
   Devices or Remote panels, or typed in the Terminal, goes
   through here, so buttons and commands are logged and graded
   the same way. Each action returns { ok, msg }.
   ========================================================= */
import * as DATA from '../../data/index.js';
import { useGame } from './game.js';
import { toast, beep } from '../lib/fx.js';
import { rand, sleep } from '../lib/util.js';
import { termPrint } from '../lib/termout.js';

export const NET_DOMAIN = DATA.COMPANY.domain;          // xyz100.local
export const mailAddr = x => (String(x).includes('@') ? x : `${x}@${DATA.MAIL_DOMAIN}`);
export const deviceIssues = DATA.deviceIssues;
export { BAD_NAME } from '../../data/apps.js';
import { BAD_NAME } from '../../data/apps.js';

// the one licence SKU this tenant buys (a made-up SkuId)
export const SKU = { part: 'SPB', name: 'Microsoft 365 Business Premium', id: 'f30db892-07e9-47e9-837c-80727f46fd3d', prepaid: 140 };

const fail = msg => ({ ok: false, msg });
const okr = msg => ({ ok: true, msg });

export const tempPassword = () => ['Kopi', 'Durian', 'Rambutan', 'Nasi', 'Cendol', 'Mangga'][Math.floor(Math.random() * 6)] + '-' +
  ['Harimau', 'Gajah', 'Helang', 'Rusa'][Math.floor(Math.random() * 4)] + '-' + Math.floor(rand(10, 99)) + '!';

export function useOps() {
  const g = useGame();
  const W = () => g.world;
  const act = g.act;
  const uname = g.uname;

  // shows a progress bar in the Remote panel while a remote action runs
  async function withProgress(label, ms) {
    g.ui.progress = { label, ms };
    await sleep(ms + 100);
    g.ui.progress = null;
  }

  return {
    /* ---------- directory ---------- */
    unlock(k) {
      const u = W().users[k];
      if (!u.locked) return fail(`${u.name}'s account is not locked out.`);
      u.locked = false;
      act('unlock', `Unlocked account ${k}`, { user: k });
      return okr(`Unlocked ${u.name}'s account.`);
    },
    setEnabled(k, on) {
      const u = W().users[k];
      if (u.enabled === on) return fail(`${u.name}'s account is already ${on ? 'enabled' : 'disabled'}.`);
      u.enabled = on;
      act(on ? 'enable' : 'disable', `${on ? 'Enabled' : 'Disabled'} account ${k}`, {
        user: k, harmful: on ? null : { key: 'disabled-' + k, label: `Disabled ${u.name}'s active account`, pts: -50 }
      });
      return okr(`${on ? 'Enabled' : 'Disabled'} ${u.name}'s account.`);
    },
    // mustChange is graded when the ticket closes, so a terminal reset can be
    // followed by Set-ADUser -ChangePasswordAtLogon $true, like in real life
    resetPwd(k, mustChange = true, pw = tempPassword()) {
      const u = W().users[k];
      u.pwdExpired = false; u.locked = false; u.pwdReset = true; u.mustChange = mustChange;
      act('resetPwd', `Reset password for ${k}${mustChange ? ' (must change at next sign-in)' : ''}`, { user: k, sensitive: true });
      return okr(`Password reset for ${u.name}. Temporary password: ${pw}${mustChange ? ' (must change at next sign-in)' : ''}`);
    },
    setChangeAtLogon(k, on) {
      const u = W().users[k];
      u.mustChange = on;
      act('changeAtLogon', `Set ChangePasswordAtLogon=${on} for ${k}`, { user: k });
      return okr(`${u.name} ${on ? 'must' : 'does not need to'} change their password at next sign-in.`);
    },
    resetMfa(k) {
      const u = W().users[k];
      u.mfa = 'Pending re-registration'; u.mfaReset = true;
      act('resetMfa', `Required MFA re-registration for ${k}`, { user: k, sensitive: true });
      return okr(`MFA reset for ${u.name}. They will register a new device at next sign-in.`);
    },
    addGroup(k, grp) {
      const u = W().users[k];
      if (!DATA.GROUPS.includes(grp)) return fail(`Group "${grp}" not found.`);
      if (u.groups.includes(grp)) return fail(`${u.name} is already in ${grp}.`);
      u.groups.push(grp);
      act('addGroup', `Added ${k} to ${grp}`, {
        user: k, harmful: grp === 'Domain Admins' ? { key: 'da-' + k, label: 'Granted Domain Admins — huge security risk!', pts: -200 } : null
      });
      return okr(`Added ${u.name} to ${grp}.`);
    },
    removeGroup(k, grp) {
      const u = W().users[k];
      if (!u.groups.includes(grp)) return fail(`${u.name} is not in ${grp}.`);
      u.groups = u.groups.filter(x => x !== grp);
      act('removeGroup', `Removed ${k} from ${grp}`, { user: k });
      return okr(`Removed ${u.name} from ${grp}.`);
    },

    /* ---------- mail ---------- */
    licence(k) {
      const M = W().mail, b = M.boxes[k];
      if (b.licensed) return fail(`${uname(k)} already has a licence.`);
      if (M.licencesFree < 1) return fail('No licences left. Raise a purchase request.');
      M.licencesFree--; b.licensed = true;
      act('licence', `Assigned a ${SKU.name} licence to ${k}`, { user: k });
      return okr(`Licence assigned to ${uname(k)}. The mailbox is being created.`);
    },
    archive(k) {
      const b = W().mail.boxes[k];
      if (!b.licensed) return fail(`${uname(k)} has no mailbox.`);
      if (b.archive) return fail(`Archive is already enabled for ${uname(k)}.`);
      const before = b.size; b.archive = true; b.size = +(b.size * 0.35).toFixed(1);
      act('archive', `Enabled online archive for ${k} (${before} → ${b.size} GB)`, { user: k });
      return okr(`Online archive enabled for ${uname(k)}. Mailbox ${before} GB → ${b.size} GB.`);
    },
    autoReply(k, text) {
      const b = W().mail.boxes[k];
      b.autoReply = text || null;
      act(text ? 'oooOn' : 'oooOff', `Turned ${text ? 'on' : 'off'} automatic replies for ${k}`, { user: k });
      return okr(`Automatic replies ${text ? 'on' : 'off'} for ${uname(k)}.`);
    },
    forwardOff(k) {
      const b = W().mail.boxes[k];
      if (!b.forward) return fail(`${uname(k)} has no forwarding set.`);
      const f = b.forward; b.forward = null;
      act('fwdRm', `Removed forwarding to ${f} on ${k}`, { user: k });
      return okr(`Removed forwarding to ${f}.`);
    },
    ruleRemove(k, nameOrIndex) {
      const b = W().mail.boxes[k];
      const i = typeof nameOrIndex === 'number' ? nameOrIndex : b.rules.findIndex(r => r.name === nameOrIndex);
      if (i < 0 || !b.rules[i]) return fail(`No inbox rule "${nameOrIndex}" on ${uname(k)}'s mailbox.`);
      const r = b.rules.splice(i, 1)[0];
      act('ruleRm', `Deleted inbox rule "${r.name}" on ${k}`, { user: k });
      return okr(`Deleted inbox rule "${r.name}".`);
    },
    calAdd(owner, k, role) {
      if (owner === k) return fail('That person already owns this calendar.');
      if (!['Reviewer', 'Editor'].includes(role)) return fail('Access rights must be Reviewer or Editor.');
      const b = W().mail.boxes[owner];
      b.cal = b.cal.filter(c => c.u !== k); b.cal.push({ u: k, role });
      act('calAdd', `Gave ${k} ${role} access to ${owner}'s calendar`, { user: owner });
      return okr(`${uname(k)} now has ${role} access to ${uname(owner)}'s calendar.`);
    },
    calRemove(owner, k) {
      const b = W().mail.boxes[owner];
      if (!b.cal.some(c => c.u === k)) return fail(`${uname(k)} has no access to ${uname(owner)}'s calendar.`);
      b.cal = b.cal.filter(c => c.u !== k);
      act('calRm', `Removed ${k} from ${owner}'s calendar`, { user: owner });
      return okr(`Removed ${uname(k)} from ${uname(owner)}'s calendar.`);
    },
    sharedAdd(box, k, perm) {
      const grp = W().mail.shared[box], list = perm === 'Send As' ? grp.sendAs : grp.full;
      if (list.includes(k)) return fail(`${uname(k)} already has ${perm} on ${mailAddr(box)}.`);
      list.push(k);
      act(perm === 'Send As' ? 'sendAsAdd' : 'mbxAdd', `Gave ${k} ${perm} on ${mailAddr(box)}`, { user: k });
      return okr(`${uname(k)} now has ${perm} on ${mailAddr(box)}.`);
    },
    sharedRemove(box, k, perm) {
      const grp = W().mail.shared[box], key = perm === 'Send As' ? 'sendAs' : 'full';
      if (!grp[key].includes(k)) return fail(`${uname(k)} doesn't have ${perm} on ${mailAddr(box)}.`);
      grp[key] = grp[key].filter(x => x !== k);
      act(perm === 'Send As' ? 'sendAsRm' : 'mbxRm', `Removed ${k}'s ${perm} on ${mailAddr(box)}`, { user: k });
      return okr(`Removed ${uname(k)}'s ${perm} on ${mailAddr(box)}.`);
    },
    dlAdd(list, k) {
      const grp = W().mail.dls[list];
      if (grp.dynamic) return fail(`${mailAddr(list)} is dynamic. Membership is automatic.`);
      if (grp.members.includes(k)) return fail(`${uname(k)} is already in ${mailAddr(list)}.`);
      grp.members.push(k);
      act('dlAdd', `Added ${k} to ${mailAddr(list)}`, { user: k });
      return okr(`Added ${uname(k)} to ${mailAddr(list)}.`);
    },
    dlRemove(list, k) {
      const grp = W().mail.dls[list];
      if (!grp.members.includes(k)) return fail(`${uname(k)} is not in ${mailAddr(list)}.`);
      grp.members = grp.members.filter(x => x !== k);
      act('dlRm', `Removed ${k} from ${mailAddr(list)}`, { user: k });
      return okr(`Removed ${uname(k)} from ${mailAddr(list)}.`);
    },
    qRelease(id) {
      const q = W().mail.quarantine.find(x => x.id === id);
      if (!q) return fail(`No quarantined message with id ${id}.`);
      if (q.state !== 'held') return fail(`That message was already ${q.state}.`);
      q.state = 'released';
      act('release', `Released "${q.subject}" to ${q.to}`, {
        harmful: q.malicious ? { key: 'rel-' + q.id, label: 'Released a phishing email to a user', pts: -100 } : null
      });
      return okr(`Released "${q.subject}" to ${mailAddr(q.to)}.`);
    },
    qDelete(id) {
      const q = W().mail.quarantine.find(x => x.id === id);
      if (!q) return fail(`No quarantined message with id ${id}.`);
      if (q.state !== 'held') return fail(`That message was already ${q.state}.`);
      q.state = 'deleted';
      act('qdelete', `Deleted quarantined "${q.subject}"`, {
        harmful: q.malicious ? null : { key: 'qdel-' + q.id, label: 'Deleted a legitimate email from quarantine', pts: -20 }
      });
      return okr(`Deleted "${q.subject}".`);
    },
    // trace entries matching a name or address (no side effects)
    findTrace(query) {
      const q = String(query || '').toLowerCase().trim();
      if (q.length < 2) return [];
      const keys = Object.entries(W().users).filter(([k, u]) => k.includes(q) || u.name.toLowerCase().includes(q)).map(([k]) => k);
      return W().mail.trace.filter(e => [e.from, e.to].some(x => mailAddr(x).toLowerCase().includes(q) || keys.includes(x))).reverse();
    },
    // remember which messages were looked at (some tickets are solved by finding the cause)
    markTraced(entries) {
      entries.forEach(e => { if (!W().traced.includes(e.id)) W().traced.push(e.id); });
    },
    trace(query) {
      const res = this.findTrace(query);
      this.markTraced(res);
      return res;
    },

    /* ---------- devices ---------- */
    devSync(n) {
      const d = W().devices[n];
      if (d.wiped) return fail(`${n} has been wiped and no longer checks in.`);
      d.lastSync = 'Just now';
      act('devSync', `Synced ${n}`, { user: d.owner });
      return okr(`${n} synced. Compliance: ${deviceIssues(d).length ? 'not compliant' : 'compliant'}.`);
    },
    devEncrypt(n) {
      const d = W().devices[n];
      if (d.encrypted) return fail(`${n} is already encrypted.`);
      d.encrypted = true;
      act('encrypt', `Started BitLocker encryption on ${n}`, { user: d.owner });
      return okr(`BitLocker started on ${n}. It encrypts in the background.`);
    },
    devRevealKey(n) {
      const d = W().devices[n];
      if (!d.key) return fail(`${n} has no BitLocker key (not a Windows PC).`);
      d.keyRevealed = true;
      act('revealKey', `Viewed BitLocker recovery key for ${n} (key ID ${d.keyId})`, { user: d.owner, sensitive: true });
      return okr(`Recovery key for ${n} (key ID ${d.keyId.slice(0, 8)}): ${d.key}`);
    },
    devFirewall(n) {
      const d = W().devices[n];
      if (d.firewall) return fail(`The firewall on ${n} is already on.`);
      d.firewall = true;
      act('firewall', `Turned the firewall back on for ${n}`, { user: d.owner });
      return okr(`Firewall turned on for ${n}.`);
    },
    devUpdate(n) {
      const d = W().devices[n];
      if (d.update === 'Up to date') return fail(`${n} is already up to date.`);
      d.update = 'Up to date';
      act('updateRetry', `Cleared the update cache and retried updates on ${n}`, { user: d.owner });
      return okr(`Update cache cleared on ${n}. Updates installed successfully.`);
    },
    devRollback(n) {
      const d = W().devices[n];
      if (!d.driver) return fail(`No recent driver update to roll back on ${n}.`);
      d.driver = null;
      act('rollback', `Rolled back the graphics driver on ${n}`, { user: d.owner });
      return okr(`Rolled back to the previous graphics driver on ${n}.`);
    },
    devUsb(n, allow) {
      const d = W().devices[n];
      const v = allow ? 'Allowed (temporary)' : 'Blocked';
      if (d.usb === v) return fail(`USB storage on ${n} is already ${v.toLowerCase()}.`);
      d.usb = v;
      act(allow ? 'usbAllow' : 'usbBlock', `${allow ? 'Allowed' : 'Blocked'} USB storage on ${n}`, { user: d.owner });
      return okr(`USB storage on ${n}: ${v}.`);
    },
    devLock(n) {
      const d = W().devices[n];
      if (d.locked) return fail(`${n} is already locked.`);
      d.locked = true;
      act('lock', `Remote-locked ${n}`, { user: d.owner });
      return okr(`Lock command sent to ${n}. It locks the next time it's online.`);
    },
    devLost(n) {
      const d = W().devices[n];
      if (d.lost) return fail(`${n} is already marked lost.`);
      d.lost = true;
      act('lost', `Marked ${n} as lost`, { user: d.owner });
      return okr(`${n} marked as lost.`);
    },
    devIsolate(n) {
      const d = W().devices[n];
      if (d.isolated) return fail(`${n} is already isolated.`);
      d.isolated = true;
      act('isolate', `Isolated ${n} from the network`, { user: d.owner });
      return okr(`${n} is cut off from the network. Only the management agent can reach it.`);
    },
    devWipe(n, kind) {
      const d = W().devices[n];
      if (d.wiped) return fail(`${n} was already wiped.`);
      d.wiped = kind;
      const personalFull = kind === 'full' && d.ownership === 'Personal';
      act(kind === 'full' ? 'wipe' : 'selectiveWipe', `${kind === 'full' ? 'Full wipe' : 'Selective wipe (work data only)'} sent to ${n}`, {
        user: d.owner, harmful: personalFull ? { key: 'pwipe-' + n, label: "Fully wiped an employee's personal phone", pts: -80 } : null
      });
      return okr(kind === 'full' ? `Full wipe sent to ${n}. Everything on it will be erased.` : `Work profile and company data removed from ${n}. Personal data untouched.`);
    },
    devAssign(n, k) {
      const d = W().devices[n];
      if (d.owner === k) return fail(`${n} is already assigned to ${uname(k)}.`);
      d.owner = k;
      act('assign', `Assigned ${n} to ${k}`, { user: k });
      return okr(`${n} assigned to ${uname(k)}. Setup can continue after a restart.`);
    },

    /* ---------- network ---------- */
    async apReboot(id) {
      const ap = W().net.aps[id];
      ap.status = 'Rebooting'; ap.clients = 0;
      await withProgress(`Rebooting ${id}…`, 2500);
      // an AP on a floor whose switch is down can't come back by itself
      const floorDown = id.startsWith('AP-L3') && W().net.switches['SW-L3'].status !== 'Online';
      ap.status = floorDown ? 'Unreachable' : 'Online';
      if (!floorDown) ap.clients = Math.round(rand(9, 24));
      act('apReboot', `Rebooted access point ${id}`);
      toast(floorDown ? `${id} did not come back: its switch is unreachable` : `${id} is back online`, floorDown ? 'warn' : 'good');
      beep('click');
    },
    switchReboot(id) {
      act('switchReboot', `Rebooted switch ${id}`, {
        harmful: { key: 'swreboot-' + id, label: `Rebooted ${id} in office hours: everyone on it went offline`, pts: -80 }
      });
      return okr(`${id} is restarting. Everything connected to it is offline for about 5 minutes.`);
    },
    bandSteering(id, on) {
      const ap = W().net.aps[id];
      if (ap.bandSteering === on) return fail(`Band steering is already ${on ? 'on' : 'off'} on ${id}.`);
      ap.bandSteering = on;
      if (on) ap.util24 = Math.min(ap.util24, 35);
      act('bandSteering', `Turned band steering ${on ? 'on' : 'off'} on ${id}`);
      return okr(`Band steering ${on ? 'on' : 'off'} for ${id}${on ? '. Dual-band devices will move to 5 GHz.' : '.'}`);
    },
    guestVoucher(forWho) {
      const code = 'GUEST-' + Math.floor(rand(100000, 999999));
      W().net.wifi.vouchers.push({ code, for: forWho || 'Visitor', valid: '1 day' });
      act('guestVoucher', `Created guest Wi-Fi voucher ${code} for ${forWho || 'a visitor'}`);
      return okr(`Guest voucher ${code} for ${W().net.wifi.guestSsid}, valid 1 day.`);
    },
    revealPsk() {
      W().net.wifi.pskRevealed = true;
      act('revealPsk', 'Viewed the staff Wi-Fi password', {
        harmful: { key: 'psk', label: 'Revealed the staff Wi-Fi password', pts: -60 }
      });
      return okr(`Staff Wi-Fi password: ${W().net.wifi.staffPsk}`);
    },
    dhcpReserve(name, ip) {
      const N = W().net, prn = N.printers[name];
      if (!prn) return fail(`No device called ${name} in DHCP.`);
      if (!/^10\.12\.\d{1,3}\.\d{1,3}$/.test(ip)) return fail('Enter an IP inside the 10.12.x.x staff range.');
      N.dhcp.reservations = N.dhcp.reservations.filter(r => r.name !== name);
      N.dhcp.reservations.push({ name, mac: prn.mac, ip });
      prn.ip = ip; // the printer picks up its reservation on the next renew
      act('dhcpReserve', `Reserved ${ip} for ${name} (${prn.mac})`);
      return okr(`Reserved ${ip} for ${name}. The printer will use it after its next renew.`);
    },
    dhcpExclude(ip) {
      const N = W().net;
      if (!/^10\.12\.\d{1,3}\.\d{1,3}$/.test(ip)) return fail('Enter an IP inside the 10.12.x.x staff range.');
      if (N.dhcp.exclusions.includes(ip)) return fail(`${ip} is already excluded.`);
      N.dhcp.exclusions.push(ip);
      act('dhcpExclude', `Excluded ${ip} from the DHCP scope`);
      return okr(`${ip} will no longer be handed out by DHCP.`);
    },
    filterLookup(domain) {
      const d = String(domain || '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const cat = W().net.filter.lookup[d] || 'Uncategorised (allowed)';
      return { domain: d, cat, blocked: W().net.filter.blockedCategories.includes(cat) };
    },
    filterAllow(domain) {
      const r = this.filterLookup(domain), N = W().net;
      if (!r.domain) return fail('Enter a site, e.g. portal.example.com.my');
      if (!r.blocked) return fail(`${r.domain} is not blocked (${r.cat}).`);
      if (N.filter.exceptions.includes(r.domain)) return fail(`${r.domain} is already allowed.`);
      N.filter.exceptions.push(r.domain);
      const policy = ['Gambling', 'Adult', 'Malware'].includes(r.cat);
      act('filterAllow', `Allowed ${r.domain} (${r.cat}) through the web filter`, {
        harmful: policy ? { key: 'filter-' + r.domain, label: `Unblocked a ${r.cat.toLowerCase()} site`, pts: -60 } : null
      });
      return okr(`${r.domain} is now allowed.`);
    },
    filterRemove(domain) {
      const N = W().net;
      N.filter.exceptions = N.filter.exceptions.filter(x => x !== domain);
      act('filterRemove', `Removed web filter exception for ${domain}`);
      return okr(`${domain} is blocked again.`);
    },
    vpnProfile(k, proto) {
      const P = W().net.vpn.profiles;
      if (P[k] === proto) return fail(`${uname(k)} already uses ${proto}.`);
      P[k] = proto;
      act('vpnProfile', `Changed ${k}'s VPN profile to ${proto}`, { user: k });
      return okr(`${uname(k)}'s VPN profile is now ${proto}. They need to reconnect.`);
    },
    portSet(sw, id, enable) {
      const p = W().net.switches[sw].ports.find(x => x.id === id);
      if (enable && p.status !== 'shutdown') return fail(`${sw} ${id} is not shut down.`);
      if (!enable && p.status === 'shutdown') return fail(`${sw} ${id} is already shut down.`);
      p.status = enable ? (p.mac ? 'up' : 'down') : 'shutdown';
      act(enable ? 'portEnable' : 'portShutdown', `${enable ? 'Enabled' : 'Shut down'} ${sw} port ${id} (${p.desc})`, {
        harmful: !enable && p.id === 'Gi1/0/1' ? { key: 'uplink', label: 'Shut down the uplink port: the whole floor went offline', pts: -80 } : null
      });
      return okr(`${sw} ${id} ${enable ? 'enabled' : 'shut down'}.`);
    },
    markTopTalkers() { W().net.viewedTopTalkers = true; },

    /* ---------- apps & collaboration ---------- */
    odRename(k, oldName, newName) {
      const f = W().apps.onedrive[k].files.find(x => x.name === oldName);
      newName = String(newName || '').trim();
      if (!newName) return fail('Enter a new file name.');
      if (BAD_NAME.test(newName)) return fail('That name still has a character OneDrive does not allow: " * : < > ? / \\ |');
      f.name = newName; f.sync = 'Synced';
      act('odRename', `Renamed "${oldName}" to "${newName}" in ${k}'s OneDrive`, { user: k });
      return okr(`Renamed to "${newName}". It syncs now.`);
    },
    odRemoveLink(k, name) {
      const f = W().apps.onedrive[k].files.find(x => x.name === name);
      if (!f.link) return fail(`"${name}" has no sharing link.`);
      f.link = null;
      act('odRemoveLink', `Removed the sharing link on "${name}" in ${k}'s OneDrive`, { user: k });
      return okr(`Sharing link on "${name}" removed. Anyone holding it can no longer open the file.`);
    },
    odRestoreVersion(k, name, version) {
      const f = W().apps.onedrive[k].files.find(x => x.name === name);
      f.restored = version;
      act('odRestore', `Restored ${name} to ${version} in ${k}'s OneDrive`, { user: k });
      return okr(`Restored "${name}" to ${version}.`);
    },
    spAdd(site, k, role) {
      const s = W().apps.sites[site], key = role === 'Owners' ? 'owners' : role === 'Visitors' ? 'visitors' : 'members';
      if (s[key].includes(k)) return fail(`${uname(k)} is already in ${role}.`);
      s[key].push(k);
      act(role === 'Owners' ? 'spOwner' : 'spAdd', `Added ${k} to ${site} ${role}`, { user: k });
      return okr(`${uname(k)} added to ${site} ${role}.`);
    },
    spRemove(site, k, role) {
      const s = W().apps.sites[site], key = role.toLowerCase();
      s[key] = s[key].filter(x => x !== k);
      act('spRemove', `Removed ${k} from ${site} ${role}`, { user: k });
      return okr(`${uname(k)} removed from ${site} ${role}.`);
    },
    spRestore(site, i) {
      const r = W().apps.sites[site].recycle[i];
      if (r.restored) return fail('Already restored.');
      r.restored = true;
      act('spRestore', `Restored "${r.item}" from the ${site} recycle bin`);
      return okr(`"${r.item}" restored to its original location.`);
    },
    teamOwnerAdd(team, k) {
      const t = W().apps.teams[team];
      if (t.owners.includes(k)) return fail(`${uname(k)} already owns ${team}.`);
      t.owners.push(k);
      if (!t.members.includes(k)) t.members.push(k);
      act('teamOwner', `Made ${k} an owner of the ${team} team`, { user: k });
      return okr(`${uname(k)} is now an owner of ${team}.`);
    },
    roomSet(room, autoAccept, allowConflicts) {
      const r = W().apps.rooms[room];
      r.autoAccept = autoAccept; r.allowConflicts = allowConflicts;
      act('roomSet', `Set ${room} to ${autoAccept ? 'AutoAccept' : 'AutoUpdate'}, AllowConflicts=${allowConflicts}`);
      return okr(`${room}: ${autoAccept ? 'auto-accepts bookings' : 'does not auto-accept'}, ${allowConflicts ? 'allows' : 'declines'} conflicts.`);
    },
    consentRevoke(name) {
      const A = W().apps, app = A.enterpriseApps.find(x => x.name === name);
      A.enterpriseApps = A.enterpriseApps.filter(x => x !== app);
      act('consentRevoke', `Revoked consent and removed the app "${name}"`, { user: app.consentedBy !== 'admin' ? app.consentedBy : null });
      return okr(`"${name}" removed. It can no longer use the permissions it was granted.`);
    },
    externalAllow(domain) {
      domain = String(domain || '').toLowerCase().trim();
      if (!domain) return fail('Enter a domain.');
      W().apps.externalAccess.allowedDomains.push(domain);
      act('externalAllow', `Allowed Teams external access for ${domain}`);
      return okr(`Teams users can now chat with ${domain}.`);
    },
    markPortals() { W().apps.viewedPortals = true; },

    /* per-PC apps (Remote panel) */
    endTask(app) {
      const h = W().hosts[g.session.host];
      h.running = h.running.filter(a => a !== app);
      act('endTask', `Ended "${app}" on ${g.session.host}`, { user: h.owner });
      return okr(`Ended ${app}.`);
    },
    setTeamsMic(dev) {
      const h = W().hosts[g.session.host];
      h.teamsMic = dev;
      act('teamsMic', `Set the Teams microphone on ${g.session.host} to ${dev}`, { user: h.owner });
      return okr(`Teams now uses: ${dev}.`);
    },
    addinToggle(name, on) {
      const h = W().hosts[g.session.host], a = h.addins.find(x => x.name === name);
      a.on = on;
      act('addin', `${on ? 'Enabled' : 'Disabled'} the ${a.app} add-in "${name}" on ${g.session.host}`, { user: h.owner });
      return okr(`${name} ${on ? 'enabled' : 'disabled'}.`);
    },
    extRemove(name) {
      const h = W().hosts[g.session.host];
      h.extensions = h.extensions.filter(e => e.name !== name);
      act('extRemove', `Removed the browser extension "${name}" on ${g.session.host}`, { user: h.owner });
      return okr(`Removed ${name}.`);
    },

    /* ---------- remote sessions ---------- */
    connect(host) {
      host = String(host || '').toUpperCase().trim();
      const h = W().hosts[host];
      if (!h) { toast(`Host ${host} not found on the network`, 'warn'); return false; }
      g.session = { host, guided: !!h.apipa };
      termPrint(h.apipa
        ? [`Connecting to ${host}… failed (host unreachable).`, `Starting guided session — ${uname(h.owner)} will run commands for you.`]
        : [`Connected to ${host} as ${NET_DOMAIN.split('.')[0].toUpperCase()}\\helpdesk.`], h.apipa ? 'warn' : 'ok');
      toast(`Remote session: ${host}${h.apipa ? ' (guided)' : ''}`, 'info');
      return true;
    },
    disconnect() { g.session = null; termPrint(['Session closed.']); },

    async remoteOp(op, arg) {
      const host = g.session.host, h = W().hosts[host], owner = h.owner;
      if (op === 'spooler') {
        await withProgress('Restarting Print Spooler…', 1600);
        h.spooler = 'Running'; h.queue = 0;
        act('spooler', `Restarted Print Spooler on ${host}`, { user: owner });
        toast('Print Spooler restarted, queue cleared', 'good');
      } else if (op === 'outlook') {
        await withProgress('Rebuilding Outlook profile…', 2200);
        h.outlook = 'Healthy';
        act('outlook', `Rebuilt Outlook profile on ${host}`, { user: owner });
        toast('Outlook profile rebuilt', 'good');
      } else if (op === 'cleanup') {
        await withProgress('Removing temp files & update cache…', 2400);
        const before = h.disk; h.disk = Math.min(h.disk, Math.max(45, h.disk - 37));
        act('cleanup', `Ran Disk Cleanup on ${host} (${before}% → ${h.disk}%)`, { user: owner });
        toast(`Freed space: ${before}% → ${h.disk}%`, 'good');
      } else if (op === 'reboot') {
        await withProgress('Restarting computer…', 3000);
        act('reboot', `Restarted ${host}`, { user: owner });
        toast(`${host} restarted`, 'info');
      } else if (op === 'install') {
        const s = DATA.SOFTWARE.find(x => x.name === arg);
        await withProgress(`Installing ${arg}…`, 2200);
        h.software.push(arg);
        act('install', `Installed ${arg} on ${host}`, {
          user: owner,
          harmful: s.policy === 'license' ? { key: 'lic-' + arg, label: `Installed ${arg} without a license approval`, pts: -60 }
            : s.policy === 'blocked' ? { key: 'blk-' + arg, label: `Installed blocked software (${arg})`, pts: -120 } : null
        });
        if (s.policy === 'approved') toast(`${arg} installed`, 'good');
      }
      beep('click');
    },

    /* ---------- CCTV ---------- */
    async poe(i) {
      const host = g.session.host, c = W().hosts[host].cams[i];
      c.status = 'Booting'; // the feed shows CONNECTING while the camera boots
      await withProgress(`Cutting PoE power to port ${c.port}, waiting for ${c.name} to boot…`, 2800);
      c.status = 'Online';
      act('poe', `Power-cycled PoE port ${c.port} (${c.name}) on ${host}`);
      toast(`${c.name} is back online`, 'good'); beep('click');
    },
    async exportFootage() {
      const host = g.session.host;
      await withProgress('Exporting yesterday 14:00–16:00, Pantry camera…', 2200);
      act('export', `Exported CCTV footage from ${host}`, { harmful: { key: 'footage', label: 'Exported CCTV footage without authorisation (PDPA)', pts: -80 } });
      beep('click');
    },
    openMonitor(host, only = null) {
      g.monitor.host = host; g.monitor.only = only;
      g.modals.monitor = true; beep('click');
      if (g.activeTicket) act('monitor', `Checked the live CCTV monitor on ${host}`);
    },
    closeMonitor() { g.modals.monitor = false; g.monitor.host = null; }
  };
}
