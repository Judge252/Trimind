import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
process.env.TEMP = path.resolve(".tmp");
process.env.TMP = process.env.TEMP;
await fs.mkdir(process.env.TEMP, { recursive: true });
await fs.mkdir("test-results", { recursive: true });
const browser = await chromium.launch({ headless: true });
const base = process.env.TRIMIND_URL || "http://127.0.0.1:5173";
const checks = [],
  issues = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const page = await context.newPage();
page.on("pageerror", (e) => issues.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") issues.push(m.text());
});
page.on("response", (r) => {
  if (r.status() >= 400) issues.push(`${r.status()} ${r.url()}`);
});
const go = async (p) => {
  await page.goto(base + p);
  await page.locator("main h1").waitFor();
  await page.evaluate(() => document.fonts.ready);
};
const click = async (name) =>
  page.getByRole("button", { name, exact: true }).click();
const data = () =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("trimind:phase1:v1") || "null"),
  );
const check = (label) => {
  checks.push(label);
  console.log("PASS", label);
};
try {
  await go("/");
  await page.screenshot({
    path: "test-results/home-en-desktop.png",
    fullPage: true,
  });
  await page.evaluate(() => {
    document.body.tabIndex = -1;
    document.body.focus();
  });
  await page.keyboard.press("Tab");
  assert.match(await page.locator(":focus").textContent(), /Skip/);
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(":focus").getAttribute("id"), "main");
  check("Keyboard skip link reachable and moves focus to main");
  await page.getByRole("link", { name: "Try the demo", exact: true }).click();
  await page.getByLabel("Create a practical project", { exact: true }).check();
  await click("Continue");
  await page.getByLabel("I’m starting fresh", { exact: true }).check();
  await click("Continue");
  await page.getByRole("radio", { name: /Builder/ }).check();
  await click("Go to My learning");
  assert.match(page.url(), /dashboard/);
  assert.equal((await data()).lessons.length, 0);
  check("Guest onboarding → fresh zero-progress dashboard");
  await page
    .getByRole("link", { name: "Continue learning", exact: true })
    .click();
  await page
    .getByRole("radio", { name: "A saved task survives refresh", exact: true })
    .check();
  await click("Check answer");
  await page.getByRole("status").filter({ hasText: "That’s right" }).waitFor();
  await click("Mark lesson complete");
  await page.reload();
  await page
    .getByRole("button", { name: "Lesson completed", exact: true })
    .waitFor();
  assert.equal((await data()).lessons.length, 1);
  check("Knowledge check and lesson completion persist after refresh");
  await go("/learn/build-your-first-mvp/quiz");
  await click("Next question");
  await page
    .getByRole("alert")
    .filter({ hasText: "Choose an answer" })
    .waitFor();
  for (let i = 0; i < 5; i++) {
    await page.getByRole("radio").nth([1, 0, 2, 1, 2][i]).check();
    await click(i === 4 ? "Submit quiz" : "Next question");
  }
  await page.getByText("5/5", { exact: true }).waitFor();
  assert.equal((await data()).attempts.length, 1);
  await page.reload();
  assert.equal((await data()).attempts.length, 1);
  check("Quiz empty validation, scoring, history and refresh deduplication");
  await go("/practice/investor");
  await page.getByLabel("Whole units", { exact: true }).fill("101");
  await click("Buy");
  await page.getByRole("alert").waitFor();
  await page.getByLabel("Whole units", { exact: true }).fill("20");
  await click("Buy");
  assert.equal((await data()).sessions.investor.state.cash, 8000);
  await page.reload();
  assert.equal((await data()).sessions.investor.state.holdings.steady, 20);
  for (let i = 0; i < 4; i++) await click("Advance round");
  await page
    .getByRole("heading", { name: "Your final recap", exact: true })
    .waitFor();
  const inv = await data();
  assert.equal(inv.results.length, 1);
  assert.equal(inv.results[0].summary.total, 10060);
  await page.reload();
  assert.equal((await data()).results.length, 1);
  check(
    "Investor cash, holdings, active-session persistence, rounds and finalisation",
  );
  await click("Save recap to a project");
  await page
    .getByLabel("Project title", { exact: true })
    .fill("Judge demo project");
  await page
    .getByLabel("What problem are you solving?", { exact: true })
    .fill("Help learners understand portfolio decisions.");
  await click("Save project");
  await page.reload();
  await page.getByLabel("Project title", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Project title", { exact: true }).inputValue(),
    "Judge demo project",
  );
  const downloadPromise = page.waitForEvent("download");
  await click("Download text");
  const download = await downloadPromise;
  const output = "test-results/project-export.txt";
  await download.saveAs(output);
  assert.match(await fs.readFile(output, "utf8"), /Judge demo project/);
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: "test-results/project-print.pdf",
    format: "A4",
    printBackground: true,
  });
  await page.emulateMedia({ media: "screen" });
  check(
    "Simulator → create project → edit → save → refresh → text download and print PDF",
  );
  await go("/practice/founder");
  for (let i = 0; i < 4; i++) await click("Run this round");
  await page
    .getByRole("heading", { name: "Your final recap", exact: true })
    .waitFor();
  assert.equal((await data()).sessions.founder.state.round, 4);
  assert.equal((await data()).results.length, 2);
  check("Founder four rounds, accounting, history and recap");
  await go("/practice/builder");
  await click("Evaluate MVP");
  await page.getByRole("alert").waitFor();
  for (const name of [
    "Task entry with validation",
    "Saved task list",
    "Mark tasks complete",
    "Keyboard and error testing",
  ])
    await page.getByRole("checkbox", { name: new RegExp(name) }).check();
  await click("Evaluate MVP");
  await page
    .getByText("Feasible: the complete core fits both limits.", { exact: true })
    .waitFor();
  assert.equal((await data()).results.length, 3);
  await page.reload();
  assert.equal((await data()).results.length, 3);
  await click("Save to a project");
  check(
    "Builder valid/invalid plans, durable result and explicit save to project",
  );
  await go("/login");
  await click("Check account availability");
  await page
    .getByRole("alert")
    .filter({ hasText: "Enter a valid email" })
    .waitFor();
  await page.getByLabel("Email", { exact: true }).fill("judge@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("not-a-real-password");
  await click("Show password");
  assert.equal(
    await page.getByLabel("Password", { exact: true }).getAttribute("type"),
    "text",
  );
  await click("Check account availability");
  await page
    .getByRole("status")
    .filter({ hasText: "No authentication was performed" })
    .waitFor();
  assert.ok(!JSON.stringify(await data()).includes("not-a-real-password"));
  check("Honest account limitation and no password persistence");
  await go("/projects");
  await page
    .getByRole("link", { name: "Judge demo project", exact: true })
    .click();
  await click("Delete project");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  assert.equal((await data()).projects.length, 2);
  await click("Delete project");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete project", exact: true })
    .click();
  assert.equal((await data()).projects.length, 1);
  check("Delete confirmation cancel and confirm");
  // Inspect every real route in both languages at desktop, tablet and the specified 320px width.
  const routes = [
    "/",
    "/start",
    "/dashboard",
    "/learn",
    "/learn/build-your-first-mvp",
    "/learn/build-your-first-mvp/requirements",
    "/learn/build-your-first-mvp/quiz",
    "/learn/validate-a-small-business",
    "/learn/validate-a-small-business/discovery",
    "/learn/validate-a-small-business/quiz",
    "/learn/money-and-risk",
    "/learn/money-and-risk/budget",
    "/learn/money-and-risk/quiz",
    "/practice",
    "/practice/investor",
    "/practice/founder",
    "/practice/builder",
    "/projects",
    `/projects/${(await data()).projects[0].id}`,
    "/profile",
    "/login",
    "/signup",
    "/missing-page",
  ];
  for (const lang of ["en", "ar"]) {
    if (lang === "ar") {
      await page
        .getByRole("button", { name: "Switch to Arabic", exact: true })
        .click();
      await page.waitForFunction(() => document.documentElement.dir === "rtl");
    }
    for (const width of [1440, 768, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of routes) {
        await go(route);
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        );
        if (over) {
          const offenders = await page.evaluate(() =>
            [...document.querySelectorAll("main *")]
              .filter((e) => {
                const b = e.getBoundingClientRect();
                return b.right > innerWidth + 1 || b.left < -1;
              })
              .slice(0, 8)
              .map((e) => `${e.tagName}.${e.className}`),
          );
          throw Error(`Overflow ${lang} ${width} ${route}: ${offenders}`);
        }
        if (
          width !== 768 &&
          [
            "/dashboard",
            "/practice/investor",
            "/practice/founder",
            "/practice/builder",
          ].includes(route)
        ) {
          await page.screenshot({
            path: `test-results/${route.slice(1).replaceAll("/", "-")}-${lang}-${width}.png`,
            fullPage: true,
          });
        }
      }
      check(
        `All ${routes.length} routes render without page overflow: ${lang} ${width}px`,
      );
      await go("/");
      await page.screenshot({
        path: `test-results/home-${lang}-${width}.png`,
        fullPage: true,
      });
      if (width === 320) {
        await click(lang === "ar" ? "فتح القائمة" : "Open menu");
        await page
          .getByRole("navigation", {
            name: lang === "ar" ? "التنقل الرئيسي" : "Main navigation",
          })
          .getByRole("link", {
            name: lang === "ar" ? "تدرّب" : "Practice",
            exact: true,
          })
          .click();
        assert.match(page.url(), /practice/);
        check(`Mobile navigation: ${lang}`);
      }
    }
  }
  // Actual Arabic learning and quiz flow, in addition to route rendering.
  await go("/learn/money-and-risk/budget");
  await click("تحديد الدرس كمكتمل");
  await go("/learn/money-and-risk/quiz");
  for (let i = 0; i < 5; i++) {
    await page.getByRole("radio").nth([1, 0, 2, 1, 2][i]).check();
    await click(i === 4 ? "إرسال الاختبار" : "السؤال التالي");
  }
  await page.getByText("5/5", { exact: true }).waitFor();
  check("Arabic lesson and five-question quiz end-to-end");
  for (const track of ["investor", "founder", "builder"]) {
    await go(`/practice/${track}`);
    await click("إعادة السيناريو");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "إعادة البدء", exact: true })
      .click();
    if (track === "investor") {
      await page.getByLabel("وحدات صحيحة", { exact: true }).fill("3");
      await click("شراء");
      await page.getByLabel("وحدات صحيحة", { exact: true }).fill("1");
      await click("بيع");
      assert.equal((await data()).sessions.investor.state.holdings.steady, 2);
      for (let i = 0; i < 4; i++) await click("انتقل للجولة التالية");
    } else if (track === "founder") {
      for (let i = 0; i < 4; i++) await click("نفّذ الجولة");
    } else {
      for (const name of [
        "إدخال مهام مع التحقق",
        "قائمة مهام محفوظة",
        "تحديد المهام المكتملة",
        "اختبار لوحة المفاتيح والأخطاء",
      ])
        await page.getByRole("checkbox", { name: new RegExp(name) }).check();
      await click("تقييم المنتج الأولي");
      await page
        .getByText("قابل للتنفيذ: الأساس الكامل ضمن الحدين.", { exact: true })
        .waitFor();
      await click("حفظ كمشروع");
      await page
        .getByLabel("عنوان المشروع", { exact: true })
        .fill("مشروع الاختبار العربي");
      await click("حفظ المشروع");
      await page.reload();
      assert.equal(
        await page.getByLabel("عنوان المشروع", { exact: true }).inputValue(),
        "مشروع الاختبار العربي",
      );
    }
  }
  check(
    "320px Arabic: investor buy/sell and four rounds, Founder four rounds, Builder evaluation and persisted project",
  );
  await go("/learn");
  await page.getByRole("tab", { name: "المطوّر", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await page
    .getByRole("tab", { name: "رائد الأعمال", exact: true, selected: true })
    .waitFor();
  check("Accessible tabs support arrow keys");
  await go("/practice");
  await page
    .getByRole("link", { name: "ابدأ المحاكي", exact: true })
    .first()
    .click();
  await page.goBack();
  assert.match(page.url(), /practice$/);
  await page.goForward();
  assert.match(page.url(), /builder/);
  check("Browser back/forward and direct route refresh");
  await page.evaluate(() => localStorage.setItem("other-app", "preserve"));
  await go("/profile");
  await click("إعادة ضبط العرض");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "إعادة الضبط", exact: true })
    .click();
  await page
    .getByRole("heading", {
      name: "Your next chapter starts here.",
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("other-app")),
    "preserve",
  );
  assert.equal(await data(), null);
  check("Reset removes only TRIMIND storage");
  assert.deepEqual(issues, []);
  check("No browser console errors, page exceptions or failed asset responses");
  await fs.writeFile(
    "test-results/browser-report.json",
    JSON.stringify({ status: "PASS", checks, issues }, null, 2),
  );
} catch (error) {
  await page
    .screenshot({ path: "test-results/failure.png", fullPage: true })
    .catch(() => {});
  await fs.writeFile(
    "test-results/browser-report.json",
    JSON.stringify(
      { status: "FAIL", checks, error: String(error), issues },
      null,
      2,
    ),
  );
  throw error;
} finally {
  await browser.close();
}
