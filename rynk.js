// Variables globales
let livres = JSON.parse(localStorage.getItem('livres')) || [];
let auteurs = JSON.parse(localStorage.getItem('auteurs')) || [];
let chart;
let critereTri = '';
let ordreTri = 'asc';
let rechercheEnCours = '';
let rechercheAuteurs = '';

// DOM Elements
const livreForm = document.getElementById('livreForm');
const auteurForm = document.getElementById('auteurForm');
const auteursList = document.getElementById('auteursList');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// Fonction pour afficher une section
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    updateDashboard();
    hideSearchResults();
}

// Gestion des livres
livreForm.addEventListener('submit', e => {
    e.preventDefault();
    const livre = {
        titre: document.getElementById('titre').value,
        auteur: document.getElementById('auteur').value,
        annee: document.getElementById('annee').value,
        image: document.getElementById('image').value,
        description: document.getElementById('description').value || '',
        isbn: document.getElementById('isbn').value || '',
        dateAjout: new Date().toLocaleDateString('fr-FR')
    };
    const index = document.getElementById('livreIndex').value;
    
    if (index === '') {
        livres.push(livre);
        showNotification('Livre ajouté avec succès !', 'success');
    } else {
        livres[index] = livre;
        showNotification('Livre modifié avec succès !', 'success');
    }
    
    saveData();
    livreForm.reset();
    document.getElementById('livreIndex').value = '';
    afficherLivres();
    updateDashboard();
});


