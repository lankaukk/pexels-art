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
      In 1929, René Magritte painted a pipe with such earnest fidelity that one
      could very nearly smell the tobacco, and then, beneath it, in the patient
      hand of a schoolteacher, denied it entirely: <em>Ceci n’est pas une
      pipe.</em> The canvas, now in the collection of the{" "}
      <SiteLink
        href={LACMA_URL}
        icon="https://collections.lacma.org/favicon.ico?favicon.3a5fa5de.ico"
      >
        Los Angeles County Museum of Art
      </SiteLink>{" "}
      as <em>The Treachery of Images</em>, remains among the most quietly
      devastating sentences in the history of art. It is not a pipe. It is
      paint. It is a picture of a pipe, and a picture, Magritte gently insists,
      cannot be packed, lit, or smoked.
    </p>

    <p>
      Nearly a century on, the artist borrows Magritte’s sentence and leaves its
      final word conspicuously, almost insolently, blank. The visitor is
      invited (indeed, obliged) to complete it. Write <em>ocean</em>, and the
      work does not paint an ocean. It summons one hundred and forty-four
      photographs of the ocean from{" "}
      <SiteLink
        href={PEXELS_URL}
        icon="https://static.pexels.com/1/images/meta/pexels-icon.png"
      >
        Pexels
      </SiteLink>
      , a vast public commons of pictures made by strangers, and reduces each
      to a single averaged color: an entire shoreline, an entire afternoon,
      pressed flat into one honest square. The squares then assemble
      themselves, in an order no hand has chosen, within a gilded frame of the
      most venerable kind.
    </p>

    <p>
      What results is a portrait not of the ocean, nor even of a photograph of
      the ocean, but of the ocean as a search engine believes it to be: a
      consensus, a statistical sediment, the median of a million glances. Where
      Magritte parted the image from its object, the artist parts the image
      from itself. <em>Ceci n’est pas une pipe</em>; ceci n’est même pas une
      photo.
    </p>

    <p>
      The gesture arrives at a moment in which the distinction Magritte drew
      has all but dissolved. Images now outnumber the things they depict. They
      are conjured in seconds, in limitless supply, at no apparent cost and
      with ever-diminishing claim on anyone’s belief; one scrolls past more
      oceans in an evening than a sailor might see in a lifetime, and is moved
      by none of them. It is not always clear which of them were ever real, or
      whether the question still matters to anyone but the sea. This is the
      slow souring of the visual commons that the critic Cory Doctorow has
      named, with admirable bluntness, <em>enshittification</em>: abundance
      curdling into noise, the world’s image of itself grown so plentiful that
      it is no longer worth very much.
    </p>

    <p>
      The artist does not lament this abundance so much as frame it, literally
      and lavishly, in gold leaf, and in so doing poses the question our feeds
      would prefer we not ask: when anything can be made, what, precisely, is
      worth making? The answer, the work slyly proposes, may be a small grid of
      averages, offered with a perfectly straight face and the full ceremony of
      the museum.
    </p>

    <p>
      That the frame is ornate and its contents are data is, of course, the
      joke. That the joke lands is the point.
    </p>
  </section>
);

export default ArtistStatement;
