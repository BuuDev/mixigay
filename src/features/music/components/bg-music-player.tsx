"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BGM_DEFAULT_VOLUME, BGM_PAUSE_EVENT, BGM_PREF_KEY, BGM_VOLUME_KEY, isQuietPath, parseBgmPref, parseVolume, type BgmPref } from "../lib/bgm";
import { BGM_ARTIST, BGM_LICENSE, BGM_SOURCE_URL, BGM_TRACKS, defaultTrackIndex, nextIndex, playlistMinutes, trackSrc } from "../lib/bgm-tracks";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage blocked (private mode): behave as a first visit
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // not persisted; the choice still holds for this page view
  }
}

const readPref = (): BgmPref => parseBgmPref(read(BGM_PREF_KEY));

/**
 * "Đài phát thanh Bộ Tộc": a long, looping playlist of chill instrumentals played by a
 * native <audio> element (same-origin files, real volume control, no third-party widget).
 * It opens with Airport Lounge and plays only when the visitor opens the radio or presses
 * play: no autoplay and no "first tap anywhere" start, so the audio file (1–2 MB) is only
 * downloaded by those who want it (ADR-019). play() runs inside that tap, as Safari requires.
 */
export function BgMusicPlayer() {
  const pathname = usePathname();
  const audio = useRef<HTMLAudioElement>(null);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(defaultTrackIndex);
  const [volume, setVolume] = useState(BGM_DEFAULT_VOLUME);
  const track = BGM_TRACKS[idx % BGM_TRACKS.length];

  function start(i = idx) {
    const el = audio.current;
    if (!el) return;
    const want = new URL(trackSrc(BGM_TRACKS[i]), location.href).href;
    if (el.src !== want) el.src = want;
    const v = parseVolume(read(BGM_VOLUME_KEY));
    el.volume = v;
    setVolume(v);
    el.play().catch(() => setPlaying(false)); // blocked (iOS low-power): the play button tries again
  }

  // Walking into a quiet page (/gui-anh-do read on stream, admin, invites) pauses the radio.
  useEffect(() => {
    if (isQuietPath(pathname)) audio.current?.pause();
  }, [pathname]);

  // Another player started: step aside without changing the visitor's preference.
  useEffect(() => {
    const onPause = () => audio.current?.pause();
    window.addEventListener(BGM_PAUSE_EVENT, onPause);
    return () => window.removeEventListener(BGM_PAUSE_EVENT, onPause);
  }, []);

  // Lock-screen / headset controls.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: track.title, artist: BGM_ARTIST, album: "Đài phát thanh Bộ Tộc" });
    navigator.mediaSession.setActionHandler("nexttrack", () => skip());
    navigator.mediaSession.setActionHandler("play", () => start());
    navigator.mediaSession.setActionHandler("pause", () => audio.current?.pause());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);

  function skip() {
    const n = nextIndex(idx);
    setIdx(n);
    start(n);
  }

  function togglePlay() {
    if (playing) {
      audio.current?.pause();
    } else {
      write(BGM_PREF_KEY, "on");
      start();
    }
  }

  function turnOff() {
    audio.current?.pause();
    setOpen(false);
    write(BGM_PREF_KEY, "off");
  }

  function changeVolume(v: number) {
    setVolume(v);
    if (audio.current) audio.current.volume = v;
    write(BGM_VOLUME_KEY, String(v));
  }

  return (
    <div data-bgm-ignore className="td-dock fixed left-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 lg:bottom-4">
      <audio ref={audio} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={skip} onError={() => setPlaying(false)} />
      {open && (
        <div className="mb-2 w-[min(21rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface-raised/95 p-3 shadow-card backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wider text-accent uppercase">Đài phát thanh Bộ Tộc</p>
              <p className="truncate text-sm font-semibold">{track.title}</p>
              <p className="truncate text-[11px] text-muted">
                {BGM_ARTIST} · nhạc chill ~{playlistMinutes()} phút, tự lặp lại
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted hover:text-foreground"
              title="Thu gọn (nhạc vẫn phát)"
            >
              Thu gọn
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="min-h-9 rounded-pill bg-accent px-3 text-xs font-bold text-background hover:brightness-110"
              aria-label={playing ? "Tạm dừng nhạc nền" : "Phát nhạc nền"}
            >
              {playing ? "❚❚ Tạm dừng" : "▶ Phát"}
            </button>
            <button
              type="button"
              onClick={skip}
              className="min-h-9 rounded-pill border border-border bg-background px-3 text-xs font-semibold hover:border-accent"
              aria-label="Bài tiếp theo"
            >
              ⏭ Bài khác
            </button>
            <label className="ml-auto flex items-center gap-1.5 text-[11px] text-muted">
              <span aria-hidden>🔉</span>
              <span className="sr-only">Âm lượng</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => changeVolume(Number(e.target.value))}
                className="w-20 accent-accent"
              />
            </label>
          </div>

          <p className="mt-2 text-[10px] leading-snug text-muted">
            Nhạc: {BGM_ARTIST} (
            <a href={BGM_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              incompetech.com
            </a>
            ), giấy phép{" "}
            <a href={BGM_LICENSE.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              {BGM_LICENSE.name}
            </a>
            .
          </p>

          <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
            <Link href="/nhac" className="text-accent hover:underline" onClick={() => setOpen(false)}>
              Nghe nhạc nịnh của Bộ Tộc →
            </Link>
            <button type="button" onClick={turnOff} className="text-live-text hover:underline">
              Tắt hẳn nhạc
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          // Opening the radio is itself a gesture: start it unless the visitor turned it off.
          if (!open && !playing && readPref() !== "off") start();
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        aria-label={playing ? `Đang phát nhạc nền: ${track.title}` : "Mở đài phát thanh Bộ Tộc"}
        className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-pill border border-border bg-surface-raised/95 p-2.5 text-xs font-semibold shadow-card backdrop-blur transition-colors hover:border-accent lg:px-3.5 lg:py-2"
      >
        <span
          aria-hidden
          className={`flex size-5 items-center justify-center rounded-pill text-xs ${playing ? "bg-accent text-background" : "bg-accent/15 text-accent"}`}
        >
          ♪
        </span>
        {/* Below lg the live dock shares the bottom edge: show the note icon only. */}
        <span aria-hidden className="hidden lg:inline">
          {playing ? "Đang phát nhạc chill" : "Nhạc nền Bộ Tộc"}
        </span>
      </button>
    </div>
  );
}
