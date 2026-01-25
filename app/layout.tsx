import type { Metadata } from "next";
import "./globals.css";
import ThemeClient from "./components/ThemeClient";

// If you already have metadata/icons/manifest here, copy-paste those back in.
export const metadata: Metadata = {
  title: "Meet Asuka",
  description: "Events • Trips • TODOs • Wishlist",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Prevent theme flash: set theme before React loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var t = localStorage.getItem("asukaTheme");
    var theme = (t === "night") ? "night" : "day";
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();
            `.trim(),
          }}
        />
      </head>
      <body>
        <ThemeClient>{children}</ThemeClient>
      </body>
    </html>
  );
}
