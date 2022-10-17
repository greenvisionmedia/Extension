//Wait for designer
const designerReady = setInterval(function() {
  let readyClass = q('.avoid-topbar')
  if (readyClass) {
      injectToggle();
      clearInterval(designerReady);
  }
}, 500);

//INJECT PUSHERMAN DIALOG TOGGLE /*
function injectToggle() {
    //Get designer DOM elements
    let sidebar = document.querySelector('.left-sidebar-links');

    //Inject HTML for toggle
    sidebar.insertAdjacentHTML('beforeend', '<!--toggle.html--> <div id="gvm-pm-t"> <svg aria-hidden="true" focusable="false" width="19" height="19" viewBox="0 0 17 19"> <path d="M12.6,19.2c-4.1-2.2-7.7-5.2-11.1-8.3,0,0-1.5-1.4-1.5-1.4C3.1,6.2,6.3,3,9.7,0c2.6,2.8,5.2,5.9,7.4,9.1-2,1.5-4,2.9-6.3,4,1-1.9,2.2-3.6,3.4-5.3v1.9c-2.2-1.6-4.3-3.5-6.3-5.3,0,0,3,0,3,0-2.1,2.2-4.3,4.3-6.5,6.4v-3c3.1,3.5,6,7.1,8.1,11.3h0Z"></path> </svg> </div>');
    let toggle = document.getElementById('gvm-pm-t');

    //Inject HTML for the dialog box
    document.body.insertAdjacentHTML('beforeend', '<!--dialog.html--> <div id="gvm-pm-t"> <div id="dialog"> <div id="dialog-menu"> <div id="x"> <div></div> <div></div> </div> <div id="dialog-title"> GVM Pusherman </div> </div> <div id="dialog-subtitle"> Enter your GitHub organization/username: </div> <form method="get" id="dialog-form" class="dialog-container" action=""> <input type="text" class="dialog-text" id="text-input" placeholder="i.e Green-Vision-Media"> <input type="button" class="dialog-button" id="submit-input" value="Submit"> </form> <div id="repo-container" class="dialog-container"> <input type="text" class="dialog-text" value="" id="repository" readonly="true"></input> <input type="button" class="dialog-button" value="Path Stored" id="restart"></input> </div> </div> </div>');
    let dialog = document.getElementById('gvm-pm-d');
    
    //Get dialog elements
    function clientFirstQuery(parent, folder){
      let nodeList = parent.querySelectorAll('*[class = "' + folder + '"]')
      for (let i = 0; i < nodeList.length; i++) {
        let varList;
        varList[i] = nodeList[i].classList[0];
        varList[i] = varList[i].slice(length(folder)+1);
        varList[i] = varList[i].replace(/-./g, x=>x[1].toUpperCase());
        this[varList[i]] = nodeList[i];
      }
    }

    //Show dialog when toggle is clicked
    toggle.addEventListener('click', (event) => {
      dialog.style.display = "flex";
    });

    //Form handler
    submitInput.addEventListener('click', (event) => {
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
    });

    //Restart button handler
    restartButton.addEventListener('mouseover', (event) => {
      restartButton.onmouseover = () => {
        restartButton.setAttribute('value', 'Enter Again');
      };

      restartButton.onmouseout = () => {
        restartButton.setAttribute('value', 'Path Stored')
      };
    });

    restartButton.addEventListener('click', (event) => {
      form.style.display = 'flex';
      container.style.display = 'none';
      subtitle.innerHTML = "Reenter your GitHub organization/username: ";
    });

    //Exit button handler
    exitButton.addEventListener('click', (event) => {
      dialog.style.display = 'none';
    });
}
