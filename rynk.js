
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
        grid.innerHTML += `
      <div class="col">
        <div class="book-card">
          <img src="${l.image}" alt="${l.titre}">
          <div class="card-body">
            <div class="card-title">${l.titre}</div>
            <div class="card-author">${l.auteur} (${l.annee})</div>
            <button class="btn btn-warning btn-sm" onclick="editLivre(${i})">✏️</button>
            <button class="btn btn-danger btn-sm" onclick="deleteLivre(${i})">🗑️</button>
          </div>
        </div>
      </div>
    `;
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

