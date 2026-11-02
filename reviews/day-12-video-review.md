# Day 12 貼片單張插圖與影片接入紀錄

來源：[day-12-summary.md](https://docs.google.com/document/d/1nMCuMze6drpiqUFf9UdnBmwqB1QbUt2wg8nCwiWBIHo/edit)，批次執行日期 2026-11-02。day-11-summary.md 的 10 個藥品及 56 張圖已由前次提交接入。本批 6 份 records.json 的步驟數、Drive 檔案 ID 與單張內容逐一核對。

| 單張 | 插圖 | 已接入影片 | 無合適影片 |
| --- | ---: | ---: | ---: |
| exelon-patch | 7 | 4 | 3 |
| flurbiprofen-patch | 5 | 2 | 5 |
| lidopat-patch | 6 | 2 | 5 |
| neupro-patch | 7 | 2 | 5 |
| granisetron-patch | 6 | 1 | 6 |
| sovenor-patch | 7 | 2 | 5 |
| **合計** | **38** | **13** | **29** |

38 張圖均為可解碼的 1200 × 896 PNG；逐張檢視主要動作、貼片形狀、部位與時間圖示，並依步驟順序接入七語共用路徑。13 個不同的 YouTube 候選影片 ID 均可取得 oEmbed 標題及頻道；其中 1 支候選用在兩個藥品，故原有 14 個語言候選位置。oEmbed 核對不能代替逐字稿審核；本次同時檢查候選紀錄、單張文字及重要用藥時間。

Neupro 英文候選是病友的 ASMR 拆盒影片，主要展示外包裝與貼法，未完整說明每日更換及 14 天輪替。它不適合作為此專案的英文衛教影片，故英文位置設為 `no_suitable_video`。Neupro [原廠英文用藥說明](https://www.neupro.com/parkinsons-disease/transdermal-patch)有完整貼法影片，但影片嵌在 Vimeo，現有 QR 播放頁只支援 YouTube，未改用非 YouTube 連結。

菲比藥膠布和遠疼貼片的繁中候選為[同一支雙和醫院影片](https://www.youtube.com/watch?v=itawgmKZdDk)。兩個 QR 播放頁分別加上繁中提示，指明對應藥品及更換規則。舒疼痛日文候選另談硝酸異山梨酯貼片，播放頁標明本單張是丁基原啡因 7 日貼片，避免套用另一種藥的說明。

關鍵時間與原廠或官方資料交叉核對：Exelon 每 24 小時更換、原位置至少間隔 14 天（[DailyMed](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5d7c4d41-2df4-42d4-9a3d-0a567519bf2d)）；Sancuso 在化療前 24–48 小時貼上，化療後至少 24 小時取下，最長 7 天（[原廠仿單](https://sancuso.com/wp-content/uploads/2025/08/full-prescribing-information.pdf)）。其餘無候選的位置明確標記 `no_suitable_video`。
