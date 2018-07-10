// 还有页面设备排序、删除设备、设备损坏警告没写。
/**
 * 设备页面
 */
var ProcessBar = Bar;

function addDevice(data) {
	var deviceBox = $("#device_box"),
	    type = data.devices.device_type,
	    id = data.devices.device_id,
	    lookup = {
			"lamp" : type1,
			"curtain" : type1,
			"temperature" : type2,
			"brightness" : type2,
			"humidity" : type2,
			"door" : type3,
			"toxicGas" : type3,
			"flame" : type3
		},
	    def = err;

	return lookup[type] ? lookup[type]() : def();

	function type1() {
		var item = '<li class=\"box\"><ul id=\"' + id + '\"><li class=\"menu\"><div><i id=\"' + id +'_powerBtn\" class=\"icon powerBtn off\"></i><p>'+ id +'</p><span class=\"device_val\">'+ data.devices.device_status.alpha +'&#37;</span><i id=\"' + id +'_downBtn\" class=\"icon down downBtn\"></i></div></li><li class=\"submenu\"><div class=\"slider_box\"><i class=\"icon dark\"></i><div id=\"' + id +'Bar\" class=\"slider_box_bar\"><div class=\"slider_box_slider\"><p class=\"device_val\"></p><i class=\"slider_box_slider_touch\"></i></div><div class=\"slider_box_line\"><span class=\"slider_box_line_fill\"></span></div></div><i class=\"icon light\"></i></div></li></ul></li>';
		deviceBox.append(item);
		initBar(data);
		initPowerBtn(data);
	}
	function type2() {
		var item = '<li class=\"menu\"><div id=\"'+ id +'\" class=\"'+ type +'\"><i class=\"icon icon_'+ type +'\"></i><p>'+ id +'</p><span class=\"device_val\">'+ data.devices.device_status.alpha +'</span></div></li>';
		deviceBox.append(item);
		setType2Val(data);
	}
	function type3() {
		var item = '<li class=\"menu\"><div id=\"'+ id +'\" class=\"'+ type +'\"><i class=\"icon icon_'+ type +'\"></i><p>'+ id +'</p><span class=\"device_val\"></span></div></li>';
		deviceBox.append(item);
		setType3Val(data);
	}
	function err() {
		alert("设备添加失败，无效设备");
	}
}

// 设置修改设置的温度、湿度和亮度
function setType2Val(data) {
	var obj = $("#" + data.devices.device_id + " .device_val");
	// console.log($("#" + data.devices.device_id + " .device_val"));
	if(data.devices.device_type === "temperature") {
		obj.html(data.devices.device_status.alpha + "&deg;C");
	}else {
		obj.html(data.devices.device_status.alpha + "&#37;");
	}
}

// 初始化门未关、火焰预警和有毒气体预警
function setType3Val(data){
	// console.log(data);
	var id = data.devices.device_id,
	    type = data.devices.device_type,
	    obj = $("#" + id + " span"),
	    status = parseInt(data.devices.device_status.status);

	console.log(status === 0);
	if(status === 0) {
		return type === "door" ? removeWarn("门关了") : removeWarn("正常");
	}else if(status === 1){
		return type === "door" ? addWarn("门未关") : addWarn("异常警告");
	}

	function removeWarn(str) {
		obj.html(str);
		obj.css("color","#000");
		$("." + id).remove();
	}
	function addWarn(str) {
		var item = '<p class= \"error_warning ' + id + '\"><i class=\"icon icon_error\"></i>' + $("#room_name").html() + '的' + id + str + '</p>';
		$("#device_box .warning_box").prepend(item);
		obj.html(str);
		obj.css("color","red");
	}	
}

// 初始化所有进度条
function initBar(data) {
		var barId = data.devices.device_id + "Bar",
		    status;

		barId = new ProcessBar({
			$id: barId,
			min: 0,
			stepCount: 100,
			step: 1,
			touchEnd: function (val) {
			    // console.log("亮度值为："+ val);
			    // console.log($("#" + data.devices.device_id + '_powerBtn').hasClass("on"));
			    data.devices.device_status.alpha = val;
			    status = $("#" + data.devices.device_id + '_powerBtn').hasClass("on") ? "1" : "0";
			    data.devices.device_status.status = status;
			    socket.emit("setstatus",data);
			}
		});
		// console.log(data.devices.device_status.alpha)
		barId.setVal(data.devices.device_status.alpha);		
	
}

// 初始化开关
function initPowerBtn(data){
 	var obj = $("#" + data.devices.device_id + '_powerBtn'),
 	    status = parseInt(data.devices.device_status.status);

 	if(status === 0) {
 		console.log("0");
 		obj.addClass("off").removeClass("on");
 	}else if(status === 1) {
 		console.log("1");
 		obj.removeClass("off").addClass("on");
 	} 
}

// 下拉按钮/开关按钮点击
function btnClick(contid, e) {
	e = e || window.event;
	var id = $(e.path[3]).attr("id"),
	    targetObj = $(e.target);
	if(targetObj.hasClass("powerBtn")) {
		togglePowerBtn(contid, id, targetObj);
	} 
	else if(targetObj.hasClass("downBtn")){
		toggleDownBtn(targetObj);
	}
}	
function togglePowerBtn(contid, id, obj) {
	var data = {
			control_id : contid,
			devices : {
				device_id : id,
				device_status : {
					status : "",
					alpha : ""
				}
			}
		},
	    alpha = obj.siblings("span").html().slice(0, -1);
	console.log(data);

	obj.toggleClass("on").toggleClass("off");
	data.devices.device_status.alpha = alpha;
	data.devices.device_status.status = obj.hasClass("on") ? "1" : "0";
	socket.emit("setstatus",data);
}
function toggleDownBtn(obj) {
	var objList = obj.parent().parent().next(),
	    downBtns = $.grep($(".downBtn"), function(item) {
			return item !== obj[0];
		});
	// console.log(downBtns)
	$(downBtns).removeClass("up").addClass("down");
	obj.toggleClass("down").toggleClass("up");
	$(".downBtn").parent().parent().next().hide();
	if (obj.hasClass("up")) {
		objList.toggle();
	}
}


