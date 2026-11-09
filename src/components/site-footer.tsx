import { OFFICIAL_CHANNEL_URL } from "@/lib/links";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-6 text-center text-sm text-muted">
      <p>
        Trang do fan làm, <strong>không liên kết chính thức</strong> với Độ Mixi hay MixiGaming.
      </p>
      <p className="mt-1">
        Muốn ủng hộ? Hãy xem và ủng hộ trực tiếp trên{" "}
        <a href={OFFICIAL_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="underline">
          kênh chính chủ
        </a>
        . Trang này không nhận tiền dưới bất kỳ hình thức nào.
      </p>
    </footer>
  );
}
