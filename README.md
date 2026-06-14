# 宿舍管理系統

Vue 3 前端 + Express 後端 + MySQL 資料庫。

## 建立 MySQL 資料庫

先執行建表 SQL：

```bash
mysql -u root -p < server/schema.sql
```

## 設定後端連線

複製環境變數範例：

```bash
cp .env.example .env
```

再打開 `.env`，把 `DB_USER`、`DB_PASSWORD`、`DB_NAME` 改成你的 MySQL 設定。

## 啟動專案

開第一個終端機啟動後端：

```bash
npm run server
```

開第二個終端機啟動前端：

```bash
npm run dev
```

前端會透過 Vite proxy 呼叫 `/api`，再由 Express 後端連到 MySQL。

## 讓別人打開就是網站

GitHub repo 連結只會顯示程式碼。要讓別人點連結就進入系統，需要部署成正式網站。

這個專案要拆成三個服務：

- 前端 Vue：Vercel
- 後端 Express：Render
- 資料庫 MySQL：Railway MySQL

最後分享給別人的會是 Vercel 前端網址，例如：

```text
https://你的專案名稱.vercel.app
```

### 1. 建立雲端 MySQL 資料庫

在 Railway 建立 MySQL 資料庫後，先把 `server/schema.sql` 匯入雲端資料庫。

如果使用 Railway MySQL，後端已支援 Railway 提供的環境變數：

- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`

也可以手動改用專案自己的名稱：

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

### 2. 部署後端到 Render

在 Render 建立 Web Service，連接此 GitHub repo。

如果 Render 偵測到 `render.yaml`，可以直接照藍圖建立服務；也可以手動填：

部署設定：

```bash
Build Command: npm install
Start Command: npm start
```

環境變數：

```bash
PORT=3000
HOST=0.0.0.0
FRONTEND_URL=https://你的前端網址
DB_HOST=你的資料庫主機
DB_PORT=3306
DB_USER=你的資料庫使用者
DB_PASSWORD=你的資料庫密碼
DB_NAME=你的資料庫名稱
```

如果有多個前端網址，例如 Vercel 正式網址和預覽網址，可以用逗號分隔：

```bash
FRONTEND_URL=https://你的專案.vercel.app,https://你的預覽網址.vercel.app
```

部署完成後，先測試後端：

```text
https://你的後端網址/api/health
```

看到 `ok: true` 代表後端已連上 MySQL。

### 3. 部署前端

在 Vercel 建立 Vite 專案，連接此 GitHub repo。

部署設定：

```bash
Build Command: npm run build
Output Directory: dist
```

環境變數：

```bash
VITE_API_BASE_URL=https://你的後端網址/api
VITE_BASE_PATH=/
```

前端部署完成後，回到後端服務把 `FRONTEND_URL` 改成正式前端網址，然後重新部署後端。

### 4. 分享網站

確認前端可以登入、讀取學生與報修資料後，把 Vercel 的前端網址傳給別人。

不要傳 GitHub repo 網址；repo 網址是給開發者看程式碼用的。

## API

- `GET /api/health`：檢查後端與 MySQL 是否連線成功
- `GET /api/students`：取得學生列表
- `POST /api/students`：新增學生
- `PUT /api/students/:id`：更新學生
- `DELETE /api/students/:id`：刪除學生
