import { moderateUser, resetDisplayName } from "../moderation-actions";
import { button } from "../ui";

/** Per-author tools next to a submission. Banning acts on the person, not the row. */
export function UserModeration({ userId }: { userId: string }) {
  return (
    <span className="flex flex-wrap gap-1 text-xs">
      <form action={resetDisplayName.bind(null, userId)}>
        <button className={button} title="Đổi tên hiển thị thành “Fan ####”">Reset tên</button>
      </form>
      <form action={moderateUser.bind(null, userId, "shadow")}>
        <button className={button} title="Vẫn gửi được nhưng không ai thấy; ẩn mọi bài cũ, gỡ mọi vote">
          Cấm ngầm
        </button>
      </form>
      <form action={moderateUser.bind(null, userId, "ban")}>
        <button className={button} title="Không gửi, không vote được; ẩn mọi bài cũ, gỡ mọi vote">
          Cấm
        </button>
      </form>
      <form action={moderateUser.bind(null, userId, "unban")}>
        <button className={button} title="Cho gửi lại (bài cũ vẫn ẩn)">Bỏ cấm</button>
      </form>
    </span>
  );
}

const FLAG_LABEL = { gambling: "cờ bạc", profanity: "tục tĩu", domain: "tên miền", shortener: "link rút gọn" } as const;

/** Badges for what the text screen found, so reviewers look twice. */
export function ScreenFlags({ flags }: { flags: (keyof typeof FLAG_LABEL)[] }) {
  if (!flags.length) return null;
  return (
    <span className="ml-1 inline-flex gap-1">
      {flags.map((f) => (
        <span key={f} className="rounded bg-live/15 px-1.5 text-xs font-semibold text-live">
          ⚠ {FLAG_LABEL[f]}
        </span>
      ))}
    </span>
  );
}
