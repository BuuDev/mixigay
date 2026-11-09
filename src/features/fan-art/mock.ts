import type { FanArtItem } from "./types";

// Mock-mode starter gallery using local brand illustrations + sample Drive link metadata.
// In Supabase mode every submission is hosted on the fan's personal Google Drive and approved by Admin.
export const fanArtItems: FanArtItem[] = [
  {
    id: "art-1",
    title: "Lửa trại Bộ Tộc 22:22",
    artist: "Họa sĩ Yên Lãng",
    driveUrl: "https://drive.google.com/file/d/1MixiFanArtSampleCampfire0001/view",
    driveFileId: "1MixiFanArtSampleCampfire0001",
    imageUrl: "/brand/illustrations/intro-lit.svg",
    note: "Tranh kỷ niệm những đêm thức canh thông báo lên sóng lúc 22:22 cùng anh Độ.",
    createdAt: "2026-11-05T00:00:00Z",
  },
  {
    id: "art-2",
    title: "Góc phòng stream lúc nửa đêm",
    artist: "Thành viên Bộ Tộc",
    driveUrl: "https://drive.google.com/file/d/1MixiFanArtSampleOffline00002/view",
    driveFileId: "1MixiFanArtSampleOffline00002",
    imageUrl: "/brand/illustrations/empty-offday.svg",
    note: "Khi anh Độ nghỉ phép đi ăn cưới fan, anh em ngồi ôn lại kỷ niệm cũ.",
    createdAt: "2026-11-02T00:00:00Z",
  },
  {
    id: "art-3",
    title: "Linh vật Cáo & Sói canh cổng Bộ Tộc",
    artist: "Fan Cứng Cao Bằng",
    driveUrl: "https://drive.google.com/file/d/1MixiFanArtSampleMascot000003/view",
    driveFileId: "1MixiFanArtSampleMascot000003",
    imageUrl: "/brand/mascot/cu-toc-hello.svg",
    note: "Vẽ tặng gia đình anh Độ Mixi cùng bộ đôi Tùng Sói và Cáo Nhu Nhi.",
    createdAt: "2026-10-29T00:00:00Z",
  },
];

