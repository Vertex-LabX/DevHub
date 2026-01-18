const API_PROJECTS = '/api/projects';
const API_CATEGORIES = '/api/categories';

const projectsContainer = document.getElementById('projects-container');
const categoryList = document.getElementById('category-list');
const searchInput = document.getElementById('search-input');
const tagCloudContainer = document.getElementById('tag-cloud');
const projectModal = document.getElementById('project-modal');
const closeModalBtn = document.querySelector('.close-modal');

let allProjects = [];
let currentLang = 'en';

const translations = {
    en: {
        categories: "Categories",
        all_projects: "All Projects",
        popular_tags: "Popular Tags",
        credits: "Credits",
        explore_title: "Explore Projects",
        explore_desc: "Discover the latest tools, libraries, and experiments.",
        search_placeholder: "Search projects...",
        loading: "Loading projects...",
        no_projects: "No projects found.",
        github: "GitHub",
        demo: "Demo",
        stars: "Stars",
        forks: "Forks"
    },
    ru: {
        categories: "Категории",
        all_projects: "Все проекты",
        popular_tags: "Популярные теги",
        credits: "Авторы",
        explore_title: "Каталог Проектов",
        explore_desc: "Откройте для себя новейшие инструменты, библиотеки и эксперименты.",
        search_placeholder: "Поиск проектов...",
        loading: "Загрузка проектов...",
        no_projects: "Проекты не найдены.",
        github: "GitHub",
        demo: "Демо",
        stars: "Звезды",
        forks: "Форки"
    }
};

const iconMap = {
    'React': 'devicon-react-original colored',
    'Node.js': 'devicon-nodejs-plain colored',
    'WebSockets': 'devicon-socketio-original',
    'D3.js': 'devicon-d3js-plain colored',
    'MongoDB': 'devicon-mongodb-plain colored',
    'Docker': 'devicon-docker-plain colored',
    'Python': 'devicon-python-plain colored',
    'Discord.py': 'devicon-python-plain',
    'TensorFlow': 'devicon-tensorflow-original colored',
    'Three.js': 'devicon-threejs-original',
    'WebGL': 'devicon-opengl-plain',
    'JavaScript': 'devicon-javascript-plain colored',
    'Express': 'devicon-express-original',
    'HTML': 'devicon-html5-plain colored',
    'CSS': 'devicon-css3-plain colored'
};

async function init() {
    await fetchCategories();
    await fetchProjects();

    searchInput.addEventListener('input', handleSearch);

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    window.addEventListener('click', (e) => {
        if (e.target == projectModal) closeModal();
    });

    const langEnBtn = document.getElementById('lang-en');
    const langRuBtn = document.getElementById('lang-ru');

    if (langEnBtn && langRuBtn) {
        langEnBtn.addEventListener('click', () => setLanguage('en'));
        langRuBtn.addEventListener('click', () => setLanguage('ru'));
    }
}

function setLanguage(lang) {
    currentLang = lang;

    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`lang-${lang}`).classList.add('active');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    if (searchInput) {
        searchInput.placeholder = translations[lang].search_placeholder;
    }

    const allProjectsLi = document.querySelector('li[data-category="All"]');
    if (allProjectsLi) {
        allProjectsLi.textContent = translations[lang].all_projects;
    }

    renderProjects(currentLang === 'en' ? allProjects : allProjects);
}

