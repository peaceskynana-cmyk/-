const screens = document.querySelectorAll("[data-screen]");
const navSteps = document.querySelectorAll("[data-nav]");
const fileInput = document.querySelector("#worksheetFile");
const cameraInput = document.querySelector("#cameraFile");
const worksheetPreview = document.querySelector("#worksheetPreview");
const loadingCard = document.querySelector("#loadingCard");
const saveMessage = document.querySelector("#saveMessage");
const completeMessage = document.querySelector("#completeMessage");
const cameraPanel = document.querySelector("#cameraPanel");
const cameraVideo = document.querySelector("#cameraVideo");
const cameraCanvas = document.querySelector("#cameraCanvas");
const cameraMessage = document.querySelector("#cameraMessage");
const retakeButton = document.querySelector("[data-action='retake-photo']");
const resetPhotoButton = document.querySelector("[data-action='reset-photo']");
const bookToc = document.querySelector("#bookToc");
const bookRecipePreview = document.querySelector("#bookRecipePreview");
const savedRecipeChips = document.querySelector("#savedRecipeChips");
const savedRecipeCount = document.querySelector("#savedRecipeCount");
const printBook = document.querySelector("#printBook");

let cameraStream = null;
const defaultWorksheetImage = "assets/worksheet-preview.png";

const sampleRecipes = [
  {
    id: "sample-1",
    dishName: "おばあちゃんの煮物",
    cookPerson: "おばあちゃん",
    ingredients: "大根、にんじん、こんにゃく、鶏肉、しょうゆ、みりん、砂糖",
    amounts: "大根 1/2本\nにんじん 1本\nこんにゃく 1枚\n鶏肉 200g\nしょうゆ 大さじ2くらい\nみりん 大さじ2くらい\n砂糖 少し",
    steps: "1. 野菜を食べやすい大きさに切る\n2. 鍋で具材を軽く炒める\n3. 調味料を入れて煮込む\n4. 味がしみるまで少し置く",
    tips: "少し甘めにするのが家の味。味見しながら調整する。",
    memory: "家族が集まる日にいつも作っていた。弟がよくおかわりしていた。",
    quote: "みんなで食べると、いつもの味が一番おいしい。",
  },
  {
    id: "sample-2",
    dishName: "お母さんの豚汁",
    cookPerson: "お母さん",
    ingredients: "豚肉、大根、にんじん、ごぼう、ねぎ、味噌",
    amounts: "豚肉 200g\n大根 1/4本\nにんじん 1本\nごぼう 1/2本\n味噌 おたま半分くらい",
    steps: "1. 野菜を薄めに切る\n2. 豚肉と根菜を炒める\n3. 水を入れてやわらかくなるまで煮る\n4. 火を弱めて味噌を溶く",
    tips: "最後にねぎを入れると香りが立つ。次の日もおいしい。",
    memory: "寒い日の夕ごはんによく出ていた。部活帰りに食べるとほっとした。",
    quote: "あったかいうちに食べなさい、という声まで思い出す味。",
  },
  {
    id: "sample-3",
    dishName: "父の休日カレー",
    cookPerson: "お父さん",
    ingredients: "豚肉、玉ねぎ、にんじん、じゃがいも、カレールー",
    amounts: "豚肉 250g\n玉ねぎ 2個\nにんじん 1本\nじゃがいも 3個\nカレールー 1/2箱",
    steps: "1. 玉ねぎをじっくり炒める\n2. 肉と野菜を入れて炒める\n3. 水を加えて煮込む\n4. 火を止めてルーを溶かす",
    tips: "玉ねぎを焦がさないようにゆっくり炒めるのが父のこだわり。",
    memory: "日曜の昼に台所からカレーの匂いがしてくると、休日だと感じた。",
    quote: "急がず作ると、ちゃんとうまくなる。",
  },
];

let savedRecipes = loadSavedRecipes();

function loadSavedRecipes() {
  try {
    const stored = JSON.parse(localStorage.getItem("gohan-editor-recipes") || "null");
    return Array.isArray(stored) && stored.length ? stored : [...sampleRecipes];
  } catch {
    return [...sampleRecipes];
  }
}

function persistSavedRecipes() {
  localStorage.setItem("gohan-editor-recipes", JSON.stringify(savedRecipes));
}

