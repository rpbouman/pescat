import java.applet.Applet;

import java.awt.AWTPermission;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Point;
import java.awt.Robot;
import java.awt.Rectangle;
import java.awt.Toolkit;

import java.awt.datatransfer.ClipboardOwner;
import java.awt.datatransfer.Clipboard;
import java.awt.datatransfer.Transferable;
import java.awt.datatransfer.DataFlavor;

import java.awt.image.BufferedImage;
import java.awt.Image;

import java.lang.reflect.Method;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import java.net.URLEncoder;

import java.security.AccessController;
import java.security.PrivilegedAction;
import java.security.Permission;

import javax.imageio.ImageIO;

import netscape.javascript.JSObject;
import sun.misc.BASE64Encoder;

public class ScreenshotApplet extends Applet implements ClipboardOwner, Transferable {

  protected Robot robot;
  protected Image image;
  protected static DataFlavor[] dataFlavors = new DataFlavor[] {DataFlavor.imageFlavor};
  protected String status = "ready";
  protected String callback = null;
  protected String result = null;
  protected String error = null;

  protected String getLifecycleListener() {
    String lifecycleListener = getParameter("lifecycleListener");
    return lifecycleListener;
  }

  protected void notifyLifecycleListener(String status){
    String lifecycleListener = getLifecycleListener();
    if (lifecycleListener == null || "".equals(lifecycleListener)) return;
    JSObject win = JSObject.getWindow(this);
    Object[] args = new Object[2];
    args[0] = getName();
    args[1] = status;
    win.call(lifecycleListener, args);
  }

  //implement from ClipboardOwner
  public void lostOwnership(Clipboard clipboard, Transferable contents) {
  }

  //implement from Transferable
  public Object getTransferData(DataFlavor flavor) {
    return image;
  }

  //implement from Transferable
  public DataFlavor[] getTransferDataFlavors() {
    return dataFlavors;
  }

  //implement from Transferable
  public boolean isDataFlavorSupported(DataFlavor dataFlavor) {
    return dataFlavor == DataFlavor.imageFlavor;
  }

  //override from applet
  public void start(){
    super.start();
    notifyLifecycleListener("start");
  }

  //override from applet
  public void stop(){
    super.stop();
    notifyLifecycleListener("stop");
  }

  //override from applet
  public void destroy(){
    super.destroy();
    notifyLifecycleListener("destroy");
  }

  protected void setStatus(String status) throws Exception {
    this.status = status;
    try {
      Object ret = doCallback();
    }
    catch (Exception ex) {

    }
  }

  public String getStatus() {
    return status;
  }

  protected Object doCallback() throws Exception {
    JSObject win = JSObject.getWindow(this);
    Object[] args = new Object[3];
    args[0] = status;
    args[1] = error;
    args[2] = result;
    return win.call(callback, args);
  }

  public boolean isReady(){
    return "ready".equals(status);
  }

  public boolean isBusy(){
    return !isReady();
  }

  public void init(){
    try {
      robot = new Robot();
    }
    catch (Exception e) {
      status = e.getMessage();
    }
    finally {
      notifyLifecycleListener("init");
    }
  }

  protected Point getLocationOnScreenPrivileged() {
    return (Point) doPrivileged(
      new PrivilegedAction(){
        public Object run(){
          return getLocationOnScreen();
        }
      }
    );
  }

  public double getScreenX() {
    return getLocationOnScreenPrivileged().x;
  }

  public double getScreenY() {
    return getLocationOnScreenPrivileged().y;
  }

  protected Object doPrivileged(PrivilegedAction action) {
    return AccessController.doPrivileged(action);
  }

  protected void captureScreen(
    int x, int y, int w, int h,
    final String imageFormat,
    String encoding
  ) throws Exception {
    setStatus("create rect");
    final Rectangle rect = new Rectangle(x, y, w, h);
    setStatus("start capture");

    final BufferedImage image = (BufferedImage) doPrivileged(
      new PrivilegedAction(){
        public Object run(){
          return robot.createScreenCapture(rect);
        }
      }
    );

    if ("clipboard".equals(encoding)) {
      this.image = image;
      setStatus("acquire clipboard");
      Clipboard clipboard = (Clipboard)doPrivileged(
        new PrivilegedAction() {
          public Object run() {
            Toolkit toolkit = Toolkit.getDefaultToolkit();
            return toolkit.getSystemClipboard();
          }
        }
      );
      setStatus("writing clipboard");
      clipboard.setContents(this, this);
      setStatus("clipboard written");
    }
    else {
      setStatus("write image");
      final ByteArrayOutputStream os = new ByteArrayOutputStream();
      //this needs to be privileged because it could write a temporary file.
      IOException ioexception = (IOException)doPrivileged(
        new PrivilegedAction(){
          public Object run() {
            try {
              ImageIO.write(image, imageFormat, os);
              return null;
            }
            catch (IOException e) {
              return e;
            }
          }
        }
      );
      if (ioexception != null) throw ioexception;
      setStatus("get image data");
      byte[] imageData = os.toByteArray();
      encodeImage(imageData, encoding);
    }
  }

  protected void encodeImage(
    final byte[] imageData,
    String encoding
  ) throws Exception {
    setStatus("encode image");
    if (encoding.equals("url")) {
      String string = new String(imageData);
      result = URLEncoder.encode(string);
    }
    else
    if (encoding.equals("base64")) {
      final ByteArrayOutputStream os = new ByteArrayOutputStream();
      IOException e = (IOException)doPrivileged(
        new PrivilegedAction(){
          public Object run(){
            BASE64Encoder encoder = new BASE64Encoder();
            try {
              encoder.encode(imageData, os);
            }
            catch (IOException e) {
              return e;
            }
            return null;
          }
        }
      );
      if (e != null) throw e;
      result = os.toString();
    }
    else {
      throw new Exception("Unrecognized encoding " + encoding);
    }
    setStatus("image encoded");
  }

  public void createScreenshot(
    int x, int y, int w, int h,
    String callback,
    String imageFormat,
    String encoding
  ) throws Exception {
    if (isBusy()) throw new Exception("Still busy.");
    error = null;
    result = null;
    this.callback = callback;
    try {
      captureScreen(
        x, y, w, h,
        imageFormat,
        encoding
      );
    }
    catch(Exception e1){
      error = e1.getMessage();
      try {
        setStatus("error");
      }
      catch (Exception e2) {
      }
    }
    finally {
      callback = null;
      error = null;
      result = null;
      status = "ready";
    }
  }

}
