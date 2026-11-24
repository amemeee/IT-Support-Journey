/* =========================================================
   All game data in one place. The simulator and the validator
   (tools/test-scenarios.js) both import from here.
   Import order matters: email.js adds a user to DIRECTORY
   before its mailboxes are built.
   ========================================================= */
import { COMPANY, GROUPS, TEAMS, SOFTWARE, DIRECTORY, HOSTS, CORE_SCENARIOS, CORE_KB } from './core.js';
import { MAIL_DOMAIN, MAIL, EMAIL_SCENARIOS, EMAIL_KB } from './email.js';
import { DEVICES, deviceIssues, DEVICE_SCENARIOS, DEVICE_KB } from './devices.js';
import { NETWORK, NETWORK_SCENARIOS, NETWORK_KB } from './network.js';
import { APPS, APP_SCENARIOS, APP_KB } from './apps.js';
import { REAL_WORLD } from './realworld.js';

export const SCENARIOS = [...CORE_SCENARIOS, ...EMAIL_SCENARIOS, ...DEVICE_SCENARIOS, ...NETWORK_SCENARIOS, ...APP_SCENARIOS];
SCENARIOS.forEach(s => { s.realWorld = REAL_WORLD[s.id]; });

export const KB = [...CORE_KB, ...EMAIL_KB, ...DEVICE_KB, ...NETWORK_KB, ...APP_KB];

export { COMPANY, GROUPS, TEAMS, SOFTWARE, DIRECTORY, HOSTS, MAIL_DOMAIN, MAIL, DEVICES, deviceIssues, NETWORK, APPS };
