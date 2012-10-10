pen.define(function() {
  var PescatSettings;

  (PescatSettings = function(labels, paperSizes){
    this.labels = labels;
    this.paperSizes = paperSizes;
  }).prototype = {
    rulerWidth: 100,
    margins: 20,
    labels: null,
    paperSizes: null,
    getPescatInstance: function(){
      return window.parent.pescatInstance;
    },
    doPrint: function(){
      var toolbar = this.getToolbar();
      var style = toolbar.style;
      style.display = "none";
      window.print();
      style.display = "";
    },
    getToolbar: function() {
      return document.getElementById("toolbar");
    },
    getPortrait: function() {
      return document.getElementById("portrait");
    },
    getLandscape: function() {
      return document.getElementById("landscape");
    },
    getPrintButton: function() {
      return document.getElementById("printButton");
    },
    getCopyToClipboardButton: function() {
      return document.getElementById("copyToClipboardButton");
    },
    getPaperSizeSelect: function() {
      return document.getElementById("paperSize");
    },
    getRuler: function() {
      return document.getElementById("ruler");
    },
    getScreenshot: function(){
      return document.getElementById("screenshot");
    },
    getPaperSize: function() {
      var paperSizeSelect = this.getPaperSizeSelect();
      var index = paperSizeSelect.selectedIndex;
      var option = paperSizeSelect.options[index];
      paperSize = option.value;
      return this.paperSizes[paperSize];
    },
    getOrientation: function() {
      var portrait = document.getElementById("portrait");
      var landscape = document.getElementById("landscape");
      if (portrait.checked) {
        return "portrait";
      }
      else
      if (landscape.checked) {
        return "landscape";
      }
      else {
        throw "No selection";
      }
    },
    applySettings: function() {
      var pescatInstance = this.getPescatInstance();
      var ruler = this.getRuler();
      var paperSize = this.getPaperSize();
      var orientation = this.getOrientation();
      var h, w;
      if (orientation === "portrait") {
        w = paperSize[0];
        h = paperSize[1];
      }
      else
      if (orientation === "landscape") {
        w = paperSize[1];
        h = paperSize[0];
      }
      w -= 2 * this.margins;
      h -= 2 * this.margins;
      var iw = pescatInstance.imageWidth / ruler.clientWidth * this.rulerWidth;
      var ih = pescatInstance.imageHeight / ruler.clientWidth * this.rulerWidth;
      if (iw > w || ih > h) {
        var screenshot = this.getScreenshot();
        var wFactor = w / iw;
        var hFactor = h / ih;
        var factor;
        if (wFactor > hFactor) {
          factor = hFactor;
        }
        else {
          factor = wFactor;
        }
        screenshot.height = factor * pescatInstance.imageHeight;
        screenshot.width = factor * pescatInstance.imageWidth;
      }
    },
    renderScreenshot: function(data, width, height) {
      var pescatInstance = this.getPescatInstance(),
          screenshot = this.getScreenshot()
      ;
      screenshot.src = "data:image/png;base64,"  + pescatInstance.result;
      this.applySettings();
    },
    setLabels: function(labels){
      var labels = this.labels, label, el, text;
      for (label in labels) {
        text = labels[label];
        if (typeof(text) !== "string") continue;
        el = document.getElementById(label);
        if (!el) continue;
        el.innerHTML = text;
      }
    },
    init: function() {
      var me = this,
          defaults = me.labels.defaults,
          paperSize, option,
          defaultOrientation,
          defaultPaperSize,
          portrait = me.getPortrait(),
          landscape = me.getLandscape(),
          paperSizeSelect = me.getPaperSizeSelect(),
          printButton = me.getPrintButton(),
          copyToClipboardButton = me.getCopyToClipboardButton(),
          ruler = me.getRuler()
      ;
      me.setLabels();

      defaultOrientation = document.getElementById(defaults.orientation || "portrait");
      if (defaultOrientation) defaultOrientation.checked = true;

      ruler.style.width = me.rulerWidth + "mm";

      defaultPaperSize = defaults.paperSize || "A4";
      for (paperSize in me.paperSizes) {
        option = document.createElement("OPTION");
        option.innerHTML = paperSize;
        option.value = paperSize;
        option.label = paperSize;
        option.selected = (paperSize === defaultPaperSize);
        paperSizeSelect.appendChild(option);
      }
      this.getPescatInstance().renderScreenshot();
      portrait.onclick = landscape.onclick = paperSizeSelect.onchange = function() {
        me.applySettings();
      }
      printButton.onclick = function(){
        me.doPrint();
      }
    }
  };

  return PescatSettings;
});
