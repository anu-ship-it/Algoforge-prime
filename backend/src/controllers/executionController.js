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
    return `
${code}

// Auto-detect and call the last defined function
const _args = ${argsJson};
const _fnNames = Object.getOwnPropertyNames(global).filter(k => typeof global[k] === 'function' && !['require','setTimeout','setInterval','clearTimeout','clearInterval','setImmediate','clearImmediate','queueMicrotask','performance','clearConsole'].includes(k));

// Try to find user-defined function
let _result;
const _lines = \`${code.replace(/`/g, "\\`")}\`.split('\\n');
const _fnMatch = _lines.map(l => l.match(/^function\\s+(\\w+)/)).filter(Boolean);
const _arrowMatch = _lines.map(l => l.match(/^(?:const|let|var)\\s+(\\w+)\\s*=/)).filter(Boolean);
const _allMatches = [..._fnMatch, ..._arrowMatch].map(m => m[1]);

if (_allMatches.length > 0) {
  const _fn = eval(_allMatches[0]);
  if (typeof _fn === 'function') {
    _result = _fn(..._args);
    console.log(JSON.stringify(_result));
  }
}
`;
  }

  if (language === "python") {
    return `
import json
import re
import sys

${code}

_args = json.loads('${argsJson.replace(/'/g, "\\'")}')
_src = open(__file__).read() if hasattr(sys, 'frozen') else '''${code.replace(/'/g, "\\'")}'''
_fns = re.findall(r'^def (\\w+)', _src, re.MULTILINE)
if _fns:
    _fn = locals().get(_fns[0]) or globals().get(_fns[0])
    if _fn:
        print(json.dumps(_fn(*_args)))
`;
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
