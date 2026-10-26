
/*
 * Center-HP-Renewal-Demo
 * 閲覧画面の処理
 */

(() => {
  "use strict";

  const dataApi = window.CenterPortalData;

  if (!dataApi) {
    console.error("共通データが読み込まれていません。");
    return;
  }

  let data = dataApi.loadData();
let currentCategory = "全体";
  let currentDetailId = null;

  const categoryButtons = document.querySelectorAll(".category-button");
  const contentTitle = document.getElementById("contentTitle");
  const detailCategoryList = document.getElementById("detailCategoryList");

  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const searchResultsList = document.getElementById("searchResultsList");

  const materialDetail = document.getElementById("materialDetail");
  const newsList = document.getElementById("newsList");
  const historyList = document.getElementById("historyList");

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entities[character];
    });
  }

  function getCategory(categoryIdOrName) {
    return data.categories.find(
      (category) =>
        category.id === categoryIdOrName ||
        category.name === categoryIdOrName
    );
  }

  function getVisibleMaterials() {
    return data.materials.filter((material) => !material.hidden);
  }

  function hideSearchResults() {
    searchResults.hidden = true;
    searchResultsList.innerHTML = "";
  }

  function hideMaterialDetail() {
    materialDetail.hidden = true;
    materialDetail.innerHTML = "";
  }

  function renderCategories() {
    const category = getCategory(currentCategory);

    contentTitle.textContent = category ? category.name : "業務情報";

    categoryButtons.forEach((button) => {
      const isActive = button.dataset.category === currentCategory;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    detailCategoryList.innerHTML = "";
    detailCategoryList.classList.remove("is-material-list");

    if (!category || category.details.length === 0) {
      detailCategoryList.innerHTML =
        '<p class="empty-message">表示できるカテゴリーはありません。</p>';
      return;
    }

    category.details.forEach((detail) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "detail-category-button";
      button.dataset.detailId = detail.id;

      button.innerHTML = `
        <strong>${escapeHTML(detail.name)}</strong>
        <span class="category-arrow" aria-hidden="true">→</span>
      `;

      button.addEventListener("click", () => {
        renderMaterials(detail.id);
      });

      detailCategoryList.appendChild(button);
    });
  }

  function renderMaterials(detailId) {
    const category = getCategory(currentCategory);

    if (!category) {
      return;
    }

    const detail = category.details.find(
      (item) => item.id === detailId
    );

    if (!detail) {
      return;
    }

    currentDetailId = detailId;
    hideSearchResults();
    hideMaterialDetail();

    const materials = getVisibleMaterials().filter(
      (material) =>
        material.categoryId === category.id &&
        material.detailId === detailId
    );

    detailCategoryList.classList.add("is-material-list");
    detailCategoryList.innerHTML = `
      <div class="material-list-heading">
        <div class="material-list-heading-main">
          <p class="material-list-breadcrumb">${escapeHTML(category.name)} <span aria-hidden="true">/</span> ${escapeHTML(detail.name)}</p>
          <h2>資料一覧</h2>
          <p class="material-list-description">資料を選択すると、内容を確認できます。</p>
        </div>
        <div class="material-list-heading-actions">
          <span class="material-count">${materials.length}件の資料</span>
          <button type="button" class="back-button" id="backToCategories">
            <span aria-hidden="true">←</span> カテゴリー一覧に戻る
          </button>
        </div>
      </div>
      <div class="material-list" id="materialList"></div>
    `;

    document.getElementById("backToCategories").addEventListener("click", () => {
      currentDetailId = null;
      renderCategories();
    });

    const materialList = document.getElementById("materialList");

    if (materials.length === 0) {
      materialList.innerHTML = `
        <div class="material-empty-state">
          <span class="material-empty-icon" aria-hidden="true">資料</span>
          <h3>このカテゴリーには資料がありません</h3>
          <p>カテゴリー一覧に戻り、別のカテゴリーを選択してください。</p>
        </div>
      `;
      return;
    }

    materials.forEach((material) => {
      const item = document.createElement("article");
      item.className = "material-item";

      item.innerHTML = `
        <div class="material-item-info">
          <h3 class="material-item-title">${escapeHTML(material.title)}</h3>
          <div class="material-item-meta">
            <span class="material-type">${escapeHTML(material.type)}</span>
            <span>更新日：${escapeHTML(material.updatedAt)}</span>
          </div>
          <p class="material-item-description">${escapeHTML(material.description)}</p>
        </div>
        <button
          type="button"
          class="material-open-button"
          data-material-id="${escapeHTML(material.id)}"
        >
          資料を開く <span aria-hidden="true">→</span>
        </button>
      `;

      item.querySelector("button").addEventListener("click", () => {
        renderMaterialDetail(material.id);
      });

      materialList.appendChild(item);
    });
  }

  function renderMaterialDetail(materialId) {
    const material = getVisibleMaterials().find(
      (item) => item.id === materialId
    );

    if (!material) {
      return;
    }

    materialDetail.innerHTML = `
      <h2>${escapeHTML(material.title)}</h2>
      <p class="material-item-meta">
        ${escapeHTML(material.type)} ・ 更新日：
        ${escapeHTML(material.updatedAt)}
      </p>
      <div class="material-detail-content">${escapeHTML(material.content)}</div>
      <button type="button" class="back-button" id="closeMaterialDetail">
        資料を閉じる
      </button>
    `;

    materialDetail.hidden = false;

    document.getElementById("closeMaterialDetail").addEventListener("click", () => {
      hideMaterialDetail();
    });

    materialDetail.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function renderSearchResults(
    keyword,
    resultsSection = searchResults,
    resultsContainer = searchResultsList,
    shortcut = ""
  ) {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("ja");

    hideMaterialDetail();
    resultsSection.hidden = false;
    resultsContainer.innerHTML = "";

    if (!normalizedKeyword) {
      resultsContainer.innerHTML =
        '<p class="empty-message">検索キーワードを入力してください。</p>';
      return;
    }

    const results = getVisibleMaterials().filter((material) => {
      const searchableText = [
        material.title,
        material.description,
        material.content,
        material.type,
        material.categoryId,
        getCategory(material.categoryId)?.name
      ]
        .join(" ")
        .toLocaleLowerCase("ja");

      const belongsToShortcut = shortcut &&
        Array.isArray(material.shortcuts) &&
        material.shortcuts.includes(shortcut);

      return belongsToShortcut || searchableText.includes(normalizedKeyword);
    });

    const count = document.createElement("p");
    count.className = "search-result-count";
    count.textContent = `${results.length}件の資料が見つかりました。`;

    resultsContainer.appendChild(count);

    if (results.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-message";
      empty.textContent = "該当する資料はありません。";
      resultsContainer.appendChild(empty);
      return;
    }

    const list = document.createElement("div");
    list.className = "material-list";

    results.forEach((material) => {
      const item = document.createElement("article");
      item.className = "material-item";

      item.innerHTML = `
        <div>
          <p class="material-item-title">${escapeHTML(material.title)}</p>
          <p class="material-item-meta">
            ${escapeHTML(getCategory(material.categoryId)?.name ?? "")}
            ・ ${escapeHTML(material.type)}
          </p>
          <p>${escapeHTML(material.description)}</p>
        </div>
        <button type="button" class="material-open-button">
          資料を開く
        </button>
      `;

      item.querySelector("button").addEventListener("click", () => {
        renderMaterialDetail(material.id);
      });

      list.appendChild(item);
    });

    resultsContainer.appendChild(list);
  }



  function renderAnnouncements() {
    newsList.innerHTML = "";
    const announcementDetail = document.getElementById("announcementDetail");
    announcementDetail.hidden = true;
    announcementDetail.innerHTML = "";

    const visibleAnnouncements = data.announcements.filter(
      (item) => !item.hidden
    );

    if (visibleAnnouncements.length === 0) {
      newsList.innerHTML =
        '<li class="empty-message">現在、お知らせはありません。</li>';
      return;
    }

    visibleAnnouncements.forEach((announcement) => {
      const item = document.createElement("li");


      item.innerHTML = `
        <button
          type="button"
          class="announcement-link"
          data-announcement-id="${escapeHTML(announcement.id)}"
          aria-label="${escapeHTML(announcement.title)}の詳細を表示"
          aria-controls="announcementDetail"
          aria-expanded="false"
        >
          <span class="information-date">${escapeHTML(announcement.date)}</span>
          <span class="announcement-title-row">
            <span class="information-badge">${escapeHTML(announcement.type)}</span>
            <span class="information-title">${escapeHTML(announcement.title)}</span>
          </span>
          <span class="announcement-link-hint" aria-hidden="true">詳細を見る <span>→</span></span>
        </button>
      `;

      const button = item.querySelector("button");

      button.addEventListener("click", () => {
        showAnnouncementDetail(announcement.id, button);
      });

      newsList.appendChild(item);
    });
  }



  function showAnnouncementDetail(announcementId, triggerButton) {
    const announcement = data.announcements.find(
      (item) => item.id === announcementId && !item.hidden
    );

    if (!announcement) {
      return;
    }

    newsList.querySelectorAll(".announcement-link").forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-expanded", "false");
    });

    triggerButton.classList.add("is-selected");
    triggerButton.setAttribute("aria-expanded", "true");

    const detail = document.getElementById("announcementDetail");
    detail.innerHTML = `
      <p class="announcement-detail-label">お知らせの詳細</p>
      <div class="announcement-detail-meta">
        <span class="information-badge">${escapeHTML(announcement.type)}</span>
        <span class="announcement-detail-date">
          掲載日：${escapeHTML(announcement.date)}
        </span>
      </div>
      <h3 id="announcementDetailTitle">${escapeHTML(announcement.title)}</h3>
      <div class="announcement-detail-content"></div>
      <button type="button" class="back-button" id="closeAnnouncementDetail">
        <span aria-hidden="true">←</span> お知らせ一覧に戻る
      </button>
    `;

    detail.querySelector(".announcement-detail-content").textContent =
      announcement.content || "詳細情報はありません。";
    detail.hidden = false;

    detail.querySelector("#closeAnnouncementDetail").addEventListener("click", () => {
      detail.hidden = true;
      detail.innerHTML = "";
      triggerButton.classList.remove("is-selected");
      triggerButton.setAttribute("aria-expanded", "false");
      triggerButton.focus();
    });

    detail.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }


