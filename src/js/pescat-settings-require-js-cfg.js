var locale = SESSION_LOCALE.split("_");
pen.require(
  [
    "pescat/pescat-settings-labels." + locale[0],
    "pescat/paper-sizes",
    "pescat/pescat-settings"
  ],
  function(labels, paperSizes, PescatSettings){
    window.onload = function(){
      window.pescatSettings = new PescatSettings(labels, paperSizes);
      window.pescatSettings.init();
    };
  }
);
