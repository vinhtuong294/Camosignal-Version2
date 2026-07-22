const selectors = {
  section: ".js-social-gallery",
  link: ".js-social-gallery-link",
  feedContainer: "[data-instafeed-container]"
};

const SocialGallery = () => {
  let previousFocused = null;

  function init(sectionId) {
    const sections = [...document.querySelectorAll(selectors.section)].filter(
      (section) => !sectionId || section.closest(`#shopify-section-${sectionId}`)
    );

    sections.forEach((section) => {
      if (section.dataset.socialGalleryBound !== "true") {
        section.addEventListener("mousedown", savePreviousFocus);
        section.addEventListener("click", handleLinkInteraction);
        section.dataset.socialGalleryBound = "true";
      }

      observeVisibility(section);
      loadInstafeed(section);
    });
  }

  function observeVisibility(section) {
    if (section.dataset.socialGalleryVisibilityBound === "true") return;

    section.dataset.socialGalleryVisibilityBound = "true";

    if (!("IntersectionObserver" in window)) {
      section.classList.add("social-gallery--in-view");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("social-gallery--in-view");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.15
      }
    );

    observer.observe(section);
  }

  function savePreviousFocus(event) {
    if (event.type === "mousedown") {
      previousFocused = document.activeElement;
    }
  }

  function handleLinkInteraction(event) {
    const link = event.target.closest(selectors.link);

    if (!link) return;
    if (event.type === "click" && event.button !== 0 && event.button !== 1) return;

    link.focus();

    if (previousFocused && previousFocused !== link) {
      setTimeout(() => {
        previousFocused.focus();
        previousFocused = null;
      }, 0);
    }
  }

  async function loadInstafeed(section) {
    const isEnabled = section.dataset.instafeedEnabled === "true";
    const endpoint = section.dataset.instafeedEndpoint;
    const container = section.querySelector(selectors.feedContainer);

    if (!isEnabled || !endpoint || !container) return;
    if (container.dataset.instafeedLoadedFrom === endpoint) return;

    const limit = clamp(Number.parseInt(section.dataset.instafeedLimit || "10", 10), 5, 24);
    const requestUrl = new URL(endpoint);
    requestUrl.searchParams.set("limit", String(limit));

    section.classList.add("social-gallery--feed-loading");
    container.setAttribute("aria-busy", "true");

    try {
      const response = await fetch(requestUrl.toString(), {
        headers: { Accept: "application/json" }
      });

      if (!response.ok) throw new Error(`Instafeed request failed with ${response.status}`);

      const payload = await response.json();
      const posts = Array.isArray(payload.posts) ? payload.posts.slice(0, limit) : [];

      if (!posts.length) throw new Error("Instafeed returned no posts");

      const fragment = document.createDocumentFragment();
      posts.forEach((post) => fragment.append(createPost(post)));

      container.replaceChildren(fragment);
      container.classList.toggle("animate-desktop", posts.length > 5);
      container.classList.toggle("animate-mobile", posts.length > 2);
      container.dataset.instafeedLoadedFrom = endpoint;
      section.dataset.instafeedState = "ready";
    } catch {
      section.dataset.instafeedState = "fallback";
    } finally {
      section.classList.remove("social-gallery--feed-loading");
      container.setAttribute("aria-busy", "false");
    }
  }

  function createPost(post) {
    const column = document.createElement("div");
    column.className = "social-gallery__image-col";

    const link = document.createElement("a");
    link.className =
      "social-gallery__image-wrapper social-gallery__image-wrapper--link focus-visible-outline js-social-gallery-link";
    link.href = post.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", post.caption || "View this post on Instagram");

    const image = document.createElement("img");
    image.className = "social-gallery__image";
    image.src = post.image;
    image.alt = post.alt || post.caption || "Instagram post by Camo Signal";
    image.loading = "lazy";
    image.fetchPriority = "low";
    image.decoding = "async";

    link.append(image);

    if (post.type === "video") {
      link.append(createPlayBadge());
    }

    column.append(link);
    return column;
  }

  function createPlayBadge() {
    const badge = document.createElement("span");
    badge.className = "social-gallery__play-badge";
    badge.setAttribute("aria-hidden", "true");
    badge.innerHTML =
      '<svg viewBox="0 0 24 24" focusable="false"><path d="M8.5 6.7v10.6L17 12 8.5 6.7Z"/></svg>';
    return badge;
  }

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  return Object.freeze({ init });
};

const action = () => {
  window.themeCore.SocialGallery = window.themeCore.SocialGallery || SocialGallery();
  window.themeCore.utils.register(window.themeCore.SocialGallery, "social-gallery");
};

if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}
