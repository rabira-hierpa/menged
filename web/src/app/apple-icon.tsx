import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — green tile + white minibus mark. */
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
          background: "#15803D",
          borderRadius: 36,
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#fff"
            d="M8 28.5c0-2.5 1.2-4.8 3.2-6.2L18 17.5c1.4-1 3.1-1.5 4.9-1.5h22.6c2.4 0 4.6 1.2 5.9 3.2l3.8 5.8c.9 1.4 1.4 3 1.4 4.7V42c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V28.5Z"
          />
          <rect x="20" y="10" width="22" height="5.5" rx="1.5" fill="#fff" />
          <path
            fill="#15803D"
            d="M14.5 24.5h10.5c.8 0 1.5.7 1.5 1.5v7c0 .8-.7 1.5-1.5 1.5H13c-.6 0-1.1-.5-1-1.1l1.2-7.4c.1-.9.9-1.5 1.8-1.5Z"
          />
          <rect
            x="29"
            y="24.5"
            width="9"
            height="10"
            rx="1.5"
            fill="#15803D"
          />
          <rect
            x="40.5"
            y="24.5"
            width="9"
            height="10"
            rx="1.5"
            fill="#15803D"
          />
          <circle cx="20" cy="46.5" r="5" fill="#fff" />
          <circle cx="20" cy="46.5" r="2.25" fill="#15803D" />
          <circle cx="46" cy="46.5" r="5" fill="#fff" />
          <circle cx="46" cy="46.5" r="2.25" fill="#15803D" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
