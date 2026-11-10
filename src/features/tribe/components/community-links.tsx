import { OFFICIAL_LINKS } from "@/features/support/links";
import { IconTribe, IconWall } from "@/shared/ui/icons";

// Read from the verified, test-guarded official list (src/features/support/links.ts).
const COMMUNITY = [
  { id: "group", Icon: IconTribe },
  { id: "discord", Icon: IconWall },
].flatMap(({ id, Icon }) => {
  const link = OFFICIAL_LINKS.find((l) => l.id === id);
  return link ? [{ ...link, Icon }] : [];
});

export function CommunityLinks() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {COMMUNITY.map(({ label, hint, href, Icon }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 shadow-card transition-colors hover:border-accent"
        >
          <Icon size={28} className="text-accent" />
          <span className="min-w-0">
            <span className="block font-bold">{label}</span>
            <span className="block text-xs text-muted">{hint}</span>
          </span>
          <span aria-hidden className="ml-auto text-accent">
            ↗
          </span>
          <span className="sr-only">(mở tab mới)</span>
        </a>
      ))}
    </div>
  );
}
