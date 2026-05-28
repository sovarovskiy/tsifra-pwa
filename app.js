const App = {
  state: {
    user: null,
    deviceId: null,
    currentCall: null,
    answers: {},
    history: []
  },

  questions: [
    {
      id: 'q1', title: 'Потребность', text: 'У клиента есть задача по ОГЗ/ПС?',
      options: ['Да, подтверждена', 'Есть, но не очевидна', 'Нет задачи']
    },
    {
      id: 'q2', title: 'Тип объекта', text: 'Тип объекта?',
      options: ['ТК', 'Логистика', 'Промышленность', 'ЖК', 'Офис', 'Другое']
    },
    {
      id: 'q3', title: 'Регион', text: 'Где находится объект?',
      options: ['Москва', 'МО', 'Регионы']
    },
    {
      id: 'q4', title: 'Предписание МЧС', text: 'Есть предписание МЧС?',
      options: ['Да', 'Нет', 'Не знаю']
    },
    {
      id: 'q5', title: 'Роль контакта', text: 'Кто на линии?',
      options: ['ЛПР', 'ЛВР', 'ЛИР']
    },
    {
      id: 'q6', title: 'Финансирование', text: 'Источник финансирования?',
      options: ['Свои средства', 'Кредит/аренда', 'Госконтракт']
    },
    {
      id: 'q7', title: 'Стадия проекта', text: 'Стадия реализации?',
      options: ['Проект', 'Стройка', 'Эксплуатация']
    },
    {
      id: 'q8', title: 'Срок выбора', text: 'Когда принимают решение?',
      options: ['До 1 месяца', '1-3 месяца', 'Более 3 месяцев', 'Не определено']
    },
    {
      id: 'q9', title: 'Бюджет', text: 'Примерный бюджет?',
      options: ['Более 5 млн', '1-5 млн', 'Менее 1 млн', 'Нет бюджета']
    },
    {
      id: 'q10', title: 'Конкуренция', text: 'Есть ли другие предложения?',
      options: ['Нет', 'Да, 1-2', 'Да, более 2', 'Тендер']
    }
  ],

  init() {
    this.state.deviceId = this.getDeviceId();
    const savedUser = localStorage.getItem('tsifra_user');
    if (savedUser) {
      this.state.user = savedUser;
      this.showHome();
    } else {
      this.showScreen('screen-login');
    }
  },

  getDeviceId() {
    let id = localStorage.getItem('tsifra_device');
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('tsifra_device', id);
    }
    return id;
  },

  login() {
    const email = document.getElementById('login-email').value.trim();
    const err = document.getElementById('login-error');
    if (!email) {
      err.textContent = 'Введите email';
      return;
    }
    if (!email.includes('@')) {
      err.textContent = 'Введите корректный email';
      return;
    }
    err.textContent = '';
    this.state.user = email;
    localStorage.setItem('tsifra_user', email);
    this.showHome();
  },

  logout() {
    localStorage.removeItem('tsifra_user');
    this.state.user = null;
    this.showScreen('screen-login');
  },

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  showHome() {
    document.getElementById('header-email').textContent = this.state.user;
    this.loadStats();
    this.showScreen('screen-home');
  },

  loadStats() {
    this.state.history = JSON.parse(localStorage.getItem('tsifra_history') || '[]');
    const today = this.state.history.filter(h => {
      const d = new Date(h.date);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    document.querySelector('#stat-today .stat-num').textContent = today;
    document.querySelector('#stat-total .stat-num').textContent = this.state.history.length;
  },

  startCall() {
    const dealId = prompt('Введите ID сделки (8 цифр):');
    if (!dealId || dealId.length !== 8) {
      alert('Неверный ID');
      return;
    }
    const phone = prompt('Введите телефон:');
    if (!phone) {
      alert('Не указан телефон');
      return;
    }
    this.state.currentCall = { dealId, phone };
    this.state.answers = {};
    this.showQualify();
  },

  showQualify() {
    document.getElementById('q-deal-id').innerHTML = '<strong>ID:</strong> ' + this.state.currentCall.dealId;
    document.getElementById('q-phone').innerHTML = '<strong>Тел:</strong> ' + this.state.currentCall.phone;
    this.renderQuestions();
    this.updateProgress();
    this.showScreen('screen-qualify');
  },

  renderQuestions() {
    const body = document.getElementById('qualify-body');
    body.innerHTML = '';
    this.questions.forEach((q, i) => {
      const block = document.createElement('div');
      block.className = 'q-block';
      const answered = this.state.answers[q.id];
      const header = `<div class="q-header" onclick="App.toggleBlock(${i})">${i+1}. ${q.title} ${answered ? '✓' : ''}</div>`;
      const bodyHtml = `<div class="q-body" id="qb-${i}"><p>${q.text}</p>${q.options.map(opt => `<button class="btn-opt" onclick="App.selectAnswer('${q.id}', '${opt}')">${opt}</button>`).join('')}</div>`;
      block.innerHTML = header + bodyHtml;
      body.appendChild(block);
    });
  },

  toggleBlock(i) {
    const b = document.getElementById('qb-'+i);
    b.classList.toggle('open');
  },

  selectAnswer(qid, answer) {
    this.state.answers[qid] = answer;
    this.renderQuestions();
    this.updateProgress();
  },

  updateProgress() {
    const filled = Object.keys(this.state.answers).length;
    const total = this.questions.length;
    const pct = (filled / total) * 100;
    document.getElementById('progress-bar').style.width = pct + '%';
  },

  toggleScript() {
    const p = document.getElementById('script-panel');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
  },

  calcResult() {
    const filled = Object.keys(this.state.answers).length;
    if (filled < this.questions.length) {
      alert('Ответьте на все вопросы');
      return;
    }
    const result = this.calculateSegment();
    this.showResult(result);
  },

  calculateSegment() {
    const a = this.state.answers;
    let segment = 'B-0';
    let funnel = 'ОГЗ / упрощённые';
    let potential = 20;
    let nextAction = 'Назначить встречу';

    if (a.q1 === 'Нет задачи') {
      segment = 'F-05';
      funnel = 'Не SQL';
      potential = 0;
      nextAction = 'Закрыть как нецелевой';
    } else if (a.q4 === 'Да' && a.q8 === 'До 1 месяца') {
      segment = 'A-01';
      funnel = 'ОГЗ / фокусные';
      potential = 30;
      nextAction = 'Запросить проект и назначить встречу';
    } else if (a.q7 === 'Проект') {
      segment = 'C-0';
      funnel = 'Долгосрок';
      potential = 10;
      nextAction = 'Перевести в долгосрочную работу';
    } else if (a.q9 === 'Нет бюджета') {
      segment = 'E-05';
      funnel = 'Резервная база';
      potential = 5;
      nextAction = 'Отложить, сохранить контакт';
    }

    return {
      segment,
      segmentName: this.getSegmentName(segment),
      funnel,
      potential,
      contactRole: a.q5 || '-',
      nextAction,
      hint: this.getHint(segment)
    };
  },

  getSegmentName(seg) {
    const map = {
      'A-01': 'Аварийный срочный',
      'B-0': 'Готов к выбору',
      'C-0': 'Проектная стадия',
      'E-05': 'Нет бюджета',
      'F-05': 'Нецелевой'
    };
    return map[seg] || 'Базовый';
  },

  getHint(seg) {
    const map = {
      'A-01': 'Предложите выезд на объект в течение 3 дней.',
      'B-0': 'Назначьте встречу для уточнения требований.',
      'C-0': 'Поддерживайте контакт раз в месяц.',
      'E-05': 'Добавьте в резерв, проверяйте раз в квартал.',
      'F-05': 'Закройте сделку.'
    };
    return map[seg] || 'Действуйте по стандартной процедуре.';
  },

  showResult(result) {
    const body = document.getElementById('result-body');
    body.innerHTML = `
      <div class="result-grid">
        <div class="result-item"><strong>Сегмент:</strong> ${result.segment} – ${result.segmentName}</div>
        <div class="result-item"><strong>Воронка:</strong> ${result.funnel}</div>
        <div class="result-item"><strong>Потенциал:</strong> ${result.potential}%</div>
        <div class="result-item"><strong>Контакт:</strong> ${result.contactRole}</div>
        <div class="result-item"><strong>Следующий шаг:</strong> ${result.nextAction}</div>
        <p class="hint">${result.hint}</p>
      </div>
    `;
    this.state.currentCall.result = result;
    this.showScreen('screen-result');
  },

  saveAndHome() {
    this.saveCall();
    this.goHome();
  },

  saveAndNew() {
    this.saveCall();
    this.startCall();
  },

  saveCall() {
    const call = {
      ...this.state.currentCall,
      email: this.state.user,
      date: new Date().toISOString(),
      answers: this.state.answers
    };
    this.state.history.push(call);
    localStorage.setItem('tsifra_history', JSON.stringify(this.state.history));
  },

  goHome() {
    this.showHome();
  },

  showHistory() {
    this.renderHistory();
    this.showScreen('screen-history');
  },

  renderHistory() {
    const list = document.getElementById('history-list');
    if (!this.state.history.length) {
      list.innerHTML = '<p>Нет записей</p>';
      return;
    }
    list.innerHTML = this.state.history.slice().reverse().map(h => {
      const seg = h.result ? h.result.segment : '-';
      const segClass = seg ? 'seg-' + seg.charAt(0) : '';
      return `
        <div class="history-item ${segClass}">
          <div class="history-seg">${seg}</div>
          <div class="history-date">${new Date(h.date).toLocaleString('ru-RU')}</div>
          <div class="history-info">ID: ${h.dealId} | ${h.phone}</div>
          <div class="history-funnel">${h.result ? h.result.funnel : ''}</div>
        </div>
      `;
    }).join('');
  },

  filterHistory() {
    const q = document.getElementById('history-search').value.toLowerCase();
    document.querySelectorAll('.history-item').forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(q) ? 'block' : 'none';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
