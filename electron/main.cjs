const {app,BrowserWindow,ipcMain,screen}=require('electron');
const path=require('path');
let win;
app.whenReady().then(()=>{
 const area=screen.getPrimaryDisplay().workArea;
 win=new BrowserWindow({width:440,height:650,x:area.x+area.width-460,y:area.y+area.height-680,transparent:true,frame:false,alwaysOnTop:true,resizable:true,hasShadow:false,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false}});
 win.setMenuBarVisibility(false);
 win.loadURL('http://127.0.0.1:5173');
 ipcMain.on('close-window',()=>win.close());
 ipcMain.on('minimize-window',()=>win.minimize());
});
app.on('window-all-closed',()=>app.quit());
