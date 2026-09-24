import { create } from "zustand";
import {
  exampleCourse,
  newPage,
  uid,
  type Course,
  type Block,
} from "../domain/model";
import { repository } from "../storage/repository";
interface State {
  courses: Course[];
  courseId: string;
  pageId: string;
  blockId: string;
  ready: boolean;
  saveError: string;
  past: Course[];
  future: Course[];
  init: () => Promise<void>;
  select: (id: string) => void;
  selectPage: (id: string) => void;
  selectBlock: (id: string) => void;
  update: (fn: (c: Course) => void) => void;
  addCourse: (c: Course) => void;
  removeCourse: () => void;
  undo: () => void;
  redo: () => void;
  addPage: (moduleId: string) => void;
  addBlock: (b: Block) => void;
}
let writeQueue = Promise.resolve();
let initializing = false;
function persist(c: Course) {
  writeQueue = writeQueue
    .then(() => repository.save(c))
    .then(() => {
      useStudio.setState({ saveError: "" });
    })
    .catch(() => {
      useStudio.setState({
        saveError:
          "Não foi possível salvar no navegador. Exporte um backup JSON.",
      });
    });
}
export const useStudio = create<State>((set, get) => ({
  courses: [],
  courseId: "",
  pageId: "",
  blockId: "",
  ready: false,
  saveError: "",
  past: [],
  future: [],
  init: async () => {
    if (initializing || get().ready) return;
    initializing = true;
    try {
      let courses = await repository.list();
      if (!courses.length) {
        courses = [exampleCourse()];
        await repository.save(courses[0]);
      }
      set({
        courses,
        courseId: courses[0].id,
        pageId: courses[0].modules[0]?.pages[0]?.id || "",
        ready: true,
      });
    } catch {
      set({
        ready: true,
        saveError:
          "IndexedDB indisponível. Verifique as permissões do navegador.",
      });
    } finally {
      initializing = false;
    }
  },
  select: (id) => {
    const c = get().courses.find((c) => c.id === id);
    set({
      courseId: id,
      pageId: c?.modules[0]?.pages[0]?.id || "",
      blockId: "",
      past: [],
      future: [],
    });
  },
  selectPage: (id) => set({ pageId: id, blockId: "" }),
  selectBlock: (id) => set({ blockId: id }),
  update: (fn) => {
    const s = get(),
      old = s.courses.find((c) => c.id === s.courseId);
    if (!old) return;
    const c = structuredClone(old);
    fn(c);
    c.updatedAt = new Date().toISOString();
    const allPages = c.modules.flatMap((m) => m.pages);
    const selectedPage = allPages.find((p) => p.id === s.pageId) || allPages[0];
    set({
      courses: s.courses.map((x) => (x.id === c.id ? c : x)),
      past: [...s.past.slice(-39), old],
      future: [],
      pageId: selectedPage?.id || "",
      blockId: selectedPage?.blocks.some((b) => b.id === s.blockId)
        ? s.blockId
        : "",
    });
    persist(c);
  },
  addCourse: (c) => {
    set((s) => ({ courses: [...s.courses, c] }));
    persist(c);
    get().select(c.id);
  },
  removeCourse: () => {
    const s = get();
    writeQueue = writeQueue
      .then(() => repository.remove(s.courseId))
      .catch(() => set({ saveError: "Falha ao excluir curso." }));
    const rest = s.courses.filter((c) => c.id !== s.courseId);
    set({ courses: rest });
    if (rest.length) get().select(rest[0].id);
    else get().addCourse(exampleCourse());
  },
  undo: () => {
    const s = get(),
      c = s.past.at(-1),
      current = s.courses.find((x) => x.id === s.courseId);
    if (!c || !current) return;
    set({
      courses: s.courses.map((x) => (x.id === c.id ? c : x)),
      past: s.past.slice(0, -1),
      future: [current, ...s.future],
    });
    persist(c);
  },
  redo: () => {
    const s = get(),
      c = s.future[0],
      current = s.courses.find((x) => x.id === s.courseId);
    if (!c || !current) return;
    set({
      courses: s.courses.map((x) => (x.id === c.id ? c : x)),
      past: [...s.past, current],
      future: s.future.slice(1),
    });
    persist(c);
  },
  addPage: (moduleId) => {
    const p = newPage();
    get().update((c) =>
      c.modules.find((m) => m.id === moduleId)?.pages.push(p),
    );
    get().selectPage(p.id);
  },
  addBlock: (b) => {
    get().update((c) =>
      c.modules
        .flatMap((m) => m.pages)
        .find((p) => p.id === get().pageId)
        ?.blocks.push(b),
    );
    set({ blockId: b.id });
  },
}));
export function duplicate<T>(value: T): T {
  const x = structuredClone(value) as any;
  const ids = new Map<string, string>();
  function visit(v: any) {
    if (!v || typeof v !== "object") return;
    if (v.id) {
      const old = v.id;
      v.id = uid();
      ids.set(old, v.id);
    }
    Object.values(v).forEach((z) => {
      if (Array.isArray(z)) z.forEach(visit);
      else if (typeof z === "object") visit(z);
    });
  }
  visit(x);
  function references(v: any) {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v.correct))
      v.correct = v.correct.map((id: string) => ids.get(id) || id);
    if (v.target) v.target = ids.get(v.target) || v.target;
    Object.values(v).forEach((z) => {
      if (Array.isArray(z)) z.forEach(references);
      else if (typeof z === "object") references(z);
    });
  }
  references(x);
  return x;
}
