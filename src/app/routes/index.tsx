import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Skeleton } from '../../components/ui';
const Home=lazy(()=>import('../../features/Home'));
const Assessment=lazy(()=>import('../../features/planning/Assessment'));
const MyPlan=lazy(()=>import('../../features/planning/MyPlan'));
const Account=lazy(()=>import('../../features/Account'));
const AuthCallback=lazy(()=>import('../../features/AuthCallback'));
const CoursePage=lazy(()=>import('../../features/Learning').then(m=>({default:m.CoursePage})));
const LessonPage=lazy(()=>import('../../features/Learning').then(m=>({default:m.LessonPage})));
const Library=lazy(()=>import('../../features/Learning').then(m=>({default:m.Library})));
const QuizPage=lazy(()=>import('../../features/Learning').then(m=>({default:m.QuizPage})));
const NotFound=lazy(()=>import('../../features/Learning').then(m=>({default:m.NotFound})));
const Dashboard=lazy(()=>import('../../features/Learner').then(m=>({default:m.Dashboard})));
const Profile=lazy(()=>import('../../features/Learner').then(m=>({default:m.Profile})));
const Practice=lazy(()=>import('../../features/Simulators').then(m=>({default:m.Practice})));
const Investor=lazy(()=>import('../../features/Simulators').then(m=>({default:m.Investor})));
const Founder=lazy(()=>import('../../features/Simulators').then(m=>({default:m.Founder})));
const Builder=lazy(()=>import('../../features/Simulators').then(m=>({default:m.Builder})));
const Projects=lazy(()=>import('../../features/Projects').then(m=>({default:m.Projects})));
const ProjectWorkspace=lazy(()=>import('../../features/Projects').then(m=>({default:m.ProjectWorkspace})));
export default function AppRoutes(){const location=useLocation();return <Suspense fallback={<Skeleton/>}><Routes location={location} key={location.pathname}>
<Route path="/" element={<Home/>}/><Route path="/start" element={<Navigate to="/assessment" replace/>}/><Route path="/assessment" element={<Assessment/>}/><Route path="/my-plan" element={<MyPlan/>}/><Route path="/dashboard" element={<Dashboard/>}/>
<Route path="/learn" element={<Library/>}/><Route path="/learn/:courseId" element={<CoursePage/>}/><Route path="/learn/:courseId/quiz" element={<QuizPage/>}/><Route path="/learn/:courseId/:lessonId" element={<LessonPage/>}/>
<Route path="/practice" element={<Practice/>}/><Route path="/practice/investor" element={<Investor/>}/><Route path="/practice/founder" element={<Founder/>}/><Route path="/practice/builder" element={<Builder/>}/><Route path="/projects" element={<Projects/>}/><Route path="/projects/:projectId" element={<ProjectWorkspace/>}/><Route path="/profile" element={<Profile/>}/><Route path="/auth/callback" element={<AuthCallback/>}/><Route path="/login" element={<Account mode="login"/>}/><Route path="/signup" element={<Account mode="signup"/>}/><Route path="/forgot-password" element={<Account mode="recovery"/>}/><Route path="/reset-password" element={<Account mode="reset"/>}/><Route path="*" element={<NotFound/>}/>
</Routes></Suspense>}
