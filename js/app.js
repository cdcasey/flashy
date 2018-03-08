const dbControl = (function () {
    let config = {
        apiKey: "AIzaSyBiHh1j4ExmaGdaRCWuYov18mOAn58WYJw",
        authDomain: "flashy-5ded7.firebaseapp.com",
        databaseURL: "https://flashy-5ded7.firebaseio.com",
        projectId: "flashy-5ded7",
        storageBucket: "",
        messagingSenderId: "89592375367"
    };
    firebase.initializeApp(config);

    let database = firebase.database();
    const auth = firebase.auth();

    return {
        authorize: function (email, password, passwordInput = null) {
            auth.signInWithEmailAndPassword(email, password)
                .catch((error) => {
                    console.log(error.message)
                    passwordInput.value = '';
                });
        },

        getAuth: function () {
            return auth;
        },

        getDB: function () {
            return database;
        },

        getDBRef: function (path) {
            return database.ref(path);
        },

        saveToDB: function (dbRef, data) {
            return dbRef.set(data);
        },

        updateDB: function (dbRef, data) {
            return dbRef.update(data);
        },

        closeConnection: function () {
            database.goOffline();
        },

        getDeckTemplate: function (deckId) {
            return this.getDBRef('/decks').child(deckId).once('value');
        }
    }

})();

const uiControl = (function () {
    const DOMelements = {
        navBar: document.getElementsByClassName('navbar')[0],
        userIdDisplay: document.getElementById('userid'),
        decksLink: document.getElementById('decks-link'),
        loginContainer: document.getElementsByClassName('login-container')[0],
        loginButton: document.getElementById('login'),
        logoutButton: document.getElementById('logout'),
        emailInput: document.getElementById('email'),
        passwordInput: document.getElementById('password'),
        deckContainer: document.getElementById('decks'),
        quizContainer: document.getElementById('quiz-container'),
        qaBox: document.getElementById('qabox'),
        answerButtons: document.getElementById('answer-buttons'),
        deckList: document.getElementById('deck-list'),
        cardList: document.getElementById('card-list'),
        hardButton: document.getElementById('hard'),
        mediumButton: document.getElementById('medium'),
        easyButton: document.getElementById('easy'),
    }

    return {
        changeUiMode: function (mode) {
            switch (mode) {
                case 'login':
                    DOMelements.navBar.classList.add('navbar-inactive');
                    DOMelements.loginContainer.classList.remove('login-container-inactive');
                    DOMelements.deckContainer.classList.add('decks-inactive');
                    DOMelements.quizContainer.classList.add('quiz-inactive');
                    break;

                case 'decks':
                    DOMelements.navBar.classList.remove('navbar-inactive');
                    DOMelements.loginContainer.classList.add('login-container-inactive');
                    DOMelements.deckContainer.classList.remove('decks-inactive');
                    DOMelements.quizContainer.classList.add('quiz-inactive');
                    DOMelements.answerButtons.classList.add('answer-buttons-inactive');
                    break;

                case 'quiz':
                    DOMelements.loginContainer.classList.add('login-container-inactive');
                    DOMelements.deckContainer.classList.add('decks-inactive');
                    DOMelements.quizContainer.classList.remove('quiz-inactive');
                    break;

                default:
                    break;
            }
        },

        getDomElements: function () {
            return DOMelements;
        }
    }

})();

