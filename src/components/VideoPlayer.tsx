// src/components/VideoPlayer.tsx
import React, { useEffect, useRef, useState } from "react";

type LessonLike = {
  title: string;
  youtubeUrl?: string;
};

interface Props {
  lesson: LessonLike;
  onComplete: () => void;
  autoPlay?: boolean;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be"))
      return u.pathname.split("/")[1] || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" && parts[1]) return parts[1];
      if (parts[0] === "embed" && parts[1]) return parts[1];
    }
  } catch {}
  return null;
}

const loadYouTubeApi = (): Promise<void> =>
  new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    const existing = document.getElementById("youtube-iframe-api");
    if (!existing) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev && prev();
      resolve();
    };
  });

const VideoPlayer: React.FC<Props> = ({
  lesson,
  onComplete,
  autoPlay = false,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const pollRef = useRef<number | null>(null);
  const completedRef = useRef(false);

  const [isYouTube, setIsYouTube] = useState(false);
  const [ytId, setYtId] = useState<string | null>(null);

  useEffect(() => {
    const id = extractYouTubeId(lesson.youtubeUrl);
    setYtId(id);
    setIsYouTube(Boolean(id));
    completedRef.current = false;
  }, [lesson.youtubeUrl]);

  // --- YouTube
  useEffect(() => {
    if (!isYouTube || !ytId) return;
    let canceled = false;

    async function init() {
      await loadYouTubeApi();
      if (canceled || !wrapperRef.current) return;

      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
      // Limpa o wrapper e cria um container onde o YT vai montar o iframe
      wrapperRef.current.innerHTML = "";
      const host = document.createElement("div");
      host.style.width = "100%";
      host.style.height = "100%";
      host.style.position = "absolute";
      host.style.inset = "0";
      wrapperRef.current.appendChild(host);

      playerRef.current = new window.YT.Player(host, {
        videoId: ytId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          controls: 1,
        },
        events: {
          onReady: (e: any) => {
            if (autoPlay) e.target.playVideo();
          },
          onStateChange: (e: any) => {
            if (e.data === 1) {
              if (pollRef.current) cancelAnimationFrame(pollRef.current);
              const poll = () => {
                try {
                  const cur = e.target.getCurrentTime?.() ?? 0;
                  const dur = e.target.getDuration?.() ?? 0;
                  if (dur > 0) {
                    const pct = cur / dur;
                    if (!completedRef.current && pct >= 0.9) {
                      completedRef.current = true;
                      onComplete();
                    }
                  }
                } catch {}
                pollRef.current = requestAnimationFrame(poll);
              };
              poll();
            } else {
              if (pollRef.current) {
                cancelAnimationFrame(pollRef.current);
                pollRef.current = null;
              }
              if (e.data === 0 && !completedRef.current) {
                completedRef.current = true;
                onComplete();
              }
            }
          },
        },
      });
    }

    init();

    return () => {
      canceled = true;
      if (pollRef.current) {
        cancelAnimationFrame(pollRef.current);
        pollRef.current = null;
      }
      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [isYouTube, ytId, autoPlay, onComplete]);

  // --- MP4 / arquivo direto
  const isFileVideo =
    !isYouTube &&
    lesson.youtubeUrl &&
    /\.(mp4|webm|ogg)(\?|#|$)/i.test(lesson.youtubeUrl);

  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
      {/* Wrapper responsável por forçar o enquadramento perfeito */}
      <div ref={wrapperRef} className="relative w-full aspect-video bg-black">
        {isFileVideo && (
          <video
            key={lesson.youtubeUrl}
            className="absolute inset-0 w-full h-full object-contain"
            // Se quiser preencher cortando as bordas, troque para: object-cover
            src={lesson.youtubeUrl}
            controls
            playsInline
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration > 0) {
                const pct = v.currentTime / v.duration;
                if (!completedRef.current && pct >= 0.9) {
                  completedRef.current = true;
                  onComplete();
                }
              }
            }}
            onEnded={() => {
              if (!completedRef.current) {
                completedRef.current = true;
                onComplete();
              }
            }}
            autoPlay={autoPlay}
          />
        )}

        {/* Quando é YouTube, o iframe é injetado dentro de wrapperRef e já fica absolute inset-0 */}
        {!isYouTube && !isFileVideo && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500">
            Nenhum vídeo disponível para esta aula.
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
