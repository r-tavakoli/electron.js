

const {app, BrowserWindow, Menu, globalShortcut, shell,ipcMain} = require('electron')
const path = require('path')
const os = require('os')
const imagemin = require('imagemin')
const imageminJpegMoz = require('imagemin-mozjpeg')
const imageminPngquant = require('imagemin-pngquant')
const slash = require('slash')
const log = require('electron-log')



let mainWindow
let aboutWindow


process.env.NODE_ENV = 'production'
const isDev = process.env.NODE_ENV !=='production' ? true:false
const isWin = process.env.NODE_ENV ==='win32'?true:false


// Main window
function createMainWindow(){
     mainWindow = new BrowserWindow({
        title: 'Image Shrink',
        width: isDev ? 800 : 500,
        height: 600,
        icon: 'assets/icons/shrink-2522141-2114793.png',
        resizable: isDev ? true:false,
        webPreferences:{
            nodeIntegration: true,
          },
    })


    if(isDev){
        mainWindow.webContents.openDevTools()
    }
    mainWindow.loadFile('app/index.html')
    // mainWindow.loadURL('file://' + __dirname + '/app/index.html')
}


// About window
function createAboutWindow() {
    aboutWindow = new BrowserWindow({
      title: 'About ImageShrink',
      width: 300,
      height: 340,
      icon: 'assets/icons/shrink-2522141-2114793.png',
      resizable: false,
      backgroundColor: 'white',
    //   disable parent window when popup is open
      parent: mainWindow,
      modal: true, 
    })
    // aboutWindow.setMenu(null)
    aboutWindow.removeMenu()
    aboutWindow.loadFile('app/about.html')
   
}



const menu = [
    {
        label: "File",
        submenu: [
            {
                label: "Quit",
                accelerator: "Ctrl+Q",
                click: () => app.quit(),
            },
        ] ,
    },
    ,
    ...(isDev ?
            [
                {
                    label: "Developer",
                    submenu: [
                        {role: "reload"},
                        {role: "forcereload"},
                        {type: "separator"},
                        {role: "toggledevtools"},     
                    ]
                }
            ]:[]),
    {
        label: "Contact Me",
        click: ()=> shell.openExternal('https://www.datasense.ir/')
    },
    {
        label: 'About',
        click: createAboutWindow,
    },   
]



ipcMain.on('image:minimize',(e,option)=>{
    option.dest = path.join(os.homedir(),'imageshrink')
    shrinkImage(option)
})


async function shrinkImage({imgPath,quality,dest}){
    try{
        const pngQuality = quality /100
        const file = await imagemin([slash(imgPath)],{
            destination : dest,
            plugins: [
                imageminJpegMoz({quality}),
                imageminPngquant({
                    quality: [pngQuality, pngQuality]
                })
            ],
        })

        shell.openPath(dest)
        log.info(file)
        mainWindow.webContents.send('image:done')
    }
    catch(err){
        log.error(err)
    }
}



app.on('ready',()=>{

    // main window
    createMainWindow()

    // menu
    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu) 
    

    // global shortcuts
    globalShortcut.register("Ctrl+R",()=>mainWindow.reload())


    // garbage collector
    mainWindow.on('ready',() => mainWindow=null, aboutWindow=null)
})