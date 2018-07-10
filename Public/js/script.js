
// 渲染页面renderPage
(function () {
    


    var socket = io.connect();
    var room_page = $("#room_page");
    var mask = $("#mask");
    var currentRoom = $("#room");
    var delBtn = $(".icon_room_del");
    var roomSet = $("#room_set");
    var addDeviceBtn = $("#add_deviceBtn");
    var rooms = [];
    var user_id = $("#user_name").html();

    socket.emit("newconnect", user_id);
    $("#room_id").html($($(".room input")[0]).attr("id"));

    // $("#device_box").prepend('<div class=\"warning_box\"></div>');

    $("#room_name").html($(".room input")[0].value);


    initMenu();
    initAddDevicePage();
    authorized();
    hover("#room_box li");

    
    socket.on("renderPage",function(data) {
        var roomId = $("#room_id").html();
        // console.log(roomId)
        $("#device_box").prepend('<div class=\"warning_box\"></div>');
        $.each(data.devices,function(index) {
            if(data.devices[index].device_room === roomId) {
                data[index] = {control_id: data.control_id, devices: data.devices[index]};
                // console.log(data[index])
                addDevice(data[index]);
            }else{
                console.log("不是这个房间的");
            }
            
        });
        // 因为在监听里面，相当于每个页面绑定一个监听，前一个监听影响后一个监听，所以要先移除监听再添加
        $("#device_box").off("tap");
        $("#device_box").on("tap", function(e) {
            btnClick(data[0].control_id,e);
        });
        console.log($("#device_box").children().length);
        if($("#device_box").children().length !== 0) {
            $(".device_box .no_device").hide();
        }else {
            $(".device_box .no_device").show();
        }
    });

    socket.on("renderMenu",function(data) {
        $("#room_name").html(data[0].name);
        var item;
        for(var i = 1, len = data.length; i < len; i++) {
            item = '<li class=\"room\"><i id=\"room\" class=\"icon_room hide\"></i><i class=\"icon_room_del hide\"></i><input id = \"' + data[i].id + '\" class=\"room_name\" type=\"text\" value=\"' + data[i].name + '\" readonly=\"readonly\"></li>';
            $("#room_add").before(item);
        }
        // 更新所有del按钮
        delBtn = $(".icon_room_del");
        // 将第一个房间显示当前房间
        $($("icon_room")[0]).show();
    });

    socket.on("addDevice", function(data) {
        // 将可添加设备界面显示出来
        $("#device_add_page").removeClass("hide").addClass("show");
        if (mask.hasClass('show')) {
            mask.removeClass("show").addClass("hide");
            room_page.removeClass("show").addClass("hide");
        }
        var p = '<p class = \"newdevice\"> 新设备：' + data + '</p>';
        $("#device_add_page").append(p);
        $("#device_add_page .no_device").hide();
    });
    
    // 添加设备
    socket.on('setnewdevice',function(data) {
        // console.log(data)
        addDevice(data);

        if($("#device_box").children().length !== 0) {
            $(".device_box .no_device").hide();
        }
    });

    // 监听设备变更，设备变更滑动条数值也变
    socket.on('setdevicestatus',function (data) {
        // console.log(data)
        var type = data.devices.device_type;
        if ( type === "curtain" || type === "lamp") {
            var index = data.devices.device_id.substr(data.devices.device_id.length-1);
            var device = data.devices.device_id.substring(0,data.devices.device_id.length-1) + "Bar" + index;
            // console.log(device)
            initBar(data);
            initPowerBtn(data);
        }else if( type === "temperature" || type === "humidity" || type === "brightness") {
            setType2Val(data);
        }else if( type === "door" || type === "flame" || type === "toxicGas") {
            setType3Val(data);
        }
        
    });


    function add0(m){  
        return m < 10 ? '0'+m : m;  
    }  
      
    function timestamp(){  
        var time = new Date();  
        var y = time.getFullYear();  
        var m = time.getMonth()+1;  
        var d = time.getDate();  
        var h = time.getHours();  
        var mm = time.getMinutes();  
        var s = time.getSeconds();  
      
        return y+add0(m)+add0(d)+add0(h)+add0(mm)+add0(s);  
    } 


    function ToggleClass (a) {
        a.toggleClass("show").toggleClass("hide");
    }
    function toggleMenu() {
        room_page.toggleClass("show").toggleClass("hide");
        mask.toggleClass("show").toggleClass("hide");
    }

    function initMenu() {
        // 房间菜单栏展开
        $("#room_menuBtn").tap(function(){
            mask.css("height", document.documentElement.clientHeight);
            // ToggleClass(room_page);
            // ToggleClass(mask);
            toggleMenu();

        });
        // 房间菜单栏收回
        $("html").tap(function(event){
            var clientWidth = (document.body.clientWidth) * 70 / 100 + 1;
            var clickWidth = event.srcElement.offsetWidth;

            if(clickWidth > clientWidth || clickWidth == 32 ) {
                // room_page.removeClass("show").addClass("hide");
                // mask.removeClass("show").addClass("hide");
                toggleMenu();
            }
        });
        // 手指向左滑收回菜单栏
        room_page.swipeLeft(function(){
            // ToggleClass(room_page);
            // ToggleClass(mask);
            toggleMenu();
        });
        // 房间管理，有个bug就是没有将当前房间的图标隐藏
        roomSet.tap(function(){
            var p = $(this).find("p");
            if (p.html() == "房间管理") {
                roomSetStyle('block', '', '设置完成', p);
            }else {
                roomSetStyle('none', 'readonly', '房间管理', p);

                $("#room_box").find(".room_name").each(function(index) {
                    rooms[index] = {id:$(this).attr("id"),name:$(this).val()};
                });
                // console.log(rooms)
                socket.emit("setrooms",{user_id: $("#user_name").html(),rooms:rooms});
            }
        });

        // 事件代理：点击del按钮，则删除房间div同时删除所有其绑定的事件及HTML
        $("#room_box").tap(function(e) {

            // console.log(e)
            var cls = e.target.className;
            switch (cls) {
                case 'room_name':
                    if (e.target.previousElementSibling.className != 'icon_room_del show') { // 切换当前页面
                        toggleMenu();
                        $("#room_name").html(e.target.value);
                        $("#room_id").html(e.target.id);
                        $(".icon_room").hide();
                        // console.log(e.target.parentNode.firstChild)
                        if(e.target.parentNode.firstChild.nodeType === 1) {
                            e.target.parentNode.firstChild.style.display = "block";
                        }else {
                            e.target.parentNode.firstChild.nextSibling.style.display = "block";
                        }
                        
                        $("#device_box").children().remove();
                        // console.log(e.target.id)
                        socket.emit("getroompage",{user_id:"Chayin", device_room: e.target.id});
                        $(".device_box .no_device").show();

                        // 从数据库/session获取该房间的设备内容，socket.on监听
                    }
                    break;
                case 'icon_room_del show':
                    var newRooms = $.grep(rooms,function(item) {    
                        return item != e.target.nextElementSibling.value;
                    });
                    rooms = newRooms;   
                    // console.log(rooms)           
                    e.target.parentNode.remove();
                    break;
            }
        });

        // 点击添加房间，在房间队伍后添加一个“新建房间”（并且前面有del图标）
        // 并处于高亮聚焦状态，一旦失焦，房间名称变为占位符或用户所修改的名称
        $("#add").tap(function () {
            // 插入新建房间
            var item = '<li class=\"room\"><i id=\"room\" class=\"icon_room hide\"></i><i class=\"icon_room_del show\"></i><input id = \"' + timestamp() + '\" class=\"room_name\" type=\"text\" placeholder=\"新建房间\"></li>';
            $("#room_add").before(item);

            // 更新删除按钮
            delBtn = $(".icon_room_del");
            var lastInput = $("#room_add").prev().find("input");
            
            lastInput.focus();
            lastInput.blur(function () {
                val = lastInput.val();
                if(val == '') {
                    lastInput.val('新建房间');
                }
            });
        });

        // wifi设置页
        $("#room_wifi").tap(function(){
            ToggleClass($("#room_wifi_set"));
        });
        $("#comfir").tap(function() {
            ToggleClass($("#room_wifi_set"));
            ToggleClass(room_page);
            ToggleClass(mask);
            ToggleClass($("#device_add_page"));
        });
        $("#again").tap(function() {
            $("#room_wifi_set input").val("");
        });
    }


    function roomSetStyle(css, prop, val, p) {
        currentRoom.toggleClass("show").toggleClass("hide");  // 房间名称前的标志变为删除标志
        delBtn.toggleClass("show").toggleClass("hide");
        $("#room_add").css('display', css);  // 同时添加房间的div出现
        $(".room_name").prop('readonly',prop); // 点击房间名称，去掉只读，修改房间名称
        p.html(val); // 文字：房间管理/设置完成
    }

    function initAddDevicePage() {
        addDeviceBtn.tap(function(){
            ToggleClass($("#device_add_page"));
            if (mask.hasClass('show')) {
                mask.removeClass("show").addClass("hide");
                room_page.removeClass("show").addClass("hide");
            }
        });
        $("#close").tap(function() {
            $("#device_add_page").removeClass("show").addClass("hide");
        }); 
        $("#device_add_page").tap(function(e){
            if(e.target.className === "newdevice") {
                var sendStr = e.target.innerHTML.substring(5);
                var curroom = $("#room_id").html();
                // console.log(sendStr)
                socket.emit("getnewdevice", {device_id : sendStr, device_room : curroom });
                $(e.target).remove();
                if($("#device_add_page p").length === 1) {
                    $("#device_add_page .no_device").show();
                    $("#device_add_page").removeClass("show").addClass("hide");
                }
            }
        });
    }

    // 登录授权
    function authorized() {
        $("#authorize").css("left", (document.documentElement.clientWidth - 326 )/2 + 'px');
        $("#authorize").css("top", (document.documentElement.clientHeight - 297)/2 + 'px');
        $("#mask").css("height", document.documentElement.clientHeight + 'px');
        $("#mask").css("width", document.documentElement.clientWidth + 'px');
        
        $("#authorize").on("touchend", function(e){
            $(this).off();
            ToggleClass($(this));
            ToggleClass(mask);
            mask.css("width", '70%');
            ToggleClass($(".header"));
            ToggleClass($(".body"));
        });
    }


    function hover(ele){
        $(ele).on("touchstart", function(){
            $(this).css("background-color", "#313131");
        });
        $(ele).on("touchend", function(){
            $(this).css("background-color", "");
        });
    }

    // 提交按钮
    // $("#submit").tap(function(){
    //     // socket.emit('getdevicestatus',$("#write_device_status").val())
    //     socket.emit('get',$("#write_device_status").val());
    // });
    // socket.on('set',function(data){
    //     // console.log(data)
    //     $("#write_device_status").val(data);
    // });
    

})();

    
    



    



    