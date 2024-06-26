import { type RefObject, useEffect } from "react";

export const useTextareaAutoHeight = (
  ref: RefObject<HTMLTextAreaElement>,
  options?: {
    minHeight?: number;
    lineHeight?: number;
    padding?: number;
    border?: number;
  }
) => {
  const {
    minHeight = 20,
    lineHeight = 20,
    padding = 8,
    border = 0,
  } = options || {};
  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    const listener = () => {
      const numberOfLineBreaks = (textarea.value.match(/\n/g) || []).length;
      // min-height + lines x line-height + padding + border
      const newHeight =
        minHeight + numberOfLineBreaks * lineHeight + padding + border;
      textarea.style.height = `${newHeight}px`;
    };
    textarea.addEventListener("input", listener);

    return () => {
      textarea.removeEventListener("input", listener);
    };
  }, [border, lineHeight, minHeight, padding, ref]);
};
