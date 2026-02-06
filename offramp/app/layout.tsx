import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const sans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Plant-Based Swap Guide",
  description: "Guided flow to discover vegan swaps and personal impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,600,0,0"
        />
        <Script id="strip-fdprocessedid" strategy="beforeInteractive">
          {`
            (function(){
              var ATTR = "fdprocessedid";
              var disconnectTimer;
              function scrub(node){
                if (!node || typeof node.querySelectorAll !== "function") return;
                node.querySelectorAll("[" + ATTR + "]").forEach(function(el){
                  el.removeAttribute(ATTR);
                });
              }
              function removeAttribute(target){
                if (target && typeof target.removeAttribute === "function" && target.hasAttribute(ATTR)) {
                  target.removeAttribute(ATTR);
                }
              }
              function startObserver(){
                if (typeof document === "undefined") return;
                var root = document.documentElement;
                removeAttribute(root);
                scrub(root);
                var observer = new MutationObserver(function(mutations){
                  mutations.forEach(function(mutation){
                    if (mutation.type === "attributes" && mutation.attributeName === ATTR) {
                      removeAttribute(mutation.target);
                    }
                    if (mutation.type === "childList") {
                      mutation.addedNodes.forEach(function(node){
                        if (node.nodeType === 1) {
                          removeAttribute(node);
                          scrub(node);
                        }
                      });
                    }
                  });
                });
                observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: [ATTR] });
                var stop = function(){
                  observer.disconnect();
                  if (disconnectTimer) clearTimeout(disconnectTimer);
                };
                window.addEventListener("load", stop, { once: true });
                disconnectTimer = window.setTimeout(stop, 7000);
              }
              startObserver();
            })();
          `}
        </Script>
      </head>
      <body
        suppressHydrationWarning
        className={`${sans.variable} ${mono.variable} antialiased bg-[#f7f3ee] text-[#131614]`}
      >
        {children}
      </body>
    </html>
  );
}
