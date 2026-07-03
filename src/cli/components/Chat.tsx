import { useEffect, useRef, useState } from "react";
import { Box, Text, Static, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { Open42 } from "../../open42.js";
import type { Message } from "../../types.js";
import { mentorStyle, STUDENT_COLOR, ERROR_COLOR, BRAND_COLOR } from "../theme.js";
import { Banner } from "./Banner.js";
import { saveSession, listSessions, recentSessions, memoryContextBlock, forgetAll } from "../memory.js";
import {
  autonomyLevel,
  readProgress,
  recordMemorySaved,
  recordMentorRequest,
  recordSelfSolved,
  recordSession,
} from "../progress.js";
import {
  clearProjectContext,
  composePromptMemory,
  getProjectContext,
  setProjectContext,
} from "../projectContext.js";
import {
  strings,
  uiLangOf,
  replyLanguageOf,
  type LangChoice,
  type Strings,
  type UiLang,
} from "../i18n.js";

interface Entry {
  id: number;
  role: "student" | "mentor" | "error" | "system" | "banner";
  content: string;
  mentor?: string;
}

const REMEMBER_NUDGE_AFTER_STUDENT_TURNS = 4;

function initialEntries(t: Strings, localHint: boolean): Entry[] {
  const entries: Entry[] = [
    { id: 0, role: "banner", content: "" },
    { id: 1, role: "system", content: t.welcome },
  ];
  if (localHint) entries.push({ id: 2, role: "system", content: t.localReady });
  return entries;
}

export function Chat({
  open42,
  demo = false,
  initialLang = "auto",
  localHint = false,
  onLanguageChange,
}: {
  open42: Open42;
  demo?: boolean;
  initialLang?: LangChoice;
  localHint?: boolean;
  onLanguageChange?: (choice: LangChoice) => void;
}) {
  const { exit } = useApp();
  const [choice, setChoice] = useState<LangChoice>(initialLang);
  const uiLang: UiLang = uiLangOf(choice);
  const t = strings(uiLang);

  const [entries, setEntries] = useState<Entry[]>(() =>
    initialEntries(strings(uiLangOf(initialLang)), localHint),
  );
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pinned, setPinned] = useState<string | undefined>(undefined);
  const [streaming, setStreaming] = useState<{ mentor: string; text: string } | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [project, setProject] = useState<string | undefined>(() => getProjectContext());
  const [rememberNudged, setRememberNudged] = useState(false);
  const idRef = useRef(2);
  const abortRef = useRef<AbortController | null>(null);

  const busy = streaming !== null;
  const exchanges = transcript.filter((turn) => turn.role === "student").length;

  const push = (entry: Omit<Entry, "id">) => {
    idRef.current += 1;
    const id = idRef.current;
    setEntries((prev) => [...prev, { ...entry, id }]);
  };

  // Ctrl+C / Esc: cancel an in-flight reply; double Ctrl+C when idle to exit.
  useInput((char, key) => {
    const ctrlC = key.ctrl && char === "c";
    if (!key.escape && !ctrlC) return;
    if (abortRef.current) {
      abortRef.current.abort();
      return;
    }
    if (ctrlC) {
      if (confirmExit) exit();
      else setConfirmExit(true);
    }
  });

  useEffect(() => {
    if (!confirmExit) return;
    const timer = setTimeout(() => setConfirmExit(false), 2500);
    return () => clearTimeout(timer);
  }, [confirmExit]);

  useEffect(() => {
    if (!demo) recordSession();
  }, [demo]);

  useEffect(() => {
    if (demo || rememberNudged || exchanges < REMEMBER_NUDGE_AFTER_STUDENT_TURNS) return;
    push({ role: "system", content: t.rememberNudge });
    setRememberNudged(true);
  }, [demo, exchanges, rememberNudged, t.rememberNudge]);

  const refreshMemory = (projectName: string | undefined = project) => {
    open42.setMemory(composePromptMemory(memoryContextBlock(), projectName));
  };

  const setLanguage = (next: LangChoice) => {
    setChoice(next);
    open42.setLanguage(replyLanguageOf(next));
    onLanguageChange?.(next);
    const nt = strings(uiLangOf(next));
    const label = next === "auto" ? nt.langAutoLabel : next;
    push({ role: "system", content: nt.langSet(label) });
  };

  const handleMemoryCommand = async (cmd: string) => {
    if (demo) {
      push({ role: "system", content: t.memoryDemoDisabled });
      return;
    }
    if (cmd === "remember") {
      if (transcript.length === 0) {
        push({ role: "system", content: t.memoryNothing });
        return;
      }
      push({ role: "system", content: t.memorySaving });
      try {
        const summary = await open42.summarize(transcript);
        const path = saveSession(summary, new Date().toISOString());
        recordMemorySaved();
        refreshMemory();
        push({ role: "system", content: t.memorySaved(path) });
      } catch (err) {
        push({ role: "error", content: err instanceof Error ? err.message : String(err) });
      }
      return;
    }
    if (cmd === "memory") {
      const sessions = listSessions();
      if (sessions.length === 0) {
        push({ role: "system", content: t.memoryEmpty });
        return;
      }
      const recent = recentSessions(3).map((s) => s.content).join("\n\n");
      push({ role: "system", content: `${t.memoryHeader(sessions.length)}\n\n${recent}` });
      return;
    }
    const n = forgetAll();
    refreshMemory();
    push({ role: "system", content: t.memoryForgotten(n) });
  };

  const handleCommand = async (text: string) => {
    const [cmd, ...rest] = text.slice(1).trim().split(/\s+/);
    const arg = rest.join(" ").trim() || undefined;
    switch (cmd) {
      case "remember":
      case "memory":
      case "forget":
        await handleMemoryCommand(cmd);
        return;
      case "help":
        push({ role: "system", content: t.help });
        return;
      case "mentors":
        push({
          role: "system",
          content:
            t.mentorsHeader +
            "\n" +
            open42
              .listMentors()
              .map((m) => `${m.id} : ${m.description}`)
              .join("\n"),
        });
        return;
      case "mentor": {
        const found = open42.listMentors().find((m) => m.id === arg);
        if (!found) {
          push({ role: "error", content: t.mentorUnknown(arg ?? "") });
          return;
        }
        setPinned(found.id);
        push({ role: "system", content: t.mentorSet(found.title) });
        return;
      }
      case "auto":
        setPinned(undefined);
        push({ role: "system", content: t.autoOn });
        return;
      case "lang": {
        const v = (arg ?? "").toLowerCase();
        if (v !== "auto" && v !== "fr" && v !== "en") {
          push({ role: "error", content: t.langUsage });
          return;
        }
        setLanguage(v);
        return;
      }
      case "progress": {
        const progress = readProgress();
        const level = autonomyLevel(progress);
        const levelLabel =
          level === "autonomous"
            ? t.progressLevelAutonomous
            : level === "growing"
              ? t.progressLevelGrowing
              : t.progressLevelStarter;
        push({
          role: "system",
          content: t.progressSummary({ ...progress, level: levelLabel }),
        });
        return;
      }
      case "solved":
        recordSelfSolved();
        push({ role: "system", content: t.solvedMarked });
        return;
      case "project": {
        if (!arg) {
          push({ role: "system", content: project ? t.projectCurrent(project) : t.projectEmpty });
          return;
        }
        if (arg.toLowerCase() === "clear") {
          clearProjectContext();
          setProject(undefined);
          refreshMemory(undefined);
          push({ role: "system", content: t.projectCleared });
          return;
        }
        try {
          const value = setProjectContext(arg);
          setProject(value);
          refreshMemory(value);
          push({ role: "system", content: t.projectSet(value) });
        } catch {
          push({ role: "error", content: t.projectUsage });
        }
        return;
      }
      case "clear":
        setEntries(initialEntries(t, localHint));
        setTranscript([]);
        return;
      case "quit":
      case "exit":
        exit();
        return;
      default:
        push({ role: "error", content: t.unknownCmd(cmd ?? "") });
    }
  };

  const onSubmit = async (raw: string) => {
    const text = raw.trim();
    setInput("");
    if (!text) return;
    if (text.startsWith("/")) {
      await handleCommand(text);
      return;
    }

    const nextTranscript: Message[] = [...transcript, { role: "student", content: text }];
    setTranscript(nextTranscript);
    push({ role: "student", content: text });
    if (!demo) recordMentorRequest();

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming({ mentor: "", text: "" });
    let mentorId = "";
    try {
      const reply = await open42.respondStream(
        nextTranscript,
        { signal: controller.signal, ...(pinned ? { mentor: pinned } : {}) },
        {
          onMentor: (id) => {
            mentorId = id;
            setStreaming((s) => ({ mentor: id, text: s?.text ?? "" }));
          },
          onText: (delta) =>
            setStreaming((s) => ({ mentor: s?.mentor ?? mentorId, text: (s?.text ?? "") + delta })),
        },
      );
      setTranscript((prev) => [...prev, { role: "mentor", content: reply.content }]);
      push({ role: "mentor", content: reply.content, mentor: reply.mentor });
    } catch (err) {
      if (controller.signal.aborted) {
        setTranscript((prev) => prev.slice(0, -1));
        push({ role: "error", content: t.interrupted });
      } else {
        push({ role: "error", content: err instanceof Error ? err.message : String(err) });
      }
    } finally {
      abortRef.current = null;
      setStreaming(null);
    }
  };

  const contextLine = exchanges === 0 ? t.contextNew : t.context(exchanges, pinned);

  return (
    <Box flexDirection="column">
      <Static items={entries}>
        {(entry) => <EntryView key={entry.id} entry={entry} lang={uiLang} />}
      </Static>

      {streaming && <StreamingView mentor={streaming.mentor} text={streaming.text} />}

      <Box flexDirection="column" marginTop={1}>
        <Text color="gray" dimColor>
          {contextLine}
        </Text>

        {busy ? (
          <Box borderStyle="round" borderColor="gray" paddingX={1}>
            <Text color="cyan">
              <Spinner type="dots" />
            </Text>
            <Text color="gray"> {t.thinking}</Text>
          </Box>
        ) : (
          <Box borderStyle="round" borderColor={BRAND_COLOR} paddingX={1}>
            <Text color="cyanBright">{pinned ? `${pinned} › ` : "› "}</Text>
            <TextInput
              value={input}
              onChange={setInput}
              onSubmit={onSubmit}
              placeholder={t.inputPlaceholder}
            />
          </Box>
        )}

        <StatusLine
          t={t}
          pinned={pinned}
          exchanges={exchanges}
          demo={demo}
          confirmExit={confirmExit}
        />
      </Box>
    </Box>
  );
}

