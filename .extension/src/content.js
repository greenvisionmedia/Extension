////PUSHERMAN CONTENT SCRIPT
//I try to use vanilla js because it's universally understood, less liable to break than a framework, cleaner/more efficient than a framework/library

//Wait for DOM elements to appear, avoids querying bits of the WF designer that don't exist yet
function waitFor(waitClass, callback) {
  let interval = setInterval(() => {
    let waitNode = document.querySelector(waitClass);
    if (waitNode) {
      clearInterval(interval);
      callback(waitNode);
    }
  }, 500);
}

////PUSHERMAN CONFIG MODAL
//Form to configure all the data currently in the my github workflow deploy.yaml file

waitFor('.bem-TopBar_Body_ExportButton', injectModal);

function injectModal(exportButton) {
  //Inject HTML for modal button
  exportButton.insertAdjacentHTML('beforeBegin', '<div id="modal-button"> <svg aria-hidden="true" focusable="false" width="17" height="17" viewBox="0 0 17 19"><path d="M12.6,19.2c-4.1-2.2-7.7-5.2-11.1-8.3,0,0-1.5-1.4-1.5-1.4C3.1,6.2,6.3,3,9.7,0c2.6,2.8,5.2,5.9,7.4,9.1-2,1.5-4,2.9-6.3,4,1-1.9,2.2-3.6,3.4-5.3v1.9c-2.2-1.6-4.3-3.5-6.3-5.3,0,0,3,0,3,0-2.1,2.2-4.3,4.3-6.5,6.4v-3c3.1,3.5,6,7.1,8.1,11.3h0Z"></path></svg></div>');
  //Inject the HTML for the modal
  let modal = document.createElement('dialog');
  modal.id = 'gv_pm';
  modal.innerHTML = '{{modal.html}}'; //This string gets replaced during gulp build
  document.body.appendChild(modal);

  //Getting PM UI elements
  let
    modalButton = document.getElementById('modal-button'),
    exit = document.getElementById('exit'),
    cancel = document.getElementById('cancel'),
    publish = document.getElementById('publish'),
    settings = document.getElementById('settings'),
    form = document.getElementById('form'),
    save = document.getElementById('save'),
    restart = document.getElementById('restart'),
    inputs = {
      'domain': document.getElementById('domain'),
      'siteCode': document.getElementById('site-code'),
      'release': document.getElementById('release'),
      'password': document.getElementById('password'),
      'staging': document.getElementById('staging')
    };


  let configData = chrome.storage.sync.get([
    'PROJECT', //the slug after webflow.com/designer, useful when we make github repos
    'DOMAIN', //the domain the final site will be published to
    'SITECODE', //all my clients get a 2-3 letter code, and a subdomain at [site code].greenvisionmedia.net
    'PASSWORD', //Potentially unwise to store this here...
    'STAGING' //boolean to send files to either the staging domain or the final domain
  ]);

  setDefaults(inputs, configData); //This should get the stored config data and display it in the UI
  setSiteURL(site, configData); //This gets the site to publish to (the real domain or the subdomain depending on the staging bool) and puts it in a hyperlink in the UI
  setRepoURL(repo, configData); ///Similar thing - displays a hyperlink using the project name (webflow.com/designer/[project name])

  //Toggle modal
  modalButton.addEventListener('click', (e) => {
    e.preventDefault;
    modal.showModal()
  })

  exit.addEventListener('click', (e) => {
    e.preventDefault;
    modal.close()
  });

  cancel.addEventListener('click', (e) => {
    e.preventDefault;
    modal.close()
  });

  //Toggle advanced options
  settings.addEventListener('click', (e) => {
    e.preventDefault;
    settings.classList.toggle('on');
    form.classList.toggle('on');
  });

  //These two buttons basically make up a 'radio button', only one should be on. I'll use which element has the "on" class to determine which is pressed. 
  inputs.staging.addEventListener('click', (e) => {
    e.preventDefault;
    inputs.release.classList.toggle('on');
    inputs.staging.classList.toggle('on');
  });

  inputs.release.addEventListener('click', (e) => {
    e.preventDefault;
    inputs.release.classList.toggle('on');
    inputs.staging.classList.toggle('on');
  });

  //Hitting save turns pointerevents off on the form inputs, shows a new 'restart' button where save was
  save.addEventListener('click', (e) => {
    e.preventDefault;
    Object.values(inputs).forEach((e) => { e.disabled = true });
    save.classList.toggle('on');
    restart.classList.toggle('on');

    configData = handleConfig(inputs, configData); //Logs the new config data
    setSiteURL(site, configData); //Again shows the new site hyperlink
    setRepoURL(repo, configData); //Shows new repo hyperlink
  });

  //Hitting restart just allows access to the form again
  restart.onmouseover = () => {
    restart.innerHTML = 'Restart';
  }
  restart.onmouseout = () => {
    restart.innerHTML = 'Configured';
  }
  restart.addEventListener('click', (e) => {
    e.preventDefault;
    Object.values(inputs).forEach((e) => { e.disabled = false });
    save.classList.toggle('on');
    restart.classList.toggle('on');
  });
}

