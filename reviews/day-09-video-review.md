# Day 09 外用藥單張插圖與影片接入紀錄

來源：[2026-10-30 day-09-summary.md](https://docs.google.com/document/d/1ZcRolNB2AaGFdJYauOFuoBSdqUqqGSL1w0C7HitKEmg/edit?usp=drivesdk)、十份 `records.json` 與十份七語影片候選 JSON。依使用者要求接入並推送。

| 單張 | 步驟插圖 | 已接入影片 | 無合適影片 |
| --- | ---: | ---: | ---: |
| topical-steroids | 5 | 6 | 1 |
| vimax-foaming-solution | 5 | 0 | 7 |
| acyclovir-cream | 5 | 2 | 5 |
| azelaic-acid | 5 | 6 | 1 |
| brimonidine-gel | 5 | 1 | 6 |
| calcipotriol-ointment | 5 | 2 | 5 |
| calcitriol-ointment | 5 | 0 | 7 |
| clindamycin-topical | 5 | 5 | 2 |
| clotrimazole-topical-cream | 5 | 5 | 2 |
| doxepin-cream | 5 | 0 | 7 |
| **合計** | **50** | **27** | **43** |

50 張圖依最新版 `records.json` 的 Drive 檔案 ID 下載、核對順序及圖面，均為 1200 × 896 PNG。五張重繪圖為 `brimonidine-gel/step-00`、`calcitriol-ointment/step-00`、`step-03`、`step-04`、`clindamycin-topical/step-04`；接入的是記錄中更新後的檔案 ID。

27 個 YouTube ID 均於接入當天成功取得 oEmbed 資料。`topical-steroids` 的越南語及泰語頻道名稱、`azelaic-acid` 的繁中影片標題與頻道名稱，採用 YouTube 目前顯示的資料。其他 43 個語言位置明確標為 `no_suitable_video`，播放頁會顯示無合適影片。

`brimonidine-gel` 英文候選影片示範將豌豆大小的藥量分別擦於五個臉部區域，現有單張則從總量一粒豌豆大小開始。播放頁加入英文提醒，說明兩者用量差異、遵照處方指示，且每日總量不得超過五粒豌豆大小。[美國 Mirvaso 仿單](https://www.galderma.com/us/sites/default/files/Mirvaso_PI.pdf)列出五個區域各一粒豌豆大小；[英國 Mirvaso 病人仿單](https://www.medicines.org.uk/emc/product/5303/pil)列出開始時使用較少量並逐步增加、最高五粒豌豆大小。

本次僅提交 Day 09 接入內容；工作目錄原有、未提交的其他單張變更與測試檔未納入本次推送。
