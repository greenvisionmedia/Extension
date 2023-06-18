// LOGIN DIALOG ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Wait for the react mount to be accessible
lookFor('#panel', 1000).then(injectDialog);

function injectDialog() {
    // Inject HTML for settings panel
    get('designer-app-react-mount').insertAdjacentHTML(
        'beforeEnd',
        '{{dialog.html}}'
    );

    const Dialog = {
        this: get('dialog'),
        button: get('dialog-button'),
        exit: get('dialog-exit'),
        page: {
            one: get('dialog-page-1'),
            two: get('dialog-page-2'),
        },
        login: get('login'),
        username: get('username'),
        password: get('password'),
        cancel: get('dialog-cancel'),
        close,
    };

    Dialog.button.addEventListener('click', (e) => {
        e.preventDefault;
        Dialog.this.showModal();
    });

    // Handle login
    Dialog.login.addEventListener('click', (e) => {
        e.preventDefault;
        sendLoginData(Dialog.username.value, Dialog.password.value);
    });

    document.addEventListener('keyup', (e) => {
        e.preventDefault;
        if (e.key === 'Enter' && Dialog.this.open) {
            e.preventDefault;
            sendLoginData(Dialog.username.value, Dialog.password.value);
        }
    });

    document.addEventListener('gv-login', (e) => {
        off(Dialog.page.one);
        on(Dialog.page.two);
    });

    Dialog.exit.addEventListener('click', (e) => {
        Dialog.close();
    });

    Dialog.cancel.addEventListener('click', (e) => {
        Dialog.close();
    });
}

// Method to close the UI, which is a bit more complicated than just css display=none/flex because of the animation
function close() {
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