// Fonction pour afficher les livres avec tri
function afficherLivres() {
    const grid = document.getElementById('livresGrid');
    grid.innerHTML = '';
    
    let livresAffiches = [...livres];
    
    // Appliquer la recherche
    if (rechercheEnCours) {
        const terme = rechercheEnCours.toLowerCase();
        livresAffiches = livresAffiches.filter(livre => 
            livre.titre.toLowerCase().includes(terme) ||
            livre.auteur.toLowerCase().includes(terme) ||
            livre.annee.toString().includes(terme) ||
            (livre.description && livre.description.toLowerCase().includes(terme))
        );
    }
    
    // Appliquer le tri
    if (critereTri) {
        const [critere, ordre] = critereTri.split('_');
        livresAffiches.sort((a, b) => {
            let valeurA, valeurB;
            
            switch(critere) {
                case 'titre':
                    valeurA = a.titre.toLowerCase();
                    valeurB = b.titre.toLowerCase();
                    break;
                case 'annee':
                    valeurA = parseInt(a.annee) || 0;
                    valeurB = parseInt(b.annee) || 0;
                    break;
                case 'auteur':
                    valeurA = a.auteur.toLowerCase();
                    valeurB = b.auteur.toLowerCase();
                    break;
                default:
                    return 0;
            }
            
            if (ordre === 'asc') {
                return valeurA < valeurB ? -1 : valeurA > valeurB ? 1 : 0;
            } else {
                return valeurA > valeurB ? -1 : valeurA < valeurB ? 1 : 0;
            }
        });
    }
    
    // Afficher le nombre de résultats
    if (rechercheEnCours || critereTri) {
        const countDiv = document.createElement('div');
        countDiv.className = 'col-12 mb-3';
        countDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                ${livresAffiches.length} livre${livresAffiches.length !== 1 ? 's' : ''} trouvé${livresAffiches.length !== 1 ? 's' : ''}
                ${rechercheEnCours ? ` pour "${rechercheEnCours}"` : ''}
                ${critereTri ? ` (trié)` : ''}
            </div>
        `;
        grid.appendChild(countDiv);
    }
    
    // Afficher les livres
    livresAffiches.forEach((l, i) => {
        const indexOriginal = livres.findIndex(livre => 
            livre.titre === l.titre && 
            livre.auteur === l.auteur && 
            livre.annee === l.annee
        );
        
        const col = document.createElement('div');
        col.className = 'col';

        const card = document.createElement('div');
        card.className = 'book-card card-animate';

        card.innerHTML = `
            <div class="img-wrapper">
                <img class="book-img" src="${l.image || 'https://via.placeholder.com/280x380?text=No+Cover'}" 
                     alt="${l.titre}" loading="lazy"
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/280x380?text=No+Cover'">
            </div>
            <div class="card-body">
                <div class="card-title">${l.titre}</div>
                <div class="card-author">${l.auteur} (${l.annee})</div>
                <div class="d-flex justify-content-center">
                    <button class="btn btn-info btn-sm me-2" onclick="showLivreDetail(${indexOriginal})" title="Voir les détails">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-warning btn-sm me-2" onclick="editLivre(${indexOriginal})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteLivre(${indexOriginal})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        col.appendChild(card);
        grid.appendChild(col);

        setTimeout(() => card.classList.add('visible'), i * 80);
    });
    
    // Si aucun livre
    if (livresAffiches.length === 0 && livres.length > 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h4 class="text-muted">Aucun livre trouvé</h4>
                ${rechercheEnCours ? `
                    <p class="text-muted">Aucun résultat pour "${rechercheEnCours}"</p>
                    <button class="btn btn-outline-primary" onclick="rechercherLivres('')">
                        <i class="fas fa-times me-2"></i>Effacer la recherche
                    </button>
                ` : ''}
            </div>
        `;
    }
}

// Fonction pour voir les détails d'un livre
function showLivreDetail(index) {
    const livre = livres[index];
    const modal = new bootstrap.Modal(document.getElementById('livreDetailModal'));
    
    document.getElementById('livreDetailContent').innerHTML = `
        <div class="row">
            <div class="col-md-4">
                <img src="${livre.image || 'https://via.placeholder.com/400x500?text=No+Cover'}" 
                     class="img-fluid rounded mb-3"
                     alt="${livre.titre}"
                     onerror="this.src='https://via.placeholder.com/400x500?text=No+Cover'">
            </div>
            <div class="col-md-8">
                <h4 class="mb-3">${livre.titre}</h4>
                <p><strong>Auteur:</strong> ${livre.auteur}</p>
                <p><strong>Année:</strong> ${livre.annee}</p>
                ${livre.isbn ? `<p><strong>ISBN:</strong> ${livre.isbn}</p>` : ''}
                ${livre.description ? `<p><strong>Description:</strong><br>${livre.description}</p>` : ''}
                <p><strong>Date d'ajout:</strong> ${livre.dateAjout}</p>
            </div>
        </div>
    `;
    
    modal.show();
}

function editLivre(i) {
    const livre = livres[i];
    document.getElementById('titre').value = livre.titre;
    document.getElementById('auteur').value = livre.auteur;
    document.getElementById('annee').value = livre.annee;
    document.getElementById('image').value = livre.image;
    document.getElementById('description').value = livre.description || '';
    document.getElementById('isbn').value = livre.isbn || '';
    document.getElementById('livreIndex').value = i;
    showSection('livres');
}

function deleteLivre(i) {
    if (confirm('Supprimer ce livre ?')) {
        livres.splice(i, 1);
        saveData();
        afficherLivres();
        updateDashboard();
        showNotification('Livre supprimé', 'warning');
    }
}

// Tri des livres
function trierLivres(valeur) {
    critereTri = valeur;
    afficherLivres();
    
    if (valeur) {
        showNotification('Tri appliqué', 'info');
    }
}

// Recherche dans les livres
function rechercherLivres(terme) {
    rechercheEnCours = terme;
    afficherLivres();
}

// Gestion des auteurs
auteurForm.addEventListener('submit', e => {
    e.preventDefault();
    const auteur = {
        nom: document.getElementById('nomAuteur').value,
        nat: document.getElementById('nationalite').value
    };
    const index = document.getElementById('auteurIndex').value;
    
    if (index === '') {
        // Ajout
        auteurs.push(auteur);
        showNotification('Auteur ajouté avec succès !', 'success');
    } else {
        // Modification
        const ancienNom = auteurs[index].nom;
        auteurs[index] = auteur;
        
        // Mettre à jour les livres si le nom a changé
        if (ancienNom !== auteur.nom) {
            livres.forEach(livre => {
                if (livre.auteur === ancienNom) {
                    livre.auteur = auteur.nom;
                }
            });
            saveData();
            afficherLivres();
        }
        
        showNotification('Auteur modifié avec succès !', 'success');
    }
    
    saveData();
    resetAuteurForm();
    afficherAuteurs();
    updateDashboard();
});

function afficherAuteurs() {
    const container = document.getElementById('auteursListContainer');
    let auteursAffiches = [...auteurs];
    
    // Appliquer la recherche
    if (rechercheAuteurs) {
        const terme = rechercheAuteurs.toLowerCase();
        auteursAffiches = auteursAffiches.filter(auteur => 
            auteur.nom.toLowerCase().includes(terme) ||
            auteur.nat.toLowerCase().includes(terme)
        );
    }
    
    // Afficher dans un tableau pour plus de clarté
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Nationalité</th>
                        <th>Livres</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (auteursAffiches.length === 0) {
        html += `
            <tr>
                <td colspan="4" class="text-center py-4">
                    ${rechercheAuteurs ? 
                        `Aucun auteur trouvé pour "${rechercheAuteurs}"` : 
                        'Aucun auteur enregistré'}
                </td>
            </tr>
        `;
    } else {
        auteursAffiches.forEach((a, i) => {
            const indexOriginal = auteurs.findIndex(auteur => 
                auteur.nom === a.nom && auteur.nat === a.nat
            );
            const nbLivres = livres.filter(l => l.auteur === a.nom).length;
            
            html += `
                <tr>
                    <td>${a.nom}</td>
                    <td><span class="badge bg-secondary">${a.nat}</span></td>
                    <td>
                        <span class="badge ${nbLivres > 0 ? 'bg-primary' : 'bg-light text-dark'}">
                            ${nbLivres} livre${nbLivres !== 1 ? 's' : ''}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-warning btn-sm me-2" onclick="editAuteur(${indexOriginal})" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="supprimerAuteur(${indexOriginal})" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function editAuteur(i) {
    const auteur = auteurs[i];
    document.getElementById('nomAuteur').value = auteur.nom;
    document.getElementById('nationalite').value = auteur.nat;
    document.getElementById('auteurIndex').value = i;
    
    // Changer le bouton
    document.getElementById('submitAuteurBtn').innerHTML = '<i class="fas fa-save me-2"></i>Modifier';
    document.getElementById('cancelEditAuteur').style.display = 'block';
    document.getElementById('submitAuteurBtn').classList.remove('btn-primary');
    document.getElementById('submitAuteurBtn').classList.add('btn-success');
    
    showNotification('Mode édition activé', 'info');
}

