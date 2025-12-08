import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;

let ai: GoogleGenAI | null = null;

try {
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey: apiKey });
  }
} catch (error) {
  console.error("Failed to initialize Gemini Client", error);
}

export const GeminiService = {
  isAvailable: () => !!ai,

  getDailyMotivation: async (userName: string, unfinishedTasks: number) => {
    if (!ai) return "Concentre-se no seu progresso hoje!";

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Give a short, encouraging, one-sentence motivation tip in Portuguese for someone with ADHD named ${userName} who has ${unfinishedTasks} tasks left today. Be friendly and specific about focus.`,
      });
      // Access .text property directly (do not call it as a function)
      return response.text?.trim() || "Um passo de cada vez. Você consegue!";
    } catch (e) {
      console.error(e);
      return "Um passo de cada vez. Você consegue!";
    }
  },

  analyzeProductivity: async (completedTasks: number, mood: string) => {
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze productivity: User completed ${completedTasks} tasks and feels ${mood}. Provide 3 short bullet points in Portuguese with advice for tomorrow considering ADHD traits.`,
        });
        // Access .text property directly (do not call it as a function)
        return response.text || null;
    } catch (e) {
        return null;
    }
  },

  generatePersonalizedRoutines: async (wakeTime: string, sleepTime: string, context: string) => {
      if (!ai) return null;

      const prompt = `
        Atue como um especialista em produtividade para pessoas com TDAH.
        Crie 3 a 5 rotinas diárias estruturadas baseadas nos dados abaixo.

        Dados do Usuário:
        - Acorda às: ${wakeTime}
        - Dorme às: ${sleepTime}
        - Contexto/Descrição do dia: "${context}"

        Regras:
        1. As rotinas devem ajudar na organização, evitando sobrecarga.
        2. Use categorias variadas: 'morning', 'afternoon', 'night', 'focus', 'health', 'productivity', 'emotional'.
        3. Cada rotina precisa de um "id" string único e todos os passos em "steps" também precisam de um "id" string único (ex.: "1", "2", "3").
        4. Retorne APENAS um JSON válido (sem markdown \`\`\`json) no seguinte formato de array:
        [
          {
            "id": "r1",
            "title": "Nome da Rotina",
            "time": "HH:MM",
            "category": "uma_das_categorias_acima",
            "frequency": ["Seg", "Ter", "Qua", "Qui", "Sex"],
            "steps": [
              { "id": "s1", "title": "Micro-passo 1", "completed": false },
              { "id": "s2", "title": "Micro-passo 2", "completed": false }
            ]
          }
        ]
      `;

      try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        // Access .text property directly (do not call it as a function)
        const text = response.text;
        if (!text) throw new Error("Sem resposta da IA");
        
        // Use new RegExp to avoid parser issues with backticks in regex literals
        const jsonStr = text.replace(new RegExp('```json', 'g'), '').replace(new RegExp('```', 'g'), '').trim();
        const parsed = JSON.parse(jsonStr);

        if (!Array.isArray(parsed)) return parsed;

        return parsed.map((routine, routineIdx) => ({
          ...routine,
          steps: Array.isArray(routine.steps)
            ? routine.steps.map((step: any, stepIdx: number) => ({
                ...step,
                id: step?.id || `${routineIdx + 1}-${stepIdx + 1}`,
                completed: !!step?.completed,
              }))
            : [],
        }));

      } catch (e) {
        console.error("Erro ao gerar rotinas:", e);
        return null;
      }
  }
};