# 地點與路線資料

`spots.js` 每個物件代表一個地點；`routes.js` 記錄路線、站點座標與位置說明。頁面以一般 `<script>` 依序載入這兩個檔案，再載入 `app.js`，因此 GitHub Pages 與本機直接開啟 `index.html` 都可使用。

新增地點時，在 `spots.js` 加入一個物件，沿用現有欄位：

- `name`：顯示名稱。同一區域內不要重複。
- `area`：區域名稱；區域選單會自動收錄。
- `type`：類型陣列，使用頁面現有的類型標籤。
- `hours`：建議停留時數。
- `note`：圖卡上的介紹或評論重點。
- `coords`：`[緯度, 經度]`，用於地圖標記。
- `mapUrl`：該地點的 Google Maps 連結。
- `address`、`guideUrl`、`reviewUrl`、`sourceUrl`：有資料時才填。

執行 `node scripts/check-data.mjs` 可以檢查缺漏欄位、重複地點、座標、連結與路線站點。若需要保留單一 HTML 的本機預覽，可執行 `node scripts/build-standalone.mjs 輸出路徑.html`；這是從拆分後的原始檔產生的預覽檔，日後請修改原始檔。
