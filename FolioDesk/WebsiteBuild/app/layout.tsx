import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { currentUser } from "../lib/auth";
import Logo from "./components/Logo";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "FolioDesk | Project finance control", template: "%s | FolioDesk" },
  description: "Project finance control for engineering and construction SMEs in Singapore and Malaysia.",
  openGraph: { title: "FolioDesk", description: "See project margin before the project ends.", type: "website" },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand" aria-label="FolioDesk Home" style={{ textDecoration: "none" }}>
            <Logo variant="light" size="normal" />
          </Link>
          <nav aria-label="Primary navigation">
            <Link href="/platform">Platform</Link>
            <Link href="/solutions/contractors">Solutions</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/genai">GenAI</Link>
            <Link href="/affiliates">Affiliates</Link>
            {user ? (
              <>
                <Link className="nav-cta" href="/portal">My Profile</Link>
                <form action="/foliodesk/api/logout" method="post" style={{ display: "inline" }}>
                  <button type="submit" className="button secondary" style={{ padding: "6px 14px", fontSize: "14px", cursor: "pointer" }}>Sign out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login">Sign in</Link>
                <Link className="nav-cta" href="/register">Become an affiliate</Link>
              </>
            )}
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <div>
            <Link href="/" className="brand" aria-label="FolioDesk Home" style={{ textDecoration: "none" }}>
              <Logo variant="dark" size="normal" />
            </Link>
            <p style={{ marginTop: 12 }}>Project finance control for the firms that build Southeast Asia.</p>
          </div>
          <div>
            <p>Singapore · Malaysia</p>
            <p>© {new Date().getFullYear()} FolioDesk. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
