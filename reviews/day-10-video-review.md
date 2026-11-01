# Day 10 外用藥單張插圖與影片接入紀錄

2026-11-01 接入時，Google Drive「用藥單張待審／進度」資料夾及 Drive 全域搜尋皆未找到 `day-10-summary.md`。本次直接以「插圖」資料夾中 2026-10-31 建立的十份 `records.json` 和「影片候選」資料夾中的十份七語 JSON 作為來源；每張圖的紀錄 ID 均與資料夾中的檔案 ID 相同。使用者要求將今天的圖檔與影片接入並推送。

| 單張 | 插圖 | 已接入影片 | 無合適影片 |
| --- | ---: | ---: | ---: |
| silver-sulfadiazine-cream | 6 | 5 | 2 |
| undecenoate-powder | 5 | 1 | 6 |
| undecenoate-cream | 5 | 0 | 7 |
| tretinoin-gel | 5 | 5 | 2 |
| tacrolimus-ointment | 5 | 3 | 4 |
| metronidazole-topical | 5 | 3 | 4 |
| ketoconazole-shampoo | 5 | 5 | 2 |
| imiquimod-warts | 5 | 4 | 3 |
| imiquimod-ak | 5 | 2 | 5 |
| econazole-cream | 5 | 1 | 6 |
| **合計** | **51** | **29** | **41** |

51 張圖接入時均為 1200 × 896 PNG，逐張核對步驟、圖面與七語共用路徑。銀磺胺乳膏的現有單張已改為依藥袋或燒傷團隊指示決定厚度與敷料，因此沒有把候選影片中的示範厚度當成固定指示。英文、印尼文和日文播放頁加入個別換藥指示提醒。[SILVADENE 美國仿單](https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=c437213a-1cd4-445e-a39f-bbcacb9f746f)。

31 筆首選 YouTube 連結均於接入當天成功取得 oEmbed 標題與頻道。實際接入 29 支：Econazole 英文首選的頻道與醫療專業性不符，改用候選中的醫師影片；Tretinoin 日文首選主要講併用對苯二酚的淡斑療程，與本單張痤瘡單方用法不同；Econazole 越南文候選未示範本單張的塗抹操作。後兩者標為無合適影片。

十一烯酸鹽藥粉的繁中影片只介紹香港腳藥粉類型，因此播放頁明示仍須依單張完成使用步驟。Metronidazole 英文影片以 1% 每日一次為例，播放頁提醒依自身藥袋的濃度與頻率。尖銳濕疣影片的越南文與泰文版本分別從 06:58、02:58 的相關段落開始播放。Imiquimod 影片同時提及不同適應症時，播放頁提醒依本單張及處方排程；[美國 Aldara 仿單](https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/020723s028lbl.pdf)與[日本ベセルナ仿單](https://www.pmda.go.jp/PmdaSearch/iyakuDetail/ResultDataSetPDF/790005_6290701N1028_1_08)對不同適應症及地區的排程有明確區分。

其餘 41 個語言位置明確標為 `no_suitable_video`，播放頁會顯示無合適影片。工作目錄原有未追蹤檔案未納入本次提交。

2026-11-01 複查銀磺胺乳膏插圖後，`step-02`、`step-03`、`step-04` 因與目前文字不夠一致而重繪；詳見 [銀磺胺乳膏插圖複查](silver-sulfadiazine-illustration-audit.md)。三張新圖為 1448 × 1086 PNG，其餘 48 張維持 1200 × 896 PNG。
