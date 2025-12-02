
document.addEventListener('DOMContentLoaded', () => {

    // --- CONSTANTES ET ÉTAT ---
    const [personM, personG] = ["Mathilde", "Gaylord"];
    const defaultPrizesM = ["Un resto en amoureux", "Un weekend surprise", "Un pull tout doux", "Un jeu vidéo tant attendendu", "Un accessoire pour son hobby", "Un bon pour un massage", "Une soirée sans les enfants", "Un objet collector", "Le droit de choisir tous les films pendant 1 mois", "Un vêtement de sport", "Une BD dédicacée", "Un petit déjeuner au lit"];
    const defaultPrizesG = ["Un bouquet de ses fleurs préférées", "Un bijou fin et élégant", "Une journée shopping illimitée", "Un soin en institut", "Un livre d'un auteur qu'elle adore", "Une place de concert", "Un sac à main de créateur", "Une série de cours (poterie, dessin...)", "Le petit-déjeuner au lit pendant une semaine", "Un parfum de luxe", "Une séance photo professionnelle", "Un pyjama en soie"];

    let finalAssignments = []; // Pour stocker les lots finaux une fois générés

    // --- ÉLÉMENTS DU DOM ---
    const views = {
        userSelection: document.getElementById('user-selection-view'),
        config: document.getElementById('config-view'),
        calendar: document.getElementById('calendar-view'),
        recap: document.getElementById('recap-view'),
    };
    const userButtons = document.querySelectorAll('.user-button');
    const statusM = document.getElementById('status-Mathilde');
    const statusG = document.getElementById('status-Gaylord');
    const generateFinalContainer = document.getElementById('generate-final-container');
    const generateFinalBtn = document.getElementById('generate-final-btn');
    const configTitle = document.getElementById('config-title');
    const configForm = document.getElementById('config-form');
    const savePrizesBtn = document.getElementById('save-prizes-btn');
    const backToSelectionBtn = document.getElementById('back-to-selection-btn');
    const shareLinkInput = document.getElementById('share-link-input');
    const calendarGrid = document.getElementById('calendar-grid');
    const modalsContainer = document.getElementById('modals-container');
    const recapButtonContainer = document.getElementById('recap-button-container');
    const showRecapBtn = document.getElementById('show-recap-btn');
    const backToCalendarBtn = document.getElementById('back-to-calendar-btn');
    const recapList = document.getElementById('recap-list');
    const resetAppBtn = document.getElementById('reset-app-btn');

    // --- ROUTEUR SIMPLE ---
    function navigateTo(viewName) {
        Object.values(views).forEach(view => view.classList.add('hidden'));
        if (views[viewName]) {
            views[viewName].classList.remove('hidden');
        }
    }

    // --- LOGIQUE DE L'APPLICATION ---

    function init() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#finalData=')) {
            const finalData = hash.substring('#finalData='.length);
            try {
                const prizes = JSON.parse(decodeURIComponent(atob(finalData)));
                finalAssignments = generateAssignments(prizes);
                renderCalendar();
                navigateTo('calendar');
            } catch (e) {
                console.error("Impossible de lire les données du calendrier final depuis le hash.", e);
                navigateTo('userSelection');
                updateUserSelectionScreen();
            }
        } else {
            navigateTo('userSelection');
            updateUserSelectionScreen();
        }

        userButtons.forEach(btn => btn.addEventListener('click', () => showConfigView(btn.dataset.user)));
        backToSelectionBtn.addEventListener('click', () => {
            navigateTo('userSelection');
            updateUserSelectionScreen();
        });
        generateFinalBtn.addEventListener('click', handleFinalGeneration);
        showRecapBtn.addEventListener('click', showRecapView);
        backToCalendarBtn.addEventListener('click', () => navigateTo('calendar'));
        resetAppBtn.addEventListener('click', resetApp);
    }

    function updateUserSelectionScreen() {
        const prizesM = JSON.parse(localStorage.getItem(`prizes_${personM}`));
        const prizesG = JSON.parse(localStorage.getItem(`prizes_${personG}`));

        statusM.textContent = prizesM && prizesM.length === 12 ? '✅' : '✏️';
        statusG.textContent = prizesG && prizesG.length === 12 ? '✅' : '✏️';

        if (prizesM && prizesM.length === 12 && prizesG && prizesG.length === 12) {
            generateFinalContainer.classList.remove('hidden');
        } else {
            generateFinalContainer.classList.add('hidden');
        }
    }

    function showConfigView(user) {
        navigateTo('config');
        configTitle.textContent = `Lots de ${user}`;
        configForm.innerHTML = '';
        
        const defaults = user === personM ? defaultPrizesM : defaultPrizesG;
        const savedPrizes = JSON.parse(localStorage.getItem(`prizes_${user}`)) || [];

        for (let i = 0; i < 12; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'prize-input';
            input.placeholder = `Lot n°${i + 1}`;
            input.value = savedPrizes[i] || defaults[i] || '';
            configForm.appendChild(input);
        }

        savePrizesBtn.onclick = () => {
            const prizes = Array.from(configForm.querySelectorAll('input')).map(input => input.value.trim());
            if (prizes.some(p => p === '')) {
                alert("Veuillez remplir les 12 lots.");
                return;
            }
            localStorage.setItem(`prizes_${user}`, JSON.stringify(prizes));
            navigateTo('userSelection');
            updateUserSelectionScreen();
        };
    }

    function handleFinalGeneration() {
        const prizesM = JSON.parse(localStorage.getItem(`prizes_${personM}`));
        const prizesG = JSON.parse(localStorage.getItem(`prizes_${personG}`));
        
        const prizesObject = { fromM: prizesM, fromG: prizesG };
        finalAssignments = generateAssignments(prizesObject);

        const encodedData = btoa(encodeURIComponent(JSON.stringify(prizesObject)));
        const baseUrl = window.location.href.split('#')[0];
        const shareableUrl = `${baseUrl}#finalData=${encodedData}`;
        
        window.location.hash = `finalData=${encodedData}`;
        shareLinkInput.value = shareableUrl;
        
        renderCalendar();
        navigateTo('calendar');
    }

    function generateAssignments(prizesObject) {
        let deckM = prizesObject.fromG.map(p => ({ prize: p, from: personG, to: personM }));
        let deckG = prizesObject.fromM.map(p => ({ prize: p, from: personM, to: personG }));

        deckM.sort(() => 0.5 - Math.random());
        deckG.sort(() => 0.5 - Math.random());

        const finalAssignments = [];
        let lastWinner = null;
        let streak = 0;

        for (let i = 0; i < 24; i++) {
            let availableDecks = [];
            
            if (streak === 2 && lastWinner === personM) {
                if (deckG.length > 0) availableDecks.push(deckG);
            } else if (streak === 2 && lastWinner === personG) {
                if (deckM.length > 0) availableDecks.push(deckM);
            }

            if (availableDecks.length === 0) {
                if (deckM.length > 0) availableDecks.push(deckM);
                if (deckG.length > 0) availableDecks.push(deckG);
            }
            
            const chosenDeck = availableDecks[Math.floor(Math.random() * availableDecks.length)];
            const assignment = chosenDeck.pop();
            
            finalAssignments.push(assignment);

            if (assignment.to === lastWinner) {
                streak++;
            } else {
                lastWinner = assignment.to;
                streak = 1;
            }
        }
        
        return finalAssignments.map((assignment, index) => ({ ...assignment, day: index + 1 }));
    }

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        modalsContainer.innerHTML = '';
        const openedDays = JSON.parse(localStorage.getItem('opened_days')) || [];

        finalAssignments.forEach(assignment => {
            const day = assignment.day;
            const isOpened = openedDays.includes(day);

            const card = document.createElement('div');
            card.className = `day-card ${Math.random() < 0.5 ? 'red' : 'green'} ${isOpened ? 'opened' : ''}`;
            card.dataset.day = day;
            card.innerHTML = `<span>${day}</span>`;
            // Ajout du délai pour l'animation d'entrée
            card.style.animationDelay = `${(day - 1) * 0.05}s`;
            
            // On attache toujours l'événement, même si la carte est déjà ouverte
            card.addEventListener('click', () => openDay(day));
            
            calendarGrid.appendChild(card);

            const modal = document.createElement('div');
            modal.id = `modal-${day}`;
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-button" data-day="${day}">&times;</span>
                    <h2>🎉 Bravo ${assignment.to} ! 🎉</h2>
                    <p>Un cadeau de la part de ${assignment.from} :</p>
                    <p><strong>${assignment.prize}</strong></p>
                </div>`;
            modalsContainer.appendChild(modal);
        });

        document.querySelectorAll('.close-button').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.day)));
        updateRecapButton();
    }
    
    function openDay(day) {
        const modal = document.getElementById(`modal-${day}`);
        if (modal) modal.style.display = 'flex';

        let openedDays = JSON.parse(localStorage.getItem('opened_days')) || [];
        if (!openedDays.includes(day)) {
            openedDays.push(day);
            localStorage.setItem('opened_days', JSON.stringify(openedDays));
            document.querySelector(`.day-card[data-day="${day}"]`).classList.add('opened');
            updateRecapButton();
        }
    }

    function closeModal(day) {
        const modal = document.getElementById(`modal-${day}`);
        if (modal) modal.style.display = 'none';
    }

    function updateRecapButton() {
        const openedDays = JSON.parse(localStorage.getItem('opened_days')) || [];
        if (openedDays.length > 0) {
            recapButtonContainer.classList.remove('hidden');
        } else {
            recapButtonContainer.classList.add('hidden');
        }
    }

    function showRecapView() {
        recapList.innerHTML = '';
        const openedDays = JSON.parse(localStorage.getItem('opened_days')) || [];
        const openedAssignments = finalAssignments
            .filter(assignment => openedDays.includes(assignment.day))
            .sort((a, b) => a.day - b.day);
            
        if (openedAssignments.length === 0) {
            recapList.innerHTML = '<p style="text-align: center;">Aucun lot n\'a encore été ouvert !</p>';
        } else {
            openedAssignments.forEach(assignment => {
                const item = document.createElement('div');
                item.className = 'recap-item';
                item.innerHTML = `
                    <div class="day">${assignment.day}</div>
                    <div class="to">${assignment.to}</div>
                    <div class="prize">${assignment.prize}</div>
                `;
                recapList.appendChild(item);
            });
        }
        navigateTo('recap');
    }

    function resetApp() {
        if (confirm("Êtes-vous sûr de vouloir réinitialiser le calendrier ? Toute la configuration sera perdue.")) {
            localStorage.removeItem(`prizes_${personM}`);
            localStorage.removeItem(`prizes_${personG}`);
            localStorage.removeItem('opened_days');
            window.location.href = window.location.pathname;
        }
    }

    init();
});