function renderHistory() {
  historyList.innerHTML = "";

  // 今日の日付を YYYY-MM-DD 形式で取得
  const now = new Date();
  const todayString = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");

  // 見出しの日付を更新
 
const yearElement = document.getElementById("dailyYear");
const monthDayElement = document.getElementById("dailyMonthDay");
const title = document.getElementById("dailyAnnouncementsTitle");

if (yearElement) {
  yearElement.textContent = String(now.getFullYear());
}

if (monthDayElement) {
  monthDayElement.textContent =
    `${now.getMonth() + 1}/${now.getDate()}`;
}

if (title) {
  title.textContent = "のお知らせ";
}



  // 今日のメンテナンス・全体連絡だけを取得
  const todayAnnouncements = (data.announcements || []).filter(
    announcement =>
      !announcement.hidden &&
      announcement.date === todayString &&
      ["メンテナンス", "全体連絡"].includes(announcement.type)
  );

  // 対象のお知らせがなければ「なし」と表示
  if (todayAnnouncements.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-message";
    li.textContent = "なし";
    historyList.appendChild(li);
    return;
  }

  // 今日のお知らせを一覧表示
  todayAnnouncements.forEach(announcement => {
    const li = document.createElement("li");

    const type = document.createElement("span");
    type.className = "information-badge";
    type.textContent = announcement.type;

    const title = document.createElement("span");
    title.className = "information-title";
    title.textContent = announcement.title;

    li.appendChild(type);
    li.appendChild(title);

    historyList.appendChild(li);
  });
}


  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentCategory = button.dataset.category;
      currentDetailId = null;

      searchInput.value = "";
      hideSearchResults();
      hideMaterialDetail();
      renderCategories();
    });
  });

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    currentDetailId = null;
    document.querySelectorAll(".shortcut-results").forEach((section) => {
      section.hidden = true;
      section.querySelector(".shortcut-results-list").innerHTML = "";
    });
    renderSearchResults(searchInput.value);
  });

  document.querySelectorAll("[data-shortcut]").forEach((button) => {
    button.addEventListener("click", () => {
      const shortcut = button.dataset.shortcut;
      const keyword = shortcut === "test" ? "テスト" : "ファイル";
      const resultsSection = button
        .closest(".shortcut-item")
        .querySelector(".shortcut-results");
      const resultsContainer = resultsSection.querySelector(
        ".shortcut-results-list"
      );

      searchInput.value = keyword;
      hideSearchResults();
      document.querySelectorAll(".shortcut-results").forEach((section) => {
        if (section !== resultsSection) {
          section.hidden = true;
          section.querySelector(".shortcut-results-list").innerHTML = "";
        }
      });
      renderSearchResults(
        keyword,
        resultsSection,
        resultsContainer,
        shortcut
      );

      resultsSection.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    });
  });

  // 管理者画面でデータが変更された場合に表示を更新する
  window.addEventListener("storage", (event) => {
    if (event.key !== dataApi.STORAGE_KEY && event.key !== null) {
      return;
    }

    data = dataApi.loadData();
    renderCategories();
    renderAnnouncements();
    renderHistory();
  });

  renderCategories();
  renderAnnouncements();
  renderHistory();
})();
