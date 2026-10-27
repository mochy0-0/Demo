
/*
 * Center-HP-Renewal-Demo
 * 管理者用JavaScript
 *
 * 架空データ専用のデモです。
 * この画面には管理者認証機能はありません。
 */

(() => {
  "use strict";

  const dataApi = window.CenterPortalData;

  if (!dataApi) {
    console.error("共通データが読み込まれていません。");
    return;
  }

  let data = dataApi.loadData();
  const pageSize = 20;
  const currentPages = {};

  // HTML上の一覧・フォームをまとめて参照し、管理機能から共通利用する。
  const elements = {
    tabs: document.querySelectorAll(".admin-tab"),

    materialsPanel: document.getElementById("materialsPanel"),
    dailyAnnouncementsPanel: document.getElementById(
      "dailyAnnouncementsPanel"
    ),
    announcementsPanel: document.getElementById("announcementsPanel"),
    shortcutPanels: {
      "shortcut-test": document.getElementById("testShortcutPanel"),
      "shortcut-file": document.getElementById("fileShortcutPanel")
    },
    shortcutTableBodies: {
      test: document.getElementById("testShortcutTableBody"),
      file: document.getElementById("fileShortcutTableBody")
    },
    shortcutPaginations: {
      test: document.getElementById("testShortcutPagination"),
      file: document.getElementById("fileShortcutPagination")
    },
    shortcutMessages: {
      test: document.getElementById("testShortcutMessage"),
      file: document.getElementById("fileShortcutMessage")
    },

    materialEditorPanel: document.getElementById("materialEditorPanel"),
    announcementEditorPanel: document.getElementById(
      "announcementEditorPanel"
    ),

    materialsTableBody: document.getElementById("materialsTableBody"),
    materialsPagination: document.getElementById("materialsPagination"),
    announcementsTableBody: document.getElementById(
      "announcementsTableBody"
    ),
    announcementsPagination: document.getElementById(
      "announcementsPagination"
    ),
    dailyAnnouncementsTableBody: document.getElementById(
      "dailyAnnouncementsTableBody"
    ),
    dailyAnnouncementsPagination: document.getElementById(
      "dailyAnnouncementsPagination"
    ),

    materialsMessage: document.getElementById("materialsMessage"),
    dailyAnnouncementsMessage: document.getElementById(
      "dailyAnnouncementsMessage"
    ),
    announcementTypesMessage: document.getElementById(
      "announcementTypesMessage"
    ),
    announcementsMessage: document.getElementById(
      "announcementsMessage"
    ),

    materialSearch: document.getElementById("adminMaterialSearch"),
    materialStatusFilter: document.getElementById(
      "materialStatusFilter"
    ),
    announcementSearch: document.getElementById(
      "adminAnnouncementSearch"
    ),

    addMaterialButton: document.getElementById("addMaterialButton"),
    addAnnouncementButton: document.getElementById(
      "addAnnouncementButton"
    ),
    addDailyAnnouncementButton: document.getElementById(
      "addDailyAnnouncementButton"
    ),
    announcementTypeForm: document.getElementById("announcementTypeForm"),
    newAnnouncementType: document.getElementById("newAnnouncementType"),

    materialForm: document.getElementById("materialForm"),
    materialId: document.getElementById("materialId"),
    materialTitle: document.getElementById("materialTitle"),
    materialCategory: document.getElementById("materialCategory"),
    materialDetail: document.getElementById("materialDetail"),
    materialType: document.getElementById("materialType"),
    materialShortcut: document.getElementById("materialShortcut"),
    materialDescription: document.getElementById(
      "materialDescription"
    ),
    materialContent: document.getElementById("materialContent"),
    materialEditorHeading: document.getElementById(
      "materialEditorHeading"
    ),
    cancelMaterialEdit: document.getElementById("cancelMaterialEdit"),

    announcementForm: document.getElementById("announcementForm"),
    announcementId: document.getElementById("announcementId"),
    announcementTitle: document.getElementById("announcementTitle"),
    announcementDate: document.getElementById("announcementDate"),
    announcementType: document.getElementById("announcementType"),
    announcementContent: document.getElementById(
      "announcementContent"
    ),
    announcementEditorHeading: document.getElementById(
      "announcementEditorHeading"
    ),
    cancelAnnouncementEdit: document.getElementById(
      "cancelAnnouncementEdit"
    )
  };

  /* =========================
     共通処理
  ========================= */

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

  // 日付入力と「今日のお知らせ」の抽出に使うローカル日付を返す。
  function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function scrollAdminToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // 一覧ごとのページ番号を保持し、削除などで末尾ページがなくなった場合も範囲内に収める。
  function getCurrentPage(itemCount, key) {
    const pageCount = Math.max(1, Math.ceil(itemCount / pageSize));
    currentPages[key] = Math.min(currentPages[key] ?? 1, pageCount);

    return currentPages[key];
  }

  function renderPagination(container, itemCount, key, onPageChange) {
    container.innerHTML = "";

    const pageCount = Math.ceil(itemCount / pageSize);

    if (pageCount <= 1) {
      return;
    }

    const currentPage = getCurrentPage(itemCount, key);
    const addButton = (label, page, options = {}) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "admin-pagination-button";
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
        currentPages[key] = page;
        onPageChange();
        container.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      });

      container.appendChild(button);
    };

    addButton("前へ", currentPage - 1, {
      disabled: currentPage === 1
    });

    for (let page = 1; page <= pageCount; page += 1) {
      addButton(String(page), page, {
        current: page === currentPage
      });
    }

    addButton("次へ", currentPage + 1, {
      disabled: currentPage === pageCount
    });
  }

  // IDから表示用のカテゴリー名を引く。参照先がない古いデータは「未分類」とする。
  function getCategoryName(categoryId) {
    const category = data.categories.find(
      (item) => item.id === categoryId
    );

    return category ? category.name : "未分類";
  }

  function getDetailName(categoryId, detailId) {
    const category = data.categories.find(
      (item) => item.id === categoryId
    );

    const detail = category?.details.find(
      (item) => item.id === detailId
    );

    return detail ? detail.name : "未分類";
  }

  // 変更履歴を追加して共有データを保存する。失敗時は保存済みデータに戻して画面も再描画する。
  function persistData(historyTitle) {
    if (historyTitle) {
      dataApi.addHistory(data, historyTitle);
    }

    const saved = dataApi.saveData(data);

    if (!saved) {
      alert(
        "データを保存できませんでした。\n" +
        "ブラウザの保存容量や設定を確認してください。"
      );

      data = dataApi.loadData();
      renderAll();
      return false;
    }

    return true;
  }

  function refreshData() {
    data = dataApi.loadData();
    renderAll();
  }

  // 選択されたタブに対応する管理パネルだけを表示し、編集中フォームを閉じる。
  function showPanel(panel) {
    elements.materialsPanel.hidden = panel !== "materials";
    elements.dailyAnnouncementsPanel.hidden =
      panel !== "daily-announcements";
    elements.announcementsPanel.hidden = panel !== "announcements";
    Object.entries(elements.shortcutPanels).forEach(([key, section]) => {
      section.hidden = key !== panel;
    });

    elements.tabs.forEach((tab) => {
      const active = tab.dataset.adminTab === panel;

      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-pressed", String(active));
    });

    closeMaterialEditor();
    closeAnnouncementEditor();
  }

  /* =========================
     資料管理
  ========================= */

  // 明示的なショートカット設定を優先し、未設定の既存資料は名称等のキーワードでも分類する。
  function matchesShortcut(material, shortcut) {
    const assignedShortcuts = Array.isArray(material.shortcuts)
      ? material.shortcuts
      : [];

    if (assignedShortcuts.includes(shortcut)) {
      return true;
    }

    const keyword = shortcut === "test" ? "テスト" : "ファイル";
    const searchableText = [
      material.title,
      material.description,
      material.type,
      material.content,
      getCategoryName(material.categoryId),
      getDetailName(material.categoryId, material.detailId)
    ]
      .join(" ")
      .toLocaleLowerCase("ja");

    return searchableText.includes(keyword.toLocaleLowerCase("ja"));
  }

  // 検索・表示状態・ショートカット条件を適用し、資料一覧とページ送りを描画する。
  function renderMaterialTable(tableBody = elements.materialsTableBody, options = {}) {
    const paginationKey = options.shortcut
      ? `shortcut-${options.shortcut}`
      : "materials";
    const pagination = options.shortcut
      ? elements.shortcutPaginations[options.shortcut]
      : elements.materialsPagination;
    const keyword = elements.materialSearch.value
      .trim()
      .toLocaleLowerCase("ja");

    const status = elements.materialStatusFilter.value;

    const filtered = data.materials.filter((material) => {
      const matchesKeyword = [
        material.title,
        material.description,
        material.type,
        material.content,
        getCategoryName(material.categoryId),
        getDetailName(material.categoryId, material.detailId)
      ]
        .join(" ")
        .toLocaleLowerCase("ja")
        .includes(keyword);

      const matchesStatus =
        status === "all" ||
        (status === "visible" && !material.hidden) ||
        (status === "hidden" && material.hidden);
      const matchesSelectedShortcut = !options.shortcut ||
        matchesShortcut(material, options.shortcut);

      return matchesKeyword && matchesStatus && matchesSelectedShortcut;
    });

    tableBody.innerHTML = "";
    pagination.innerHTML = "";

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5">該当する資料はありません。</td>
        </tr>
      `;
    } else {
      const currentPage = getCurrentPage(filtered.length, paginationKey);
      filtered
        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
        .forEach((material) => {
        const row = document.createElement("tr");

        const statusLabel = material.hidden
          ? '<span class="status-badge is-hidden">非表示</span>'
          : '<span class="status-badge is-visible">表示中</span>';

        const toggleLabel = material.hidden
          ? "再表示"
          : "非表示";

        row.innerHTML = `
          <td>
            ${escapeHTML(material.title)}
            <br>
            <small>
              ${escapeHTML(material.type)}
              ／ ${escapeHTML(
                getDetailName(material.categoryId, material.detailId)
              )}
            </small>
          </td>

          <td>${escapeHTML(getCategoryName(material.categoryId))}</td>

          <td>${escapeHTML(material.updatedAt)}</td>

          <td>${statusLabel}</td>

          <td>
            <div class="table-actions">
              <button
                type="button"
                class="small-button"
                data-action="edit-material"
                data-id="${escapeHTML(material.id)}"
              >
                編集
              </button>

              <button
                type="button"
                class="small-button"
                data-action="toggle-material"
                data-id="${escapeHTML(material.id)}"
              >
                ${toggleLabel}
              </button>

              <button
                type="button"
                class="danger-button"
                data-action="delete-material"
                data-id="${escapeHTML(material.id)}"
              >
                削除
              </button>
            </div>
          </td>
        `;

        tableBody.appendChild(row);
      });

      renderPagination(pagination, filtered.length, paginationKey, () => {
        renderMaterialTable(tableBody, options);
      });
    }

    const message = options.shortcut
      ? elements.shortcutMessages[options.shortcut]
      : elements.materialsMessage;
    message.textContent = options.shortcut
      ? `${filtered.length}件の資料を管理しています。`
      : `全${data.materials.length}件中 ${filtered.length}件を表示しています。`;
  }

  function renderShortcutTables() {
    Object.entries(elements.shortcutTableBodies).forEach(([shortcut, tableBody]) => {
      renderMaterialTable(tableBody, { shortcut });
    });
  }

  // 資料編集フォームのメインカテゴリー選択肢を最新データから作る。
  function populateMaterialCategories(selectedCategoryId = "") {
    elements.materialCategory.innerHTML =
      '<option value="">選択してください</option>';

    data.categories.forEach((category) => {
      const option = document.createElement("option");

      option.value = category.id;
      option.textContent = category.name;

      elements.materialCategory.appendChild(option);
    });

    elements.materialCategory.value = selectedCategoryId;
    populateMaterialDetails();
  }

  function populateMaterialDetails(selectedDetailId = "") {
    const category = data.categories.find(
      (item) => item.id === elements.materialCategory.value
    );

    elements.materialDetail.innerHTML = "";

    if (!category || category.details.length === 0) {
      elements.materialDetail.innerHTML =
        '<option value="">詳細カテゴリーがありません</option>';

      return;
    }

    elements.materialDetail.innerHTML =
      '<option value="">選択してください</option>';

    category.details.forEach((detail) => {
      const option = document.createElement("option");

      option.value = detail.id;
      option.textContent = detail.name;

      elements.materialDetail.appendChild(option);
    });

    elements.materialDetail.value = selectedDetailId;
  }

  // 新規または既存資料の値をフォームへ設定し、入力欄まで画面を移動する。
  function openMaterialEditor(material = null, shortcut = "") {
    elements.materialForm.reset();

    elements.materialId.value = material?.id ?? "";
    elements.materialTitle.value = material?.title ?? "";
    elements.materialType.value = material?.type ?? "";
    elements.materialShortcut.value = material
      ? getShortcutValue(material.shortcuts ?? [])
      : shortcut;
    elements.materialDescription.value =
      material?.description ?? "";
    elements.materialContent.value = material?.content ?? "";

    elements.materialEditorHeading.textContent = material
      ? "資料を編集"
      : "資料を追加";

    populateMaterialCategories(material?.categoryId ?? "");

    if (material) {
      populateMaterialDetails();
      elements.materialDetail.value = material.detailId;
    }

    function getShortcutValue(shortcuts) {
      if (shortcuts.includes("test") && shortcuts.includes("file")) {
        return "both";
      }
      if (shortcuts.includes("test")) {
        return "test";
      }
      if (shortcuts.includes("file")) {
        return "file";
      }
      return "";
    }

    elements.materialEditorPanel.hidden = false;

    elements.materialEditorPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    elements.materialTitle.focus();
  }

  function closeMaterialEditor() {
    elements.materialEditorPanel.hidden = true;
    elements.materialForm.reset();
    elements.materialId.value = "";
  }

  // 入力値を検証し、資料を追加または更新して保存する。
  function saveMaterial(event) {
    event.preventDefault();

    const id = elements.materialId.value;
    const title = elements.materialTitle.value.trim();
    const categoryId = elements.materialCategory.value;
    const detailId = elements.materialDetail.value;
    const type = elements.materialType.value.trim();
    const shortcutValue = elements.materialShortcut.value;
    const shortcuts = shortcutValue === "both"
      ? ["test", "file"]
      : shortcutValue
        ? [shortcutValue]
        : [];
    const description = elements.materialDescription.value.trim();
    const content = elements.materialContent.value.trim();

    if (!title || !categoryId || !detailId || !type || !content) {
      alert("必須項目を入力してください。");
      return;
    }

    const category = data.categories.find(
      (item) => item.id === categoryId
    );

    const validDetail = category?.details.some(
      (detail) => detail.id === detailId
    );

    if (!validDetail) {
      alert("有効な詳細カテゴリーを選択してください。");
      return;
    }

    const existing = id
      ? data.materials.find((item) => item.id === id)
      : null;

    const material = {
      id: existing?.id ?? dataApi.createId("material"),
      title,
      categoryId,
      detailId,
      type,
      shortcuts,
      description,
      content,
      updatedAt: getToday(),
      hidden: existing?.hidden ?? false
    };

    if (existing) {
      Object.assign(existing, material);
    } else {
      data.materials.unshift(material);
    }

    const historyTitle = existing
      ? `資料を編集：${title}`
      : `資料を追加：${title}`;

    if (persistData(historyTitle)) {
      closeMaterialEditor();
      renderAll();
      alert("資料を保存しました。");
      scrollAdminToTop();
    }
  }

  // 資料の表示・非表示を切り替え、変更履歴とともに保存する。
  function toggleMaterial(id) {
    const material = data.materials.find(
      (item) => item.id === id
    );

    if (!material) {
      return;
    }

    material.hidden = !material.hidden;

    const action = material.hidden ? "非表示" : "再表示";

    if (persistData(`資料を${action}：${material.title}`)) {
      renderAll();
    }
  }

  // 確認ダイアログを経て資料を削除する。保存に失敗した場合は削除前の一覧へ戻す。
  function deleteMaterial(id) {
    const material = data.materials.find(
      (item) => item.id === id
    );

    if (!material) {
      return;
    }

    const confirmed = window.confirm(
      `次の資料を完全に削除します。\n\n` +
      `${material.title}\n\n` +
      "この操作は取り消せません。よろしいですか？"
    );

    if (!confirmed) {
      return;
    }

    const previousMaterials = [...data.materials];

    data.materials = data.materials.filter(
      (item) => item.id !== id
    );

    if (persistData(`資料を削除：${material.title}`)) {
      renderAll();
      alert("資料を削除しました。");
    } else {
      data.materials = previousMaterials;
      renderAll();
    }
  }

  /* =========================
     お知らせ管理
  ========================= */

  // 検索語に一致するすべてのお知らせを絞り込み、操作ボタン付きで一覧表示する。
  function renderAnnouncementTable() {
    elements.announcementsTableBody.innerHTML = "";
    elements.announcementsPagination.innerHTML = "";

    const keyword = elements.announcementSearch.value
      .trim()
      .toLocaleLowerCase("ja");
    const filtered = data.announcements.filter((announcement) =>
      [
        announcement.title,
        announcement.type,
        announcement.content,
        announcement.date
      ]
        .join(" ")
        .toLocaleLowerCase("ja")
        .includes(keyword)
    );

    if (filtered.length === 0) {
      elements.announcementsTableBody.innerHTML = `
        <tr>
          <td colspan="4">${
            data.announcements.length === 0
              ? "お知らせはありません。"
              : "該当するお知らせはありません。"
          }</td>
        </tr>
      `;
    } else {
      const currentPage = getCurrentPage(
        filtered.length,
        "announcements"
      );
      filtered
        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
        .forEach((announcement) => {
        const row = document.createElement("tr");

        const statusLabel = announcement.hidden
          ? '<span class="status-badge is-hidden">非表示</span>'
          : '<span class="status-badge is-visible">表示中</span>';

        const toggleLabel = announcement.hidden
          ? "再表示"
          : "非表示";

        row.innerHTML = `
          <td>
            ${escapeHTML(announcement.title)}
            <br>
            <small>${escapeHTML(announcement.type)}</small>
          </td>

          <td>${escapeHTML(announcement.date)}</td>

          <td>${statusLabel}</td>

          <td>
            <div class="table-actions">
              <button
                type="button"
                class="small-button"
                data-action="edit-announcement"
                data-id="${escapeHTML(announcement.id)}"
              >
                編集
              </button>

              <button
                type="button"
                class="small-button"
                data-action="toggle-announcement"
                data-id="${escapeHTML(announcement.id)}"
              >
                ${toggleLabel}
              </button>

              <button
                type="button"
                class="danger-button"
                data-action="delete-announcement"
                data-id="${escapeHTML(announcement.id)}"
              >
                削除
              </button>
            </div>
          </td>
        `;

        elements.announcementsTableBody.appendChild(row);
      });

      renderPagination(
        elements.announcementsPagination,
        filtered.length,
        "announcements",
        renderAnnouncementTable
      );
    }

    elements.announcementsMessage.textContent =
      `全${data.announcements.length}件中 ${filtered.length}件を表示しています。`;
  }

  // 今日の日付と登録済み種類の両方に該当するお知らせだけを管理一覧へ表示する。
  function renderDailyAnnouncementTable() {
    const announcements = data.announcements.filter(
      (announcement) =>
        announcement.date === getToday() &&
        data.announcementTypes.includes(announcement.type)
    );

    elements.dailyAnnouncementsTableBody.innerHTML = "";
    elements.dailyAnnouncementsPagination.innerHTML = "";

    if (announcements.length === 0) {
      elements.dailyAnnouncementsTableBody.innerHTML = `
        <tr>
          <td colspan="4">今日のお知らせはありません。</td>
        </tr>
      `;
    } else {
      const currentPage = getCurrentPage(
        announcements.length,
        "daily-announcements"
      );
      announcements
        .slice((currentPage - 1) * pageSize, currentPage * pageSize)
        .forEach((announcement) => {
        const row = document.createElement("tr");
        const statusLabel = announcement.hidden
          ? '<span class="status-badge is-hidden">非表示</span>'
          : '<span class="status-badge is-visible">表示中</span>';
        const toggleLabel = announcement.hidden ? "再表示" : "非表示";

        row.innerHTML = `
          <td>${escapeHTML(announcement.title)}</td>
          <td>${escapeHTML(announcement.type)}</td>
          <td>${statusLabel}</td>
          <td>
            <div class="table-actions">
              <button
                type="button"
                class="small-button"
                data-action="edit-announcement"
                data-id="${escapeHTML(announcement.id)}"
              >
                編集
              </button>
              <button
                type="button"
                class="small-button"
                data-action="toggle-announcement"
                data-id="${escapeHTML(announcement.id)}"
              >
                ${toggleLabel}
              </button>
              <button
                type="button"
                class="danger-button"
                data-action="delete-announcement"
                data-id="${escapeHTML(announcement.id)}"
              >
                削除
              </button>
            </div>
          </td>
        `;

        elements.dailyAnnouncementsTableBody.appendChild(row);
      });

      renderPagination(
        elements.dailyAnnouncementsPagination,
        announcements.length,
        "daily-announcements",
        renderDailyAnnouncementTable
      );
    }

    elements.dailyAnnouncementsMessage.textContent =
      `今日のお知らせを${announcements.length}件管理しています。`;
  }

  // お知らせフォームの種類選択肢を、既定値・登録済み種類・編集中の値から組み立てる。
  function populateAnnouncementTypes(selectedType = "") {
    const types = ["お知らせ", ...data.announcementTypes].filter(
      (type, index, values) => values.indexOf(type) === index
    );

    if (selectedType && !types.includes(selectedType)) {
      types.push(selectedType);
    }

    elements.announcementType.innerHTML = "";

    types.forEach((type) => {
      const option = document.createElement("option");
      option.value = type;
      option.textContent = type;
      elements.announcementType.appendChild(option);
    });

    elements.announcementType.value = selectedType || "お知らせ";
    elements.announcementTypesMessage.textContent =
      `登録済みの種類：${data.announcementTypes.join("、")}`;
  }

  // 今日のお知らせ用の種類を重複確認して登録し、共有データへ保存する。
  function addAnnouncementType(event) {
    event.preventDefault();

    const type = elements.newAnnouncementType.value.trim();

    if (!type) {
      alert("追加する種類を入力してください。");
      return;
    }

    if (data.announcementTypes.includes(type) || type === "お知らせ") {
      alert("この種類はすでに登録されています。");
      return;
    }

    data.announcementTypes.push(type);

    if (persistData(`今日のお知らせの種類を追加：${type}`)) {
      elements.announcementTypeForm.reset();
      renderAll();
      alert("種類を追加しました。");
      scrollAdminToTop();
    }
  }

  // 新規または既存のお知らせの内容をフォームへ設定する。
  function openAnnouncementEditor(
    announcement = null,
    defaultType = "お知らせ"
  ) {
    elements.announcementForm.reset();

    elements.announcementId.value = announcement?.id ?? "";
    elements.announcementTitle.value = announcement?.title ?? "";
    elements.announcementDate.value =
      announcement?.date ?? getToday();
    populateAnnouncementTypes(announcement?.type ?? defaultType);
    elements.announcementContent.value =
      announcement?.content ?? "";

    elements.announcementEditorHeading.textContent = announcement
      ? "お知らせを編集"
      : "お知らせを追加";

    elements.announcementEditorPanel.hidden = false;

    elements.announcementEditorPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    elements.announcementTitle.focus();
  }

  function closeAnnouncementEditor() {
    elements.announcementEditorPanel.hidden = true;
    elements.announcementForm.reset();
    elements.announcementId.value = "";
  }

  // 入力値を検証し、お知らせを追加または更新して保存する。
  function saveAnnouncement(event) {
    event.preventDefault();

    const id = elements.announcementId.value;
    const title = elements.announcementTitle.value.trim();
    const date = elements.announcementDate.value;
    const type = elements.announcementType.value.trim();
    const content = elements.announcementContent.value.trim();

    if (!title || !date || !type) {
      alert("必須項目を入力してください。");
      return;
    }

    const existing = id
      ? data.announcements.find((item) => item.id === id)
      : null;

    const announcement = {
      id: existing?.id ?? dataApi.createId("announcement"),
      title,
      date,
      type,
      content,
      hidden: existing?.hidden ?? false
    };

    if (existing) {
      Object.assign(existing, announcement);
    } else {
      data.announcements.unshift(announcement);
    }

    const historyTitle = existing
      ? `お知らせを編集：${title}`
      : `お知らせを追加：${title}`;

    if (persistData(historyTitle)) {
      closeAnnouncementEditor();
      renderAll();
      alert("お知らせを保存しました。");
      scrollAdminToTop();
    }
  }

  // お知らせの表示・非表示を切り替え、閲覧画面への公開状態を更新する。
  function toggleAnnouncement(id) {
    const announcement = data.announcements.find(
      (item) => item.id === id
    );

    if (!announcement) {
      return;
    }

    announcement.hidden = !announcement.hidden;

    const action = announcement.hidden ? "非表示" : "再表示";

    if (
      persistData(
        `お知らせを${action}：${announcement.title}`
      )
    ) {
      renderAll();
    }
  }

  // 確認後にお知らせを削除する。保存失敗時は削除前のデータへ復元する。
  function deleteAnnouncement(id) {
    const announcement = data.announcements.find(
      (item) => item.id === id
    );

    if (!announcement) {
      return;
    }

    const confirmed = window.confirm(
      `次のお知らせを完全に削除します。\n\n` +
      `${announcement.title}\n\n` +
      "この操作は取り消せません。よろしいですか？"
    );

    if (!confirmed) {
      return;
    }

    const previousAnnouncements = [...data.announcements];

    data.announcements = data.announcements.filter(
      (item) => item.id !== id
    );

    if (persistData(`お知らせを削除：${announcement.title}`)) {
      renderAll();
      alert("お知らせを削除しました。");
    } else {
      data.announcements = previousAnnouncements;
      renderAll();
    }
  }

  /* =========================
     イベント登録
  ========================= */

  // タブ、フォーム、検索欄などのユーザー操作を対応する処理へ接続する。
  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      showPanel(tab.dataset.adminTab);
    });
  });

  elements.addMaterialButton.addEventListener("click", () => {
    openMaterialEditor();
  });

  elements.addAnnouncementButton.addEventListener("click", () => {
    showPanel("announcements");
    openAnnouncementEditor();
  });

  elements.addDailyAnnouncementButton.addEventListener("click", () => {
    showPanel("daily-announcements");
    openAnnouncementEditor(null, "メンテナンス");
  });

  document.querySelectorAll("[data-add-shortcut]").forEach((button) => {
    button.addEventListener("click", () => {
      const shortcut = button.dataset.addShortcut;
      showPanel(`shortcut-${shortcut}`);
      openMaterialEditor(null, shortcut);
    });
  });

  elements.materialSearch.addEventListener("input", () => {
    currentPages.materials = 1;
    currentPages["shortcut-test"] = 1;
    currentPages["shortcut-file"] = 1;
    renderMaterialTable();
    renderShortcutTables();
  });

  elements.announcementSearch.addEventListener("input", () => {
    currentPages.announcements = 1;
    renderAnnouncementTable();
  });

  elements.materialStatusFilter.addEventListener(
    "change",
    () => {
      currentPages.materials = 1;
      currentPages["shortcut-test"] = 1;
      currentPages["shortcut-file"] = 1;
      renderMaterialTable();
      renderShortcutTables();
    }
  );

  elements.materialCategory.addEventListener("change", () => {
    populateMaterialDetails();
  });

  elements.materialForm.addEventListener("submit", saveMaterial);

  elements.cancelMaterialEdit.addEventListener("click", () => {
    closeMaterialEditor();
  });

  elements.announcementForm.addEventListener(
    "submit",
    saveAnnouncement
  );

  elements.announcementTypeForm.addEventListener(
    "submit",
    addAnnouncementType
  );

  elements.cancelAnnouncementEdit.addEventListener("click", () => {
    closeAnnouncementEditor();
  });

  function handleMaterialTableClick(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    const { action, id } = button.dataset;

    if (action === "edit-material") {
      const material = data.materials.find(
        (item) => item.id === id
      );

      if (material) {
        openMaterialEditor(material);
      }
    }

    if (action === "toggle-material") {
      toggleMaterial(id);
    }

    if (action === "delete-material") {
      deleteMaterial(id);
    }
  }

  // 行ごとではなく一覧親要素でクリックを受け、動的に生成した操作ボタンを処理する。
  elements.materialsTableBody.addEventListener("click", handleMaterialTableClick);
  Object.values(elements.shortcutTableBodies).forEach((tableBody) => {
    tableBody.addEventListener("click", handleMaterialTableClick);
  });

  function handleAnnouncementTableClick(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    const { action, id } = button.dataset;

    if (action === "edit-announcement") {
      const announcement = data.announcements.find(
        (item) => item.id === id
      );

      if (announcement) {
        openAnnouncementEditor(announcement);
      }
    }

    if (action === "toggle-announcement") {
      toggleAnnouncement(id);
    }

    if (action === "delete-announcement") {
      deleteAnnouncement(id);
    }
  }

  // 通常のお知らせ一覧と今日のお知らせ一覧で同じ編集・表示・削除処理を利用する。
  elements.announcementsTableBody.addEventListener(
    "click",
    handleAnnouncementTableClick
  );
  elements.dailyAnnouncementsTableBody.addEventListener(
    "click",
    handleAnnouncementTableClick
  );

  window.addEventListener("storage", (event) => {
    if (
      event.key !== dataApi.STORAGE_KEY &&
      event.key !== null
    ) {
      return;
    }

    refreshData();
  });

  /* =========================
     初期表示
  ========================= */

  // 保存データから管理対象の一覧・選択肢をまとめて再描画する。
  function renderAll() {
    renderMaterialTable();
    renderShortcutTables();
    renderAnnouncementTable();
    renderDailyAnnouncementTable();
    populateAnnouncementTypes(elements.announcementType.value);
    populateMaterialCategories(
      elements.materialCategory.value
    );
  }

  renderAll();
})();
