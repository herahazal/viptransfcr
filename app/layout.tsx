import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My VIP Transfer | Türkiye Geneli VIP ve Havalimanı Transfer Hizmeti",
  description:
    "My VIP Transfer ile Türkiye genelinde güvenli, konforlu ve profesyonel VIP transfer hizmeti alın. İstanbul Havalimanı, Sabiha Gökçen, şehir içi ve şehirler arası transfer çözümleri.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        {/*
          Runs before the document body is parsed, which is the only moment
          early enough to stop the browser restoring a scroll offset on reload.
          Doing it from React was too late: Chrome retries the restore as the
          document grows, and this page grows twice after hydration (the pin
          spacers, then PlaneOutro's pin once its GLB resolves), so the restore
          landed after any reset the components performed and the hero opened
          part-way through its timeline with the window already enlarged.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{history.scrollRestoration='manual';window.scrollTo(0,0)}catch(e){}",
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
