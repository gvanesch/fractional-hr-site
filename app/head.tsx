export default function Head() {
  return (
    <>
      {/* Open Graph meta tags */}
      <meta
        property="og:image"
        content="https://www.vanesch.uk/og-image.jpg"
      />
      <meta
        property="og:image:url"
        content="https://www.vanesch.uk/og-image.jpg"
      />
      <meta
        property="og:image:secure_url"
        content="https://www.vanesch.uk/og-image.jpg"
      />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="672" />
      <meta
        property="og:image:alt"
        content="Greg van Esch | HR Operations & Transformation Advisor"
      />

      {/* Twitter meta tags */}
      <meta name="twitter:image" content="https://www.vanesch.uk/og-image.jpg" />
      
      {/* Canonical URL meta tag */}
      <link rel="canonical" href="https://www.vanesch.uk" />
    </>
  );
}