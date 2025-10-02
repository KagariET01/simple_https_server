import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import net from "net";
import socket_forward from "./socket_forward.js";
import link2file from "./link2file.js";
import httpProxy from "http-proxy";
// import * as socketio from "socket.io";

/**
 * @property {number} [100] Continue
 * @property {number} [101] Switching Protocols
 * @property {number} [102] Processing
 * @property {number} [103] Early Hints
 * @property {number} [200] OK
 * @property {number} [201] Created
 * @property {number} [202] Accepted
 * @property {number} [203] Non-Authoritative Information
 * @property {number} [204] No Content
 * @property {number} [205] Reset Content
 * @property {number} [206] Partial Content
 * @property {number} [207] Multi-Status
 * @property {number} [208] Already Reported
 * @property {number} [226] IM Used
 * @property {number} [300] Multiple Choices
 * @property {number} [301] Moved Permanently
 * @property {number} [302] Found
 * @property {number} [303] See Other
 * @property {number} [304] Not Modified
 * @property {number} [305] Use Proxy
 * @property {number} [306] Switch Proxy
 * @property {number} [307] Temporary Redirect
 * @property {number} [308] Permanent Redirect
 * @property {number} [400] Bad Request
 * @property {number} [401] Unauthorized
 * @property {number} [402] Payment Required
 * @property {number} [403] Forbidden
 * @property {number} [404] Not Found
 * @property {number} [405] Method Not Allowed
 * @property {number} [406] Not Acceptable
 * @property {number} [407] Proxy Authentication Required
 * @property {number} [408] Request Timeout
 * @property {number} [409] Conflict
 * @property {number} [410] Gone
 * @property {number} [411] Length Required
 * @property {number} [412] Precondition Failed
 * @property {number} [413] Payload Too Large
 * @property {number} [414] URI Too Long
 * @property {number} [415] Unsupported Media Type
 * @property {number} [416] Range Not Satisfiable
 * @property {number} [417] Expectation Failed
 * @property {number} [418] I'm a teapot
 * @property {number} [421] Misdirected Request
 * @property {number} [422] Unprocessable Entity
 * @property {number} [423] Locked
 * @property {number} [424] Failed Dependency
 * @property {number} [425] Too Early
 * @property {number} [426] Upgrade Required
 * @property {number} [428] Precondition Required
 * @property {number} [429] Too Many Requests
 * @property {number} [431] Request Header Fields Too Large
 * @property {number} [451] Unavailable For Legal Reasons
 * @property {number} [500] Internal Server Error
 * @property {number} [501] Not Implemented
 * @property {number} [502] Bad Gateway
 * @property {number} [503] Service Unavailable
 * @property {number} [504] Gateway Timeout
 * @property {number} [505] HTTP Version Not Supported
 * @property {number} [506] Variant Also Negotiates
 * @property {number} [507] Insufficient Storage
 * @property {number} [508] Loop Detected
 * @property {number} [510] Not Extended
 * @property {number} [511] Network Authentication Required
 */
type http_status_code=
	100|101|102|103|
	
	200|201|202|203|204|
	205|206|207|208|226|
	
	300|301|302|303|304|
	305|306|307|308|
	
	400|401|402|403|404|
	405|406|407|408|409|
	410|411|412|413|414|
	415|416|417|418|421|
	422|423|424|425|426|
	428|429|431|
	
	500|501|502|503|504|505|
	506|507|508|
	
	number;

/**
 * 附檔名類型。
 * 
 * The type of file extension.
 * @property {string} ["mutiple"] 包含多個點號的附檔名，如`.tar.gz`、`.txt`。設定成此項後，除隱藏檔之外不允許在檔名中使用點號。  
 * the extension type that contains multiple dots, such as `.tar.gz`, `.txt` .
 * @property {string} ["single"] 單一點號的附檔名，如`.txt`、`.html`等。設定成此項後，允許檔名內出現點號，只偵測最後一個點號後的字串作為附檔名。  
 * the extension type that contains a single dot, such as `.txt`, `.html`, etc.  
 * When set to this type, dots in the filename are allowed, and only the string after the last dot is detected as the file extension.
 */
type ExtnameType="mutiple"|"single";

