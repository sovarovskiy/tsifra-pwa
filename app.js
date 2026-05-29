const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxAdgbR4Bcyq_F1Z5-OVqZanqtXVqxCUJ6DePLK9MIQviRl-VsaCqd0bA8k8M_59MJY/exec';

let текущийПользователь = localStorage.getItem('user_email');
let deferredPrompt = null;

const SCRIPT_DATA = {
  jtbd: {
    A01: { имя: 'Предписание / аварийная ситуация', приоритет: 1, воронка: 'ОГЗ/фокус' },
    A02: { имя: 'Плановая проверка МЧС', приоритет: 2, воронка: 'ОГЗ/фокус' },
    A03: { имя: 'Проектная документация', приоритет: 3, воронка: 'ОГЗ/фокус' },
    B01: { имя: 'Бюджет / смета', приоритет: 4, воронка: 'ОГЗ/упрощённая' },
    B02: { имя: 'Тендер / конкурс', приоритет: 5, воронка: 'Долгосрок' },
    B03: { имя: 'Коммерческое предложение', приоритет: 6, воронка: 'ОГЗ/упрощённая' },
    C01: { имя: 'Профилактика / обновление', приоритет: 7, воронка: 'Развитие' },
    C02: { имя: 'Расчёт / консультация', приоритет: 8, воронка: 'Резервная база' },
    E04: { имя: 'Собственник (строит для себя)', приоритет: 9, воронка: 'ОГЗ/фокус' },
    E05: { имя: 'Управляющая компания', приоритет: 10, воронка: 'Развитие' }
  }
};

