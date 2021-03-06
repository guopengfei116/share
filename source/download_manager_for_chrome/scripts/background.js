
// 延迟一分钟上报
setTimeout(function () {
    // 上报广义DAU
    Report.oneDayOne('visit');
}, 1000 * 61);

// 上报安装量
chrome.runtime.onInstalled.addListener(function (result) {
    if(result.reason === 'install') {
        Report.onlyOne('install');
        console.log('安装');
        //alert('恭喜你安装了我司插件-_-！');
    }
});

// 打开下载标签页
function openDownloads(){
    chrome.tabs.create({
        url:"chrome://downloads/"
    });
}
/*
* 绑定icon事件监听
* */
chrome.browserAction.onClicked.addListener(function () {
    openDownloads();
    // 上报插件启用事件
    Report.oneDayOne('click_icon');
});
