/**
 * 创建模板页
 */
var paramVal; // url参数
var dbTmplData; // 双击模板获取输出内容
var dbFlag = 0;
var $keContentDiv;//模板容器
$(function () {
    //处理下拉语言内容
    //初始化处理依赖sx+控件的语言选择
    var selectedLanguage = sessionStorage.getItem("selectedLanguage");
    if (selectedLanguage == null || selectedLanguage === "") {
        selectedLanguage = "cncn";//默认使用中文
    }
    //改变模板中的下拉选项
    $(".lang-select").val(selectedLanguage);

    // dictionarySearch();
    //编辑器初始化；
    editorInit();

    //文本编辑器初始化
    function editorInit() {
        KindEditor.ready(function (K) {
            window.editor = K.create('#editor', {
                cssPath: '../../css/common/editor.css',
                width: '100%',
                height: (common.getContentAreaHeight() - 170) + 'px',
                pasteType: 1, // 1：纯文本粘贴
                items: [
                    'cut',
                    'copy',
                    'paste',
                    'undo',
                    'redo',
                    'justifyleft',
                    'justifyright'
                ],
                afterCreate: function () { // 设置编辑器创建后执行的回调函数
                    $keContentDiv = $('.ke-edit-iframe').contents().find('.ke-content');
                    $keContentDiv.css('font-size', '17.3px');
                    //更改文本输入
                    chgEditorFontStyleByLang(selectedLanguage);
                },
                resizeType: 0
            });
        });
    }

    setTimeout(function () {
        if (paramVal) {
            var edirContentP;//编辑器p标签内容赋值
            var contentPTrimStr;
            // 循环给p标签赋值
            for (var i = 0; i < dbTmplData.file_text.length; i++) {
                edirContentP = dbTmplData.file_text[i];
                contentPTrimStr = edirContentP.trim();
                if (contentPTrimStr.indexof(LANG.ask_colon) == 0 || contentPTrimStr.substr(0, 2) == 'W~') {
                    $keContentDiv.append('<p class="ask-p">' + edirContentP + '</p>');
                } else if (contentPTrimStr.indexof(LANG.answer_colon) == 0 || contentPTrimStr.substr(0, 2) == 'D~') {
                    $keContentDiv.append('<p class="answer-p">' + edirContentP + '</p>');
                } else {
                    $keContentDiv.append('<p>' + edirContentP + '</p>');
                }
            }
        } else {
            $keContentDiv.append('<p class="ask-p">' + LANG.ask_colon + '</p>');
        }
    }, 0);

    // 高度自适应
    $('.manage-tmpl-wrap').css('height', (common.getContentAreaHeight()) + 'px');
    $('.iframe', window.parent.document).css('height', (common.getContentAreaHeight()) + 'px');
    // jumpPageNav();

    // 编辑器中关键词时时查询
    $(document).on('keyup', 'body', function () {
        var tmplText = $('.ke-edit-iframe').contents().find('.ke-content p'),
            editArr = [];

        // 查询前防止有p标签的多层嵌套
        for (var i = 0; i < tmplText.length; i++) {
            if (tmplText.eq(i).find('p').length == 0) {
                editArr.push(tmplText.eq(i));
            }
        }
        // 没有p标签时
        if (tmplText.length !== 0) {
            $keContentDiv.html(editArr);
        }
        serchKeyWords();
    });

    layui.use('form', function () {
        var form = layui.form;
        var laytpl = layui.laytpl;
        var selectData = {};
        var arrData = [];
        var typeCode = $('.wrap-menu').find('.layui-this').attr('data-type');// 笔录类型code

        var url = location.href; //获取url中"?"符后的字串
        if (url.indexOf("?") != -1) { //判断是否有参数
            var str = url.substr(1);
            strs = str.split("=");
            paramVal = strs[1]; //获取参数值
            var dataVal = {
                "id": paramVal
            };
            var jsonDataVal = JSON.stringify(dataVal);
            common.getDataTmplRequest(tmplCallbackObj.viewTmplData(jsonDataVal), function (res) {
                switch (typeof res) {
                    case 'number':  // 请求成功，结果为空，给出空提示
                        common.msgTips(common.tips.nullData, true);
                        break;
                    case 'string': // 请求不成功提示
                        common.msgTips(common.tips.nullData, false);
                        break;
                    case 'object': // 请求成功，结果有值
                        var perTypeCode = res.personnel_type_code,//模板人员类别code
                            recordTypeCode = res.record_type_code;//笔录类型code
                        dbTmplData = res;
                        $('.tmpl-name input').val(res.name);//模板名称赋值
                        // 根据笔录类型渲染下拉框
                        for (var i = 0; i < $('.this-select').length; i++) {
                            if ($('.this-select').eq(i).attr('data-code') == recordTypeCode) {
                                typeCode = $('.this-select').eq(i).attr('data-type');
                                searchCode();
                            }
                        }
                        perDicTmpl('person', perTypeCode);//模板人员类别
                        recordDicTmpl('record', perTypeCode);//笔录类型

                        var menuLayThis = $('.wrap-menu').find('.layui-this').attr('data-code');//获取当前选中的笔录类型的code
                        if (menuLayThis == '1001002' || menuLayThis == '1002003') {
                            $('.layui-col-md4').addClass('hide');
                        }
                        break;
                }
            });
            $('.create-tmpl-title').html('编辑模板');
        } else {
            searchCode();
        }

        function searchCode() {
            var dataCode = {
                "code": typeCode
            };
            var jsonDataCode = JSON.stringify(dataCode);
            common.getDataTmplRequest(tmplCallbackObj.childDataList(jsonDataCode), function (res) {
                switch (typeof res) {
                    case 'number':  // 请求成功，结果为空，给出空提示
                        layui.msg(common.tips.nullData);
                        break;
                    case 'string': // 请求不成功提示
                        layui.msg(res);
                        break;
                    case 'object': // 请求成功，结果有值
                        arrData = [];
                        for (var i = 0; i < res.length; i++) {
                            selectData = {'value': res[i].code, 'text': res[i].value};
                            arrData.push(selectData);
                        }
                        var getRecordTpl = recordTypeTmpl.innerHTML,
                            recordView = document.getElementById('personTypeSel');
                        // 下拉框数据渲染
                        laytpl(getRecordTpl).render(arrData, function (html) {
                            recordView.innerHTML = html;
                            // 获取数据填充select后重新渲染select
                            form.render('select');
                        });
                        break;
                }
            });
        }

        // 点击导航跳转到该页面时左导航选中
        function jumpPageNav() {
            var localCode = localStorage.typeCode;
            var selThis = $('.this-select');
            if (localCode) {
                for (var i = 0; i < selThis.length; i++) {
                    var thisSelCode = localCode;
                    if (selThis.eq(i).attr('data-code') == thisSelCode) {
                        selThis.removeClass('layui-this');
                        selThis.eq(i).addClass('layui-this');
                        typeCode = selThis.eq(i).attr('data-type');
                    }
                }

                if (localCode == '1001002' || localCode == '1002003') {
                    $('.layui-col-md4').addClass('hide');
                }
                if (dbFlag == 0) {
                    searchCode();
                }
                dbFlag = 0;
            }
        }

        // 点击选择笔录类型添加背景色
        $(document).on('click', '.this-select', function () {
            var $this = $(this);
            localStorage.typeCode = '';
            // var thisType = $(this).attr('data-type');
            typeCode = $this.attr('data-type');
            $('.this-select').removeClass('layui-this');
            $this.addClass('layui-this');

            if (typeCode == '1001002' || typeCode == '1002003') {
                $('.layui-col-md4').addClass('hide');
            } else {
                $('.layui-col-md4').removeClass('hide');
                searchCode();
            }
            localStorage.typeCode = $this.attr('data-code');
        }).on('click', '.nav-bottom-tmpl', function () {
            if (!localStorage.typeCode) {
                localStorage.typeCode = '1001001';
            }
        });

        jumpPageNav();

        //给form表单模板类型添加事件
        form.on('select(langSelect)', function (data) {
            chgEditorFontStyleByLang(data.value);
            //如果模板内容是初始化阙阙状态的话，自动插入 LANG.ask_colon;
            var editorText = window.editor.text().trim();
            if (editorText === "" || editorText === LANG_WEIYU.ask_colon
                || editorText === LANG_CN.ask_colon) {
                $keContentDiv.children().remove();
                window.editor.appendHtml('<p class="ask-p">' + LANG.ask_colon + '</p>');
            }
        });
    });
});

