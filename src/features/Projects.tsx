import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Download, Printer } from "lucide-react";
import { useApp } from "../app/context";
import { repository } from "../services/repository";
import { tracks } from "../content/scenarios";
import { features } from "../content/scenarios";
import {
  Button,
  Empty,
  Field,
  Modal,
  Page,
  Status,
  TrackPill,
} from "../components/ui";
import { NotFound } from "./Learning";
import type { Project, Track } from "../models";
export function Projects() {
  const { data, t, text, act } = useApp();
  const [create, setCreate] = useState(false),
    [title, setTitle] = useState(""),
    [track, setTrack] = useState<Track>(data.preferences.track),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  return (
    <Page
      title={t("A home for your next idea.", "بيت لفكرتك القادمة.")}
      eyebrow={t("YOUR PROJECTS", "مشاريعك")}
      description={t(
        "Local drafts, ready to grow. No community posts or public sharing.",
        "مسودات محلية جاهزة للتطور. لا منشورات عامة أو مشاركة علنية.",
      )}
      actions={
        <Button onClick={() => setCreate(!create)}>
          {t(
            create ? "Close form" : "Create project",
            create ? "إغلاق النموذج" : "إنشاء مشروع",
          )}
        </Button>
      }
    >
      {create && (
        <form
          className="panel create-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!title.trim() || busy) return;
            setBusy(true);
            const p: Project = {
              id: crypto.randomUUID(),
              title: title.trim(),
              track,
              problem: "",
              audience: "",
              solution: "",
              businessModel: "",
              features: [],
              updatedAt: new Date().toISOString(),
            };
            await act(repository.saveProject(p));
            navigate(`/projects/${p.id}`);
          }}
        >
          <Field label={t("Project title", "عنوان المشروع")}>
            <input
              autoFocus
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label={t("Associated path", "المسار المرتبط")}>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value as Track)}
            >
              {(Object.keys(tracks) as Track[]).map((k) => (
                <option key={k} value={k}>
                  {text(tracks[k].name)}
                </option>
              ))}
            </select>
          </Field>
          <Button loading={busy} disabled={!title.trim()} type="submit">
            {t("Create draft", "إنشاء مسودة")}
          </Button>
        </form>
      )}
      {data.projects.length ? (
        <div className="three-grid">
          {data.projects.map((p) => (
            <article key={p.id} className="panel project-card">
              <TrackPill track={p.track} />
              <h2>
                <Link to={`/projects/${p.id}`}>{p.title}</Link>
              </h2>
              <p>
                {p.problem ||
                  t(
                    "A fresh draft. Add the problem you want to solve.",
                    "مسودة جديدة. أضف المشكلة التي تريد حلها.",
                  )}
              </p>
              <small>
                {t("Updated ", "آخر تعديل ")}
                {new Date(p.updatedAt).toLocaleDateString(
                  data.preferences.language === "ar" ? "ar-EG" : "en-GB",
                )}
              </small>
              <Link className="text-link" to={`/projects/${p.id}`}>
                {t("Open workspace", "فتح مساحة العمل")} ↗
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title={t(
            "Good ideas need a first draft.",
            "الأفكار الجيدة تحتاج مسودة أولى.",
          )}
          action={
            <Button variant="secondary" onClick={() => setCreate(true)}>
              {t("Create your first project", "أنشئ مشروعك الأول")}
            </Button>
          }
        >
          {t(
            "Start a blank project, or bring a decision from a simulator. Your work stays on this browser.",
            "ابدأ مشروعاً فارغاً أو انقل قراراً من محاكي. يبقى عملك على هذا المتصفح.",
          )}
        </Empty>
      )}
    </Page>
  );
}
export function ProjectWorkspace() {
  const { projectId } = useParams();
  const { data, t, text, act, toast } = useApp();
  const stored = data.projects.find((p) => p.id === projectId);
  const [draft, setDraft] = useState(stored),
    [dirty, setDirty] = useState(false),
    [saved, setSaved] = useState(false),
    [remove, setRemove] = useState(false),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  if (!draft || !stored) return <NotFound />;
  const change = (patch: Partial<Project>) => {
    setDraft({ ...draft, ...patch });
    setDirty(true);
    setSaved(false);
  };
  const save = async () => {
    if (!draft.title.trim() || busy) return;
    setBusy(true);
    await act(
      repository.saveProject({
        ...draft,
        title: draft.title.trim(),
        updatedAt: new Date().toISOString(),
      }),
    );
    setDirty(false);
    setSaved(true);
    setBusy(false);
  };
  const entries = [
    [t("Problem", "المشكلة"), draft.problem],
    [t("Audience", "الجمهور"), draft.audience],
    [t("Solution", "الحل"), draft.solution],
    [t("Business model", "نموذج العمل"), draft.businessModel],
    [t("MVP features", "ميزات المنتج الأولي"), draft.features.join("\n")],
  ];
  const download = () => {
    const blob = new Blob(
      [
        `${draft.title}\n${text(tracks[draft.track].name)}\n\n${entries.map(([h, v]) => `${h}\n${v || "—"}`).join("\n\n")}\n\n${t("TRIMIND guest project draft. Simulation outputs are fictional.", "مسودة مشروع ضيف تريمايند. نتائج المحاكاة خيالية.")}`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trimind-project-${draft.id}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Page
      title={t("Shape the idea.", "شكّل الفكرة.")}
      eyebrow={t("PROJECT WORKSPACE", "مساحة عمل المشروع")}
      description={t(
        "Save explicitly before leaving this page. Download and print use the current preview.",
        "احفظ صراحة قبل مغادرة الصفحة. التنزيل والطباعة يستخدمان المعاينة الحالية.",
      )}
    >
      <div className="content-sidebar workspace">
        <form
          className="panel no-print"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Field label={t("Project title", "عنوان المشروع")}>
            <input
              required
              maxLength={100}
              value={draft.title}
              onChange={(e) => change({ title: e.target.value })}
            />
          </Field>
          <Field label={t("Path", "المسار")}>
            <select
              value={draft.track}
              onChange={(e) => change({ track: e.target.value as Track })}
            >
              {(Object.keys(tracks) as Track[]).map((k) => (
                <option key={k} value={k}>
                  {text(tracks[k].name)}
                </option>
              ))}
            </select>
          </Field>
          {(["problem", "audience", "solution", "businessModel"] as const).map(
            (key, i) => (
              <Field
                key={key}
                label={
                  [
                    t(
                      "What problem are you solving?",
                      "ما المشكلة التي تحلها؟",
                    ),
                    t("Who is it for?", "لمن هذا المشروع؟"),
                    t("How will it work?", "كيف سيعمل؟"),
                    t(
                      "How could it sustain itself?",
                      "كيف يمكن أن يستمر مالياً؟",
                    ),
                  ][i]
                }
              >
                <textarea
                  rows={3}
                  maxLength={2500}
                  value={draft[key]}
                  onChange={(e) => change({ [key]: e.target.value })}
                />
              </Field>
            ),
          )}
          <fieldset className="choices">
            <legend>
              {t("MVP feature checklist", "قائمة ميزات المنتج الأولي")}
            </legend>
            {features.map((f) => {
              const label = text(f.name);
              const existing = draft.features.find(
                (v) => v === f.name.en || v === f.name.ar,
              );
              return (
                <label className="choice" key={f.id}>
                  <input
                    type="checkbox"
                    checked={!!existing}
                    onChange={(e) =>
                      change({
                        features: e.target.checked
                          ? [...draft.features, label]
                          : draft.features.filter((v) => v !== existing),
                      })
                    }
                  />
                  {label}
                </label>
              );
            })}
          </fieldset>
          <Button loading={busy} type="submit" disabled={!draft.title.trim()}>
            {t("Save project", "حفظ المشروع")}
          </Button>
          <Status>
            {dirty
              ? t("Unsaved changes", "تغييرات غير محفوظة")
              : saved
                ? t("Saved on this browser", "محفوظ على هذا المتصفح")
                : t(
                    "Draft loaded from this browser",
                    "تم تحميل المسودة من هذا المتصفح",
                  )}
          </Status>
        </form>
        <aside className="pitch-preview">
          <span className="eyebrow">
            {t("YOUR PROJECT / PITCH PREVIEW", "مشروعك / معاينة العرض")}
          </span>
          <h2>{draft.title || t("Untitled project", "مشروع بلا عنوان")}</h2>
          <TrackPill track={draft.track} />
          {entries.map(([h, v]) => (
            <section key={h}>
              <h3>{h}</h3>
              <p className="preserve-lines">
                {v ||
                  t(
                    "Add your thinking in the workspace.",
                    "أضف أفكارك في مساحة العمل.",
                  )}
              </p>
            </section>
          ))}
          <div className="actions no-print">
            <Button variant="secondary" onClick={download}>
              <Download size={16} />
              {t("Download text", "تنزيل النص")}
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer size={16} />
              {t("Print", "طباعة")}
            </Button>
          </div>
        </aside>
      </div>
      <div className="danger-zone no-print">
        <Button variant="secondary" onClick={() => setRemove(true)}>
          {t("Delete project", "حذف المشروع")}
        </Button>
        <Link className="text-link" to="/projects">
          {t("Back to projects", "العودة للمشاريع")}
        </Link>
      </div>
      {remove && (
        <Modal
          title={t("Delete this project?", "حذف هذا المشروع؟")}
          confirmLabel={t("Delete project", "حذف المشروع")}
          onClose={() => setRemove(false)}
          onConfirm={async () => {
            await act(repository.deleteProject(draft.id));
            setDirty(false);
            toast(t("Project deleted.", "حُذف المشروع."));
            navigate("/projects");
          }}
        >
          {t(
            "This draft will be removed from this browser. This cannot be undone.",
            "ستُحذف هذه المسودة من المتصفح. لا يمكن التراجع عن ذلك.",
          )}
        </Modal>
      )}
    </Page>
  );
}