function annulerEditionAuteur() {
    resetAuteurForm();
    showNotification('Édition annulée', 'info');
}

function resetAuteurForm() {
    auteurForm.reset();
    document.getElementById('auteurIndex').value = '';
    document.getElementById('submitAuteurBtn').innerHTML = '<i class="fa fa-plus me-2"></i>Ajouter';
    document.getElementById('cancelEditAuteur').style.display = 'none';
    document.getElementById('submitAuteurBtn').classList.remove('btn-success');
    document.getElementById('submitAuteurBtn').classList.add('btn-primary');
}

function supprimerAuteur(i) {
    const auteur = auteurs[i];
    const livresAuteur = livres.filter(l => l.auteur === auteur.nom);
    
    let message = `Êtes-vous sûr de vouloir supprimer l'auteur "${auteur.nom}" ?`;
    
    if (livresAuteur.length > 0) {
        message += `\n\nAttention : ${livresAuteur.length} livre(s) sont associés à cet auteur.\nCes livres seront conservés mais l'auteur sera retiré de la liste.`;
    }
    
    if (confirm(message)) {
        auteurs.splice(i, 1);
        
        // Mettre à jour les livres pour cet auteur
        livres.forEach(livre => {
            if (livre.auteur === auteur.nom) {
                livre.auteur = "Auteur inconnu";
            }
        });
        
        saveData();
        resetAuteurForm();
        afficherAuteurs();
        afficherLivres();
        updateDashboard();
        showNotification(`Auteur "${auteur.nom}" supprimé`, 'warning');
    }
}

// Recherche dans les auteurs
function rechercherAuteurs(terme) {
    rechercheAuteurs = terme;
    afficherAuteurs();
}

function reinitialiserRechercheAuteurs() {
    rechercheAuteurs = '';
    document.getElementById('searchAuteurs').value = '';
    afficherAuteurs();
}

