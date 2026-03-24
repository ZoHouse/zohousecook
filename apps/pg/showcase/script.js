const API_BASE_URL = "https://api.io.zo.xyz";
const API_SESSION = `${API_BASE_URL}/api/v1/showcase/session/`;
const API_MEDIA = `${API_BASE_URL}/api/v1/showcase/media/`;
const SDR_URL = "https://zo.xyz/pg/sdr";
const FAKE_DELAY = 2000;
const RETRY_DELAY = 5000;
let defaultRefreshRate = 10000;
let showcaseBuffer = [];
let isErrorScreen = false;
let lastShowcaseId = null;

function getAuthHeader() {
  return {
    headers: {
      Authorization: `Bearer ${window.token}`,
    },
  };
}

function enterFullScreen(element) {
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

function updateDisplayOrientation(orientation) {
  if (orientation) {
    const body = document.querySelector("body");
    if (body.classList.contains(`screen-${orientation}`)) {
      return;
    }

    body.classList.remove("screen-landscape");
    body.classList.remove("screen-portrait");
    body.classList.add(`screen-${orientation}`);
  }
}

function verifyAndFormatData(media, session) {
  if (media.detail === "Invalid session.") {
    window.location.href = SDR_URL;
    return true;
  } else if (media.type) {
    if (media.data.length === 0) {
      setTimeout(noData, FAKE_DELAY);
      return true;
    } else {
      const typedData = passToData(media.data, "type", media.type);
      const typedDataWithRefreshInfo = passToData(
        typedData,
        "refreshRate",
        session.data.refresh_rate || defaultRefreshRate
      );
      const typedDataWithRefreshAndOrientationInfo = passToData(
        typedDataWithRefreshInfo,
        "orientation",
        session.data.display_orientation
      );
      if (
        showcaseBuffer.length === 0 &&
        typedDataWithRefreshAndOrientationInfo.length === 1 &&
        typedDataWithRefreshAndOrientationInfo[0].key === lastShowcaseId
      ) {
      } else {
        showcaseBuffer = [
          ...showcaseBuffer,
          ...typedDataWithRefreshAndOrientationInfo,
        ];
      }
      return false;
    }
  } else {
    setTimeout(serverDown, FAKE_DELAY);
    return true;
  }
}

function clearAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function passToData(data, key, value) {
  return data.map((d) => {
    return {
      ...d,
      [key]: value,
    };
  });
}

function checkImagesLoaded() {
  return Promise.all(
    Array.from(document.images).map((img) => {
      if (img.complete) return Promise.resolve(img.naturalHeight !== 0);
      return new Promise((resolve) => {
        img.addEventListener("load", () => resolve(true));
        img.addEventListener("error", () => resolve(false));
      });
    })
  )
    .then((results) => {
      if (results.every((res) => res)) {
        return true;
      } else {
        return false;
      }
    })
    .catch((err) => {
      return false;
    });
}

function initToken() {
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");
  const code = searchParams.get("code");
  if (token && code) {
    window.token = token;
    window.code = code;
  } else {
    window.location.href = SDR_URL;
  }
}

function checkInternet() {
  window.addEventListener("offline", noInternet);
  window.addEventListener("online", internetBack);
}

function noData() {
  resetDisplay();
  isErrorScreen = true;
  const mainNoData = document.querySelector("#main-no-data");
  const textMeditate = document.querySelector("#main-no-data-meditate");

  mainNoData.style.display = "flex";
  setTimeout(() => {
    textMeditate.style.display = "flex";
    setTimeout(startFetching, RETRY_DELAY);
  }, FAKE_DELAY);
}

function noInternet() {
  resetDisplay();
  isErrorScreen = true;
  const mainNoInternet = document.querySelector("#main-no-internet");
  const textRestart = document.querySelector("#main-no-internet-restart");

  mainNoInternet.style.display = "flex";
  setTimeout(() => {
    textRestart.style.display = "flex";
  }, FAKE_DELAY);
}

function internetBack(serverIssue) {
  resetDisplay();
  isErrorScreen = false;
  const mainInternetBack = document.querySelector("#main-internet-back");
  const textRestart = document.querySelector("#main-internet-back-restart");

  mainInternetBack.style.display = "flex";
  setTimeout(() => {
    if (!serverIssue) {
      textRestart.style.display = "flex";
    }
    setTimeout(() => {
      showcaseBuffer = [];
      startFetching();
    }, FAKE_DELAY);
  }, FAKE_DELAY);
}

async function startServerCheck() {
  try {
    const response = await fetch(API_MEDIA, getAuthHeader());
    const data = await response.json();

    if (data.type) {
      internetBack(true);
    }
  } catch (err) {
    setTimeout(startServerCheck, FAKE_DELAY);
  }
}

function serverDown() {
  resetDisplay();
  isErrorScreen = true;
  const mainServerDown = document.querySelector("#main-server-down");
  const textBear = document.querySelector("#main-server-down-bear");

  mainServerDown.style.display = "flex";
  setTimeout(() => {
    textBear.style.display = "flex";
    setTimeout(startServerCheck, FAKE_DELAY);
  }, FAKE_DELAY);
}

function resetShowcase() {
  resetDisplay();
  resetGrid();
  removeFounderBadge();
  removeQRCode();
  removeInfoContent();
  const mainShowcase = document.querySelector("#main-showcase");
  mainShowcase.style.display = "flex";
}

function showcaseProfile(data) {
  createMediaGrid([
    {
      url: data.pfp_image,
    },
  ]);

  addInfoContent(
    data.nickname,
    "https://static.cdn.zo.xyz/media/ethereum-logo.svg"
  );
  if (data.twitter_handle != null && data.twitter_handle !== "") {
    addInfoContent(
      `@${data.twitter_handle}`,
      "https://static.cdn.zo.xyz/media/twitter-logo.svg"
    );
    addQRCode(
      `https://twitter.com/${data.twitter_handle}`,
      "https://static.cdn.zo.xyz/media/twitter-logo.svg"
    );
  }

  if (data.membership === "founder") {
    addFounderBadge();
  }

  showInfoSection();
}

function showcasePromotional(data) {
  createMediaGrid(
    [
      {
        url: data?.media?.url || data?.data?.url,
      },
    ],
    true
  );

  hideInfoSection();
}

const fetchData = async () => {
  try {
    const urls = [API_SESSION, API_MEDIA];

    const [session, media] = await Promise.all(
      urls.map(async (url) => {
        const response = await fetch(
          `${url}?code=${window.code}`,
          getAuthHeader()
        );
        return response.json();
      })
    );

    return { media, session };
  } catch (error) {
    setTimeout(serverDown, FAKE_DELAY);
  }
};

async function prepareShowcaseData() {
  const isInitial = showcaseBuffer.length === 0 && lastShowcaseId == null;
  const { media, session } = await fetchData();

  const hasError = verifyAndFormatData(media, session);

  return { isInitial, hasError };
}

async function startFetching() {
  const { isInitial, hasError } = await prepareShowcaseData();

  if (!hasError) {
    if (isInitial) {
      setTimeout(() => {
        showcase(showcaseBuffer.shift());
      }, FAKE_DELAY);
    }
  }
}

function showcase(data) {
  console.log("Current Showcase:", data);
  const timeForNext = data.refreshRate;

  if (data.key !== lastShowcaseId) {
    console.log(`Showcasing ${data.type}:`, data);
    updateDisplayOrientation(data.orientation);
    resetShowcase();

    if (data.type === "profile") {
      showcaseProfile(data);
    } else if (data.type === "promotional") {
      showcasePromotional(data);
    }
  }

  if (!isErrorScreen) {
    setTimeout(() => {
      if (showcaseBuffer.length >= 1) {
        showcase(showcaseBuffer.shift());
      } else {
        showcase(data);
      }
      if (showcaseBuffer.length < 2) {
        setTimeout(startFetching, RETRY_DELAY);
      }
    }, timeForNext * 1000);
  }

  lastShowcaseId = data.key;
}

async function init() {
  enterFullScreen();
  initToken();
  checkInternet();
  startFetching();
}

window.onload = init;
