export default function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('qtb_theme');if(t==='dark')document.documentElement.dataset.theme='dark';}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
