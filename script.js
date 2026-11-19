const sampleRounds = [
  {
    title: "Quick Fire",
    description: "5 questions",
    time: 30,
    questions: [
      { text: "What is the opposite of 'slow'?", answer: "fast" },
      { text: "Which word means a place to sleep in the woods?", answer: "tent" },
      { text: "Name the largest ocean on Earth.", answer: "pacific" },
      { text: "What is the frozen form of water?", answer: "ice" },
      { text: "Which direction is opposite of west?", answer: "east" }
    ]
  },
  {
    title: "Picture Words",
    description: "5 questions",
    time: 25,
    questions: [
      { text: "A person who flies an aircraft is a?", answer: "pilot" },
      { text: "What do bees make?", answer: "honey" },
      { text: "Name the bright star at the center of our solar system.", answer: "sun" },
      { text: "What is the color of a clear daytime sky?", answer: "blue" },
      { text: "What do you call a baby cat?", answer: "kitten" }
    ]
  },
  {
    title: "Final Challenge",
    description: "5 questions",
    time: 20,
    questions: [
      { text: "Which word means to continue despite difficulty?", answer: "persist" },
      { text: "Name the process by which plants make food.", answer: "photosynthesis" },
      { text: "What is 12 divided by 3?", answer: "four" },
      { text: "Which bird is a symbol of peace?", answer: "dove" },
      { text: "Name the first month of the year.", answer: "january" }
    ]
  }
];

let rounds = structuredClone(sampleRounds);
let activeRound = 0;
let activeQuestion = 0;
let score = 0;
let secondsLeft = 30;
let timerId = null;
let playerName = "Guest";

const $ = (id) => document.getElementById(id);

