import type { Metadata } from "next";
import Link from "next/link";
import { UnbanCourt } from "@/features/tribe/components/unban-court";
import { UNBAN_OFFENSES, UNBAN_STYLES } from "@/features/tribe/lib/unban";
import { ScrollReveal } from "@/shared/motion/scroll-reveal";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { IconQuote, IconTribe, IconWall } from "@/shared/ui/icons";
import { NeonText } from "@/shared/ui/neon-text";
import { SectionHeader } from "@/shared/ui/section-header";

export const metadata: Metadata = {
  title: "Tòa án Ân xá – Góc Bộ Tộc",
  description: "Góc giải trí Tòa án Ân xá Bộ Tộc: máy tạo văn mẫu đơn hối lỗi xin về bờ sau những pha lỡ tay ngoài đảo xa.",
};

const ISLAND_RULES = [
  {
    code: "Điều 01 · Giờ giấc 22:22",
    title: "Nghiêm cấm giục lên sóng hoặc đồn đoán nghỉ phép vô căn cứ",
    detail: "Mọi hành vi spam hỏi giờ trong lúc phòng chờ đang bật nhạc đều dễ bị liệt vào diện điều tra của các sếp tổng quản.",
  },
  {
    code: "Điều 02 · Chiến thuật trong game",
    title: "Không cầm đèn chạy trước ô tô chỉ bài khi đang căng thẳng",
    detail: "Dù ở Space City (Delta Force) hay giải đố Mixi Stream Escape, bình tĩnh cổ vũ sẽ giúp bạn an toàn trên đất liền.",
  },
  {
    code: "Điều 03 · Văn hóa phòng chat",
    title: "Giữ gìn sự vui vẻ, lịch sự, không spam quảng cáo hay link lạ",
    detail: "Bộ Tộc là nơi anh em giải trí mỗi tối sau giờ làm việc — tôn trọng anh Độ Mixi, khách mời và mọi người xung quanh.",
  },
];

export default function UnbanPage() {
  return (
    <div className="space-y-16 py-6">
      <header className="text-center">
        <Badge tone="accent">Đặc sản văn mẫu ngoài khơi</Badge>
        <NeonText className="mt-3 text-4xl sm:text-5xl">TÒA ÁN ÂN XÁ</NeonText>
        <p className="mx-auto mt-3 max-w-2xl text-muted">
          Nơi tập kết của các “Robinson ngoài đảo xa” muốn soạn tâm thư xin về bờ cùng anh Độ Mixi và anh em Bộ Tộc. Chỉ mang tính chất giải trí vui vẻ — muốn xin gỡ khóa thật hãy sinh hoạt đúng nội quy trên kênh chính chủ nhé!
        </p>
      </header>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Soạn đơn & Xét xử giả lập" title="Máy tạo Đơn hối lỗi xin về bờ" icon={<IconWall size={26} className="text-accent" />} />
        <UnbanCourt />
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Hồ sơ tiền án thường gặp" title="Các tội danh hay bị tiễn ra đảo nhất" icon={<IconQuote size={26} className="text-accent" />} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {UNBAN_OFFENSES.map((offense) => (
            <Card key={offense.id} className="space-y-2 p-4">
              <Badge tone="viewer">{offense.badge}</Badge>
              <h3 className="font-bold text-foreground">{offense.label}</h3>
              <p className="text-xs leading-relaxed text-muted">“{offense.confession}”</p>
            </Card>
          ))}
        </div>
      </ScrollReveal>

      <ScrollReveal as="section">
        <SectionHeader eyebrow="Bí kíp giữ vé đất liền" title="Cẩm nang sinh tồn cho thần dân Bộ Tộc" icon={<IconTribe size={26} className="text-accent" />} />
        <div className="grid gap-4 md:grid-cols-3">
          {ISLAND_RULES.map((rule) => (
            <Card key={rule.code} className="space-y-2 p-4">
              <p className="font-mono text-xs font-bold text-accent uppercase">{rule.code}</p>
              <h3 className="font-bold">{rule.title}</h3>
              <p className="text-xs leading-relaxed text-muted">{rule.detail}</p>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Đang có {UNBAN_STYLES.length} trường phái viết tâm thư được cập nhật. Khám phá thêm từ điển, đố vui và phòng tranh tại trang{" "}
          <Link href="/bo-toc" className="font-semibold text-accent underline underline-offset-2">
            Bộ Tộc
          </Link>
          .
        </p>
      </ScrollReveal>
    </div>
  );
}

