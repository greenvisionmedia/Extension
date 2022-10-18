//button_script.js
///Deliberately written in vanilla JS a la green web best practices

//HTML could/should be loaded with Gulp
const buttonHTML = '<!--button.html--><div id="gvm-pm-b"> <svg aria-hidden="true" focusable="false" width="17" height="17" viewBox="0 0 17 19"><path d="M12.6,19.2c-4.1-2.2-7.7-5.2-11.1-8.3,0,0-1.5-1.4-1.5-1.4C3.1,6.2,6.3,3,9.7,0c2.6,2.8,5.2,5.9,7.4,9.1-2,1.5-4,2.9-6.3,4,1-1.9,2.2-3.6,3.4-5.3v1.9c-2.2-1.6-4.3-3.5-6.3-5.3,0,0,3,0,3,0-2.1,2.2-4.3,4.3-6.5,6.4v-3c3.1,3.5,6,7.1,8.1,11.3h0Z"></path></svg></div>'
const modalHTML = '<!--modal.html--><div id="gvm-pm-m"><div class="udesly-card svelte-e0hmlv"><div class="udesly-flex udesly-flex__column modal_loader"><div class="udesly-loader svelte-2xwx1e"></div><p class="svelte-2xwx1e">Automating download...</p></div></div></div>'

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

waitFor('.bem-TopBar_Body_ExportButton', injectButton)

//PUSHERMAN EXPORT BUTTON
function injectButton(exportButton) {
  //Inject HTML for button
  exportButton.insertAdjacentHTML('beforeBegin', buttonHTML);
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
///Janky but works!
function downloadHandler(exportButton, modal) {
  exportButton.click();
  let parentClass = 'div[style="display: flex; justify-content: space-between; flex: 0 1 auto;"]';
  
  waitFor(parentClass + ' button:nth-child(4)', (zipButton) => {
    zipButton.click();
    
    waitFor(parentClass + ' a[href^="blob:"]', (downloadButton)=> {
      downloadButton.click();
      setTimeout (() => {
        modal.style.display = 'none';
        sessionStorage.setItem('udesly-run-state', false);
        document.querySelector(parentClass + ' button:nth-child(3)').click();
        chrome.runtime.sendMessage({msg: 'gvm-pm-complete'});
      },500)
    })
  })
}

//KNOWN BUGS
///Webflow passive event listener freaks out when you scroll