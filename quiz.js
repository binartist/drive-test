(function () {
  const STORAGE_PREFIX = "nz-guide-quiz-";
  const KEYS = {
    last: STORAGE_PREFIX + "last",
    best: STORAGE_PREFIX + "best",
    attempts: STORAGE_PREFIX + "attempts",
  };

  /** @type {Array<{
   *  id: string,
   *  type: 'mc'|'yn',
   *  prompt: string,
   *  options?: string[],
   *  correct: number|boolean,
   *  explain: string,
   *  image?: {src: string, alt: string},
   *  sign?: 'giveway'|'stop'|'speed50'
   * }>} */
  const QUESTIONS = [
    {
      id: "left-side",
      type: "mc",
      prompt: "In New Zealand, which side of the road do you drive on?",
      options: ["The left", "The right", "Either side on quiet roads"],
      correct: 0,
      explain: "Drive on the left. Keep left except when overtaking. You sit on the right-hand side of the car.",
      image: { src: "assets/diagram-drive-left.png", alt: "Diagram showing drive on the left and sit on the right" },
    },
    {
      id: "no-turn-red",
      type: "yn",
      prompt: "In New Zealand, may you turn right on a red light after stopping (like a US right-on-red)?",
      correct: false,
      explain: "No. A red light means stop. Wait for green, or a green arrow if one is shown. There is no free turn on red.",
    },
    {
      id: "roundabout-giveway",
      type: "mc",
      prompt: "At a roundabout, you give way to traffic coming from which direction?",
      options: ["Your left", "Your right", "Straight ahead only", "Whoever arrives first"],
      correct: 1,
      explain: "Give way to traffic already on the roundabout coming from your right. Travel clockwise and signal left when you exit.",
      image: { src: "assets/diagram-roundabout.png", alt: "Diagram of NZ roundabout give-way and exit signalling" },
    },
    {
      id: "roundabout-exit",
      type: "mc",
      prompt: "When you leave a roundabout, which signal should you use?",
      options: ["Indicate right", "Indicate left", "No signal is needed", "Hazard lights"],
      correct: 1,
      explain: "Always indicate left as you exit. For a right turn or more than halfway around, indicate right on approach, then left to leave.",
    },
    {
      id: "uncontrolled",
      type: "mc",
      prompt: "At an uncontrolled crossroads (no signs or lights), who do you give way to?",
      options: ["Traffic from your left", "Traffic from your right", "Anyone turning", "The faster vehicle"],
      correct: 1,
      explain: "Give way to traffic coming from your right. At a T-intersection, if your road ends, you give way to the through road.",
      image: { src: "assets/diagram-give-way.png", alt: "Diagram of NZ give-way rules at crossroads" },
    },
    {
      id: "solid-yellow",
      type: "mc",
      prompt: "What does a solid yellow line along the kerb mean?",
      options: ["No parking for more than 5 minutes", "No stopping — not even briefly", "Loading zone only", "Bus stop after 6 pm"],
      correct: 1,
      explain: "Solid yellow = no stopping (not even briefly). Broken yellow = no parking; a brief passenger drop-off is OK only if you stay with the car. Always read the pole sign too.",
      image: { src: "assets/diagram-parking.png", alt: "Diagram of NZ solid and broken yellow kerb lines" },
    },
    {
      id: "broken-yellow",
      type: "yn",
      prompt: "A broken yellow kerb line usually means you may briefly drop off a passenger if you stay with the car (and the pole sign allows it).",
      correct: true,
      explain: "Yes. Broken yellow = no parking. Brief drop-off can be fine if you remain with the vehicle — but the pole sign still wins for time limits and paid zones.",
    },
    {
      id: "giveway-vs-stop",
      type: "mc",
      prompt: "Which sign always requires a full stop before you go?",
      options: ["Give Way (inverted triangle)", "Stop (red octagon)", "Keep Left (blue circle)", "Speed limit (red circle)"],
      correct: 1,
      explain: "Stop (red octagon) means a full stop, then go when clear. Give Way means slow and yield — stop only if needed.",
      sign: "stop",
    },
    {
      id: "speed-unit",
      type: "mc",
      prompt: "Speed limits and speedometers in New Zealand use which unit?",
      options: ["Miles per hour (mph)", "Kilometres per hour (km/h)", "Knots", "Either — signs show both"],
      correct: 1,
      explain: "Everything is in kilometres per hour. Open road is often 100 km/h; towns are commonly 50. School zones may drop to 40.",
      sign: "speed50",
    },
    {
      id: "petrol-91",
      type: "mc",
      prompt: "Most rental cars in New Zealand take which petrol grade?",
      options: ["91", "95", "98", "Diesel only"],
      correct: 0,
      explain: "Most rentals take 91. Always match the sticker on the fuel flap. Never put petrol in a diesel car (or the reverse).",
      image: { src: "assets/diagram-petrol.png", alt: "Step diagram for filling petrol in New Zealand" },
    },
    {
      id: "seatbelts",
      type: "yn",
      prompt: "Everyone in the vehicle must wear a seatbelt (where fitted), and your phone must be hands-free while driving.",
      correct: true,
      explain: "Yes. Seatbelts for all occupants, and phones must be hands-free. Plan to pull over safely if you need to use the phone.",
    },
    {
      id: "one-lane",
      type: "mc",
      prompt: "Approaching a one-lane bridge, what should you do first?",
      options: [
        "Speed up so you clear it quickly",
        "Always stop and wave the other car through",
        "Check the priority / give-way sign before you enter",
        "Sound the horn and keep going",
      ],
      correct: 2,
      explain: "Look for the priority or give-way arrow sign. One direction has priority; the other must wait. Enter only when the bridge is clear for you.",
      image: { src: "assets/photo-one-lane-bridge.jpg", alt: "Single-lane bridge in New Zealand" },
    },
    {
      id: "p60",
      type: "mc",
      prompt: "A blue sign showing “P” and “60” usually means:",
      options: [
        "Parking is free for 60 hours",
        "You may park for up to 60 minutes (check the time panel)",
        "Only buses may stop for 60 seconds",
        "No parking after 6:00"
      ],
      correct: 1,
      explain: "Blue P with a number is a time limit in minutes. Always read any hours panel under the sign as well.",
      sign: "p60"
    },
    {
      id: "clearway",
      type: "yn",
      prompt: "During clearway hours you may briefly stop to drop off a passenger.",
      correct: false,
      explain: "No. Clearway means no stopping during the posted times — not even for a quick drop-off. Find another bay."
    },
  ];

  const els = {
    last: document.getElementById("quizLast"),
    intro: document.getElementById("quizIntro"),
    active: document.getElementById("quizActive"),
    results: document.getElementById("quizResults"),
    start: document.getElementById("quizStart"),
    lastSession: null,
    progressLabel: document.getElementById("quizProgressLabel"),
    progressFill: document.getElementById("quizProgressFill"),
    media: document.getElementById("quizMedia"),
    question: document.getElementById("quizQuestion"),
    options: document.getElementById("quizOptions"),
    feedback: document.getElementById("quizFeedback"),
    next: document.getElementById("quizNext"),
    scoreBig: document.getElementById("quizScoreBig"),
    scoreMsg: document.getElementById("quizScoreMsg"),
    review: document.getElementById("quizReview"),
    retake: document.getElementById("quizRetake"),
    session: document.getElementById("quizSession"),
    screen: document.getElementById("screen-quiz"),
    done: document.getElementById("quizDone"),
  };

  // Require quiz screen elements (no drawer)
  if (!els.screen || !els.session || !els.active || !els.start) return;

  let index = 0;
  /** @type {{selected: (number|boolean|null), correct: boolean|null}[]} */
  let answers = [];
  let answeredThis = false;
  let ignoringHash = false;

  function signSvg(kind) {
    if (kind === "giveway") {
      return `<svg viewBox="0 0 80 80" width="72" height="72" role="img" aria-label="Give Way sign">
        <polygon points="40,8 74,70 6,70" fill="#fff" stroke="#c8102e" stroke-width="5"/>
        <text x="40" y="58" text-anchor="middle" font-size="11" font-weight="700" fill="#1c2430" font-family="system-ui,sans-serif">GIVE WAY</text>
      </svg>`;
    }
    if (kind === "stop") {
      return `<svg viewBox="0 0 80 80" width="72" height="72" role="img" aria-label="Stop sign">
        <polygon points="40,6 66,18 74,44 66,70 40,78 14,70 6,44 14,18" fill="#c8102e" stroke="#fff" stroke-width="3"/>
        <text x="40" y="46" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">STOP</text>
      </svg>`;
    }
    if (kind === "speed50") {
      return `<svg viewBox="0 0 80 80" width="72" height="72" role="img" aria-label="50 km/h speed limit sign">
        <circle cx="40" cy="40" r="30" fill="#fff" stroke="#c8102e" stroke-width="5"/>
        <text x="40" y="46" text-anchor="middle" font-size="22" font-weight="700" fill="#1c2430" font-family="system-ui,sans-serif">50</text>
      </svg>`;
    }
    if (kind === "p60") {
      return `<svg viewBox="0 0 80 80" width="72" height="72" role="img" aria-label="P60 parking sign">
        <rect x="18" y="10" width="44" height="60" rx="4" fill="#0b5cab"/>
        <text x="40" y="36" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" font-family="system-ui,sans-serif">P</text>
        <text x="40" y="56" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" font-family="system-ui,sans-serif">60</text>
      </svg>`;
    }
    return "";
  }

  function loadLast() {
    try {
      const raw = localStorage.getItem(KEYS.last);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function formatWhen(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  }

  function summaryHtml(last, best, attempts) {
    return (
      `<strong>Last attempt:</strong> ${last.score}/${last.total}` +
      ` · ${formatWhen(last.at)}` +
      (attempts > 1 ? ` · Best: ${best}/${last.total} · ${attempts} attempts` : "")
    );
  }

  function showLastSummary() {
    const last = loadLast();
    const bestRaw = localStorage.getItem(KEYS.best);
    const attempts = Number(localStorage.getItem(KEYS.attempts) || "0");
    const targets = [els.last, els.lastSession].filter(Boolean);
    if (!last) {
      targets.forEach((el) => {
        el.hidden = true;
        el.textContent = "";
      });
      return;
    }
    const best = bestRaw != null ? Number(bestRaw) : last.score;
    const html = summaryHtml(last, best, attempts);
    targets.forEach((el) => {
      el.hidden = false;
      el.innerHTML = html;
    });
  }

  function persistResult(score, total, perQuestion) {
    const payload = {
      score,
      total,
      at: new Date().toISOString(),
      perQuestion,
      answers: answers.map((a) => a.selected),
    };
    localStorage.setItem(KEYS.last, JSON.stringify(payload));
    const prevBest = Number(localStorage.getItem(KEYS.best) || "0");
    if (score >= prevBest) localStorage.setItem(KEYS.best, String(score));
    const attempts = Number(localStorage.getItem(KEYS.attempts) || "0") + 1;
    localStorage.setItem(KEYS.attempts, String(attempts));

    // Optional checklist tick
    const quizTodo = document.querySelector('#todoList input[data-key="quiz"]');
    if (quizTodo && !quizTodo.checked) {
      quizTodo.checked = true;
      localStorage.setItem("nz-guide-todo-quiz", "1");
    }
  }

  function setView(view) {
    if (els.intro) els.intro.hidden = view !== "intro";
    els.active.hidden = view !== "active";
    els.results.hidden = view !== "results";
    const title = document.getElementById("quizSessionTitle");
    if (title) {
      title.textContent =
        view === "results" ? "Your result" :
        view === "active" ? "Question time" :
        "Practice quiz";
    }
    syncQuizChrome(view);
  }

  function syncQuizChrome(view) {
    const nested = view === "active" || view === "results";
    document.dispatchEvent(
      new CustomEvent("nz-set-nested", {
        detail: {
          on: nested,
          title: view === "results" ? "Your result" : view === "active" ? "Knowledge check" : null,
        },
      })
    );
  }

  function isMidQuiz() {
    return els.active && !els.active.hidden;
  }

  function isResultsView() {
    return els.results && !els.results.hidden;
  }

  function resetToIntro({ updateHash = true } = {}) {
    index = 0;
    answers = [];
    answeredThis = false;
    setView("intro");
    showLastSummary();
    if (updateHash && currentRoute() === "quiz" && quizSub() !== "") {
      ignoringHash = true;
      history.replaceState(null, "", "#/quiz");
      requestAnimationFrame(() => { ignoringHash = false; });
    }
  }

  function scrollQuizTop(smooth) {
    window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  }

  function currentRoute() {
    const raw = (location.hash || "").replace(/^#/, "");
    const route = raw.startsWith("/") ? raw.slice(1) : raw;
    return (route.split(/[/?#]/)[0] || "").toLowerCase();
  }

  /** Subpath under #/quiz — "" hub, "session" questions, "results" score. */
  function quizSub() {
    const raw = (location.hash || "").replace(/^#/, "");
    const route = raw.startsWith("/") ? raw.slice(1) : raw;
    const parts = route.split(/[/?#]/).filter(Boolean);
    if ((parts[0] || "").toLowerCase() !== "quiz") return null;
    return (parts[1] || "").toLowerCase();
  }

  function goQuizHash(sub, { replace = false } = {}) {
    const hash = sub ? "#/quiz/" + sub : "#/quiz";
    if (location.hash === hash) return;
    if (replace) history.replaceState(null, "", hash);
    else location.hash = hash;
  }

  /** Navigate to the quiz screen (hash routing via app.js). */
  function openQuizHub() {
    if (currentRoute() === "quiz") {
      resetToIntro({ updateHash: true });
      scrollQuizTop(false);
      requestAnimationFrame(() => els.start?.focus());
      return;
    }
    location.hash = "#/quiz";
  }

  /** Leave quiz → guide and reset intro. */
  function closeSession() {
    resetToIntro({ updateHash: false });
    syncQuizChrome("intro");
    if (currentRoute() !== "guide") {
      location.hash = "#/guide";
    }
  }

  function startQuiz() {
    index = 0;
    answers = QUESTIONS.map(() => ({ selected: null, correct: null }));
    answeredThis = false;
    // Push session hash first so app chrome can key off the route, then show questions.
    if (currentRoute() !== "quiz") {
      ignoringHash = true;
      history.replaceState(null, "", "#/quiz");
      ignoringHash = false;
    }
    const fromResults = quizSub() === "results";
    goQuizHash("session", { replace: fromResults });
    setView("active");
    renderQuestion();
    syncQuizChrome("active");
    requestAnimationFrame(() => {
      syncQuizChrome("active");
      els.question?.focus?.();
      scrollQuizTop(false);
    });
  }

  /** Header Back / Escape while nested in quiz — pop to Knowledge check hub. */
  function popQuizNested() {
    if (isMidQuiz()) {
      if (!confirm("Leave the quiz? Progress on this attempt will be lost.")) return;
    } else if (!isResultsView()) {
      return;
    }
    ignoringHash = true;
    resetToIntro({ updateHash: false });
    history.replaceState(null, "", "#/quiz");
    ignoringHash = false;
    syncQuizChrome("intro");
    scrollQuizTop(false);
  }

  function renderQuestion() {
    const q = QUESTIONS[index];
    answeredThis = false;
    els.feedback.hidden = true;
    els.feedback.textContent = "";
    els.feedback.className = "quiz-feedback";
    els.next.hidden = true;
    els.next.textContent = index === QUESTIONS.length - 1 ? "See results" : "Next question";

    els.progressLabel.textContent = `Question ${index + 1} of ${QUESTIONS.length}`;
    els.progressFill.style.width = ((index) / QUESTIONS.length) * 100 + "%";

    els.question.textContent = q.prompt;

    // Media
    els.media.innerHTML = "";
    if (q.image) {
      els.media.hidden = false;
      els.media.innerHTML = `<img src="${q.image.src}" alt="${q.image.alt}" loading="lazy" />`;
    } else if (q.sign) {
      els.media.hidden = false;
      els.media.innerHTML = `<div class="quiz-sign">${signSvg(q.sign)}</div>`;
    } else {
      els.media.hidden = true;
    }

    els.options.innerHTML = "";
    if (q.type === "yn") {
      const yes = makeOptionButton("Yes", true, 0, "Y");
      const no = makeOptionButton("No", false, 1, "N");
      yes.classList.add("is-yes");
      no.classList.add("is-no");
      els.options.append(yes, no);
      els.options.classList.add("quiz-options-yn");
    } else {
      els.options.classList.remove("quiz-options-yn");
      const letters = ["A", "B", "C", "D", "E", "F"];
      q.options.forEach((label, i) => {
        els.options.append(makeOptionButton(label, i, i, letters[i] || String(i + 1)));
      });
    }
  }

  function makeOptionButton(label, value, optionIndex, keyLabel) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-option";
    btn.dataset.value = String(value);
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    const key = document.createElement("span");
    key.className = "quiz-option-key";
    key.setAttribute("aria-hidden", "true");
    key.textContent = keyLabel;
    const text = document.createElement("span");
    text.className = "quiz-option-label";
    text.textContent = label;
    btn.append(key, text);
    btn.setAttribute("aria-label", keyLabel + ". " + label);
    btn.addEventListener("click", () => onSelect(value, btn));
    return btn;
  }

  function onSelect(value, btn) {
    if (answeredThis) return;
    answeredThis = true;
    const q = QUESTIONS[index];
    const isCorrect =
      q.type === "yn" ? value === q.correct : value === q.correct;

    answers[index] = { selected: value, correct: isCorrect };

    const buttons = [...els.options.querySelectorAll(".quiz-option")];
    buttons.forEach((b) => {
      b.disabled = true;
      b.setAttribute("aria-disabled", "true");
      const bVal =
        q.type === "yn" ? b.dataset.value === "true" : Number(b.dataset.value);
      const isThis = b === btn;
      const isRight =
        q.type === "yn" ? bVal === q.correct : bVal === q.correct;
      if (isRight) {
        b.classList.add("is-correct");
        b.setAttribute("aria-checked", isThis || isRight ? "true" : "false");
      }
      if (isThis && !isCorrect) {
        b.classList.add("is-wrong");
        b.setAttribute("aria-checked", "true");
      }
      if (isThis) b.setAttribute("aria-checked", "true");
    });

    els.feedback.hidden = false;
    els.feedback.className =
      "quiz-feedback " + (isCorrect ? "is-correct" : "is-wrong");
    els.feedback.innerHTML =
      `<strong>${isCorrect ? "Correct" : "Not quite"}</strong>` +
      `<p>${q.explain}</p>`;

    els.progressFill.style.width = ((index + 1) / QUESTIONS.length) * 100 + "%";
    els.next.hidden = false;
    els.next.focus();
  }

  function goNext() {
    if (!answeredThis) return;
    if (index < QUESTIONS.length - 1) {
      index += 1;
      renderQuestion();
      els.question.focus?.();
      scrollQuizTop(true);
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    const score = answers.filter((a) => a.correct).length;
    const total = QUESTIONS.length;
    const perQuestion = answers.map((a, i) => ({
      id: QUESTIONS[i].id,
      correct: !!a.correct,
      selected: a.selected,
    }));
    persistResult(score, total, perQuestion);
    showLastSummary();

    els.scoreBig.textContent = `${score} / ${total}`;
    let msg = "Nice start — skim the chapters you missed and try again when ready.";
    if (score === total) msg = "Perfect — you have the newcomer basics down.";
    else if (score >= Math.ceil(total * 0.8))
      msg = "Strong result. A quick review of the misses will lock it in.";
    else if (score >= Math.ceil(total * 0.5))
      msg = "Solid progress. Revisit the linked chapters, then retake when you like.";
    els.scoreMsg.textContent = msg;

    const missed = QUESTIONS.map((q, i) => ({ q, a: answers[i] })).filter(
      (x) => !x.a.correct
    );
    if (missed.length === 0) {
      els.review.innerHTML =
        '<p class="quiz-review-empty">No misses to review — well done.</p>';
    } else {
      els.review.innerHTML =
        `<h3 class="quiz-review-title">Quick review</h3>` +
        `<ul class="quiz-review-list">` +
        missed
          .map(({ q }) => {
            let right = "";
            if (q.type === "yn") right = q.correct ? "Yes" : "No";
            else right = q.options[q.correct];
            return `<li><strong>${q.prompt}</strong><span>Answer: ${right}</span><em>${q.explain}</em></li>`;
          })
          .join("") +
        `</ul>`;
    }

    setView("results");
    goQuizHash("results", { replace: true });
    scrollQuizTop(true);
  }

  function requestExitSession() {
    if (isMidQuiz()) {
      if (!confirm("Leave the quiz and return to the guide? Progress on this attempt will be lost.")) return;
    }
    closeSession();
  }

  function applyQuizHash() {
    if (currentRoute() !== "quiz") {
      if (isMidQuiz() || isResultsView()) {
        // Screen left — chrome cleared by app.js; keep data reset if abandoned
      }
      return;
    }
    const sub = quizSub();
    if (sub === "session") {
      if (!isMidQuiz()) {
        // Deep link / restore: begin a fresh attempt
        index = 0;
        answers = QUESTIONS.map(() => ({ selected: null, correct: null }));
        answeredThis = false;
        setView("active");
        renderQuestion();
      } else {
        syncQuizChrome("active");
      }
      scrollQuizTop(false);
      return;
    }
    if (sub === "results") {
      if (!isResultsView()) {
        // No results payload — fall back to hub
        resetToIntro({ updateHash: true });
        return;
      }
      syncQuizChrome("results");
      scrollQuizTop(false);
      return;
    }
    // Hub #/quiz
    if (isMidQuiz()) {
      // Popped from session via browser back
      resetToIntro({ updateHash: false });
      return;
    }
    if (isResultsView()) {
      resetToIntro({ updateHash: false });
      return;
    }
    setView("intro");
    showLastSummary();
    scrollQuizTop(false);
  }

  // When leaving the quiz screen mid-attempt via menu / hash, confirm then reset
  let wasOnQuiz = currentRoute() === "quiz";
  let wasSub = quizSub();
  window.addEventListener("hashchange", () => {
    if (ignoringHash) return;
    const onQuiz = currentRoute() === "quiz";
    const sub = quizSub();

    if (wasOnQuiz && !onQuiz && isMidQuiz()) {
      const ok = confirm("Leave the quiz? Progress on this attempt will be lost.");
      if (!ok) {
        ignoringHash = true;
        location.hash = "#/quiz/session";
        requestAnimationFrame(() => { ignoringHash = false; });
        wasOnQuiz = true;
        wasSub = "session";
        return;
      }
      resetToIntro({ updateHash: false });
      syncQuizChrome("intro");
      wasOnQuiz = false;
      wasSub = null;
      return;
    }

    if (onQuiz) {
      // Browser back from session → hub while mid-quiz: confirm
      if (wasSub === "session" && sub === "" && isMidQuiz()) {
        const ok = confirm("Leave the quiz? Progress on this attempt will be lost.");
        if (!ok) {
          ignoringHash = true;
          location.hash = "#/quiz/session";
          requestAnimationFrame(() => { ignoringHash = false; });
          wasOnQuiz = true;
          wasSub = "session";
          return;
        }
        resetToIntro({ updateHash: false });
        wasOnQuiz = true;
        wasSub = "";
        return;
      }
      applyQuizHash();
    }

    wasOnQuiz = onQuiz;
    wasSub = sub;
  });

  document.addEventListener("nz-nav-back", (e) => {
    if ((e.detail && e.detail.screen && e.detail.screen !== "quiz") || currentRoute() !== "quiz") return;
    if (!isMidQuiz() && !isResultsView()) return;
    popQuizNested();
  });

  // Intercept other screen menu links while mid-quiz (before hash flips)
  document.querySelectorAll('.toc-link[data-screen]').forEach((el) => {
    el.addEventListener("click", (e) => {
      if (el.dataset.screen === "quiz") {
        // Re-selecting Knowledge check while in session → pop to hub
        if (isMidQuiz() || isResultsView()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          popQuizNested();
        }
        return;
      }
      if (!isMidQuiz()) return;
      if (!confirm("Leave the quiz? Progress on this attempt will be lost.")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      resetToIntro({ updateHash: false });
      syncQuizChrome("intro");
    }, true);
  });

  els.start?.addEventListener("click", startQuiz);
  els.next.addEventListener("click", goNext);
  els.retake.addEventListener("click", startQuiz);
  els.done?.addEventListener("click", requestExitSession);

  // Initial: respect deep link into session/results
  if (currentRoute() === "quiz" && (quizSub() === "session" || quizSub() === "results")) {
    applyQuizHash();
  } else {
    resetToIntro({ updateHash: false });
  }
})();
