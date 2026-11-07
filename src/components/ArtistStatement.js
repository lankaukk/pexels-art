import React from "react";
import SmudgedSpoiler from "./SmudgedSpoiler";

const LACMA_URL = "https://collections.lacma.org/object/31931";
const PEXELS_URL = "https://www.pexels.com/api/";
const DOCUMENTARY_URL = "https://www.imdb.com/title/tt45368240/";

// a link with the site's own favicon in a small circle just before it
const SiteLink = ({ href, icon, children }) => (
  <a className="site-link" href={href} target="_blank" rel="noopener noreferrer">
    <img className="site-icon" src={icon} alt="" width="16" height="16" />
    {children}
  </a>
);

// a link led by a tiny copy of the artwork it names, line-high at its own 4:3 shape
const ArtworkLink = ({ href, image, children }) => (
  <a className="site-link" href={href} target="_blank" rel="noopener noreferrer">
    <img className="artwork-thumb" src={image} alt="" width="20" height="15" />
    {children}
  </a>
);

// the wall text, below the artwork
const ArtistStatement = () => (
  <section className="statement" aria-label="About the work">
    <p>
      In 1929, René Magritte painted a pipe. Beneath it he wrote something so
      literal that it will confuse you if you aren’t prepared to philosophize.
      “This is not a pipe.” But it is, isn’t it? Looks just like one. But guess
      what, you can’t smoke it. Because you can’t smoke a painting. Ha. This
      is{" "}
      <ArtworkLink href={LACMA_URL} image="treachery-of-images.jpg">
        The Treachery of Images
      </ArtworkLink>
      , and a century later I’m still afflicted by this wildly unfair truth: a
      picture of a thing is never the thing. And everywhere I scroll these days
      reminds me of it.
    </p>

    <p>
      No one knows what’s real anymore. Type anything you want into this
      caption, and 144 strangers’ photographs are summoned from{" "}
      <SiteLink
        href={PEXELS_URL}
        icon="https://static.pexels.com/1/images/meta/pexels-icon.png"
      >
        Pexels
      </SiteLink>
      . Each one is rendered as a square in its average color, like a memory
      you no longer have the storage to load.
    </p>

    <p>
      This is image gen without AI. It’s color association without copying.
      (But the images on Pexels are free to use anyway.) These are real photos
      by real people, collaged, recycled, and averaged with plain math.
    </p>

    <p>
      Imagine anything, smudge it, paint over it, forget about it. Nothing is
      precious. Nothing is original.
    </p>

    <h2 className="statement-heading" lang="fr">Ceci n’est pas la vérité</h2>

    <p>
      I recently met someone who genuinely did not believe the Earth is round.
      He’d heard some{" "}
      <SiteLink
        href="https://www.youtube.com/watch?v=ecfqbWCiZSA&t=11s"
        icon="https://www.youtube.com/favicon.ico"
      >
        theory
      </SiteLink>{" "}
      that Nikon’s super-zoom cameras can see things that should be hidden
      behind the curve of the Earth, so the curve must not exist. This is 100% false, but I was stunned to
      meet a flat-earther in real life, and that impressed me! At the risk of
      sounding snobbish, I really live in an educational bubble.
    </p>

    <p>
      More recently, I went to see Nathan Fielder’s documentary about Elizabeth
      Holmes,{" "}
      <SiteLink
        href={DOCUMENTARY_URL}
        icon="https://www.imdb.com/favicon.ico"
      >
        You Can See Everything
      </SiteLink>
      . I watched every detail, excitedly trying to form my own opinion on the
      controversy. Partway through, Nathan brings in another perspective from
      Amanda Seyfried, which reframes the theories he’s been building. (A really
      cool move for a documentary, by the way.)
    </p>

    <p>
      Spoiler alert:{" "}
      <SmudgedSpoiler
        text={
          "In the end, Amanda essentially asks Nathan whether his own " +
          "subconscious feelings toward Elizabeth are clouding his ability to " +
          "decide, objectively, whether she’s guilty."
        }
      />{" "}
      I was gagged! There I sat, relating to this clearly autistic woman,
      empathizing with her being so literal that I’d decided it made her
      deceptive only by accident. I,
      too, let my feelings shape what I thought I saw. And that is inherently
      human.
    </p>

    <p>
      Whether it’s an algorithm, our emotions, a camera lens, or the limits of
      how much detail technology can capture, something always stands between
      us and the thing itself. So who knows what’s real anymore? Even the
      concept of metadata was invented by people with a limited understanding
      of what truth even is.
    </p>

    <p>
      Maybe that’s why this little frame feels honest to me. It never pretends
      to be the ocean. It’s 144 strangers’ glances, averaged, and at least it
      admits it.
    </p>
  </section>
);

export default ArtistStatement;
