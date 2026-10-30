import { Link } from "react-router-dom";
import {
  ArrowRight,
  Code2,
  Lightbulb,
  ChartNoAxesCombined,
} from "lucide-react";
import { useApp } from "../app/context";
import { tracks } from "../content/scenarios";
import type { Track } from "../models";
import { Go } from "../components/ui";
import { Artwork } from "../components/Artwork";
export default function Home() {
  const { t, text } = useApp();
  return (
    <main id="main">
      <section className="hero">
        <div className="hero-intro">
          <span className="eyebrow">
            {t(
              "A LITTLE CURIOSITY. A LOT OF POSSIBILITY.",
              "قليل من الفضول. كثير من الإمكانات.",
            )}
          </span>
          <span className="hero-index">01 — 03</span>
        </div>
        <div className="collage">
          <div className="collage-item collage-builder">
            <Artwork kind="builder" />
          </div>
          <div className="collage-item collage-founder">
            <Artwork kind="founder" />
          </div>
          <div className="collage-item collage-investor">
            <Artwork kind="investor" />
          </div>
          <div className="hero-panel">
            <div className="eyebrow">
              {t("LEARN. TRY. BUILD.", "تعلّم. جرّب. ابنِ.")}
            </div>
            <h1>
              {t("Build the skills to", "ابنِ المهارات التي")}
              <br />
              <span>{t("shape your future.", "تصنع مستقبلك.")}</span>
            </h1>
            <div className="hero-bottom">
              <p>
                {t(
                  "Technology, business and money. Learn by making decisions, not just taking notes.",
                  "التقنية والأعمال والمال. تعلّم باتخاذ القرارات، وليس بتدوين الملاحظات فقط.",
                )}
              </p>
              <Go to="/start">{t("Try the demo", "جرّب العرض")}</Go>
            </div>
          </div>
        </div>
        <div className="hero-caption">
          <span>
            {t(
              "Original example projects. Your ideas come next.",
              "مشروعات توضيحية أصلية. أفكارك تأتي بعدها.",
            )}
          </span>
          <Link to="/learn">
            {t("Find your starting point", "اكتشف نقطة بدايتك")}{" "}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <section className="container section">
        <div className="section-top">
          <h2>
            {t("One curious mind.", "عقل فضولي واحد.")}
            <br />
            {t("Three ways forward.", "ثلاثة مسارات للأمام.")}
          </h2>
          <p>
            {t(
              "Start with what interests you. Explore the other paths whenever you want.",
              "ابدأ بما يثير اهتمامك، واستكشف بقية المسارات وقتما شئت.",
            )}
          </p>
        </div>
        <div className="path-grid">
          {(Object.keys(tracks) as Track[]).map((k, i) => {
            const Icon = [Code2, Lightbulb, ChartNoAxesCombined][i];
            return (
              <Link to={`/learn?track=${k}`} className="path-item" key={k}>
                <div className={`path-icon ${k}`}>
                  <Icon size={32} />
                </div>
                <span className="meta">
                  0{i + 1} / {text(tracks[k].name)}
                </span>
                <h3>{text(tracks[k].tag)}</h3>
                <p>{text(tracks[k].description)}</p>
                <span className="text-link">
                  {t("Explore path", "استكشف المسار")} <ArrowRight size={18} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="how-section">
        <div className="container">
          <p className="eyebrow">
            {t(
              "FROM “WHAT IF” TO “I MADE THIS”",
              "من «ماذا لو» إلى «أنا صنعت هذا»",
            )}
          </p>
          <h2>
            {t(
              "A small lesson. A real next step.",
              "درس صغير. خطوة فعلية تالية.",
            )}
          </h2>
          <div className="three-grid">
            {[
              [
                t("Understand the essentials", "افهم الأساسيات"),
                t(
                  "Short, practical lessons with worked examples and checks that help ideas click.",
                  "دروس عملية قصيرة بأمثلة وأسئلة تساعدك على فهم الأفكار.",
                ),
              ],
              [
                t("Put your thinking to work", "حوّل التفكير إلى عمل"),
                t(
                  "Build an MVP, run a fictional business or manage a virtual portfolio. See what changes.",
                  "ابنِ منتجاً أولياً أو أدر مشروعاً خيالياً أو محفظة افتراضية وشاهد أثر قراراتك.",
                ),
              ],
              [
                t("Make it your own", "اجعله مشروعك"),
                t(
                  "Save a project draft. Refine the idea, write your pitch and take it with you.",
                  "احفظ مسودة مشروع وطوّر الفكرة واكتب عرضك وخذه معك.",
                ),
              ],
            ].map(([h, p], i) => (
              <div className="how-step" key={h}>
                <span className="step-number">0{i + 1}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="section-top">
          <h2>
            {t("Less theory alone.", "أقل من النظرية وحدها.")}
            <br />
            {t("More “look what I made.”", "أكثر من «انظر ماذا صنعت».")}
          </h2>
          <Link className="text-link" to="/practice">
            {t("Explore the practice lab", "استكشف مختبر التدريب")}{" "}
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="three-grid gallery">
          {(["builder", "founder", "investor"] as Track[]).map((k, i) => (
            <Link to={`/practice/${k}`} key={k}>
              <Artwork kind={k} />
              <h3>
                {
                  [
                    t("A focused study planner", "منظم دراسة مركّز"),
                    t("A campus snack business", "مشروع وجبات جامعية"),
                    t("A balanced virtual portfolio", "محفظة افتراضية متوازنة"),
                  ][i]
                }
              </h3>
              <p>
                {t(
                  "Illustrative example · Try the scenario",
                  "مثال توضيحي · جرّب السيناريو",
                )}
              </p>
            </Link>
          ))}
        </div>
      </section>
      <section className="container section preview-section">
        <div>
          <p className="eyebrow">{t("YOUR NEXT CHAPTER", "فصلك التالي")}</p>
          <h2>{t("A place for your progress.", "مساحة لتقدمك.")}</h2>
          <p>
            {t(
              "Pick up where you left off. Your lessons, decisions and project drafts stay together on this browser.",
              "تابع من حيث توقفت. دروسك وقراراتك ومسودات مشاريعك تبقى معاً على هذا المتصفح.",
            )}
          </p>
          <Go secondary to="/dashboard">
            {t("See My learning", "عرض تعلّمي")}
          </Go>
        </div>
        <div className="preview-ui">
          <div className="split">
            <b>{t("My learning", "تعلّمي")}</b>
            <span className="pill">{t("Example view", "عرض توضيحي")}</span>
          </div>
          <h3>{t("Small steps add up.", "الخطوات الصغيرة تتراكم.")}</h3>
          <div className="preview-row">
            <span>01</span>
            <div>
              <b>{t("Learn the essentials", "تعلّم الأساسيات")}</b>
              <p>
                {t("A lesson, then a knowledge check", "درس ثم سؤال للتحقق")}
              </p>
            </div>
            ↗
          </div>
          <div className="preview-row">
            <span>02</span>
            <div>
              <b>{t("Try a decision", "جرّب قراراً")}</b>
              <p>
                {t(
                  "See the result in a safe simulation",
                  "شاهد النتيجة في محاكاة آمنة",
                )}
              </p>
            </div>
            ↗
          </div>
          <small>
            {t(
              "Illustration only. Your progress starts at zero.",
              "توضيح فقط. يبدأ تقدمك من الصفر.",
            )}
          </small>
        </div>
      </section>
      <section className="final-cta container">
        <span className="brand-flower">✳</span>
        <h2>
          {t(
            "Your future is a work in progress.",
            "مستقبلك مشروع قيد التطوير.",
          )}
        </h2>
        <p>
          {t(
            "Give it a starting point. No account needed.",
            "امنحه نقطة بداية. لا تحتاج حساباً.",
          )}
        </p>
        <Go to="/start">{t("Let’s get started", "لنبدأ")}</Go>
      </section>
    </main>
  );
}