const control = (function (db, ui) {
    const DOMelements = ui.getDomElements();
    const auth = db.getAuth();
    let currentUser = '';
    const database = db.getDB();
    let deckId = '';
    let cards = [];
    let counter = 0;
    const startTime = new Date();
    const srsConfig = {
        'bad': '5 minutes',
        'new': 300000, // in milliseconds (5 minutes)
        'fresh': '1 day',
        'average': '5 days',
        'old': '14 days'
    }

    let setupEventListeners = function () {

        DOMelements.loginButton.addEventListener('click', login);

        DOMelements.logoutButton.addEventListener('click', logout);

        DOMelements.deckList.addEventListener('click', startQuiz);

        DOMelements.qaBox.addEventListener('click', (event) => {
            answer = cards[event.target.dataset.cardid].answer;
            event.target.innerText = answer;
            DOMelements.answerButtons.classList.remove('answer-buttons-inactive');
        })

        DOMelements.answerButtons.addEventListener('click', (event) => {
            // TODO: end the quiz if it's at the end
            updateCard(event.target.id, DOMelements.qaBox.dataset.cardid);
            DOMelements.answerButtons.classList.add('answer-buttons-inactive');
            if (counter === cards.length - 1) {
                counter = 0;
                // TODO: This is in the wrong place
                ui.changeUiMode('quiz');
            } else {
                counter++;
                askQuestions();
            }
        })

        DOMelements.decksLink.addEventListener('click', (event) => {
            ui.changeUiMode('decks');
            counter = 0;
            cards = [];
        })

    }

    // login
    function login(event) {
        event.preventDefault();
        db.authorize(DOMelements.emailInput.value, DOMelements.passwordInput.value, DOMelements.passwordInput);
    }

    // Part of login. Syncs the deck list in the database with the UI
    auth.onAuthStateChanged(user => {
        DOMelements.passwordInput.value = '';
        if (user) {
            DOMelements.userIdDisplay.innerText = user.displayName || user.email;
            ui.changeUiMode('decks');
            currentUser = auth.currentUser.uid;
            database.ref().child('decks').on('child_added', snapshot => {
                const li = document.createElement('li');
                li.innerText = snapshot.key;
                li.id = snapshot.key;
                let mostRecentListItem = DOMelements.deckList.lastChild;
                if (mostRecentListItem && !mostRecentListItem.classList.contains('alt')) {
                    li.classList.add('alt');
                }
                DOMelements.deckList.appendChild(li);
            });
            // loginContainer.classList.add('login-container-inactive');
            // deckContainer.classList.remove('decks-inactive');
        } else {
            ui.changeUiMode('login');
            // location.reload();

            // loginContainer.classList.remove('login-container-inactive');
            // deckContainer.classList.add('decks-inactive');
        }
    });

    function startQuiz(event, user, deck) {
        deckId = event.target.id
        const userRef = db.getDBRef(`/${currentUser}`);
        const userDeckRef = db.getDBRef(`/${currentUser}/${deckId}`);
        const clickedDeck = db.getDeckTemplate(deckId);

        userDeckRef.once('value', (snapshot) => {
            if (!snapshot.exists()) {
                clickedDeck.then((snapshot) => {
                    // userRef.update({
                    //     [snapshot.key]: snapshot.val(),
                    // })
                    db.updateDB(userRef, { [snapshot.key]: snapshot.val(), })
                })
            }
            // startQuiz(currentUser, deckId);
        }).then(() => {
            ui.changeUiMode('quiz');
            let deckRef = db.getDBRef(`/${currentUser}/${deckId}/cards`);
            deckRef.once('value', (snapshot) => {
                snapshot.forEach((card, i) => {
                    if (!card.val().hasOwnProperty('state')) {
                        cards[card.key] = card.val();
                        cards[card.key].state = 'new';
                        cards[card.key].date = startTime;
                    } else {
                        cards[card.key] = card.val();
                    }
                });

                // TODO: Remove this. It's only needed for debugging to make sure
                // SRS is working
                let toAsk = cards.filter((card) => {
                    const cardDate = new Date(card.date);
                    if (cardDate.getTime() <= startTime.getTime()) { return card; }
                });
                // console.log("cards", cards);
                // console.log("toAsk", toAsk);
                askQuestions();
            })
        })
    }

    function askQuestions() {
        card = cards[counter];
        cardDate = new Date(card.date);
        if (cardDate.getTime() <= startTime.getTime()) {
            DOMelements.qaBox.innerText = card.question;
            DOMelements.qaBox.dataset.cardid = counter;
        } else if (counter === cards.length - 1) {
            counter = 0;
            DOMelements.qaBox.innerText = "Congrats! No cards to study right now!";
            setTimeout(DOMelements.decksLink.click, 2000);
        } else {
            counter++;
            askQuestions();
        }
    }

    function updateCard(difficulty, cardId) {
        // TODO: Make sure this is updateing the SRS properly by calling SRS methods.
        // Also, update  the whole deck instead of just one card.
        const cardDate = new Date(cards[cardId].date);
        const cardState = cards[cardId].state;
        const srsInstance = new SpacedRepetition(cardDate, cardState, srsConfig);
        let newStatus;
        switch (difficulty) {
            case "hard":
                newStatus = srsInstance.bad();
                break;
            case "medium":
                newStatus = srsInstance.ok();
                break;
            case "easy":
                newStatus = srsInstance.good();
                break;
            default:
                break;
        }
        cards[cardId].date = newStatus.date;
        cards[cardId].state = newStatus.state;

        let cardRef = db.getDBRef(`/${currentUser}/${deckId}/cards/${cardId}`);
        db.updateDB(cardRef, cards[cardId]);
    }

    // logout
    function logout(event) {
        // Without this call, simply logging out does not release the socket
        // to the database.
        db.closeConnection();
        auth.signOut();
        deckId = '';
        location.reload();
    }

    return {
        init: function () {
            console.log("init");
            setupEventListeners();
            ui.changeUiMode('login');
        }
    }
})(dbControl, uiControl);

control.init();
