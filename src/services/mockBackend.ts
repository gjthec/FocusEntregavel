import {
  User,
  Task,
  Routine,
  JournalEntry,
  UserRole,
  PlanTier,
  RoutineStep,
  TaskStatus,
  Comment,
  CommunityPost,
  CommunityComment,
} from "../types";

const STORAGE_KEYS = {
  USERS: "focuspro_users",
  TASKS: "focuspro_tasks",
  ROUTINES: "focuspro_routines",
  JOURNAL: "focuspro_journal",
  CURRENT_USER: "focuspro_current_user",
  RATINGS: "focuspro_lesson_ratings",
  COMMENTS: "focuspro_lesson_comments",
  COMMUNITY_POSTS: "focuspro_community_posts",
  COMMUNITY_COMMENTS: "focuspro_community_comments",
};

// Initial Mock Data
const INITIAL_ADMIN: User = {
  id: "admin-1",
  email: "admin@focuspro.com",
  name: "Administrador",
  role: UserRole.ADMIN,
  plan: PlanTier.PREMIUM,
  joinedDate: new Date().toISOString(),
  password: "admin", // Simple password for testing
  authProvider: "email",
};

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    userId: "user-x",
    userName: "Julia Mendes",
    userPlan: PlanTier.PREMIUM,
    content:
      "Gente, finalmente consegui completar 7 dias seguidos da minha rotina matinal! 🎉 O segredo foi deixar o celular longe da cama.",
    likes: 14,
    commentsCount: 3,
    likedBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "post-2",
    userId: "user-y",
    userName: "Carlos F.",
    userPlan: PlanTier.PRO,
    content:
      'Alguém mais sente que o "Hiperfoco" às vezes atrapalha? Ontem fiquei 4 horas organizando planilhas e esqueci de almoçar. Alguma dica de timer?',
    likes: 8,
    commentsCount: 12,
    likedBy: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
];

const initStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([INITIAL_ADMIN]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ROUTINES)) {
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.JOURNAL)) {
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RATINGS)) {
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify({}));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMUNITY_POSTS)) {
    localStorage.setItem(
      STORAGE_KEYS.COMMUNITY_POSTS,
      JSON.stringify(INITIAL_POSTS)
    );
  }
};

initStorage();

