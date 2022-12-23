window.onload = function () {
  var params = new URLSearchParams(location.search)

  if (params.has("code")) {
    window.location.replace(
      "/todoist-export/export?code=" + params.get("code") + "&format=" + params.get("state")
    );
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
