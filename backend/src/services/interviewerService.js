const axios = require("axios");

const PERSONAS = {
  generic: {
    name: "Alex",
    company: "a top tech company",
    systemPrompt: `You are Alex, a senior software engineer conducting a technical coding interview. Your style is professional, direct, and fair. You ask probing follow-up questions about time and space complexity, edge cases, and alternative approaches. You give hints only when the candidate has been stuck for more than 5 minutes. You never write code for the candidate. You never reveal the solution. You stay in character for the entire interview. Keep responses to 2-4 sentences unless explaining something complex. After the candidate gives any answer, always follow up.`,
  },
  google: {
    name: "Jordan",
    company: "Google",
    systemPrompt: `You are Jordan, a staff software engineer at Google conducting a technical interview. Google interviews emphasize scalability, optimal time and space complexity, clean readable code, and clear verbal communication. You push hard on complexity — even when the candidate has a working solution you ask "can you do better?". You expect candidates to clarify constraints before coding. You give no hints unless absolutely necessary. Stay in character.`,
  },
  amazon: {
    name: "Sam",
    company: "Amazon",
    systemPrompt: `You are Sam, a senior SDE-II at Amazon conducting a technical interview. Amazon values working solutions, operational thinking, and edge case coverage. You push hard on edge cases — empty inputs, single elements, duplicates, negative numbers. You expect the candidate to ask clarifying questions before writing any code. You are pragmatic and business-focused. Stay in character throughout.`,
  },
  meta: {
    name: "Riley",
    company: "Meta",
    systemPrompt: `You are Riley, an E5 engineer at Meta conducting a technical interview. Meta interviews are fast-paced. You expect candidates to reach an optimal solution, not just any solution. You give limited time — if someone spends more than 3 minutes without writing code you prompt them to start. You ask about complexity immediately after they propose any approach. Stay in character.`,
  },
  microsoft: {
    name: "Morgan",
    company: "Microsoft",
    systemPrompt: `You are Morgan, a principal engineer at Microsoft conducting a technical interview. Microsoft interviews are collaborative. You engage in dialogue rather than just watching silently. You occasionally offer small nudges when someone is close but stuck. You care about code design and maintainability. You ask the candidate to walk through their solution before they code it. Stay in character throughout.`,
  },
};

const MAX_CONTEXT_MESSAGES = 20;

function buildInitialContext({ problem, persona, language, targetCompany }) {
  const personaKey = targetCompany?.toLowerCase() || persona || "generic";
  const selectedPersona = PERSONAS[personaKey] || PERSONAS.generic;

  const systemPrompt = `${selectedPersona.systemPrompt}

INTERVIEW DETAILS:
- Problem: ${problem.title} (${problem.difficulty}, topic: ${problem.topic})
- Candidate language: ${language}
- Problem: ${problem.description}
- Constraints: ${problem.constraints || "none specified"}

STRICT RULES:
- Never write code for the candidate under any circumstances.
- Never reveal the solution even if directly asked.
- When the candidate's code has a bug, ask them to trace through a specific test case.
- After any answer always ask a follow-up. Never just say "correct" and stop.
- If they have not clarified constraints in the first 2 exchanges, prompt them.`;

  const openingMessage = `Hi, I am ${selectedPersona.name} from ${selectedPersona.company}. We have about 45 minutes today.

I will share a problem with you now. Before you start coding, take a moment to read it carefully and ask any clarifying questions. Think out loud as you work.

Here is your problem:

**${problem.title}**

${problem.description}

${problem.constraints ? `**Constraints:** ${problem.constraints}` : ""}

Take your time reading. What questions do you have before we begin?`;

  return {
    systemPrompt,
    persona: selectedPersona,
    problem,
    language,
    messages: [{ role: "interviewer", content: openingMessage }],
  };
}

