/* Make every image caption part of the standard read-aloud sequence. */
document.addEventListener("DOMContentLoaded", () => {
  const content = document.querySelector("#content");
  if (!content) return;

  // Remove prior per-instance image caption nodes, then add one caption for
  // each distinct image. The reader must not narrate repeated pictures twice.
  content.querySelectorAll(".sr-only[data-id*='_im']").forEach((node) => node.remove());

  const narrated = new Set();
  content.querySelectorAll("img[data-id]").forEach((image) => {
    const id = image.getAttribute("data-id");
    if (!id) return;
    image.removeAttribute("data-id");
    if (narrated.has(id)) return;
    narrated.add(id);

    const caption = document.createElement("span");
    caption.className = "sr-only adt-image-caption";
    caption.setAttribute("data-id", id);
    image.insertAdjacentElement("afterend", caption);
  });
});
