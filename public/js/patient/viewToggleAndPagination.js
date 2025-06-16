// viewToggleAndPagination.js

export function setupViewToggle(toggleContainerId, renderFunction, defaultView = "table") {
  const container = document.getElementById(toggleContainerId);
  if (!container) return () => defaultView;

  const tableBtn = container.querySelector('button[data-view="table"]');
  const cardBtn = container.querySelector('button[data-view="cards"]');
  if (!tableBtn || !cardBtn) return () => defaultView;

  let viewMode = defaultView;

  function updateView(newMode) {
    viewMode = newMode;
    renderFunction(viewMode);

    // Update active styling
    if (newMode === "table") {
      tableBtn.classList.add("active");
      cardBtn.classList.remove("active");
    } else {
      cardBtn.classList.add("active");
      tableBtn.classList.remove("active");
    }
  }

  // Initial state
  updateView(viewMode);

  // Add click handlers
  tableBtn.addEventListener("click", () => updateView("table"));
  cardBtn.addEventListener("click", () => updateView("card"));

  return () => viewMode;
}

export function paginate(data, pageSize, pageNumber) {
  if (!Array.isArray(data)) return [];
  const start = (pageNumber - 1) * pageSize;
  return data.slice(start, start + pageSize);
}

export function setupPaginationControls(containerId, totalItems, itemsPerPage, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '';

  // Previous button
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "Previous";
  prevBtn.disabled = true;
  prevBtn.addEventListener("click", () => {
    const currentPage = parseInt(container.querySelector(".active")?.textContent || "1");
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  });
  container.appendChild(prevBtn);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === 1) btn.classList.add("active");
    btn.addEventListener("click", () => {
      container.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      onPageChange(i);
    });
    container.appendChild(btn);
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Next";
  nextBtn.disabled = totalPages === 1;
  nextBtn.addEventListener("click", () => {
    const currentPage = parseInt(container.querySelector(".active")?.textContent || "1");
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  });
  container.appendChild(nextBtn);
} 