async function generateInterviewerResponse(context, userMessage, currentCode) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://ollama:11434";
  const model = process.env.OLLAMA_MODEL || "llama3";

  context.messages.push({ role: "candidate", content: userMessage });

  const windowed = context.messages.slice(-MAX_CONTEXT_MESSAGES);
  const messages = windowed.map((msg) => ({
    role: msg.role === "interviewer" ? "assistant" : "user",
    content: msg.content,
  }));

  if (currentCode && messages.length > 0) {
    messages[messages.length - 1].content +=
      `\n\n[CANDIDATE'S CURRENT CODE]\n\`\`\`${context.language}\n${currentCode}\n\`\`\``;
  }

  try {
    const response = await axios.post(
      `${ollamaUrl}/api/chat`,
      {
        model,
        messages: [{ role: "system", content: context.systemPrompt }, ...messages],
        stream: false,
        options: { temperature: 0.7, top_p: 0.9, num_predict: 300 },
      },
      { timeout: 60000 }
    );

    const reply = response.data.message?.content?.trim();
    if (!reply) throw new Error("Empty response from Ollama");

    context.messages.push({ role: "interviewer", content: reply });

    if (context.messages.length > MAX_CONTEXT_MESSAGES) {
      context.messages = context.messages.slice(-MAX_CONTEXT_MESSAGES);
    }

    return reply;
  } catch (err) {
    if (err.code === "ECONNREFUSED") {
      throw new Error("AI interviewer is starting up. Please wait a moment and try again.");
    }
    if (err.code === "ETIMEDOUT") {
      throw new Error("AI interviewer took too long to respond. Please try again.");
    }
    throw err;
  }
}

async function generateDebriefReport({ session, messages, finalCode, problem }) {
  const ollamaUrl = process.env.OLLAMA_URL || "http://ollama:11434";
  const model = process.env.OLLAMA_MODEL || "llama3";

  const transcript = messages
    .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n")
    .slice(0, 4000);

  const prompt = `You are analyzing a completed coding interview session. Generate a structured performance report.

PROBLEM: ${problem.title} (${problem.difficulty} - ${problem.topic})
LANGUAGE: ${session.language}
DURATION: ${Math.round((session.duration_seconds || 0) / 60)} minutes

INTERVIEW TRANSCRIPT:
${transcript}

FINAL CODE:
\`\`\`${session.language}
${(finalCode || "No code submitted").slice(0, 2000)}
\`\`\`

Respond with a JSON object only. No markdown, no explanation, just raw JSON:
{
  "overall_score": <integer 0-100>,
  "communication_score": <integer 0-100>,
  "correctness_score": <integer 0-100>,
  "efficiency_score": <integer 0-100>,
  "hire_recommendation": "<strong_hire|hire|no_hire|strong_no_hire>",
  "strengths": ["<specific strength>", "<specific strength>"],
  "weaknesses": ["<specific weakness>", "<specific weakness>"],
  "missed_edge_cases": ["<edge case>"],
  "optimal_solution": "<one sentence describing the optimal approach>",
  "detailed_feedback": "<3-4 sentences of specific actionable feedback>"
}`;

  const response = await axios.post(
    `${ollamaUrl}/api/generate`,
    {
      model,
      prompt,
      stream: false,
      options: { temperature: 0.2, num_predict: 600 },
    },
    { timeout: 90000 }
  );

  const raw = response.data.response || "";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse debrief JSON from LLM response");

  const parsed = JSON.parse(jsonMatch[0]);

  const required = [
    "overall_score", "communication_score", "correctness_score",
    "efficiency_score", "hire_recommendation", "strengths", "weaknesses",
    "missed_edge_cases", "optimal_solution", "detailed_feedback",
  ];
  for (const field of required) {
    if (parsed[field] === undefined) throw new Error(`Missing field: ${field}`);
  }

  return parsed;
}

module.exports = { buildInitialContext, generateInterviewerResponse, generateDebriefReport, PERSONAS };
