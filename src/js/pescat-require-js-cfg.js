var path = CONTEXT_PATH + "content/pescat/resources/js";
if (document.location.href.indexOf("debug=true") > 0) {
  //TODO: use compressed js. But we'll have to add that into the build system first.
//  path += "/compressed";
}
requireCfg.paths.pescat = path;
function pescat() {
  pen.require(["pescat/pescat"], function(pescat){
    pescat.captureCurrentContent();
  })
}
