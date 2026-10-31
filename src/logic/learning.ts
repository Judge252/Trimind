import type {
  Course,
  QuizQuestion,
  LessonProgress,
  LearnerPreferences,
} from "../models/index.js";
export function scoreQuiz(questions: QuizQuestion[], answers: number[]) {
  if (
    answers.length !== questions.length ||
    answers.some(
      (a, i) =>
        !Number.isInteger(a) || a < 0 || a >= questions[i].choices.length,
    )
  )
    throw new Error("incomplete");
  return questions.reduce((n, q, i) => n + Number(q.answer === answers[i]), 0);
}
export const courseProgress = (course: Course, progress: LessonProgress[]) =>
  course.lessons.filter((l) =>
    progress.some((p) => p.courseId === course.id && p.lessonId === l.id),
  ).length;
export const recommend = (courses: Course[], p: LearnerPreferences) =>
  courses.find((c) => c.track === p.track) ?? courses[0];
