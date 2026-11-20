# 合作藥局使用與登入設定

本專案的程式碼仍由 `Jill5991/patient-education` GitHub 儲存庫管理。單張網站可另由 Cloudflare Pages 從同一儲存庫部署，並用 Cloudflare Access 限制藥局人員登入。**目前的 GitHub Pages 網址仍是公開網站；完成下列部署、測試與影片 QR 遷移前，不得宣稱單張已限制存取。**

## 1. 登錄藥局及發放網址

只有儲存庫管理者修改根目錄的 `pharmacy-config.js`。為每家合作藥局加一個不含空白、僅用小寫英文字母／數字／連字號的 ID，例如：

```js
window.PHARMACY_CONFIG = {
  defaultId: "jiahe",
  pharmacies: {
    jiahe: { name: "佳禾藥局", phone: "03-482-7805" },
    "partner-a": { name: "合作藥局名稱", phone: "02-1234-5678" }
  }
};
```

管理者確認藥局名稱、電話後提交變更；藥局使用例如 `https://<專案名>.pages.dev/?pharmacy=partner-a` 的專屬書籤。未登錄的 ID 會停止顯示單張，避免以任意網址文字冒名列印。未帶 `pharmacy` 參數時使用 `defaultId`，維持現有佳禾藥局版面。合作藥局正式使用前仍須核對其供應藥品、產品仿單及院所衛教流程。

**藥局 ID 不是密碼，也不代表登入身分。**所有獲准登入此靜態網站的人都能改網址選擇另一個已登錄的 ID。管理者應先核對合作藥局資料及列印樣張，發給每家藥局正確書籤；若日後要求每家只能列印自己的抬頭，需增加由伺服端驗證登入身分並決定抬頭的功能，不能只靠網址參數。

## 2. 從同一 GitHub 儲存庫部署受保護的單張網站

1. 在自己的 Cloudflare 帳號建立 Pages 專案，連接 `Jill5991/patient-education`，正式分支選 `main`。[Cloudflare Git 整合說明](https://developers.cloudflare.com/pages/get-started/git-integration/)
2. Framework preset 選 **None**；Build command 設 `node scripts/build-pharmacy-site.js`；Build output directory 設 `dist`。若建置環境的 Node 版本過舊，設定 `NODE_VERSION=20`。建置只複製網站、影片登錄檔和圖片，不發布 `reviews/`、`tests/` 等內部檔案。
3. 部署完成後先不要發給合作藥局。Cloudflare Pages 的「Enable access policy」起初只保護預覽部署，**不會自動保護正式的 `<專案名>.pages.dev` 網址**。依 [Cloudflare Pages 正式網址保護步驟](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain)，在 Access application 的 Public hostname 把預覽用萬用字元 `*` 移除，改成正式網址；再啟用預覽部署的 Access policy。
4. 在 Cloudflare Zero Trust 加入 **One-time PIN** 登入方式。為此網站建立 **Allow** 政策，只列出你核准的藥局人員個別電子郵件地址；不要使用 Everyone、所有電子郵件或不受控的整個網域。收件者會在登入頁輸入電子郵件，收取一次性驗證碼後進入網站。[一次性驗證碼說明](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/)、[Access 政策說明](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/)
5. 若改用自訂網域，須另為該網域建立並測試 Access application 與 Allow 政策，不能假設 `pages.dev` 的政策會自動保護自訂網域。[Cloudflare Pages 已知事項](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain)

## 3. 發放前驗證

- 用無痕視窗開正式網址：未登入時必須先看到 Cloudflare Access 登入頁；未核准的電子郵件不得進入。
- 用已核准電子郵件登入，分別開 `?pharmacy=jiahe` 和一個合作藥局 ID，核對頁尾名稱、電話、圖片、七語切換與 B5 列印樣張。
- 用不存在的 `?pharmacy=unknown`，確認單張及列印按鈕不顯示。
- 測試預覽網址、自訂網域（若有）與直接的圖片網址，均不得繞過 Access。
- 撤銷一位測試帳號，再確認該帳號不能重新登入。

## 4. 原公開網址與病人影片 QR

目前 `https://Jill5991.github.io/patient-education/` 是公開的 GitHub Pages 單張；只替新的 Pages 網站加 Access，**無法阻止別人從舊網址看到同一套單張**。[GitHub Pages 公開存取說明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

目前已印單張的影片 QR 也指向舊網址的 `video.html`。若直接關閉舊 GitHub Pages，這些 QR 會失效。正式改成「合作藥局登入、病人仍可掃影片」前，需要保留原 `video.html` 路徑作為**只提供影片的公開站**，將單張 `index.html`、藥局設定及全部圖片移到 Access 保護站；舊網址只保留影片頁和 `approved-videos.json`。公開影片頁的「返回單張」連結屆時也須改指受保護網址，或移除該連結。完成病人 QR 實測後，再移除舊站的公開單張。已印單張的 QR 需繼續指向可用的影片頁。

本次程式變更完成的是**可管理的列印抬頭與受保護部署所需的建置方式**。Cloudflare 帳號、核准人員電子郵件、Access 政策與舊網址影片遷移仍須由管理者完成並驗收；在此之前，現有網站仍按原本公開方式運作。
