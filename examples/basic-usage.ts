/**
 * 基本使用範例
 * 
 * 這個範例展示如何使用 simple-https-server 建立一個基本的HTTPS伺服器
 */

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
