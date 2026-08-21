import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#141412",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 32 32" fill="none">
          <path d="M10 12.5L16 9L22 12.5L16 16L10 12.5Z" fill="#F4F3EF" />
          <path d="M10 14L16 17.5V23L10 19.5V14Z" fill="#92B6FF" />
          <path d="M22 14L16 17.5V23L22 19.5V14Z" fill="#77766F" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
