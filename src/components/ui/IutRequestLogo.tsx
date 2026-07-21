import clsx from "clsx";

interface IutRequestLogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-8",
  md: "h-11",
  lg: "h-16",
};

export function IutRequestLogo({ size = "md", className }: IutRequestLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- simple logo asset, pas besoin d'optimisation Next/Image
    <img
      src="/logo.png"
      alt="IUTRequest"
      className={clsx("w-auto object-contain", SIZE_CLASSES[size], className)}
    />
  );
}
