import './styles.css';
import { initBgmToggle } from './bgm.js';

const defaultLanguage = 'en';
const supportedLanguages = ['zh', 'en'];
const initialLanguage = new URLSearchParams(window.location.search).get('lang') || defaultLanguage;
let language = supportedLanguages.includes(initialLanguage) ? initialLanguage : defaultLanguage;

const copy = {
  zh: {
    brandApp: '电子宠物',
    live: '运行中',
    load: '加载',
    switcherLabel: 'GameX 体验切换',
    languageLabel: '语言',
    experiences: {
      'game-boy': {
        label: 'Game Boy',
        deck: '可交互的 3D 掌机，包含卡带、游戏、音频和键盘控制。',
      },
      dammagotchi: {
        label: '电子宠物',
        deck: '可照顾的虚拟宠物设备，包含喂食、护理、颜色、像素界面和声音控制。',
      },
    },
  },
  en: {
    brandApp: 'Tamagotchi',
    live: 'Live',
    load: 'Load',
    switcherLabel: 'GameX experience switcher',
    languageLabel: 'Language',
    experiences: {
      'game-boy': {
        label: 'Game Boy',
        deck: 'A tactile 3D handheld with cartridge play, games, audio and keyboard controls.',
      },
      dammagotchi: {
        label: 'Tamagotchi',
        deck: 'A living virtual pet device with feeding, care, color themes, pixel UI and sound controls.',
      },
    },
  },
};

const experiences = [
  {
    id: 'game-boy',
    source: '/game-boy/index.html',
    accent: '#3c3c43',
  },
  {
    id: 'dammagotchi',
    source: '/dammagotchi/index.html',
    accent: '#3c3c43',
  },
];

const initialId = new URLSearchParams(window.location.search).get('app') || window.location.hash.replace('#', '') || 'game-boy';
let activeId = experiences.some((item) => item.id === initialId) ? initialId : 'game-boy';

const app = document.querySelector('#app');

function experienceUrl(experience) {
  return `${experience.source}?lang=${language}`;
}

function render() {
  const active = experiences.find((item) => item.id === activeId);
  const activeCopy = copy[language].experiences[active.id];
  document.documentElement.style.setProperty('--accent', active.accent);
  app.innerHTML = `
    <main class="shell" data-active="${active.id}">
      <section class="stage" aria-label="${activeCopy.label}">
        <iframe
          class="experience-frame"
          title="${activeCopy.label}"
          src="${experienceUrl(active)}"
          allow="fullscreen; autoplay; gamepad; clipboard-read; clipboard-write"
          referrerpolicy="no-referrer"
        ></iframe>
      </section>

      <aside class="switcher" aria-label="${copy[language].switcherLabel}">
        <button type="button" class="brand" id="switcher-toggle" aria-expanded="false">
          <span class="mark" aria-hidden="true"></span>
          <div class="brand-text">
            <p>GameX</p>
            <span>${activeCopy.label}</span>
          </div>
          <span class="chev" aria-hidden="true"></span>
        </button>

        <div class="switcher-body">
          <nav class="choices" aria-label="${copy[language].switcherLabel}">
            ${experiences.map((item) => {
              const itemCopy = copy[language].experiences[item.id];
              return `
              <button
                type="button"
                class="choice ${item.id === active.id ? 'active' : ''}"
                data-id="${item.id}"
                aria-pressed="${item.id === active.id}"
              >
                <span>${itemCopy.label}</span>
                <small>${item.id === active.id ? copy[language].live : copy[language].load}</small>
              </button>
            `;
            }).join('')}
          </nav>

          ${active.id === 'game-boy' ? '' : `
          <div class="language-toggle" id="language-toggle" aria-label="${copy[language].languageLabel}">
            <button type="button" data-language="zh" class="${language === 'zh' ? 'active' : ''}">中文</button>
            <button type="button" data-language="en" class="${language === 'en' ? 'active' : ''}">English</button>
          </div>`}

          <p class="deck">${activeCopy.deck}</p>
        </div>
      </aside>
    </main>
  `;

  const switcher = app.querySelector('.switcher');
  const toggle = app.querySelector('#switcher-toggle');
  if (toggle && switcher) {
    toggle.addEventListener('click', () => {
      const open = switcher.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  for (const button of app.querySelectorAll('.choice')) {
    button.addEventListener('click', () => {
      activeId = button.dataset.id;
      const url = new URL(window.location.href);
      url.searchParams.set('app', activeId);
      url.hash = activeId;
      window.history.replaceState({}, '', url);
      render();
    });
  }

  for (const button of app.querySelectorAll('[data-language]')) {
    button.addEventListener('click', () => {
      setLanguage(button.dataset.language);
    });
  }
}

function setLanguage(next) {
  if (!supportedLanguages.includes(next) || next === language) {
    return;
  }

  language = next;
  const url = new URL(window.location.href);
  url.searchParams.set('lang', language);
  url.searchParams.set('app', activeId);
  url.hash = activeId;
  window.history.replaceState({}, '', url);
  render();
}

window.addEventListener('message', (event) => {
  const data = event.data;
  if (data && data.type === 'gamex:set-language') {
    setLanguage(data.language);
  }
});

render();
initBgmToggle();
