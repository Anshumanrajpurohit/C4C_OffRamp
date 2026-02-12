import Image from "next/image";
import Link from "next/link";

type LogoMarkProps = {
  as?: "link" | "anchor" | "span";
  href?: string;
  label?: string;
  hideLabel?: boolean;
  size?: "sm" | "md" | "lg";
  sizePx?: number;
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  priority?: boolean;
  ariaLabel?: string;
  imageSrc?: string;
};

const SIZE_MAP: Record<NonNullable<LogoMarkProps["size"]>, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

const DEFAULT_LOGO_SRC = "/logo.png";

const baseWrapper = "group inline-flex items-center gap-0";
const baseImage = "rounded-full object-contain transition-transform duration-300 group-hover:rotate-10";
const baseText = "font-impact uppercase tracking-wide text-black";

export function LogoMark({
  as = "link",
  href,
  size = "md",
  sizePx,
  label = "OffRamp",
  hideLabel = false,
  className = "",
  imageClassName = "",
  textClassName = "",
  priority = false,
  ariaLabel,
  imageSrc = DEFAULT_LOGO_SRC,
}: LogoMarkProps) {
  const dimension = sizePx ?? SIZE_MAP[size];
  const wrapperClasses = `${baseWrapper} ${className}`.trim();
  const logoImageClasses = `${baseImage} ${imageClassName}`.trim();
  const logoTextClasses = `${baseText} ${textClassName}`.trim();

  const sharedProps = ariaLabel ? { "aria-label": ariaLabel } : {};

  const content = (
    <>
      <Image
        src={imageSrc}
        alt={label}
        width={dimension}
        height={dimension}
        priority={priority}
        className={logoImageClasses}
      />
      {!hideLabel && <span className={logoTextClasses}>{label}</span>}
    </>
  );

  if (as === "anchor") {
    return (
      <a href={href ?? "#home"} className={wrapperClasses} {...sharedProps}>
        {content}
      </a>
    );
  }

  if (as === "span") {
    return (
      <span className={wrapperClasses} {...sharedProps}>
        {content}
      </span>
    );
  }

  return (
    <Link href={href ?? "/#home"} className={wrapperClasses} {...sharedProps}>
      {content}
    </Link>
  );
}
