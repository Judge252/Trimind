import {Component,type ReactNode} from 'react';
export default class RouteBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){if(!this.state.failed)return this.props.children;const ar=document.documentElement.lang==='ar';return <main id="main" className="container page"><h1>{ar?'لنواصل رحلتك.':'Let’s get you back on track.'}</h1><p>{ar?'تعذر تحميل هذه الصفحة. عملك المحفوظ آمن. أعد تحميل التطبيق للمتابعة.':'This page could not load. Your saved work is safe. Reload the app to continue.'}</p><button className="button primary" onClick={()=>location.reload()}>{ar?'إعادة تحميل':'Reload app'}</button></main>;}
}
