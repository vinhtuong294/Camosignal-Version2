const selectors = {
  showPasswordButton: ".js-show-password-button",
  showPasswordInput: ".js-show-password-input",
  showPasswordWrapper: ".js-show-password-wrapper"
};
const CustomersResetTemplate = () => {
  function init() {
    document.addEventListener("click", (event) => {
      const showPasswordWrapper = event.target.closest(selectors.showPasswordWrapper);
      if (!showPasswordWrapper)
        return null;
      const showPasswordButton = event.target.closest(selectors.showPasswordButton);
      if (!showPasswordButton)
        return null;
      showPasswordButton.classList.toggle("active");
      const passwordInput = showPasswordWrapper.querySelector(selectors.showPasswordInput);
      if (!passwordInput)
        return null;
      passwordInput && passwordInput.type === "password" ? passwordInput.type = "text" : passwordInput.type = "password";
    });
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.CustomersResetTemplate = window.themeCore.CustomersResetTemplate || CustomersResetTemplate();
  window.themeCore.utils.register(window.themeCore.CustomersResetTemplate, "reset-template");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}
