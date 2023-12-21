import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* OG Image (replace with your actual image path) */}
  <meta property="og:url" content="https://www.purplepandabook.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Purple Panda Book" />
  <meta property="og:description" content="An infinite color & animal book" />
  <meta property="og:image" content="https://purplepandabook.com/og-image.png" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta property="twitter:domain" content="purplepandabook.com" />
  <meta property="twitter:url" content="https://www.purplepandabook.com/" />
  <meta name="twitter:title" content="Purple Panda Book" />
  <meta name="twitter:description" content="An infinite color & animal book" />
  <meta name="twitter:image" content="https://purplepandabook.com/og-image.png" />

        
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
