// src/components/LessonRating.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { DataService } from "../services/dataService";
import { supabase } from "../services/supabase";

type RatingStats = { average: number; count: number; userRating: number };

interface LessonRatingProps {
  /** UUID da lesson (obrigatório) */
  lessonId: string;
  /** UUID do usuário logado; se não vier, mostra leitura-only */
  currentUserId?: string;
  /** classe extra opcional */
  className?: string;
}

export const LessonRating: React.FC<LessonRatingProps> = ({
  lessonId,
  currentUserId,
  className = "",
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [stats, setStats] = useState<RatingStats>({
    average: 0,
    count: 0,
    userRating: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const canRate = useMemo(() => Boolean(currentUserId), [currentUserId]);

  // Carrega estatísticas
  useEffect(() => {
    let cancel = false;

    async function load() {
      setIsLoading(true);
      setErr(null);
      try {
        const res = await DataService.getLessonRating(
          lessonId,
          currentUserId || ""
        );
        if (!cancel) {
          setStats(res);
          setHoverRating(0);
        }
      } catch (e: any) {
        if (!cancel) setErr(e?.message || "Erro ao carregar avaliações");
      } finally {
        if (!cancel) setIsLoading(false);
      }
    }

    if (lessonId) load();
    return () => {
      cancel = true;
    };
  }, [lessonId, currentUserId]);

  // Realtime: atualiza quando qualquer avaliação dessa lesson mudar
  useEffect(() => {
    if (!lessonId) return;

    const channel = supabase
      .channel(`lesson_rating_${lessonId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lesson_ratings",
          filter: `lesson_id=eq.${lessonId}`,
        },
        async () => {
          try {
            const res = await DataService.getLessonRating(
              lessonId,
              currentUserId || ""
            );
            setStats(res);
          } catch {
            /* ignora erros de refresh */
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId, currentUserId]);

  // Clicar em estrela
  const handleRate = async (rating: number) => {
    if (!canRate) return;
    try {
      const newStats = await DataService.rateLesson(
        lessonId,
        currentUserId!,
        rating
      );
      setStats(newStats);
    } catch (e: any) {
      setErr(e?.message || "Erro ao avaliar");
    }
  };

  if (isLoading) {
    return (
      <div
        className={`h-6 w-36 bg-slate-100 dark:bg-slate-700 rounded animate-pulse ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label="Avaliação"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = hoverRating
            ? star <= hoverRating
            : star <= stats.userRating;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={stats.userRating === star}
              aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
              onMouseEnter={() => canRate && setHoverRating(star)}
              onMouseLeave={() => canRate && setHoverRating(0)}
              onClick={() => canRate && handleRate(star)}
              disabled={!canRate}
              className="focus:outline-none transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
              title={canRate ? `Avaliar ${star}` : "Entre para avaliar"}
            >
              <Star
                size={20}
                className={
                  filled
                    ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                    : "text-slate-300 dark:text-slate-600"
                }
              />
            </button>
          );
        })}
      </div>

      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
          {stats.average.toFixed(1)}
        </span>
        <span>({stats.count} avaliações)</span>
      </div>

      {err && (
        <span className="text-xs text-red-500" role="status">
          {err}
        </span>
      )}
    </div>
  );
};

export default LessonRating;
