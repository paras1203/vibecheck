import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SimulationProvider } from "@/context/SimulationContext";
import { AuthProvider } from "@/context/AuthContext";
import { RoastSessionRoot } from "@/components/providers/roast-session-root";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SiteRoast — Conversion audits",
  description:
    "Paste your URL. Get a conversion-focused roast, score, and actionable report — fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen min-w-0 bg-background font-sans antialiased text-foreground overflow-x-clip`}
      >
        <ThemeProvider defaultTheme="dark">
          <SimulationProvider>
            <AuthProvider>
              <RoastSessionRoot>{children}</RoastSessionRoot>
              <Toaster />
            </AuthProvider>
          </SimulationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
