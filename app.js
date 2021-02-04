// Global selections and variables
const colorDivs = document.querySelectorAll(".color");
const generateBtn = document.querySelector(".generate");
const sliders = document.querySelectorAll('input[type="range"]');
const sliderDivs = document.querySelectorAll(".sliders");
const currentHexes = document.querySelectorAll(".color h2");
const copyContainer = document.querySelector(".copy-container");
const copyPopup = document.querySelector(".copy-popup");
const adjustBtn = document.querySelectorAll(".adjust"); // rename to Btns if pedantic
const lockBtns = document.querySelectorAll(".lock");
const libraryBtn = document.querySelector(".library");
const libraryDiv = document.querySelector(".library-container");
const closeLibBtn = document.querySelector(".close-library");
const saveBtn = document.querySelector(".save");
const saveDiv = document.querySelector(".save-container");
const closeSaveBtn = document.querySelector(".close-save");
const saveInput = document.querySelector('input[type="text"]');
const saveSubmit = document.querySelector(".submit-save");
const closeAdjBtn = document.querySelectorAll(".close-adjustment");
const libraryDefText = document.querySelector(".default-text");
const clearLibBtn = createClearLibBtn();
let initialColors;

// for local storage
let savedPalettes = [];

// Event Listeners
generateBtn.addEventListener("onload", displayRandomColors());
generateBtn.addEventListener("click", displayRandomColors);

sliders.forEach((slider) => {
  slider.addEventListener("input", hslControls); // hsl means hue, saturation, lightness or luminance
});

colorDivs.forEach((div, index) => {
  div.addEventListener("change", () => {
    updateTextUI(index);
  });
});

currentHexes.forEach((hex) => {
  hex.addEventListener("click", () => {
    copyToClipboard(hex);
  });
});

copyPopup.addEventListener("transitionend", () => {
  copyContainer.classList.remove("active");
  copyPopup.classList.remove("active");
});

adjustBtn.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    sliderDivs[index].classList.toggle("active");
  });
});

closeAdjBtn.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    sliderDivs[index].classList.remove("active");
  });
});

lockBtns.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    const activeDiv = colorDivs[index];
    activeDiv.classList.toggle("locked");
    if (activeDiv.classList.contains("locked")) {
      btn.innerHTML = '<i class="fas fa-lock"></i>';
    } else {
      btn.innerHTML = '<i class="fas fa-lock-open"></i>';
    }
  });
});

libraryBtn.addEventListener("click", () => {
  // display library
  displayPopups(libraryDiv);

  // check local storage to display default text
  if (localStorage.getItem("palettes") === null) {
    libraryDefText.classList.add("active");
  } else {
    libraryDefText.classList.remove("active");
    libraryDiv.children[0].appendChild(clearLibBtn);
  }
});

closeLibBtn.addEventListener("click", () => {
  closePopups(libraryDiv);
});

saveBtn.addEventListener("click", () => {
  displayPopups(saveDiv);
});

closeSaveBtn.addEventListener("click", () => {
  closePopups(saveDiv);
});

saveSubmit.addEventListener("click", savePalette);

// Functions

// Return a random hex using Vanilla JS
// function generateHex() {
//     const letters = "0123456789ABCDEF";
//     let hash = "#";
//     for (let i = 0; i < 6; i++){
//         hash += letters[Math.floor(Math.random() * 16)];
//     }
//     return hash;

// }

// function randomColors() {
//     colorDivs.forEach(function (div, currentHexes) {
//         let randomHex = generateHex();
//         currentHexes = div.children[0];
//         // console.log(div);
//         // console.log(currentHexes);
//         div.style.backgroundColor = randomHex;
//         currentHexes.innerText = randomHex;
//     });
// }

// randomColors();

// Generate a color using Chroma JS
function generateHex() {
  const hexColor = chroma.random();
  return hexColor;
}

