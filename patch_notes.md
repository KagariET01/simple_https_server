# 1.3.0 socket proxy support

now support socket proxy.  
if the prefix of request url is a socket file  path, the request will be proxied to the socket server.	
for example, if the request url is `/dir/socket_server.socket/some/api`, the request will be proxied to the socket server at `<app_path>/dir/socket_server.socket` with path `/some/api`.

現在支援把請求轉發到socket伺服器。
如果請求的url前綴是socket檔案路徑，請求會被轉發到該socket伺服器。
例如，若請求的url是 `/dir/socket_server.socket/some/api`，請求會被轉發到位於 `<app_path>/dir/socket_server.socket` 的socket伺服器，並且路徑是 `/some/api` 。

# 1.2.0-patch2

fix some bug.

# 1.2.0-patch1

fix some bug.

# 1.2.0 api.js support

now support api.js file. It can be used as your backend handling server.

現在支援 api.js 檔案作為你的後端處理伺服器。

# 1.1.0 unix socket update

now support unix socket server.  
to enable, set the socket path at `HTTPSServer.unix_domain_socket_path` property.  
to disable HTTP/HTTPS server or disable unix socket server, set the corresponding property (`port`, `unix_domain_socket_path`) to `null`.

現在支援Unix Socket伺服器。
若要啟用，請設定 socket server 路徑到 `HTTPSServer.unix_domain_socket_path` 。
若你想停用 HTTP/HTTPS 伺服器或停用 Unix Socket 伺服器，請將對應的屬性（`port`, `unix_domain_socket_path`）設為 `null` 。

# 1.0.0 initial release
initial release  
All begins from here.

初始版本，也是一切的起始點。
