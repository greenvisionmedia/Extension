//Wait for export dialog
const exportReady = setInterval(function () {
  let readyNode = document.querySelector('.bem-TopBar_Body_ExportButton');
  if (readyNode) {
    clearInterval(exportReady);
    readyNode.addEventListener('click', () => {
      const buttonReady = setInterval(function () {
        let parentNode = document.querySelector('div[style="display: flex; justify-content: space-between; flex: 0 1 auto;"]');
        let readyNode = parentNode.querySelector('a[download]');
        if (readyNode) {
          clearInterval(buttonReady);
          injectButton(parentNode);
        }
      }, 100);
    });
  }
}, 500);

//INJECT PUSHERMAN EXPORT BUTTON
function injectButton(buttonRow) {
  //Get exporter DOM elements
  let cancelButton = buttonRow.querySelectorAll('button')[0];
  let zipButton = buttonRow.querySelectorAll('button')[1];

  //Inject HTML for the pusher button
  cancelButton.insertAdjacentHTML('afterend', '<input type="button" class="dialog-button" id="gvm-pm-b" value="Host with GVM"></input>');
  let pusherButton = document.getElementById('gvm-pm-b');
  pusherButton.addEventListener('click', () => {
    zipButton.click();
    document.body.dispatchEvent(new CustomEvent("udesly-webflow-init"));
    document.addEventListener('click', () => {
      chrome.runtime.sendMessage({message: 'Hello World'});
    })
  });
}

