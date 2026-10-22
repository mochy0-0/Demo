
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

  const elements = {
    tabs: document.querySelectorAll(".admin-tab"),

    materialsPanel: document.getElementById("materialsPanel"),
    announcementsPanel: document.getElementById("announcementsPanel"),

    materialEditorPanel: document.getElementById("materialEditorPanel"),
    announcementEditorPanel: document.getElementById(
      "announcementEditorPanel"
    ),

    materialsTableBody: document.getElementById("materialsTableBody"),
    announcementsTableBody: document.getElementById(
      "announcementsTableBody"
    ),

    materialsMessage: document.getElementById("materialsMessage"),
    announcementsMessage: document.getElementById(
      "announcementsMessage"
    ),

    materialSearch: document.getElementById("adminMaterialSearch"),
    materialStatusFilter: document.getElementById(
      "materialStatusFilter"
    ),

    addMaterialButton: document.getElementById("addMaterialButton"),
    addAnnouncementButton: document.getElementById(
      "addAnnouncementButton"
    ),

    materialForm: document.getElementById("materialForm"),
    materialId: document.getElementById("materialId"),
    materialTitle: document.getElementById("materialTitle"),
    materialCategory: document.getElementById("materialCategory"),
    materialDetail: document.getElementById("materialDetail"),
    materialType: document.getElementById("materialType"),
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

  function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

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

  function showPanel(panel) {
    elements.materialsPanel.hidden = panel !== "materials";
    elements.announcementsPanel.hidden = panel !== "announcements";

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

  function renderMaterialTable() {
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

      return matchesKeyword && matchesStatus;
    });

    elements.materialsTableBody.innerHTML = "";

    if (filtered.length === 0) {
      elements.materialsTableBody.innerHTML = `
        <tr>
          <td colspan="5">該当する資料はありません。</td>
        </tr>
      `;
    } else {
      filtered.forEach((material) => {
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

        elements.materialsTableBody.appendChild(row);
      });
    }

    elements.materialsMessage.textContent =
      `全${data.materials.length}件中 ${filtered.length}件を表示しています。`;
  }

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

  function openMaterialEditor(material = null) {
    elements.materialForm.reset();

    elements.materialId.value = material?.id ?? "";
    elements.materialTitle.value = material?.title ?? "";
    elements.materialType.value = material?.type ?? "";
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

  function saveMaterial(event) {
    event.preventDefault();

    const id = elements.materialId.value;
    const title = elements.materialTitle.value.trim();
    const categoryId = elements.materialCategory.value;
    const detailId = elements.materialDetail.value;
    const type = elements.materialType.value.trim();
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
    }
  }

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

  function renderAnnouncementTable() {
    elements.announcementsTableBody.innerHTML = "";

    if (data.announcements.length === 0) {
      elements.announcementsTableBody.innerHTML = `
        <tr>
          <td colspan="4">お知らせはありません。</td>
        </tr>
      `;
    } else {
      data.announcements.forEach((announcement) => {
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
    }

    elements.announcementsMessage.textContent =
      `全${data.announcements.length}件のお知らせを管理しています。`;
  }

  function openAnnouncementEditor(announcement = null) {
    elements.announcementForm.reset();

    elements.announcementId.value = announcement?.id ?? "";
    elements.announcementTitle.value = announcement?.title ?? "";
    elements.announcementDate.value =
      announcement?.date ?? getToday();
    elements.announcementType.value =
      announcement?.type ?? "お知らせ";
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
    }
  }

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

  elements.materialSearch.addEventListener("input", renderMaterialTable);

  elements.materialStatusFilter.addEventListener(
    "change",
    renderMaterialTable
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

  elements.cancelAnnouncementEdit.addEventListener("click", () => {
    closeAnnouncementEditor();
  });

  elements.materialsTableBody.addEventListener("click", (event) => {
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
  });

  elements.announcementsTableBody.addEventListener(
    "click",
    (event) => {
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

  function renderAll() {
    renderMaterialTable();
    renderAnnouncementTable();
    populateMaterialCategories(
      elements.materialCategory.value
    );
  }

  renderAll();
})();
