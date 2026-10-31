import { currentUser } from "../services/session";
import type { SimulationAction } from "../models/actions";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../app/context";
import {
  assets,
  features,
  founderEvents,
  marketEvents,
  tracks,
} from "../content/scenarios";
import {
  initialInvestor,
  investorTotal,
  trade,
  advanceInvestor,
  initialFounder,
  runFounder,
  initialBuilder,
  evaluateBuilder,
  SimulationError,
} from "../logic/simulations";
import { repository, remote } from "../services/repository";
import type {
  BuilderState,
  FounderState,
  InvestorState,
  SimulationSession,
  Track,
  Project,
} from "../models";
import { Artwork } from "../components/Artwork";
import {
  Button,
  Chart,
  Field,
  Go,
  Metric,
  Modal,
  Page,
  Progress,
  Status,
  TrackPill,
} from "../components/ui";
const initial = (track: Track) =>
  track === "investor"
    ? initialInvestor()
    : track === "founder"
      ? initialFounder()
      : initialBuilder();
function useSimulation(track: Track) {
  const { data, act, t } = useApp();
  const [session, setSession] = useState<SimulationSession>(
    () =>
      data.sessions[track] || {
        id: crypto.randomUUID(),
        track,
        state: initial(track),
        finalized: false,
      },
  );
  const [error, setError] = useState(""),
    [reset, setReset] = useState(false),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const save = async (
    state: SimulationSession["state"],
    summary?: Record<string, number | string>,
    action?: SimulationAction,
  ) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      if (currentUser()) {
        const decision =
          action ||
          (track === "builder"
            ? (state as BuilderState).evaluated
              ? { type: "builder-evaluate" }
              : (session.state as BuilderState).evaluated
                ? { type: "builder-revise" }
                : {
                    type: "builder-choices",
                    features: (state as BuilderState).features,
                    technical: (state as BuilderState).technical,
                  }
            : undefined);
        if (!decision) throw Error("decision-required");
        const result = await remote.simulationAction({
          track,
          sessionId: session.id,
          expectedRevision: session.revision || 0,
          action: decision,
        });
        await act(Promise.resolve(result));
        setSession(result.sessions[track]!);
        setError("");
        return;
      }
      const next = {
        ...session,
        state,
        finalized: session.finalized || !!summary,
      };
      await act(
        repository.saveSession(
          next,
          summary && !session.finalized
            ? {
                id: session.id,
                track,
                completedAt: new Date().toISOString(),
                summary,
              }
            : undefined,
        ),
      );
      setSession(next);
      setError("");
    } catch {
      setError(
        t(
          "Unable to apply this decision. Refresh to check the current session and try again.",
          "تعذر تطبيق القرار. حدّث الصفحة للتحقق من الجلسة وحاول مجدداً.",
        ),
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const resetNow = async () => {
    const next = {
      id: crypto.randomUUID(),
      track,
      state: initial(track),
      finalized: false,
    };
    if (currentUser()) {
      try {
        const data = await remote.simulationAction({
          track,
          sessionId: session.id,
          expectedRevision: session.revision || 0,
          action: { type: "reset" },
        });
        await act(Promise.resolve(data));
        setSession(data.sessions[track]!);
        setReset(false);
      } catch {
        setError(
          t("Unable to reset. Try again.", "تعذرت إعادة الضبط. حاول مجدداً."),
        );
      }
      return;
    }
    await act(repository.saveSession(next));
    setSession(next);
    setReset(false);
    setError("");
  };
  const handle = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      const code = e instanceof SimulationError ? e.code : "selection";
      const messages = {
        quantity: t(
          "Enter a positive whole number of units.",
          "أدخل عدداً صحيحاً موجباً من الوحدات.",
        ),
        cash: t(
          "Not enough available cash to fund this decision.",
          "النقد المتاح لا يكفي لتمويل هذا القرار.",
        ),
        holdings: t(
          "You cannot sell more units than you own.",
          "لا يمكنك بيع وحدات أكثر مما تملك.",
        ),
        finished: t(
          "This simulation is complete. Reset to try again.",
          "اكتملت المحاكاة. أعد الضبط للمحاولة مجدداً.",
        ),
        price: t(
          "Price must be a whole number from 30 to 100.",
          "يجب أن يكون السعر عدداً صحيحاً من 30 إلى 100.",
        ),
        marketing: t(
          "Marketing must be a whole number from 0 to 500.",
          "يجب أن يكون التسويق عدداً صحيحاً من 0 إلى 500.",
        ),
        capacity: t(
          "Capacity must be a whole number from 1 to 60.",
          "يجب أن تكون الطاقة عدداً صحيحاً من 1 إلى 60.",
        ),
        selection: t(
          "Choose at least one valid feature.",
          "اختر ميزة صالحة واحدة على الأقل.",
        ),
      };
      setError(messages[code]);
    }
  };
  return {
    session,
    save,
    error,
    setError,
    busy,
    handle,
    resetButton: (
      <Button variant="secondary" onClick={() => setReset(true)}>
        {t("Reset scenario", "إعادة السيناريو")}
      </Button>
    ),
    dialog: reset ? (
      <Modal
        title={t("Restart this scenario?", "إعادة بدء السيناريو؟")}
        onClose={() => setReset(false)}
        onConfirm={() => void resetNow()}
        confirmLabel={t("Restart", "إعادة البدء")}
      >
        {t(
          "The active session will restart. Completed history and saved projects are kept.",
          "ستبدأ الجلسة الحالية من جديد. تبقى النتائج المكتملة والمشاريع المحفوظة.",
        )}
      </Modal>
    ) : null,
  };
}
function useSaveProject() {
  const { act, t, toast } = useApp();
  const navigate = useNavigate();
  const busy = useRef(false);
  return async (track: Track, fields: Partial<Project> = {}) => {
    if (busy.current) return;
    busy.current = true;
    const p: Project = {
      id: crypto.randomUUID(),
      title: t("My practice project", "مشروعي التدريبي"),
      track,
      problem: "",
      audience: "",
      solution: "",
      businessModel: "",
      features: [],
      updatedAt: new Date().toISOString(),
      ...fields,
    };
    try {
      await act(repository.saveProject(p));
      toast(
        t(
          "Project draft created from your decision.",
          "أُنشئت مسودة مشروع من قرارك.",
        ),
      );
      navigate(`/projects/${p.id}`);
    } catch {
    } finally {
      busy.current = false;
    }
  };
}
export function Practice() {
  const { t, text } = useApp();
  return (
    <Page
      title={t(
        "A safe place to try big ideas.",
        "مساحة آمنة لتجربة أفكار كبيرة.",
      )}
      eyebrow={t("THE PRACTICE LAB", "مختبر التدريب")}
      description={t(
        "Fictional scenarios. Simulated money. Real opportunities to understand your decisions.",
        "سيناريوهات خيالية وأموال افتراضية وفرص فعلية لفهم قراراتك.",
      )}
    >
      <div className="three-grid">
        {(["builder", "founder", "investor"] as Track[]).map((track, i) => (
          <article className="practice-card" key={track} data-track={track}>
            <Artwork kind={track} />
            <TrackPill track={track} />
            <h2>
              {
                [
                  t("Ship a study planner", "أطلق منظم دراسة"),
                  t("Run a campus snack stand", "أدر كشك وجبات جامعية"),
                  t("Explore a virtual market", "استكشف سوقاً افتراضياً"),
                ][i]
              }
            </h2>
            <p>
              {
                [
                  t(
                    "Choose features within 24 hours and EGP 1,200. Learn how scope and architecture affect feasibility.",
                    "اختر ميزات خلال 24 ساعة و1,200 جنيه. تعلّم أثر النطاق والبنية على قابلية التنفيذ.",
                  ),
                  t(
                    "Set a price, plan stock and fund marketing across four rounds. Learn the difference between sales, profit and cash.",
                    "حدد السعر والمخزون والتسويق في أربع جولات. تعلّم الفرق بين المبيعات والربح والنقد.",
                  ),
                  t(
                    "Allocate EGP 10,000 across fictional assets through four fixed market events. Explore concentration and volatility.",
                    "وزّع 10,000 جنيه على أصول خيالية خلال أربعة أحداث ثابتة. استكشف التركّز والتقلب.",
                  ),
                ][i]
              }
            </p>
            <Go secondary to={`/practice/${track}`}>
              {t("Launch simulator", "ابدأ المحاكي")}
            </Go>
          </article>
        ))}
      </div>
      <Status>
        {t(
          "All outcomes follow transparent, predefined rules. They are not forecasts, real trading or investment recommendations.",
          "كل النتائج تتبع قواعد محددة وواضحة. ليست توقعات أو تداولاً حقيقياً أو توصيات استثمارية.",
        )}
      </Status>
    </Page>
  );
}
export function Investor() {
  const { t, text } = useApp();
  const sim = useSimulation("investor"),
    s = sim.session.state as InvestorState;
  const [asset, setAsset] = useState("steady"),
    [quantity, setQuantity] = useState("1");
  const saveProject = useSaveProject();
  const total = investorTotal(s),
    finished = s.round === 4;
  return (
    <Page
      title={t(
        "Decisions today. Perspective tomorrow.",
        "قرارات اليوم. رؤية الغد.",
      )}
      track="investor"
      eyebrow={t("INVESTOR / SIMULATED MARKET", "المستثمر / سوق افتراضي")}
      description={t(
        "Start with EGP 10,000 virtual cash. Buy or sell fictional whole units, then advance through four fixed events. There are no trading fees in this exercise.",
        "ابدأ بـ10,000 جنيه افتراضي. اشترِ أو بِع وحدات خيالية صحيحة ثم انتقل عبر أربعة أحداث ثابتة. لا رسوم تداول في التمرين.",
      )}
      actions={sim.resetButton}
    >
      <div className="metrics">
        <Metric
          label={t("Available cash · EGP", "النقد المتاح · جنيه")}
          value={<bdi>{s.cash.toLocaleString()}</bdi>}
        />
        <Metric
          label={t("Holdings value · EGP", "قيمة الحيازات · جنيه")}
          value={<bdi>{(total - s.cash).toLocaleString()}</bdi>}
        />
        <Metric
          label={t("Total value · EGP", "القيمة الكلية · جنيه")}
          value={<bdi>{total.toLocaleString()}</bdi>}
        />
        <Metric label={t("Round", "الجولة")} value={`${s.round}/4`} />
      </div>
      <Status>{text(marketEvents[s.round])}</Status>
      <div className="content-sidebar">
        <div>
          <h2>{t("The fictional market", "السوق الخيالي")}</h2>
          <div className="asset-list">
            {assets.map((a) => (
              <article key={a.id} className="asset">
                <div>
                  <h3>{text(a.name)}</h3>
                  <p>{text(a.risk)}</p>
                </div>
                <div>
                  <b>
                    <bdi>{a.prices[s.round]} EGP</bdi>
                  </b>
                  <small>
                    {t("Owned: ", "تملك: ")}
                    {s.holdings[a.id] || 0}
                  </small>
                </div>
              </article>
            ))}
          </div>
          <div className="panel">
            <h3>{t("Your allocation", "توزيع محفظتك")}</h3>
            {[
              { id: "cash", name: t("Cash", "نقد"), value: s.cash },
              ...assets.map((a) => ({
                id: a.id,
                name: text(a.name),
                value: (s.holdings[a.id] || 0) * a.prices[s.round],
              })),
            ].map((a) => (
              <div className="allocation-row" key={a.id}>
                <div className="split">
                  <span>{a.name}</span>
                  <span>
                    <bdi>{a.value.toLocaleString()} EGP</bdi> ·{" "}
                    {Math.round((a.value / total) * 100)}%
                  </span>
                </div>
                <progress max={total} value={a.value} aria-label={a.name} />
              </div>
            ))}
          </div>
          <Chart
            points={s.history}
            label={t(
              "Portfolio value at each round · EGP",
              "قيمة المحفظة بكل جولة · جنيه",
            )}
          />
          <details>
            <summary>{t("Transaction history", "سجل المعاملات")}</summary>
            {s.log.length ? (
              s.log.map((v, i) => {
                const [side, id, q, p] = v.split(":");
                return (
                  <p key={i}>
                    {side === "buy" ? t("Bought", "شراء") : t("Sold", "بيع")}{" "}
                    {q} × {text(assets.find((a) => a.id === id)!.name)} @{" "}
                    <bdi>{p} EGP</bdi>
                  </p>
                );
              })
            ) : (
              <p>{t("No trades yet.", "لا معاملات بعد.")}</p>
            )}
          </details>
        </div>
        <aside className="panel">
          <h2>
            {finished
              ? t("Your final recap", "ملخصك النهائي")
              : t("Make a trade", "نفّذ معاملة")}
          </h2>
          {finished ? (
            <>
              <p>
                {t(
                  "Total includes remaining cash and all holdings at round 4 prices.",
                  "يشمل الإجمالي النقد المتبقي وكل الحيازات بأسعار الجولة الرابعة.",
                )}
              </p>
              <Metric
                label={t(
                  "Change from starting value · EGP",
                  "التغير عن البداية · جنيه",
                )}
                value={<bdi>{total - 10000}</bdi>}
              />
              <p>
                {t(
                  "Compare how concentrated holdings reacted to the shock in round 2. A fixed scenario is a learning tool, not evidence of future returns.",
                  "قارن استجابة الحيازات المركزة لصدمة الجولة الثانية. السيناريو الثابت أداة تعلم وليس دليلاً على عوائد مستقبلية.",
                )}
              </p>
              <Button
                onClick={() =>
                  void saveProject("investor", {
                    title: t(
                      "My allocation learning journal",
                      "سجل تعلم توزيع محفظتي",
                    ),
                    solution: t(
                      `Simulated portfolio ended at EGP ${total}; cash EGP ${s.cash}.`,
                      `انتهت المحفظة الافتراضية عند ${total} جنيه؛ النقد ${s.cash} جنيه.`,
                    ),
                  })
                }
              >
                {t("Save recap to a project", "حفظ الملخص كمشروع")}
              </Button>
            </>
          ) : (
            <>
              <Field label={t("Asset", "الأصل")}>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {text(a.name)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Whole units", "وحدات صحيحة")}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </Field>
              <div className="actions">
                <Button
                  loading={sim.busy}
                  variant="secondary"
                  onClick={() =>
                    sim.handle(
                      () =>
                        void sim.save(
                          trade(s, asset, Number(quantity), "buy"),
                          undefined,
                          {
                            type: "trade",
                            assetId: asset,
                            quantity: Number(quantity),
                            side: "buy",
                          },
                        ),
                    )
                  }
                >
                  {t("Buy", "شراء")}
                </Button>
                <Button
                  disabled={sim.busy}
                  variant="secondary"
                  onClick={() =>
                    sim.handle(
                      () =>
                        void sim.save(
                          trade(s, asset, Number(quantity), "sell"),
                          undefined,
                          {
                            type: "trade",
                            assetId: asset,
                            quantity: Number(quantity),
                            side: "sell",
                          },
                        ),
                    )
                  }
                >
                  {t("Sell", "بيع")}
                </Button>
              </div>
              {sim.error && <Status error>{sim.error}</Status>}
              <hr />
              <p>
                {t(
                  "Keep cash or trade before advancing. Advancing applies the next fixed prices.",
                  "احتفظ بالنقد أو تداول قبل التقدم. الانتقال يطبق الأسعار الثابتة التالية.",
                )}
              </p>
              <Button
                loading={sim.busy}
                onClick={() =>
                  sim.handle(() => {
                    const next = advanceInvestor(s);
                    void sim.save(
                      next,
                      next.round === 4
                        ? {
                            total: investorTotal(next),
                            profit: investorTotal(next) - 10000,
                          }
                        : undefined,
                      { type: "advance" },
                    );
                  })
                }
              >
                {t("Advance round", "انتقل للجولة التالية")}
              </Button>
              <p className="meta">
                {t(
                  "Total = cash + units × current price. Buying alone does not create a gain.",
                  "الإجمالي = النقد + الوحدات × السعر الحالي. الشراء وحده لا يصنع ربحاً.",
                )}
              </p>
            </>
          )}
        </aside>
      </div>
      <details>
        <summary>
          {t("See the fixed market sequence", "عرض تسلسل السوق الثابت")}
        </summary>
        <table>
          <thead>
            <tr>
              <th>{t("Asset / round", "الأصل / الجولة")}</th>
              {[0, 1, 2, 3, 4].map((i) => (
                <th key={i}>{i}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <th>{text(a.name)}</th>
                {a.prices.map((p, i) => (
                  <td key={i}>{p}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      {sim.dialog}
    </Page>
  );
}
export function Founder() {
  const { t, text } = useApp();
  const sim = useSimulation("founder"),
    s = sim.session.state as FounderState;
  const [price, setPrice] = useState("60"),
    [marketing, setMarketing] = useState("100"),
    [capacity, setCapacity] = useState("30");
  const saveProject = useSaveProject(),
    finished = s.round === 4 || s.cash < 225,
    last = s.history.at(-1),
    cost = Number(capacity) * 25 + Number(marketing) + 200;
  return (
    <Page track="founder"
      title={t(
        "Small business. Meaningful decisions.",
        "مشروع صغير. قرارات مؤثرة.",
      )}
      eyebrow={t(
        "FOUNDER / CAMPUS SNACK STAND",
        "رائد الأعمال / كشك وجبات جامعية",
      )}
      description={t(
        "Four fictional weeks. Start with EGP 3,000. Choose a price, marketing spend and how many boxes to prepare. Unsold boxes cannot be carried to the next round.",
        "أربعة أسابيع خيالية. ابدأ بـ3,000 جنيه. اختر السعر والإنفاق التسويقي وعدد الصناديق. لا ينتقل المخزون غير المباع للجولة التالية.",
      )}
      actions={sim.resetButton}
    >
      <div className="metrics">
        <Metric
          label={t("Remaining cash · EGP", "النقد المتبقي · جنيه")}
          value={<bdi>{s.cash.toLocaleString()}</bdi>}
        />
        <Metric
          label={t("Total revenue · EGP", "إجمالي الإيراد · جنيه")}
          value={
            <bdi>
              {s.history.reduce((n, r) => n + r.revenue, 0).toLocaleString()}
            </bdi>
          }
        />
        <Metric
          label={t("Total profit · EGP", "إجمالي الربح · جنيه")}
          value={<bdi>{s.cash - 3000}</bdi>}
        />
        <Metric
          label={t("Rounds complete", "الجولات المكتملة")}
          value={`${s.round}/4`}
        />
      </div>
      <div className="content-sidebar">
        <div className="panel">
          <h2>
            {finished
              ? t("Your final recap", "ملخصك النهائي")
              : t("Plan this round", "خطط لهذه الجولة")}
          </h2>
          {!finished ? (
            <>
              <Status>{text(founderEvents[s.round].label)}</Status>
              <Field
                label={t(
                  "Price per box · EGP (30–100)",
                  "سعر الصندوق · جنيه (30–100)",
                )}
              >
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Field>
              <Field
                label={t(
                  "Marketing spend · EGP (0–500)",
                  "إنفاق التسويق · جنيه (0–500)",
                )}
              >
                <input
                  type="number"
                  value={marketing}
                  onChange={(e) => setMarketing(e.target.value)}
                />
              </Field>
              <Field
                label={t("Boxes to prepare (1–60)", "الصناديق المجهزة (1–60)")}
              >
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </Field>
              <p>
                {t("Required upfront: ", "المطلوب مقدماً: ")}
                <bdi>{cost.toLocaleString()} EGP</bdi>
              </p>
              <p className="meta">
                {t(
                  "EGP 25 per prepared box + marketing + EGP 200 fixed cost. You must fund all costs before sales.",
                  "25 جنيهاً لكل صندوق مجهز + التسويق + 200 جنيه ثابتة. يجب تمويل كل التكاليف قبل البيع.",
                )}
              </p>
              {sim.error && <Status error>{sim.error}</Status>}
              <Button
                loading={sim.busy}
                onClick={() =>
                  sim.handle(() => {
                    const next = runFounder(
                      s,
                      Number(price),
                      Number(marketing),
                      Number(capacity),
                    );
                    void sim.save(
                      next,
                      next.round === 4 || next.cash < 225
                        ? { profit: next.cash - 3000, total: next.cash }
                        : undefined,
                      {
                        type: "founder-round",
                        price: Number(price),
                        marketing: Number(marketing),
                        capacity: Number(capacity),
                      },
                    );
                  })
                }
              >
                {t("Run this round", "نفّذ الجولة")}
              </Button>
            </>
          ) : (
            <>
              {s.cash < 225 && (
                <Status>
                  {t(
                    "The business cannot fund the minimum next round (EGP 225). Review the results or reset to try a different plan.",
                    "المشروع لا يستطيع تمويل الحد الأدنى للجولة التالية (225 جنيهاً). راجع النتائج أو أعد السيناريو لتجربة خطة أخرى.",
                  )}
                </Status>
              )}
              <p>
                {t(
                  "Compare revenue with all costs, including unsold boxes. Higher price increased margin but reduced the estimated demand.",
                  "قارن الإيراد بكل التكاليف بما فيها الصناديق غير المباعة. زاد السعر الهامش لكنه خفّض الطلب المقدّر.",
                )}
              </p>
              <Button
                onClick={() =>
                  void saveProject("founder", {
                    title: t("Campus snack box", "صندوق وجبات الجامعة"),
                    problem: t(
                      "Evening learners need convenient snacks.",
                      "طلاب المساء يحتاجون وجبات مريحة.",
                    ),
                    audience: t(
                      "Evening campus learners",
                      "طلاب الجامعة مساءً",
                    ),
                    solution: t(
                      "Preordered snack boxes",
                      "صناديق وجبات بطلب مسبق",
                    ),
                    businessModel: t(
                      `Four simulated weeks: EGP ${s.cash - 3000} profit. Not real sales.`,
                      `أربعة أسابيع افتراضية: ربح ${s.cash - 3000} جنيه. ليست مبيعات حقيقية.`,
                    ),
                  })
                }
              >
                {t("Save recap to a project", "حفظ الملخص كمشروع")}
              </Button>
            </>
          )}
          <details>
            <summary>{t("How the rules work", "كيف تعمل القواعد")}</summary>
            <p>
              {t(
                "Demand = floor(event baseline − (price − 50) × 0.8 + marketing / 25), with a minimum of zero. Baselines: 40, 30, 50, 35. Sales = smaller of demand and prepared boxes. Revenue = sales × price. Profit = revenue − all upfront costs.",
                "الطلب = تقريب لأسفل (أساس الحدث − (السعر − 50) × 0.8 + التسويق / 25)، بحد أدنى صفر. الأساس: 40، 30، 50، 35. المبيعات هي الأقل بين الطلب والصناديق المجهزة. الإيراد = المبيعات × السعر. الربح = الإيراد − كل التكاليف المسبقة.",
              )}
            </p>
          </details>
        </div>
        <aside>
          {last ? (
            <div className="panel">
              <h2>{t("What happened", "ماذا حدث")}</h2>
              <p>
                {t("Estimated demand: ", "الطلب المقدّر: ")}
                {last.demand} · {t("Sold: ", "المباع: ")}
                {last.sold}
              </p>
              <p>
                {t("Unsold boxes: ", "غير المباع: ")}
                {last.capacity - last.sold}
              </p>
              <div className="metrics compact">
                <Metric label={t("Revenue", "الإيراد")} value={last.revenue} />
                <Metric label={t("Costs", "التكاليف")} value={last.costs} />
                <Metric label={t("Profit", "الربح")} value={last.profit} />
              </div>
              <Status>
                {last.sold < last.capacity
                  ? t(
                      "Some prepared boxes went unsold. Production costs still apply. Consider smaller capacity or a different price.",
                      "بعض الصناديق لم تُبع وتظل تكلفة إنتاجها محسوبة. فكّر في طاقة أقل أو سعر مختلف.",
                    )
                  : t(
                      "All prepared boxes sold. Compare unused demand with the cash needed to prepare more.",
                      "بيعت كل الصناديق. قارن الطلب غير المخدوم بالنقد المطلوب لتجهيز المزيد.",
                    )}
              </Status>
            </div>
          ) : (
            <Status>
              {t(
                "Make your first decision to see revenue, costs and feedback here.",
                "اتخذ قرارك الأول لرؤية الإيراد والتكاليف والتعليق هنا.",
              )}
            </Status>
          )}
          <Chart
            points={[
              { round: 0, total: 3000 },
              ...s.history.map((r) => ({ round: r.round, total: r.cash })),
            ]}
            label={t("Cash by round · EGP", "النقد حسب الجولة · جنيه")}
          />
        </aside>
      </div>
      <h2>{t("Round history", "سجل الجولات")}</h2>
      {s.history.length ? (
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                {[
                  t("Round", "الجولة"),
                  t("Price", "السعر"),
                  t("Marketing", "التسويق"),
                  t("Prepared / sold", "المجهز / المباع"),
                  t("Revenue", "الإيراد"),
                  t("Costs", "التكاليف"),
                  t("Profit", "الربح"),
                  t("Cash", "النقد"),
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.history.map((r) => (
                <tr key={r.round}>
                  {[
                    r.round,
                    r.price,
                    r.marketing,
                    `${r.capacity} / ${r.sold}`,
                    r.revenue,
                    r.costs,
                    r.profit,
                    r.cash,
                  ].map((v, i) => (
                    <td
                      data-label={
                        [
                          t("Round", "الجولة"),
                          t("Price", "السعر"),
                          t("Marketing", "التسويق"),
                          t("Prepared / sold", "المجهز / المباع"),
                          t("Revenue", "الإيراد"),
                          t("Costs", "التكاليف"),
                          t("Profit", "الربح"),
                          t("Cash", "النقد"),
                        ][i]
                      }
                      key={i}
                    >
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>{t("No rounds completed yet.", "لم تكتمل جولات بعد.")}</p>
      )}
      {sim.dialog}
    </Page>
  );
}
export function Builder() {
  const { t, text } = useApp();
  const sim = useSimulation("builder"),
    s = sim.session.state as BuilderState;
  const saveProject = useSaveProject();
  const result = s.features.length ? evaluateBuilder(s) : null;
  const update = (patch: Partial<BuilderState>) =>
    void sim.save({ ...s, ...patch, evaluated: false });
  return (
    <Page
      title={t("Build less. Make it work.", "ابنِ أقل. واجعله يعمل.")}
      track="builder"
      eyebrow={t("BUILDER / STUDY PLANNER MVP", "المطوّر / منظم دراسة أولي")}
      description={t(
        "Create a planner that lets a learner add a task, reopen a saved list and mark work complete. Include keyboard and error testing. You have 24 hours and EGP 1,200.",
        "أنشئ منظماً يتيح إضافة مهمة وإعادة فتح قائمة محفوظة وتحديد الإنجاز. أدرج اختبار لوحة المفاتيح والأخطاء. لديك 24 ساعة و1,200 جنيه.",
      )}
      actions={sim.resetButton}
    >
      <div className="content-sidebar">
        <div>
          <h2>{t("Choose your feature set", "اختر مجموعة ميزاتك")}</h2>
          <fieldset className="choices" disabled={sim.busy || s.evaluated}>
            <legend>
              {t(
                "Include the complete core journey before extras.",
                "أدرج الرحلة الأساسية كاملة قبل الإضافات.",
              )}
            </legend>
            {features.map((f) => (
              <label
                className={`choice ${s.features.includes(f.id) ? "selected" : ""}`}
                key={f.id}
              >
                <input
                  type="checkbox"
                  checked={s.features.includes(f.id)}
                  onChange={(e) =>
                    update({
                      features: e.target.checked
                        ? [...s.features, f.id]
                        : s.features.filter((id) => id !== f.id),
                    })
                  }
                />
                <span>
                  <b>{text(f.name)}</b>
                  <small>
                    {f.hours} {t("hours", "ساعة")} · <bdi>{f.cost} EGP</bdi> ·{" "}
                    {f.core
                      ? t("Core requirement", "متطلب أساسي")
                      : t("Optional", "اختياري")}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
          <fieldset className="choices" disabled={sim.busy || s.evaluated}>
            <legend>{t("Technical trade-off", "مفاضلة تقنية")}</legend>
            <label
              className={`choice ${s.technical === "local" ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="technical"
                checked={s.technical === "local"}
                onChange={() => update({ technical: "local" })}
              />
              <span>
                <b>{t("Browser storage", "تخزين المتصفح")}</b>
                <small>
                  {t(
                    "No extra cost. Works on one browser; no cross-device sync.",
                    "بلا تكلفة إضافية. يعمل على متصفح واحد دون مزامنة أجهزة.",
                  )}
                </small>
              </span>
            </label>
            <label
              className={`choice ${s.technical === "cloud" ? "selected" : ""}`}
            >
              <input
                type="radio"
                name="technical"
                checked={s.technical === "cloud"}
                onChange={() => update({ technical: "cloud" })}
              />
              <span>
                <b>{t("Plan for cloud sync", "التخطيط للمزامنة السحابية")}</b>
                <small>
                  {t(
                    "+6 hours, +EGP 300 for integration. More reach, more complexity. This only changes the estimate; no backend is created.",
                    "+6 ساعات و300 جنيه للتكامل. انتشار أوسع وتعقيد أكبر. يغير التقدير فقط ولا ينشئ خادماً.",
                  )}
                </small>
              </span>
            </label>
          </fieldset>
        </div>
        <aside className="panel">
          <h2>{t("Your MVP plan", "خطة منتجك الأولي")}</h2>
          <Progress
            value={result?.hours || 0}
            max={24}
            label={t("Hours planned", "الساعات المخططة")}
          />
          <Progress
            value={result?.cost || 0}
            max={1200}
            label={t("Budget planned · EGP", "الميزانية المخططة · جنيه")}
          />
          <ul>
            {features
              .filter((f) => s.features.includes(f.id))
              .map((f) => (
                <li key={f.id}>{text(f.name)}</li>
              ))}
          </ul>
          {!s.features.length && (
            <p>
              {t(
                "Choose at least one feature to evaluate.",
                "اختر ميزة واحدة على الأقل للتقييم.",
              )}
            </p>
          )}
          {sim.error && <Status error>{sim.error}</Status>}
          {s.evaluated && result ? (
            <>
              <Status error={!result.feasible}>
                {result.feasible
                  ? t(
                      "Feasible: the complete core fits both limits.",
                      "قابل للتنفيذ: الأساس الكامل ضمن الحدين.",
                    )
                  : t(
                      "Revise the plan: a requirement or limit is not met.",
                      "راجع الخطة: أحد المتطلبات أو الحدود غير مستوفى.",
                    )}
              </Status>
              {result.missing.length > 0 && (
                <p>
                  {t("Missing core: ", "الأساس الناقص: ")}
                  {result.missing.map((f) => text(f.name)).join("، ")}
                </p>
              )}
              {result.hours > 24 && (
                <p>
                  {t(
                    "Time exceeds the 24-hour limit. Remove extras or simplify the technical approach.",
                    "الوقت يتجاوز 24 ساعة. احذف الإضافات أو بسّط الحل التقني.",
                  )}
                </p>
              )}
              {result.cost > 1200 && (
                <p>
                  {t(
                    "Cost exceeds EGP 1,200. Reduce scope.",
                    "التكلفة تتجاوز 1,200 جنيه. قلّص النطاق.",
                  )}
                </p>
              )}
              <p>
                {s.technical === "local"
                  ? t(
                      "Browser storage supports this single-device MVP. Keep data access separate so sync can be added later.",
                      "تخزين المتصفح مناسب للمنتج على جهاز واحد. افصل الوصول للبيانات لإضافة المزامنة لاحقاً.",
                    )
                  : t(
                      "Cloud sync adds integration work. Include that cost when you scope the core journey.",
                      "المزامنة السحابية تضيف عمل تكامل. أدرج تكلفته عند تحديد نطاق الرحلة الأساسية.",
                    )}
              </p>
              <div className="actions">
                <Button
                  variant="secondary"
                  onClick={() => void sim.save({ ...s, evaluated: false })}
                >
                  {t("Revise choices", "تعديل الاختيارات")}
                </Button>
                <Button
                  onClick={() =>
                    void saveProject("builder", {
                      title: t("My study planner MVP", "منظم دراستي الأولي"),
                      problem: t(
                        "Learners need to track study tasks.",
                        "يحتاج المتعلمون لتتبع مهام الدراسة.",
                      ),
                      audience: t(
                        "Learners planning study sessions",
                        "متعلمون ينظمون جلسات الدراسة",
                      ),
                      solution: t("A simple task planner", "منظم مهام بسيط"),
                      features: features
                        .filter((f) => s.features.includes(f.id))
                        .map((f) => text(f.name)),
                      businessModel: t(
                        `Simulation plan: ${result.hours} hours, EGP ${result.cost}.`,
                        `خطة المحاكاة: ${result.hours} ساعة، ${result.cost} جنيه.`,
                      ),
                    })
                  }
                >
                  {t("Save to a project", "حفظ كمشروع")}
                </Button>
              </div>
            </>
          ) : (
            <Button
              loading={sim.busy}
              onClick={() =>
                sim.handle(() => {
                  const r = evaluateBuilder(s);
                  void sim.save(
                    { ...s, evaluated: true },
                    {
                      hours: r.hours,
                      cost: r.cost,
                      feasible: Number(r.feasible),
                    },
                  );
                })
              }
            >
              {t("Evaluate MVP", "تقييم المنتج الأولي")}
            </Button>
          )}
        </aside>
      </div>
      {sim.dialog}
    </Page>
  );
}