export const MockBackend = {
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || "[]");
  },
  getCommunityPostComments: (postId: string): CommunityComment[] => {
    const allComments = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.COMMUNITY_COMMENTS) || "[]"
    );
    return allComments
      .filter((c: CommunityComment) => c.postId === postId)
      .sort(
        (a: CommunityComment, b: CommunityComment) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
  },

  addCommunityComment: (
    postId: string,
    userId: string,
    userName: string,
    content: string,
    replyToId?: string
  ): CommunityComment => {
    const allComments = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.COMMUNITY_COMMENTS) || "[]"
    );
    const newComment: CommunityComment = {
      id: Math.random().toString(36).substr(2, 9),
      postId,
      userId,
      userName,
      content,
      createdAt: new Date().toISOString(),
      replyToId,
      likes: 0,
    };
    allComments.push(newComment);
    localStorage.setItem(
      STORAGE_KEYS.COMMUNITY_COMMENTS,
      JSON.stringify(allComments)
    );
    return newComment;
  },

  createUser: (user: Omit<User, "id" | "joinedDate">): User => {
    const users = MockBackend.getUsers();
    if (users.find((u) => u.email === user.email)) {
      throw new Error("E-mail já cadastrado");
    }

    const newUser: User = {
      ...user,
      id: Math.random().toString(36).substr(2, 9),
      joinedDate: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  },

  updateUser: (updatedUser: User) => {
    const users = MockBackend.getUsers();
    const index = users.findIndex((u) => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

      // If updating current user, update session too
      const currentUser = MockBackend.getCurrentUser();
      if (currentUser && currentUser.id === updatedUser.id) {
        localStorage.setItem(
          STORAGE_KEYS.CURRENT_USER,
          JSON.stringify(updatedUser)
        );
      }
    }
  },

  deleteUser: (userId: string) => {
    // Remove user
    const users = MockBackend.getUsers().filter((u) => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    // Remove tasks
    const tasks = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.TASKS) || "[]"
    ).filter((t: Task) => t.userId !== userId);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));

    // Remove routines
    const routines = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ROUTINES) || "[]"
    ).filter((r: Routine) => r.userId !== userId);
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));

    // Remove journal
    const journal = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.JOURNAL) || "[]"
    ).filter((j: JournalEntry) => j.userId !== userId);
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journal));
  },

  login: (
    email: string,
    password?: string,
    isGoogleAuth: boolean = false
  ): User | null => {
    const users = MockBackend.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    // Google Login Flow
    if (isGoogleAuth) {
      if (!user) {
        // Create new user for Google login automatically
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          email: email,
          name: email.split("@")[0], // Default name from email
          role: UserRole.USER,
          plan: PlanTier.BASIC,
          joinedDate: new Date().toISOString(),
          authProvider: "google",
        };
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        user = newUser;
      }
    } else {
      // Email/Password Login Flow
      if (user) {
        if (user.password !== password && user.authProvider !== "google") {
          throw new Error("Senha incorreta.");
        }
        if (user.authProvider === "google") {
          throw new Error(
            "Esta conta usa login com Google. Por favor, use o botão do Google."
          );
        }
      } else {
        if (password) {
          const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email: email,
            name: email.split("@")[0],
            role: UserRole.USER,
            plan: PlanTier.BASIC,
            joinedDate: new Date().toISOString(),
            password: password,
            authProvider: "email",
          };
          users.push(newUser);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
          user = newUser;
        } else {
          throw new Error("Usuário não encontrado.");
        }
      }
    }

    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
    return user || null;
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  },

  getTasks: (userId: string): Task[] => {
    const allTasks = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.TASKS) || "[]"
    );
    // Migration Logic: If status is missing, infer from 'completed'
    const userTasks = allTasks.filter((t: Task) => t.userId === userId);

    return userTasks.map((t: any) => ({
      ...t,
      status: t.status || (t.completed ? "completed" : "pending"),
    }));
  },

  addTask: (task: Task) => {
    const allTasks = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.TASKS) || "[]"
    );
    allTasks.push(task);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
  },

  updateTask: (updatedTask: Task) => {
    const allTasks = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.TASKS) || "[]"
    );
    const index = allTasks.findIndex((t: Task) => t.id === updatedTask.id);
    if (index !== -1) {
      allTasks[index] = updatedTask;
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
    }
  },

  deleteTask: (taskId: string) => {
    const allTasks = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.TASKS) || "[]"
    );
    const filtered = allTasks.filter((t: Task) => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
  },

  // Routines
  getRoutines: (userId: string): Routine[] => {
    const allRoutines = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ROUTINES) || "[]"
    );
    const userRoutines = allRoutines.filter(
      (r: Routine) => r.userId === userId
    );
    // Ensure compatibility with old data if necessary (migration mock)
    return userRoutines
      .map((r: any) => ({
        ...r,
        steps: r.steps || [],
        frequency: r.frequency || ["Seg", "Ter", "Qua", "Qui", "Sex"],
        category: r.category || "productivity",
      }))
      .sort((a: Routine, b: Routine) => a.time.localeCompare(b.time));
  },

  addRoutine: (routine: Routine) => {
    const allRoutines = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ROUTINES) || "[]"
    );
    allRoutines.push(routine);
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(allRoutines));
  },

  updateRoutine: (updatedRoutine: Routine) => {
    const allRoutines = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ROUTINES) || "[]"
    );
    const index = allRoutines.findIndex(
      (r: Routine) => r.id === updatedRoutine.id
    );
    if (index !== -1) {
      // Auto-calculate completion if all steps are done
      const allStepsDone =
        updatedRoutine.steps.length > 0 &&
        updatedRoutine.steps.every((s) => s.completed);
      // Or if it has no steps, use the manual completed flag, otherwise use calculated
      const finalCompleted =
        updatedRoutine.steps.length > 0
          ? allStepsDone
          : updatedRoutine.completed;

      allRoutines[index] = { ...updatedRoutine, completed: finalCompleted };
      localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(allRoutines));
    }
  },

  deleteRoutine: (routineId: string) => {
    const allRoutines = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ROUTINES) || "[]"
    );
    const filtered = allRoutines.filter((r: Routine) => r.id !== routineId);
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(filtered));
  },

  generateRoutinesFromSchedule: (
    userId: string,
    wakeTime: string,
    sleepTime: string
  ) => {
    // Simple generator logic
    const routines: Routine[] = [
      {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        title: "Ritual Matinal",
        time: wakeTime,
        category: "morning",
        frequency: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"],
        completed: false,
        steps: [
          { id: "1", title: "Beber água", completed: false },
          { id: "2", title: "Arrumar a cama", completed: false },
          { id: "3", title: "Evitar celular por 15min", completed: false },
        ],
      },
      {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        title: "Bloco de Foco Profundo",
        time: "10:00", // Default assumption
        category: "focus",
        frequency: ["Seg", "Ter", "Qua", "Qui", "Sex"],
        completed: false,
        steps: [
          { id: "1", title: "Definir 1 meta", completed: false },
          { id: "2", title: 'Ligar "Não Perturbe"', completed: false },
          { id: "3", title: "Trabalhar 50min", completed: false },
        ],
      },
      {
        id: Math.random().toString(36).substr(2, 9),
        userId,
        title: "Higiene do Sono",
        time: sleepTime, // Logic could subtract 30 mins
        category: "night",
        frequency: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"],
        completed: false,
        steps: [
          { id: "1", title: "Desligar telas", completed: false },
          { id: "2", title: "Separar roupa de amanhã", completed: false },
          { id: "3", title: "Agradecer por 1 coisa", completed: false },
        ],
      },
    ];

    routines.forEach((r) => MockBackend.addRoutine(r));
  },

  getJournalEntries: (userId: string): JournalEntry[] => {
    const entries = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.JOURNAL) || "[]"
    );
    // Ensure data compatibility
    return entries
      .filter((e: any) => e.userId === userId)
      .map((e: any) => ({
        ...e,
        reasons: e.reasons || [],
        tags: e.tags || [],
      }))
      .sort(
        (a: JournalEntry, b: JournalEntry) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  },

  addJournalEntry: (entry: JournalEntry) => {
    const entries = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.JOURNAL) || "[]"
    );
    entries.push(entry);
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(entries));
  },

  // --- LESSON RATINGS ---
  getLessonRating: (lessonId: string, userId: string) => {
    const allRatings = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.RATINGS) || "{}"
    );
    const lessonRatings = allRatings[lessonId] || [];

    // Calculate average
    const total = lessonRatings.reduce(
      (sum: number, r: any) => sum + r.rating,
      0
    );
    const average = lessonRatings.length > 0 ? total / lessonRatings.length : 0;

    // Find user's rating
    const userRating =
      lessonRatings.find((r: any) => r.userId === userId)?.rating || 0;

    return { average, count: lessonRatings.length, userRating };
  },

  rateLesson: (userId: string, lessonId: string, rating: number) => {
    const allRatings = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.RATINGS) || "{}"
    );
    const lessonRatings = allRatings[lessonId] || [];

    // Check if user already rated
    const existingIndex = lessonRatings.findIndex(
      (r: any) => r.userId === userId
    );

    if (existingIndex >= 0) {
      lessonRatings[existingIndex].rating = rating;
    } else {
      lessonRatings.push({ userId, rating });
    }

    allRatings[lessonId] = lessonRatings;
    localStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(allRatings));

    return MockBackend.getLessonRating(lessonId, userId);
  },

  // --- LESSON COMMENTS ---
  getComments: (lessonId: string): Comment[] => {
    const allComments = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.COMMENTS) || "[]"
    );
    // Filter by lesson and sort by date (newest first)
    return allComments
      .filter((c: Comment) => c.lessonId === lessonId)
      .sort(
        (a: Comment, b: Comment) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  addComment: (
    lessonId: string,
    userId: string,
    content: string,
    userName: string
  ): Comment => {
    const allComments = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.COMMENTS) || "[]"
    );
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      lessonId,
      userId,
      userName,
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
    };
    allComments.push(newComment);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(allComments));
    return newComment;
  },

  deleteComment: (commentId: string) => {
    const allComments = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.COMMENTS) || "[]"
    );
    const filtered = allComments.filter((c: Comment) => c.id !== commentId);
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(filtered));
  },

  // --- COMMUNITY ---
  getCommunityPosts: (): CommunityPost[] => {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEYS.COMMUNITY_POSTS) || "[]"
    ).sort(
      (a: CommunityPost, b: CommunityPost) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  createCommunityPost: (
    userId: string,
    userName: string,
    userPlan: PlanTier,
    content: string
  ): CommunityPost => {
    const allPosts = MockBackend.getCommunityPosts();
    const newPost: CommunityPost = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      userName,
      userPlan,
      content,
      likes: 0,
      commentsCount: 0,
      likedBy: [],
      createdAt: new Date().toISOString(),
    };
    allPosts.unshift(newPost); // Add to top
    localStorage.setItem(
      STORAGE_KEYS.COMMUNITY_POSTS,
      JSON.stringify(allPosts)
    );
    return newPost;
  },

  toggleLikeCommunityPost: (postId: string, userId: string): CommunityPost => {
    const allPosts = MockBackend.getCommunityPosts();
    const index = allPosts.findIndex((p) => p.id === postId);

    if (index !== -1) {
      const post = allPosts[index];
      const hasLiked = post.likedBy.includes(userId);

      if (hasLiked) {
        post.likedBy = post.likedBy.filter((id) => id !== userId);
        post.likes = Math.max(0, post.likes - 1);
      } else {
        post.likedBy.push(userId);
        post.likes += 1;
      }

      allPosts[index] = post;
      localStorage.setItem(
        STORAGE_KEYS.COMMUNITY_POSTS,
        JSON.stringify(allPosts)
      );
      return post;
    }
    throw new Error("Post not found");
  },
};
