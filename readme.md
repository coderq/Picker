# Picker使用指南

数据选择器，目前提供三种数据选择方案：单文本选择，单图片选择，多图片选择。锚点选择可以选择单文本选择。

## 插件依赖
> * jQuery
> * Bootstrap 3.0

### HTML
``` html
<!DOCTYPE html>
<html lang="zh-CN">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="/libs/bootstrap/3.3.5/css/bootstrap.min.css">
</head>

<body>
    <div class="modal fade" id="Picker"></div>
    <script src="/libs/jquery/1.11.3/jquery.min.js"></script>
    <script src="/libs/bootstrap/3.3.5/js/bootstrap.min.js"></script>
    <script type="text/javascript" src="/libs/jquery.picker.js"></script>
</body>
</html>
```
### Javascript
``` javascript
$('#Dialog').picker(<type>, {
    <attributes>: <value> 
});
```

## 单文本选择
插件会根据后台数据显示可供选择的文本，可以筛选文本，用户选中文本并点击确定后，插件会通过用户定义的onComplete方法返回对应的数据行。
### 运行效果图
![效果图](http://chuantu.biz/t2/18/1447073845x1822610075.png)
### 使用方法
``` javascript
$('#Picker').picker('single_text', {
    title: '文本选择',                   // 定义弹出框的标题
    confirm_text: '确定',               // 定义确定按钮的文本
    cancel_text: '取消',                // 定义取消按钮的文本
    method: 'get',                      // 定义http获取方式
    url: '/data',                       // 定义http获取地址
    rows: 10,                           // 定义每页显示行数
    onComplete: function(selected) {    // 定义用户点击确定按钮时调用的方法，方法第一个参数为选中元素
        alert('You select: ' + JSON.stringify(selected));
                                        // You select: {"id": 1, "name": "神爸", "href": "http://www.shenba.com", ...}
    }
}).modal('show');

```
### 数据格式
``` javascript
{
    "code": 0,                            // 0:成功，其他：失败
    "message": "错误原因",                 // 当code非0时，插件会抛出该错误信息
    "data": [{                            // 文本列表
        "id": 1,                          // 唯一ID 
        "name": "神爸",                    // 文本名称
        ...                               // 如果有必要，可以自己定义一些扩展属性
    },...],
    page: 1,                              // 页码
    rows: 10,                             // 每页数据行数
    total: 22                             // 总数据量
}
```

## 单图片选择
图片选择分两个步骤，首先选择图片文件夹，选择后，插件会获取文件夹对应的图片，选中图片后，点击确定，返回对应的数据行。
### 效果图
![文件夹选择](http://chuantu.biz/t2/18/1447074398x1822610075.png)
![图片选择](http://chuantu.biz/t2/18/1447074536x-1566679290.png)
### 使用方法
``` javascript
$('#Picker').picker('single_picture', {
    title: '图片选择',
    confirm_text: '确定',
    cancel_text: '取消',
    folder_method: 'get',
    folder_url: '/folder',
    image_method: 'get',
    image_url: '/img',
    rows: 10,
    onComplete: function(selected) {
        alert('You select: ' + JSON.stringify(selected));
    }
}).modal('show');
```
### 文件夹数据格式
``` javascript
{
    "code":0,                       // 错误代码
    "message":"成功",               // 错误信息
    "rows":10,                      // 每页显示行数
    "page":1,                       // 当前页码
    "total":16,                     // 总数据量
    "data":[{                       // 文件夹列表
        "id":1,                     // 文件夹ID
        "name":"双11专场图片",       // 文件夹名称
        "total":32                  // 文件夹下图片总量
    }, ...]
}
```
### 图片数据格式
``` javascript
{
    "code":0,                       // 错误代码
    "message":"成功",               // 错误信息
    "total":13,                     // 总数据量
    "data":[{                       // 图片列表
        "id":1,                     // 文件夹ID
        "name":"首页截图",           // 文件夹名称
        "src":"/src/imgs/1.png"     // 文件夹下图片总量
    }, ...]
}
```