import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { assessmentQuestions } from "../src/content/assessment.ts";
process.env.TEMP = path.resolve(".tmp");
process.env.TMP = process.env.TEMP;
await fs.mkdir(process.env.TEMP, { recursive: true });
await fs.mkdir("test-results/planning", { recursive: true });
const base = process.env.TRIMIND_URL || "http://127.0.0.1:5173",
  browser = await chromium.launch({ headless: true }),
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  }),
  page = await context.newPage();
const checks = [],
  issues = [];
page.on("pageerror", (e) => issues.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") issues.push(m.text());
});
page.on("response", (r) => {
  if (r.status() >= 400) issues.push(`${r.status()} ${r.url()}`);
});
page.on("request", (r) => {
  if (!r.url().startsWith(base) && !r.url().startsWith("data:"))
    issues.push(`External request: ${r.url()}`);
});
const check = (s) => {
  checks.push(s);
  console.log("PASS", s);
};
const go = async (url) => {
  await page.goto(base + url);
  await page.locator("main h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
};
const click = (name) => page.getByRole("button", { name, exact: true }).click();
const data = () =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("trimind:phase1:v1") || "null"),
  );
const screenshot = async (name) => {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
    `Overflow: ${name}`,
  );
  await page.screenshot({
    path: `test-results/planning/${name}.png`,
    fullPage: true,
  });
  await page.screenshot({
    path: `test-results/planning/${name}-viewport.png`,
    fullPage: false,
  });
};
let lang = "en";
const label = (en, ar) => (lang === "en" ? en : ar);
const preferences = {
  goal: "build",
  paths: ["builder"],
  "experience-builder": "new",
  "experience-founder": "new",
  "experience-investor": "new",
  minutes: "10",
  days: "2",
  weeks: "4",
  formats: ["examples"],
  aspiration: "A useful study tool",
  connectivity: "limited",
  confidence: "low",
  difficulty: "example",
  support: "guided",
};
async function fillQuestion(values = preferences, correct = false) {
  const form = page.locator("[data-assessment-question]");
  const id = await form.getAttribute("data-assessment-question");
  const q = assessmentQuestions.find((q) => q.id === id);
  assert.ok(q, id);
  const value =
    q.section === "knowledge"
      ? correct
        ? q.correctOptionId
        : "unknown"
      : values[id];
  if (q.kind === "select")
    await page.getByLabel(q.title[lang], { exact: true }).selectOption(value);
  else if (q.kind === "text")
    await page.getByLabel(q.title[lang], { exact: true }).fill(value || "");
  else
    for (const optionId of Array.isArray(value) ? value : [value])
      await form.locator(`input[value="${optionId}"]`).check();
  return id;
}
async function finishQuestions(values = preferences, correct = false) {
  for (let n = 0; n < 24; n++) {
    await fillQuestion(values, correct);
    const last = await page
      .getByRole("button", {
        name: label("Review answers", "مراجعة الإجابات"),
        exact: true,
      })
      .count();
    await click(
      last
        ? label("Review answers", "مراجعة الإجابات")
        : label("Next", "التالي"),
    );
    if (last) return;
  }
  throw Error("Question loop exceeded bank");
}
try {
  await go("/");
  await page
    .getByRole("link", { name: "Personalise my learning", exact: true })
    .click();
  await click("Begin assessment");
  await click("Next");
  await page.getByRole("alert").waitFor();
  await fillQuestion();
  await click("Next");
  await fillQuestion();
  await click("Next");
  await fillQuestion();
  await click("Next");
  const savedId = await page
    .locator("[data-assessment-question]")
    .getAttribute("data-assessment-question");
  await click("Save and exit");
  await page
    .getByRole("link", { name: "Resume assessment", exact: true })
    .click();
  assert.equal(
    await page
      .locator("[data-assessment-question]")
      .getAttribute("data-assessment-question"),
    savedId,
  );
  await page.reload();
  assert.equal(
    await page
      .locator("[data-assessment-question]")
      .getAttribute("data-assessment-question"),
    savedId,
  );
  await click("Switch to Arabic");
  lang = "ar";
  assert.equal((await data()).planning.draft.answers.goal.value, "build");
  await screenshot("assessment-ar-partial-desktop");
  await click("التبديل إلى الإنجليزية");
  lang = "en";
  check(
    "Guest entry, required validation, save/exit/resume, refresh and language preserve draft answers",
  );
  await finishQuestions();
  await screenshot("review-en-desktop");
  assert.equal((await data()).planning.draft.stage, "review");
  await click("Prepare my demo plan");
  await page.waitForURL("**/my-plan?prepared=1");
  await page
    .getByText(
      "Demo plan based on your answers. Prepared locally using documented rules, not Gemini.",
      { exact: true },
    )
    .waitFor();
  const first = await data(),
    firstId = first.planning.activePlanId;
  assert.equal(first.planning.plans.length, 1);
  assert.equal(
    first.planning.plans[0].learnerProfile.startingPoints[0].level,
    "explore",
  );
  await screenshot("plan-en-desktop");
  check(
    "Twenty-question review → honest local demo plan, unknown knowledge and valid schedule",
  );
  await page
    .getByRole("link", { name: "Start / continue", exact: true })
    .click();
  assert.match(page.url(), /#worked-example$/);
  await page.locator("#worked-example").waitFor();
  await click("Mark lesson complete");
  await go("/my-plan");
  await page
    .locator('progress[aria-label="Actual activity completion"][value="1"]')
    .waitFor();
  await go("/dashboard");
  await page
    .getByRole("link", { name: "Continue my plan", exact: true })
    .waitFor();
  assert.equal((await data()).lessons.length, 1);
  check(
    "Plan links to a real lesson/example and actual completion updates plan and dashboard",
  );
  await go("/my-plan");
  await click("Regenerate plan");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  assert.equal((await data()).planning.plans.length, 1);
  await click("Regenerate plan");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Regenerate plan", exact: true })
    .click();
  await page.getByText("MY PLAN / VERSION 2", { exact: false }).waitFor();
  assert.equal((await data()).planning.plans.length, 2);
  assert.equal((await data()).lessons.length, 1);
  check("Confirmed regeneration versions plans and retains completed work");
  await go("/assessment");
  await page
    .getByText("Preview service error handling", { exact: true })
    .click();
  await page
    .getByRole("checkbox", {
      name: "Use an explicit demo failure for this attempt. Existing plans are preserved.",
      exact: true,
    })
    .check();
  const before = (await data()).planning.activePlanId;
  await click("Prepare my demo plan");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Prepare new version", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "The demo plan could not be prepared" })
    .waitFor();
  assert.equal((await data()).planning.activePlanId, before);
  assert.equal((await data()).planning.plans.length, 2);
  await page
    .getByRole("checkbox", {
      name: "Use an explicit demo failure for this attempt. Existing plans are preserved.",
      exact: true,
    })
    .uncheck();
  await click("Retry plan preparation");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Prepare new version", exact: true })
    .click();
  await page.waitForURL("**/my-plan?prepared=1");
  assert.equal((await data()).planning.plans.length, 3);
  check(
    "Visible error/retry preserves last valid plan and publishes only a successful retry",
  );
  await page
    .getByRole("button", { name: "Use this version", exact: true })
    .last()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Use this version", exact: true })
    .click();
  assert.equal((await data()).planning.activePlanId, firstId);
  await go("/assessment");
  await click("Discard answers");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  assert.ok((await data()).planning.draft);
  await click("Discard answers");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Discard answers", exact: true })
    .click();
  assert.ok(!(await data()).planning.draft);
  assert.equal((await data()).planning.plans.length, 3);
  check(
    "Plan history restore and discard confirmation retain completed work and saved plans",
  );
  await page.setViewportSize({ width: 320, height: 900 });
  await go("/assessment");
  await click("Switch to Arabic");
  lang = "ar";
  await screenshot("assessment-intro-ar-320");
  await click("ابدأ التقييم");
  await screenshot("assessment-question-ar-320");
  const secondValues = {
    ...preferences,
    goal: "money",
    paths: ["investor"],
    minutes: "45",
    days: "5",
    formats: ["practice"],
    difficulty: "retry",
    confidence: "high",
    support: "independent",
    connectivity: "steady",
    aspiration: "فهم المخاطر",
  };
  await finishQuestions(secondValues, true);
  await screenshot("review-ar-320");
  await click("إعداد خطتي التجريبية");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "إعداد نسخة جديدة", exact: true })
    .click();
  await page.waitForURL("**/my-plan?prepared=1");
  const second = (await data()).planning.plans.at(-1);
  assert.equal(second.learningPlan.primaryPath, "investor");
  assert.equal(second.learningPlan.activities[0].kind, "simulation");
  assert.equal(second.learningPlan.sessionMinutes, 45);
  assert.equal(second.learnerProfile.startingPoints[2].level, "ready");
  assert.equal((await data()).lessons.length, 1);
  await screenshot("plan-ar-320");
  await page.reload();
  assert.equal((await data()).planning.activePlanId, second.learningPlan.id);
  check(
    "Full Arabic 320px assessment produces a meaningfully different durable plan from new answers",
  );
  for (const width of [1440, 320])
    for (const locale of ["ar", "en"]) {
      await page.setViewportSize({ width, height: 1000 });
      if (locale !== lang) {
        await click(
          lang === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Arabic",
        );
        lang = locale;
      }
      for (const route of [
        "/assessment",
        "/my-plan",
        "/dashboard",
        "/profile",
        "/login?next=%2Fmy-plan",
        "/signup?next=%2Fmy-plan",
        "/forgot-password?next=%2Fmy-plan",
        "/reset-password",
        "/reset-password?status=expired",
        "/reset-password?token=demo-preview-only&next=%2Fmy-plan",
      ]) {
        await go(route);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          `${locale} ${width} ${route}`,
        );
      }
      check(
        `Populated plans, assessment and all auth states fit ${locale} ${width}px`,
      );
    }
  // Keyboard and history on the actual assessment page.
  await go("/assessment");
  await page
    .getByRole("button", { name: /^Edit: What would you most/ })
    .click();
  await page.getByRole("radio").first().focus();
  await page.keyboard.press("ArrowDown");
  assert.equal(await page.getByRole("radio").nth(1).isChecked(), true);
  await click("Next");
  await click("Previous");
  assert.equal(await page.getByRole("radio").nth(1).isChecked(), true);
  await click("Open menu");
  await page
    .getByRole("link", { name: "My plan", exact: true })
    .first()
    .click();
  await page.goBack();
  await page.locator("[data-assessment-question]").waitFor();
  await page.goForward();
  await page.locator(".plan-activities").waitFor();
  check(
    "Native radio keyboard controls, previous/next and browser back/forward retain draft state",
  );
  // Every account mode: validation, unavailable service, intended destination and no persistence.
  for (const locale of ["en", "ar"]) {
    if (locale !== lang) {
      await click(
        lang === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Arabic",
      );
      lang = locale;
    }
    await go("/signup?next=%2Fmy-plan");
    await click(label("Create account — preview", "إنشاء حساب — معاينة"));
    await page
      .getByRole("alert")
      .filter({
        hasText: label("Check the highlighted fields", "تحقق من الحقول"),
      })
      .waitFor();
    await page
      .getByLabel(label("Display name", "اسم العرض"), { exact: true })
      .fill("Account-only name");
    await page
      .getByLabel(label("Email", "البريد الإلكتروني"), { exact: true })
      .fill("account-only@example.test");
    await page
      .getByLabel(label("Password", "كلمة المرور"), { exact: true })
      .fill("placeholder-password");
    await page
      .getByLabel(label("Confirm password", "تأكيد كلمة المرور"), {
        exact: true,
      })
      .fill("different");
    await click(label("Create account — preview", "إنشاء حساب — معاينة"));
    await page
      .getByText(
        label("Passwords must match.", "يجب أن تتطابق كلمتا المرور."),
        { exact: true },
      )
      .waitFor();
    await page
      .getByLabel(label("Confirm password", "تأكيد كلمة المرور"), {
        exact: true,
      })
      .fill("placeholder-password");
    await click(label("Show password", "إظهار كلمة المرور"));
    assert.equal(
      await page
        .getByLabel(label("Password", "كلمة المرور"), { exact: true })
        .getAttribute("type"),
      "text",
    );
    await click(label("Create account — preview", "إنشاء حساب — معاينة"));
    await page
      .getByRole("alert")
      .filter({ hasText: label("No account was created", "لم يُنشأ حساب") })
      .waitFor();
    await go("/login?next=%2Fmy-plan");
    await page
      .getByRole("link", {
        name: label("Forgot password?", "نسيت كلمة المرور؟"),
        exact: true,
      })
      .click();
    await page
      .getByLabel(label("Email", "البريد الإلكتروني"), { exact: true })
      .fill("account-only@example.test");
    await click(label("Request recovery — preview", "طلب استعادة — معاينة"));
    await page
      .getByRole("alert")
      .filter({
        hasText: label("Recovery email was not sent", "لم يُرسل بريد استعادة"),
      })
      .waitFor();
    assert.equal(
      await page
        .getByRole("link", {
          name: label("Continue as guest", "المتابعة كضيف"),
          exact: true,
        })
        .getAttribute("href"),
      "/my-plan",
    );
    await go("/reset-password");
    await page.getByRole("alert").waitFor();
    await go("/reset-password?status=expired");
    await page
      .getByRole("alert")
      .filter({
        hasText: label("This reset link is expired", "انتهت صلاحية رابط"),
      })
      .waitFor();
    await go("/reset-password?token=demo-preview-only&next=%2Fmy-plan");
    await page
      .getByLabel(label("New password", "كلمة المرور الجديدة"), { exact: true })
      .fill("placeholder-password");
    await page
      .getByLabel(label("Confirm password", "تأكيد كلمة المرور"), {
        exact: true,
      })
      .fill("placeholder-password");
    await click(label("Reset password — preview", "إعادة تعيين — معاينة"));
    await page
      .getByRole("alert")
      .filter({
        hasText: label("No password was changed", "لم تتغير كلمة المرور"),
      })
      .waitFor();
    assert.ok(
      !JSON.stringify(await data()).includes("account-only@example.test"),
    );
    assert.ok(!JSON.stringify(await data()).includes("placeholder-password"));
    assert.ok(!JSON.stringify(await data()).includes("Account-only name"));
    await screenshot(`account-reset-${locale}-320`);
    check(
      `Account signup, recovery, reset, validation, destination and credential isolation: ${locale}`,
    );
  }
  assert.deepEqual(issues, []);
  check(
    "No page/console errors, failed assets or external planning/auth requests",
  );
  await fs.writeFile(
    "test-results/planning/browser-report.json",
    JSON.stringify({ status: "PASS", base, checks, issues }, null, 2),
  );
} catch (e) {
  await page
    .screenshot({ path: "test-results/planning/failure.png", fullPage: true })
    .catch(() => {});
  await fs.writeFile(
    "test-results/planning/browser-report.json",
    JSON.stringify(
      { status: "FAIL", checks, error: String(e), issues },
      null,
      2,
    ),
  );
  throw e;
} finally {
  await browser.close();
}
