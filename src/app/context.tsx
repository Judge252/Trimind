import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Localized } from "../models";
import { defaults, repository } from "../services/repository";
const Context = createContext<{
  data: AppData;
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
  const [data, setData] = useState(defaults),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false),
    [notice, setNotice] = useState("");
  const retry = () => {
    setError(false);
    repository
      .read()
      .then((v) => {
        setData(v);
        setReady(true);
      })
      .catch(() => setError(true));
  };
  useEffect(retry, []);
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
        ready,
        error,
        retry,
        act: async (p) => setData(await p),
        t,
        text: (s) => s[data.preferences.language],
        toast: setNotice,
        notice,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useApp = () => useContext(Context);
