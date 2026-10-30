import { Routes, Route, useLocation } from "react-router-dom";
import Home from "../../features/Home";
import {
  CoursePage,
  LessonPage,
  Library,
  NotFound,
  QuizPage,
} from "../../features/Learning";
import {
  Account,
  Dashboard,
  Onboarding,
  Profile,
} from "../../features/Learner";
import {
  Builder,
  Founder,
  Investor,
  Practice,
} from "../../features/Simulators";
import { Projects, ProjectWorkspace } from "../../features/Projects";

export default function AppRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Home />} />
      <Route path="/start" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/learn" element={<Library />} />
      <Route path="/learn/:courseId" element={<CoursePage />} />
      <Route path="/learn/:courseId/quiz" element={<QuizPage />} />
      <Route path="/learn/:courseId/:lessonId" element={<LessonPage />} />
      <Route path="/practice" element={<Practice />} />
      <Route path="/practice/investor" element={<Investor />} />
      <Route path="/practice/founder" element={<Founder />} />
      <Route path="/practice/builder" element={<Builder />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:projectId" element={<ProjectWorkspace />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<Account />} />
      <Route path="/signup" element={<Account signup />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
