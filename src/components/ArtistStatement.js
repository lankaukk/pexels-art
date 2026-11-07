import React from "react";

const LACMA_URL = "https://collections.lacma.org/object/31931";
const PEXELS_URL = "https://www.pexels.com/api/";

// a link with the site's own favicon in a small circle just before it
const SiteLink = ({ href, icon, children }) => (
  <a className="site-link" href={href} target="_blank" rel="noopener noreferrer">
    <img className="site-icon" src={icon} alt="" width="16" height="16" />
    {children}
  </a>
);

// the wall text, below the artwork
const ArtistStatement = () => (
  <section className="statement" aria-label="About the work">
    <p>
      In 1929, René Magritte painted a pipe. Beneath it he wrote something so
      literal that it will confuse you if you aren’t ready for philosophical
      thinking. “This is not a pipe.” But, isn’t it? Looks just like one. But
      guess what, you can’t smoke it, because you can’t smoke a painting. Ha
      ha. This is{" "}
      <SiteLink
        href={LACMA_URL}
        icon="https://collections.lacma.org/favicon.ico?favicon.3a5fa5de.ico"
      >
        The Treachery of Images
      </SiteLink>
      , and a century later I’m still afflicted by its absurd, wildly unfair
      truth: a picture of a thing is never the thing, and everywhere we scroll
      these days that is true on a whole new level.
    </p>

    <p>
      In a completely different manner, no one knows what’s real anymore. Here
      you can type anything into this caption, and 144 strangers’ photographs
      are summoned from{" "}
      <SiteLink
        href={PEXELS_URL}
        icon="https://static.pexels.com/1/images/meta/pexels-icon.png"
      >
        Pexels
      </SiteLink>
      . Each is rendered as a square in its average color, like a memory you no
      longer have storage for.
    </p>

    <p>
      And no, this isn’t AI. Nothing here was dreamed up by a machine. These are
      real photos, taken by real people standing somewhere real, just averaged
      down with plain old math until they forget what they were of.
    </p>

    <p>
      Imagine anything, smudge it, forget about it. Nothing is precious. Frame
      whatever you want.
    </p>
  </section>
);

export default ArtistStatement;