//颜色区分事件
function disColorClick() {
    if ($('.label-dis').hasClass('del-color')) {
        $('.ke-edit-iframe').contents().find('.ke-content p').removeClass('add-color');//恢复颜色
        $('.ke-edit-iframe').contents().find('.ke-content p span').removeClass('add-color');
        $('.selected-color').removeClass('unsel-color');
        $('.label-dis').removeClass('del-color');

        //处理换行后去除字体颜色后撤销换行再恢复字体颜色部分颜色未恢复问题
        var thisP = $('.ke-edit-iframe').contents().find('.ke-content p');
        var pLength = thisP.length;
        for (var i = 0; i < pLength; i++) {
            //处理合并行后再次分开行时字体颜色修改
            if (thisP.eq(i).find('span').html()) {
                thisP.eq(i).find('span').css('color', thisP.eq(i).css('color'));
                thisP.eq(i).find('font').css('color', thisP.eq(i).css('color'));
            }
        }
    } else {
        $('.ke-edit-iframe').contents().find('.ke-content p').addClass('add-color');//去除颜色
        $('.ke-edit-iframe').contents().find('.ke-content p span').addClass('add-color');
        $('.selected-color').addClass('unsel-color');
        $('.label-dis').addClass('del-color');
    }
}

//下划线事件
function lineClick() {
    if ($('.label-line').hasClass('del-back')) {
        $('.ke-edit-iframe').contents().find('.ke-content').css('background', 'url("../../images/common/editor_bg.png")');//添加下划线
        $('.undeline-remove').addClass('undeline-move');
        $('.label-line').removeClass('del-back');
    } else {
        $('.ke-edit-iframe').contents().find('.ke-content').css('background', 'none');//去除下划线
        $('.undeline-remove').removeClass('undeline-move');
        $('.label-line').addClass('del-back');
    }
}

