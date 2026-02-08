import Image from "next/image";
import Link from "next/link";

type LogoMarkProps = {
  as?: "link" | "anchor" | "span";
  href?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  priority?: boolean;
  ariaLabel?: string;
};

const SIZE_MAP: Record<NonNullable<LogoMarkProps["size"]>, number> = {
  sm: 32,
  md: 40,
  lg: 48,
};

const baseWrapper = "group inline-flex items-center gap-2";
const baseImage = "rounded border-2 border-black bg-white object-cover transition-transform duration-300 group-hover:rotate-6";
const baseText = "font-impact uppercase tracking-wide text-black";

export function LogoMark({
  as = "link",
  href,
  size = "md",
  label = "OffRamp",
  className = "",
  imageClassName = "",
  textClassName = "",
  priority = false,
  ariaLabel,
}: LogoMarkProps) {
  const dimension = SIZE_MAP[size];
  const wrapperClasses = `${baseWrapper} ${className}`.trim();
  const logoImageClasses = `${baseImage} ${imageClassName}`.trim();
  const logoTextClasses = `${baseText} ${textClassName}`.trim();

  const sharedProps = ariaLabel ? { "aria-label": ariaLabel } : {};

  const content = (
    <>
      <Image
        src="/offramp-logo.png"
        alt={label}
        width={dimension}
        height={dimension}
        priority={priority}
        className={logoImageClasses}
      />
      <span className={logoTextClasses}>{label}</span>
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
