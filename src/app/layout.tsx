import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "DFA Minimizer — Interactive Automata Simulator",
  description:
    "Visualize, simulate, and minimize Deterministic Finite Automata. Features table-filling algorithm, step-by-step string testing, and JSON import/export.",
  keywords: ["DFA", "minimizer", "automata", "finite automaton", "computer science", "theory of computation"],
  authors: [{ name: "DFA Minimizer" }],
  openGraph: {
    title: "DFA Minimizer — Interactive Automata Simulator",
    description: "Visualize, simulate, and minimize DFA with step-by-step animations",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased bg-background text-foreground font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
