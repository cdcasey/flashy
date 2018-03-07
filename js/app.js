/*
fetch('https://api.quizlet.com/2.0/sets/415?client_id=TEaPfm5BsY', {
    mode: 'no-cors'
})
    .then((response) => {
        return response
    })
    .then((data) => {
        let terms = data.terms;
        console.log(data);

    })
*/
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
                    DOMelements.loginContainer.classList.remove('login-container-inactive');
                    DOMelements.deckContainer.classList.add('decks-inactive');
                    DOMelements.quizContainer.classList.add('quiz-inactive');
                    DOMelements.logoutButton.classList.add('logout-button-inactive');
                    break;

                case 'decks':
                    DOMelements.loginContainer.classList.add('login-container-inactive');
                    DOMelements.deckContainer.classList.remove('decks-inactive');
                    DOMelements.quizContainer.classList.add('quiz-inactive');
                    DOMelements.logoutButton.classList.remove('logout-button-inactive');
                    break;

                case 'quiz':
                    DOMelements.loginContainer.classList.add('login-container-inactive');
                    DOMelements.deckContainer.classList.add('decks-inactive');
                    DOMelements.quizContainer.classList.remove('quiz-inactive');
                    DOMelements.logoutButton.classList.remove('logout-button-inactive');
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
    let cards = {};
    const srsConfig = {
        'bad': '5 minutes',
        'new': 300000, // in milliseconds (5 minutes)
        'fresh': '1 day',
        'average': '5 days',
        'old': '14 days'
    }

    let setupEventListeners = function () {

        DOMelements.loginButton.addEventListener('click', login);

        DOMelements.logoutButton.addEventListener('click', (event) => {
            // Without this call, simply logging out does not release the socket
            // to the database.
            db.closeConnection();
            auth.signOut();
            deckId = '';
            location.reload();
        })

        DOMelements.deckList.addEventListener('click', (event) => {
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
                startQuiz(currentUser, deckId);
            })
        })

        DOMelements.qaBox.addEventListener('click', (event) => {
            answer = cards[event.target.dataset.cardid].answer;
            event.target.innerText = answer;
            DOMelements.answerButtons.classList.remove('answer-buttons-inactive');
        })

        DOMelements.answerButtons.addEventListener('click', (event) => {
            console.log(event.target.id, DOMelements.qaBox.dataset.cardid);
            updateCard(event.target.id, DOMelements.qaBox.dataset.cardid);
        })

    }

    function login(event) {
        event.preventDefault();
        db.authorize(DOMelements.emailInput.value, DOMelements.passwordInput.value, DOMelements.passwordInput);
    }

    function updateCard(difficulty, cardId) {
        const date = new Date();
        const srsInstance = new SpacedRepetition(date, difficulty, srsConfig);
        cards[cardId].date = srsInstance.date;
        cards[cardId].state = srsInstance.state;
        console.log(cards[cardId]);

        // db.updateDB
        let cardRef = db.getDBRef(`/${currentUser}/${deckId}/cards/${cardId}`);
        db.updateDB(cardRef, cards[cardId]);
    }

    auth.onAuthStateChanged(user => {
        DOMelements.passwordInput.value = '';
        if (user) {
            ui.changeUiMode('decks');
            currentUser = auth.currentUser.uid;
            database.ref().child('decks').on('child_added', snapshot => {
                const li = document.createElement('li');
                li.innerText = snapshot.key;
                li.id = snapshot.key;
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

    /*



        startQuiz(userRef, deckId);
        // database.ref('/decks/' + deckId).once('value').then(function(snapshot) {
        //     // console.log(snapshot.val());
        //     let cards = snapshot.val().cards;
        //     cards.forEach(card => {
        //         const li = document.createElement('li');
        //         li.innerText = card.question;
        //         cardList.appendChild(li);
        //     });

        //   });
    })
*/
    function startQuiz(user, deck) {
        ui.changeUiMode('quiz');
        let deckRef = db.getDBRef(`/${user}/${deck}/cards`);
        deckRef.once('value', (snapshot) => {
            snapshot.forEach((card, i) => {
                if (!card.hasOwnProperty('state')) {

                    const last_shown = new Date();
                    cards[card.key] = card.val();
                    cards[card.key].state = 'new';
                    cards[card.key].date = last_shown;
                } else {
                    cards[card.key] = card.val();
                }
            });
            askQuestions();
            // console.log(snapshot.val()[0]);
            // card = {0: snapshot.val()[0]};
            // console.log(card[0]);
            // card[0].new = 'old';
            // cards[0].new = "hi"
            // console.log(cards[0]);

            // cards.forEach(card => {
            //     card.timeAccessed = Date.now();
            // });
            // console.log(typeof(cards), cards);

            // db.updateDB(deckRef, cards);
            // let cardRef = db.getDBRef(`/${user}/${deck}/cards`);
            // cards[0].difficulty = "freddie";
            // console.log(db.updateDB(cardRef, card));
            // console.log("Here are CARDS", cards);

            // cards.forEach(card => {
            //     card.id = 'hello';
            //     askQuestion(card);
            // });

            // console.log("STUFF", snapshot.key, snapshot.val(), cards);
        });
    }

    function askQuestions() {
        console.log(cards);

        DOMelements.qaBox.innerText = cards[0].question;
        DOMelements.qaBox.dataset.cardid = 0;
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


// (function () {

    // const deckRefList = deckRef.child('hobbie');


    // auth.createUserWithEmailAndPassword(email, password);


    // deckRef.on('value', snap => {
    //     objectElement.innerText = JSON.stringify(snap.val(), null, 2);
    // });





    // deckRefList.on('child_changed', snap => {
    //     const liChanged = document.getElementById(snap.key);
    //     liChanged.innerText = snap.val();
    // });

    // deckRefList.on('child_removed', snap => {
    //     const liToRemove = document.getElementById(snap.key);
    //     liToRemove.remove();
    // });

// })();


/*
function writeUserData(userId, name, email, imageUrl) {
    firebase.database().ref('test/' + userId).set({
      username: name,
      email: email,
      profile_picture : imageUrl
    });
  }

writeUserData('cdc', 'chris', 'jim@jim', '/path/to/image');
*/