//This doesn't seem to work at the moment. All UI elements are first filled with 'undefined'. Could be a problem with chrome.storage.sync.get() up at the top
function setDefaults(inputs, configData) {
  inputs.domain.value = configData.DOMAIN;
  inputs.siteCode.value = configData.SITECODE;
  inputs.password.value = configData.PASSWORD;
  if (configData.STAGING) {
    inputs.staging.classList.add('on')
    inputs.release.classList.remove('on');
  }
  else {
    inputs.staging.classList.remove('on');
    inputs.release.classList.add('on');
  }
}

//Write and store configuration data
function handleConfig(inputs, configData) {
  let isStaging = true;
  if (inputs.staging.classList.contains('on')) {
    isStaging = true;
  }
  else {
    isStaging = false;
  }
  let projectString = window.location.pathname.split('/')[2];
  configData = {
    PROJECT: projectString,
    DOMAIN: inputs.domain.value,
    SITECODE: inputs.siteCode.value,
    PASSWORD: inputs.password.value,
    STAGING: isStaging
  };
  chrome.storage.sync.set(configData);
  return configData;
}

//These are useful since they use the configData object, they can 
function setSiteURL(site, configData) {
  if (configData.STAGING) {
    site.setAttribute('href', `https://${configData.SITECODE}.greenvisionmedia.net`);
    site.querySelector('span').innerHTML = configData.SITECODE + '.greenvisionmedia.net';
  }
  else {
    site.setAttribute('href', `https://${configData.DOMAIN}`);
    site.querySelector('span').innerHTML = configData.DOMAIN;
  }
}

function setRepoURL(repo, configData) {
  repo.setAttribute('href', `https://github.com/greenvisionmedia/${configData.PROJECT}.git`);
  repo.querySelector('span').innerHTML = 'github.com/greenvisionmedia/' + configData.PROJECT;
}

//Might be better to do this serverside? But it's nice to have the yaml somewhere accessible if I want to change it
function writeYAML(configData) {
  return `name: Deploy
  on:
    push:
    workflow_dispatch:
  jobs:
    deploy:
      uses: greenvisionmedia/actions/.github/workflows/gv-deploy.yml@main
      with:
        staging: ${configData.staging}
        domain: ${configData.domain}
        subdomain: ${configData.siteCode}.greenvisionmedia.net
      secrets:
        test: \${{secrets.TEST_PASSWORD}} 
        ftp: \${{secrets.FTP_PASSWORD}}`
  //the greenvisionmedia.net ftp password won't change
  //but the password for the main domain has to get to github somehow...
  //it's fine if we just set that by hand in github for now
}