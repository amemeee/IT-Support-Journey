/* The standard questions an L1 agent asks, in English and BM.
   Typed messages are matched to a question with simple patterns,
   checked in MATCH_ORDER (most specific first), so "can you try again
   and see?" counts as a retry, not an error question. */

export const QUESTIONS = [
  { k: 'error', label: 'What error do you see?', bm: 'Apa mesej ralat?', re: /error|message|ralat|says?\b|\bsee\b|screen|pop.?up|show(s|ing)?\b|what happen|apa jadi|keluar/ },
  { k: 'when', label: 'When did this start?', bm: 'Bila mula?', re: /\bwhen\b|start(ed)?\b|since|bila|how long|what time|pukul berapa|sejak/ },
  { k: 'restart', label: 'Have you restarted?', bm: 'Dah restart?', re: /restart|reboot|turn(ed)? (it )?off|switch(ed)? (it )?off|power (cycle|off)|mulakan semula|tutup/ },
  { k: 'computer', label: "What's your computer name?", bm: 'Nama komputer?', re: /computer|\bpc\b|laptop|desktop|hostname|machine|asset|device|komputer|sticker|\bnvr\b|which box/ },
  { k: 'others', label: 'Is anyone else affected?', bm: 'Orang lain pun sama?', re: /anyone|others|other (people|users|staff|cameras?)|colleague|everyone|\belse\b|orang lain|semua|whole (team|floor)|only you|just you/ },
  { k: 'verify', label: 'Please verify your staff ID', bm: 'ID pekerja anda?', re: /verify|staff (id|no|number)|employee|\bid\b|identity|pekerja|no\.? staf/ },
  { k: 'retry', label: 'Can you try again now?', bm: 'Cuba lagi sekarang?', re: /try (it )?again|cuba (lagi|semula)|work(s|ing)? now|is it (fixed|ok|working)|\bok now|selesai|test (it )?again|check again/ }
];

const MATCH_ORDER = ['retry', 'verify', 'computer', 'others', 'restart', 'when', 'error'];

export function matchQuestion(text) {
  const v = text.toLowerCase();
  const k = MATCH_ORDER.find(key => QUESTIONS.find(q => q.k === key).re.test(v));
  return k ? QUESTIONS.find(q => q.k === k) : null;
}
