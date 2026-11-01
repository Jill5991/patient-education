# Day 11 外用藥單張插圖與影片接入紀錄

來源：[day-11-summary.md](https://docs.google.com/document/d/104-HkylFhh8rQrABfBsCNHiK6ZmVYn2Lr8CbuVTNqts/edit)，建立於 2026-11-01。這份最新摘要列出 10 個藥品、56 張插圖；同名較早摘要及 day-10-summary.md 是上一批 51 張插圖的重複紀錄。本批以 10 份 records.json 與影片候選 JSON 逐一核對檔案 ID、步驟順序及七語位置。

| 單張 | 插圖 | 已接入影片 | 無合適影片 |
| --- | ---: | ---: | ---: |
| crotamiton-hydrocortisone | 5 | 0 | 7 |
| benzyl-benzoate-25-lotion | 6 | 1 | 6 |
| lindane-scabi | 5 | 0 | 7 |
| duofilm-solution | 5 | 3 | 4 |
| zinc-oxide-ointment | 5 | 2 | 5 |
| ivermectin-cream | 5 | 3 | 4 |
| cb-ointment | 6 | 0 | 7 |
| sinbaby-lotion | 6 | 0 | 7 |
| exelderm-solution | 6 | 0 | 7 |
| fentanyl-patch | 7 | 3 | 4 |
| **合計** | **56** | **12** | **58** |

56 張 PNG 均完成解碼及視覺檢視，圖面動作與單張步驟一致；所有七語共用各藥品的步驟圖。14 支候選影片均於 2026-11-01 以 YouTube oEmbed 核對仍可取得標題與頻道；實際接入 12 支。oEmbed 只能核對連結、標題及頻道，實際用法仍以候選紀錄與醫療資料交叉核對。

疥寧洗液繁中候選的頭蝨用法為搓揉約 3 分鐘後沖淨，[雙和醫院藥劑部的同藥品資料](https://shh.tmu.edu.tw/page/PharmDetail.aspx?seq_no=20241216111443828679)也採此流程；目前單張的 24 小時後清洗則與[臺北市立聯合醫院的同成分用藥單張](https://www-ws.gov.taipei/001/Upload/446/relfile/22055/8511937/1659e7ac-1e29-490b-9817-2df5bf865fc9.pdf)一致。兩家醫院的頭蝨流程不同，未取得此專案應採用的處方規格前，不以該影片替代本單張；繁中標為 `no_suitable_video`。泰文候選主要說明藥品及注意事項，播放頁提醒沖洗時間依單張與醫囑。

吩坦尼貼片日文候選 [フェントステープ示範](https://www.youtube.com/watch?v=aP4-8M2RWdg)為每日更換型，但本單張為每 72 小時更換型。更換週期不同屬關鍵用法差異，因此日文位置標為 `no_suitable_video`，不導向該候選。英文、繁中、印尼文候選均說明 72 小時更換。參考：[吩坦尼穿皮貼片美國用藥指南](https://dailymed.nlm.nih.gov/dailymed/medguide.cfm?setid=2a2238e9-4b5d-c56d-8663-dd354ff9ae0c)。

Duofilm 塔加洛語候選提到每日 1–2 次，與本單張睡前每日一次不同；播放頁加入塔加洛語提醒，以單張及醫師或藥師指示為準。Lindane 圖像及單張均為單次用藥、8–12 小時後洗淨；參考：[FDA Lindane Lotion Medication Guide](https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/LindaneLotionMedGuide.pdf)。其他無候選的位置明確標為 `no_suitable_video`。
