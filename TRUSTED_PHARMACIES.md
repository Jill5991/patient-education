# 合作藥局登入與部署

程式碼留在 `Jill5991/patient-education`。正式藥局網址是 `https://patient-education-bil.pages.dev/`。Cloudflare Pages 使用根目錄 `functions/_middleware.js` 驗證 Google 帳號；`dist/_routes.json` 讓首頁、程式、圖片及影片登錄檔都經過驗證。啟用 `PHARMACY_EMAIL_MAP` 後，每個核准的 Google 電郵固定對應一個藥局抬頭。

## 絕不綁定可自動扣款的卡

這個方案使用 **Cloudflare Pages + Pages Functions 的 Workers Free 方案**，不用啟用 Zero Trust Free，也不要填寫金融卡或勾選超額扣款授權。若 Cloudflare 或 Google 的任何畫面要求綁卡、開啟付費方案，**停止該流程**，不要自行接受。Cloudflare Workers Free 每日 100,000 次請求；本網站的每張圖片請求也會計入。用量超過後必須讓網站停止回應，絕不可繞過驗證供應單張。

## 1. 建立 Google 登入憑證

1. 在 [Google Auth Platform](https://console.cloud.google.com/auth/overview) 建立或選取專案，設定品牌／同意畫面。使用者類型選 **External**，只要求 `openid` 與 `email`。若畫面要求建立帳單帳戶或填卡，停止並回報。
2. 在 **Clients** 建立 **Web application** OAuth 用戶端。Authorized redirect URI 必須精確填入 `https://patient-education-bil.pages.dev/auth/callback`。
3. **不要選 Personal**：此模式不能讓其他藥局人員登入，之後也不能改成 External。Google 同意畫面的發布狀態和測試使用者設定須在提供合作藥局前確認；本站的授權則由 `PHARMACY_EMAIL_MAP` 執行。
4. 自己保存 Client ID 和 Client secret。**不要傳到聊天、提交到 GitHub 或放入網頁。**

Google 設定說明：[OAuth 用戶端](https://support.google.com/cloud/answer/15549257)、[OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)。

## 2. 設定 Cloudflare Pages

在 **Workers & Pages > patient-education > Settings > Variables and Secrets** 新增下列值。此 Cloudflare 介面可能沒有獨立的 **Production** 選項；新增在正式專案的設定頁即可，之後重新部署讓變更生效。

| 名稱 | 值 | 類型 |
| --- | --- | --- |
| `APP_ORIGIN` | `https://patient-education-bil.pages.dev` | 文字 |
| `GOOGLE_CLIENT_ID` | Google Web application 的 Client ID | 文字 |
| `GOOGLE_CLIENT_SECRET` | Google Web application 的 Client secret | **Encrypt** |
| `SESSION_SECRET` | 自己產生至少 32 字元的隨機秘密字串 | **Encrypt** |
| `ALLOWED_EMAILS` | 舊版名單；未設定 `PHARMACY_EMAIL_MAP` 時，名單內所有人暫時對應 `jiahe` | **Encrypt** |
| `PHARMACY_EMAIL_MAP` | JSON 物件：核准的 Google 電郵對應藥局 ID；見第 3 節 | **Secret** |

加入後重新部署 `main`。如未設定完整，網站回應 503，不會公開單張。**不要將上述值貼給協助者。**

在 **Settings > Runtime > Fail open / closed** 設為 **Fail closed**。這是必要的安全設定：免費額度用完或 Functions 無法執行時，網站應回錯誤頁，而不是直接展示靜態內容。[Cloudflare 官方說明](https://developers.cloudflare.com/pages/functions/routing/#fail-open--closed)

## 3. 登錄合作藥局及核准人員

1. 先在 `pharmacy-config.js` 的 `pharmacies` 加入藥局 ID、抬頭名稱及電話，提交至 GitHub。ID 只用小寫英文字母、數字及連字號，例如 `partner-a`。
2. 在 Cloudflare 的 **Variables and Secrets > ＋ Add**，選 **Secret**，名稱填 `PHARMACY_EMAIL_MAP`，值填完整的 JSON 對應表。例如：

   ```json
   {"owner@example.com":"jiahe","staff1@example.com":"partner-a","staff2@example.com":"partner-a"}
   ```

   `owner@example.com` 要換成管理者目前登入使用的 Google 電郵；**第一次設定也要把自己寫進去**。`PHARMACY_EMAIL_MAP` 一旦存在，就以它為唯一授權名單，`ALLOWED_EMAILS` 不再額外放行任何人。日後增加或移除人員時，修改整份 JSON 並重新部署；移除後，舊工作階段也會失效。
3. 合作人員開啟 `https://patient-education-bil.pages.dev/`，用各自的 Google 帳號登入。伺服端會帶到所屬藥局的 `?pharmacy=<藥局ID>`。即使手動輸入別家藥局 ID，也會導回自己的藥局。單張上方會顯示抬頭與 Google 帳號。

**藥局 ID 不是密碼。**授權取決於 Cloudflare Secret 中的 Google 電郵對應表；不要把合作人員電郵或 Secret 寫進公開的 GitHub。抬頭及電話設定在公開的 `pharmacy-config.js`，所以抬頭資料本身並不保密。此綁定可防止正常操作時選錯抬頭；如需防止有人修改瀏覽器內容後製作偽造列印件，還需要伺服端產生並簽署文件。

## 4. 驗收

- 無痕視窗開正式網址，必須導向 Google；直接打開圖片網址也不得顯示圖片。
- 已登入時單張上方顯示 Google 帳號與「登出」。本站工作階段有效 12 小時；登出只清除本站工作階段，共用裝置還應登出 Google 帳號或使用無痕視窗。
- 用管理者及合作藥局各一個 Google 帳號分別登入，核對抬頭、電話、單張、圖片、七語切換及 B5 列印。嘗試把網址的 `pharmacy` 改成別家 ID，應導回本人藥局。
- 未列入 `PHARMACY_EMAIL_MAP` 的 Google 帳號必須被拒絕。從對應表移除測試帳號後，已開啟的工作階段也必須失效。
- 檢查預覽部署網址不得開啟單張；自訂網域若未另設定 `APP_ORIGIN`，也會拒絕。
- 在 Cloudflare 確認 Workers 方案仍是 **Free**、Fail closed 已開啟，並觀察每日 Functions 請求量。

## 舊公開網址與病人影片 QR

`https://Jill5991.github.io/patient-education/` 目前只公開影片頁，沒有完整單張。Google 登入只保護 Cloudflare 網址。影片 QR 指向該 GitHub Pages 網址的 `video.html`，不可直接關閉。

公開影片頁由 `docs/` 發布。GitHub 儲存庫 **Settings > Pages > Build and deployment** 應維持 **Deploy from a branch**、`main`、`/docs`。[GitHub 官方步驟](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

部署完成後，開舊網址根目錄，確認不再有完整單張；用舊的 `video.html?med=trelegy-ellipta&lang=en` 及其他語言 QR 實測影片仍能播放、資料檔仍可載入。之後每次更新影片頁或影片登錄檔，都要重新執行建立腳本，並提交同步後的 `docs/`。

**即使 Pages 只發布影片，公開的 GitHub 儲存庫原始碼仍可被任何人查看。**若要對單張內容本身保密，須另將主儲存庫設為私人，並安排影片頁的公開託管；這與目前「程式碼留在 GitHub」的要求可以並存，但需額外遷移。
