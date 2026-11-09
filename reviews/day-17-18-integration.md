# Day 17–18 插圖與影片接入審查（2026-11-09）

範圍：Day 17 三種注射筆 38 張、Day 18 九種鼻用劑型與洗鼻 74 張，共 112 張。來源為 Google Drive 的 `day-17-summary.md`、`day-18-summary.md` 和各藥品 pending review 紀錄。逐張檢視縮圖與單張步驟後，接入 PNG 原圖及供網頁載入的 WebP 副本。

## 圖像修正

- Ozempic、Mounjaro KwikPen、Soliqua 100/33 的裝針圖重新局部繪製：將**帶大外蓋的針頭寬口端**沿筆身軸線對正筆頭、旋緊，再依序取下大外蓋及小內蓋。不能先露出針頭才接近筆頭；裝針前不按注射鈕。Mounjaro 為四劑 KwikPen，並非單次自動注射筆。
- 三支筆的注射點間隔圖沿用前次已修正的無手指版本，直接標示成人一指寬約 **1.5–2 cm**；Soliqua 的腹部小區塊輪替和手臂、大腿範圍也沿用已修正版本。
- 鼻噴劑各圖逐一對照單張動作：懸浮液搖勻、澄清溶液不必搖、朝鼻孔外側噴、清潔噴嘴與安全扣環；Natesto 首次倒置排空 10 次、每鼻孔一泵；成人洗鼻使用安全用水與擠壓瓶，幼兒滴鼻及吸鼻球另列。未發現需要進一步改繪的鼻用圖。

## 影片處理

批次檢查 50 支 Gemini 候選影片的 YouTube oEmbed 回應，網址、實際標題與頻道均存在；按內容摘要和單張／劑型比對後，接入 44 支，其他 40 個語言位置標為 `no_suitable_video`。這項網址核對不等於逐格播放審片或獨立驗證字幕內容。

排除：Soliqua 中文候選示範 **100/50** 而本單張是 **100/33**；Azetin 與 Sindecon 中文候選提到搖瓶而單張為澄清溶液；Sindecon 英文候選僅談反彈性鼻塞、沒有完整噴藥操作；Sindecon 塔加祿語候選示範搖瓶；印尼語洗鼻候選開頭示範針筒。其餘已知產品外觀或步驟差異以對應語言的 `notice` 顯示於影片頁。

## 核對依據

- [Lilly Mounjaro KwikPen 使用說明](https://pi.lilly.com/ca/mounjaro-ca-ifu-kp.pdf)：四劑筆、裝針與排氣。
- [Novo Nordisk Ozempic 筆操作](https://www.novomedlink.com/diabetes/products/treatments/ozempic/dosing-administration/administration/pen.html)：新筆流量檢查及按住 6 秒。
- [Sanofi Soliqua 100/33 使用說明](https://www.soliqua100-33.com/dam/jcr%3A4d72e696-eaec-4248-96e1-79bfcdf701ee/SOLIQUA-100-33-Instructions-for-use.pdf)：15–60 單位、針頭與輪替。
- [GSK Avamys 仿單](https://www.medicines.org.uk/emc/files/pil.6439.pdf)：蓋上瓶蓋用力搖約 10 秒及側按裝置。
- [Natesto 原廠處方資訊](https://www.natesto.com/pdfs/natesto-full-prescribing-information.pdf)：首次倒置排空 10 次及鼻外側壁給藥。
- [Nasonex 仿單](https://www.medicines.org.uk/emc/files/pil.1663.pdf)：搖勻、首次排氣與鼻噴操作。
- [CDC 安全洗鼻用水](https://www.cdc.gov/naegleria/prevention/sinus-rinsing.html)：蒸餾水、無菌水或煮沸放涼的水。

PNG 與 WebP 都由 `tests/day17-18-integration.test.js` 逐路徑、檔頭和 QR 語言路由檢查。
