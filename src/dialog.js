// LOGIN DIALOG ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Wait for the react mount to be accessible
lookFor('#panel', 1000).then(injectDialog);

function injectDialog() {
    // Inject HTML for settings panel
    g('designer-app-react-mount').insertAdjacentHTML(
        'beforeEnd',
        '{{dialog.html}}'
    );

    const login = {
        dialog: g('dialog'),
        dialogButton: g('dialog-button'),
        exit: g('dialog-exit'),
        page: {
            one: g('dialog-page-1'),
            two: g('dialog-page-2'),
        },
        loginButton: g('login'),
        username: g('username'),
        password: g('password'),
        cancel: g('dialog-cancel'),
        closeModal: closeModal,
    };

    login.dialogButton.addEventListener('click', (e) => {
        e.preventDefault;
        login.dialog.showModal();
    });

    // Handle login
    login.loginButton.addEventListener('click', (e) => {
        e.preventDefault;
        sendLoginData(login.username.value, login.password.value);
    });

    document.addEventListener('keyup', (e) => {
        e.preventDefault;
        if (e.key === 'Enter' && login.dialog.open) {
            e.preventDefault;
            sendLoginData(login.username.value, login.password.value);
        }
    });

    document.addEventListener('gv-login', (e) => {
        login.page.one.classList.remove('on');
        login.page.two.classList.add('on');
    });

    login.exit.addEventListener('click', (e) => {
        login.closeModal();
    });

    login.cancel.addEventListener('click', (e) => {
        login.closeModal();
    });
}

// Method to close the UI, which is a bit more complicated than just css display=none/flex because of the animation
function closeModal() {
    this.dialog.classList.add('closing');
    setTimeout(() => {
        this.dialog.classList.remove('closing');
        this.dialog.close();
    }, 100);
}

// Sends the login data to the server and sets a loginState bool that affects resetMenu()
function sendLoginData(u, p) {
    let url = 'https://test.greenvision.media:5555/api/v1/login',
        data = JSON.stringify({ username: u, password: p });
    // Append both the file and the configuration data
    fetch(url, {
        method: 'POST',
        body: data,
    })
        .then(() => {
            document.dispatchEvent(pmLogin);
        })
        .catch((e) => {
            console.log(e);
        });
}
