import { useApp } from "../app/context";
export function Artwork({
  kind,
}: {
  kind: "builder" | "founder" | "investor";
}) {
  const { t } = useApp();
  return (
    <div
      className={`artwork ${kind}`}
      aria-label={t("Illustrative TRIMIND example", "مثال توضيحي من تريمايند")}
    >
      <div className="art-top">
        <span>TRIMIND / {t("EXAMPLE", "مثال")}</span>
        <span>↗</span>
      </div>
      {kind === "builder" ? (
        <>
          <div className="mini-window">
            <div className="window-bar">
              <i />
              <i />
              <i />
            </div>
            <h3>{t("A little more focused.", "تركيز أكثر قليلاً.")}</h3>
            <p>{t("My study planner", "منظم دراستي")}</p>
            {[
              t("Outline my project", "خطط لمشروعي"),
              t("Build the first screen", "ابنِ الشاشة الأولى"),
              t("Test the save button", "اختبر زر الحفظ"),
            ].map((v, i) => (
              <div className="mini-task" key={v}>
                <span>{i === 0 ? "✓" : "○"}</span>
                {v}
              </div>
            ))}
            <div className="mini-code">{"{ idea → working product }"}</div>
          </div>
          <div className="art-sticker">✳</div>
        </>
      ) : kind === "founder" ? (
        <>
          <h3>
            {t("Small idea.", "فكرة صغيرة.")}
            <br />
            {t("Real possibility.", "فرصة حقيقية.")}
          </h3>
          <div className="canvas-grid">
            {[
              t("WHO", "مَن"),
              t("PROBLEM", "المشكلة"),
              t("SOLUTION", "الحل"),
              t("VALUE", "القيمة"),
            ].map((v, i) => (
              <div key={v}>
                <b>{v}</b>
                <p>
                  {
                    [
                      t("Evening learners", "طلاب المساء"),
                      t("No quick snacks", "لا وجبات سريعة"),
                      t("Preordered boxes", "صناديق بطلب مسبق"),
                      t("Time back to learn", "وقت أكثر للتعلم"),
                    ][i]
                  }
                </p>
              </div>
            ))}
          </div>
          <div className="big-asterisk">↗</div>
        </>
      ) : (
        <>
          <p>{t("VIRTUAL PORTFOLIO", "محفظة افتراضية")}</p>
          <h3>
            <bdi>EGP 10,000</bdi>
          </h3>
          <div className="art-bars">
            {[35, 54, 42, 75, 61, 90, 78].map((h, i) => (
              <i style={{ height: `${h}%` }} key={i} />
            ))}
          </div>
          <div className="allocation">
            <span />
            {t("Explore risk. Keep perspective.", "استكشف المخاطر بوعي.")}
          </div>
        </>
      )}
    </div>
  );
}
