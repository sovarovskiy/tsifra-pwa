// Аналитическая платформа Цифра
// Упрощённая версия для стабильной работы с Google Apps Script через GET-запросы

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzwXHJpWqx-p3JRaaa4tC0NDIuL7fCyRGt8H6A6AJs/exec';let текущийПользователь = localStorage.getItem('user_email');
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
    } catch (e) {
      console.error('Ошибка восстановления состояния:', e);
    }
  }

  if (текущийПользователь) {
    показатьПриложение();
  }
});

function показатьОшибка(текст) {
  const блокОшибки = document.getElementById('login-error');
  if (!блокОшибки) return;
  блокОшибки.textContent = текст;
  блокОшибки.classList.remove('hidden');
}

function скрытьОшибка() {
  const блокОшибки = document.getElementById('login-error');
  if (!блокОшибки) return;
  блокОшибки.textContent = '';
  блокОшибки.classList.add('hidden');
}

async function войти(event) {
  event.preventDefault();

  const input = document.getElementById('email-input');
  const email = (input?.value || '').trim();

  скрытьОшибка();

  if (!email) {
    показатьОшибка('Введите email');
    return;
  }

  try {
    const checkUrl = `${WEB_APP_URL}?action=checkEmail&email=${encodeURIComponent(email)}`;
    console.log('CHECK URL:', checkUrl);

    const response = await fetch(checkUrl, {
      method: 'GET',
      redirect: 'follow'
    });

    const text = await response.text();
    console.log('CHECK RESPONSE TEXT:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      показатьОшибка('Сервер вернул некорректный ответ. Обычно это значит, что Apps Script опубликован неверно.');
      console.error('Не удалось распарсить JSON:', e);
      return;
    }

    if (!data || data.allowed !== true) {
      показатьОшибка(data?.message || 'Нет доступа. Email не найден в списке разрешённых.');
      return;
    }

    const deviceId = data.device_id || generateDeviceId();

    localStorage.setItem('user_email', email);
    localStorage.setItem('device_id', deviceId);

    текущийПользователь = email;

    try {
      const loginPingUrl =
        `${WEB_APP_URL}?action=login` +
        `&email=${encodeURIComponent(email)}` +
        `&device_id=${encodeURIComponent(deviceId)}` +
        `&ts=${Date.now()}`;

      const loginPing = await fetch(loginPingUrl, {
        method: 'GET',
        redirect: 'follow'
      });

      const loginPingText = await loginPing.text();
      console.log('LOGIN PING RESPONSE:', loginPingText);
    } catch (e) {
      console.error('Ошибка логирования входа:', e);
    }

    показатьПриложение();
  } catch (error) {
    показатьОшибка('Ошибка связи с сервером');
    console.error('Ошибка авторизации:', error);
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
  const loginScreen = document.getElementById('login-screen');
  const appScreen = document.getElementById('app-screen');
  const userEmail = document.getElementById('user-email');
  const userAvatar = document.getElementById('user-avatar');
  const контейнерВопросов = document.getElementById('контейнер-вопросов');
  const контейнерРезультатов = document.getElementById('контейнер-результатов');

  if (loginScreen) loginScreen.classList.add('hidden');
  if (appScreen) appScreen.classList.remove('hidden');
  if (userEmail) userEmail.textContent = текущийПользователь || '';
  if (userAvatar) userAvatar.textContent = (текущийПользователь || '?')[0].toUpperCase();

  if (контейнерРезультатов) {
    контейнерРезультатов.classList.add('hidden');
    контейнерРезультатов.style.display = 'none';
  }

  if (контейнерВопросов) {
    контейнерВопросов.classList.remove('hidden');
    контейнерВопросов.style.display = 'block';
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

  const заголовок = document.getElementById('вопрос-заголовок');
  const текст = document.getElementById('вопрос-текст');
  const намёк = document.getElementById('намёк');
  const контейнер = document.getElementById('варианты-ответов');
  const btnНазад = document.getElementById('назад');
  const btnДалее = document.getElementById('далее');
  const btnЗавершить = document.getElementById('завершить');

  if (заголовок) заголовок.textContent = `Вопрос ${индекс + 1} из ${вопросы.length}`;
  if (текст) текст.textContent = вопрос.текст;
  if (намёк) намёк.textContent = вопрос.намекать;

  if (контейнер) {
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
  }

  if (btnНазад) btnНазад.disabled = индекс === 0;
  if (btnДалее) btnДалее.style.display = индекс === вопросы.length - 1 ? 'none' : 'inline-block';

  if (btnЗавершить) {
    if (индекс === вопросы.length - 1) {
      btnЗавершить.style.display = 'inline-block';
      btnЗавершить.classList.remove('hidden');
    } else {
      btnЗавершить.style.display = 'none';
      btnЗавершить.classList.add('hidden');
    }
  }

  обновитьПрогресс();
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

function обновитьПрогресс() {
  const процент = Math.round(((текущееСостояние.текущийВопрос + 1) / вопросы.length) * 100);
  const бар = document.getElementById('прогресс-бар');
  const текст = document.getElementById('прогресс-текст');

  if (бар) бар.style.width = `${процент}%`;
  if (текст) текст.textContent = `${процент}%`;
}

async function завершитьКвалификацию() {
  const результат = вычислитьРезультат();
  текущееСостояние.результат = результат;
  localStorage.setItem('текущая_квалификация', JSON.stringify(текущееСостояние));

  try {
    const saveUrl =
      `${WEB_APP_URL}?action=saveQualification` +
      `&email=${encodeURIComponent(текущийПользователь || '')}` +
      `&timestamp=${encodeURIComponent(new Date().toISOString())}` +
      `&jtbd=${encodeURIComponent(результат.jtbd_код)}` +
      `&funnel=${encodeURIComponent(результат.воронка)}` +
      `&potential=${encodeURIComponent(результат.потенциал)}` +
      `&region=${encodeURIComponent(результат.регион)}` +
      `&timeline=${encodeURIComponent(результат.срок)}` +
      `&lpr=${encodeURIComponent(результат.лпр)}` +
      `&answers=${encodeURIComponent(JSON.stringify(текущееСостояние.ответы))}`;

    const response = await fetch(saveUrl, {
      method: 'GET',
      redirect: 'follow'
    });

    const saveText = await response.text();
    console.log('SAVE RESPONSE:', saveText);
  } catch (error) {
    console.error('Ошибка сохранения:', error);
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
