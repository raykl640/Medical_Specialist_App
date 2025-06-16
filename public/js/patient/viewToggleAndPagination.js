// viewToggleAndPagination.js

export function setupViewToggle(toggleContainerId, renderFunction, defaultView = "card") {
  const container = document.getElementById(toggleContainerId);
  const tableBtn = container.querySelector('button[data-view="table"]');
  const cardBtn = container.querySelector('button[data-view="cards"]');
  let viewMode = defaultView;

  function updateView(newMode) {
    viewMode = newMode;
    renderFunction(viewMode);
  }

  tableBtn.addEventListener("click", () => updateView("table"));
  cardBtn.addEventListener("click", () => updateView("card"));

  return () => viewMode; // getter
}



export function paginate(data, pageSize, pageNumber) {
  const start = (pageNumber - 1) * pageSize;
  return data.slice(start, start + pageSize);
}

export function setupPaginationControls(containerId, totalItems, itemsPerPage, onPageChange) {
  const container = document.getElementById(containerId);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  container.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.addEventListener("click", () => onPageChange(i));
    container.appendChild(btn);
  }
} 
