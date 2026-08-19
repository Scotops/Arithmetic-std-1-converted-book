/* Make every image caption part of the standard read-aloud sequence. */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#content img[data-id]").forEach((image) => {
    const id = image.getAttribute("data-id");
    if (!id || image.nextElementSibling?.matches(`.adt-image-caption[data-id="${id}"]`)) return;
    const caption = document.createElement("span");
    caption.className = "sr-only adt-image-caption";
    caption.setAttribute("data-id", id);
    image.insertAdjacentElement("afterend", caption);
  });
});