function displayRandomColors() {
  // initial colors
  initialColors = []; // resets everytime after page refresh

  colorDivs.forEach((div, index) => {
    const hexText = div.children[0];
    const randomColor = generateHex();

    // add generated colors to the array
    if (div.classList.contains("locked")) {
      initialColors.push(hexText.innerText);
      return;
    } else {
      initialColors.push(chroma(randomColor).hex());
    }

    // Add color to the bg and h2s
    div.style.backgroundColor = randomColor;
    hexText.innerText = randomColor;

    // check for contrast
    checkTextContrast(randomColor, hexText);
    const activeDiv = colorDivs[index];
    const icons = activeDiv.querySelectorAll(".controls button");
    for (icon of icons) {
      checkTextContrast(randomColor, icon);
    }

    // initialise color sliders
    const color = chroma(randomColor);
    const sliders = div.querySelectorAll(".sliders input");
    // console.log(sliders);
    const hue = sliders[0];
    const brightness = sliders[1];
    const saturation = sliders[2];

    colorizeSliders(color, hue, brightness, saturation);
  });
}

function checkTextContrast(color, text) {
  const luminance = chroma(color).luminance(); // .luminance() will return a number of 0 to 1 to check for brightness or luminance
  if (luminance > 0.5) {
    text.style.color = "black";
  } else {
    text.style.color = "white";
  }
}