const вопросы = [
  {
    код: 'открытие',
    текст: '(Имя), добрый день! Меня зовут Андрей, компания «Ориентир», специалист проектно-сметного отдела. Подтвердите: вам требуется огнезащита металлоконструкций?',
    намекать: 'Подтверждение базовой потребности',
    параметры: [
      { центр: 'да', этикетка: 'Да, требуется' },
      { центр: 'нет', этикетка: 'Нет / Не актуально' }
    ]
  },
  {
    код: 'согласие_расчёт',
    текст: 'Скажите, для вас важно получить точный расчёт без переплат и сюрпризов при сдаче?',
    намекать: 'Первое согласие: важность точного расчёта',
    параметры: [
      { центр: 'да', этикетка: 'Да, важно' },
      { центр: 'нет', этикетка: 'Нет, не критично' }
    ]
  },
  {
    код: 'согласие_экспертиза',
    текст: 'Вы заинтересованы, чтобы работы прошли без проблем с экспертизой и в срок?',
    намекать: 'Второе согласие: важность экспертизы и сроков',
    параметры: [
      { центр: 'да', этикетка: 'Да, заинтересован' },
      { центр: 'нет', этикетка: 'Не приоритет' }
    ]
  },
  {
    код: 'согласие_вопросы',
    текст: 'Чтобы подготовить максимально точное коммерческое предложение, задам несколько коротких вопросов. Это займёт не больше 3 минут. Договорились?',
    намекать: 'Третье согласие: готовность отвечать на вопросы',
    параметры: [
      { центр: 'да', этикетка: 'Да, давайте' },
      { центр: 'нет', этикетка: 'Нет времени сейчас' }
    ]
  },
  {
    код: 'jtbd',
    текст: 'Расскажите подробнее, в связи с чем возникла потребность?',
    намекать: 'Определите основной триггер обращения',
    параметры: [
      { центр: 'A01', этикетка: 'Предписание МЧС или аварийная ситуация' },
      { центр: 'A02', этикетка: 'Плановая проверка' },
      { центр: 'A03', этикетка: 'Нужны расчёты / проект / документы' },
      { центр: 'B01', этикетка: 'Есть бюджет / смета' },
      { центр: 'B02', этикетка: 'Тендер или конкурс' },
      { центр: 'B03', этикетка: 'Нужно коммерческое предложение' },
      { центр: 'C01', этикетка: 'Профилактика / обновление покрытия' },
      { центр: 'C02', этикетка: 'Просто узнать цену / консультация' },
      { центр: 'E04', этикетка: 'Собственник, строящий для себя' },
      { центр: 'E05', этикетка: 'Управляющая компания' }
    ]
  },
  {
    код: 'тип_клиента',
    текст: 'Вы генподрядчик, застройщик, собственник или управляющая компания?',
    намекать: 'Определить тип клиента',
    параметры: [
      { центр: 'генподрядчик_гос', этикетка: 'Генподрядчик (гос деньги)' },
      { центр: 'генподрядчик_частный', этикетка: 'Генподрядчик (частные деньги)' },
      { центр: 'девелопер_строй', этикетка: 'Девелопер / застройщик' },
      { центр: 'девелопер_аварийный', этикетка: 'Девелопер в аварийном режиме' },
      { центр: 'собственник', этикетка: 'Собственник (строит для себя)' },
      { центр: 'управляющая', этикетка: 'Управляющая компания' }
    ]
  },
  {
    код: 'потенциал',
    текст: 'Какой примерный бюджет или масштаб работ?',
    намекать: 'Оцените размер сделки',
    параметры: [
      { центр: 'большой', этикетка: 'Более 5 млн руб' },
      { центр: 'средний', этикетка: '1–5 млн руб' },
      { центр: 'малый', этикетка: 'До 1 млн руб' }
    ]
  },
  {
    код: 'лпр',
    текст: 'Вы принимаете решение по выбору подрядчика?',
    намекать: 'Определить ЛПР / не ЛПР',
    параметры: [
      { центр: 'лпр', этикетка: 'Да, я принимаю решение' },
      { центр: 'не_лпр', этикетка: 'Нет, решение принимает другой человек' }
    ]
  },
  {
    код: 'регион',
    текст: 'Где находится объект?',
    намекать: 'Уточните регион',
    параметры: [
      { центр: 'Москва', этикетка: 'Москва' },
      { центр: 'МО', этикетка: 'Московская область' },
      { центр: 'регионы', этикетка: 'Регионы РФ' }
    ]
  },
  {
    код: 'срок',
    текст: 'Когда планируете выбрать подрядчика?',
    намекать: 'Оценка срочности',
    параметры: [
      { центр: 'срочно', этикетка: 'Срочно (до 1 месяца)' },
      { центр: '1-3месяца', этикетка: '1–3 месяца' },
      { центр: 'долгосрок', этикетка: 'Более 3 месяцев' }
    ]
  }
];

let текущееСостояние = {
  текущийВопрос: 0,
  ответы: {},
  результат: null
};

let история = JSON.parse(localStorage.getItem('история_квалификаций') || '[]');

window.addEventListener('DOMContentLoaded', () => {
  const сохраненное = localStorage.getItem('текущая_квалификация');
  if (сохраненное) {
    try {
      текущееСостояние = JSON.parse(сохраненное);
    } catch (e) {}
  }

  if (текущийПользователь) {
    показатьПриложение();
  }
});

async function войти(event) {
  event.preventDefault();

  const email = document.getElementById('email-input').value.trim();
  const ошибка = document.getElementById('login-error');

  ошибка.textContent = '';
  ошибка.classList.add('hidden');

  try {
    const response = await fetch(`${WEB_APP_URL}?action=checkEmail&email=${encodeURIComponent(email)}`);
    const data = await response.json();

    if (data.allowed) {
      const deviceId = data.device_id || generateDeviceId();

      localStorage.setItem('user_email', email);
      localStorage.setItem('device_id', deviceId);

      текущийПользователь = email;

      await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: email, device_id: deviceId })
      });

      показатьПриложение();
    } else {
      ошибка.textContent = 'Нет доступа. Обратитесь к администратору.';
      ошибка.classList.remove('hidden');
    }
  } catch (e) {
    ошибка.textContent = 'Ошибка связи с Apps Script. Проверь URL веб-приложения и права доступа.';
    ошибка.classList.remove('hidden');
    console.error(e);
  }
}

