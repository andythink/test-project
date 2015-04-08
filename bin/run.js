var finalhandler = require('finalhandler')
var http = require('http')
var serveIndex = require('serve-index')
var serveStatic = require('serve-static')

var path = require('path')
var url = require('url');
var fs = require('fs')

var config = require('./config.json')
var pathMap = config['path']
;(typeof pathMap === 'undefined') && (pathMap = {})

var indexMap = {},
    serveMap = {},
    pathRegExpMap = {}

//初始化index、static
for(var tempPath in pathMap) {
    indexMap[tempPath] = serveIndex(pathMap[tempPath], {"icons": true, "hidden": false, "view": "details"})
     
    serveMap[tempPath] = serveStatic(pathMap[tempPath])

    if(tempPath[tempPath.length - 1] !== '/') {
        pathRegExpMap[tempPath] = new RegExp('^' + tempPath + '/')
    } else {
        pathRegExpMap[tempPath] = new RegExp('^' + tempPath)
    }

}

var homeDir = ''
if(pathMap['/'] === undefined) {
    var tempRoot = process.cwd()
    indexMap['/'] = serveIndex(tempRoot, {"icons": true, "hidden": false, "view": "details"})
     
    serveMap['/'] = serveStatic(tempRoot)

    pathRegExpMap['/'] = new RegExp('^/')

    pathMap['/'] = tempRoot

    homeDir = tempRoot
} else {
    homeDir = pathMap['/']
}



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
    var reqUrl = req.url   
    console.log(homeDir)
    console.log(reqUrl)   
    var    fileUrl = path.join(homeDir, reqUrl),
        flag = false,
        fileType = reqUrl.substr(reqUrl.lastIndexOf('.') + 1, reqUrl.length)
    console.log('                                       ')
    console.log(++count + '                                            ')

    for(var browPath in pathMap) {
        if(browPath !== '/') {
            var tempRegExp = new RegExp('^' + browPath)
            if(tempRegExp.exec(reqUrl) !== null) {
                flag = true
                serveIndexRespone(req, res, browPath)
                break
            }
        }
    }

    if(!flag) {
        if(fileType === 'html') {            
            var files = []
            try{
                var file = fs.readFileSync(fileUrl, 'utf-8')
                var arrs = file.match(reg) || [];
            } catch(e) {
                serveIndexRespone(req, res, '/')
            }

            if(arrs.length > 0) {
                // 控制台输出请求路径对应的文件
                console.log(req.url + '==>' +fileUrl)

                var filePath = fileUrl.substring(0, fileUrl.lastIndexOf('\\') + 1)
                arrs.forEach(function(arr){
                    var fileUrl = arr.match(pathReg)[0].replace(/"|'| /g, '');
                    var includeFilePath

                    //支持相对路径与绝对路径
                    if(/^\s*\//.exec(fileUrl)) {
                        console.log(homeDir)
                        includeFilePath = path.join(homeDir, fileUrl);
                    } else {
                        includeFilePath = url.resolve(filePath, fileUrl);
                    }

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
                serveIndexRespone(req, res, '/')
            }

        } else {       
            serveIndexRespone(req, res, '/')
        }
    }



})
function serveIndexRespone(req, res, prefixPath) {
    var done = finalhandler(req, res)
    // 将req.url规范化 目录的路径最后都有"/"
    var lastPart = req.url.split('/').pop()
    if(lastPart.length > 0) {
        if(lastPart.split('.').length === 1) {
            req.url = req.url + '/'
        }
    }

    //修改req.url 在serve-static serve-index用作调整相对于跟
    req.url =  '/' + req.url.replace(pathRegExpMap[prefixPath], '')
    // 用与serve-index文件的超链接路径调整
    if(prefixPath === '/') {
        req.prefixPath = ''
    } else {
        req.prefixPath = prefixPath
    }

    serveMap[prefixPath](req, res, function onNext(err) {
        if (err) return done(err)
        indexMap[prefixPath](req, res, done)
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