/* Avatar files that failed to load, so they aren't requested again. */
import { reactive } from 'vue';

export const missingAvatars = reactive(new Set());
