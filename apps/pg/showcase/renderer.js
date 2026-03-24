function resetDisplay() {
  const mainShowcase = document.querySelector("#main-showcase");
  const mainLoading = document.querySelector("#main-loading");
  const mainNoInternet = document.querySelector("#main-no-internet");
  const mainInternetBack = document.querySelector("#main-internet-back");
  const mainNoData = document.querySelector("#main-no-data");
  const mainServerDown = document.querySelector("#main-server-down");
  const textInternetRestart = document.querySelector(
    "#main-internet-back-restart"
  );
  const textNoInternetRestart = document.querySelector(
    "#main-no-internet-restart"
  );
  const textMeditate = document.querySelector("#main-no-data-meditate");

  mainShowcase.style.display = "none";
  mainLoading.style.display = "none";
  mainNoInternet.style.display = "none";
  mainInternetBack.style.display = "none";
  mainServerDown.style.display = "none";
  mainNoData.style.display = "none";
  textInternetRestart.style.display = "none";
  textNoInternetRestart.style.display = "none";
  textMeditate.style.display = "none";
}

function resetGrid() {
  const mainShowcase = document.querySelector("#main-showcase");
  const grid = document.querySelector(".grid-container");
  if (grid) {
    mainShowcase.removeChild(grid);
  }
}

function createMediaGrid(data, containMedia = false) {
  const mainShowcase = document.querySelector("#main-showcase");
  // Create a section element
  let section = document.createElement("section");

  // Add id and class to the section
  section.id = "grid-" + data.length;
  section.className = "grid-container";

  // Create the specified number of div elements
  for (let item of data) {
    let div = document.createElement("div");
    div.className = "item";

    // Create an img or video tag based on the URL
    let media;
    let ext = item.url.split(".").pop();
    if (["jpg", "jpeg", "png", "gif", "svg"].includes(ext)) {
      media = document.createElement("img");
      if (containMedia) {
        media.className = "contain-media";
      }
      media.src = item.url;
    } else if (["mp4", "ogg", "webm"].includes(ext)) {
      media = document.createElement("video");
      if (containMedia) {
        media.className = "contain-media";
      }
      media.src = item.url;
      media.controls = true;
    } else {
      media = document.createElement("iframe");
      media.src = item.url;
      media.allowFullscreen = true;
    }

    div.appendChild(media);
    section.appendChild(div);
  }

  mainShowcase.prepend(section);
}

function showInfoSection() {
  const info = document.querySelector("#info");
  info.style.display = "flex";
}

function hideInfoSection() {
  const info = document.querySelector("#info");
  info.style.display = "none";
}

function addInfoContent(_text, _icon) {
  const infoContent = document.querySelector("#info-content");

  let div = document.createElement("div");
  div.className = "data-item";

  let icon = document.createElement("img");
  icon.src = _icon;
  div.appendChild(icon);

  let text = document.createElement("span");
  text.innerText = _text;
  div.appendChild(text);

  infoContent.appendChild(div);
}

function removeInfoContent() {
  const infoContent = document.querySelector("#info-content");
  infoContent.innerHTML = "";
}

function addFounderBadge() {
  const infoExtras = document.querySelector("#info-extras");

  const image = document.createElement("img");
  image.src = "https://static.cdn.zo.xyz/media/founder-badge.svg";
  image.id = "founder-badge";

  infoExtras.appendChild(image);
}

function removeFounderBadge() {
  const infoExtras = document.querySelector("#info-extras");

  const image = document.querySelector("#founder-badge");
  if (image) {
    infoExtras.removeChild(image);
  }
}

function addQRCode(link, logo) {
  const infoExtras = document.querySelector("#info-extras");

  const qrContainer = document.createElement("div");
  qrContainer.id = "qr-code";

  const qrCode = new QRCodeStyling({
    width: 300,
    height: 300,
    type: "svg",
    data: link,
    image: logo,
    dotsOptions: {
      type: "rounded",
    },
    backgroundOptions: {
      color: "#f9fafb",
    },
    imageOptions: {
      margin: 8,
    },
  });

  qrCode.append(qrContainer);
  const qrCodeSVG = qrContainer.querySelector("svg");
  if (qrCodeSVG) {
    qrCodeSVG.setAttribute("viewBox", "0 0 300 300");
    qrCodeSVG.setAttribute("width", "100%");
    qrCodeSVG.setAttribute("height", "100%");
  }

  infoExtras.appendChild(qrContainer);
}

function removeQRCode() {
  const infoExtras = document.querySelector("#info-extras");

  const qrContainer = document.querySelector("#qr-code");
  if (qrContainer) {
    infoExtras.removeChild(qrContainer);
  }
}