function StatusLine({
  t,
  pinned,
  exchanges,
  demo,
  confirmExit,
}: {
  t: Strings;
  pinned?: string;
  exchanges: number;
  demo: boolean;
  confirmExit: boolean;
}) {
  const modeLabel = pinned ? t.mentorMode(pinned) : t.autoRouting;
  const modeColor = pinned ? mentorStyle(pinned).color : "cyan";
  const dot = (
    <Text color="gray" dimColor>
      {"  ·  "}
    </Text>
  );
  return (
    <Box>
      <Text color={BRAND_COLOR} bold>
        open42
      </Text>
      {dot}
      <Text color={modeColor}>{modeLabel}</Text>
      {dot}
      <Text color="gray">{t.exchanges(exchanges)}</Text>
      {demo ? (
        <>
          {dot}
          <Text color="yellow">demo</Text>
        </>
      ) : null}
      {dot}
      <Text color={confirmExit ? "yellow" : "gray"} dimColor={!confirmExit}>
        {confirmExit ? t.quitHint : t.helpHint}
      </Text>
    </Box>
  );
}

function StreamingView({ mentor, text }: { mentor: string; text: string }) {
  if (!text) return null;
  const style = mentorStyle(mentor);
  return (
    <Box marginBottom={1} flexDirection="column">
      <Text color={style.color} bold>
        {style.label} ›
      </Text>
      <Text>{text}</Text>
    </Box>
  );
}

function EntryView({ entry, lang }: { entry: Entry; lang: UiLang }) {
  if (entry.role === "banner") {
    return <Banner lang={lang} />;
  }
  if (entry.role === "student") {
    return (
      <Box marginBottom={1}>
        <Text color={STUDENT_COLOR}>{strings(lang).youLabel} › </Text>
        <Text>{entry.content}</Text>
      </Box>
    );
  }
  if (entry.role === "error") {
    return (
      <Box marginBottom={1}>
        <Text color={ERROR_COLOR}>{entry.content}</Text>
      </Box>
    );
  }
  if (entry.role === "system") {
    return (
      <Box marginBottom={1} flexDirection="column">
        <Text color="gray">{entry.content}</Text>
      </Box>
    );
  }
  const style = mentorStyle(entry.mentor ?? "");
  return (
    <Box marginBottom={1} flexDirection="column">
      <Text color={style.color} bold>
        {style.label} ›
      </Text>
      <Text>{entry.content}</Text>
    </Box>
  );
}
