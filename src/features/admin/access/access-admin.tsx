import { getViewer } from "@/features/auth/server/viewer";
import { formatDate } from "@/shared/lib/format";
import { serverClient } from "@/server/supabase/server";
import { button, Section } from "../ui";
import { removeAdmin, revokeInvite } from "./actions";
import { CreateInviteForm } from "./invite-form";

interface Row {
  kind: "admin" | "invite";
  id: string;
  display_name: string;
  handle_key: string | null;
  role: "owner" | "admin" | "official";
  at: string | null;
}

const ROLE = { owner: "Chủ trang", admin: "Quản trị viên", official: "✓ Chính chủ" } as const;

/**
 * Owner-only management of admins and invites. Nobody's email appears anywhere: accounts
 * are a login name + passphrase (ADR-013), and invites are one-time links.
 */
export async function AccessAdmin() {
  const viewer = await getViewer();
  if (!viewer?.isOwner) {
    return (
      <Section title="Quản trị viên & tài khoản chính chủ">
        <p className="text-sm text-muted">Chỉ chủ trang quản lý quản trị viên và lời mời.</p>
      </Section>
    );
  }
  const { data } = await (await serverClient()).rpc("list_access");
  const rows = (data ?? []) as Row[];
  const admins = rows.filter((r) => r.kind === "admin");
  const invites = rows.filter((r) => r.kind === "invite");
  return (
    <Section title="Quản trị viên & tài khoản chính chủ">
      <p className="text-xs text-muted">
        Tạo link mời cho anh Độ / team kênh (Chính chủ) hoặc mod (Quản trị viên). Người nhận mở link, tự đặt mã khóa là vào được — không đăng ký, không email,
        không Gmail. Chỉ chọn “Chính chủ” sau khi đã xác nhận qua kênh chính thức. Tên của anh Độ Mixi, “MixiGaming”, “Tộc Trưởng”… chỉ tài khoản Chính chủ được dùng.
      </p>
      <CreateInviteForm />
      <h3 className="pt-2 text-sm font-semibold">Đang có quyền</h3>
      <ul className="divide-y divide-border text-sm">
        {admins.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 py-2">
            <span className="min-w-0 flex-1">
              <strong>{r.display_name}</strong> <span className="text-muted">· {ROLE[r.role]}</span>
              {r.handle_key && <span className="block font-mono text-xs text-muted">{r.handle_key}</span>}
            </span>
            {r.role !== "owner" && r.id !== viewer.id && (
              <form action={removeAdmin.bind(null, r.id)}>
                <button className={button}>Bỏ quyền</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {invites.length > 0 && (
        <>
          <h3 className="pt-2 text-sm font-semibold">Lời mời chưa dùng</h3>
          <ul className="divide-y divide-border text-sm">
            {invites.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-2">
                <span className="min-w-0 flex-1">
                  <strong>{r.display_name}</strong>{" "}
                  <span className="text-muted">
                    · {ROLE[r.role]} · hết hạn {r.at ? formatDate(r.at) : "?"}
                  </span>
                </span>
                <form action={revokeInvite.bind(null, r.id)}>
                  <button className={button}>Hủy link</button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}