async function fetchCategories() {
    try {
        const response = await fetch(API_CATEGORIES);
        const categories = await response.json();
        renderCategories(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

async function fetchProjects(category = 'All') {
    projectsContainer.innerHTML = `<div class="loading">${translations[currentLang].loading}</div>`;
    try {
        const url = category === 'All' ? API_PROJECTS : `${API_PROJECTS}?category=${encodeURIComponent(category)}`;
        const response = await fetch(url);
        allProjects = await response.json();

        renderProjects(allProjects);
        updateTagCloud(allProjects);

        allProjects.forEach(fetchGitHubStats);
    } catch (error) {
        projectsContainer.innerHTML = `<div class="loading">Error loading projects: ${error.message}</div>`;
        console.error('Error fetching projects:', error);
    }
}

async function fetchGitHubStats(project) {
    if (!project.repo) return;
    try {
        const res = await fetch(`https://api.github.com/repos/${project.repo}`);
        if (!res.ok) return;
        const data = await res.json();

        const statsEl = document.getElementById(`stats-${project.id}`);
        if (statsEl) {
            statsEl.innerHTML = `
                <span title="${translations[currentLang].stars}"><i class="fa-solid fa-star" style="color:#e0af68"></i> ${data.stargazers_count}</span>
                <span title="${translations[currentLang].forks}"><i class="fa-solid fa-code-branch" style="color:#7aa2f7"></i> ${data.forks_count}</span>
            `;
        }
    } catch (err) {
        console.error(`Failed to fetch stats for ${project.repo}`, err);
    }
}

function renderCategories(categories) {
    categoryList.innerHTML = '';
    categories.forEach(cat => {
        const li = document.createElement('li');
        li.textContent = cat === 'All' ? translations[currentLang].all_projects : cat;
        li.dataset.category = cat;
        if (cat === 'All') li.classList.add('active');

        li.addEventListener('click', () => {
            document.querySelectorAll('.categories-nav li').forEach(el => el.classList.remove('active'));
            li.classList.add('active');

            document.querySelectorAll('.tag-cloud-item').forEach(el => el.classList.remove('active'));

            fetchProjects(cat);
        });

        categoryList.appendChild(li);
    });
}

function updateTagCloud(projects) {
    const tagCounts = {};
    projects.forEach(p => {
        p.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);

    tagCloudContainer.innerHTML = '';
    sortedTags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag-cloud-item';
        span.textContent = tag;
        span.addEventListener('click', () => {
            handleTagFilter(tag);
            document.querySelectorAll('.tag-cloud-item').forEach(el => el.classList.remove('active'));
            span.classList.add('active');
        });
        tagCloudContainer.appendChild(span);
    });
}

function handleTagFilter(tag) {
    const filtered = allProjects.filter(p => p.tags.includes(tag));
    renderProjects(filtered);
}

function renderProjects(projects) {
    projectsContainer.innerHTML = '';

    if (projects.length === 0) {
        projectsContainer.innerHTML = `<div class="loading">${translations[currentLang].no_projects}</div>`;
        return;
    }

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.onclick = (e) => {
            if (e.target.closest('a')) return;
            openModal(project);
        };
        card.style.cursor = 'pointer';

        const tagsHtml = project.tags.map(tag => {
            const iconClass = iconMap[tag];
            if (iconClass) {
                return `<i class="${iconClass} tech-icon" title="${tag}" style="font-size: 1.5rem; margin-right: 0.5rem; cursor: help;"></i>`;
            } else {
                return `<span class="tag">${tag}</span>`;
            }
        }).join('');

        card.innerHTML = `
            <div class="card-header">
                <h2 class="card-title">${project.title}</h2>
                <span class="card-category">${project.category}</span>
            </div>
            <p class="card-desc">${project.description}</p>
            <div class="card-tags" style="display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                ${tagsHtml}
            </div>
            
            <div id="stats-${project.id}" class="modal-stats" style="margin-bottom: 1rem; font-size: 0.8rem;"></div>
            
            <div class="card-links">
                ${project.links.github ? `<a href="${project.links.github}" target="_blank" class="btn btn-secondary"><i class="fa-brands fa-github"></i> ${translations[currentLang].github}</a>` : ''}
                ${project.links.demo ? `<a href="${project.links.demo}" target="_blank" class="btn btn-primary"><i class="fa-solid fa-rocket"></i> ${translations[currentLang].demo}</a>` : ''}
            </div>
        `;

        projectsContainer.appendChild(card);
    });
}

function openModal(project) {
    document.getElementById('modal-title').textContent = project.title;
    document.getElementById('modal-desc').textContent = project.description;

    const tagsContainer = document.getElementById('modal-tags');
    tagsContainer.innerHTML = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

    const linksContainer = document.getElementById('modal-links');
    linksContainer.innerHTML = `
        ${project.links.github ? `<a href="${project.links.github}" target="_blank" class="btn btn-secondary"><i class="fa-brands fa-github"></i> ${translations[currentLang].github}</a>` : ''}
        ${project.links.demo ? `<a href="${project.links.demo}" target="_blank" class="btn btn-primary"><i class="fa-solid fa-rocket"></i> ${translations[currentLang].demo}</a>` : ''}
    `;

    const statsSource = document.getElementById(`stats-${project.id}`);
    const statsDest = document.getElementById('modal-stats');
    if (statsSource) {
        statsDest.innerHTML = statsSource.innerHTML;
    }

    projectModal.style.display = 'block';
}

function closeModal() {
    projectModal.style.display = 'none';
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const filtered = allProjects.filter(project =>
        project.title.toLowerCase().includes(term) ||
        project.description.toLowerCase().includes(term) ||
        project.tags.some(tag => tag.toLowerCase().includes(term))
    );
    renderProjects(filtered);
}

document.addEventListener('DOMContentLoaded', init);
