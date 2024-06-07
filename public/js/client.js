window.onload = async function () {
  var params = new URLSearchParams(location.search)

  if (params.has("code")) {
    window.location.replace(
      "/todoist-export/export?code=" + params.get("code") + "&format=" + params.get("state")
    );

    document.querySelector("#loading").style.display = "none";
  } else if (params.has("token")) {
    document.querySelector("#loading").style.display = "block";
    document.querySelector("#loading-text").style.display = "block";

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

    await fetch(persistentBackupUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'todoist backup.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      });

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
