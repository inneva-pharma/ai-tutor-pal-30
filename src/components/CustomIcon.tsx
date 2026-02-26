interface CustomIconProps {
  src: string;
  alt?: string;
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Renders a white PNG icon tinted to a given color using CSS mask-image.
 * Inherits `currentColor` by default, so it follows parent text color
 * (e.g. sidebar active state = orange automatically).
 */
export function CustomIcon({
  src,
  alt = "",
  className = "",
  size = 20,
  color,
}: CustomIconProps) {
  return (
    <span
      role="img"
      aria-label={alt}
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        backgroundColor: color || "currentColor",
        WebkitMaskImage: `url('${src}')`,
        maskImage: `url('${src}')`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
