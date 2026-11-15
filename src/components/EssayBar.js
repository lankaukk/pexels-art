import React, { useEffect, useRef, useState } from "react";

// A thin row of grey outline icons under the statement's first paragraph:
// listen, like, and share. While the essay is being read aloud the row sticks
// to the top of the screen, and the word being spoken is highlighted.
//
// Listening uses the browser's built-in voice, a sentence at a time: Chrome
// stops long passages partway. The bar shows the time spoken so far; browsers
// don't say how long speech will take.

const SPOILER_EVENT = "spoiler:reveal"; // SmudgedSpoiler un-smudges on this
const LIKED_KEY = "notapipe:liked";

// the most natural-sounding English voice this device offers
const pickVoice = () => {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  const preferred = [/Samantha/, /Google US English/, /Natural/, /Ava/, /Allison/, /Daniel/];
  for (const pattern of preferred) {
    const match = voices.find((v) => pattern.test(v.name));
    if (match) return match;
  }
  return voices.find((v) => v.default) || voices[0] || null;
};

// A paragraph's text with its whitespace collapsed, plus where each character
// of it lives on the page, so a spot in the spoken text can be highlighted
const readParagraph = (p) => {
  let text = "";
  const at = []; // at[i] = [text node, offset] for text[i]
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const value = node.nodeValue;
    for (let i = 0; i < value.length; i += 1) {
      const space = /\s/.test(value[i]);
      if (space && (text === "" || text.endsWith(" "))) continue;
      text += space ? " " : value[i];
      at.push([node, i]);
    }
  }
  return { text, at };
};

