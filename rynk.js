
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