function showView(id) {
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderRoundPreview() {
  $("roundPreview").innerHTML = rounds.map((round, index) => `
    <div class="round-item">
      <span class="round-number">${index + 1}</span>
      <strong>${escapeHtml(round.title)}</strong>
      <small>${round.questions.length} questions</small>
    </div>
  `).join("");
  $("adminRoundCount").textContent = rounds.length;
  $("adminQuestionCount").textContent = rounds.reduce((total, round) => total + round.questions.length, 0);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function normalizeAnswer(value) {
  return value.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function startContest() {
  activeRound = 0;
  activeQuestion = 0;
  score = 0;
  $("scoreValue").textContent = "0";
  showView("gameView");
  loadQuestion();
}

function loadQuestion() {
  clearInterval(timerId);
  const round = rounds[activeRound];
  const question = round.questions[activeQuestion];
  secondsLeft = round.time;

  $("roundLabel").textContent = `Round ${activeRound + 1} of ${rounds.length}`;
  $("roundTitle").textContent = round.title;
  $("questionCounter").textContent = `Question ${activeQuestion + 1} of ${round.questions.length}`;
  $("questionText").textContent = question.text;
  $("answerInput").value = "";
  $("answerError").textContent = "";
  $("answerInput").disabled = false;
  $("answerInput").focus();
  $("timer").textContent = secondsLeft;

  const completedBeforeRound = rounds.slice(0, activeRound).reduce((sum, item) => sum + item.questions.length, 0);
  const total = rounds.reduce((sum, item) => sum + item.questions.length, 0);
  const progress = ((completedBeforeRound + activeQuestion) / total) * 100;
  $("progressBar").style.width = `${progress}%`;

  renderMiniLeaderboard();
  timerId = setInterval(() => {
    secondsLeft -= 1;
    $("timer").textContent = secondsLeft;
    if (secondsLeft <= 0) submitAnswer(true);
  }, 1000);
}

function submitAnswer(timedOut = false) {
  clearInterval(timerId);
  const round = rounds[activeRound];
  const question = round.questions[activeQuestion];
  const answer = normalizeAnswer($("answerInput").value);

  if (!timedOut && !answer) {
    $("answerError").textContent = "Please enter a one-word answer.";
    timerId = setInterval(() => {
      secondsLeft -= 1;
      $("timer").textContent = secondsLeft;
      if (secondsLeft <= 0) submitAnswer(true);
    }, 1000);
    return;
  }

  if (!timedOut && (/\s/.test($("answerInput").value.trim()) || $("answerInput").value.trim().includes("-"))) {
    $("answerError").textContent = "Answer must contain exactly one word.";
    timerId = setInterval(() => {
      secondsLeft -= 1;
      $("timer").textContent = secondsLeft;
      if (secondsLeft <= 0) submitAnswer(true);
    }, 1000);
    return;
  }

  if (answer === normalizeAnswer(question.answer)) {
    score += 100 + secondsLeft * 2;
    $("scoreValue").textContent = score;
  }

  activeQuestion += 1;
  if (activeQuestion >= round.questions.length) {
    activeRound += 1;
    activeQuestion = 0;
  }

  if (activeRound >= rounds.length) {
    finishContest();
  } else {
    setTimeout(loadQuestion, 350);
  }
}

function finishContest() {
  $("progressBar").style.width = "100%";
  saveScore();
  showView("leaderboardView");
  renderLeaderboard();
}

function getScores() {
  try {
    return JSON.parse(localStorage.getItem("wordquest-scores") || "[]");
  } catch {
    return [];
  }
}

function saveScore() {
  const scores = getScores();
  scores.push({ name: playerName, score });
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem("wordquest-scores", JSON.stringify(scores.slice(0, 20)));
}

function renderLeaderboard() {
  const scores = getScores();
  const fallback = [
    { name: "Aisha", score: 1180 },
    { name: "Mateo", score: 1040 },
    { name: "Priya", score: 920 }
  ];
  const rows = scores.length ? scores : fallback;
  $("leaderboardRows").innerHTML = rows.map((entry, index) => `
    <div class="leaderboard-row">
      <span class="rank">${index + 1}</span>
      <strong>${escapeHtml(entry.name)}</strong>
      <strong>${entry.score}</strong>
    </div>
  `).join("");
}

function renderMiniLeaderboard() {
  const rows = [
    { name: playerName || "You", score },
    { name: "Aisha", score: 840 },
    { name: "Mateo", score: 760 }
  ].sort((a, b) => b.score - a.score).slice(0, 5);
  $("miniLeaderboard").innerHTML = rows.map((entry, index) => `
    <div class="mini-row"><strong>${index + 1}</strong><span>${escapeHtml(entry.name)}</span><strong>${entry.score}</strong></div>
  `).join("");
}

async function parseQuestionFile(file) {
  let text = "";
  if (file.name.toLowerCase().endsWith(".txt") || file.type === "text/plain") {
    text = await file.text();
  } else {
    throw new Error("Please upload a .txt file.");
  }

  const parsed = text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      return {
        text: parts[0],
        answer: normalizeAnswer(parts[1] || ""),
        round: Number.parseInt(parts[2]?.replace(/\D/g, ""), 10) || 1
      };
    })
    .filter((item) => item.text && item.answer);

  if (!parsed.length) throw new Error("No valid questions found. Use: Question | answer | round");

  const roundCount = Math.max(...parsed.map((item) => item.round), 1);
  rounds = Array.from({ length: roundCount }, (_, index) => ({
    title: `Round ${index + 1}`,
    description: "Uploaded round",
    time: 30,
    questions: parsed.filter((item) => item.round === index + 1).map(({ text, answer }) => ({ text, answer }))
  })).filter((round) => round.questions.length);

  if (!rounds.length) throw new Error("No questions could be grouped into rounds.");
  renderRoundPreview();
  $("uploadStatus").textContent = `Imported ${parsed.length} questions across ${rounds.length} round(s).`;
}

$("joinForm").addEventListener("submit", (event) => {
  event.preventDefault();
  playerName = $("playerName").value.trim();
  if (!playerName) return;
  startContest();
});

$("answerForm").addEventListener("submit", (event) => {
  event.preventDefault();
  submitAnswer(false);
});

$("homeBtn").addEventListener("click", () => showView("homeView"));
$("leaderboardBtn").addEventListener("click", () => {
  renderLeaderboard();
  showView("leaderboardView");
});
$("adminBtn").addEventListener("click", () => showView("adminView"));
$("backHomeBtn").addEventListener("click", () => showView("homeView"));
$("adminBackBtn").addEventListener("click", () => showView("homeView"));

$("questionFile").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  $("uploadStatus").textContent = "Importing question bank...";
  try {
    await parseQuestionFile(file);
  } catch (error) {
    $("uploadStatus").textContent = error.message;
  }
});

$("resetSampleBtn").addEventListener("click", () => {
  rounds = structuredClone(sampleRounds);
  renderRoundPreview();
  $("uploadStatus").textContent = "Sample question bank restored.";
});

renderRoundPreview();
