// Login handle ("tên Bộ Tộc") rules, mirrored from public.name_key() in
// supabase/migrations/20261110120000_admin_access_official.sql. The database is the
// authority (the server asks it for the key); this copy gives instant form feedback.

const LOOKALIKE_FROM = "аеорсухіјкмтвнѕАЕОРСУХІЈКМТВНЅοιαΟΙΑνκτ";
const LOOKALIKE_TO = "aeopcyxijkmtbhsaeopcyxijkmtbhsoiaoiavkt";

/** "Bộ Tộc Mixi" → "botocmixi"; Cyrillic/Greek look-alikes folded to Latin. */
export function handleKey(input: string): string {
  const folded = [...input].map((ch) => {
    const i = LOOKALIKE_FROM.indexOf(ch);
    return i >= 0 ? LOOKALIKE_TO[i] : ch;
  });
  return folded
    .join("")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");
}

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 24;
export const PASSPHRASE_MIN = 10;

/** Null when acceptable, else a message for the form. */
export function handleProblem(input: string): string | null {
  const key = handleKey(input);
  if (key.length < HANDLE_MIN) return `Tên cần ít nhất ${HANDLE_MIN} chữ hoặc số.`;
  if (key.length > HANDLE_MAX) return `Tên tối đa ${HANDLE_MAX} chữ hoặc số (không tính dấu cách).`;
  return null;
}

export const PASSPHRASE_MIN_PRIVILEGED = 16;

// The most common choices; a 10-character minimum alone still lets these through.
const COMMON = [
  "1234567890",
  "0123456789",
  "12345678910",
  "matkhau123",
  "matkhau1234",
  "password12",
  "password123",
  "qwertyuiop",
  "abcd123456",
  "iloveyou123",
  "mixigaming",
  "botocmixi",
  "toctruong",
];

/** Null when acceptable. `privileged` (admin / official / owner) requires a longer passphrase. */
export function passphraseProblem(passphrase: string, opts: { handle?: string; privileged?: boolean } = {}): string | null {
  const min = opts.privileged ? PASSPHRASE_MIN_PRIVILEGED : PASSPHRASE_MIN;
  if (passphrase.length < min) return `Mã khóa cần ít nhất ${min} ký tự.`;
  if (passphrase.length > 72) return "Mã khóa tối đa 72 ký tự.";
  const key = handleKey(passphrase);
  if (/^(.)\1+$/.test(passphrase) || /^\d+$/.test(passphrase) || COMMON.some((c) => key.includes(c) && key.length - c.length < 4)) {
    return "Mã khóa này quá dễ đoán, dùng mã tự sinh hoặc một câu dài hơn nhé.";
  }
  if (opts.handle && handleKey(opts.handle).length >= 3 && key.includes(handleKey(opts.handle))) return "Mã khóa không được chứa tên đăng nhập.";
  return null;
}

// 128 short, unaccented, easy-to-type words → 4 words + 4 digits ≈ 42 bits, with
// sign-in attempts rate-limited per handle and per IP on the server.
const WORDS = (
  "lua trai bo toc dem sao trang gio mua nang song nui rung bien cay hoa la cam xoai dua chuoi " +
  "com pho bun banh tra sua kem keo ga vit ca tom cua meo cho chim rua tho ngua voi ho gau khi " +
  "ban ghe nha cua so den bep noi chen dua thia coc ao mu giay tui xe tau may bay cau duong pho " +
  "lang xom cho truong lop sach but muc giay thu tem nhac dan trong ken sao guitar hat mua vui " +
  "cuoi reo hoc choi chay nhay boi leo ngu thuc an uong doc viet ve nghe xem noi goi tim giu " +
  "manh nhanh cham xanh do vang tim nau den trang hong cao thap dai ngan to nho " +
  "bac nam tay xuan he thu sang toi chieu khuya sen dao mai lan cuc ngoc vang bac dong"
)
  .split(" ")
  .filter((w, i, all) => w && all.indexOf(w) === i);

/** e.g. "lua-trai-meo-banh-4821". Uses the Web Crypto RNG (browser and Node). */
export function generatePassphrase(random: (n: number) => number = cryptoRandom): string {
  const words = Array.from({ length: 4 }, () => WORDS[random(WORDS.length)]);
  const digits = String(random(10_000)).padStart(4, "0");
  return [...words, digits].join("-");
}

function cryptoRandom(n: number): number {
  // Rejection sampling: no modulo bias.
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % n;
}

export const PASSPHRASE_WORD_COUNT = WORDS.length;
