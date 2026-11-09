// "Album anh Độ": photos and fan art collected by the owner from the Bộ Tộc community
// (public/album). Content, never site identity: the header, favicon and OG image stay
// the campfire mark (ADR-011).
//
// Every new image needs a person to look at it first (a test cannot see pixels):
//   - no MixiGaming / Refund Gaming logo or wordmark, even inside fan art;
//   - no sponsor, crypto or betting marks (blur them: anh-do-tren-san-khau has the event logo
//     blurred, anh-do-phien-ban-gta the jersey sponsor);
//   - caption states only what the picture shows.
// Raw uploads live in the gitignored assets-raw/, never in public/.

export interface AlbumPhoto {
  id: string;
  src: string;
  width: number;
  height: number;
  /** Describes the image for screen readers. */
  alt: string;
  /** Short line shown under the polaroid and in the lightbox. */
  caption: string;
  kind: "photo" | "fan-art";
  credit: string;
}

const COMMUNITY = "Sưu tầm từ cộng đồng Bộ Tộc, chưa rõ tác giả";

export const ALBUM: AlbumPhoto[] = [
  {
    id: "san-khau",
    src: "/album/anh-do-tren-san-khau.jpg",
    width: 720,
    height: 1080,
    alt: "Anh Độ Mixi cầm micro, cười trên sân khấu, khán giả giơ tay phía dưới",
    caption: "Anh Độ trên sân khấu",
    kind: "photo",
    credit: COMMUNITY,
  },
  {
    id: "moibappe",
    src: "/album/moibappe.jpg",
    width: 720,
    height: 1150,
    alt: "Ảnh chế anh Độ mặc áo đội tuyển Pháp số 10, chữ MOIBAPPE phía sau",
    caption: "“Moibappe” số 10 – ảnh chế của fan",
    kind: "fan-art",
    credit: COMMUNITY,
  },
  {
    id: "chanh-city",
    src: "/album/anh-do-phien-ban-gta.jpg",
    width: 675,
    height: 700,
    alt: "Tranh vẽ anh Độ đội mũ bảo hiểm hồng, chống nạnh giữa phố kiểu game GTA",
    caption: "Anh Độ phiên bản GTA – ảnh fan làm",
    kind: "fan-art",
    credit: COMMUNITY,
  },
];

/** Portrait used by the intro and the home hero. */
export const HERO_PHOTO = ALBUM[0];
