const selectors = {
  section: ".js-quiz-section",
  nextStepButton: ".js-quiz-next-step-button",
  previousStepButton: ".js-quiz-prev-step-button",
  previousStepButtonWrapper: ".js-quiz-prev-step-button-wrapper",
  nameInput: ".js-quiz-name-input",
  namePreview: ".js-quiz-name-preview",
  resultsName: ".js-quiz-results-name",
  answerInput: ".js-quiz-answer-input",
  submitButton: ".js-quiz-submit-button",
  noResults: ".js-quiz-no-results-text",
  resultsProductsGrid: ".js-quiz-results-products",
  retryButton: ".js-quiz-retry-button"
};
const Quiz = () => {
  const cssClasses = window.themeCore.utils.cssClasses;
  let sections = [];
  function init(sectionId) {
    sections = [...document.querySelectorAll(selectors.section)].filter((section) => !sectionId || section.closest(`#shopify-section-${sectionId}`));
    sections.forEach((section) => {
      setupEventListeners(section);
    });
  }
  function setupEventListeners(sectionEl) {
    sectionEl.addEventListener("click", function(e) {
      const nextStepButton = e.target.closest(selectors.nextStepButton);
      const prevStepButton = e.target.closest(selectors.previousStepButton);
      if (nextStepButton) {
        activateNextStep(nextStepButton);
        return;
      }
      if (prevStepButton) {
        activatePreviousStep(sectionEl);
        return;
      }
    });
    sectionEl.addEventListener("change", function(e) {
      const answerInput = e.target.closest(selectors.answerInput);
      if (answerInput) {
        answersInputHandler(sectionEl, answerInput);
      }
    });
    inputNameHandler(sectionEl);
    submitResultsHandler(sectionEl);
    retryButtonHandler(sectionEl);
  }
  function activatePreviousStep(sectionEl) {
    const currentStep = sectionEl.querySelector("[data-step].is-active");
    if (!currentStep) {
      return;
    }
    const previousStep = currentStep.previousElementSibling;
    if (!previousStep.hasAttribute("data-step")) {
      return;
    }
    currentStep.classList.remove(cssClasses.active);
    previousStep.classList.add(cssClasses.active);
    if (previousStep.getAttribute("data-step") === "start_screen") {
      sectionEl.querySelector(selectors.previousStepButtonWrapper).classList.add(cssClasses.hidden);
    }
  }
  function activateNextStep(stepButton) {
    if (!stepButton) {
      return;
    }
    const currentStep = stepButton.closest("[data-step]");
    const nextStep = currentStep.nextElementSibling;
    const section = stepButton.closest(selectors.section);
    const prevButtonWrapper = section.querySelector(selectors.previousStepButtonWrapper);
    if (!currentStep || !nextStep || !nextStep.hasAttribute("data-step")) {
      return;
    }
    currentStep.classList.remove(cssClasses.active);
    nextStep.classList.add(cssClasses.active);
    if (prevButtonWrapper) {
      prevButtonWrapper.classList.remove(cssClasses.hidden);
    }
  }
  function inputNameHandler(sectionEl) {
    if (!sectionEl) {
      return;
    }
    const nameInput = sectionEl.querySelector(selectors.nameInput);
    const namePreview = sectionEl.querySelector(selectors.namePreview);
    const resultsName = sectionEl.querySelector(selectors.resultsName);
    if (!nameInput) {
      return;
    }
    nameInput.addEventListener("input", function(e) {
      const inputValue = e.target.value;
      if (resultsName) {
        resultsName.textContent = inputValue;
      }
      if (!namePreview) {
        return;
      }
      namePreview.textContent = inputValue;
      if (inputValue === "") {
        namePreview.textContent = namePreview.getAttribute("data-default");
      }
    });
  }
  function answersInputHandler(sectionEl, answerInput) {
    if (!sectionEl || !answerInput) {
      return;
    }
    const currentStep = answerInput.closest("[data-step].is-active");
    if (!currentStep) {
      return;
    }
    const isSomeInputChecked = !!currentStep.querySelector(`${selectors.answerInput}:checked`);
    const nextStepButton = currentStep.querySelector(selectors.nextStepButton);
    if (!nextStepButton) {
      return;
    }
    nextStepButton.disabled = !isSomeInputChecked;
  }
  function submitResultsHandler(sectionEl) {
    if (!sectionEl) {
      return;
    }
    const submitButton = sectionEl.querySelector(selectors.submitButton);
    const tagsLogic = sectionEl.getAttribute("data-tags-logic");
    const collectionHandle = sectionEl.getAttribute("data-collection");
    if (!submitButton) {
      return;
    }
    let collectionUrl = `${collectionHandle}`;
    submitButton.addEventListener("click", async function() {
      const currentStep = sectionEl.querySelector("[data-step].is-active");
      const stepResults = sectionEl.querySelector("[data-step='results']");
      const checkedAnswers = sectionEl.querySelectorAll(`${selectors.answerInput}:checked`);
      const answersArray = [...checkedAnswers].map((elem) => elem.value);
      const tagsParam = answersArray.join("+");
      const fetchURL = `${collectionUrl}/${tagsParam}?section_id=collection-template`;
      let productCards = [];
      submitButton.disabled = true;
      if (tagsLogic === "or") {
        const fetchURLs = answersArray.map((tag) => `${collectionUrl}/${tag}?section_id=collection-template`);
        productCards = (await Promise.allSettled(fetchURLs.map(async (url) => {
          const resultsDOM = await getResults(url);
          const fetchedProducts = resultsDOM.querySelector(".js-grid-wrapper");
          const cards = fetchedProducts.querySelectorAll(".js-product-card");
          return cards;
        }))).map(({ value }) => [...value ?? []]).flat().filter((item, index, array) => {
          var _a;
          const currentProductHandle = (_a = item.querySelector("[data-product-card-handle]")) == null ? void 0 : _a.getAttribute("data-product-card-handle");
          return index === array.findIndex((element) => {
            return !!element.querySelector(`[data-product-card-handle="${currentProductHandle}"]`);
          });
        });
      } else {
        const resultsDOM = await getResults(fetchURL);
        const fetchedProducts = resultsDOM.querySelector(".js-grid-wrapper");
        productCards = (fetchedProducts == null ? void 0 : fetchedProducts.querySelectorAll(".js-product-card")) ?? [];
      }
      if (!productCards.length) {
        stepResults.querySelector(selectors.noResults).classList.remove(cssClasses.hidden);
      } else {
        const resultsProductsGrid = sectionEl.querySelector(selectors.resultsProductsGrid);
        resultsProductsGrid.innerHTML = "";
        productCards.forEach((productCard) => {
          const itemWrapper = document.createElement("div");
          itemWrapper.classList.add("quiz__product-col");
          itemWrapper.appendChild(productCard);
          resultsProductsGrid.appendChild(itemWrapper);
        });
        resultsProductsGrid.classList.remove(cssClasses.hidden);
      }
      submitButton.disabled = false;
      currentStep.classList.remove(cssClasses.active);
      stepResults.classList.add(cssClasses.active);
      window.scrollTo({
        top: sectionEl.offsetTop - 90,
        behavior: "smooth"
      });
    });
  }
  function retryButtonHandler(sectionEl) {
    if (!sectionEl) {
      return;
    }
    const retryButton = sectionEl.querySelector(selectors.retryButton);
    if (!retryButton) {
      return;
    }
    retryButton.addEventListener("click", function() {
      const firstStep = sectionEl.querySelector("[data-step]");
      const resultsStep = sectionEl.querySelector("[data-step='results']");
      const questionsStep = sectionEl.querySelectorAll("[data-step='question']");
      const noResultsMessage = sectionEl.querySelector(selectors.noResults);
      const resultsProductsGrid = sectionEl.querySelector(selectors.resultsProductsGrid);
      const checkedAnswers = sectionEl.querySelectorAll(`${selectors.answerInput}:checked`);
      resultsStep.classList.remove(cssClasses.active);
      firstStep.classList.add(cssClasses.active);
      noResultsMessage.classList.add(cssClasses.hidden);
      resultsProductsGrid.innerHTML = "";
      resultsProductsGrid.classList.add(cssClasses.hidden);
      sectionEl.querySelector(selectors.previousStepButtonWrapper).classList.add(cssClasses.hidden);
      checkedAnswers.forEach(function(answerInput) {
        answerInput.checked = false;
      });
      questionsStep.forEach(function(step) {
        step.querySelector(selectors.nextStepButton).disabled = true;
      });
    });
  }
  async function getResults(url) {
    const response = await fetch(url, { redirect: "manual" });
    const resText = await response.text();
    return new DOMParser().parseFromString(resText, "text/html");
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.Quiz = window.themeCore.Quiz || Quiz();
  window.themeCore.utils.register(window.themeCore.Quiz, "quiz");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}
