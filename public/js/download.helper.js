
import { assemblePersistentBackupUrl } from "./url-generation.js";

export function handleFileDownload(params){
    const persistentBackupUrl = assemblePersistentBackupUrl(params);
  
    displayPersistentBackupUrl(persistentBackupUrl);
    
    downloadFile(persistentBackupUrl);
  }

async function downloadFile(url){

    showDownloadIndicator();
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const dummyLink = createDummyAchorLinkForDownloading(blobUrl, url);
  
    dummyLink.click();
    removeDummyLink(dummyLink);
    hideDownloadIndicator();
  }
  
  function createDummyAchorLinkForDownloading(blobUrl, initialURL){
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = initialURL.split("/").pop();
    document.body.appendChild(a);
  
    return a;
  }
  
  function removeDummyLink(dummyLink){
    document.body.removeChild(dummyLink);
    URL.revokeObjectURL(dummyLink.href);
  }
  
  export function showDownloadIndicator() {
    var downloadIndicator = document.getElementById("downloadIndicator");
    if (downloadIndicator) {
      downloadIndicator.style.display = "block";
    }
  }
  
  export function hideDownloadIndicator() {
    var downloadIndicator = document.getElementById("downloadIndicator");
    if (downloadIndicator) {
      downloadIndicator.style.display = "none";
    }
  }


  function displayPersistentBackupUrl(persistentBackupUrl){
    document.querySelector("#persistentBackup").style.display = "block";
    document.querySelector("#persistentBackupUrl").href = persistentBackupUrl;
    document.querySelector("#persistentBackupUrl").innerText =
      persistentBackupUrl;
  }