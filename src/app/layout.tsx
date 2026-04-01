import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SimulationProvider } from "@/context/SimulationContext";
import { AuthProvider } from "@/context/AuthContext";
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
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-sans antialiased text-foreground`}
      >
        <ThemeProvider defaultTheme="dark">
          <SimulationProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </SimulationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
