import type { AppProps } from "next/app";
import { Roboto, Roboto_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/app/globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${roboto.variable} ${robotoMono.variable} min-h-screen font-sans antialiased`}>
      <TooltipProvider>
        <Component {...pageProps} />
      </TooltipProvider>
    </div>
  );
}