async function openCamera() {
  cameraPanel.hidden = false;
  cameraMessage.textContent = "カメラを起動しています。";

  if (!navigator.mediaDevices?.getUserMedia) {
    cameraMessage.textContent = "このブラウザではカメラ撮影に対応していません。ファイル選択を使ってください。";
    return;
  }

  if (cameraStream) {
    closeCamera();
    cameraPanel.hidden = false;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } },
      audio: false,
    });
  } catch {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch {
      cameraMessage.textContent = "カメラを起動できませんでした。ブラウザの権限を確認するか、ファイル選択を使ってください。";
      return;
    }
  }

  cameraVideo.srcObject = cameraStream;
  cameraMessage.textContent = "外カメラ優先で起動しました。ワークシート全体が入るように撮影してください。";
}

function closeCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
  }
  cameraStream = null;
  cameraVideo.srcObject = null;
  cameraPanel.hidden = true;
}

function capturePhoto() {
  if (!cameraStream || !cameraVideo.videoWidth) {
    cameraMessage.textContent = "カメラ映像がまだ準備できていません。少し待ってから撮影してください。";
    return;
  }

  cameraCanvas.width = cameraVideo.videoWidth;
  cameraCanvas.height = cameraVideo.videoHeight;
  const context = cameraCanvas.getContext("2d");
  context.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
  worksheetPreview.src = cameraCanvas.toDataURL("image/jpeg", 0.86);
  cameraMessage.textContent = "撮影した画像をプレビューに反映しました。撮り直しやリセットもできます。";
  retakeButton.hidden = false;
  resetPhotoButton.hidden = false;
}

