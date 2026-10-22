
/*
 * Center-HP-Renewal-Demo
 * 共通データ管理
 *
 * 架空データ専用。
 * localStorageを使ってブラウザ内に保存する。
 */

(() => {
  "use strict";

  const STORAGE_KEY = "centerPortalRenewalDemoData";

  const initialData = {
    categories: [
      {
        id: "bd",
        name: "BD",
        details: [
          { id: "bd-detail-1", name: "詳細カテゴリーA" },
          { id: "bd-detail-2", name: "詳細カテゴリーB" }
        ]
      },
      {
        id: "eb",
        name: "EB",
        details: [
          { id: "eb-detail-1", name: "詳細カテゴリーA" },
          { id: "eb-detail-2", name: "詳細カテゴリーB" }
        ]
      },
      {
        id: "all",
        name: "全体",
        details: [
          { id: "all-detail-1", name: "詳細カテゴリーA" },
          { id: "all-detail-2", name: "詳細カテゴリーB" }
        ]
      }
    ],

    materials: [
      {
        id: "material-demo-001",
        title: "【デモ】問い合わせ対応の基本手順",
        categoryId: "bd",
        detailId: "bd-detail-1",
        type: "業務手順",
        description: "問い合わせ対応の流れを確認するための架空資料です。",
        content:
          "これは架空のデモ資料です。\n実際の業務情報や社内情報は含まれていません。",
        updatedAt: "2026-10-22",
        hidden: false
      },
      {
        id: "material-demo-002",
        title: "【デモ】回答内容の確認ポイント",
        categoryId: "eb",
        detailId: "eb-detail-1",
        type: "問い合わせへの回答方法",
        description: "回答前に確認する項目をまとめた架空資料です。",
        content:
          "これは架空のデモ資料です。\n実際の問い合わせ内容や顧客情報は含まれていません。",
        updatedAt: "2026-10-22",
        hidden: false
      },
      {
        id: "material-demo-003",
        title: "【デモ】画面操作ガイド",
        categoryId: "all",
        detailId: "all-detail-1",
        type: "システム操作方法",
        description: "架空システムの操作を説明するデモ資料です。",
        content:
          "これは架空のデモ資料です。\n実際の社内システム情報は含まれていません。",
        updatedAt: "2026-10-22",
        hidden: true
      }
    ],

    announcements: [
      {
        id: "announcement-demo-001",
        title: "【デモ】ポータル更新のお知らせ",
        date: "2026-10-22",
        type: "お知らせ",
        content: "これは表示確認用の架空のお知らせです。",
        hidden: false
      }
    ],

    history: [
      {
        id: "history-demo-001",
        title: "デモデータを初期登録",
        date: "2026-10-22"
      }
    ]
  };

  function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        const freshData = cloneData(initialData);
        saveData(freshData);
        return freshData;
      }

      const parsed = JSON.parse(saved);

      if (
        !parsed ||
        !Array.isArray(parsed.categories) ||
        !Array.isArray(parsed.materials) ||
        !Array.isArray(parsed.announcements) ||
        !Array.isArray(parsed.history)
      ) {
        throw new Error("保存データの形式が正しくありません。");
      }

      return parsed;
    } catch (error) {
      console.error("データの読み込みに失敗しました。", error);
      return cloneData(initialData);
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("データの保存に失敗しました。", error);
      return false;
    }
  }

  function createId(prefix = "item") {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}`;
  }

  function addHistory(data, title) {
    data.history.unshift({
      id: createId("history"),
      title,
      date: new Date().toISOString().slice(0, 10)
    });

    data.history = data.history.slice(0, 100);
  }

  window.CenterPortalData = {
    STORAGE_KEY,
    initialData: cloneData(initialData),
    loadData,
    saveData,
    createId,
    addHistory
  };
})();