// Dashboard
function updateDashboard() {
    // Mettre à jour les KPI
    document.getElementById('kpiLivres').innerText = livres.length;
    document.getElementById('kpiAuteurs').innerText = auteurs.length;
    
    // Dernier livre ajouté
    const lastAdded = document.getElementById('lastAdded');
    if (livres.length > 0) {
        const dernierLivre = livres[livres.length - 1];
        lastAdded.textContent = dernierLivre.titre.length > 20 ? 
            dernierLivre.titre.substring(0, 20) + '...' : 
            dernierLivre.titre;
    } else {
        lastAdded.textContent = 'Aucun';
    }
    
    // Animation des nombres
    animateNumber(document.getElementById('kpiLivres'), livres.length);
    animateNumber(document.getElementById('kpiAuteurs'), auteurs.length);
    
    // Statistiques par auteur pour le graphique
    const data = {};
    livres.forEach(l => {
        data[l.auteur] = (data[l.auteur] || 0) + 1;
    });
    
    // Trier par nombre de livres (décroissant)
    const sortedAuthors = Object.entries(data)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    const ctx = document.getElementById('chartLivres');
    if (chart) chart.destroy();
    
    if (sortedAuthors.length > 0) {
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedAuthors.map(([author]) => author),
                datasets: [{
                    label: 'Nombre de Livres',
                    data: sortedAuthors.map(([,count]) => count),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: { 
                    y: { 
                        beginAtZero: true, 
                        ticks: { stepSize: 1 } 
                    } 
                }
            }
        });
    }
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

// Gestion du thème
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark-theme');
    } else {
        document.documentElement.classList.remove('dark-theme');
    }
}

// Recherche globale
function rechercherGlobale(query) {
    if (!query.trim()) {
        hideSearchResults();
        return;
    }
    
    const results = [];
    const terme = query.toLowerCase();
    
    // Rechercher dans les livres
    livres.forEach((livre, index) => {
        if (livre.titre.toLowerCase().includes(terme) || 
            livre.auteur.toLowerCase().includes(terme) ||
            livre.annee.toString().includes(terme)) {
            results.push({
                type: 'livre',
                data: livre,
                index: index
            });
        }
    });
    
    // Rechercher dans les auteurs
    auteurs.forEach((auteur, index) => {
        if (auteur.nom.toLowerCase().includes(terme) || 
            auteur.nat.toLowerCase().includes(terme)) {
            results.push({
                type: 'auteur',
                data: auteur,
                index: index
            });
        }
    });
    
    displaySearchResults(results);
}

function displaySearchResults(results) {
    if (!results.length) {
        searchResults.innerHTML = '<div class="search-result-item">Aucun résultat</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    searchResults.innerHTML = '';
    results.slice(0, 8).forEach(result => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        
        if (result.type === 'livre') {
            div.innerHTML = `
                <div>
                    <div class="search-result-title">
                        <i class="fas fa-book me-2"></i>${result.data.titre}
                    </div>
                    <div class="search-result-author">${result.data.auteur} • ${result.data.annee}</div>
                </div>
            `;
            div.onclick = () => {
                showLivreDetail(result.index);
                hideSearchResults();
                searchInput.value = '';
            };
        } else {
            const nbLivres = livres.filter(l => l.auteur === result.data.nom).length;
            div.innerHTML = `
                <div>
                    <div class="search-result-title">
                        <i class="fas fa-user me-2"></i>${result.data.nom}
                    </div>
                    <div class="search-result-author">${result.data.nat} • ${nbLivres} livre${nbLivres !== 1 ? 's' : ''}</div>
                </div>
            `;
            div.onclick = () => {
                rechercherLivres(result.data.nom);
                showSection('livres');
                hideSearchResults();
                searchInput.value = '';
            };
        }
        
        searchResults.appendChild(div);
    });
    
    searchResults.style.display = 'block';
}

