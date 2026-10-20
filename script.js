'use strict';

// Progressive enhancement: the entire landing page remains readable without JS.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  document.documentElement.classList.add('motion-ready');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu({ restoreFocus = false } = {}) {
  mobileNav.hidden = true;
  mobileNav.inert = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
  document.body.classList.remove('menu-open');
  if (restoreFocus) menuToggle.focus();
}
menuToggle.addEventListener('click', () => {
  if (menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    return;
  }
  mobileNav.hidden = false;
  mobileNav.inert = false;
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', 'Закрыть меню');
  document.body.classList.add('menu-open');
});
mobileNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    closeMenu();
    const destination = document.querySelector(link.hash);
    if (destination) {
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
      destination.addEventListener('blur', () => destination.removeAttribute('tabindex'), { once: true });
    }
  });
});
document.querySelectorAll('.header-cta, .header > .logo').forEach((link) => {
  link.addEventListener('click', () => closeMenu());
});
window.matchMedia('(min-width: 801px)').addEventListener('change', (event) => {
  if (event.matches) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
  if (event.key === 'Escape') closeMenu({ restoreFocus: true });
  if (event.key === 'Tab') {
    const focusable = [menuToggle, ...mobileNav.querySelectorAll('a')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// Filter real project cards, keeping the selected state available to screen readers.
const filters = [...document.querySelectorAll('[data-filter]')];
const projectCards = [...document.querySelectorAll('[data-project]')];
filters.forEach((button) => button.addEventListener('click', () => {
  filters.forEach((filter) => {
    const selected = filter === button;
    filter.classList.toggle('active', selected);
    filter.setAttribute('aria-pressed', String(selected));
  });
  projectCards.forEach((card) => {
    const visible = button.dataset.filter === 'all' || card.dataset.category === button.dataset.filter;
    card.classList.toggle('filtered-out', !visible);
    if (visible) card.classList.add('is-visible');
  });
}));

const projects = {
  villa: {
    title: 'Тихая резиденция',
    meta: 'АРХИТЕКТУРА · АЛМАТЫ · 320 М² · КОНЦЕПТ, 2026',
    image: './assets/images/villa.webp',
    alt: 'Каменная резиденция с бассейном среди зелёных холмов',
    description: 'Одноэтажный дом в предгорьях, где граница между интерьером и природой почти исчезает. Панорамное остекление открывает вид на сад, глубокие свесы защищают от летнего солнца, а натуральный камень сохраняет ощущение прохлады. В центре концепции — тишина, свет и время с близкими.'
  },
  interior: {
    title: 'Тёплый минимализм',
    meta: 'ДИЗАЙН ИНТЕРЬЕРА · АСТАНА · 140 М² · КОНЦЕПТ, 2026',
    image: './assets/images/interior.webp',
    alt: 'Минималистичная гостиная с дубовыми деталями и мягким диваном',
    description: 'Квартира как спокойный фон для насыщенной жизни. Тёплый дуб, фактурный текстиль и мягкие оттенки камня создают глубину без визуального шума. Открытая гостиная объединяет семью, а продуманные системы хранения позволяют пространству оставаться лёгким.'
  },
  retreat: {
    title: 'Ближе к природе',
    meta: 'АРХИТЕКТУРА · БУРАБАЙ · 210 М² · КОНЦЕПТ, 2026',
    image: './assets/images/retreat.webp',
    alt: 'Современный дом с деревянным фасадом среди сосен',
    description: 'Загородный дом для длинных выходных и неспешных утр. Тёмное дерево вписывает лаконичный объём в хвойный лес, а большая терраса становится продолжением гостиной. Дом бережно обходит существующие деревья и открывается навстречу дневному свету.'
  }
};
const dialog = document.querySelector('#project-dialog');
projectCards.forEach((card) => card.addEventListener('click', () => {
  const project = projects[card.dataset.project];
  document.querySelector('#dialog-title').textContent = project.title;
  document.querySelector('#dialog-meta').textContent = project.meta;
  document.querySelector('#dialog-description').textContent = project.description;
  const image = document.querySelector('#dialog-image');
  image.src = project.image;
  image.alt = project.alt;
  dialog.showModal();
  document.body.classList.add('dialog-open');
}));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
document.querySelector('#dialog-contact').addEventListener('click', () => dialog.close());

// A demo request is a local file, never a pretend email or an unannounced upload.
const form = document.querySelector('#request-form');
const status = document.querySelector('#form-status');
const downloadAgain = document.querySelector('#download-again');
let requestText = '';
function downloadRequest() {
  const blob = new Blob(['\uFEFF', requestText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'forma-project-request.txt';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const nameField = form.elements.namedItem('name');
  nameField.setCustomValidity(nameField.value.trim().length < 2 ? 'Введите имя: не менее двух букв.' : '');
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const name = String(data.get('name')).trim();
  const email = String(data.get('email')).trim();
  const service = String(data.get('service') || 'Пока не выбрано');
  const message = String(data.get('message') || '').trim();
  requestText = [
    'FORMA — БРИФ ПРОЕКТА',
    'Демонстрационная заявка. Данные не отправлены в компанию.',
    '',
    `Дата: ${new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(new Date())}`,
    `Имя: ${name}`,
    `Email: ${email}`,
    `Направление: ${service}`,
    '',
    'О проекте:',
    message || 'Детали пока не указаны.',
    '',
    'Сохраните этот бриф, чтобы продолжить обсуждение проекта.'
  ].join('\n');
  downloadRequest();
  status.textContent = `${name}, ваш бриф готов. Файл скачивается на устройство. Это демо: заявка не отправлена.`;
  downloadAgain.hidden = false;
  form.reset();
});
form.elements.namedItem('name').addEventListener('input', (event) => event.target.setCustomValidity(''));
downloadAgain.addEventListener('click', downloadRequest);
form.querySelector('button[type="submit"]').disabled = false;
document.querySelector('#year').textContent = new Date().getFullYear();
