import React from "react";

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
      Imagine anything, smudge it, forget about it. Nothing is precious. Frame
      whatever you want.
    </p>

    <h2 className="statement-heading">Does a primary source even exist?</h2>

    <p>
      I recently met someone who genuinely does not believe the Earth is round.
      His evidence was a theory he’d heard: that Nikon cameras distort what you
      see through them, and can’t zoom far enough into the distance to show
      anything disappearing over the horizon. He is 100% wrong. But what
      surprised me more than his theory was my own surprise. It showed me just
      how snug my educational bubble really is.
    </p>

    <p>
      Then, the other night, I went to see Nathan Fielder and Lance Oppenheim’s
      documentary about Elizabeth Holmes,{" "}
      <SiteLink
        href={DOCUMENTARY_URL}
        icon="https://www.imdb.com/favicon.ico"
      >
        You Can See Everything
      </SiteLink>
      . I watched every detail, eagerly trying to form my own opinion on the
      whole controversy. Partway through, Nathan brings in another perspective,
      Amanda Seyfried’s, which reframes the theories he’s been building. (A
      really cool move for a documentary, by the way.)
    </p>

    <p>
      Spoiler alert: near the end, Amanda essentially asks Nathan whether his
      own subconscious feelings toward Elizabeth are clouding his ability to
      decide, objectively, whether she’s guilty. I was gagged. There I sat,
      relating to Elizabeth, empathizing with how literal she seemed. She was so
      literal that I’d decided it made her deceptive only by accident, though
      still in an awfully harmful way. I had let my feelings shape what I
      thought I saw, too.
    </p>

    <p>
      Whether it’s an algorithm, our emotions, a camera lens, or the limits of
      how much detail technology can capture, something always stands between
      us and the thing itself. So who’s to say anything is a primary source
      anymore? Even metadata, the data meant to tell the truth about our data,
      was invented by people with a limited understanding of what truth even
      is.
    </p>

    <p>
      Maybe that’s why this little frame feels honest to me. It never pretends
      to be the ocean. It’s 144 strangers’ glances, averaged, and at least it
      admits it.
    </p>
  </section>
);

export default ArtistStatement;
