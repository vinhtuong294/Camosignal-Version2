type DragCallbacks = {
  onStart: () => void;
  onEnd: (state: { dragged: boolean; startScrollLeft: number }) => void;
};

export function enableHorizontalDrag(
  scroller: HTMLElement,
  { onStart, onEnd }: DragCallbacks,
) {
  let pointerId: number | undefined;
  let startX = 0;
  let startScrollLeft = 0;
  let dragged = false;
  let suppressClick = false;
  let clickTimer: ReturnType<typeof setTimeout> | undefined;

  const releasePointer = () => {
    const activePointerId = pointerId;
    pointerId = undefined;
    if (
      activePointerId !== undefined &&
      scroller.hasPointerCapture?.(activePointerId)
    ) {
      scroller.releasePointerCapture(activePointerId);
    }
  };
  const finishDrag = (event: PointerEvent) => {
    if (pointerId === undefined || event.pointerId !== pointerId) return;
    releasePointer();
    // Start the settling animation before allowing CSS snap to resume.
    onEnd({ dragged, startScrollLeft });
    scroller.classList.remove("is-dragging");
    if (dragged) {
      suppressClick = true;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        suppressClick = false;
      }, 0);
    }
  };
  const startDrag = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if ((event.target as Element).closest("button, input, select, textarea"))
      return;
    scroller.classList.add("is-dragging");
    onStart();
    pointerId = event.pointerId;
    startX = event.clientX;
    startScrollLeft = scroller.scrollLeft;
    dragged = false;
  };
  const moveDrag = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    const distance = event.clientX - startX;
    if (!dragged && Math.abs(distance) > 4) {
      dragged = true;
      scroller.setPointerCapture?.(pointerId!);
    }
    if (!dragged) return;
    event.preventDefault();
    scroller.scrollLeft = startScrollLeft - distance;
  };
  const preventNativeDrag = (event: Event) => event.preventDefault();
  const preventDraggedClick = (event: Event) => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  };
  scroller.addEventListener("pointerdown", startDrag);
  scroller.addEventListener("pointermove", moveDrag);
  scroller.addEventListener("pointerup", finishDrag);
  scroller.addEventListener("pointercancel", finishDrag);
  scroller.addEventListener("lostpointercapture", finishDrag);
  scroller.addEventListener("dragstart", preventNativeDrag);
  scroller.addEventListener("click", preventDraggedClick, true);
  return () => {
    scroller.removeEventListener("pointerdown", startDrag);
    scroller.removeEventListener("pointermove", moveDrag);
    scroller.removeEventListener("pointerup", finishDrag);
    scroller.removeEventListener("pointercancel", finishDrag);
    scroller.removeEventListener("lostpointercapture", finishDrag);
    scroller.removeEventListener("dragstart", preventNativeDrag);
    scroller.removeEventListener("click", preventDraggedClick, true);
    clearTimeout(clickTimer);
    releasePointer();
    scroller.classList.remove("is-dragging");
  };
}