// 关键词查询的上一个结果
var keyWordTotal;
var keyWordNext;

function prevClick() {
    var keyWords = $('.ke-edit-iframe').contents().find('.ke-content p').find('font'),
        keyWordLength = keyWords.length,
        $bubbleWrap,
        $keEditIframe,
        backTop;
    // 上一个和下一个互相点击时赋值判断
    if (keyWordTotal >= 0) {
        keyWordNext = keyWordTotal + 1;
    } else if (keyWordTotal < 0) {
        keyWordTotal = keyWordLength - 1;
        keyWordNext = 0;
    }
    keyWords.css('background-color', '#FFEE80');
    keyWords.eq(keyWordTotal).css('background-color', '#CEC065');

    //当搜索到的关键词不在展示框内时滚动条滚动
    $bubbleWrap = $('.ke-edit-iframe').contents().find('.ke-content');
    backTop = keyWords.eq(keyWordTotal).offset().top;
    $keEditIframe = $('.ke-edit-iframe');
    // 当前带有背景颜色距顶部的高度 - 容器距顶部的高度 + 容器此时滚动条滚动的高度 - 容器一半的高度
    $bubbleWrap.scrollTop(backTop - $keEditIframe.offset().top + $keEditIframe.scrollTop() - $keEditIframe.height() / 2);

    keyWordTotal = keyWordTotal - 1;
}

// 关键词查询的下一个结果
function nextClick() {
    var keyWords = $('.ke-edit-iframe').contents().find('.ke-content p').find('font');
    var keyWordLength = keyWords.length;
    var $bubbleWrap;
    var $keEditIframe;
    var backTop;
    // 上一个和下一个互相点击时赋值判断
    if (keyWordNext <= keyWordLength - 1) {
        keyWordTotal = keyWordNext - 1;
    } else if (keyWordNext > keyWordLength - 1) {
        keyWordNext = 0;
        keyWordTotal = keyWordLength - 1;
    }
    keyWords.css('background-color', '#FFEE80');
    keyWords.eq(keyWordNext).css('background-color', '#CEC065');

    //当搜索到的关键词不在展示框内时滚动条滚动
    $bubbleWrap = $('.ke-edit-iframe').contents().find('.ke-content');
    backTop = keyWords.eq(keyWordNext).offset().top;
    $keEditIframe = $('.ke-edit-iframe');
    // 当前带有背景颜色距顶部的高度 - 容器距顶部的高度 + 容器此时滚动条滚动的高度 - 容器一半的高度
    $bubbleWrap.scrollTop(backTop - $keEditIframe.offset().top + $keEditIframe.scrollTop() - ($keEditIframe.height() / 2));

    keyWordNext = keyWordNext + 1;
}

