// Скрипт квалификации "Аналитическая платформа Цифра"
// Точное соответствие оригинальному скрипту и логике

const SCRIPT_DATA = {
    // JTBD-сегменты
    jtbd: {
        'A01': {name: 'Предписание/Аварийность', priority: 1},
        'A02': {name: 'Плановая проверка МЧС', priority: 2},
        'A03': {name: 'Проектная документация', priority: 3},
        'B01': {name: 'Бюджет/Смета', priority: 4},
        'B02': {name: 'Тендер/Конкурс', priority: 5},
        'C01': {name: 'Профилактика/Обновление', priority: 6},
        'C02': {name: 'Расчёт/Консультация', priority: 7}
    },

    // Воронки
    funnels: {
        'C-01': 'Базовая воронка',
        'C-02': 'Конкурентная воронка (качество)',
        'C-03': 'Ценовая воронка',
        'E-01': 'Экспертная воронка'
    }
};

const questions = [
    {
        id: 1,
        code: 'jtbd',
        title: 'Тип задачи (JTBD)',
        text: 'Почему клиент сейчас обратился? Что случилось?',
        hint: 'Определите основной триггер обращения',
        options: [
            {value: 'A01', label: 'Предписание МЧС или аварийная ситуация'},
            {value: 'A02', label: 'Плановая проверка (скоро проверка)'},
            {value: 'A03', label: 'Нужны расчёты/проект для документов'},
            {value: 'B01', label: 'Есть бюджет/смета, нужно закрыть строку'},
            {value: 'B02', label: 'Тендер или конкурс'},
            {value: 'C01', label: 'Профилактика/обновление покрытия'},
            {value: 'C02', label: 'Просто узнать цену/получить консультацию'}
        ]
    },
    {
        id: 2,
        code: 'segment',
        title: 'Критерий выбора',
        text: 'Что для вас важнее: надёжность и качество или минимальная цена?',
        hint: 'Сегмент P (цена) или S (надёжность)',
        options: [
            {value: 'S', label: 'Надёжность и качество (главное - чтобы сделали хорошо)'},
            {value: 'P', label: 'Минимальная цена (главное - сэкономить)'}
        ]
    },
    {
        id: 3,
        code: 'competition',
        title: 'Конкуренция',
        text: 'Есть ли у вас другие предложения от конкурентов?',
        options: [
            {value: '0', label: 'Нет, вы первые'},
            {value: '1', label: 'Да, есть 1 конкурент'},
            {value: '10', label: 'Да, есть 2+ конкурента или тендер'}
        ]
    },
    {
        id: 4,
        code: 'lpr',
        title: 'ЛПР',
        text: 'Клиент - это лицо, принимающее решение (ЛПР)?',
        options: [
            {value: 'yes', label: 'Да, это ЛПР'},
            {value: 'no', label: 'Нет, не ЛПР'}
        ]
    },
    {
        id: 5,
        code: 'budget',
        title: 'Бюджет',
        text: 'Какой примерный бюджет?',
        options: [
            {value: 'high', label: 'Более 5 млн'},
            {value: 'medium', label: '1-5 млн'},
            {value: 'low', label: 'Менее 1 млн'}
        ]
    },
    {
        id: 6,
        code: 'timing',
        title: 'Сроки',
        text: 'Когда планируете принять решение?',
        options: [
            {value: 'urgent', label: 'Срочно (1 месяц)'},
            {value: 'medium', label: '1-3 месяца'},
            {value: 'long', label: 'Более 3 месяцев'}
        ]
    },
    {
        id: 7,
        code: 'region',
        title: 'Регион',
        text: 'Где находится объект?',
        options: [
            {value: 'moscow', label: 'Москва'},
            {value: 'mo', label: 'МО'},
            {value: 'regions', label: 'Регионы'}
        ]
    },
    {
        id: 8,
        code: 'object_type',
        title: 'Тип объекта',
        text: 'Какой тип объекта?',
        options: [
            {value: 'tc', label: 'ТК (торговый комплекс)'},
            {value: 'logistics', label: 'Логистика'},
            {value: 'industry', label: 'Промышленность'},
            {value: 'residential', label: 'ЖК'},
            {value: 'office', label: 'Офис'},
            {value: 'other', label: 'Другое'}
        ]
    },
    {
        id: 9,
        code: 'financing',
        title: 'Финансирование',
        text: 'Источник финансирования?',
        options: [
            {value: 'own', label: 'Свои средства'},
            {value: 'credit', label: 'Кредит/аренда'},
            {value: 'gov', label: 'Госконтракт'}
        ]
    },
    {
        id: 10,
        code: 'stage',
        title: 'Стадия проекта',
        text: 'На какой стадии проект?',
        options: [
            {value: 'project', label: 'Проект'},
            {value: 'construction', label: 'Стройка'},
            {value: 'operation', label: 'Эксплуатация'}
        ]
    }
];

