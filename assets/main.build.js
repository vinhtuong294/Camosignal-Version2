import { d as disableTabulationOnNotActiveSlidesWithModel } from "./disableTabulationOnNotActiveSlidesWithModel-38e80234.js";
import { e as elementChildren, c as createElement, m as makeElementsArray, f as elementOuterSize, h as elementIndex, i as elementParents, j as getWindow, k as elementOffset, l as getTranslate, g as getDocument, o as isObject, p as extend, q as elementStyle, r as deleteProps, s as setCSSProperty, t as elementNextAll, u as elementPrevAll, v as animateCSSModeScroll, n as nextTick, w as showWarning, x as elementIsChildOf, y as now, M as Mousewheel } from "./mousewheel-6f244014.js";
function createElementIfNotDefined(swiper, originalParams, params, checkProps) {
  if (swiper.params.createElements) {
    Object.keys(checkProps).forEach((key) => {
      if (!params[key] && params.auto === true) {
        let element = elementChildren(swiper.el, `.${checkProps[key]}`)[0];
        if (!element) {
          element = createElement("div", checkProps[key]);
          element.className = checkProps[key];
          swiper.el.append(element);
        }
        params[key] = element;
        originalParams[key] = element;
      }
    });
  }
  return params;
}
function Navigation(_ref) {
  let {
    swiper,
    extendParams,
    on: on2,
    emit
  } = _ref;
  extendParams({
    navigation: {
      nextEl: null,
      prevEl: null,
      hideOnClick: false,
      disabledClass: "swiper-button-disabled",
      hiddenClass: "swiper-button-hidden",
      lockClass: "swiper-button-lock",
      navigationDisabledClass: "swiper-navigation-disabled"
    }
  });
  swiper.navigation = {
    nextEl: null,
    prevEl: null
  };
  function getEl(el) {
    let res;
    if (el && typeof el === "string" && swiper.isElement) {
      res = swiper.el.querySelector(el) || swiper.hostEl.querySelector(el);
      if (res)
        return res;
    }
    if (el) {
      if (typeof el === "string")
        res = [...document.querySelectorAll(el)];
      if (swiper.params.uniqueNavElements && typeof el === "string" && res && res.length > 1 && swiper.el.querySelectorAll(el).length === 1) {
        res = swiper.el.querySelector(el);
      } else if (res && res.length === 1) {
        res = res[0];
      }
    }
    if (el && !res)
      return el;
    return res;
  }
  function toggleEl(el, disabled) {
    const params = swiper.params.navigation;
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      if (subEl) {
        subEl.classList[disabled ? "add" : "remove"](...params.disabledClass.split(" "));
        if (subEl.tagName === "BUTTON")
          subEl.disabled = disabled;
        if (swiper.params.watchOverflow && swiper.enabled) {
          subEl.classList[swiper.isLocked ? "add" : "remove"](params.lockClass);
        }
      }
    });
  }
  function update2() {
    const {
      nextEl,
      prevEl
    } = swiper.navigation;
    if (swiper.params.loop) {
      toggleEl(prevEl, false);
      toggleEl(nextEl, false);
      return;
    }
    toggleEl(prevEl, swiper.isBeginning && !swiper.params.rewind);
    toggleEl(nextEl, swiper.isEnd && !swiper.params.rewind);
  }
  function onPrevClick(e) {
    e.preventDefault();
    if (swiper.isBeginning && !swiper.params.loop && !swiper.params.rewind)
      return;
    swiper.slidePrev();
    emit("navigationPrev");
  }
  function onNextClick(e) {
    e.preventDefault();
    if (swiper.isEnd && !swiper.params.loop && !swiper.params.rewind)
      return;
    swiper.slideNext();
    emit("navigationNext");
  }
  function init() {
    const params = swiper.params.navigation;
    swiper.params.navigation = createElementIfNotDefined(swiper, swiper.originalParams.navigation, swiper.params.navigation, {
      nextEl: "swiper-button-next",
      prevEl: "swiper-button-prev"
    });
    if (!(params.nextEl || params.prevEl))
      return;
    let nextEl = getEl(params.nextEl);
    let prevEl = getEl(params.prevEl);
    Object.assign(swiper.navigation, {
      nextEl,
      prevEl
    });
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    const initButton = (el, dir) => {
      if (el) {
        el.addEventListener("click", dir === "next" ? onNextClick : onPrevClick);
      }
      if (!swiper.enabled && el) {
        el.classList.add(...params.lockClass.split(" "));
      }
    };
    nextEl.forEach((el) => initButton(el, "next"));
    prevEl.forEach((el) => initButton(el, "prev"));
  }
  function destroy() {
    let {
      nextEl,
      prevEl
    } = swiper.navigation;
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    const destroyButton = (el, dir) => {
      el.removeEventListener("click", dir === "next" ? onNextClick : onPrevClick);
      el.classList.remove(...swiper.params.navigation.disabledClass.split(" "));
    };
    nextEl.forEach((el) => destroyButton(el, "next"));
    prevEl.forEach((el) => destroyButton(el, "prev"));
  }
  on2("init", () => {
    if (swiper.params.navigation.enabled === false) {
      disable();
    } else {
      init();
      update2();
    }
  });
  on2("toEdge fromEdge lock unlock", () => {
    update2();
  });
  on2("destroy", () => {
    destroy();
  });
  on2("enable disable", () => {
    let {
      nextEl,
      prevEl
    } = swiper.navigation;
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    if (swiper.enabled) {
      update2();
      return;
    }
    [...nextEl, ...prevEl].filter((el) => !!el).forEach((el) => el.classList.add(swiper.params.navigation.lockClass));
  });
  on2("click", (_s, e) => {
    let {
      nextEl,
      prevEl
    } = swiper.navigation;
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    const targetEl = e.target;
    let targetIsButton = prevEl.includes(targetEl) || nextEl.includes(targetEl);
    if (swiper.isElement && !targetIsButton) {
      const path = e.path || e.composedPath && e.composedPath();
      if (path) {
        targetIsButton = path.find((pathEl) => nextEl.includes(pathEl) || prevEl.includes(pathEl));
      }
    }
    if (swiper.params.navigation.hideOnClick && !targetIsButton) {
      if (swiper.pagination && swiper.params.pagination && swiper.params.pagination.clickable && (swiper.pagination.el === targetEl || swiper.pagination.el.contains(targetEl)))
        return;
      let isHidden;
      if (nextEl.length) {
        isHidden = nextEl[0].classList.contains(swiper.params.navigation.hiddenClass);
      } else if (prevEl.length) {
        isHidden = prevEl[0].classList.contains(swiper.params.navigation.hiddenClass);
      }
      if (isHidden === true) {
        emit("navigationShow");
      } else {
        emit("navigationHide");
      }
      [...nextEl, ...prevEl].filter((el) => !!el).forEach((el) => el.classList.toggle(swiper.params.navigation.hiddenClass));
    }
  });
  const enable = () => {
    swiper.el.classList.remove(...swiper.params.navigation.navigationDisabledClass.split(" "));
    init();
    update2();
  };
  const disable = () => {
    swiper.el.classList.add(...swiper.params.navigation.navigationDisabledClass.split(" "));
    destroy();
  };
  Object.assign(swiper.navigation, {
    enable,
    disable,
    update: update2,
    init,
    destroy
  });
}
function classesToSelector(classes2) {
  if (classes2 === void 0) {
    classes2 = "";
  }
  return `.${classes2.trim().replace(/([\.:!+\/])/g, "\\$1").replace(/ /g, ".")}`;
}
function Pagination(_ref) {
  let {
    swiper,
    extendParams,
    on: on2,
    emit
  } = _ref;
  const pfx = "swiper-pagination";
  extendParams({
    pagination: {
      el: null,
      bulletElement: "span",
      clickable: false,
      hideOnClick: false,
      renderBullet: null,
      renderProgressbar: null,
      renderFraction: null,
      renderCustom: null,
      progressbarOpposite: false,
      type: "bullets",
      // 'bullets' or 'progressbar' or 'fraction' or 'custom'
      dynamicBullets: false,
      dynamicMainBullets: 1,
      formatFractionCurrent: (number) => number,
      formatFractionTotal: (number) => number,
      bulletClass: `${pfx}-bullet`,
      bulletActiveClass: `${pfx}-bullet-active`,
      modifierClass: `${pfx}-`,
      currentClass: `${pfx}-current`,
      totalClass: `${pfx}-total`,
      hiddenClass: `${pfx}-hidden`,
      progressbarFillClass: `${pfx}-progressbar-fill`,
      progressbarOppositeClass: `${pfx}-progressbar-opposite`,
      clickableClass: `${pfx}-clickable`,
      lockClass: `${pfx}-lock`,
      horizontalClass: `${pfx}-horizontal`,
      verticalClass: `${pfx}-vertical`,
      paginationDisabledClass: `${pfx}-disabled`
    }
  });
  swiper.pagination = {
    el: null,
    bullets: []
  };
  let bulletSize;
  let dynamicBulletIndex = 0;
  function isPaginationDisabled() {
    return !swiper.params.pagination.el || !swiper.pagination.el || Array.isArray(swiper.pagination.el) && swiper.pagination.el.length === 0;
  }
  function setSideBullets(bulletEl, position) {
    const {
      bulletActiveClass
    } = swiper.params.pagination;
    if (!bulletEl)
      return;
    bulletEl = bulletEl[`${position === "prev" ? "previous" : "next"}ElementSibling`];
    if (bulletEl) {
      bulletEl.classList.add(`${bulletActiveClass}-${position}`);
      bulletEl = bulletEl[`${position === "prev" ? "previous" : "next"}ElementSibling`];
      if (bulletEl) {
        bulletEl.classList.add(`${bulletActiveClass}-${position}-${position}`);
      }
    }
  }
  function getMoveDirection(prevIndex, nextIndex, length) {
    prevIndex = prevIndex % length;
    nextIndex = nextIndex % length;
    if (nextIndex === prevIndex + 1) {
      return "next";
    } else if (nextIndex === prevIndex - 1) {
      return "previous";
    }
    return;
  }
  function onBulletClick(e) {
    const bulletEl = e.target.closest(classesToSelector(swiper.params.pagination.bulletClass));
    if (!bulletEl) {
      return;
    }
    e.preventDefault();
    const index = elementIndex(bulletEl) * swiper.params.slidesPerGroup;
    if (swiper.params.loop) {
      if (swiper.realIndex === index)
        return;
      const moveDirection = getMoveDirection(swiper.realIndex, index, swiper.slides.length);
      if (moveDirection === "next") {
        swiper.slideNext();
      } else if (moveDirection === "previous") {
        swiper.slidePrev();
      } else {
        swiper.slideToLoop(index);
      }
    } else {
      swiper.slideTo(index);
    }
  }
  function update2() {
    const rtl = swiper.rtl;
    const params = swiper.params.pagination;
    if (isPaginationDisabled())
      return;
    let el = swiper.pagination.el;
    el = makeElementsArray(el);
    let current;
    let previousIndex;
    const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.slides.length;
    const total = swiper.params.loop ? Math.ceil(slidesLength / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
    if (swiper.params.loop) {
      previousIndex = swiper.previousRealIndex || 0;
      current = swiper.params.slidesPerGroup > 1 ? Math.floor(swiper.realIndex / swiper.params.slidesPerGroup) : swiper.realIndex;
    } else if (typeof swiper.snapIndex !== "undefined") {
      current = swiper.snapIndex;
      previousIndex = swiper.previousSnapIndex;
    } else {
      previousIndex = swiper.previousIndex || 0;
      current = swiper.activeIndex || 0;
    }
    if (params.type === "bullets" && swiper.pagination.bullets && swiper.pagination.bullets.length > 0) {
      const bullets = swiper.pagination.bullets;
      let firstIndex;
      let lastIndex;
      let midIndex;
      if (params.dynamicBullets) {
        bulletSize = elementOuterSize(bullets[0], swiper.isHorizontal() ? "width" : "height", true);
        el.forEach((subEl) => {
          subEl.style[swiper.isHorizontal() ? "width" : "height"] = `${bulletSize * (params.dynamicMainBullets + 4)}px`;
        });
        if (params.dynamicMainBullets > 1 && previousIndex !== void 0) {
          dynamicBulletIndex += current - (previousIndex || 0);
          if (dynamicBulletIndex > params.dynamicMainBullets - 1) {
            dynamicBulletIndex = params.dynamicMainBullets - 1;
          } else if (dynamicBulletIndex < 0) {
            dynamicBulletIndex = 0;
          }
        }
        firstIndex = Math.max(current - dynamicBulletIndex, 0);
        lastIndex = firstIndex + (Math.min(bullets.length, params.dynamicMainBullets) - 1);
        midIndex = (lastIndex + firstIndex) / 2;
      }
      bullets.forEach((bulletEl) => {
        const classesToRemove = [...["", "-next", "-next-next", "-prev", "-prev-prev", "-main"].map((suffix) => `${params.bulletActiveClass}${suffix}`)].map((s) => typeof s === "string" && s.includes(" ") ? s.split(" ") : s).flat();
        bulletEl.classList.remove(...classesToRemove);
      });
      if (el.length > 1) {
        bullets.forEach((bullet) => {
          const bulletIndex = elementIndex(bullet);
          if (bulletIndex === current) {
            bullet.classList.add(...params.bulletActiveClass.split(" "));
          } else if (swiper.isElement) {
            bullet.setAttribute("part", "bullet");
          }
          if (params.dynamicBullets) {
            if (bulletIndex >= firstIndex && bulletIndex <= lastIndex) {
              bullet.classList.add(...`${params.bulletActiveClass}-main`.split(" "));
            }
            if (bulletIndex === firstIndex) {
              setSideBullets(bullet, "prev");
            }
            if (bulletIndex === lastIndex) {
              setSideBullets(bullet, "next");
            }
          }
        });
      } else {
        const bullet = bullets[current];
        if (bullet) {
          bullet.classList.add(...params.bulletActiveClass.split(" "));
        }
        if (swiper.isElement) {
          bullets.forEach((bulletEl, bulletIndex) => {
            bulletEl.setAttribute("part", bulletIndex === current ? "bullet-active" : "bullet");
          });
        }
        if (params.dynamicBullets) {
          const firstDisplayedBullet = bullets[firstIndex];
          const lastDisplayedBullet = bullets[lastIndex];
          for (let i = firstIndex; i <= lastIndex; i += 1) {
            if (bullets[i]) {
              bullets[i].classList.add(...`${params.bulletActiveClass}-main`.split(" "));
            }
          }
          setSideBullets(firstDisplayedBullet, "prev");
          setSideBullets(lastDisplayedBullet, "next");
        }
      }
      if (params.dynamicBullets) {
        const dynamicBulletsLength = Math.min(bullets.length, params.dynamicMainBullets + 4);
        const bulletsOffset = (bulletSize * dynamicBulletsLength - bulletSize) / 2 - midIndex * bulletSize;
        const offsetProp = rtl ? "right" : "left";
        bullets.forEach((bullet) => {
          bullet.style[swiper.isHorizontal() ? offsetProp : "top"] = `${bulletsOffset}px`;
        });
      }
    }
    el.forEach((subEl, subElIndex) => {
      if (params.type === "fraction") {
        subEl.querySelectorAll(classesToSelector(params.currentClass)).forEach((fractionEl) => {
          fractionEl.textContent = params.formatFractionCurrent(current + 1);
        });
        subEl.querySelectorAll(classesToSelector(params.totalClass)).forEach((totalEl) => {
          totalEl.textContent = params.formatFractionTotal(total);
        });
      }
      if (params.type === "progressbar") {
        let progressbarDirection;
        if (params.progressbarOpposite) {
          progressbarDirection = swiper.isHorizontal() ? "vertical" : "horizontal";
        } else {
          progressbarDirection = swiper.isHorizontal() ? "horizontal" : "vertical";
        }
        const scale = (current + 1) / total;
        let scaleX = 1;
        let scaleY = 1;
        if (progressbarDirection === "horizontal") {
          scaleX = scale;
        } else {
          scaleY = scale;
        }
        subEl.querySelectorAll(classesToSelector(params.progressbarFillClass)).forEach((progressEl) => {
          progressEl.style.transform = `translate3d(0,0,0) scaleX(${scaleX}) scaleY(${scaleY})`;
          progressEl.style.transitionDuration = `${swiper.params.speed}ms`;
        });
      }
      if (params.type === "custom" && params.renderCustom) {
        subEl.innerHTML = params.renderCustom(swiper, current + 1, total);
        if (subElIndex === 0)
          emit("paginationRender", subEl);
      } else {
        if (subElIndex === 0)
          emit("paginationRender", subEl);
        emit("paginationUpdate", subEl);
      }
      if (swiper.params.watchOverflow && swiper.enabled) {
        subEl.classList[swiper.isLocked ? "add" : "remove"](params.lockClass);
      }
    });
  }
  function render() {
    const params = swiper.params.pagination;
    if (isPaginationDisabled())
      return;
    const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.grid && swiper.params.grid.rows > 1 ? swiper.slides.length / Math.ceil(swiper.params.grid.rows) : swiper.slides.length;
    let el = swiper.pagination.el;
    el = makeElementsArray(el);
    let paginationHTML = "";
    if (params.type === "bullets") {
      let numberOfBullets = swiper.params.loop ? Math.ceil(slidesLength / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
      if (swiper.params.freeMode && swiper.params.freeMode.enabled && numberOfBullets > slidesLength) {
        numberOfBullets = slidesLength;
      }
      for (let i = 0; i < numberOfBullets; i += 1) {
        if (params.renderBullet) {
          paginationHTML += params.renderBullet.call(swiper, i, params.bulletClass);
        } else {
          paginationHTML += `<${params.bulletElement} ${swiper.isElement ? 'part="bullet"' : ""} class="${params.bulletClass}"></${params.bulletElement}>`;
        }
      }
    }
    if (params.type === "fraction") {
      if (params.renderFraction) {
        paginationHTML = params.renderFraction.call(swiper, params.currentClass, params.totalClass);
      } else {
        paginationHTML = `<span class="${params.currentClass}"></span> / <span class="${params.totalClass}"></span>`;
      }
    }
    if (params.type === "progressbar") {
      if (params.renderProgressbar) {
        paginationHTML = params.renderProgressbar.call(swiper, params.progressbarFillClass);
      } else {
        paginationHTML = `<span class="${params.progressbarFillClass}"></span>`;
      }
    }
    swiper.pagination.bullets = [];
    el.forEach((subEl) => {
      if (params.type !== "custom") {
        subEl.innerHTML = paginationHTML || "";
      }
      if (params.type === "bullets") {
        swiper.pagination.bullets.push(...subEl.querySelectorAll(classesToSelector(params.bulletClass)));
      }
    });
    if (params.type !== "custom") {
      emit("paginationRender", el[0]);
    }
  }
  function init() {
    swiper.params.pagination = createElementIfNotDefined(swiper, swiper.originalParams.pagination, swiper.params.pagination, {
      el: "swiper-pagination"
    });
    const params = swiper.params.pagination;
    if (!params.el)
      return;
    let el;
    if (typeof params.el === "string" && swiper.isElement) {
      el = swiper.el.querySelector(params.el);
    }
    if (!el && typeof params.el === "string") {
      el = [...document.querySelectorAll(params.el)];
    }
    if (!el) {
      el = params.el;
    }
    if (!el || el.length === 0)
      return;
    if (swiper.params.uniqueNavElements && typeof params.el === "string" && Array.isArray(el) && el.length > 1) {
      el = [...swiper.el.querySelectorAll(params.el)];
      if (el.length > 1) {
        el = el.find((subEl) => {
          if (elementParents(subEl, ".swiper")[0] !== swiper.el)
            return false;
          return true;
        });
      }
    }
    if (Array.isArray(el) && el.length === 1)
      el = el[0];
    Object.assign(swiper.pagination, {
      el
    });
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      if (params.type === "bullets" && params.clickable) {
        subEl.classList.add(...(params.clickableClass || "").split(" "));
      }
      subEl.classList.add(params.modifierClass + params.type);
      subEl.classList.add(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
      if (params.type === "bullets" && params.dynamicBullets) {
        subEl.classList.add(`${params.modifierClass}${params.type}-dynamic`);
        dynamicBulletIndex = 0;
        if (params.dynamicMainBullets < 1) {
          params.dynamicMainBullets = 1;
        }
      }
      if (params.type === "progressbar" && params.progressbarOpposite) {
        subEl.classList.add(params.progressbarOppositeClass);
      }
      if (params.clickable) {
        subEl.addEventListener("click", onBulletClick);
      }
      if (!swiper.enabled) {
        subEl.classList.add(params.lockClass);
      }
    });
  }
  function destroy() {
    const params = swiper.params.pagination;
    if (isPaginationDisabled())
      return;
    let el = swiper.pagination.el;
    if (el) {
      el = makeElementsArray(el);
      el.forEach((subEl) => {
        subEl.classList.remove(params.hiddenClass);
        subEl.classList.remove(params.modifierClass + params.type);
        subEl.classList.remove(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
        if (params.clickable) {
          subEl.classList.remove(...(params.clickableClass || "").split(" "));
          subEl.removeEventListener("click", onBulletClick);
        }
      });
    }
    if (swiper.pagination.bullets)
      swiper.pagination.bullets.forEach((subEl) => subEl.classList.remove(...params.bulletActiveClass.split(" ")));
  }
  on2("changeDirection", () => {
    if (!swiper.pagination || !swiper.pagination.el)
      return;
    const params = swiper.params.pagination;
    let {
      el
    } = swiper.pagination;
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.classList.remove(params.horizontalClass, params.verticalClass);
      subEl.classList.add(swiper.isHorizontal() ? params.horizontalClass : params.verticalClass);
    });
  });
  on2("init", () => {
    if (swiper.params.pagination.enabled === false) {
      disable();
    } else {
      init();
      render();
      update2();
    }
  });
  on2("activeIndexChange", () => {
    if (typeof swiper.snapIndex === "undefined") {
      update2();
    }
  });
  on2("snapIndexChange", () => {
    update2();
  });
  on2("snapGridLengthChange", () => {
    render();
    update2();
  });
  on2("destroy", () => {
    destroy();
  });
  on2("enable disable", () => {
    let {
      el
    } = swiper.pagination;
    if (el) {
      el = makeElementsArray(el);
      el.forEach((subEl) => subEl.classList[swiper.enabled ? "remove" : "add"](swiper.params.pagination.lockClass));
    }
  });
  on2("lock unlock", () => {
    update2();
  });
  on2("click", (_s, e) => {
    const targetEl = e.target;
    const el = makeElementsArray(swiper.pagination.el);
    if (swiper.params.pagination.el && swiper.params.pagination.hideOnClick && el && el.length > 0 && !targetEl.classList.contains(swiper.params.pagination.bulletClass)) {
      if (swiper.navigation && (swiper.navigation.nextEl && targetEl === swiper.navigation.nextEl || swiper.navigation.prevEl && targetEl === swiper.navigation.prevEl))
        return;
      const isHidden = el[0].classList.contains(swiper.params.pagination.hiddenClass);
      if (isHidden === true) {
        emit("paginationShow");
      } else {
        emit("paginationHide");
      }
      el.forEach((subEl) => subEl.classList.toggle(swiper.params.pagination.hiddenClass));
    }
  });
  const enable = () => {
    swiper.el.classList.remove(swiper.params.pagination.paginationDisabledClass);
    let {
      el
    } = swiper.pagination;
    if (el) {
      el = makeElementsArray(el);
      el.forEach((subEl) => subEl.classList.remove(swiper.params.pagination.paginationDisabledClass));
    }
    init();
    render();
    update2();
  };
  const disable = () => {
    swiper.el.classList.add(swiper.params.pagination.paginationDisabledClass);
    let {
      el
    } = swiper.pagination;
    if (el) {
      el = makeElementsArray(el);
      el.forEach((subEl) => subEl.classList.add(swiper.params.pagination.paginationDisabledClass));
    }
    destroy();
  };
  Object.assign(swiper.pagination, {
    enable,
    disable,
    render,
    update: update2,
    init,
    destroy
  });
}
function Zoom(_ref) {
  let {
    swiper,
    extendParams,
    on: on2,
    emit
  } = _ref;
  const window2 = getWindow();
  extendParams({
    zoom: {
      enabled: false,
      limitToOriginalSize: false,
      maxRatio: 3,
      minRatio: 1,
      panOnMouseMove: false,
      toggle: true,
      containerClass: "swiper-zoom-container",
      zoomedSlideClass: "swiper-slide-zoomed"
    }
  });
  swiper.zoom = {
    enabled: false
  };
  let currentScale = 1;
  let isScaling = false;
  let isPanningWithMouse = false;
  let mousePanStart = {
    x: 0,
    y: 0
  };
  const mousePanSensitivity = -3;
  let fakeGestureTouched;
  let fakeGestureMoved;
  const evCache = [];
  const gesture = {
    originX: 0,
    originY: 0,
    slideEl: void 0,
    slideWidth: void 0,
    slideHeight: void 0,
    imageEl: void 0,
    imageWrapEl: void 0,
    maxRatio: 3
  };
  const image = {
    isTouched: void 0,
    isMoved: void 0,
    currentX: void 0,
    currentY: void 0,
    minX: void 0,
    minY: void 0,
    maxX: void 0,
    maxY: void 0,
    width: void 0,
    height: void 0,
    startX: void 0,
    startY: void 0,
    touchesStart: {},
    touchesCurrent: {}
  };
  const velocity = {
    x: void 0,
    y: void 0,
    prevPositionX: void 0,
    prevPositionY: void 0,
    prevTime: void 0
  };
  let scale = 1;
  Object.defineProperty(swiper.zoom, "scale", {
    get() {
      return scale;
    },
    set(value) {
      if (scale !== value) {
        const imageEl = gesture.imageEl;
        const slideEl = gesture.slideEl;
        emit("zoomChange", value, imageEl, slideEl);
      }
      scale = value;
    }
  });
  function getDistanceBetweenTouches() {
    if (evCache.length < 2)
      return 1;
    const x1 = evCache[0].pageX;
    const y1 = evCache[0].pageY;
    const x2 = evCache[1].pageX;
    const y2 = evCache[1].pageY;
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    return distance;
  }
  function getMaxRatio() {
    const params = swiper.params.zoom;
    const maxRatio = gesture.imageWrapEl.getAttribute("data-swiper-zoom") || params.maxRatio;
    if (params.limitToOriginalSize && gesture.imageEl && gesture.imageEl.naturalWidth) {
      const imageMaxRatio = gesture.imageEl.naturalWidth / gesture.imageEl.offsetWidth;
      return Math.min(imageMaxRatio, maxRatio);
    }
    return maxRatio;
  }
  function getScaleOrigin() {
    if (evCache.length < 2)
      return {
        x: null,
        y: null
      };
    const box = gesture.imageEl.getBoundingClientRect();
    return [(evCache[0].pageX + (evCache[1].pageX - evCache[0].pageX) / 2 - box.x - window2.scrollX) / currentScale, (evCache[0].pageY + (evCache[1].pageY - evCache[0].pageY) / 2 - box.y - window2.scrollY) / currentScale];
  }
  function getSlideSelector() {
    return swiper.isElement ? `swiper-slide` : `.${swiper.params.slideClass}`;
  }
  function eventWithinSlide(e) {
    const slideSelector = getSlideSelector();
    if (e.target.matches(slideSelector))
      return true;
    if (swiper.slides.filter((slideEl) => slideEl.contains(e.target)).length > 0)
      return true;
    return false;
  }
  function eventWithinZoomContainer(e) {
    const selector = `.${swiper.params.zoom.containerClass}`;
    if (e.target.matches(selector))
      return true;
    if ([...swiper.hostEl.querySelectorAll(selector)].filter((containerEl) => containerEl.contains(e.target)).length > 0)
      return true;
    return false;
  }
  function onGestureStart(e) {
    if (e.pointerType === "mouse") {
      evCache.splice(0, evCache.length);
    }
    if (!eventWithinSlide(e))
      return;
    const params = swiper.params.zoom;
    fakeGestureTouched = false;
    fakeGestureMoved = false;
    evCache.push(e);
    if (evCache.length < 2) {
      return;
    }
    fakeGestureTouched = true;
    gesture.scaleStart = getDistanceBetweenTouches();
    if (!gesture.slideEl) {
      gesture.slideEl = e.target.closest(`.${swiper.params.slideClass}, swiper-slide`);
      if (!gesture.slideEl)
        gesture.slideEl = swiper.slides[swiper.activeIndex];
      let imageEl = gesture.slideEl.querySelector(`.${params.containerClass}`);
      if (imageEl) {
        imageEl = imageEl.querySelectorAll("picture, img, svg, canvas, .swiper-zoom-target")[0];
      }
      gesture.imageEl = imageEl;
      if (imageEl) {
        gesture.imageWrapEl = elementParents(gesture.imageEl, `.${params.containerClass}`)[0];
      } else {
        gesture.imageWrapEl = void 0;
      }
      if (!gesture.imageWrapEl) {
        gesture.imageEl = void 0;
        return;
      }
      gesture.maxRatio = getMaxRatio();
    }
    if (gesture.imageEl) {
      const [originX, originY] = getScaleOrigin();
      gesture.originX = originX;
      gesture.originY = originY;
      gesture.imageEl.style.transitionDuration = "0ms";
    }
    isScaling = true;
  }
  function onGestureChange(e) {
    if (!eventWithinSlide(e))
      return;
    const params = swiper.params.zoom;
    const zoom = swiper.zoom;
    const pointerIndex = evCache.findIndex((cachedEv) => cachedEv.pointerId === e.pointerId);
    if (pointerIndex >= 0)
      evCache[pointerIndex] = e;
    if (evCache.length < 2) {
      return;
    }
    fakeGestureMoved = true;
    gesture.scaleMove = getDistanceBetweenTouches();
    if (!gesture.imageEl) {
      return;
    }
    zoom.scale = gesture.scaleMove / gesture.scaleStart * currentScale;
    if (zoom.scale > gesture.maxRatio) {
      zoom.scale = gesture.maxRatio - 1 + (zoom.scale - gesture.maxRatio + 1) ** 0.5;
    }
    if (zoom.scale < params.minRatio) {
      zoom.scale = params.minRatio + 1 - (params.minRatio - zoom.scale + 1) ** 0.5;
    }
    gesture.imageEl.style.transform = `translate3d(0,0,0) scale(${zoom.scale})`;
  }
  function onGestureEnd(e) {
    if (!eventWithinSlide(e))
      return;
    if (e.pointerType === "mouse" && e.type === "pointerout")
      return;
    const params = swiper.params.zoom;
    const zoom = swiper.zoom;
    const pointerIndex = evCache.findIndex((cachedEv) => cachedEv.pointerId === e.pointerId);
    if (pointerIndex >= 0)
      evCache.splice(pointerIndex, 1);
    if (!fakeGestureTouched || !fakeGestureMoved) {
      return;
    }
    fakeGestureTouched = false;
    fakeGestureMoved = false;
    if (!gesture.imageEl)
      return;
    zoom.scale = Math.max(Math.min(zoom.scale, gesture.maxRatio), params.minRatio);
    gesture.imageEl.style.transitionDuration = `${swiper.params.speed}ms`;
    gesture.imageEl.style.transform = `translate3d(0,0,0) scale(${zoom.scale})`;
    currentScale = zoom.scale;
    isScaling = false;
    if (zoom.scale > 1 && gesture.slideEl) {
      gesture.slideEl.classList.add(`${params.zoomedSlideClass}`);
    } else if (zoom.scale <= 1 && gesture.slideEl) {
      gesture.slideEl.classList.remove(`${params.zoomedSlideClass}`);
    }
    if (zoom.scale === 1) {
      gesture.originX = 0;
      gesture.originY = 0;
      gesture.slideEl = void 0;
    }
  }
  let allowTouchMoveTimeout;
  function allowTouchMove2() {
    swiper.touchEventsData.preventTouchMoveFromPointerMove = false;
  }
  function preventTouchMove() {
    clearTimeout(allowTouchMoveTimeout);
    swiper.touchEventsData.preventTouchMoveFromPointerMove = true;
    allowTouchMoveTimeout = setTimeout(() => {
      if (swiper.destroyed)
        return;
      allowTouchMove2();
    });
  }
  function onTouchStart2(e) {
    const device = swiper.device;
    if (!gesture.imageEl)
      return;
    if (image.isTouched)
      return;
    if (device.android && e.cancelable)
      e.preventDefault();
    image.isTouched = true;
    const event = evCache.length > 0 ? evCache[0] : e;
    image.touchesStart.x = event.pageX;
    image.touchesStart.y = event.pageY;
  }
  function onTouchMove2(e) {
    const isMouseEvent = e.pointerType === "mouse";
    const isMousePan = isMouseEvent && swiper.params.zoom.panOnMouseMove;
    if (!eventWithinSlide(e) || !eventWithinZoomContainer(e)) {
      return;
    }
    const zoom = swiper.zoom;
    if (!gesture.imageEl) {
      return;
    }
    if (!image.isTouched || !gesture.slideEl) {
      if (isMousePan)
        onMouseMove(e);
      return;
    }
    if (isMousePan) {
      onMouseMove(e);
      return;
    }
    if (!image.isMoved) {
      image.width = gesture.imageEl.offsetWidth || gesture.imageEl.clientWidth;
      image.height = gesture.imageEl.offsetHeight || gesture.imageEl.clientHeight;
      image.startX = getTranslate(gesture.imageWrapEl, "x") || 0;
      image.startY = getTranslate(gesture.imageWrapEl, "y") || 0;
      gesture.slideWidth = gesture.slideEl.offsetWidth;
      gesture.slideHeight = gesture.slideEl.offsetHeight;
      gesture.imageWrapEl.style.transitionDuration = "0ms";
    }
    const scaledWidth = image.width * zoom.scale;
    const scaledHeight = image.height * zoom.scale;
    image.minX = Math.min(gesture.slideWidth / 2 - scaledWidth / 2, 0);
    image.maxX = -image.minX;
    image.minY = Math.min(gesture.slideHeight / 2 - scaledHeight / 2, 0);
    image.maxY = -image.minY;
    image.touchesCurrent.x = evCache.length > 0 ? evCache[0].pageX : e.pageX;
    image.touchesCurrent.y = evCache.length > 0 ? evCache[0].pageY : e.pageY;
    const touchesDiff = Math.max(Math.abs(image.touchesCurrent.x - image.touchesStart.x), Math.abs(image.touchesCurrent.y - image.touchesStart.y));
    if (touchesDiff > 5) {
      swiper.allowClick = false;
    }
    if (!image.isMoved && !isScaling) {
      if (swiper.isHorizontal() && (Math.floor(image.minX) === Math.floor(image.startX) && image.touchesCurrent.x < image.touchesStart.x || Math.floor(image.maxX) === Math.floor(image.startX) && image.touchesCurrent.x > image.touchesStart.x)) {
        image.isTouched = false;
        allowTouchMove2();
        return;
      }
      if (!swiper.isHorizontal() && (Math.floor(image.minY) === Math.floor(image.startY) && image.touchesCurrent.y < image.touchesStart.y || Math.floor(image.maxY) === Math.floor(image.startY) && image.touchesCurrent.y > image.touchesStart.y)) {
        image.isTouched = false;
        allowTouchMove2();
        return;
      }
    }
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
    preventTouchMove();
    image.isMoved = true;
    const scaleRatio = (zoom.scale - currentScale) / (gesture.maxRatio - swiper.params.zoom.minRatio);
    const {
      originX,
      originY
    } = gesture;
    image.currentX = image.touchesCurrent.x - image.touchesStart.x + image.startX + scaleRatio * (image.width - originX * 2);
    image.currentY = image.touchesCurrent.y - image.touchesStart.y + image.startY + scaleRatio * (image.height - originY * 2);
    if (image.currentX < image.minX) {
      image.currentX = image.minX + 1 - (image.minX - image.currentX + 1) ** 0.8;
    }
    if (image.currentX > image.maxX) {
      image.currentX = image.maxX - 1 + (image.currentX - image.maxX + 1) ** 0.8;
    }
    if (image.currentY < image.minY) {
      image.currentY = image.minY + 1 - (image.minY - image.currentY + 1) ** 0.8;
    }
    if (image.currentY > image.maxY) {
      image.currentY = image.maxY - 1 + (image.currentY - image.maxY + 1) ** 0.8;
    }
    if (!velocity.prevPositionX)
      velocity.prevPositionX = image.touchesCurrent.x;
    if (!velocity.prevPositionY)
      velocity.prevPositionY = image.touchesCurrent.y;
    if (!velocity.prevTime)
      velocity.prevTime = Date.now();
    velocity.x = (image.touchesCurrent.x - velocity.prevPositionX) / (Date.now() - velocity.prevTime) / 2;
    velocity.y = (image.touchesCurrent.y - velocity.prevPositionY) / (Date.now() - velocity.prevTime) / 2;
    if (Math.abs(image.touchesCurrent.x - velocity.prevPositionX) < 2)
      velocity.x = 0;
    if (Math.abs(image.touchesCurrent.y - velocity.prevPositionY) < 2)
      velocity.y = 0;
    velocity.prevPositionX = image.touchesCurrent.x;
    velocity.prevPositionY = image.touchesCurrent.y;
    velocity.prevTime = Date.now();
    gesture.imageWrapEl.style.transform = `translate3d(${image.currentX}px, ${image.currentY}px,0)`;
  }
  function onTouchEnd2() {
    const zoom = swiper.zoom;
    evCache.length = 0;
    if (!gesture.imageEl)
      return;
    if (!image.isTouched || !image.isMoved) {
      image.isTouched = false;
      image.isMoved = false;
      return;
    }
    image.isTouched = false;
    image.isMoved = false;
    let momentumDurationX = 300;
    let momentumDurationY = 300;
    const momentumDistanceX = velocity.x * momentumDurationX;
    const newPositionX = image.currentX + momentumDistanceX;
    const momentumDistanceY = velocity.y * momentumDurationY;
    const newPositionY = image.currentY + momentumDistanceY;
    if (velocity.x !== 0)
      momentumDurationX = Math.abs((newPositionX - image.currentX) / velocity.x);
    if (velocity.y !== 0)
      momentumDurationY = Math.abs((newPositionY - image.currentY) / velocity.y);
    const momentumDuration = Math.max(momentumDurationX, momentumDurationY);
    image.currentX = newPositionX;
    image.currentY = newPositionY;
    const scaledWidth = image.width * zoom.scale;
    const scaledHeight = image.height * zoom.scale;
    image.minX = Math.min(gesture.slideWidth / 2 - scaledWidth / 2, 0);
    image.maxX = -image.minX;
    image.minY = Math.min(gesture.slideHeight / 2 - scaledHeight / 2, 0);
    image.maxY = -image.minY;
    image.currentX = Math.max(Math.min(image.currentX, image.maxX), image.minX);
    image.currentY = Math.max(Math.min(image.currentY, image.maxY), image.minY);
    gesture.imageWrapEl.style.transitionDuration = `${momentumDuration}ms`;
    gesture.imageWrapEl.style.transform = `translate3d(${image.currentX}px, ${image.currentY}px,0)`;
  }
  function onTransitionEnd() {
    const zoom = swiper.zoom;
    if (gesture.slideEl && swiper.activeIndex !== swiper.slides.indexOf(gesture.slideEl)) {
      if (gesture.imageEl) {
        gesture.imageEl.style.transform = "translate3d(0,0,0) scale(1)";
      }
      if (gesture.imageWrapEl) {
        gesture.imageWrapEl.style.transform = "translate3d(0,0,0)";
      }
      gesture.slideEl.classList.remove(`${swiper.params.zoom.zoomedSlideClass}`);
      zoom.scale = 1;
      currentScale = 1;
      gesture.slideEl = void 0;
      gesture.imageEl = void 0;
      gesture.imageWrapEl = void 0;
      gesture.originX = 0;
      gesture.originY = 0;
    }
  }
  function onMouseMove(e) {
    if (currentScale <= 1 || !gesture.imageWrapEl)
      return;
    if (!eventWithinSlide(e) || !eventWithinZoomContainer(e))
      return;
    const currentTransform = window2.getComputedStyle(gesture.imageWrapEl).transform;
    const matrix = new window2.DOMMatrix(currentTransform);
    if (!isPanningWithMouse) {
      isPanningWithMouse = true;
      mousePanStart.x = e.clientX;
      mousePanStart.y = e.clientY;
      image.startX = matrix.e;
      image.startY = matrix.f;
      image.width = gesture.imageEl.offsetWidth || gesture.imageEl.clientWidth;
      image.height = gesture.imageEl.offsetHeight || gesture.imageEl.clientHeight;
      gesture.slideWidth = gesture.slideEl.offsetWidth;
      gesture.slideHeight = gesture.slideEl.offsetHeight;
      return;
    }
    const deltaX = (e.clientX - mousePanStart.x) * mousePanSensitivity;
    const deltaY = (e.clientY - mousePanStart.y) * mousePanSensitivity;
    const scaledWidth = image.width * currentScale;
    const scaledHeight = image.height * currentScale;
    const slideWidth = gesture.slideWidth;
    const slideHeight = gesture.slideHeight;
    const minX = Math.min(slideWidth / 2 - scaledWidth / 2, 0);
    const maxX = -minX;
    const minY = Math.min(slideHeight / 2 - scaledHeight / 2, 0);
    const maxY = -minY;
    const newX = Math.max(Math.min(image.startX + deltaX, maxX), minX);
    const newY = Math.max(Math.min(image.startY + deltaY, maxY), minY);
    gesture.imageWrapEl.style.transitionDuration = "0ms";
    gesture.imageWrapEl.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
    mousePanStart.x = e.clientX;
    mousePanStart.y = e.clientY;
    image.startX = newX;
    image.startY = newY;
  }
  function zoomIn(e) {
    const zoom = swiper.zoom;
    const params = swiper.params.zoom;
    if (!gesture.slideEl) {
      if (e && e.target) {
        gesture.slideEl = e.target.closest(`.${swiper.params.slideClass}, swiper-slide`);
      }
      if (!gesture.slideEl) {
        if (swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual) {
          gesture.slideEl = elementChildren(swiper.slidesEl, `.${swiper.params.slideActiveClass}`)[0];
        } else {
          gesture.slideEl = swiper.slides[swiper.activeIndex];
        }
      }
      let imageEl = gesture.slideEl.querySelector(`.${params.containerClass}`);
      if (imageEl) {
        imageEl = imageEl.querySelectorAll("picture, img, svg, canvas, .swiper-zoom-target")[0];
      }
      gesture.imageEl = imageEl;
      if (imageEl) {
        gesture.imageWrapEl = elementParents(gesture.imageEl, `.${params.containerClass}`)[0];
      } else {
        gesture.imageWrapEl = void 0;
      }
    }
    if (!gesture.imageEl || !gesture.imageWrapEl)
      return;
    if (swiper.params.cssMode) {
      swiper.wrapperEl.style.overflow = "hidden";
      swiper.wrapperEl.style.touchAction = "none";
    }
    gesture.slideEl.classList.add(`${params.zoomedSlideClass}`);
    let touchX;
    let touchY;
    let offsetX;
    let offsetY;
    let diffX;
    let diffY;
    let translateX;
    let translateY;
    let imageWidth;
    let imageHeight;
    let scaledWidth;
    let scaledHeight;
    let translateMinX;
    let translateMinY;
    let translateMaxX;
    let translateMaxY;
    let slideWidth;
    let slideHeight;
    if (typeof image.touchesStart.x === "undefined" && e) {
      touchX = e.pageX;
      touchY = e.pageY;
    } else {
      touchX = image.touchesStart.x;
      touchY = image.touchesStart.y;
    }
    const forceZoomRatio = typeof e === "number" ? e : null;
    if (currentScale === 1 && forceZoomRatio) {
      touchX = void 0;
      touchY = void 0;
      image.touchesStart.x = void 0;
      image.touchesStart.y = void 0;
    }
    const maxRatio = getMaxRatio();
    zoom.scale = forceZoomRatio || maxRatio;
    currentScale = forceZoomRatio || maxRatio;
    if (e && !(currentScale === 1 && forceZoomRatio)) {
      slideWidth = gesture.slideEl.offsetWidth;
      slideHeight = gesture.slideEl.offsetHeight;
      offsetX = elementOffset(gesture.slideEl).left + window2.scrollX;
      offsetY = elementOffset(gesture.slideEl).top + window2.scrollY;
      diffX = offsetX + slideWidth / 2 - touchX;
      diffY = offsetY + slideHeight / 2 - touchY;
      imageWidth = gesture.imageEl.offsetWidth || gesture.imageEl.clientWidth;
      imageHeight = gesture.imageEl.offsetHeight || gesture.imageEl.clientHeight;
      scaledWidth = imageWidth * zoom.scale;
      scaledHeight = imageHeight * zoom.scale;
      translateMinX = Math.min(slideWidth / 2 - scaledWidth / 2, 0);
      translateMinY = Math.min(slideHeight / 2 - scaledHeight / 2, 0);
      translateMaxX = -translateMinX;
      translateMaxY = -translateMinY;
      translateX = diffX * zoom.scale;
      translateY = diffY * zoom.scale;
      if (translateX < translateMinX) {
        translateX = translateMinX;
      }
      if (translateX > translateMaxX) {
        translateX = translateMaxX;
      }
      if (translateY < translateMinY) {
        translateY = translateMinY;
      }
      if (translateY > translateMaxY) {
        translateY = translateMaxY;
      }
    } else {
      translateX = 0;
      translateY = 0;
    }
    if (forceZoomRatio && zoom.scale === 1) {
      gesture.originX = 0;
      gesture.originY = 0;
    }
    gesture.imageWrapEl.style.transitionDuration = "300ms";
    gesture.imageWrapEl.style.transform = `translate3d(${translateX}px, ${translateY}px,0)`;
    gesture.imageEl.style.transitionDuration = "300ms";
    gesture.imageEl.style.transform = `translate3d(0,0,0) scale(${zoom.scale})`;
  }
  function zoomOut() {
    const zoom = swiper.zoom;
    const params = swiper.params.zoom;
    if (!gesture.slideEl) {
      if (swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual) {
        gesture.slideEl = elementChildren(swiper.slidesEl, `.${swiper.params.slideActiveClass}`)[0];
      } else {
        gesture.slideEl = swiper.slides[swiper.activeIndex];
      }
      let imageEl = gesture.slideEl.querySelector(`.${params.containerClass}`);
      if (imageEl) {
        imageEl = imageEl.querySelectorAll("picture, img, svg, canvas, .swiper-zoom-target")[0];
      }
      gesture.imageEl = imageEl;
      if (imageEl) {
        gesture.imageWrapEl = elementParents(gesture.imageEl, `.${params.containerClass}`)[0];
      } else {
        gesture.imageWrapEl = void 0;
      }
    }
    if (!gesture.imageEl || !gesture.imageWrapEl)
      return;
    if (swiper.params.cssMode) {
      swiper.wrapperEl.style.overflow = "";
      swiper.wrapperEl.style.touchAction = "";
    }
    zoom.scale = 1;
    currentScale = 1;
    image.touchesStart.x = void 0;
    image.touchesStart.y = void 0;
    gesture.imageWrapEl.style.transitionDuration = "300ms";
    gesture.imageWrapEl.style.transform = "translate3d(0,0,0)";
    gesture.imageEl.style.transitionDuration = "300ms";
    gesture.imageEl.style.transform = "translate3d(0,0,0) scale(1)";
    gesture.slideEl.classList.remove(`${params.zoomedSlideClass}`);
    gesture.slideEl = void 0;
    gesture.originX = 0;
    gesture.originY = 0;
    if (swiper.params.zoom.panOnMouseMove) {
      mousePanStart = {
        x: 0,
        y: 0
      };
      if (isPanningWithMouse) {
        isPanningWithMouse = false;
        image.startX = 0;
        image.startY = 0;
      }
    }
  }
  function zoomToggle(e) {
    const zoom = swiper.zoom;
    if (zoom.scale && zoom.scale !== 1) {
      zoomOut();
    } else {
      zoomIn(e);
    }
  }
  function getListeners() {
    const passiveListener = swiper.params.passiveListeners ? {
      passive: true,
      capture: false
    } : false;
    const activeListenerWithCapture = swiper.params.passiveListeners ? {
      passive: false,
      capture: true
    } : true;
    return {
      passiveListener,
      activeListenerWithCapture
    };
  }
  function enable() {
    const zoom = swiper.zoom;
    if (zoom.enabled)
      return;
    zoom.enabled = true;
    const {
      passiveListener,
      activeListenerWithCapture
    } = getListeners();
    swiper.wrapperEl.addEventListener("pointerdown", onGestureStart, passiveListener);
    swiper.wrapperEl.addEventListener("pointermove", onGestureChange, activeListenerWithCapture);
    ["pointerup", "pointercancel", "pointerout"].forEach((eventName) => {
      swiper.wrapperEl.addEventListener(eventName, onGestureEnd, passiveListener);
    });
    swiper.wrapperEl.addEventListener("pointermove", onTouchMove2, activeListenerWithCapture);
  }
  function disable() {
    const zoom = swiper.zoom;
    if (!zoom.enabled)
      return;
    zoom.enabled = false;
    const {
      passiveListener,
      activeListenerWithCapture
    } = getListeners();
    swiper.wrapperEl.removeEventListener("pointerdown", onGestureStart, passiveListener);
    swiper.wrapperEl.removeEventListener("pointermove", onGestureChange, activeListenerWithCapture);
    ["pointerup", "pointercancel", "pointerout"].forEach((eventName) => {
      swiper.wrapperEl.removeEventListener(eventName, onGestureEnd, passiveListener);
    });
    swiper.wrapperEl.removeEventListener("pointermove", onTouchMove2, activeListenerWithCapture);
  }
  on2("init", () => {
    if (swiper.params.zoom.enabled) {
      enable();
    }
  });
  on2("destroy", () => {
    disable();
  });
  on2("touchStart", (_s, e) => {
    if (!swiper.zoom.enabled)
      return;
    onTouchStart2(e);
  });
  on2("touchEnd", (_s, e) => {
    if (!swiper.zoom.enabled)
      return;
    onTouchEnd2();
  });
  on2("doubleTap", (_s, e) => {
    if (!swiper.animating && swiper.params.zoom.enabled && swiper.zoom.enabled && swiper.params.zoom.toggle) {
      zoomToggle(e);
    }
  });
  on2("transitionEnd", () => {
    if (swiper.zoom.enabled && swiper.params.zoom.enabled) {
      onTransitionEnd();
    }
  });
  on2("slideChange", () => {
    if (swiper.zoom.enabled && swiper.params.zoom.enabled && swiper.params.cssMode) {
      onTransitionEnd();
    }
  });
  Object.assign(swiper.zoom, {
    enable,
    disable,
    in: zoomIn,
    out: zoomOut,
    toggle: zoomToggle
  });
}
function A11y(_ref) {
  let {
    swiper,
    extendParams,
    on: on2
  } = _ref;
  extendParams({
    a11y: {
      enabled: true,
      notificationClass: "swiper-notification",
      prevSlideMessage: "Previous slide",
      nextSlideMessage: "Next slide",
      firstSlideMessage: "This is the first slide",
      lastSlideMessage: "This is the last slide",
      paginationBulletMessage: "Go to slide {{index}}",
      slideLabelMessage: "{{index}} / {{slidesLength}}",
      containerMessage: null,
      containerRoleDescriptionMessage: null,
      containerRole: null,
      itemRoleDescriptionMessage: null,
      slideRole: "group",
      id: null,
      scrollOnFocus: true
    }
  });
  swiper.a11y = {
    clicked: false
  };
  let liveRegion = null;
  let preventFocusHandler;
  let focusTargetSlideEl;
  let visibilityChangedTimestamp = (/* @__PURE__ */ new Date()).getTime();
  function notify(message) {
    const notification = liveRegion;
    if (notification.length === 0)
      return;
    notification.innerHTML = "";
    notification.innerHTML = message;
  }
  function getRandomNumber(size) {
    if (size === void 0) {
      size = 16;
    }
    const randomChar = () => Math.round(16 * Math.random()).toString(16);
    return "x".repeat(size).replace(/x/g, randomChar);
  }
  function makeElFocusable(el) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("tabIndex", "0");
    });
  }
  function makeElNotFocusable(el) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("tabIndex", "-1");
    });
  }
  function addElRole(el, role) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("role", role);
    });
  }
  function addElRoleDescription(el, description) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("aria-roledescription", description);
    });
  }
  function addElControls(el, controls) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("aria-controls", controls);
    });
  }
  function addElLabel(el, label) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("aria-label", label);
    });
  }
  function addElId(el, id) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("id", id);
    });
  }
  function addElLive(el, live) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("aria-live", live);
    });
  }
  function disableEl(el) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("aria-disabled", true);
    });
  }
  function enableEl(el) {
    el = makeElementsArray(el);
    el.forEach((subEl) => {
      subEl.setAttribute("aria-disabled", false);
    });
  }
  function onEnterOrSpaceKey(e) {
    if (e.keyCode !== 13 && e.keyCode !== 32)
      return;
    const params = swiper.params.a11y;
    const targetEl = e.target;
    if (swiper.pagination && swiper.pagination.el && (targetEl === swiper.pagination.el || swiper.pagination.el.contains(e.target))) {
      if (!e.target.matches(classesToSelector(swiper.params.pagination.bulletClass)))
        return;
    }
    if (swiper.navigation && swiper.navigation.prevEl && swiper.navigation.nextEl) {
      const prevEls = makeElementsArray(swiper.navigation.prevEl);
      const nextEls = makeElementsArray(swiper.navigation.nextEl);
      if (nextEls.includes(targetEl)) {
        if (!(swiper.isEnd && !swiper.params.loop)) {
          swiper.slideNext();
        }
        if (swiper.isEnd) {
          notify(params.lastSlideMessage);
        } else {
          notify(params.nextSlideMessage);
        }
      }
      if (prevEls.includes(targetEl)) {
        if (!(swiper.isBeginning && !swiper.params.loop)) {
          swiper.slidePrev();
        }
        if (swiper.isBeginning) {
          notify(params.firstSlideMessage);
        } else {
          notify(params.prevSlideMessage);
        }
      }
    }
    if (swiper.pagination && targetEl.matches(classesToSelector(swiper.params.pagination.bulletClass))) {
      targetEl.click();
    }
  }
  function updateNavigation() {
    if (swiper.params.loop || swiper.params.rewind || !swiper.navigation)
      return;
    const {
      nextEl,
      prevEl
    } = swiper.navigation;
    if (prevEl) {
      if (swiper.isBeginning) {
        disableEl(prevEl);
        makeElNotFocusable(prevEl);
      } else {
        enableEl(prevEl);
        makeElFocusable(prevEl);
      }
    }
    if (nextEl) {
      if (swiper.isEnd) {
        disableEl(nextEl);
        makeElNotFocusable(nextEl);
      } else {
        enableEl(nextEl);
        makeElFocusable(nextEl);
      }
    }
  }
  function hasPagination() {
    return swiper.pagination && swiper.pagination.bullets && swiper.pagination.bullets.length;
  }
  function hasClickablePagination() {
    return hasPagination() && swiper.params.pagination.clickable;
  }
  function updatePagination() {
    const params = swiper.params.a11y;
    if (!hasPagination())
      return;
    swiper.pagination.bullets.forEach((bulletEl) => {
      if (swiper.params.pagination.clickable) {
        makeElFocusable(bulletEl);
        if (!swiper.params.pagination.renderBullet) {
          addElRole(bulletEl, "button");
          addElLabel(bulletEl, params.paginationBulletMessage.replace(/\{\{index\}\}/, elementIndex(bulletEl) + 1));
        }
      }
      if (bulletEl.matches(classesToSelector(swiper.params.pagination.bulletActiveClass))) {
        bulletEl.setAttribute("aria-current", "true");
      } else {
        bulletEl.removeAttribute("aria-current");
      }
    });
  }
  const initNavEl = (el, wrapperId, message) => {
    makeElFocusable(el);
    if (el.tagName !== "BUTTON") {
      addElRole(el, "button");
      el.addEventListener("keydown", onEnterOrSpaceKey);
    }
    addElLabel(el, message);
    addElControls(el, wrapperId);
  };
  const handlePointerDown = (e) => {
    if (focusTargetSlideEl && focusTargetSlideEl !== e.target && !focusTargetSlideEl.contains(e.target)) {
      preventFocusHandler = true;
    }
    swiper.a11y.clicked = true;
  };
  const handlePointerUp = () => {
    preventFocusHandler = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!swiper.destroyed) {
          swiper.a11y.clicked = false;
        }
      });
    });
  };
  const onVisibilityChange = (e) => {
    visibilityChangedTimestamp = (/* @__PURE__ */ new Date()).getTime();
  };
  const handleFocus = (e) => {
    if (swiper.a11y.clicked || !swiper.params.a11y.scrollOnFocus)
      return;
    if ((/* @__PURE__ */ new Date()).getTime() - visibilityChangedTimestamp < 100)
      return;
    const slideEl = e.target.closest(`.${swiper.params.slideClass}, swiper-slide`);
    if (!slideEl || !swiper.slides.includes(slideEl))
      return;
    focusTargetSlideEl = slideEl;
    const isActive = swiper.slides.indexOf(slideEl) === swiper.activeIndex;
    const isVisible = swiper.params.watchSlidesProgress && swiper.visibleSlides && swiper.visibleSlides.includes(slideEl);
    if (isActive || isVisible)
      return;
    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)
      return;
    if (swiper.isHorizontal()) {
      swiper.el.scrollLeft = 0;
    } else {
      swiper.el.scrollTop = 0;
    }
    requestAnimationFrame(() => {
      if (preventFocusHandler)
        return;
      if (swiper.params.loop) {
        swiper.slideToLoop(parseInt(slideEl.getAttribute("data-swiper-slide-index")), 0);
      } else {
        swiper.slideTo(swiper.slides.indexOf(slideEl), 0);
      }
      preventFocusHandler = false;
    });
  };
  const initSlides = () => {
    const params = swiper.params.a11y;
    if (params.itemRoleDescriptionMessage) {
      addElRoleDescription(swiper.slides, params.itemRoleDescriptionMessage);
    }
    if (params.slideRole) {
      addElRole(swiper.slides, params.slideRole);
    }
    const slidesLength = swiper.slides.length;
    if (params.slideLabelMessage) {
      swiper.slides.forEach((slideEl, index) => {
        const slideIndex = swiper.params.loop ? parseInt(slideEl.getAttribute("data-swiper-slide-index"), 10) : index;
        const ariaLabelMessage = params.slideLabelMessage.replace(/\{\{index\}\}/, slideIndex + 1).replace(/\{\{slidesLength\}\}/, slidesLength);
        addElLabel(slideEl, ariaLabelMessage);
      });
    }
  };
  const init = () => {
    const params = swiper.params.a11y;
    swiper.el.append(liveRegion);
    const containerEl = swiper.el;
    if (params.containerRoleDescriptionMessage) {
      addElRoleDescription(containerEl, params.containerRoleDescriptionMessage);
    }
    if (params.containerMessage) {
      addElLabel(containerEl, params.containerMessage);
    }
    if (params.containerRole) {
      addElRole(containerEl, params.containerRole);
    }
    const wrapperEl = swiper.wrapperEl;
    const wrapperId = params.id || wrapperEl.getAttribute("id") || `swiper-wrapper-${getRandomNumber(16)}`;
    const live = swiper.params.autoplay && swiper.params.autoplay.enabled ? "off" : "polite";
    addElId(wrapperEl, wrapperId);
    addElLive(wrapperEl, live);
    initSlides();
    let {
      nextEl,
      prevEl
    } = swiper.navigation ? swiper.navigation : {};
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    if (nextEl) {
      nextEl.forEach((el) => initNavEl(el, wrapperId, params.nextSlideMessage));
    }
    if (prevEl) {
      prevEl.forEach((el) => initNavEl(el, wrapperId, params.prevSlideMessage));
    }
    if (hasClickablePagination()) {
      const paginationEl = makeElementsArray(swiper.pagination.el);
      paginationEl.forEach((el) => {
        el.addEventListener("keydown", onEnterOrSpaceKey);
      });
    }
    const document2 = getDocument();
    document2.addEventListener("visibilitychange", onVisibilityChange);
    swiper.el.addEventListener("focus", handleFocus, true);
    swiper.el.addEventListener("focus", handleFocus, true);
    swiper.el.addEventListener("pointerdown", handlePointerDown, true);
    swiper.el.addEventListener("pointerup", handlePointerUp, true);
  };
  function destroy() {
    if (liveRegion)
      liveRegion.remove();
    let {
      nextEl,
      prevEl
    } = swiper.navigation ? swiper.navigation : {};
    nextEl = makeElementsArray(nextEl);
    prevEl = makeElementsArray(prevEl);
    if (nextEl) {
      nextEl.forEach((el) => el.removeEventListener("keydown", onEnterOrSpaceKey));
    }
    if (prevEl) {
      prevEl.forEach((el) => el.removeEventListener("keydown", onEnterOrSpaceKey));
    }
    if (hasClickablePagination()) {
      const paginationEl = makeElementsArray(swiper.pagination.el);
      paginationEl.forEach((el) => {
        el.removeEventListener("keydown", onEnterOrSpaceKey);
      });
    }
    const document2 = getDocument();
    document2.removeEventListener("visibilitychange", onVisibilityChange);
    if (swiper.el && typeof swiper.el !== "string") {
      swiper.el.removeEventListener("focus", handleFocus, true);
      swiper.el.removeEventListener("pointerdown", handlePointerDown, true);
      swiper.el.removeEventListener("pointerup", handlePointerUp, true);
    }
  }
  on2("beforeInit", () => {
    liveRegion = createElement("span", swiper.params.a11y.notificationClass);
    liveRegion.setAttribute("aria-live", "assertive");
    liveRegion.setAttribute("aria-atomic", "true");
  });
  on2("afterInit", () => {
    if (!swiper.params.a11y.enabled)
      return;
    init();
  });
  on2("slidesLengthChange snapGridLengthChange slidesGridLengthChange", () => {
    if (!swiper.params.a11y.enabled)
      return;
    initSlides();
  });
  on2("fromEdge toEdge afterInit lock unlock", () => {
    if (!swiper.params.a11y.enabled)
      return;
    updateNavigation();
  });
  on2("paginationUpdate", () => {
    if (!swiper.params.a11y.enabled)
      return;
    updatePagination();
  });
  on2("destroy", () => {
    if (!swiper.params.a11y.enabled)
      return;
    destroy();
  });
}
function Thumb(_ref) {
  let {
    swiper,
    extendParams,
    on: on2
  } = _ref;
  extendParams({
    thumbs: {
      swiper: null,
      multipleActiveThumbs: true,
      autoScrollOffset: 0,
      slideThumbActiveClass: "swiper-slide-thumb-active",
      thumbsContainerClass: "swiper-thumbs"
    }
  });
  let initialized = false;
  let swiperCreated = false;
  swiper.thumbs = {
    swiper: null
  };
  function onThumbClick() {
    const thumbsSwiper = swiper.thumbs.swiper;
    if (!thumbsSwiper || thumbsSwiper.destroyed)
      return;
    const clickedIndex = thumbsSwiper.clickedIndex;
    const clickedSlide = thumbsSwiper.clickedSlide;
    if (clickedSlide && clickedSlide.classList.contains(swiper.params.thumbs.slideThumbActiveClass))
      return;
    if (typeof clickedIndex === "undefined" || clickedIndex === null)
      return;
    let slideToIndex;
    if (thumbsSwiper.params.loop) {
      slideToIndex = parseInt(thumbsSwiper.clickedSlide.getAttribute("data-swiper-slide-index"), 10);
    } else {
      slideToIndex = clickedIndex;
    }
    if (swiper.params.loop) {
      swiper.slideToLoop(slideToIndex);
    } else {
      swiper.slideTo(slideToIndex);
    }
  }
  function init() {
    const {
      thumbs: thumbsParams
    } = swiper.params;
    if (initialized)
      return false;
    initialized = true;
    const SwiperClass = swiper.constructor;
    if (thumbsParams.swiper instanceof SwiperClass) {
      swiper.thumbs.swiper = thumbsParams.swiper;
      Object.assign(swiper.thumbs.swiper.originalParams, {
        watchSlidesProgress: true,
        slideToClickedSlide: false
      });
      Object.assign(swiper.thumbs.swiper.params, {
        watchSlidesProgress: true,
        slideToClickedSlide: false
      });
      swiper.thumbs.swiper.update();
    } else if (isObject(thumbsParams.swiper)) {
      const thumbsSwiperParams = Object.assign({}, thumbsParams.swiper);
      Object.assign(thumbsSwiperParams, {
        watchSlidesProgress: true,
        slideToClickedSlide: false
      });
      swiper.thumbs.swiper = new SwiperClass(thumbsSwiperParams);
      swiperCreated = true;
    }
    swiper.thumbs.swiper.el.classList.add(swiper.params.thumbs.thumbsContainerClass);
    swiper.thumbs.swiper.on("tap", onThumbClick);
    return true;
  }
  function update2(initial) {
    const thumbsSwiper = swiper.thumbs.swiper;
    if (!thumbsSwiper || thumbsSwiper.destroyed)
      return;
    const slidesPerView = thumbsSwiper.params.slidesPerView === "auto" ? thumbsSwiper.slidesPerViewDynamic() : thumbsSwiper.params.slidesPerView;
    let thumbsToActivate = 1;
    const thumbActiveClass = swiper.params.thumbs.slideThumbActiveClass;
    if (swiper.params.slidesPerView > 1 && !swiper.params.centeredSlides) {
      thumbsToActivate = swiper.params.slidesPerView;
    }
    if (!swiper.params.thumbs.multipleActiveThumbs) {
      thumbsToActivate = 1;
    }
    thumbsToActivate = Math.floor(thumbsToActivate);
    thumbsSwiper.slides.forEach((slideEl) => slideEl.classList.remove(thumbActiveClass));
    if (thumbsSwiper.params.loop || thumbsSwiper.params.virtual && thumbsSwiper.params.virtual.enabled) {
      for (let i = 0; i < thumbsToActivate; i += 1) {
        elementChildren(thumbsSwiper.slidesEl, `[data-swiper-slide-index="${swiper.realIndex + i}"]`).forEach((slideEl) => {
          slideEl.classList.add(thumbActiveClass);
        });
      }
    } else {
      for (let i = 0; i < thumbsToActivate; i += 1) {
        if (thumbsSwiper.slides[swiper.realIndex + i]) {
          thumbsSwiper.slides[swiper.realIndex + i].classList.add(thumbActiveClass);
        }
      }
    }
    const autoScrollOffset = swiper.params.thumbs.autoScrollOffset;
    const useOffset = autoScrollOffset && !thumbsSwiper.params.loop;
    if (swiper.realIndex !== thumbsSwiper.realIndex || useOffset) {
      const currentThumbsIndex = thumbsSwiper.activeIndex;
      let newThumbsIndex;
      let direction;
      if (thumbsSwiper.params.loop) {
        const newThumbsSlide = thumbsSwiper.slides.find((slideEl) => slideEl.getAttribute("data-swiper-slide-index") === `${swiper.realIndex}`);
        newThumbsIndex = thumbsSwiper.slides.indexOf(newThumbsSlide);
        direction = swiper.activeIndex > swiper.previousIndex ? "next" : "prev";
      } else {
        newThumbsIndex = swiper.realIndex;
        direction = newThumbsIndex > swiper.previousIndex ? "next" : "prev";
      }
      if (useOffset) {
        newThumbsIndex += direction === "next" ? autoScrollOffset : -1 * autoScrollOffset;
      }
      if (thumbsSwiper.visibleSlidesIndexes && thumbsSwiper.visibleSlidesIndexes.indexOf(newThumbsIndex) < 0) {
        if (thumbsSwiper.params.centeredSlides) {
          if (newThumbsIndex > currentThumbsIndex) {
            newThumbsIndex = newThumbsIndex - Math.floor(slidesPerView / 2) + 1;
          } else {
            newThumbsIndex = newThumbsIndex + Math.floor(slidesPerView / 2) - 1;
          }
        } else if (newThumbsIndex > currentThumbsIndex && thumbsSwiper.params.slidesPerGroup === 1)
          ;
        thumbsSwiper.slideTo(newThumbsIndex, initial ? 0 : void 0);
      }
    }
  }
  on2("beforeInit", () => {
    const {
      thumbs
    } = swiper.params;
    if (!thumbs || !thumbs.swiper)
      return;
    if (typeof thumbs.swiper === "string" || thumbs.swiper instanceof HTMLElement) {
      const document2 = getDocument();
      const getThumbsElementAndInit = () => {
        const thumbsElement = typeof thumbs.swiper === "string" ? document2.querySelector(thumbs.swiper) : thumbs.swiper;
        if (thumbsElement && thumbsElement.swiper) {
          thumbs.swiper = thumbsElement.swiper;
          init();
          update2(true);
        } else if (thumbsElement) {
          const eventName = `${swiper.params.eventsPrefix}init`;
          const onThumbsSwiper = (e) => {
            thumbs.swiper = e.detail[0];
            thumbsElement.removeEventListener(eventName, onThumbsSwiper);
            init();
            update2(true);
            thumbs.swiper.update();
            swiper.update();
          };
          thumbsElement.addEventListener(eventName, onThumbsSwiper);
        }
        return thumbsElement;
      };
      const watchForThumbsToAppear = () => {
        if (swiper.destroyed)
          return;
        const thumbsElement = getThumbsElementAndInit();
        if (!thumbsElement) {
          requestAnimationFrame(watchForThumbsToAppear);
        }
      };
      requestAnimationFrame(watchForThumbsToAppear);
    } else {
      init();
      update2(true);
    }
  });
  on2("slideChange update resize observerUpdate", () => {
    update2();
  });
  on2("setTransition", (_s, duration) => {
    const thumbsSwiper = swiper.thumbs.swiper;
    if (!thumbsSwiper || thumbsSwiper.destroyed)
      return;
    thumbsSwiper.setTransition(duration);
  });
  on2("beforeDestroy", () => {
    const thumbsSwiper = swiper.thumbs.swiper;
    if (!thumbsSwiper || thumbsSwiper.destroyed)
      return;
    if (swiperCreated) {
      thumbsSwiper.destroy();
    }
  });
  Object.assign(swiper.thumbs, {
    init,
    update: update2
  });
}
function Grid(_ref) {
  let {
    swiper,
    extendParams,
    on: on2
  } = _ref;
  extendParams({
    grid: {
      rows: 1,
      fill: "column"
    }
  });
  let slidesNumberEvenToRows;
  let slidesPerRow;
  let numFullColumns;
  let wasMultiRow;
  const getSpaceBetween = () => {
    let spaceBetween = swiper.params.spaceBetween;
    if (typeof spaceBetween === "string" && spaceBetween.indexOf("%") >= 0) {
      spaceBetween = parseFloat(spaceBetween.replace("%", "")) / 100 * swiper.size;
    } else if (typeof spaceBetween === "string") {
      spaceBetween = parseFloat(spaceBetween);
    }
    return spaceBetween;
  };
  const initSlides = (slides) => {
    const {
      slidesPerView
    } = swiper.params;
    const {
      rows,
      fill
    } = swiper.params.grid;
    const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : slides.length;
    numFullColumns = Math.floor(slidesLength / rows);
    if (Math.floor(slidesLength / rows) === slidesLength / rows) {
      slidesNumberEvenToRows = slidesLength;
    } else {
      slidesNumberEvenToRows = Math.ceil(slidesLength / rows) * rows;
    }
    if (slidesPerView !== "auto" && fill === "row") {
      slidesNumberEvenToRows = Math.max(slidesNumberEvenToRows, slidesPerView * rows);
    }
    slidesPerRow = slidesNumberEvenToRows / rows;
  };
  const unsetSlides = () => {
    if (swiper.slides) {
      swiper.slides.forEach((slide2) => {
        if (slide2.swiperSlideGridSet) {
          slide2.style.height = "";
          slide2.style[swiper.getDirectionLabel("margin-top")] = "";
        }
      });
    }
  };
  const updateSlide = (i, slide2, slides) => {
    const {
      slidesPerGroup
    } = swiper.params;
    const spaceBetween = getSpaceBetween();
    const {
      rows,
      fill
    } = swiper.params.grid;
    const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : slides.length;
    let newSlideOrderIndex;
    let column;
    let row;
    if (fill === "row" && slidesPerGroup > 1) {
      const groupIndex = Math.floor(i / (slidesPerGroup * rows));
      const slideIndexInGroup = i - rows * slidesPerGroup * groupIndex;
      const columnsInGroup = groupIndex === 0 ? slidesPerGroup : Math.min(Math.ceil((slidesLength - groupIndex * rows * slidesPerGroup) / rows), slidesPerGroup);
      row = Math.floor(slideIndexInGroup / columnsInGroup);
      column = slideIndexInGroup - row * columnsInGroup + groupIndex * slidesPerGroup;
      newSlideOrderIndex = column + row * slidesNumberEvenToRows / rows;
      slide2.style.order = newSlideOrderIndex;
    } else if (fill === "column") {
      column = Math.floor(i / rows);
      row = i - column * rows;
      if (column > numFullColumns || column === numFullColumns && row === rows - 1) {
        row += 1;
        if (row >= rows) {
          row = 0;
          column += 1;
        }
      }
    } else {
      row = Math.floor(i / slidesPerRow);
      column = i - row * slidesPerRow;
    }
    slide2.row = row;
    slide2.column = column;
    slide2.style.height = `calc((100% - ${(rows - 1) * spaceBetween}px) / ${rows})`;
    slide2.style[swiper.getDirectionLabel("margin-top")] = row !== 0 ? spaceBetween && `${spaceBetween}px` : "";
    slide2.swiperSlideGridSet = true;
  };
  const updateWrapperSize = (slideSize, snapGrid) => {
    const {
      centeredSlides,
      roundLengths
    } = swiper.params;
    const spaceBetween = getSpaceBetween();
    const {
      rows
    } = swiper.params.grid;
    swiper.virtualSize = (slideSize + spaceBetween) * slidesNumberEvenToRows;
    swiper.virtualSize = Math.ceil(swiper.virtualSize / rows) - spaceBetween;
    if (!swiper.params.cssMode) {
      swiper.wrapperEl.style[swiper.getDirectionLabel("width")] = `${swiper.virtualSize + spaceBetween}px`;
    }
    if (centeredSlides) {
      const newSlidesGrid = [];
      for (let i = 0; i < snapGrid.length; i += 1) {
        let slidesGridItem = snapGrid[i];
        if (roundLengths)
          slidesGridItem = Math.floor(slidesGridItem);
        if (snapGrid[i] < swiper.virtualSize + snapGrid[0])
          newSlidesGrid.push(slidesGridItem);
      }
      snapGrid.splice(0, snapGrid.length);
      snapGrid.push(...newSlidesGrid);
    }
  };
  const onInit = () => {
    wasMultiRow = swiper.params.grid && swiper.params.grid.rows > 1;
  };
  const onUpdate = () => {
    const {
      params,
      el
    } = swiper;
    const isMultiRow = params.grid && params.grid.rows > 1;
    if (wasMultiRow && !isMultiRow) {
      el.classList.remove(`${params.containerModifierClass}grid`, `${params.containerModifierClass}grid-column`);
      numFullColumns = 1;
      swiper.emitContainerClasses();
    } else if (!wasMultiRow && isMultiRow) {
      el.classList.add(`${params.containerModifierClass}grid`);
      if (params.grid.fill === "column") {
        el.classList.add(`${params.containerModifierClass}grid-column`);
      }
      swiper.emitContainerClasses();
    }
    wasMultiRow = isMultiRow;
  };
  on2("init", onInit);
  on2("update", onUpdate);
  swiper.grid = {
    initSlides,
    unsetSlides,
    updateSlide,
    updateWrapperSize
  };
}
const EventBus = () => {
  let eventBus = {};
  let emits = [];
  function listen(events3, handler) {
    [...[].concat(events3)].forEach((event) => {
      eventBus[event] = (eventBus[event] || []).concat(handler);
    });
    return this;
  }
  function remove(event, extraHandler) {
    eventBus[event] = [...eventBus[event]].filter(
      (handler) => handler !== extraHandler
    );
    return this;
  }
  function emit(event, data) {
    if (!emits.includes(event)) {
      emits.push(event);
    }
    if (!eventBus[event]) {
      return false;
    }
    return [...eventBus[event]].forEach((handler) => handler(data));
  }
  function all() {
    return eventBus;
  }
  function clear() {
    eventBus = {};
    emits = [];
  }
  function events2() {
    return emits;
  }
  return Object.freeze({
    listen,
    emit,
    all,
    events: events2,
    remove,
    clear
  });
};
let hasPassiveEvents = false;
if (typeof window !== "undefined") {
  const passiveTestOptions = {
    get passive() {
      hasPassiveEvents = true;
      return void 0;
    }
  };
  window.addEventListener("testPassive", null, passiveTestOptions);
  window.removeEventListener("testPassive", null, passiveTestOptions);
}
const isIosDevice$1 = typeof window !== "undefined" && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
let locks = [];
let locksIndex = /* @__PURE__ */ new Map();
let documentListenerAdded = false;
let initialClientY = -1;
let previousBodyOverflowSetting;
let htmlStyle;
let bodyStyle;
let previousBodyPaddingRight;
const allowTouchMove = (el) => locks.some((lock) => {
  if (lock.options.allowTouchMove && lock.options.allowTouchMove(el)) {
    return true;
  }
  return false;
});
const preventDefault = (rawEvent) => {
  const e = rawEvent || window.event;
  if (allowTouchMove(e.target)) {
    return true;
  }
  if (e.touches.length > 1)
    return true;
  if (e.preventDefault)
    e.preventDefault();
  return false;
};
const setOverflowHidden = (options) => {
  if (previousBodyPaddingRight === void 0) {
    const reserveScrollBarGap = !!options && options.reserveScrollBarGap === true;
    const scrollBarGap = window.innerWidth - document.documentElement.getBoundingClientRect().width;
    if (reserveScrollBarGap && scrollBarGap > 0) {
      const computedBodyPaddingRight = parseInt(
        window.getComputedStyle(document.body).getPropertyValue("padding-right"),
        10
      );
      previousBodyPaddingRight = document.body.style.paddingRight;
      document.body.style.paddingRight = `${computedBodyPaddingRight + scrollBarGap}px`;
    }
  }
  if (previousBodyOverflowSetting === void 0) {
    previousBodyOverflowSetting = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
};
const restoreOverflowSetting = () => {
  if (previousBodyPaddingRight !== void 0) {
    document.body.style.paddingRight = previousBodyPaddingRight;
    previousBodyPaddingRight = void 0;
  }
  if (previousBodyOverflowSetting !== void 0) {
    document.body.style.overflow = previousBodyOverflowSetting;
    previousBodyOverflowSetting = void 0;
  }
};
const setPositionFixed = () => window.requestAnimationFrame(() => {
  const $html = document.documentElement;
  const $body = document.body;
  if (bodyStyle === void 0) {
    htmlStyle = { ...$html.style };
    bodyStyle = { ...$body.style };
    const { scrollY, scrollX, innerHeight } = window;
    $html.style.height = "100%";
    $html.style.overflow = "hidden";
    $body.style.position = "fixed";
    $body.style.top = `${-scrollY}px`;
    $body.style.left = `${-scrollX}px`;
    $body.style.width = "100%";
    $body.style.height = "auto";
    $body.style.overflow = "hidden";
    setTimeout(
      () => window.requestAnimationFrame(() => {
        const bottomBarHeight = innerHeight - window.innerHeight;
        if (bottomBarHeight && scrollY >= innerHeight) {
          $body.style.top = -(scrollY + bottomBarHeight) + "px";
        }
      }),
      300
    );
  }
});
const restorePositionSetting = () => {
  if (bodyStyle !== void 0) {
    const y = -parseInt(document.body.style.top, 10);
    const x = -parseInt(document.body.style.left, 10);
    const $html = document.documentElement;
    const $body = document.body;
    $html.style.height = (htmlStyle == null ? void 0 : htmlStyle.height) || "";
    $html.style.overflow = (htmlStyle == null ? void 0 : htmlStyle.overflow) || "";
    $body.style.position = bodyStyle.position || "";
    $body.style.top = bodyStyle.top || "";
    $body.style.left = bodyStyle.left || "";
    $body.style.width = bodyStyle.width || "";
    $body.style.height = bodyStyle.height || "";
    $body.style.overflow = bodyStyle.overflow || "";
    window.scrollTo(x, y);
    bodyStyle = void 0;
  }
};
const isTargetElementTotallyScrolled = (targetElement) => targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false;
const handleScroll = (event, targetElement) => {
  const clientY = event.targetTouches[0].clientY - initialClientY;
  if (allowTouchMove(event.target)) {
    return false;
  }
  if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
    return preventDefault(event);
  }
  if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
    return preventDefault(event);
  }
  event.stopPropagation();
  return true;
};
const disableBodyScroll = (targetElement, options) => {
  if (!targetElement) {
    console.error(
      "disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices."
    );
    return;
  }
  locksIndex.set(
    targetElement,
    (locksIndex == null ? void 0 : locksIndex.get(targetElement)) ? (locksIndex == null ? void 0 : locksIndex.get(targetElement)) + 1 : 1
  );
  if (locks.some((lock2) => lock2.targetElement === targetElement)) {
    return;
  }
  const lock = {
    targetElement,
    options: options || {}
  };
  locks = [...locks, lock];
  if (isIosDevice$1) {
    setPositionFixed();
  } else {
    setOverflowHidden(options);
  }
  if (isIosDevice$1) {
    targetElement.ontouchstart = (event) => {
      if (event.targetTouches.length === 1) {
        initialClientY = event.targetTouches[0].clientY;
      }
    };
    targetElement.ontouchmove = (event) => {
      if (event.targetTouches.length === 1) {
        handleScroll(event, targetElement);
      }
    };
    if (!documentListenerAdded) {
      document.addEventListener(
        "touchmove",
        preventDefault,
        hasPassiveEvents ? { passive: false } : void 0
      );
      documentListenerAdded = true;
    }
  }
};
const clearAllBodyScrollLocks = () => {
  if (isIosDevice$1) {
    locks.forEach((lock) => {
      lock.targetElement.ontouchstart = null;
      lock.targetElement.ontouchmove = null;
    });
    if (documentListenerAdded) {
      document.removeEventListener(
        "touchmove",
        preventDefault,
        hasPassiveEvents ? { passive: false } : void 0
      );
      documentListenerAdded = false;
    }
    initialClientY = -1;
  }
  if (isIosDevice$1) {
    restorePositionSetting();
  } else {
    restoreOverflowSetting();
  }
  locks = [];
  locksIndex.clear();
};
const enableBodyScroll = (targetElement) => {
  if (!targetElement) {
    console.error(
      "enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices."
    );
    return;
  }
  locksIndex.set(
    targetElement,
    (locksIndex == null ? void 0 : locksIndex.get(targetElement)) ? (locksIndex == null ? void 0 : locksIndex.get(targetElement)) - 1 : 0
  );
  if ((locksIndex == null ? void 0 : locksIndex.get(targetElement)) === 0) {
    locks = locks.filter((lock) => lock.targetElement !== targetElement);
    locksIndex == null ? void 0 : locksIndex.delete(targetElement);
  }
  if (isIosDevice$1) {
    targetElement.ontouchstart = null;
    targetElement.ontouchmove = null;
    if (documentListenerAdded && locks.length === 0) {
      document.removeEventListener(
        "touchmove",
        preventDefault,
        hasPassiveEvents ? { passive: false } : void 0
      );
      documentListenerAdded = false;
    }
  }
  if (locks.length === 0) {
    if (isIosDevice$1) {
      restorePositionSetting();
    } else {
      restoreOverflowSetting();
    }
  }
};
const bodyScrollLock = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  clearAllBodyScrollLocks,
  disableBodyScroll,
  enableBodyScroll
}, Symbol.toStringTag, { value: "Module" }));
const selectors$6 = {
  container: ".js-accordion-container",
  content: ".js-accordion-content",
  control: ".js-accordion-control",
  item: ".js-accordion-item",
  inner: ".js-accordion-inner"
};
const Accordion = (config = {}) => {
  const cssClasses2 = window.themeCore.utils.cssClasses;
  const extendDefaults2 = window.themeCore.utils.extendDefaults;
  const on2 = window.themeCore.utils.on;
  const focusable2 = window.themeCore.utils.focusable;
  const defaults2 = {
    singleOpen: false,
    expandInitial: false,
    expandAll: false
  };
  const settings = extendDefaults2(defaults2, config);
  if (settings.initiated) {
    return;
  }
  let containers = [];
  let accordions = [];
  let isProcessing = false;
  function init() {
    containers = document.querySelectorAll(selectors$6.container);
    accordions = [];
    containers.forEach((container) => {
      accordions.push({
        container,
        controls: [...container.querySelectorAll(selectors$6.control)],
        content: [...container.querySelectorAll(selectors$6.content)],
        items: [...container.querySelectorAll(selectors$6.item)]
      });
    });
    setInnerHeight();
    setDefaultState();
    setEventListeners();
    settings.initiated = true;
  }
  function setInnerHeight() {
    accordions.forEach(({ content }) => {
      content.forEach((item) => {
        if (!item.closest(selectors$6.item) || !item.closest(selectors$6.item).classList.contains(cssClasses2.active)) {
          unsetTabIndexOnTarget(item);
          item.style.height = 0;
        } else {
          setTabIndexOnTarget(item);
        }
      });
    });
  }
  function setDefaultState() {
    if (settings.expandAll) {
      expandAllItems();
    }
    if (settings.expandInitial) {
      expandInitialItem();
    }
  }
  function setEventListeners() {
    accordions.forEach(({ container }) => {
      on2("click", container, handleClickEvent);
      on2("keydown", container, handleKeyboardEvent);
    });
  }
  function unsetTabIndexOnTarget(target) {
    focusable2(target).forEach(
      (element) => element.setAttribute("tabindex", -1)
    );
  }
  function setTabIndexOnTarget(target) {
    focusable2(target).forEach(
      (element) => element.setAttribute("tabindex", 0)
    );
  }
  function handleClickEvent(event) {
    const control = event.target.closest(selectors$6.control);
    if (!control || !isTargetControl(control)) {
      return;
    }
    event.preventDefault();
    toggleItem(event.target);
  }
  function handleKeyboardEvent(event) {
    if (!isTargetControl(event.target)) {
      return;
    }
    if (isKeyPressArrowUp(event) || isKeyPressArrowDown(event)) {
      handleArrowEvents(event);
      return;
    }
    if (isKeyPressHome(event) || isKeyPressEnd(event)) {
      handleHomeEndEvents(event);
    }
  }
  function handleArrowEvents(event) {
    event.preventDefault();
    const container = event.target.closest(selectors$6.container);
    const currentAccordion = accordions.find(
      ({ container: accordionContainer }) => container === accordionContainer
    );
    const index = currentAccordion.controls.indexOf(event.target);
    const direction = isKeyPressArrowUp(event) ? -1 : 1;
    const length = currentAccordion.controls.length;
    const newIndex = (index + length + direction) % length;
    currentAccordion.controls[newIndex].focus();
  }
  function handleHomeEndEvents(event) {
    event.preventDefault();
    const container = event.target.closest(selectors$6.container);
    const currentAccordion = accordions.find(
      ({ container: accordionContainer }) => container === accordionContainer
    );
    if (isKeyPressHome(event)) {
      currentAccordion.controls[0].focus();
      return;
    }
    if (isKeyPressEnd(event)) {
      currentAccordion.controls[currentAccordion.controls.length - 1].focus();
    }
  }
  function expandItem(element) {
    if (!element) {
      return;
    }
    if (isProcessing) {
      return;
    }
    const elementContent = element.querySelector(selectors$6.content);
    animateContent(element, false);
    setTabIndexOnTarget(elementContent);
    element.classList.add(cssClasses2.active);
    element.querySelector(selectors$6.control).setAttribute("aria-expanded", true);
  }
  function animateContent(element, hide) {
    if (!element) {
      return;
    }
    isProcessing = true;
    const animationDelay = 500;
    const elementContent = element.querySelector(selectors$6.content);
    const innerHeight = element.querySelector(selectors$6.inner).offsetHeight;
    if (hide) {
      elementContent.style.height = innerHeight + "px";
      setTimeout(() => {
        elementContent.style.height = 0;
        isProcessing = false;
      }, 0);
    } else {
      elementContent.style.height = innerHeight + "px";
      setTimeout(() => {
        elementContent.removeAttribute("style");
        isProcessing = false;
      }, animationDelay);
    }
  }
  function collapseItem(element) {
    if (!element) {
      return;
    }
    if (isProcessing) {
      return;
    }
    animateContent(element, true);
    const elementContent = element.querySelector(selectors$6.content);
    unsetTabIndexOnTarget(elementContent);
    element.classList.remove(cssClasses2.active);
    element.querySelector(selectors$6.control).setAttribute("aria-expanded", false);
  }
  function isItemExpanded(element) {
    return element.classList.contains(cssClasses2.active);
  }
  function collapseUnselectedItems(element) {
    const container = element.closest(selectors$6.container);
    const currentAccordion = accordions.find(
      ({ container: accordionContainer }) => container === accordionContainer
    );
    if (currentAccordion) {
      currentAccordion.items.forEach((item) => {
        if (isItemExpanded(item) && item !== element) {
          collapseItem(item);
        }
      });
    }
  }
  function toggleItem(control) {
    const item = control.closest(selectors$6.item);
    if (settings.singleOpen) {
      collapseUnselectedItems(item);
    }
    if (isItemExpanded(item)) {
      collapseItem(item);
      return;
    }
    expandItem(item);
  }
  function isKeyPressArrowDown(event) {
    return event.keyCode === 40 || event.keyCode === 34;
  }
  function isKeyPressArrowUp(event) {
    return event.keyCode === 38 || event.keyCode === 33;
  }
  function isKeyPressEnd(event) {
    return event.keyCode === 35;
  }
  function isKeyPressHome(event) {
    return event.keyCode === 36;
  }
  function isTargetControl(target) {
    return accordions.find(({ controls }) => controls.includes(target));
  }
  function expandAllItems() {
    accordions.forEach(({ items }) => {
      items.forEach((element) => {
        expandItem(element);
      });
    });
  }
  function expandInitialItem() {
    accordions.forEach(({ items }) => {
      items.forEach((element, index) => {
        if (index === 0) {
          expandItem(element);
          return;
        }
        collapseItem(element);
      });
    });
  }
  function collapseAllItems(selector) {
    accordions.forEach(({ items, container }) => {
      if (!selector) {
        items.forEach((item) => {
          collapseItem(item);
        });
      }
      if (typeof selector === "string") {
        selector = [selector];
      }
      if (Array.isArray(selector)) {
        const parent = container.parentElement;
        selector.forEach((elem) => {
          const container2 = parent.querySelector(elem);
          if (container2) {
            items.forEach((item) => {
              collapseItem(item);
            });
          }
        });
      }
    });
  }
  function initiated() {
    return !!settings.initiated;
  }
  function getContainers() {
    return containers || [];
  }
  function getAccordions() {
    return accordions || [];
  }
  function setTabIndex(selector, mode = "all", index = -1) {
    if (!selector) {
      return;
    }
    const allContainsSelector = [...document.querySelectorAll(selector)];
    const accordion = accordions.find(
      (accordion2) => allContainsSelector.find(
        (element) => element === accordion2.container
      )
    );
    if (!accordion) {
      return;
    }
    let targetContent = [];
    switch (mode) {
      case "active":
        accordion.items.filter(
          (item) => item.classList.contains(cssClasses2.active)
        ).forEach((item) => {
          accordion.content.forEach((content) => {
            if (item.contains(content)) {
              targetContent.push(content);
            }
          });
        });
        break;
      case "hidden":
        accordion.items.filter(
          (item) => !item.classList.contains(cssClasses2.active)
        ).forEach((item) => {
          accordion.content.forEach((content) => {
            if (item.contains(content)) {
              targetContent.push(content);
            }
          });
        });
        break;
      case "all":
      default:
        targetContent = accordion.content;
        break;
    }
    targetContent.forEach(
      (content) => focusable2(content).forEach((element) => {
        element.setAttribute("tabindex", index);
      })
    );
  }
  return Object.freeze({
    init,
    initiated,
    collapseAllItems,
    expandAllItems,
    expandInitialItem,
    getContainers,
    getAccordions,
    setTabIndex
  });
};
const selectors$5 = {
  container: ".js-popover-container",
  button: ".js-popover-button",
  content: ".js-popover-content"
};
const Popover = () => {
  const cssClasses2 = window.themeCore.utils.cssClasses;
  function init() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest(selectors$5.button);
      if (!button) {
        const contents = [...document.querySelectorAll(selectors$5.content)];
        contents.forEach((content2) => {
          content2.classList.remove(cssClasses2.active);
          const container2 = content2.closest(selectors$5.container);
          if (!container2) {
            return;
          }
          const button2 = container2.querySelector(selectors$5.button);
          if (!button2) {
            return;
          }
          button2.setAttribute("aria-expanded", "false");
        });
        return;
      }
      const container = button.closest(selectors$5.container);
      if (!container) {
        return;
      }
      const content = container.querySelector(selectors$5.content);
      if (!content) {
        return;
      }
      content.classList.toggle(cssClasses2.active);
      const prevExpanded = button.getAttribute("aria-expanded");
      if (prevExpanded) {
        button.setAttribute("aria-expanded", prevExpanded === "true" ? "false" : "true");
      }
    });
  }
  return Object.freeze({
    init
  });
};
const selectors$4 = {
  productCard: ".js-product-card",
  swatch: ".js-product-card-swatch",
  video: ".js-product-card-video",
  imagesWrapper: ".js-product-card-images-wrapper",
  quickViewButton: ".js-product-card-quick-view-button",
  minQuantity: ".js-product-card-min-value",
  productCardImageWrapper: ".js-product-card-image-wrapper"
};
const attributes$2 = {
  productHandle: "data-product-card-handle",
  swatchIndex: "data-swatch",
  imageIndex: "data-image",
  variant: "data-variant",
  preorder: "data-preorder"
};
const ProductCard = () => {
  let initiatedState = false;
  if (initiatedState) {
    return;
  }
  let currentHoverVideo = null;
  const cssClasses2 = window.themeCore.utils.cssClasses;
  function init() {
    setEventListeners();
    initiatedState = true;
  }
  function setEventListeners() {
    document.addEventListener("click", (event) => {
      if (isTargetQuickView(event.target)) {
        quickViewButtonHandler(event);
      }
      if (isTargetSwatch(event.target)) {
        swatchHandler(event);
      }
    });
    document.addEventListener("mouseover", (event) => {
      if (getClosestVideo(event.target)) {
        currentHoverVideo = getClosestVideo(event.target);
        productCardVideoPlay(currentHoverVideo);
        currentHoverVideo.addEventListener(
          "mouseleave",
          () => {
            productCardVideoPause(currentHoverVideo);
            currentHoverVideo = null;
          },
          { once: true }
        );
      }
    });
  }
  function quickViewButtonHandler(event) {
    const button = getClosestQuickViewButton(event.target);
    const productCard = getClosestProductCard(event.target);
    const productHandle = getProductHandle(button);
    const variantId = getVariantId(getClosestProductCard(button));
    const hasMultipleVariants = !button.hasAttribute("data-variant");
    hasMultipleVariants ? emitQuickViewClickEvent(productHandle, variantId, button) : emitCartEvent(getVariantId(button), getMinQuantity(productCard), button, productCard);
  }
  function productCardVideoPlay(video) {
    if (!video) {
      return;
    }
    video.play();
  }
  function productCardVideoPause(video) {
    if (!video) {
      return;
    }
    video.pause();
  }
  function swatchHandler(event) {
    let swatch = getClosestSwatch(event.target);
    if (swatch.classList.contains(cssClasses2.active)) {
      return;
    }
    toggleSwatch(swatch);
  }
  function isTargetQuickView(target) {
    return !!getClosestQuickViewButton(target);
  }
  function isTargetSwatch(target) {
    return !!getClosestSwatch(target);
  }
  function getClosestQuickViewButton(target) {
    return target.closest(selectors$4.quickViewButton);
  }
  function getClosestSwatch(target) {
    return target.closest(selectors$4.swatch);
  }
  function getClosestProductCard(element) {
    return element.closest(selectors$4.productCard);
  }
  function getClosestVideo(element) {
    return element.closest(selectors$4.video);
  }
  function getProductHandle(target) {
    return target.getAttribute(attributes$2.productHandle);
  }
  function getVariantId(target) {
    const currentImage = target.querySelector(`${selectors$4.imagesWrapper}.${cssClasses2.active}`);
    if (target && target.getAttribute(attributes$2.variant)) {
      return target.getAttribute(attributes$2.variant);
    } else if (currentImage && currentImage.getAttribute(attributes$2.variant)) {
      return currentImage.getAttribute(attributes$2.variant);
    }
  }
  function toggleSwatch(swatch) {
    const productCard = getClosestProductCard(swatch);
    const swatchIndex = getSwatchIndex(swatch);
    const swatches = [...productCard.querySelectorAll(selectors$4.swatch)];
    removeActiveClasses(swatches);
    setCurrentElementActive(swatch);
    toggleImage(productCard, swatchIndex);
    const productCardImage = productCard.querySelector(selectors$4.productCardImageWrapper);
    if (!productCardImage)
      return;
    productCardImage.style.display = "none";
  }
  function toggleImage(productCard, swatchIndex) {
    const images2 = [...productCard.querySelectorAll(selectors$4.imagesWrapper)];
    let currentImage = images2.find((image) => getImageIndex(image) === swatchIndex);
    removeActiveClasses(images2);
    setCurrentElementActive(currentImage);
  }
  function getSwatchIndex(swatch) {
    return swatch.getAttribute(attributes$2.swatchIndex);
  }
  function getImageIndex(image) {
    return image.getAttribute(attributes$2.imageIndex);
  }
  function removeActiveClasses(elements) {
    elements.forEach((element) => element.classList.remove(cssClasses2.active));
  }
  function setCurrentElementActive(element) {
    if (!element) {
      return;
    }
    element.classList.add(cssClasses2.active);
  }
  function emitQuickViewClickEvent(handle, variantId, button) {
    window.themeCore.EventBus.emit("product-card:quick-view:clicked", {
      productHandle: handle,
      variant: variantId,
      emitButton: button
    });
  }
  async function emitCartEvent(variantId, quantity, button, productCard) {
    try {
      const params = {
        id: variantId,
        quantity
      };
      togglePreloader(button, true);
      if (productCard && productCard.hasAttribute(attributes$2.preorder)) {
        params.properties = params.properties || {};
        params.properties["_Pre-order"] = "true";
      }
      await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.ADD_TO_CART, params);
      setTimeout(() => {
        togglePreloader(button, false);
      }, 120);
      scheduleSilentCartSync();
    } catch (error) {
      onQuantityError(error);
      setTimeout(() => {
        togglePreloader(button, false);
      }, 500);
    }
  }
  function togglePreloader(button, isShown) {
    return button.classList.toggle(cssClasses2.loading, isShown);
  }
  function onQuantityError(error) {
    const CartNotificationError = window.themeCore.CartNotificationError;
    CartNotificationError.addNotification(error.description);
    CartNotificationError.open();
  }
  function getMinQuantity(target) {
    const minQuantityEl = target.querySelector(selectors$4.minQuantity);
    if (!minQuantityEl) {
      return 1;
    }
    return Number(minQuantityEl.value) || 1;
  }
  function initiated() {
    return !!initiatedState;
  }
  return Object.freeze({
    init,
    initiated
  });
};
const QuickView = () => {
  let form = null;
  let loading = false;
  let currentVariant = null;
  let hiddenSelect = null;
  let formButton = null;
  let productLink = null;
  let price = null;
  let sku = null;
  let productStock = null;
  let productHandle = null;
  let swatches = null;
  let sliderEl = null;
  let slider = null;
  let formError = null;
  let formErrorWrapper = null;
  let quantity = null;
  let quantityWrapper = null;
  let quantityWidgetEl = null;
  const buttonContent = {};
  let focusTarget = null;
  const Video2 = window.themeCore.utils.Video;
  let videos = [];
  let previousVariantId;
  let convertFormData2 = null;
  const Toggle2 = window.themeCore.utils.Toggle;
  const overlay2 = window.themeCore.utils.overlay;
  const Swiper2 = window.themeCore.utils.Swiper;
  let container;
  const cssClasses2 = {
    swiper: "swiper",
    swiperWrapper: "swiper-wrapper",
    stacked: "quick-view__media-stacked",
    pausedVideo: "is-paused-video",
    ...window.themeCore.utils.cssClasses
  };
  const selectors2 = {
    quickView: ".js-quick-view",
    form: ".js-quick-view-form",
    variantElemJSON: "[data-selected-variant]",
    hiddenSelect: ".js-quick-view-hidden-select",
    slider: ".js-quick-view-slider",
    swiperWrapper: ".js-quick-view-slider-wrapper",
    slide: ".js-quick-view-slider .swiper-slide",
    imageWrapper: ".js-quick-view-image-wrapper",
    placeholder: ".js-product-gallery-video-placeholder",
    paused: ".js-paused-video",
    image: ".js-quick-view-image",
    drawer: "quick-view",
    productLink: ".js-quick-view-link",
    formButton: ".js-quick-submit-button",
    price: ".js-quick-view-price",
    sku: ".js-quick-view-sku",
    productStock: ".js-quick-view-product-stock",
    fetchProductStock: ".quick-view__product-stock",
    fetchPrice: ".price",
    swatchPreview: ".js-swatch-preview",
    swatches: "[data-option]",
    media: ".js-quick-view-media",
    selectedOption: `[data-option="option1"]:checked, [data-option="option2"]:checked, [data-option="option3"]:checked, select[data-option]`,
    loader: `[data-js-overlay="quick-view"] .loader`,
    formError: ".js-quick-view-error",
    formErrorWrapper: ".js-quick-view-error-wrapper",
    quantity: "[data-quantity-input]",
    quantityWrapper: ".js-product-quantity",
    description: ".js-quick-view-description",
    volumePricing: ".js-product-volume-pricing",
    volumePricingList: ".js-product-volume-pricing-list",
    volumePricingJSON: "[data-product-qty-breaks-json]",
    volumePricingShowMore: ".js-product-volume-pricing-show-more",
    priceVolume: ".js-price-volume",
    quantityRules: ".js-product-quantity-rules",
    quantityRuleMin: ".js-product-quantity-rule-min",
    quantityRuleMax: ".js-product-quantity-rule-max",
    quantityRuleIncrement: ".js-product-quantity-rule-increment",
    quantityRuleMinVal: ".js-product-quantity-rule-min-val",
    quantityRuleMaxVal: ".js-product-quantity-rule-max-val",
    quantityRuleIncrementVal: ".js-product-quantity-rule-increment-val",
    breaksVal: ".js-price-breaks-val",
    video: ".js-video",
    modelButton: ".js-quick-view-model-button",
    modelContent: ".js-quick-view-model-content",
    quickViewImage: ".js-quick-view-image",
    sliderPagination: ".js-quick-view-slider-pagination"
  };
  const attributes2 = {
    swatchPosition: "data-swatch-position",
    slideIndex: "data-slide-index",
    isShowFirstMediaImage: "data-is-show-first-media-image"
  };
  const cachedOptions = /* @__PURE__ */ new Map();
  let fetchController = new AbortController();
  let prefetchController = new AbortController();
  function init() {
    convertFormData2 = window.themeCore.utils.convertFormData;
    initCurrentQuickView();
    setEventListeners();
    listenQuickViewVariantChange();
  }
  function listenQuickViewVariantChange() {
    window.themeCore.EventBus.listen(`quick-view:change-variant`, onChangeVariant);
  }
  function onChangeVariant({ variant }) {
    if (!variant) {
      return;
    }
    if (previousVariantId === variant.id) {
      return;
    }
    previousVariantId = variant.id;
    let variantMediaID = null;
    if (variant.featured_media) {
      variantMediaID = variant.featured_media.id;
    }
    const isDesktop = window.matchMedia("(min-width: 992px)").matches;
    if (!isDesktop)
      return;
    const mediaContainer = document.querySelector(selectors2.media);
    const mediaItems = mediaContainer.querySelectorAll(selectors2.imageWrapper);
    const currentMediaItem = [...mediaItems].find((mediaItem) => {
      const slideMediaId = mediaItem.getAttribute("data-media-id");
      return slideMediaId.includes(variantMediaID);
    });
    if (!currentMediaItem) {
      return null;
    }
    currentMediaItem.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
  function setEventListeners() {
    window.themeCore.EventBus.listen("product-card:quick-view:clicked", quickViewHandler);
    document.addEventListener("change", formChangeHandler);
    document.addEventListener("submit", formSubmitHandler);
  }
  async function quickViewHandler(event) {
    const variant = event.variant;
    productHandle = event.productHandle;
    focusTarget = event.focusTarget;
    const emitButton = event.emitButton;
    if (!productHandle || loading) {
      return;
    }
    const currentQuick = document.querySelector(selectors2.quickView);
    if (currentQuick) {
      currentQuick.remove();
      return;
    }
    emitButton && togglePreloader(emitButton, true);
    loading = true;
    overlay2({ namespace: `quick-view` }).open(true);
    const url = getProductUrl(productHandle, variant, "quick_view");
    if (!url) {
      return;
    }
    container = await getHTML(url, selectors2.quickView);
    if (!container) {
      return;
    }
    emitButton && setTimeout(() => {
      togglePreloader(emitButton, false);
    }, 500);
    cachedOptions.clear();
    initQuickViewPopup();
    await prefetchOptions(container);
    const showMoreBtn = container.querySelector(selectors2.volumePricingShowMore);
    const volumePricingList = container.querySelector(selectors2.volumePricingList);
    if (!showMoreBtn || !volumePricingList) {
      return;
    }
    showMoreBtn.addEventListener("click", function(e) {
      e.preventDefault();
      let listHiddenItems = volumePricingList.querySelectorAll(".is-hidden");
      if (!listHiddenItems.length) {
        return;
      }
      listHiddenItems.forEach(function(listItem) {
        listItem.classList.remove(cssClasses2.hidden);
      });
      showMoreBtn.classList.add(cssClasses2.hidden);
    });
  }
  function togglePreloader(button, isShown) {
    return button.classList.toggle(cssClasses2.loading, isShown);
  }
  function initCurrentQuickView() {
    container = document.querySelector(selectors2.quickView);
    if (!container) {
      return;
    }
    initQuickViewPopup();
    document.addEventListener("change", formChangeHandler);
    document.addEventListener("submit", formSubmitHandler);
  }
  function initSlider() {
    var _a;
    if (!sliderEl)
      return;
    const sliderPagination = container.querySelector(selectors2.sliderPagination);
    const dynamicBullets = JSON.parse(((_a = sliderPagination == null ? void 0 : sliderPagination.dataset) == null ? void 0 : _a.dynamic) || false);
    slider = new Swiper2(sliderEl, {
      slidesPerView: 1,
      spaceBetween: 8,
      autoplay: false,
      pagination: {
        el: sliderPagination,
        clickable: true,
        dynamicBullets,
        bulletElement: "button"
      }
    });
    document.dispatchEvent(new Event("theme:all:loaded"));
    slider.on("slideChange", function(swiper) {
      pauseVideos();
      disableTabulationOnNotActiveSlidesWithModel(swiper);
      const activeSlide = swiper.slides[swiper.activeIndex];
      if (!activeSlide) {
        return;
      }
      swiper.allowTouchMove = !(activeSlide.querySelector("model-viewer") && !activeSlide.querySelector(selectors2.modelButton));
    });
    initVideos();
    const isShowFirstMediaImage = slider.el.hasAttribute(attributes2.isShowFirstMediaImage);
    if (isShowFirstMediaImage)
      return;
    updateImage();
  }
  function updateMedia(event) {
    const mediaContainer = document.querySelector(selectors2.media);
    if (!sliderEl || !mediaContainer)
      return;
    const sliderElement = mediaContainer.querySelector(selectors2.slider);
    const swiperWrapperElement = mediaContainer.querySelector(selectors2.swiperWrapper);
    sliderEl.addEventListener("click", (event2) => {
      const modelButton = event2.target.closest(selectors2.modelButton);
      if (!modelButton) {
        return;
      }
      const slide2 = modelButton.closest(selectors2.slide);
      if (!slide2) {
        return;
      }
      const modelContent = slide2.querySelector(selectors2.modelContent);
      const sliderImage = slide2.querySelector(selectors2.quickViewImage);
      if (!modelContent || !sliderImage) {
        return;
      }
      modelContent.classList.remove(cssClasses2.hidden);
      modelButton.remove();
      sliderImage.remove();
      if (slider) {
        slider.allowTouchMove = false;
      }
    });
    if (event.matches) {
      if (slider) {
        slider.destroy();
        slider = null;
      }
      swiperWrapperElement.classList.add(cssClasses2.stacked);
      sliderElement.classList.remove(cssClasses2.swiper);
      swiperWrapperElement.classList.remove(cssClasses2.swiperWrapper);
      initVideos();
    } else {
      swiperWrapperElement.classList.remove(cssClasses2.stacked);
      sliderElement.classList.add(cssClasses2.swiper);
      swiperWrapperElement.classList.add(cssClasses2.swiperWrapper);
      initSlider();
    }
  }
  function initQuickViewPopup() {
    var _a, _b;
    hiddenSelect = container.querySelector(selectors2.hiddenSelect);
    formButton = container.querySelector(selectors2.formButton);
    productLink = container.querySelector(selectors2.productLink);
    formError = container.querySelector(selectors2.formError);
    formErrorWrapper = container.querySelector(selectors2.formErrorWrapper);
    sliderEl = container.querySelector(selectors2.slider);
    quantity = container.querySelector(selectors2.quantity);
    quantityWrapper = container.querySelector(selectors2.quantityWrapper);
    price = [...container.querySelectorAll(selectors2.price)];
    sku = [...container.querySelectorAll(selectors2.sku)];
    productStock = [...container.querySelectorAll(selectors2.productStock)];
    swatches = [...container.querySelectorAll(selectors2.swatches)];
    if (!hiddenSelect || !formButton || !productLink || !price || !formError || !formErrorWrapper || !quantity || !quantityWrapper || !swatches) {
      return;
    }
    currentVariant = findCurrentVariant(container);
    !document.body.contains(container) && document.body.append(container);
    (_b = (_a = window.Shopify) == null ? void 0 : _a.PaymentButton) == null ? void 0 : _b.init();
    const toggleConfig = {
      toggleSelector: selectors2.drawer
    };
    focusTarget && (toggleConfig.previouslySelectedElement = focusTarget);
    const drawer = Toggle2(toggleConfig);
    quantityWidgetEl = window.themeCore.utils.QuantityWidget(quantityWrapper).init();
    drawer.init({ once: true });
    drawer.open(container);
    loading = false;
    const mediaQuery = window.matchMedia("(min-width: 992px)");
    mediaQuery.addEventListener("change", updateMedia);
    updateMedia(mediaQuery);
    setTimeout(() => container.focus(), 50);
    handlerPauseVideo();
  }
  function getProductUrl(productHandle2, variant, templateSuffix, optionValues) {
    if (!productHandle2) {
      return;
    }
    const locale = window.Shopify.routes.root;
    const url = new URL(`${window.location.origin}${locale}products/${productHandle2}`);
    url.searchParams.set("view", templateSuffix);
    if (variant) {
      url.searchParams.set("variant", variant);
    }
    if (optionValues) {
      url.searchParams.set("option_values", optionValues);
    }
    return url;
  }
  async function getHTML(url, selector) {
    try {
      const response = await fetch(url);
      const resText = await response.text();
      let result = new DOMParser().parseFromString(resText, "text/html");
      if (selector) {
        result = result.querySelector(selector);
      }
      return result;
    } catch (error) {
      console.error(error);
    }
  }
  async function formChangeHandler(event) {
    const target = event.target;
    const currentForm = event.target.closest(selectors2.form);
    buttonContent.addToCard = buttonContent.addToCard || window.themeCore.translations.get("products.product.add_to_cart");
    buttonContent.preOrder = buttonContent.preOrder || window.themeCore.translations.get("products.product.pre_order");
    buttonContent.soldOut = buttonContent.soldOut || window.themeCore.translations.get("products.product.sold_out");
    buttonContent.unavailable = buttonContent.unavailable || window.themeCore.translations.get("products.product.unavailable");
    if (!currentForm || !container) {
      return;
    }
    if (target.hasAttribute("data-quantity-input")) {
      currentVariant = findCurrentVariant(currentForm);
      let quantityVariantInCart2 = getVariantCountInCart();
      updateVolumePricing(quantityVariantInCart2);
      updateQuantityRules();
      updateQuantityLabelCartCount(quantityVariantInCart2);
    }
    if (!target || !target.hasAttribute("data-option")) {
      return;
    }
    if (target.tagName === "SELECT" && target.selectedOptions.length) {
      Array.from(target.options).find((option) => option.getAttribute("selected")).removeAttribute("selected");
      target.selectedOptions[0].setAttribute("selected", "selected");
    }
    const productOptionsContainer = currentForm.querySelector(".js-quick-view-product-options");
    const selectedOptionValues = Array.from(
      productOptionsContainer.querySelectorAll("select[data-option] option[selected], input[data-option]:checked")
    ).map(({ dataset }) => dataset.optionValueId);
    const productUrl = container.getAttribute("data-url");
    const params = selectedOptionValues.length > 0 ? `${selectedOptionValues.join(",")}` : "";
    const url = `${productUrl}?view=quick_view&option_values=${params}`;
    let responseText;
    const cachedResult = cachedOptions.get(url);
    if (cachedResult) {
      responseText = cachedResult;
    } else {
      try {
        responseText = await (await fetch(url, {
          signal: fetchController.signal
        })).text();
        cachedOptions.set(url, responseText);
      } catch {
        return;
      }
    }
    prefetchOptions(currentForm);
    let fetchQuickViewContainer = new DOMParser().parseFromString(responseText, "text/html");
    let fetchQuickViewOptions = fetchQuickViewContainer.querySelector(".js-quick-view-product-options");
    productOptionsContainer.innerHTML = fetchQuickViewOptions.innerHTML;
    currentVariant = findCurrentVariant(productOptionsContainer);
    let volumePricingJSONEl = currentForm.querySelector(selectors2.volumePricingJSON);
    if (volumePricingJSONEl && fetchQuickViewContainer.querySelector(selectors2.volumePricingJSON)) {
      volumePricingJSONEl.innerHTML = fetchQuickViewContainer.querySelector(selectors2.volumePricingJSON).innerHTML;
    }
    if (document.querySelector(`#${target.id}`)) {
      document.querySelector(`#${target.id}`).focus();
    }
    form = currentForm;
    changeErrorMessage();
    updateButtons();
    updateSwatchLabelName(currentVariant, form);
    const quantityVariantInCart = getVariantCountInCart();
    updateVolumePricing(quantityVariantInCart);
    updateQuantityRules();
    updateQuantityLabelCartCount(quantityVariantInCart);
    if (currentVariant) {
      window.themeCore.EventBus.emit(`quick-view:change-variant`, { variant: currentVariant });
    }
    if (!currentVariant) {
      hidePrice();
      return;
    }
    setCurrentVariant(currentVariant.id);
    updatePrice(fetchQuickViewContainer);
    updateImage();
    updateProductInfo(fetchQuickViewContainer);
  }
  function findCurrentVariant(container2) {
    if (!container2) {
      return;
    }
    const variantJSONElement = container2.querySelector(selectors2.variantElemJSON);
    const currentVariant2 = !!variantJSONElement ? JSON.parse(variantJSONElement.innerHTML) : null;
    return currentVariant2;
  }
  function setCurrentVariant(variantId) {
    if (!variantId || !hiddenSelect) {
      return;
    }
    hiddenSelect.value = variantId;
  }
  function updateSwatchLabelName(variant, container2) {
    const swatchNameEl = container2.querySelector(".js-swatch-label-name");
    if (!swatchNameEl) {
      return;
    }
    if (!variant) {
      const swatchPosition = swatchNameEl.getAttribute(attributes2.swatchPosition);
      const swatchOptionSelected = container2.querySelector(`[data-option='option${swatchPosition}']:checked`);
      if (swatchOptionSelected) {
        swatchNameEl.textContent = swatchOptionSelected.value;
      }
      return;
    }
    const optionPosition = swatchNameEl.getAttribute(attributes2.swatchPosition);
    const optionLabel = "option" + optionPosition;
    const optionName = variant[optionLabel];
    if (!optionName) {
      return;
    }
    swatchNameEl.textContent = optionName;
  }
  function updateImage() {
    if (!currentVariant || !currentVariant.featured_media || !slider || !sliderEl) {
      return;
    }
    const featuredImage = sliderEl.querySelector(`[data-img-id="${currentVariant.featured_media.id}"]`);
    if (!featuredImage) {
      return;
    }
    const slideIndex = featuredImage.closest(`[data-slide-index]`).getAttribute(attributes2.slideIndex);
    slider.slideTo(slideIndex);
  }
  function updateButtons() {
    if (!formButton || !productLink) {
      return;
    }
    const loaderIcon = window.themeCore.utils.icons.loader;
    const setFormButtonText = (text) => {
      var _a;
      formButton.innerHTML = ((_a = formButton == null ? void 0 : formButton.dataset) == null ? void 0 : _a.type) === "primary" ? `<span data-loading>${text}</span>${loaderIcon}` : `<span data-text="${text}"><span>${text}</span></span>${loaderIcon}`;
    };
    let isPreorder = formButton.hasAttribute("data-preorder");
    if (currentVariant && currentVariant.available) {
      const buttonText = isPreorder ? buttonContent.preOrder : buttonContent.addToCard;
      formButton.disabled = false;
      setFormButtonText(buttonText);
    } else if (currentVariant && !currentVariant.available) {
      formButton.disabled = true;
      setFormButtonText(buttonContent.soldOut);
    } else {
      formButton.disabled = true;
      setFormButtonText(buttonContent.unavailable);
      return;
    }
    const url = new URL(productLink.href);
    url.searchParams.set("variant", currentVariant.id);
    productLink.href = url.pathname + url.search;
  }
  function updatePrice(quickViewDOM) {
    if (!quickViewDOM) {
      return;
    }
    let newPrice = quickViewDOM.querySelector(selectors2.price);
    if (!newPrice) {
      return;
    }
    let newPriceInner = newPrice.querySelector(".js-price");
    if (!newPriceInner) {
      return;
    }
    price.forEach((priceElement) => priceElement.innerHTML = newPriceInner.outerHTML);
  }
  function updateProductInfo(quickViewDOM) {
    if (!quickViewDOM) {
      return;
    }
    const fetchProductStock = quickViewDOM.querySelector(selectors2.fetchProductStock);
    const fetchSKU = quickViewDOM.querySelector(selectors2.sku);
    fetchProductStock && productStock.forEach((item) => item.innerHTML = fetchProductStock.outerHTML);
    fetchSKU && sku.forEach((item) => item.innerHTML = fetchSKU.outerHTML);
  }
  function hidePrice() {
    price.forEach((priceElement) => priceElement.innerHTML = "");
  }
  async function formSubmitHandler(event) {
    const form2 = event.target.closest(selectors2.form);
    const formData = form2 && new FormData(form2);
    if (!formData) {
      return;
    }
    event.preventDefault();
    formButton && togglePreloader(formButton, true);
    const errorMessage = await addToCart(event.target);
    changeErrorMessage(errorMessage);
    if (errorMessage) {
      formErrorWrapper.classList.remove(cssClasses2.hidden);
      formButton && setTimeout(() => {
        togglePreloader(formButton, false);
      }, 120);
      return;
    }
    const loader2 = document.querySelector(selectors2.loader);
    if (loader2) {
      loader2.remove();
    }
    formButton && setTimeout(() => {
      togglePreloader(formButton, false);
    }, 120);
    if (window.themeCore.objects.settings.show_cart_notification || window.themeCore.objects.settings.cart_type === "page") {
      window.themeCore.EventBus.emit(`Toggle:quick-view:close`);
      window.themeCore.EventBus.emit(`Overlay:quick-view:close`);
    }
    scheduleSilentCartSync();
  }
  function changeErrorMessage(message = "") {
    formError.innerText = message;
  }
  function updateVolumePricing(quantity2) {
    const currentVariantEl = container.querySelector("[name=id]");
    if (!currentVariantEl) {
      return;
    }
    const volumePricing = container.querySelector(selectors2.volumePricing);
    const volumePricingList = container.querySelector(selectors2.volumePricingList);
    const volumePricingJSONEl = container.querySelector(selectors2.volumePricingJSON);
    let quantityBreaks = null;
    if (!volumePricingJSONEl || !volumePricing) {
      return;
    }
    if (currentVariant) {
      const volumePricingJSON = JSON.parse(volumePricingJSONEl.innerHTML);
      quantityBreaks = volumePricingJSON[currentVariant.id].quantity_price_breaks;
      updateVariantVolumePrice(quantityBreaks);
      if (quantityBreaks.length) {
        renderVolumePriceList(quantityBreaks);
        volumePricing.classList.remove(cssClasses2.hidden);
      } else {
        volumePricing.classList.add(cssClasses2.hidden);
      }
    } else {
      volumePricing.classList.add(cssClasses2.hidden);
    }
    function renderVolumePriceList(quantityBreaks2) {
      if (!currentVariant) {
        return;
      }
      if (Number(volumePricingList.dataset.variant) === currentVariant.id) {
        return;
      }
      volumePricingList.dataset.variant = currentVariant.id;
      const showMoreBtn = container.querySelector(selectors2.volumePricingShowMore);
      const moneyFormat2 = window.themeCore.objects.shop.money_with_currency_format;
      const priceTranslation = window.themeCore.translations.get("products.product.volume_pricing.each", {
        price: window.themeCore.utils.formatMoney(currentVariant.price, moneyFormat2)
      });
      showMoreBtn.addEventListener("click", function(e) {
        e.preventDefault();
        let listHiddenItems = volumePricingList.querySelectorAll(".is-hidden");
        if (!listHiddenItems.length) {
          return;
        }
        listHiddenItems.forEach(function(listItem) {
          listItem.classList.remove(cssClasses2.hidden);
        });
        showMoreBtn.classList.add(cssClasses2.hidden);
      });
      volumePricingList.innerHTML = "";
      let defaultMinPriceHTML = `
				<li class="product-volume-pricing__list-item">
					<span>${currentVariant.quantity_rule.min}<span aria-hidden>+</span></span>
					<span>${priceTranslation}</span>
				</li>
			`;
      volumePricingList.insertAdjacentHTML("beforeend", defaultMinPriceHTML);
      quantityBreaks2.forEach(function(quantityBreak, i) {
        let hiddenClass = i >= 2 ? `${cssClasses2.hidden}` : "";
        let quantityBreakHTML = `
					<li class="product-volume-pricing__list-item ${hiddenClass}">
						<span>${quantityBreak.minimum_quantity}<span aria-hidden>+</span></span>
						<span>${quantityBreak.price_each}</span>
					</li>
				`;
        volumePricingList.insertAdjacentHTML("beforeend", quantityBreakHTML);
      });
      if (quantityBreaks2.length >= 3) {
        showMoreBtn.classList.remove(cssClasses2.hidden);
      } else {
        showMoreBtn.classList.add(cssClasses2.hidden);
      }
    }
    function updateVariantVolumePrice(quantityBreaks2) {
      const priceEls = container.querySelectorAll(selectors2.priceVolume);
      const moneyFormat2 = window.themeCore.objects.shop.money_with_currency_format;
      const priceTranslation = window.themeCore.translations.get("products.product.volume_pricing.price_at_each", {
        price: window.themeCore.utils.formatMoney(currentVariant.price, moneyFormat2)
      });
      if (!priceEls.length) {
        return;
      }
      if (!currentVariant) {
        priceEls.forEach((el) => el.classList.add(cssClasses2.hidden));
        return;
      }
      if (!quantityBreaks2 || !quantityBreaks2.length) {
        priceEls.forEach((el) => el.innerHTML = priceTranslation);
        priceEls.forEach((el) => el.classList.remove(cssClasses2.hidden));
        return;
      }
      const currentBreak = quantityBreaks2.findLast((qtyBreak) => {
        return Number(quantity2) + Number(quantityWidgetEl.quantity.value) >= qtyBreak.minimum_quantity;
      });
      if (!currentBreak) {
        priceEls.forEach((el) => el.innerHTML = priceTranslation);
        priceEls.forEach((el) => el.classList.remove(cssClasses2.hidden));
        return;
      }
      priceEls.forEach((el) => el.innerHTML = currentBreak.price_at_each);
      priceEls.forEach((el) => el.classList.remove(cssClasses2.hidden));
    }
  }
  function updateQuantityRules() {
    const quantityRules = container.querySelector(selectors2.quantityRules);
    if (!quantityRules) {
      return;
    }
    if (!currentVariant || currentVariant && !currentVariant.quantity_rule) {
      quantityRules.classList.add(cssClasses2.hidden);
      return;
    } else {
      quantityRules.classList.remove(cssClasses2.hidden);
    }
    const variantQuantityRules = currentVariant.quantity_rule;
    const quantityRuleIncrement = quantityRules.querySelector(selectors2.quantityRuleIncrement);
    const quantityRuleMin = quantityRules.querySelector(selectors2.quantityRuleMin);
    const quantityRuleMax = quantityRules.querySelector(selectors2.quantityRuleMax);
    const quantityRuleIncrementVal = quantityRules.querySelector(selectors2.quantityRuleIncrementVal);
    const quantityRuleMinVal = quantityRules.querySelector(selectors2.quantityRuleMinVal);
    const quantityRuleMaxVal = quantityRules.querySelector(selectors2.quantityRuleMaxVal);
    if (quantityRuleIncrementVal) {
      quantityRuleIncrementVal.textContent = window.themeCore.translations.get("products.product.increments_of", { number: variantQuantityRules.increment });
      quantityWidgetEl.setIncrement(variantQuantityRules.increment);
      variantQuantityRules.increment > 1 ? quantityRuleIncrement.classList.remove(cssClasses2.hidden) : quantityRuleIncrement.classList.add(cssClasses2.hidden);
    }
    if (quantityRuleMinVal) {
      quantityRuleMinVal.textContent = window.themeCore.translations.get("products.product.minimum_of", { number: variantQuantityRules.min });
      quantityWidgetEl.setMin(variantQuantityRules.min);
      quantityWidgetEl.toggleDecrease();
      quantityWidgetEl.toggleIncrease();
      variantQuantityRules.min > 1 ? quantityRuleMin.classList.remove(cssClasses2.hidden) : quantityRuleMin.classList.add(cssClasses2.hidden);
    }
    if (quantityRuleMaxVal) {
      if (variantQuantityRules.max !== null) {
        quantityRuleMaxVal.textContent = window.themeCore.translations.get("products.product.maximum_of", { number: variantQuantityRules.max });
        quantityRuleMax.classList.remove(cssClasses2.hidden);
        quantityWidgetEl.setMax(variantQuantityRules.max);
      } else {
        quantityRuleMaxVal.textContent = "";
        quantityRuleMax.classList.add(cssClasses2.hidden);
        quantityWidgetEl.setMax("");
      }
      quantityWidgetEl.toggleDecrease();
      quantityWidgetEl.toggleIncrease();
    }
    if (variantQuantityRules.increment < 2 && variantQuantityRules.min < 2 && variantQuantityRules.max === null) {
      quantityRules.classList.add(cssClasses2.hidden);
    } else {
      quantityRules.classList.remove(cssClasses2.hidden);
    }
  }
  function updateQuantityLabelCartCount(quantity2) {
    const priceBreaksEl = container.querySelector(selectors2.breaksVal);
    if (!priceBreaksEl) {
      return;
    }
    priceBreaksEl.classList.toggle(cssClasses2.hidden, !quantity2);
    if (!quantity2 || quantity2.value === "0") {
      priceBreaksEl.innerHTML = "";
    }
    priceBreaksEl.innerHTML = window.themeCore.translations.get("products.product.quantity_in_cart", { quantity: quantity2 });
  }
  function getVariantCountInCart() {
    const cartData = window.themeCore.cartObject;
    if (!cartData || !currentVariant) {
      return;
    }
    if (!cartData.items.length) {
      return 0;
    }
    const variant = cartData.items.find(function(item) {
      return item.variant_id === currentVariant.id;
    });
    if (!variant) {
      return 0;
    }
    return variant.quantity;
  }
  async function addToCart(target) {
    const formData = new FormData(target);
    const serialized = convertFormData2(formData);
    try {
      await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.ADD_TO_CART, serialized);
    } catch (error) {
      return error.description;
    }
  }
  function handlerPauseVideo() {
    const pausedElements = [...container.querySelectorAll(selectors2.paused)];
    pausedElements.forEach((paused) => {
      paused.addEventListener("click", () => {
        if (!paused.classList.contains(cssClasses2.pausedVideo)) {
          return;
        }
        pauseVideos();
        const placeholder = paused.querySelector(selectors2.placeholder);
        const videoEl = paused.querySelector(selectors2.video);
        paused.classList.remove(cssClasses2.pausedVideo);
        placeholder && placeholder.classList.add(cssClasses2.hidden);
        videos.forEach(({ player, videoWrapper, type }) => {
          if (videoWrapper === videoEl) {
            playVideo(player, type);
          }
        });
      });
    });
  }
  function playVideo(player, type) {
    const VIDEO_TYPES2 = window.themeCore.utils.VIDEO_TYPES;
    switch (type) {
      case VIDEO_TYPES2.html: {
        player.play();
        break;
      }
      case VIDEO_TYPES2.vimeo: {
        player.play();
        break;
      }
      case VIDEO_TYPES2.youtube: {
        player.mute();
        player.playVideo();
        break;
      }
      default:
        return;
    }
  }
  function pauseVideos() {
    videos.forEach(({ player }) => {
      try {
        player.pauseVideo();
      } catch (e) {
      }
      try {
        player.pause();
      } catch (e) {
      }
    });
  }
  function initVideos() {
    const slides = [...document.querySelectorAll(selectors2.slide)];
    slides.forEach((slide2) => {
      const [video] = Video2({
        videoContainer: slide2,
        options: {
          youtube: {
            controls: 1,
            showinfo: 1
          }
        }
      }).init();
      if (video) {
        videos.push(video);
      }
    });
  }
  function transformOptionsToVariants(options) {
    const groupedOptions = options.reduce((acc, option) => {
      if (!acc[option.name]) {
        acc[option.name] = [];
      }
      acc[option.name].push(option);
      return acc;
    }, {});
    const optionTypes = Object.values(groupedOptions);
    function cartesianProduct(arrays) {
      return arrays.reduce((acc, curr) => {
        const result = [];
        acc.forEach((a) => {
          curr.forEach((c) => {
            result.push([...a, c]);
          });
        });
        return result;
      }, [[]]);
    }
    const combinations = cartesianProduct(optionTypes);
    const variants = combinations.map((combination) => {
      return {
        option_values: combination.map((opt) => opt.value).join(","),
        selected: combination.every((opt) => opt.selected),
        options: combination
      };
    });
    return variants;
  }
  function sortVariantsByProximity(variants) {
    const selectedVariant = variants.find((v) => v.selected);
    if (!selectedVariant) {
      return variants;
    }
    const selectedValues = selectedVariant.options.map((opt) => opt.value);
    return variants.sort((a, b) => {
      const aMatches = a.options.filter((opt) => selectedValues.includes(opt.value)).length;
      const bMatches = b.options.filter((opt) => selectedValues.includes(opt.value)).length;
      const aDistance = selectedValues.length - aMatches;
      const bDistance = selectedValues.length - bMatches;
      if (aDistance !== bDistance) {
        return aDistance - bDistance;
      }
      return 0;
    });
  }
  async function fetchUrl(url) {
    const response = await fetch(url, {
      signal: prefetchController.signal
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  }
  async function prefetchOptions(form2) {
    const productOptionsContainer = form2.querySelector(".js-quick-view-product-options");
    if (!productOptionsContainer) {
      return;
    }
    const productSection = form2.closest("[data-section-type=product]");
    const productUrl = productSection.getAttribute("data-url");
    const allOptions = Array.from(
      productOptionsContainer.querySelectorAll("select[data-option] option, input[data-option]")
    ).map((item) => {
      var _a, _b;
      return {
        name: item.dataset.option || ((_b = (_a = item.closest("select")) == null ? void 0 : _a.dataset) == null ? void 0 : _b.option),
        value: item.dataset.optionValueId,
        selected: item.matches("[selected], :checked")
      };
    });
    const variants = transformOptionsToVariants(allOptions);
    const sortedVariants = sortVariantsByProximity(variants);
    const filteredVariants = sortedVariants.filter((variant) => !Array.from(cachedOptions.keys()).some((key) => key.includes(variant.option_values)));
    const variantsToFetch = filteredVariants.slice(0, 20);
    const urlsToFetch = variantsToFetch.map(({ option_values }) => `${productUrl}?view=quick_view&option_values=${option_values}`);
    prefetchController.abort();
    prefetchController = new AbortController();
    const fetchPromises = urlsToFetch.map((url) => fetchUrl(url));
    const results = await Promise.allSettled(fetchPromises);
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const url = urlsToFetch[index];
        cachedOptions.set(url, result.value);
      }
    });
  }
  return Object.freeze({
    init
  });
};
const ScrollDirection = (config = {}) => {
  const extendDefaults2 = window.themeCore.utils.extendDefaults;
  const on2 = window.themeCore.utils.on;
  const throttle2 = window.themeCore.utils.throttle;
  const defaults2 = {
    threshold: 5,
    throttle: 250,
    start: 100
  };
  const settings = extendDefaults2(defaults2, config);
  let previousScrollTop = 0;
  let currentScrollDirection = "";
  let newScrollDirection = "";
  function setEventListeners() {
    on2("scroll", throttle2(handleScrollEvent, settings.throttle));
  }
  function handleScrollEvent() {
    const scrollPosition = window.pageYOffset;
    setScrollState(scrollPosition);
  }
  function setScrollState(scrollPosition) {
    const scrollState = detectScrollDirection(scrollPosition);
    if (typeof scrollState === "undefined") {
      return;
    }
    if (scrollState !== currentScrollDirection) {
      currentScrollDirection = newScrollDirection;
      window.themeCore.EventBus.emit(
        "ScrollDirection:changed",
        newScrollDirection
      );
    }
  }
  function detectScrollDirection(scrollPosition) {
    if (Math.abs(previousScrollTop - scrollPosition) <= settings.threshold) {
      return newScrollDirection;
    }
    if (scrollPosition > previousScrollTop && scrollPosition > settings.start) {
      window.themeCore.EventBus.emit("ScrollDirection:down", "down");
      newScrollDirection = "down";
    } else {
      window.themeCore.EventBus.emit("ScrollDirection:up", "up");
      newScrollDirection = "up";
    }
    if (scrollPosition <= settings.start + 10) {
      window.themeCore.EventBus.emit("ScrollDirection:top", "at-top");
      newScrollDirection = "at-top";
    }
    previousScrollTop = scrollPosition;
    return newScrollDirection;
  }
  function getScrollDirection() {
    return currentScrollDirection;
  }
  return Object.freeze({
    init: setEventListeners,
    get: getScrollDirection
  });
};
const Challenge = () => {
  const selectors2 = {
    form: "main form"
  };
  function addHash() {
    const hash = window.location.hash;
    const form = document.querySelector(selectors2.form);
    if (!hash || !form || hash === "#newsletter-popup-contact-form") {
      return;
    }
    const formURL = new URL(form.action);
    formURL.hash = hash;
    form.action = formURL.toString();
  }
  function isChallenge() {
    return location.pathname === "/challenge";
  }
  function init() {
    if (!isChallenge()) {
      return;
    }
    addHash();
  }
  return Object.freeze({
    init
  });
};
const selectors$3 = {
  form: ".js-localization-form",
  input: "input[name='language_code'], input[name='country_code']",
  button: ".js-disclosure-button",
  panel: ".js-disclosure-list",
  link: ".js-disclosure-link"
};
const attributes$1 = {
  ariaExpanded: "aria-expanded",
  hidden: "hidden"
};
class localizationForm extends HTMLElement {
  constructor() {
    super();
    this.initiated = false;
    this.input = this.querySelector(selectors$3.input);
    this.button = this.querySelector(selectors$3.button);
    this.panel = this.querySelector(selectors$3.panel);
    Object.freeze(this.init());
  }
  init() {
    if (this.initiated) {
      return;
    }
    this.setEventListeners();
    this.initiated = true;
  }
  setEventListeners() {
    const openSelector = this.openSelector.bind(this);
    const closeSelector = this.closeSelector.bind(this);
    const onContainerKeyUp = this.onContainerKeyUp.bind(this);
    const onItemClick = this.onItemClick.bind(this);
    this.addEventListener("click", openSelector);
    this.addEventListener("click", closeSelector);
    this.addEventListener("keyup", onContainerKeyUp);
    this.panel.addEventListener("click", onItemClick);
  }
  hidePanel() {
    let links = this.panel.querySelectorAll(selectors$3.link);
    this.button.setAttribute(attributes$1.ariaExpanded, "false");
    this.panel.setAttribute(attributes$1.hidden, "true");
    links.forEach((link) => link.setAttribute("tabindex", -1));
  }
  onContainerKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") {
      return;
    }
    this.hidePanel();
    this.button.focus();
  }
  onItemClick(event) {
    const listItems = event.target.closest(selectors$3.link);
    if (!listItems) {
      return;
    }
    event.preventDefault();
    this.input.value = listItems.dataset.value;
    const form = listItems.closest(selectors$3.form);
    if (!form) {
      return;
    }
    form.submit();
  }
  openSelector() {
    if (this.isPanelActive()) {
      return;
    }
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("HeaderMegaMenu:hide"));
      let links = this.panel.querySelectorAll(selectors$3.link);
      setTimeout(() => {
        this.button.focus();
      }, 500);
      this.panel.toggleAttribute(attributes$1.hidden);
      this.button.setAttribute(
        attributes$1.ariaExpanded,
        (this.button.getAttribute(attributes$1.ariaExpanded) === "false").toString()
      );
      links.forEach((link) => link.setAttribute("tabindex", 0));
      this.panel.scrollTop = 0;
    }, 0);
  }
  closeSelector(event) {
    if (!this.isPanelActive()) {
      return;
    }
    setTimeout(() => {
      const shouldClose = event.relatedTarget && event.relatedTarget.nodeName === "BUTTON";
      if (event.relatedTarget === null || shouldClose) {
        this.hidePanel();
      }
    }, 0);
  }
  isPanelActive() {
    return !this.panel.hasAttribute(attributes$1.hidden);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  customElements.define("localization-form", localizationForm);
});
const Toggle = (config) => {
  const removeTrapFocusShadowRoot2 = window.themeCore.utils.removeTrapFocusShadowRoot;
  const removeTrapFocus2 = window.themeCore.utils.removeTrapFocus;
  const trapFocus2 = window.themeCore.utils.trapFocus;
  const cssClasses2 = window.themeCore.utils.cssClasses;
  const focusable2 = window.themeCore.utils.focusable;
  const extendDefaults2 = window.themeCore.utils.extendDefaults;
  const isElement2 = window.themeCore.utils.isElement;
  const on2 = window.themeCore.utils.on;
  const bind2 = window.themeCore.utils.bind;
  const overlay2 = window.themeCore.utils.overlay;
  const bodyScrollLock2 = window.themeCore.utils.bodyScrollLock;
  const binder = bind2(document.documentElement, {
    className: "esc-bind"
  });
  let previouslySelectedElement = {};
  const defaults2 = {
    namespace: config.toggleSelector,
    elementToFocus: null,
    focusInput: true,
    overlay: true,
    scrollLock: true,
    toggleTabIndex: true,
    changeAriaExpanded: true,
    closeAccordionsOnHide: true,
    overlayPlacement: document.body,
    hasFullWidth: false
  };
  const settings = extendDefaults2(defaults2, config);
  const namespace = settings.namespace;
  const selectors2 = {
    accordionContainer: ".js-accordion-container",
    scrollLockContainer: ".js-scroll-lock-container"
  };
  const classes2 = {
    ...cssClasses2,
    scrollLockIgnore: "js-scroll-lock-ignore"
  };
  const nodeSelectors = {
    toggleSelector: [...document.querySelectorAll(`[data-js-toggle="${config.toggleSelector}"]`)],
    fullWidthSelector: [...document.querySelectorAll(`[data-js-full-width="${config.toggleSelector}"]`)]
  };
  function init(config2 = null) {
    setEventListeners();
    setEventBusListeners(config2);
  }
  function setEventListeners() {
    nodeSelectors.toggleSelector.forEach((element) => {
      const target = document.getElementById(element.dataset.target);
      on2("click", element, (event) => handleToggleEvent(event, target, element));
      if (settings.toggleTabIndex) {
        unsetTabIndexOnTarget(target);
      }
    });
    nodeSelectors.fullWidthSelector.forEach((element) => {
      const target = document.getElementById(element.dataset.target);
      on2("click", element, (event) => handleToggleFullWidth(event, target));
      if (settings.toggleTabIndex) {
        unsetTabIndexOnTarget(target);
      }
    });
    if (binder.isSet()) {
      return;
    }
    on2("keydown", (event) => onEscEvent(event));
    binder.set();
  }
  function setEventBusListeners(config2) {
    const eventBus = window.themeCore && window.themeCore.EventBus && window.themeCore.EventBus.all();
    const isEventListened = eventBus && eventBus[`Toggle:${namespace}:close`];
    if (isEventListened && config2 && config2.once) {
      eventBus[`EscEvent:on`] && window.themeCore.EventBus.remove("EscEvent:on", eventBus[`EscEvent:on`].at(-1));
      eventBus[`Overlay:${namespace}:close`] && window.themeCore.EventBus.remove(`Overlay:${namespace}:close`, eventBus[`Overlay:${namespace}:close`].at(-1));
      eventBus[`Toggle:${namespace}:close`] && window.themeCore.EventBus.remove(`Toggle:${namespace}:close`, eventBus[`Toggle:${namespace}:close`].at(-1));
    }
    window.themeCore.EventBus.listen(["EscEvent:on", `Overlay:${namespace}:close`, `Toggle:${namespace}:close`], (response) => {
      if (typeof response !== "undefined" && response.selector) {
        closeToggleTarget(getTargetOfToggle(response.selector));
        return;
      }
      closeToggleTarget(getTargetOfToggle(namespace));
    });
  }
  function getTargetOfToggle(selector) {
    const toggleElement = document.querySelector(`[data-js-toggle="${selector}"]`);
    if (toggleElement) {
      return document.getElementById(toggleElement.dataset.target);
    }
  }
  function handleToggleEvent(event, target, toggler) {
    event.preventDefault();
    if (toggler) {
      config.previouslySelectedElement = toggler;
    }
    if (toggler.hasAttribute("data-toggle-close-only")) {
      closeToggleTarget(target);
      return;
    }
    toggle(target);
  }
  function handleToggleFullWidth(event, target) {
    event.preventDefault();
    toggleFullWidth(target);
  }
  function toggle(target) {
    return isTargetActive(target) ? closeToggleTarget(target) : openToggleTarget(target);
  }
  function toggleFullWidth(target) {
    return isTargetFullWidth(target) ? disableFullWidthTarget(target) : enableFullWidthTarget(target);
  }
  function openToggleTarget(target) {
    target.classList.add(classes2.active);
    document.body.classList.add("scroll-padding-0");
    if (settings.overlay) {
      overlay2({
        namespace,
        overlayPlacement: settings.overlayPlacement
      }).open();
    }
    if (settings.scrollLock) {
      const scrollLockContainer = getScrollLockContainer(target);
      scrollLockContainer && bodyScrollLock2.disableBodyScroll(scrollLockContainer, {
        allowTouchMove: (el) => {
          while (el && el !== document.body) {
            if (el.classList.contains(classes2.scrollLockIgnore))
              return true;
            el = el.parentElement;
          }
        }
      });
    }
    window.themeCore.EventBus.emit(`Toggle:${namespace}:open`, target);
    window.themeCore.EventBus.emit(`Toggle:open`, target);
    focusTarget(target, settings.elementToFocus);
    if (settings.toggleTabIndex) {
      setTabIndexOnTarget(target);
    }
    if (settings.changeAriaExpanded) {
      let togglers = [...document.querySelectorAll(`[data-target="${target.id}"]`)];
      togglers.forEach((toggler) => {
        setAriaExpanded(toggler);
      });
    }
    binder.set();
  }
  function closeToggleTarget(target) {
    if (!target || !isTargetActive(target)) {
      return;
    }
    target.classList.remove(classes2.active);
    setTimeout(function() {
      document.body.classList.remove("scroll-padding-0");
    }, 400);
    if (settings.overlay) {
      overlay2({ namespace, target }).close();
    }
    if (settings.scrollLock) {
      const scrollLockContainer = getScrollLockContainer(target);
      scrollLockContainer && bodyScrollLock2.enableBodyScroll(scrollLockContainer);
    }
    window.themeCore.EventBus.emit(`Toggle:${namespace}:close`, target);
    removeFocusTarget(target);
    if (settings.toggleTabIndex) {
      unsetTabIndexOnTarget(target);
    }
    if (settings.changeAriaExpanded) {
      let togglers = [...document.querySelectorAll(`[data-target="${target.id}"]`)];
      togglers.forEach((toggler) => {
        removeAriaExpanded(toggler);
      });
    }
    if (settings.hasFullWidth && isTargetFullWidth(target)) {
      disableFullWidthTarget(target);
    }
    if (settings.closeAccordionsOnHide) {
      window.themeCore.Accordion.collapseAllItems(`#${target.id} ${selectors2.accordionContainer}`);
    }
    binder.remove();
    const once = target.dataset.modalOnce;
    if (once) {
      target.remove();
    }
  }
  function getScrollLockContainer(target) {
    return (target == null ? void 0 : target.classList.contains(classes2.jsScrollLockContainer)) ? target : target == null ? void 0 : target.querySelector(selectors2.scrollLockContainer);
  }
  function enableFullWidthTarget(target) {
    target.classList.add(classes2.full);
  }
  function disableFullWidthTarget(target) {
    target.classList.remove(classes2.full);
  }
  function isTargetActive(target) {
    return target.classList.contains(classes2.active);
  }
  function isTargetFullWidth(target) {
    return target.classList.contains(classes2.full);
  }
  function focusTarget(target, elementToFocus) {
    if (!target) {
      return;
    }
    previouslySelectedElement = config.previouslySelectedElement || document.activeElement;
    const focusableElements = focusable2(target, settings);
    trapFocus2(target, { elementToFocus: focusableElements[0] });
    elementToFocus && setTimeout(() => elementToFocus.focus(), 50);
  }
  function removeFocusTarget(target) {
    if (isElement2(previouslySelectedElement)) {
      window.setTimeout(() => previouslySelectedElement.focus(), 0);
    }
    if (target.hasAttribute("data-shadow-root")) {
      removeTrapFocusShadowRoot2();
    } else {
      removeTrapFocus2();
    }
  }
  function setAriaExpanded(toggler) {
    toggler.setAttribute("aria-expanded", true);
  }
  function removeAriaExpanded(toggler) {
    toggler.setAttribute("aria-expanded", false);
  }
  function unsetTabIndexOnTarget(target) {
    focusable2(target, settings).forEach((element) => {
      if (!element.closest(".js-accordion-inner")) {
        element.setAttribute("tabindex", -1);
      }
    });
  }
  function setTabIndexOnTarget(target) {
    focusable2(target, settings).forEach((element) => {
      if (!element.closest(".js-accordion-inner")) {
        element.setAttribute("tabindex", 0);
      }
    });
  }
  function onEscEvent(event) {
    if (!isKeyPressIsEsc(event) || !binder.isSet()) {
      return;
    }
    window.themeCore.EventBus.emit("EscEvent:on");
    binder.remove();
  }
  function isKeyPressIsEsc(event) {
    return event.keyCode === 27;
  }
  return Object.freeze({
    init,
    open: openToggleTarget,
    close: closeToggleTarget
  });
};
const Timer = (timerContainer) => {
  const classes2 = window.themeCore.utils.cssClasses;
  const selectors2 = {
    settings: ".js-timer-settings",
    daysHundreds: ".js-timer-days-hundreds",
    daysDozens: ".js-timer-days-dozens",
    daysUnits: ".js-timer-days-units",
    hoursDozens: ".js-timer-hours-dozens",
    hoursUnits: ".js-timer-hours-units",
    minutesDozens: ".js-timer-minutes-dozens",
    minutesUnits: ".js-timer-minutes-units",
    secondsDozens: ".js-timer-seconds-dozens",
    secondsUnits: ".js-timer-seconds-units"
  };
  const DATE_VALUES = {
    day: 1e3 * 60 * 60 * 24,
    hour: 1e3 * 60 * 60,
    minute: 1e3 * 60,
    second: 1e3
  };
  const settings = getSettings();
  const animationDuration = 2e3;
  let nodes = {};
  let isAnimated = false;
  function getSettings() {
    try {
      return JSON.parse(
        timerContainer.querySelector(selectors2.settings).textContent
      );
    } catch {
      return null;
    }
  }
  function getNodes() {
    return {
      daysHundreds: timerContainer.querySelector(selectors2.daysHundreds),
      daysDozens: timerContainer.querySelector(selectors2.daysDozens),
      daysUnits: timerContainer.querySelector(selectors2.daysUnits),
      hoursDozens: timerContainer.querySelector(selectors2.hoursDozens),
      hoursUnits: timerContainer.querySelector(selectors2.hoursUnits),
      minuteDozens: timerContainer.querySelector(selectors2.minutesDozens),
      minuteUnits: timerContainer.querySelector(selectors2.minutesUnits),
      secondsDozens: timerContainer.querySelector(
        selectors2.secondsDozens
      ),
      secondsUnits: timerContainer.querySelector(selectors2.secondsUnits)
    };
  }
  function setCountDownTimer({ year, month, day, hour, minutes, timezone }) {
    const timezoneDifference = Number(timezone);
    const finalHour = +hour - timezoneDifference;
    const countDownDate = new Date(
      Date.UTC(year, month, day, finalHour, minutes || 0)
    );
    if (!isEnableAnimation()) {
      const now2 = (/* @__PURE__ */ new Date()).getTime();
      const distance = countDownDate - now2;
      if (distance <= 0) {
        return;
      }
      const dateToInner = getDateToInner(distance);
      changeTimerMarkup(dateToInner);
    }
    const interval = setInterval(() => {
      timerTick(countDownDate, interval);
    }, DATE_VALUES.second);
  }
  function timerTick(countDownDate, interval) {
    if (isEnableAnimation() && !isAnimated) {
      return;
    }
    const now2 = (/* @__PURE__ */ new Date()).getTime();
    const distance = countDownDate - now2;
    if (distance <= 0) {
      clearInterval(interval);
      return;
    }
    const dateToInner = getDateToInner(distance);
    changeTimerMarkup(dateToInner);
  }
  function startTimerTickWithAnimation({ year, month, day, hour, minutes, timezone }) {
    const timezoneDifference = Number(timezone);
    const finalHour = +hour - timezoneDifference;
    const countDownDate = new Date(Date.UTC(year, month, day, finalHour, minutes || 0));
    const now2 = (/* @__PURE__ */ new Date()).getTime();
    const targetMilliseconds = countDownDate - now2 - animationDuration;
    if (targetMilliseconds <= 0) {
      return;
    }
    const interval = 10;
    const totalFrames = animationDuration / interval;
    const incrementPerFrame = targetMilliseconds / totalFrames;
    let currentMilliseconds = 0;
    const intervalId = setInterval(() => {
      currentMilliseconds += incrementPerFrame;
      if (currentMilliseconds >= targetMilliseconds) {
        clearInterval(intervalId);
        currentMilliseconds = targetMilliseconds;
        const finalDateToRender2 = getDateToInner(targetMilliseconds);
        const dateToRender2 = getDateToInner(currentMilliseconds);
        changeTimerMarkup(dateToRender2, finalDateToRender2);
        isAnimated = true;
      }
      const finalDateToRender = getDateToInner(targetMilliseconds);
      const dateToRender = getDateToInner(currentMilliseconds);
      changeTimerMarkup(dateToRender, finalDateToRender);
    }, interval);
  }
  function getDateToInner(distance) {
    const days = Math.floor(distance / DATE_VALUES.day);
    const hours = Math.floor(
      distance % DATE_VALUES.day / DATE_VALUES.hour
    );
    const minutes = Math.floor(
      distance % DATE_VALUES.hour / DATE_VALUES.minute
    );
    const seconds = Math.floor(
      distance % DATE_VALUES.minute / DATE_VALUES.second
    );
    return getDateAsTimer(days, hours, minutes, seconds);
  }
  function getDateAsTimer(days, hours, minutes, seconds) {
    return {
      daysHundreds: days > 99 ? Math.floor(days / 100) : 0,
      daysDozens: days > 99 ? Math.floor(days % 100 / 10) : Math.floor(days / 10),
      daysUnits: days % 10,
      hoursDozens: Math.floor(hours / 10),
      hoursUnits: hours % 10,
      minutesDozens: Math.floor(minutes / 10),
      minutesUnits: minutes % 10,
      secondsDozens: Math.floor(seconds / 10),
      secondsUnits: seconds % 10
    };
  }
  function changeTimerMarkup(dateToRender, finalDateToRender = null) {
    if (dateToRender.daysHundreds > 0 || finalDateToRender && finalDateToRender.daysHundreds > 0) {
      nodes.daysHundreds.classList.contains(classes2.hidden) && nodes.daysHundreds.classList.remove(classes2.hidden);
      nodes.daysHundreds.innerHTML = dateToRender.daysHundreds;
    } else {
      !nodes.daysHundreds.classList.contains(classes2.hidden) && nodes.daysHundreds.classList.add(classes2.hidden);
    }
    nodes.daysDozens.innerHTML = dateToRender.daysDozens;
    nodes.daysUnits.innerHTML = dateToRender.daysUnits;
    nodes.hoursDozens.innerHTML = dateToRender.hoursDozens;
    nodes.hoursUnits.innerHTML = dateToRender.hoursUnits;
    nodes.minuteDozens.innerHTML = dateToRender.minutesDozens;
    nodes.minuteUnits.innerHTML = dateToRender.minutesUnits;
    nodes.secondsDozens.innerHTML = dateToRender.secondsDozens;
    nodes.secondsUnits.innerHTML = dateToRender.secondsUnits;
  }
  function setMutationObserver() {
    if (timerContainer.classList.contains(classes2.animated)) {
      startTimerTickWithAnimation(settings);
    } else {
      const observer = new MutationObserver((mutations, observer2) => {
        if (timerContainer.classList.contains(classes2.animated)) {
          startTimerTickWithAnimation(settings);
          observer2.disconnect();
        }
      });
      observer.observe(timerContainer, { attributes: true, attributeFilter: ["class"] });
    }
  }
  function init() {
    if (settings) {
      nodes = getNodes();
      setCountDownTimer(settings);
      isEnableAnimation() && setMutationObserver();
    }
  }
  function isEnableAnimation() {
    return timerContainer.classList.contains(classes2.jsAnimate);
  }
  return Object.freeze({
    init
  });
};
const cssClasses = {
  active: "is-active",
  childActive: "is-child-active",
  grandChildActive: "is-grand-child-active",
  added: "is-added",
  collapsed: "is-collapsed",
  disabled: "is-disabled",
  hidden: "is-hidden",
  shadowHidden: "is-shadow-hidden",
  lazyload: "lazyload",
  lazyloaded: "lazyloaded",
  loading: "is-loading",
  removing: "is-removing",
  sticky: "is-sticky",
  tabbable: "is-tabbable",
  transparent: "is-transparent",
  full: "is-full",
  current: "is-current",
  error: "error",
  hover: "is-hover",
  clone: "clone",
  animated: "animated",
  jsAnimate: "js-animate",
  jsScrollLockContainer: "js-scroll-lock-container"
};
function arrayIncludes(array1, array2) {
  return array2.every((v) => array1.includes(v));
}
function extendDefaults(defaults2, properties) {
  if (!defaults2 || !properties) {
    throw new Error("Invalid number of arguments, expected 2 ");
  }
  for (const property in properties) {
    if (property !== "undefined" && typeof properties[property] !== "undefined") {
      defaults2[property] = properties[property];
    }
  }
  return defaults2;
}
function formToJSON(form) {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}
function convertFormData(data) {
  let obj = {};
  for (let [key, value] of data) {
    if (obj[key] !== void 0) {
      if (!Array.isArray(obj[key])) {
        obj[key] = [obj[key]];
      }
      obj[key].push(value);
    } else {
      obj[key] = value;
    }
  }
  return obj;
}
function on(event, element = window, callback, capture = false) {
  if (typeof element === "string") {
    document.querySelector(element).addEventListener(event, callback, capture);
    return;
  }
  if (typeof element === "function") {
    window.addEventListener(event, element);
    return;
  }
  if (element) {
    element.addEventListener(event, callback, capture);
  }
}
function off(event, element = window, callback, capture = false) {
  if (typeof element === "string") {
    document.querySelector(element).removeEventListener(event, callback, capture);
    return;
  }
  if (typeof element === "function") {
    window.removeEventListener(event, element);
    return;
  }
  element.removeEventListener(event, callback, capture);
}
function isElement(element) {
  return element instanceof window.Element || element instanceof window.HTMLDocument;
}
function isElementInViewport(viewport, element, bounce = 0) {
  const viewPortBounding = viewport.getBoundingClientRect();
  const elementBounding = element.getBoundingClientRect();
  const viewPortPosition = viewPortBounding.left + viewPortBounding.width;
  const elementPortPosition = elementBounding.left + elementBounding.width;
  const viewPortPositionBottom = viewPortBounding.top + viewPortBounding.height;
  const elementPortPositionBottom = elementBounding.top + elementBounding.height;
  const isElementBoundLeft = () => Math.ceil(elementBounding.left) + bounce >= viewPortBounding.left;
  const isElementBoundRight = () => viewPortPosition + bounce >= elementPortPosition;
  const isElementBoundTop = () => Math.ceil(elementBounding.top) + bounce >= viewPortBounding.top;
  const isElementBoundBottom = () => viewPortPositionBottom + bounce >= elementPortPositionBottom;
  return isElementBoundLeft() && isElementBoundRight() && isElementBoundTop() && isElementBoundBottom();
}
function throttle(callback, wait, immediate = false) {
  let timeout = null;
  let initialCall = true;
  return function(...args) {
    const callNow = immediate && initialCall;
    function next() {
      callback.apply(this, args);
      timeout = null;
    }
    if (callNow) {
      initialCall = false;
      next();
    }
    if (!timeout) {
      timeout = window.setTimeout(next, wait);
    }
  };
}
function debounce(callback, wait, immediate) {
  let timeout = null;
  return function(...args) {
    const later = function() {
      timeout = null;
      if (!immediate) {
        callback.apply(this, args);
      }
    };
    const callNow = immediate && !timeout;
    window.clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
    if (callNow) {
      callback.apply(this, args);
    }
  };
}
function parseJSONfromMarkup(node) {
  if (!node || !node.textContent) {
    return null;
  }
  try {
    return JSON.parse(node.textContent);
  } catch {
    return null;
  }
}
const isInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
};
function handleTabulationOnSlides(slides, activeSlide, selector) {
  slides.forEach((slide2) => {
    const elements = slide2.querySelectorAll(selector);
    if (!elements.length) {
      return;
    }
    if (slide2 === activeSlide) {
      elements.forEach((element) => element.setAttribute("tabindex", 0));
      slide2.setAttribute("aria-hidden", false);
      return;
    }
    elements.forEach((element) => element.setAttribute("tabindex", -1));
    slide2.setAttribute("aria-hidden", true);
  });
}
function handleTabulationOnSlidesWithMultipleVisibleSlides(slides, selector) {
  slides.forEach((slide2) => {
    const elements = slide2.querySelectorAll(selector);
    if (!elements.length) {
      return;
    }
    if (isInViewport(slide2)) {
      elements.forEach((element) => element.setAttribute("tabindex", 0));
      slide2.setAttribute("aria-hidden", false);
      return;
    }
    elements.forEach((element) => element.setAttribute("tabindex", -1));
    slide2.setAttribute("aria-hidden", true);
  });
}
function forceFocus(element, options) {
  options = options || {};
  let savedTabIndex = element.tabIndex;
  element.tabIndex = -1;
  element.dataset.tabIndex = savedTabIndex;
  element.focus();
  if (typeof options.className !== "undefined") {
    element.classList.add(options.className);
  }
  element.addEventListener("blur", callback);
  function callback(event) {
    event.target.removeEventListener(event.type, callback);
    element.tabIndex = savedTabIndex;
    delete element.dataset.tabIndex;
    if (typeof options.className !== "undefined") {
      element.classList.remove(options.className);
    }
  }
}
function focusable$1(container) {
  let elements = Array.prototype.slice.call(
    container.querySelectorAll(
      "[tabindex],[draggable],a[href],area,button:enabled,input:not([type=hidden]):enabled,object,select:enabled,textarea:enabled,iframe,video "
    )
  );
  return elements.filter(function(element) {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
  });
}
let trapFocusHandlers = {};
function trapFocus(container, options) {
  if (container == null ? void 0 : container.hasAttribute("data-shadow-root")) {
    const parent = container.parentElement;
    const siblings = Array.from(parent.parentNode.children).filter((child) => child !== parent);
    siblings.forEach((sibling) => {
      if (!sibling.classList.contains("window-overlay")) {
        sibling.setAttribute("inert", "");
      }
    });
    return;
  }
  options = options || {};
  let elements = focusable$1(container);
  let elementToFocus = options.elementToFocus || container;
  let first = elements[0];
  let last = elements[elements.length - 1];
  removeTrapFocus();
  trapFocusHandlers.focusin = function(event) {
    elements = focusable$1(container);
    first = elements[0];
    last = elements[elements.length - 1];
    if (container !== event.target && !container.contains(event.target) && !event.target.contains(container)) {
      first.focus();
    }
    if (event.target !== container && event.target !== last && event.target !== first)
      return;
    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };
  trapFocusHandlers.focusout = function() {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };
  trapFocusHandlers.keydown = function(event) {
    if (event.keyCode !== 9)
      return;
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }
    if ((event.target === container || event.target === first) && event.shiftKey) {
      event.preventDefault();
      last.focus();
    }
  };
  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);
  forceFocus(elementToFocus, options);
}
function removeTrapFocus() {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);
}
function removeTrapFocusShadowRoot() {
  const elements = document.querySelectorAll("[inert]");
  elements.forEach((element) => {
    element.removeAttribute("inert");
  });
}
function transformLineItemProps(initialObject) {
  const transformedObject = {};
  for (const [key, value] of Object.entries(initialObject)) {
    if (key.startsWith("properties[")) {
      let isEmptyArray = false;
      if (typeof value === "object") {
        isEmptyArray = value.every((item) => !item.length);
      }
      if (value && !isEmptyArray) {
        const nestedKey = key.split("[")[1].split("]")[0];
        if (!transformedObject["properties"]) {
          transformedObject["properties"] = {};
        }
        transformedObject["properties"][nestedKey] = value;
      }
    } else {
      transformedObject[key] = value;
    }
  }
  return transformedObject;
}
function isIosDevice() {
  return typeof window !== "undefined" && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}
const overlay = (config) => {
  const defaults2 = {
    namespace: "overlay",
    target: null,
    container: "window-overlay",
    overlayPlacement: document.body,
    scrollLockContainer: ".js-scroll-lock-container"
  };
  const settings = extendDefaults(defaults2, config || defaults2);
  window.themeCore = window.themeCore || {};
  window.themeCore.EventBus = window.themeCore.EventBus || EventBus();
  function constructOverlay(isLoader) {
    const element = document.createElement("div");
    element.classList.add(settings.container);
    element.setAttribute("data-js-overlay", settings.namespace);
    element.setAttribute("data-js-window", "overlay");
    if (isLoader) {
      const loader2 = document.createElement("div");
      loader2.classList.add("loader");
      element.append(loader2);
    }
    return element;
  }
  function getOverlay(namespace) {
    if (namespace) {
      return document.querySelector(`[data-js-overlay="${namespace}"]`);
    }
    return document.querySelector(`[data-js-window="overlay"]`);
  }
  function updateOverlay() {
    const overlay2 = document.querySelector(`[data-js-window="overlay"]`);
    const currentOverlay = overlay2.getAttribute("data-js-overlay");
    if (currentOverlay !== settings.namespace) {
      overlay2.setAttribute("data-js-overlay", settings.namespace);
      window.themeCore.EventBus.emit(`Toggle:${currentOverlay}:close`);
      setCloseEvents();
      return true;
    }
    return true;
  }
  function open(isLoader) {
    if (getOverlay()) {
      updateOverlay();
      return;
    }
    render(isLoader);
    setCloseEvents();
  }
  function close2() {
    if (!getOverlay()) {
      return;
    }
    remove();
  }
  function render(isOverlay) {
    const windowOverlay = constructOverlay(isOverlay);
    settings.overlayPlacement.appendChild(windowOverlay);
    window.setTimeout(() => windowOverlay.classList.add(cssClasses.active), 1);
    window.themeCore.EventBus.emit(`Overlay:${settings.namespace}:open`);
  }
  function remove() {
    var _a, _b;
    const scrollLockContainer = ((_a = settings.target) == null ? void 0 : _a.classList.contains(cssClasses.jsScrollLockContainer)) ? settings.target : (_b = settings.target) == null ? void 0 : _b.querySelector(settings.scrollLockContainer);
    scrollLockContainer && window.themeCore.utils.bodyScrollLock.enableBodyScroll(scrollLockContainer);
    on("transitionend", getOverlay(), () => {
      if (getOverlay()) {
        getOverlay().remove();
      }
    });
    if (getOverlay(settings.namespace)) {
      getOverlay(settings.namespace).classList.remove(cssClasses.active);
    }
  }
  function setCloseEvents() {
    on("click", getOverlay(settings.namespace), () => handleClickEvent());
  }
  document.addEventListener("shopify:section:load", () => {
    on("click", getOverlay(settings.namespace), () => handleClickEvent());
  });
  function handleClickEvent() {
    window.themeCore.EventBus.emit(`Overlay:${settings.namespace}:close`, {
      selector: settings.namespace,
      target: document.getElementById(settings.namespace)
    });
    close2();
  }
  return Object.freeze({
    open,
    close: close2
  });
};
function images() {
  function generateSrc(src, size) {
    if (!src || !size) {
      return;
    }
    if (!src.includes("https:") && !src.includes("http:")) {
      src = "https:" + src;
    }
    const url = new URL(src);
    url.searchParams.set("width", size);
    return url.toString();
  }
  function generateSrcset(src, size) {
    if (!src || !size) {
      return;
    }
    return generateSrc(src, size) + " 1x, " + generateSrc(src, size * 2) + " 2x";
  }
  return {
    generateSrcset,
    generateSrc
  };
}
const DEFAULT_WIDGET_CONFIG = {
  isDisabledInput: false,
  isReadOnly: false,
  onQuantityChange: () => {
  },
  onIncrease: () => {
  },
  onDecrease: () => {
  },
  onQuantityZero: () => {
  }
};
const selectors$2 = {
  input: "[data-quantity-input]",
  decrease: "[data-quantity-decrease]",
  increase: "[data-quantity-increase]"
};
const attributes = {
  readonly: "readonly",
  disabled: "disabled",
  min: "min",
  max: "max",
  step: "step"
};
const QuantityWidget = (item, widgetConfig = {}) => {
  const classes2 = window.themeCore.utils.cssClasses;
  const on2 = window.themeCore.utils.on;
  if (!item) {
    throw new Error(`Quantity Widget::Error::Required parameter 'item' missing!`);
  }
  const config = {
    ...DEFAULT_WIDGET_CONFIG,
    ...widgetConfig
  };
  const quantity = {
    value: null,
    minValue: null,
    maxValue: null,
    step: null,
    previewsValue: null,
    initialValue: null
  };
  const controls = {
    input: null,
    decreaseBtn: null,
    increaseBtn: null
  };
  let widget = {};
  function init() {
    controls.input = item.querySelector(selectors$2.input);
    controls.decreaseBtn = item.querySelector(selectors$2.decrease);
    controls.increaseBtn = item.querySelector(selectors$2.increase);
    if (!controls.input || !controls.decreaseBtn || !controls.increaseBtn) {
      return null;
    }
    const elMin = Number(controls.input.getAttribute(attributes.min));
    const elMax = Number(controls.input.getAttribute(attributes.max));
    const elStep = Number(controls.input.getAttribute(attributes.step));
    quantity.value = Number(controls.input.value || 0);
    quantity.minValue = elMin > 0 ? elMin : 0;
    quantity.maxValue = elMax > 0 ? elMax : Infinity;
    quantity.step = elStep || 1;
    quantity.initialValue = quantity.value;
    quantity.previewsValue = quantity.initialValue;
    if (config.isReadOnly || config.isDisabledInput) {
      controls.input.setAttribute(attributes.readonly, "");
    }
    if (config.isReadOnly) {
      controls.decreaseBtn.setAttribute(attributes.disabled, "");
      controls.increaseBtn.setAttribute(attributes.disabled, "");
      controls.increaseBtn.classList.add(classes2.disabled);
      controls.decreaseBtn.classList.add(classes2.disabled);
    } else {
      if (quantity.value === quantity.minValue) {
        controls.decreaseBtn.setAttribute(attributes.disabled, "");
        controls.decreaseBtn.classList.add(classes2.disabled);
      }
      if (quantity.value === quantity.maxValue) {
        controls.increaseBtn.setAttribute(attributes.disabled, "");
        controls.increaseBtn.classList.add(classes2.disabled);
      }
      initEventListeners();
    }
    widget = {
      widget: item,
      controls,
      config,
      quantity,
      increase,
      decrease,
      setValue,
      setMin,
      setMax,
      setIncrement,
      toggleIncrease,
      toggleDecrease,
      rollbackValue,
      dispatch
    };
    return widget;
  }
  function initEventListeners() {
    on2("click", item, onChangeQuantityClick);
    if (!config.isDisabledInput) {
      on2("change", controls.input, onQuantityInput);
    }
  }
  function decrease() {
    resetDisabled();
    quantity.previewsValue = quantity.value;
    if (quantity.value > quantity.minValue) {
      let newVal = quantity.value - Number(quantity.step);
      if (newVal % quantity.step) {
        newVal = Math.max(newVal - newVal % quantity.step, quantity.minValue);
      }
      quantity.value = newVal;
    } else {
      quantity.value = quantity.minValue;
      controls.decreaseBtn.setAttribute(attributes.disabled, "");
      controls.decreaseBtn.classList.add(classes2.disabled);
    }
    setInputValue(quantity.value);
    return quantity.value;
  }
  function increase() {
    resetDisabled();
    quantity.previewsValue = quantity.value;
    if (quantity.maxValue && quantity.value >= quantity.maxValue) {
      quantity.value = quantity.maxValue;
      controls.increaseBtn.setAttribute(attributes.disabled, "");
      controls.increaseBtn.classList.add(classes2.disabled);
    } else {
      let newVal = Number(quantity.value) + Number(quantity.step);
      if (newVal % quantity.step) {
        newVal = newVal - newVal % quantity.step;
      }
      quantity.value = newVal;
    }
    setInputValue(quantity.value);
    return quantity.value;
  }
  function resetDisabled() {
    if (config.isReadOnly) {
      return;
    }
    controls.increaseBtn.removeAttribute(attributes.disabled);
    controls.decreaseBtn.removeAttribute(attributes.disabled);
    controls.increaseBtn.classList.remove(classes2.disabled);
    controls.decreaseBtn.classList.remove(classes2.disabled);
  }
  function setValue(value) {
    let newValue = value;
    if (quantity.maxValue && value >= quantity.maxValue) {
      newValue = quantity.maxValue;
    }
    if (value < quantity.minValue) {
      newValue = quantity.minValue;
    }
    if (newValue % quantity.step) {
      newValue = newValue - newValue % quantity.step;
    }
    quantity.previewsValue = quantity.value;
    quantity.value = newValue;
    setInputValue(quantity.value);
    return quantity.value;
  }
  function setMin(value) {
    controls.input.setAttribute("min", value);
    quantity.minValue = value;
    if (quantity.value < value) {
      setValue(value);
    }
  }
  function setMax(value) {
    controls.input.setAttribute("max", value);
    quantity.maxValue = value || Infinity;
    if (quantity.value > (value || Infinity)) {
      setValue(value);
    }
  }
  function setIncrement(value) {
    controls.input.setAttribute("step", value);
    quantity.step = value;
    if (quantity.value % value) {
      setValue(quantity.value - quantity.value % value);
    }
  }
  function rollbackValue() {
    if (!quantity.previewsValue) {
      return;
    }
    const prev = quantity.previewsValue;
    quantity.value = prev;
    setInputValue(quantity.value);
    return quantity.value;
  }
  function setInputValue(value) {
    controls.input.value = value;
  }
  function toggleIncrease() {
    controls.increaseBtn.classList.toggle(classes2.disabled, quantity.value >= quantity.maxValue);
    controls.increaseBtn.toggleAttribute("disabled", quantity.value >= quantity.maxValue);
  }
  function toggleDecrease() {
    controls.decreaseBtn.classList.toggle(classes2.disabled, quantity.value <= quantity.minValue && quantity.minValue !== null);
    controls.decreaseBtn.toggleAttribute("disabled", quantity.value <= quantity.minValue && quantity.minValue !== null);
  }
  function dispatch() {
    if (config.onQuantityChange && typeof config.onQuantityChange === "function") {
      config.onQuantityChange(widget);
    }
    if (quantity.value === 0 && config.onQuantityZero && typeof config.onQuantityZero === "function") {
      config.onQuantityZero(widget);
    }
  }
  function onChangeQuantityClick(event) {
    const isIncrease = event.target.closest(selectors$2.increase);
    const isDecrease = event.target.closest(selectors$2.decrease);
    if (!isIncrease && !isDecrease) {
      return;
    }
    event.preventDefault();
    if (isDecrease) {
      decrease();
      if (config.onDecrease && typeof config.onDecrease === "function") {
        config.onDecrease(widget);
      }
    }
    if (isIncrease) {
      increase();
      if (config.onIncrease && typeof config.onIncrease === "function") {
        config.onIncrease(widget);
      }
    }
    toggleIncrease();
    toggleDecrease();
    config.isDisabledInput ? dispatch() : controls.input.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function onQuantityInput(event) {
    quantity.value = Number(event.target.value || 0);
    if (quantity.maxValue < quantity.value && quantity.maxValue !== null) {
      quantity.previewsValue = quantity.value;
      quantity.value = quantity.maxValue;
    }
    if (quantity.minValue > quantity.value) {
      quantity.previewsValue = quantity.value;
      quantity.value = quantity.minValue;
    }
    if (quantity.value % quantity.step) {
      quantity.previewsValue = quantity.value;
      quantity.value = quantity.value - quantity.value % quantity.step;
    }
    setInputValue(quantity.value);
    toggleIncrease();
    toggleDecrease();
    dispatch();
  }
  return Object.freeze({
    init
  });
};
const Preloder = (section) => {
  const globalClasses = window.themeCore.utils.cssClasses;
  const selectors2 = {
    preloader: ".js-preloader"
  };
  const PRELOADER_DELAY = 300;
  let isShowed = false;
  let preloader = null;
  function init() {
    if (!section || !(preloader = section.querySelector(selectors2.preloader))) {
      return null;
    }
    return {
      el: preloader,
      isShowed,
      show,
      hide
    };
  }
  function show() {
    if (!preloader) {
      return;
    }
    preloader.classList.add(globalClasses.active);
  }
  function hide() {
    if (!preloader) {
      return;
    }
    setTimeout(() => {
      preloader.classList.remove(globalClasses.active);
    }, PRELOADER_DELAY);
  }
  return Object.freeze({
    init
  });
};
const ShareButton = () => {
  const selectors2 = {
    shareButton: ".js-social-share"
  };
  function init() {
    let shareButtons = document.querySelectorAll(selectors2.shareButton);
    if (!shareButtons.length) {
      return;
    }
    shareButtons.forEach((button) => {
      button.addEventListener("click", function(e) {
        e.preventDefault();
        const shareTitle = button.getAttribute("data-share-title") || document.title;
        const shareURL = button.getAttribute("data-share-url") || document.location.href;
        if (navigator.share) {
          navigator.share({ url: shareURL, title: shareTitle });
        } else {
          const fallBackInputSelector = button.getAttribute("data-input-fallback");
          const inputCopyText = document.getElementById(fallBackInputSelector);
          const tooltip = button.querySelector(".js-share-tooltip");
          if (!inputCopyText) {
            return;
          }
          inputCopyText.select();
          inputCopyText.setSelectionRange(0, 99999);
          navigator.clipboard.writeText(inputCopyText.value);
          if (tooltip) {
            button.classList.add("is-active");
            setTimeout(() => {
              button.classList.remove("is-active");
            }, 1500);
          }
        }
      });
    });
  }
  return Object.freeze({
    init
  });
};
function focusable(container, config = {}) {
  if (!container) {
    throw new Error("Could not find container");
  }
  const defaults2 = [
    "[tabindex]:not([type=range])",
    "[draggable]",
    "a[href]",
    "area",
    "button:enabled",
    "input:not([type=range]):not([type=hidden]):enabled",
    "object",
    "select:enabled",
    "textarea:enabled"
  ];
  if (config && config.include && config.include.length) {
    config.include.forEach((selector) => defaults2.push(selector));
  }
  const elements = [...container.querySelectorAll(defaults2.join())];
  const focusableElements = elements.filter((element) => {
    return Boolean(
      element.offsetWidth || element.offsetHeight || element.getClientRects().length
    );
  });
  if (config && config.exclude && config.exclude.length) {
    const exclusionList = [
      ...container.querySelectorAll(config.exclude.join())
    ];
    return focusableElements.filter((element) => {
      return !exclusionList.includes(element);
    });
  }
  return focusableElements;
}
function updateTabindexOnElement(container, tabindex = 0) {
  const focusableElements = focusable(container);
  focusableElements.forEach((element) => {
    element.setAttribute("tabindex", tabindex);
  });
}
const arrowRight = `
	<svg class="icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
		<path fill-rule="evenodd" clip-rule="evenodd" d="M9.36899 3.15909L12.8402 6.61591C13.0533 6.82804 13.0533 7.17196 12.8402 7.38409L9.36899 10.8409C9.15598 11.053 8.81061 11.053 8.5976 10.8409C8.38459 10.6288 8.38459 10.2848 8.5976 10.0727L11.1377 7.54318L1.54545 7.54319C1.24421 7.54319 1 7.29999 1 7C1 6.70001 1.24421 6.45681 1.54545 6.45681L11.1377 6.45681L8.5976 3.92728C8.38459 3.71515 8.38459 3.37122 8.5976 3.15909C8.81061 2.94697 9.15598 2.94697 9.36899 3.15909Z"/>
	</svg>
`;
const loader = `
	<svg class="icon icon-loader" aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M21.25 12C21.6642 12 22.0029 12.3363 21.9719 12.7493C21.8332 14.5954 21.1841 16.3722 20.0902 17.8779C18.8489 19.5863 17.0986 20.858 15.0902 21.5106C13.0817 22.1631 10.9183 22.1631 8.90983 21.5106C6.9014 20.858 5.15111 19.5863 3.90983 17.8779C2.66855 16.1694 2 14.1118 2 12C2 9.88821 2.66855 7.83062 3.90983 6.12215C5.15111 4.41367 6.9014 3.14201 8.90983 2.48943C10.6798 1.91433 12.5702 1.84605 14.3688 2.28461C14.7713 2.38274 14.9864 2.80879 14.8584 3.20273C14.7304 3.59667 14.3077 3.80878 13.904 3.71599C12.4081 3.37216 10.842 3.43883 9.37336 3.91602C7.66619 4.47071 6.17844 5.55162 5.12336 7.00382C4.06827 8.45603 3.5 10.205 3.5 12C3.5 13.795 4.06827 15.544 5.12336 16.9962C6.17844 18.4484 7.66619 19.5293 9.37335 20.084C11.0805 20.6387 12.9195 20.6387 14.6266 20.084C16.3338 19.5293 17.8216 18.4484 18.8766 16.9962C19.7843 15.7469 20.3317 14.278 20.4669 12.7491C20.5034 12.3365 20.8358 12 21.25 12Z" fill="currentColor"/>
	</svg>
`;
const close = `
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
		<path d="M18 6L6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
		<path d="M6 6L18 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>
`;
const cart = `
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
		<path d="M14.0003 5C14.0003 4.46957 13.7896 3.96086 13.4145 3.58579C13.0395 3.21071 12.5308 3 12.0003 3C11.4699 3 10.9612 3.21071 10.5861 3.58579C10.211 3.96086 10.0003 4.46957 10.0003 5M19.2603 9.696L20.6453 18.696C20.6891 18.9808 20.6709 19.2718 20.5917 19.5489C20.5126 19.8261 20.3746 20.0828 20.187 20.3016C19.9995 20.5204 19.7668 20.6961 19.505 20.8167C19.2433 20.9372 18.9585 20.9997 18.6703 21H5.33032C5.04195 21 4.75699 20.9377 4.49496 20.8173C4.23294 20.6969 4.00005 20.5212 3.81226 20.3024C3.62448 20.0836 3.48624 19.8267 3.40702 19.5494C3.32781 19.2721 3.30949 18.981 3.35332 18.696L4.73832 9.696C4.81097 9.22359 5.0504 8.79282 5.41324 8.4817C5.77609 8.17059 6.23835 7.9997 6.71632 8H17.2843C17.7621 7.99994 18.2241 8.17094 18.5868 8.48203C18.9494 8.79312 19.1877 9.22376 19.2603 9.696Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
	</svg>
`;
const icons = {
  arrowRight,
  loader,
  close,
  cart
};
let support;
function calcSupport() {
  const window2 = getWindow();
  const document2 = getDocument();
  return {
    smoothScroll: document2.documentElement && document2.documentElement.style && "scrollBehavior" in document2.documentElement.style,
    touch: !!("ontouchstart" in window2 || window2.DocumentTouch && document2 instanceof window2.DocumentTouch)
  };
}
function getSupport() {
  if (!support) {
    support = calcSupport();
  }
  return support;
}
let deviceCached;
function calcDevice(_temp) {
  let {
    userAgent
  } = _temp === void 0 ? {} : _temp;
  const support2 = getSupport();
  const window2 = getWindow();
  const platform = window2.navigator.platform;
  const ua = userAgent || window2.navigator.userAgent;
  const device = {
    ios: false,
    android: false
  };
  const screenWidth = window2.screen.width;
  const screenHeight = window2.screen.height;
  const android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
  let ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
  const ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
  const iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
  const windows = platform === "Win32";
  let macos = platform === "MacIntel";
  const iPadScreens = ["1024x1366", "1366x1024", "834x1194", "1194x834", "834x1112", "1112x834", "768x1024", "1024x768", "820x1180", "1180x820", "810x1080", "1080x810"];
  if (!ipad && macos && support2.touch && iPadScreens.indexOf(`${screenWidth}x${screenHeight}`) >= 0) {
    ipad = ua.match(/(Version)\/([\d.]+)/);
    if (!ipad)
      ipad = [0, 1, "13_0_0"];
    macos = false;
  }
  if (android && !windows) {
    device.os = "android";
    device.android = true;
  }
  if (ipad || iphone || ipod) {
    device.os = "ios";
    device.ios = true;
  }
  return device;
}
function getDevice(overrides) {
  if (overrides === void 0) {
    overrides = {};
  }
  if (!deviceCached) {
    deviceCached = calcDevice(overrides);
  }
  return deviceCached;
}
let browser$1;
function calcBrowser() {
  const window2 = getWindow();
  const device = getDevice();
  let needPerspectiveFix = false;
  function isSafari() {
    const ua = window2.navigator.userAgent.toLowerCase();
    return ua.indexOf("safari") >= 0 && ua.indexOf("chrome") < 0 && ua.indexOf("android") < 0;
  }
  if (isSafari()) {
    const ua = String(window2.navigator.userAgent);
    if (ua.includes("Version/")) {
      const [major, minor] = ua.split("Version/")[1].split(" ")[0].split(".").map((num) => Number(num));
      needPerspectiveFix = major < 16 || major === 16 && minor < 2;
    }
  }
  const isWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(window2.navigator.userAgent);
  const isSafariBrowser = isSafari();
  const need3dFix = isSafariBrowser || isWebView && device.ios;
  return {
    isSafari: needPerspectiveFix || isSafariBrowser,
    needPerspectiveFix,
    need3dFix,
    isWebView
  };
}
function getBrowser() {
  if (!browser$1) {
    browser$1 = calcBrowser();
  }
  return browser$1;
}
function Resize(_ref) {
  let {
    swiper,
    on: on2,
    emit
  } = _ref;
  const window2 = getWindow();
  let observer = null;
  let animationFrame = null;
  const resizeHandler = () => {
    if (!swiper || swiper.destroyed || !swiper.initialized)
      return;
    emit("beforeResize");
    emit("resize");
  };
  const createObserver = () => {
    if (!swiper || swiper.destroyed || !swiper.initialized)
      return;
    observer = new ResizeObserver((entries) => {
      animationFrame = window2.requestAnimationFrame(() => {
        const {
          width,
          height
        } = swiper;
        let newWidth = width;
        let newHeight = height;
        entries.forEach((_ref2) => {
          let {
            contentBoxSize,
            contentRect,
            target
          } = _ref2;
          if (target && target !== swiper.el)
            return;
          newWidth = contentRect ? contentRect.width : (contentBoxSize[0] || contentBoxSize).inlineSize;
          newHeight = contentRect ? contentRect.height : (contentBoxSize[0] || contentBoxSize).blockSize;
        });
        if (newWidth !== width || newHeight !== height) {
          resizeHandler();
        }
      });
    });
    observer.observe(swiper.el);
  };
  const removeObserver = () => {
    if (animationFrame) {
      window2.cancelAnimationFrame(animationFrame);
    }
    if (observer && observer.unobserve && swiper.el) {
      observer.unobserve(swiper.el);
      observer = null;
    }
  };
  const orientationChangeHandler = () => {
    if (!swiper || swiper.destroyed || !swiper.initialized)
      return;
    emit("orientationchange");
  };
  on2("init", () => {
    if (swiper.params.resizeObserver && typeof window2.ResizeObserver !== "undefined") {
      createObserver();
      return;
    }
    window2.addEventListener("resize", resizeHandler);
    window2.addEventListener("orientationchange", orientationChangeHandler);
  });
  on2("destroy", () => {
    removeObserver();
    window2.removeEventListener("resize", resizeHandler);
    window2.removeEventListener("orientationchange", orientationChangeHandler);
  });
}
function Observer(_ref) {
  let {
    swiper,
    extendParams,
    on: on2,
    emit
  } = _ref;
  const observers = [];
  const window2 = getWindow();
  const attach = function(target, options) {
    if (options === void 0) {
      options = {};
    }
    const ObserverFunc = window2.MutationObserver || window2.WebkitMutationObserver;
    const observer = new ObserverFunc((mutations) => {
      if (swiper.__preventObserver__)
        return;
      if (mutations.length === 1) {
        emit("observerUpdate", mutations[0]);
        return;
      }
      const observerUpdate = function observerUpdate2() {
        emit("observerUpdate", mutations[0]);
      };
      if (window2.requestAnimationFrame) {
        window2.requestAnimationFrame(observerUpdate);
      } else {
        window2.setTimeout(observerUpdate, 0);
      }
    });
    observer.observe(target, {
      attributes: typeof options.attributes === "undefined" ? true : options.attributes,
      childList: swiper.isElement || (typeof options.childList === "undefined" ? true : options).childList,
      characterData: typeof options.characterData === "undefined" ? true : options.characterData
    });
    observers.push(observer);
  };
  const init = () => {
    if (!swiper.params.observer)
      return;
    if (swiper.params.observeParents) {
      const containerParents = elementParents(swiper.hostEl);
      for (let i = 0; i < containerParents.length; i += 1) {
        attach(containerParents[i]);
      }
    }
    attach(swiper.hostEl, {
      childList: swiper.params.observeSlideChildren
    });
    attach(swiper.wrapperEl, {
      attributes: false
    });
  };
  const destroy = () => {
    observers.forEach((observer) => {
      observer.disconnect();
    });
    observers.splice(0, observers.length);
  };
  extendParams({
    observer: false,
    observeParents: false,
    observeSlideChildren: false
  });
  on2("init", init);
  on2("destroy", destroy);
}
var eventsEmitter = {
  on(events2, handler, priority) {
    const self2 = this;
    if (!self2.eventsListeners || self2.destroyed)
      return self2;
    if (typeof handler !== "function")
      return self2;
    const method = priority ? "unshift" : "push";
    events2.split(" ").forEach((event) => {
      if (!self2.eventsListeners[event])
        self2.eventsListeners[event] = [];
      self2.eventsListeners[event][method](handler);
    });
    return self2;
  },
  once(events2, handler, priority) {
    const self2 = this;
    if (!self2.eventsListeners || self2.destroyed)
      return self2;
    if (typeof handler !== "function")
      return self2;
    function onceHandler() {
      self2.off(events2, onceHandler);
      if (onceHandler.__emitterProxy) {
        delete onceHandler.__emitterProxy;
      }
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      handler.apply(self2, args);
    }
    onceHandler.__emitterProxy = handler;
    return self2.on(events2, onceHandler, priority);
  },
  onAny(handler, priority) {
    const self2 = this;
    if (!self2.eventsListeners || self2.destroyed)
      return self2;
    if (typeof handler !== "function")
      return self2;
    const method = priority ? "unshift" : "push";
    if (self2.eventsAnyListeners.indexOf(handler) < 0) {
      self2.eventsAnyListeners[method](handler);
    }
    return self2;
  },
  offAny(handler) {
    const self2 = this;
    if (!self2.eventsListeners || self2.destroyed)
      return self2;
    if (!self2.eventsAnyListeners)
      return self2;
    const index = self2.eventsAnyListeners.indexOf(handler);
    if (index >= 0) {
      self2.eventsAnyListeners.splice(index, 1);
    }
    return self2;
  },
  off(events2, handler) {
    const self2 = this;
    if (!self2.eventsListeners || self2.destroyed)
      return self2;
    if (!self2.eventsListeners)
      return self2;
    events2.split(" ").forEach((event) => {
      if (typeof handler === "undefined") {
        self2.eventsListeners[event] = [];
      } else if (self2.eventsListeners[event]) {
        self2.eventsListeners[event].forEach((eventHandler, index) => {
          if (eventHandler === handler || eventHandler.__emitterProxy && eventHandler.__emitterProxy === handler) {
            self2.eventsListeners[event].splice(index, 1);
          }
        });
      }
    });
    return self2;
  },
  emit() {
    const self2 = this;
    if (!self2.eventsListeners || self2.destroyed)
      return self2;
    if (!self2.eventsListeners)
      return self2;
    let events2;
    let data;
    let context;
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    if (typeof args[0] === "string" || Array.isArray(args[0])) {
      events2 = args[0];
      data = args.slice(1, args.length);
      context = self2;
    } else {
      events2 = args[0].events;
      data = args[0].data;
      context = args[0].context || self2;
    }
    data.unshift(context);
    const eventsArray = Array.isArray(events2) ? events2 : events2.split(" ");
    eventsArray.forEach((event) => {
      if (self2.eventsAnyListeners && self2.eventsAnyListeners.length) {
        self2.eventsAnyListeners.forEach((eventHandler) => {
          eventHandler.apply(context, [event, ...data]);
        });
      }
      if (self2.eventsListeners && self2.eventsListeners[event]) {
        self2.eventsListeners[event].forEach((eventHandler) => {
          eventHandler.apply(context, data);
        });
      }
    });
    return self2;
  }
};
function updateSize() {
  const swiper = this;
  let width;
  let height;
  const el = swiper.el;
  if (typeof swiper.params.width !== "undefined" && swiper.params.width !== null) {
    width = swiper.params.width;
  } else {
    width = el.clientWidth;
  }
  if (typeof swiper.params.height !== "undefined" && swiper.params.height !== null) {
    height = swiper.params.height;
  } else {
    height = el.clientHeight;
  }
  if (width === 0 && swiper.isHorizontal() || height === 0 && swiper.isVertical()) {
    return;
  }
  width = width - parseInt(elementStyle(el, "padding-left") || 0, 10) - parseInt(elementStyle(el, "padding-right") || 0, 10);
  height = height - parseInt(elementStyle(el, "padding-top") || 0, 10) - parseInt(elementStyle(el, "padding-bottom") || 0, 10);
  if (Number.isNaN(width))
    width = 0;
  if (Number.isNaN(height))
    height = 0;
  Object.assign(swiper, {
    width,
    height,
    size: swiper.isHorizontal() ? width : height
  });
}
function updateSlides() {
  const swiper = this;
  function getDirectionPropertyValue(node, label) {
    return parseFloat(node.getPropertyValue(swiper.getDirectionLabel(label)) || 0);
  }
  const params = swiper.params;
  const {
    wrapperEl,
    slidesEl,
    size: swiperSize,
    rtlTranslate: rtl,
    wrongRTL
  } = swiper;
  const isVirtual = swiper.virtual && params.virtual.enabled;
  const previousSlidesLength = isVirtual ? swiper.virtual.slides.length : swiper.slides.length;
  const slides = elementChildren(slidesEl, `.${swiper.params.slideClass}, swiper-slide`);
  const slidesLength = isVirtual ? swiper.virtual.slides.length : slides.length;
  let snapGrid = [];
  const slidesGrid = [];
  const slidesSizesGrid = [];
  let offsetBefore = params.slidesOffsetBefore;
  if (typeof offsetBefore === "function") {
    offsetBefore = params.slidesOffsetBefore.call(swiper);
  }
  let offsetAfter = params.slidesOffsetAfter;
  if (typeof offsetAfter === "function") {
    offsetAfter = params.slidesOffsetAfter.call(swiper);
  }
  const previousSnapGridLength = swiper.snapGrid.length;
  const previousSlidesGridLength = swiper.slidesGrid.length;
  let spaceBetween = params.spaceBetween;
  let slidePosition = -offsetBefore;
  let prevSlideSize = 0;
  let index = 0;
  if (typeof swiperSize === "undefined") {
    return;
  }
  if (typeof spaceBetween === "string" && spaceBetween.indexOf("%") >= 0) {
    spaceBetween = parseFloat(spaceBetween.replace("%", "")) / 100 * swiperSize;
  } else if (typeof spaceBetween === "string") {
    spaceBetween = parseFloat(spaceBetween);
  }
  swiper.virtualSize = -spaceBetween;
  slides.forEach((slideEl) => {
    if (rtl) {
      slideEl.style.marginLeft = "";
    } else {
      slideEl.style.marginRight = "";
    }
    slideEl.style.marginBottom = "";
    slideEl.style.marginTop = "";
  });
  if (params.centeredSlides && params.cssMode) {
    setCSSProperty(wrapperEl, "--swiper-centered-offset-before", "");
    setCSSProperty(wrapperEl, "--swiper-centered-offset-after", "");
  }
  const gridEnabled = params.grid && params.grid.rows > 1 && swiper.grid;
  if (gridEnabled) {
    swiper.grid.initSlides(slides);
  } else if (swiper.grid) {
    swiper.grid.unsetSlides();
  }
  let slideSize;
  const shouldResetSlideSize = params.slidesPerView === "auto" && params.breakpoints && Object.keys(params.breakpoints).filter((key) => {
    return typeof params.breakpoints[key].slidesPerView !== "undefined";
  }).length > 0;
  for (let i = 0; i < slidesLength; i += 1) {
    slideSize = 0;
    let slide2;
    if (slides[i])
      slide2 = slides[i];
    if (gridEnabled) {
      swiper.grid.updateSlide(i, slide2, slides);
    }
    if (slides[i] && elementStyle(slide2, "display") === "none")
      continue;
    if (params.slidesPerView === "auto") {
      if (shouldResetSlideSize) {
        slides[i].style[swiper.getDirectionLabel("width")] = ``;
      }
      const slideStyles = getComputedStyle(slide2);
      const currentTransform = slide2.style.transform;
      const currentWebKitTransform = slide2.style.webkitTransform;
      if (currentTransform) {
        slide2.style.transform = "none";
      }
      if (currentWebKitTransform) {
        slide2.style.webkitTransform = "none";
      }
      if (params.roundLengths) {
        slideSize = swiper.isHorizontal() ? elementOuterSize(slide2, "width", true) : elementOuterSize(slide2, "height", true);
      } else {
        const width = getDirectionPropertyValue(slideStyles, "width");
        const paddingLeft = getDirectionPropertyValue(slideStyles, "padding-left");
        const paddingRight = getDirectionPropertyValue(slideStyles, "padding-right");
        const marginLeft = getDirectionPropertyValue(slideStyles, "margin-left");
        const marginRight = getDirectionPropertyValue(slideStyles, "margin-right");
        const boxSizing = slideStyles.getPropertyValue("box-sizing");
        if (boxSizing && boxSizing === "border-box") {
          slideSize = width + marginLeft + marginRight;
        } else {
          const {
            clientWidth,
            offsetWidth
          } = slide2;
          slideSize = width + paddingLeft + paddingRight + marginLeft + marginRight + (offsetWidth - clientWidth);
        }
      }
      if (currentTransform) {
        slide2.style.transform = currentTransform;
      }
      if (currentWebKitTransform) {
        slide2.style.webkitTransform = currentWebKitTransform;
      }
      if (params.roundLengths)
        slideSize = Math.floor(slideSize);
    } else {
      slideSize = (swiperSize - (params.slidesPerView - 1) * spaceBetween) / params.slidesPerView;
      if (params.roundLengths)
        slideSize = Math.floor(slideSize);
      if (slides[i]) {
        slides[i].style[swiper.getDirectionLabel("width")] = `${slideSize}px`;
      }
    }
    if (slides[i]) {
      slides[i].swiperSlideSize = slideSize;
    }
    slidesSizesGrid.push(slideSize);
    if (params.centeredSlides) {
      slidePosition = slidePosition + slideSize / 2 + prevSlideSize / 2 + spaceBetween;
      if (prevSlideSize === 0 && i !== 0)
        slidePosition = slidePosition - swiperSize / 2 - spaceBetween;
      if (i === 0)
        slidePosition = slidePosition - swiperSize / 2 - spaceBetween;
      if (Math.abs(slidePosition) < 1 / 1e3)
        slidePosition = 0;
      if (params.roundLengths)
        slidePosition = Math.floor(slidePosition);
      if (index % params.slidesPerGroup === 0)
        snapGrid.push(slidePosition);
      slidesGrid.push(slidePosition);
    } else {
      if (params.roundLengths)
        slidePosition = Math.floor(slidePosition);
      if ((index - Math.min(swiper.params.slidesPerGroupSkip, index)) % swiper.params.slidesPerGroup === 0)
        snapGrid.push(slidePosition);
      slidesGrid.push(slidePosition);
      slidePosition = slidePosition + slideSize + spaceBetween;
    }
    swiper.virtualSize += slideSize + spaceBetween;
    prevSlideSize = slideSize;
    index += 1;
  }
  swiper.virtualSize = Math.max(swiper.virtualSize, swiperSize) + offsetAfter;
  if (rtl && wrongRTL && (params.effect === "slide" || params.effect === "coverflow")) {
    wrapperEl.style.width = `${swiper.virtualSize + spaceBetween}px`;
  }
  if (params.setWrapperSize) {
    wrapperEl.style[swiper.getDirectionLabel("width")] = `${swiper.virtualSize + spaceBetween}px`;
  }
  if (gridEnabled) {
    swiper.grid.updateWrapperSize(slideSize, snapGrid);
  }
  if (!params.centeredSlides) {
    const newSlidesGrid = [];
    for (let i = 0; i < snapGrid.length; i += 1) {
      let slidesGridItem = snapGrid[i];
      if (params.roundLengths)
        slidesGridItem = Math.floor(slidesGridItem);
      if (snapGrid[i] <= swiper.virtualSize - swiperSize) {
        newSlidesGrid.push(slidesGridItem);
      }
    }
    snapGrid = newSlidesGrid;
    if (Math.floor(swiper.virtualSize - swiperSize) - Math.floor(snapGrid[snapGrid.length - 1]) > 1) {
      snapGrid.push(swiper.virtualSize - swiperSize);
    }
  }
  if (isVirtual && params.loop) {
    const size = slidesSizesGrid[0] + spaceBetween;
    if (params.slidesPerGroup > 1) {
      const groups = Math.ceil((swiper.virtual.slidesBefore + swiper.virtual.slidesAfter) / params.slidesPerGroup);
      const groupSize = size * params.slidesPerGroup;
      for (let i = 0; i < groups; i += 1) {
        snapGrid.push(snapGrid[snapGrid.length - 1] + groupSize);
      }
    }
    for (let i = 0; i < swiper.virtual.slidesBefore + swiper.virtual.slidesAfter; i += 1) {
      if (params.slidesPerGroup === 1) {
        snapGrid.push(snapGrid[snapGrid.length - 1] + size);
      }
      slidesGrid.push(slidesGrid[slidesGrid.length - 1] + size);
      swiper.virtualSize += size;
    }
  }
  if (snapGrid.length === 0)
    snapGrid = [0];
  if (spaceBetween !== 0) {
    const key = swiper.isHorizontal() && rtl ? "marginLeft" : swiper.getDirectionLabel("marginRight");
    slides.filter((_, slideIndex) => {
      if (!params.cssMode || params.loop)
        return true;
      if (slideIndex === slides.length - 1) {
        return false;
      }
      return true;
    }).forEach((slideEl) => {
      slideEl.style[key] = `${spaceBetween}px`;
    });
  }
  if (params.centeredSlides && params.centeredSlidesBounds) {
    let allSlidesSize = 0;
    slidesSizesGrid.forEach((slideSizeValue) => {
      allSlidesSize += slideSizeValue + (spaceBetween || 0);
    });
    allSlidesSize -= spaceBetween;
    const maxSnap = allSlidesSize > swiperSize ? allSlidesSize - swiperSize : 0;
    snapGrid = snapGrid.map((snap) => {
      if (snap <= 0)
        return -offsetBefore;
      if (snap > maxSnap)
        return maxSnap + offsetAfter;
      return snap;
    });
  }
  if (params.centerInsufficientSlides) {
    let allSlidesSize = 0;
    slidesSizesGrid.forEach((slideSizeValue) => {
      allSlidesSize += slideSizeValue + (spaceBetween || 0);
    });
    allSlidesSize -= spaceBetween;
    const offsetSize = (params.slidesOffsetBefore || 0) + (params.slidesOffsetAfter || 0);
    if (allSlidesSize + offsetSize < swiperSize) {
      const allSlidesOffset = (swiperSize - allSlidesSize - offsetSize) / 2;
      snapGrid.forEach((snap, snapIndex) => {
        snapGrid[snapIndex] = snap - allSlidesOffset;
      });
      slidesGrid.forEach((snap, snapIndex) => {
        slidesGrid[snapIndex] = snap + allSlidesOffset;
      });
    }
  }
  Object.assign(swiper, {
    slides,
    snapGrid,
    slidesGrid,
    slidesSizesGrid
  });
  if (params.centeredSlides && params.cssMode && !params.centeredSlidesBounds) {
    setCSSProperty(wrapperEl, "--swiper-centered-offset-before", `${-snapGrid[0]}px`);
    setCSSProperty(wrapperEl, "--swiper-centered-offset-after", `${swiper.size / 2 - slidesSizesGrid[slidesSizesGrid.length - 1] / 2}px`);
    const addToSnapGrid = -swiper.snapGrid[0];
    const addToSlidesGrid = -swiper.slidesGrid[0];
    swiper.snapGrid = swiper.snapGrid.map((v) => v + addToSnapGrid);
    swiper.slidesGrid = swiper.slidesGrid.map((v) => v + addToSlidesGrid);
  }
  if (slidesLength !== previousSlidesLength) {
    swiper.emit("slidesLengthChange");
  }
  if (snapGrid.length !== previousSnapGridLength) {
    if (swiper.params.watchOverflow)
      swiper.checkOverflow();
    swiper.emit("snapGridLengthChange");
  }
  if (slidesGrid.length !== previousSlidesGridLength) {
    swiper.emit("slidesGridLengthChange");
  }
  if (params.watchSlidesProgress) {
    swiper.updateSlidesOffset();
  }
  swiper.emit("slidesUpdated");
  if (!isVirtual && !params.cssMode && (params.effect === "slide" || params.effect === "fade")) {
    const backFaceHiddenClass = `${params.containerModifierClass}backface-hidden`;
    const hasClassBackfaceClassAdded = swiper.el.classList.contains(backFaceHiddenClass);
    if (slidesLength <= params.maxBackfaceHiddenSlides) {
      if (!hasClassBackfaceClassAdded)
        swiper.el.classList.add(backFaceHiddenClass);
    } else if (hasClassBackfaceClassAdded) {
      swiper.el.classList.remove(backFaceHiddenClass);
    }
  }
}
function updateAutoHeight(speed) {
  const swiper = this;
  const activeSlides = [];
  const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
  let newHeight = 0;
  let i;
  if (typeof speed === "number") {
    swiper.setTransition(speed);
  } else if (speed === true) {
    swiper.setTransition(swiper.params.speed);
  }
  const getSlideByIndex = (index) => {
    if (isVirtual) {
      return swiper.slides[swiper.getSlideIndexByData(index)];
    }
    return swiper.slides[index];
  };
  if (swiper.params.slidesPerView !== "auto" && swiper.params.slidesPerView > 1) {
    if (swiper.params.centeredSlides) {
      (swiper.visibleSlides || []).forEach((slide2) => {
        activeSlides.push(slide2);
      });
    } else {
      for (i = 0; i < Math.ceil(swiper.params.slidesPerView); i += 1) {
        const index = swiper.activeIndex + i;
        if (index > swiper.slides.length && !isVirtual)
          break;
        activeSlides.push(getSlideByIndex(index));
      }
    }
  } else {
    activeSlides.push(getSlideByIndex(swiper.activeIndex));
  }
  for (i = 0; i < activeSlides.length; i += 1) {
    if (typeof activeSlides[i] !== "undefined") {
      const height = activeSlides[i].offsetHeight;
      newHeight = height > newHeight ? height : newHeight;
    }
  }
  if (newHeight || newHeight === 0)
    swiper.wrapperEl.style.height = `${newHeight}px`;
}
function updateSlidesOffset() {
  const swiper = this;
  const slides = swiper.slides;
  const minusOffset = swiper.isElement ? swiper.isHorizontal() ? swiper.wrapperEl.offsetLeft : swiper.wrapperEl.offsetTop : 0;
  for (let i = 0; i < slides.length; i += 1) {
    slides[i].swiperSlideOffset = (swiper.isHorizontal() ? slides[i].offsetLeft : slides[i].offsetTop) - minusOffset - swiper.cssOverflowAdjustment();
  }
}
const toggleSlideClasses$1 = (slideEl, condition, className) => {
  if (condition && !slideEl.classList.contains(className)) {
    slideEl.classList.add(className);
  } else if (!condition && slideEl.classList.contains(className)) {
    slideEl.classList.remove(className);
  }
};
function updateSlidesProgress(translate2) {
  if (translate2 === void 0) {
    translate2 = this && this.translate || 0;
  }
  const swiper = this;
  const params = swiper.params;
  const {
    slides,
    rtlTranslate: rtl,
    snapGrid
  } = swiper;
  if (slides.length === 0)
    return;
  if (typeof slides[0].swiperSlideOffset === "undefined")
    swiper.updateSlidesOffset();
  let offsetCenter = -translate2;
  if (rtl)
    offsetCenter = translate2;
  swiper.visibleSlidesIndexes = [];
  swiper.visibleSlides = [];
  let spaceBetween = params.spaceBetween;
  if (typeof spaceBetween === "string" && spaceBetween.indexOf("%") >= 0) {
    spaceBetween = parseFloat(spaceBetween.replace("%", "")) / 100 * swiper.size;
  } else if (typeof spaceBetween === "string") {
    spaceBetween = parseFloat(spaceBetween);
  }
  for (let i = 0; i < slides.length; i += 1) {
    const slide2 = slides[i];
    let slideOffset = slide2.swiperSlideOffset;
    if (params.cssMode && params.centeredSlides) {
      slideOffset -= slides[0].swiperSlideOffset;
    }
    const slideProgress = (offsetCenter + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) / (slide2.swiperSlideSize + spaceBetween);
    const originalSlideProgress = (offsetCenter - snapGrid[0] + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) / (slide2.swiperSlideSize + spaceBetween);
    const slideBefore = -(offsetCenter - slideOffset);
    const slideAfter = slideBefore + swiper.slidesSizesGrid[i];
    const isFullyVisible = slideBefore >= 0 && slideBefore <= swiper.size - swiper.slidesSizesGrid[i];
    const isVisible = slideBefore >= 0 && slideBefore < swiper.size - 1 || slideAfter > 1 && slideAfter <= swiper.size || slideBefore <= 0 && slideAfter >= swiper.size;
    if (isVisible) {
      swiper.visibleSlides.push(slide2);
      swiper.visibleSlidesIndexes.push(i);
    }
    toggleSlideClasses$1(slide2, isVisible, params.slideVisibleClass);
    toggleSlideClasses$1(slide2, isFullyVisible, params.slideFullyVisibleClass);
    slide2.progress = rtl ? -slideProgress : slideProgress;
    slide2.originalProgress = rtl ? -originalSlideProgress : originalSlideProgress;
  }
}
function updateProgress(translate2) {
  const swiper = this;
  if (typeof translate2 === "undefined") {
    const multiplier = swiper.rtlTranslate ? -1 : 1;
    translate2 = swiper && swiper.translate && swiper.translate * multiplier || 0;
  }
  const params = swiper.params;
  const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
  let {
    progress,
    isBeginning,
    isEnd,
    progressLoop
  } = swiper;
  const wasBeginning = isBeginning;
  const wasEnd = isEnd;
  if (translatesDiff === 0) {
    progress = 0;
    isBeginning = true;
    isEnd = true;
  } else {
    progress = (translate2 - swiper.minTranslate()) / translatesDiff;
    const isBeginningRounded = Math.abs(translate2 - swiper.minTranslate()) < 1;
    const isEndRounded = Math.abs(translate2 - swiper.maxTranslate()) < 1;
    isBeginning = isBeginningRounded || progress <= 0;
    isEnd = isEndRounded || progress >= 1;
    if (isBeginningRounded)
      progress = 0;
    if (isEndRounded)
      progress = 1;
  }
  if (params.loop) {
    const firstSlideIndex = swiper.getSlideIndexByData(0);
    const lastSlideIndex = swiper.getSlideIndexByData(swiper.slides.length - 1);
    const firstSlideTranslate = swiper.slidesGrid[firstSlideIndex];
    const lastSlideTranslate = swiper.slidesGrid[lastSlideIndex];
    const translateMax = swiper.slidesGrid[swiper.slidesGrid.length - 1];
    const translateAbs = Math.abs(translate2);
    if (translateAbs >= firstSlideTranslate) {
      progressLoop = (translateAbs - firstSlideTranslate) / translateMax;
    } else {
      progressLoop = (translateAbs + translateMax - lastSlideTranslate) / translateMax;
    }
    if (progressLoop > 1)
      progressLoop -= 1;
  }
  Object.assign(swiper, {
    progress,
    progressLoop,
    isBeginning,
    isEnd
  });
  if (params.watchSlidesProgress || params.centeredSlides && params.autoHeight)
    swiper.updateSlidesProgress(translate2);
  if (isBeginning && !wasBeginning) {
    swiper.emit("reachBeginning toEdge");
  }
  if (isEnd && !wasEnd) {
    swiper.emit("reachEnd toEdge");
  }
  if (wasBeginning && !isBeginning || wasEnd && !isEnd) {
    swiper.emit("fromEdge");
  }
  swiper.emit("progress", progress);
}
const toggleSlideClasses = (slideEl, condition, className) => {
  if (condition && !slideEl.classList.contains(className)) {
    slideEl.classList.add(className);
  } else if (!condition && slideEl.classList.contains(className)) {
    slideEl.classList.remove(className);
  }
};
function updateSlidesClasses() {
  const swiper = this;
  const {
    slides,
    params,
    slidesEl,
    activeIndex
  } = swiper;
  const isVirtual = swiper.virtual && params.virtual.enabled;
  const gridEnabled = swiper.grid && params.grid && params.grid.rows > 1;
  const getFilteredSlide = (selector) => {
    return elementChildren(slidesEl, `.${params.slideClass}${selector}, swiper-slide${selector}`)[0];
  };
  let activeSlide;
  let prevSlide;
  let nextSlide;
  if (isVirtual) {
    if (params.loop) {
      let slideIndex = activeIndex - swiper.virtual.slidesBefore;
      if (slideIndex < 0)
        slideIndex = swiper.virtual.slides.length + slideIndex;
      if (slideIndex >= swiper.virtual.slides.length)
        slideIndex -= swiper.virtual.slides.length;
      activeSlide = getFilteredSlide(`[data-swiper-slide-index="${slideIndex}"]`);
    } else {
      activeSlide = getFilteredSlide(`[data-swiper-slide-index="${activeIndex}"]`);
    }
  } else {
    if (gridEnabled) {
      activeSlide = slides.find((slideEl) => slideEl.column === activeIndex);
      nextSlide = slides.find((slideEl) => slideEl.column === activeIndex + 1);
      prevSlide = slides.find((slideEl) => slideEl.column === activeIndex - 1);
    } else {
      activeSlide = slides[activeIndex];
    }
  }
  if (activeSlide) {
    if (!gridEnabled) {
      nextSlide = elementNextAll(activeSlide, `.${params.slideClass}, swiper-slide`)[0];
      if (params.loop && !nextSlide) {
        nextSlide = slides[0];
      }
      prevSlide = elementPrevAll(activeSlide, `.${params.slideClass}, swiper-slide`)[0];
      if (params.loop && !prevSlide === 0) {
        prevSlide = slides[slides.length - 1];
      }
    }
  }
  slides.forEach((slideEl) => {
    toggleSlideClasses(slideEl, slideEl === activeSlide, params.slideActiveClass);
    toggleSlideClasses(slideEl, slideEl === nextSlide, params.slideNextClass);
    toggleSlideClasses(slideEl, slideEl === prevSlide, params.slidePrevClass);
  });
  swiper.emitSlidesClasses();
}
const processLazyPreloader = (swiper, imageEl) => {
  if (!swiper || swiper.destroyed || !swiper.params)
    return;
  const slideSelector = () => swiper.isElement ? `swiper-slide` : `.${swiper.params.slideClass}`;
  const slideEl = imageEl.closest(slideSelector());
  if (slideEl) {
    let lazyEl = slideEl.querySelector(`.${swiper.params.lazyPreloaderClass}`);
    if (!lazyEl && swiper.isElement) {
      if (slideEl.shadowRoot) {
        lazyEl = slideEl.shadowRoot.querySelector(`.${swiper.params.lazyPreloaderClass}`);
      } else {
        requestAnimationFrame(() => {
          if (slideEl.shadowRoot) {
            lazyEl = slideEl.shadowRoot.querySelector(`.${swiper.params.lazyPreloaderClass}`);
            if (lazyEl)
              lazyEl.remove();
          }
        });
      }
    }
    if (lazyEl)
      lazyEl.remove();
  }
};
const unlazy = (swiper, index) => {
  if (!swiper.slides[index])
    return;
  const imageEl = swiper.slides[index].querySelector('[loading="lazy"]');
  if (imageEl)
    imageEl.removeAttribute("loading");
};
const preload = (swiper) => {
  if (!swiper || swiper.destroyed || !swiper.params)
    return;
  let amount = swiper.params.lazyPreloadPrevNext;
  const len = swiper.slides.length;
  if (!len || !amount || amount < 0)
    return;
  amount = Math.min(amount, len);
  const slidesPerView = swiper.params.slidesPerView === "auto" ? swiper.slidesPerViewDynamic() : Math.ceil(swiper.params.slidesPerView);
  const activeIndex = swiper.activeIndex;
  if (swiper.params.grid && swiper.params.grid.rows > 1) {
    const activeColumn = activeIndex;
    const preloadColumns = [activeColumn - amount];
    preloadColumns.push(...Array.from({
      length: amount
    }).map((_, i) => {
      return activeColumn + slidesPerView + i;
    }));
    swiper.slides.forEach((slideEl, i) => {
      if (preloadColumns.includes(slideEl.column))
        unlazy(swiper, i);
    });
    return;
  }
  const slideIndexLastInView = activeIndex + slidesPerView - 1;
  if (swiper.params.rewind || swiper.params.loop) {
    for (let i = activeIndex - amount; i <= slideIndexLastInView + amount; i += 1) {
      const realIndex = (i % len + len) % len;
      if (realIndex < activeIndex || realIndex > slideIndexLastInView)
        unlazy(swiper, realIndex);
    }
  } else {
    for (let i = Math.max(activeIndex - amount, 0); i <= Math.min(slideIndexLastInView + amount, len - 1); i += 1) {
      if (i !== activeIndex && (i > slideIndexLastInView || i < activeIndex)) {
        unlazy(swiper, i);
      }
    }
  }
};
function getActiveIndexByTranslate(swiper) {
  const {
    slidesGrid,
    params
  } = swiper;
  const translate2 = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
  let activeIndex;
  for (let i = 0; i < slidesGrid.length; i += 1) {
    if (typeof slidesGrid[i + 1] !== "undefined") {
      if (translate2 >= slidesGrid[i] && translate2 < slidesGrid[i + 1] - (slidesGrid[i + 1] - slidesGrid[i]) / 2) {
        activeIndex = i;
      } else if (translate2 >= slidesGrid[i] && translate2 < slidesGrid[i + 1]) {
        activeIndex = i + 1;
      }
    } else if (translate2 >= slidesGrid[i]) {
      activeIndex = i;
    }
  }
  if (params.normalizeSlideIndex) {
    if (activeIndex < 0 || typeof activeIndex === "undefined")
      activeIndex = 0;
  }
  return activeIndex;
}
function updateActiveIndex(newActiveIndex) {
  const swiper = this;
  const translate2 = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
  const {
    snapGrid,
    params,
    activeIndex: previousIndex,
    realIndex: previousRealIndex,
    snapIndex: previousSnapIndex
  } = swiper;
  let activeIndex = newActiveIndex;
  let snapIndex;
  const getVirtualRealIndex = (aIndex) => {
    let realIndex2 = aIndex - swiper.virtual.slidesBefore;
    if (realIndex2 < 0) {
      realIndex2 = swiper.virtual.slides.length + realIndex2;
    }
    if (realIndex2 >= swiper.virtual.slides.length) {
      realIndex2 -= swiper.virtual.slides.length;
    }
    return realIndex2;
  };
  if (typeof activeIndex === "undefined") {
    activeIndex = getActiveIndexByTranslate(swiper);
  }
  if (snapGrid.indexOf(translate2) >= 0) {
    snapIndex = snapGrid.indexOf(translate2);
  } else {
    const skip = Math.min(params.slidesPerGroupSkip, activeIndex);
    snapIndex = skip + Math.floor((activeIndex - skip) / params.slidesPerGroup);
  }
  if (snapIndex >= snapGrid.length)
    snapIndex = snapGrid.length - 1;
  if (activeIndex === previousIndex && !swiper.params.loop) {
    if (snapIndex !== previousSnapIndex) {
      swiper.snapIndex = snapIndex;
      swiper.emit("snapIndexChange");
    }
    return;
  }
  if (activeIndex === previousIndex && swiper.params.loop && swiper.virtual && swiper.params.virtual.enabled) {
    swiper.realIndex = getVirtualRealIndex(activeIndex);
    return;
  }
  const gridEnabled = swiper.grid && params.grid && params.grid.rows > 1;
  let realIndex;
  if (swiper.virtual && params.virtual.enabled && params.loop) {
    realIndex = getVirtualRealIndex(activeIndex);
  } else if (gridEnabled) {
    const firstSlideInColumn = swiper.slides.find((slideEl) => slideEl.column === activeIndex);
    let activeSlideIndex = parseInt(firstSlideInColumn.getAttribute("data-swiper-slide-index"), 10);
    if (Number.isNaN(activeSlideIndex)) {
      activeSlideIndex = Math.max(swiper.slides.indexOf(firstSlideInColumn), 0);
    }
    realIndex = Math.floor(activeSlideIndex / params.grid.rows);
  } else if (swiper.slides[activeIndex]) {
    const slideIndex = swiper.slides[activeIndex].getAttribute("data-swiper-slide-index");
    if (slideIndex) {
      realIndex = parseInt(slideIndex, 10);
    } else {
      realIndex = activeIndex;
    }
  } else {
    realIndex = activeIndex;
  }
  Object.assign(swiper, {
    previousSnapIndex,
    snapIndex,
    previousRealIndex,
    realIndex,
    previousIndex,
    activeIndex
  });
  if (swiper.initialized) {
    preload(swiper);
  }
  swiper.emit("activeIndexChange");
  swiper.emit("snapIndexChange");
  if (swiper.initialized || swiper.params.runCallbacksOnInit) {
    if (previousRealIndex !== realIndex) {
      swiper.emit("realIndexChange");
    }
    swiper.emit("slideChange");
  }
}
function updateClickedSlide(el, path) {
  const swiper = this;
  const params = swiper.params;
  let slide2 = el.closest(`.${params.slideClass}, swiper-slide`);
  if (!slide2 && swiper.isElement && path && path.length > 1 && path.includes(el)) {
    [...path.slice(path.indexOf(el) + 1, path.length)].forEach((pathEl) => {
      if (!slide2 && pathEl.matches && pathEl.matches(`.${params.slideClass}, swiper-slide`)) {
        slide2 = pathEl;
      }
    });
  }
  let slideFound = false;
  let slideIndex;
  if (slide2) {
    for (let i = 0; i < swiper.slides.length; i += 1) {
      if (swiper.slides[i] === slide2) {
        slideFound = true;
        slideIndex = i;
        break;
      }
    }
  }
  if (slide2 && slideFound) {
    swiper.clickedSlide = slide2;
    if (swiper.virtual && swiper.params.virtual.enabled) {
      swiper.clickedIndex = parseInt(slide2.getAttribute("data-swiper-slide-index"), 10);
    } else {
      swiper.clickedIndex = slideIndex;
    }
  } else {
    swiper.clickedSlide = void 0;
    swiper.clickedIndex = void 0;
    return;
  }
  if (params.slideToClickedSlide && swiper.clickedIndex !== void 0 && swiper.clickedIndex !== swiper.activeIndex) {
    swiper.slideToClickedSlide();
  }
}
var update = {
  updateSize,
  updateSlides,
  updateAutoHeight,
  updateSlidesOffset,
  updateSlidesProgress,
  updateProgress,
  updateSlidesClasses,
  updateActiveIndex,
  updateClickedSlide
};
function getSwiperTranslate(axis) {
  if (axis === void 0) {
    axis = this.isHorizontal() ? "x" : "y";
  }
  const swiper = this;
  const {
    params,
    rtlTranslate: rtl,
    translate: translate2,
    wrapperEl
  } = swiper;
  if (params.virtualTranslate) {
    return rtl ? -translate2 : translate2;
  }
  if (params.cssMode) {
    return translate2;
  }
  let currentTranslate = getTranslate(wrapperEl, axis);
  currentTranslate += swiper.cssOverflowAdjustment();
  if (rtl)
    currentTranslate = -currentTranslate;
  return currentTranslate || 0;
}
function setTranslate(translate2, byController) {
  const swiper = this;
  const {
    rtlTranslate: rtl,
    params,
    wrapperEl,
    progress
  } = swiper;
  let x = 0;
  let y = 0;
  const z = 0;
  if (swiper.isHorizontal()) {
    x = rtl ? -translate2 : translate2;
  } else {
    y = translate2;
  }
  if (params.roundLengths) {
    x = Math.floor(x);
    y = Math.floor(y);
  }
  swiper.previousTranslate = swiper.translate;
  swiper.translate = swiper.isHorizontal() ? x : y;
  if (params.cssMode) {
    wrapperEl[swiper.isHorizontal() ? "scrollLeft" : "scrollTop"] = swiper.isHorizontal() ? -x : -y;
  } else if (!params.virtualTranslate) {
    if (swiper.isHorizontal()) {
      x -= swiper.cssOverflowAdjustment();
    } else {
      y -= swiper.cssOverflowAdjustment();
    }
    wrapperEl.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
  }
  let newProgress;
  const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
  if (translatesDiff === 0) {
    newProgress = 0;
  } else {
    newProgress = (translate2 - swiper.minTranslate()) / translatesDiff;
  }
  if (newProgress !== progress) {
    swiper.updateProgress(translate2);
  }
  swiper.emit("setTranslate", swiper.translate, byController);
}
function minTranslate() {
  return -this.snapGrid[0];
}
function maxTranslate() {
  return -this.snapGrid[this.snapGrid.length - 1];
}
function translateTo(translate2, speed, runCallbacks, translateBounds, internal) {
  if (translate2 === void 0) {
    translate2 = 0;
  }
  if (speed === void 0) {
    speed = this.params.speed;
  }
  if (runCallbacks === void 0) {
    runCallbacks = true;
  }
  if (translateBounds === void 0) {
    translateBounds = true;
  }
  const swiper = this;
  const {
    params,
    wrapperEl
  } = swiper;
  if (swiper.animating && params.preventInteractionOnTransition) {
    return false;
  }
  const minTranslate2 = swiper.minTranslate();
  const maxTranslate2 = swiper.maxTranslate();
  let newTranslate;
  if (translateBounds && translate2 > minTranslate2)
    newTranslate = minTranslate2;
  else if (translateBounds && translate2 < maxTranslate2)
    newTranslate = maxTranslate2;
  else
    newTranslate = translate2;
  swiper.updateProgress(newTranslate);
  if (params.cssMode) {
    const isH = swiper.isHorizontal();
    if (speed === 0) {
      wrapperEl[isH ? "scrollLeft" : "scrollTop"] = -newTranslate;
    } else {
      if (!swiper.support.smoothScroll) {
        animateCSSModeScroll({
          swiper,
          targetPosition: -newTranslate,
          side: isH ? "left" : "top"
        });
        return true;
      }
      wrapperEl.scrollTo({
        [isH ? "left" : "top"]: -newTranslate,
        behavior: "smooth"
      });
    }
    return true;
  }
  if (speed === 0) {
    swiper.setTransition(0);
    swiper.setTranslate(newTranslate);
    if (runCallbacks) {
      swiper.emit("beforeTransitionStart", speed, internal);
      swiper.emit("transitionEnd");
    }
  } else {
    swiper.setTransition(speed);
    swiper.setTranslate(newTranslate);
    if (runCallbacks) {
      swiper.emit("beforeTransitionStart", speed, internal);
      swiper.emit("transitionStart");
    }
    if (!swiper.animating) {
      swiper.animating = true;
      if (!swiper.onTranslateToWrapperTransitionEnd) {
        swiper.onTranslateToWrapperTransitionEnd = function transitionEnd2(e) {
          if (!swiper || swiper.destroyed)
            return;
          if (e.target !== this)
            return;
          swiper.wrapperEl.removeEventListener("transitionend", swiper.onTranslateToWrapperTransitionEnd);
          swiper.onTranslateToWrapperTransitionEnd = null;
          delete swiper.onTranslateToWrapperTransitionEnd;
          swiper.animating = false;
          if (runCallbacks) {
            swiper.emit("transitionEnd");
          }
        };
      }
      swiper.wrapperEl.addEventListener("transitionend", swiper.onTranslateToWrapperTransitionEnd);
    }
  }
  return true;
}
var translate = {
  getTranslate: getSwiperTranslate,
  setTranslate,
  minTranslate,
  maxTranslate,
  translateTo
};
function setTransition(duration, byController) {
  const swiper = this;
  if (!swiper.params.cssMode) {
    swiper.wrapperEl.style.transitionDuration = `${duration}ms`;
    swiper.wrapperEl.style.transitionDelay = duration === 0 ? `0ms` : "";
  }
  swiper.emit("setTransition", duration, byController);
}
function transitionEmit(_ref) {
  let {
    swiper,
    runCallbacks,
    direction,
    step
  } = _ref;
  const {
    activeIndex,
    previousIndex
  } = swiper;
  let dir = direction;
  if (!dir) {
    if (activeIndex > previousIndex)
      dir = "next";
    else if (activeIndex < previousIndex)
      dir = "prev";
    else
      dir = "reset";
  }
  swiper.emit(`transition${step}`);
  if (runCallbacks && activeIndex !== previousIndex) {
    if (dir === "reset") {
      swiper.emit(`slideResetTransition${step}`);
      return;
    }
    swiper.emit(`slideChangeTransition${step}`);
    if (dir === "next") {
      swiper.emit(`slideNextTransition${step}`);
    } else {
      swiper.emit(`slidePrevTransition${step}`);
    }
  }
}
function transitionStart(runCallbacks, direction) {
  if (runCallbacks === void 0) {
    runCallbacks = true;
  }
  const swiper = this;
  const {
    params
  } = swiper;
  if (params.cssMode)
    return;
  if (params.autoHeight) {
    swiper.updateAutoHeight();
  }
  transitionEmit({
    swiper,
    runCallbacks,
    direction,
    step: "Start"
  });
}
function transitionEnd(runCallbacks, direction) {
  if (runCallbacks === void 0) {
    runCallbacks = true;
  }
  const swiper = this;
  const {
    params
  } = swiper;
  swiper.animating = false;
  if (params.cssMode)
    return;
  swiper.setTransition(0);
  transitionEmit({
    swiper,
    runCallbacks,
    direction,
    step: "End"
  });
}
var transition = {
  setTransition,
  transitionStart,
  transitionEnd
};
function slideTo(index, speed, runCallbacks, internal, initial) {
  if (index === void 0) {
    index = 0;
  }
  if (runCallbacks === void 0) {
    runCallbacks = true;
  }
  if (typeof index === "string") {
    index = parseInt(index, 10);
  }
  const swiper = this;
  let slideIndex = index;
  if (slideIndex < 0)
    slideIndex = 0;
  const {
    params,
    snapGrid,
    slidesGrid,
    previousIndex,
    activeIndex,
    rtlTranslate: rtl,
    wrapperEl,
    enabled
  } = swiper;
  if (!enabled && !internal && !initial || swiper.destroyed || swiper.animating && params.preventInteractionOnTransition) {
    return false;
  }
  if (typeof speed === "undefined") {
    speed = swiper.params.speed;
  }
  const skip = Math.min(swiper.params.slidesPerGroupSkip, slideIndex);
  let snapIndex = skip + Math.floor((slideIndex - skip) / swiper.params.slidesPerGroup);
  if (snapIndex >= snapGrid.length)
    snapIndex = snapGrid.length - 1;
  const translate2 = -snapGrid[snapIndex];
  if (params.normalizeSlideIndex) {
    for (let i = 0; i < slidesGrid.length; i += 1) {
      const normalizedTranslate = -Math.floor(translate2 * 100);
      const normalizedGrid = Math.floor(slidesGrid[i] * 100);
      const normalizedGridNext = Math.floor(slidesGrid[i + 1] * 100);
      if (typeof slidesGrid[i + 1] !== "undefined") {
        if (normalizedTranslate >= normalizedGrid && normalizedTranslate < normalizedGridNext - (normalizedGridNext - normalizedGrid) / 2) {
          slideIndex = i;
        } else if (normalizedTranslate >= normalizedGrid && normalizedTranslate < normalizedGridNext) {
          slideIndex = i + 1;
        }
      } else if (normalizedTranslate >= normalizedGrid) {
        slideIndex = i;
      }
    }
  }
  if (swiper.initialized && slideIndex !== activeIndex) {
    if (!swiper.allowSlideNext && (rtl ? translate2 > swiper.translate && translate2 > swiper.minTranslate() : translate2 < swiper.translate && translate2 < swiper.minTranslate())) {
      return false;
    }
    if (!swiper.allowSlidePrev && translate2 > swiper.translate && translate2 > swiper.maxTranslate()) {
      if ((activeIndex || 0) !== slideIndex) {
        return false;
      }
    }
  }
  if (slideIndex !== (previousIndex || 0) && runCallbacks) {
    swiper.emit("beforeSlideChangeStart");
  }
  swiper.updateProgress(translate2);
  let direction;
  if (slideIndex > activeIndex)
    direction = "next";
  else if (slideIndex < activeIndex)
    direction = "prev";
  else
    direction = "reset";
  const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
  const isInitialVirtual = isVirtual && initial;
  if (!isInitialVirtual && (rtl && -translate2 === swiper.translate || !rtl && translate2 === swiper.translate)) {
    swiper.updateActiveIndex(slideIndex);
    if (params.autoHeight) {
      swiper.updateAutoHeight();
    }
    swiper.updateSlidesClasses();
    if (params.effect !== "slide") {
      swiper.setTranslate(translate2);
    }
    if (direction !== "reset") {
      swiper.transitionStart(runCallbacks, direction);
      swiper.transitionEnd(runCallbacks, direction);
    }
    return false;
  }
  if (params.cssMode) {
    const isH = swiper.isHorizontal();
    const t = rtl ? translate2 : -translate2;
    if (speed === 0) {
      if (isVirtual) {
        swiper.wrapperEl.style.scrollSnapType = "none";
        swiper._immediateVirtual = true;
      }
      if (isVirtual && !swiper._cssModeVirtualInitialSet && swiper.params.initialSlide > 0) {
        swiper._cssModeVirtualInitialSet = true;
        requestAnimationFrame(() => {
          wrapperEl[isH ? "scrollLeft" : "scrollTop"] = t;
        });
      } else {
        wrapperEl[isH ? "scrollLeft" : "scrollTop"] = t;
      }
      if (isVirtual) {
        requestAnimationFrame(() => {
          swiper.wrapperEl.style.scrollSnapType = "";
          swiper._immediateVirtual = false;
        });
      }
    } else {
      if (!swiper.support.smoothScroll) {
        animateCSSModeScroll({
          swiper,
          targetPosition: t,
          side: isH ? "left" : "top"
        });
        return true;
      }
      wrapperEl.scrollTo({
        [isH ? "left" : "top"]: t,
        behavior: "smooth"
      });
    }
    return true;
  }
  swiper.setTransition(speed);
  swiper.setTranslate(translate2);
  swiper.updateActiveIndex(slideIndex);
  swiper.updateSlidesClasses();
  swiper.emit("beforeTransitionStart", speed, internal);
  swiper.transitionStart(runCallbacks, direction);
  if (speed === 0) {
    swiper.transitionEnd(runCallbacks, direction);
  } else if (!swiper.animating) {
    swiper.animating = true;
    if (!swiper.onSlideToWrapperTransitionEnd) {
      swiper.onSlideToWrapperTransitionEnd = function transitionEnd2(e) {
        if (!swiper || swiper.destroyed)
          return;
        if (e.target !== this)
          return;
        swiper.wrapperEl.removeEventListener("transitionend", swiper.onSlideToWrapperTransitionEnd);
        swiper.onSlideToWrapperTransitionEnd = null;
        delete swiper.onSlideToWrapperTransitionEnd;
        swiper.transitionEnd(runCallbacks, direction);
      };
    }
    swiper.wrapperEl.addEventListener("transitionend", swiper.onSlideToWrapperTransitionEnd);
  }
  return true;
}
function slideToLoop(index, speed, runCallbacks, internal) {
  if (index === void 0) {
    index = 0;
  }
  if (runCallbacks === void 0) {
    runCallbacks = true;
  }
  if (typeof index === "string") {
    const indexAsNumber = parseInt(index, 10);
    index = indexAsNumber;
  }
  const swiper = this;
  if (swiper.destroyed)
    return;
  if (typeof speed === "undefined") {
    speed = swiper.params.speed;
  }
  const gridEnabled = swiper.grid && swiper.params.grid && swiper.params.grid.rows > 1;
  let newIndex = index;
  if (swiper.params.loop) {
    if (swiper.virtual && swiper.params.virtual.enabled) {
      newIndex = newIndex + swiper.virtual.slidesBefore;
    } else {
      let targetSlideIndex;
      if (gridEnabled) {
        const slideIndex = newIndex * swiper.params.grid.rows;
        targetSlideIndex = swiper.slides.find((slideEl) => slideEl.getAttribute("data-swiper-slide-index") * 1 === slideIndex).column;
      } else {
        targetSlideIndex = swiper.getSlideIndexByData(newIndex);
      }
      const cols = gridEnabled ? Math.ceil(swiper.slides.length / swiper.params.grid.rows) : swiper.slides.length;
      const {
        centeredSlides
      } = swiper.params;
      let slidesPerView = swiper.params.slidesPerView;
      if (slidesPerView === "auto") {
        slidesPerView = swiper.slidesPerViewDynamic();
      } else {
        slidesPerView = Math.ceil(parseFloat(swiper.params.slidesPerView, 10));
        if (centeredSlides && slidesPerView % 2 === 0) {
          slidesPerView = slidesPerView + 1;
        }
      }
      let needLoopFix = cols - targetSlideIndex < slidesPerView;
      if (centeredSlides) {
        needLoopFix = needLoopFix || targetSlideIndex < Math.ceil(slidesPerView / 2);
      }
      if (internal && centeredSlides && swiper.params.slidesPerView !== "auto" && !gridEnabled) {
        needLoopFix = false;
      }
      if (needLoopFix) {
        const direction = centeredSlides ? targetSlideIndex < swiper.activeIndex ? "prev" : "next" : targetSlideIndex - swiper.activeIndex - 1 < swiper.params.slidesPerView ? "next" : "prev";
        swiper.loopFix({
          direction,
          slideTo: true,
          activeSlideIndex: direction === "next" ? targetSlideIndex + 1 : targetSlideIndex - cols + 1,
          slideRealIndex: direction === "next" ? swiper.realIndex : void 0
        });
      }
      if (gridEnabled) {
        const slideIndex = newIndex * swiper.params.grid.rows;
        newIndex = swiper.slides.find((slideEl) => slideEl.getAttribute("data-swiper-slide-index") * 1 === slideIndex).column;
      } else {
        newIndex = swiper.getSlideIndexByData(newIndex);
      }
    }
  }
  requestAnimationFrame(() => {
    swiper.slideTo(newIndex, speed, runCallbacks, internal);
  });
  return swiper;
}
function slideNext(speed, runCallbacks, internal) {
  if (runCallbacks === void 0) {
    runCallbacks = true;
  }
  const swiper = this;
  const {
    enabled,
    params,
    animating
  } = swiper;
  if (!enabled || swiper.destroyed)
    return swiper;
  if (typeof speed === "undefined") {
    speed = swiper.params.speed;
  }
  let perGroup = params.slidesPerGroup;
  if (params.slidesPerView === "auto" && params.slidesPerGroup === 1 && params.slidesPerGroupAuto) {
    perGroup = Math.max(swiper.slidesPerViewDynamic("current", true), 1);
  }
  const increment = swiper.activeIndex < params.slidesPerGroupSkip ? 1 : perGroup;
  const isVirtual = swiper.virtual && params.virtual.enabled;
  if (params.loop) {
    if (animating && !isVirtual && params.loopPreventsSliding)
      return false;
    swiper.loopFix({
      direction: "next"
    });
    swiper._clientLeft = swiper.wrapperEl.clientLeft;
    if (swiper.activeIndex === swiper.slides.length - 1 && params.cssMode) {
      requestAnimationFrame(() => {
        swiper.slideTo(swiper.activeIndex + increment, speed, runCallbacks, internal);
      });
      return true;
    }
  }
  if (params.rewind && swiper.isEnd) {
    return swiper.slideTo(0, speed, runCallbacks, internal);
  }
  return swiper.slideTo(swiper.activeIndex + increment, speed, runCallbacks, internal);
}
function slidePrev(speed, runCallbacks, internal) {
  if (runCallbacks === void 0) {
    runCallbacks = true;
  }
  const swiper = this;
  const {
    params,
    snapGrid,
    slidesGrid,
    rtlTranslate,
    enabled,
    animating
  } = swiper;
  if (!enabled || swiper.destroyed)
    return swiper;
  if (typeof speed === "undefined") {
    speed = swiper.params.speed;
  }
  const isVirtual = swiper.virtual && params.virtual.enabled;
  if (params.loop) {
    if (animating && !isVirtual && params.loopPreventsSliding)
      return false;
    swiper.loopFix({
      direction: "prev"
    });
    swiper._clientLeft = swiper.wrapperEl.clientLeft;
  }
  const translate2 = rtlTranslate ? swiper.translate : -swiper.translate;
  function normalize(val) {
    if (val < 0)
      return -Math.floor(Math.abs(val));
    return Math.floor(val);
  }
  const normalizedTranslate = normalize(translate2);
  const normalizedSnapGrid = snapGrid.map((val) => normalize(val));
  let prevSnap = snapGrid[normalizedSnapGrid.indexOf(normalizedTranslate) - 1];
  if (typeof prevSnap === "undefined" && params.cssMode) {
    let prevSnapIndex;
    snapGrid.forEach((snap, snapIndex) => {
      if (normalizedTranslate >= snap) {
        prevSnapIndex = snapIndex;
      }
    });
    if (typeof prevSnapIndex !== "undefined") {
      prevSnap = snapGrid[prevSnapIndex > 0 ? prevSnapIndex - 1 : prevSnapIndex];
    }
  }
  let prevIndex = 0;
  if (typeof prevSnap !== "undefined") {
    prevIndex = slidesGrid.indexOf(prevSnap);
    if (prevIndex < 0)
      prevIndex = swiper.activeIndex - 1;
    if (params.slidesPerView === "auto" && params.slidesPerGroup === 1 && params.slidesPerGroupAuto) {
      prevIndex = prevIndex - swiper.slidesPerViewDynamic("previous", true) + 1;
      prevIndex = Math.max(prevIndex, 0);
    }
  }
  if (params.rewind && swiper.isBeginning) {
    const lastIndex = swiper.params.virtual && swiper.params.virtual.enabled && swiper.virtual ? swiper.virtual.slides.length - 1 : swiper.slides.length - 1;
    return swiper.slideTo(lastIndex, speed, runCallbacks, internal);
  } else if (params.loop && swiper.activeIndex === 0 && params.cssMode) {
    requestAnimationFrame(() => {
      swiper.slideTo(prevIndex, speed, runCallbacks, internal);
    });
    return true;
  }
  return swiper.slideTo(prevIndex, speed, runCallbacks, internal);
}
function slideReset(speed, runCallbacks, internal) {
  if (runCallbacks === void 0) {
    runCallbacks = true;
  }
  const swiper = this;
  if (swiper.destroyed)
    return;
  if (typeof speed === "undefined") {
    speed = swiper.params.speed;
  }
  return swiper.slideTo(swiper.activeIndex, speed, runCallbacks, internal);
}
function slideToClosest(speed, runCallbacks, internal, threshold) {
  if (runCallbacks === void 0) {
    runCallbacks = true;
  }
  if (threshold === void 0) {
    threshold = 0.5;
  }
  const swiper = this;
  if (swiper.destroyed)
    return;
  if (typeof speed === "undefined") {
    speed = swiper.params.speed;
  }
  let index = swiper.activeIndex;
  const skip = Math.min(swiper.params.slidesPerGroupSkip, index);
  const snapIndex = skip + Math.floor((index - skip) / swiper.params.slidesPerGroup);
  const translate2 = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
  if (translate2 >= swiper.snapGrid[snapIndex]) {
    const currentSnap = swiper.snapGrid[snapIndex];
    const nextSnap = swiper.snapGrid[snapIndex + 1];
    if (translate2 - currentSnap > (nextSnap - currentSnap) * threshold) {
      index += swiper.params.slidesPerGroup;
    }
  } else {
    const prevSnap = swiper.snapGrid[snapIndex - 1];
    const currentSnap = swiper.snapGrid[snapIndex];
    if (translate2 - prevSnap <= (currentSnap - prevSnap) * threshold) {
      index -= swiper.params.slidesPerGroup;
    }
  }
  index = Math.max(index, 0);
  index = Math.min(index, swiper.slidesGrid.length - 1);
  return swiper.slideTo(index, speed, runCallbacks, internal);
}
function slideToClickedSlide() {
  const swiper = this;
  if (swiper.destroyed)
    return;
  const {
    params,
    slidesEl
  } = swiper;
  const slidesPerView = params.slidesPerView === "auto" ? swiper.slidesPerViewDynamic() : params.slidesPerView;
  let slideToIndex = swiper.clickedIndex;
  let realIndex;
  const slideSelector = swiper.isElement ? `swiper-slide` : `.${params.slideClass}`;
  if (params.loop) {
    if (swiper.animating)
      return;
    realIndex = parseInt(swiper.clickedSlide.getAttribute("data-swiper-slide-index"), 10);
    if (params.centeredSlides) {
      if (slideToIndex < swiper.loopedSlides - slidesPerView / 2 || slideToIndex > swiper.slides.length - swiper.loopedSlides + slidesPerView / 2) {
        swiper.loopFix();
        slideToIndex = swiper.getSlideIndex(elementChildren(slidesEl, `${slideSelector}[data-swiper-slide-index="${realIndex}"]`)[0]);
        nextTick(() => {
          swiper.slideTo(slideToIndex);
        });
      } else {
        swiper.slideTo(slideToIndex);
      }
    } else if (slideToIndex > swiper.slides.length - slidesPerView) {
      swiper.loopFix();
      slideToIndex = swiper.getSlideIndex(elementChildren(slidesEl, `${slideSelector}[data-swiper-slide-index="${realIndex}"]`)[0]);
      nextTick(() => {
        swiper.slideTo(slideToIndex);
      });
    } else {
      swiper.slideTo(slideToIndex);
    }
  } else {
    swiper.slideTo(slideToIndex);
  }
}
var slide = {
  slideTo,
  slideToLoop,
  slideNext,
  slidePrev,
  slideReset,
  slideToClosest,
  slideToClickedSlide
};
function loopCreate(slideRealIndex) {
  const swiper = this;
  const {
    params,
    slidesEl
  } = swiper;
  if (!params.loop || swiper.virtual && swiper.params.virtual.enabled)
    return;
  const initSlides = () => {
    const slides = elementChildren(slidesEl, `.${params.slideClass}, swiper-slide`);
    slides.forEach((el, index) => {
      el.setAttribute("data-swiper-slide-index", index);
    });
  };
  const gridEnabled = swiper.grid && params.grid && params.grid.rows > 1;
  const slidesPerGroup = params.slidesPerGroup * (gridEnabled ? params.grid.rows : 1);
  const shouldFillGroup = swiper.slides.length % slidesPerGroup !== 0;
  const shouldFillGrid = gridEnabled && swiper.slides.length % params.grid.rows !== 0;
  const addBlankSlides = (amountOfSlides) => {
    for (let i = 0; i < amountOfSlides; i += 1) {
      const slideEl = swiper.isElement ? createElement("swiper-slide", [params.slideBlankClass]) : createElement("div", [params.slideClass, params.slideBlankClass]);
      swiper.slidesEl.append(slideEl);
    }
  };
  if (shouldFillGroup) {
    if (params.loopAddBlankSlides) {
      const slidesToAdd = slidesPerGroup - swiper.slides.length % slidesPerGroup;
      addBlankSlides(slidesToAdd);
      swiper.recalcSlides();
      swiper.updateSlides();
    } else {
      showWarning("Swiper Loop Warning: The number of slides is not even to slidesPerGroup, loop mode may not function properly. You need to add more slides (or make duplicates, or empty slides)");
    }
    initSlides();
  } else if (shouldFillGrid) {
    if (params.loopAddBlankSlides) {
      const slidesToAdd = params.grid.rows - swiper.slides.length % params.grid.rows;
      addBlankSlides(slidesToAdd);
      swiper.recalcSlides();
      swiper.updateSlides();
    } else {
      showWarning("Swiper Loop Warning: The number of slides is not even to grid.rows, loop mode may not function properly. You need to add more slides (or make duplicates, or empty slides)");
    }
    initSlides();
  } else {
    initSlides();
  }
  swiper.loopFix({
    slideRealIndex,
    direction: params.centeredSlides ? void 0 : "next"
  });
}
function loopFix(_temp) {
  let {
    slideRealIndex,
    slideTo: slideTo2 = true,
    direction,
    setTranslate: setTranslate2,
    activeSlideIndex,
    byController,
    byMousewheel
  } = _temp === void 0 ? {} : _temp;
  const swiper = this;
  if (!swiper.params.loop)
    return;
  swiper.emit("beforeLoopFix");
  const {
    slides,
    allowSlidePrev,
    allowSlideNext,
    slidesEl,
    params
  } = swiper;
  const {
    centeredSlides
  } = params;
  swiper.allowSlidePrev = true;
  swiper.allowSlideNext = true;
  if (swiper.virtual && params.virtual.enabled) {
    if (slideTo2) {
      if (!params.centeredSlides && swiper.snapIndex === 0) {
        swiper.slideTo(swiper.virtual.slides.length, 0, false, true);
      } else if (params.centeredSlides && swiper.snapIndex < params.slidesPerView) {
        swiper.slideTo(swiper.virtual.slides.length + swiper.snapIndex, 0, false, true);
      } else if (swiper.snapIndex === swiper.snapGrid.length - 1) {
        swiper.slideTo(swiper.virtual.slidesBefore, 0, false, true);
      }
    }
    swiper.allowSlidePrev = allowSlidePrev;
    swiper.allowSlideNext = allowSlideNext;
    swiper.emit("loopFix");
    return;
  }
  let slidesPerView = params.slidesPerView;
  if (slidesPerView === "auto") {
    slidesPerView = swiper.slidesPerViewDynamic();
  } else {
    slidesPerView = Math.ceil(parseFloat(params.slidesPerView, 10));
    if (centeredSlides && slidesPerView % 2 === 0) {
      slidesPerView = slidesPerView + 1;
    }
  }
  const slidesPerGroup = params.slidesPerGroupAuto ? slidesPerView : params.slidesPerGroup;
  let loopedSlides = slidesPerGroup;
  if (loopedSlides % slidesPerGroup !== 0) {
    loopedSlides += slidesPerGroup - loopedSlides % slidesPerGroup;
  }
  loopedSlides += params.loopAdditionalSlides;
  swiper.loopedSlides = loopedSlides;
  const gridEnabled = swiper.grid && params.grid && params.grid.rows > 1;
  if (slides.length < slidesPerView + loopedSlides) {
    showWarning("Swiper Loop Warning: The number of slides is not enough for loop mode, it will be disabled and not function properly. You need to add more slides (or make duplicates) or lower the values of slidesPerView and slidesPerGroup parameters");
  } else if (gridEnabled && params.grid.fill === "row") {
    showWarning("Swiper Loop Warning: Loop mode is not compatible with grid.fill = `row`");
  }
  const prependSlidesIndexes = [];
  const appendSlidesIndexes = [];
  let activeIndex = swiper.activeIndex;
  if (typeof activeSlideIndex === "undefined") {
    activeSlideIndex = swiper.getSlideIndex(slides.find((el) => el.classList.contains(params.slideActiveClass)));
  } else {
    activeIndex = activeSlideIndex;
  }
  const isNext = direction === "next" || !direction;
  const isPrev = direction === "prev" || !direction;
  let slidesPrepended = 0;
  let slidesAppended = 0;
  const cols = gridEnabled ? Math.ceil(slides.length / params.grid.rows) : slides.length;
  const activeColIndex = gridEnabled ? slides[activeSlideIndex].column : activeSlideIndex;
  const activeColIndexWithShift = activeColIndex + (centeredSlides && typeof setTranslate2 === "undefined" ? -slidesPerView / 2 + 0.5 : 0);
  if (activeColIndexWithShift < loopedSlides) {
    slidesPrepended = Math.max(loopedSlides - activeColIndexWithShift, slidesPerGroup);
    for (let i = 0; i < loopedSlides - activeColIndexWithShift; i += 1) {
      const index = i - Math.floor(i / cols) * cols;
      if (gridEnabled) {
        const colIndexToPrepend = cols - index - 1;
        for (let i2 = slides.length - 1; i2 >= 0; i2 -= 1) {
          if (slides[i2].column === colIndexToPrepend)
            prependSlidesIndexes.push(i2);
        }
      } else {
        prependSlidesIndexes.push(cols - index - 1);
      }
    }
  } else if (activeColIndexWithShift + slidesPerView > cols - loopedSlides) {
    slidesAppended = Math.max(activeColIndexWithShift - (cols - loopedSlides * 2), slidesPerGroup);
    for (let i = 0; i < slidesAppended; i += 1) {
      const index = i - Math.floor(i / cols) * cols;
      if (gridEnabled) {
        slides.forEach((slide2, slideIndex) => {
          if (slide2.column === index)
            appendSlidesIndexes.push(slideIndex);
        });
      } else {
        appendSlidesIndexes.push(index);
      }
    }
  }
  swiper.__preventObserver__ = true;
  requestAnimationFrame(() => {
    swiper.__preventObserver__ = false;
  });
  if (isPrev) {
    prependSlidesIndexes.forEach((index) => {
      slides[index].swiperLoopMoveDOM = true;
      slidesEl.prepend(slides[index]);
      slides[index].swiperLoopMoveDOM = false;
    });
  }
  if (isNext) {
    appendSlidesIndexes.forEach((index) => {
      slides[index].swiperLoopMoveDOM = true;
      slidesEl.append(slides[index]);
      slides[index].swiperLoopMoveDOM = false;
    });
  }
  swiper.recalcSlides();
  if (params.slidesPerView === "auto") {
    swiper.updateSlides();
  } else if (gridEnabled && (prependSlidesIndexes.length > 0 && isPrev || appendSlidesIndexes.length > 0 && isNext)) {
    swiper.slides.forEach((slide2, slideIndex) => {
      swiper.grid.updateSlide(slideIndex, slide2, swiper.slides);
    });
  }
  if (params.watchSlidesProgress) {
    swiper.updateSlidesOffset();
  }
  if (slideTo2) {
    if (prependSlidesIndexes.length > 0 && isPrev) {
      if (typeof slideRealIndex === "undefined") {
        const currentSlideTranslate = swiper.slidesGrid[activeIndex];
        const newSlideTranslate = swiper.slidesGrid[activeIndex + slidesPrepended];
        const diff = newSlideTranslate - currentSlideTranslate;
        if (byMousewheel) {
          swiper.setTranslate(swiper.translate - diff);
        } else {
          swiper.slideTo(activeIndex + Math.ceil(slidesPrepended), 0, false, true);
          if (setTranslate2) {
            swiper.touchEventsData.startTranslate = swiper.touchEventsData.startTranslate - diff;
            swiper.touchEventsData.currentTranslate = swiper.touchEventsData.currentTranslate - diff;
          }
        }
      } else {
        if (setTranslate2) {
          const shift = gridEnabled ? prependSlidesIndexes.length / params.grid.rows : prependSlidesIndexes.length;
          swiper.slideTo(swiper.activeIndex + shift, 0, false, true);
          swiper.touchEventsData.currentTranslate = swiper.translate;
        }
      }
    } else if (appendSlidesIndexes.length > 0 && isNext) {
      if (typeof slideRealIndex === "undefined") {
        const currentSlideTranslate = swiper.slidesGrid[activeIndex];
        const newSlideTranslate = swiper.slidesGrid[activeIndex - slidesAppended];
        const diff = newSlideTranslate - currentSlideTranslate;
        if (byMousewheel) {
          swiper.setTranslate(swiper.translate - diff);
        } else {
          swiper.slideTo(activeIndex - slidesAppended, 0, false, true);
          if (setTranslate2) {
            swiper.touchEventsData.startTranslate = swiper.touchEventsData.startTranslate - diff;
            swiper.touchEventsData.currentTranslate = swiper.touchEventsData.currentTranslate - diff;
          }
        }
      } else {
        const shift = gridEnabled ? appendSlidesIndexes.length / params.grid.rows : appendSlidesIndexes.length;
        swiper.slideTo(swiper.activeIndex - shift, 0, false, true);
      }
    }
  }
  swiper.allowSlidePrev = allowSlidePrev;
  swiper.allowSlideNext = allowSlideNext;
  if (swiper.controller && swiper.controller.control && !byController) {
    const loopParams = {
      slideRealIndex,
      direction,
      setTranslate: setTranslate2,
      activeSlideIndex,
      byController: true
    };
    if (Array.isArray(swiper.controller.control)) {
      swiper.controller.control.forEach((c) => {
        if (!c.destroyed && c.params.loop)
          c.loopFix({
            ...loopParams,
            slideTo: c.params.slidesPerView === params.slidesPerView ? slideTo2 : false
          });
      });
    } else if (swiper.controller.control instanceof swiper.constructor && swiper.controller.control.params.loop) {
      swiper.controller.control.loopFix({
        ...loopParams,
        slideTo: swiper.controller.control.params.slidesPerView === params.slidesPerView ? slideTo2 : false
      });
    }
  }
  swiper.emit("loopFix");
}
function loopDestroy() {
  const swiper = this;
  const {
    params,
    slidesEl
  } = swiper;
  if (!params.loop || swiper.virtual && swiper.params.virtual.enabled)
    return;
  swiper.recalcSlides();
  const newSlidesOrder = [];
  swiper.slides.forEach((slideEl) => {
    const index = typeof slideEl.swiperSlideIndex === "undefined" ? slideEl.getAttribute("data-swiper-slide-index") * 1 : slideEl.swiperSlideIndex;
    newSlidesOrder[index] = slideEl;
  });
  swiper.slides.forEach((slideEl) => {
    slideEl.removeAttribute("data-swiper-slide-index");
  });
  newSlidesOrder.forEach((slideEl) => {
    slidesEl.append(slideEl);
  });
  swiper.recalcSlides();
  swiper.slideTo(swiper.realIndex, 0);
}
var loop = {
  loopCreate,
  loopFix,
  loopDestroy
};
function setGrabCursor(moving) {
  const swiper = this;
  if (!swiper.params.simulateTouch || swiper.params.watchOverflow && swiper.isLocked || swiper.params.cssMode)
    return;
  const el = swiper.params.touchEventsTarget === "container" ? swiper.el : swiper.wrapperEl;
  if (swiper.isElement) {
    swiper.__preventObserver__ = true;
  }
  el.style.cursor = "move";
  el.style.cursor = moving ? "grabbing" : "grab";
  if (swiper.isElement) {
    requestAnimationFrame(() => {
      swiper.__preventObserver__ = false;
    });
  }
}
function unsetGrabCursor() {
  const swiper = this;
  if (swiper.params.watchOverflow && swiper.isLocked || swiper.params.cssMode) {
    return;
  }
  if (swiper.isElement) {
    swiper.__preventObserver__ = true;
  }
  swiper[swiper.params.touchEventsTarget === "container" ? "el" : "wrapperEl"].style.cursor = "";
  if (swiper.isElement) {
    requestAnimationFrame(() => {
      swiper.__preventObserver__ = false;
    });
  }
}
var grabCursor = {
  setGrabCursor,
  unsetGrabCursor
};
function closestElement(selector, base) {
  if (base === void 0) {
    base = this;
  }
  function __closestFrom(el) {
    if (!el || el === getDocument() || el === getWindow())
      return null;
    if (el.assignedSlot)
      el = el.assignedSlot;
    const found = el.closest(selector);
    if (!found && !el.getRootNode) {
      return null;
    }
    return found || __closestFrom(el.getRootNode().host);
  }
  return __closestFrom(base);
}
function preventEdgeSwipe(swiper, event, startX) {
  const window2 = getWindow();
  const {
    params
  } = swiper;
  const edgeSwipeDetection = params.edgeSwipeDetection;
  const edgeSwipeThreshold = params.edgeSwipeThreshold;
  if (edgeSwipeDetection && (startX <= edgeSwipeThreshold || startX >= window2.innerWidth - edgeSwipeThreshold)) {
    if (edgeSwipeDetection === "prevent") {
      event.preventDefault();
      return true;
    }
    return false;
  }
  return true;
}
function onTouchStart(event) {
  const swiper = this;
  const document2 = getDocument();
  let e = event;
  if (e.originalEvent)
    e = e.originalEvent;
  const data = swiper.touchEventsData;
  if (e.type === "pointerdown") {
    if (data.pointerId !== null && data.pointerId !== e.pointerId) {
      return;
    }
    data.pointerId = e.pointerId;
  } else if (e.type === "touchstart" && e.targetTouches.length === 1) {
    data.touchId = e.targetTouches[0].identifier;
  }
  if (e.type === "touchstart") {
    preventEdgeSwipe(swiper, e, e.targetTouches[0].pageX);
    return;
  }
  const {
    params,
    touches,
    enabled
  } = swiper;
  if (!enabled)
    return;
  if (!params.simulateTouch && e.pointerType === "mouse")
    return;
  if (swiper.animating && params.preventInteractionOnTransition) {
    return;
  }
  if (!swiper.animating && params.cssMode && params.loop) {
    swiper.loopFix();
  }
  let targetEl = e.target;
  if (params.touchEventsTarget === "wrapper") {
    if (!elementIsChildOf(targetEl, swiper.wrapperEl))
      return;
  }
  if ("which" in e && e.which === 3)
    return;
  if ("button" in e && e.button > 0)
    return;
  if (data.isTouched && data.isMoved)
    return;
  const swipingClassHasValue = !!params.noSwipingClass && params.noSwipingClass !== "";
  const eventPath = e.composedPath ? e.composedPath() : e.path;
  if (swipingClassHasValue && e.target && e.target.shadowRoot && eventPath) {
    targetEl = eventPath[0];
  }
  const noSwipingSelector = params.noSwipingSelector ? params.noSwipingSelector : `.${params.noSwipingClass}`;
  const isTargetShadow = !!(e.target && e.target.shadowRoot);
  if (params.noSwiping && (isTargetShadow ? closestElement(noSwipingSelector, targetEl) : targetEl.closest(noSwipingSelector))) {
    swiper.allowClick = true;
    return;
  }
  if (params.swipeHandler) {
    if (!targetEl.closest(params.swipeHandler))
      return;
  }
  touches.currentX = e.pageX;
  touches.currentY = e.pageY;
  const startX = touches.currentX;
  const startY = touches.currentY;
  if (!preventEdgeSwipe(swiper, e, startX)) {
    return;
  }
  Object.assign(data, {
    isTouched: true,
    isMoved: false,
    allowTouchCallbacks: true,
    isScrolling: void 0,
    startMoving: void 0
  });
  touches.startX = startX;
  touches.startY = startY;
  data.touchStartTime = now();
  swiper.allowClick = true;
  swiper.updateSize();
  swiper.swipeDirection = void 0;
  if (params.threshold > 0)
    data.allowThresholdMove = false;
  let preventDefault2 = true;
  if (targetEl.matches(data.focusableElements)) {
    preventDefault2 = false;
    if (targetEl.nodeName === "SELECT") {
      data.isTouched = false;
    }
  }
  if (document2.activeElement && document2.activeElement.matches(data.focusableElements) && document2.activeElement !== targetEl && (e.pointerType === "mouse" || e.pointerType !== "mouse" && !targetEl.matches(data.focusableElements))) {
    document2.activeElement.blur();
  }
  const shouldPreventDefault = preventDefault2 && swiper.allowTouchMove && params.touchStartPreventDefault;
  if ((params.touchStartForcePreventDefault || shouldPreventDefault) && !targetEl.isContentEditable) {
    e.preventDefault();
  }
  if (params.freeMode && params.freeMode.enabled && swiper.freeMode && swiper.animating && !params.cssMode) {
    swiper.freeMode.onTouchStart();
  }
  swiper.emit("touchStart", e);
}
function onTouchMove(event) {
  const document2 = getDocument();
  const swiper = this;
  const data = swiper.touchEventsData;
  const {
    params,
    touches,
    rtlTranslate: rtl,
    enabled
  } = swiper;
  if (!enabled)
    return;
  if (!params.simulateTouch && event.pointerType === "mouse")
    return;
  let e = event;
  if (e.originalEvent)
    e = e.originalEvent;
  if (e.type === "pointermove") {
    if (data.touchId !== null)
      return;
    const id = e.pointerId;
    if (id !== data.pointerId)
      return;
  }
  let targetTouch;
  if (e.type === "touchmove") {
    targetTouch = [...e.changedTouches].find((t) => t.identifier === data.touchId);
    if (!targetTouch || targetTouch.identifier !== data.touchId)
      return;
  } else {
    targetTouch = e;
  }
  if (!data.isTouched) {
    if (data.startMoving && data.isScrolling) {
      swiper.emit("touchMoveOpposite", e);
    }
    return;
  }
  const pageX = targetTouch.pageX;
  const pageY = targetTouch.pageY;
  if (e.preventedByNestedSwiper) {
    touches.startX = pageX;
    touches.startY = pageY;
    return;
  }
  if (!swiper.allowTouchMove) {
    if (!e.target.matches(data.focusableElements)) {
      swiper.allowClick = false;
    }
    if (data.isTouched) {
      Object.assign(touches, {
        startX: pageX,
        startY: pageY,
        currentX: pageX,
        currentY: pageY
      });
      data.touchStartTime = now();
    }
    return;
  }
  if (params.touchReleaseOnEdges && !params.loop) {
    if (swiper.isVertical()) {
      if (pageY < touches.startY && swiper.translate <= swiper.maxTranslate() || pageY > touches.startY && swiper.translate >= swiper.minTranslate()) {
        data.isTouched = false;
        data.isMoved = false;
        return;
      }
    } else if (pageX < touches.startX && swiper.translate <= swiper.maxTranslate() || pageX > touches.startX && swiper.translate >= swiper.minTranslate()) {
      return;
    }
  }
  if (document2.activeElement && document2.activeElement.matches(data.focusableElements) && document2.activeElement !== e.target && e.pointerType !== "mouse") {
    document2.activeElement.blur();
  }
  if (document2.activeElement) {
    if (e.target === document2.activeElement && e.target.matches(data.focusableElements)) {
      data.isMoved = true;
      swiper.allowClick = false;
      return;
    }
  }
  if (data.allowTouchCallbacks) {
    swiper.emit("touchMove", e);
  }
  touches.previousX = touches.currentX;
  touches.previousY = touches.currentY;
  touches.currentX = pageX;
  touches.currentY = pageY;
  const diffX = touches.currentX - touches.startX;
  const diffY = touches.currentY - touches.startY;
  if (swiper.params.threshold && Math.sqrt(diffX ** 2 + diffY ** 2) < swiper.params.threshold)
    return;
  if (typeof data.isScrolling === "undefined") {
    let touchAngle;
    if (swiper.isHorizontal() && touches.currentY === touches.startY || swiper.isVertical() && touches.currentX === touches.startX) {
      data.isScrolling = false;
    } else {
      if (diffX * diffX + diffY * diffY >= 25) {
        touchAngle = Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180 / Math.PI;
        data.isScrolling = swiper.isHorizontal() ? touchAngle > params.touchAngle : 90 - touchAngle > params.touchAngle;
      }
    }
  }
  if (data.isScrolling) {
    swiper.emit("touchMoveOpposite", e);
  }
  if (typeof data.startMoving === "undefined") {
    if (touches.currentX !== touches.startX || touches.currentY !== touches.startY) {
      data.startMoving = true;
    }
  }
  if (data.isScrolling || e.type === "touchmove" && data.preventTouchMoveFromPointerMove) {
    data.isTouched = false;
    return;
  }
  if (!data.startMoving) {
    return;
  }
  swiper.allowClick = false;
  if (!params.cssMode && e.cancelable) {
    e.preventDefault();
  }
  if (params.touchMoveStopPropagation && !params.nested) {
    e.stopPropagation();
  }
  let diff = swiper.isHorizontal() ? diffX : diffY;
  let touchesDiff = swiper.isHorizontal() ? touches.currentX - touches.previousX : touches.currentY - touches.previousY;
  if (params.oneWayMovement) {
    diff = Math.abs(diff) * (rtl ? 1 : -1);
    touchesDiff = Math.abs(touchesDiff) * (rtl ? 1 : -1);
  }
  touches.diff = diff;
  diff *= params.touchRatio;
  if (rtl) {
    diff = -diff;
    touchesDiff = -touchesDiff;
  }
  const prevTouchesDirection = swiper.touchesDirection;
  swiper.swipeDirection = diff > 0 ? "prev" : "next";
  swiper.touchesDirection = touchesDiff > 0 ? "prev" : "next";
  const isLoop = swiper.params.loop && !params.cssMode;
  const allowLoopFix = swiper.touchesDirection === "next" && swiper.allowSlideNext || swiper.touchesDirection === "prev" && swiper.allowSlidePrev;
  if (!data.isMoved) {
    if (isLoop && allowLoopFix) {
      swiper.loopFix({
        direction: swiper.swipeDirection
      });
    }
    data.startTranslate = swiper.getTranslate();
    swiper.setTransition(0);
    if (swiper.animating) {
      const evt = new window.CustomEvent("transitionend", {
        bubbles: true,
        cancelable: true,
        detail: {
          bySwiperTouchMove: true
        }
      });
      swiper.wrapperEl.dispatchEvent(evt);
    }
    data.allowMomentumBounce = false;
    if (params.grabCursor && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
      swiper.setGrabCursor(true);
    }
    swiper.emit("sliderFirstMove", e);
  }
  let loopFixed;
  (/* @__PURE__ */ new Date()).getTime();
  if (data.isMoved && data.allowThresholdMove && prevTouchesDirection !== swiper.touchesDirection && isLoop && allowLoopFix && Math.abs(diff) >= 1) {
    Object.assign(touches, {
      startX: pageX,
      startY: pageY,
      currentX: pageX,
      currentY: pageY,
      startTranslate: data.currentTranslate
    });
    data.loopSwapReset = true;
    data.startTranslate = data.currentTranslate;
    return;
  }
  swiper.emit("sliderMove", e);
  data.isMoved = true;
  data.currentTranslate = diff + data.startTranslate;
  let disableParentSwiper = true;
  let resistanceRatio = params.resistanceRatio;
  if (params.touchReleaseOnEdges) {
    resistanceRatio = 0;
  }
  if (diff > 0) {
    if (isLoop && allowLoopFix && !loopFixed && data.allowThresholdMove && data.currentTranslate > (params.centeredSlides ? swiper.minTranslate() - swiper.slidesSizesGrid[swiper.activeIndex + 1] - (params.slidesPerView !== "auto" && swiper.slides.length - params.slidesPerView >= 2 ? swiper.slidesSizesGrid[swiper.activeIndex + 1] + swiper.params.spaceBetween : 0) - swiper.params.spaceBetween : swiper.minTranslate())) {
      swiper.loopFix({
        direction: "prev",
        setTranslate: true,
        activeSlideIndex: 0
      });
    }
    if (data.currentTranslate > swiper.minTranslate()) {
      disableParentSwiper = false;
      if (params.resistance) {
        data.currentTranslate = swiper.minTranslate() - 1 + (-swiper.minTranslate() + data.startTranslate + diff) ** resistanceRatio;
      }
    }
  } else if (diff < 0) {
    if (isLoop && allowLoopFix && !loopFixed && data.allowThresholdMove && data.currentTranslate < (params.centeredSlides ? swiper.maxTranslate() + swiper.slidesSizesGrid[swiper.slidesSizesGrid.length - 1] + swiper.params.spaceBetween + (params.slidesPerView !== "auto" && swiper.slides.length - params.slidesPerView >= 2 ? swiper.slidesSizesGrid[swiper.slidesSizesGrid.length - 1] + swiper.params.spaceBetween : 0) : swiper.maxTranslate())) {
      swiper.loopFix({
        direction: "next",
        setTranslate: true,
        activeSlideIndex: swiper.slides.length - (params.slidesPerView === "auto" ? swiper.slidesPerViewDynamic() : Math.ceil(parseFloat(params.slidesPerView, 10)))
      });
    }
    if (data.currentTranslate < swiper.maxTranslate()) {
      disableParentSwiper = false;
      if (params.resistance) {
        data.currentTranslate = swiper.maxTranslate() + 1 - (swiper.maxTranslate() - data.startTranslate - diff) ** resistanceRatio;
      }
    }
  }
  if (disableParentSwiper) {
    e.preventedByNestedSwiper = true;
  }
  if (!swiper.allowSlideNext && swiper.swipeDirection === "next" && data.currentTranslate < data.startTranslate) {
    data.currentTranslate = data.startTranslate;
  }
  if (!swiper.allowSlidePrev && swiper.swipeDirection === "prev" && data.currentTranslate > data.startTranslate) {
    data.currentTranslate = data.startTranslate;
  }
  if (!swiper.allowSlidePrev && !swiper.allowSlideNext) {
    data.currentTranslate = data.startTranslate;
  }
  if (params.threshold > 0) {
    if (Math.abs(diff) > params.threshold || data.allowThresholdMove) {
      if (!data.allowThresholdMove) {
        data.allowThresholdMove = true;
        touches.startX = touches.currentX;
        touches.startY = touches.currentY;
        data.currentTranslate = data.startTranslate;
        touches.diff = swiper.isHorizontal() ? touches.currentX - touches.startX : touches.currentY - touches.startY;
        return;
      }
    } else {
      data.currentTranslate = data.startTranslate;
      return;
    }
  }
  if (!params.followFinger || params.cssMode)
    return;
  if (params.freeMode && params.freeMode.enabled && swiper.freeMode || params.watchSlidesProgress) {
    swiper.updateActiveIndex();
    swiper.updateSlidesClasses();
  }
  if (params.freeMode && params.freeMode.enabled && swiper.freeMode) {
    swiper.freeMode.onTouchMove();
  }
  swiper.updateProgress(data.currentTranslate);
  swiper.setTranslate(data.currentTranslate);
}
function onTouchEnd(event) {
  const swiper = this;
  const data = swiper.touchEventsData;
  let e = event;
  if (e.originalEvent)
    e = e.originalEvent;
  let targetTouch;
  const isTouchEvent = e.type === "touchend" || e.type === "touchcancel";
  if (!isTouchEvent) {
    if (data.touchId !== null)
      return;
    if (e.pointerId !== data.pointerId)
      return;
    targetTouch = e;
  } else {
    targetTouch = [...e.changedTouches].find((t) => t.identifier === data.touchId);
    if (!targetTouch || targetTouch.identifier !== data.touchId)
      return;
  }
  if (["pointercancel", "pointerout", "pointerleave", "contextmenu"].includes(e.type)) {
    const proceed = ["pointercancel", "contextmenu"].includes(e.type) && (swiper.browser.isSafari || swiper.browser.isWebView);
    if (!proceed) {
      return;
    }
  }
  data.pointerId = null;
  data.touchId = null;
  const {
    params,
    touches,
    rtlTranslate: rtl,
    slidesGrid,
    enabled
  } = swiper;
  if (!enabled)
    return;
  if (!params.simulateTouch && e.pointerType === "mouse")
    return;
  if (data.allowTouchCallbacks) {
    swiper.emit("touchEnd", e);
  }
  data.allowTouchCallbacks = false;
  if (!data.isTouched) {
    if (data.isMoved && params.grabCursor) {
      swiper.setGrabCursor(false);
    }
    data.isMoved = false;
    data.startMoving = false;
    return;
  }
  if (params.grabCursor && data.isMoved && data.isTouched && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
    swiper.setGrabCursor(false);
  }
  const touchEndTime = now();
  const timeDiff = touchEndTime - data.touchStartTime;
  if (swiper.allowClick) {
    const pathTree = e.path || e.composedPath && e.composedPath();
    swiper.updateClickedSlide(pathTree && pathTree[0] || e.target, pathTree);
    swiper.emit("tap click", e);
    if (timeDiff < 300 && touchEndTime - data.lastClickTime < 300) {
      swiper.emit("doubleTap doubleClick", e);
    }
  }
  data.lastClickTime = now();
  nextTick(() => {
    if (!swiper.destroyed)
      swiper.allowClick = true;
  });
  if (!data.isTouched || !data.isMoved || !swiper.swipeDirection || touches.diff === 0 && !data.loopSwapReset || data.currentTranslate === data.startTranslate && !data.loopSwapReset) {
    data.isTouched = false;
    data.isMoved = false;
    data.startMoving = false;
    return;
  }
  data.isTouched = false;
  data.isMoved = false;
  data.startMoving = false;
  let currentPos;
  if (params.followFinger) {
    currentPos = rtl ? swiper.translate : -swiper.translate;
  } else {
    currentPos = -data.currentTranslate;
  }
  if (params.cssMode) {
    return;
  }
  if (params.freeMode && params.freeMode.enabled) {
    swiper.freeMode.onTouchEnd({
      currentPos
    });
    return;
  }
  const swipeToLast = currentPos >= -swiper.maxTranslate() && !swiper.params.loop;
  let stopIndex = 0;
  let groupSize = swiper.slidesSizesGrid[0];
  for (let i = 0; i < slidesGrid.length; i += i < params.slidesPerGroupSkip ? 1 : params.slidesPerGroup) {
    const increment2 = i < params.slidesPerGroupSkip - 1 ? 1 : params.slidesPerGroup;
    if (typeof slidesGrid[i + increment2] !== "undefined") {
      if (swipeToLast || currentPos >= slidesGrid[i] && currentPos < slidesGrid[i + increment2]) {
        stopIndex = i;
        groupSize = slidesGrid[i + increment2] - slidesGrid[i];
      }
    } else if (swipeToLast || currentPos >= slidesGrid[i]) {
      stopIndex = i;
      groupSize = slidesGrid[slidesGrid.length - 1] - slidesGrid[slidesGrid.length - 2];
    }
  }
  let rewindFirstIndex = null;
  let rewindLastIndex = null;
  if (params.rewind) {
    if (swiper.isBeginning) {
      rewindLastIndex = params.virtual && params.virtual.enabled && swiper.virtual ? swiper.virtual.slides.length - 1 : swiper.slides.length - 1;
    } else if (swiper.isEnd) {
      rewindFirstIndex = 0;
    }
  }
  const ratio = (currentPos - slidesGrid[stopIndex]) / groupSize;
  const increment = stopIndex < params.slidesPerGroupSkip - 1 ? 1 : params.slidesPerGroup;
  if (timeDiff > params.longSwipesMs) {
    if (!params.longSwipes) {
      swiper.slideTo(swiper.activeIndex);
      return;
    }
    if (swiper.swipeDirection === "next") {
      if (ratio >= params.longSwipesRatio)
        swiper.slideTo(params.rewind && swiper.isEnd ? rewindFirstIndex : stopIndex + increment);
      else
        swiper.slideTo(stopIndex);
    }
    if (swiper.swipeDirection === "prev") {
      if (ratio > 1 - params.longSwipesRatio) {
        swiper.slideTo(stopIndex + increment);
      } else if (rewindLastIndex !== null && ratio < 0 && Math.abs(ratio) > params.longSwipesRatio) {
        swiper.slideTo(rewindLastIndex);
      } else {
        swiper.slideTo(stopIndex);
      }
    }
  } else {
    if (!params.shortSwipes) {
      swiper.slideTo(swiper.activeIndex);
      return;
    }
    const isNavButtonTarget = swiper.navigation && (e.target === swiper.navigation.nextEl || e.target === swiper.navigation.prevEl);
    if (!isNavButtonTarget) {
      if (swiper.swipeDirection === "next") {
        swiper.slideTo(rewindFirstIndex !== null ? rewindFirstIndex : stopIndex + increment);
      }
      if (swiper.swipeDirection === "prev") {
        swiper.slideTo(rewindLastIndex !== null ? rewindLastIndex : stopIndex);
      }
    } else if (e.target === swiper.navigation.nextEl) {
      swiper.slideTo(stopIndex + increment);
    } else {
      swiper.slideTo(stopIndex);
    }
  }
}
function onResize() {
  const swiper = this;
  const {
    params,
    el
  } = swiper;
  if (el && el.offsetWidth === 0)
    return;
  if (params.breakpoints) {
    swiper.setBreakpoint();
  }
  const {
    allowSlideNext,
    allowSlidePrev,
    snapGrid
  } = swiper;
  const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
  swiper.allowSlideNext = true;
  swiper.allowSlidePrev = true;
  swiper.updateSize();
  swiper.updateSlides();
  swiper.updateSlidesClasses();
  const isVirtualLoop = isVirtual && params.loop;
  if ((params.slidesPerView === "auto" || params.slidesPerView > 1) && swiper.isEnd && !swiper.isBeginning && !swiper.params.centeredSlides && !isVirtualLoop) {
    swiper.slideTo(swiper.slides.length - 1, 0, false, true);
  } else {
    if (swiper.params.loop && !isVirtual) {
      swiper.slideToLoop(swiper.realIndex, 0, false, true);
    } else {
      swiper.slideTo(swiper.activeIndex, 0, false, true);
    }
  }
  if (swiper.autoplay && swiper.autoplay.running && swiper.autoplay.paused) {
    clearTimeout(swiper.autoplay.resizeTimeout);
    swiper.autoplay.resizeTimeout = setTimeout(() => {
      if (swiper.autoplay && swiper.autoplay.running && swiper.autoplay.paused) {
        swiper.autoplay.resume();
      }
    }, 500);
  }
  swiper.allowSlidePrev = allowSlidePrev;
  swiper.allowSlideNext = allowSlideNext;
  if (swiper.params.watchOverflow && snapGrid !== swiper.snapGrid) {
    swiper.checkOverflow();
  }
}
function onClick(e) {
  const swiper = this;
  if (!swiper.enabled)
    return;
  if (!swiper.allowClick) {
    if (swiper.params.preventClicks)
      e.preventDefault();
    if (swiper.params.preventClicksPropagation && swiper.animating) {
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }
}
function onScroll() {
  const swiper = this;
  const {
    wrapperEl,
    rtlTranslate,
    enabled
  } = swiper;
  if (!enabled)
    return;
  swiper.previousTranslate = swiper.translate;
  if (swiper.isHorizontal()) {
    swiper.translate = -wrapperEl.scrollLeft;
  } else {
    swiper.translate = -wrapperEl.scrollTop;
  }
  if (swiper.translate === 0)
    swiper.translate = 0;
  swiper.updateActiveIndex();
  swiper.updateSlidesClasses();
  let newProgress;
  const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
  if (translatesDiff === 0) {
    newProgress = 0;
  } else {
    newProgress = (swiper.translate - swiper.minTranslate()) / translatesDiff;
  }
  if (newProgress !== swiper.progress) {
    swiper.updateProgress(rtlTranslate ? -swiper.translate : swiper.translate);
  }
  swiper.emit("setTranslate", swiper.translate, false);
}
function onLoad(e) {
  const swiper = this;
  processLazyPreloader(swiper, e.target);
  if (swiper.params.cssMode || swiper.params.slidesPerView !== "auto" && !swiper.params.autoHeight) {
    return;
  }
  swiper.update();
}
function onDocumentTouchStart() {
  const swiper = this;
  if (swiper.documentTouchHandlerProceeded)
    return;
  swiper.documentTouchHandlerProceeded = true;
  if (swiper.params.touchReleaseOnEdges) {
    swiper.el.style.touchAction = "auto";
  }
}
const events = (swiper, method) => {
  const document2 = getDocument();
  const {
    params,
    el,
    wrapperEl,
    device
  } = swiper;
  const capture = !!params.nested;
  const domMethod = method === "on" ? "addEventListener" : "removeEventListener";
  const swiperMethod = method;
  if (!el || typeof el === "string")
    return;
  document2[domMethod]("touchstart", swiper.onDocumentTouchStart, {
    passive: false,
    capture
  });
  el[domMethod]("touchstart", swiper.onTouchStart, {
    passive: false
  });
  el[domMethod]("pointerdown", swiper.onTouchStart, {
    passive: false
  });
  document2[domMethod]("touchmove", swiper.onTouchMove, {
    passive: false,
    capture
  });
  document2[domMethod]("pointermove", swiper.onTouchMove, {
    passive: false,
    capture
  });
  document2[domMethod]("touchend", swiper.onTouchEnd, {
    passive: true
  });
  document2[domMethod]("pointerup", swiper.onTouchEnd, {
    passive: true
  });
  document2[domMethod]("pointercancel", swiper.onTouchEnd, {
    passive: true
  });
  document2[domMethod]("touchcancel", swiper.onTouchEnd, {
    passive: true
  });
  document2[domMethod]("pointerout", swiper.onTouchEnd, {
    passive: true
  });
  document2[domMethod]("pointerleave", swiper.onTouchEnd, {
    passive: true
  });
  document2[domMethod]("contextmenu", swiper.onTouchEnd, {
    passive: true
  });
  if (params.preventClicks || params.preventClicksPropagation) {
    el[domMethod]("click", swiper.onClick, true);
  }
  if (params.cssMode) {
    wrapperEl[domMethod]("scroll", swiper.onScroll);
  }
  if (params.updateOnWindowResize) {
    swiper[swiperMethod](device.ios || device.android ? "resize orientationchange observerUpdate" : "resize observerUpdate", onResize, true);
  } else {
    swiper[swiperMethod]("observerUpdate", onResize, true);
  }
  el[domMethod]("load", swiper.onLoad, {
    capture: true
  });
};
function attachEvents() {
  const swiper = this;
  const {
    params
  } = swiper;
  swiper.onTouchStart = onTouchStart.bind(swiper);
  swiper.onTouchMove = onTouchMove.bind(swiper);
  swiper.onTouchEnd = onTouchEnd.bind(swiper);
  swiper.onDocumentTouchStart = onDocumentTouchStart.bind(swiper);
  if (params.cssMode) {
    swiper.onScroll = onScroll.bind(swiper);
  }
  swiper.onClick = onClick.bind(swiper);
  swiper.onLoad = onLoad.bind(swiper);
  events(swiper, "on");
}
function detachEvents() {
  const swiper = this;
  events(swiper, "off");
}
var events$1 = {
  attachEvents,
  detachEvents
};
const isGridEnabled = (swiper, params) => {
  return swiper.grid && params.grid && params.grid.rows > 1;
};
function setBreakpoint() {
  const swiper = this;
  const {
    realIndex,
    initialized,
    params,
    el
  } = swiper;
  const breakpoints2 = params.breakpoints;
  if (!breakpoints2 || breakpoints2 && Object.keys(breakpoints2).length === 0)
    return;
  const document2 = getDocument();
  const breakpointsBase = params.breakpointsBase === "window" || !params.breakpointsBase ? params.breakpointsBase : "container";
  const breakpointContainer = ["window", "container"].includes(params.breakpointsBase) || !params.breakpointsBase ? swiper.el : document2.querySelector(params.breakpointsBase);
  const breakpoint = swiper.getBreakpoint(breakpoints2, breakpointsBase, breakpointContainer);
  if (!breakpoint || swiper.currentBreakpoint === breakpoint)
    return;
  const breakpointOnlyParams = breakpoint in breakpoints2 ? breakpoints2[breakpoint] : void 0;
  const breakpointParams = breakpointOnlyParams || swiper.originalParams;
  const wasMultiRow = isGridEnabled(swiper, params);
  const isMultiRow = isGridEnabled(swiper, breakpointParams);
  const wasGrabCursor = swiper.params.grabCursor;
  const isGrabCursor = breakpointParams.grabCursor;
  const wasEnabled = params.enabled;
  if (wasMultiRow && !isMultiRow) {
    el.classList.remove(`${params.containerModifierClass}grid`, `${params.containerModifierClass}grid-column`);
    swiper.emitContainerClasses();
  } else if (!wasMultiRow && isMultiRow) {
    el.classList.add(`${params.containerModifierClass}grid`);
    if (breakpointParams.grid.fill && breakpointParams.grid.fill === "column" || !breakpointParams.grid.fill && params.grid.fill === "column") {
      el.classList.add(`${params.containerModifierClass}grid-column`);
    }
    swiper.emitContainerClasses();
  }
  if (wasGrabCursor && !isGrabCursor) {
    swiper.unsetGrabCursor();
  } else if (!wasGrabCursor && isGrabCursor) {
    swiper.setGrabCursor();
  }
  ["navigation", "pagination", "scrollbar"].forEach((prop) => {
    if (typeof breakpointParams[prop] === "undefined")
      return;
    const wasModuleEnabled = params[prop] && params[prop].enabled;
    const isModuleEnabled = breakpointParams[prop] && breakpointParams[prop].enabled;
    if (wasModuleEnabled && !isModuleEnabled) {
      swiper[prop].disable();
    }
    if (!wasModuleEnabled && isModuleEnabled) {
      swiper[prop].enable();
    }
  });
  const directionChanged = breakpointParams.direction && breakpointParams.direction !== params.direction;
  const needsReLoop = params.loop && (breakpointParams.slidesPerView !== params.slidesPerView || directionChanged);
  const wasLoop = params.loop;
  if (directionChanged && initialized) {
    swiper.changeDirection();
  }
  extend(swiper.params, breakpointParams);
  const isEnabled = swiper.params.enabled;
  const hasLoop = swiper.params.loop;
  Object.assign(swiper, {
    allowTouchMove: swiper.params.allowTouchMove,
    allowSlideNext: swiper.params.allowSlideNext,
    allowSlidePrev: swiper.params.allowSlidePrev
  });
  if (wasEnabled && !isEnabled) {
    swiper.disable();
  } else if (!wasEnabled && isEnabled) {
    swiper.enable();
  }
  swiper.currentBreakpoint = breakpoint;
  swiper.emit("_beforeBreakpoint", breakpointParams);
  if (initialized) {
    if (needsReLoop) {
      swiper.loopDestroy();
      swiper.loopCreate(realIndex);
      swiper.updateSlides();
    } else if (!wasLoop && hasLoop) {
      swiper.loopCreate(realIndex);
      swiper.updateSlides();
    } else if (wasLoop && !hasLoop) {
      swiper.loopDestroy();
    }
  }
  swiper.emit("breakpoint", breakpointParams);
}
function getBreakpoint(breakpoints2, base, containerEl) {
  if (base === void 0) {
    base = "window";
  }
  if (!breakpoints2 || base === "container" && !containerEl)
    return void 0;
  let breakpoint = false;
  const window2 = getWindow();
  const currentHeight = base === "window" ? window2.innerHeight : containerEl.clientHeight;
  const points = Object.keys(breakpoints2).map((point) => {
    if (typeof point === "string" && point.indexOf("@") === 0) {
      const minRatio = parseFloat(point.substr(1));
      const value = currentHeight * minRatio;
      return {
        value,
        point
      };
    }
    return {
      value: point,
      point
    };
  });
  points.sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));
  for (let i = 0; i < points.length; i += 1) {
    const {
      point,
      value
    } = points[i];
    if (base === "window") {
      if (window2.matchMedia(`(min-width: ${value}px)`).matches) {
        breakpoint = point;
      }
    } else if (value <= containerEl.clientWidth) {
      breakpoint = point;
    }
  }
  return breakpoint || "max";
}
var breakpoints = {
  setBreakpoint,
  getBreakpoint
};
function prepareClasses(entries, prefix) {
  const resultClasses = [];
  entries.forEach((item) => {
    if (typeof item === "object") {
      Object.keys(item).forEach((classNames) => {
        if (item[classNames]) {
          resultClasses.push(prefix + classNames);
        }
      });
    } else if (typeof item === "string") {
      resultClasses.push(prefix + item);
    }
  });
  return resultClasses;
}
function addClasses() {
  const swiper = this;
  const {
    classNames,
    params,
    rtl,
    el,
    device
  } = swiper;
  const suffixes = prepareClasses(["initialized", params.direction, {
    "free-mode": swiper.params.freeMode && params.freeMode.enabled
  }, {
    "autoheight": params.autoHeight
  }, {
    "rtl": rtl
  }, {
    "grid": params.grid && params.grid.rows > 1
  }, {
    "grid-column": params.grid && params.grid.rows > 1 && params.grid.fill === "column"
  }, {
    "android": device.android
  }, {
    "ios": device.ios
  }, {
    "css-mode": params.cssMode
  }, {
    "centered": params.cssMode && params.centeredSlides
  }, {
    "watch-progress": params.watchSlidesProgress
  }], params.containerModifierClass);
  classNames.push(...suffixes);
  el.classList.add(...classNames);
  swiper.emitContainerClasses();
}
function removeClasses() {
  const swiper = this;
  const {
    el,
    classNames
  } = swiper;
  if (!el || typeof el === "string")
    return;
  el.classList.remove(...classNames);
  swiper.emitContainerClasses();
}
var classes = {
  addClasses,
  removeClasses
};
function checkOverflow() {
  const swiper = this;
  const {
    isLocked: wasLocked,
    params
  } = swiper;
  const {
    slidesOffsetBefore
  } = params;
  if (slidesOffsetBefore) {
    const lastSlideIndex = swiper.slides.length - 1;
    const lastSlideRightEdge = swiper.slidesGrid[lastSlideIndex] + swiper.slidesSizesGrid[lastSlideIndex] + slidesOffsetBefore * 2;
    swiper.isLocked = swiper.size > lastSlideRightEdge;
  } else {
    swiper.isLocked = swiper.snapGrid.length === 1;
  }
  if (params.allowSlideNext === true) {
    swiper.allowSlideNext = !swiper.isLocked;
  }
  if (params.allowSlidePrev === true) {
    swiper.allowSlidePrev = !swiper.isLocked;
  }
  if (wasLocked && wasLocked !== swiper.isLocked) {
    swiper.isEnd = false;
  }
  if (wasLocked !== swiper.isLocked) {
    swiper.emit(swiper.isLocked ? "lock" : "unlock");
  }
}
var checkOverflow$1 = {
  checkOverflow
};
var defaults = {
  init: true,
  direction: "horizontal",
  oneWayMovement: false,
  swiperElementNodeName: "SWIPER-CONTAINER",
  touchEventsTarget: "wrapper",
  initialSlide: 0,
  speed: 300,
  cssMode: false,
  updateOnWindowResize: true,
  resizeObserver: true,
  nested: false,
  createElements: false,
  eventsPrefix: "swiper",
  enabled: true,
  focusableElements: "input, select, option, textarea, button, video, label",
  // Overrides
  width: null,
  height: null,
  //
  preventInteractionOnTransition: false,
  // ssr
  userAgent: null,
  url: null,
  // To support iOS's swipe-to-go-back gesture (when being used in-app).
  edgeSwipeDetection: false,
  edgeSwipeThreshold: 20,
  // Autoheight
  autoHeight: false,
  // Set wrapper width
  setWrapperSize: false,
  // Virtual Translate
  virtualTranslate: false,
  // Effects
  effect: "slide",
  // 'slide' or 'fade' or 'cube' or 'coverflow' or 'flip'
  // Breakpoints
  breakpoints: void 0,
  breakpointsBase: "window",
  // Slides grid
  spaceBetween: 0,
  slidesPerView: 1,
  slidesPerGroup: 1,
  slidesPerGroupSkip: 0,
  slidesPerGroupAuto: false,
  centeredSlides: false,
  centeredSlidesBounds: false,
  slidesOffsetBefore: 0,
  // in px
  slidesOffsetAfter: 0,
  // in px
  normalizeSlideIndex: true,
  centerInsufficientSlides: false,
  // Disable swiper and hide navigation when container not overflow
  watchOverflow: true,
  // Round length
  roundLengths: false,
  // Touches
  touchRatio: 1,
  touchAngle: 45,
  simulateTouch: true,
  shortSwipes: true,
  longSwipes: true,
  longSwipesRatio: 0.5,
  longSwipesMs: 300,
  followFinger: true,
  allowTouchMove: true,
  threshold: 5,
  touchMoveStopPropagation: false,
  touchStartPreventDefault: true,
  touchStartForcePreventDefault: false,
  touchReleaseOnEdges: false,
  // Unique Navigation Elements
  uniqueNavElements: true,
  // Resistance
  resistance: true,
  resistanceRatio: 0.85,
  // Progress
  watchSlidesProgress: false,
  // Cursor
  grabCursor: false,
  // Clicks
  preventClicks: true,
  preventClicksPropagation: true,
  slideToClickedSlide: false,
  // loop
  loop: false,
  loopAddBlankSlides: true,
  loopAdditionalSlides: 0,
  loopPreventsSliding: true,
  // rewind
  rewind: false,
  // Swiping/no swiping
  allowSlidePrev: true,
  allowSlideNext: true,
  swipeHandler: null,
  // '.swipe-handler',
  noSwiping: true,
  noSwipingClass: "swiper-no-swiping",
  noSwipingSelector: null,
  // Passive Listeners
  passiveListeners: true,
  maxBackfaceHiddenSlides: 10,
  // NS
  containerModifierClass: "swiper-",
  // NEW
  slideClass: "swiper-slide",
  slideBlankClass: "swiper-slide-blank",
  slideActiveClass: "swiper-slide-active",
  slideVisibleClass: "swiper-slide-visible",
  slideFullyVisibleClass: "swiper-slide-fully-visible",
  slideNextClass: "swiper-slide-next",
  slidePrevClass: "swiper-slide-prev",
  wrapperClass: "swiper-wrapper",
  lazyPreloaderClass: "swiper-lazy-preloader",
  lazyPreloadPrevNext: 0,
  // Callbacks
  runCallbacksOnInit: true,
  // Internals
  _emitClasses: false
};
function moduleExtendParams(params, allModulesParams) {
  return function extendParams(obj) {
    if (obj === void 0) {
      obj = {};
    }
    const moduleParamName = Object.keys(obj)[0];
    const moduleParams = obj[moduleParamName];
    if (typeof moduleParams !== "object" || moduleParams === null) {
      extend(allModulesParams, obj);
      return;
    }
    if (params[moduleParamName] === true) {
      params[moduleParamName] = {
        enabled: true
      };
    }
    if (moduleParamName === "navigation" && params[moduleParamName] && params[moduleParamName].enabled && !params[moduleParamName].prevEl && !params[moduleParamName].nextEl) {
      params[moduleParamName].auto = true;
    }
    if (["pagination", "scrollbar"].indexOf(moduleParamName) >= 0 && params[moduleParamName] && params[moduleParamName].enabled && !params[moduleParamName].el) {
      params[moduleParamName].auto = true;
    }
    if (!(moduleParamName in params && "enabled" in moduleParams)) {
      extend(allModulesParams, obj);
      return;
    }
    if (typeof params[moduleParamName] === "object" && !("enabled" in params[moduleParamName])) {
      params[moduleParamName].enabled = true;
    }
    if (!params[moduleParamName])
      params[moduleParamName] = {
        enabled: false
      };
    extend(allModulesParams, obj);
  };
}
const prototypes = {
  eventsEmitter,
  update,
  translate,
  transition,
  slide,
  loop,
  grabCursor,
  events: events$1,
  breakpoints,
  checkOverflow: checkOverflow$1,
  classes
};
const extendedDefaults = {};
class Swiper {
  constructor() {
    let el;
    let params;
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    if (args.length === 1 && args[0].constructor && Object.prototype.toString.call(args[0]).slice(8, -1) === "Object") {
      params = args[0];
    } else {
      [el, params] = args;
    }
    if (!params)
      params = {};
    params = extend({}, params);
    if (el && !params.el)
      params.el = el;
    const document2 = getDocument();
    if (params.el && typeof params.el === "string" && document2.querySelectorAll(params.el).length > 1) {
      const swipers = [];
      document2.querySelectorAll(params.el).forEach((containerEl) => {
        const newParams = extend({}, params, {
          el: containerEl
        });
        swipers.push(new Swiper(newParams));
      });
      return swipers;
    }
    const swiper = this;
    swiper.__swiper__ = true;
    swiper.support = getSupport();
    swiper.device = getDevice({
      userAgent: params.userAgent
    });
    swiper.browser = getBrowser();
    swiper.eventsListeners = {};
    swiper.eventsAnyListeners = [];
    swiper.modules = [...swiper.__modules__];
    if (params.modules && Array.isArray(params.modules)) {
      swiper.modules.push(...params.modules);
    }
    const allModulesParams = {};
    swiper.modules.forEach((mod) => {
      mod({
        params,
        swiper,
        extendParams: moduleExtendParams(params, allModulesParams),
        on: swiper.on.bind(swiper),
        once: swiper.once.bind(swiper),
        off: swiper.off.bind(swiper),
        emit: swiper.emit.bind(swiper)
      });
    });
    const swiperParams = extend({}, defaults, allModulesParams);
    swiper.params = extend({}, swiperParams, extendedDefaults, params);
    swiper.originalParams = extend({}, swiper.params);
    swiper.passedParams = extend({}, params);
    if (swiper.params && swiper.params.on) {
      Object.keys(swiper.params.on).forEach((eventName) => {
        swiper.on(eventName, swiper.params.on[eventName]);
      });
    }
    if (swiper.params && swiper.params.onAny) {
      swiper.onAny(swiper.params.onAny);
    }
    Object.assign(swiper, {
      enabled: swiper.params.enabled,
      el,
      // Classes
      classNames: [],
      // Slides
      slides: [],
      slidesGrid: [],
      snapGrid: [],
      slidesSizesGrid: [],
      // isDirection
      isHorizontal() {
        return swiper.params.direction === "horizontal";
      },
      isVertical() {
        return swiper.params.direction === "vertical";
      },
      // Indexes
      activeIndex: 0,
      realIndex: 0,
      //
      isBeginning: true,
      isEnd: false,
      // Props
      translate: 0,
      previousTranslate: 0,
      progress: 0,
      velocity: 0,
      animating: false,
      cssOverflowAdjustment() {
        return Math.trunc(this.translate / 2 ** 23) * 2 ** 23;
      },
      // Locks
      allowSlideNext: swiper.params.allowSlideNext,
      allowSlidePrev: swiper.params.allowSlidePrev,
      // Touch Events
      touchEventsData: {
        isTouched: void 0,
        isMoved: void 0,
        allowTouchCallbacks: void 0,
        touchStartTime: void 0,
        isScrolling: void 0,
        currentTranslate: void 0,
        startTranslate: void 0,
        allowThresholdMove: void 0,
        // Form elements to match
        focusableElements: swiper.params.focusableElements,
        // Last click time
        lastClickTime: 0,
        clickTimeout: void 0,
        // Velocities
        velocities: [],
        allowMomentumBounce: void 0,
        startMoving: void 0,
        pointerId: null,
        touchId: null
      },
      // Clicks
      allowClick: true,
      // Touches
      allowTouchMove: swiper.params.allowTouchMove,
      touches: {
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        diff: 0
      },
      // Images
      imagesToLoad: [],
      imagesLoaded: 0
    });
    swiper.emit("_swiper");
    if (swiper.params.init) {
      swiper.init();
    }
    return swiper;
  }
  getDirectionLabel(property) {
    if (this.isHorizontal()) {
      return property;
    }
    return {
      "width": "height",
      "margin-top": "margin-left",
      "margin-bottom ": "margin-right",
      "margin-left": "margin-top",
      "margin-right": "margin-bottom",
      "padding-left": "padding-top",
      "padding-right": "padding-bottom",
      "marginRight": "marginBottom"
    }[property];
  }
  getSlideIndex(slideEl) {
    const {
      slidesEl,
      params
    } = this;
    const slides = elementChildren(slidesEl, `.${params.slideClass}, swiper-slide`);
    const firstSlideIndex = elementIndex(slides[0]);
    return elementIndex(slideEl) - firstSlideIndex;
  }
  getSlideIndexByData(index) {
    return this.getSlideIndex(this.slides.find((slideEl) => slideEl.getAttribute("data-swiper-slide-index") * 1 === index));
  }
  recalcSlides() {
    const swiper = this;
    const {
      slidesEl,
      params
    } = swiper;
    swiper.slides = elementChildren(slidesEl, `.${params.slideClass}, swiper-slide`);
  }
  enable() {
    const swiper = this;
    if (swiper.enabled)
      return;
    swiper.enabled = true;
    if (swiper.params.grabCursor) {
      swiper.setGrabCursor();
    }
    swiper.emit("enable");
  }
  disable() {
    const swiper = this;
    if (!swiper.enabled)
      return;
    swiper.enabled = false;
    if (swiper.params.grabCursor) {
      swiper.unsetGrabCursor();
    }
    swiper.emit("disable");
  }
  setProgress(progress, speed) {
    const swiper = this;
    progress = Math.min(Math.max(progress, 0), 1);
    const min = swiper.minTranslate();
    const max = swiper.maxTranslate();
    const current = (max - min) * progress + min;
    swiper.translateTo(current, typeof speed === "undefined" ? 0 : speed);
    swiper.updateActiveIndex();
    swiper.updateSlidesClasses();
  }
  emitContainerClasses() {
    const swiper = this;
    if (!swiper.params._emitClasses || !swiper.el)
      return;
    const cls = swiper.el.className.split(" ").filter((className) => {
      return className.indexOf("swiper") === 0 || className.indexOf(swiper.params.containerModifierClass) === 0;
    });
    swiper.emit("_containerClasses", cls.join(" "));
  }
  getSlideClasses(slideEl) {
    const swiper = this;
    if (swiper.destroyed)
      return "";
    return slideEl.className.split(" ").filter((className) => {
      return className.indexOf("swiper-slide") === 0 || className.indexOf(swiper.params.slideClass) === 0;
    }).join(" ");
  }
  emitSlidesClasses() {
    const swiper = this;
    if (!swiper.params._emitClasses || !swiper.el)
      return;
    const updates = [];
    swiper.slides.forEach((slideEl) => {
      const classNames = swiper.getSlideClasses(slideEl);
      updates.push({
        slideEl,
        classNames
      });
      swiper.emit("_slideClass", slideEl, classNames);
    });
    swiper.emit("_slideClasses", updates);
  }
  slidesPerViewDynamic(view, exact) {
    if (view === void 0) {
      view = "current";
    }
    if (exact === void 0) {
      exact = false;
    }
    const swiper = this;
    const {
      params,
      slides,
      slidesGrid,
      slidesSizesGrid,
      size: swiperSize,
      activeIndex
    } = swiper;
    let spv = 1;
    if (typeof params.slidesPerView === "number")
      return params.slidesPerView;
    if (params.centeredSlides) {
      let slideSize = slides[activeIndex] ? Math.ceil(slides[activeIndex].swiperSlideSize) : 0;
      let breakLoop;
      for (let i = activeIndex + 1; i < slides.length; i += 1) {
        if (slides[i] && !breakLoop) {
          slideSize += Math.ceil(slides[i].swiperSlideSize);
          spv += 1;
          if (slideSize > swiperSize)
            breakLoop = true;
        }
      }
      for (let i = activeIndex - 1; i >= 0; i -= 1) {
        if (slides[i] && !breakLoop) {
          slideSize += slides[i].swiperSlideSize;
          spv += 1;
          if (slideSize > swiperSize)
            breakLoop = true;
        }
      }
    } else {
      if (view === "current") {
        for (let i = activeIndex + 1; i < slides.length; i += 1) {
          const slideInView = exact ? slidesGrid[i] + slidesSizesGrid[i] - slidesGrid[activeIndex] < swiperSize : slidesGrid[i] - slidesGrid[activeIndex] < swiperSize;
          if (slideInView) {
            spv += 1;
          }
        }
      } else {
        for (let i = activeIndex - 1; i >= 0; i -= 1) {
          const slideInView = slidesGrid[activeIndex] - slidesGrid[i] < swiperSize;
          if (slideInView) {
            spv += 1;
          }
        }
      }
    }
    return spv;
  }
  update() {
    const swiper = this;
    if (!swiper || swiper.destroyed)
      return;
    const {
      snapGrid,
      params
    } = swiper;
    if (params.breakpoints) {
      swiper.setBreakpoint();
    }
    [...swiper.el.querySelectorAll('[loading="lazy"]')].forEach((imageEl) => {
      if (imageEl.complete) {
        processLazyPreloader(swiper, imageEl);
      }
    });
    swiper.updateSize();
    swiper.updateSlides();
    swiper.updateProgress();
    swiper.updateSlidesClasses();
    function setTranslate2() {
      const translateValue = swiper.rtlTranslate ? swiper.translate * -1 : swiper.translate;
      const newTranslate = Math.min(Math.max(translateValue, swiper.maxTranslate()), swiper.minTranslate());
      swiper.setTranslate(newTranslate);
      swiper.updateActiveIndex();
      swiper.updateSlidesClasses();
    }
    let translated;
    if (params.freeMode && params.freeMode.enabled && !params.cssMode) {
      setTranslate2();
      if (params.autoHeight) {
        swiper.updateAutoHeight();
      }
    } else {
      if ((params.slidesPerView === "auto" || params.slidesPerView > 1) && swiper.isEnd && !params.centeredSlides) {
        const slides = swiper.virtual && params.virtual.enabled ? swiper.virtual.slides : swiper.slides;
        translated = swiper.slideTo(slides.length - 1, 0, false, true);
      } else {
        translated = swiper.slideTo(swiper.activeIndex, 0, false, true);
      }
      if (!translated) {
        setTranslate2();
      }
    }
    if (params.watchOverflow && snapGrid !== swiper.snapGrid) {
      swiper.checkOverflow();
    }
    swiper.emit("update");
  }
  changeDirection(newDirection, needUpdate) {
    if (needUpdate === void 0) {
      needUpdate = true;
    }
    const swiper = this;
    const currentDirection = swiper.params.direction;
    if (!newDirection) {
      newDirection = currentDirection === "horizontal" ? "vertical" : "horizontal";
    }
    if (newDirection === currentDirection || newDirection !== "horizontal" && newDirection !== "vertical") {
      return swiper;
    }
    swiper.el.classList.remove(`${swiper.params.containerModifierClass}${currentDirection}`);
    swiper.el.classList.add(`${swiper.params.containerModifierClass}${newDirection}`);
    swiper.emitContainerClasses();
    swiper.params.direction = newDirection;
    swiper.slides.forEach((slideEl) => {
      if (newDirection === "vertical") {
        slideEl.style.width = "";
      } else {
        slideEl.style.height = "";
      }
    });
    swiper.emit("changeDirection");
    if (needUpdate)
      swiper.update();
    return swiper;
  }
  changeLanguageDirection(direction) {
    const swiper = this;
    if (swiper.rtl && direction === "rtl" || !swiper.rtl && direction === "ltr")
      return;
    swiper.rtl = direction === "rtl";
    swiper.rtlTranslate = swiper.params.direction === "horizontal" && swiper.rtl;
    if (swiper.rtl) {
      swiper.el.classList.add(`${swiper.params.containerModifierClass}rtl`);
      swiper.el.dir = "rtl";
    } else {
      swiper.el.classList.remove(`${swiper.params.containerModifierClass}rtl`);
      swiper.el.dir = "ltr";
    }
    swiper.update();
  }
  mount(element) {
    const swiper = this;
    if (swiper.mounted)
      return true;
    let el = element || swiper.params.el;
    if (typeof el === "string") {
      el = document.querySelector(el);
    }
    if (!el) {
      return false;
    }
    el.swiper = swiper;
    if (el.parentNode && el.parentNode.host && el.parentNode.host.nodeName === swiper.params.swiperElementNodeName.toUpperCase()) {
      swiper.isElement = true;
    }
    const getWrapperSelector = () => {
      return `.${(swiper.params.wrapperClass || "").trim().split(" ").join(".")}`;
    };
    const getWrapper = () => {
      if (el && el.shadowRoot && el.shadowRoot.querySelector) {
        const res = el.shadowRoot.querySelector(getWrapperSelector());
        return res;
      }
      return elementChildren(el, getWrapperSelector())[0];
    };
    let wrapperEl = getWrapper();
    if (!wrapperEl && swiper.params.createElements) {
      wrapperEl = createElement("div", swiper.params.wrapperClass);
      el.append(wrapperEl);
      elementChildren(el, `.${swiper.params.slideClass}`).forEach((slideEl) => {
        wrapperEl.append(slideEl);
      });
    }
    Object.assign(swiper, {
      el,
      wrapperEl,
      slidesEl: swiper.isElement && !el.parentNode.host.slideSlots ? el.parentNode.host : wrapperEl,
      hostEl: swiper.isElement ? el.parentNode.host : el,
      mounted: true,
      // RTL
      rtl: el.dir.toLowerCase() === "rtl" || elementStyle(el, "direction") === "rtl",
      rtlTranslate: swiper.params.direction === "horizontal" && (el.dir.toLowerCase() === "rtl" || elementStyle(el, "direction") === "rtl"),
      wrongRTL: elementStyle(wrapperEl, "display") === "-webkit-box"
    });
    return true;
  }
  init(el) {
    const swiper = this;
    if (swiper.initialized)
      return swiper;
    const mounted = swiper.mount(el);
    if (mounted === false)
      return swiper;
    swiper.emit("beforeInit");
    if (swiper.params.breakpoints) {
      swiper.setBreakpoint();
    }
    swiper.addClasses();
    swiper.updateSize();
    swiper.updateSlides();
    if (swiper.params.watchOverflow) {
      swiper.checkOverflow();
    }
    if (swiper.params.grabCursor && swiper.enabled) {
      swiper.setGrabCursor();
    }
    if (swiper.params.loop && swiper.virtual && swiper.params.virtual.enabled) {
      swiper.slideTo(swiper.params.initialSlide + swiper.virtual.slidesBefore, 0, swiper.params.runCallbacksOnInit, false, true);
    } else {
      swiper.slideTo(swiper.params.initialSlide, 0, swiper.params.runCallbacksOnInit, false, true);
    }
    if (swiper.params.loop) {
      swiper.loopCreate();
    }
    swiper.attachEvents();
    const lazyElements = [...swiper.el.querySelectorAll('[loading="lazy"]')];
    if (swiper.isElement) {
      lazyElements.push(...swiper.hostEl.querySelectorAll('[loading="lazy"]'));
    }
    lazyElements.forEach((imageEl) => {
      if (imageEl.complete) {
        processLazyPreloader(swiper, imageEl);
      } else {
        imageEl.addEventListener("load", (e) => {
          processLazyPreloader(swiper, e.target);
        });
      }
    });
    preload(swiper);
    swiper.initialized = true;
    preload(swiper);
    swiper.emit("init");
    swiper.emit("afterInit");
    return swiper;
  }
  destroy(deleteInstance, cleanStyles) {
    if (deleteInstance === void 0) {
      deleteInstance = true;
    }
    if (cleanStyles === void 0) {
      cleanStyles = true;
    }
    const swiper = this;
    const {
      params,
      el,
      wrapperEl,
      slides
    } = swiper;
    if (typeof swiper.params === "undefined" || swiper.destroyed) {
      return null;
    }
    swiper.emit("beforeDestroy");
    swiper.initialized = false;
    swiper.detachEvents();
    if (params.loop) {
      swiper.loopDestroy();
    }
    if (cleanStyles) {
      swiper.removeClasses();
      if (el && typeof el !== "string") {
        el.removeAttribute("style");
      }
      if (wrapperEl) {
        wrapperEl.removeAttribute("style");
      }
      if (slides && slides.length) {
        slides.forEach((slideEl) => {
          slideEl.classList.remove(params.slideVisibleClass, params.slideFullyVisibleClass, params.slideActiveClass, params.slideNextClass, params.slidePrevClass);
          slideEl.removeAttribute("style");
          slideEl.removeAttribute("data-swiper-slide-index");
        });
      }
    }
    swiper.emit("destroy");
    Object.keys(swiper.eventsListeners).forEach((eventName) => {
      swiper.off(eventName);
    });
    if (deleteInstance !== false) {
      if (swiper.el && typeof swiper.el !== "string") {
        swiper.el.swiper = null;
      }
      deleteProps(swiper);
    }
    swiper.destroyed = true;
    return null;
  }
  static extendDefaults(newDefaults) {
    extend(extendedDefaults, newDefaults);
  }
  static get extendedDefaults() {
    return extendedDefaults;
  }
  static get defaults() {
    return defaults;
  }
  static installModule(mod) {
    if (!Swiper.prototype.__modules__)
      Swiper.prototype.__modules__ = [];
    const modules = Swiper.prototype.__modules__;
    if (typeof mod === "function" && modules.indexOf(mod) < 0) {
      modules.push(mod);
    }
  }
  static use(module) {
    if (Array.isArray(module)) {
      module.forEach((m) => Swiper.installModule(m));
      return Swiper;
    }
    Swiper.installModule(module);
    return Swiper;
  }
}
Object.keys(prototypes).forEach((prototypeGroup) => {
  Object.keys(prototypes[prototypeGroup]).forEach((protoMethod) => {
    Swiper.prototype[protoMethod] = prototypes[prototypeGroup][protoMethod];
  });
});
Swiper.use([Resize, Observer]);
const bind = (element, config) => {
  const defaults2 = {
    className: "post-init"
  };
  const settings = extendDefaults(defaults2, config);
  function set() {
    if (!element.length) {
      element.classList.add(settings.className);
      return;
    }
    [...element].forEach((item) => {
      item.classList.add(settings.className);
    });
  }
  function remove() {
    if (!element.length) {
      element.classList.remove(settings.className);
      return;
    }
    [...element].forEach((item) => {
      item.classList.remove(settings.className);
    });
  }
  function isSet() {
    if (!element.length) {
      return element.classList.contains(settings.className);
    }
    return [...element].every((item) => {
      return item.classList.contains(settings.className);
    });
  }
  return Object.freeze({
    isSet,
    remove,
    set
  });
};
const moneyFormat = "${{amount}}";
function formatMoney(cents, format) {
  if (typeof cents === "string") {
    cents = cents.replace(".", "");
  }
  let value = "";
  const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  const formatString = format || moneyFormat;
  function formatWithDelimiters(number, precision = 2, thousands = ",", decimal = ".") {
    if (isNaN(number) || number == null) {
      return 0;
    }
    number = (number / 100).toFixed(precision);
    const parts = number.split(".");
    const dollarsAmount = parts[0].replace(
      /(\d)(?=(\d\d\d)+(?!\d))/g,
      `$1${thousands}`
    );
    const centsAmount = parts[1] ? decimal + parts[1] : "";
    return dollarsAmount + centsAmount;
  }
  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_no_decimals_with_space_separator":
      value = formatWithDelimiters(cents, 0, " ", ".");
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
  }
  return formatString.replace(placeholderRegex, value);
}
function getCookie(name) {
  let matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)"
    )
  );
  return matches ? decodeURIComponent(matches[1]) : void 0;
}
function setCookie(name, value, options = {}) {
  options = {
    path: "/",
    ...options
  };
  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }
  let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);
  for (let optionKey in options) {
    updatedCookie += "; " + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }
  document.cookie = updatedCookie;
}
function deleteCookie(name) {
  setCookie(name, "", {
    "max-age": -1
  });
}
const CartApi = () => {
  const actions = {
    GET_CART: "getCart",
    ADD_TO_CART: "addItem",
    ADD_TO_CART_MANY: "addItems",
    UPDATE_CART: "update",
    CHANGE_CART_ITEM: "changeItem",
    CHANGE_CART_ITEM_QUANTITY: "changeQuantity",
    REMOVE_CART_ITEM: "removeItem",
    CLEAR_CART: "clear"
  };
  const api = {
    /**
     * Use the GET /{locale}/cart.js endpoint to get the cart as JSON.
     * @return {Object} - Cart object
     * */
    [actions.GET_CART]: async function() {
      return await fetch("/cart.js").then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response);
      }).then((response) => ({
        data: response
      }));
    },
    /**
     * Use the POST /{locale}/cart/add.js endpoint to add one variant to the cart.
     * @param {Object} item - Item {variant, quantity}
     * @param {String} sections - Sections ids
     * @return {Promise} - The response for a successful POST request is a JSON object of the line item associated with the added item.
     * @throws {Error}
     * */
    [actions.ADD_TO_CART]: function(item, sections = "") {
      if (!item) {
        throw new Error(`Cart API::ERROR::'${actions.ADD_TO_CART}' - param 'item' is required!`);
      }
      return this[actions.ADD_TO_CART_MANY]([item], sections);
    },
    /**
     * Use the POST /{locale}/cart/add.js endpoint to add one or multiple variants to the cart.
     * @param {Array} items - Array of items. eg:
     * @param {String} sections - Sections ids
     * @return {Promise} - The response for a successful POST request is a JSON object of the line items associated with the added items.
     * @throws {Error}
     * */
    [actions.ADD_TO_CART_MANY]: function(items = [], sections = "") {
      if (!items || !Array.isArray(items)) {
        throw new Error(`Cart API::ERROR::'${actions.ADD_TO_CART_MANY}' - param 'items' must be an array, current value is ${items}!`);
      }
      const renderedSections = sections || getCartSectionIds();
      return fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: items.map((item) => transformLineItemProps(item)),
          sections: renderedSections
        })
      }).then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response);
      }).then((response) => ({
        data: response
      }));
    },
    /**
     * Use the POST /{locale}/cart/update.js endpoint to update the cart's line item quantities, note, or attributes.
     * @param {Object} updates - Updates for cart.
     * @param {String} sections - Sections ids
     * @return {Promise} - The JSON of the cart.
     * @throws {Error}
     * */
    [actions.UPDATE_CART]: function(updates = {}, sections = "") {
      if (!updates) {
        throw new Error(`Cart API::ERROR::'${actions.UPDATE_CART}' - param 'newItem' is required!`);
      }
      return fetch("/cart/update.js", {
        method: "POST",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...updates, sections })
      }).then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response);
      }).then((response) => ({
        data: response
      }));
    },
    /**
     * Use the /{locale}/cart/change.js endpoint to change the quantity, properties, and selling_plan properties of a cart line item.
     * @param {Object} newItem - Updates for line item.
     * @param {String} sections - Sections ids
     * @return {Promise} - The JSON of the cart.
     * @throws {Error}
     * */
    [actions.CHANGE_CART_ITEM]: function(newItem, sections) {
      if (!newItem) {
        throw new Error(`Cart API::ERROR::'${actions.CHANGE_CART_ITEM}' - param 'newItem' is required!`);
      }
      return fetch("/cart/change.js", {
        method: "POST",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...newItem, sections })
      }).then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response);
      }).then((response) => ({
        data: response
      }));
    },
    /**
     * Change cart item quantity
     * @param {String} key - Line item key
     * @param {Number} quantity - New line item quantity
     * @param {String} sections - Sections ids
     * @return {Promise} - The JSON of the cart.
     * @throws {Error}
     * */
    [actions.CHANGE_CART_ITEM_QUANTITY]: function(key, quantity, sections = "") {
      if (!key || !Number.isInteger(quantity)) {
        throw new Error(`Cart API::ERROR::'${actions.CHANGE_CART_ITEM_QUANTITY}' - required param is missing!`);
      }
      return this[actions.CHANGE_CART_ITEM](
        {
          id: key,
          quantity
        },
        sections
      );
    },
    /**
     * Remove line item from cart
     * @param {String} key - Line item key
     * @param {String} sections - Sections ids
     * @return {Promise} - The JSON of the cart.
     * @throws {Error}
     * */
    [actions.REMOVE_CART_ITEM]: function(key, sections = "") {
      if (!key) {
        throw new Error(`Cart API::ERROR::'${actions.REMOVE_CART_ITEM}' - param 'key' is required!`);
      }
      return this[actions.CHANGE_CART_ITEM_QUANTITY](key, 0, sections);
    },
    /**
     * Use the POST /{locale}/cart/clear.js endpoint to set all quantities of all line items in the cart to zero.
     * @return {Promise} - The JSON of an empty cart. This does not remove cart attributes or the cart note.
     * */
    [actions.CLEAR_CART]: function(sections = "") {
      return fetch("/cart/clear.js", {
        method: "POST",
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sections })
      }).then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response);
      }).then((response) => ({
        data: response
      }));
    }
  };
  function getCartSectionIds() {
    return [...document.querySelectorAll('[data-section-type="cart-template"]')].map((section) => section.dataset.sectionId).filter(Boolean).join(",");
  }
  function getCurrentCartItemCount() {
    const currentCart = window.themeCore.cartObject;
    if (currentCart && Number.isFinite(Number(currentCart.item_count))) {
      return Number(currentCart.item_count);
    }
    const counter = document.querySelector("[data-cart-count]");
    const count = counter ? Number(counter.getAttribute("data-cart-count")) : 0;
    return Number.isFinite(count) ? count : 0;
  }
  function getAddedQuantity(params) {
    return params.filter((param) => {
      if (param && param.hasOwnProperty("id") && param.hasOwnProperty("quantity")) {
        return true;
      }
      if (Array.isArray(param)) {
        return param.every((item) => item && item.hasOwnProperty("id") && item.hasOwnProperty("quantity"));
      }
      return false;
    }).flatMap((param) => param).reduce((total, item) => total + Number(item.quantity || 1), 0);
  }
  function normalizeCartResponse(action, data, params) {
    const isAddAction = action === actions.ADD_TO_CART || action === actions.ADD_TO_CART_MANY;
    if (isAddAction && data && !data.hasOwnProperty("item_count")) {
      data.item_count = getCurrentCartItemCount() + getAddedQuantity(params);
    }
    return data;
  }
  function makeRequest(action, ...params) {
    if (!Object.keys(api).includes(action)) {
      throw new Error(`Cart API::ERROR::makeQuery - unavailable action type - ${action}`);
    }
    return api[action](...params).then((response) => {
      const data = normalizeCartResponse(action, response.data, params);
      setTimeout(() => {
        window.themeCore.cartObject = data;
        window.themeCore.EventBus.emit("cart:updated", {
          ...data,
          action,
          params: [...params]
        });
      }, 0);
      return data;
    }).catch(async (error) => {
      if (error.status === 422 && action !== actions.CHANGE_CART_ITEM_QUANTITY) {
        const res = await api[actions.GET_CART]();
        window.themeCore.EventBus.emit("cart:refresh");
        window.themeCore.EventBus.emit("header:update-item-count", { item_count: res.data.item_count });
      }
      await error.json().then((data) => {
        throw data;
      });
    });
  }
  return Object.freeze({
    actions,
    makeRequest
  });
};
function scheduleSilentCartSync() {
  const run = () => window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.GET_CART, { noOpen: true, noRefresh: true });
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run, { timeout: 1500 });
    return;
  }
  window.setTimeout(run, 600);
}
const VIDEO_TYPES = {
  html: "html",
  youtube: "youtube",
  vimeo: "vimeo"
};
function Listeners() {
  this.entries = [];
}
Listeners.prototype.add = function(element, event, fn) {
  this.entries.push({ element, event, fn });
  element.addEventListener(event, fn);
};
Listeners.prototype.removeAll = function() {
  this.entries = this.entries.filter(function(listener) {
    listener.element.removeEventListener(listener.event, listener.fn);
    return false;
  });
};
function getVariantFromSerializedArray(product, collection) {
  _validateProductStructure(product);
  var optionArray = _createOptionArrayFromOptionCollection(product, collection);
  return getVariantFromOptionArray(product, optionArray);
}
function getVariantFromOptionArray(product, options) {
  _validateProductStructure(product);
  _validateOptionsArray(options);
  var result = product.variants.filter(function(variant) {
    return options.every(function(option, index) {
      return variant.options[index] === option;
    });
  });
  return result[0] || null;
}
function _createOptionArrayFromOptionCollection(product, collection) {
  _validateProductStructure(product);
  _validateSerializedArray(collection);
  var optionArray = [];
  collection.forEach(function(option) {
    for (var i = 0; i < product.options.length; i++) {
      if (product.options[i].name.toLowerCase() === option.name.toLowerCase()) {
        optionArray[i] = option.value;
        break;
      }
    }
  });
  return optionArray;
}
function _validateProductStructure(product) {
  if (typeof product !== "object") {
    throw new TypeError(product + " is not an object.");
  }
  if (Object.keys(product).length === 0 && product.constructor === Object) {
    throw new Error(product + " is empty.");
  }
}
function _validateSerializedArray(collection) {
  if (!Array.isArray(collection)) {
    throw new TypeError(collection + " is not an array.");
  }
  if (collection.length === 0) {
    return [];
  }
  if (collection[0].hasOwnProperty("name")) {
    if (typeof collection[0].name !== "string") {
      throw new TypeError(
        "Invalid value type passed for name of option " + collection[0].name + ". Value should be string."
      );
    }
  } else {
    throw new Error(collection[0] + "does not contain name key.");
  }
}
function _validateOptionsArray(options) {
  if (Array.isArray(options) && typeof options[0] === "object") {
    throw new Error(options + "is not a valid array of options.");
  }
}
var selectors$1 = {
  idInput: '[name="id"]',
  optionInput: '[name^="options"]',
  quantityInput: '[name="quantity"]',
  propertyInput: '[name^="properties"]'
};
function getUrlWithVariant(url, id) {
  if (/variant=/.test(url)) {
    return url.replace(/(variant=)[^&]+/, "$1" + id);
  } else if (/\?/.test(url)) {
    return url.concat("&variant=").concat(id);
  }
  return url.concat("?variant=").concat(id);
}
function ProductForm(element, product, options) {
  this.element = element;
  this.product = _validateProductObject(product);
  options = options || {};
  this._listeners = new Listeners();
  this._listeners.add(
    this.element,
    "submit",
    this._onSubmit.bind(this, options)
  );
  this.optionInputs = this._initInputs(
    selectors$1.optionInput,
    options.onOptionChange
  );
  this.quantityInputs = this._initInputs(
    selectors$1.quantityInput,
    options.onQuantityChange
  );
  this.propertyInputs = this._initInputs(
    selectors$1.propertyInput,
    options.onPropertyChange
  );
}
ProductForm.prototype.destroy = function() {
  this._listeners.removeAll();
};
ProductForm.prototype.options = function() {
  return _serializeOptionValues(this.optionInputs, function(item) {
    var regex = /(?:^(options\[))(.*?)(?:\])/;
    item.name = regex.exec(item.name)[2];
    return item;
  });
};
ProductForm.prototype.variant = function() {
  return getVariantFromSerializedArray(this.product, this.options());
};
ProductForm.prototype.properties = function() {
  var properties = _serializePropertyValues(this.propertyInputs, function(propertyName) {
    var regex = /(?:^(properties\[))(.*?)(?:\])/;
    var name = regex.exec(propertyName)[2];
    return name;
  });
  return Object.entries(properties).length === 0 ? null : properties;
};
ProductForm.prototype.quantity = function() {
  return this.quantityInputs[0] ? Number.parseInt(this.quantityInputs[0].value, 10) : 1;
};
ProductForm.prototype._setIdInputValue = function(value) {
  var idInputElement = this.element.querySelector(selectors$1.idInput);
  if (!idInputElement) {
    idInputElement = document.createElement("input");
    idInputElement.type = "hidden";
    idInputElement.name = "id";
    this.element.appendChild(idInputElement);
  }
  idInputElement.value = value.toString();
};
ProductForm.prototype._onSubmit = function(options, event) {
  event.dataset = this._getProductFormEventData();
  if (event.dataset.variant) {
    this._setIdInputValue(event.dataset.variant.id);
  }
  if (options.onFormSubmit) {
    options.onFormSubmit(event);
  }
};
ProductForm.prototype._onFormEvent = function(cb) {
  if (typeof cb === "undefined") {
    return Function.prototype;
  }
  return (function(event) {
    event.dataset = this._getProductFormEventData();
    cb(event);
  }).bind(this);
};
ProductForm.prototype._initInputs = function(selector, cb) {
  var elements = Array.prototype.slice.call(
    this.element.querySelectorAll(selector)
  );
  return elements.map(
    (function(element) {
      this._listeners.add(element, "change", this._onFormEvent(cb));
      return element;
    }).bind(this)
  );
};
ProductForm.prototype._getProductFormEventData = function() {
  return {
    options: this.options(),
    variant: this.variant(),
    properties: this.properties(),
    quantity: this.quantity()
  };
};
function _serializeOptionValues(inputs, transform) {
  return inputs.reduce(function(options, input) {
    if (input.checked || // If input is a checked (means type radio or checkbox)
    input.type !== "radio" && input.type !== "checkbox") {
      options.push(transform({ name: input.name, value: input.value }));
    }
    return options;
  }, []);
}
function _serializePropertyValues(inputs, transform) {
  return inputs.reduce(function(properties, input) {
    if (input.checked || // If input is a checked (means type radio or checkbox)
    input.type !== "radio" && input.type !== "checkbox") {
      properties[transform(input.name)] = input.value;
    }
    return properties;
  }, {});
}
function _validateProductObject(product) {
  if (typeof product !== "object") {
    throw new TypeError(product + " is not an object.");
  }
  if (typeof product.variants[0].options === "undefined") {
    throw new TypeError(
      "Product object is invalid. Make sure you use the product object that is output from {{ product | json }} or from the http://[your-product-url].js route"
    );
  }
  return product;
}
const register = (component, type) => {
  if (!component || !type) {
    return;
  }
  const setup2 = (event) => {
    if (window.themeCore.sections[type]) {
      return;
    }
    const detail = event == null ? void 0 : event.detail;
    const sectionId = detail == null ? void 0 : detail.sectionId;
    const eventType = detail == null ? void 0 : detail.type;
    const addDetail = eventType === type && sectionId;
    const componentDetail = addDetail ? sectionId : void 0;
    component.init(componentDetail);
    window.themeCore.EventBus.emit(`${type}:loaded`);
    window.themeCore.sections[type] = true;
  };
  setup2();
  document.addEventListener("theme:customizer:loaded", setup2);
};
const registerExternalUtil = (component, type) => {
  if (!component || !type) {
    return;
  }
  const setup2 = () => {
    if (window.themeCore.externalUtils[type]) {
      return;
    }
    window.themeCore.utils[type] = component;
    window.themeCore.externalUtils[type] = true;
    window.themeCore.EventBus.emit(`${type}:loaded`);
  };
  setup2();
  document.addEventListener("shopify:section:load", setup2);
};
const getExternalUtil = (type) => {
  return new Promise((resolve) => {
    if (window.themeCore.utils[type]) {
      resolve(window.themeCore.utils[type]);
      return;
    }
    window.themeCore.EventBus.listen(`${type}:loaded`, () => {
      window.themeCore.utils[type] && resolve(window.themeCore.utils[type]);
    });
  });
};
const BackToTop = () => {
  const selectors2 = {
    button: ".js-back-to-top-button"
  };
  function init() {
    let button = document.querySelector(selectors2.button);
    if (!button) {
      return null;
    }
    button.addEventListener("click", () => {
      scrollToTop();
    });
  }
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    setTimeout(() => {
      document.body.setAttribute("tabindex", "-1");
      document.body.focus();
    }, 1e3);
  }
  return Object.freeze({
    init
  });
};
const AddToCart = () => {
  let initiatedState = false;
  const selectors2 = {
    addToCart: ".js-add-to-cart"
  };
  function init() {
    if (initiatedState) {
      return;
    }
    document.addEventListener("click", async function(event) {
      const target = event.target;
      if (!target) {
        return;
      }
      const button = event.target.closest(selectors2.addToCart);
      if (!button) {
        return;
      }
      const productHandle = button.getAttribute("data-product-handle");
      const productVariant = button.getAttribute("data-variant-id");
      const productQuantity = button.getAttribute("data-min-quantity");
      if (productVariant) {
        try {
          const params = {
            id: productVariant,
            quantity: Number(productQuantity)
          };
          if (button && button.hasAttribute("data-preorder")) {
            params.properties = params.properties || {};
            params.properties["_Pre-order"] = "true";
          }
          await window.themeCore.CartApi.makeRequest(window.themeCore.CartApi.actions.ADD_TO_CART, params);
          scheduleSilentCartSync();
        } catch (error) {
          const CartNotificationError = window.themeCore.CartNotificationError;
          CartNotificationError.addNotification(error.description);
          CartNotificationError.open();
        }
      } else {
        window.themeCore.EventBus.emit(
          "product-card:quick-view:clicked",
          {
            productHandle,
            variant: productVariant
          }
        );
      }
    });
    initiatedState = true;
  }
  return Object.freeze({
    init
  });
};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var dist = { exports: {} };
var Sister;
/**
* @link https://github.com/gajus/sister for the canonical source repository
* @license https://github.com/gajus/sister/blob/master/LICENSE BSD 3-Clause
*/
Sister = function() {
  var sister2 = {}, events2 = {};
  sister2.on = function(name, handler) {
    var listener = { name, handler };
    events2[name] = events2[name] || [];
    events2[name].unshift(listener);
    return listener;
  };
  sister2.off = function(listener) {
    var index = events2[listener.name].indexOf(listener);
    if (index !== -1) {
      events2[listener.name].splice(index, 1);
    }
  };
  sister2.trigger = function(name, data) {
    var listeners = events2[name], i;
    if (listeners) {
      i = listeners.length;
      while (i--) {
        listeners[i].handler(data);
      }
    }
  };
  return sister2;
};
var sister = Sister;
var YouTubePlayer$1 = { exports: {} };
var browser = { exports: {} };
var ms;
var hasRequiredMs;
function requireMs() {
  if (hasRequiredMs)
    return ms;
  hasRequiredMs = 1;
  var s = 1e3;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse(val);
    } else if (type === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    );
  };
  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return void 0;
    }
  }
  function fmtShort(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return Math.round(ms2 / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms2 / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms2 / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms2 / s) + "s";
    }
    return ms2 + "ms";
  }
  function fmtLong(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return plural(ms2, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms2, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms2, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms2, msAbs, s, "second");
    }
    return ms2 + " ms";
  }
  function plural(ms2, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms2 / n) + " " + name + (isPlural ? "s" : "");
  }
  return ms;
}
function setup(env) {
  createDebug.debug = createDebug;
  createDebug.default = createDebug;
  createDebug.coerce = coerce;
  createDebug.disable = disable;
  createDebug.enable = enable;
  createDebug.enabled = enabled;
  createDebug.humanize = requireMs();
  createDebug.destroy = destroy;
  Object.keys(env).forEach((key) => {
    createDebug[key] = env[key];
  });
  createDebug.names = [];
  createDebug.skips = [];
  createDebug.formatters = {};
  function selectColor(namespace) {
    let hash = 0;
    for (let i = 0; i < namespace.length; i++) {
      hash = (hash << 5) - hash + namespace.charCodeAt(i);
      hash |= 0;
    }
    return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
  }
  createDebug.selectColor = selectColor;
  function createDebug(namespace) {
    let prevTime;
    let enableOverride = null;
    let namespacesCache;
    let enabledCache;
    function debug(...args) {
      if (!debug.enabled) {
        return;
      }
      const self2 = debug;
      const curr = Number(/* @__PURE__ */ new Date());
      const ms2 = curr - (prevTime || curr);
      self2.diff = ms2;
      self2.prev = prevTime;
      self2.curr = curr;
      prevTime = curr;
      args[0] = createDebug.coerce(args[0]);
      if (typeof args[0] !== "string") {
        args.unshift("%O");
      }
      let index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
        if (match === "%%") {
          return "%";
        }
        index++;
        const formatter = createDebug.formatters[format];
        if (typeof formatter === "function") {
          const val = args[index];
          match = formatter.call(self2, val);
          args.splice(index, 1);
          index--;
        }
        return match;
      });
      createDebug.formatArgs.call(self2, args);
      const logFn = self2.log || createDebug.log;
      logFn.apply(self2, args);
    }
    debug.namespace = namespace;
    debug.useColors = createDebug.useColors();
    debug.color = createDebug.selectColor(namespace);
    debug.extend = extend2;
    debug.destroy = createDebug.destroy;
    Object.defineProperty(debug, "enabled", {
      enumerable: true,
      configurable: false,
      get: () => {
        if (enableOverride !== null) {
          return enableOverride;
        }
        if (namespacesCache !== createDebug.namespaces) {
          namespacesCache = createDebug.namespaces;
          enabledCache = createDebug.enabled(namespace);
        }
        return enabledCache;
      },
      set: (v) => {
        enableOverride = v;
      }
    });
    if (typeof createDebug.init === "function") {
      createDebug.init(debug);
    }
    return debug;
  }
  function extend2(namespace, delimiter) {
    const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
    newDebug.log = this.log;
    return newDebug;
  }
  function enable(namespaces) {
    createDebug.save(namespaces);
    createDebug.namespaces = namespaces;
    createDebug.names = [];
    createDebug.skips = [];
    let i;
    const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
    const len = split.length;
    for (i = 0; i < len; i++) {
      if (!split[i]) {
        continue;
      }
      namespaces = split[i].replace(/\*/g, ".*?");
      if (namespaces[0] === "-") {
        createDebug.skips.push(new RegExp("^" + namespaces.slice(1) + "$"));
      } else {
        createDebug.names.push(new RegExp("^" + namespaces + "$"));
      }
    }
  }
  function disable() {
    const namespaces = [
      ...createDebug.names.map(toNamespace),
      ...createDebug.skips.map(toNamespace).map((namespace) => "-" + namespace)
    ].join(",");
    createDebug.enable("");
    return namespaces;
  }
  function enabled(name) {
    if (name[name.length - 1] === "*") {
      return true;
    }
    let i;
    let len;
    for (i = 0, len = createDebug.skips.length; i < len; i++) {
      if (createDebug.skips[i].test(name)) {
        return false;
      }
    }
    for (i = 0, len = createDebug.names.length; i < len; i++) {
      if (createDebug.names[i].test(name)) {
        return true;
      }
    }
    return false;
  }
  function toNamespace(regexp) {
    return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
  }
  function coerce(val) {
    if (val instanceof Error) {
      return val.stack || val.message;
    }
    return val;
  }
  function destroy() {
    console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  }
  createDebug.enable(createDebug.load());
  return createDebug;
}
var common = setup;
(function(module, exports) {
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load2;
  exports.useColors = useColors;
  exports.storage = localstorage();
  exports.destroy = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
    };
  })();
  exports.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function useColors() {
    if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return false;
    }
    return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
    typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
    typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function formatArgs(args) {
    args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
    if (!this.useColors) {
      return;
    }
    const c = "color: " + this.color;
    args.splice(1, 0, c, "color: inherit");
    let index = 0;
    let lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, (match) => {
      if (match === "%%") {
        return;
      }
      index++;
      if (match === "%c") {
        lastC = index;
      }
    });
    args.splice(lastC, 0, c);
  }
  exports.log = console.debug || console.log || (() => {
  });
  function save(namespaces) {
    try {
      if (namespaces) {
        exports.storage.setItem("debug", namespaces);
      } else {
        exports.storage.removeItem("debug");
      }
    } catch (error) {
    }
  }
  function load2() {
    let r;
    try {
      r = exports.storage.getItem("debug");
    } catch (error) {
    }
    if (!r && typeof process !== "undefined" && "env" in process) {
      r = {}.DEBUG;
    }
    return r;
  }
  function localstorage() {
    try {
      return localStorage;
    } catch (error) {
    }
  }
  module.exports = common(exports);
  const { formatters } = module.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
})(browser, browser.exports);
var browserExports = browser.exports;
var FunctionStateMap = { exports: {} };
var PlayerStates = { exports: {} };
(function(module, exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    BUFFERING: 3,
    ENDED: 0,
    PAUSED: 2,
    PLAYING: 1,
    UNSTARTED: -1,
    VIDEO_CUED: 5
  };
  module.exports = exports["default"];
})(PlayerStates, PlayerStates.exports);
var PlayerStatesExports = PlayerStates.exports;
(function(module, exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var _PlayerStates = PlayerStatesExports;
  var _PlayerStates2 = _interopRequireDefault(_PlayerStates);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  exports.default = {
    pauseVideo: {
      acceptableStates: [_PlayerStates2.default.ENDED, _PlayerStates2.default.PAUSED],
      stateChangeRequired: false
    },
    playVideo: {
      acceptableStates: [_PlayerStates2.default.ENDED, _PlayerStates2.default.PLAYING],
      stateChangeRequired: false
    },
    seekTo: {
      acceptableStates: [_PlayerStates2.default.ENDED, _PlayerStates2.default.PLAYING, _PlayerStates2.default.PAUSED],
      stateChangeRequired: true,
      // TRICKY: `seekTo` may not cause a state change if no buffering is
      // required.
      // eslint-disable-next-line unicorn/numeric-separators-style
      timeout: 3e3
    }
  };
  module.exports = exports["default"];
})(FunctionStateMap, FunctionStateMap.exports);
var FunctionStateMapExports = FunctionStateMap.exports;
var eventNames = { exports: {} };
(function(module, exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = ["ready", "stateChange", "playbackQualityChange", "playbackRateChange", "error", "apiChange", "volumeChange"];
  module.exports = exports["default"];
})(eventNames, eventNames.exports);
var eventNamesExports = eventNames.exports;
var functionNames = { exports: {} };
(function(module, exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = ["cueVideoById", "loadVideoById", "cueVideoByUrl", "loadVideoByUrl", "playVideo", "pauseVideo", "stopVideo", "getVideoLoadedFraction", "cuePlaylist", "loadPlaylist", "nextVideo", "previousVideo", "playVideoAt", "setShuffle", "setLoop", "getPlaylist", "getPlaylistIndex", "setOption", "mute", "unMute", "isMuted", "setVolume", "getVolume", "seekTo", "getPlayerState", "getPlaybackRate", "setPlaybackRate", "getAvailablePlaybackRates", "getPlaybackQuality", "setPlaybackQuality", "getAvailableQualityLevels", "getCurrentTime", "getDuration", "removeEventListener", "getVideoUrl", "getVideoEmbedCode", "getOptions", "getOption", "addEventListener", "destroy", "setSize", "getIframe", "getSphericalProperties", "setSphericalProperties"];
  module.exports = exports["default"];
})(functionNames, functionNames.exports);
var functionNamesExports = functionNames.exports;
(function(module, exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var _debug = browserExports;
  var _debug2 = _interopRequireDefault(_debug);
  var _FunctionStateMap = FunctionStateMapExports;
  var _FunctionStateMap2 = _interopRequireDefault(_FunctionStateMap);
  var _eventNames = eventNamesExports;
  var _eventNames2 = _interopRequireDefault(_eventNames);
  var _functionNames = functionNamesExports;
  var _functionNames2 = _interopRequireDefault(_functionNames);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  const debug = (0, _debug2.default)("youtube-player");
  const YouTubePlayer2 = {};
  YouTubePlayer2.proxyEvents = (emitter) => {
    const events2 = {};
    for (const eventName of _eventNames2.default) {
      const onEventName = "on" + eventName.slice(0, 1).toUpperCase() + eventName.slice(1);
      events2[onEventName] = (event) => {
        debug('event "%s"', onEventName, event);
        emitter.trigger(eventName, event);
      };
    }
    return events2;
  };
  YouTubePlayer2.promisifyPlayer = (playerAPIReady, strictState = false) => {
    const functions = {};
    for (const functionName of _functionNames2.default) {
      if (strictState && _FunctionStateMap2.default[functionName]) {
        functions[functionName] = (...args) => {
          return playerAPIReady.then((player) => {
            const stateInfo = _FunctionStateMap2.default[functionName];
            const playerState = player.getPlayerState();
            const value = player[functionName].apply(player, args);
            if (stateInfo.stateChangeRequired || // eslint-disable-next-line no-extra-parens
            Array.isArray(stateInfo.acceptableStates) && !stateInfo.acceptableStates.includes(playerState)) {
              return new Promise((resolve) => {
                const onPlayerStateChange = () => {
                  const playerStateAfterChange = player.getPlayerState();
                  let timeout;
                  if (typeof stateInfo.timeout === "number") {
                    timeout = setTimeout(() => {
                      player.removeEventListener("onStateChange", onPlayerStateChange);
                      resolve();
                    }, stateInfo.timeout);
                  }
                  if (Array.isArray(stateInfo.acceptableStates) && stateInfo.acceptableStates.includes(playerStateAfterChange)) {
                    player.removeEventListener("onStateChange", onPlayerStateChange);
                    clearTimeout(timeout);
                    resolve();
                  }
                };
                player.addEventListener("onStateChange", onPlayerStateChange);
              }).then(() => {
                return value;
              });
            }
            return value;
          });
        };
      } else {
        functions[functionName] = (...args) => {
          return playerAPIReady.then((player) => {
            return player[functionName].apply(player, args);
          });
        };
      }
    }
    return functions;
  };
  exports.default = YouTubePlayer2;
  module.exports = exports["default"];
})(YouTubePlayer$1, YouTubePlayer$1.exports);
var YouTubePlayerExports = YouTubePlayer$1.exports;
var loadYouTubeIframeApi = { exports: {} };
var loadScript = function load(src, opts, cb) {
  var head = document.head || document.getElementsByTagName("head")[0];
  var script = document.createElement("script");
  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }
  opts = opts || {};
  cb = cb || function() {
  };
  script.type = opts.type || "text/javascript";
  script.charset = opts.charset || "utf8";
  script.async = "async" in opts ? !!opts.async : true;
  script.src = src;
  if (opts.attrs) {
    setAttributes(script, opts.attrs);
  }
  if (opts.text) {
    script.text = "" + opts.text;
  }
  var onend = "onload" in script ? stdOnEnd : ieOnEnd;
  onend(script, cb);
  if (!script.onload) {
    stdOnEnd(script, cb);
  }
  head.appendChild(script);
};
function setAttributes(script, attrs) {
  for (var attr in attrs) {
    script.setAttribute(attr, attrs[attr]);
  }
}
function stdOnEnd(script, cb) {
  script.onload = function() {
    this.onerror = this.onload = null;
    cb(null, script);
  };
  script.onerror = function() {
    this.onerror = this.onload = null;
    cb(new Error("Failed to load " + this.src), script);
  };
}
function ieOnEnd(script, cb) {
  script.onreadystatechange = function() {
    if (this.readyState != "complete" && this.readyState != "loaded")
      return;
    this.onreadystatechange = null;
    cb(null, script);
  };
}
(function(module, exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var _loadScript = loadScript;
  var _loadScript2 = _interopRequireDefault(_loadScript);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  exports.default = (emitter) => {
    const iframeAPIReady = new Promise((resolve) => {
      if (window.YT && window.YT.Player && window.YT.Player instanceof Function) {
        resolve(window.YT);
        return;
      } else {
        const protocol = window.location.protocol === "http:" ? "http:" : "https:";
        (0, _loadScript2.default)(protocol + "//www.youtube.com/iframe_api", (error) => {
          if (error) {
            emitter.trigger("error", error);
          }
        });
      }
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previous) {
          previous();
        }
        resolve(window.YT);
      };
    });
    return iframeAPIReady;
  };
  module.exports = exports["default"];
})(loadYouTubeIframeApi, loadYouTubeIframeApi.exports);
var loadYouTubeIframeApiExports = loadYouTubeIframeApi.exports;
(function(module, exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var _sister = sister;
  var _sister2 = _interopRequireDefault(_sister);
  var _YouTubePlayer = YouTubePlayerExports;
  var _YouTubePlayer2 = _interopRequireDefault(_YouTubePlayer);
  var _loadYouTubeIframeApi = loadYouTubeIframeApiExports;
  var _loadYouTubeIframeApi2 = _interopRequireDefault(_loadYouTubeIframeApi);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  let youtubeIframeAPI;
  exports.default = (maybeElementId, options = {}, strictState = false) => {
    const emitter = (0, _sister2.default)();
    if (!youtubeIframeAPI) {
      youtubeIframeAPI = (0, _loadYouTubeIframeApi2.default)(emitter);
    }
    if (options.events) {
      throw new Error("Event handlers cannot be overwritten.");
    }
    if (typeof maybeElementId === "string" && !document.getElementById(maybeElementId)) {
      throw new Error('Element "' + maybeElementId + '" does not exist.');
    }
    options.events = _YouTubePlayer2.default.proxyEvents(emitter);
    const playerAPIReady = new Promise((resolve) => {
      if (typeof maybeElementId === "object" && maybeElementId.playVideo instanceof Function) {
        const player = maybeElementId;
        resolve(player);
      } else {
        youtubeIframeAPI.then((YT) => {
          const player = new YT.Player(maybeElementId, options);
          emitter.on("ready", () => {
            resolve(player);
          });
          return null;
        });
      }
    });
    const playerApi = _YouTubePlayer2.default.promisifyPlayer(playerAPIReady, strictState);
    playerApi.on = emitter.on;
    playerApi.off = emitter.off;
    return playerApi;
  };
  module.exports = exports["default"];
})(dist, dist.exports);
var distExports = dist.exports;
const YouTubePlayer = /* @__PURE__ */ getDefaultExportFromCjs(distExports);
/*! @vimeo/player v2.20.1 | (c) 2023 Vimeo | MIT License | https://github.com/vimeo/player.js */
function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function(sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), true).forEach(function(key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function(key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }
  return target;
}
function _regeneratorRuntime() {
  _regeneratorRuntime = function() {
    return exports;
  };
  var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function(obj, key, desc) {
    obj[key] = desc.value;
  }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
  function define(obj, key, value) {
    return Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    }), obj[key];
  }
  try {
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }
  function wrap(innerFn, outerFn, self2, tryLocsList) {
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []);
    return defineProperty(generator, "_invoke", {
      value: makeInvokeMethod(innerFn, self2, context)
    }), generator;
  }
  function tryCatch(fn, obj, arg) {
    try {
      return {
        type: "normal",
        arg: fn.call(obj, arg)
      };
    } catch (err) {
      return {
        type: "throw",
        arg: err
      };
    }
  }
  exports.wrap = wrap;
  var ContinueSentinel = {};
  function Generator() {
  }
  function GeneratorFunction() {
  }
  function GeneratorFunctionPrototype() {
  }
  var IteratorPrototype = {};
  define(IteratorPrototype, iteratorSymbol, function() {
    return this;
  });
  var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype);
  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }
  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if ("throw" !== record.type) {
        var result = record.arg, value = result.value;
        return value && "object" == typeof value && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function(value2) {
          invoke("next", value2, resolve, reject);
        }, function(err) {
          invoke("throw", err, resolve, reject);
        }) : PromiseImpl.resolve(value).then(function(unwrapped) {
          result.value = unwrapped, resolve(result);
        }, function(error) {
          return invoke("throw", error, resolve, reject);
        });
      }
      reject(record.arg);
    }
    var previousPromise;
    defineProperty(this, "_invoke", {
      value: function(method, arg) {
        function callInvokeWithMethodAndArg() {
          return new PromiseImpl(function(resolve, reject) {
            invoke(method, arg, resolve, reject);
          });
        }
        return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
      }
    });
  }
  function makeInvokeMethod(innerFn, self2, context) {
    var state = "suspendedStart";
    return function(method, arg) {
      if ("executing" === state)
        throw new Error("Generator is already running");
      if ("completed" === state) {
        if ("throw" === method)
          throw arg;
        return doneResult();
      }
      for (context.method = method, context.arg = arg; ; ) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel)
              continue;
            return delegateResult;
          }
        }
        if ("next" === context.method)
          context.sent = context._sent = context.arg;
        else if ("throw" === context.method) {
          if ("suspendedStart" === state)
            throw state = "completed", context.arg;
          context.dispatchException(context.arg);
        } else
          "return" === context.method && context.abrupt("return", context.arg);
        state = "executing";
        var record = tryCatch(innerFn, self2, context);
        if ("normal" === record.type) {
          if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel)
            continue;
          return {
            value: record.arg,
            done: context.done
          };
        }
        "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg);
      }
    };
  }
  function maybeInvokeDelegate(delegate, context) {
    var methodName = context.method, method = delegate.iterator[methodName];
    if (void 0 === method)
      return context.delegate = null, "throw" === methodName && delegate.iterator.return && (context.method = "return", context.arg = void 0, maybeInvokeDelegate(delegate, context), "throw" === context.method) || "return" !== methodName && (context.method = "throw", context.arg = new TypeError("The iterator does not provide a '" + methodName + "' method")), ContinueSentinel;
    var record = tryCatch(method, delegate.iterator, context.arg);
    if ("throw" === record.type)
      return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel;
    var info = record.arg;
    return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = void 0), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel);
  }
  function pushTryEntry(locs) {
    var entry = {
      tryLoc: locs[0]
    };
    1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry);
  }
  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal", delete record.arg, entry.completion = record;
  }
  function Context(tryLocsList) {
    this.tryEntries = [{
      tryLoc: "root"
    }], tryLocsList.forEach(pushTryEntry, this), this.reset(true);
  }
  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod)
        return iteratorMethod.call(iterable);
      if ("function" == typeof iterable.next)
        return iterable;
      if (!isNaN(iterable.length)) {
        var i = -1, next = function next2() {
          for (; ++i < iterable.length; )
            if (hasOwn.call(iterable, i))
              return next2.value = iterable[i], next2.done = false, next2;
          return next2.value = void 0, next2.done = true, next2;
        };
        return next.next = next;
      }
    }
    return {
      next: doneResult
    };
  }
  function doneResult() {
    return {
      value: void 0,
      done: true
    };
  }
  return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", {
    value: GeneratorFunctionPrototype,
    configurable: true
  }), defineProperty(GeneratorFunctionPrototype, "constructor", {
    value: GeneratorFunction,
    configurable: true
  }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function(genFun) {
    var ctor = "function" == typeof genFun && genFun.constructor;
    return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name));
  }, exports.mark = function(genFun) {
    return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun;
  }, exports.awrap = function(arg) {
    return {
      __await: arg
    };
  }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function() {
    return this;
  }), exports.AsyncIterator = AsyncIterator, exports.async = function(innerFn, outerFn, self2, tryLocsList, PromiseImpl) {
    void 0 === PromiseImpl && (PromiseImpl = Promise);
    var iter = new AsyncIterator(wrap(innerFn, outerFn, self2, tryLocsList), PromiseImpl);
    return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function(result) {
      return result.done ? result.value : iter.next();
    });
  }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function() {
    return this;
  }), define(Gp, "toString", function() {
    return "[object Generator]";
  }), exports.keys = function(val) {
    var object = Object(val), keys = [];
    for (var key in object)
      keys.push(key);
    return keys.reverse(), function next() {
      for (; keys.length; ) {
        var key2 = keys.pop();
        if (key2 in object)
          return next.value = key2, next.done = false, next;
      }
      return next.done = true, next;
    };
  }, exports.values = values, Context.prototype = {
    constructor: Context,
    reset: function(skipTempReset) {
      if (this.prev = 0, this.next = 0, this.sent = this._sent = void 0, this.done = false, this.delegate = null, this.method = "next", this.arg = void 0, this.tryEntries.forEach(resetTryEntry), !skipTempReset)
        for (var name in this)
          "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = void 0);
    },
    stop: function() {
      this.done = true;
      var rootRecord = this.tryEntries[0].completion;
      if ("throw" === rootRecord.type)
        throw rootRecord.arg;
      return this.rval;
    },
    dispatchException: function(exception) {
      if (this.done)
        throw exception;
      var context = this;
      function handle(loc, caught) {
        return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = void 0), !!caught;
      }
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i], record = entry.completion;
        if ("root" === entry.tryLoc)
          return handle("end");
        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc");
          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc)
              return handle(entry.catchLoc, true);
            if (this.prev < entry.finallyLoc)
              return handle(entry.finallyLoc);
          } else if (hasCatch) {
            if (this.prev < entry.catchLoc)
              return handle(entry.catchLoc, true);
          } else {
            if (!hasFinally)
              throw new Error("try statement without catch or finally");
            if (this.prev < entry.finallyLoc)
              return handle(entry.finallyLoc);
          }
        }
      }
    },
    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }
      finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null);
      var record = finallyEntry ? finallyEntry.completion : {};
      return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record);
    },
    complete: function(record, afterLoc) {
      if ("throw" === record.type)
        throw record.arg;
      return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel;
    },
    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc)
          return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel;
      }
    },
    catch: function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if ("throw" === record.type) {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }
      throw new Error("illegal catch attempt");
    },
    delegateYield: function(iterable, resultName, nextLoc) {
      return this.delegate = {
        iterator: values(iterable),
        resultName,
        nextLoc
      }, "next" === this.method && (this.arg = void 0), ContinueSentinel;
    }
  }, exports;
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _asyncToGenerator(fn) {
  return function() {
    var self2 = this, args = arguments;
    return new Promise(function(resolve, reject) {
      var gen = fn.apply(self2, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(void 0);
    });
  };
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  Object.defineProperty(subClass, "prototype", {
    writable: false
  });
  if (superClass)
    _setPrototypeOf(subClass, superClass);
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf2(o2) {
    return o2.__proto__ || Object.getPrototypeOf(o2);
  };
  return _getPrototypeOf(o);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf2(o2, p2) {
    o2.__proto__ = p2;
    return o2;
  };
  return _setPrototypeOf(o, p);
}
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct)
    return false;
  if (Reflect.construct.sham)
    return false;
  if (typeof Proxy === "function")
    return true;
  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
    return true;
  } catch (e) {
    return false;
  }
}
function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct.bind();
  } else {
    _construct = function _construct2(Parent2, args2, Class2) {
      var a = [null];
      a.push.apply(a, args2);
      var Constructor = Function.bind.apply(Parent2, a);
      var instance = new Constructor();
      if (Class2)
        _setPrototypeOf(instance, Class2.prototype);
      return instance;
    };
  }
  return _construct.apply(null, arguments);
}
function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}
function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? /* @__PURE__ */ new Map() : void 0;
  _wrapNativeSuper = function _wrapNativeSuper2(Class2) {
    if (Class2 === null || !_isNativeFunction(Class2))
      return Class2;
    if (typeof Class2 !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }
    if (typeof _cache !== "undefined") {
      if (_cache.has(Class2))
        return _cache.get(Class2);
      _cache.set(Class2, Wrapper);
    }
    function Wrapper() {
      return _construct(Class2, arguments, _getPrototypeOf(this).constructor);
    }
    Wrapper.prototype = Object.create(Class2.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class2);
  };
  return _wrapNativeSuper(Class);
}
function _assertThisInitialized(self2) {
  if (self2 === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self2;
}
function _possibleConstructorReturn(self2, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError("Derived constructors may only return object or undefined");
  }
  return _assertThisInitialized(self2);
}
function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();
  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived), result;
    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return _possibleConstructorReturn(this, result);
  };
}
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null)
    return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== void 0) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object")
      return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}
var isNode = typeof global !== "undefined" && {}.toString.call(global) === "[object global]";
function getMethodName(prop, type) {
  if (prop.indexOf(type.toLowerCase()) === 0) {
    return prop;
  }
  return "".concat(type.toLowerCase()).concat(prop.substr(0, 1).toUpperCase()).concat(prop.substr(1));
}
function isDomElement(element) {
  return Boolean(element && element.nodeType === 1 && "nodeName" in element && element.ownerDocument && element.ownerDocument.defaultView);
}
function isInteger(value) {
  return !isNaN(parseFloat(value)) && isFinite(value) && Math.floor(value) == value;
}
function isVimeoUrl(url) {
  return /^(https?:)?\/\/((player|www)\.)?vimeo\.com(?=$|\/)/.test(url);
}
function isVimeoEmbed(url) {
  var expr = /^https:\/\/player\.vimeo\.com\/video\/\d+/;
  return expr.test(url);
}
function getVimeoUrl() {
  var oEmbedParameters2 = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  var id = oEmbedParameters2.id;
  var url = oEmbedParameters2.url;
  var idOrUrl = id || url;
  if (!idOrUrl) {
    throw new Error("An id or url must be passed, either in an options object or as a data-vimeo-id or data-vimeo-url attribute.");
  }
  if (isInteger(idOrUrl)) {
    return "https://vimeo.com/".concat(idOrUrl);
  }
  if (isVimeoUrl(idOrUrl)) {
    return idOrUrl.replace("http:", "https:");
  }
  if (id) {
    throw new TypeError("“".concat(id, "” is not a valid video id."));
  }
  throw new TypeError("“".concat(idOrUrl, "” is not a vimeo.com url."));
}
var subscribe = function subscribe2(target, eventName, callback) {
  var onName = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : "addEventListener";
  var offName = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : "removeEventListener";
  var eventNames2 = typeof eventName === "string" ? [eventName] : eventName;
  eventNames2.forEach(function(evName) {
    target[onName](evName, callback);
  });
  return {
    cancel: function cancel() {
      return eventNames2.forEach(function(evName) {
        return target[offName](evName, callback);
      });
    }
  };
};
var arrayIndexOfSupport = typeof Array.prototype.indexOf !== "undefined";
var postMessageSupport = typeof window !== "undefined" && typeof window.postMessage !== "undefined";
if (!isNode && (!arrayIndexOfSupport || !postMessageSupport)) {
  throw new Error("Sorry, the Vimeo Player API is not available in this browser.");
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function createCommonjsModule(fn, module) {
  return module = { exports: {} }, fn(module, module.exports), module.exports;
}
/*!
 * weakmap-polyfill v2.0.4 - ECMAScript6 WeakMap polyfill
 * https://github.com/polygonplanet/weakmap-polyfill
 * Copyright (c) 2015-2021 polygonplanet <polygon.planet.aqua@gmail.com>
 * @license MIT
 */
(function(self2) {
  if (self2.WeakMap) {
    return;
  }
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var hasDefine = Object.defineProperty && function() {
    try {
      return Object.defineProperty({}, "x", {
        value: 1
      }).x === 1;
    } catch (e) {
    }
  }();
  var defineProperty = function(object, name, value) {
    if (hasDefine) {
      Object.defineProperty(object, name, {
        configurable: true,
        writable: true,
        value
      });
    } else {
      object[name] = value;
    }
  };
  self2.WeakMap = function() {
    function WeakMap2() {
      if (this === void 0) {
        throw new TypeError("Constructor WeakMap requires 'new'");
      }
      defineProperty(this, "_id", genId("_WeakMap"));
      if (arguments.length > 0) {
        throw new TypeError("WeakMap iterable is not supported");
      }
    }
    defineProperty(WeakMap2.prototype, "delete", function(key) {
      checkInstance(this, "delete");
      if (!isObject2(key)) {
        return false;
      }
      var entry = key[this._id];
      if (entry && entry[0] === key) {
        delete key[this._id];
        return true;
      }
      return false;
    });
    defineProperty(WeakMap2.prototype, "get", function(key) {
      checkInstance(this, "get");
      if (!isObject2(key)) {
        return void 0;
      }
      var entry = key[this._id];
      if (entry && entry[0] === key) {
        return entry[1];
      }
      return void 0;
    });
    defineProperty(WeakMap2.prototype, "has", function(key) {
      checkInstance(this, "has");
      if (!isObject2(key)) {
        return false;
      }
      var entry = key[this._id];
      if (entry && entry[0] === key) {
        return true;
      }
      return false;
    });
    defineProperty(WeakMap2.prototype, "set", function(key, value) {
      checkInstance(this, "set");
      if (!isObject2(key)) {
        throw new TypeError("Invalid value used as weak map key");
      }
      var entry = key[this._id];
      if (entry && entry[0] === key) {
        entry[1] = value;
        return this;
      }
      defineProperty(key, this._id, [key, value]);
      return this;
    });
    function checkInstance(x, methodName) {
      if (!isObject2(x) || !hasOwnProperty.call(x, "_id")) {
        throw new TypeError(methodName + " method called on incompatible receiver " + typeof x);
      }
    }
    function genId(prefix) {
      return prefix + "_" + rand() + "." + rand();
    }
    function rand() {
      return Math.random().toString().substring(2);
    }
    defineProperty(WeakMap2, "_polyfill", true);
    return WeakMap2;
  }();
  function isObject2(x) {
    return Object(x) === x;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof commonjsGlobal !== "undefined" ? commonjsGlobal : commonjsGlobal);
var npo_src = createCommonjsModule(function(module) {
  /*! Native Promise Only
      v0.8.1 (c) Kyle Simpson
      MIT License: http://getify.mit-license.org
  */
  (function UMD(name, context, definition) {
    context[name] = context[name] || definition();
    if (module.exports) {
      module.exports = context[name];
    }
  })("Promise", typeof commonjsGlobal != "undefined" ? commonjsGlobal : commonjsGlobal, function DEF() {
    var builtInProp, cycle, scheduling_queue, ToString = Object.prototype.toString, timer = typeof setImmediate != "undefined" ? function timer2(fn) {
      return setImmediate(fn);
    } : setTimeout;
    try {
      Object.defineProperty({}, "x", {});
      builtInProp = function builtInProp2(obj, name, val, config) {
        return Object.defineProperty(obj, name, {
          value: val,
          writable: true,
          configurable: config !== false
        });
      };
    } catch (err) {
      builtInProp = function builtInProp2(obj, name, val) {
        obj[name] = val;
        return obj;
      };
    }
    scheduling_queue = function Queue() {
      var first, last, item;
      function Item(fn, self2) {
        this.fn = fn;
        this.self = self2;
        this.next = void 0;
      }
      return {
        add: function add(fn, self2) {
          item = new Item(fn, self2);
          if (last) {
            last.next = item;
          } else {
            first = item;
          }
          last = item;
          item = void 0;
        },
        drain: function drain() {
          var f = first;
          first = last = cycle = void 0;
          while (f) {
            f.fn.call(f.self);
            f = f.next;
          }
        }
      };
    }();
    function schedule(fn, self2) {
      scheduling_queue.add(fn, self2);
      if (!cycle) {
        cycle = timer(scheduling_queue.drain);
      }
    }
    function isThenable(o) {
      var _then, o_type = typeof o;
      if (o != null && (o_type == "object" || o_type == "function")) {
        _then = o.then;
      }
      return typeof _then == "function" ? _then : false;
    }
    function notify() {
      for (var i = 0; i < this.chain.length; i++) {
        notifyIsolated(this, this.state === 1 ? this.chain[i].success : this.chain[i].failure, this.chain[i]);
      }
      this.chain.length = 0;
    }
    function notifyIsolated(self2, cb, chain) {
      var ret, _then;
      try {
        if (cb === false) {
          chain.reject(self2.msg);
        } else {
          if (cb === true) {
            ret = self2.msg;
          } else {
            ret = cb.call(void 0, self2.msg);
          }
          if (ret === chain.promise) {
            chain.reject(TypeError("Promise-chain cycle"));
          } else if (_then = isThenable(ret)) {
            _then.call(ret, chain.resolve, chain.reject);
          } else {
            chain.resolve(ret);
          }
        }
      } catch (err) {
        chain.reject(err);
      }
    }
    function resolve(msg) {
      var _then, self2 = this;
      if (self2.triggered) {
        return;
      }
      self2.triggered = true;
      if (self2.def) {
        self2 = self2.def;
      }
      try {
        if (_then = isThenable(msg)) {
          schedule(function() {
            var def_wrapper = new MakeDefWrapper(self2);
            try {
              _then.call(msg, function $resolve$() {
                resolve.apply(def_wrapper, arguments);
              }, function $reject$() {
                reject.apply(def_wrapper, arguments);
              });
            } catch (err) {
              reject.call(def_wrapper, err);
            }
          });
        } else {
          self2.msg = msg;
          self2.state = 1;
          if (self2.chain.length > 0) {
            schedule(notify, self2);
          }
        }
      } catch (err) {
        reject.call(new MakeDefWrapper(self2), err);
      }
    }
    function reject(msg) {
      var self2 = this;
      if (self2.triggered) {
        return;
      }
      self2.triggered = true;
      if (self2.def) {
        self2 = self2.def;
      }
      self2.msg = msg;
      self2.state = 2;
      if (self2.chain.length > 0) {
        schedule(notify, self2);
      }
    }
    function iteratePromises(Constructor, arr, resolver, rejecter) {
      for (var idx = 0; idx < arr.length; idx++) {
        (function IIFE(idx2) {
          Constructor.resolve(arr[idx2]).then(function $resolver$(msg) {
            resolver(idx2, msg);
          }, rejecter);
        })(idx);
      }
    }
    function MakeDefWrapper(self2) {
      this.def = self2;
      this.triggered = false;
    }
    function MakeDef(self2) {
      this.promise = self2;
      this.state = 0;
      this.triggered = false;
      this.chain = [];
      this.msg = void 0;
    }
    function Promise2(executor) {
      if (typeof executor != "function") {
        throw TypeError("Not a function");
      }
      if (this.__NPO__ !== 0) {
        throw TypeError("Not a promise");
      }
      this.__NPO__ = 1;
      var def = new MakeDef(this);
      this["then"] = function then(success, failure) {
        var o = {
          success: typeof success == "function" ? success : true,
          failure: typeof failure == "function" ? failure : false
        };
        o.promise = new this.constructor(function extractChain(resolve2, reject2) {
          if (typeof resolve2 != "function" || typeof reject2 != "function") {
            throw TypeError("Not a function");
          }
          o.resolve = resolve2;
          o.reject = reject2;
        });
        def.chain.push(o);
        if (def.state !== 0) {
          schedule(notify, def);
        }
        return o.promise;
      };
      this["catch"] = function $catch$(failure) {
        return this.then(void 0, failure);
      };
      try {
        executor.call(void 0, function publicResolve(msg) {
          resolve.call(def, msg);
        }, function publicReject(msg) {
          reject.call(def, msg);
        });
      } catch (err) {
        reject.call(def, err);
      }
    }
    var PromisePrototype = builtInProp(
      {},
      "constructor",
      Promise2,
      /*configurable=*/
      false
    );
    Promise2.prototype = PromisePrototype;
    builtInProp(
      PromisePrototype,
      "__NPO__",
      0,
      /*configurable=*/
      false
    );
    builtInProp(Promise2, "resolve", function Promise$resolve(msg) {
      var Constructor = this;
      if (msg && typeof msg == "object" && msg.__NPO__ === 1) {
        return msg;
      }
      return new Constructor(function executor(resolve2, reject2) {
        if (typeof resolve2 != "function" || typeof reject2 != "function") {
          throw TypeError("Not a function");
        }
        resolve2(msg);
      });
    });
    builtInProp(Promise2, "reject", function Promise$reject(msg) {
      return new this(function executor(resolve2, reject2) {
        if (typeof resolve2 != "function" || typeof reject2 != "function") {
          throw TypeError("Not a function");
        }
        reject2(msg);
      });
    });
    builtInProp(Promise2, "all", function Promise$all(arr) {
      var Constructor = this;
      if (ToString.call(arr) != "[object Array]") {
        return Constructor.reject(TypeError("Not an array"));
      }
      if (arr.length === 0) {
        return Constructor.resolve([]);
      }
      return new Constructor(function executor(resolve2, reject2) {
        if (typeof resolve2 != "function" || typeof reject2 != "function") {
          throw TypeError("Not a function");
        }
        var len = arr.length, msgs = Array(len), count = 0;
        iteratePromises(Constructor, arr, function resolver(idx, msg) {
          msgs[idx] = msg;
          if (++count === len) {
            resolve2(msgs);
          }
        }, reject2);
      });
    });
    builtInProp(Promise2, "race", function Promise$race(arr) {
      var Constructor = this;
      if (ToString.call(arr) != "[object Array]") {
        return Constructor.reject(TypeError("Not an array"));
      }
      return new Constructor(function executor(resolve2, reject2) {
        if (typeof resolve2 != "function" || typeof reject2 != "function") {
          throw TypeError("Not a function");
        }
        iteratePromises(Constructor, arr, function resolver(idx, msg) {
          resolve2(msg);
        }, reject2);
      });
    });
    return Promise2;
  });
});
var callbackMap = /* @__PURE__ */ new WeakMap();
function storeCallback(player, name, callback) {
  var playerCallbacks = callbackMap.get(player.element) || {};
  if (!(name in playerCallbacks)) {
    playerCallbacks[name] = [];
  }
  playerCallbacks[name].push(callback);
  callbackMap.set(player.element, playerCallbacks);
}
function getCallbacks(player, name) {
  var playerCallbacks = callbackMap.get(player.element) || {};
  return playerCallbacks[name] || [];
}
function removeCallback(player, name, callback) {
  var playerCallbacks = callbackMap.get(player.element) || {};
  if (!playerCallbacks[name]) {
    return true;
  }
  if (!callback) {
    playerCallbacks[name] = [];
    callbackMap.set(player.element, playerCallbacks);
    return true;
  }
  var index = playerCallbacks[name].indexOf(callback);
  if (index !== -1) {
    playerCallbacks[name].splice(index, 1);
  }
  callbackMap.set(player.element, playerCallbacks);
  return playerCallbacks[name] && playerCallbacks[name].length === 0;
}
function shiftCallbacks(player, name) {
  var playerCallbacks = getCallbacks(player, name);
  if (playerCallbacks.length < 1) {
    return false;
  }
  var callback = playerCallbacks.shift();
  removeCallback(player, name, callback);
  return callback;
}
function swapCallbacks(oldElement, newElement) {
  var playerCallbacks = callbackMap.get(oldElement);
  callbackMap.set(newElement, playerCallbacks);
  callbackMap.delete(oldElement);
}
function parseMessageData(data) {
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.warn(error);
      return {};
    }
  }
  return data;
}
function postMessage(player, method, params) {
  if (!player.element.contentWindow || !player.element.contentWindow.postMessage) {
    return;
  }
  var message = {
    method
  };
  if (params !== void 0) {
    message.value = params;
  }
  var ieVersion = parseFloat(navigator.userAgent.toLowerCase().replace(/^.*msie (\d+).*$/, "$1"));
  if (ieVersion >= 8 && ieVersion < 10) {
    message = JSON.stringify(message);
  }
  player.element.contentWindow.postMessage(message, player.origin);
}
function processData(player, data) {
  data = parseMessageData(data);
  var callbacks = [];
  var param;
  if (data.event) {
    if (data.event === "error") {
      var promises = getCallbacks(player, data.data.method);
      promises.forEach(function(promise) {
        var error = new Error(data.data.message);
        error.name = data.data.name;
        promise.reject(error);
        removeCallback(player, data.data.method, promise);
      });
    }
    callbacks = getCallbacks(player, "event:".concat(data.event));
    param = data.data;
  } else if (data.method) {
    var callback = shiftCallbacks(player, data.method);
    if (callback) {
      callbacks.push(callback);
      param = data.value;
    }
  }
  callbacks.forEach(function(callback2) {
    try {
      if (typeof callback2 === "function") {
        callback2.call(player, param);
        return;
      }
      callback2.resolve(param);
    } catch (e) {
    }
  });
}
var oEmbedParameters = ["autopause", "autoplay", "background", "byline", "color", "colors", "controls", "dnt", "height", "id", "interactive_params", "keyboard", "loop", "maxheight", "maxwidth", "muted", "playsinline", "portrait", "responsive", "speed", "texttrack", "title", "transparent", "url", "width"];
function getOEmbedParameters(element) {
  var defaults2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  return oEmbedParameters.reduce(function(params, param) {
    var value = element.getAttribute("data-vimeo-".concat(param));
    if (value || value === "") {
      params[param] = value === "" ? 1 : value;
    }
    return params;
  }, defaults2);
}
function createEmbed(_ref, element) {
  var html = _ref.html;
  if (!element) {
    throw new TypeError("An element must be provided");
  }
  if (element.getAttribute("data-vimeo-initialized") !== null) {
    return element.querySelector("iframe");
  }
  var div = document.createElement("div");
  div.innerHTML = html;
  element.appendChild(div.firstChild);
  element.setAttribute("data-vimeo-initialized", "true");
  return element.querySelector("iframe");
}
function getOEmbedData(videoUrl) {
  var params = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  var element = arguments.length > 2 ? arguments[2] : void 0;
  return new Promise(function(resolve, reject) {
    if (!isVimeoUrl(videoUrl)) {
      throw new TypeError("“".concat(videoUrl, "” is not a vimeo.com url."));
    }
    var url = "https://vimeo.com/api/oembed.json?url=".concat(encodeURIComponent(videoUrl));
    for (var param in params) {
      if (params.hasOwnProperty(param)) {
        url += "&".concat(param, "=").concat(encodeURIComponent(params[param]));
      }
    }
    var xhr = "XDomainRequest" in window ? new XDomainRequest() : new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onload = function() {
      if (xhr.status === 404) {
        reject(new Error("“".concat(videoUrl, "” was not found.")));
        return;
      }
      if (xhr.status === 403) {
        reject(new Error("“".concat(videoUrl, "” is not embeddable.")));
        return;
      }
      try {
        var json = JSON.parse(xhr.responseText);
        if (json.domain_status_code === 403) {
          createEmbed(json, element);
          reject(new Error("“".concat(videoUrl, "” is not embeddable.")));
          return;
        }
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = function() {
      var status = xhr.status ? " (".concat(xhr.status, ")") : "";
      reject(new Error("There was an error fetching the embed code from Vimeo".concat(status, ".")));
    };
    xhr.send();
  });
}
function initializeEmbeds() {
  var parent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
  var elements = [].slice.call(parent.querySelectorAll("[data-vimeo-id], [data-vimeo-url]"));
  var handleError = function handleError2(error) {
    if ("console" in window && console.error) {
      console.error("There was an error creating an embed: ".concat(error));
    }
  };
  elements.forEach(function(element) {
    try {
      if (element.getAttribute("data-vimeo-defer") !== null) {
        return;
      }
      var params = getOEmbedParameters(element);
      var url = getVimeoUrl(params);
      getOEmbedData(url, params, element).then(function(data) {
        return createEmbed(data, element);
      }).catch(handleError);
    } catch (error) {
      handleError(error);
    }
  });
}
function resizeEmbeds() {
  var parent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
  if (window.VimeoPlayerResizeEmbeds_) {
    return;
  }
  window.VimeoPlayerResizeEmbeds_ = true;
  var onMessage = function onMessage2(event) {
    if (!isVimeoUrl(event.origin)) {
      return;
    }
    if (!event.data || event.data.event !== "spacechange") {
      return;
    }
    var iframes = parent.querySelectorAll("iframe");
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].contentWindow !== event.source) {
        continue;
      }
      var space = iframes[i].parentElement;
      space.style.paddingBottom = "".concat(event.data.data[0].bottom, "px");
      break;
    }
  };
  window.addEventListener("message", onMessage);
}
function initAppendVideoMetadata() {
  var parent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
  if (window.VimeoSeoMetadataAppended) {
    return;
  }
  window.VimeoSeoMetadataAppended = true;
  var onMessage = function onMessage2(event) {
    if (!isVimeoUrl(event.origin)) {
      return;
    }
    var data = parseMessageData(event.data);
    if (!data || data.event !== "ready") {
      return;
    }
    var iframes = parent.querySelectorAll("iframe");
    for (var i = 0; i < iframes.length; i++) {
      var iframe = iframes[i];
      var isValidMessageSource = iframe.contentWindow === event.source;
      if (isVimeoEmbed(iframe.src) && isValidMessageSource) {
        var player = new Player(iframe);
        player.callMethod("appendVideoMetadata", window.location.href);
      }
    }
  };
  window.addEventListener("message", onMessage);
}
function checkUrlTimeParam() {
  var parent = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : document;
  if (window.VimeoCheckedUrlTimeParam) {
    return;
  }
  window.VimeoCheckedUrlTimeParam = true;
  var handleError = function handleError2(error) {
    if ("console" in window && console.error) {
      console.error("There was an error getting video Id: ".concat(error));
    }
  };
  var onMessage = function onMessage2(event) {
    if (!isVimeoUrl(event.origin)) {
      return;
    }
    var data = parseMessageData(event.data);
    if (!data || data.event !== "ready") {
      return;
    }
    var iframes = parent.querySelectorAll("iframe");
    var _loop = function _loop2() {
      var iframe = iframes[i];
      var isValidMessageSource = iframe.contentWindow === event.source;
      if (isVimeoEmbed(iframe.src) && isValidMessageSource) {
        var player = new Player(iframe);
        player.getVideoId().then(function(videoId) {
          var matches = new RegExp("[?&]vimeo_t_".concat(videoId, "=([^&#]*)")).exec(window.location.href);
          if (matches && matches[1]) {
            var sec = decodeURI(matches[1]);
            player.setCurrentTime(sec);
          }
          return;
        }).catch(handleError);
      }
    };
    for (var i = 0; i < iframes.length; i++) {
      _loop();
    }
  };
  window.addEventListener("message", onMessage);
}
function initializeScreenfull() {
  var fn = function() {
    var val;
    var fnMap = [
      ["requestFullscreen", "exitFullscreen", "fullscreenElement", "fullscreenEnabled", "fullscreenchange", "fullscreenerror"],
      // New WebKit
      ["webkitRequestFullscreen", "webkitExitFullscreen", "webkitFullscreenElement", "webkitFullscreenEnabled", "webkitfullscreenchange", "webkitfullscreenerror"],
      // Old WebKit
      ["webkitRequestFullScreen", "webkitCancelFullScreen", "webkitCurrentFullScreenElement", "webkitCancelFullScreen", "webkitfullscreenchange", "webkitfullscreenerror"],
      ["mozRequestFullScreen", "mozCancelFullScreen", "mozFullScreenElement", "mozFullScreenEnabled", "mozfullscreenchange", "mozfullscreenerror"],
      ["msRequestFullscreen", "msExitFullscreen", "msFullscreenElement", "msFullscreenEnabled", "MSFullscreenChange", "MSFullscreenError"]
    ];
    var i = 0;
    var l = fnMap.length;
    var ret = {};
    for (; i < l; i++) {
      val = fnMap[i];
      if (val && val[1] in document) {
        for (i = 0; i < val.length; i++) {
          ret[fnMap[0][i]] = val[i];
        }
        return ret;
      }
    }
    return false;
  }();
  var eventNameMap = {
    fullscreenchange: fn.fullscreenchange,
    fullscreenerror: fn.fullscreenerror
  };
  var screenfull2 = {
    request: function request(element) {
      return new Promise(function(resolve, reject) {
        var onFullScreenEntered = function onFullScreenEntered2() {
          screenfull2.off("fullscreenchange", onFullScreenEntered2);
          resolve();
        };
        screenfull2.on("fullscreenchange", onFullScreenEntered);
        element = element || document.documentElement;
        var returnPromise = element[fn.requestFullscreen]();
        if (returnPromise instanceof Promise) {
          returnPromise.then(onFullScreenEntered).catch(reject);
        }
      });
    },
    exit: function exit() {
      return new Promise(function(resolve, reject) {
        if (!screenfull2.isFullscreen) {
          resolve();
          return;
        }
        var onFullScreenExit = function onFullScreenExit2() {
          screenfull2.off("fullscreenchange", onFullScreenExit2);
          resolve();
        };
        screenfull2.on("fullscreenchange", onFullScreenExit);
        var returnPromise = document[fn.exitFullscreen]();
        if (returnPromise instanceof Promise) {
          returnPromise.then(onFullScreenExit).catch(reject);
        }
      });
    },
    on: function on2(event, callback) {
      var eventName = eventNameMap[event];
      if (eventName) {
        document.addEventListener(eventName, callback);
      }
    },
    off: function off2(event, callback) {
      var eventName = eventNameMap[event];
      if (eventName) {
        document.removeEventListener(eventName, callback);
      }
    }
  };
  Object.defineProperties(screenfull2, {
    isFullscreen: {
      get: function get() {
        return Boolean(document[fn.fullscreenElement]);
      }
    },
    element: {
      enumerable: true,
      get: function get() {
        return document[fn.fullscreenElement];
      }
    },
    isEnabled: {
      enumerable: true,
      get: function get() {
        return Boolean(document[fn.fullscreenEnabled]);
      }
    }
  });
  return screenfull2;
}
var defaultOptions = {
  role: "viewer",
  autoPlayMuted: true,
  allowedDrift: 0.3,
  maxAllowedDrift: 1,
  minCheckInterval: 0.1,
  maxRateAdjustment: 0.2,
  maxTimeToCatchUp: 1
};
var TimingSrcConnector = /* @__PURE__ */ function(_EventTarget) {
  _inherits(TimingSrcConnector2, _EventTarget);
  var _super = _createSuper(TimingSrcConnector2);
  function TimingSrcConnector2(_player, timingObject) {
    var _this;
    var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var logger = arguments.length > 3 ? arguments[3] : void 0;
    _classCallCheck(this, TimingSrcConnector2);
    _this = _super.call(this);
    _defineProperty(_assertThisInitialized(_this), "logger", void 0);
    _defineProperty(_assertThisInitialized(_this), "speedAdjustment", 0);
    _defineProperty(_assertThisInitialized(_this), "adjustSpeed", /* @__PURE__ */ function() {
      var _ref = _asyncToGenerator(/* @__PURE__ */ _regeneratorRuntime().mark(function _callee(player, newAdjustment) {
        var newPlaybackRate;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1)
            switch (_context.prev = _context.next) {
              case 0:
                if (!(_this.speedAdjustment === newAdjustment)) {
                  _context.next = 2;
                  break;
                }
                return _context.abrupt("return");
              case 2:
                _context.next = 4;
                return player.getPlaybackRate();
              case 4:
                _context.t0 = _context.sent;
                _context.t1 = _this.speedAdjustment;
                _context.t2 = _context.t0 - _context.t1;
                _context.t3 = newAdjustment;
                newPlaybackRate = _context.t2 + _context.t3;
                _this.log("New playbackRate:  ".concat(newPlaybackRate));
                _context.next = 12;
                return player.setPlaybackRate(newPlaybackRate);
              case 12:
                _this.speedAdjustment = newAdjustment;
              case 13:
              case "end":
                return _context.stop();
            }
        }, _callee);
      }));
      return function(_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }());
    _this.logger = logger;
    _this.init(timingObject, _player, _objectSpread2(_objectSpread2({}, defaultOptions), options));
    return _this;
  }
  _createClass(TimingSrcConnector2, [{
    key: "disconnect",
    value: function disconnect() {
      this.dispatchEvent(new Event("disconnect"));
    }
    /**
     * @param {TimingObject} timingObject
     * @param {PlayerControls} player
     * @param {TimingSrcConnectorOptions} options
     * @return {Promise<void>}
     */
  }, {
    key: "init",
    value: function() {
      var _init = _asyncToGenerator(/* @__PURE__ */ _regeneratorRuntime().mark(function _callee2(timingObject, player, options) {
        var _this2 = this;
        var playerUpdater, positionSync, timingObjectUpdater;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1)
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.waitForTOReadyState(timingObject, "open");
              case 2:
                if (!(options.role === "viewer")) {
                  _context2.next = 10;
                  break;
                }
                _context2.next = 5;
                return this.updatePlayer(timingObject, player, options);
              case 5:
                playerUpdater = subscribe(timingObject, "change", function() {
                  return _this2.updatePlayer(timingObject, player, options);
                });
                positionSync = this.maintainPlaybackPosition(timingObject, player, options);
                this.addEventListener("disconnect", function() {
                  positionSync.cancel();
                  playerUpdater.cancel();
                });
                _context2.next = 14;
                break;
              case 10:
                _context2.next = 12;
                return this.updateTimingObject(timingObject, player);
              case 12:
                timingObjectUpdater = subscribe(player, ["seeked", "play", "pause", "ratechange"], function() {
                  return _this2.updateTimingObject(timingObject, player);
                }, "on", "off");
                this.addEventListener("disconnect", function() {
                  return timingObjectUpdater.cancel();
                });
              case 14:
              case "end":
                return _context2.stop();
            }
        }, _callee2, this);
      }));
      function init(_x3, _x4, _x5) {
        return _init.apply(this, arguments);
      }
      return init;
    }()
    /**
     * Sets the TimingObject's state to reflect that of the player
     *
     * @param {TimingObject} timingObject
     * @param {PlayerControls} player
     * @return {Promise<void>}
     */
  }, {
    key: "updateTimingObject",
    value: function() {
      var _updateTimingObject = _asyncToGenerator(/* @__PURE__ */ _regeneratorRuntime().mark(function _callee3(timingObject, player) {
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1)
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.t0 = timingObject;
                _context3.next = 3;
                return player.getCurrentTime();
              case 3:
                _context3.t1 = _context3.sent;
                _context3.next = 6;
                return player.getPaused();
              case 6:
                if (!_context3.sent) {
                  _context3.next = 10;
                  break;
                }
                _context3.t2 = 0;
                _context3.next = 13;
                break;
              case 10:
                _context3.next = 12;
                return player.getPlaybackRate();
              case 12:
                _context3.t2 = _context3.sent;
              case 13:
                _context3.t3 = _context3.t2;
                _context3.t4 = {
                  position: _context3.t1,
                  velocity: _context3.t3
                };
                _context3.t0.update.call(_context3.t0, _context3.t4);
              case 16:
              case "end":
                return _context3.stop();
            }
        }, _callee3);
      }));
      function updateTimingObject(_x6, _x7) {
        return _updateTimingObject.apply(this, arguments);
      }
      return updateTimingObject;
    }()
    /**
     * Sets the player's timing state to reflect that of the TimingObject
     *
     * @param {TimingObject} timingObject
     * @param {PlayerControls} player
     * @param {TimingSrcConnectorOptions} options
     * @return {Promise<void>}
     */
  }, {
    key: "updatePlayer",
    value: function() {
      var _updatePlayer = _asyncToGenerator(/* @__PURE__ */ _regeneratorRuntime().mark(function _callee5(timingObject, player, options) {
        var _timingObject$query, position, velocity;
        return _regeneratorRuntime().wrap(function _callee5$(_context5) {
          while (1)
            switch (_context5.prev = _context5.next) {
              case 0:
                _timingObject$query = timingObject.query(), position = _timingObject$query.position, velocity = _timingObject$query.velocity;
                if (typeof position === "number") {
                  player.setCurrentTime(position);
                }
                if (!(typeof velocity === "number")) {
                  _context5.next = 25;
                  break;
                }
                if (!(velocity === 0)) {
                  _context5.next = 11;
                  break;
                }
                _context5.next = 6;
                return player.getPaused();
              case 6:
                _context5.t0 = _context5.sent;
                if (!(_context5.t0 === false)) {
                  _context5.next = 9;
                  break;
                }
                player.pause();
              case 9:
                _context5.next = 25;
                break;
              case 11:
                if (!(velocity > 0)) {
                  _context5.next = 25;
                  break;
                }
                _context5.next = 14;
                return player.getPaused();
              case 14:
                _context5.t1 = _context5.sent;
                if (!(_context5.t1 === true)) {
                  _context5.next = 19;
                  break;
                }
                _context5.next = 18;
                return player.play().catch(/* @__PURE__ */ function() {
                  var _ref2 = _asyncToGenerator(/* @__PURE__ */ _regeneratorRuntime().mark(function _callee4(err) {
                    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
                      while (1)
                        switch (_context4.prev = _context4.next) {
                          case 0:
                            if (!(err.name === "NotAllowedError" && options.autoPlayMuted)) {
                              _context4.next = 5;
                              break;
                            }
                            _context4.next = 3;
                            return player.setMuted(true);
                          case 3:
                            _context4.next = 5;
                            return player.play().catch(function(err2) {
                              return console.error("Couldn't play the video from TimingSrcConnector. Error:", err2);
                            });
                          case 5:
                          case "end":
                            return _context4.stop();
                        }
                    }, _callee4);
                  }));
                  return function(_x11) {
                    return _ref2.apply(this, arguments);
                  };
                }());
              case 18:
                this.updatePlayer(timingObject, player, options);
              case 19:
                _context5.next = 21;
                return player.getPlaybackRate();
              case 21:
                _context5.t2 = _context5.sent;
                _context5.t3 = velocity;
                if (!(_context5.t2 !== _context5.t3)) {
                  _context5.next = 25;
                  break;
                }
                player.setPlaybackRate(velocity);
              case 25:
              case "end":
                return _context5.stop();
            }
        }, _callee5, this);
      }));
      function updatePlayer(_x8, _x9, _x10) {
        return _updatePlayer.apply(this, arguments);
      }
      return updatePlayer;
    }()
    /**
     * Since video players do not play with 100% time precision, we need to closely monitor
     * our player to be sure it remains in sync with the TimingObject.
     *
     * If out of sync, we use the current conditions and the options provided to determine
     * whether to re-sync via setting currentTime or adjusting the playbackRate
     *
     * @param {TimingObject} timingObject
     * @param {PlayerControls} player
     * @param {TimingSrcConnectorOptions} options
     * @return {{cancel: (function(): void)}}
     */
  }, {
    key: "maintainPlaybackPosition",
    value: function maintainPlaybackPosition(timingObject, player, options) {
      var _this3 = this;
      var allowedDrift = options.allowedDrift, maxAllowedDrift = options.maxAllowedDrift, minCheckInterval = options.minCheckInterval, maxRateAdjustment = options.maxRateAdjustment, maxTimeToCatchUp = options.maxTimeToCatchUp;
      var syncInterval = Math.min(maxTimeToCatchUp, Math.max(minCheckInterval, maxAllowedDrift)) * 1e3;
      var check = /* @__PURE__ */ function() {
        var _ref3 = _asyncToGenerator(/* @__PURE__ */ _regeneratorRuntime().mark(function _callee6() {
          var diff, diffAbs, min, max, adjustment;
          return _regeneratorRuntime().wrap(function _callee6$(_context6) {
            while (1)
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.t0 = timingObject.query().velocity === 0;
                  if (_context6.t0) {
                    _context6.next = 6;
                    break;
                  }
                  _context6.next = 4;
                  return player.getPaused();
                case 4:
                  _context6.t1 = _context6.sent;
                  _context6.t0 = _context6.t1 === true;
                case 6:
                  if (!_context6.t0) {
                    _context6.next = 8;
                    break;
                  }
                  return _context6.abrupt("return");
                case 8:
                  _context6.t2 = timingObject.query().position;
                  _context6.next = 11;
                  return player.getCurrentTime();
                case 11:
                  _context6.t3 = _context6.sent;
                  diff = _context6.t2 - _context6.t3;
                  diffAbs = Math.abs(diff);
                  _this3.log("Drift: ".concat(diff));
                  if (!(diffAbs > maxAllowedDrift)) {
                    _context6.next = 22;
                    break;
                  }
                  _context6.next = 18;
                  return _this3.adjustSpeed(player, 0);
                case 18:
                  player.setCurrentTime(timingObject.query().position);
                  _this3.log("Resync by currentTime");
                  _context6.next = 29;
                  break;
                case 22:
                  if (!(diffAbs > allowedDrift)) {
                    _context6.next = 29;
                    break;
                  }
                  min = diffAbs / maxTimeToCatchUp;
                  max = maxRateAdjustment;
                  adjustment = min < max ? (max - min) / 2 : max;
                  _context6.next = 28;
                  return _this3.adjustSpeed(player, adjustment * Math.sign(diff));
                case 28:
                  _this3.log("Resync by playbackRate");
                case 29:
                case "end":
                  return _context6.stop();
              }
          }, _callee6);
        }));
        return function check2() {
          return _ref3.apply(this, arguments);
        };
      }();
      var interval = setInterval(function() {
        return check();
      }, syncInterval);
      return {
        cancel: function cancel() {
          return clearInterval(interval);
        }
      };
    }
    /**
     * @param {string} msg
     */
  }, {
    key: "log",
    value: function log(msg) {
      var _this$logger;
      (_this$logger = this.logger) === null || _this$logger === void 0 ? void 0 : _this$logger.call(this, "TimingSrcConnector: ".concat(msg));
    }
  }, {
    key: "waitForTOReadyState",
    value: (
      /**
       * @param {TimingObject} timingObject
       * @param {TConnectionState} state
       * @return {Promise<void>}
       */
      function waitForTOReadyState(timingObject, state) {
        return new Promise(function(resolve) {
          var check = function check2() {
            if (timingObject.readyState === state) {
              resolve();
            } else {
              timingObject.addEventListener("readystatechange", check2, {
                once: true
              });
            }
          };
          check();
        });
      }
    )
  }]);
  return TimingSrcConnector2;
}(/* @__PURE__ */ _wrapNativeSuper(EventTarget));
var playerMap = /* @__PURE__ */ new WeakMap();
var readyMap = /* @__PURE__ */ new WeakMap();
var screenfull = {};
var Player = /* @__PURE__ */ function() {
  function Player2(element) {
    var _this = this;
    var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    _classCallCheck(this, Player2);
    if (window.jQuery && element instanceof jQuery) {
      if (element.length > 1 && window.console && console.warn) {
        console.warn("A jQuery object with multiple elements was passed, using the first element.");
      }
      element = element[0];
    }
    if (typeof document !== "undefined" && typeof element === "string") {
      element = document.getElementById(element);
    }
    if (!isDomElement(element)) {
      throw new TypeError("You must pass either a valid element or a valid id.");
    }
    if (element.nodeName !== "IFRAME") {
      var iframe = element.querySelector("iframe");
      if (iframe) {
        element = iframe;
      }
    }
    if (element.nodeName === "IFRAME" && !isVimeoUrl(element.getAttribute("src") || "")) {
      throw new Error("The player element passed isn’t a Vimeo embed.");
    }
    if (playerMap.has(element)) {
      return playerMap.get(element);
    }
    this._window = element.ownerDocument.defaultView;
    this.element = element;
    this.origin = "*";
    var readyPromise = new npo_src(function(resolve, reject) {
      _this._onMessage = function(event) {
        if (!isVimeoUrl(event.origin) || _this.element.contentWindow !== event.source) {
          return;
        }
        if (_this.origin === "*") {
          _this.origin = event.origin;
        }
        var data = parseMessageData(event.data);
        var isError = data && data.event === "error";
        var isReadyError = isError && data.data && data.data.method === "ready";
        if (isReadyError) {
          var error = new Error(data.data.message);
          error.name = data.data.name;
          reject(error);
          return;
        }
        var isReadyEvent = data && data.event === "ready";
        var isPingResponse = data && data.method === "ping";
        if (isReadyEvent || isPingResponse) {
          _this.element.setAttribute("data-ready", "true");
          resolve();
          return;
        }
        processData(_this, data);
      };
      _this._window.addEventListener("message", _this._onMessage);
      if (_this.element.nodeName !== "IFRAME") {
        var params = getOEmbedParameters(element, options);
        var url = getVimeoUrl(params);
        getOEmbedData(url, params, element).then(function(data) {
          var iframe2 = createEmbed(data, element);
          _this.element = iframe2;
          _this._originalElement = element;
          swapCallbacks(element, iframe2);
          playerMap.set(_this.element, _this);
          return data;
        }).catch(reject);
      }
    });
    readyMap.set(this, readyPromise);
    playerMap.set(this.element, this);
    if (this.element.nodeName === "IFRAME") {
      postMessage(this, "ping");
    }
    if (screenfull.isEnabled) {
      var exitFullscreen = function exitFullscreen2() {
        return screenfull.exit();
      };
      this.fullscreenchangeHandler = function() {
        if (screenfull.isFullscreen) {
          storeCallback(_this, "event:exitFullscreen", exitFullscreen);
        } else {
          removeCallback(_this, "event:exitFullscreen", exitFullscreen);
        }
        _this.ready().then(function() {
          postMessage(_this, "fullscreenchange", screenfull.isFullscreen);
        });
      };
      screenfull.on("fullscreenchange", this.fullscreenchangeHandler);
    }
    return this;
  }
  _createClass(Player2, [{
    key: "callMethod",
    value: function callMethod(name) {
      var _this2 = this;
      var args = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      return new npo_src(function(resolve, reject) {
        return _this2.ready().then(function() {
          storeCallback(_this2, name, {
            resolve,
            reject
          });
          postMessage(_this2, name, args);
        }).catch(reject);
      });
    }
    /**
     * Get a promise for the value of a player property.
     *
     * @param {string} name The property name
     * @return {Promise}
     */
  }, {
    key: "get",
    value: function get(name) {
      var _this3 = this;
      return new npo_src(function(resolve, reject) {
        name = getMethodName(name, "get");
        return _this3.ready().then(function() {
          storeCallback(_this3, name, {
            resolve,
            reject
          });
          postMessage(_this3, name);
        }).catch(reject);
      });
    }
    /**
     * Get a promise for setting the value of a player property.
     *
     * @param {string} name The API method to call.
     * @param {mixed} value The value to set.
     * @return {Promise}
     */
  }, {
    key: "set",
    value: function set(name, value) {
      var _this4 = this;
      return new npo_src(function(resolve, reject) {
        name = getMethodName(name, "set");
        if (value === void 0 || value === null) {
          throw new TypeError("There must be a value to set.");
        }
        return _this4.ready().then(function() {
          storeCallback(_this4, name, {
            resolve,
            reject
          });
          postMessage(_this4, name, value);
        }).catch(reject);
      });
    }
    /**
     * Add an event listener for the specified event. Will call the
     * callback with a single parameter, `data`, that contains the data for
     * that event.
     *
     * @param {string} eventName The name of the event.
     * @param {function(*)} callback The function to call when the event fires.
     * @return {void}
     */
  }, {
    key: "on",
    value: function on2(eventName, callback) {
      if (!eventName) {
        throw new TypeError("You must pass an event name.");
      }
      if (!callback) {
        throw new TypeError("You must pass a callback function.");
      }
      if (typeof callback !== "function") {
        throw new TypeError("The callback must be a function.");
      }
      var callbacks = getCallbacks(this, "event:".concat(eventName));
      if (callbacks.length === 0) {
        this.callMethod("addEventListener", eventName).catch(function() {
        });
      }
      storeCallback(this, "event:".concat(eventName), callback);
    }
    /**
     * Remove an event listener for the specified event. Will remove all
     * listeners for that event if a `callback` isn’t passed, or only that
     * specific callback if it is passed.
     *
     * @param {string} eventName The name of the event.
     * @param {function} [callback] The specific callback to remove.
     * @return {void}
     */
  }, {
    key: "off",
    value: function off2(eventName, callback) {
      if (!eventName) {
        throw new TypeError("You must pass an event name.");
      }
      if (callback && typeof callback !== "function") {
        throw new TypeError("The callback must be a function.");
      }
      var lastCallback = removeCallback(this, "event:".concat(eventName), callback);
      if (lastCallback) {
        this.callMethod("removeEventListener", eventName).catch(function(e) {
        });
      }
    }
    /**
     * A promise to load a new video.
     *
     * @promise LoadVideoPromise
     * @fulfill {number} The video with this id or url successfully loaded.
     * @reject {TypeError} The id was not a number.
     */
    /**
     * Load a new video into this embed. The promise will be resolved if
     * the video is successfully loaded, or it will be rejected if it could
     * not be loaded.
     *
     * @param {number|string|object} options The id of the video, the url of the video, or an object with embed options.
     * @return {LoadVideoPromise}
     */
  }, {
    key: "loadVideo",
    value: function loadVideo(options) {
      return this.callMethod("loadVideo", options);
    }
    /**
     * A promise to perform an action when the Player is ready.
     *
     * @todo document errors
     * @promise LoadVideoPromise
     * @fulfill {void}
     */
    /**
     * Trigger a function when the player iframe has initialized. You do not
     * need to wait for `ready` to trigger to begin adding event listeners
     * or calling other methods.
     *
     * @return {ReadyPromise}
     */
  }, {
    key: "ready",
    value: function ready() {
      var readyPromise = readyMap.get(this) || new npo_src(function(resolve, reject) {
        reject(new Error("Unknown player. Probably unloaded."));
      });
      return npo_src.resolve(readyPromise);
    }
    /**
     * A promise to add a cue point to the player.
     *
     * @promise AddCuePointPromise
     * @fulfill {string} The id of the cue point to use for removeCuePoint.
     * @reject {RangeError} the time was less than 0 or greater than the
     *         video’s duration.
     * @reject {UnsupportedError} Cue points are not supported with the current
     *         player or browser.
     */
    /**
     * Add a cue point to the player.
     *
     * @param {number} time The time for the cue point.
     * @param {object} [data] Arbitrary data to be returned with the cue point.
     * @return {AddCuePointPromise}
     */
  }, {
    key: "addCuePoint",
    value: function addCuePoint(time) {
      var data = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
      return this.callMethod("addCuePoint", {
        time,
        data
      });
    }
    /**
     * A promise to remove a cue point from the player.
     *
     * @promise AddCuePointPromise
     * @fulfill {string} The id of the cue point that was removed.
     * @reject {InvalidCuePoint} The cue point with the specified id was not
     *         found.
     * @reject {UnsupportedError} Cue points are not supported with the current
     *         player or browser.
     */
    /**
     * Remove a cue point from the video.
     *
     * @param {string} id The id of the cue point to remove.
     * @return {RemoveCuePointPromise}
     */
  }, {
    key: "removeCuePoint",
    value: function removeCuePoint(id) {
      return this.callMethod("removeCuePoint", id);
    }
    /**
     * A representation of a text track on a video.
     *
     * @typedef {Object} VimeoTextTrack
     * @property {string} language The ISO language code.
     * @property {string} kind The kind of track it is (captions or subtitles).
     * @property {string} label The human‐readable label for the track.
     */
    /**
     * A promise to enable a text track.
     *
     * @promise EnableTextTrackPromise
     * @fulfill {VimeoTextTrack} The text track that was enabled.
     * @reject {InvalidTrackLanguageError} No track was available with the
     *         specified language.
     * @reject {InvalidTrackError} No track was available with the specified
     *         language and kind.
     */
    /**
     * Enable the text track with the specified language, and optionally the
     * specified kind (captions or subtitles).
     *
     * When set via the API, the track language will not change the viewer’s
     * stored preference.
     *
     * @param {string} language The two‐letter language code.
     * @param {string} [kind] The kind of track to enable (captions or subtitles).
     * @return {EnableTextTrackPromise}
     */
  }, {
    key: "enableTextTrack",
    value: function enableTextTrack(language, kind) {
      if (!language) {
        throw new TypeError("You must pass a language.");
      }
      return this.callMethod("enableTextTrack", {
        language,
        kind
      });
    }
    /**
     * A promise to disable the active text track.
     *
     * @promise DisableTextTrackPromise
     * @fulfill {void} The track was disabled.
     */
    /**
     * Disable the currently-active text track.
     *
     * @return {DisableTextTrackPromise}
     */
  }, {
    key: "disableTextTrack",
    value: function disableTextTrack() {
      return this.callMethod("disableTextTrack");
    }
    /**
     * A promise to pause the video.
     *
     * @promise PausePromise
     * @fulfill {void} The video was paused.
     */
    /**
     * Pause the video if it’s playing.
     *
     * @return {PausePromise}
     */
  }, {
    key: "pause",
    value: function pause() {
      return this.callMethod("pause");
    }
    /**
     * A promise to play the video.
     *
     * @promise PlayPromise
     * @fulfill {void} The video was played.
     */
    /**
     * Play the video if it’s paused. **Note:** on iOS and some other
     * mobile devices, you cannot programmatically trigger play. Once the
     * viewer has tapped on the play button in the player, however, you
     * will be able to use this function.
     *
     * @return {PlayPromise}
     */
  }, {
    key: "play",
    value: function play() {
      return this.callMethod("play");
    }
    /**
     * Request that the player enters fullscreen.
     * @return {Promise}
     */
  }, {
    key: "requestFullscreen",
    value: function requestFullscreen() {
      if (screenfull.isEnabled) {
        return screenfull.request(this.element);
      }
      return this.callMethod("requestFullscreen");
    }
    /**
     * Request that the player exits fullscreen.
     * @return {Promise}
     */
  }, {
    key: "exitFullscreen",
    value: function exitFullscreen() {
      if (screenfull.isEnabled) {
        return screenfull.exit();
      }
      return this.callMethod("exitFullscreen");
    }
    /**
     * Returns true if the player is currently fullscreen.
     * @return {Promise}
     */
  }, {
    key: "getFullscreen",
    value: function getFullscreen() {
      if (screenfull.isEnabled) {
        return npo_src.resolve(screenfull.isFullscreen);
      }
      return this.get("fullscreen");
    }
    /**
     * Request that the player enters picture-in-picture.
     * @return {Promise}
     */
  }, {
    key: "requestPictureInPicture",
    value: function requestPictureInPicture() {
      return this.callMethod("requestPictureInPicture");
    }
    /**
     * Request that the player exits picture-in-picture.
     * @return {Promise}
     */
  }, {
    key: "exitPictureInPicture",
    value: function exitPictureInPicture() {
      return this.callMethod("exitPictureInPicture");
    }
    /**
     * Returns true if the player is currently picture-in-picture.
     * @return {Promise}
     */
  }, {
    key: "getPictureInPicture",
    value: function getPictureInPicture() {
      return this.get("pictureInPicture");
    }
    /**
     * A promise to prompt the viewer to initiate remote playback.
     *
     * @promise RemotePlaybackPromptPromise
     * @fulfill {void}
     * @reject {NotFoundError} No remote playback device is available.
     */
    /**
     * Request to prompt the user to initiate remote playback.
     *
     * @return {RemotePlaybackPromptPromise}
     */
  }, {
    key: "remotePlaybackPrompt",
    value: function remotePlaybackPrompt() {
      return this.callMethod("remotePlaybackPrompt");
    }
    /**
     * A promise to unload the video.
     *
     * @promise UnloadPromise
     * @fulfill {void} The video was unloaded.
     */
    /**
     * Return the player to its initial state.
     *
     * @return {UnloadPromise}
     */
  }, {
    key: "unload",
    value: function unload() {
      return this.callMethod("unload");
    }
    /**
     * Cleanup the player and remove it from the DOM
     *
     * It won't be usable and a new one should be constructed
     *  in order to do any operations.
     *
     * @return {Promise}
     */
  }, {
    key: "destroy",
    value: function destroy() {
      var _this5 = this;
      return new npo_src(function(resolve) {
        readyMap.delete(_this5);
        playerMap.delete(_this5.element);
        if (_this5._originalElement) {
          playerMap.delete(_this5._originalElement);
          _this5._originalElement.removeAttribute("data-vimeo-initialized");
        }
        if (_this5.element && _this5.element.nodeName === "IFRAME" && _this5.element.parentNode) {
          if (_this5.element.parentNode.parentNode && _this5._originalElement && _this5._originalElement !== _this5.element.parentNode) {
            _this5.element.parentNode.parentNode.removeChild(_this5.element.parentNode);
          } else {
            _this5.element.parentNode.removeChild(_this5.element);
          }
        }
        if (_this5.element && _this5.element.nodeName === "DIV" && _this5.element.parentNode) {
          _this5.element.removeAttribute("data-vimeo-initialized");
          var iframe = _this5.element.querySelector("iframe");
          if (iframe && iframe.parentNode) {
            if (iframe.parentNode.parentNode && _this5._originalElement && _this5._originalElement !== iframe.parentNode) {
              iframe.parentNode.parentNode.removeChild(iframe.parentNode);
            } else {
              iframe.parentNode.removeChild(iframe);
            }
          }
        }
        _this5._window.removeEventListener("message", _this5._onMessage);
        if (screenfull.isEnabled) {
          screenfull.off("fullscreenchange", _this5.fullscreenchangeHandler);
        }
        resolve();
      });
    }
    /**
     * A promise to get the autopause behavior of the video.
     *
     * @promise GetAutopausePromise
     * @fulfill {boolean} Whether autopause is turned on or off.
     * @reject {UnsupportedError} Autopause is not supported with the current
     *         player or browser.
     */
    /**
     * Get the autopause behavior for this player.
     *
     * @return {GetAutopausePromise}
     */
  }, {
    key: "getAutopause",
    value: function getAutopause() {
      return this.get("autopause");
    }
    /**
     * A promise to set the autopause behavior of the video.
     *
     * @promise SetAutopausePromise
     * @fulfill {boolean} Whether autopause is turned on or off.
     * @reject {UnsupportedError} Autopause is not supported with the current
     *         player or browser.
     */
    /**
     * Enable or disable the autopause behavior of this player.
     *
     * By default, when another video is played in the same browser, this
     * player will automatically pause. Unless you have a specific reason
     * for doing so, we recommend that you leave autopause set to the
     * default (`true`).
     *
     * @param {boolean} autopause
     * @return {SetAutopausePromise}
     */
  }, {
    key: "setAutopause",
    value: function setAutopause(autopause) {
      return this.set("autopause", autopause);
    }
    /**
     * A promise to get the buffered property of the video.
     *
     * @promise GetBufferedPromise
     * @fulfill {Array} Buffered Timeranges converted to an Array.
     */
    /**
     * Get the buffered property of the video.
     *
     * @return {GetBufferedPromise}
     */
  }, {
    key: "getBuffered",
    value: function getBuffered() {
      return this.get("buffered");
    }
    /**
     * @typedef {Object} CameraProperties
     * @prop {number} props.yaw - Number between 0 and 360.
     * @prop {number} props.pitch - Number between -90 and 90.
     * @prop {number} props.roll - Number between -180 and 180.
     * @prop {number} props.fov - The field of view in degrees.
     */
    /**
     * A promise to get the camera properties of the player.
     *
     * @promise GetCameraPromise
     * @fulfill {CameraProperties} The camera properties.
     */
    /**
     * For 360° videos get the camera properties for this player.
     *
     * @return {GetCameraPromise}
     */
  }, {
    key: "getCameraProps",
    value: function getCameraProps() {
      return this.get("cameraProps");
    }
    /**
     * A promise to set the camera properties of the player.
     *
     * @promise SetCameraPromise
     * @fulfill {Object} The camera was successfully set.
     * @reject {RangeError} The range was out of bounds.
     */
    /**
     * For 360° videos set the camera properties for this player.
     *
     * @param {CameraProperties} camera The camera properties
     * @return {SetCameraPromise}
     */
  }, {
    key: "setCameraProps",
    value: function setCameraProps(camera) {
      return this.set("cameraProps", camera);
    }
    /**
     * A representation of a chapter.
     *
     * @typedef {Object} VimeoChapter
     * @property {number} startTime The start time of the chapter.
     * @property {object} title The title of the chapter.
     * @property {number} index The place in the order of Chapters. Starts at 1.
     */
    /**
     * A promise to get chapters for the video.
     *
     * @promise GetChaptersPromise
     * @fulfill {VimeoChapter[]} The chapters for the video.
     */
    /**
     * Get an array of all the chapters for the video.
     *
     * @return {GetChaptersPromise}
     */
  }, {
    key: "getChapters",
    value: function getChapters() {
      return this.get("chapters");
    }
    /**
     * A promise to get the currently active chapter.
     *
     * @promise GetCurrentChaptersPromise
     * @fulfill {VimeoChapter|undefined} The current chapter for the video.
     */
    /**
     * Get the currently active chapter for the video.
     *
     * @return {GetCurrentChaptersPromise}
     */
  }, {
    key: "getCurrentChapter",
    value: function getCurrentChapter() {
      return this.get("currentChapter");
    }
    /**
     * A promise to get the accent color of the player.
     *
     * @promise GetColorPromise
     * @fulfill {string} The hex color of the player.
     */
    /**
     * Get the accent color for this player. Note this is deprecated in place of `getColorTwo`.
     *
     * @return {GetColorPromise}
     */
  }, {
    key: "getColor",
    value: function getColor() {
      return this.get("color");
    }
    /**
     * A promise to get all colors for the player in an array.
     *
     * @promise GetColorsPromise
     * @fulfill {string[]} The hex colors of the player.
     */
    /**
     * Get all the colors for this player in an array: [colorOne, colorTwo, colorThree, colorFour]
     *
     * @return {GetColorPromise}
     */
  }, {
    key: "getColors",
    value: function getColors() {
      return npo_src.all([this.get("colorOne"), this.get("colorTwo"), this.get("colorThree"), this.get("colorFour")]);
    }
    /**
     * A promise to set the accent color of the player.
     *
     * @promise SetColorPromise
     * @fulfill {string} The color was successfully set.
     * @reject {TypeError} The string was not a valid hex or rgb color.
     * @reject {ContrastError} The color was set, but the contrast is
     *         outside of the acceptable range.
     * @reject {EmbedSettingsError} The owner of the player has chosen to
     *         use a specific color.
     */
    /**
     * Set the accent color of this player to a hex or rgb string. Setting the
     * color may fail if the owner of the video has set their embed
     * preferences to force a specific color.
     * Note this is deprecated in place of `setColorTwo`.
     *
     * @param {string} color The hex or rgb color string to set.
     * @return {SetColorPromise}
     */
  }, {
    key: "setColor",
    value: function setColor(color) {
      return this.set("color", color);
    }
    /**
     * A promise to set all colors for the player.
     *
     * @promise SetColorsPromise
     * @fulfill {string[]} The colors were successfully set.
     * @reject {TypeError} The string was not a valid hex or rgb color.
     * @reject {ContrastError} The color was set, but the contrast is
     *         outside of the acceptable range.
     * @reject {EmbedSettingsError} The owner of the player has chosen to
     *         use a specific color.
     */
    /**
     * Set the colors of this player to a hex or rgb string. Setting the
     * color may fail if the owner of the video has set their embed
     * preferences to force a specific color.
     * The colors should be passed in as an array: [colorOne, colorTwo, colorThree, colorFour].
     * If a color should not be set, the index in the array can be left as null.
     *
     * @param {string[]} colors Array of the hex or rgb color strings to set.
     * @return {SetColorsPromise}
     */
  }, {
    key: "setColors",
    value: function setColors(colors) {
      if (!Array.isArray(colors)) {
        return new npo_src(function(resolve, reject) {
          return reject(new TypeError("Argument must be an array."));
        });
      }
      var nullPromise = new npo_src(function(resolve) {
        return resolve(null);
      });
      var colorPromises = [colors[0] ? this.set("colorOne", colors[0]) : nullPromise, colors[1] ? this.set("colorTwo", colors[1]) : nullPromise, colors[2] ? this.set("colorThree", colors[2]) : nullPromise, colors[3] ? this.set("colorFour", colors[3]) : nullPromise];
      return npo_src.all(colorPromises);
    }
    /**
     * A representation of a cue point.
     *
     * @typedef {Object} VimeoCuePoint
     * @property {number} time The time of the cue point.
     * @property {object} data The data passed when adding the cue point.
     * @property {string} id The unique id for use with removeCuePoint.
     */
    /**
     * A promise to get the cue points of a video.
     *
     * @promise GetCuePointsPromise
     * @fulfill {VimeoCuePoint[]} The cue points added to the video.
     * @reject {UnsupportedError} Cue points are not supported with the current
     *         player or browser.
     */
    /**
     * Get an array of the cue points added to the video.
     *
     * @return {GetCuePointsPromise}
     */
  }, {
    key: "getCuePoints",
    value: function getCuePoints() {
      return this.get("cuePoints");
    }
    /**
     * A promise to get the current time of the video.
     *
     * @promise GetCurrentTimePromise
     * @fulfill {number} The current time in seconds.
     */
    /**
     * Get the current playback position in seconds.
     *
     * @return {GetCurrentTimePromise}
     */
  }, {
    key: "getCurrentTime",
    value: function getCurrentTime() {
      return this.get("currentTime");
    }
    /**
     * A promise to set the current time of the video.
     *
     * @promise SetCurrentTimePromise
     * @fulfill {number} The actual current time that was set.
     * @reject {RangeError} the time was less than 0 or greater than the
     *         video’s duration.
     */
    /**
     * Set the current playback position in seconds. If the player was
     * paused, it will remain paused. Likewise, if the player was playing,
     * it will resume playing once the video has buffered.
     *
     * You can provide an accurate time and the player will attempt to seek
     * to as close to that time as possible. The exact time will be the
     * fulfilled value of the promise.
     *
     * @param {number} currentTime
     * @return {SetCurrentTimePromise}
     */
  }, {
    key: "setCurrentTime",
    value: function setCurrentTime(currentTime) {
      return this.set("currentTime", currentTime);
    }
    /**
     * A promise to get the duration of the video.
     *
     * @promise GetDurationPromise
     * @fulfill {number} The duration in seconds.
     */
    /**
     * Get the duration of the video in seconds. It will be rounded to the
     * nearest second before playback begins, and to the nearest thousandth
     * of a second after playback begins.
     *
     * @return {GetDurationPromise}
     */
  }, {
    key: "getDuration",
    value: function getDuration() {
      return this.get("duration");
    }
    /**
     * A promise to get the ended state of the video.
     *
     * @promise GetEndedPromise
     * @fulfill {boolean} Whether or not the video has ended.
     */
    /**
     * Get the ended state of the video. The video has ended if
     * `currentTime === duration`.
     *
     * @return {GetEndedPromise}
     */
  }, {
    key: "getEnded",
    value: function getEnded() {
      return this.get("ended");
    }
    /**
     * A promise to get the loop state of the player.
     *
     * @promise GetLoopPromise
     * @fulfill {boolean} Whether or not the player is set to loop.
     */
    /**
     * Get the loop state of the player.
     *
     * @return {GetLoopPromise}
     */
  }, {
    key: "getLoop",
    value: function getLoop() {
      return this.get("loop");
    }
    /**
     * A promise to set the loop state of the player.
     *
     * @promise SetLoopPromise
     * @fulfill {boolean} The loop state that was set.
     */
    /**
     * Set the loop state of the player. When set to `true`, the player
     * will start over immediately once playback ends.
     *
     * @param {boolean} loop
     * @return {SetLoopPromise}
     */
  }, {
    key: "setLoop",
    value: function setLoop(loop2) {
      return this.set("loop", loop2);
    }
    /**
     * A promise to set the muted state of the player.
     *
     * @promise SetMutedPromise
     * @fulfill {boolean} The muted state that was set.
     */
    /**
     * Set the muted state of the player. When set to `true`, the player
     * volume will be muted.
     *
     * @param {boolean} muted
     * @return {SetMutedPromise}
     */
  }, {
    key: "setMuted",
    value: function setMuted(muted) {
      return this.set("muted", muted);
    }
    /**
     * A promise to get the muted state of the player.
     *
     * @promise GetMutedPromise
     * @fulfill {boolean} Whether or not the player is muted.
     */
    /**
     * Get the muted state of the player.
     *
     * @return {GetMutedPromise}
     */
  }, {
    key: "getMuted",
    value: function getMuted() {
      return this.get("muted");
    }
    /**
     * A promise to get the paused state of the player.
     *
     * @promise GetLoopPromise
     * @fulfill {boolean} Whether or not the video is paused.
     */
    /**
     * Get the paused state of the player.
     *
     * @return {GetLoopPromise}
     */
  }, {
    key: "getPaused",
    value: function getPaused() {
      return this.get("paused");
    }
    /**
     * A promise to get the playback rate of the player.
     *
     * @promise GetPlaybackRatePromise
     * @fulfill {number} The playback rate of the player on a scale from 0 to 2.
     */
    /**
     * Get the playback rate of the player on a scale from `0` to `2`.
     *
     * @return {GetPlaybackRatePromise}
     */
  }, {
    key: "getPlaybackRate",
    value: function getPlaybackRate() {
      return this.get("playbackRate");
    }
    /**
     * A promise to set the playbackrate of the player.
     *
     * @promise SetPlaybackRatePromise
     * @fulfill {number} The playback rate was set.
     * @reject {RangeError} The playback rate was less than 0 or greater than 2.
     */
    /**
     * Set the playback rate of the player on a scale from `0` to `2`. When set
     * via the API, the playback rate will not be synchronized to other
     * players or stored as the viewer's preference.
     *
     * @param {number} playbackRate
     * @return {SetPlaybackRatePromise}
     */
  }, {
    key: "setPlaybackRate",
    value: function setPlaybackRate(playbackRate) {
      return this.set("playbackRate", playbackRate);
    }
    /**
     * A promise to get the played property of the video.
     *
     * @promise GetPlayedPromise
     * @fulfill {Array} Played Timeranges converted to an Array.
     */
    /**
     * Get the played property of the video.
     *
     * @return {GetPlayedPromise}
     */
  }, {
    key: "getPlayed",
    value: function getPlayed() {
      return this.get("played");
    }
    /**
     * A promise to get the qualities available of the current video.
     *
     * @promise GetQualitiesPromise
     * @fulfill {Array} The qualities of the video.
     */
    /**
     * Get the qualities of the current video.
     *
     * @return {GetQualitiesPromise}
     */
  }, {
    key: "getQualities",
    value: function getQualities() {
      return this.get("qualities");
    }
    /**
     * A promise to get the current set quality of the video.
     *
     * @promise GetQualityPromise
     * @fulfill {string} The current set quality.
     */
    /**
     * Get the current set quality of the video.
     *
     * @return {GetQualityPromise}
     */
  }, {
    key: "getQuality",
    value: function getQuality() {
      return this.get("quality");
    }
    /**
     * A promise to set the video quality.
     *
     * @promise SetQualityPromise
     * @fulfill {number} The quality was set.
     * @reject {RangeError} The quality is not available.
     */
    /**
     * Set a video quality.
     *
     * @param {string} quality
     * @return {SetQualityPromise}
     */
  }, {
    key: "setQuality",
    value: function setQuality(quality) {
      return this.set("quality", quality);
    }
    /**
     * A promise to get the remote playback availability.
     *
     * @promise RemotePlaybackAvailabilityPromise
     * @fulfill {boolean} Whether remote playback is available.
     */
    /**
     * Get the availability of remote playback.
     *
     * @return {RemotePlaybackAvailabilityPromise}
     */
  }, {
    key: "getRemotePlaybackAvailability",
    value: function getRemotePlaybackAvailability() {
      return this.get("remotePlaybackAvailability");
    }
    /**
     * A promise to get the current remote playback state.
     *
     * @promise RemotePlaybackStatePromise
     * @fulfill {string} The state of the remote playback: connecting, connected, or disconnected.
     */
    /**
     * Get the current remote playback state.
     *
     * @return {RemotePlaybackStatePromise}
     */
  }, {
    key: "getRemotePlaybackState",
    value: function getRemotePlaybackState() {
      return this.get("remotePlaybackState");
    }
    /**
     * A promise to get the seekable property of the video.
     *
     * @promise GetSeekablePromise
     * @fulfill {Array} Seekable Timeranges converted to an Array.
     */
    /**
     * Get the seekable property of the video.
     *
     * @return {GetSeekablePromise}
     */
  }, {
    key: "getSeekable",
    value: function getSeekable() {
      return this.get("seekable");
    }
    /**
     * A promise to get the seeking property of the player.
     *
     * @promise GetSeekingPromise
     * @fulfill {boolean} Whether or not the player is currently seeking.
     */
    /**
     * Get if the player is currently seeking.
     *
     * @return {GetSeekingPromise}
     */
  }, {
    key: "getSeeking",
    value: function getSeeking() {
      return this.get("seeking");
    }
    /**
     * A promise to get the text tracks of a video.
     *
     * @promise GetTextTracksPromise
     * @fulfill {VimeoTextTrack[]} The text tracks associated with the video.
     */
    /**
     * Get an array of the text tracks that exist for the video.
     *
     * @return {GetTextTracksPromise}
     */
  }, {
    key: "getTextTracks",
    value: function getTextTracks() {
      return this.get("textTracks");
    }
    /**
     * A promise to get the embed code for the video.
     *
     * @promise GetVideoEmbedCodePromise
     * @fulfill {string} The `<iframe>` embed code for the video.
     */
    /**
     * Get the `<iframe>` embed code for the video.
     *
     * @return {GetVideoEmbedCodePromise}
     */
  }, {
    key: "getVideoEmbedCode",
    value: function getVideoEmbedCode() {
      return this.get("videoEmbedCode");
    }
    /**
     * A promise to get the id of the video.
     *
     * @promise GetVideoIdPromise
     * @fulfill {number} The id of the video.
     */
    /**
     * Get the id of the video.
     *
     * @return {GetVideoIdPromise}
     */
  }, {
    key: "getVideoId",
    value: function getVideoId() {
      return this.get("videoId");
    }
    /**
     * A promise to get the title of the video.
     *
     * @promise GetVideoTitlePromise
     * @fulfill {number} The title of the video.
     */
    /**
     * Get the title of the video.
     *
     * @return {GetVideoTitlePromise}
     */
  }, {
    key: "getVideoTitle",
    value: function getVideoTitle() {
      return this.get("videoTitle");
    }
    /**
     * A promise to get the native width of the video.
     *
     * @promise GetVideoWidthPromise
     * @fulfill {number} The native width of the video.
     */
    /**
     * Get the native width of the currently‐playing video. The width of
     * the highest‐resolution available will be used before playback begins.
     *
     * @return {GetVideoWidthPromise}
     */
  }, {
    key: "getVideoWidth",
    value: function getVideoWidth() {
      return this.get("videoWidth");
    }
    /**
     * A promise to get the native height of the video.
     *
     * @promise GetVideoHeightPromise
     * @fulfill {number} The native height of the video.
     */
    /**
     * Get the native height of the currently‐playing video. The height of
     * the highest‐resolution available will be used before playback begins.
     *
     * @return {GetVideoHeightPromise}
     */
  }, {
    key: "getVideoHeight",
    value: function getVideoHeight() {
      return this.get("videoHeight");
    }
    /**
     * A promise to get the vimeo.com url for the video.
     *
     * @promise GetVideoUrlPromise
     * @fulfill {number} The vimeo.com url for the video.
     * @reject {PrivacyError} The url isn’t available because of the video’s privacy setting.
     */
    /**
     * Get the vimeo.com url for the video.
     *
     * @return {GetVideoUrlPromise}
     */
  }, {
    key: "getVideoUrl",
    value: function getVideoUrl() {
      return this.get("videoUrl");
    }
    /**
     * A promise to get the volume level of the player.
     *
     * @promise GetVolumePromise
     * @fulfill {number} The volume level of the player on a scale from 0 to 1.
     */
    /**
     * Get the current volume level of the player on a scale from `0` to `1`.
     *
     * Most mobile devices do not support an independent volume from the
     * system volume. In those cases, this method will always return `1`.
     *
     * @return {GetVolumePromise}
     */
  }, {
    key: "getVolume",
    value: function getVolume() {
      return this.get("volume");
    }
    /**
     * A promise to set the volume level of the player.
     *
     * @promise SetVolumePromise
     * @fulfill {number} The volume was set.
     * @reject {RangeError} The volume was less than 0 or greater than 1.
     */
    /**
     * Set the volume of the player on a scale from `0` to `1`. When set
     * via the API, the volume level will not be synchronized to other
     * players or stored as the viewer’s preference.
     *
     * Most mobile devices do not support setting the volume. An error will
     * *not* be triggered in that situation.
     *
     * @param {number} volume
     * @return {SetVolumePromise}
     */
  }, {
    key: "setVolume",
    value: function setVolume(volume) {
      return this.set("volume", volume);
    }
    /** @typedef {import('./lib/timing-object.types').TimingObject} TimingObject */
    /** @typedef {import('./lib/timing-src-connector.types').TimingSrcConnectorOptions} TimingSrcConnectorOptions */
    /** @typedef {import('./lib/timing-src-connector').TimingSrcConnector} TimingSrcConnector */
    /**
     * Connects a TimingObject to the video player (https://webtiming.github.io/timingobject/)
     *
     * @param {TimingObject} timingObject
     * @param {TimingSrcConnectorOptions} options
     *
     * @return {Promise<TimingSrcConnector>}
     */
  }, {
    key: "setTimingSrc",
    value: function() {
      var _setTimingSrc = _asyncToGenerator(/* @__PURE__ */ _regeneratorRuntime().mark(function _callee(timingObject, options) {
        var _this6 = this;
        var connector;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1)
            switch (_context.prev = _context.next) {
              case 0:
                if (timingObject) {
                  _context.next = 2;
                  break;
                }
                throw new TypeError("A Timing Object must be provided.");
              case 2:
                _context.next = 4;
                return this.ready();
              case 4:
                connector = new TimingSrcConnector(this, timingObject, options);
                postMessage(this, "notifyTimingObjectConnect");
                connector.addEventListener("disconnect", function() {
                  return postMessage(_this6, "notifyTimingObjectDisconnect");
                });
                return _context.abrupt("return", connector);
              case 8:
              case "end":
                return _context.stop();
            }
        }, _callee, this);
      }));
      function setTimingSrc(_x, _x2) {
        return _setTimingSrc.apply(this, arguments);
      }
      return setTimingSrc;
    }()
  }]);
  return Player2;
}();
if (!isNode) {
  screenfull = initializeScreenfull();
  initializeEmbeds();
  resizeEmbeds();
  initAppendVideoMetadata();
  checkUrlTimeParam();
}
const selectors = {
  wrapper: ".js-video-wrapper"
};
const initPlayersMap = {
  youtube: initYoutubePlayer,
  vimeo: initVimeoPlayer
};
function createLazyPlayer(videoWrapper, options, type, placeholder) {
  const wrapper = videoWrapper.closest(selectors.wrapper);
  const initFunction = initPlayersMap[type];
  if (!initFunction) {
    throw new Error(`Invalid type sent to createLazyPlayer. Expected 'youtube' | 'vimeo', got '${type}'`);
  }
  if (!wrapper) {
    return initFunction(videoWrapper, options);
  }
  const player = { ...placeholder };
  wrapper.addEventListener("click", () => {
    const result = initFunction(videoWrapper, options);
    if (type === "vimeo") {
      player.play = () => result.play();
      player.pause = () => result.pause();
      player.on = (...args) => result.on(...args);
      if (videoWrapper.checkVisibility()) {
        player.play();
      }
      return;
    }
    Object.assign(player, result);
    if (videoWrapper.checkVisibility()) {
      player.playVideo();
    }
  }, { once: true });
  return player;
}
function initYoutubePlayer(videoWrapper, options, isLazy) {
  const placeholder = {
    playVideo: () => {
    },
    pauseVideo: () => {
    },
    mute: () => {
    }
  };
  if (isLazy) {
    return createLazyPlayer(videoWrapper, options, "youtube", placeholder);
  }
  const defaultOptions2 = {
    autoplay: 0,
    controls: 0,
    showinfo: 0,
    rel: 0,
    playsinline: 1
  };
  const settings = { ...defaultOptions2, ...options };
  const player = YouTubePlayer(videoWrapper, {
    videoId: videoWrapper.dataset.videoId,
    playerVars: {
      ...settings,
      playlist: videoWrapper.dataset.videoId
    }
  });
  player.setPlaybackQuality("hd720");
  return player;
}
function initVimeoPlayer(videoWrapper, options, isLazy) {
  const placeholder = {
    play: () => {
    },
    pause: () => {
    },
    on: () => {
    }
  };
  if (isLazy) {
    return createLazyPlayer(videoWrapper, options, "vimeo", placeholder);
  }
  const defaultOptions2 = {
    controls: true,
    muted: true,
    autopause: false
  };
  const settings = { ...defaultOptions2, ...options };
  return new Player(videoWrapper, {
    id: videoWrapper.dataset.videoId,
    ...settings
  });
}
const Video = ({ videoContainer, options }) => {
  const VIDEO_TYPES2 = window.themeCore.utils.VIDEO_TYPES;
  const selectors2 = {
    videoElement: ".js-video",
    nodeToSetYoutubeIframe: ".js-video-youtube",
    lazy: "[data-lazy]"
  };
  const attributes2 = {
    lazy: "data-lazy"
  };
  function createVideos(videoContainer2) {
    const videoElements = [
      ...videoContainer2.querySelectorAll(selectors2.videoElement)
    ];
    return videoElements.map((videoElement) => {
      const { type, device } = videoElement.dataset;
      return {
        device,
        type,
        videoWrapper: videoElement,
        player: initPlayer(videoElement, type)
      };
    });
  }
  function initPlayer(videoElement, type) {
    const isLazy = videoElement.hasAttribute(attributes2.lazy);
    switch (type) {
      case VIDEO_TYPES2.html: {
        return videoElement;
      }
      case VIDEO_TYPES2.vimeo: {
        return initVimeoPlayer(videoElement, options && options.vimeo, isLazy);
      }
      case VIDEO_TYPES2.youtube: {
        const nodeToSetYoutubeIframe = videoElement.querySelector(
          selectors2.nodeToSetYoutubeIframe
        );
        return initYoutubePlayer(
          nodeToSetYoutubeIframe,
          options && options.youtube,
          isLazy
        );
      }
      default:
        return;
    }
  }
  function init() {
    try {
      return createVideos(videoContainer);
    } catch (e) {
      console.error(new Error("Could not find video container"));
    }
  }
  return Object.freeze({
    init
  });
};
function themeEditorEvents() {
  const events2 = [
    "shopify:block:select",
    "shopify:block:deselect"
  ];
  function init() {
    events2.forEach((eventName) => {
      document.addEventListener(eventName, (event) => {
        window.themeCore.EventBus.emit(eventName, event);
      });
    });
  }
  init();
}
const DOMContentLoadedPromise = new Promise((resolve) => {
  document.addEventListener("DOMContentLoaded", async () => {
    window.theme = window.theme || {};
    window.themeCore = window.themeCore || {};
    window.themeCore.libs = window.themeCore.libs || {};
    window.themeCore.utils = window.themeCore.utils || {};
    window.themeCore.sections = {};
    window.themeCore.externalUtils = {};
    window.themeCore.utils.bodyScrollLock = bodyScrollLock;
    Swiper.use([A11y, Pagination, Navigation, Thumb, Zoom, Grid, Mousewheel]);
    window.themeCore.utils.Swiper = Swiper;
    window.themeCore.utils.swiperA11y = A11y;
    window.themeCore.utils.swiperPagination = Pagination;
    window.themeCore.utils.swiperZoom = Zoom;
    window.themeCore.utils.ProductForm = ProductForm;
    window.themeCore.utils.getUrlWithVariant = getUrlWithVariant;
    window.themeCore.utils.overlay = overlay;
    window.themeCore.utils.images = images();
    window.themeCore.utils.cssClasses = cssClasses;
    window.themeCore.utils.extendDefaults = extendDefaults;
    window.themeCore.utils.on = on;
    window.themeCore.utils.off = off;
    window.themeCore.utils.isElementInViewport = isElementInViewport;
    window.themeCore.utils.formToJSON = formToJSON;
    window.themeCore.utils.arrayIncludes = arrayIncludes;
    window.themeCore.utils.convertFormData = convertFormData;
    window.themeCore.utils.throttle = throttle;
    window.themeCore.utils.debounce = debounce;
    window.themeCore.utils.icons = icons;
    window.themeCore.utils.isElement = isElement;
    window.themeCore.utils.focusable = focusable;
    window.themeCore.utils.updateTabindexOnElement = updateTabindexOnElement;
    window.themeCore.utils.removeTrapFocusShadowRoot = removeTrapFocusShadowRoot;
    window.themeCore.utils.removeTrapFocus = removeTrapFocus;
    window.themeCore.utils.handleTabulationOnSlides = handleTabulationOnSlides;
    window.themeCore.utils.handleTabulationOnSlidesWithMultipleVisibleSlides = handleTabulationOnSlidesWithMultipleVisibleSlides;
    window.themeCore.utils.parseJSONfromMarkup = parseJSONfromMarkup;
    window.themeCore.utils.trapFocus = trapFocus;
    window.themeCore.utils.isIosDevice = isIosDevice;
    window.themeCore.utils.bind = bind;
    window.themeCore.utils.formatMoney = formatMoney;
    window.themeCore.utils.setCookie = setCookie;
    window.themeCore.utils.getCookie = getCookie;
    window.themeCore.utils.deleteCookie = deleteCookie;
    window.themeCore.utils.VIDEO_TYPES = VIDEO_TYPES;
    window.themeCore.utils.register = register;
    window.themeCore.utils.registerExternalUtil = registerExternalUtil;
    window.themeCore.utils.getExternalUtil = getExternalUtil;
    window.themeCore.utils.QuantityWidget = QuantityWidget;
    window.themeCore.utils.Preloder = Preloder;
    window.themeCore.utils.Toggle = Toggle;
    window.themeCore.utils.Timer = Timer;
    window.themeCore.utils.Video = Video;
    window.themeCore.EventBus = window.themeCore.EventBus || EventBus();
    window.themeCore.Accordion = window.themeCore.Accordion || Accordion();
    window.themeCore.Popover = window.themeCore.Popover || Popover();
    window.themeCore.BackToTop = window.themeCore.BackToTop || BackToTop();
    window.themeCore.ProductCard = window.themeCore.ProductCard || ProductCard();
    window.themeCore.QuickView = window.themeCore.QuickView || QuickView();
    window.themeCore.ScrollDirection = window.themeCore.ScrollDirection || ScrollDirection();
    window.themeCore.LocalizationForm = window.themeCore.LocalizationForm || localizationForm;
    window.themeCore.CartApi = window.themeCore.CartApi || CartApi();
    window.themeCore.Challenge = window.themeCore.Challenge || Challenge();
    window.themeCore.AddToCart = window.themeCore.AddToCart || AddToCart();
    window.themeCore.ShareButton = window.themeCore.ShareButton || ShareButton();
    window.themeCore.Challenge.init();
    window.themeCore.ProductCard.init();
    window.themeCore.QuickView.init();
    window.themeCore.Accordion.init();
    window.themeCore.ScrollDirection.init();
    window.themeCore.LocalizationForm.init;
    window.themeCore.AddToCart.init();
    window.themeCore.ShareButton.init();
    window.themeCore.Popover.init();
    window.themeCore.BackToTop.init();
    if (window.Shopify.designMode) {
      themeEditorEvents();
    }
    resolve();
  });
});
(async () => {
  const selectors2 = {
    script: "script[src]",
    appBlock: ".shopify-app-block",
    section: (id) => `#shopify-section-${id}`,
    shopifySection: ".shopify-section"
  };
  const attributes2 = {
    sectionData: "data-shopify-editor-section"
  };
  const sectionsToRerenderByType = [
    "age-popup-check",
    "announcement-bar",
    "blog-template",
    "cart-template",
    "cart-drawer",
    "collection-template",
    "cookie-bar",
    "header",
    "newsletter-popup",
    "password-header",
    "product-promo-popup",
    "search-template",
    "article-template",
    "recently-viewed"
  ];
  try {
    await Promise.resolve(DOMContentLoadedPromise);
    const getLoadedScripts = () => {
      return [...document.querySelectorAll(selectors2.script)];
    };
    let loadedScripts = getLoadedScripts();
    const getNewLoadedScripts = () => {
      return getLoadedScripts().filter((script) => !loadedScripts.includes(script));
    };
    const addScripts = (scripts) => {
      scripts.forEach((script) => {
        const element = document.createElement("script");
        element.setAttribute("type", script.getAttribute("type"));
        element.setAttribute("src", script.getAttribute("src"));
        document.body.append(element);
      });
      loadedScripts = [...loadedScripts, ...scripts];
    };
    const rewriteElementsExcept = (parent, exceptSelector) => {
      const hasAppBlock = `:has(${exceptSelector})`;
      const appBlockOrParent = `${hasAppBlock}, ${exceptSelector}`;
      Array.from(parent.children).forEach((element) => {
        if (!element.matches(appBlockOrParent)) {
          const newElement = element.cloneNode(true);
          element.parentNode.replaceChild(newElement, element);
        }
      });
      const elementsWithAppBlocks = Array.from(parent.children).filter((element) => element.matches(hasAppBlock));
      elementsWithAppBlocks.forEach((element) => rewriteElementsExcept(element, exceptSelector));
    };
    const removePageBlur = (type) => {
      const blurTargets = {
        "age-check-popup": ["AgeCheckPopupToggle"],
        "newsletter-popup": ["NewsletterPopupToggle"],
        "cart-drawer": ["CartDrawer"],
        "header": ["headerToggleMenuDrawer"],
        "pickup-availability": ["productAvailability-"],
        "password-header": ["password-popup"],
        "predictive-search": ["searchToggleDrawer"],
        "product": ["descriptionDrawer-", "productDrawer1-", "productDrawer2-", "productDrawer3-", "productSizeGuideDrawer-"],
        "featured-product": ["descriptionDrawer-", "productDrawer1-", "productDrawer2-", "productDrawer3-", "productSizeGuideDrawer-"],
        "collection-template": ["filterMenuDrawer", "filterMenuToggler"],
        "search-template": ["filterMenuDrawer", "filterMenuToggler"]
      };
      const createSelector = (array) => array.map((item) => `[data-js-overlay^="${item}"]`).join(", ");
      const overlays = blurTargets[type];
      if (overlays) {
        const popupOverlays = [...document.querySelectorAll(createSelector(overlays))];
        if (!popupOverlays.length) {
          return;
        }
        document.body.style.overflow = "";
        popupOverlays.forEach((overlay2) => overlay2.remove());
      }
    };
    const getSectionData = (element) => {
      try {
        return JSON.parse(element.getAttribute(attributes2.sectionData));
      } catch (error) {
        console.log("Error trying to parse section data: ", error, " element: ", element);
        return null;
      }
    };
    const getSectionTypeFromId = (sectionId) => {
      var _a;
      const section = document.querySelector(selectors2.section(sectionId));
      if (!section) {
        return null;
      }
      return ((_a = getSectionData(section)) == null ? void 0 : _a.type) ?? null;
    };
    const rewriteSections = ({ method, type, sectionId }) => {
      if (Shopify.visualPreviewMode) {
        return;
      }
      const selector = method === "type" ? selectors2.shopifySection : selectors2.section(sectionId);
      const sections = [...document.querySelectorAll(selector)];
      const appropriateSections = sections.filter((section) => {
        try {
          const sectionData = JSON.parse(section.getAttribute(attributes2.sectionData));
          return sectionData.type === type;
        } catch {
          return false;
        }
      });
      appropriateSections.forEach((section) => rewriteElementsExcept(section, selectors2.appBlock));
    };
    const reinitGlobalComponents = () => {
      window.themeCore.initAnimateObserver();
      window.themeCore.Accordion.init();
    };
    const customizerChangesHandler = (e) => {
      var _a;
      addScripts(getNewLoadedScripts());
      const sectionId = (_a = e.detail) == null ? void 0 : _a.sectionId;
      if (!sectionId) {
        return;
      }
      const type = getSectionTypeFromId(sectionId);
      if (!type) {
        return;
      }
      removePageBlur(type);
      let eventOptions = {};
      if (sectionsToRerenderByType.includes(type)) {
        rewriteSections({ method: "type", type });
      } else {
        rewriteSections({ method: "id", type, sectionId });
        eventOptions = { detail: { sectionId, type } };
      }
      delete window.themeCore.sections[type];
      reinitGlobalComponents();
      document.dispatchEvent(new CustomEvent("theme:customizer:loaded", eventOptions));
    };
    document.addEventListener("shopify:section:load", customizerChangesHandler);
    document.addEventListener(
      "shopify:section:unload",
      (e) => {
        var _a;
        addScripts(getNewLoadedScripts());
        const sectionId = (_a = e.detail) == null ? void 0 : _a.sectionId;
        if (!sectionId) {
          return;
        }
        const type = getSectionTypeFromId(sectionId);
        if (!type) {
          return;
        }
        removePageBlur(type);
        if (type === "newsletter-popup") {
          window.themeCore.EventBus.emit("destroy:newsletter:popup");
        }
      }
    );
    document.dispatchEvent(new CustomEvent("theme:all:loaded"));
    window.themeCore.loaded = true;
    let resizeTimer;
    window.addEventListener(
      "resize",
      function() {
        document.body.classList.add("no-transition");
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          document.body.classList.remove("no-transition");
        }, 300);
      },
      {
        passive: true
      }
    );
  } catch (error) {
    console.error(error);
  }
})();
