var finalhandler = require('finalhandler')
var http = require('http')
var serveIndex = require('serve-index')
var serveStatic = require('serve-static')

var path = require('path')
var url = require('url');
var fs = require('fs')

 
// Serve directory indexes for public/ftp folder (with icons) 
var index = serveIndex('./', {"icons": true, "hidden": true, "view": "details"})
 
// Serve up public/ftp folder files 
var serve = serveStatic('./')
 
var homeDir = process.cwd()
//--------------------------------------------------------
//匹配@@include("")
var reg = /@{2}include\(\s*["'].*\s*["']\s*(,\s*\{[\s\S]*?\})?\)/g;

//获取@@include("XXX")中的"XXX"字符
var pathReg = /["'] *.*? *["']/;

//--------------------------------------------------------

var count = 0
// Create server 
var server = http.createServer(function onRequest(req, res){
    
    //获取文件路径
    var fileUrl = path.join(homeDir, req.url)
    var fileType = fileUrl.substr(fileUrl.lastIndexOf('.') + 1, fileUrl.length)
    console.log('                                       ')
    console.log(++count + '                                            ')
    console.log(req.url + '==>' +fileUrl)

    if(fileType === 'html') {
        var files = []
        try{
            var file = fs.readFileSync(fileUrl, 'utf-8')
            var arrs = file.match(reg) || [];
        } catch(e) {
            serveIndexRespone(req, res)
        }

        if(arrs.length > 0) {
            var filePath = fileUrl.substring(0, fileUrl.lastIndexOf('\\') + 1)
            arrs.forEach(function(arr){
                var fileUrl = arr.match(pathReg)[0].replace(/"|'| /g, '');
                var includeFilePath = url.resolve(filePath, fileUrl);
                if(!files[arr]) {
                    files[arr] = fs.readFileSync(includeFilePath, 'utf-8')
                }
            })
            for(var includeFile in files) {
                file = file.replace(includeFile, files[includeFile])
            }

            // console.log(file)
            res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'})
            res.write(file)
            res.end()
        } else {
            serveIndexRespone(req, res)
        }

    } else {
        serveIndexRespone(req, res)
    }



})
function serveIndexRespone(req, res) {
    var done = finalhandler(req, res)
    serve(req, res, function onNext(err) {
        if (err) return done(err)
        index(req, res, done)
    })
}
 
// Listen 
server.listen(3000, function() {
    console.log('--------------------------------------------')
    console.log('-                                          -')
    console.log('-                                          -')
    console.log('-                                          -')
    console.log('-         前端本地开发环境启动完成         -')
    console.log('-                                          -')
    console.log('-   在浏览器中打开  http://127.0.0.1:3000  -')
    console.log('-                                          -')
    console.log('-                                          -')
    console.log('--------------------------------------------')
})