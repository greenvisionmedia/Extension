////PUSHERMAN CONTENT SCRIPT
//I try to use vanilla js because a) it's universally understood b) it's less wasteful than a bunch of dependencies c) I don't want to learn a real framework

//That being said I like gulp.js for build stuff. These placeholders get filled with the corresponding files 
const dialogHTML = '{{dialog.html}}';
const modalHTML = '{{modal.html}}'

//Query shorthands
function q(s) { return document.querySelector(s) };
function g(e) { return document.getElementById(e) };

//Wait for DOM elements
function waitFor(waitClass, callback) {
  const interval = setInterval(() => {
    let waitNode = q(waitClass);
    if (waitNode) {
      clearInterval(interval);
      callback(waitNode);
    }
  }, 500);
}

waitFor('.left-sidebar-links', injectToggle);
waitFor('.bem-TopBar_Body_ExportButton', injectButton);

////PUSHERMAN DIALOG TOGGLE
//Would eventually configure various publication settings (staging vs final pub, static vs cms pub)

function injectToggle(sideBar) {
  //Inject HTML for toggle
  sideBar.insertAdjacentHTML('beforeEnd', '<div id="gvm-pm-t"> <svg aria-hidden="true" focusable="false" width="19" height="19" viewBox="0 0 17 19"><pathd="M12.6,19.2c-4.1-2.2-7.7-5.2-11.1-8.3,0,0-1.5-1.4-1.5-1.4C3.1,6.2,6.3,3,9.7,0c2.6,2.8,5.2,5.9,7.4,9.1-2,1.5-4,2.9-6.3,4,1-1.9,2.2-3.6,3.4-5.3v1.9c-2.2-1.6-4.3-3.5-6.3-5.3,0,0,3,0,3,0-2.1,2.2-4.3,4.3-6.5,6.4v-3c3.1,3.5,6,7.1,8.1,11.3h0Z"></path></svg></div>');
  let toggle = g('gvm-pm-t');

  //Inject HTML for dialog
  document.body.insertAdjacentHTML('beforeEnd', dialogHTML);
  let dialog = g('gvm-pm-d');

  //Get webflow project name and generate repository path
  let project = window.location.pathname.split('/')[2];
  const repo = 'https://github.com/greenvisionmedia/' + project;
  g('a').setAttribute('href', repo);

  //Show dialog when toggle is clicked
  toggle.onclick = () => {
    dialog.style.display = "flex";
  };

  //Hide dialog when X is clicked
  let exitButton = g('x');
  exitButton.onclick = () => {
    dialog.style.display = 'none';
  };

  //Form handler
  submitButton.onclick = () => {
    submitHandler();
  };

  //Restart button
  restartButton.onmouseover = () => {
    restartButton.setAttribute('value', 'Enter Again');
  };

  restartButton.onmouseout = () => {
    restartButton.setAttribute('value', 'Path Stored')
  };

  restartButton.onclick = () => {
    form.style.display = 'flex';
    container.style.display = 'none';
    subtitle.innerHTML = "Reenter your GitHub organization/username: ";
  };
}

function submitHandler() {
  //Update chrome storage with configuration data
  chrome.storage.sync.set({
    domain: 
    site-code:
    subdomain:
    staging:
    static:
  });

  chrome.runtime.sendMessage({ msg: 'pm-configured' });
}


////PUSHERMAN EXPORT BUTTON
function injectButton(exportButton) {
  //Inject HTML for button
  exportButton.insertAdjacentHTML('beforeBegin', '<div id="gvm-pm-b"><svg aria-hidden="true" focusable="false" width="17" height="17" viewBox="0 0 17 19"><path d="M12.6,19.2c-4.1-2.2-7.7-5.2-11.1-8.3,0,0-1.5-1.4-1.5-1.4C3.1,6.2,6.3,3,9.7,0c2.6,2.8,5.2,5.9,7.4,9.1-2,1.5-4,2.9-6.3,4,1-1.9,2.2-3.6,3.4-5.3v1.9c-2.2-1.6-4.3-3.5-6.3-5.3,0,0,3,0,3,0-2.1,2.2-4.3,4.3-6.5,6.4v-3c3.1,3.5,6,7.1,8.1,11.3h0Z"></path></svg></div>');
  let button = document.getElementById('gvm-pm-b');

  //Inject HTML for modal
  document.body.insertAdjacentHTML('beforeEnd', modalHTML);
  let modal = document.getElementById('gvm-pm-m');

  //Handle button interaction
  button.onclick = () => {
    buttonHandler();
  }

  if (window.sessionStorage.getItem('udesly-run-state')) {
    //Add toggle only after udesly has run
    modal.style.display = 'flex';
    downloadHandler(exportButton, modal);
  }
}

function buttonHandler() {
  //Start Udesly extension event
  document.body.dispatchEvent(new CustomEvent('udesly-webflow-init'));
  //Toggle a session variable so the GVM modal will appear on the next reload 
  sessionStorage.setItem('udesly-run-state', true);
}

//Automate download process
function downloadHandler(exportButton, modal) {
  exportButton.click();
  let parentClass = 'div[style="display: flex; justify-content: space-between; flex: 0 1 auto;"]';

  waitFor(parentClass + ' button:nth-child(4)', (zipButton) => {
    zipButton.click();

    waitFor(parentClass + ' a[href^="blob:"]', (downloadButton) => {
      downloadButton.click();
      setTimeout(() => {
        modal.style.display = 'none';
        sessionStorage.setItem('udesly-run-state', false);
        q(parentClass + ' button:nth-child(3)').click();
        chrome.runtime.sendMessage({ msg: 'pm-exported' });
      }, 500)
    })
  })
}