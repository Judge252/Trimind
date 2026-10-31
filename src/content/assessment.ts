import { bi } from "./courses";
import type { AssessmentQuestion, Localized, Track } from "../models";
export const sections = {
  goals: bi("A. Goals and practical constraints", "أ. الأهداف والوقت المتاح"),
  knowledge: bi("B. Starting knowledge", "ب. المعرفة المبدئية"),
  support: bi("C. Learning support", "ج. دعم التعلم"),
};
const options = (items: [string, string, string][]) =>
  items.map(([id, en, ar]) => ({ id, label: bi(en, ar) }));
const preference = (
  id: string,
  title: Localized,
  kind: AssessmentQuestion["kind"],
  items: [string, string, string][],
  section: "goals" | "support" = "goals",
  hint?: Localized,
): AssessmentQuestion => ({
  id,
  title,
  kind,
  section,
  options: options(items),
  required: true,
  hint,
});
const experience = [
  ["new", "Starting fresh", "أبدأ من الصفر"],
  ["some", "I know a little", "لدي معرفة بسيطة"],
  [
    "practiced",
    "I have tried a project or exercise",
    "جرّبت مشروعاً أو تمريناً",
  ],
] as [string, string, string][];
const knowledge = (
  id: string,
  track: Track,
  title: Localized,
  items: [string, string, string][],
  correctOptionId: string,
  hint: Localized,
  followUp = false,
): AssessmentQuestion => ({
  id,
  track,
  title,
  kind: "scenario",
  section: "knowledge",
  options: options([...items, ["unknown", "I don’t know yet", "لا أعرف بعد"]]),
  required: false,
  correctOptionId,
  hint,
  ...(followUp ? { followUpFor: track } : {}),
});
export const assessmentQuestions: AssessmentQuestion[] = [
  preference(
    "goal",
    bi(
      "What would you most like to work towards?",
      "ما الهدف الأهم الذي تريد العمل عليه؟",
    ),
    "single",
    [
      ["build", "Build a useful technology project", "بناء مشروع تقني مفيد"],
      [
        "business",
        "Test a small business idea",
        "اختبار فكرة مشروع تجاري صغير",
      ],
      ["money", "Understand money and risk", "فهم المال والمخاطر"],
      ["explore", "Explore practical skills", "استكشاف مهارات عملية"],
    ],
  ),
  preference(
    "paths",
    bi("Which paths interest you?", "ما المسارات التي تهمك؟"),
    "multi",
    [
      [
        "builder",
        "Builder — make technology work",
        "المطوّر — اجعل التقنية تعمل",
      ],
      [
        "founder",
        "Founder — test a business idea",
        "رائد الأعمال — اختبر فكرة تجارية",
      ],
      [
        "investor",
        "Investor — understand money decisions",
        "المستثمر — افهم القرارات المالية",
      ],
    ],
    "goals",
    bi(
      "Choose one or more. Your main goal will help prioritise the selected paths.",
      "اختر مساراً أو أكثر. يساعد هدفك الرئيسي في ترتيب المسارات المختارة.",
    ),
  ),
  ...(["builder", "founder", "investor"] as Track[]).map((track, i) =>
    preference(
      `experience-${track}`,
      [
        bi(
          "How much Builder experience have you had?",
          "ما خبرتك في مسار المطوّر؟",
        ),
        bi(
          "How much Founder experience have you had?",
          "ما خبرتك في مسار رائد الأعمال؟",
        ),
        bi(
          "How much Investor experience have you had?",
          "ما خبرتك في مسار المستثمر؟",
        ),
      ][i],
      "select",
      experience,
    ),
  ),
  preference(
    "minutes",
    bi(
      "How long can a learning session usually be?",
      "كم دقيقة تستطيع تخصيصها لجلسة تعلم عادةً؟",
    ),
    "select",
    [
      ["10", "10 minutes", "10 دقائق"],
      ["20", "20 minutes", "20 دقيقة"],
      ["30", "30 minutes", "30 دقيقة"],
      ["45", "45 minutes", "45 دقيقة"],
    ],
  ),
  preference(
    "days",
    bi(
      "How many days per week fit your routine?",
      "كم يوماً في الأسبوع يناسب روتينك؟",
    ),
    "select",
    [
      ["1", "1 day", "يوم واحد"],
      ["2", "2 days", "يومان"],
      ["3", "3 days", "3 أيام"],
      ["4", "4 days", "4 أيام"],
      ["5", "5 days", "5 أيام"],
    ],
  ),
  preference(
    "weeks",
    bi("What is your target timeframe?", "ما المدة المستهدفة؟"),
    "select",
    [
      ["2", "2 weeks", "أسبوعان"],
      ["4", "4 weeks", "4 أسابيع"],
      ["8", "8 weeks", "8 أسابيع"],
      ["12", "12 weeks", "12 أسبوعاً"],
    ],
    "goals",
    bi(
      "We will show how much of the existing beginner catalog fits. We will not invent extra courses to fill this time.",
      "سنوضح ما يناسب هذه المدة من محتوى المبتدئين المتاح دون اختلاق دورات إضافية.",
    ),
  ),
  preference(
    "formats",
    bi("What would you like to see first?", "ماذا تفضّل أن ترى أولاً؟"),
    "multi",
    [
      ["reading", "Short reading", "قراءة قصيرة"],
      ["examples", "Worked examples", "أمثلة محلولة"],
      ["practice", "Hands-on exercises", "تمارين عملية"],
    ],
    "goals",
    bi(
      "These preferences guide activity links and tips, not a fixed learning-style label. There are no videos in this catalog.",
      "توجّه هذه التفضيلات روابط الأنشطة والنصائح ولا تحدد نمط تعلم ثابتاً. لا توجد فيديوهات في هذا المحتوى.",
    ),
  ),
  {
    id: "aspiration",
    kind: "text",
    section: "goals",
    title: bi(
      "What would you like to create or achieve?",
      "ماذا تريد أن تصنع أو تحقق؟",
    ),
    hint: bi(
      "Optional, up to 300 characters. Avoid personal or sensitive information.",
      "اختياري، حتى 300 حرف. تجنب المعلومات الشخصية أو الحساسة.",
    ),
    required: false,
  },
  preference(
    "connectivity",
    bi(
      "What access should the plan account for?",
      "ما ظروف الوصول التي تراعيها الخطة؟",
    ),
    "single",
    [
      ["steady", "A regular browser connection", "اتصال منتظم عبر المتصفح"],
      ["limited", "I may have interruptions", "قد ينقطع الاتصال أحياناً"],
    ],
    "goals",
    bi(
      "Progress is local to this browser. The app must load before use; this is not an offline download service.",
      "التقدم محلي على هذا المتصفح. يجب تحميل التطبيق قبل الاستخدام؛ هذه ليست خدمة تنزيل للعمل دون اتصال.",
    ),
  ),
  knowledge(
    "builder-task",
    "builder",
    bi(
      "A study planner should reject an empty task title. Which check is useful?",
      "يجب أن يرفض منظم الدراسة عنوان المهمة الفارغ. أي اختبار مفيد؟",
    ),
    [
      [
        "test",
        "Try saving a blank title and check the message",
        "جرّب حفظ عنوان فارغ وافحص الرسالة",
      ],
      ["colour", "Change the logo colour", "غيّر لون الشعار"],
      ["screens", "Add another screen", "أضف شاشة أخرى"],
    ],
    "test",
    bi(
      "A requirement describes something the product must do. Test the actual task.",
      "المتطلب يصف شيئاً يجب أن يفعله المنتج. اختبر المهمة الفعلية.",
    ),
  ),
  knowledge(
    "builder-scope",
    "builder",
    bi(
      "You have 20 hours. Your minimum useful feature set needs 28. What would you do first?",
      "لديك 20 ساعة والميزات المفيدة الأساسية تحتاج 28. ماذا تفعل أولاً؟",
    ),
    [
      ["add", "Add more optional features", "أضف ميزات اختيارية"],
      [
        "reduce",
        "Reduce scope while keeping a useful task complete",
        "قلّص النطاق مع الحفاظ على مهمة مفيدة مكتملة",
      ],
      ["ignore", "Ignore the estimate", "تجاهل التقدير"],
    ],
    "reduce",
    bi(
      "Scope means the work included in this version.",
      "النطاق يعني العمل المشمول في هذه النسخة.",
    ),
  ),
  knowledge(
    "founder-discovery",
    "founder",
    bi(
      "You want to learn whether learners need snack delivery. What is the most useful question?",
      "تريد معرفة هل يحتاج المتعلمون لتوصيل الوجبات. ما السؤال الأكثر فائدة؟",
    ),
    [
      ["praise", "Do you love my great idea?", "هل تحب فكرتي الرائعة؟"],
      [
        "past",
        "What did you do last time you needed a snack?",
        "ماذا فعلت آخر مرة احتجت فيها وجبة؟",
      ],
      ["logo", "Which logo looks best?", "أي شعار أجمل؟"],
    ],
    "past",
    bi(
      "Customer discovery means asking about a real problem and past behaviour.",
      "اكتشاف العملاء يعني السؤال عن مشكلة فعلية وسلوك سابق.",
    ),
  ),
  knowledge(
    "founder-profit",
    "founder",
    bi(
      "Sales bring in EGP 1,000 and all costs are EGP 700. What is profit?",
      "المبيعات 1,000 جنيه وكل التكاليف 700. ما الربح؟",
    ),
    [
      ["1000", "EGP 1,000", "1,000 جنيه"],
      ["1700", "EGP 1,700", "1,700 جنيه"],
      ["300", "EGP 300", "300 جنيه"],
    ],
    "300",
    bi(
      "Profit is revenue minus all costs. Revenue means money from sales.",
      "الربح هو الإيراد ناقص كل التكاليف. الإيراد هو مال المبيعات.",
    ),
  ),
  knowledge(
    "investor-cash",
    "investor",
    bi(
      "You have EGP 10,000. You buy EGP 2,000 of fictional assets at an unchanged price. What is cash plus holdings?",
      "لديك 10,000 جنيه واشتريت أصولاً خيالية بـ2,000 دون تغير السعر. ما مجموع النقد والحيازات؟",
    ),
    [
      ["8000", "EGP 8,000", "8,000 جنيه"],
      ["10000", "EGP 10,000", "10,000 جنيه"],
      ["12000", "EGP 12,000", "12,000 جنيه"],
    ],
    "10000",
    bi(
      "Holdings are the assets you own. Buying exchanges cash for holdings.",
      "الحيازات هي الأصول التي تملكها. الشراء يبدّل النقد بحيازات.",
    ),
  ),
  knowledge(
    "investor-risk",
    "investor",
    bi(
      "What does spreading virtual money across different assets do?",
      "ماذا يفعل توزيع المال الافتراضي على أصول مختلفة؟",
    ),
    [
      ["guarantee", "Guarantees a gain", "يضمن الربح"],
      [
        "reduce",
        "Reduces dependence on one asset, without removing all risk",
        "يقلل الاعتماد على أصل واحد دون إلغاء كل المخاطر",
      ],
      ["remove", "Removes every possible loss", "يلغي كل خسارة محتملة"],
    ],
    "reduce",
    bi(
      "This is diversification. It spreads exposure; it does not guarantee results.",
      "هذا هو التنويع. يوزع التعرض لكنه لا يضمن النتائج.",
    ),
  ),
  preference(
    "confidence",
    bi(
      "How confident do you feel about getting started?",
      "ما شعورك بالثقة عند البداية؟",
    ),
    "single",
    [
      ["low", "I would like a gentle starting point", "أفضّل بداية هادئة"],
      ["middle", "I am willing to try", "أنا مستعد للمحاولة"],
      [
        "high",
        "I feel ready to practise independently",
        "أشعر بالاستعداد للتدرب باستقلال",
      ],
    ],
    "support",
  ),
  preference(
    "difficulty",
    bi(
      "When something is difficult, what would help you next?",
      "عندما يصعب شيء، ما الذي يساعدك؟",
    ),
    "single",
    [
      ["example", "See a worked example", "رؤية مثال محلول"],
      ["retry", "Try a smaller step again", "إعادة خطوة أصغر"],
      ["review", "Return to the explanation", "العودة للشرح"],
    ],
    "support",
  ),
  preference(
    "support",
    bi("Which support would you prefer?", "ما الدعم الذي تفضّله؟"),
    "single",
    [
      ["guided", "A clear ordered checklist", "قائمة خطوات مرتبة وواضحة"],
      ["independent", "A goal and room to explore", "هدف ومساحة للاستكشاف"],
      [
        "reflection",
        "Prompts to reflect on decisions",
        "أسئلة للتأمل في القرارات",
      ],
    ],
    "support",
    bi(
      "This is a preference, not a psychological diagnosis. Everyone can use every activity.",
      "هذا تفضيل وليس تشخيصاً نفسياً. يستطيع الجميع استخدام كل الأنشطة.",
    ),
  ),
  knowledge(
    "builder-followup",
    "builder",
    bi(
      "Why keep saving data separate from the screen code?",
      "لماذا نفصل حفظ البيانات عن كود الشاشة؟",
    ),
    [
      [
        "replace",
        "It makes storage easier to replace later",
        "يسهّل استبدال التخزين لاحقاً",
      ],
      ["skip", "It removes the need to test", "يلغي الحاجة للاختبار"],
      ["more", "It guarantees more users", "يضمن مستخدمين أكثر"],
    ],
    "replace",
    bi(
      "A data repository is a small boundary for reading and saving information.",
      "مستودع البيانات حد صغير لقراءة المعلومات وحفظها.",
    ),
    true,
  ),
  knowledge(
    "founder-followup",
    "founder",
    bi(
      "When should a small experiment set its success threshold?",
      "متى تحدد تجربة صغيرة معيار نجاحها؟",
    ),
    [
      ["before", "Before seeing the results", "قبل رؤية النتائج"],
      ["after", "After picking the best result", "بعد اختيار أفضل نتيجة"],
      ["never", "It does not need one", "لا تحتاج معياراً"],
    ],
    "before",
    bi(
      "A threshold is an observable result you decide to look for.",
      "المعيار نتيجة قابلة للملاحظة تحدد مسبقاً أنك تبحث عنها.",
    ),
    true,
  ),
  knowledge(
    "investor-followup",
    "investor",
    bi(
      "A fictional asset rises once. What does that prove?",
      "ارتفع أصل خيالي مرة واحدة. ماذا يثبت ذلك؟",
    ),
    [
      ["future", "Future gains are certain", "الأرباح القادمة مؤكدة"],
      ["one", "Only that one outcome happened", "حدوث تلك النتيجة فقط"],
      ["safe", "There is no risk", "لا توجد مخاطر"],
    ],
    "one",
    bi(
      "One result does not establish a reliable pattern.",
      "نتيجة واحدة لا تثبت نمطاً موثوقاً.",
    ),
    true,
  ),
];
