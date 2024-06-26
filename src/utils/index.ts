export function scrollIntoView(element: Element): void {
  element.scrollIntoView({
    behavior: "smooth",
    block: "end",
    inline: "nearest",
  });
}

export function scrollToLastChild(element: Element): void {
  setTimeout(() => {
    const lastChild = element.lastElementChild;
    if (lastChild) {
      scrollIntoView(lastChild);
    }
  }, 0);
}
