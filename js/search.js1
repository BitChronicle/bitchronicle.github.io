let fuse;
let data = [];

fetch("/index.json")
  .then(r => r.json())
  .then(list => {
    data = list;
    fuse = new Fuse(list, {
      keys: ["title", "tags", "categories"],
      threshold: 0.3
    });
  });

document.addEventListener("click", e => {
  if (!e.target.closest(".search-icon")) return;
  setTimeout(bindSearch, 100); // 等 FixIt 打开搜索框
});

function bindSearch() {
  const input = document.querySelector(".search-input input");
  const panel = document.querySelector(".search-result");

  if (!input || !panel || !fuse) return;

  input.addEventListener("input", () => {
    const q = input.value.trim();
    if (!q) {
      panel.innerHTML = "";
      return;
    }

    const results = fuse.search(q).slice(0, 20);

    panel.innerHTML = results.map(r => {
      const p = r.item;
      return `<div class="search-item">
        <a href="${p.url}">${p.title}</a>
      </div>`;
    }).join("");
  });
}