// 关键词查找
function serchKeyWords() {
    var keyWords = $('.ke-edit-iframe').contents().find('.ke-content p');
    var keyWordLength = keyWords.length;
    var keyTotal = 0;//关键词总数

    var keyWordVal = $('.search-input').val()// 关键词
    var reg = new RegExp(keyWordVal, 'g');// 正则

    // 编辑器中不存在p标签时关键词查询时先添加p标签
    if (keyWordLength == 0) {
        var appendP = $('.ke-edit-iframe').contents().find('.ke-content');
        var appendPVal = $('.ke-edit-iframe').contents().find('.ke-content').html();
        $('.ke-edit-iframe').contents().find('.ke-content').html('');
        appendP.append('<p>' + appendPVal + '</p>');
        keyWords = $('.ke-edit-iframe').contents().find('.ke-content p');
        keyWordLength = keyWords.length;
    }
    // 查找前去除所有font标签
    for (var j = 0; j < keyWords.length; j++) {
        keyWords.eq(j).html(keyWords.eq(j).text());
    }
    // 判断关键词是否为空
    if (keyWordVal == '') {
        $('.search-prev, .search-next').addClass('hide');
        $('.total-num').html('0');
        $('.search-total-num').addClass('hide');
        return;
    } else {
        $('.search-total-num').removeClass('hide');
    }
    // 关键词匹配
    for (var i = 0; i < keyWordLength; i++) {
        // 是否包含关键词
        var keyIndexOf = keyWords.eq(i).html().indexOf(keyWordVal);
        if (keyIndexOf != -1) {
            keyWords[i].innerHTML = keyWords[i].innerHTML.replace(reg, "<font style='background-color:#FFEE80;padding: 0 1px;'>" + keyWordVal + "</font>");
        }
    }
    // 关键词总数
    keyTotal = $('.ke-edit-iframe').contents().find('.ke-content p font').length;

    // 根据关键词个数判断上下按钮是否显示
    if (keyTotal > 0) {
        $('.search-prev, .search-next').removeClass('hide');
    } else {
        $('.search-prev, .search-next').addClass('hide');
    }
    var num = '999+';
    if (keyTotal < 999) {
        num = keyTotal;
    }
    $('.total-num').html(num);// 关键词总数赋值
    //keyWordTotal,keyWordNext用于点击上下选中用
    keyWordTotal = keyTotal - 1;
    keyWordNext = 0;
}

