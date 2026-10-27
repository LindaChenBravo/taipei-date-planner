# 台北玩樂地圖

用地圖、條件搜尋和精選路線，探索台北與周邊的美食、咖啡、書店和散步地點。網站以手機優先設計，點選地點即可查看介紹，並開啟對應的 Google Maps 連結。

**[開啟台北玩樂地圖](https://lindachenbravo.github.io/taipei-date-planner/)**

## 怎麼使用

- **地圖探索**：拖曳、縮放地圖，或用上方類型標籤篩選；點選圖示即可展開地點圖卡。也可使用「我附近的店」查看附近地點。
- **條件搜尋**：依店名或關鍵字、類型與區域尋找地點。搜尋欄可留空；「幫我找玩法」會依目前條件隨機推薦。
- **精選路線**：查看各站的相對位置和走訪順序，並開啟 Google Maps。地圖上的連線表示順序，並非實際道路路徑。
- **新增地點**：網站底部分頁會開啟新增地點的對話連結，方便提供推薦資訊。

## 專案結構

| 檔案 | 用途 |
| --- | --- |
| `index.html` | 頁面結構與分頁內容 |
| `style.css` | 版面、色彩與動畫 |
| `app.js` | 地圖、搜尋、圖卡與路線互動 |
| `data/spots.js` | 地點資料與 Google Maps 連結 |
| `data/routes.js` | 精選路線、站點座標與說明 |
| `scripts/check-data.mjs` | 檢查地點欄位、重複資料、座標、連結和路線站點 |
| `scripts/build-standalone.mjs` | 產生方便本機分享的單一 HTML 預覽檔 |

網站使用原生 HTML、CSS、JavaScript 與 MapLibre GL JS；底圖由 OpenFreeMap 提供，地圖資料標示於網站地圖角落。正式網站由 GitHub Pages 發布。

## 本機預覽與修改

下載專案後，直接用瀏覽器開啟 `index.html` 即可預覽。地圖底圖、字型及外部連結需要網路連線。

新增或修改地點請編輯 `data/spots.js`；每筆地點需有名稱、區域、類型、停留時數、介紹、座標與 Google Maps 連結。座標格式是 `[緯度, 經度]`，區域選單會從資料自動產生。詳細欄位請看 [地點與路線資料說明](data/README.md)。

修改資料後，從專案根目錄執行：

```bash
node scripts/check-data.mjs
```

若需要單一 HTML 預覽檔，可執行：

```bash
node scripts/build-standalone.mjs /tmp/taipei-fun-map.html
```

單檔預覽由原始檔產生；後續修改請回到 `index.html`、`style.css`、`app.js` 或 `data/` 內的檔案。

## 發布

GitHub Pages 使用此儲存庫 `main` 分支的根目錄。更新原始檔並完成資料檢查後，將提交推送到 `main`，網站便會重新建置。正式網站不需要額外的打包步驟。

地點介紹、評論重點、營業資訊和活動內容可能變動；出發前請以店家及相關平台的最新資訊為準。
