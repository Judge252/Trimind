import { useEffect, useState } from "react";
import { useApp } from "../app/context";
import { guestRepository } from "../services/repository";
import { api } from "../services/api";
import { Button, Modal, Status } from "../components/ui";
export default function GuestImport() {
  const { user, t, act } = useApp();
  const [hasLocal, setHasLocal] = useState(false),
    [imported, setImported] = useState(false);
  useEffect(() => {
    guestRepository
      .read()
      .then((d) =>
        setHasLocal(
          !!(
            d.lessons.length +
              d.attempts.length +
              d.projects.length +
              d.results.length +
              d.planning.plans.length ||
            d.planning.draft ||
            Object.keys(d.sessions).length
          ),
        ),
      );
  }, [user?.id]);
  const [preview, setPreview] = useState<any>(null),
    [material, setMaterial] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [id] = useState(() => crypto.randomUUID());
  if (!user || !hasLocal) return null;
  const load = async () => {
    setBusy(true);
    try {
      const local = await guestRepository.read();
      setMaterial(local);
      const result = await api<any>("/api/import/preview", { body: local, id });
      if (result.alreadyImported) {
        setImported(true);
        setMessage(
          t(
            "This local material was already imported into this account.",
            "سبق استيراد هذه البيانات المحلية إلى هذا الحساب.",
          ),
        );
      } else setPreview(result.report);
    } catch {
      setMessage(
        t(
          "Unable to preview the import. Your local material is unchanged.",
          "تعذرت معاينة الاستيراد. لم تتغير بياناتك المحلية.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel plan-profile-summary guest-import">
      <h2>{t("Bring your local progress", "استورد تقدمك المحلي")}</h2>
      <p>
        {t(
          "Preview and confirm a one-time import into this account. Local material is kept, including anything rejected.",
          "عاين وأكّد الاستيراد مرة واحدة إلى هذا الحساب. تبقى البيانات المحلية بما فيها المرفوضة.",
        )}
      </p>
      <Button
        variant="secondary"
        loading={busy}
        disabled={imported}
        onClick={() => void load()}
      >
        {t("Preview local import", "معاينة الاستيراد المحلي")}
      </Button>
      {message && <Status>{message}</Status>}
      {preview && (
        <Modal
          title={t("Import into this account?", "الاستيراد إلى هذا الحساب؟")}
          onClose={() => setPreview(null)}
          confirmLabel={t("Confirm import", "تأكيد الاستيراد")}
          onConfirm={async () => {
            setPreview(null);
            setBusy(true);
            try {
              const result = await api<any>("/api/import", {
                body: material,
                id,
              });
              await act(Promise.resolve(result.state));
              setImported(true);
              setMessage(
                t(
                  "Import processed. Rejected local material is still available on this browser.",
                  "تمت معالجة الاستيراد. تبقى البيانات المحلية المرفوضة على هذا المتصفح.",
                ),
              );
            } catch {
              setMessage(
                t(
                  "Import failed. Your local data is unchanged.",
                  "فشل الاستيراد. بياناتك المحلية لم تتغير.",
                ),
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          {t(
            "Eligible lessons / quiz attempts / projects / assessment: ",
            "الدروس / محاولات الاختبار / المشاريع / التقييم المؤهلة: ",
          )}
          {Object.values(preview.accepted).join(" / ")}.{" "}
          {t("Rejected items: ", "العناصر المرفوضة: ")}
          {
            Object.values(preview.rejected).reduce(
              (n: any, v: any) => n + Number(v),
              0,
            ) as number
          }
          .{" "}
          {t(
            "Simulation balances/results and old local plans cannot be treated as authoritative.",
            "لا يمكن اعتماد أرصدة المحاكاة ونتائجها والخطط المحلية القديمة كبيانات موثوقة.",
          )}
        </Modal>
      )}
    </section>
  );
}
