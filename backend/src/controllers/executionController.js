const axios = require("axios");
const Session = require("../models/Session");
const Problem = require("../models/Problem");

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

async function run(req, res) {
  try {
    const { code, language, stdin, session_id } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "code and language are required" });
    }

    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    const result = await submitToJudge0({ code, languageId, stdin: stdin || "" });

    if (session_id) {
      await Session.saveSnapshot({
        sessionId: session_id,
        code,
        language,
        executionResult: result,
      }).catch(() => {});
    }

    res.json(result);
  } catch (err) {
    handleExecutionError(err, res);
  }
}

async function runTests(req, res) {
  try {
    const { code, language, problem_id } = req.body;

    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) {
      return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    const problem = await Problem.findById(problem_id);
    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    const results = [];
    for (const testCase of problem.test_cases) {
      const wrappedCode = wrapCode(code, language, testCase.input);
      const execution = await submitToJudge0({ code: wrappedCode, languageId, stdin: "" });
      const stdout = (execution.stdout || "").trim();
      const passed = checkOutput(stdout, testCase.expected);
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        got: stdout || null,
        passed,
        status: execution.status,
        time: execution.time,
        stderr: execution.stderr || null,
      });
    }

    const passedCount = results.filter((r) => r.passed).length;
    res.json({ results, passedCount, totalCount: results.length, allPassed: passedCount === results.length });
  } catch (err) {
    handleExecutionError(err, res);
  }
}

async function submitToJudge0({ code, languageId, stdin }) {
  const response = await axios.post(
    `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    { source_code: code, language_id: languageId, stdin, cpu_time_limit: 5, memory_limit: 128000 },
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
  };
}

function checkOutput(stdout, expected) {
  try {
    return JSON.stringify(JSON.parse(stdout)) === JSON.stringify(expected);
  } catch {
    return stdout === String(expected);
  }
}

function wrapCode(code, language, input) {
  const argsJson = JSON.stringify(Object.values(input));
  if (language === "javascript") {
    return `${code}\nconst args = ${argsJson};\nconst fns = [twoSum,isValid,lengthOfLongestSubstring,levelOrder,mergeKLists].filter(f=>{try{return typeof f==='function';}catch{return false;}});\nif(fns.length>0){try{console.log(JSON.stringify(fns[0](...args)));}catch(e){console.error(e.message);}}`;
  }
  if (language === "python") {
    return `${code}\nimport json\nargs=json.loads('${argsJson.replace(/'/g, "\\'")}')\nfor fn in [globals().get(f) for f in ['two_sum','is_valid','length_of_longest_substring','level_order','merge_k_lists']]:\n    if fn:\n        print(json.dumps(fn(*args)))\n        break`;
  }
  return code;
}

function handleExecutionError(err, res) {
  if (err.code === "ECONNREFUSED") {
    return res.status(503).json({ error: "Code execution service unavailable" });
  }
  if (err.code === "ETIMEDOUT") {
    return res.status(504).json({ error: "Code execution timed out" });
  }
  console.error("Execution error:", err.message);
  res.status(500).json({ error: "Execution failed" });
}

module.exports = { run, runTests };
