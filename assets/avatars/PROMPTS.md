# Avatar prompts

Save each image as a square PNG in `source/`, named exactly as shown (e.g. `source/naisyah.png`), then run
`python tools/build-avatars.py` from the repo root. That crops the head and writes the small WebP the site loads.
Any character without an avatar shows their initials.

## Style (paste before every prompt)

> Manga-style black and white character illustration, clean confident black ink outlines, solid black hair with minimal strands, very light flat grey shading only in clothing folds, no screentone, no colour, pure white background. Waist-up, standing straight, facing the viewer, arms relaxed at the sides, head centred in the upper third of the frame. Calm, understated expression, simple realistic proportions. Square 1:1, no text, no logos, no watermark, no border.

If your tool accepts a reference image, attach the example illustration as a style reference and keep the same seed for every character so the set looks consistent.

## Agent (the player)

| File | Prompt |
|---|---|
| `agent.png` | A friendly IT support agent in their late 20s wearing a headset with a microphone, plain dark t-shirt, short neat hair, relaxed smile. |

## Staff

| File | Who | Prompt |
|---|---|---|
| `naisyah.png` | Nurul Aisyah binti Ahmad, HR Executive | Malay woman, late 20s, wearing a plain tudung and a soft cardigan, warm slightly embarrassed smile. |
| `nain.png` | Nurul Ain binti Razak, Warehouse Supervisor | Malay woman, mid 30s, wearing a tudung and a high-visibility safety vest over a polo shirt, confident expression. |
| `twming.png` | Tan Wei Ming, Senior Accountant | Chinese Malaysian man, mid 40s, rectangular glasses, short side-parted hair, collared shirt, tired but focused. |
| `twmin.png` | Tan Wei Min, Software Engineer | Chinese Malaysian man, mid 20s, messy short hair, hoodie, wireless earbuds, calm expression. |
| `psubra.png` | Priya a/p Subramaniam, Financial Analyst | Indian Malaysian woman, late 20s, long hair tied back, simple blazer, small stud earrings, polite smile. |
| `lsling.png` | Lim Siew Ling, Ops Coordinator | Chinese Malaysian woman, early 30s, short bob haircut, polo shirt with a company lanyard, slightly frustrated look. |
| `mfaiz.png` | Muhammad Faiz bin Osman, QA Engineer | Malay man, late 20s, short trimmed beard, plain crew-neck t-shirt, casual and easygoing. |
| `kavitha.png` | Kavitha a/p Rajan, Content Lead | Indian Malaysian woman, mid 30s, shoulder-length curly hair, kurta-style top, cheerful expression. |
| `jwong.png` | Jason Wong Kah Hoe, Account Manager | Chinese Malaysian man, early 30s, neatly styled hair, dress shirt and tie, slightly worried expression. |
| `shajar.png` | Siti Hajar binti Yusof, Legal Executive | Malay woman, early 30s, neat tudung, tailored blazer, serious and composed. |
| `draj.png` | Daniel Raj a/l Kumar, Graphic Designer | Indian Malaysian man, mid 20s, wavy hair, round glasses, casual shirt, enthusiastic grin. |
| `rosnah.png` | Rosnah binti Hassan, Office Manager | Malay woman, mid 50s, tudung, baju kurung, reading glasses on a chain, no-nonsense but kind. |
| `azaki.png` | Ahmad Zaki bin Ismail, Sales Manager | Malay man, mid 40s, short neat black hair, trimmed moustache, slightly fuller face, wearing a short-sleeved batik shirt with a bold leaf pattern drawn in black line art, smartwatch on one wrist, confident friendly smile, relaxed manager posture. |
| `ahakim.png` | Aiman Hakim bin Zulkifli, new Sales Executive | Malay man, early 20s, fresh haircut, crisp long-sleeved shirt, slightly nervous first-day smile. |
| `cmeiyee.png` | Chong Mei Yee, Support Specialist | Young woman, female, Chinese Malaysian, mid 20s, long straight black hair tied in a high ponytail with a few loose strands framing her face, wearing a call-centre headset with a small boom microphone over one ear, simple fitted blouse, slightly tired eyes with a polite small smile. Not a man, no short hair, no collared men's shirt. |
| `dkamal.png` | Dato' Kamal bin Ismail, CEO | Malay man, late 50s, short grey hair, dark tailored suit and tie, calm and authoritative. |
| `fnadia.png` | Farah Nadia binti Rahim, Payroll Executive | Malay woman, late 20s, shoulder-length straight hair, blouse, holding a smartphone, concerned expression. |
| `arjun.png` | Arjun a/l Selvam, Customer Support Team Lead | Indian Malaysian man, mid 30s, full neat beard, polo shirt, sheepish apologetic expression. |
| `ksoon.png` | Khoo Soon Lee, Sales Executive | Chinese Malaysian man, late 20s, short crew cut, smart casual shirt, neutral expression. |

## Facilities

| File | Who | Prompt |
|---|---|---|
| `rahman.png` | Rahman bin Yusof, Security Guard (contractor) | Malay man, early 50s, short greying hair, thick moustache, wearing a security guard uniform shirt with shoulder epaulettes and a small badge, walkie-talkie clipped to the chest pocket, steady and polite expression. |

## Foreign staff

| File | Who | Prompt |
|---|---|---|
| `htanaka.png` | Hiroshi Tanaka, Regional Sales Director (Japanese expat) | Japanese man, late 40s, neat short side-parted hair with a little grey at the temples, thin rimless glasses, dark suit jacket over a white shirt with no tie, a slight polite bow of the head, modest and courteous expression. |

## Attacker

| File | Who | Prompt |
|---|---|---|
| `hacker.png` | Unknown attacker (shown after security tickets) | Young adult in a plain dark hoodie with the hood up, face partly in shadow from the hood so only the lower face and a faint smirk are clearly visible, cheap prepaid phone held loosely in one hand, cheap earphones around the neck, relaxed and unbothered posture. Keep it grounded and realistic, with no masks or glowing code effects. |

## Other

| File | Prompt |
|---|---|
| `caller.png` | Anonymous phone caller shown only as a dark silhouette holding a phone to their ear, face hidden in shadow, airport departure board faintly behind. |

Tips:
- If a tool keeps adding colour, add "monochrome, greyscale only" to the style line. The site also converts avatars to greyscale.
- Keep the head in the same spot (upper third, centred) in every image. The build script crops that area, so a head placed too low or off-centre gets cut off.
- For the silhouette caller, swap "pure white background" for "plain grey background" so the silhouette still reads.
