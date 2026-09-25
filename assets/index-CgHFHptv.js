const H={0:0,F3:174.61,G3:196,A3:220,Bb3:233.08,C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,Bb4:466.16,C5:523.25,D5:587.33,E5:659.25,F5:698.46},X=[["A4",2],["C5",2],["D5",2],["C5",2],["A4",2],["G4",2],["F4",4],["G4",2],["A4",2],["C5",2],["A4",2],["G4",4],[0,4],["C5",2],["D5",2],["F5",2],["D5",2],["C5",2],["A4",2],["G4",4],["A4",2],["G4",2],["F4",2],["G4",2],["A4",4],[0,4]],K=[["F3",4],["C4",4],["A3",4],["E4",4],["Bb3",4],["F4",4],["C4",4],["G4",4],["F3",4],["C4",4],["A3",4],["E4",4],["Bb3",4],["F4",4],["C4",4],["G4",4]],U=[["F4",1],["A4",1],["C5",1],["A4",1],["F4",1],["A4",1],["C5",1],["A4",1],["A3",1],["C4",1],["E4",1],["C4",1],["A3",1],["C4",1],["E4",1],["C4",1],["Bb3",1],["D4",1],["F4",1],["D4",1],["Bb3",1],["D4",1],["F4",1],["D4",1],["C4",1],["E4",1],["G4",1],["E4",1],["C4",1],["E4",1],["G4",1],["E4",1],["F4",1],["A4",1],["C5",1],["A4",1],["F4",1],["A4",1],["C5",1],["A4",1],["A3",1],["C4",1],["E4",1],["C4",1],["A3",1],["C4",1],["E4",1],["C4",1],["Bb3",1],["D4",1],["F4",1],["D4",1],["Bb3",1],["D4",1],["F4",1],["D4",1],["C4",1],["E4",1],["G4",1],["E4",1],["C4",1],["E4",1],["G4",1],["E4",1]],W=100,v=30/W;function j(e,t=.25,c=22){const n=new Float32Array(c),l=new Float32Array(c);for(let i=1;i<c;i+=1)l[i]=2/(i*Math.PI)*Math.sin(i*Math.PI*t);return e.createPeriodicWave(n,l,{disableNormalization:!1})}function N(){const e=[],t=(n,l)=>{let i=0;for(const[a,o]of n){const r=H[a];r&&e.push({time:i*v,dur:o*v,freq:r,type:l}),i+=o}return i},c=t(X,"lead");return t(K,"bass"),t(U,"arp"),{events:e,loopDuration:c*v}}function Y(){let e=null,t=null,c=null,n=!1,l=null,i=0,a=.5;const{events:o,loopDuration:r}=N(),A=.25;function R(s){return s==="lead"?.18:s==="bass"?.16:.06}function C(s,b){const u=e.createOscillator(),x=e.createGain();s.type==="bass"?u.type="triangle":u.setPeriodicWave(c),u.frequency.value=s.freq;const T=R(s.type),$=.008,E=b+s.dur;x.gain.setValueAtTime(0,b),x.gain.linearRampToValueAtTime(T,b+$),x.gain.setValueAtTime(T,Math.max(b+$,E-.06)),x.gain.linearRampToValueAtTime(0,E),u.connect(x).connect(t),u.start(b),u.stop(E+.02)}function V(){const s=e.currentTime+A;for(;i+r<s;){for(const b of o){const u=i+b.time;u>=e.currentTime-.05&&C(b,u)}i+=r}}function O(){if(!n){e||(e=new(window.AudioContext||window.webkitAudioContext),t=e.createGain(),t.gain.value=a,t.connect(e.destination),c=j(e)),e.state==="suspended"&&e.resume(),n=!0,i=e.currentTime+.08;for(const s of o)C(s,i+s.time);i+=r,l=window.setInterval(V,60)}}function G(){if(n&&(n=!1,l&&(window.clearInterval(l),l=null),e)){const s=e.currentTime;t.gain.cancelScheduledValues(s),t.gain.setValueAtTime(t.gain.value,s),t.gain.linearRampToValueAtTime(0,s+.12),window.setTimeout(()=>{!n&&e&&e.suspend()},200)}}function z(){if(e&&t){const s=e.currentTime;t.gain.cancelScheduledValues(s),t.gain.setValueAtTime(1e-4,s),t.gain.linearRampToValueAtTime(a,s+.2)}}return{isPlaying:()=>n,play(){O(),z()},stop:G,toggle(){return n?G():this.play(),n},setVolume(s){a=s,t&&(t.gain.value=s)}}}const q="gamex:bgm",J={en:{on:"Music on",off:"Music off"},zh:{on:"音乐：开",off:"音乐：关"}};let B="en",y=null;function k(e){B=e==="zh"?"zh":"en",y==null||y()}function Q(e="en"){if(k(e),document.getElementById("gbx-bgm-toggle"))return;const t=Y(),c=document.createElement("style");c.textContent=`
    #gbx-bgm-toggle {
      /* Keep clear of the Game Boy's 136px color picker and 38px handle. */
      position: fixed; left: 166px; bottom: 16px; z-index: 40;
      display: flex; align-items: center; gap: 0;
      height: 44px; width: 44px; padding: 0; justify-content: center;
      box-sizing: border-box;
      border: 1px solid rgba(23,21,18,0.16); border-radius: 999px;
      background: rgba(255,255,255,0.82); backdrop-filter: blur(18px);
      box-shadow: 0 12px 34px rgba(26,23,19,0.16);
      color: #171512; cursor: pointer; overflow: hidden;
      font: 700 12px/1 Inter, system-ui, -apple-system, sans-serif;
      transition: background 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, width 0.24s ease, gap 0.24s ease, padding 0.24s ease;
      opacity: 0.78;
    }
    /* Compact icon-only by default so it never covers the corner cartridge;
       widens to reveal the label on hover/focus. */
    #gbx-bgm-toggle:hover, #gbx-bgm-toggle:focus-visible {
      opacity: 1; background: rgba(255,255,255,0.94);
      width: 120px; gap: 9px; padding: 0 15px 0 13px; justify-content: flex-start;
    }
    #gbx-bgm-toggle .gbx-bgm-label {
      max-width: 0; opacity: 0; transition: max-width 0.24s ease, opacity 0.2s ease;
    }
    #gbx-bgm-toggle:hover .gbx-bgm-label, #gbx-bgm-toggle:focus-visible .gbx-bgm-label {
      max-width: 120px; opacity: 1;
    }
    #gbx-bgm-toggle .gbx-eq { display: flex; align-items: flex-end; gap: 2px; height: 15px; width: 16px; flex: 0 0 auto; }
    #gbx-bgm-toggle .gbx-eq i {
      flex: 1; background: #3c3c43; border-radius: 1px; height: 30%;
      transform-origin: bottom;
    }
    #gbx-bgm-toggle.is-on .gbx-eq i { animation: gbxEq 0.9s ease-in-out infinite; }
    #gbx-bgm-toggle.is-on .gbx-eq i:nth-child(2) { animation-delay: 0.15s; }
    #gbx-bgm-toggle.is-on .gbx-eq i:nth-child(3) { animation-delay: 0.3s; }
    #gbx-bgm-toggle.is-off .gbx-eq i { height: 22%; opacity: 0.4; }
    #gbx-bgm-toggle .gbx-bgm-label { white-space: nowrap; letter-spacing: 0.01em; }
    @keyframes gbxEq {
      0%, 100% { height: 25%; }
      50% { height: 100%; }
    }
    @media (max-width: 720px) {
      #gbx-bgm-toggle .gbx-bgm-label { display: none; }
      #gbx-bgm-toggle,
      #gbx-bgm-toggle:hover,
      #gbx-bgm-toggle:focus-visible {
        width: 44px; padding: 0; gap: 0; justify-content: center;
      }
    }
  `,document.head.appendChild(c);const n=document.createElement("button");n.id="gbx-bgm-toggle",n.type="button",n.innerHTML='<span class="gbx-eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="gbx-bgm-label"></span>';const l=n.querySelector(".gbx-bgm-label");function i(o){const r=J[B];n.classList.toggle("is-on",o),n.classList.toggle("is-off",!o),n.setAttribute("aria-pressed",String(o)),n.setAttribute("aria-label",o?r.on:r.off),l.textContent=o?r.on:r.off}y=()=>i(t.isPlaying()),n.addEventListener("click",()=>{const o=t.toggle();i(o);try{localStorage.setItem(q,o?"on":"off")}catch{}}),document.body.appendChild(n),i(!1);let a=!1;try{a=localStorage.getItem(q)==="on"}catch{}if(a){const o=()=>{window.removeEventListener("pointerdown",r),window.removeEventListener("keydown",r)},r=A=>{o(),!A.composedPath().includes(n)&&(t.play(),i(!0))};window.addEventListener("pointerdown",r,{once:!0}),window.addEventListener("keydown",r,{once:!0})}return t}const _="en",M=["zh","en"],L=new URLSearchParams(window.location.search),F=L.get("lang")||_,Z=L.get("debug")==="1",D="gamex:experience-switcher-collapsed";let g=M.includes(F)?F:_;document.documentElement.lang=g;const m={zh:{switcherLabel:"GameX 体验切换",languageLabel:"语言",collapseSwitcher:"收起体验切换器",expandSwitcher:"展开体验切换器",experiences:{"game-boy":{label:"GX Pocket",visibleLabel:"GAME BOY",shortLabel:"GB"},dammagotchi:{label:"电子宠物",visibleLabel:"电子宠物",shortLabel:"TAMA"}}},en:{switcherLabel:"GameX experience switcher",languageLabel:"Language",collapseSwitcher:"Hide experience switcher",expandSwitcher:"Show experience switcher",experiences:{"game-boy":{label:"GX Pocket",visibleLabel:"GAME BOY",shortLabel:"GB"},dammagotchi:{label:"Tamagotchi",visibleLabel:"TAMAGOTCHI",shortLabel:"TAMA"}}}},f=[{id:"game-boy",source:"game-boy/index.html",accent:"#3c3c43"},{id:"dammagotchi",source:"dammagotchi/index.html",accent:"#3c3c43"}],P=L.get("app")||window.location.hash.replace("#","")||"game-boy";let h=f.some(e=>e.id===P)?P:"game-boy";function ee(e,t=!1){try{const c=window.localStorage.getItem(e);return c===null?t:c==="true"}catch{return t}}function te(e,t){try{window.localStorage.setItem(e,String(t))}catch{}}let p=ee(D);const d=document.querySelector("#app");function ne(e){const t=new URLSearchParams({lang:g});return Z&&t.set("debug","1"),`${e.source}?${t.toString()}`}function ae(e){const t=f.find(c=>c.id===e);return t?[t,...f.filter(c=>c.id!==e)]:[...f]}function w(e,{persist:t=!0,restoreFocus:c=!0}={}){p=e,t&&te(D,e);const n=d.querySelector(".experience-switcher"),l=d.querySelector("#experience-switcher-capsule"),i=d.querySelector("#experience-switcher-collapse"),a=d.querySelector("#experience-switcher-expand");!n||!l||!i||!a||(n.classList.toggle("is-collapsed",e),l.hidden=e,l.setAttribute("aria-hidden",String(e)),a.hidden=!e,a.setAttribute("aria-hidden",String(!e)),i.setAttribute("aria-expanded",String(!e)),a.setAttribute("aria-expanded",String(!e)),c&&(e?a:i).focus())}function S(){const e=f.find(a=>a.id===h),t=m[g].experiences[e.id];document.documentElement.style.setProperty("--accent",e.accent);const c=`
    <aside class="experience-switcher" aria-label="${m[g].switcherLabel}">
      <div
        class="experience-switcher__capsule"
        id="experience-switcher-capsule"
        ${p?"hidden":""}
        aria-hidden="${p}"
      >
        <nav class="experience-switcher__segments" aria-label="${m[g].switcherLabel}">
          ${ae(e.id).map(a=>{const o=m[g].experiences[a.id],r=a.id===e.id;return`
              <button
                type="button"
                class="experience-segment ${r?"is-active":""}"
                data-id="${a.id}"
                aria-label="${o.label}"
                aria-pressed="${r}"
              >
                <span class="experience-segment__full">${o.visibleLabel}</span>
                <span class="experience-segment__short" aria-hidden="true">${o.shortLabel}</span>
              </button>`}).join("")}
        </nav>
        <button
          type="button"
          class="experience-switcher__collapse"
          id="experience-switcher-collapse"
          aria-label="${m[g].collapseSwitcher}"
          aria-controls="experience-switcher-capsule"
          aria-expanded="${!p}"
        ><span aria-hidden="true">−</span></button>
        ${e.id==="dammagotchi"?`
          <div class="experience-switcher__languages" id="language-toggle" aria-label="${m[g].languageLabel}">
            <button type="button" data-language="zh" class="${g==="zh"?"is-active":""}">中文</button>
            <button type="button" data-language="en" class="${g==="en"?"is-active":""}">English</button>
          </div>`:""}
      </div>
      <button
        type="button"
        class="experience-switcher__handle"
        id="experience-switcher-expand"
        ${p?"":"hidden"}
        aria-label="${m[g].expandSwitcher}"
        aria-controls="experience-switcher-capsule"
        aria-expanded="${!p}"
        aria-hidden="${!p}"
      >GX</button>
    </aside>`;d.innerHTML=`
    <main class="shell" data-active="${e.id}">
      <section class="stage" aria-label="${t.label}">
        <iframe
          class="experience-frame"
          title="${t.label}"
          src="${ne(e)}"
          allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write"
          referrerpolicy="no-referrer"
        ></iframe>
      </section>
      ${c}
    </main>
  `;const n=d.querySelector(".experience-switcher"),l=d.querySelector("#experience-switcher-collapse"),i=d.querySelector("#experience-switcher-expand");l==null||l.addEventListener("click",()=>{w(!0)}),i==null||i.addEventListener("click",()=>{w(!1)}),n==null||n.addEventListener("keydown",a=>{a.key==="Escape"&&!p&&n.contains(document.activeElement)&&(a.preventDefault(),a.stopPropagation(),w(!0))});for(const a of d.querySelectorAll(".experience-segment"))a.addEventListener("click",()=>{const o=a.dataset.id;if(!o||o===h)return;h=o;const r=new URL(window.location.href);r.searchParams.set("app",h),r.searchParams.set("lang",g),r.hash=h,window.history.replaceState({},"",r),S()});for(const a of d.querySelectorAll("[data-language]"))a.addEventListener("click",()=>{I(a.dataset.language)});w(p,{persist:!1,restoreFocus:!1})}function I(e){if(!M.includes(e)||e===g)return;g=e,document.documentElement.lang=g,k(g);const t=new URL(window.location.href);t.searchParams.set("lang",g),t.searchParams.set("app",h),t.hash=h,window.history.replaceState({},"",t),S()}function ie(e){const t=d.querySelector(".experience-frame");return!!(t&&e.source===t.contentWindow&&e.origin===window.location.origin)}function oe(e){if(!ie(e))return;const t=e.data;t&&t.type==="gamex:set-language"&&I(t.language)}window.addEventListener("message",oe);S();Q(g);
//# sourceMappingURL=index-CgHFHptv.js.map
