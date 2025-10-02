import fs from "fs";
import path from "path";

export default (fpath:string):string|null=>{
	let re:string|null=fpath;
	while(typeof(re)==="string"){
		if(fs.existsSync(re)===false){
			re=null;
			break;
		}
		let stat:fs.Stats=fs.lstatSync(re);
		if(!stat.isSymbolicLink()){
			break;
		}
		let link:string=fs.readlinkSync(re);
		if(link.startsWith("/")){
			re=link;
		}else{
			re=path.resolve(path.dirname(re),link);
		}
	}
	return re;
};
