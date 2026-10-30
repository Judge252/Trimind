import {
  useEffect,
  useRef,
  useId,
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Check, ChevronRight, LoaderCircle } from "lucide-react";
import { useApp } from "../app/context";
import { tracks } from "../content/scenarios";
import type { Course, Track } from "../models";
import { courseProgress } from "../logic/learning";
export function Button({
  children,
  variant = "primary",
  loading = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text";
  loading?: boolean;
}) {
  return (
    <button
      className={`button ${variant}`}
      {...props}
      disabled={props.disabled || loading}
    >
      {loading && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  );
}
export function Go({
  to,
  children,
  secondary = false,
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={`button ${secondary ? "secondary" : "primary"}`} to={to}>
      {children}
      <ArrowUpRight size={18} />
    </Link>
  );
}
export function Page({
  title,
  eyebrow,
  description,
  children,
  actions,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <main id="main" className="container page">
      <div className="page-head">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {description && <p className="lede">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </main>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  let assigned = false;
  const connect = (nodes: ReactNode): ReactNode =>
    Children.map(nodes, (node) => {
      if (!isValidElement(node)) return node;
      const element = node as ReactElement<{
        children?: ReactNode;
        id?: string;
        "aria-describedby"?: string;
      }>;
      if (
        !assigned &&
        typeof element.type === "string" &&
        ["input", "select", "textarea"].includes(element.type)
      ) {
        assigned = true;
        return cloneElement(element, {
          id,
          "aria-describedby": hint ? `${id}-hint` : undefined,
        });
      }
      return element.props.children
        ? cloneElement(element, {}, connect(element.props.children))
        : element;
    });
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {connect(children)}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
export function Status({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`status ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-symbol">✳</div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Skeleton() {
  return (
    <main id="main" className="container page" aria-busy="true">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </main>
  );
}
export function Progress({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  return (
    <div className="progress">
      <div className="split">
        <span>{label}</span>
        <b dir="ltr">
          {value}/{max}
        </b>
      </div>
      <progress value={value} max={max} aria-label={label} />
    </div>
  );
}
export function TrackPill({ track }: { track: Track }) {
  const { text } = useApp();
  return (
    <span className={`pill ${track}`}>
      {tracks[track].icon} {text(tracks[track].name)}
    </span>
  );
}
export function TrackSelect({
  value,
  onChange,
}: {
  value: Track;
  onChange: (v: Track) => void;
}) {
  const { text, t } = useApp();
  return (
    <fieldset className="choices">
      <legend>{t("Choose your path", "اختر مسارك")}</legend>
      {(Object.keys(tracks) as Track[]).map((k) => (
        <label className={`choice ${value === k ? "selected" : ""}`} key={k}>
          <input
            type="radio"
            name="track"
            value={k}
            checked={value === k}
            onChange={() => onChange(k)}
          />
          <span>
            <b>{text(tracks[k].name)}</b>
            <small>{text(tracks[k].description)}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
export function CourseCard({ course }: { course: Course }) {
  const { data, text, t } = useApp();
  const complete = courseProgress(course, data.lessons);
  return (
    <article className="course-card">
      <div className={`course-art ${course.track}`}>
        <span>{tracks[course.track].icon}</span>
        <span className="art-caption">
          {text(tracks[course.track].name)} / 01
        </span>
      </div>
      <div className="card-content">
        <TrackPill track={course.track} />
        <h2>
          <Link to={`/learn/${course.id}`}>{text(course.title)}</Link>
        </h2>
        <p>{text(course.description)}</p>
        <p className="meta">
          {t("Beginner", "مبتدئ")} · {course.lessons.length}{" "}
          {t("lessons", "دروس")} ·{" "}
          {course.lessons.reduce((n, l) => n + l.minutes, 0)}{" "}
          {t("min reading", "دقيقة قراءة")}
        </p>
        <Progress
          value={complete}
          max={course.lessons.length}
          label={t("Lessons completed", "الدروس المكتملة")}
        />
        <Link className="text-link" to={`/learn/${course.id}`}>
          {t(
            complete ? "Continue course" : "Explore course",
            complete ? "تابع الدورة" : "استكشف الدورة",
          )}{" "}
          <ChevronRight size={16} />
        </Link>
      </div>
    </article>
  );
}
export function Modal({
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useApp();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <h2 id="dialog-title">{title}</h2>
      <p>{children}</p>
      <div className="actions">
        <Button variant="secondary" onClick={onClose} autoFocus>
          {t("Cancel", "إلغاء")}
        </Button>
        <Button onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </dialog>
  );
}
export function Metric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
export function Chart({
  points,
  label,
}: {
  points: { round: number; total: number }[];
  label: string;
}) {
  const { t } = useApp();
  const values = points.map((p) => p.total);
  const min = Math.min(...values) * 0.95,
    max = Math.max(...values) * 1.05;
  return (
    <div className="chart">
      <h3>{label}</h3>
      <svg viewBox="0 0 500 150" role="img" aria-label={label}>
        <line x1="20" x2="480" y1="135" y2="135" stroke="#ddd" />
        <polyline
          fill="none"
          stroke="#4d49fc"
          strokeWidth="4"
          points={points
            .map(
              (p, i) =>
                `${20 + i * (460 / Math.max(1, points.length - 1))},${130 - ((p.total - min) / (max - min || 1)) * 110}`,
            )
            .join(" ")}
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={20 + i * (460 / Math.max(1, points.length - 1))}
            cy={130 - ((p.total - min) / (max - min || 1)) * 110}
            r="5"
            fill="#4d49fc"
          />
        ))}
      </svg>
      <details>
        <summary>{t("View chart data", "عرض بيانات الرسم")}</summary>
        <table>
          <thead>
            <tr>
              <th>{t("Round", "الجولة")}</th>
              <th>{t("Total EGP", "الإجمالي بالجنيه")}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.round}>
                <td>{p.round}</td>
                <td>{p.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
export function Tabs({
  values,
  value,
  onChange,
  label,
}: {
  values: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {values.map((v, i) => (
        <button
          type="button"
          role="tab"
          aria-selected={v.id === value}
          aria-controls="tab-panel"
          id={`tab-${v.id}`}
          tabIndex={v.id === value ? 0 : -1}
          key={v.id}
          onClick={() => onChange(v.id)}
          onKeyDown={(e) => {
            if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              const n =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? values.length - 1
                    : (i +
                        (e.key ===
                        (document.documentElement.dir === "rtl"
                          ? "ArrowLeft"
                          : "ArrowRight")
                          ? 1
                          : -1) +
                        values.length) %
                      values.length;
              onChange(values[n].id);
              (
                e.currentTarget.parentElement?.children[n] as HTMLElement
              )?.focus();
            }
          }}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
export function Breadcrumb({
  items,
}: {
  items: { label: string; to?: string }[];
}) {
  const { t } = useApp();
  return (
    <nav aria-label={t("Breadcrumb", "مسار التنقل")} className="breadcrumb">
      {items.map((v, i) => (
        <span key={i}>
          {v.to ? <Link to={v.to}>{v.label}</Link> : v.label}
          {i < items.length - 1 && <ChevronRight size={13} />}
        </span>
      ))}
    </nav>
  );
}
export function CheckMark() {
  return <Check size={18} aria-hidden="true" />;
}
