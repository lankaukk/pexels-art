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
      In 1929, René Magritte painted a pipe, and then wrote something very
      obvious beneath it: this is not a pipe. It’s only a painting, and
      unfortunately, you can’t smoke a painting. This is{" "}
      <SiteLink
        href={LACMA_URL}
        icon="https://collections.lacma.org/favicon.ico?favicon.3a5fa5de.ico"
      >
        The Treachery of Images
      </SiteLink>
      , and it has haunted the artist ever since, more or less daily.
    </p>

    <p>
      Here the artist leaves the last word blank and hands you the pen. Say{" "}
      <em>ocean</em>, and a hundred and forty-four strangers’ photographs of the
      sea are summoned from{" "}
      <SiteLink
        href={PEXELS_URL}
        icon="https://static.pexels.com/1/images/meta/pexels-icon.png"
      >
        Pexels
      </SiteLink>{" "}
      and each is boiled down to its average color: a whole afternoon of waves
      becoming a single square, like a memory you can no longer quite picture.
      They arrive in no particular order. Nobody asked them to line up.
    </p>

    <p>
      It should be said, since one can no longer assume such things, that no
      machine has dreamed any of this. There is no generative oracle here
      inventing oceans that never were; only real photographs, taken by real
      people, averaged by plain arithmetic until they forget what they showed.
      That it might be mistaken for the other thing is perhaps the most
      Magrittean part of all. We have grown so used to pictures arriving from
      nowhere, made by means we don’t quite understand, that we have stopped
      asking where they came from, or whether anyone was ever there.
    </p>

    <p>
      And so the gilded frame, that old promise of preciousness, holds a small
      grid of averages, while outside it the feeds swell with images too
      plentiful to be worth very much, the visible world quietly going to seed
      (some have a ruder word for it). You are welcome to smudge it. Nothing in
      here is precious, which is exactly why it is framed.
    </p>
  </section>
);

export default ArtistStatement;
