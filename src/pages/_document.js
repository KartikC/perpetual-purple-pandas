import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Performance and Resource Hints */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//raw.githubusercontent.com" />
        <link rel="dns-prefetch" href="//storage.ko-fi.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://raw.githubusercontent.com" />



        {/* Favicon and App Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#667eea" />

        {/* Viewport and Mobile Optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Purple Panda Book" />

        {/* SEO Meta Tags */}
        <meta name="description" content="An infinite interactive color & animal book with smooth transitions and beautiful color palettes. Click to discover new combinations!" />
        <meta name="keywords" content="purple panda, animals, colors, interactive book, art, design, color palette" />
        <meta name="author" content="Purple Panda Book" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.purplepandabook.com/" />

        {/* Open Graph Meta Tags */}
        <meta property="og:url" content="https://www.purplepandabook.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Purple Panda Book - An Infinite Color & Animal Book" />
        <meta property="og:description" content="An infinite interactive color & animal book with smooth transitions and beautiful color palettes. Click to discover new combinations!" />
        <meta property="og:image" content="https://purplepandabook.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Purple Panda Book" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="purplepandabook.com" />
        <meta property="twitter:url" content="https://www.purplepandabook.com/" />
        <meta name="twitter:title" content="Purple Panda Book - An Infinite Color & Animal Book" />
        <meta name="twitter:description" content="An infinite interactive color & animal book with smooth transitions and beautiful color palettes. Click to discover new combinations!" />
        <meta name="twitter:image" content="https://purplepandabook.com/og-image.png" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Purple Panda Book",
              "description": "An infinite interactive color & animal book with smooth transitions and beautiful color palettes",
              "url": "https://www.purplepandabook.com/",
              "applicationCategory": "EntertainmentApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </Head>
      <body>
        {/* Loading fallback for critical rendering */}
        <div id="loading-critical" className="loading-critical">
          Loading Purple Panda Book...
        </div>

        <Main />
        <NextScript />

        {/* Remove loading fallback once app loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                  const loading = document.getElementById('loading-critical');
                  if (loading) {
                    loading.style.opacity = '0';
                    setTimeout(function() {
                      loading.remove();
                    }, 300);
                  }
                }, 1000);
              });
            `
          }}
        />
      </body>
    </Html>
  );
}
