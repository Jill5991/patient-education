# Day 12–13 插圖與影片接入紀錄

來源：[Day 12 摘要](https://docs.google.com/document/d/1nMCuMze6drpiqUFf9UdnBmwqB1QbUt2wg8nCwiWBIHo/edit)、[Day 13 摘要](https://docs.google.com/document/d/1cRFDSJSfJ7hNQ_mUIPi221SUgusDoiHJ2ohuGlcktmY/edit)。Day 13 另有一份內容相同的摘要，沒有重複接入。

Day 12 的 6 份貼片單張、38 張圖與影片已在前次提交接入；本次再次檢視圖面，沒有發現需要重繪的貼敷部位、動作或時間示意。

Day 13 共 10 份口服避孕藥單張，每份 6 步，共 60 張圖。逐張比對單張文字後，原始生成圖的藥板顆數、有效與無效錠顏色、換包及跳過無效錠示意存在不一致。例如 21 錠圖有少於 21 顆的藥板；24+4 的換包圖把新包畫成全有效錠；部分 21+7 圖則畫出超過 28 顆。保留 10 張起始服藥圖，重繪其餘 50 張。重繪圖用固定顆數的繪圖程式產生，分別為 21、21+7、24+4，輸出 1200 × 896 PNG；其中第 5 步明確畫出跳過 7 天停藥期或 4/7 顆無效錠。圖片是通用示意圖，患者仍應依實際藥板箭頭與單張文字服用。

Day 13 的 10 份影片候選紀錄共有 70 個語言位置。8 個不同的首選 YouTube ID 均可取得影片標題與頻道資料。接入 68 個位置；Alyssa 和 Loestrin 的印尼語首選影片示範 21+7 包裝，與 24+4 不符，故標記為 `no_suitable_video`。候選 JSON 中這兩份的印尼語 `isPrimary` 欄位與 `primaryCandidateUrl` 不一致；本次以 URL 對應的實際影片為準。其他通用影片在各語播放頁顯示該單張的包裝類型，並提示依單張處理漏服。繁中候選的影片標題誤寫「事後」，但影片說明討論每日事前避孕藥，播放頁明示此差異。

圖像的 21–24 天有效錠與 4–7 天無荷爾蒙間隔、最後有效錠週漏服後略過間隔的方向，也和 [CDC 2024 合併型荷爾蒙避孕指引](https://www.cdc.gov/contraception/hcp/usspr/combined-hormonal-contraceptives.html)交叉核對。影片是一般衛教，不能替代各藥品仿單和本單張的個別用藥指示。