type PathDecodeResult={
	/**
	 * 檔案類型，可能的值為 "file"、"directory" 或 "none"。  
	 * The type of file found, possible values are "file", "directory", or "none".
	 * @property {string} ["find"] 在主機目錄裡，檔案存在
	 * @property {string} ["directory"] 在主機目錄裡，檔案是目錄，而且目錄裡沒有index檔案
	 * @property {string} ["socket"] 在主機目錄裡，找到socket檔案
	 * @property {string} ["unknow"] 在主機目錄裡，但不知道這是什麼檔案
	 * @property {string} ["none"] 在主機目錄裡，檔案或資料夾不存在
	 */
	find:"file"|"directory"|"socket"|"unknown"|"none",
	/**
	 * 解碼後的檔案系統路徑。  
	 * The decoded file system path.
	 */
	path:string,
	/**
	 * 當find屬性為"socket"時，extra_path屬性包含在socket檔案後的額外路徑資訊。
	 */
	extra_path?:string
}

type httpResponser<return_type=void> =(
	req:http.IncomingMessage,
	res:http.ServerResponse,
	status_code:http_status_code,
	fpath:string
)=>(return_type|Promise<return_type>);

type httpResponserWithErr<return_type=void> =(
	req:http.IncomingMessage,
	res:http.ServerResponse,
	status_code:http_status_code,
	fpath:string,
	ErrMsg:Error|string
)=>(return_type|Promise<return_type>);

type Auth_result={
	/**
	 * 是否通過驗證
	 * Whether the authentication passed.
	 */
	pass:boolean;

	/**
	 * 當驗證失敗時，執行的function（如果有的畫）  
	 * 驗證失敗時，使用這個function和客戶端進行交互。
	 */
	response_func?:httpResponser<void>;
}

type log_lv="🔵Log"|"🟢Info"|"🟠Warn"|"🔴Err"|string;