function hideSearchResults() {
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

// Importation OpenLibrary améliorée
function importerLivreOpenLibrary() {
    const q = prompt('Entrer le titre du livre :');
    if (!q) return;

    fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5`)
        .then(res => res.json())
        .then(data => {
            if (data.docs && data.docs.length > 0) {
                let choix = "Plusieurs livres trouvés :\n\n";
                data.docs.slice(0, 5).forEach((doc, idx) => {
                    const auteur = doc.author_name ? doc.author_name[0] : 'Auteur inconnu';
                    const annee = doc.first_publish_year || 'Année inconnue';
                    choix += `${idx + 1}. ${doc.title} - ${auteur} (${annee})\n`;
                });
                choix += "\nEntrez le numéro du livre à importer (1-5) :";
                
                const selection = prompt(choix);
                if (!selection || selection === '0') return;
                
                const idx = parseInt(selection) - 1;
                if (isNaN(idx) || idx < 0 || idx >= Math.min(5, data.docs.length)) {
                    alert('Sélection invalide');
                    return;
                }
                
                const b = data.docs[idx];
                const auteurNom = b.author_name ? b.author_name[0] : 'Auteur inconnu';

                if (!auteurs.some(a => a.nom === auteurNom)) {
                    auteurs.push({ 
                        nom: auteurNom, 
                        nat: b.author_nationality ? b.author_nationality[0] || '---' : '---' 
                    });
                }

                livres.push({
                    titre: b.title,
                    auteur: auteurNom,
                    annee: b.first_publish_year || '---',
                    image: b.cover_i ? `https://covers.openlibrary.org/b/id/${b.cover_i}-L.jpg` : 
                           'https://via.placeholder.com/400x500?text=Couverture+non+disponible',
                    description: b.description ? 
                        (typeof b.description === 'string' ? b.description : 
                         b.description.value || '') : '',
                    isbn: b.isbn ? b.isbn[0] : '',
                    dateAjout: new Date().toLocaleDateString('fr-FR')
                });

                saveData();
                afficherLivres();
                afficherAuteurs();
                updateDashboard();
                alert('Livre importé avec succès !');
            } else {
                alert('Aucun livre trouvé.');
            }
        })
        .catch(() => alert('Erreur lors de la connexion à OpenLibrary'));
}

// Fonction de notification
function showNotification(message, type = 'info') {
    // Créer un toast simple
    const toast = document.createElement('div');
    toast.className = `position-fixed top-0 end-0 p-3`;
    toast.style.zIndex = '9999';
    
    toast.innerHTML = `
        <div class="toast show" role="alert">
            <div class="toast-header bg-${type} text-white">
                <strong class="me-auto">Notification</strong>
                <button type="button" class="btn-close btn-close-white" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}

// Sauvegarde des données
function saveData() {
    localStorage.setItem('livres', JSON.stringify(livres));
    localStorage.setItem('auteurs', JSON.stringify(auteurs));
}

// Initialisation
window.onload = () => {
    afficherLivres();
    afficherAuteurs();
    updateDashboard();

    showSection('dashboard');
    const firstLink = document.querySelector('.sidebar a');
    if (firstLink) firstLink.classList.add('active');

    // Gestion du thème
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

    // Menu mobile
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            const sb = document.getElementById('sidebar');
            if (sb) sb.classList.toggle('collapsed');
        });
    }

    // Navigation sidebar
    document.querySelectorAll('.sidebar a').forEach(a => {
        a.addEventListener('click', () => {
            document.querySelectorAll('.sidebar a').forEach(x => x.classList.remove('active'));
            a.classList.add('active');
            
            // Fermer le sidebar sur mobile
            const sb = document.getElementById('sidebar');
            if (window.innerWidth < 768 && sb) {
                sb.classList.add('collapsed');
            }
        });
    });

    // Fermer le sidebar en cliquant à l'extérieur (mobile)
    document.addEventListener('click', (e) => {
        const sb = document.getElementById('sidebar');
        const toggle = document.getElementById('menuToggle');
        if (!sb || !toggle) return;
        if (window.innerWidth >= 768) return;
        if (!sb.contains(e.target) && !toggle.contains(e.target)) {
            sb.classList.add('collapsed');
        }
    });
    
    // Fermer les résultats de recherche en cliquant ailleurs
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.position-relative') && !e.target.closest('#searchResults')) {
            hideSearchResults();
        }
    });
    
    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideSearchResults();
        }
    });
};

// Exporter les fonctions pour les boutons HTML
window.showSection = showSection;
window.editLivre = editLivre;
window.deleteLivre = deleteLivre;
window.supprimerAuteur = supprimerAuteur;
window.importerLivreOpenLibrary = importerLivreOpenLibrary;
window.trierLivres = trierLivres;
window.rechercherLivres = rechercherLivres;
window.rechercherAuteurs = rechercherAuteurs;
window.reinitialiserRechercheAuteurs = reinitialiserRechercheAuteurs;
window.annulerEditionAuteur = annulerEditionAuteur;
window.showLivreDetail = showLivreDetail;
window.editAuteur = editAuteur;




