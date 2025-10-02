
import http from "http";
import net from "net";

/**
 * socket forward
 * @param socketPath socket file path
 * @param socketExtraPath query path
 */
export default async(
	req:http.IncomingMessage,
	res:http.ServerResponse,
	socketPath:string,
	socketExtraPath:string
)=>{
	const socketClient=net.createConnection(socketPath);
	socketClient.on("error",(e)=>{
		console.error("socket connection error");
		console.error(e);
		if(!res.headersSent){
			res.writeHead(502,{"content-type":"text/plain"});
			res.end("502 Bad Gateway\n");
		}
		
	});


}
