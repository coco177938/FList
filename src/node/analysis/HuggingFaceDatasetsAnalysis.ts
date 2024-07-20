import {addFileToFileTree, Folder} from "../base/files.js";
import {Analysis} from "../base/AllAnalysis.js";


async function huggingFaceDatasetsAnalysisTree(fileTree:Folder,userName:string,datasetsName:string,branchName:string,rootPath:string,path:string,hasDeep:number):Promise<Folder>{
    let response;
    try {
        response = await fetch(`https://huggingface.co/api/datasets/${userName}/${datasetsName}/tree/${branchName}${rootPath}${path?`/${path}`:``}`);
    }catch (error){
        throw new Error("HuggingFace Api 请求失败! 请检查网络是否畅通。"+error);
    }
    if(!response.ok){
        throw new Error("datasetsPath错误，详细信息:"+response.status+" "+response.statusText+" "+response.url+" "+await response.text());
    }
    const jsonData = await response.json() as {
        "type": "directory" | "file",
        "size": number,
        "path": string
    }[];
    for (let jsonDatum of jsonData) {
        if(jsonDatum.type=="file"){
            const pathArray = jsonDatum.path.split("/");
            const fileName = pathArray.pop() as string;
            addFileToFileTree(fileTree,pathArray,{
                name:fileName,
                url:`https://huggingface.co/datasets/${userName}/${datasetsName}/resolve/${branchName}${rootPath}/${jsonDatum.path}?download=true`,
                size:jsonDatum.size
            })
        }else if(jsonDatum.type=="directory"){
            if (hasDeep>0){
                await huggingFaceDatasetsAnalysisTree(fileTree,userName,datasetsName,branchName,rootPath,jsonDatum.path,hasDeep-1)
            }
        }
    }
    return fileTree;
}

export function huggingFaceDatasetsAnalysis(config:{
    userName:string,
    datasetsName:string,
    branchName:string,
    path?:string
    maxDeep?:number
}):Analysis{
    return ()=>{
        const fileTree:Folder = {children:[],name:"huggingFaceDatasetsAnalysisRoot"};
        return huggingFaceDatasetsAnalysisTree(fileTree,config.userName,config.datasetsName,config.branchName,config.path || "","",config.maxDeep || 10)
    };
}