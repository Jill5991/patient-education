# 空白衛教單張模板

- 位置：`blank_guides/`
- 共 59 份，一藥一檔（JSON）
- 可直接編輯每一檔的 `name/subtitle/badge/steps/warnings/qrUrl`
- 進階可選欄位：
  - `usage`：標題區第三行說明文字
  - `emergencyLabel`：覆寫預設「⚠ 緊急備用」標籤文字
  - `preStepsInfo`：主步驟前說明框（不編號）
  - `infoBoxes`：主步驟後補充說明框（可多個）
  - `warnings[].highlight`：單條警示加粗強調
- 所有語言鍵已建立：`zh-TW/en/id/vi/th/tl/ja`

若要同步到 `index.html` 的顯示內容，可把對應資料貼回 `MEDICATIONS` 陣列。
