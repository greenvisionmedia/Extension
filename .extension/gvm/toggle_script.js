//toggle_script.js
///Would eventually configure various publication settings (staging vs final pub, static vs cms pub)

//HTML could/should be loaded with Gulp
const toggleHTML = '';
const dialogHTML = '';

//Wait for DOM elements
function waitFor(waitClass, callback) {
  const interval = setInterval(() => {
    let waitNode = document.querySelector(waitClass);
    if (waitNode) {
      clearInterval(interval);
      callback(waitNode);
    }
  }, 500);
}

waitFor('.left-sidebar-links', injectToggle)

//PUSHERMAN DIALOG TOGGLE
function injectToggle(sideBar) {
  //Inject HTML for toggle
  exporttoggle.insertAdjacentHTML('beforeEnd', toggleHTML);
  let toggle = document.getElementById('gvm-pm-t');

  //Inject HTML for dialog
  document.body.insertAdjacentHTML('beforeEnd', dialogHTML);
  let dialog = document.getElementById('gvm-pm-d');

    //Show dialog when toggle is clicked
    toggle.onclick = () => {
      dialog.style.display = "flex";
    };

    //Form handler
    submitInput.onclick = () => {
      //Get username, webflow project name and generate repository path
      let project = window.location.pathname.split('/')[2];
      let username = textInput.value;
      const newRepo = 'https://github.com/' + username + '/' + project + '.git';

      //Update DOM
      subtitle.innerHTML = 'Your files will be pushed here when you export your code. <a href="https://github.com/new" target="_blank">Go to GitHub<svg width="11" height="11"><path fill="currentColor" d="M5 1v1h3.293L4.646 5.646l.707.707L9 2.707V6h1V1H5zm2 8H2V4h2V3H2c-.55 0-1 .45-1 1v5c0 .55.45 1 1 1h5c.55 0 1-.45 1-1V7H7v2z"></path></svg></a>and name your new repository <a href="#" id="project">' + project + '.</a>';
      repoBox.setAttribute('value', newRepo);
      container.style.display = 'flex';
      form.style.display = 'none';

      //Store new repo path on Chrome profile. Initialized as 'Hello World' in background.js for debugging.
      chrome.storage.sync.set({
        repoKey: newRepo
      });
    };

    //Restart button handler
    restartButton.addEventListener('mouseover', (event) => {
      restartButton.onmouseover = () => {
        restartButton.setAttribute('value', 'Enter Again');
      };

      restartButton.onmouseout = () => {
        restartButton.setAttribute('value', 'Path Stored')
      };
    });

    restartButton.onclick = () => {
      form.style.display = 'flex';
      container.style.display = 'none';
      subtitle.innerHTML = "Reenter your GitHub organization/username: ";
    };

    //Exit button handler
    exitButton.onclick = () => {
      dialog.style.display = 'none';
    };
}