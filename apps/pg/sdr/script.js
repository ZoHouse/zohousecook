const API_BASE_URL = "https://api.io.zo.xyz";
const SHOWCASE_URL = "https://zo.xyz/pg/showcase";
const API_REFRESH_INTERVAL = 5000;
const FAKE_DELAY = 2000;

function generateRandomString() {
  const chars = "23456789CFGHJMPQRVWX";
  let result = "";
  for (let i = 6; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function enterFullScreen() {
  try {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  } catch (error) {}
}

function loadDots(mainId) {
  const dots = document.querySelector(`${mainId} #loading-dots`);
  let count = 0;
  let maxCount = 3;

  const interval = setInterval(() => {
    if (count < maxCount) {
      dots.innerHTML += ".";
      count++;
    } else {
      dots.innerHTML = "";
      count = 0;
    }
  }, 500);

  return interval;
}

function generateCode() {
  const randomString = generateRandomString();
  const codeBox = document.querySelector("#code-box");

  codeBox.innerHTML = randomString
    .split("")
    .map((char) => {
      return `<span>${char}</span>`;
    })
    .join("");

  return randomString;
}

function setLoadingText(text) {
  const loadingText = document.querySelector("#loading-text");
  loadingText.innerHTML = text;
}

function showSuccess() {
  const mainInit = document.querySelector("#main-init");
  const mainSuccess = document.querySelector("#main-success");
  loadDots("#main-success");

  mainInit.style.display = "none";
  mainSuccess.style.display = "flex";
}

function init() {
  enterFullScreen();
  const code = generateCode();
  const interval = loadDots("#main-init");
  setLoadingText("Waiting for the session");

  const fetchInterval = setInterval(() => {
    fetch(`${API_BASE_URL}/api/v1/showcase/session/?code=${code}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.secret != null) {
          setLoadingText("Activating the display");
          clearInterval(fetchInterval);
          clearInterval(interval);
          setTimeout(() => {
            showSuccess();
            setTimeout(() => {
              window.location.href = `${SHOWCASE_URL}?token=${data.secret}&code=${code}`;
            }, FAKE_DELAY);
          }, FAKE_DELAY);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, API_REFRESH_INTERVAL);
}

window.onload = init;
