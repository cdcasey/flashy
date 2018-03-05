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

    const auth = firebase.auth();
    let loginButton = document.getElementById('login');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    loginButton.addEventListener('click', (event) => {
        event.preventDefault();
        auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value)
        .catch((error) => {
            console.log(error.message)
            passwordInput.value = '';
        });
    })
    // auth.createUserWithEmailAndPassword(email, password);
    const logoutButton = document.getElementById('logout');
    logoutButton.addEventListener('click', (event) => {
        auth.signOut();
    })

    let loginContainer = document.getElementsByClassName('login-container')[0];
    auth.onAuthStateChanged(user => {
        passwordInput.value = '';
        if (user) {
            loginContainer.classList.add('login-container-inactive');
        } else {
            console.log("NOPE");
            loginContainer.classList.remove('login-container-inactive');

        }
    });

    let objectElement = document.getElementById('object');
    const uList = document.getElementById('list');

    let database = firebase.database();
    let dbRefObj = database.ref().child('object');
    const dbRefList = dbRefObj.child('hobbie');

    dbRefObj.on('value', snap => {
        objectElement.innerText = JSON.stringify(snap.val(), null, 2);
    });

    dbRefList.on('child_added', snap => {
        const li = document.createElement('li');
        li.innerText = snap.val();
        li.id = snap.key;
        uList.appendChild(li);
    });

    dbRefList.on('child_changed', snap => {
        const liChanged = document.getElementById(snap.key);
        liChanged.innerText = snap.val();
    });

    dbRefList.on('child_removed', snap => {
        const liToRemove = document.getElementById(snap.key);
        liToRemove.remove();
    });

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