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

## 正式部署到雲端

建議拆成三個服務：

- 前端 Vue：Vercel
- 後端 Express：Render 或 Railway Web Service
- 資料庫 MySQL：Railway MySQL

### 1. 建立雲端 MySQL

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

### 2. 部署後端

在 Render 或 Railway 建立 Node.js Web Service，連接此 GitHub repo。

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

## API

- `GET /api/health`：檢查後端與 MySQL 是否連線成功
- `GET /api/students`：取得學生列表
- `POST /api/students`：新增學生
- `PUT /api/students/:id`：更新學生
- `DELETE /api/students/:id`：刪除學生
