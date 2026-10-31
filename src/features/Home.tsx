import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Lightbulb, ChartNoAxesCombined, Check, ArrowUpRight } from 'lucide-react';
import { useApp } from '../app/context';
import { tracks } from '../content/scenarios';
import { Go } from '../components/ui';
import { JourneyArtwork, StepMotif } from '../components/TrackArtwork';
import type {Track} from '../models';
export default function Home(){
 const {t,text}=useApp();
 return <main id="main">
  <section className="container discovery-hero">
   <div className="discovery-copy">
    <p className="eyebrow">{t('YOUR CURIOSITY. A CLEAR DIRECTION.','فضولك. واتجاه واضح.')}</p>
    <h1>{t('Find your path.','اكتشف مسارك.')}<br/><em>{t('Build real skills.','وابنِ مهارات حقيقية.')}</em></h1>
    <p className="hero-description">{t('Turn your interests into a personal learning journey in technology, business or investing. Learn the essentials, try real decisions and build something of your own.','حوّل اهتماماتك إلى رحلة تعلّم شخصية في التقنية أو الأعمال أو الاستثمار. تعلّم الأساسيات وجرّب القرارات وابنِ شيئاً يخصك.')}</p>
    <div className="actions"><Go to="/assessment">{t('Find my path','اكتشف مساري')}</Go><a className="button secondary" href="#explore-paths">{t('Explore TriMind','استكشف تريمايند')} <ArrowRight size={18}/></a></div>
    <small>{t('7 questions · About 90 seconds · Start without an account','7 أسئلة · نحو 90 ثانية · ابدأ دون حساب')}</small>
   </div>
   <div className="journey-preview" aria-label={t('Illustrative learning roadmap','مثال توضيحي لخريطة التعلّم')}>
    <div className="split"><span className="eyebrow">{t('YOUR POSSIBILITIES','إمكاناتك')}</span><span className="pill">{t('Example journey','رحلة توضيحية')}</span></div>
    <JourneyArtwork />
    <div className="split"><h2>{t('From idea to first MVP','من فكرة إلى أول منتج')}</h2><Code2 size={26}/></div>
    <ol className="roadmap-preview">
     {[['Find a useful problem','اكتشف مشكلة تستحق الحل'],['Choose your smallest solution','اختر أصغر حل مفيد'],['Test it. Learn. Improve.','اختبر وتعلّم وطوّر']].map(([en,ar],i)=><li key={en}><span>{i+1}</span><div><b>{t(en,ar)}</b><small>{t(['Learn the essentials','Practise a decision','Build your project'][i],['تعلّم الأساسيات','تدرّب على قرار','ابنِ مشروعك'][i])}</small></div><ArrowUpRight size={17}/></li>)}
    </ol><small>{t('Your actual roadmap is created from your answers.','تُنشأ خريطتك الفعلية من إجاباتك.')}</small>
   </div>
  </section>
  <section id="explore-paths" className="container section">
   <div className="section-top"><h2>{t('Three paths.','ثلاثة مسارات.')}<br/>{t('One curious mind.','وعقل فضولي واحد.')}</h2><p>{t('Start where your curiosity leads. Every path stays open as you grow.','ابدأ حيث يقودك فضولك. تظل كل المسارات متاحة مع تقدمك.')}</p></div>
   <div className="path-grid">{(['builder','founder','investor'] as Track[]).map((k,i)=>{const Icon=[Code2,Lightbulb,ChartNoAxesCombined][i];return <Link to={'/learn?track='+k} className="path-item" key={k} data-track={k}><div className={'path-icon '+k}><Icon size={32}/></div><span className="meta">0{i+1} / {text(tracks[k].name)}</span><h3>{text(tracks[k].tag)}</h3><p>{text(tracks[k].description)}</p><span className="text-link">{t('Explore path','استكشف المسار')} <ArrowRight size={18}/></span></Link>})}</div>
  </section>
  <section id="how-it-works" className="how-section"><div className="container"><p className="eyebrow">{t('A LITTLE STRUCTURE. REAL MOMENTUM.','خطوات واضحة. وتقدم حقيقي.')}</p><h2>{t('From “where do I start?” to “I made this.”','من «أين أبدأ؟» إلى «أنا صنعت هذا».')}</h2><div className="three-grid">{[
   ['Discover your direction','اكتشف اتجاهك','Answer seven short questions about your goals, time and starting point.','أجب عن سبعة أسئلة قصيرة حول أهدافك ووقتك ونقطة بدايتك.'],
   ['Get your AI journey','احصل على رحلتك بالذكاء الاصطناعي','Sign in to create a roadmap using real lessons, practical challenges and a realistic weekly rhythm.','سجّل الدخول لإنشاء خريطة بدروس فعلية وتحديات عملية وإيقاع أسبوعي واقعي.'],
   ['Learn by doing','تعلّم بالممارسة','Try a lesson, practise in a fictional simulation, then save a project and keep going.','جرّب درساً وتدرّب في محاكاة خيالية ثم احفظ مشروعاً وواصل التقدم.']
  ].map(([en,ar,p,pa],i)=><div className="how-step" key={en}><div className="step-heading"><span className="step-number">0{i+1}</span><StepMotif step={i}/></div><h3>{t(en,ar)}</h3><p>{t(p,pa)}</p></div>)}</div></div></section>
  <section className="container section practice-preview"><div><p className="eyebrow">{t('KNOW IT. TRY IT. MAKE IT YOURS.','افهم. جرّب. واصنع تجربتك.')}</p><h2>{t('A lesson is only the beginning.','الدرس مجرد بداية.')}</h2><p>{t('Test a product decision, run a fictional business or explore a virtual portfolio. Useful feedback makes every choice a learning opportunity.','اختبر قراراً لمنتج أو أدر مشروعاً خيالياً أو استكشف محفظة افتراضية. الملاحظات المفيدة تجعل كل اختيار فرصة للتعلّم.')}</p><Go secondary to="/practice">{t('Try the practice lab','جرّب مختبر التدريب')}</Go></div><div className="practice-list">{(['builder','founder','investor'] as Track[]).map(k=><Link key={k} to={'/practice/'+k} data-track={k}><span><Check size={20}/>{text(tracks[k].name)}</span><b>{text(tracks[k].tag)}</b><ArrowUpRight size={20}/></Link>)}<small>{t('All scenarios are fictional. No real money or market trades.','كل السيناريوهات خيالية. لا أموال حقيقية أو صفقات سوقية.')}</small></div></section>
  <section className="final-cta container"><span className="brand-flower">✳</span><h2>{t('Your next chapter starts with one choice.','فصلك القادم يبدأ باختيار واحد.')}</h2><Go to="/assessment">{t('Find my path','اكتشف مساري')}</Go><p>{t('Already learning with us?','بدأت التعلّم معنا؟')} <Link className="text-link" to="/login">{t('Log in','تسجيل الدخول')}</Link></p></section>
 </main>
}
