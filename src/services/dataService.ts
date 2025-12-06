import { supabase, supabaseAdmin } from "./supabase";
import {
  User,
  Task,
  Routine,
  JournalEntry,
  UserRole,
  PlanTier,
  Comment,
  CommunityPost,
  CommunityComment,
} from "../types";

export const DataService = {
  // --- USERS (Admin) ---
  getUsers: async (): Promise<User[]> => {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client.from("profiles").select("*");
    if (error) throw error;
    return data.map((p: any) => ({
      id: p.id,
      email: p.email,
      name: p.name,
      role: p.role,
      plan: p.plan,
      joinedDate: p.created_at,
    }));
  },

  updateUserPlanAndRole: async (
    userId: string,
    plan: PlanTier,
    role: UserRole
  ) => {
    const client = supabaseAdmin || supabase;
    const { error } = await client
      .from("profiles")
      .update({ plan, role })
      .eq("id", userId);
    if (error) throw error;
  },

  deleteUser: async (userId: string) => {
    // Supabase cascade delete should handle relations if configured, otherwise delete manually
    const client = supabaseAdmin || supabase;
    const { error } = await client.from("profiles").delete().eq("id", userId);
    if (error) throw error;
  },

  // --- TASKS ---
  getTasks: async (userId: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      title: t.title,
      status: t.status,
      completed: t.status === "completed",
      createdAt: t.created_at,
      priority: t.priority,
    }));
  },

  addTask: async (task: Task) => {
    const { error } = await supabase.from("tasks").insert({
      id: task.id, // Or let DB generate UUID
      user_id: task.userId,
      title: task.title,
      status: task.status,
      priority: task.priority,
      created_at: task.createdAt,
    });
    if (error) throw error;
  },

  updateTask: async (task: Task) => {
    const { error } = await supabase
      .from("tasks")
      .update({
        title: task.title,
        status: task.status,
        priority: task.priority,
      })
      .eq("id", task.id);
    if (error) throw error;
  },

  deleteTask: async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) throw error;
  },

  // --- ROUTINES ---
  getRoutines: async (userId: string): Promise<Routine[]> => {
    const { data, error } = await supabase
      .from("routines")
      .select("*")
      .eq("user_id", userId)
      .order("time", { ascending: true });

    if (error) throw error;

    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      time: r.time,
      category: r.category,
      frequency: r.frequency || [],
      steps: r.steps || [],
      completed: r.completed,
    }));
  },

  addRoutine: async (routine: Routine) => {
    const { error } = await supabase.from("routines").insert({
      id: routine.id,
      user_id: routine.userId,
      title: routine.title,
      time: routine.time,
      category: routine.category,
      frequency: routine.frequency,
      steps: routine.steps,
      completed: routine.completed,
    });
    if (error) throw error;
  },

  updateRoutine: async (routine: Routine) => {
    // Auto-calculate completion logic is handled in frontend before sending, or here
    const { error } = await supabase
      .from("routines")
      .update({
        title: routine.title,
        time: routine.time,
        frequency: routine.frequency,
        steps: routine.steps,
        completed: routine.completed,
      })
      .eq("id", routine.id);
    if (error) throw error;
  },

  deleteRoutine: async (routineId: string) => {
    const { error } = await supabase
      .from("routines")
      .delete()
      .eq("id", routineId);
    if (error) throw error;
  },

  // --- JOURNAL ---
  getJournalEntries: async (userId: string): Promise<JournalEntry[]> => {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) throw error;

    return data.map((e: any) => ({
      id: e.id,
      userId: e.user_id,
      date: e.date,
      mood: e.mood,
      reasons: e.reasons || [],
      tags: e.tags || [],
      content: e.content,
    }));
  },

  addJournalEntry: async (entry: JournalEntry) => {
    const { error } = await supabase.from("journal_entries").insert({
      id: entry.id,
      user_id: entry.userId,
      date: entry.date,
      mood: entry.mood,
      reasons: entry.reasons,
      tags: entry.tags,
      content: entry.content,
    });
    if (error) throw error;
  },

  // --- COMMUNITY ---
  getCommunityPosts: async (): Promise<CommunityPost[]> => {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      userName: p.user_name,
      userPlan: p.user_plan,
      content: p.content,
      likes: p.likes || 0,
      likedBy: p.liked_by || [],
      commentsCount: 0, // Ideally join or separate count query
      createdAt: p.created_at,
    }));
  },

  createCommunityPost: async (
    userId: string,
    userName: string,
    userPlan: PlanTier,
    content: string
  ): Promise<CommunityPost> => {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error } = await supabase.from("community_posts").insert({
      id: newId,
      user_id: userId,
      user_name: userName,
      user_plan: userPlan,
      content: content,
      likes: 0,
      liked_by: [],
      created_at: now,
    });
    if (error) throw error;

    return {
      id: newId,
      userId,
      userName,
      userPlan,
      content,
      likes: 0,
      likedBy: [],
      commentsCount: 0,
      createdAt: now,
    };
  },

  toggleLikePost: async (
    postId: string,
    userId: string,
    currentLikes: number,
    currentLikedBy: string[]
  ) => {
    const hasLiked = currentLikedBy.includes(userId);
    const newLikedBy = hasLiked
      ? currentLikedBy.filter((id) => id !== userId)
      : [...currentLikedBy, userId];
    const newLikes = hasLiked
      ? Math.max(0, currentLikes - 1)
      : currentLikes + 1;

    const { error } = await supabase
      .from("community_posts")
      .update({ likes: newLikes, liked_by: newLikedBy })
      .eq("id", postId);

    if (error) throw error;
    return { newLikes, newLikedBy };
  },

  getPostComments: async (postId: string): Promise<CommunityComment[]> => {
    const { data, error } = await supabase
      .from("community_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return data.map((c: any) => ({
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      userName: c.user_name,
      content: c.content,
      replyToId: c.reply_to_id,
      createdAt: c.created_at,
      likes: 0,
    }));
  },

  addPostComment: async (
    postId: string,
    userId: string,
    userName: string,
    content: string,
    replyToId?: string
  ): Promise<CommunityComment> => {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error } = await supabase.from("community_comments").insert({
      id: newId,
      post_id: postId,
      user_id: userId,
      user_name: userName,
      content,
      reply_to_id: replyToId,
      created_at: now,
    });
    if (error) throw error;

    return {
      id: newId,
      postId,
      userId,
      userName,
      content,
      replyToId,
      createdAt: now,
      likes: 0,
    };
  },

  // --- RESOURCES / LESSONS ---
  getLessonComments: async (lessonId: string): Promise<Comment[]> => {
    const { data, error } = await supabase
      .from("lesson_comments")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((c: any) => ({
      id: c.id,
      lessonId: c.lesson_id,
      userId: c.user_id,
      userName: c.user_name,
      content: c.content,
      createdAt: c.created_at,
      likes: 0,
    }));
  },

  addLessonComment: async (
    lessonId: string,
    userId: string,
    userName: string,
    content: string
  ): Promise<Comment> => {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error } = await supabase.from("lesson_comments").insert({
      id: newId,
      lesson_id: lessonId,
      user_id: userId,
      user_name: userName,
      content,
      created_at: now,
    });
    if (error) throw error;

    return {
      id: newId,
      lessonId,
      userId,
      userName,
      content,
      createdAt: now,
      likes: 0,
    };
  },

  deleteLessonComment: async (commentId: string) => {
    const { error } = await supabase
      .from("lesson_comments")
      .delete()
      .eq("id", commentId);
    if (error) throw error;
  },

  getLessonRating: async (lessonId: string, userId: string) => {
    const { data: ratings, error } = await supabase
      .from("lesson_ratings")
      .select("rating, user_id")
      .eq("lesson_id", lessonId);

    if (error) return { average: 0, count: 0, userRating: 0 };

    const total = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const count = ratings.length;
    const userRatingEntry = ratings.find((r: any) => r.user_id === userId);

    return {
      average: count > 0 ? total / count : 0,
      count,
      userRating: userRatingEntry?.rating || 0,
    };
  },

  rateLesson: async (lessonId: string, userId: string, rating: number) => {
    // Upsert
    const { error } = await supabase.from("lesson_ratings").upsert(
      {
        lesson_id: lessonId,
        user_id: userId,
        rating,
      },
      { onConflict: "lesson_id, user_id" }
    );

    if (error) throw error;
    return DataService.getLessonRating(lessonId, userId);
  },
};
