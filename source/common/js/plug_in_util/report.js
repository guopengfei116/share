/*
 * @Class   上报
 * @*       mdata 和 GA
 * @return  Report
 * */
(function () {

    var root = this;
    var APP_ID = 759217506;
    var GA_ID = 'UA-71036067-1';
    var LOCALSTORAGE_UUID_NAME = 'uuid';
    var UUID_URL = 'http://127.0.0.1:7777/uid';

    var isUuid = false;

    // 初始化ga上报
    ga('create', GA_ID, 'auto');
    ga('send', 'pageview');

    // 工具方法
    var util = {
        /*
        * @method 初始化uuid
        * */
        initUuid : (function () {
            $.ajax({
                url : UUID_URL,
                success : function (result) {
                    // 如果egg有uuid则用egg的uuid，没有自己生成uuid
                    if( result.uid ){
                        localStorage[LOCALSTORAGE_UUID_NAME] = result.uid;
                    }else {
                        localStorage[LOCALSTORAGE_UUID_NAME] = util.CreateUuid();
                    }
                    isUuid = true;
                    Report.runQueue();
                },
                error : function (result) {
                    localStorage[LOCALSTORAGE_UUID_NAME] = util.CreateUuid();
                    isUuid = true;
                    Report.runQueue();
                }
            });
        })(),

        /*
        * @method 获取扩展Id
        * @return {string} extensionId
        * */
        getExtensionId : function () {
            var extensionId = chrome.extension.getURL('').match(/^chrome-extension:\/\/([a-z]+)/)[1];
            if(!extensionId) {
                throw '扩展Id获取失败';
            }
            return extensionId;
        },

        /*
         * @method 创建uuid
         * @* 先查看localStorage是否已存在，不存在则生成一个uuid
         * @return {string} uuid
         * */
        CreateUuid : function () {
            var uuid = localStorage[LOCALSTORAGE_UUID_NAME];

            if(uuid) {
                return uuid;
            }else {
                uuid = 'autoid_' + util.getExtensionId() + '_' + new Date().getTime() + '_' + Math.round(Math.random() * Math.pow(10, 10));
            }

            return uuid;
        }
    };

    // 上报方法
    var Report = {
        // 待执行的上报方法
        queue : [],

        /*
        * @method 添加到待执行方法队列
        * @param {string} method 方法名
        * @param {array} params 参数
        * */
        pushQueue : function (method, params) {
            this.queue.push((function (method, params) {
                return function () {
                    console.log(method);
                    console.log(params);
                    Report[method].apply(Report, params);
                }
            })(method, params));
        },

        // 运行存储在队列的所有方法
        runQueue : function () {
            this.queue.forEach(function (val, index) {
                console.log(val);
                val();
            });
        },

        /*
         * @method 判断事件当天是否已上报
         * @param {string} eventName 事件名称
         * @return {boolean}
         * */
        eventTodayIsReported : function (eventName) {
            var current = new Date();
            var currentYear = current.getFullYear(),
                currentMonth = current.getMonth(),
                currentDay = current.getDate();
            var eventDateString = localStorage.getItem('report_' + eventName);

            // 无记录
            if(!eventDateString) {
                return false;
            }

            // 不是今天的记录
            var eventDate = new Date(eventDateString);
            if(eventDate.getFullYear() != currentYear || eventDate.getMonth() != currentMonth || eventDate.getDate() != currentDay) {
                return false;
            }

            return true;
        },

        /*
        * @method 判断事件是否上报过
        * @param {string} eventName 事件名称
        * @return {boolean}
        * */
        eventIsReported : function (eventName) {
            if(localStorage['report_' + eventName]) {
                return true;
            }

            return false;
        },

        /*
         * @method 更新上报的时间记录
         * @param {string} eventName 事件名称
         * */
        setEventReportDate : function (eventName) {
            localStorage.setItem('report_' + eventName, new Date());
        },

        // ga上报
        ga : function (eventName) {
            if(eventName === 'install') {
                ga('send', 'event', 'new_user', localStorage[LOCALSTORAGE_UUID_NAME]);
            }else {
                ga('send', 'event', eventName, localStorage[LOCALSTORAGE_UUID_NAME]);
            }
        },

        // mdata上报
        mdata : function (eventName) {
            mData.push(['send', eventName, {
                appid: APP_ID,
                uuid : localStorage[LOCALSTORAGE_UUID_NAME]
            }]);
        },

        /*
        * 仅上报一次
        * */
        onlyOne : function (eventName) {
            var self = this;

            // uuid == null
            if(!isUuid) {
                self.pushQueue('onlyOne', arguments);
                return;
            }

            if(!eventName) {
                console.log('无上报事件');
                return;
            }

            // 已上报过
            if(self.eventIsReported(eventName)) {
                return;
            }

            // 上报
            setTimeout(function () {
                self.setEventReportDate(eventName);
                self.mdata(eventName);
                self.ga(eventName);
            }, 30);
        },

        /*
        * 同一类型一天只上报一次
        * */
        oneDayOne : function (eventName) {
            var self = this;

            // uuid == null
            if(!isUuid) {
                self.pushQueue('oneDayOne', arguments);
                return;
            }

            if(!eventName) {
                console.log('无上报事件');
                return;
            }

            // 今日已上报
            if(self.eventTodayIsReported(eventName)) {
                return;
            }

            // 上报
            setTimeout(function () {
                self.setEventReportDate(eventName);
                self.mdata(eventName);
                self.ga(eventName);
            }, 30);
        },

        /*
        * 上报无限制
        * */
        infinite : function (eventName) {
            var self = this;

            // uuid == null
            if(!isUuid) {
                self.pushQueue('infinite', arguments);
                return;
            }

            if(!eventName) {
                console.log('无上报事件');
                return;
            }

            // 上报
            setTimeout(function () {
                self.mdata(eventName);
                self.ga(eventName);
            }, 30);
        }
    };

    /*
     * @method 上报mdata 和 GA
     * @param {String} eventName 事件名称
     * */
    if(typeof exports !== 'undefined') {
        if(typeof module !== 'undefined' && module.exports) {
            exports = module.exports = Report;
        }
        exports.Report = Report;
    } else if (typeof define === 'function' && define.amd) {
        define('Report', function () {
            return Report;
        });
    } else {
        root.Report = Report;
    }

}).call(this);
