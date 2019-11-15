var LiteEvent = /** @class */ (function () {
    function LiteEvent() {
        this.handlers = [];
    }
    LiteEvent.prototype.subscribe = function (handler) {
        this.handlers.push(handler);
    };
    LiteEvent.prototype.unsubscribe = function (handler) {
        this.handlers = this.handlers.filter(function (h) { return h !== handler; });
    };
    LiteEvent.prototype.invoke = function (arg) {
        this.handlers.forEach(function (x) { return x(arg); });
    };
    return LiteEvent;
}());
var ChassisLightStop = /** @class */ (function () {
    function ChassisLightStop() {
    }
    return ChassisLightStop;
}());
var ChassisLightConfig = /** @class */ (function () {
    function ChassisLightConfig() {
    }
    return ChassisLightConfig;
}());
var State;
(function (State) {
    State[State["Disconnected"] = 0] = "Disconnected";
    State[State["CalibrationInProgress"] = 1] = "CalibrationInProgress";
    State[State["OK"] = 2] = "OK";
})(State || (State = {}));
var BatteryLevel;
(function (BatteryLevel) {
    BatteryLevel[BatteryLevel["Full"] = 0] = "Full";
    BatteryLevel[BatteryLevel["Half"] = 1] = "Half";
    BatteryLevel[BatteryLevel["Low"] = 2] = "Low";
})(BatteryLevel || (BatteryLevel = {}));
var SensitivityLevel;
(function (SensitivityLevel) {
    SensitivityLevel[SensitivityLevel["Low"] = 0] = "Low";
    SensitivityLevel[SensitivityLevel["Medium"] = 1] = "Medium";
    SensitivityLevel[SensitivityLevel["High"] = 2] = "High";
})(SensitivityLevel || (SensitivityLevel = {}));
var BatteryInfo = /** @class */ (function () {
    function BatteryInfo() {
    }
    return BatteryInfo;
}());
var DrivingData = /** @class */ (function () {
    function DrivingData(motorA, motorB) {
        if (motorA === void 0) { motorA = 0; }
        if (motorB === void 0) { motorB = 0; }
        this.motorA = 0;
        this.motorB = 0;
        this.motorA = motorA;
        this.motorB = motorB;
    }
    DrivingData.prototype.toBounds = function () {
        this.motorA = this.toBoundsInternal(this.motorA, -1, 1);
        this.motorB = this.toBoundsInternal(this.motorB, -1, 1);
    };
    DrivingData.prototype.toBoundsInternal = function (value, min, max) {
        if (value > max)
            return max;
        else if (value < min)
            return min;
        else
            return value;
    };
    return DrivingData;
}());
var KeyboardDriving = /** @class */ (function () {
    function KeyboardDriving() {
        var _this = this;
        this.leftArrow = false;
        this.rightArrow = false;
        this.upArrow = false;
        this.downArrow = false;
        this.xBtn = false;
        this.yBtn = false;
        document.addEventListener("keydown", function (e) { return _this.processKeyEvent(e, true); });
        document.addEventListener("keyup", function (e) { return _this.processKeyEvent(e, false); });
    }
    KeyboardDriving.prototype.processKeyEvent = function (evnt, newState) {
        if (evnt.keyCode == 37)
            this.leftArrow = newState;
        else if (evnt.keyCode == 38)
            this.upArrow = newState;
        else if (evnt.keyCode == 39)
            this.rightArrow = newState;
        else if (evnt.keyCode == 40)
            this.downArrow = newState;
        else if (evnt.keyCode == 88)
            this.xBtn = newState;
        else if (evnt.keyCode == 89)
            this.yBtn = newState;
    };
    KeyboardDriving.prototype.getData = function () {
        var p1 = 0.2;
        var p2 = 0.5;
        var retVal = new DrivingData();
        if (this.leftArrow && this.rightArrow) {
            retVal.motorA = p2, retVal.motorB = -p2;
        }
        else if (this.upArrow && this.downArrow) {
            retVal.motorA = -p2, retVal.motorB = p2;
        }
        else if (this.upArrow && this.rightArrow) {
            retVal.motorA = p1, retVal.motorB = p2;
        }
        else if (this.upArrow && this.leftArrow) {
            retVal.motorA = p2, retVal.motorB = p1;
        }
        else if (this.downArrow && this.rightArrow) {
            retVal.motorA = -p1, retVal.motorB = -p2;
        }
        else if (this.downArrow && this.leftArrow) {
            retVal.motorA = -p2, retVal.motorB = -p1;
        }
        else if (this.upArrow) {
            retVal.motorA = p2, retVal.motorB = p2;
        }
        else if (this.downArrow) {
            retVal.motorA = -p2, retVal.motorB = -p2;
        }
        else {
            return undefined;
        }
        if (this.xBtn) {
            retVal.motorA *= 2;
            retVal.motorB *= 2;
        }
        else if (this.yBtn) {
            retVal.motorA /= 3;
            retVal.motorB /= 3;
        }
        return retVal;
    };
    return KeyboardDriving;
}());
var ScreenDriving = /** @class */ (function () {
    function ScreenDriving(arrowsArea) {
        var _this = this;
        this.driving = false;
        this.arrowsArea = arrowsArea;
        arrowsArea.addEventListener("mouseenter", function () { _this.stopDriving(); });
        arrowsArea.addEventListener("mouseleave", function () { _this.stopDriving(); });
        arrowsArea.addEventListener("mousedown", function (e) { _this.startDriving(e.pageX, e.pageY); });
        arrowsArea.addEventListener("mousemove", function (e) { _this.refresh(e.pageX, e.pageY); });
        arrowsArea.addEventListener("mouseup", function (e) { _this.stopDriving(); });
        arrowsArea.addEventListener("touchstop", function () { _this.stopDriving(); });
        arrowsArea.addEventListener("touchstart", function (e) { _this.startDriving(e.touches[0].pageX, e.touches[0].pageY); });
        arrowsArea.addEventListener("touchmove", function (e) { _this.refresh(e.touches[0].pageX, e.touches[0].pageY); });
        arrowsArea.addEventListener("touchend", function (e) { _this.stopDriving(); });
        arrowsArea.addEventListener("touchcancel", function (e) { _this.stopDriving(); });
    }
    ScreenDriving.prototype.stopDriving = function () {
        this.driving = false;
    };
    ScreenDriving.prototype.startDriving = function (pageX, pageY) {
        this.driving = true;
        this.refresh(pageX, pageY);
    };
    ScreenDriving.prototype.refresh = function (pageX, pageY) {
        var x = pageX - this.arrowsArea.offsetLeft;
        var y = pageY - this.arrowsArea.offsetTop;
        x = x / this.arrowsArea.width * 2;
        y = y / this.arrowsArea.height * 2;
        if (x < 0) {
            x = 0;
        }
        if (x > 2) {
            x = 2;
        }
        if (y < 0) {
            y = 0;
        }
        if (y > 2) {
            y = 2;
        }
        x -= 1;
        y -= 1;
        var d = Math.sqrt(x * x + y * y);
        if (d > 1) {
            d = 1;
        }
        if (y < 0) {
            d = -d;
        }
        d = -d;
        var drivingData = new DrivingData();
        drivingData.motorA = x < 0 ? d : d * (1 - x);
        drivingData.motorB = x > 0 ? d : d * (1 + x);
        if (drivingData.motorA > 1 || drivingData.motorA < -1) {
            debugger;
        }
        this.drivingData = drivingData;
    };
    ScreenDriving.prototype.getData = function () {
        if (this.driving && this.drivingData) {
            return this.drivingData;
        }
        else {
            return undefined;
        }
    };
    return ScreenDriving;
}());
var AccelerometerDriving = /** @class */ (function () {
    function AccelerometerDriving(forwardAngleLabel, directionAngleLabel, forwardAngleDiffLabel, directionAngleDiffLabel) {
        var _this = this;
        this.isEnabled = false;
        this.baseAngleForward = 0;
        this.baseAngleDirection = Math.PI / 2;
        this.acutalAngleForward = 0;
        this.actualAngleDirection = Math.PI / 2;
        this.controlOrientation = ControlOrientation.Portrait;
        this.iteration = 0;
        this.directionAngleLabel = directionAngleLabel;
        this.forwardAngleLabel = forwardAngleLabel;
        this.directionAngleDiffLabel = directionAngleDiffLabel;
        this.forwardAngleDiffLabel = forwardAngleDiffLabel;
        if (window.DeviceMotionEvent != undefined) {
            window.ondevicemotion = function (e) { _this.processAccelerometerData(e); };
        }
        else {
            alert("Accelerometer is not supported. (window.DeviceMotionEvent is undefined)");
        }
    }
    AccelerometerDriving.prototype.processAccelerometerData = function (e) {
        var accX = e.accelerationIncludingGravity.x;
        var accY = e.accelerationIncludingGravity.y;
        var accZ = e.accelerationIncludingGravity.z;
        if (this.controlOrientation == ControlOrientation.LandscapeLeft) {
            var tmp = accY;
            accY = accX;
            accX = -tmp;
        }
        else if (this.controlOrientation == ControlOrientation.LandscapeRight) {
            var tmp = accY;
            accY = -accX;
            accX = tmp;
        }
        this.acutalAngleForward = Math.atan2(accZ, accY);
        var inverseAngle = 2 * Math.PI - this.acutalAngleForward;
        var x = accX;
        var y = -accZ * Math.sin(inverseAngle) + accY * Math.cos(inverseAngle);
        var z = accZ * Math.cos(inverseAngle) + accY * Math.sin(inverseAngle);
        this.actualAngleDirection = Math.atan2(y, x);
        if ((this.iteration % 10) == 0) {
            var forwardStr = (this.acutalAngleForward / Math.PI * 180).toFixed(1);
            var directionStr = (this.actualAngleDirection / Math.PI * 180).toFixed(1);
            var forwardDiffStr = (this.angleDiff(this.acutalAngleForward, this.baseAngleForward) / Math.PI * 180).toFixed(1);
            var directionDiffStr = (this.angleDiff(this.actualAngleDirection, this.baseAngleDirection) / Math.PI * 180).toFixed(1);
            this.forwardAngleLabel.innerText = forwardStr + String.fromCharCode(176);
            this.forwardAngleDiffLabel.innerText = "(" + forwardDiffStr + String.fromCharCode(176) + ")";
            this.directionAngleLabel.innerText = directionStr + String.fromCharCode(176);
            this.directionAngleDiffLabel.innerText = "(" + directionDiffStr + String.fromCharCode(176) + ")";
        }
        this.iteration++;
    };
    AccelerometerDriving.prototype.setControlOrientation = function (orientation) {
        this.controlOrientation = orientation;
    };
    AccelerometerDriving.prototype.setAsZero = function () {
        this.baseAngleForward = this.acutalAngleForward;
    };
    AccelerometerDriving.prototype.setIsEnabled = function (isEnabled) {
        this.isEnabled = isEnabled;
    };
    AccelerometerDriving.prototype.angleDiff = function (angle, base) {
        var diff = angle - base;
        if (diff < -Math.PI) {
            diff += Math.PI;
        }
        if (diff > Math.PI) {
            diff -= Math.PI;
        }
        else
            return diff;
    };
    AccelerometerDriving.prototype.getData = function () {
        var sensitivityCoefForward = 0.2;
        var sensitivityCoefDirection = 0.2;
        if (this.forwardSensitivity == SensitivityLevel.Low) {
            sensitivityCoefForward = 2;
        }
        else if (this.forwardSensitivity == SensitivityLevel.Medium) {
            sensitivityCoefForward = 5;
        }
        else if (this.forwardSensitivity == SensitivityLevel.High) {
            sensitivityCoefForward = 8;
        }
        if (this.directionSensitivity == SensitivityLevel.Low) {
            sensitivityCoefDirection = 2;
        }
        else if (this.directionSensitivity == SensitivityLevel.Medium) {
            sensitivityCoefDirection = 5;
        }
        else if (this.directionSensitivity == SensitivityLevel.High) {
            sensitivityCoefDirection = 8;
        }
        if (this.isEnabled) {
            var threshold = Math.PI / 20;
            var forward = this.angleDiff(this.acutalAngleForward, this.baseAngleForward);
            if (forward > 0) {
                if (forward < threshold) {
                    forward = 0;
                }
                else {
                    forward -= threshold;
                }
            }
            else if (forward < 0) {
                if (forward > -threshold) {
                    forward = 0;
                }
                else {
                    forward += threshold;
                }
            }
            forward = forward / Math.PI * sensitivityCoefForward;
            if (forward > 1) {
                forward = 1;
            }
            else if (forward < -1) {
                forward = -1;
            }
            var direction = -this.angleDiff(this.actualAngleDirection, this.baseAngleDirection);
            direction = direction / Math.PI * sensitivityCoefDirection;
            if (direction > 1) {
                direction = 1;
            }
            else if (direction < -1) {
                direction = -1;
            }
            var drivingData = new DrivingData();
            drivingData.motorA = direction > 0 ? forward : forward * (1 + direction);
            drivingData.motorB = direction < 0 ? forward : forward * (1 - direction);
            return drivingData;
        }
        else {
            return undefined;
        }
    };
    AccelerometerDriving.prototype.setForwardSensitivity = function (sensitivity) {
        this.forwardSensitivity = sensitivity;
    };
    AccelerometerDriving.prototype.setDirectionSensitivity = function (sensitivity) {
        this.directionSensitivity = sensitivity;
    };
    return AccelerometerDriving;
}());
var ControlOrientation;
(function (ControlOrientation) {
    ControlOrientation[ControlOrientation["Portrait"] = 0] = "Portrait";
    ControlOrientation[ControlOrientation["LandscapeLeft"] = 1] = "LandscapeLeft";
    ControlOrientation[ControlOrientation["LandscapeRight"] = 2] = "LandscapeRight";
})(ControlOrientation || (ControlOrientation = {}));
var Config = /** @class */ (function () {
    function Config() {
        this.reverseDriving = false;
        this.controlOrientation = ControlOrientation.Portrait;
    }
    return Config;
}());
var ViewModel = /** @class */ (function () {
    function ViewModel(controller, args) {
        var _this = this;
        this.requireCalibration = false;
        this.clearCalibration = false;
        this.settingsVisible = false;
        this.lightsPanelVisible = false;
        this.blinkLowBatteryState = false;
        this.config = this.loadConfig();
        this.keyboardDriving = new KeyboardDriving();
        this.accelerometerDriving = new AccelerometerDriving(args.lblForwardAngle, args.lblDirectionAngle, args.lblForwardAngleDiff, args.lblDirectionAngleDiff);
        this.controller = controller;
        this.args = args;
        this.setGSensorMode(false);
        this.args.iconBatteryFull.style.display = "none";
        this.args.iconBatteryLow.style.display = "none";
        this.screenDriving = new ScreenDriving(args.arrowsArea);
        setInterval(this.blinkLowBattery, 500);
        this.setReverseDriving(this.config.reverseDriving);
        this.args.chbReverse.checked = this.config.reverseDriving;
        this.setControlOrientation(this.config.controlOrientation);
        this.setControlSensitivityForward(this.config.controlSensitivityForward);
        this.setControlSensitivityDirection(this.config.controlSensitivityDirection);
        this.args.btnPlay.addEventListener("click", function () { return _this.setGSensorMode(true); });
        this.args.btnPause.addEventListener("click", function () { return _this.setGSensorMode(false); });
        this.args.btnCalibration.addEventListener("click", function () { _this.requireCalibration = true; _this.setSettingsVisibility(false); });
        this.args.btnClearCalibration.addEventListener("click", function () { _this.clearCalibration = true; });
        this.args.btnSettings.addEventListener("click", function () { return _this.setSettingsVisibility(!_this.settingsVisible); });
        this.args.btnRotateLeft.addEventListener("mousedown", function () { return _this.manualDrivingData = new DrivingData(0.5, -0.5); });
        this.args.btnRotateLeft.addEventListener("mouseup", function () { return _this.manualDrivingData = undefined; });
        this.args.btnRotateRight.addEventListener("mousedown", function () { return _this.manualDrivingData = new DrivingData(-0.5, 0.5); });
        this.args.btnRotateRight.addEventListener("mouseup", function () { return _this.manualDrivingData = undefined; });
        this.args.btnRotateLeft.addEventListener("touchstart", function () { return _this.manualDrivingData = new DrivingData(0.5, -0.5); });
        this.args.btnRotateLeft.addEventListener("touchend", function () { return _this.manualDrivingData = undefined; });
        this.args.btnRotateRight.addEventListener("touchstart", function () { return _this.manualDrivingData = new DrivingData(-0.5, 0.5); });
        this.args.btnRotateRight.addEventListener("touchend", function () { return _this.manualDrivingData = undefined; });
        this.args.btnZero.addEventListener("click", function () { return _this.accelerometerDriving.setAsZero(); });
        this.args.chbReverse.addEventListener("change", function () { return _this.setReverseDriving(_this.args.chbReverse.checked); });
        this.args.btnSettingsClose.addEventListener("click", function () { return _this.setSettingsVisibility(false); });
        this.args.btnPortrait.addEventListener("click", function () { return _this.setControlOrientation(ControlOrientation.Portrait); });
        this.args.btnLandscapeLeft.addEventListener("click", function () { return _this.setControlOrientation(ControlOrientation.LandscapeLeft); });
        this.args.btnLandscapeRight.addEventListener("click", function () { return _this.setControlOrientation(ControlOrientation.LandscapeRight); });
        this.args.btnLight.addEventListener("click", function () { return _this.setLightsPanelVisibility(!_this.lightsPanelVisible); });
        this.args.btnLightsClose.addEventListener("click", function () { _this.setLightsPanelVisibility(false); _this.uploadLightsConfig(); });
        this.args.btnAddFirstColor.addEventListener("click", function () { return _this.addFirstColor(); });
        this.args.rdDirectionSensitivityLow.addEventListener("click", function () { if (_this.args.rdDirectionSensitivityLow.checked) {
            _this.setControlSensitivityDirection(SensitivityLevel.Low);
        } });
        this.args.rdDirectionSensitivityHigh.addEventListener("click", function () { if (_this.args.rdDirectionSensitivityHigh.checked) {
            _this.setControlSensitivityDirection(SensitivityLevel.High);
        } });
        this.args.rdDirectionSensitivityMedium.addEventListener("click", function () { if (_this.args.rdDirectionSensitivityMedium.checked) {
            _this.setControlSensitivityDirection(SensitivityLevel.Medium);
        } });
        this.args.rdForwardSensitivityLow.addEventListener("click", function () { if (_this.args.rdForwardSensitivityLow.checked) {
            _this.setControlSensitivityForward(SensitivityLevel.Low);
        } });
        this.args.rdForwardSensitivityHigh.addEventListener("click", function () { if (_this.args.rdForwardSensitivityHigh.checked) {
            _this.setControlSensitivityForward(SensitivityLevel.High);
        } });
        this.args.rdForwardSensitivityMedium.addEventListener("click", function () { if (_this.args.rdForwardSensitivityMedium.checked) {
            _this.setControlSensitivityForward(SensitivityLevel.Medium);
        } });
        controller.batteryUpdated.subscribe(function (x) { return _this.processBatteryInfo(); });
        controller.stateChangedEvent.subscribe(function (x) { return _this.processState(); });
        controller.chassisLightChanged.subscribe(function (x) { return _this.updateChasisLightsTable(); });
        this.processBatteryInfo();
        this.processState();
        this.updateChasisLightsTable();
        setInterval(function () { _this.updateDrivingData(); }, 30);
    }
    ViewModel.prototype.addFirstColor = function () {
        var tbody = this.args.chassisLightsTable.getElementsByTagName("tbody")[0];
        this.insertRow(tbody, undefined, 0, 0, 0, 1);
    };
    ViewModel.prototype.updateChasisLightsTable = function () {
        //clear rows
        var tbody = this.args.chassisLightsTable.getElementsByTagName("tbody")[0];
        var rows = tbody.getElementsByTagName("tr");
        for (var i = rows.length - 1; i >= 0; i--) {
            rows.item(i).remove();
        }
        // fill rows
        var lightsConfig = this.controller.getChassisLight();
        if (!lightsConfig || lightsConfig.stops.length == 0) {
            var stop = new ChassisLightStop();
            stop.red = 0;
            stop.green = 0;
            stop.blue = 0;
            stop.duration = 1;
            lightsConfig = new ChassisLightConfig();
            lightsConfig.stops = [];
            lightsConfig.stops.push(stop);
        }
        var previousRow = undefined;
        for (var _i = 0, _a = lightsConfig.stops; _i < _a.length; _i++) {
            var entry = _a[_i];
            previousRow = this.insertRow(tbody, previousRow, entry.red, entry.green, entry.blue, entry.duration);
        }
    };
    ViewModel.prototype.parseNumValue = function (str) {
        if (str && str != "") {
            return parseFloat(str.replace(",", "."));
        }
        else
            return 0;
    };
    ViewModel.prototype.uploadLightsConfig = function () {
        var config = new ChassisLightConfig();
        config.persistent = true;
        config.stops = [];
        var tbody = this.args.chassisLightsTable.getElementsByTagName("tbody")[0];
        var rows = tbody.getElementsByTagName("tr");
        for (var i = 0; i < rows.length; i++) {
            var row = rows.item(i);
            var colorPicker = row.getElementsByTagName("td")[0].getElementsByTagName("input")[0];
            var durationInput = row.getElementsByTagName("td")[1].getElementsByTagName("input")[0];
            var duration = this.parseNumValue(durationInput.value);
            var r = parseInt(colorPicker.value.substr(1, 2), 16);
            var g = parseInt(colorPicker.value.substr(3, 2), 16);
            var b = parseInt(colorPicker.value.substr(5, 2), 16);
            config.stops.push({ blue: b, green: g, red: r, duration: duration });
        }
        this.controller.setChassisLight(config);
    };
    ViewModel.prototype.toHex = function (val) {
        var str = val.toString(16);
        if (str.length == 1)
            return "0" + str;
        else
            return str;
    };
    ViewModel.prototype.insertRow = function (tbody, previous, red, green, blue, duration) {
        var _this = this;
        var row = document.createElement("tr");
        var cellColorPicker = row.insertCell();
        var colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.value = "#" + this.toHex(red) + this.toHex(green) + this.toHex(blue);
        cellColorPicker.insertAdjacentElement("afterbegin", colorPicker);
        var cellDuration = row.insertCell();
        var durationInput = document.createElement("input");
        durationInput.type = "number";
        durationInput.min = "0";
        durationInput.max = "3600";
        durationInput.step = "0.2";
        durationInput.value = duration.toString();
        cellDuration.insertAdjacentElement("afterbegin", durationInput);
        var cellButtons = row.insertCell();
        var imgAdd = document.createElement("img");
        imgAdd.src = eval("plusBtnIconBase64");
        imgAdd.addEventListener("click", function () { return _this.insertRow(tbody, row, red, green, blue, duration); });
        imgAdd.classList.add("plusBtn");
        var imgDel = document.createElement("img");
        imgDel.src = eval("minusBtnIconBase64");
        imgDel.addEventListener("click", function () {
            if (tbody.getElementsByTagName("tr").length > 1)
                row.remove();
        });
        imgDel.classList.add("minusBtn");
        cellButtons.insertAdjacentElement("afterbegin", imgAdd);
        cellButtons.insertAdjacentElement("afterbegin", imgDel);
        if (previous)
            previous.insertAdjacentElement("afterend", row);
        else
            tbody.insertAdjacentElement("afterbegin", row);
        return row;
    };
    ViewModel.prototype.loadConfig = function () {
        var val = localStorage.getItem("config");
        if (val)
            return JSON.parse(val);
        else
            return new Config();
    };
    ViewModel.prototype.storeConfig = function (config) {
        localStorage.setItem("config", JSON.stringify(this.config));
    };
    ViewModel.prototype.setControlOrientation = function (orientation) {
        this.config.controlOrientation = orientation;
        this.storeConfig(this.config);
        this.accelerometerDriving.setControlOrientation(orientation);
        this.args.btnPortrait.style.opacity = orientation == ControlOrientation.Portrait ? "1" : "0.4";
        this.args.btnLandscapeLeft.style.opacity = orientation == ControlOrientation.LandscapeLeft ? "1" : "0.4";
        this.args.btnLandscapeRight.style.opacity = orientation == ControlOrientation.LandscapeRight ? "1" : "0.4";
    };
    ViewModel.prototype.setControlSensitivityForward = function (sensitivity) {
        if (sensitivity == undefined) {
            sensitivity = SensitivityLevel.Medium;
        }
        this.config.controlSensitivityForward = sensitivity;
        this.storeConfig(this.config);
        this.accelerometerDriving.setForwardSensitivity(sensitivity);
        this.args.rdForwardSensitivityHigh.checked = sensitivity == SensitivityLevel.High;
        this.args.rdForwardSensitivityLow.checked = sensitivity == SensitivityLevel.Low;
        this.args.rdForwardSensitivityMedium.checked = sensitivity == SensitivityLevel.Medium;
    };
    ViewModel.prototype.setControlSensitivityDirection = function (sensitivity) {
        if (sensitivity == undefined) {
            sensitivity = SensitivityLevel.Medium;
        }
        this.config.controlSensitivityDirection = sensitivity;
        this.storeConfig(this.config);
        this.accelerometerDriving.setDirectionSensitivity(sensitivity);
        this.args.rdDirectionSensitivityHigh.checked = sensitivity == SensitivityLevel.High;
        this.args.rdDirectionSensitivityLow.checked = sensitivity == SensitivityLevel.Low;
        this.args.rdDirectionSensitivityMedium.checked = sensitivity == SensitivityLevel.Medium;
    };
    ViewModel.prototype.setReverseDriving = function (reverse) {
        this.config.reverseDriving = reverse;
        this.controller.setReverseDriving(reverse);
        this.storeConfig(this.config);
    };
    ViewModel.prototype.processState = function () {
        if (this.controller.getState() == State.Disconnected) {
            this.args.lblState.innerText = "Disconnected";
            this.args.lblState.style.color = "red";
            this.setGSensorMode(false);
        }
        else if (this.controller.getState() == State.CalibrationInProgress) {
            this.args.lblState.innerText = "Calibration";
            this.args.lblState.style.color = "orange";
            this.setGSensorMode(false);
        }
        else if (this.controller.getState() == State.OK) {
            this.args.lblState.innerText = "Connected";
            this.args.lblState.style.color = "green";
        }
        else {
            this.args.lblState.innerText = "<unknown>";
            this.args.lblState.style.color = "black";
            this.setGSensorMode(false);
        }
    };
    ViewModel.prototype.processBatteryInfo = function () {
        var batteryInfo = this.controller.getBatteryInfo();
        if (batteryInfo) {
            this.args.iconBatteryFull.style.display = batteryInfo.Level == BatteryLevel.Full ? "block" : "none";
            this.args.iconBatteryHalf.style.display = batteryInfo.Level == BatteryLevel.Half ? "block" : "none";
            this.args.iconBatteryLow.style.display = batteryInfo.Level == BatteryLevel.Low ? "block" : "none";
            this.args.lblV1.innerText = batteryInfo.VBat1.toFixed(2).toString() + " V";
            this.args.lblV2.innerText = batteryInfo.VBat2.toFixed(2).toString() + " V";
        }
        else {
            this.args.iconBatteryFull.style.display = "none";
            this.args.iconBatteryHalf.style.display = "block";
            this.args.iconBatteryLow.style.display = "none";
            this.args.lblV1.innerText = "-.-- V";
            this.args.lblV2.innerText = "-.-- V";
        }
    };
    ViewModel.prototype.setGSensorMode = function (enabled) {
        if (this.controller.getState() != State.OK) {
            enabled = false;
        }
        this.accelerometerDriving.setIsEnabled(enabled);
        this.args.btnPlay.style.display = enabled ? "none" : "block";
        this.args.btnPause.style.display = !enabled ? "none" : "block";
        ;
    };
    ViewModel.prototype.blinkLowBattery = function () {
        if (this.blinkLowBatteryState)
            this.args.iconBatteryLow.style.opacity = "0.3";
        else
            this.args.iconBatteryLow.style.opacity = "1";
        this.blinkLowBatteryState = !this.blinkLowBatteryState;
    };
    ViewModel.prototype.setSettingsVisibility = function (isVisible) {
        this.settingsVisible = isVisible;
        this.args.panelSettings.style.display = isVisible ? "block" : "none";
        this.setGSensorMode(false);
    };
    ViewModel.prototype.setLightsPanelVisibility = function (isVisible) {
        this.lightsPanelVisible = isVisible;
        this.args.panelLights.style.display = isVisible ? "block" : "none";
        this.setGSensorMode(false);
    };
    ViewModel.prototype.updateDrivingData = function () {
        var keyboardDrivingData = this.keyboardDriving.getData();
        var accelerometerDrivingData = this.accelerometerDriving.getData();
        var screenDrivingData = this.screenDriving.getData();
        var selectedDrivingData = undefined;
        if (this.clearCalibration) {
            this.clearCalibration = false;
            this.controller.clearCalibration();
        }
        else if (this.requireCalibration) {
            this.requireCalibration = false;
            this.controller.startCalibration();
            return;
        }
        else if (this.manualDrivingData) {
            selectedDrivingData = this.manualDrivingData;
            this.controller.setMotors(this.manualDrivingData.motorA, this.manualDrivingData.motorB);
        }
        else if (keyboardDrivingData) {
            selectedDrivingData = keyboardDrivingData;
        }
        else if (screenDrivingData) {
            selectedDrivingData = screenDrivingData;
        }
        else if (accelerometerDrivingData) {
            selectedDrivingData = accelerometerDrivingData;
        }
        else {
            selectedDrivingData = new DrivingData();
            selectedDrivingData.motorA = 0;
            selectedDrivingData.motorB = 0;
        }
        this.controller.setMotors(selectedDrivingData.motorA, selectedDrivingData.motorB);
    };
    return ViewModel;
}());
var Controller = /** @class */ (function () {
    function Controller() {
        var _this = this;
        this.motorResponse = null;
        this.batteryInfo = null;
        this.lightResponse = null;
        this.reverse = false;
        this.stateChangedEvent = new LiteEvent();
        this.batteryUpdated = new LiteEvent();
        this.chassisLightChanged = new LiteEvent();
        setInterval(function () { return _this.readBatteryInfo(); }, 30000);
        setTimeout(function () { return _this.readBatteryInfo(); }, 3000);
        var host = window.location.host;
        host = "192.168.4.1";
        this.motorClient = new WSClient("ws://" + host + "/motor");
        this.lightClient = new WSClient("ws://" + host + "/chassisLight");
        this.motorClient.stateChangedEvent.subscribe(function () { return _this.stateChangedEvent.invoke(undefined); });
        this.lightClient.stateChangedEvent.subscribe(function () { return _this.stateChangedEvent.invoke(undefined); });
        this.motorClient.messageReceivedEvent.subscribe(function (msg) { return _this.processMotorMessage(msg); });
        this.lightClient.messageReceivedEvent.subscribe(function (msg) { return _this.processLightMessage(msg); });
    }
    Controller.prototype.setReverseDriving = function (reverse) {
        this.reverse = reverse;
    };
    Controller.prototype.processMotorMessage = function (msg) {
        this.motorResponse = msg;
        this.stateChangedEvent.invoke(undefined);
    };
    Controller.prototype.processLightMessage = function (msg) {
        this.lightResponse = msg;
        this.chassisLightChanged.invoke(undefined);
    };
    Controller.prototype.readBatteryInfo = function () {
        var _this = this;
        var req = new XMLHttpRequest();
        req.open('GET', '/battery');
        req.onload = function () {
            if (req.status == 200) {
                _this.batteryInfo = JSON.parse(req.response);
                _this.processBatteryInfo();
            }
            else {
                _this.batteryInfo = null;
            }
        };
        req.onerror = function () { _this.motorResponse = null; };
        req.send();
    };
    Controller.prototype.processBatteryInfo = function () {
        if (this.batteryInfo && (this.batteryInfo.vbat1 + this.batteryInfo.vbat2 < 6)) {
            window.navigator.vibrate([500, 200, 500, 200]);
        }
        this.batteryUpdated.invoke(undefined);
    };
    Controller.prototype.setMotors = function (motorA, motorB) {
        console.log("Set motorA: " + motorA + "; Set motorB: " + motorB);
        var msg = {
            motorA: !this.reverse ? motorA : (-motorB),
            motorB: !this.reverse ? motorB : (-motorA),
            startCalibration: false
        };
        this.motorClient.sendMessage(msg);
    };
    Controller.prototype.setChassisLight = function (config) {
        var dto = {
            persist: config.persistent,
            stops: []
        };
        config.stops.forEach(function (e) {
            dto.stops.push({
                r: e.red,
                g: e.green,
                b: e.blue,
                t: Math.round(e.duration * 50)
            });
        });
        return this.lightClient.sendMessage(dto);
    };
    Controller.prototype.getChassisLight = function () {
        if (this.lightResponse) {
            var retVal = new ChassisLightConfig();
            retVal.persistent = false;
            retVal.stops = [];
            this.lightResponse.stops.forEach(function (x) {
                retVal.stops.push({
                    red: x.r,
                    green: x.g,
                    blue: x.b,
                    duration: x.t / 50
                });
            });
        }
        else {
            return null;
        }
        return retVal;
    };
    Controller.prototype.startCalibration = function () {
        this.motorClient.sendMessage({
            motorA: 0,
            motorB: 0,
            startCalibration: true
        });
    };
    Controller.prototype.clearCalibration = function () {
        this.motorClient.sendMessage({
            motorA: 0,
            motorB: 0,
            clearCalibration: true
        });
    };
    Controller.prototype.getBatteryInfo = function () {
        if (this.batteryInfo) {
            var retVal = new BatteryInfo();
            retVal.VBat1 = this.batteryInfo.vbat1;
            retVal.VBat2 = this.batteryInfo.vbat2;
            if (this.batteryInfo.vbat1 + this.batteryInfo.vbat2 > 7.2)
                retVal.Level = BatteryLevel.Full;
            else if (this.batteryInfo.vbat1 + this.batteryInfo.vbat2 > 6.2)
                retVal.Level = BatteryLevel.Half;
            else
                retVal.Level = BatteryLevel.Low;
            return retVal;
        }
        else
            return null;
    };
    Controller.prototype.getState = function () {
        if (this.lightClient.isConnected() == false || this.motorClient.isConnected() == false) {
            return State.Disconnected;
        }
        else if (this.motorResponse && this.motorResponse.calibrationInProgress) {
            return State.CalibrationInProgress;
        }
        else {
            return State.OK;
        }
    };
    return Controller;
}());
var WSClientState;
(function (WSClientState) {
    WSClientState[WSClientState["disconnected"] = 0] = "disconnected";
    WSClientState[WSClientState["connecting"] = 1] = "connecting";
    WSClientState[WSClientState["connected"] = 2] = "connected";
})(WSClientState || (WSClientState = {}));
var WSClient = /** @class */ (function () {
    function WSClient(url) {
        this.state = WSClientState.disconnected;
        this.stateChangedEvent = new LiteEvent();
        this.messageReceivedEvent = new LiteEvent();
        this.url = url;
        this.openSocket();
        this.setState(WSClientState.disconnected);
    }
    WSClient.prototype.setState = function (state) {
        this.state = state;
        this.stateChangedEvent.invoke(state);
    };
    WSClient.prototype.getState = function () {
        return this.state;
    };
    WSClient.prototype.isConnected = function () {
        return this.state == WSClientState.connected;
    };
    WSClient.prototype.openSocket = function () {
        var _this = this;
        this.socket = new WebSocket(this.url);
        this.setState(WSClientState.connecting);
        this.socket.addEventListener("open", function () {
            _this.setState(WSClientState.connected);
        });
        this.socket.addEventListener("close", function () {
            _this.setState(WSClientState.disconnected);
            _this.socket = null;
            _this.scheduleReconnection();
        });
        this.socket.addEventListener("error", function (evnt) {
            console.log("WebSocket error: ", evnt);
        });
        this.socket.addEventListener("message", function (evnt) {
            console.log("Received message: ", evnt.data);
            _this.messageReceivedEvent.invoke(JSON.parse(evnt.data));
        });
    };
    WSClient.prototype.scheduleReconnection = function () {
        var _this = this;
        setTimeout(function () { return _this.openSocket(); }, 5000);
    };
    WSClient.prototype.sendMessage = function (msg) {
        console.debug("Send message:", msg);
        if (this.state == WSClientState.connected) {
            this.socket.send(JSON.stringify(msg));
            return true;
        }
        else {
            console.log("Unable to send, not connected.");
            return false;
        }
    };
    return WSClient;
}());