function generateDeviceId() {
  return 'device_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
}

function выйти() {
  localStorage.removeItem('user_email');
  localStorage.removeItem('device_id');
  localStorage.removeItem('текущая_квалификация');
  текущийПользователь = null;
  location.reload();
}

function показатьПриложение() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');

  const emailEl = document.getElementById('user-email');
  const avatarEl = document.getElementById('user-avatar');

  if (emailEl) emailEl.textContent = текущийПользователь || '';
  if (avatarEl) avatarEl.textContent = (текущийПользователь || 'A')[0].toUpperCase();

  const блокВопросов = document.getElementById('контейнер-вопросов');
  const блокРезультатов = document.getElementById('контейнер-результатов');

  if (блокРезультатов) {
    блокРезультатов.classList.add('hidden');
    блокРезультатов.style.display = 'none';
  }

  if (блокВопросов) {
    блокВопросов.classList.remove('hidden');
    блокВопросов.style.display = 'block';
  }

  показатьВопрос(текущееСостояние.текущийВопрос || 0);
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const prompt = document.getElementById('install-prompt');
  if (prompt) prompt.classList.remove('hidden');
});

function установитьПриложение() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.finally(() => {
    deferredPrompt = null;
  });
}

function показатьВопрос(индекс) {
  const вопрос = вопросы[индекс];
  if (!вопрос) return;

  document.getElementById('вопрос-заголовок').textContent = `Вопрос ${индекс + 1} из ${вопросы.length}`;
  document.getElementById('вопрос-текст').textContent = вопрос.текст;
  document.getElementById('намёк').textContent = вопрос.намекать;

  const контейнер = document.getElementById('варианты-ответов');
  контейнер.innerHTML = '';

  вопрос.параметры.forEach((вариант) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'вариант-ответа';
    btn.textContent = вариант.этикетка;

    if (текущееСостояние.ответы[вопрос.код] === вариант.центр) {
      btn.classList.add('выбран');
    }

    btn.addEventListener('click', () => {
      выбратьОтвет(вопрос.код, вариант.центр);
    });

    контейнер.appendChild(btn);
  });

  const btnНазад = document.getElementById('назад');
  const btnДалее = document.getElementById('далее');
  const btnЗавершить = document.getElementById('завершить');

  if (btnНазад) btnНазад.disabled = индекс === 0;

  if (btnДалее) {
    btnДалее.style.display = индекс === вопросы.length - 1 ? 'none' : 'inline-block';
  }

  if (btnЗавершить) {
    if (индекс === вопросы.length - 1) {
      btnЗавершить.style.display = 'inline-block';
      btnЗавершить.classList.remove('hidden');
    } else {
      btnЗавершить.style.display = 'none';
      btnЗавершить.classList.add('hidden');
    }
  }
}

function выбратьОтвет(код, значение) {
  текущееСостояние.ответы[код] = значение;
  localStorage.setItem('текущая_квалификация', JSON.stringify(текущееСостояние));
  показатьВопрос(текущееСостояние.текущийВопрос);

  if (текущееСостояние.текущийВопрос < вопросы.length - 1) {
    setTimeout(() => {
      следующийВопрос();
    }, 200);
  }
}

function следующийВопрос() {
  if (текущееСостояние.текущийВопрос < вопросы.length - 1) {
    текущееСостояние.текущийВопрос += 1;
    localStorage.setItem('текущая_квалификация', JSON.stringify(текущееСостояние));
    показатьВопрос(текущееСостояние.текущийВопрос);
  }
}

function предыдущийВопрос() {
  if (текущееСостояние.текущийВопрос > 0) {
    текущееСостояние.текущийВопрос -= 1;
    localStorage.setItem('текущая_квалификация', JSON.stringify(текущееСостояние));
    показатьВопрос(текущееСостояние.текущийВопрос);
  }
}

