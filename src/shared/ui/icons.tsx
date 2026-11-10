import type { SVGProps } from "react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { AlarmIcon } from "@phosphor-icons/react/dist/ssr/Alarm";
import { ArrowFatUpIcon } from "@phosphor-icons/react/dist/ssr/ArrowFatUp";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { ArrowsOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowsOut";
import { BellIcon } from "@phosphor-icons/react/dist/ssr/Bell";
import { BroadcastIcon } from "@phosphor-icons/react/dist/ssr/Broadcast";
import { CalendarDotsIcon } from "@phosphor-icons/react/dist/ssr/CalendarDots";
import { CalendarPlusIcon } from "@phosphor-icons/react/dist/ssr/CalendarPlus";
import { CampfireIcon } from "@phosphor-icons/react/dist/ssr/Campfire";
import { ChatsCircleIcon } from "@phosphor-icons/react/dist/ssr/ChatsCircle";
import { CoffeeIcon } from "@phosphor-icons/react/dist/ssr/Coffee";
import { ConfettiIcon } from "@phosphor-icons/react/dist/ssr/Confetti";
import { FireIcon } from "@phosphor-icons/react/dist/ssr/Fire";
import { GameControllerIcon } from "@phosphor-icons/react/dist/ssr/GameController";
import { HandWavingIcon } from "@phosphor-icons/react/dist/ssr/HandWaving";
import { LightbulbIcon } from "@phosphor-icons/react/dist/ssr/Lightbulb";
import { PaintBrushIcon } from "@phosphor-icons/react/dist/ssr/PaintBrush";
import { PaletteIcon } from "@phosphor-icons/react/dist/ssr/Palette";
import { PathIcon } from "@phosphor-icons/react/dist/ssr/Path";
import { QuotesIcon } from "@phosphor-icons/react/dist/ssr/Quotes";
import { SmileyXEyesIcon } from "@phosphor-icons/react/dist/ssr/SmileyXEyes";
import { SteamLogoIcon } from "@phosphor-icons/react/dist/ssr/SteamLogo";
import { StorefrontIcon } from "@phosphor-icons/react/dist/ssr/Storefront";
import { TimerIcon } from "@phosphor-icons/react/dist/ssr/Timer";
import { TrophyIcon } from "@phosphor-icons/react/dist/ssr/Trophy";
import { UsersFourIcon } from "@phosphor-icons/react/dist/ssr/UsersFour";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { VideoCameraIcon } from "@phosphor-icons/react/dist/ssr/VideoCamera";
import { ImagesIcon } from "@phosphor-icons/react/dist/ssr/Images";
import { DotsThreeOutlineIcon } from "@phosphor-icons/react/dist/ssr/DotsThreeOutline";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";

// Phosphor Icons (MIT), duotone weight (ADR-010). The SSR build has no React
// context, so these render in Server and Client Components alike. The duotone
// back layer is tinted by `--td-icon-tint` (globals.css), so seasonal skins recolour it.

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children" | "ref"> {
  size?: number;
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  title?: string;
}

function icon(name: string, Glyph: PhosphorIcon) {
  function Icon({ size = 20, title, ...props }: IconProps) {
    return (
      <Glyph weight="duotone" size={size} alt={title} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} data-icon={name} {...props} />
    );
  }
  Icon.displayName = `Icon(${name})`;
  return Icon;
}

/** Đang live */
export const IconLive = icon("live", BroadcastIcon);
/** Sắp live */
export const IconUpcoming = icon("upcoming", AlarmIcon);
/** Lịch stream */
export const IconSchedule = icon("schedule", CalendarDotsIcon);
/** Game Steam */
export const IconGameSteam = icon("game-steam", SteamLogoIcon);
/** Game viewer làm */
export const IconGameViewer = icon("game-viewer", UsersThreeIcon);
/** Game linh tinh */
export const IconGameMisc = icon("game-misc", GameControllerIcon);
/** Vlog */
export const IconVlog = icon("vlog", VideoCameraIcon);
/** Đề xuất game */
export const IconSuggest = icon("suggest", LightbulbIcon);
/** Vote */
export const IconUpvote = icon("upvote", ArrowFatUpIcon);
/** Đã phá đảo */
export const IconCleared = icon("cleared", TrophyIcon);
/** Đã bỏ */
export const IconDropped = icon("dropped", SmileyXEyesIcon);
/** Câu nói để đời */
export const IconQuote = icon("quote", QuotesIcon);
/** Fan art */
export const IconFanart = icon("fanart", PaintBrushIcon);
/** Ngày nghỉ */
export const IconOffday = icon("offday", CoffeeIcon);
/** Lửa trại */
export const IconCampfire = icon("campfire", CampfireIcon);
/** Link ra ngoài */
export const IconExternal = icon("external", ArrowSquareOutIcon);
/** Nhóm lửa */
export const IconKindle = icon("kindle", FireIcon);
/** Thêm vào lịch */
export const IconCalendarAdd = icon("calendar-add", CalendarPlusIcon);
/** Đếm ngược */
export const IconCountdown = icon("countdown", TimerIcon);
/** Sự kiện đặc biệt */
export const IconEvent = icon("event", ConfettiIcon);
/** Tối nay tôi có mặt */
export const IconAttend = icon("attend", HandWavingIcon);
/** Bộ tộc */
export const IconTribe = icon("tribe", UsersFourIcon);
/** Bức tường Bộ tộc */
export const IconWall = icon("wall", ChatsCircleIcon);
/** Cửa hàng */
export const IconShop = icon("shop", StorefrontIcon);
/** Thông báo */
export const IconBell = icon("bell", BellIcon);
/** Skin theo dịp */
export const IconSkin = icon("skin", PaletteIcon);
/** Timeline buổi stream */
export const IconTimeline = icon("timeline", PathIcon);
/** Phóng to */
export const IconExpand = icon("expand", ArrowsOutIcon);
/** Đóng */
export const IconClose = icon("close", XIcon);
/** Album ảnh */
export const IconAlbum = icon("album", ImagesIcon);
/** Thêm (menu) */
export const IconMore = icon("more", DotsThreeOutlineIcon);
