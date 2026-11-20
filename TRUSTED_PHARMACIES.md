# 合作藥局登入與部署

程式碼留在 `Jill5991/patient-education`。正式藥局網址是 `https://patient-education-bil.pages.dev/`。Cloudflare Pages 使用根目錄 `functions/_middleware.js` 驗證 Google 帳號；`dist/_routes.json` 讓首頁、程式、圖片及影片登錄檔都經過驗證。登入只允許 `ALLOWED_EMAILS` 中的地址。

## 絕不綁定可自動扣款的卡

這個方案使用 **Cloudflare Pages + Pages Functions 的 Workers Free 方案**，不用啟用 Zero Trust Free，也不要填寫金融卡或勾選超額扣款授權。若 Cloudflare 或 Google 的任何畫面要求綁卡、開啟付費方案，**停止該流程**，不要自行接受。Cloudflare Workers Free 每日 100,000 次請求；本網站的每張圖片請求也會計入。用量超過後必須讓網站停止回應，絕不可繞過驗證供應單張。

## 1. 建立 Google 登入憑證

1. 在 [Google Auth Platform](https://console.cloud.google.com/auth/overview) 建立或選取專案，設定品牌／同意畫面。使用者類型選 **External**，只要求 `openid` 與 `email`。若畫面要求建立帳單帳戶或填卡，停止並回報。
2. 在 **Clients** 建立 **Web application** OAuth 用戶端。Authorized redirect URI 必須精確填入 `https://patient-education-bil.pages.dev/auth/callback`。
3. **不要選 Personal**：此模式不能讓其他藥局人員登入，之後也不能改成 External。External 的 Testing 狀態若只要求 `openid` 與 `email`，Google 目前允許一般 Google 帳號登入；真正的使用限制由本站 `ALLOWED_EMAILS` 執行。正式提供合作藥局前，仍須檢查 Google 同意畫面和發布狀態。
4. 自己保存 Client ID 和 Client secret。**不要傳到聊天、提交到 GitHub 或放入網頁。**

Google 設定說明：[OAuth 用戶端](https://support.google.com/cloud/answer/15549257)、[OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)。

## 2. 設定 Cloudflare Pages

在 **Workers & Pages > patient-education > Settings > Variables and Secrets** 的 **Production** 環境新增：

| 名稱 | 值 | 類型 |
| --- | --- | --- |
| `APP_ORIGIN` | `https://patient-education-bil.pages.dev` | 文字 |
| `GOOGLE_CLIENT_ID` | Google Web application 的 Client ID | 文字 |
| `GOOGLE_CLIENT_SECRET` | Google Web application 的 Client secret | **Encrypt** |
| `SESSION_SECRET` | 自己產生至少 32 字元的隨機秘密字串 | **Encrypt** |
| `ALLOWED_EMAILS` | 核准人員的完整 Google 電郵，逗號分隔；先只放自己 | **Encrypt** |

加入後重新部署 `main`。如未設定完整，網站回應 503，不會公開單張。**不要將上述值貼給協助者。**

在 **Settings > Runtime > Fail open / closed** 設為 **Fail closed**。這是必要的安全設定：免費額度用完或 Functions 無法執行時，網站應回錯誤頁，而不是直接展示靜態內容。[Cloudflare 官方說明](https://developers.cloudflare.com/pages/functions/routing/#fail-open--closed)

## 3. 登錄合作藥局及核准人員

管理者在 `pharmacy-config.js` 新增藥局 ID、名稱和電話，並在 Cloudflare 的 `ALLOWED_EMAILS` 加入該藥局個別人員的 Google 電郵。人員用 `https://patient-education-bil.pages.dev/?pharmacy=<藥局ID>` 開啟。未登錄的 ID 不顯示單張。

**藥局 ID 不是密碼。**目前所有已登入的人都能切換到其他已登錄藥局的抬頭；發放前須核對印出的抬頭。若要求不同藥局的人只能使用自己的抬頭，仍需另做伺服端身分與藥局對應。

## 4. 驗收

- 無痕視窗開正式網址，必須導向 Google；直接打開圖片網址也不得顯示圖片。
- 核准帳號登入後核對單張、圖片、七語切換及 B5 列印。
- 未列入 `ALLOWED_EMAILS` 的 Google 帳號必須被拒絕。從名單移除測試帳號後，已開啟的工作階段也必須立即失效。
- 檢查預覽部署網址不得開啟單張；自訂網域若未另設定 `APP_ORIGIN`，也會拒絕。
- 在 Cloudflare 確認 Workers 方案仍是 **Free**、Fail closed 已開啟，並觀察每日 Functions 請求量。

## 舊公開網址與病人影片 QR

`https://Jill5991.github.io/patient-education/` 仍是**公開的完整單張網站**。目前 Google 登入只保護 Cloudflare 網址，不能宣稱整套內容已限制存取。既有單張上的影片 QR 指向該 GitHub Pages 網址的 `video.html`；不能直接關閉而讓已印的 QR 失效。後續須把 GitHub Pages 改成僅公開影片頁與 `approved-videos.json`，實測 QR 後再撤下舊的公開單張。完成前請勿將 Cloudflare 網址稱為唯一入口。