export const HTTPSServer=class{

	/**
	 * 伺服器使用的通訊埠，若設置成null則不會啟動HTTP(S)伺服器。
	 * 
	 * server port. set to null to disable HTTP(S) server.
	 * @default 8080
	 */
	port:number|null=8080;

	/**
	 * Unix Domain Socket路徑，用於IPC通訊。若設置成null則不會建立unix_domain_socket。
	 * 
	 * Unix Domain Socket path for IPC communication.  
	 * set to null to disable unix_domain_socket.
	 * 
	 */
	unix_domain_socket_path:string|null=null;

	/**
	 * 是否允許未知類型，但確實存在的檔案處理。  
	 * 如果設置為 false ，所有預設未知的檔案類型都會被忽略，且會當成 not found 處理。  
	 * If set to false, all unknown file types will be ignored and dealt with as not found.
	 * @type {boolean}
	 * @default false
	 */
	allow_unknown_file:boolean=false;

	/**
	 * 若路徑上有socket檔存在，是否將請求轉發到該socket檔。  
	 * 如請求網址為 `/api/socket/users` ，其中 `/api/socket/` 是一個socket檔案  
	 * 若設為true則會將後面的 `/users` 路徑作為 `path` 轉發到 socket 檔案
	 * 當 `path_decode` 或 `server_function` 被更改成自訂函式時，此設定會被忽略不起作用。
	 * p.s. 此設定不會檢查index file，如你的socket檔案是 `/api/socket/index.socket` ，則系統會忽略掉 `index.socket` 檔案
	 * 
	 * Whether to forward the request to the socket file if there is a socket file on the path.  
	 * For example, if the request URL is `/api/socket/users`, where `/api/socket/` is a socket file,  
	 * setting this to true will forward the remaining `/users` path as `path` to the socket file.  
	 * This setting will be ignored when `path_decode` or `server_function` is changed to a custom function.  
	 * p.s. This setting does not check for index files. If your socket file is `/api/socket/index.socket`, the system will ignore the `index.socket` file.
	 * @default false
	 */
	socket_forward=false;

	/**
	 * 你的應用程式的根目錄（應填入主機的目錄路徑）  
	 * 例如你想要在`/home/user/myapp/docs/`目錄下提供服務，你應該將此設置為`/home/user/myapp/docs/`。  
	 * 或者，如果你想在當前目錄下的`docs/`目錄下提供服務，你可以將此設置為`"./docs/"`。
	 * 
	 * the root directory of your application.  
	 * For example, if you want to serve files from the `/home/user/myapp/docs/` directory, you should set this to `/home/user/myapp/docs/`.  
	 * Or, if you want to serve files from the `docs/` directory in the current directory, you can set this to `"./docs/"`.
	 * @default "./docs/"
	 */
	app_path:string="./docs/";

	/**
	 * 若伺服器找不到檔案，回傳的檔案路徑  
	 * 此路徑和`app_path`的設定規則一樣，但你可以直接提供一個檔案路徑，這樣做的話系統會直接將該檔案解析後傳給使用者。  
	 * 如果你設置為`null`，則伺服器發生404 Not Found時將不會回傳任何內容。  
	 * 
	 * the file path to return when the server cannot find a file.  
	 * This path follows the same rules as `app_path`, but you can directly provide a file path, and the system will parse and return that file to the user.  
	 * If you set it to `null`, the server will not return any content when a 404 Not Found error occurs.
	 * @default null
	 */
	Err404:string|null=null;

	/**
	 * 當伺服器遇到非預期的錯誤時，將呼叫此函式。
	 * 
	 * When the server encounters an unexpected error, this function will be called.
	 */
	// Err500:httpResponserWithErr|httpResponser|null=(req,res,status_code,fpath,ErrMsg)=>{
	// 	res.writeHead(500,{"Content-Type":"text/plain"});
	// 	res.end("Internal Server Error");
	// 	this.client_record(req,res,500,fpath);
	// 	this.write_log("🔴Err",`Server Error. Please Contact admin.`);
	// };
	Err500:httpResponser|httpResponserWithErr|null=(
		req:http.IncomingMessage,
		res:http.ServerResponse,
		status_code:http_status_code,
		fpath:string,
		ErrMsg?:Error|string|null
	)=>{
		res.writeHead(500,{"Content-Type":"text/plain"});
		res.end("Internal Server Error");
		this.client_record(req,res,500,fpath);
		this.write_log("🔴Err",`Server Error. Please Contact admin.`);
	};

	/**
	 * SSL key檔案路徑
	 * 如果你想使用HTTPS，你需要提供SSL key檔案的路徑。
	 * 或者你可以將其設置為`undefined`以使用HTTP。
	 * the path to the SSL key file.
	 * if you want to use HTTPS, you need to provide the path to the SSL key file.
	 * or you can set it to `undefined` to use HTTP.
	 * @default undefined
	 */
	key:string|null=null;

	/**
	 * SSL certificate檔案路徑  
	 * 如果你想使用HTTPS，你需要提供SSL certificate檔案的路徑。  
	 * 或者你可以將其設置為`undefined`以使用HTTP。
	 * 
	 * the path to the SSL certificate file.  
	 * if you want to use HTTPS, you need to provide the path to the SSL certificate file.  
	 * or you can set it to `undefined` to use HTTP.
	 * @default ""
	 */
	cert:string|null=null;

	/**
	 * 日誌檔案路徑，若想要產生stdout的日誌，卻不想要產生檔案，可以將此設為`/dev/null`（Linux/Unix系統）或`NUL`（Windows系統）。
	 * log file path. if you want to generate stdout logs without creating a file, you can set this to `/dev/null` (Linux/Unix systems) or `NUL` (Windows systems).
	 */
	log_file_path:string|null="/dev/null";

	/**
	 * 日誌檔案的檔案系統寫入流。
	 * log file stream.
	 * @default undefined
	 */
	log_file_fs:fs.WriteStream|null=null;

	/**
	 * 格式化字串的長度。
	 * formats a string to a specific length.
	 * @param str 欲格式化的文字 string to be formatted
	 * @param len 欲格式化的長度 length of the string
	 * @returns 格式化後的文字 formatted string
	 */
	string_formatter(str:string,len:number,focus:boolean=true):string{
		if(str.length>len && !focus){
			return str;
		}else{
			return(str+" ".repeat(len)).slice(0,len);
		}
	}

	/**
	 * 寫入日誌檔案。
	 * write a log entry to the log file.
	 * @param lv 日誌等級 log level, e.g., "🔵Log", "🟢Info", "🟠Warn", "🔴Err", etc.  
		 * 該長度必須小於或等於6個字元。 length must less than or equal to 6 characters.  
	 * @param msg 寫入進日誌的訊息 message to log
	 */
	async write_log(lv:log_lv,msg:string):Promise<void>{
		if(!this.log_file_fs){
			return;
		}
		let timestamp=new Date().toISOString();
		timestamp=this.string_formatter(timestamp,24);
		let formatted_lv=this.string_formatter(lv,6);
		// let formatted_msg=this.string_formatter(msg,100,false);
		let formatted_msg:String=msg;
		let log_entry=`[${timestamp}] [${formatted_lv}] `;
		let msg_list=formatted_msg.split("\n");
		// console.log({msg_list});
		let sp=" ".repeat(log_entry.length);
		for(let i=0;i<msg_list.length;i++){
			if(i){
				// console.log("i!=0");
				this.log_file_fs.write(sp+msg_list[i]+"\n");
				process.stdout.write(sp+msg_list[i]+"\n");
			}else{
				// console.log("i==0");
				this.log_file_fs.write(log_entry+msg_list[i]+"\n");
				process.stdout.write(log_entry+msg_list[i]+"\n");
			}
		}

		// formatted_msg.replaceAll("\n","\n"+sp);
		// console.log({sp,formatted_msg});
		// log_entry+=formatted_msg+"\n";
		// this.log_file_fs.write(log_entry);
		// process.stdout.write(log_entry);
	}

	/**
	 * 紀錄客戶端的請求。
	 */
	async client_record(
		req:http.IncomingMessage,
		res:http.ServerResponse,
		status_code:http_status_code,
		fpath:string
	):Promise<void>{
		let str:string="";
		str+=this.string_formatter(
			`${req.socket.remoteAddress}:${req.socket.remotePort}`,
			22
		);
		str+=` ==> [${status_code}] ${req.headers.host}${req.url}`;
		// console.log("req.headers.host: ",req.headers.host);
		// console.log("req.headers.url:  ",req.url);
		let log_lv:string="🔵Conn";
		if(100<=status_code&&status_code<200){
			log_lv="🟢Conn";
		}
		if(400<=status_code&&status_code<500){
			log_lv="🟠Warn";
		}
		if(500<=status_code&&status_code<600){
			log_lv="🔴Err";
		}
		await this.write_log(log_lv,str);
	}

	/**
	 * @type {httpResponser<Auth_result>}
	 * 驗證客戶端的請求。
	 * Authenticate the client's request.
	 * 
	 */
	authenticate(
		req:http.IncomingMessage,
		res:http.ServerResponse,
		status_code:http_status_code,
		fpath:string
	):Auth_result{
		let re:Auth_result={pass:true};

		return re;
	}

	/**
	 * 單純的檔案讀取器 A simple file reader.
	 * @param status_code HTTP狀態碼，例如200、404等。 HTTP status code, e.g., 200, 404, etc.
	 * @param content_type 檔案的內容類型，例如"text/html"、"application/json"等。  
	 * HTTP content type, e.g., "text/html", "application/json", etc.
	 */
	async simple_file_reader(
		req:http.IncomingMessage,
		res:http.ServerResponse,
		status_code:http_status_code,
		content_type:string,
		fpath:string
	):Promise<void>{
		try{
			let file=fs.readFileSync(fpath);
			res.writeHead(status_code,{"Content-Type":content_type});
			res.end(file);
			this.client_record(req,res,status_code,fpath);
		}catch(err){
			this.write_log("🟠Warn",`Failed to read file: ${fpath}\nError Msg:\n${err}`);
		}
	}

	/**
	 * 副檔名類型。 The type of file extension.
	 */
	ExtType:ExtnameType="mutiple";

	/**
	 * 檔案讀取器列表  
	 * 此Object的key為附檔名（不包含點號），例如 'html'、'js'、'css' 等。  
	 * 使用`*`來表示其餘未設定的附檔名（不包含資料夾）。  
	 * 使用`/`來表示目錄（但如果有設定index檔案，且該目錄有找到index檔案，將優先使用index檔案）。
	 * 
	 * A list of file readers.
	 * The keys of this object are the file extensions (without the dot), such as 'html', 'js', 'css', etc.  
	 * use `*` to represent the remaining unset file extensions (excluding directories).  
	 * use `/` to represent directories (but if an index file is set and the directory has found an index file, the index file will be used first).
	 * @type {Object.<string,httpResponser<void>>}
	 */
	FileLoaders:{[key:string]:httpResponser<void>}={
		html:(req,res,status_code,fpath)=>{
			return this.simple_file_reader(req,res,status_code,"text/html",fpath);
		},
		htm:(req,res,status_code,fpath)=>{
			return this.simple_file_reader(req,res,status_code,"text/html",fpath);
		},
		css:(req,res,status_code,fpath)=>{
			return this.simple_file_reader(req,res,status_code,"text/css",fpath);
		},
		txt:(req,res,status_code,fpath)=>{
			return this.simple_file_reader(req,res,status_code,"text/plain",fpath);
		},
		json:(req,res,status_code,fpath)=>{
			return this.simple_file_reader(req,res,status_code,"application/json",fpath);
		},
		js:(req,res,status_code,fpath)=>{
			return this.simple_file_reader(req,res,status_code,"application/javascript",fpath);
		},
		"api.js":async(req,res,status_code,fpath)=>{
			// console.log("loading api.js file:",fpath);
			// fpath=`./${fpath}`;
			const mod:Function|{default:Function}=await import(fpath);
			// console.log("file loaded.");
			// console.log({mod});
			const handler=typeof(mod)==="function"?mod:mod.default;
			// console.log(handler);
			try{
				if(handler.length<2){
					await handler(req,res);
				}else{
					handler(req,res,this);
				}
				this.client_record(req,res,res.statusCode,fpath);
			}catch(e){
				this.client_record(req,res,500,fpath);
			}
		},
		"*":(req,res,status_code,fpath)=>{
			return this.simple_file_reader(req,res,status_code,"text/plain",fpath);
		}
	};

	/**
	 * 伺服器的index檔案列表，若使用者訪問到一個資料夾，將從此列表依序尋找檔案。
	 * the index files to serve when a directory is requested.
	 * @default ["index.html","index.htm","index.json","index.js","index.txt","index.md","README.md"]
	 */
	index:string[]=[
		"index.html",
		"index.htm",
		"index.json",
		"index.api.js",
		"index.js",
		"index.txt",
		"index.md",
		"README.md",
	];

	/**
	 * 檢查檔案是否存在  
	 * Check if a file exists.
	 * @param fpath 檔案路徑 file path
	 * @returns {boolean} 如果檔案存在，則返回true；否則返回false。  
	 * Returns true if the file exists, otherwise false.
	 */
	fileExists(fpath:string):boolean{
		try{
			fs.statSync(fpath);
			return true;
		}catch(err){
			return false;
		}
	};



	/**
	 * 將url要求的路徑解碼為檔案系統的路徑  
	 * 若你想在url上傳遞部分資訊，如把頻道ID放在路徑上（如`https://example.com/channel/12345/...`），你可能須重做此函式。
	 * 
	 * Decode the URL path to a file system path.
	 * If you want to pass some information in the URL, such as putting a channel ID in the path (e.q. `https://example.com/channel/12345/...`), you may need to rewrite this function.
	 * 
	 * @param fpath 要解碼的路徑，通常是從請求中獲取的URL路徑。 the path to decode, usually the URL path from the request.
	 * @returns {PathDecodeResult} 解碼後的檔案系統路徑。  the decoded file system path.
	 */
	path_decode(fpath:string):PathDecodeResult{
		/**
		 * 去除掉查詢字串和片段識別符的字串
		 */
		let pre_path=fpath;
		pre_path=pre_path.split(/[?#]/)[0]; // 去掉查詢字串和片段識別符
		/**
		 * 取得查詢字串
		 */
		let query_str="";
		query_str=fpath.slice(pre_path.length);
		/**
		 * 標準化路徑
		 */
		let nor_path=pre_path;
		nor_path=path.normalize(nor_path); // 標準化路徑
		nor_path=nor_path.replace(/\\/g,"/"); // 把反斜線改成斜線
		nor_path=decodeURIComponent(nor_path); // URL解碼
		nor_path="./"+nor_path; // 變成相對路徑
		/**
		 * 把路徑接到應用程式目錄底下
		 */
		let real_path=nor_path;
		real_path=path.join(this.app_path,real_path);
		let detect_path=link2file(real_path); // 解析連結檔案
		// console.log({
		// 	pre_path,
		// 	query_str,
		// 	nor_path,
		// 	real_path
		// });
		if(detect_path===null && !this.socket_forward){
			return({find:"none",path:""});
		}
		if(detect_path!==null && this.fileExists(detect_path)){ // 路徑存在
			let stats=fs.statSync(detect_path);
			if(stats.isDirectory()){ // 是目錄，查詢目錄內的index檔案
				for(let i of this.index){
					let nw_path=path.join(detect_path,i);
					let nw_detect_path=link2file(nw_path);
					if(nw_detect_path===null)continue;
					let nw_stats=fs.statSync(nw_detect_path);
					if(nw_stats.isFile()){
						return({find:"file",path:nw_detect_path,extra_path:query_str});
					}else if(nw_stats.isDirectory()){
						return({find:"directory",path:nw_detect_path,extra_path:query_str});
					}else if(this.allow_unknown_file){
						return({find:"unknown",path:nw_detect_path,extra_path:query_str});
					}
				}
				return({find:"directory",path:detect_path,extra_path:query_str});
			}else if(stats.isFile()){
				return({find:"file",path:detect_path,extra_path:query_str});
			}else if(stats.isSocket()){
				return({find:"socket",path:detect_path,extra_path:"./"});
			}else if(this.allow_unknown_file){
				return({find:"unknown",path:detect_path});
			}else{
				return({find:"none",path:""});
			}
		}else if(this.socket_forward){ // 路徑不存在，檢查是否有設定socket轉發
			let prefix:string[]=nor_path.split("/").filter(v=>v.length>0); // 把路徑切成陣列，並去掉空字串
			prefix=[this.app_path,...prefix]; // 檢查app_path本身是不是也是socket檔案
			// 建立前綴和陣列
			for(let i=1;i<prefix.length;i++){
				prefix[i]=path.join(prefix[i-1],prefix[i]);
			}
			// 二分搜找出socket file
			let l=0,r=prefix.length;
			while(l<r){
				let mid=Math.floor((r-l)/2)+l;
				// console.log({
				// 	l,mid,r
				// });
				if(this.fileExists(prefix[mid])){
					l=mid+1;
				}else{
					r=mid;
				}
			}
			l--;
			// console.log({
			// 	nor_path,
			// 	prefix,
			// 	l
			// });
			if(0<=l){ // found
				let real_socket_path=link2file(prefix[l]); // 檔案可能是連結檔，解析出真實路徑
				if(real_socket_path===null){
					return({find:"none",path:""});
				}
				const stat=fs.lstatSync(real_socket_path);

				let sufpath=real_path.slice(prefix[l].length); // socket檔案後面的路徑
				// console.log({
				// 	pre_path,
				// 	query_str,
				// 	nor_path,
				// 	real_path,
				// 	prefix,
				// 	real_socket_path,
				// 	sufpath,
				// 	l
				// });
				if(sufpath.length===0)sufpath="/";
				else if(sufpath.startsWith("/")){}
				else if(sufpath.startsWith(".")){sufpath=sufpath.slice(1);}
				else{sufpath="/"+sufpath;}
				sufpath.replaceAll(path.sep,"/");
				// console.log({sufpath,query_str});
				// console.log(`found file: ${prefix[l]}`);
				sufpath+=query_str;
				if(stat.isSocket()){
					return {find:"socket",path:real_socket_path,extra_path:sufpath};
				}else{
					return {find:"unknown",path:real_socket_path,extra_path:sufpath};
				}
			}else{
				return({find:"none",path:""});
			}
		}else{
			// console.log(`file not found: ${detect_path}`);
			return({find:"none",path:""});
		}
	}

	server_function:http.RequestListener=async(req,res)=>{
		// this.write_log("🔵DBG",`new connect: ${req.url}`);
		// console.log(req.url);
		let fpath:string=req.url||"/";
		// fpath=path.resolve(fpath); // prevent path traversal attack
		if(fpath.startsWith(path.sep)){
			fpath=fpath.slice(1);
		}
		let status_code:http_status_code=200;
		let decoded_path_res=this.path_decode(fpath);
		// console.log({fpath,"req.url":req.url,decoded_path_res});
		let auth_res:Auth_result;
		// this.write_log("🔵DBG",JSON.stringify(decoded_path_res,null,2));
		// console.log({
		// 	"req.url":req.url,
		// 	fpath,
		// 	status_code,
		// 	decoded_path_res
		// });
		

		// 檢查檔案是否存在，或是否有適當的檔案讀取器
		// 若檔案存在，則使用authenticate檢查是否有權限存取
		if(decoded_path_res.find==="none" || // file not found
			(decoded_path_res.find==="directory" && !this.FileLoaders["/"]) || // directory have no index file and server can not deal with a directories
			(
				decoded_path_res.find==="file" && // file found
				!this.FileLoaders[path.extname(decoded_path_res.path).slice(1).toLowerCase()] && // but server can not deal with this file type
				!this.FileLoaders["*"] // and server can not deal with "any" file type
			) ||
			(
				!this.allow_unknown_file && // deny unknown file type
				decoded_path_res.find==="unknown" // and file type is unknown
			)
		){
			if(decoded_path_res.find==="none")
				this.client_record(req,res,404,fpath);
			else
				this.client_record(req,res,500,fpath);
				this.write_log("🟠Warn",`Server can not deal with path: ${fpath}\n`+
					`index file not found and server can not deal with a directories`);
			if(this.Err404===null){
				res.writeHead(500);
				res.end("");
				return;
			}
			decoded_path_res=this.path_decode(this.Err404||"");
			if(!this.Err404 || decoded_path_res.find==="none"){
				res.writeHead(500);
				res.end("");
				return;
			}else{
				auth_res=this.authenticate(req,res,404,decoded_path_res.path);
			}
		}else{
			auth_res=this.authenticate(req,res,200,decoded_path_res.path);
		}

		// check auth
		if(auth_res.pass){

			if(decoded_path_res.find==="socket"){
				// console.log("socket forward");
				// console.log({
				// 	decoded_path_res,
				// 	"original request url:":req.url,
				// });
				// if(decoded_path_res.extra_path=== "./" || decoded_path_res.extra_path===undefined){
				// 	decoded_path_res.extra_path="/";
				// }else if(decoded_path_res.extra_path.startsWith("./")){
				// 	decoded_path_res.extra_path=decoded_path_res.extra_path.slice(1);
				// }else if(!decoded_path_res.extra_path.startsWith("/")){
				// 	decoded_path_res.extra_path="/"+decoded_path_res.extra_path;
				// }
				// console.log("Extra path after processing:",decoded_path_res.extra_path);
				// console.log("request headers:");
				// console.log(req.headers);
				// [DBG] check socket file exist
				if(!this.fileExists(decoded_path_res.path)){
					this.write_log("🔴Err",`Socket file not found: ${decoded_path_res.path}`);
					res.writeHead(500);
					res.end("Socket file not found");
					return;
				}

				let socket_path=decoded_path_res.path;
				let extra_path=decoded_path_res.extra_path||"./";
				if(this.socket_proxy===null){
					this.socket_proxy=httpProxy.createProxyServer({});
				}
				req.url=extra_path;
				// console.log({
				// 	socket_path,
				// 	extra_path,
				// 	"req.url":req.url
				// });
				this.socket_proxy.web(req,res,
					{
						target:{
							socketPath:socket_path,
							path:""
						}
					},(err)=>{
						this.write_log("🔴Err",`Socket Proxy Error: ${err}`);
						if(!res.headersSent){
							res.writeHead(500);
							res.end("Socket Proxy Error");
						}
					}
				);
				this.client_record(req,res,res.statusCode,socket_path);
				return;
			}

			let call_Err500=(err:string|Error="")=>{
				status_code=500;
				if(this.Err500 && this.Err500.length===5){
					(this.Err500 as httpResponserWithErr)(req,res,500,decoded_path_res.path,err);
				}else if(this.Err500 && this.Err500.length===4){
					(this.Err500 as httpResponser)(req,res,500,decoded_path_res.path);
				}
			}

			// 檔案存在，且有適當的檔案讀取器
			let extname="";
			if(decoded_path_res.find==="file" || decoded_path_res.find==="unknown"){
				// console.log(`ExtType: ${this.ExtType}`);
				if(this.ExtType==="mutiple"){
					let ext=decoded_path_res.path.split(".").slice(1);
					// console.log({ext});
					if(ext.length){
						for(let i of ext){
							extname+=i.toLowerCase()+".";
						}
						extname=extname.slice(0,-1); // 去除最後一個點號
					}else extname="*"; // use default file loader
				}else if(this.ExtType==="single"){
					extname=path.extname(decoded_path_res.path).slice(1).toLowerCase();
				}
			}else if(decoded_path_res.find==="directory"){
				extname="/"; // directory
			}

			// console.log(`extname: ${extname}`);

			let origextname=extname; // save original extname for error message

			if(!(extname in this.FileLoaders)){
				extname="*"; // use default file loader
			}


			if(extname in this.FileLoaders){
				try{
					await this.FileLoaders[extname](req,res,status_code,decoded_path_res.path)?.catch((err)=>{
						throw err;
					});
				}catch(err){
					this.write_log("🔴Err",`Failed to load file: ${decoded_path_res.path}\nError Msg:\n${err}`);
					if(err instanceof Error || typeof(err)==="string"){
						call_Err500(err);
					}
				}
				return;
			}else{
				call_Err500(`file loader can not deal with this file type: ${origextname} and you did not set a default file loader for it.`);
				return;
			}

		}else{
			auth_res.response_func?.(req,res,status_code,decoded_path_res.path);
		}
	}

	/**
	 * 伺服器實例，如果伺服器已啟動，他會被保存在這裡，否則這裡會是`null`。
	 * 
	 * server instance, if the server is started, it will be saved here, otherwise it will be `null`.
	 */
	server:http.Server|null=null;

	/**
	 * Unix Domain Socket伺服器實例，如果伺服器已啟動，他會被保存在這裡，否則這裡會是`null`。
	 * 
	 * Unix Domain Socket server instance, if the server is started, it will be saved here, otherwise it will be `null`.
	 */
	unix_socket_server:net.Server|null=null;

	/**
	 * socket proxy代理器實例，如果有socket轉發，會使用這個進行轉發  
	 * 
	 * socket proxy instance, if socket forward is enabled, this will be used for forwarding.
	 */
	socket_proxy:httpProxy|null=null;

	/**
	 * 啟動伺服器。如果已設定SSL憑證和金鑰，則使用HTTPS協議，否則使用HTTP協議。
	 * 
	 * Start the server. If SSL certificate and key are set, it will use HTTPS protocol, otherwise it will use HTTP protocol.
	 */
	start():void{
		this.app_path=path.resolve(this.app_path);
		this.app_path=path.resolve(process.cwd(),this.app_path);
		this.socket_proxy=httpProxy.createProxyServer({});
		try{
			let cert:string|null=null;
			let key:string|null=null;
			if(this.cert && this.key){
				cert=fs.readFileSync(this.cert).toString();
				key=fs.readFileSync(this.key).toString();
			}
			this.log_file_fs=this.log_file_path?fs.createWriteStream(this.log_file_path,{flags:"a"}):null;
			// http/https server
			if(this.port !== null && this.port>=0 && this.port<=65535){
				this.write_log("🔵Log","Starting server...");
				if(cert && key){
					this.server=https.createServer({
						cert:cert,
						key:key
					},this.server_function);
					this.write_log("🔵Log","HTTPS server created with cert and key.");
				}else{
					this.server=http.createServer(this.server_function);
					this.write_log("🔵Log","HTTP server created without cert and key.");
				}
				this.server.listen(this.port,()=>{
					this.write_log("🟢Info",`Server started on port ${this.port}`);
				});
			}
			// socket server
			if(this.unix_domain_socket_path !== null && this.unix_domain_socket_path){
				if(fs.existsSync(this.unix_domain_socket_path)){
					fs.rmSync(this.unix_domain_socket_path,{force:true});
				}
				this.write_log("🔵Log","Starting unix domain socket server...");
				if(cert && key){
					this.unix_socket_server=https.createServer({
						cert,
						key
					},this.server_function);
				}else{
					this.unix_socket_server=http.createServer(this.server_function);
				}
				this.unix_socket_server.listen(this.unix_domain_socket_path,()=>{
					this.write_log("🟢Info",`Unix domain socket server started on path ${this.unix_domain_socket_path}`);
				});
			}
		}catch(e){
			this.log_file_fs?.closed;
		}
	}

}
