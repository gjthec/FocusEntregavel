import React, { useState, useEffect } from "react";
import {
  Users,
  MessageSquare,
  Heart,
  Share2,
  MoreHorizontal,
  Image as ImageIcon,
  FileText,
  Smile,
  Send,
  Info,
  CheckCircle2,
  ArrowLeft,
  CornerDownRight,
  X,
} from "lucide-react";
import { AuthService } from "../services/authService";
import { DataService } from "../services/dataService";
import { CommunityComment, CommunityPost, PlanTier } from "../types";

export const Community: React.FC = () => {
  const user = AuthService.getCurrentUser();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [loading, setLoading] = useState(true);

  // Detail View State
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<CommunityComment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (selectedPostId) {
      loadComments(selectedPostId);
    }
  }, [selectedPostId]);

  const loadPosts = async () => {
    try {
      const data = await DataService.getCommunityPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const comments = await DataService.getPostComments(postId);
      setPostComments(comments);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim()) return;

    try {
      const newPost = await DataService.createCommunityPost(
        user.id,
        user.name,
        user.plan,
        newPostContent
      );
      setPosts([newPost, ...posts]);
      setNewPostContent("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateComment = async () => {
    if (!user || !newCommentContent.trim() || !selectedPostId) return;

    try {
      const newComment = await DataService.addPostComment(
        selectedPostId,
        user.id,
        user.name,
        newCommentContent,
        replyingTo || undefined
      );
      setPostComments([...postComments, newComment]);
      setNewCommentContent("");
      setReplyingTo(null);
      setPosts(
        posts.map((p) =>
          p.id === selectedPostId
            ? { ...p, commentsCount: p.commentsCount + 1 }
            : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    // Optimistic update
    const hasLiked = post.likedBy.includes(user.id);
    const updatedLikedBy = hasLiked
      ? post.likedBy.filter((id) => id !== user.id)
      : [...post.likedBy, user.id];
    const updatedLikes = hasLiked
      ? Math.max(0, post.likes - 1)
      : post.likes + 1;

    setPosts(
      posts.map((p) =>
        p.id === postId
          ? { ...p, likes: updatedLikes, likedBy: updatedLikedBy }
          : p
      )
    );

    try {
      await DataService.toggleLikePost(
        postId,
        user.id,
        post.likes,
        post.likedBy
      );
    } catch (err) {
      // Revert if error (simple reload)
      loadPosts();
    }
  };

  // Helper to format relative time
  const formatTimeAgo = (dateString: string) => {
    const diff = (new Date().getTime() - new Date(dateString).getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return new Date(dateString).toLocaleDateString();
  };

  const PlanBadge = ({ plan }: { plan: PlanTier }) => {
    if (plan === PlanTier.PREMIUM)
      return (
        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-200 dark:border-amber-800">
          Premium
        </span>
      );
    if (plan === PlanTier.PRO)
      return (
        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-200 dark:border-blue-800">
          Pro
        </span>
      );
    return null;
  };

  const PostCard = ({
    post,
    isDetail = false,
  }: {
    post: CommunityPost;
    isDetail?: boolean;
  }) => {
    const isLiked = user && post.likedBy.includes(user.id);

    return (
      <div
        onClick={() => !isDetail && setSelectedPostId(post.id)}
        className={`bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 transition-all duration-300 shadow-sm ${
          !isDetail
            ? "hover:border-blue-300/50 dark:hover:border-blue-700/50 cursor-pointer"
            : ""
        }`}
      >
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold flex-shrink-0">
            {post.userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-base">
                  {post.userName}
                </span>
                <PlanBadge plan={post.userPlan} />
                <span className="text-slate-400 text-sm">
                  • {formatTimeAgo(post.createdAt)}
                </span>
              </div>
              <button className="text-slate-400 hover:text-blue-500 transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </div>

            <div
              className={`mt-2 mb-4 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap ${
                isDetail ? "text-lg" : ""
              }`}
            >
              {post.content}
            </div>

            {post.image && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="bg-slate-100 dark:bg-slate-700 h-64 w-full flex items-center justify-center text-slate-400">
                  <ImageIcon size={48} />
                </div>
              </div>
            )}

            <div
              className="flex items-center gap-8 pt-2 border-t border-slate-100 dark:border-slate-700/50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-2 text-sm font-medium transition-colors group ${
                  isLiked
                    ? "text-pink-500"
                    : "text-slate-500 dark:text-slate-400 hover:text-pink-500"
                }`}
              >
                <div
                  className={`p-2 rounded-full group-hover:bg-pink-50 dark:group-hover:bg-pink-900/20 transition-colors ${
                    isLiked ? "bg-pink-50 dark:bg-pink-900/20" : ""
                  }`}
                >
                  <Heart size={18} className={isLiked ? "fill-current" : ""} />
                </div>
                {post.likes > 0 && <span>{post.likes}</span>}
              </button>

              <button className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                  <MessageSquare size={18} />
                </div>
                {post.commentsCount > 0 && <span>{post.commentsCount}</span>}
              </button>

              <button className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-green-500 transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                  <Share2 size={18} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Detail View
  if (selectedPostId) {
    const post = posts.find((p) => p.id === selectedPostId);
    if (!post) return <div>Post não encontrado</div>;

    return (
      <div className="max-w-3xl mx-auto pb-20 font-sans min-h-screen">
        <div className="sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-4 mb-6 -mx-4 px-4 md:mx-0 md:px-0 flex items-center gap-4">
          <button
            onClick={() => setSelectedPostId(null)}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft
              size={20}
              className="text-slate-700 dark:text-slate-200"
            />
          </button>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            Postagem
          </h2>
        </div>

        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <PostCard post={post} isDetail={true} />

          <div className="space-y-6 pl-2">
            <div className="flex gap-3 items-start bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                {replyingTo && (
                  <div className="flex justify-between items-center text-xs text-slate-400 mb-2 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded">
                    <span>Respondendo...</span>
                    <button onClick={() => setReplyingTo(null)}>
                      <X size={12} />
                    </button>
                  </div>
                )}
                <textarea
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  placeholder="Escreva sua resposta..."
                  className="w-full bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 resize-none min-h-[60px]"
                />
                <div className="flex justify-between items-center mt-2">
                  <button className="text-slate-400 hover:text-blue-500">
                    <Smile size={18} />
                  </button>
                  <button
                    onClick={handleCreateComment}
                    disabled={!newCommentContent.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Responder
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {postComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`flex gap-3 ${
                    comment.replyToId ? "ml-8 md:ml-12" : ""
                  }`}
                >
                  {comment.replyToId && (
                    <div className="text-slate-300 dark:text-slate-600 pt-2">
                      <CornerDownRight size={16} />
                    </div>
                  )}
                  <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-xs">
                          {comment.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {comment.userName}
                        </span>
                        <span className="text-slate-400 text-xs">
                          • {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-3">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-pink-500 transition-colors">
                        <Heart size={14} /> <span>Curtir</span>
                      </button>
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-xs text-slate-400 hover:text-blue-500 transition-colors font-medium"
                      >
                        Responder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {postComments.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">
                  Seja o primeiro a comentar!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Feed View
  return (
    <div className="max-w-3xl mx-auto pb-20 font-sans min-h-screen">
      <div className="sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 -mx-4 px-4 md:mx-0 md:px-0 pt-2">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Comunidade FocusPro
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Compartilhe sua evolução, dúvidas e aprendizados.
            </p>
          </div>
          <button className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors">
            <Info size={14} /> Regras
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-blue-100 dark:border-slate-700 shadow-sm mb-8 ring-1 ring-slate-900/5 dark:ring-white/10">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg flex-shrink-0 border border-blue-200 dark:border-blue-800">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="O que você deseja compartilhar hoje?"
              className="w-full bg-transparent border-none focus:ring-0 text-slate-800 dark:text-slate-200 text-lg placeholder:text-slate-400 resize-none min-h-[80px]"
            />
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700/50 mt-2">
              <div className="flex gap-2">
                <button
                  className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Imagem"
                >
                  <ImageIcon size={20} />
                </button>
                <button
                  className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Arquivo"
                >
                  <FileText size={20} />
                </button>
                <button
                  className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="Emoji"
                >
                  <Smile size={20} />
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={!newPostContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                Postar <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-slate-400">
            Carregando comunidade...
          </div>
        ) : (
          posts.map((post) => (
            <React.Fragment key={post.id}>
              <PostCard post={post} />
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};
