import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Home from "../../features/Home";
import {
  CoursePage,
  LessonPage,
  Library,
  NotFound,
  QuizPage,
} from "../../features/Learning";
import { Dashboard, Profile } from "../../features/Learner";
import {
  Builder,
  Founder,
  Investor,
  Practice,
} from "../../features/Simulators";
import { Projects, ProjectWorkspace } from "../../features/Projects";

import Assessment from "../../features/planning/Assessment";
import MyPlan from "../../features/planning/MyPlan";
import Account from "../../features/Account";
export default function AppRoutes() {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Home />} />
      <Route path="/start" element={<Navigate to="/assessment" replace />} />
      <Route path="/assessment" element={<Assessment />} />
      <Route path="/my-plan" element={<MyPlan />} />
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
      <Route path="/login" element={<Account mode="login" />} />
      <Route path="/signup" element={<Account mode="signup" />} />
      <Route path="/forgot-password" element={<Account mode="recovery" />} />
      <Route path="/reset-password" element={<Account mode="reset" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
