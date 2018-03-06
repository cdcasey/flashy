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

let dbControl = (function () {

})();

let uiControl = (function () {

})();

let control = (function (ui, db) {

})(dbControl, uiControl);

control();
*/

(function () {
    var config = {
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
    // const deckRefList = deckRef.child('hobbie');

    const auth = firebase.auth();
    const loginButton = document.getElementById('login');
    const logoutButton = document.getElementById('logout');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const deckContainer = document.getElementById('decks');
    const quizContainer = document.getElementById('quiz');
    const deckList = document.getElementById('deck-list');
    const cardList = document.getElementById('card-list');

    loginButton.addEventListener('click', (event) => {
        event.preventDefault();
        auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
        .catch((error) => {
            console.log(error.message)
            passwordInput.value = '';
        });
    })
    // auth.createUserWithEmailAndPassword(email, password);

    logoutButton.addEventListener('click', (event) => {
        auth.signOut();
    })

    let loginContainer = document.getElementsByClassName('login-container')[0];
    auth.onAuthStateChanged(user => {
        passwordInput.value = '';
        if (user) {
            changeUiMode('decks');
            // loginContainer.classList.add('login-container-inactive');
            // deckContainer.classList.remove('decks-inactive');
        } else {
            changeUiMode('login');
            // loginContainer.classList.remove('login-container-inactive');
            // deckContainer.classList.add('decks-inactive');
        }
    });

    deckList.addEventListener('click', (event) => {
        const deckId = event.target.id
        const currentUser = firebase.auth().currentUser.uid;
        const userRef = database.ref('/' + currentUser);
        const clickedDeck = deckRef.child(deckId).once('value');
        // console.log("DEBUG", clickedDeck.once('value'));

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

    // deckRef.on('value', snap => {
    //     objectElement.innerText = JSON.stringify(snap.val(), null, 2);
    // });

    function startQuiz(userRef, deckId) {
        console.log(userRef, deckId);
        changeUiMode('quiz');

    }

    function changeUiMode(mode) {
        switch (mode) {
            case 'login':
                loginContainer.classList.remove('login-container-inactive');
                deckContainer.classList.add('decks-inactive');
                quizContainer.classList.add('quiz-inactive');
                logoutButton.classList.add('logout-button-inactive');
                break;

            case 'decks':
                loginContainer.classList.add('login-container-inactive');
                deckContainer.classList.remove('decks-inactive');
                quizContainer.classList.add('quiz-inactive');
                logoutButton.classList.remove('logout-button-inactive');
                break;

            case 'quiz':
                loginContainer.classList.add('login-container-inactive');
                deckContainer.classList.add('decks-inactive');
                quizContainer.classList.remove('quiz-inactive');
                logoutButton.classList.remove('logout-button-inactive');
                break;

            default:
                break;
        }
    }
    deckRef.on('child_added', snap => {
        const li = document.createElement('li');
        li.innerText = snap.key;
        li.id = snap.key;
        deckList.appendChild(li);
    });

    // deckRefList.on('child_changed', snap => {
    //     const liChanged = document.getElementById(snap.key);
    //     liChanged.innerText = snap.val();
    // });

    // deckRefList.on('child_removed', snap => {
    //     const liToRemove = document.getElementById(snap.key);
    //     liToRemove.remove();
    // });

})();


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