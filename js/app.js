
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
  const pageSize = 10;
  const paginationPages = {};

  // 画面の表示領域を取得し、描画処理とイベント処理で共有する。
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

  // innerHTMLへ埋め込むデータ内のHTML記号を文字列として扱うために変換する。
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

  // カテゴリーIDまたは表示名からデータを検索する。
  function getCategory(categoryIdOrName) {
    return data.categories.find(
      (category) =>
        category.id === categoryIdOrName ||
        category.name === categoryIdOrName
    );
  }

  function getToday() {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");
  }

  // 一覧ごとに独立したページ状態を保ちながら、現在ページ分だけを返す。
  function getPagedItems(items, pageKey) {
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    const page = Math.min(paginationPages[pageKey] ?? 1, pageCount);

    paginationPages[pageKey] = page;

    return items.slice((page - 1) * pageSize, page * pageSize);
  }

  function appendPagination(container, itemCount, pageKey, onPageChange) {
    const pageCount = Math.ceil(itemCount / pageSize);

    if (pageCount <= 1) {
      return;
    }

    const currentPage = paginationPages[pageKey] ?? 1;
    const pagination = document.createElement("nav");
    pagination.className = "pagination";
    pagination.setAttribute("aria-label", "ページ移動");

    const addPageButton = (label, page, options = {}) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "pagination-button";
      button.textContent = label;
      button.disabled = options.disabled ?? false;

      if (options.current) {
        button.setAttribute("aria-current", "page");
        button.setAttribute(
          "aria-label",
          `${page}ページ目（現在のページ）`
        );
      } else {
        button.setAttribute("aria-label", `${page}ページ目`);
      }

      button.addEventListener("click", () => {
        paginationPages[pageKey] = page;
        onPageChange(page);
        container.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });

      pagination.appendChild(button);
    };

    addPageButton("前へ", currentPage - 1, {
      disabled: currentPage === 1
    });

    for (let page = 1; page <= pageCount; page += 1) {
      addPageButton(String(page), page, {
        current: page === currentPage
      });
    }

    addPageButton("次へ", currentPage + 1, {
      disabled: currentPage === pageCount
    });

    if (container.tagName === "UL") {
      const listItem = document.createElement("li");
      listItem.className = "pagination-list-item";
      listItem.appendChild(pagination);
      container.appendChild(listItem);
    } else {
      container.appendChild(pagination);
    }
  }

  // 閲覧画面では非表示に設定された資料を検索・一覧から除外する。
  function getVisibleMaterials() {
    return data.materials.filter((material) => !material.hidden);
  }

  function hideSearchResults() {
    searchResults.hidden = true;
    searchResultsList.innerHTML = "";
  }

  function hideMaterialDetail(detailContainer = materialDetail) {
    detailContainer.hidden = true;
    detailContainer.innerHTML = "";

    if (detailContainer.classList.contains("shortcut-material-detail")) {
      detailContainer
        .closest(".material-item")
        ?.querySelector(".material-open-button")
        ?.removeAttribute("disabled");
    }
  }

  // 選択カテゴリーの詳細カテゴリーをボタンとして描画する。
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

  // 詳細カテゴリーに属する公開資料を抽出し、ページ送り付きの一覧にする。
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
    paginationPages.materials = paginationPages.materialDetailId === detailId
      ? paginationPages.materials ?? 1
      : 1;
    paginationPages.materialDetailId = detailId;
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

    getPagedItems(materials, "materials").forEach((material) => {
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

    appendPagination(materialList, materials.length, "materials", () => {
      renderMaterials(detailId);
    });
  }

  // 資料本文を表示領域へ挿入し、閉じる操作を設定する。
  function renderMaterialDetail(materialId, detailContainer = materialDetail) {
    const material = getVisibleMaterials().find(
      (item) => item.id === materialId
    );

    if (!material) {
      return false;
    }

    detailContainer.innerHTML = `
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

    detailContainer.hidden = false;

    detailContainer.querySelector("#closeMaterialDetail").addEventListener("click", () => {
      hideMaterialDetail(detailContainer);
    });

    detailContainer.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    return true;
  }

  // 資料とお知らせをキーワード検索し、結果の種類に応じた詳細表示操作を作る。
  function renderSearchResults(
    keyword,
    resultsSection = searchResults,
    resultsContainer = searchResultsList,
    shortcut = "",
    pageKey = `search-${shortcut || "main"}`
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
    const announcementResults = shortcut
      ? []
      : data.announcements.filter((announcement) => {
          if (announcement.hidden) {
            return false;
          }

          const searchableText = [
            announcement.title,
            announcement.type,
            announcement.content,
            announcement.date
          ]
            .join(" ")
            .toLocaleLowerCase("ja");

          return searchableText.includes(normalizedKeyword);
        });

    const count = document.createElement("p");
    count.className = "search-result-count";
    count.textContent = shortcut
      ? `${results.length}件の資料が見つかりました。`
      : `資料${results.length}件、お知らせ${announcementResults.length}件が見つかりました。`;

    resultsContainer.appendChild(count);

    if (results.length === 0 && announcementResults.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-message";
      empty.textContent = "該当する資料はありません。";
      resultsContainer.appendChild(empty);
      return;
    }

    const list = document.createElement("div");
    list.className = "material-list";

    const combinedResults = [
      ...results.map((material) => ({ kind: "material", item: material })),
      ...announcementResults.map((announcement) => ({
        kind: "announcement",
        item: announcement
      }))
    ];

    getPagedItems(combinedResults, pageKey).forEach(({ kind, item: result }) => {
      const item = document.createElement("article");
      item.className = kind === "announcement"
        ? "material-item announcement-search-result"
        : "material-item";

      if (kind === "material") {
        item.innerHTML = `
          <div>
            <p class="material-item-title">${escapeHTML(result.title)}</p>
            <p class="material-item-meta">
              ${escapeHTML(getCategory(result.categoryId)?.name ?? "")}
              ・ ${escapeHTML(result.type)}
            </p>
            <p>${escapeHTML(result.description)}</p>
          </div>
          <button type="button" class="material-open-button">
            資料を開く
          </button>
          ${shortcut ? '<section class="material-detail shortcut-material-detail" aria-live="polite" hidden></section>' : ""}
        `;

        item.querySelector("button").addEventListener("click", () => {
          const openButton = item.querySelector(".material-open-button");
          const detailContainer = shortcut
            ? item.querySelector(".shortcut-material-detail")
            : materialDetail;

          if (shortcut) {
            resultsContainer
              .querySelectorAll(".shortcut-material-detail")
              .forEach((detail) => {
                if (detail !== detailContainer) {
                  hideMaterialDetail(detail);
                }
              });
          }

          const rendered = renderMaterialDetail(result.id, detailContainer);

          if (shortcut && rendered) {
            openButton.disabled = true;
          }
        });
      } else {
        const detailId = `searchAnnouncementDetail-${result.id}`;

        item.innerHTML = `
          <div class="announcement-search-summary">
            <p class="material-item-title">${escapeHTML(result.title)}</p>
            <p class="material-item-meta">
              <span class="information-badge">${escapeHTML(result.type)}</span>
              <span>掲載日：${escapeHTML(result.date)}</span>
            </p>
          </div>
          <button
            type="button"
            class="material-open-button"
            aria-controls="${escapeHTML(detailId)}"
            aria-expanded="false"
          >
            お知らせを開く
          </button>
          <section
            class="announcement-detail inline-announcement-detail"
            id="${escapeHTML(detailId)}"
            aria-labelledby="${escapeHTML(detailId)}-title"
            aria-live="polite"
            hidden
          ></section>
        `;

        const button = item.querySelector(".material-open-button");
        const detail = item.querySelector(".inline-announcement-detail");
        button.addEventListener("click", () => {
          showAnnouncementDetail(result.id, button, detail, resultsContainer);
        });
      }

      list.appendChild(item);
    });

    resultsContainer.appendChild(list);
    appendPagination(list, combinedResults.length, pageKey, () => {
      renderSearchResults(
        keyword,
        resultsSection,
        resultsContainer,
        shortcut,
        pageKey
      );
    });
  }



  // 非表示のお知らせを除いた一覧を描画し、項目ごとの詳細開閉を設定する。
  function renderAnnouncements() {
    newsList.innerHTML = "";

    const visibleAnnouncements = data.announcements.filter(
      (item) => !item.hidden
    );

    if (visibleAnnouncements.length === 0) {
      newsList.innerHTML =
        '<li class="empty-message">現在、お知らせはありません。</li>';
      return;
    }

    getPagedItems(visibleAnnouncements, "announcements").forEach((announcement) => {
      const item = document.createElement("li");
      const detailId = `announcementDetail-${announcement.id}`;

      item.innerHTML = `
        <button
          type="button"
          class="announcement-link"
          data-announcement-id="${escapeHTML(announcement.id)}"
          aria-label="${escapeHTML(announcement.title)}の詳細を表示"
          aria-controls="${escapeHTML(detailId)}"
          aria-expanded="false"
        >
          <span class="information-date">${escapeHTML(announcement.date)}</span>
          <span class="announcement-title-row">
            <span class="information-badge">${escapeHTML(announcement.type)}</span>
            <span class="information-title">${escapeHTML(announcement.title)}</span>
          </span>
          <span class="announcement-link-hint" aria-hidden="true">詳細を見る <span>→</span></span>
        </button>
        <section
          class="announcement-detail inline-announcement-detail"
          id="${escapeHTML(detailId)}"
          aria-labelledby="${escapeHTML(detailId)}-title"
          aria-live="polite"
          hidden
        ></section>
      `;

      const button = item.querySelector("button");
      const detail = item.querySelector(".inline-announcement-detail");

      button.addEventListener("click", () => {
        showAnnouncementDetail(announcement.id, button, detail);
      });

      newsList.appendChild(item);
    });

    appendPagination(newsList, visibleAnnouncements.length, "announcements", () => {
      renderAnnouncements();
    });
  }



  // 選択したお知らせの詳細を同じ項目内に開き、他の詳細を閉じる。
  function showAnnouncementDetail(
    announcementId,
    triggerButton,
    detail,
    listContainer = newsList
  ) {
    const announcement = data.announcements.find(
      (item) => item.id === announcementId && !item.hidden
    );

    if (!announcement) {
      return;
    }

    listContainer
      .querySelectorAll(".announcement-link, .announcement-search-result button")
      .forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-expanded", "false");
    });

    listContainer
      .querySelectorAll(".inline-announcement-detail")
      .forEach((section) => {
        section.hidden = true;
        section.innerHTML = "";
        section
          .closest(".announcement-search-result")
          ?.querySelector(".announcement-search-summary")
          ?.removeAttribute("hidden");
        section
          .closest(".announcement-search-result")
          ?.querySelector(".material-open-button")
          ?.removeAttribute("hidden");
      });

    triggerButton.classList.add("is-selected");
    triggerButton.setAttribute("aria-expanded", "true");

    detail.innerHTML = `
      <p class="announcement-detail-label">お知らせの詳細</p>
      <div class="announcement-detail-meta">
        <span class="information-badge">${escapeHTML(announcement.type)}</span>
        <span class="announcement-detail-date">
          掲載日：${escapeHTML(announcement.date)}
        </span>
      </div>
      <h3 id="${escapeHTML(detail.id)}-title">${escapeHTML(announcement.title)}</h3>
      <div class="announcement-detail-content"></div>
      <button type="button" class="back-button" id="closeAnnouncementDetail">
        <span aria-hidden="true">←</span> お知らせ一覧に戻る
      </button>
    `;

    detail.querySelector(".announcement-detail-content").textContent =
      announcement.content || "詳細情報はありません。";
    const searchResult = detail.closest(".announcement-search-result");

    if (searchResult) {
      searchResult.querySelector(".announcement-search-summary").hidden = true;
      triggerButton.hidden = true;
    }

    detail.hidden = false;

    detail.querySelector("#closeAnnouncementDetail").addEventListener("click", () => {
      detail.hidden = true;
      detail.innerHTML = "";
      detail
        .closest(".announcement-search-result")
        ?.querySelector(".announcement-search-summary")
        ?.removeAttribute("hidden");
      triggerButton.removeAttribute("hidden");
      triggerButton.classList.remove("is-selected");
      triggerButton.setAttribute("aria-expanded", "false");
      triggerButton.focus();
    });

    detail.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }


// 今日の日付・登録済み種類に一致する公開お知らせを本日欄へ表示する。
function renderHistory() {
  historyList.innerHTML = "";

  // 今日の日付を YYYY-MM-DD 形式で取得
  const now = new Date();
  const todayString = getToday();

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



  // 登録済みの種類に該当する今日のお知らせを取得
  const todayAnnouncements = (data.announcements || []).filter(
    announcement =>
      !announcement.hidden &&
      announcement.date === todayString &&
      data.announcementTypes.includes(announcement.type)
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
  getPagedItems(todayAnnouncements, "daily-announcements").forEach(announcement => {
    const li = document.createElement("li");
    const detailId = `dailyAnnouncementDetail-${announcement.id}`;
    li.innerHTML = `
      <button
        type="button"
        class="announcement-link"
        aria-label="${escapeHTML(announcement.title)}の詳細を表示"
        aria-controls="${escapeHTML(detailId)}"
        aria-expanded="false"
      >
        <span class="announcement-title-row">
          <span class="information-badge">${escapeHTML(announcement.type)}</span>
          <span class="information-title">${escapeHTML(announcement.title)}</span>
        </span>
        <span class="announcement-link-hint" aria-hidden="true">詳細を見る <span>→</span></span>
      </button>
      <section
        class="announcement-detail inline-announcement-detail"
        id="${escapeHTML(detailId)}"
        aria-labelledby="${escapeHTML(detailId)}-title"
        aria-live="polite"
        hidden
      ></section>
    `;

    const button = li.querySelector("button");
    const detail = li.querySelector(".inline-announcement-detail");
    button.addEventListener("click", () => {
      showDailyAnnouncementDetail(announcement.id, button, detail);
    });

    historyList.appendChild(li);
  });

  appendPagination(
    historyList,
    todayAnnouncements.length,
    "daily-announcements",
    () => renderHistory()
  );
}

// 本日欄のお知らせ詳細を項目直下に表示し、閉じる操作も設定する。
function showDailyAnnouncementDetail(announcementId, triggerButton, detail) {
  const announcement = data.announcements.find(
    (item) =>
      item.id === announcementId &&
      !item.hidden &&
      item.date === getToday() &&
      data.announcementTypes.includes(item.type)
  );

  if (!announcement) {
    return;
  }

  historyList.querySelectorAll(".announcement-link").forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-expanded", "false");
  });

  historyList.querySelectorAll(".inline-announcement-detail").forEach((section) => {
    section.hidden = true;
    section.innerHTML = "";
  });

  triggerButton.classList.add("is-selected");
  triggerButton.setAttribute("aria-expanded", "true");

  detail.innerHTML = `
    <p class="announcement-detail-label">本日のお知らせの詳細</p>
    <div class="announcement-detail-meta">
      <span class="information-badge">${escapeHTML(announcement.type)}</span>
      <span class="announcement-detail-date">掲載日：${escapeHTML(announcement.date)}</span>
    </div>
    <h3 id="${escapeHTML(detail.id)}-title">${escapeHTML(announcement.title)}</h3>
    <div class="announcement-detail-content"></div>
    <button type="button" class="back-button" id="closeDailyAnnouncementDetail">
      <span aria-hidden="true">←</span> お知らせ一覧に戻る
    </button>
  `;
  detail.querySelector(".announcement-detail-content").textContent =
    announcement.content || "詳細情報はありません。";
  detail.hidden = false;

  detail.querySelector("#closeDailyAnnouncementDetail").addEventListener("click", () => {
    detail.hidden = true;
    detail.innerHTML = "";
    triggerButton.classList.remove("is-selected");
    triggerButton.setAttribute("aria-expanded", "false");
    triggerButton.focus();
  });

  detail.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}


  // カテゴリー切り替え時は検索・資料詳細を閉じ、新しいカテゴリーを表示する。
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

  // 検索送信後に結果を描画し、結果欄が見える位置へスクロールする。
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    currentDetailId = null;
    document.querySelectorAll(".shortcut-results").forEach((section) => {
      section.hidden = true;
      section.querySelector(".shortcut-results-list").innerHTML = "";
    });
    paginationPages["search-main"] = 1;
    renderSearchResults(searchInput.value);
    searchResults.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  // ショートカットごとの条件で資料を絞り込み、対応する欄に結果を表示する。
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
      paginationPages[`search-${shortcut}`] = 1;
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

  // 別タブの管理画面で共有データが変更された場合、最新データを読み直して再描画する。
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