async function завершитьКвалификацию() {
  const результат = вычислитьРезультат();
  текущееСостояние.результат = результат;
  localStorage.setItem('текущая_квалификация', JSON.stringify(текущееСостояние));

  try {
    await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveQualification',
        email: текущийПользователь,
        timestamp: new Date().toISOString(),
        answers: JSON.stringify(текущееСостояние.ответы),
        jtbd: результат.jtbd_код,
        funnel: результат.воронка,
        potential: результат.потенциал,
        region: результат.регион,
        timeline: результат.срок,
        lpr: результат.лпр
      })
    });
  } catch (e) {
    console.error('Ошибка сохранения:', e);
  }

  история.unshift({
    дата: new Date().toISOString(),
    ответы: { ...текущееСостояние.ответы },
    результат: результат
  });

  localStorage.setItem('история_квалификаций', JSON.stringify(история.slice(0, 50)));
  показатьРезультаты(результат);
}

function вычислитьРезультат() {
  const jtbd_код = текущееСостояние.ответы.jtbd || 'C02';
  const jtbd = SCRIPT_DATA.jtbd[jtbd_код] || SCRIPT_DATA.jtbd.C02;

  return {
    jtbd_код: jtbd_код,
    jtbd: jtbd.имя,
    воронка: jtbd.воронка,
    приоритет: jtbd.приоритет,
    потенциал: текущееСостояние.ответы.потенциал || 'не указан',
    тип_клиента: текущееСостояние.ответы.тип_клиента || 'не указан',
    регион: текущееСостояние.ответы.регион || 'не указан',
    срок: текущееСостояние.ответы.срок || 'не указан',
    лпр: текущееСостояние.ответы.лпр === 'лпр' ? 'Да' : 'Нет'
  };
}

function показатьРезультаты(результат) {
  const блокВопросов = document.getElementById('контейнер-вопросов');
  const блокРезультатов = document.getElementById('контейнер-результатов');

  if (блокВопросов) {
    блокВопросов.classList.add('hidden');
    блокВопросов.style.display = 'none';
  }

  if (блокРезультатов) {
    блокРезультатов.classList.remove('hidden');
    блокРезультатов.style.display = 'block';
  }

  const jtbd = document.getElementById('результат-jtbd');
  const funnel = document.getElementById('результат-воронка');
  const priority = document.getElementById('результат-приоритет');
  const potential = document.getElementById('результат-потенциал');
  const type = document.getElementById('результат-тип');
  const region = document.getElementById('результат-регион');
  const closing = document.getElementById('шаблон-завершения');

  if (jtbd) jtbd.textContent = `${результат.jtbd_код}: ${результат.jtbd}`;
  if (funnel) funnel.textContent = результат.воронка;
  if (priority) priority.textContent = результат.приоритет;
  if (potential) potential.textContent = результат.потенциал;
  if (type) type.textContent = результат.тип_клиента;
  if (region) region.textContent = результат.регион;
  if (closing) closing.textContent = получитьШаблонЗавершения(результат);
}

function получитьШаблонЗавершения(результат) {
  if (результат.воронка !== 'Резервная база') {
    return 'Чтобы подготовить точный расчёт, мне нужен проект или чертежи КМ. Я скину информацию о компании, вы мне — документацию и карточку компании. Я сделаю расчёт под ключ. Завтра расчёт будет готов, позвоню согласовать встречу.';
  }
  return 'Спасибо за откровенность. Зафиксирую контакт и вернёмся к обсуждению, когда проект перейдёт в более активную стадию.';
}

function начатьЗаново() {
  текущееСостояние = {
    текущийВопрос: 0,
    ответы: {},
    результат: null
  };

  localStorage.removeItem('текущая_квалификация');

  const блокРезультатов = document.getElementById('контейнер-результатов');
  const блокВопросов = document.getElementById('контейнер-вопросов');

  if (блокРезультатов) {
    блокРезультатов.classList.add('hidden');
    блокРезультатов.style.display = 'none';
  }

  if (блокВопросов) {
    блокВопросов.classList.remove('hidden');
    блокВопросов.style.display = 'block';
  }

  показатьВопрос(0);
}
