import type { MascotPose } from "@/shared/ui/brand-art";

/** Kinds of fan contribution the site stores (and can count). */
export type CountedKind = "suggestions" | "songs" | "quiz" | "fanArt" | "quotes";
/** Ân xá letters are generated in the browser and never stored, so they have no count. */
export type ContributeKind = CountedKind | "amnesty";

/** Approved items per kind; `null` when the count could not be read. */
export type ContributeCounts = Record<CountedKind, number | null>;

export interface ContributeTile {
  kind: ContributeKind;
  href: string;
  title: string;
  /** One line: what the fan does there. */
  action: string;
  cta: string;
  /** Noun after the count ("12 game đã đề xuất"). */
  unit?: string;
  /** Shown instead of a count for kinds that store nothing. */
  hint?: string;
  pose: MascotPose;
}

/** Order = priority on the home page (owner feedback: game suggestions first). */
export const CONTRIBUTE_TILES: readonly ContributeTile[] = [
  {
    kind: "suggestions",
    href: "/de-xuat",
    title: "Đề xuất game",
    action: "Đề xuất game hay cho anh Độ, vote cho game anh em đã gửi.",
    cta: "Đề xuất ngay",
    unit: "game Bộ Tộc đã đề xuất",
    pose: "gaming",
  },
  {
    kind: "songs",
    href: "/nhac",
    title: "Gửi nhạc nịnh",
    action: "Gửi bài hát Bộ Tộc làm tặng anh Độ, đã duyệt là lên kệ cho cả Bộ Tộc nghe.",
    cta: "Gửi bài hát",
    unit: "bài nhạc nịnh đã lên kệ",
    pose: "stage",
  },
  {
    kind: "quiz",
    href: "/quiz",
    title: "Gửi link quiz",
    action: "Làm bộ câu hỏi trên Kahoot, Wordwall… rồi gửi link cho cả Bộ Tộc chơi.",
    cta: "Gửi quiz",
    unit: "quiz Bộ Tộc tự làm",
    pose: "esport",
  },
  {
    kind: "amnesty",
    href: "/an-xa",
    title: "Viết đơn ân xá",
    action: "Chọn tội danh, viết tâm thư xin về bờ và nhận phán quyết vui.",
    cta: "Viết đơn",
    hint: "Viết xong là có phán quyết, không cần đăng nhập",
    pose: "sad",
  },
  {
    kind: "fanArt",
    href: "/bo-toc#fan-art",
    title: "Gửi fan art",
    action: "Treo tranh bạn vẽ vào phòng tranh Bộ Tộc bằng link Google Drive.",
    cta: "Treo tranh",
    unit: "tranh trong phòng tranh",
    pose: "hello",
  },
  {
    kind: "quotes",
    href: "/kho-quote",
    title: "Góp quote",
    action: "Ghi lại câu nói đáng nhớ trên sóng, kèm đúng mốc thời gian video.",
    cta: "Góp quote",
    unit: "quote trong kho",
    pose: "chat",
  },
];

const number = new Intl.NumberFormat("vi-VN");

export type TileStat = { type: "count"; value: string; label: string } | { type: "hint"; text: string };

/**
 * What a tile shows under its title: the approved count with its noun, or an inviting
 * hint when there is nothing to count yet. Mock data is labelled as such (`demo`), so a
 * sample number is never passed off as the real community's.
 */
export function tileStat(tile: ContributeTile, counts: ContributeCounts, demo: boolean): TileStat {
  if (tile.kind === "amnesty") return { type: "hint", text: tile.hint ?? "" };
  const n = counts[tile.kind];
  if (n === null) return { type: "hint", text: "Bấm để xem và góp thêm" };
  if (n <= 0) return { type: "hint", text: demo ? "Chế độ demo: chưa có dữ liệu" : "Chưa có ai gửi, bạn mở hàng nhé" };
  return { type: "count", value: number.format(n), label: demo ? `${tile.unit} (dữ liệu mẫu)` : (tile.unit ?? "") };
}
