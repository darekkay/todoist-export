import { handleFileDownload, showDownloadIndicator, hideDownloadIndicator } from "./download.helper.js";
import { assembleURL } from "./url-generation.js";

// Make updateArchived available globally for the onchange event
window.updateArchived = function(sender) {
  var archived = document.getElementById("archivedCbox");
  if (document.getElementById("formatJSON").checked) {
    archived.disabled = false;
  } else {
    archived.disabled = true;
    archived.checked = false;
  }
};

window.onload = function () {
  var params = new URLSearchParams(location.search);
  hideDownloadIndicator();

  if (params.has("code")) {
    showDownloadIndicator();
    window.location.replace(
      assembleURL(params)
    );
  } else if (params.has("token")) {
    handleFileDownload(params);
  }

  window.updateArchived(this);
  
  // Add event listener to show indicator when form is submitted
  var form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", function() {
      showDownloadIndicator();
    });
  }
};
