pen.define(function(){
  function elOffset(el) {
    var offset = {
      left: 0, top: 0
    };
    while (el && el !== document) {
      offset.left += el.offsetLeft;
      offset.top += el.offsetTop;
      el = el.offsetParent;
    }
    return offset;
  }

  var Pescat;
  (Pescat = function() {
    return this;
  }).prototype = {
    appletId: "pescat-applet",
    createApplet: function(callback) {
      var appletContainer = document.createElement("DIV");
      var style = appletContainer.style;
      style.position = "absolute";
      style.left = "0px";
      style.top= "0px";
      style.zIndex = -1;
      document.body.appendChild(appletContainer);
      var lifecycleListener = "pescatLifecycleListener";
      var html =  "<applet" +
                  " id=\"" + this.appletId + "\"" +
                  " code=\"ScreenshotApplet.class\"" +
                  " archive=\"/pentaho/content/pescat/lib/pescat.jar\"" +
                  " width=\"1\" height=\"1\"" +
                  " style=\"" +
                  "  position:absolute;" +
                  "  margin:0px;" +
                  "  margin:0px;" +
                  "  left:0px;" +
                  "  top:0px;" +
                  "\"" +
                  " mayscript"+
                  ">"+
                   "<param" +
                   " name=\"lifecycleListener\""+
                   " value=\"" + lifecycleListener + "\"" +
                   "\/>" +
                  "</applet>"
      ;
      var me = this;
      window[lifecycleListener] = function(name, status) {
        if (status === "start") setTimeout(function(){
          callback(me.getApplet());
        }, 200);
      };
      appletContainer.innerHTML = html;
    },
    getApplet: function() {
      return document.applets[this.appletId];
    },
    acquireApplet: function(callback){
      var applet = this.getApplet();
      if (typeof(applet) === "undefined") {
        this.createApplet(callback);
      }
      else {
        callback(applet);
      }
    },
    capture: function(
      x, y, w, h,
      callback,
      imageFormat,
      encoding
    ) {
      var me = this;
      me.acquireApplet(
        function(applet) {
          try {
            applet.createScreenshot(
              x, y, w, h,
              callback,
              imageFormat,
              encoding
            );
          } catch (e) {
            me.notifyNPObjectException(e);
            res = false;
          }
        }
      );
    },
    notifyNPObjectException: function(e) {
      debugger;
      mantle_showMessage (
        "Error",
        "An error occurred creating the screenshot." +
        "\n This usually happens because the certificate wasn't imported." +
        "\n (" + e.toString() + ")"
      );
    },
    captureCallback: function(status, error, result) {
      console.log("status: " + status);
      console.log("error: " + error);
      console.log("result: " + result);
      switch (status) {
        case "error":
          mantle_showMessage("Error", error);
          break;
        case "image encoded":
          pescatInstance.result = result;
          pescatInstance.renderScreenshot();
          break;
      }
    },
    getTabDeckPanel: function() {
      var el = document.getElementById("contentDeck");
      el = contentDeck.childNodes.item(2);
      el = el.getElementsByTagName("TABLE").item(0);
      el = el.rows.item(1).cells.item(0);
      if (el.className === "pentaho-tab-deck-panel") return el;
      throw "pentaho-tab-deck-panel not found!";
    },
    getTabBar: function() {
      var el = document.getElementById("contentDeck");
      el = contentDeck.childNodes.item(2);
      el = el.getElementsByTagName("TABLE").item(0);
      el = el.rows.item(0).cells.item(0);
      el = el.childNodes.item(0);
      if (el.className === "pentaho-tab-bar") return el;
      throw "pentaho-tab-bar not found!";
    },
    getTabWidget: function() {
      if (this.tabWidgetIndex === null) throw "Tabwidget not set";
      var tabBar = this.getTabBar();
      var tabWidgets = tabBar.childNodes;
      var tabWidget, i, n = tabWidgets.length, text;
      for (i = 0; i < n; i++){
        tabWidget = tabWidgets.item(i);
        text = null;
        if (typeof(tabWidget.textContent) === "string") {
          text = tabWidget.textContent;
        }
        else
        if (typeof(tabWidget.innerText) === "string") {
          text = tabWidget.textContent;
        }
        if (text === "pescat") return tabWidget;
      }
      return null;
    },
    activateTab: function() {
      var tabWidget = this.getTabWidget();
      $(tabWidget).click();
      return;
      if (typeof(tabWidget.click) === "function") {
        tabWidget.click();
      }
      else
      if (typeof(document.createEvent) === "function") {
        var evt = document.createEvent("MouseEvents");
        evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        var allowDefault = tabWidget.dispatchEvent(evt);
      }
    },
    captureCurrentContent: function(usage){
      var me = this;
      me.acquireApplet(
        function(applet) {
          var body = document.body;
          var appletWidth = applet.getWidth();
          var appletPixel = applet.clientWidth / appletWidth;
          var contentDeck = me.getTabDeckPanel();
          var offset = elOffset(contentDeck);
          var x = applet.getScreenX() + offset.left;
          var y = applet.getScreenY() + offset.top;
          var w = contentDeck.clientWidth * appletPixel;
          var h = contentDeck.clientHeight * appletPixel;
          me.imageWidth = w;
          me.imageHeight = h;
          var callback = "pescatCaptureCallback";
          var imageFormat = "png";
          var encoding = (usage === "capture" ? "clipboard" : "base64");
          me.capture(
            x, y, w, h,
            callback,
            imageFormat,
            encoding
          );
        }
      );
    },
    getFrame: function() {
      var frame = frames["pescatFrame"];
      return frame;
    },
    openPescatTab: function(){
      var name = "Print settings";
      var title = "Print settings";
      var frameName = "pescatFrame";
      var url = CONTEXT_PATH + "/content/pescat/resources/html/pescat-settings.html";
      mantle_openNamedFrameTab(name, title, frameName, url);
    },
    renderScreenshot: function () {
      var frame = this.getFrame();
      if (typeof(frame) === "undefined") {
        this.openPescatTab();
        return;
      }
      if (this.result === null) return;
      //var win = frame.contentWindow;
      var win = frame;
      win.pescatSettings.renderScreenshot();
      this.activateTab();
    }
  };
  var pescatInstance = new Pescat();
  window.pescatInstance = pescatInstance;
  window.pescatCaptureCallback = pescatInstance.captureCallback;
  return pescatInstance;
})
