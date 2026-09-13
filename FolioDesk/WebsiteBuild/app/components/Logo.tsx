import React from "react";
import Image from "next/image";

export default function Logo({
  variant = "light",
  size = "normal",
}: {
  variant?: "light" | "dark";
  size?: "normal" | "large";
}) {
  const height = size === "large" ? 48 : 38;

  return (
    <Image
      src="/foliodesk/FolioDesk-logo-transparent.png"
      alt="FolioDesk Enterprise Document Platform"
      width={220}
      height={height}
      style={{
        height: height,
        width: "auto",
        maxHeight: height,
        objectFit: "contain",
        display: "block",
        filter: variant === "dark" ? "brightness(0) invert(1)" : "none",
      }}
    />
  );
}
