const axios = require("axios");

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  go: 60,
  rust: 73,
  typescript: 74,
  ruby: 72,
  swift: 83,
  kotlin: 78,
};

async function submit({ code, language, stdin = "" }) {
  const languageId = LANGUAGE_IDS[language.toLowerCase()];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const response = await axios.post(
    `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    {
      source_code: code,
      language_id: languageId,
      stdin,
      cpu_time_limit: 5,
      memory_limit: 128000,
    },
    { timeout: 15000 }
  );

  const s = response.data;
  return {
    stdout: s.stdout || "",
    stderr: s.stderr || "",
    compile_output: s.compile_output || "",
    status: s.status?.description || "Unknown",
    status_id: s.status?.id,
    time: s.time,
    memory: s.memory,
    exit_code: s.exit_code,
  };
}

function getSupportedLanguages() {
  return Object.keys(LANGUAGE_IDS);
}

function isSupported(language) {
  return !!LANGUAGE_IDS[language?.toLowerCase()];
}

module.exports = { submit, getSupportedLanguages, isSupported, LANGUAGE_IDS };
