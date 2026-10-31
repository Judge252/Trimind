import {
  repository as guest,
  LocalRepository,
  defaults,
  STORAGE_KEY,
  validData,
} from "./local-repository";
import { RemoteRepository } from "./remote-repository";
import { accountScope, currentUser } from "./session";
import type { Repository } from "./local-repository";
export { LocalRepository, defaults, STORAGE_KEY, validData };
export type { Repository, StorageLike } from "./local-repository";
export const remote = new RemoteRepository();
const adapter = () => (currentUser() ? remote : guest);
export const repository: Repository & {
  readonly scope: string;
  readonly status: "persistent" | "unavailable" | "malformed";
} = {
  get scope() {
    return accountScope();
  },
  get status() {
    return currentUser() ? "persistent" : guest.status;
  },
  read: () => adapter().read(),
  getCourses: () => remote.getCourses(),
  savePreferences: (p) => adapter().savePreferences(p),
  completeLesson: (p) => adapter().completeLesson(p),
  saveAttempt: (a) => adapter().saveAttempt(a),
  saveSession: (s, r) => adapter().saveSession(s, r),
  saveProject: (p) => adapter().saveProject(p),
  deleteProject: (id) => adapter().deleteProject(id),
  saveAssessment: (d) => adapter().saveAssessment(d),
  discardAssessment: () => adapter().discardAssessment(),
  saveGeneratedPlan: (s, r) => adapter().saveGeneratedPlan(s, r),
  activatePlan: (id) => adapter().activatePlan(id),
  reset: () => adapter().reset(),
};
export const guestRepository = guest;