function colorizeSliders(color, hue, brightness, saturation) {
  // Scale Brightness
  const midBright = color.set("hsl.l", 0.5); // hsl.l the .l is for brightness
  const scaleBright = chroma.scale(["black", midBright, "white"]);

  // Scale Saturation
  const noSat = color.set("hsl.s", 0); // hsl.s the .s is for saturation
  const fullSat = color.set("hsl.s", 1);
  const scaleSat = chroma.scale([noSat, color, fullSat]);

  // Update input range colors
  hue.style.backgroundImage = `linear-gradient(to right, rgb(204,75,75), rgb(204,204,75), rgb(75,204,75), rgb(75,204,204), rgb(75,75,204), rgb(204,75,204), rgb(204,75,75)`;
  brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBright(
    0
  )}, ${scaleBright(0.5)}, ${scaleBright(1)})`;
  saturation.style.backgroundImage = `linear-gradient(to right, ${scaleSat(
    0
  )}, ${scaleSat(1)})`; // the numbers inside parentheses are not for accessing index of array

  // to reset the range
  hue.value = color.hsl()[0];
  saturation.value = color.hsl()[1];
  brightness.value = color.hsl()[2];
}

function hslControls(e) {
  // used an attribute called data-* ex. data-hue = 0 to track index and got it by e.target.getAttribute(data-hue)
  const index =
    e.target.getAttribute("data-hue") ||
    e.target.getAttribute("data-bright") ||
    e.target.getAttribute("data-sat");
  // console.log(index);

  // console.log(e.target.parentElement); // to get a specific element use console log to check then use parent element if inside it
  let sliders = e.target.parentElement.querySelectorAll('input[type="range"]');
  // console.log(sliders);
  const hue = sliders[0];
  const brightness = sliders[1];
  const saturation = sliders[2];
  const bgColor = initialColors[index];
  // console.log(bgColor);

  let newColor = chroma(bgColor)
    .set("hsl.h", hue.value)
    .set("hsl.l", brightness.value)
    .set("hsl.s", saturation.value);
  colorDivs[index].style.backgroundColor = newColor;
  colorizeSliders(newColor, hue, brightness, saturation);
}

function updateTextUI(index) {
  // console.log(index);
  const activeDiv = colorDivs[index];
  const color = chroma(activeDiv.style.backgroundColor);
  const textHex = activeDiv.querySelector("h2");
  const icons = activeDiv.querySelectorAll(".controls button");
  textHex.innerText = color.hex();

  // check contrast
  checkTextContrast(color, textHex);
  for (icon of icons) {
    checkTextContrast(color, icon);
  }
}

function copyToClipboard(hex) {
  // copy text to clipboard hack with text area
  const el = document.createElement("textarea");
  el.value = hex.innerText;
  document.body.appendChild(el);
  el.select();
  document.execCommand("copy");
  document.body.removeChild(el);

  //pop up animation
  copyContainer.classList.add("active");
  copyPopup.classList.add("active");
}

function displayPopups(div) {
  div.classList.add("active");
}

function closePopups(div) {
  div.classList.remove("active");
}

function savePalette(e) {
  const name = saveInput.value;
  // console.log(name);
  const colors = [];
  currentHexes.forEach((hex) => {
    colors.push(hex.innerText);
  });

  // generate object
  let paletteNr;
  const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
  if (paletteObjects) {
    paletteNr = paletteObjects.length;
  } else {
    paletteNr = savedPalettes.length;
  }

  const paletteObj = { name, colors, nr: paletteNr };
  savedPalettes.push(paletteObj);

  // save to local storage
  saveToLocal(paletteObj);
  saveInput.value = "";

  // generate palette for library
  const { paletteBtn, palette, title, preview } = createPaletteElements(
    paletteObj
  );

  // add event listener
  paletteBtn.addEventListener("click", (e) => {
    closePopups(libraryDiv);
    libraryLoad = true;
    const paletteIndex = e.target.classList[1];
    initialColors = [];
    savedPalettes[paletteIndex].colors.forEach((color, index) => {
      initialColors.push(color);
      colorDivs[index].style.backgroundColor = color;
      const text = colorDivs[index].children[0];
      checkTextContrast(color, text);
      updateTextUI(index);
      updateSliders(color, index);
    });
  });
  appendToLibrary(palette, title, preview, paletteBtn);
}

function saveToLocal(paletteObj) {
  let localPalettes;
  if (localStorage.getItem("palettes") === null) {
    localPalettes = [];
  } else {
    localPalettes = JSON.parse(localStorage.getItem("palettes"));
  }
  closePopups(saveDiv);

  localPalettes.push(paletteObj);
  localStorage.setItem("palettes", JSON.stringify(localPalettes));
}

function getLocal() {
  if (localStorage.getItem("palettes") === null) {
    localPalettes = [];
  } else {
    const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
    savedPalettes = [...paletteObjects]; // make an array copy
    paletteObjects.forEach((paletteObj) => {
      const { paletteBtn, palette, title, preview } = createPaletteElements(
        paletteObj
      );

      //Attach event to the btn
      paletteBtn.addEventListener("click", (e) => {
        closePopups(libraryDiv);
        const paletteIndex = e.target.classList[1];
        initialColors = [];
        savedPalettes[paletteIndex].colors.forEach((color, index) => {
          initialColors.push(color);
          colorDivs[index].style.backgroundColor = color;
          const text = colorDivs[index].children[0];
          checkTextContrast(color, text);
          updateTextUI(index);
          updateSliders(color, index);
        });
      });
      appendToLibrary(palette, title, preview, paletteBtn);
    });
  }
}

function appendToLibrary(palette, title, preview, paletteBtn) {
  palette.appendChild(title);
  palette.appendChild(preview);
  palette.appendChild(paletteBtn);
  libraryDiv.children[0].appendChild(palette);
}

function createPaletteElements(paletteObj) {
  const palette = document.createElement("div");
  palette.classList.add("custom-palette");
  const title = document.createElement("h4");
  title.innerText = paletteObj.name;
  const preview = document.createElement("div");
  preview.classList.add("small-preview");
  paletteObj.colors.forEach((smallColor) => {
    const smallDiv = document.createElement("div");
    smallDiv.style.backgroundColor = smallColor;
    preview.appendChild(smallDiv);
  });

  const paletteBtn = document.createElement("button");
  paletteBtn.classList.add("pick-palette-btn");
  paletteBtn.classList.add(paletteObj.nr);
  paletteBtn.innerText = "Select";
  return { paletteBtn, palette, title, preview };
}

function createClearLibBtn() {
  // create clear library button
  const btn = document.createElement("button");
  btn.classList.add("clear-library");
  btn.innerText = "Clear Library";
  btn.addEventListener("click", clearLocal);
  return btn;
}

function updateSliders(color, index) {
  const div = colorDivs[index];
  const sliders = div.querySelectorAll(".sliders input");
  const hue = sliders[0];
  const brightness = sliders[1];
  const saturation = sliders[2];
  colorizeSliders(chroma(color), hue, brightness, saturation);
}

function clearLocal() {
  libraryDiv.children[0].removeChild(clearLibBtn);
  localStorage.clear();
  window.location.reload();
}

getLocal();
