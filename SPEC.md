# 用藥指導單張系統 — Claude Code 操作手冊

## 概覽

本系統包含三個檔案：

| 檔案 | 用途 |
|------|------|
| `index.html` | 主應用程式（自包含，可直接在 iPad Safari 開啟） |
| `content.json` | 藥品內容資料（參考格式，供 Claude Code 閱讀） |
| `SPEC.md` | 本檔案 — Claude Code 操作說明 |

---

## 設計系統

### 紙張比例
B5（176 × 250mm），對應 iPad 10.5"。`max-width: 500px`。

### 色彩規則
每種藥品有一組色彩：

```javascript
color: {
  main:      "#0F6E56",   // 頂部色帶、步驟圓圈、分隔線、按鈕 active 框色
  light:     "#E1F5EE",   // 頭部背景、infobox 背景
  dark:      "#04342C",   // 頭部文字、infobox 文字
  badge:     "#9FE1CB",   // 劑型標籤背景
  badgeText: "#04342C"    // 劑型標籤文字
}
```

#### 建議色彩（Müller-Brockmann 系統，主色配淺色）
| 類別 | main | light | dark | badge | badgeText |
|------|------|-------|------|-------|-----------|
| 吸入劑 / 抗生素泡製 | #0F6E56 | #E1F5EE | #04342C | #9FE1CB | #04342C |
| NTG 舌下錠（緊急） | #993C1D | #FAECE7 | #4A1B0C | #F5C4B3 | #4A1B0C |
| 外用藥 / 貼片 | #3B6D11 | #EAF3DE | #173404 | #C0DD97 | #173404 |
| 眼藥水 / 耳藥 | #185FA5 | #E6F1FB | #042C53 | #B5D4F4 | #042C53 |
| 栓劑（陰道 / 肛門） | #534AB7 | #EEEDFE | #26215C | #AFA9EC | #26215C |
| 皮下注射劑 | #854F0B | #FAEEDA | #412402 | #FAC775 | #412402 |
| 戒菸用藥 | #27500A | #EAF3DE | #173404 | #97C459 | #173404 |

### 步驟文字規則（CDC Health Communication Playbook）
1. 每步驟以**動詞**開頭（搖動 / Shake / Kocok / Lắc）
2. 一步驟只含一個動作
3. 所有數字用阿拉伯數字（不用中文數字）
4. `action`：≤ 20 字，粗體，11px
5. `note`：補充說明，≤ 20 字，灰色，9.5px
6. `highlight: true`：緊急步驟（紅底色）

---

## 新增藥品

在 `index.html` 的 `MEDICATIONS` 陣列最後加入以下結構：

```javascript
{
  id: "unique-id",             // 英文小寫，用於 QR URL
  color: { main, light, dark, badge, badgeText },  // 見上表
  emergency: false,            // true = 顯示紅色緊急標籤
  name: {
    "zh-TW": "…", "en": "…", "id": "…",
    "vi": "…",    "th": "…", "tl": "…", "ja": "…"
  },
  subtitle: { /* 同上 7 語言 */ },
  badge:    { /* 同上 7 語言 — 劑型短標籤 */ },
  steps: [
    {
      action: { /* 7 語言 */ },   // 必填
      note:   { /* 7 語言 */ },   // 可選
      highlight: false             // 可選，true = 緊急步驟紅底
    }
    // … 最多 8 個步驟
  ],
  storage: {                      // 可選（只有 NTG 等需要特別說明保存的才加）
    title: { /* 7 語言 */ },
    text:  { /* 7 語言 */ }
  },
  warnings: [
    { "zh-TW":"…", "en":"…", /* 7 語言 */ }
    // 2–3 條
  ],
  qrUrl: "https://pharmacy.example.com/meds/unique-id"
}
```

---

## 新增語言

1. 在 `LANGS` 陣列加入：
```javascript
{ code:"ms", label:"Bahasa Melayu", flag:"🇲🇾" }
```

2. 在 `UI` 物件的每個 key 加入 `"ms": "…"`

3. 在每個 `MEDICATIONS` 物件的 `name`、`subtitle`、`badge`、每個 `step.action`、`step.note`、`warnings` 加入 `"ms": "…"`

4. 若 `storage` 存在也要加入

> Claude Code 提示：搜尋 `"ja":` 可找到所有需要加入新語言的位置。

---

## 修改藥局資訊

在 `render()` 函式中找到：
```javascript
○○ ${ui("pharmacy")} &nbsp; Tel: 02-XXXX-XXXX
```
替換為實際藥局名稱與電話。

---

## 修改 QR Code 目標 URL

將每個藥品物件的：
```javascript
qrUrl: "https://pharmacy.example.com/meds/mdi"
```
替換為實際 URL。QR code 會自動在 URL 後附加 `?lang=zh-TW`（或對應語言碼）。

**QR code 規格**：
- 尺寸：64 × 64px（螢幕），印刷建議 22mm
- Error correction: M（15%）
- 顏色：#1A1A1A 黑色，白底

---

## 列印

iPad Safari：點擊「列印」按鈕 → 選擇印表機或存為 PDF。

列印時自動隱藏頂部工具列與語言列，僅顯示單張主體。

---

## 各藥品類型特殊欄位提醒

| 藥品類型 | 特殊要求 |
|---------|---------|
| NTG 舌下錠 | `emergency: true`；加入 `storage` 欄位；第 4 步必須 `highlight: true` |
| 吸入劑（steroid） | 最後一步必含漱口說明；warnings 含念珠菌提醒 |
| 眼藥水 | steps 含淚管按壓（punctal occlusion）；warnings 含開封效期 |
| 栓劑 | `emergency: false`；name 可用較小字，不強調大標題（設計上與其他類別相同，藥師操作時自行注意隱私） |
| 皮下注射劑 | steps ≥ 7，可考慮分兩張（在 SPEC 中另做第二面） |
| 抗生素泡製 | 在 steps 中明確標示加水毫升數與冷藏天數，用 `highlight` 強調 |

---

## 版本歷史

| 版本 | 日期 | 說明 |
|------|------|------|
| 1.0 | 2026-04 | 初版：4 藥品、7 語言、QR code |

---

## 健康素養參考來源

- CDC Health Communication Playbook (2021)
- NIH Clear Communication: Language Access
- Müller-Brockmann, *Grid Systems in Graphic Design* (1981)
- Schiavo, *Health Communication: From Theory to Practice* (2nd ed.)