// Текущее состояние
let currentQuestion = 0;
let answers = {};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    showQuestion(currentQuestion);
    updateProgress();
    updateButtons();
});

// Отображение вопроса
function showQuestion(index) {
    const question = questions[index];
    const container = document.getElementById('question-container');

    let html = `
        <div class="question-card">
            <div class="question-number">Вопрос ${index + 1} из ${questions.length}</div>
            <div class="question-title">${question.title}</div>
            <div class="question-text">${question.text}</div>
            ${question.hint ? `<div class="question-hint">${question.hint}</div>` : ''}
            <div class="options">`;

    question.options.forEach((option) => {
        const isSelected = answers[question.code] === option.value ? 'selected' : '';
        html += `<button class="option-btn ${isSelected}" onclick="selectAnswer('${question.code}', '${option.value}')">
                    ${option.label}
                </button>`;
    });

    html += `</div></div>`;
    container.innerHTML = html;
}

// Выбор ответа
function selectAnswer(questionCode, value) {
    answers[questionCode] = value;
    showQuestion(currentQuestion);
    updateProgress();
}

// Обновление прогресс-бара
function updateProgress() {
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / questions.length) * 100;
    document.getElementById('progress').style.width = progress + '%';
}

// Следующий вопрос
function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        showQuestion(currentQuestion);
        updateButtons();
    } else {
        calculateAndShowResults();
    }
}

// Предыдущий вопрос
function prevQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        showQuestion(currentQuestion);
        updateButtons();
    }
}

// Обновление кнопок навигации
function updateButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    prevBtn.style.opacity = currentQuestion === 0 ? '0.5' : '1';
    prevBtn.style.pointerEvents = currentQuestion === 0 ? 'none' : 'auto';

    nextBtn.textContent = currentQuestion === questions.length - 1 ? 'Завершить ✓' : 'Далее →';
}

// Расчёт воронки
function calculateFunnel() {
    const jtbd = answers.jtbd;
    const segment = answers.segment;
    const competition = answers.competition;
    const lpr = answers.lpr;

    // Логика определения воронки
    if (['A01', 'A02'].includes(jtbd) && lpr === 'yes') {
        return 'E-01';
    }

    if (competition === '10' && segment === 'S') {
        return 'C-02';
    }

    if (segment === 'P') {
        return 'C-03';
    }

    return 'C-01';
}

function calculateAndShowResults() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');

    const funnel = calculateFunnel();
    const jtbdCode = answers.jtbd;
    const jtbdName = SCRIPT_DATA.jtbd[jtbdCode]?.name || jtbdCode;
    const funnelName = SCRIPT_DATA.funnels[funnel];

    const message = `JTBD: ${jtbdName}\nВоронка: ${funnel} - ${funnelName}`;
    document.getElementById('result-message').textContent = message;

    let summaryHTML = '<h3>Ответы клиента:</h3>';
    questions.forEach(q => {
        const answer = answers[q.code];
        const option = q.options.find(o => o.value === answer);
        summaryHTML += `
            <div class="answer-item">
                <div class="answer-q">${q.title}</div>
                <div class="answer-a">${option ? option.label : 'Не отвечено'}</div>
            </div>`;
    });

    document.getElementById('answer-summary').innerHTML = summaryHTML;

    // Сохранение
    const result = {
        date: new Date().toLocaleString('ru-RU'),
        answers: answers,
        jtbd: jtbdCode,
        funnel: funnel
    };

    let history = JSON.parse(localStorage.getItem('qualificationHistory') || '[]');
    history.push(result);
    localStorage.setItem('qualificationHistory', JSON.stringify(history));
}

function restart() {
    currentQuestion = 0;
    answers = {};
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    showQuestion(currentQuestion);
    updateProgress();
    updateButtons();
}
