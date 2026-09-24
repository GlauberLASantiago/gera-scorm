import { openDB } from "idb";
import type { Course, Progress } from "../domain/model";
const db = openDB("scorm-studio-v2", 1, {
  upgrade(db) {
    db.createObjectStore("courses", { keyPath: "id" });
    db.createObjectStore("progress");
  },
});
export const repository = {
  list: async (): Promise<Course[]> => (await db).getAll("courses"),
  save: async (c: Course) => {
    await (await db).put("courses", c);
  },
  remove: async (id: string) => {
    await (await db).delete("courses", id);
  },
  progress: async (id: string): Promise<Progress | undefined> =>
    (await db).get("progress", id),
  saveProgress: async (id: string, p: Progress) => {
    await (await db).put("progress", p, id);
  },
};
