import { bi } from "./courses.js";
export const tracks = {
  builder: {
    name: bi("Builder", "المطوّر"),
    tag: bi("Make something that works.", "ابنِ شيئاً يعمل."),
    description: bi(
      "Programming, problem solving and building an MVP.",
      "البرمجة وحل المشكلات وبناء منتج أولي.",
    ),
    icon: "⌘",
  },
  founder: {
    name: bi("Founder", "رائد الأعمال"),
    tag: bi("Turn a problem into a possibility.", "حوّل مشكلة إلى فرصة."),
    description: bi(
      "Customer discovery, business models and validation.",
      "اكتشاف العملاء ونماذج العمل والتحقق.",
    ),
    icon: "↗",
  },
  investor: {
    name: bi("Investor", "المستثمر"),
    tag: bi("Make sense of money.", "افهم قراراتك المالية."),
    description: bi(
      "Financial literacy, diversification and simulated investing.",
      "الثقافة المالية والتنويع والاستثمار الافتراضي.",
    ),
    icon: "◔",
  },
};
export const assets = [
  {
    id: "steady",
    name: bi("Steady basket", "سلة هادئة"),
    risk: bi(
      "Lower relative volatility. Still able to lose value.",
      "تقلب أقل نسبياً، مع احتمال الخسارة.",
    ),
    prices: [100, 102, 101, 104, 103],
  },
  {
    id: "local",
    name: bi("Local makers", "صنّاع محليون"),
    risk: bi(
      "Medium volatility; exposed to changing consumer demand.",
      "تقلب متوسط؛ يتأثر بطلب المستهلكين.",
    ),
    prices: [100, 108, 94, 102, 110],
  },
  {
    id: "spark",
    name: bi("Spark ventures", "مشروعات سبارك"),
    risk: bi(
      "High volatility; sharp gains and losses are possible.",
      "تقلب عالٍ؛ قد يرتفع وينخفض بقوة.",
    ),
    prices: [100, 120, 80, 108, 92],
  },
];
export const marketEvents = [
  bi(
    "Opening market: all fictional units cost EGP 100.",
    "بداية السوق: سعر كل وحدة خيالية 100 جنيه.",
  ),
  bi(
    "Optimism lifts growth assets. A rise is not a promise.",
    "التفاؤل يرفع أصول النمو. الارتفاع ليس وعداً.",
  ),
  bi(
    "Demand shock: volatile assets fall sharply.",
    "صدمة طلب: تنخفض الأصول المتقلبة بقوة.",
  ),
  bi(
    "Partial recovery: assets recover at different rates.",
    "تعافٍ جزئي: تتعافى الأصول بمعدلات مختلفة.",
  ),
  bi(
    "Mixed finish: concentration changes the final outcome.",
    "نهاية متباينة: يؤثر التركّز على النتيجة النهائية.",
  ),
];
export const founderEvents = [
  {
    demand: 40,
    label: bi(
      "Campus opening week: normal demand.",
      "أسبوع افتتاح الجامعة: طلب طبيعي.",
    ),
  },
  {
    demand: 30,
    label: bi(
      "Exam week: fewer learners visit the stand.",
      "أسبوع الامتحانات: يقل زوار الكشك.",
    ),
  },
  {
    demand: 50,
    label: bi(
      "Campus fair: more potential customers.",
      "معرض الجامعة: عملاء محتملون أكثر.",
    ),
  },
  {
    demand: 35,
    label: bi("A rainy week reduces foot traffic.", "أسبوع ممطر يقلل المارة."),
  },
];
export const features = [
  {
    id: "entry",
    name: bi("Task entry with validation", "إدخال مهام مع التحقق"),
    hours: 5,
    cost: 200,
    core: true,
  },
  {
    id: "list",
    name: bi("Saved task list", "قائمة مهام محفوظة"),
    hours: 6,
    cost: 250,
    core: true,
  },
  {
    id: "done",
    name: bi("Mark tasks complete", "تحديد المهام المكتملة"),
    hours: 3,
    cost: 100,
    core: true,
  },
  {
    id: "test",
    name: bi("Keyboard and error testing", "اختبار لوحة المفاتيح والأخطاء"),
    hours: 4,
    cost: 100,
    core: true,
  },
  {
    id: "calendar",
    name: bi("External calendar sync", "مزامنة تقويم خارجي"),
    hours: 10,
    cost: 400,
    core: false,
  },
  {
    id: "theme",
    name: bi("Custom colour themes", "سمات ألوان مخصصة"),
    hours: 3,
    cost: 150,
    core: false,
  },
];
