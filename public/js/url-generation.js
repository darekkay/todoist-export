export function assembleURL(params){
    const url = "/todoist-export/export?code=" + params.get("code") + "&format=" + params.get("state");
    
    return url;
  }
  
export function assemblePersistentBackupUrl(params){
    const url = window.location.href.split("?")[0] +
    "download?token=" +
    params.get("token") +
    "&format=" +
    params.get("format");
    
    return url;
}