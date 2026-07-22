const selectors$1 = {
  iframe: "iframe"
};
async function initVideos(config) {
  const Video2 = window.themeCore.utils.Video;
  return Video2(config).init();
}
function vimeoDisableTabIndexHandler(videos) {
  const VIDEO_TYPES = window.themeCore.utils.VIDEO_TYPES;
  videos.filter((video) => video.type === VIDEO_TYPES.vimeo).forEach(
    (video) => video.player.on("loaded", () => disableTabIndex(video.videoWrapper))
  );
}
function disableTabIndex(videoElement) {
  const iframe = videoElement.querySelector(selectors$1.iframe);
  if (!iframe) {
    return;
  }
  iframe.setAttribute("tabindex", "-1");
}
function playVideo(player, type) {
  const VIDEO_TYPES = window.themeCore.utils.VIDEO_TYPES;
  switch (type) {
    case VIDEO_TYPES.html: {
      player.play();
      break;
    }
    case VIDEO_TYPES.vimeo: {
      player.play();
      break;
    }
    case VIDEO_TYPES.youtube: {
      player.mute();
      player.playVideo();
      break;
    }
    default:
      return;
  }
}
function pauseVideo(player, type) {
  const VIDEO_TYPES = window.themeCore.utils.VIDEO_TYPES;
  switch (type) {
    case VIDEO_TYPES.html: {
      player.pause();
      break;
    }
    case VIDEO_TYPES.vimeo: {
      player.pause();
      break;
    }
    case VIDEO_TYPES.youtube: {
      player.pauseVideo();
      break;
    }
    default:
      return;
  }
}
function soundVideo(player, type, isSound) {
  const VIDEO_TYPES = window.themeCore.utils.VIDEO_TYPES;
  switch (type) {
    case VIDEO_TYPES.html: {
      player.muted = !isSound;
      break;
    }
    case VIDEO_TYPES.vimeo: {
      player.setVolume(isSound ? 1 : 0);
      break;
    }
    case VIDEO_TYPES.youtube: {
      if (isSound) {
        player.unMute();
      } else {
        player.mute();
      }
      break;
    }
    default:
      return;
  }
}
const Video = (videoContainer) => {
  const config = {
    videoContainer,
    options: {
      youtube: {
        autoplay: 0,
        controls: 0,
        showinfo: 0,
        rel: 0,
        playsinline: 1,
        loop: 1
      },
      vimeo: {
        controls: false,
        loop: true,
        muted: true,
        portrait: false,
        title: false,
        keyboard: false,
        byline: false,
        autopause: false
      }
    }
  };
  async function init() {
    const videos = await initVideos(config);
    if (videos && videos.length) {
      vimeoDisableTabIndexHandler(videos);
      return videos;
    }
  }
  return Object.freeze({
    init,
    playVideo,
    pauseVideo,
    soundVideo
  });
};
const Slider = async (section) => {
  const Swiper = window.themeCore.utils.Swiper;
  const A11y = window.themeCore.utils.swiperA11y;
  const Pagination = window.themeCore.utils.swiperPagination;
  const Autoplay = await window.themeCore.utils.getExternalUtil("swiperAutoplay");
  const Parallax = await window.themeCore.utils.getExternalUtil("swiperParallax");
  const EffectFade = await window.themeCore.utils.getExternalUtil("swiperEffectFade");
  const EffectFlip = await window.themeCore.utils.getExternalUtil("swiperEffectFlip");
  const EffectCreative = await window.themeCore.utils.getExternalUtil("swiperEffectCreative");
  Swiper.use([Pagination, Autoplay, Parallax, EffectFade, EffectFlip, EffectCreative, A11y]);
  const selectors2 = {
    slider: ".js-slider",
    slide: ".swiper-slide",
    activeSlide: ".swiper-slide-active",
    sliderSettings: ".js-slider-settings",
    progressbar: ".js-progressbar",
    video: ".js-video",
    videoPosterDesktop: ".js-video-poster-desktop",
    videoPosterMobile: ".js-video-poster-mobile",
    playButton: ".js-video-button-play",
    pauseButton: ".js-video-button-pause",
    soundButton: ".js-slideshow-slide-btn-sound",
    showButtons: "[data-show-button=true]",
    currentVideo: ".swiper-slide.swiper-slide-active .js-video, .js-slider:not(.swiper) .js-video",
    button: ".js-button",
    iframe: "iframe",
    currentVimeoVideo: '.swiper-slide.swiper-slide-active .js-video[data-vimeo-initialized="true"] iframe, .js-slider:not(.swiper) .js-video [data-vimeo-initialized="true"] iframe',
    preview: ".js-slideshow-preview"
  };
  const classes = {
    active: "is-active",
    swiperSlideActive: "swiper-slide-active",
    sound: "is-sound"
  };
  const mediaSmall = window.matchMedia("(max-width: 767px)");
  const slider = section.querySelector(selectors2.slider);
  const sliderSettingsDOM = section.querySelector(selectors2.sliderSettings);
  const pauseButton = section.querySelector(selectors2.pauseButton);
  const playButton = section.querySelector(selectors2.playButton);
  const playVideo2 = await Video(section).playVideo;
  const pauseVideo2 = await Video(section).pauseVideo;
  const soundVideo2 = await Video(section).soundVideo;
  const preview = section.querySelector(selectors2.preview);
  let slides, autoplayTimeoutId, swiperSlider, sliderSettings, progressbarAnimation, autoplayLocked;
  if (slider) {
    slides = [...slider.querySelectorAll(selectors2.slide)];
  }
  async function initSwiper() {
    sliderSettings = getSettings();
    if (!sliderSettings) {
      return;
    }
    swiperSlider = new Swiper(slider, {
      ...sliderSettings
    });
    const progressbar = section.querySelector(selectors2.progressbar);
    progressbarAnimation = progressbar && progressbar.animate([{ width: "0%" }, { width: "100%" }], {
      fill: "forwards",
      easing: "linear",
      duration: sliderSettings.autoplay.delay + sliderSettings.speed
    });
    const activeSlide = section.querySelector(selectors2.activeSlide);
    if (activeSlide) {
      disableTabulationOnNotActiveSlides(activeSlide);
      let activeSlideMedia = slider.querySelectorAll(".js-need-animate-after-load");
      if (activeSlideMedia.length) {
        activeSlideMedia.forEach(function(mediaEl) {
          mediaEl.classList.add("need-animate");
        });
      }
      updatePreview(activeSlide);
    }
    let videos = await Video(section).init();
    if (videos && videos.length) {
      mediaSmall.addEventListener("change", () => {
        initVideos2(videos);
      });
      initVideos2(videos);
      handleButtonSound(videos);
      section.addEventListener("click", (event) => clickHandler(event, videos));
      swiperSlider.on("slidesLengthChange", async function() {
        videos = await Video(section).init();
      });
      window.addEventListener("resize", handleCurrentVimeoVideo);
    }
    swiperSlider.on("slideChange", function(swiper) {
      const activeSlide2 = section.querySelector(`${selectors2.slide}:nth-child(${swiper.activeIndex + 1}`);
      disableTabulationOnNotActiveSlides(activeSlide2);
      updatePreview(activeSlide2);
      if (!videos || !videos.length) {
        return;
      }
      const currentVideo = [...section.querySelectorAll(`${selectors2.slide}:nth-child(${swiper.activeIndex + 1}) ${selectors2.video}`)].filter(
        (video) => getComputedStyle(video).getPropertyValue("display") !== "none"
      );
      const showButtons = !!section.querySelector(`${selectors2.slide}:nth-child(${swiper.activeIndex + 1}) ${selectors2.showButtons}`);
      handleVideoButtons(showButtons, currentVideo);
      handleVideos(videos, currentVideo);
      if (currentVideo && currentVideo.length) {
        currentVideo.forEach((curVideo) => {
          if (!curVideo.dataset.vimeoInitialized) {
            return;
          }
          const iframe = curVideo.querySelector(selectors2.iframe);
          iframe && handleVimeoSize(iframe);
        });
      }
    });
    if (sliderSettings && sliderSettings.autoplay && sliderSettings.autoplay.delay) {
      startAutoplay(true);
      swiperSlider.on("slideChangeTransitionEnd", () => {
        startAutoplay(true);
      });
    }
    initThemeEditorEvents();
  }
  function updatePreview(activeSlide) {
    if (preview && activeSlide) {
      const activeIndex = +activeSlide.dataset.slideIndex;
      const previewImages = [...preview.children];
      const afterLastIndex = (sliderSettings == null ? void 0 : sliderSettings.loop) ? 0 : previewImages.length - 1;
      previewImages.forEach((slidePreview, index) => {
        if (activeIndex < previewImages.length - 1) {
          slidePreview.classList.toggle(classes.active, index === activeIndex + 1);
        } else {
          slidePreview.classList.toggle(classes.active, index === afterLastIndex);
        }
      });
    }
  }
  function startAutoplay(start) {
    if (start) {
      if (autoplayLocked)
        return;
      swiperSlider.autoplay.start();
      autoplayIteration();
      if (progressbarAnimation) {
        progressbarAnimation.currentTime = 0;
        progressbarAnimation.play();
      }
    } else {
      swiperSlider.autoplay.stop();
      clearTimeout(autoplayTimeoutId);
      if (progressbarAnimation) {
        progressbarAnimation.pause();
        progressbarAnimation.currentTime = 0;
      }
    }
  }
  function lockAutoplay(lock) {
    autoplayLocked = lock;
    startAutoplay(!autoplayLocked);
  }
  function initThemeEditorEvents() {
    if (!window.Shopify.designMode) {
      return null;
    }
    window.themeCore.EventBus.listen("shopify:block:select", (event) => {
      if (event.detail.sectionId !== section.id || !event.target.dataset.hasOwnProperty("slideIndex")) {
        return null;
      }
      if (swiperSlider && swiperSlider.initialized) {
        swiperSlider.slideToLoop(event.target.dataset.slideIndex);
        if (sliderSettings && sliderSettings.autoplay && sliderSettings.autoplay.delay) {
          lockAutoplay(true);
        }
      }
    });
    window.themeCore.EventBus.listen("shopify:block:deselect", (event) => {
      if (event.detail.sectionId !== section.id || !event.target.dataset.hasOwnProperty("slideIndex")) {
        return null;
      }
      if (swiperSlider && swiperSlider.initialized) {
        if (sliderSettings && sliderSettings.autoplay && sliderSettings.autoplay.delay) {
          lockAutoplay(false);
        }
      }
    });
  }
  function getSettings() {
    try {
      return JSON.parse(sliderSettingsDOM.textContent);
    } catch {
      return null;
    }
  }
  function init() {
    if (slider && sliderSettingsDOM) {
      setIntersectionObserver(initSwiper);
      return;
    } else if (slides && slides.length === 1) {
      slides[0].classList.add(classes.swiperSlideActive);
    }
    setIntersectionObserver(initSingleVideo);
  }
  function handleVideos(videos, currentVideo, initiatorClick) {
    const posterSelector = mediaSmall.matches ? selectors2.videoPosterMobile : selectors2.videoPosterDesktop;
    if (!videos) {
      return;
    }
    videos.forEach((video) => {
      let isCurrentVideo = currentVideo.some((videoItem) => video.videoWrapper === videoItem && (JSON.parse(videoItem.dataset.autoplay) || initiatorClick));
      if (currentVideo && currentVideo.length && isCurrentVideo) {
        currentVideo.forEach((curVideo) => {
          if (video.videoWrapper === curVideo && (JSON.parse(curVideo.dataset.autoplay) || initiatorClick)) {
            const poster = curVideo.closest(selectors2.slide).querySelector(posterSelector);
            playVideo2(video.player, video.type);
            setTimeout(() => {
              const slideActive = section.querySelector(selectors2.activeSlide);
              const soundButton = slideActive.querySelector(selectors2.soundButton);
              soundVideo2(video.player, video.type, soundButton.classList.contains(classes.sound));
            }, 10);
            if (poster) {
              setTimeout(() => poster.remove(), 200);
            }
          }
        });
        return;
      }
      pauseVideo2(video.player, video.type);
    });
  }
  function playCurrentVideo(videos, initiatorClick) {
    const currentVideo = [...section.querySelectorAll(selectors2.currentVideo)].filter((video) => getComputedStyle(video).getPropertyValue("display") !== "none");
    handleVideos(videos, currentVideo, initiatorClick);
  }
  function pauseVideos(videos) {
    videos.forEach((videoObj) => {
      pauseVideo2(videoObj.player, videoObj.type);
    });
  }
  async function initSingleVideo() {
    let videos = await Video(section).init();
    const showButtons = !!section.querySelector(`${selectors2.showButtons}`);
    const currentVideo = [...section.querySelectorAll(`${selectors2.video}`)].filter((video) => getComputedStyle(video).getPropertyValue("display") !== "none");
    handleVideoButtons(showButtons, currentVideo);
    section.addEventListener("click", (event) => clickHandler(event, videos));
    playCurrentVideo(videos);
    window.addEventListener("resize", handleCurrentVimeoVideo);
    mediaSmall.addEventListener("change", () => {
      playCurrentVideo(videos);
      handleVideoButtons(showButtons, currentVideo);
    });
  }
  function handleVideoButtons(show, currentVideo) {
    currentVideo = currentVideo || [...section.querySelectorAll(selectors2.currentVideo)].filter((video) => getComputedStyle(video).getPropertyValue("display") !== "none");
    if (currentVideo && currentVideo.length && !JSON.parse(currentVideo[0].dataset.autoplay)) {
      pauseButton.classList.remove(classes.active);
      if (show) {
        playButton.classList.add(classes.active);
        return;
      }
      playButton.classList.remove(classes.active);
      return;
    }
    playButton.classList.remove(classes.active);
    if (show) {
      pauseButton.classList.add(classes.active);
      return;
    }
    pauseButton.classList.remove(classes.active);
  }
  function clickHandler(event, videos) {
    const pauseButtonCurrent = event.target.closest(selectors2.pauseButton);
    if (pauseButtonCurrent) {
      pauseButton.classList.remove(classes.active);
      playButton.classList.add(classes.active);
      pauseVideos(videos);
      return;
    }
    const playButtonCurrent = event.target.closest(selectors2.playButton);
    if (playButtonCurrent) {
      pauseButton.classList.add(classes.active);
      playButton.classList.remove(classes.active);
      playCurrentVideo(videos, true);
    }
  }
  function initVideos2(videos) {
    const showButtons = !!section.querySelector(`${selectors2.slide}${selectors2.activeSlide} ${selectors2.showButtons}`);
    handleVideoButtons(showButtons);
    playCurrentVideo(videos);
  }
  function disableTabulationOnNotActiveSlides(activeSlide) {
    const slides2 = [...section.querySelectorAll(selectors2.slide)];
    slides2.forEach((slide) => {
      const buttons = slide.querySelectorAll(selectors2.button);
      if (!buttons.length) {
        return;
      }
      if (slide === activeSlide) {
        buttons.forEach((button) => button.setAttribute("tabindex", 0));
        return;
      }
      buttons.forEach((button) => button.setAttribute("tabindex", -1));
    });
  }
  function setIntersectionObserver(handler) {
    const observer = new IntersectionObserver(
      (entries, observer2) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handler();
            observer2.unobserve(section);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(section);
    initFirstVimeoAppearance();
  }
  function handleButtonSound(videos) {
    section.addEventListener("click", (e) => {
      const btnSound = e.target.closest(selectors2.soundButton);
      if (!btnSound)
        return;
      const currentVideo = [...section.querySelectorAll(selectors2.currentVideo)].filter((video) => getComputedStyle(video).getPropertyValue("display") !== "none");
      const slideActive = btnSound.closest(selectors2.activeSlide);
      if (!slideActive)
        return;
      btnSound.classList.toggle(classes.sound);
      const hasSound = btnSound.classList.contains(classes.sound);
      const videoMute = window.themeCore.translations.get("general.accessibility.video_mute");
      const videoSound = window.themeCore.translations.get("general.accessibility.video_sound");
      const videoSoundAriaLabel = hasSound ? videoMute : videoSound;
      btnSound.setAttribute("aria-label", videoSoundAriaLabel);
      videos.forEach((video) => {
        let isCurrentVideo = currentVideo.some((videoItem) => video.videoWrapper === videoItem);
        if (currentVideo && currentVideo.length && isCurrentVideo) {
          currentVideo.forEach((curVideo) => {
            if (video.videoWrapper === curVideo) {
              soundVideo2(video.player, video.type, hasSound);
            }
          });
        }
      });
    });
  }
  function handleVimeoSize(iframe) {
    if (!iframe) {
      return;
    }
    const iframeHeight = iframe.offsetHeight;
    const videoHeight = window.innerWidth * 0.5625;
    if (videoHeight >= iframeHeight) {
      iframe.style.setProperty("--scale", 1);
      return;
    }
    iframe.style.setProperty("--scale", iframeHeight / videoHeight);
  }
  function handleCurrentVimeoVideo() {
    const currentVimeoVideo = [...section.querySelectorAll(selectors2.currentVimeoVideo)].find((video) => getComputedStyle(video).getPropertyValue("display") !== "none");
    currentVimeoVideo && handleVimeoSize(currentVimeoVideo);
  }
  function initFirstVimeoAppearance() {
    const observer = new MutationObserver((entries) => {
      entries.forEach((mutation) => {
        if (mutation.target.dataset.vimeoInitialized) {
          handleCurrentVimeoVideo();
        }
      });
    });
    observer.observe(section, {
      attributes: true,
      childList: true,
      subtree: true
    });
  }
  function autoplayIteration() {
    clearTimeout(autoplayTimeoutId);
    autoplayTimeoutId = setTimeout(() => {
      swiperSlider.slideNext(sliderSettings.speed);
    }, sliderSettings.autoplay.delay);
  }
  return Object.freeze({
    init
  });
};
const selectors = {
  section: ".js-slideshow",
  videoContainer: ".js-videos"
};
const Slideshow = () => {
  async function init(sectionId) {
    const sections = [...document.querySelectorAll(selectors.section)].filter((element) => !sectionId || sectionId === element.id);
    sections.forEach(async (section) => {
      const slider = await Slider(section);
      slider.init();
    });
  }
  return Object.freeze({
    init
  });
};
const action = () => {
  window.themeCore.Slideshow = window.themeCore.Slideshow || Slideshow();
  window.themeCore.utils.register(window.themeCore.Slideshow, "slideshow");
};
if (window.themeCore && window.themeCore.loaded) {
  action();
} else {
  document.addEventListener("theme:all:loaded", action, { once: true });
}
