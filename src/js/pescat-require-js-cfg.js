requireCfg.paths.pescat = CONTEXT_PATH + "content/pescat/resources/js" + (document.location.href.indexOf("debug=true") ==-1 ? "" : "/compressed");
function pescatPrint() {
  pen.require(["pescat/pescat"], function(pescat){
    pescat.captureCurrentContent("print");
  })
}
function pescatCapture() {
  pen.require(["pescat/pescat"], function(pescat){
    pescat.captureCurrentContent("capture");
  })
}
