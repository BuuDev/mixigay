import type { ReactNode, SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Pixel size; the glyphs are drawn on a 24px grid. */
  size?: number;
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  title?: string;
}

/** Builds a stroke icon component; used by the generated icons.generated.tsx. */
export function createIcon(name: string, glyph: ReactNode) {
  function Icon({ size = 20, title, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
        aria-label={title}
        data-icon={name}
        {...props}
      >
        {glyph}
      </svg>
    );
  }
  Icon.displayName = `Icon(${name})`;
  return Icon;
}
