import { useEffect, useRef, useState } from "react";
import { useApp } from "../../app/context";
import type { AssessmentDraft } from "../../models";
import { submitAssessment } from "../../logic/assessment";
import { planningService, PlanningError } from "../../services/planning";
import { repository } from "../../services/repository";
export function usePlanPreparation(onSuccess?: () => void) {
  const { act, data } = useApp();
  const [state, setState] = useState<
    "idle" | "preparing" | "success" | "error" | "cancelled"
  >("idle");
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null),
    busy = useRef(false),
    mounted = useRef(true),
    sequence = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      sequence.current++;
    };
  }, []);
  const cancel = () => {
    sequence.current++;
    controller.current?.abort();
    busy.current = false;
    setState("cancelled");
  };
  const request = useRef<{ key: string; id: string } | null>(null);
  const generate = async (draft: AssessmentDraft, regenerate = false) => {
    if (busy.current) return;
    busy.current = true;
    const token = ++sequence.current;
    controller.current = new AbortController();
    setState("preparing");
    setError("");
    try {
      const key = draft.id + ":" + draft.revision;
      if (request.current?.key !== key)
        request.current = { key, id: crypto.randomUUID() };
      const submission = submitAssessment(draft);
      const contentCatalog = await repository.getCourses();
      const result = await planningService.generatePlan(
        {
          assessment: submission,
          requestId: request.current.id,
          regenerate,
          contentCatalog,
          locale: data.preferences.language,
        },
        { signal: controller.current.signal },
      );
      if (
        !mounted.current ||
        token !== sequence.current ||
        controller.current.signal.aborted
      )
        return;
      await act(repository.saveGeneratedPlan(submission, result));
      if (!mounted.current || token !== sequence.current) return;
      request.current = null;
      setState("success");
      onSuccess?.();
    } catch (e) {
      if (!mounted.current || token !== sequence.current) return;
      setError(
        e instanceof PlanningError
          ? e.code
          : e instanceof Error
            ? e.message
            : "unavailable",
      );
      if (
        e instanceof Error &&
        !["network-error", "cancelled", "generation-in-progress"].includes(
          e.message,
        )
      )
        request.current = null;
      setState(
        e instanceof PlanningError && e.code === "cancelled"
          ? "cancelled"
          : "error",
      );
    } finally {
      if (token === sequence.current) busy.current = false;
    }
  };
  return { state, error, generate, cancel };
}
