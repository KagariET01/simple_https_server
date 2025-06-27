# simple https server

使用 TypeScript 撰寫的簡單 HTTPS 伺服器，讓你能快速建立一個 HTTPS 伺服器。

# 如何編譯

## 直接編譯成 `.js` 檔案

使用如下指令，它會自動安裝必要的套件並編譯 TypeScript 檔案
```bash
npm run build
```

# 如何安裝並在自己的專案使用

## `推薦` 使用 `npm link` 來連結本地開發版本

如果你正在開發或修改這個套件，可以使用 `npm link` 來在其他專案中連結到這個套件。
```bash
# 在此專案目錄中建立全域連結
npm link
# 在其他專案中連結到此套件
npm link simple-https-server

# 解除此專案的連結
npm unlink
# 在其他專案中解除連結
npm unlink simple-https-server
```

## 打包成 `.tgz` 檔案

使用 `npm pack` 來打包成 `.tgz` 檔案，這樣可以方便地在其他專案中安裝。
```bash
npm pack
```
你可以在其他地方使用這個 `.tgz` 檔案來安裝這個套件。
```bash
npm install <output .tgz file>
```

## `不建議` 土方法：直接複製 `src` 或 `dist` 目錄

如果你只是想快速測試，也可以直接複製 `src` 或 `dist` 目錄到你的目標專案中。  
除非你有特別的需求，否則不建議這樣做，因為...~~太土了~~。

# 使用方法

以下是最基本的使用方法配註解
```ts
import HTTPSServer from "simple-https-server";

const server=new HTTPSServer(); // 建立一個伺服器的實例
server.port=8082; // 設定伺服器的埠號
server.app_path="docs"; // 設定網頁應用的路徑，你可以把網頁用到的檔案放在這個目錄下

// 啟動伺服器
try{
	server.start(); // 啟動伺服器
}catch(error){
	console.error('啟動伺服器時發生錯誤:',error);
}
```