//保存
function saveTmplBtn() {
    $(".create-btn").addClass('layui-btn-disabled');
    $(".create-btn").removeAttr('onclick');

    if ($('.tmpl-name input').val() == '') {
        layer.tips(common.tips.tmplName, '.tmpl-name input', {
            tips: [3, '#3595CC']
        });
        $(".create-btn").removeClass('layui-btn-disabled');
        $(".create-btn").attr('onclick', 'saveTmplBtn()');
        return;
    }
    var tmplName = $('.tmpl-name input').val();// 模板名称
    var recordTypeCode = $('.wrap-menu').find('.layui-this').attr('data-code'); // 模板笔录类型编码
    var personnelTypeCode = $('.person-type dl').find('.layui-this').attr('lay-value'); // 模板人员类别编码
    var tmplText = $('.ke-edit-iframe').contents().find('.ke-content p');// 编辑器
    var userId = USER().police_number;// 警员编号
    var perDefaultTmpl = '0';//设置默认模板
    var createTime = common.formTimeToDate(Date.parse(new Date()) / 1000); // 创建时间
    var updateTime = common.formTimeToDate(Date.parse(new Date()) / 1000); // 更新时间
    var createFlag;
    var arrText = [];

    if ($('.layui-col-md4').hasClass('hide')) {
        personnelTypeCode = '';
    }

    // 编辑器中无p标签
    if (tmplText.html() == null) {
        // var keEditCont = $('.ke-edit-iframe').contents().find('.ke-content'),
        //     keEditContVal = keEditCont.text();
        // $('.ke-edit-iframe').contents().find('.ke-content').html('');
        // keEditCont.append('<p>' + keEditContVal + '</p>');
        // tmplText = $('.ke-edit-iframe').contents().find('.ke-content p');
        var tmplTextP = $('.ke-edit-iframe').contents().find('.ke-content').html();
        arrText = tmplTextP.split('<br>');
    } else {// 编辑器中有p标签
        // 编辑器内容移除标签以数组方式存储
        if (tmplText.length == 1) {// 直接粘贴含有换行的文本
            arrText = tmplText.html().split('<br>');
        } else {// 按正常过程一步一步写入问答文本
            for (var i = 0; i < tmplText.length; i++) {
                var editHtml = tmplText.eq(i).text();
                // 直接粘贴内容可能会出现p标签中包含了p标签此时跳过改p标签
                if (tmplText.eq(i).find('p').length == 0) {
                    arrText.push(editHtml);
                }
            }
        }
    }
    var createData = {};
    var jsonCreateData;
    if (!paramVal) {
        createData = {
            "id": "", // 模板id
            "name": tmplName, // 模板名称
            "record_type_code": recordTypeCode,  // 模板笔录类型编码（参考字典项）
            "personnel_type_code": personnelTypeCode,  // 模板人员类别编码（参考字典项）
            "owner_police_number": userId,  // 模板所有人警号
            "create_time": createTime, // 模板创建时间
            "update_time": updateTime, // 模板更新时间
            "enable_system_default": "0",
            "enable_personal_default": perDefaultTmpl,
            "template_text": arrText  // 模板文本内容
            // "tags": ""
        };
        jsonCreateData = JSON.stringify(createData);
        common.getDataTmplRequest(tmplCallbackObj.createTmplData(jsonCreateData), function (res) {
            switch (typeof res) {
                case 'number':  // 请求成功，结果为空，给出空提示
                    createFlag = '1';
                    // common.msgTips(common.tips.createSuccess, true);
                    break;
                case 'string': // 请求不成功提示
                    createFlag = '0';
                    common.msgTips(common.tips.saveFail, false);
                    break;
            }
        });
    } else {
        createData = {
            "id": dbTmplData.id,// 模板id
            "name": tmplName,
            "record_type_code": recordTypeCode,
            "personnel_type_code": personnelTypeCode, // 模板人员类别编码
            "owner_police_number": userId,
            "create_time": dbTmplData.create_time, // 模板创建时间
            "update_time": updateTime, // 模板更新时间
            "enable_system_default": dbTmplData.enable_system_default,
            "enable_personal_default": dbTmplData.enable_personal_default,
            "template_text": arrText
            // "tags": ""
        };
        jsonCreateData = JSON.stringify(createData);
        common.getDataTmplRequest(tmplCallbackObj.updateTmplData(jsonCreateData), function (res) {
            switch (typeof res) {
                case 'number':  // 请求成功，结果为空，给出空提示
                    createFlag = '1';
                    // common.msgTips(common.tips.createSuccess, true);
                    break;
                case 'string': // 请求不成功提示
                    createFlag = '0';
                    common.msgTips(common.tips.saveFail, false);
                    break;
            }
        });
    }
    if (createFlag == '1') { //成功
        localStorage.typeCode = '';
        window.location.href = 'look-tmpl.html';
        localStorage.typeCode = $('.layui-this').attr('data-code');
        setTimeout(function () {
            $(".create-btn").removeClass('layui-btn-disabled');
            $(".create-btn").attr('onclick', 'saveTmplBtn()');
        }, 3000);
    } else { //失败
        $(".create-btn").removeClass('layui-btn-disabled');
        $(".create-btn").attr('onclick', 'saveTmplBtn()');
    }
}

// 模板人员类别
function perDicTmpl(codeFlag, perTypeCode) {
    var perCodeData = {
        "code": perTypeCode
    };
    var jsonCodeData = JSON.stringify(perCodeData);
    dbTmplDicData(codeFlag, jsonCodeData);
}

// 模板笔录类型
function recordDicTmpl(codeFlag, recordTypeCode) {
    // 匹配code编码相同的
    for (var i = 0; i < $('.this-select').length; i++) {
        var thisSelCode = dbTmplData.record_type_code;
        if ($('.this-select').eq(i).attr('data-code') == thisSelCode) {
            $('.this-select').removeClass('layui-this');
            $('.this-select').eq(i).addClass('layui-this');
            return;
        }
    }
}

// 个人模板页双击之后返回我的模板页
function dbTmplDicData(codeFlag, jsonCodeData) {
    dbFlag = 1;
    common.getDataTmplRequest(tmplCallbackObj.fatherDataList(jsonCodeData), function (res) {
        switch (typeof res) {
            case 'number':  // 请求成功，结果为空，给出空提示
                common.msgTips(common.tips.nullData, true);
                break;
            case 'string': // 请求不成功提示
                common.msgTips(common.tips.loadDataFail, false);
                break;
            case 'object': // 请求成功，结果有值
                if (codeFlag == 'person') {
                    $('.layui-select-title input').val(res.value);//人员类别赋值
                    $('.layui-anim-upbit dd').removeClass('layui-this');
                    // 下拉框样式添加
                    for (var i = 0; i < $('.layui-anim-upbit dd').length; i++) {
                        if ($('.layui-anim-upbit dd').eq(i).html() == res.value) {
                            $('.layui-anim-upbit dd').eq(i).addClass('layui-this');
                        }
                    }
                }
                break;
        }
    });
}

