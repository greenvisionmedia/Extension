////PUSHERMAN CONTENT SCRIPT
//I try to use vanilla js because it's universally understood, less liable to break than a framework, cleaner/more efficient than a framework/library

let configData = chrome.storage.sync.get([
  'PROJECT',
  'DOMAIN',
  'SITECODE',
  'PASSWORD', //Potentially unwise to store this here...
  'STAGING'
]);

//Wait for DOM elements
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
  //Inject HTML for modal
  exportButton.insertAdjacentHTML('beforeBegin', '<div id="modal-button"> <svg aria-hidden="true" focusable="false" width="17" height="17" viewBox="0 0 17 19"><path d="M12.6,19.2c-4.1-2.2-7.7-5.2-11.1-8.3,0,0-1.5-1.4-1.5-1.4C3.1,6.2,6.3,3,9.7,0c2.6,2.8,5.2,5.9,7.4,9.1-2,1.5-4,2.9-6.3,4,1-1.9,2.2-3.6,3.4-5.3v1.9c-2.2-1.6-4.3-3.5-6.3-5.3,0,0,3,0,3,0-2.1,2.2-4.3,4.3-6.5,6.4v-3c3.1,3.5,6,7.1,8.1,11.3h0Z"></path></svg></div>');
  let modal = document.createElement('dialog');
  modal.id = 'gv_pm';
  modal.innerHTML = '{{modal.html}}'; //This string gets replaced during gulp build
  document.body.appendChild(modal);

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

  setDefaults(inputs, configData);
  setSiteURL(site, configData);
  setRepoURL(repo, configData);

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

  settings.addEventListener('click', (e) => {
    e.preventDefault;
    settings.classList.toggle('on');
    form.classList.toggle('on');
  });

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

  save.addEventListener('click', (e) => {
    e.preventDefault;
    Object.values(inputs).forEach((e) => { e.disabled = true });
    save.classList.toggle('on');
    restart.classList.toggle('on');

    configData = handleConfig(inputs, configData);
    setSiteURL(site, configData);
    setRepoURL(repo, configData);
  });

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

  //Gets repo name from url
  function setRepoURL(repo, configData) {
    repo.setAttribute('href', `https://github.com/greenvisionmedia/${configData.PROJECT}.git`);
    repo.querySelector('span').innerHTML = 'github.com/greenvisionmedia/' + configData.PROJECT;
  }

  //Might be better to do this serverside? But it's nice to have the yaml here if I want to change it
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
}