function resetPhoto() {
  closeCamera();
  worksheetPreview.src = defaultWorksheetImage;
  fileInput.value = "";
  cameraInput.value = "";
  retakeButton.hidden = true;
  resetPhotoButton.hidden = true;
}

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === name);
  });
  navSteps.forEach((step) => {
    step.classList.toggle("is-active", step.dataset.nav === name);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getFormData() {
  return {
    id: `recipe-${Date.now()}`,
    dishName: document.querySelector("#dishName").value.trim(),
    cookPerson: document.querySelector("#cookPerson").value.trim(),
    ingredients: document.querySelector("#ingredients").value.trim(),
    amounts: document.querySelector("#amounts").value.trim(),
    steps: document.querySelector("#steps").value.trim(),
    tips: document.querySelector("#tips").value.trim(),
    memory: document.querySelector("#memory").value.trim(),
    quote: document.querySelector("#quote").value.trim(),
  };
}

function lines(text) {
  return String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function recipeMarkup(data) {
  const stepItems = lines(data.steps).map((item) => item.replace(/^\d+\.\s*/, ""));

  return `
    <div class="photo-placeholder" aria-label="料理写真プレースホルダー">
      <span></span><span></span><span></span>
    </div>
    <div class="recipe-heading">
      <p>${escapeHtml(data.cookPerson)}の味</p>
      <h3>${escapeHtml(data.dishName)}</h3>
    </div>
    <div class="recipe-columns">
      <section>
        <h4>材料</h4>
        <p>${escapeHtml(data.ingredients)}</p>
        <h4>分量</h4>
        <ul>${lines(data.amounts).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </section>
      <section>
        <h4>手順</h4>
        <ol>${stepItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
      </section>
    </div>
    <section class="note-section">
      <h4>味のコツ・ポイント</h4>
      <p>${escapeHtml(data.tips)}</p>
    </section>
    <section class="note-section">
      <h4>料理にまつわる思い出</h4>
      <p>${escapeHtml(data.memory)}</p>
    </section>
    <section class="quote-section">
      <h4>家族に残したい一言</h4>
      <p>${escapeHtml(data.quote)}</p>
    </section>
  `;
}

function renderRecipeObject(target, data, compact = false) {
  target.innerHTML = recipeMarkup(data);
  target.classList.toggle("compact", compact);
}

function renderRecipePage(target, compact = false) {
  renderRecipeObject(target, getFormData(), compact);
}

function renderOriginalText() {
  const data = getFormData();
  document.querySelector("#originalText").innerHTML = `
    <dt>料理名</dt><dd>${escapeHtml(data.dishName)}</dd>
    <dt>作ってくれた人</dt><dd>${escapeHtml(data.cookPerson)}</dd>
    <dt>分量</dt><dd>${lines(data.amounts).map(escapeHtml).join("<br>")}</dd>
    <dt>味のコツ</dt><dd>${escapeHtml(data.tips)}</dd>
    <dt>思い出</dt><dd>${escapeHtml(data.memory)}</dd>
    <dt>一言</dt><dd>${escapeHtml(data.quote)}</dd>
  `;
}

function renderSavedRecipes() {
  bookToc.innerHTML = "";
  savedRecipeChips.innerHTML = "";
  savedRecipeCount.textContent = `${savedRecipes.length}件のレシピが保存されています`;

  savedRecipes.forEach((recipe) => {
    const tocItem = document.createElement("li");
    tocItem.textContent = recipe.dishName;
    bookToc.append(tocItem);

    const chip = document.createElement("span");
    chip.textContent = `${recipe.cookPerson}：${recipe.dishName}`;
    savedRecipeChips.append(chip);
  });

  renderRecipeObject(bookRecipePreview, savedRecipes.at(-1), true);
}

function addCurrentRecipeToBook() {
  const recipe = getFormData();
  savedRecipes.push(recipe);
  persistSavedRecipes();
  renderSavedRecipes();
  completeMessage.textContent = `${recipe.dishName}をレシピ本に追加しました。`;
}

function renderPrintBook() {
  printBook.innerHTML = "";

  const cover = document.createElement("article");
  cover.className = "print-page print-cover";
  cover.innerHTML = `
    <p>ごはん便り</p>
    <h2>福山家の味の記録</h2>
    <span>${savedRecipes.length}件のレシピ</span>
  `;
  printBook.append(cover);

  savedRecipes.forEach((recipe, index) => {
    const page = document.createElement("article");
    page.className = "print-page";
    page.innerHTML = `
      <p class="page-number">${index + 1}</p>
      <div class="recipe-sheet print-recipe">${recipeMarkup(recipe)}</div>
    `;
    printBook.append(page);
  });
}

document.addEventListener("click", (event) => {
  const screenLink = event.target.closest("[data-screen-link]");
  const nav = event.target.closest("[data-nav]");
  const action = event.target.closest("[data-action]");

  if (screenLink) {
    if (screenLink.dataset.screenLink === "book") {
      renderSavedRecipes();
    }
    showScreen(screenLink.dataset.screenLink);
    return;
  }

  if (nav) {
    showScreen(nav.dataset.nav);
    return;
  }

  if (!action) return;

  if (action.dataset.action === "edit-work") {
    showScreen("upload");
  }

  if (action.dataset.action === "start-ocr") {
    loadingCard.hidden = false;
    window.setTimeout(() => {
      loadingCard.hidden = true;
      showScreen("review");
    }, 900);
  }

  if (action.dataset.action === "open-camera") {
    openCamera();
  }

  if (action.dataset.action === "close-camera") {
    closeCamera();
  }

  if (action.dataset.action === "capture-photo") {
    capturePhoto();
  }

  if (action.dataset.action === "retake-photo") {
    openCamera();
  }

  if (action.dataset.action === "reset-photo") {
    resetPhoto();
  }

  if (action.dataset.action === "save-review") {
    saveMessage.textContent = "修正内容を保存しました。要確認の表現は、レシピページ化の前に再度確認してください。";
  }

  if (action.dataset.action === "make-layout") {
    renderRecipePage(document.querySelector("#layoutPreview"));
    showScreen("layout");
  }

  if (action.dataset.action === "go-proof") {
    renderOriginalText();
    renderRecipePage(document.querySelector("#proofPreview"), true);
    showScreen("proof");
  }

  if (action.dataset.action === "keep-original") {
    document.querySelector("#quote").value = "みんなで食べると、いつもの味が一番おいしい。";
    renderOriginalText();
    renderRecipePage(document.querySelector("#proofPreview"), true);
  }

  if (action.dataset.action === "soften-text") {
    document.querySelector("#tips").value = "少し甘めにするのが家の味。味見をしながら、家族の好みに合わせて調整する。";
    renderOriginalText();
    renderRecipePage(document.querySelector("#proofPreview"), true);
  }

  if (action.dataset.action === "add-to-book") {
    addCurrentRecipeToBook();
    showScreen("book");
  }

  if (action.dataset.action === "open-print-preview") {
    renderPrintBook();
    showScreen("print");
  }

  if (action.dataset.action === "print-all-recipes") {
    renderPrintBook();
    window.print();
  }

  if (action.dataset.action === "book-message") {
    completeMessage.textContent = "プレビュー用の製本データを作成しました。内容確認後、製本準備へ進めます。";
  }

  if (action.dataset.action === "book-ready") {
    completeMessage.textContent = "製本準備が完了しました。家族の味の記録をお届けする準備ができました。";
  }
});

fileInput.addEventListener("change", () => {
  const [file] = fileInput.files;
  if (!file) return;
  worksheetPreview.src = URL.createObjectURL(file);
  retakeButton.hidden = false;
  resetPhotoButton.hidden = false;
});

cameraInput.addEventListener("change", () => {
  const [file] = cameraInput.files;
  if (!file) return;
  worksheetPreview.src = URL.createObjectURL(file);
  retakeButton.hidden = false;
  resetPhotoButton.hidden = false;
});

renderSavedRecipes();