// the statement and essay's paragraphs, as sentences. The caption above the
// artwork and the essay's French heading aren't read: browsers wouldn't switch
// to a French voice mid-reading, and the English one mangles them
const gatherSentences = (section) => {
  const blocks = section.querySelectorAll("p:not(.statement-date)");
  return [...blocks].flatMap((p) => {
    const hasSpoiler = Boolean(p.querySelector(".spoiler"));
    const { text, at } = readParagraph(p);
    return [...text.matchAll(/[^.!?]+[.!?)"”’]*\s*/g)]
      .map((match, i) => {
        const lead = match[0].length - match[0].trimStart().length;
        return {
          text: match[0].trim(),
          start: match.index + lead, // where it begins in the paragraph's text
          at,
          // reveal the smudged spoiler as its paragraph starts being read
          revealsSpoiler: hasSpoiler && i === 0,
        };
      })
      .filter((s) => s.text);
  });
};

// a page range over part of a sentence, by character positions within it
const rangeOf = (sentence, from, to) => {
  const a = sentence.at[sentence.start + from];
  const b = sentence.at[Math.min(sentence.start + to, sentence.at.length) - 1];
  if (!sentence.at.length) return null;
  if (!a || !b) return null;
  const range = document.createRange();
  range.setStart(a[0], a[1]);
  range.setEnd(b[0], b[1] + 1);
  return range;
};

// CSS Custom Highlights mark text without changing the page's markup
const canHighlight =
  typeof window !== "undefined" && window.CSS && window.CSS.highlights && window.Highlight;
const highlight = (name, range) => {
  if (!canHighlight) return;
  if (range) window.CSS.highlights.set(name, new window.Highlight(range));
  else window.CSS.highlights.delete(name);
};

// keeps the line being read on screen, below the stuck bar
const keepInView = (range, bar) => {
  if (!range) return;
  const rect = range.getBoundingClientRect();
  const top = (bar ? bar.getBoundingClientRect().bottom : 0) + 16;
  if (rect.top < top || rect.bottom > window.innerHeight - 48) {
    window.scrollBy({ top: rect.top - window.innerHeight / 3, behavior: "smooth" });
  }
};

// outline icons, drawn at one line weight
const Icon = ({ name }) => (
  <svg className="bar-icon" viewBox="0 0 24 24" aria-hidden="true">
    {name === "play" && <path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.2 4.1a.8.8 0 0 0-1.2.7z" />}
    {name === "pause" && (
      <>
        <rect x="6" y="4.5" width="3.5" height="15" rx="1" />
        <rect x="14.5" y="4.5" width="3.5" height="15" rx="1" />
      </>
    )}
    {name === "stop" && <rect x="5.5" y="5.5" width="13" height="13" rx="2" />}
    {name === "heart" && (
      <path d="M12 20.3s-7.8-4.7-7.8-10.4A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 7.8 2.7c0 5.7-7.8 10.4-7.8 10.4z" />
    )}
    {name === "share" && (
      <>
        <path d="M12 3.5v11" />
        <path d="M8 7.3l4-3.8 4 3.8" />
        <path d="M7.5 10.5H6.3a1.3 1.3 0 0 0-1.3 1.3v7.4a1.3 1.3 0 0 0 1.3 1.3h11.4a1.3 1.3 0 0 0 1.3-1.3v-7.4a1.3 1.3 0 0 0-1.3-1.3h-1.2" />
      </>
    )}
    {name === "check" && <path d="M5 12.5l4.5 4.5L19 7.5" />}
    {name === "link" && (
      <>
        <path d="M10 14a4 4 0 0 0 5.7 0l3.2-3.2a4 4 0 0 0-5.7-5.7l-1.1 1.1" />
        <path d="M14 10a4 4 0 0 0-5.7 0l-3.2 3.2a4 4 0 0 0 5.7 5.7l1.1-1.1" />
      </>
    )}
  </svg>
);

// Once the reader scrolls on their own, the page stops following along until
// the next time Listen is started. Wheel, touch and keys only come from the
// person; the page's own smooth scrolling doesn't fire them
let following = true;
const SCROLL_KEYS = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
const stopFollowing = (event) => {
  if (event.type === "keydown" && !SCROLL_KEYS.includes(event.key)) return;
  following = false;
};
const watchScrolling = (on) => {
  following = true;
  const method = on ? "addEventListener" : "removeEventListener";
  ["wheel", "touchmove", "keydown"].forEach((type) =>
    window[method](type, stopFollowing, { passive: true })
  );
};

const formatTime = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const readLiked = () => {
  try {
    return localStorage.getItem(LIKED_KEY) === "1";
  } catch {
    return false;
  }
};

// copies text, with the older select-and-copy way where the clipboard API is
// blocked (some embedded browsers)
const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(field);
    field.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    field.remove();
    return ok;
  }
};

// phones get the share sheet; elsewhere the button copies the link
const sharesNatively = () =>
  typeof navigator !== "undefined" &&
  Boolean(navigator.share) &&
  window.matchMedia("(pointer: coarse)").matches;

const EssayBar = () => {
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  const [state, setState] = useState("idle"); // idle | playing | paused
  const [progress, setProgress] = useState(0); // 0..1, by characters read
  const [elapsed, setElapsed] = useState(0); // seconds actually spoken
  const [liked, setLiked] = useState(readLiked);
  const [copied, setCopied] = useState(false);
  const reading = useRef(null);
  const barRef = useRef(null);

  const clearHighlights = () => {
    highlight("spoken-sentence", null);
    highlight("spoken-word", null);
  };

  // asks for the voice list early, so it's loaded by the time Listen is pressed
  useEffect(() => {
    if (canSpeak) window.speechSynthesis.getVoices();
  }, [canSpeak]);

  useEffect(
    () => () => {
      if (canSpeak) window.speechSynthesis.cancel();
      watchScrolling(false);
      clearHighlights();
    },
    [canSpeak]
  );

  // spoken time, counted only while actually playing (paused time doesn't count)
  const elapsedRef = useRef(0);
  useEffect(() => {
    if (state !== "playing") return undefined;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      elapsedRef.current += (now - last) / 1000;
      last = now;
      setElapsed(elapsedRef.current);
    }, 250);
    return () => clearInterval(timer);
  }, [state]);

  // while stuck to the bottom of the screen, the bar drops its bottom rule. It's
  // stuck there when it sits higher than its place right after the paragraph
  const [stuckBottom, setStuckBottom] = useState(false);
  useEffect(() => {
    if (state === "idle") {
      setStuckBottom(false);
      return undefined;
    }
    const check = () => {
      const bar = barRef.current;
      const before = bar && bar.previousElementSibling;
      if (!before) return;
      const gap = parseFloat(getComputedStyle(before).marginBottom) || 0;
      const place = before.getBoundingClientRect().bottom + gap;
      setStuckBottom(bar.getBoundingClientRect().top < place - 1);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [state]);

  const rateRef = useRef(1);
  const [rate, setRate] = useState(1);


  const start = () => {
    const section = barRef.current.closest(".statement");
    const sentences = gatherSentences(section);
    const totalChars = sentences.reduce((sum, s) => sum + s.text.length + 1, 0);
    reading.current = {
      sentences,
      totalChars,
      done: 0,
      index: 0,
    };
    elapsedRef.current = 0;
    setProgress(0);
    setElapsed(0);
    window.speechSynthesis.cancel();
    watchScrolling(true);
    speakNext();
    setState("playing");
  };

  const finish = () => {
    watchScrolling(false);
    reading.current = null;
    clearHighlights();
    setState("idle");
  };

  const speakNext = () => {
    const r = reading.current;
    if (!r) return;
    if (r.index >= r.sentences.length) {
      setProgress(1);
      finish();
      return;
    }
    const sentence = r.sentences[r.index];
    if (sentence.revealsSpoiler) window.dispatchEvent(new Event(SPOILER_EVENT));
    // the whole sentence is marked faintly, in case this voice doesn't report
    // its words; the word being spoken is marked on top as it's reached
    const sentenceRange = rangeOf(sentence, 0, sentence.text.length);
    highlight("spoken-sentence", sentenceRange);
    highlight("spoken-word", null);
    if (following) keepInView(sentenceRange, barRef.current);
    // a jump elsewhere (seek) retires this utterance, so its end is ignored
    const turn = (r.turn = (r.turn || 0) + 1);

    const utterance = new SpeechSynthesisUtterance(sentence.text);
    // chosen as each sentence is spoken: browsers load their voice list late,
    // and it may still have been empty when Listen was pressed
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    // a speed change applies from the next sentence: a voice can't change speed mid-sentence
    utterance.rate = rateRef.current;
    utterance.onboundary = (event) => {
      if (reading.current !== r || r.turn !== turn || seekingRef.current) return;
      setProgress((r.done + event.charIndex) / r.totalChars);
      if (event.name && event.name !== "word") return;
      // some voices leave out the word's length; take it from the text
      const rest = sentence.text.slice(event.charIndex);
      const length = event.charLength || (rest.match(/^\S+/) || [""])[0].length;
      if (length) highlight("spoken-word", rangeOf(sentence, event.charIndex, event.charIndex + length));
    };
    utterance.onend = () => {
      if (reading.current !== r || r.turn !== turn) return; // stopped, restarted or moved
      const chars = sentence.text.length + 1;
      r.done += chars;
      r.index += 1;
      setProgress(r.done / r.totalChars);
      speakNext();
    };
    window.speechSynthesis.speak(utterance);
  };

  // Moving around in the reading: to the start of the sentence at a spot on the
  // progress line (0..1). Speech can only start at a sentence, not mid-word
  const seekingRef = useRef(false);
  const seekTo = (fraction) => {
    const r = reading.current;
    if (!r) return;
    const target = Math.max(0, Math.min(1, fraction)) * r.totalChars;
    let done = 0;
    let index = 0;
    while (index < r.sentences.length - 1 && done + r.sentences[index].text.length + 1 <= target) {
      done += r.sentences[index].text.length + 1;
      index += 1;
    }
    // the clock follows along: at the pace spoken so far once there's enough
    // of it to go on, before that at a typical pace (about 14 characters a
    // second at 1x)
    const secondsPerChar =
      r.done > 400 ? elapsedRef.current / r.done : 1 / (14 * rateRef.current);
    elapsedRef.current = secondsPerChar * done;
    setElapsed(elapsedRef.current);
    // jumping past the spoiler's paragraph reveals it, as reading it would
    if (r.sentences.slice(0, index + 1).some((x) => x.revealsSpoiler)) {
      window.dispatchEvent(new Event(SPOILER_EVENT));
    }
    r.index = index;
    r.done = done;
    setProgress(done / r.totalChars);
    r.turn = (r.turn || 0) + 1; // retires the sentence being spoken
    window.speechSynthesis.cancel();
    // a jump while paused plays from the new spot
    window.speechSynthesis.resume();
    following = true;
    speakNext();
    setState("playing");
  };

  // click or drag along the progress line; the line follows the pointer, and
  // the reading jumps there when it's let go
  const progressRef = useRef(null);
  const fractionAt = (event) => {
    const box = progressRef.current.getBoundingClientRect();
    return (event.clientX - box.left) / box.width;
  };
  const startSeek = (event) => {
    if (!reading.current) return;
    event.preventDefault();
    seekingRef.current = true;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // not a real pointer
    }
    setProgress(Math.max(0, Math.min(1, fractionAt(event))));
  };
  const moveSeek = (event) => {
    if (seekingRef.current) setProgress(Math.max(0, Math.min(1, fractionAt(event))));
  };
  const endSeek = (event) => {
    if (!seekingRef.current) return;
    seekingRef.current = false;
    seekTo(fractionAt(event));
  };
  // arrow keys step a sentence back or forward
  const seekByKey = (event) => {
    const r = reading.current;
    if (!r) return;
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = Math.max(0, Math.min(r.sentences.length - 1, r.index + step));
    const done = r.sentences.slice(0, index).reduce((n, x) => n + x.text.length + 1, 0);
    seekTo((done + 0.5) / r.totalChars);
  };

  const toggleListening = () => {
    if (state === "idle") start();
    else if (state === "playing") {
      window.speechSynthesis.pause();
      setState("paused");
    } else {
      window.speechSynthesis.resume();
      setState("playing");
    }
  };

  const stop = () => {
    finish();
    window.speechSynthesis.cancel();
    setProgress(0);
    setElapsed(0);
  };

  const changeRate = (event) => {
    const next = parseFloat(event.target.value);
    rateRef.current = next;
    setRate(next);
  };

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    try {
      if (next) localStorage.setItem(LIKED_KEY, "1");
      else localStorage.removeItem(LIKED_KEY);
    } catch {
      // private browsing: the heart still fills for this visit
    }
    // counted, with when and roughly where (netlify/functions/likes.mjs)
    fetch("/.netlify/functions/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liked: next }),
      keepalive: true,
    }).catch(() => {});
  };

  const share = async () => {
    const url = window.location.origin + window.location.pathname;
    if (sharesNatively()) {
      try {
        await navigator.share({ title: document.title, url });
      } catch {
        // closed the share sheet
      }
      return;
    }
    if (await copyText(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const active = state !== "idle";
  const native = sharesNatively();
  return (
    <div
      className={["essay-bar", active && "is-listening", stuckBottom && "is-stuck-bottom"]
        .filter(Boolean)
        .join(" ")}
      ref={barRef}
    >
      {canSpeak && (
        <div className="bar-listen">
          <button
            type="button"
            className="bar-button bar-play"
            onClick={toggleListening}
            aria-label={state === "idle" ? undefined : state === "playing" ? "Pause" : "Resume"}
          >
            {/* play and pause are both drawn, and cross-fade as they swap */}
            <span className="bar-play-icons">
              <span className={state === "playing" ? "" : "is-shown"}>
                <Icon name="play" />
              </span>
              <span className={state === "playing" ? "is-shown" : ""}>
                <Icon name="pause" />
              </span>
            </span>
            <span className="bar-label" aria-hidden={active}>
              Listen to a robot read my diary
            </span>
          </button>
          {/* always on the page, so they can slide in and out; hidden ones
              can't be tabbed to */}
          <div className="bar-controls" aria-hidden={!active}>
            <button
              type="button"
              className="bar-button"
              onClick={stop}
              aria-label="Stop"
              tabIndex={active ? 0 : -1}
              style={{ "--i": 0 }}
            >
              <Icon name="stop" />
            </button>
            <span
              className="bar-progress"
              ref={progressRef}
              role="slider"
              tabIndex={active ? 0 : -1}
              aria-label="Position in the reading"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              aria-valuetext={`${Math.round(progress * 100)}%`}
              onPointerDown={startSeek}
              onPointerMove={moveSeek}
              onPointerUp={endSeek}
              onPointerCancel={endSeek}
              onKeyDown={seekByKey}
              style={{ "--i": 1, "--at": progress }}
            >
              <span className="bar-progress-fill" style={{ width: `${progress * 100}%` }} />
              <span className="bar-progress-thumb" />
            </span>
            <span className="bar-time" style={{ "--i": 2 }}>
              {formatTime(elapsed)}
            </span>
            <select
              className="bar-rate"
              value={rate}
              onChange={changeRate}
              aria-label="Playback speed"
              tabIndex={active ? 0 : -1}
              style={{ "--i": 3 }}
            >
              {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                <option key={r} value={r}>
                  {r}×
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div className="bar-end">
        <button
          type="button"
          className={liked ? "bar-button bar-heart is-liked" : "bar-button bar-heart"}
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label="Like"
        >
          <Icon name="heart" />
        </button>
        <button
          type="button"
          className="bar-button"
          onClick={share}
          aria-label={native ? "Share" : copied ? "Link copied" : "Copy link"}
          title={native ? "Share" : copied ? "Link copied" : "Copy link"}
        >
          {/* a checkmark for a moment after copying */}
          <Icon name={native ? "share" : copied ? "check" : "link"} />
        </button>
      </div>
    </div>
  );
};

export default EssayBar;
