const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{close:()=>ipcRenderer.send('close-window'),minimize:()=>ipcRenderer.send('minimize-window')});
