import type { Course, Localized, QuizQuestion, Lesson } from "../models/index.js";
export const bi = (en: string, ar: string): Localized => ({ en, ar });
const q = (
  id: string,
  en: string,
  ar: string,
  choices: [string, string][],
  answer: number,
  ex: string,
  ax: string,
): QuizQuestion => ({
  id,
  question: bi(en, ar),
  choices: choices.map(([e, a]) => bi(e, a)),
  answer,
  explanation: bi(ex, ax),
});
const lesson = (
  id: string,
  title: Localized,
  minutes: number,
  paragraphs: Localized[],
  example: Localized,
  check: QuizQuestion,
): Lesson => ({ id, title, minutes, paragraphs, example, check });
export const courses: Course[] = [
  {
    id: "build-your-first-mvp",
    track: "builder",
    title: bi("Build your first MVP", "ابنِ منتجك الأول"),
    description: bi(
      "Turn a useful idea into a small, testable technology product.",
      "حوّل فكرة مفيدة إلى منتج تقني صغير قابل للاختبار.",
    ),
    outcomes: [
      bi("Write a clear user requirement", "اكتب متطلباً واضحاً للمستخدم"),
      bi("Choose a feasible feature set", "اختر ميزات قابلة للتنفيذ"),
      bi("Test a complete user journey", "اختبر رحلة مستخدم كاملة"),
    ],
    lessons: [
      lesson(
        "requirements",
        bi("Start with the user’s task", "ابدأ بمهمة المستخدم"),
        6,
        [
          bi(
            "A product is useful when it helps someone finish a task. Before choosing tools, write one sentence: “As a [person], I want to [action], so that [benefit].” This is a user requirement. It describes an outcome rather than a screen.",
            "يكون المنتج مفيداً عندما يساعد شخصاً على إنجاز مهمة. قبل اختيار الأدوات، اكتب: «بصفتي [شخصاً]، أريد [إجراءً] لكي [فائدة]». هذا متطلب مستخدم يصف نتيجة وليس شاشة.",
          ),
          bi(
            "Break that task into input, processing and output. For a study planner, the input is a task and due date, processing sorts tasks, and the output is an ordered list. This makes the work easier to estimate and test.",
            "قسّم المهمة إلى مدخلات ومعالجة ومخرجات. في منظم الدراسة، المدخل هو المهمة وموعدها، والمعالجة ترتّب المهام، والمخرج قائمة مرتبة. هذا يجعل تقدير العمل واختباره أسهل.",
          ),
          bi(
            "Add acceptance criteria that another person can check. “Easy to use” is vague. “A saved task appears after refreshing the page” is observable. Include empty input and error cases, not only the happy path.",
            "أضف معايير قبول يستطيع شخص آخر التحقق منها. «سهل الاستخدام» وصف غامض. «تظهر المهمة المحفوظة بعد تحديث الصفحة» نتيجة قابلة للملاحظة. أدرج المدخلات الفارغة والأخطاء أيضاً.",
          ),
        ],
        bi(
          "Study planner requirement: a learner adds a task with a due date. Accept when the task appears in the list, empty titles are rejected, and saved tasks survive a refresh.",
          "متطلب منظم الدراسة: يضيف المتعلم مهمة بتاريخ استحقاق. يُقبل عندما تظهر المهمة في القائمة، وتُرفض العناوين الفارغة، وتبقى المهام بعد التحديث.",
        ),
        q(
          "bcheck1",
          "Which requirement is testable?",
          "أي متطلب قابل للاختبار؟",
          [
            ["Make it amazing", "اجعله مذهلاً"],
            ["A saved task survives refresh", "تبقى المهمة بعد التحديث"],
            ["Use many tools", "استخدم أدوات كثيرة"],
          ],
          1,
          "A specific observable result can be tested.",
          "يمكن اختبار نتيجة محددة قابلة للملاحظة.",
        ),
      ),
      lesson(
        "scope",
        bi("Choose the smallest useful version", "اختر أصغر نسخة مفيدة"),
        7,
        [
          bi(
            "An MVP is a minimum viable product: the smallest version that completes a useful user journey. Minimum does not mean broken. A task planner that saves tasks is useful; five polished screens with no working save action are not.",
            "المنتج الأولي القابل للاستخدام هو أصغر نسخة تنجز رحلة مفيدة للمستخدم. الحد الأدنى لا يعني منتجاً معطلاً. منظم يحفظ المهام مفيد؛ خمس شاشات جميلة دون حفظ فعلي ليست كذلك.",
          ),
          bi(
            "Separate must-have features from later improvements. Estimate each feature in hours and money. Add the estimates before starting. If you have 20 hours and your plan needs 30, reduce the scope or change the technical approach.",
            "افصل الميزات الضرورية عن التحسينات اللاحقة. قدّر كل ميزة بالساعات والتكلفة، واجمع التقديرات قبل البدء. إذا كان لديك 20 ساعة والخطة تحتاج 30، فقلّص النطاق أو غيّر الحل التقني.",
          ),
          bi(
            "Dependencies matter. Search needs a list to search. Notifications need reliable permissions and scheduling. Build the core data flow first, then add improvements only if the remaining budget allows.",
            "العلاقات بين الميزات مهمة. البحث يحتاج قائمة للبحث فيها. الإشعارات تحتاج أذونات وجدولة موثوقة. ابنِ تدفق البيانات الأساسي أولاً ثم أضف التحسينات إذا سمحت الموارد.",
          ),
        ],
        bi(
          "A 20-hour planner MVP: task entry (5h), saved list (6h), completion checkbox (3h), testing (4h). Total 18h. Calendar sync (10h) waits for a later version.",
          "منتج منظم خلال 20 ساعة: إدخال المهام 5، قائمة محفوظة 6، تحديد الإنجاز 3، واختبار 4. المجموع 18 ساعة. مزامنة التقويم 10 ساعات تؤجل لنسخة لاحقة.",
        ),
        q(
          "bcheck2",
          "What belongs in an MVP?",
          "ماذا يدخل في المنتج الأولي؟",
          [
            ["Every possible feature", "كل ميزة ممكنة"],
            ["Only a logo", "شعار فقط"],
            ["A complete core task", "مهمة أساسية مكتملة"],
          ],
          2,
          "A small complete journey produces usable evidence.",
          "رحلة صغيرة مكتملة تمنحك دليلاً مفيداً.",
        ),
      ),
      lesson(
        "test",
        bi("Build, test and improve", "ابنِ واختبر وحسّن"),
        6,
        [
          bi(
            "Keep interface, data access and calculations separate. The interface shows a task; the repository saves it; a pure function sorts tasks. Separating these jobs makes it easier to replace browser storage with a server later.",
            "افصل الواجهة والوصول للبيانات والحسابات. تعرض الواجهة المهمة، ويحفظها المستودع، وترتبها دالة مستقلة. يسهل هذا استبدال تخزين المتصفح بخادم لاحقاً.",
          ),
          bi(
            "Test a full journey with realistic input. Add a task, refresh, mark it done and reopen the list. Then try an empty title and a very long title. A successful page render alone does not prove the product works.",
            "اختبر رحلة كاملة بمدخلات واقعية: أضف مهمة، حدّث الصفحة، أكملها وأعد فتح القائمة. جرّب بعدها عنواناً فارغاً وآخر طويلاً. ظهور الصفحة وحده لا يثبت أن المنتج يعمل.",
          ),
          bi(
            "Record the expected result and the actual result. Fix failures before adding features. Ask a learner to use the product without coaching; the point where they hesitate often reveals the next useful improvement.",
            "سجّل النتيجة المتوقعة والفعلية. أصلح الإخفاقات قبل إضافة ميزات. اطلب من متعلم استخدام المنتج دون إرشاد؛ غالباً تكشف لحظة تردده التحسين المفيد التالي.",
          ),
        ],
        bi(
          "Expected: blank tasks are rejected with a helpful message. Actual: an empty row appears. Fix validation at the save boundary, then test the same case again.",
          "المتوقع: تُرفض المهمة الفارغة برسالة مفيدة. الفعلي: يظهر صف فارغ. أصلح التحقق عند الحفظ ثم أعد اختبار الحالة نفسها.",
        ),
        q(
          "bcheck3",
          "What is the best first test?",
          "ما أفضل اختبار أول؟",
          [
            ["The whole core journey", "الرحلة الأساسية كاملة"],
            ["Only the logo colour", "لون الشعار فقط"],
            ["Only the home page", "الصفحة الرئيسية فقط"],
          ],
          0,
          "Test whether the user can finish the actual task.",
          "اختبر قدرة المستخدم على إنجاز المهمة الفعلية.",
        ),
      ),
    ],
    quiz: [
      q(
        "b1",
        "What is a user requirement?",
        "ما متطلب المستخدم؟",
        [
          ["A tool list", "قائمة أدوات"],
          ["A person, action and benefit", "شخص وإجراء وفائدة"],
          ["A colour palette", "مجموعة ألوان"],
        ],
        1,
        "Requirements describe a useful outcome.",
        "المتطلبات تصف نتيجة مفيدة.",
      ),
      q(
        "b2",
        "A 20-hour plan contains 28 hours of work. What next?",
        "خطة 20 ساعة تحتاج 28 ساعة. ماذا تفعل؟",
        [
          ["Reduce scope", "قلّص النطاق"],
          ["Ignore estimates", "تجاهل التقديرات"],
          ["Add more features", "أضف ميزات"],
        ],
        0,
        "Choose a feasible core before building.",
        "اختر أساساً قابلاً للتنفيذ قبل البناء.",
      ),
      q(
        "b3",
        "Why separate data access from the interface?",
        "لماذا نفصل الوصول للبيانات عن الواجهة؟",
        [
          ["To add screens", "لإضافة شاشات"],
          ["To avoid testing", "لتجنب الاختبار"],
          ["To replace storage more easily", "لتسهيل استبدال التخزين"],
        ],
        2,
        "A repository isolates the storage contract.",
        "المستودع يعزل عقد التخزين.",
      ),
      q(
        "b4",
        "Which is an acceptance criterion?",
        "أي مما يلي معيار قبول؟",
        [
          ["The app is cool", "التطبيق رائع"],
          [
            "Saved tasks appear after refresh",
            "تظهر المهام المحفوظة بعد التحديث",
          ],
          ["Everyone loves it", "الجميع يحبه"],
        ],
        1,
        "Acceptance criteria must be observable.",
        "معايير القبول يجب أن تكون قابلة للملاحظة.",
      ),
      q(
        "b5",
        "When should calendar sync be added?",
        "متى تضيف مزامنة التقويم؟",
        [
          ["Before saving works", "قبل عمل الحفظ"],
          ["Instead of testing", "بدلاً من الاختبار"],
          ["After the core fits the budget", "بعد ملاءمة الأساس للموارد"],
        ],
        2,
        "Core usefulness comes before extras.",
        "فائدة الأساس تسبق الإضافات.",
      ),
    ],
  },
  {
    id: "validate-a-small-business",
    track: "founder",
    title: bi("Validate a small business", "اختبر مشروعاً صغيراً"),
    description: bi(
      "Understand a customer, test a price and make a clearer pitch.",
      "افهم العميل واختبر السعر وقدّم عرضاً أوضح.",
    ),
    outcomes: [
      bi("Ask useful discovery questions", "اطرح أسئلة اكتشاف مفيدة"),
      bi("Calculate a simple margin", "احسب هامشاً بسيطاً"),
      bi("Design a small validation experiment", "صمّم تجربة تحقق صغيرة"),
    ],
    lessons: [
      lesson(
        "discovery",
        bi("Find a problem worth solving", "اكتشف مشكلة تستحق الحل"),
        7,
        [
          bi(
            "Start with a specific audience and a recent problem. “Students” is broad. “Students who study on campus after 6pm and cannot find a snack” is something you can investigate. Do not assume everyone has the same need.",
            "ابدأ بجمهور محدد ومشكلة حديثة. «الطلاب» جمهور واسع. «طلاب يدرسون في الجامعة بعد السادسة ولا يجدون وجبة خفيفة» حاجة قابلة للبحث. لا تفترض أن الجميع لديهم الحاجة نفسها.",
          ),
          bi(
            "Ask about past behaviour: “What did you do the last time this happened?” Ask what it cost in time or money. Avoid leading questions like “Would you buy my great snack box?” Compliments are weaker evidence than actual behaviour.",
            "اسأل عن السلوك الماضي: «ماذا فعلت آخر مرة حدث ذلك؟» واسأل عن الوقت أو المال الذي كلّفه. تجنب الأسئلة الموجّهة مثل «هل ستشتري صندوقي الرائع؟» المديح أضعف من السلوك الفعلي.",
          ),
          bi(
            "Write observations separately from assumptions. Interview three people, compare patterns, then choose one problem to test. A small interview is learning, not proof of market size.",
            "اكتب الملاحظات منفصلة عن الافتراضات. قابل ثلاثة أشخاص وقارن الأنماط واختر مشكلة للاختبار. المقابلات الصغيرة تعلمك ولا تثبت حجم السوق.",
          ),
        ],
        bi(
          "Observation: two learners walked 15 minutes to buy food. Assumption: they would pay EGP 60 for delivery. Next test: offer a small real preorder experiment before buying stock.",
          "ملاحظة: متعلمان مشيا 15 دقيقة لشراء طعام. افتراض: سيدفعان 60 جنيهاً للتوصيل. الاختبار التالي: تجربة طلب مسبق صغيرة قبل شراء المخزون.",
        ),
        q(
          "fcheck1",
          "Which question is least leading?",
          "أي سؤال أقل توجيهاً؟",
          [
            ["Do you love my idea?", "هل تحب فكرتي؟"],
            ["What did you do last time?", "ماذا فعلت آخر مرة؟"],
            ["You would pay, right?", "ستدفع، صحيح؟"],
          ],
          1,
          "Past behaviour provides more grounded evidence.",
          "السلوك الماضي يقدم دليلاً أوضح.",
        ),
      ),
      lesson(
        "economics",
        bi(
          "Price, cost and a simple business model",
          "السعر والتكلفة ونموذج العمل",
        ),
        8,
        [
          bi(
            "A business model explains who pays, what they receive and how delivery is funded. Revenue is money from sales. Profit is revenue minus all costs. Cash is the money available now; a profitable idea can still run out of cash before customers pay.",
            "يشرح نموذج العمل من يدفع وماذا يحصل وكيف تموّل الخدمة. الإيراد مال المبيعات، والربح هو الإيراد ناقص كل التكاليف. النقد هو المال المتاح الآن؛ قد تنفد السيولة حتى لفكرة مربحة قبل دفع العملاء.",
          ),
          bi(
            "Separate variable costs, which rise with each unit, from fixed costs, which you pay for the round regardless of sales. If a box sells for EGP 60 and costs EGP 25 to make, EGP 35 remains per sold box before marketing and fixed costs.",
            "افصل التكاليف المتغيرة لكل وحدة عن الثابتة التي تدفعها في الجولة بغض النظر عن المبيعات. إذا بيع الصندوق بـ60 جنيهاً وتكلف 25، يتبقى 35 لكل صندوق قبل التسويق والثوابت.",
          ),
          bi(
            "Higher prices can increase margin but reduce demand. A larger marketing budget may attract more people, but spending is not proof of sales. Choose a small experiment and cap spending so one weak round does not end the business.",
            "قد يزيد السعر المرتفع الهامش ويقلل الطلب. وقد يجذب التسويق أشخاصاً أكثر، لكن الإنفاق لا يثبت المبيعات. اختر تجربة صغيرة وحدد سقفاً للإنفاق كي لا تنهي جولة ضعيفة المشروع.",
          ),
        ],
        bi(
          "Sell 20 boxes at EGP 60: revenue 1,200. Production 500, marketing 100, fixed costs 200. Profit = 1,200 − 800 = EGP 400. Unsold stock still costs money.",
          "بيع 20 صندوقاً بسعر 60: الإيراد 1,200. الإنتاج 500 والتسويق 100 والثوابت 200. الربح = 1,200 − 800 = 400 جنيه. المخزون غير المباع يكلّف أيضاً.",
        ),
        q(
          "fcheck2",
          "Revenue is 1,200 and total cost is 800. Profit?",
          "الإيراد 1,200 والتكلفة 800. ما الربح؟",
          [
            ["400", "٤٠٠"],
            ["1,200", "١٬٢٠٠"],
            ["2,000", "٢٬٠٠٠"],
          ],
          0,
          "Profit subtracts every cost from revenue.",
          "الربح يطرح كل التكاليف من الإيراد.",
        ),
      ),
      lesson(
        "validation",
        bi("Test an assumption, then pitch", "اختبر افتراضاً ثم اعرض فكرتك"),
        6,
        [
          bi(
            "A useful experiment names the assumption, action and success threshold before it starts. Example: “At least 5 of 20 people will reserve a snack box at EGP 60 by Friday.” A clear threshold reduces the temptation to call every result a success.",
            "تحدد التجربة المفيدة الافتراض والإجراء وحد النجاح قبل البدء. مثال: «سيحجز 5 من 20 شخصاً صندوقاً بـ60 جنيهاً قبل الجمعة». حد واضح يقلل الميل لاعتبار كل نتيجة نجاحاً.",
          ),
          bi(
            "If the result misses the threshold, examine what failed: audience, problem, offer, channel or price. Change one major variable and repeat. Record limitations such as a small sample or friends being unusually supportive.",
            "إذا لم تبلغ النتيجة الحد، افحص الجمهور والمشكلة والعرض والقناة والسعر. غيّر متغيراً رئيسياً واحداً وأعد التجربة. سجّل حدودها مثل صغر العينة أو مجاملة الأصدقاء.",
          ),
          bi(
            "A clear pitch connects the audience, problem, solution, business model and evidence. Explain what you learned and what you will test next. Do not invent traction or present a simulation as a customer result.",
            "يربط العرض الواضح الجمهور والمشكلة والحل ونموذج العمل والدليل. اشرح ما تعلمته وما ستختبره لاحقاً. لا تختلق نتائج ولا تعرض المحاكاة كأنها نتيجة عملاء.",
          ),
        ],
        bi(
          "Pitch: evening learners need convenient snacks. We offer preordered boxes. In a proposed experiment, we will test 20 invitations and a 5-reservation threshold. These are planned measures, not claimed sales.",
          "عرض: يحتاج طلاب المساء وجبات مريحة. نقدم صناديق بطلب مسبق. في تجربة مقترحة سنختبر 20 دعوة وحد 5 حجوزات. هذه مقاييس مخططة وليست مبيعات مزعومة.",
        ),
        q(
          "fcheck3",
          "When should you set a success threshold?",
          "متى تحدد معيار النجاح؟",
          [
            ["After seeing results", "بعد رؤية النتائج"],
            ["Never", "أبداً"],
            ["Before the experiment", "قبل التجربة"],
          ],
          2,
          "Set the rule before results to reduce bias.",
          "حدد القاعدة قبل النتائج لتقليل التحيز.",
        ),
      ),
    ],
    quiz: [
      q(
        "f1",
        "What is stronger discovery evidence?",
        "ما دليل الاكتشاف الأقوى؟",
        [
          ["A compliment", "مجاملة"],
          ["Past customer behaviour", "سلوك العميل الماضي"],
          ["A logo vote", "تصويت على شعار"],
        ],
        1,
        "Behaviour is more informative than praise.",
        "السلوك أكثر إفادة من المديح.",
      ),
      q(
        "f2",
        "What is profit?",
        "ما الربح؟",
        [
          ["Revenue minus all costs", "الإيراد ناقص كل التكاليف"],
          ["Revenue only", "الإيراد فقط"],
          ["Marketing budget", "ميزانية التسويق"],
        ],
        0,
        "Include fixed and variable costs.",
        "أدرج الثوابت والمتغيرات.",
      ),
      q(
        "f3",
        "A price increase can…",
        "زيادة السعر قد…",
        [
          ["Guarantee more sales", "تضمن مبيعات أكثر"],
          ["Remove costs", "تلغي التكاليف"],
          ["Reduce demand", "تقلل الطلب"],
        ],
        2,
        "Price affects willingness to buy.",
        "السعر يؤثر في الاستعداد للشراء.",
      ),
      q(
        "f4",
        "A useful experiment includes…",
        "التجربة المفيدة تشمل…",
        [
          ["A promise of success", "وعداً بالنجاح"],
          ["A measurable threshold", "حداً قابلاً للقياس"],
          ["Only opinions", "آراء فقط"],
        ],
        1,
        "Measure a defined behaviour.",
        "قس سلوكاً محدداً.",
      ),
      q(
        "f5",
        "What belongs in an honest pitch?",
        "ماذا يتضمن العرض الصادق؟",
        [
          ["Invented sales", "مبيعات مختلقة"],
          ["Simulation as real traction", "محاكاة كأنها نتائج حقيقية"],
          ["Evidence and its limitations", "الدليل وحدوده"],
        ],
        2,
        "State what was observed and what remains untested.",
        "اذكر ما لوحظ وما لم يُختبر.",
      ),
    ],
  },
  {
    id: "money-and-risk",
    track: "investor",
    title: bi("Understand money and risk", "افهم المال والمخاطر"),
    description: bi(
      "Practise budgets, diversification and decisions under uncertainty.",
      "تدرّب على الميزانيات والتنويع والقرار في ظل عدم اليقين.",
    ),
    outcomes: [
      bi("Distinguish cash from portfolio value", "ميّز النقد من قيمة المحفظة"),
      bi("Explain diversification", "اشرح التنويع"),
      bi("Compare risk and time horizon", "قارن المخاطر والأفق الزمني"),
    ],
    lessons: [
      lesson(
        "budget",
        bi("Give every pound a job", "حدّد وظيفة لكل جنيه"),
        6,
        [
          bi(
            "A budget is a plan for money coming in and going out. Start with income, essential spending and a buffer for unexpected costs. Money needed for near-term essentials should not depend on selling a volatile asset at a good price.",
            "الميزانية خطة للمال الداخل والخارج. ابدأ بالدخل والإنفاق الضروري واحتياطي للمفاجآت. المال المطلوب للضروريات القريبة لا ينبغي أن يعتمد على بيع أصل متقلب بسعر جيد.",
          ),
          bi(
            "Separate cash from invested value. Buying 10 units at EGP 100 moves EGP 1,000 from cash into holdings. It does not create profit. Your total is available cash plus the current value of every holding.",
            "افصل النقد عن قيمة الاستثمار. شراء 10 وحدات بـ100 جنيه ينقل 1,000 جنيه من النقد إلى الحيازة ولا يصنع ربحاً. إجماليك هو النقد المتاح مع القيمة الحالية لكل الحيازات.",
          ),
          bi(
            "Track spending and compare the plan with actual results. A simulation can teach accounting, but virtual gains do not prove an approach will work with real money.",
            "تتبّع الإنفاق وقارن الخطة بالنتائج. المحاكاة تعلّم الحساب، لكن المكاسب الافتراضية لا تثبت نجاح النهج بالمال الحقيقي.",
          ),
        ],
        bi(
          "Start with EGP 10,000. Buy 20 fictional units at 100: cash 8,000, holdings 2,000, total 10,000. If the price becomes 90, total is 8,000 + 1,800 = 9,800.",
          "ابدأ بـ10,000 جنيه. اشترِ 20 وحدة خيالية بسعر 100: النقد 8,000 والحيازة 2,000 والإجمالي 10,000. عند سعر 90 يصبح الإجمالي 8,000 + 1,800 = 9,800.",
        ),
        q(
          "icheck1",
          "Does buying an asset instantly create profit?",
          "هل شراء أصل يحقق ربحاً فورياً؟",
          [
            ["Yes", "نعم"],
            ["No, it exchanges cash for holdings", "لا، يبدّل النقد بحيازة"],
            ["Only in a simulation", "في المحاكاة فقط"],
          ],
          1,
          "A trade changes allocation, not total value at the same price.",
          "التداول يغير التوزيع لا الإجمالي عند السعر نفسه.",
        ),
      ),
      lesson(
        "diversify",
        bi("Avoid depending on one outcome", "تجنب الاعتماد على نتيجة واحدة"),
        7,
        [
          bi(
            "Risk is uncertainty about outcomes, including losing value. A high-risk asset can move sharply in either direction. A calmer asset may still lose value. Labels describe relative behaviour; they are not guarantees.",
            "المخاطرة عدم يقين بشأن النتائج ومنها الخسارة. قد يتحرك الأصل عالي المخاطر بقوة في الاتجاهين. وحتى الأصل الأهدأ قد يخسر. التصنيفات تصف سلوكاً نسبياً وليست ضمانات.",
          ),
          bi(
            "Diversification spreads exposure across different assets. If one falls while another holds steady, the overall change may be smaller. It does not prevent all losses, especially when assets move together.",
            "التنويع يوزع التعرض على أصول مختلفة. إذا انخفض أصل واستقر آخر فقد يقل تغير الإجمالي. لكنه لا يمنع كل الخسائر، خصوصاً عندما تتحرك الأصول معاً.",
          ),
          bi(
            "Allocation means the share of total value held in each asset and in cash. Check concentration using values, not just number of units. Ten expensive units can outweigh a hundred cheap ones.",
            "التوزيع هو حصة كل أصل والنقد من إجمالي القيمة. افحص التركّز بالقيم وليس بعدد الوحدات فقط. عشر وحدات غالية قد تتجاوز مئة وحدة رخيصة.",
          ),
        ],
        bi(
          "Portfolio A puts EGP 10,000 in one fictional asset. A 20% fall loses 2,000. Portfolio B puts 5,000 there and keeps 5,000 cash; the same fall loses 1,000. Cash also has trade-offs, including purchasing-power risk.",
          "المحفظة أ تضع 10,000 في أصل خيالي واحد؛ انخفاض 20% يخسر 2,000. ب تضع 5,000 فيه وتحفظ 5,000 نقداً؛ الانخفاض نفسه يخسر 1,000. وللنقد مفاضلات مثل مخاطر القوة الشرائية.",
        ),
        q(
          "icheck2",
          "Diversification…",
          "التنويع…",
          [
            ["Guarantees profit", "يضمن الربح"],
            ["Removes every risk", "يلغي كل المخاطر"],
            ["Reduces dependence on one asset", "يقلل الاعتماد على أصل واحد"],
          ],
          2,
          "Diversification can reduce concentration, not all risk.",
          "قد يقلل التنويع التركّز، وليس كل المخاطر.",
        ),
      ),
      lesson(
        "decisions",
        bi("Review a decision fairly", "راجع القرار بإنصاف"),
        6,
        [
          bi(
            "A good outcome is not always evidence of a good process. A risky bet may win once by chance. Before a decision, record your goal, time horizon, possible loss and reason for the allocation.",
            "النتيجة الجيدة ليست دائماً دليلاً على عملية جيدة. قد ينجح رهان خطر مرة بالصدفة. قبل القرار سجّل هدفك والأفق الزمني والخسارة المحتملة وسبب التوزيع.",
          ),
          bi(
            "After an event, compare what changed with your original reasoning. Avoid assuming the latest rise must continue. In this simulation, every market price is predefined so you can repeat a scenario and compare decisions fairly.",
            "بعد الحدث قارن التغير بمنطقك الأصلي. لا تفترض أن الارتفاع الأخير سيستمر. في هذه المحاكاة كل الأسعار محددة مسبقاً لتكرار السيناريو ومقارنة القرارات بإنصاف.",
          ),
          bi(
            "Unrealised change is a change in holdings value before sale. Selling turns holdings into cash at the current simulated price. Always include the remaining cash in the final recap. This exercise is education, not a recommendation to invest.",
            "التغير غير المحقق هو تغير قيمة الحيازة قبل بيعها. البيع يحوّل الحيازة إلى نقد بالسعر الافتراضي الحالي. أدرج النقد المتبقي دائماً في الملخص. التمرين تعليمي وليس توصية استثمارية.",
          ),
        ],
        bi(
          "You buy 10 units at 100 and sell them at 110. Cash rises by 1,100 on sale, but profit is 100, because the units originally cost 1,000.",
          "اشتريت 10 وحدات بسعر 100 وبعتها بسعر 110. يزيد النقد 1,100 عند البيع، لكن الربح 100 لأن تكلفة الوحدات الأصلية 1,000.",
        ),
        q(
          "icheck3",
          "What belongs in total portfolio value?",
          "ماذا يدخل في إجمالي المحفظة؟",
          [
            ["Cash plus current holdings", "النقد مع الحيازات الحالية"],
            ["Only sales", "المبيعات فقط"],
            ["Only the best asset", "أفضل أصل فقط"],
          ],
          0,
          "Total value includes all cash and all holdings.",
          "الإجمالي يشمل كل النقد وكل الحيازات.",
        ),
      ),
    ],
    quiz: [
      q(
        "i1",
        "After buying 1,000 of assets from 10,000 cash, total value is…",
        "بعد شراء أصول بـ1,000 من نقد 10,000، الإجمالي…",
        [
          ["9,000", "٩٬٠٠٠"],
          ["10,000 at unchanged prices", "١٠٬٠٠٠ عند ثبات السعر"],
          ["11,000", "١١٬٠٠٠"],
        ],
        1,
        "A purchase exchanges cash for holdings.",
        "الشراء يبدّل النقد بحيازة.",
      ),
      q(
        "i2",
        "Diversification reduces…",
        "التنويع يقلل…",
        [
          ["Dependence on one outcome", "الاعتماد على نتيجة واحدة"],
          ["All possibility of loss", "كل احتمال خسارة"],
          ["The need to think", "الحاجة للتفكير"],
        ],
        0,
        "Diversification does not guarantee returns.",
        "التنويع لا يضمن العائد.",
      ),
      q(
        "i3",
        "An asset falls from 100 to 90. Ten units are now worth…",
        "انخفض أصل من 100 إلى 90. قيمة عشر وحدات…",
        [
          ["1,000", "١٬٠٠٠"],
          ["100", "١٠٠"],
          ["900", "٩٠٠"],
        ],
        2,
        "Multiply units by the current price.",
        "اضرب الوحدات في السعر الحالي.",
      ),
      q(
        "i4",
        "One lucky gain proves…",
        "ربح محظوظ واحد يثبت…",
        [
          ["Future gains are guaranteed", "ضمان الأرباح القادمة"],
          ["Only that this outcome happened", "حدوث هذه النتيجة فقط"],
          ["Risk has disappeared", "زوال المخاطرة"],
        ],
        1,
        "A single result does not establish a reliable process.",
        "نتيجة واحدة لا تثبت عملية موثوقة.",
      ),
      q(
        "i5",
        "Selling 10 units at 110 after buying at 100 gives profit of…",
        "بيع 10 وحدات بـ110 بعد شرائها بـ100 يحقق ربح…",
        [
          ["1,100", "١٬١٠٠"],
          ["1,000", "١٬٠٠٠"],
          ["100", "١٠٠"],
        ],
        2,
        "Profit is sale proceeds less original cost.",
        "الربح هو حصيلة البيع ناقص التكلفة الأصلية.",
      ),
    ],
  },
];
