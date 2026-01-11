

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    updateDashboard();
}


let livres = JSON.parse(localStorage.getItem('livres')) || [];
let auteurs = JSON.parse(localStorage.getItem('auteurs')) || [];


const livreForm = document.getElementById('livreForm');
const auteurForm = document.getElementById('auteurForm');
const auteursList = document.getElementById('auteursList');


livreForm.addEventListener('submit', e => {
    e.preventDefault();
    const livre = {
        titre: document.getElementById('titre').value,
        auteur: document.getElementById('auteur').value,
        annee: document.getElementById('annee').value,
        image: document.getElementById('image').value
    };
    const index = document.getElementById('livreIndex').value;
    
    if (index === '') {
        livres.push(livre);
    } else {
        livres[index] = livre;
    }
    
    saveData();
    livreForm.reset();
    document.getElementById('livreIndex').value = '';
    afficherLivres();
    updateDashboard();
});

function afficherLivres() {
        const grid = document.getElementById('livresGrid');
        grid.innerHTML = '';
        livres.forEach((l, i) => {
                const col = document.createElement('div');
                col.className = 'col';

                const card = document.createElement('div');
                card.className = 'book-card card-animate';

                card.innerHTML = `
                    <div class="img-wrapper">
                        <img class="book-img" src="${l.image || 'https://via.placeholder.com/280x380?text=No+Cover'}" alt="${l.titre}"
                                 loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/280x380?text=No+Cover'" />
                    </div>
                    <div class="card-body">
                        <div class="card-title">${l.titre}</div>
                        <div class="card-author">${l.auteur} (${l.annee})</div>
                        <div class="d-flex justify-content-center">
                            <button class="btn btn-warning btn-sm me-2" onclick="editLivre(${i})">✏️</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteLivre(${i})">🗑️</button>
                        </div>
                    </div>
                `;

                col.appendChild(card);
                grid.appendChild(col);

            
                setTimeout(() => card.classList.add('visible'), i * 80);
        });
}

function editLivre(i) {
    document.getElementById('titre').value = livres[i].titre;
    document.getElementById('auteur').value = livres[i].auteur;
    document.getElementById('annee').value = livres[i].annee;
    document.getElementById('image').value = livres[i].image;
    document.getElementById('livreIndex').value = i;
    showSection('livres'); 
}

function deleteLivre(i) {
    if (confirm('Supprimer ce livre ?')) {
        livres.splice(i, 1);
        saveData();
        afficherLivres();
        updateDashboard();
    }
}


auteurForm.addEventListener('submit', e => {
    e.preventDefault();
    auteurs.push({
        nom: document.getElementById('nomAuteur').value,
        nat: document.getElementById('nationalite').value
    });
    saveData();
    auteurForm.reset();
    afficherAuteurs();
    updateDashboard();
});

function afficherAuteurs() {
    auteursList.innerHTML = '';
    auteurs.forEach((a, i) => {
        auteursList.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        ${a.nom} (${a.nat})
        <button class="btn btn-danger btn-sm" onclick="supprimerAuteur(${i})"><i class="fa fa-trash"></i></button>
      </li>`;
    });
}

function supprimerAuteur(i) {
    auteurs.splice(i, 1);
    saveData();
    afficherAuteurs();
    updateDashboard();
}


let chart;
function updateDashboard() {
    document.getElementById('kpiLivres').innerText = livres.length;
    document.getElementById('kpiAuteurs').innerText = auteurs.length;

    
    animateNumber(document.getElementById('kpiLivres'), livres.length);
    animateNumber(document.getElementById('kpiAuteurs'), auteurs.length);

    const data = {};
    livres.forEach(l => data[l.auteur] = (data[l.auteur] || 0) + 1);

    const ctx = document.getElementById('chartLivres');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Nombre de Livres',
                data: Object.values(data),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}


function animateNumber(el, target) {
    const duration = 600;
    const start = Number(el.dataset.value) || 0;
    const startTime = performance.now();

    function frame(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const value = Math.floor(start + (target - start) * progress);
        el.innerText = value;
        if (progress < 1) requestAnimationFrame(frame);
        else el.dataset.value = target;
    }
    requestAnimationFrame(frame);
}


function applyTheme(theme) {
    if (theme === 'dark') document.documentElement.classList.add('dark-theme');
    else document.documentElement.classList.remove('dark-theme');
}

window.addEventListener('load', () => {
    const stored = localStorage.getItem('theme') || 'light';
    applyTheme(stored);
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.innerHTML = stored === 'dark' ? '<i class="fa fa-sun"></i>' : '<i class="fa fa-moon"></i>';
        themeBtn.addEventListener('click', () => {
            const next = document.documentElement.classList.contains('dark-theme') ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem('theme', next);
            themeBtn.innerHTML = next === 'dark' ? '<i class="fa fa-sun"></i>' : '<i class="fa fa-moon"></i>';
        });
    }
});


function importerLivreOpenLibrary() {
    const q = prompt('Entrer le titre du livre :');
    if (!q) return;

    fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(data => {
            if (data.docs && data.docs.length > 0) {
                const b = data.docs[0];
                const auteurNom = b.author_name ? b.author_name[0] : 'Inconnu';

                if (!auteurs.some(a => a.nom === auteurNom)) {
                    auteurs.push({ nom: auteurNom, nat: '---' });
                    afficherAuteurs();
                }

                
                livres.push({
                    titre: b.title,
                    auteur: auteurNom,
                    annee: b.first_publish_year || '---',
                    image: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg` : 'https://via.placeholder.com/250x350'
                });

                saveData();
                afficherLivres();
                updateDashboard();
                alert('Livre importé avec succès !');
            } else {
                alert('Aucun livre trouvé.');
            }
        })
        .catch(() => alert('Erreur lors de la connexion à OpenLibrary'));
}


function saveData() {
    localStorage.setItem('livres', JSON.stringify(livres));
    localStorage.setItem('auteurs', JSON.stringify(auteurs));
}


window.onload = () => {
    afficherLivres();
    afficherAuteurs();
    updateDashboard();

 
    showSection('dashboard');
    const firstLink = document.querySelector('.sidebar a');
    if (firstLink) firstLink.classList.add('active');


    document.querySelectorAll('.sidebar a').forEach(a => {
        a.addEventListener('click', () => {
            document.querySelectorAll('.sidebar a').forEach(x => x.classList.remove('active'));
            a.classList.add('active');
            const sb = document.getElementById('sidebar');
            if (window.innerWidth < 768 && sb) sb.classList.add('collapsed');
        });
    });

    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const sb = document.getElementById('sidebar');
            if (sb) sb.classList.toggle('collapsed');
        });
    }


    document.addEventListener('click', (e) => {
        const sb = document.getElementById('sidebar');
        const toggle = document.getElementById('menuToggle');
        if (!sb || !toggle) return;
        if (window.innerWidth >= 768) return;
        if (!sb.contains(e.target) && !toggle.contains(e.target)) sb.classList.add('collapsed');
    });
};




