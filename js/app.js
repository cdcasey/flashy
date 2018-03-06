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
    let deckRef = database.ref().child('decks');
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

        closeConnection: function () {
            database.goOffline();
        },

        getDeckTemplate: function (deckId) {
            return deckRef.child(deckId).once('value');;
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
        quizContainer: document.getElementById('quiz'),
        deckList: document.getElementById('deck-list'),
        cardList: document.getElementById('card-list'),
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
    const database = db.getDB();

    let setupEventListeners = function () {

        DOMelements.loginButton.addEventListener('click', login);

        DOMelements.logoutButton.addEventListener('click', (event) => {
            // Without this call, simply logging out does not release the socket
            // to the database.
            db.closeConnection();
            auth.signOut();
        })

        DOMelements.deckList.addEventListener('click', (event) => {
            const deckId = event.target.id
            const currentUser = auth.currentUser.uid;
            const userRef = database.ref('/' + currentUser);
            const clickedDeck = db.getDeckTemplate(deckId);
            // console.log("DEBUG deck", clickedDeck);

            // TODO: fixed this section
            userRef.on('value', (snapshot) => {
                if (snapshot.exists()) {
                    return false;
                } else {
                    clickedDeck.then((snapshot) => {
                        console.log('DEBUG', snapshot.val());
                        userRef.set({
                            [snapshot.key]: snapshot.val(),
                        })
                    })
                }
            })
        })
    }

    function login(event) {
        event.preventDefault();
        db.authorize(DOMelements.emailInput.value, DOMelements.passwordInput.value, DOMelements.passwordInput);
    }

    database.ref().child('decks').on('child_added', snapshot => {
        const li = document.createElement('li');
        li.innerText = snapshot.key;
        li.id = snapshot.key;
        DOMelements.deckList.appendChild(li);
    });

    auth.onAuthStateChanged(user => {
        DOMelements.passwordInput.value = '';
        if (user) {
            ui.changeUiMode('decks');
            // loginContainer.classList.add('login-container-inactive');
            // deckContainer.classList.remove('decks-inactive');
        } else {
            ui.changeUiMode('login');
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

    function startQuiz(userRef, deckId) {
        console.log(userRef, deckId);
        changeUiMode('quiz');
    }
*/
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