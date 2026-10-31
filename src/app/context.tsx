import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  Fragment,
  type ReactNode,
} from "react";
import type { AppData, Localized, Course } from "../models";
import { defaults, repository } from "../services/repository";
import {
  restoreSession,
  subscribeSession,
  currentUser,
} from "../services/session";
const Context = createContext<{
  data: AppData;
  catalog: Course[];
  user: ReturnType<typeof currentUser>;
  ready: boolean;
  error: boolean;
  retry: () => void;
  act: (p: Promise<AppData>) => Promise<void>;
  t: (en: string, ar: string) => string;
  text: (s: Localized) => string;
  toast: (s: string) => void;
  notice: string;
}>(null!);
export function Provider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Course[]>([]),
    [user, setUser] = useState(currentUser),
    [scope, setScope] = useState(repository.scope);
  const owner = useRef(repository.scope),
    load = useRef(0);
  const [data, setData] = useState(defaults),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false),
    [notice, setNotice] = useState("");
  const retry = () => {
    const id = ++load.current;
    const actor = repository.scope;
    setError(false);
    setReady(false);
    if (owner.current !== actor) {
      setData(defaults());
      owner.current = actor;
      setScope(actor);
    }
    setUser(currentUser());
    Promise.all([repository.read(), repository.getCourses()])
      .then(([v, c]) => {
        if (id !== load.current || actor !== repository.scope) return;
        setData(v);
        setCatalog(c);
        setReady(true);
      })
      .catch(() => {
        if (id === load.current) setError(true);
      });
  };
  useEffect(() => {
    let active = true;
    let seen = "";
    const unsubscribe = subscribeSession(() => {
      if (active && seen !== repository.scope) {
        seen = repository.scope;
        retry();
      }
    });
    restoreSession().then(() => {
      if (active) {
        seen = repository.scope;
        retry();
      }
    });
    return () => {
      active = false;
      unsubscribe();
      load.current++;
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = data.preferences.language;
    document.documentElement.dir =
      data.preferences.language === "ar" ? "rtl" : "ltr";
  }, [data.preferences.language]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 4200);
    return () => clearTimeout(id);
  }, [notice]);
  const t = (en: string, ar: string) =>
    data.preferences.language === "ar" ? ar : en;
  return (
    <Context.Provider
      value={{
        data,
        catalog,
        user,
        ready,
        error,
        retry,
        act: async (p) => {
          const actor = repository.scope;
          try {
            const next = await p;
            if (actor === repository.scope) setData(next);
          } catch (e) {
            setNotice(
              data.preferences.language === "ar"
                ? "تعذر الحفظ. تحقق من الاتصال وحاول مجدداً."
                : "Unable to save. Check your connection and try again.",
            );
            throw e;
          }
        },
        t,
        text: (s) => s[data.preferences.language],
        toast: setNotice,
        notice,
      }}
    >
      <Fragment key={scope}>{children}</Fragment>
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
