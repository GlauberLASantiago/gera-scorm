import { playerBrandCSS } from "./branding";
// Self-contained runtime: serialized into every export, without CDN or build dependencies.
export function courseRuntime(course: any, version: string, preview = false) {
  const root = document.getElementById("course")!;
  const pages = course.modules.flatMap((m: any) => m.pages);
  const allBlocks = pages.flatMap((p: any) => p.blocks);
  const game = course.gamification || {
    readingXP: 50,
    activityXP: 75,
    quizXP: 100,
    challengeXP: 200,
    levels: [
      { name: "Explorador", xp: 0 },
      { name: "Criador", xp: 300 },
      { name: "Especialista", xp: 800 },
    ],
    challenges: [],
  };
  let api: any = null;
  let initialized = false;
  let ended = false;
  const start = Date.now();
  let pageIndex = 0;
  let key = (preview ? "scorm-preview-" : "scorm-progress-") + course.id;
  let state: any = {
    completed: [],
    attempts: [],
    seconds: 0,
    location: "",
    watched: {},
    answers: {},
    coverage: {},
  };
  function discover(w: any) {
    for (let n = 0; n < 20 && w; n++) {
      try {
        const a = w[version === "1.2" ? "API" : "API_1484_11"];
        if (a) return a;
        if (w.parent === w) break;
        w = w.parent;
      } catch {
        break;
      }
    }
    return null;
  }
  if (!preview) {
    api = discover(window);
    if (!api) {
      try {
        api = discover(window.opener);
      } catch {}
    }
  }
  function call(name: string, ...args: any[]) {
    try {
      if (!api) return "";
      return api[name](...args);
    } catch {
      notice("A comunicação com o LMS falhou. Sua cópia local foi preservada.");
      return "";
    }
  }
  const names =
    version === "1.2"
      ? [
          "LMSInitialize",
          "LMSGetValue",
          "LMSSetValue",
          "LMSCommit",
          "LMSFinish",
        ]
      : ["Initialize", "GetValue", "SetValue", "Commit", "Terminate"];
  const get = (k: string) => call(names[1], k);
  const set = (k: string, v: any) => {
    if (initialized && String(call(names[2], k, String(v))) !== "true")
      notice(
        "O LMS recusou o campo " + k + ". Sua cópia local foi preservada.",
      );
  };
  function notice(message: string) {
    const el = document.getElementById("runtime-message");
    if (el) el.textContent = message;
  }
  if (api) {
    initialized = String(call(names[0], "")) === "true";
    if (initialized)
      key +=
        "-" + get(version === "1.2" ? "cmi.core.student_id" : "cmi.learner_id");
  }
  try {
    const saved = initialized
      ? get("cmi.suspend_data")
      : localStorage.getItem(key);
    if (saved) {
      const p = JSON.parse(saved);
      if (p.v === 2) {
        state.completed = p.c.map((i: number) => pages[i]?.id).filter(Boolean);
        state.location = pages[p.l]?.id || "";
        state.seconds = p.s;
        state.watched = Object.fromEntries(
          (p.w || []).map(([i, value]: [number, number]) => [
            allBlocks[i]?.id,
            value,
          ]),
        );
        state.answers = Object.fromEntries(
          (p.a || []).map((i: number) => [allBlocks[i]?.id, "completed"]),
        );
        state.attempts = (p.q || []).flatMap(
          ([i, count, score]: [number, number, number | null]) =>
            Array.from({ length: count }, () => ({
              blockId: allBlocks[i]?.id,
              score,
              answer: [],
              time: 0,
              date: "",
            })),
        );
      }
      if (Array.isArray(p.completed) && Array.isArray(p.attempts))
        state = { ...state, ...p };
    }
  } catch {}
  const sessionBase = Number(state.seconds) || 0;
  pageIndex = Math.max(
    0,
    pages.findIndex((p: any) => p.id === state.location),
  );
  function stats() {
    const latest = new Map<string, any>();
    state.attempts.forEach((a: any) => {
      if (a.score !== null) latest.set(a.blockId, a);
    });
    let total = 0,
      weights = 0;
    latest.forEach((a: any) => {
      const b = pages
        .flatMap((p: any) => p.blocks)
        .find((b: any) => b.id === a.blockId);
      const w = b?.weight || 1;
      total += a.score * w;
      weights += w;
    });
    const score = weights ? Math.round(total / weights) : 0;
    const challenges = game.challenges.filter((challenge: any) => {
      const m = course.modules.find((m: any) => m.id === challenge.moduleId);
      return (
        m?.pages.length &&
        m.pages.every((p: any) => state.completed.includes(p.id))
      );
    });
    const xp =
      state.completed.reduce(
        (n: number, id: string) =>
          n +
          (pages.find((p: any) => p.id === id)?.kind === "activity"
            ? game.activityXP
            : game.readingXP),
        0,
      ) +
      [...latest.values()].filter(
        (a: any) =>
          a.score >=
          (allBlocks.find((b: any) => b.id === a.blockId)?.passScore || 70),
      ).length *
        game.quizXP +
      challenges.length * game.challengeXP;
    const level =
      [...game.levels]
        .sort((a: any, b: any) => b.xp - a.xp)
        .find((l: any) => xp >= l.xp)?.name || "Explorador";
    return {
      score,
      xp,
      level,
      challenges,
      progress: pages.length ? state.completed.length / pages.length : 0,
      graded: weights > 0,
    };
  }
  function save() {
    if (ended) return;
    state.seconds = sessionBase + Math.round((Date.now() - start) / 1000);
    state.location = pages[pageIndex]?.id || "";
    const serialized = JSON.stringify(state);
    try {
      localStorage.setItem(key, serialized);
    } catch {
      notice("Armazenamento local indisponível.");
    }
    if (!initialized) return;
    const s = stats();
    const complete = s.progress >= 1;
    const hasQuestions = pages.some((p: any) =>
      p.blocks.some(
        (b: any) =>
          b.type === "quiz" || ["ordering", "dragdrop"].includes(b.type),
      ),
    );
    set(
      version === "1.2" ? "cmi.core.lesson_location" : "cmi.location",
      state.location,
    );
    set(version === "1.2" ? "cmi.core.score.raw" : "cmi.score.raw", s.score);
    set(version === "1.2" ? "cmi.core.score.min" : "cmi.score.min", 0);
    set(version === "1.2" ? "cmi.core.score.max" : "cmi.score.max", 100);
    if (version === "1.2")
      set(
        "cmi.core.lesson_status",
        complete
          ? hasQuestions
            ? s.score >= course.passScore
              ? "passed"
              : "failed"
            : "completed"
          : "incomplete",
      );
    else {
      set("cmi.completion_status", complete ? "completed" : "incomplete");
      set(
        "cmi.success_status",
        hasQuestions && s.graded
          ? s.score >= course.passScore
            ? "passed"
            : "failed"
          : "unknown",
      );
      set("cmi.progress_measure", s.progress.toFixed(4));
      set("cmi.score.scaled", (s.score / 100).toFixed(4));
      set("cmi.objectives.0.id", "course-mastery");
      set("cmi.objectives.0.score.scaled", (s.score / 100).toFixed(4));
      set(
        "cmi.objectives.0.success_status",
        s.score >= course.passScore ? "passed" : "failed",
      );
    }
    // Compress identifiers and attempt histories for the guaranteed 1.2 limit.
    const summary = allBlocks
      .map((b: any, i: number) => {
        const attempts = state.attempts.filter((a: any) => a.blockId === b.id);
        return attempts.length
          ? [i, attempts.length, attempts.at(-1).score]
          : null;
      })
      .filter(Boolean);
    const compact = JSON.stringify({
      v: 2,
      c: state.completed.map((id: string) =>
        pages.findIndex((p: any) => p.id === id),
      ),
      l: pageIndex,
      s: state.seconds,
      q: summary,
      w: Object.entries(state.watched).map(([id, value]) => [
        allBlocks.findIndex((b: any) => b.id === id),
        value,
      ]),
      a: allBlocks
        .map((b: any, i: number) =>
          state.answers[b.id] === "completed" ? i : null,
        )
        .filter((x: any) => x !== null),
    });
    const resume =
      serialized.length <= (version === "1.2" ? 4096 : 64000)
        ? serialized
        : compact;
    if (resume.length <= (version === "1.2" ? 4096 : 64000))
      set("cmi.suspend_data", resume);
    else
      notice(
        "O histórico excedeu o limite de retomada do SCORM. A cópia completa está salva neste navegador.",
      );
    const secs = Math.round((Date.now() - start) / 1000);
    set(
      version === "1.2" ? "cmi.core.session_time" : "cmi.session_time",
      version === "1.2"
        ? String(Math.floor(secs / 3600)).padStart(4, "0") +
            ":" +
            String(Math.floor((secs % 3600) / 60)).padStart(2, "0") +
            ":" +
            String(secs % 60).padStart(2, "0") +
            ".00"
        : "PT" + secs + "S",
    );
    set(
      version === "1.2" ? "cmi.core.exit" : "cmi.exit",
      complete ? "" : "suspend",
    );
    if (String(call(names[3], "")) !== "true")
      notice("O LMS ainda não confirmou o salvamento.");
  }
  function finish() {
    if (ended) return;
    save();
    if (initialized) call(names[4], "");
    ended = true;
  }
  window.addEventListener("pagehide", finish);
  window.addEventListener("beforeunload", finish);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });
  setInterval(save, 30000);
  function el(tag: string, text?: string, cls?: string) {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function button(text: string, fn: () => void) {
    const b = el("button", text) as HTMLButtonElement;
    b.type = "button";
    b.onclick = fn;
    return b;
  }
  function safeUrl(url: string) {
    return /^(https?:|data:(image|audio|video|application\/pdf)|media\/)/i.test(
      url,
    )
      ? url
      : "";
  }
  function input(label: string, type = "text") {
    const wrap = el("label", label);
    const field = document.createElement("input");
    field.type = type;
    wrap.append(field);
    return { wrap, field };
  }
  function interaction(
    b: any,
    answer: string[],
    score: number | null,
    elapsed: number,
  ) {
    const a = {
      blockId: b.id,
      answer,
      score,
      time: elapsed,
      date: new Date().toISOString(),
    };
    state.attempts.push(a);
    if (initialized) {
      const index = Number(get("cmi.interactions._count")) || 0;
      const base = "cmi.interactions." + index;
      set(
        base + ".id",
        b.id +
          "-attempt-" +
          state.attempts.filter((x: any) => x.blockId === b.id).length,
      );
      const type =
        b.questionType === "boolean"
          ? "true-false"
          : b.questionType === "single" || b.questionType === "multiple"
            ? "choice"
            : b.questionType === "ordering"
              ? "sequencing"
              : b.questionType === "matching"
                ? "matching"
                : "fill-in";
      set(base + ".type", type);
      const encode = (value: string) => {
        const i = b.items.findIndex((item: any) => item.id === value);
        return i < 0 ? value : i.toString(36);
      };
      const delimiter = version === "1.2" ? "," : "[,]";
      const response =
        b.questionType === "boolean"
          ? version === "1.2"
            ? answer[0] === "true"
              ? "t"
              : "f"
            : answer[0]
          : b.questionType === "matching"
            ? answer
                .map(
                  (id, i) =>
                    i.toString(36) +
                    (version === "1.2" ? "." : "[.]") +
                    encode(id),
                )
                .join(delimiter)
            : answer.map(encode).join(delimiter);
      set(
        base + (version === "1.2" ? ".student_response" : ".learner_response"),
        response.slice(0, version === "1.2" ? 255 : 4000),
      );
      set(
        base + ".result",
        score === null
          ? "neutral"
          : score >= b.passScore
            ? "correct"
            : version === "1.2"
              ? "wrong"
              : "incorrect",
      );
      set(base + ".weighting", b.weight);
      set(
        base + ".latency",
        version === "1.2"
          ? "0000:" +
              String(Math.floor(elapsed / 60) % 60).padStart(2, "0") +
              ":" +
              String(elapsed % 60).padStart(2, "0") +
              ".00"
          : "PT" + elapsed + "S",
      );
      if (version !== "1.2") set(base + ".description", b.title.slice(0, 250));
    }
    save();
  }
  function quiz(b: any, container: HTMLElement) {
    const attempts = state.attempts.filter((a: any) => a.blockId === b.id);
    const last = attempts.at(-1);
    container.append(
      el(
        "p",
        `${attempts.length}/${b.attempts} tentativas · aprovação ${b.passScore}%${b.timeLimit ? " · " + b.timeLimit + " segundos" : ""}`,
        "muted",
      ),
    );
    if (last) container.append(el("p", "Última nota: " + last.score + "%"));
    let answer: string[] = [];
    const began = Date.now();
    const form = el("form");
    const status = el("p");
    status.setAttribute("role", "status");
    if (["single", "multiple", "boolean"].includes(b.questionType)) {
      const opts =
        b.questionType === "boolean"
          ? [
              { id: "true", title: "Verdadeiro" },
              { id: "false", title: "Falso" },
            ]
          : b.items;
      opts.forEach((item: any) => {
        const { wrap, field } = input(
          item.title,
          b.questionType === "multiple" ? "checkbox" : "radio",
        );
        field.name = b.id;
        field.value = item.id;
        field.onchange = () => {
          answer =
            b.questionType === "multiple"
              ? Array.from(
                  form.querySelectorAll<HTMLInputElement>("input:checked"),
                ).map((x) => x.value)
              : [field.value];
        };
        form.append(wrap);
      });
    } else if (b.questionType === "matching") {
      const bank = el("div", undefined, "drag-bank");
      [...b.items].reverse().forEach((item: any) => {
        const token = el("span", item.detail, "drag-token");
        token.draggable = true;
        token.ondragstart = (e) =>
          e.dataTransfer?.setData("text/plain", item.id);
        bank.append(token);
      });
      form.append(
        el(
          "p",
          "Arraste uma resposta para o conceito ou use a lista de seleção.",
        ),
        bank,
      );
      b.items.forEach((item: any) => {
        const label = el("label", item.title);
        const select = document.createElement("select");
        select.append(new Option("Selecione", ""));
        [...b.items]
          .reverse()
          .forEach((target: any) =>
            select.append(new Option(target.detail, target.id)),
          );
        select.onchange = () => {
          answer = b.items.map(
            (_: any, i: number) =>
              (form.querySelectorAll("select")[i] as HTMLSelectElement).value,
          );
        };
        label.ondragover = (e) => e.preventDefault();
        label.ondrop = (e) => {
          e.preventDefault();
          const id = e.dataTransfer?.getData("text/plain") || "";
          if (b.items.some((x: any) => x.id === id)) {
            select.value = id;
            select.dispatchEvent(new Event("change"));
          }
        };
        label.append(select);
        form.append(label);
      });
    } else if (b.questionType === "ordering") {
      let order = [...b.items].reverse();
      const list = el("div");
      const render = () => {
        list.replaceChildren();
        order.forEach((item: any, i: number) => {
          const row = el("div", item.title, "order-row");
          row.draggable = true;
          row.ondragstart = (e) =>
            e.dataTransfer?.setData("text/plain", String(i));
          row.ondragover = (e) => e.preventDefault();
          row.ondrop = (e) => {
            e.preventDefault();
            const from = Number(e.dataTransfer?.getData("text/plain"));
            order.splice(i, 0, order.splice(from, 1)[0]);
            render();
          };
          row.append(
            button("↑", () => {
              if (i) {
                [order[i - 1], order[i]] = [order[i], order[i - 1]];
                render();
              }
            }),
            button("↓", () => {
              if (i < order.length - 1) {
                [order[i + 1], order[i]] = [order[i], order[i + 1]];
                render();
              }
            }),
          );
          list.append(row);
        });
        answer = order.map((i: any) => i.id);
      };
      render();
      form.append(list);
    } else {
      const field = document.createElement("textarea");
      field.rows = 4;
      field.setAttribute("aria-label", "Sua resposta");
      field.placeholder = "Complete a lacuna";
      field.oninput = () => (answer = [field.value]);
      form.append(field);
    }
    const submit = el("button", "Enviar resposta") as HTMLButtonElement;
    submit.type = "submit";
    submit.disabled = attempts.length >= b.attempts;
    form.onsubmit = (e) => {
      e.preventDefault();
      if (
        state.attempts.filter((a: any) => a.blockId === b.id).length >=
        b.attempts
      ) {
        status.textContent = "Você atingiu o limite de tentativas.";
        return;
      }
      if (!answer.length || answer.some((x) => !x.trim())) {
        status.textContent = "Responda antes de enviar.";
        return;
      }
      const elapsed = Math.round((Date.now() - began) / 1000);
      const correct =
        b.questionType === "ordering"
          ? b.items.map((i: any) => i.id)
          : b.questionType === "matching"
            ? b.items.map((i: any) => i.id)
            : b.correct;
      const normalize = (s: string) => s.trim().toLowerCase();
      const a = b.questionType === "multiple" ? [...answer].sort() : answer;
      const c = b.questionType === "multiple" ? [...correct].sort() : correct;
      let score =
        a.map(normalize).join("|") === c.map(normalize).join("|") ? 100 : 0;
      if (b.timeLimit && elapsed > b.timeLimit) score = 0;
      interaction(b, answer, score, elapsed);
      quizRefresh();
    };
    function quizRefresh() {
      container.replaceChildren(el("h2", b.title));
      quiz(b, container);
    }
    form.append(submit, status);
    container.append(form);
    if (last) container.append(el("p", b.feedback, "feedback"));
  }
  function block(b: any) {
    const card = el("section", undefined, "block");
    card.append(el("h2", b.title));
    const cueArea = el("div", undefined, "cue-area");
    const showCue = (cue: any, resume?: () => void) => {
      if (state.answers[cue.id]) return;
      cueArea.replaceChildren(el("h3", cue.question));
      const field = document.createElement("input");
      field.setAttribute("aria-label", cue.question);
      const result = el("p");
      result.setAttribute("role", "status");
      cueArea.append(
        field,
        button("Responder", () => {
          if (!field.value.trim()) return;
          if (
            cue.answer &&
            field.value.trim().toLowerCase() !== cue.answer.trim().toLowerCase()
          ) {
            result.textContent = "Revise sua resposta e tente novamente.";
            return;
          }
          state.answers[cue.id] = field.value;
          result.textContent = "Resposta registrada.";
          save();
          resume?.();
        }),
        result,
      );
    };
    switch (b.type) {
      case "heading":
        card.classList.add("hero");
        card.append(el("p", b.body));
        break;
      case "text": {
        const content = el("div");
        content.innerHTML = b.body;
        content
          .querySelectorAll("script,iframe,object,embed,style")
          .forEach((x) => x.remove());
        content.querySelectorAll("*").forEach((x) =>
          Array.from(x.attributes).forEach((a) => {
            if (
              a.name.startsWith("on") ||
              (/^(href|src)$/i.test(a.name) && !safeUrl(a.value))
            )
              x.removeAttribute(a.name);
          }),
        );
        card.append(content);
        break;
      }
      case "quote":
        card.append(el("blockquote", b.body));
        break;
      case "code": {
        const pre = el("pre");
        pre.append(el("code", b.body));
        card.append(pre);
        break;
      }
      case "formula":
        {
          const formula = el("div", undefined, "formula");
          if (b.formulaHtml) formula.innerHTML = b.formulaHtml;
          else formula.textContent = b.body;
          card.append(formula);
        }
        break;
      case "table": {
        const table = el("table");
        b.body.split("\n").forEach((line: string, i: number) => {
          const row = el("tr");
          line
            .split("|")
            .forEach((cell: string) => row.append(el(i ? "td" : "th", cell)));
          table.append(row);
        });
        card.append(table);
        break;
      }
      case "image": {
        const img = document.createElement("img");
        img.src = safeUrl(b.url);
        img.alt = b.alt;
        card.append(img);
        break;
      }
      case "link": {
        const a = el("a", b.body || "Abrir recurso") as HTMLAnchorElement;
        a.href = safeUrl(b.url);
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        card.append(a);
        break;
      }
      case "video":
      case "audio": {
        const watchedLabel = el(
          "p",
          "Assistido: " + (state.watched[b.id] || 0) + "%",
        );
        const covered = new Set<number>(state.coverage[b.id] || []);
        let previous = -1;
        let lastTick = Date.now();
        const track = (
          seconds: number,
          duration: number,
          pause: () => void,
          resume: () => void,
        ) => {
          const elapsed = (Date.now() - lastTick) / 1000;
          const delta = seconds - previous;
          if (
            previous >= 0 &&
            delta > 0 &&
            delta <= Math.max(2, elapsed * 1.5)
          ) {
            for (let s = Math.floor(previous); s < Math.floor(seconds); s++)
              covered.add(s);
          }
          previous = seconds;
          lastTick = Date.now();
          state.coverage[b.id] = [...covered];
          if (duration > 0) {
            state.watched[b.id] = Math.max(
              state.watched[b.id] || 0,
              Math.min(100, Math.round((covered.size / duration) * 100)),
            );
            watchedLabel.textContent =
              "Assistido: " + state.watched[b.id] + "%";
          }
          const cue = (b.cues || []).find(
            (c: any) => seconds >= c.seconds && !state.answers[c.id],
          );
          if (cue) {
            pause();
            showCue(cue, resume);
          }
        };
        let external: URL | null = null;
        try {
          external = new URL(b.url);
        } catch {}
        const youtube =
          external &&
          [
            "youtube.com",
            "www.youtube.com",
            "youtu.be",
            "www.youtube-nocookie.com",
          ].includes(external.hostname);
        const vimeo =
          external &&
          ["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(
            external.hostname,
          );
        if (youtube || vimeo) {
          const frame = document.createElement("iframe");
          frame.title = b.title;
          frame.height = "380";
          frame.allow = "fullscreen; autoplay";
          frame.allowFullscreen = true;
          const path = external!.pathname.split("/").filter(Boolean);
          const id = youtube
            ? external!.searchParams.get("v") || path.at(-1)
            : path.at(-1);
          if (id && /^[a-zA-Z0-9_-]+$/.test(id)) {
            frame.src = youtube
              ? "https://www.youtube-nocookie.com/embed/" +
                id +
                "?enablejsapi=1"
              : "https://player.vimeo.com/video/" + id + "?api=1";
            card.append(frame);
            const origin = youtube
              ? "https://www.youtube-nocookie.com"
              : "https://player.vimeo.com";
            const send = (method: string) =>
              frame.contentWindow?.postMessage(
                JSON.stringify(
                  youtube
                    ? { event: "command", func: method, args: [] }
                    : { method },
                ),
                origin,
              );
            const receive = (e: MessageEvent) => {
              if (e.source !== frame.contentWindow || e.origin !== origin)
                return;
              let data = e.data;
              try {
                if (typeof data === "string") data = JSON.parse(data);
              } catch {
                return;
              }
              if (
                youtube &&
                data.event === "infoDelivery" &&
                data.info?.currentTime !== undefined
              )
                track(
                  data.info.currentTime,
                  data.info.duration || 0,
                  () => send("pauseVideo"),
                  () => send("playVideo"),
                );
              if (vimeo && data.event === "timeupdate")
                track(
                  data.data.seconds,
                  data.data.duration,
                  () => send("pause"),
                  () => send("play"),
                );
            };
            window.addEventListener("message", receive);
            frame.onload = () => {
              if (youtube)
                frame.contentWindow?.postMessage(
                  JSON.stringify({
                    event: "listening",
                    id: b.id,
                    channel: "studio",
                  }),
                  origin,
                );
              else
                frame.contentWindow?.postMessage(
                  JSON.stringify({
                    method: "addEventListener",
                    value: "timeupdate",
                  }),
                  origin,
                );
            };
          }
          const link = el(
            "a",
            "Assistir ao vídeo externo",
          ) as HTMLAnchorElement;
          link.href = safeUrl(b.url);
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          card.append(
            link,
            el(
              "p",
              "Se o provedor bloquear o player incorporado, abra o vídeo no site e confirme a visualização.",
            ),
          );
          card.append(
            button("Confirmar que assisti", () => {
              state.watched[b.id] = 100;
              save();
              render();
            }),
          );
        } else {
          const media = document.createElement(b.type) as HTMLMediaElement;
          media.controls = true;
          media.preload = "metadata";
          media.src = safeUrl(b.url);
          if (b.captions) {
            const captions = document.createElement("track");
            captions.kind = "captions";
            captions.label = "Português";
            captions.srclang = "pt-BR";
            captions.default = true;
            captions.src =
              "data:text/vtt;charset=utf-8," + encodeURIComponent(b.captions);
            media.append(captions);
          }
          media.ontimeupdate = () => {
            if (isFinite(media.duration))
              track(
                media.currentTime,
                media.duration,
                () => media.pause(),
                () => {
                  media.play().catch(() => {});
                },
              );
          };
          media.onended = () => {
            save();
          };
          card.append(media);
        }
        card.append(watchedLabel, cueArea);
        if (b.alt) card.append(el("p", b.alt));
        break;
      }
      case "pdf": {
        const frame = document.createElement("iframe");
        frame.title = b.title;
        frame.src = safeUrl(b.url);
        frame.height = "520";
        card.append(frame);
        const notes = document.createElement("textarea");
        notes.placeholder = "Suas anotações sobre o documento";
        notes.setAttribute("aria-label", "Anotações do PDF");
        notes.value = state.answers[b.id] || "";
        notes.onchange = () => {
          state.answers[b.id] = notes.value;
          save();
        };
        card.append(notes);
        const marks = el("div");
        const pageNumber = input("Página do PDF", "number");
        pageNumber.field.min = "1";
        pageNumber.field.value = "1";
        const selection = input("Trecho / marcação");
        const markList = el("ul");
        const renderMarks = () => {
          markList.replaceChildren();
          (state.answers[b.id + "-marks"] || []).forEach((mark: any) =>
            markList.append(el("li", "Página " + mark.page + ": " + mark.text)),
          );
        };
        renderMarks();
        marks.append(
          pageNumber.wrap,
          selection.wrap,
          button("Salvar marcação", () => {
            if (!selection.field.value.trim()) return;
            state.answers[b.id + "-marks"] = [
              ...(state.answers[b.id + "-marks"] || []),
              {
                page: Math.max(1, +pageNumber.field.value),
                text: selection.field.value,
              },
            ];
            selection.field.value = "";
            save();
            renderMarks();
          }),
          markList,
        );
        card.append(marks);
        (b.cues || []).forEach((cue: any) => {
          const area = el("div");
          area.append(button(cue.question, () => showCue(cue)));
          card.append(area);
        });
        card.append(cueArea);
        break;
      }
      case "quiz":
        card.replaceChildren(el("h2", b.title));
        quiz(b, card);
        break;
      case "flashcards":
        b.items.forEach((i: any) => {
          let back = false;
          const flip = button(i.title, () => {
            back = !back;
            flip.textContent = back ? i.detail : i.title;
            flip.setAttribute("aria-pressed", String(back));
          });
          flip.className = "flashcard";
          flip.setAttribute("aria-pressed", "false");
          card.append(flip);
        });
        break;
      case "timeline": {
        const list = el("ol", undefined, "timeline");
        b.items.forEach((i: any) => {
          const li = el("li");
          li.append(el("h3", i.title), el("p", i.detail));
          if (i.date) li.prepend(el("time", i.date));
          if (i.image) {
            const image = document.createElement("img");
            image.src = safeUrl(i.image);
            image.alt = i.title;
            li.append(image);
          }
          list.append(li);
        });
        card.append(list);
        break;
      }
      case "hotspot": {
        const stage = el("div", undefined, "hotspot");
        const img = document.createElement("img");
        img.src = safeUrl(b.url);
        img.alt = b.alt;
        stage.append(img);
        const info = el("p", "Selecione um ponto para explorar.");
        info.setAttribute("role", "status");
        b.items.forEach((i: any, n: number) => {
          const dot = button(
            String(n + 1),
            () => (info.textContent = i.title + ": " + i.detail),
          );
          dot.style.left = (i.x ?? 25 + n * 30) + "%";
          dot.style.top = (i.y ?? 50) + "%";
          dot.setAttribute("aria-label", i.title);
          stage.append(dot);
        });
        card.append(stage, info);
        (b.cues || []).forEach((cue: any) =>
          card.append(button(cue.question, () => showCue(cue))),
        );
        card.append(cueArea);
        break;
      }
      case "ordering":
      case "dragdrop":
        quiz(
          {
            ...b,
            type: "quiz",
            questionType: b.type === "ordering" ? "ordering" : "matching",
          },
          card,
        );
        break;
      case "scenario": {
        let current = b.items[0];
        const scene = el("div");
        const visited = new Set<string>();
        const draw = () => {
          scene.replaceChildren();
          if (!current) {
            scene.append(el("p", "Cenário concluído."));
            return;
          }
          visited.add(current.id);
          scene.append(el("h3", current.title), el("p", current.detail));
          const next = current.choices?.length
            ? current.choices
            : current.target
              ? [{ label: "Continuar", target: current.target }]
              : [];
          next.forEach((i: any) =>
            scene.append(
              button(i.label, () => {
                current = b.items.find((x: any) => x.id === i.target);
                draw();
              }),
            ),
          );
          if (!next.length) {
            state.answers[b.id] = "completed";
            save();
            scene.append(
              el(
                "p",
                "Fim deste percurso. Reflita sobre as consequências de suas escolhas.",
              ),
              button("Explorar novamente", () => {
                current = b.items[0];
                draw();
              }),
            );
          }
          scene.append(el("small", visited.size + " situações exploradas"));
        };
        draw();
        card.append(scene);
        break;
      }
      default:
        card.append(el("p", b.body));
    }
    return card;
  }
  function render() {
    root.replaceChildren();
    const s = stats();
    const top = el("header");
    top.append(
      el("div", "SCORM STUDIO / EXPERIÊNCIA DE APRENDIZAGEM", "eyebrow"),
      el("h1", course.title),
      el("p", course.description),
    );
    const meter = document.createElement("progress");
    meter.max = 100;
    meter.value = Math.round(s.progress * 100);
    meter.setAttribute("aria-label", "Progresso do curso");
    top.append(
      meter,
      el(
        "p",
        `${Math.round(s.progress * 100)}% concluído · ${s.xp} XP · ${s.level} · Nota ${s.score}% · ${Math.floor(state.seconds / 60)} min · ${state.completed.length}/${pages.length} páginas`,
      ),
    );
    const badges = course.badges.filter(
      (b: any) => state.completed.length >= b.threshold,
    );
    top.append(el("p", badges.map((b: any) => "🏅 " + b.name).join(" · ")));
    badges
      .filter((b: any) => b.image)
      .forEach((b: any) => {
        const img = document.createElement("img");
        img.src = safeUrl(b.image);
        img.alt = b.name + ": " + b.description;
        img.width = 48;
        img.height = 48;
        top.append(img);
      });
    s.challenges.forEach((c: any) =>
      top.append(el("p", "✓ Desafio: " + c.name)),
    );
    root.append(top);
    const message = el("p", undefined, "message");
    message.id = "runtime-message";
    message.setAttribute("role", "status");
    root.append(message);
    if (!preview && !initialized) notice("Modo local: nenhum LMS conectado.");
    const nav = el("nav");
    nav.setAttribute("aria-label", "Páginas do curso");
    pages.forEach((p: any, i: number) => {
      const b = button(
        (state.completed.includes(p.id) ? "✓ " : "") + p.title,
        () => {
          save();
          pageIndex = i;
          render();
        },
      );
      if (i === pageIndex) b.setAttribute("aria-current", "page");
      nav.append(b);
    });
    root.append(nav);
    const page = pages[pageIndex];
    if (!page) {
      root.append(el("p", "Este curso ainda não possui páginas."));
      return;
    }
    const main = el("main");
    main.append(
      el("p", `PÁGINA ${pageIndex + 1} DE ${pages.length}`, "eyebrow"),
      el("h1", page.title),
    );
    page.blocks.forEach((b: any) => main.append(block(b)));
    const feedback = el("p");
    feedback.setAttribute("role", "status");
    main.append(feedback);
    main.append(
      button(
        state.completed.includes(page.id)
          ? "Concluída ✓"
          : "Concluir e continuar →",
        () => {
          const missing = page.blocks.find(
            (b: any) =>
              b.required &&
              ((["quiz", "dragdrop", "ordering"].includes(b.type) &&
                !state.attempts.some((a: any) => a.blockId === b.id)) ||
                (["video", "audio"].includes(b.type) &&
                  (state.watched[b.id] || 0) < b.watchedPercent)),
          );
          if (missing) {
            feedback.textContent = "Conclua a atividade: " + missing.title;
            return;
          }
          if (!state.completed.includes(page.id)) state.completed.push(page.id);
          if (pageIndex < pages.length - 1) pageIndex++;
          save();
          render();
          window.scrollTo(0, 0);
        },
      ),
    );
    if (
      s.progress >= 1 &&
      course.certificate &&
      (!s.graded || s.score >= course.passScore)
    ) {
      main.append(
        button("Imprimir certificado", () => {
          const cert = el("section", undefined, "certificate");
          cert.append(
            el("h1", "Certificado de conclusão"),
            el("p", "Concluiu o curso " + course.title),
            el("p", new Date().toLocaleDateString("pt-BR")),
            el("p", course.author),
          );
          main.append(cert);
          window.print();
          cert.remove();
        }),
      );
    }
    root.append(main);
  }
  render();
  save();
}
export const runtimeCSS =
  `*{box-sizing:border-box}body{margin:0;background:#f5f6f3;color:#203c34;font:16px/1.7 system-ui,sans-serif}#course{max-width:1100px;margin:auto;padding:40px}header{padding:35px 40px;background:#183e36;color:white;border-radius:18px}h1{font-size:32px;line-height:1.2}h2{font-size:23px;line-height:1.4}h3{font-size:18px}.eyebrow{font-size:11px;letter-spacing:2px;font-weight:700}.muted,small{color:#63746c}nav{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}button{font:inherit;font-size:14px;border:1px solid #cbd7cf;background:white;color:#224f3c;border-radius:7px;padding:10px 18px;cursor:pointer}button:hover,button[aria-current]{background:#e4efe8}button:disabled{opacity:.5;cursor:default}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:3px solid #d99822;outline-offset:3px}.block{background:white;border:1px solid #e3e7e1;border-radius:12px;padding:30px;margin:20px 0}.hero{background:#e9efdc}label{display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid #dbe3dc;padding:14px;margin:8px 0;border-radius:8px}input,select,textarea{font:inherit;padding:10px;border:1px solid #bccbc1;border-radius:6px}textarea{width:100%}img,video{max-width:100%;border-radius:8px}audio,iframe{width:100%}iframe{border:1px solid #ddd}.flashcard{padding:36px;min-height:160px;width:46%;margin:2%;background:#eef1e4;font-size:19px}.timeline{border-left:3px solid #769c86}.timeline li{padding:12px 20px}.hotspot{position:relative}.hotspot button{position:absolute;transform:translate(-50%,-50%);border-radius:50%;background:#216a55;color:white}table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:10px;text-align:left}blockquote{border-left:4px solid #b9cb80;padding-left:24px;font-size:22px}pre{overflow:auto;background:#152f29;color:#e6f3e9;padding:24px}progress{width:100%;accent-color:#b9cb80}.feedback{background:#f0f4e9;padding:12px}.message{font-size:13px;color:#73551e}.order-row{padding:12px;border:1px solid #ccd;margin:7px;display:flex;gap:12px;align-items:center}.order-row button:first-of-type{margin-left:auto}.formula{font:italic 26px Georgia}.certificate{text-align:center;padding:80px;border:8px double #235c42}@media(max-width:650px){#course{padding:16px}header,.block{padding:22px}.flashcard{width:96%}}@media print{body *{visibility:hidden}.certificate,.certificate *{visibility:visible}.certificate{position:absolute;inset:0}}` +
  playerBrandCSS;
