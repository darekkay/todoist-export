window.onload = function() {
  var params = {};
  location.search.substr(1).split("&").forEach(function(item) {
    var pair = item.split("="), key = pair[0],
      value = pair[1] && decodeURIComponent(pair[1]);
    (params[key] = params[key] || []).push(value);
  });

  if (params.code) {
    window.location.replace("/todoist-export/export?code=" + params.code + "&format=" + params.state);
  } else if (params.token) {
    document.querySelector("#persistentBackup").style.display = "block";
    var persistentBackupUrl = window.location.href.split("?")[0] + "download?token=" + params.token + "&format=" + params.format;
    document.querySelector("#persistentBackupUrl").href = persistentBackupUrl;
    document.querySelector("#persistentBackupUrl").innerText = persistentBackupUrl;
    window.location.replace(persistentBackupUrl);
  }
};
