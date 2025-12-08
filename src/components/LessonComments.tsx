// src/components/LessonComments.tsx
import React, { useEffect, useState } from "react";
import { Send, Trash2, MessageSquare, User as UserIcon } from "lucide-react";
import { DataService } from "../services/dataService";
import { UserRole, Comment } from "../types";

type CurrentUser = {
  id: string;
  name: string;
  role: UserRole;
} | null;

interface LessonCommentsProps {
  lessonId: string; // use SEMPRE o ID da lesson
  currentUser: CurrentUser;
}

export const LessonComments: React.FC<LessonCommentsProps> = ({
  lessonId,
  currentUser,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!lessonId) return;
    DataService.getLessonComments(lessonId).then(setComments);
    setNewComment("");
  }, [lessonId]);

  const handlePost = async () => {
    if (!newComment.trim() || !currentUser) return;
    const comment = await DataService.addLessonComment(
      lessonId,
      currentUser.id,
      currentUser.name,
      newComment
    );
    setComments((prev) => [comment, ...prev]);
    setNewComment("");
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) return;
    if (window.confirm("Tem certeza que deseja excluir este comentário?")) {
      // otimista
      setComments((prev) => prev.filter((c) => c.id !== id));
      try {
        await DataService.deleteLessonComment(id);
      } catch (err) {
        console.error(err);
        // rollback simples
        DataService.getLessonComments(lessonId).then(setComments);
      }
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700/50 animate-in fade-in slide-in-from-bottom-2">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
        <MessageSquare size={20} className="text-blue-500" />
        Dúvidas e Comentários
      </h3>

      {/* caixa de novo comentário */}
      <div className="flex gap-4 mb-8">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold flex-shrink-0">
          {(currentUser?.name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                currentUser
                  ? "Escreva um comentário ou dúvida..."
                  : "Entre para comentar…"
              }
              disabled={!currentUser}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-slate-700 dark:text-slate-200 h-24 transition-all disabled:opacity-60"
            />
            <button
              onClick={handlePost}
              disabled={!newComment.trim() || !currentUser}
              className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              title={currentUser ? "Postar" : "Faça login para comentar"}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* lista de comentários */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-slate-400 text-center text-sm italic py-4">
            Seja o primeiro a comentar nesta aula!
          </p>
        ) : (
          comments.map((comment) => {
            const isAuthor = currentUser?.id === comment.userId;
            const isAdmin = currentUser?.role === UserRole.ADMIN;
            const date = new Date(comment.createdAt);

            return (
              <div key={comment.id} className="flex gap-4 group">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 flex-shrink-0">
                  <UserIcon size={20} />
                </div>
                <div className="flex-1 bg-slate-50/50 dark:bg-slate-700/20 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                        {comment.userName}
                      </h4>
                      <span className="text-xs text-slate-400">
                        {date.toLocaleDateString()} às{" "}
                        {date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {(isAuthor || isAdmin) && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                        title="Excluir comentário"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
