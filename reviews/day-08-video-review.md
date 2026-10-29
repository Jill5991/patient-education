# Day 08 口服單張插圖與影片接入紀錄

來源：[2026-10-29 day-08-summary.md](https://docs.google.com/document/d/1k4AsKQOVHrjlJoE6TgbbIBbmMmDkpOQasVw7kmBbFzE/edit)、各頁 `records.json` 與五份七語影片候選 JSON。使用者要求接入並推送。

| 單張 | 頁數 | 步驟插圖 | 已接入影片 | 無合適影片 |
| --- | ---: | ---: | ---: | ---: |
| kocel | 1 | 5 | 6 | 1 |
| chalian-kalimate | 1 | 5 | 1 | 6 |
| acute-gi-care-kit | 5 | 30 | 7 | 0 |
| pediatric-oral-admin | 1 | 8 | 7 | 0 |
| no-crush-evidence | 1 | 7 | 6 | 1 |
| **合計** | **9** | **55** | **27** | **8** |

55 張圖依各頁紀錄的 Drive 檔案 ID 下載，逐頁核對順序、圖面與單張步驟。54 張維持原產出 1200 × 896 PNG。`acute-gi-care-kit/page-3/step-04.png` 原圖畫了用味道判斷糖鹽水比例，與精確量測原則衝突；已用同風格重繪為「攪拌至完全溶解」，新圖為 1448 × 1086 PNG。原圖未接入。

候選 JSON 原列 28 支影片；28 個 YouTube ID 均可取得目前的 oEmbed 標題與頻道資料。實際接入 27 支，八個七語位置標示無合適影片：kocel `tl`、chalian-kalimate `zh-TW/id/vi/th/tl/en`、no-crush-evidence `tl`。

Kalimate 是 **calcium polystyrene sulfonate**；英文候選影片介紹的是 Kayexalate，屬 **sodium polystyrene sulfonate**。兩者不是同一藥，因此英文版不連結該候選影片。[Kalimate 原廠藥品資料](https://medical.kowa.co.jp/asset/item/18/28/7-pse_046.pdf)、[Kayexalate 美國 FDA 標示](https://www.accessdata.fda.gov/drugsatfda_docs/label/2017/011287s026lbl.pdf)。

自製糖鹽水的文字改為精確量取 1,000 mL 安全飲用水、6 平茶匙糖與半平茶匙食鹽，並移除「靠味道判斷比例」；與 [WHO 的簡易配方](https://www.who.int/news-room/questions-and-answers/item/cholera-outbreaks)一致。Kocel 中文候選為粵語並有中文字幕；日文候選展示一般洋車前子產品，均在播放頁提示依康賜爾單張操作。兒童口服藥越南語候選專講咳嗽糖漿，也在播放頁提示不能套用到所有藥品。急性腸胃症狀菲律賓語影片只涵蓋補液部分，已加上範圍提醒。

本次接入以已提交的單張資料為基礎；工作目錄中其他尚未提交的急性腸胃症狀文字修訂與測試檔保留在本機，未納入此批推送。
