window.onload = function () {
  var params = new URLSearchParams(location.search)

  document.querySelector("#submit").addEventListener("click", function() {
    var checkbox = document.querySelector("#archivedCbox");
    if (checkbox.checked) {
      document.querySelector("#loading-text").style.display = "block";
    }
    document.querySelector("#loading").style.display = "block";
  });

  if (params.has("code")) {
    window.location.replace(
      "/todoist-export/export?code=" + params.get("code") + "&format=" + params.get("state")
    );
    
    document.querySelector("#loading").style.display = "none";
  } else if (params.has("token")) {
    document.querySelector("#persistentBackup").style.display = "block";
    var persistentBackupUrl =
      window.location.href.split("?")[0] +
      "download?token=" +
      params.get("token") +
      "&format=" +
      params.get("format");
    document.querySelector("#persistentBackupUrl").href = persistentBackupUrl;
    document.querySelector("#persistentBackupUrl").innerText =
      persistentBackupUrl;
    window.location.replace(persistentBackupUrl);

    document.querySelector("#loading").style.display = "none";
  }

  updateArchived(this);
};

function updateArchived(sender) {
  var archived = document.getElementById("archivedCbox");
  if (document.getElementById("formatJSON").checked) {
    archived.disabled = false;
  } else {
    archived.disabled = true;
    archived.checked = false;
  }
}
