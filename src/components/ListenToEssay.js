import React, { useEffect, useRef, useState } from "react";

// Reads the statement and essay aloud with the browser's built-in voice.
// The text is spoken a sentence at a time: Chrome stops long passages partway,
// and per-sentence progress keeps the bar and time honest. Browsers don't say
// how long speech will take, so the total is an estimate that settles as the
// reading goes on.

const WORDS_PER_MINUTE = 165; // a starting guess at the voice's pace
const SPOILER_EVENT = "spoiler:reveal"; // SmudgedSpoiler un-smudges on this

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

// the paragraphs of the statement and essay, as sentences to speak
const gatherSentences = (section) =>
  [...section.querySelectorAll("p:not(.statement-date)")].flatMap((p) => {
    const hasSpoiler = Boolean(p.querySelector(".spoiler"));
    const text = p.innerText.replace(/\s+/g, " ").trim();
    const sentences = text.match(/[^.!?]+[.!?)"”’]*\s*/g) || [text];
    return sentences.map((sentence, i) => ({
      text: sentence.trim(),
      // reveal the smudged spoiler as its paragraph starts being read
      revealsSpoiler: hasSpoiler && i === 0,
    }));
  });

const formatTime = (seconds) => {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const ListenToEssay = () => {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [state, setState] = useState("idle"); // idle | playing | paused
  const [progress, setProgress] = useState(0); // 0..1, by characters read
  const [elapsed, setElapsed] = useState(0); // seconds actually spoken
  const [total, setTotal] = useState(0); // estimated seconds for the whole essay
  const reading = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => () => supported && window.speechSynthesis.cancel(), [supported]);

  // count spoken time only while actually playing
  useEffect(() => {
    if (state !== "playing") return undefined;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      setElapsed((e) => e + (now - last) / 1000);
      last = now;
    }, 250);
    return () => clearInterval(timer);
  }, [state]);

  const start = () => {
    const section = buttonRef.current.closest(".statement");
    const sentences = gatherSentences(section);
    const totalChars = sentences.reduce((sum, s) => sum + s.text.length + 1, 0);
    const words = sentences.reduce((sum, s) => sum + s.text.split(/\s+/).length, 0);
    const voice = pickVoice();
    reading.current = { sentences, totalChars, done: 0, index: 0, voice, startedAt: null };
    setProgress(0);
    setElapsed(0);
    setTotal((words / WORDS_PER_MINUTE) * 60);
    window.speechSynthesis.cancel();
    speakNext();
    setState("playing");
  };

  const speakNext = () => {
    const r = reading.current;
    if (!r) return;
    if (r.index >= r.sentences.length) {
      reading.current = null;
      setProgress(1);
      setState("idle");
      return;
    }
    const sentence = r.sentences[r.index];
    if (sentence.revealsSpoiler) window.dispatchEvent(new Event(SPOILER_EVENT));
    const utterance = new SpeechSynthesisUtterance(sentence.text);
    if (r.voice) utterance.voice = r.voice;
    utterance.onboundary = (event) => {
      setProgress((r.done + event.charIndex) / r.totalChars);
    };
    utterance.onend = () => {
      if (reading.current !== r) return; // stopped or restarted
      r.done += sentence.text.length + 1;
      r.index += 1;
      const fraction = r.done / r.totalChars;
      setProgress(fraction);
      // refine the total from the pace so far
      setElapsed((e) => {
        if (fraction > 0.05) setTotal(e / fraction);
        return e;
      });
      speakNext();
    };
    window.speechSynthesis.speak(utterance);
  };

  const toggle = () => {
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
    reading.current = null;
    window.speechSynthesis.cancel();
    setState("idle");
    setProgress(0);
    setElapsed(0);
  };

  if (!supported) return null;

  const active = state !== "idle";
  return (
    <div className={active ? "listen is-active" : "listen"}>
      <button type="button" className="listen-button" onClick={toggle} ref={buttonRef}>
        <span className="listen-icon" aria-hidden="true">
          {state === "playing" ? "❚❚" : "▶"}
        </span>
        {state === "idle" ? "Listen to this essay" : state === "playing" ? "Pause" : "Resume"}
      </button>
      {active && (
        <>
          <span
            className="listen-progress"
            role="progressbar"
            aria-label="Listening progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <span className="listen-progress-fill" style={{ width: `${progress * 100}%` }} />
          </span>
          <span className="listen-time">
            {formatTime(elapsed)} / ~{formatTime(Math.max(total, elapsed))}
          </span>
          <button type="button" className="listen-stop" onClick={stop} aria-label="Stop">
            ■
          </button>
        </>
      )}
    </div>
  );
};

export default ListenToEssay;
