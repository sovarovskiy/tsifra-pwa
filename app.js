// Массив вопросов для квалификации
const questions = [
    {
        id: 1,
        title: 'Потребность клиента',
        text: 'Есть ли у клиента задача по охране (ОГЗ) или пожарной сигнализации (ПС)?',
        options: ['Да, подтверждена', 'Есть, но не очевидна', 'Нет задачи']
    },
    {
        id: 2,
        title: 'Тип объекта',
        text: 'Какой тип объекта у клиента?',
        options: ['ТК (торговый комплекс)', 'Логистика', 'Промышленность', 'ЖК (жилой комплекс)', 'Офис', 'Другое']
    },
    {
        id: 3,
        title: 'Регион объекта',
        text: 'Где находится объект клиента?',
        options: ['Москва', 'МО (Московская область)', 'Регионы']
    },
    {
        id: 4,
        title: 'Предписание МЧС',
        text: 'Есть ли у клиента требования или предписание от МЧС?',
        options: ['Да', 'Нет', 'Не знаю']
    },
    {
        id: 5,
        title: 'Роль контакта',
        text: 'Кто на линии связи?',
        options: ['ЛПР (лицо принимающее решение)', 'ЛВР (лицо влияющее на решение)', 'ЛИР (лицо исполняющее решение)']
    },
    {
        id: 6,
        title: 'Источник финансирования',
        text: 'Какой источник финансирования у клиента?',
        options: ['Свои средства', 'Кредит/аренда', 'Госконтракт']
    },
    {
        id: 7,
        title: 'Стадия проекта',
        text: 'На какой стадии находится проект клиента?',
        options: ['Проект', 'Стройка', 'Эксплуатация']
    },
    {
        id: 8,
        title: 'Сколько прием решения',
        text: 'Когда клиент примет решение о сотрудничестве?',
        options: ['Сделать 1 месяц', '1-3 месяца', 'Более 3 месяцев', 'Не знаю']
    },
    {
        id: 9,
        title: 'Бюджет',
        text: 'Какой примерный бюджет проекта?',
        options: ['Более 5 млн', '1-5 млн', 'Менее 1 млн', 'Нет товара']
    },
    {
        id: 10,
        title: 'Конкуренция',
        text: 'Есть ли другие предложения у клиента?',
        options: ['Нет', 'Да, 1-2', 'Да, около 2+', 'Тендер']
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
            <div class="options">`;
    
    question.options.forEach((option, i) => {
        const isSelected = answers[question.id] === option ? 'selected' : '';
        html += `<button class="option-btn ${isSelected}" onclick="selectAnswer(${question.id}, '${option.replace(/'/g, "\\'")}')
                    ">${option}</button>`;
    });
    
    html += `</div></div>`;
    container.innerHTML = html;
}

// Выбор ответа
function selectAnswer(questionId, answer) {
    answers[questionId] = answer;
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
        showResults();
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

// Показать результаты
function showResults() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    
    const answeredCount = Object.keys(answers).length;
    const message = `Вы ответили на ${answeredCount} из ${questions.length} вопросов`;
    document.getElementById('result-message').textContent = message;
    
    // Формирование списка ответов
    let summaryHTML = '';
    questions.forEach(q => {
        const answer = answers[q.id] || 'Не отвечено';
        summaryHTML += `
            <div class="answer-item">
                <div class="answer-q">${q.title}</div>
                <div class="answer-a">${answer}</div>
            </div>`;
    });
    document.getElementById('answer-summary').innerHTML = summaryHTML;
    
    // Сохранение в localStorage
    const result = {
        date: new Date().toLocaleString('ru-RU'),
        answers: answers,
        score: answeredCount
    };
    
    let history = JSON.parse(localStorage.getItem('qualificationHistory') || '[]');
    history.push(result);
    localStorage.setItem('qualificationHistory', JSON.stringify(history));
}

// Начать заново
function restart() {
    currentQuestion = 0;
    answers = {};
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    showQuestion(currentQuestion);
    updateProgress();
    updateButtons();
}
