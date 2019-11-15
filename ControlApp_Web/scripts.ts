class LiteEvent<T>
{
    private handlers: { (arg?: T): void; }[] = [];

    public subscribe(handler: { (arg?: T): void; }): void {
        this.handlers.push(handler);
    }

    public unsubscribe(handler: { (arg?: T): void; }): void {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    public invoke(arg: T): void {
        this.handlers.forEach(x => x(arg));
    }
}

interface DTO_ChassisLightStop {
    r: number;
    g: number;
    b: number;
    t: number;
}

interface DTO_ChassisLight {
    stops: DTO_ChassisLightStop[];
    persist: boolean;
}

interface DTO_BatteryInfo {
    vbat1: number;
    vbat2: number;
    ATMegaIteration: number
    ESP12Millis: number
}

interface DTO_MotorResponse {
    distanceA: number;
    distanceB: number;
    calibrationInProgress: boolean;
    minDutyA: number;
    minDutyB: number;
}

interface DTO_MotorRequest {
    motorA: number;
    motorB: number;
    startCalibration: boolean;
    clearCalibration : boolean;
}

class ChassisLightStop {
    red: number;
    green: number;
    blue: number;
    duration: number;
}

class ChassisLightConfig {
    stops: ChassisLightStop[];
    persistent: boolean;
}

enum State {
    Disconnected,
    CalibrationInProgress,
    OK
}

enum BatteryLevel {
    Full,
    Half,
    Low
}

enum SensitivityLevel {
    Low,
    Medium,
    High
}

class BatteryInfo {
    public VBat1: number;
    public VBat2: number;
    public Level: BatteryLevel;
}

interface ViewModelArgs {
    btnPlay: HTMLImageElement
    btnPause: HTMLImageElement
    btnRotateRight: HTMLImageElement
    btnRotateLeft: HTMLImageElement
    iconBatteryFull: HTMLImageElement
    iconBatteryHalf: HTMLImageElement
    iconBatteryLow: HTMLImageElement
    lblV1: HTMLDivElement
    lblV2: HTMLDivElement
    btnZero: HTMLImageElement
    btnCalibration : HTMLButtonElement
    btnClearCalibration: HTMLButtonElement
    btnLight: HTMLImageElement
    lblState: HTMLDivElement
    arrowsArea: HTMLImageElement
    panelSettings: HTMLDivElement
    btnSettings: HTMLImageElement
    chbReverse: HTMLInputElement
    btnSettingsClose: HTMLImageElement
    btnPortrait: HTMLImageElement
    btnLandscapeLeft: HTMLImageElement
    btnLandscapeRight: HTMLImageElement
    panelLights: HTMLImageElement
    btnLightsClose: HTMLImageElement
    chassisLightsTable: HTMLTableElement
    btnAddFirstColor : HTMLImageElement
    lblForwardAngle : HTMLSpanElement
    lblDirectionAngle : HTMLSpanElement
    lblForwardAngleDiff : HTMLSpanElement
    lblDirectionAngleDiff : HTMLSpanElement
    rdForwardSensitivityLow : HTMLInputElement
    rdForwardSensitivityMedium : HTMLInputElement
    rdForwardSensitivityHigh : HTMLInputElement
    rdDirectionSensitivityLow : HTMLInputElement
    rdDirectionSensitivityMedium : HTMLInputElement
    rdDirectionSensitivityHigh : HTMLInputElement
}

class DrivingData {
    motorA: number = 0;
    motorB: number = 0;

    constructor(motorA: number = 0, motorB: number = 0) {
        this.motorA = motorA;
        this.motorB = motorB;
    }

    public toBounds() {
        this.motorA = this.toBoundsInternal(this.motorA, -1, 1);
        this.motorB = this.toBoundsInternal(this.motorB, -1, 1);
    }

    private toBoundsInternal(value: number, min: number, max: number): number {
        if (value > max) return max;
        else if (value < min) return min;
        else return value;
    }
}

class KeyboardDriving {
    constructor() {
        document.addEventListener("keydown", (e) => this.processKeyEvent(e, true));
        document.addEventListener("keyup", (e) => this.processKeyEvent(e, false));
    }

    private leftArrow: boolean = false;
    private rightArrow: boolean = false;
    private upArrow: boolean = false;
    private downArrow: boolean = false;
    private xBtn: boolean = false;
    private yBtn: boolean = false;

    processKeyEvent(evnt: KeyboardEvent, newState: boolean): void {
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
    }

    getData(): DrivingData {
        const p1 = 0.2
        const p2 = 0.5
        var retVal = new DrivingData();
        if (this.leftArrow && this.rightArrow) { retVal.motorA = p2, retVal.motorB = -p2 }
        else if (this.upArrow && this.downArrow) { retVal.motorA = -p2, retVal.motorB = p2 }
        else if (this.upArrow && this.rightArrow) { retVal.motorA = p1, retVal.motorB = p2 }
        else if (this.upArrow && this.leftArrow) { retVal.motorA = p2, retVal.motorB = p1 }
        else if (this.downArrow && this.rightArrow) { retVal.motorA = -p1, retVal.motorB = -p2 }
        else if (this.downArrow && this.leftArrow) { retVal.motorA = -p2, retVal.motorB = -p1 }
        else if (this.upArrow) { retVal.motorA = p2, retVal.motorB = p2 }
        else if (this.downArrow) { retVal.motorA = -p2, retVal.motorB = -p2 }
        else { return undefined }

        if (this.xBtn) { retVal.motorA *= 2; retVal.motorB *= 2; }
        else if (this.yBtn) { retVal.motorA /= 3; retVal.motorB /= 3; }
        return retVal;
    }
}

class ScreenDriving {
    private driving: boolean = false;

    private arrowsArea: HTMLImageElement;

    private drivingData: DrivingData;

    constructor(arrowsArea: HTMLImageElement) {
        this.arrowsArea = arrowsArea;
        arrowsArea.addEventListener("mouseenter", () => { this.stopDriving() });
        arrowsArea.addEventListener("mouseleave", () => { this.stopDriving() });
        arrowsArea.addEventListener("mousedown", (e) => { this.startDriving(e.pageX, e.pageY) });
        arrowsArea.addEventListener("mousemove", (e) => { this.refresh(e.pageX, e.pageY) });
        arrowsArea.addEventListener("mouseup", (e) => { this.stopDriving() });
        arrowsArea.addEventListener("touchstop", () => { this.stopDriving() });
        arrowsArea.addEventListener("touchstart", (e) => { this.startDriving(e.touches[0].pageX, e.touches[0].pageY) });
        arrowsArea.addEventListener("touchmove", (e) => { this.refresh(e.touches[0].pageX, e.touches[0].pageY) });
        arrowsArea.addEventListener("touchend", (e) => { this.stopDriving() })
        arrowsArea.addEventListener("touchcancel", (e) => { this.stopDriving() })
    }

    stopDriving() {
        this.driving = false;
    }

    startDriving(pageX: number, pageY: number) {
        this.driving = true;
        this.refresh(pageX, pageY);
    }

    refresh(pageX: number, pageY: number) {
        var x = pageX - this.arrowsArea.offsetLeft;
        var y = pageY - this.arrowsArea.offsetTop;

        x = x / this.arrowsArea.width * 2;
        y = y / this.arrowsArea.height * 2;
        if (x < 0) { x = 0; }
        if (x > 2) { x = 2; }
        if (y < 0) { y = 0; }
        if (y > 2) { y = 2; }
        x -= 1;
        y -= 1;

        var d = Math.sqrt(x * x + y * y);
        if (d > 1) { d = 1; }
        if (y < 0) { d = -d; }
        d = -d;

        var drivingData = new DrivingData();
        drivingData.motorA = x < 0 ? d : d * (1 - x);
        drivingData.motorB = x > 0 ? d : d * (1 + x);
        if (drivingData.motorA > 1 || drivingData.motorA < -1) {
            debugger;
        }
        this.drivingData = drivingData;
    }

    getData(): DrivingData {
        if (this.driving && this.drivingData) {
            return this.drivingData;
        }
        else {
            return undefined
        }
    }
}

class AccelerometerDriving {
    private isEnabled: boolean = false;

    private baseAngleForward: number = 0;

    private baseAngleDirection: number = Math.PI / 2;

    private acutalAngleForward: number = 0;

    private actualAngleDirection: number = Math.PI / 2;

    private controlOrientation: ControlOrientation = ControlOrientation.Portrait;

    private directionAngleLabel : HTMLSpanElement;

    private forwardAngleLabel : HTMLSpanElement;

    private directionAngleDiffLabel : HTMLSpanElement;

    private forwardAngleDiffLabel : HTMLSpanElement;

    private forwardSensitivity : SensitivityLevel;

    private directionSensitivity : SensitivityLevel;

    constructor(forwardAngleLabel : HTMLSpanElement, directionAngleLabel : HTMLSpanElement, forwardAngleDiffLabel : HTMLSpanElement, directionAngleDiffLabel : HTMLSpanElement) {
        this.directionAngleLabel = directionAngleLabel;
        this.forwardAngleLabel = forwardAngleLabel
        this.directionAngleDiffLabel = directionAngleDiffLabel;
        this.forwardAngleDiffLabel = forwardAngleDiffLabel

        if ((<any>window).DeviceMotionEvent != undefined) {
            window.ondevicemotion = (e) => { this.processAccelerometerData(e) };
        }
        else {
            alert("Accelerometer is not supported. (window.DeviceMotionEvent is undefined)");
        }
    }

    private iteration : number = 0;

    processAccelerometerData(e: DeviceMotionEvent) {
        var accX = e.accelerationIncludingGravity.x
        var accY = e.accelerationIncludingGravity.y
        var accZ = e.accelerationIncludingGravity.z

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
        var x: number = accX;
        var y: number = - accZ * Math.sin(inverseAngle) + accY * Math.cos(inverseAngle)
        var z : number = accZ * Math.cos(inverseAngle) + accY * Math.sin(inverseAngle)
        this.actualAngleDirection = Math.atan2(y, x);

        if((this.iteration % 10) == 0)
        {
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
    }

    setControlOrientation(orientation: ControlOrientation): void {
        this.controlOrientation = orientation;
    }

    setAsZero(): void {
        this.baseAngleForward = this.acutalAngleForward;
    }

    setIsEnabled(isEnabled: boolean): void {
        this.isEnabled = isEnabled;
    }

    angleDiff(angle: number, base: number): number {
        var diff = angle - base;
        if (diff < -Math.PI) { diff += Math.PI; }
        if (diff > Math.PI) { diff -= Math.PI; }
        else return diff;
    }

    getData(): DrivingData {
        var sensitivityCoefForward = 0.2;
        var sensitivityCoefDirection = 0.2;
        if(this.forwardSensitivity == SensitivityLevel.Low){sensitivityCoefForward = 2;}
        else if(this.forwardSensitivity == SensitivityLevel.Medium){sensitivityCoefForward = 5;}
        else if(this.forwardSensitivity == SensitivityLevel.High){sensitivityCoefForward = 8;}
        if(this.directionSensitivity == SensitivityLevel.Low){sensitivityCoefDirection = 2;}
        else if(this.directionSensitivity == SensitivityLevel.Medium){sensitivityCoefDirection = 5;}
        else if(this.directionSensitivity == SensitivityLevel.High){sensitivityCoefDirection = 8;}

        if (this.isEnabled) {
            const threshold = Math.PI / 20;
            var forward = this.angleDiff(this.acutalAngleForward, this.baseAngleForward);
            if (forward > 0) {
                if (forward < threshold) { forward = 0; }
                else { forward -= threshold; }
            }
            else if (forward < 0) {
                if (forward > -threshold) { forward = 0; }
                else { forward += threshold; }
            }
            forward = forward / Math.PI * sensitivityCoefForward;
            if (forward > 1) { forward = 1; }
            else if (forward < -1) { forward = -1; }

            var direction = - this.angleDiff(this.actualAngleDirection, this.baseAngleDirection);
            direction = direction / Math.PI * sensitivityCoefDirection;
            if (direction > 1) { direction = 1; }
            else if (direction < -1) { direction = -1; }

            var drivingData = new DrivingData();
            drivingData.motorA = direction > 0 ? forward : forward * (1 + direction);
            drivingData.motorB = direction < 0 ? forward : forward * (1 - direction);
            return drivingData;
        }
        else {
            return undefined
        }
    }

    setForwardSensitivity(sensitivity : SensitivityLevel)
    {
        this.forwardSensitivity = sensitivity;
    }

    setDirectionSensitivity(sensitivity : SensitivityLevel)
    {
        this.directionSensitivity = sensitivity;
    }
}

enum ControlOrientation {
    Portrait,
    LandscapeLeft,
    LandscapeRight
}

class Config {
    constructor() {
        this.reverseDriving = false;
        this.controlOrientation = ControlOrientation.Portrait;
    }

    public reverseDriving: boolean;

    public controlOrientation: ControlOrientation;

    public controlSensitivityForward : SensitivityLevel;

    public controlSensitivityDirection : SensitivityLevel;
}

class ViewModel {
    private controller: Controller;

    private args: ViewModelArgs;

    private accelerometerDriving: AccelerometerDriving;

    private requireCalibration: boolean = false;

    private clearCalibration: boolean = false;

    private manualDrivingData: DrivingData;

    private keyboardDriving: KeyboardDriving;

    private screenDriving: ScreenDriving;

    private settingsVisible: boolean = false;

    private lightsPanelVisible: boolean = false;

    private config: Config;

    constructor(controller: Controller, args: ViewModelArgs) {
        this.config = this.loadConfig();
        this.keyboardDriving = new KeyboardDriving();
        this.accelerometerDriving = new AccelerometerDriving(args.lblForwardAngle, args.lblDirectionAngle, args.lblForwardAngleDiff, args.lblDirectionAngleDiff);
        this.controller = controller;
        this.args = args;
        this.setGSensorMode(false)
        this.args.iconBatteryFull.style.display = "none";
        this.args.iconBatteryLow.style.display = "none";
        this.screenDriving = new ScreenDriving(args.arrowsArea);
        setInterval(this.blinkLowBattery, 500);

        this.setReverseDriving(this.config.reverseDriving);
        this.args.chbReverse.checked = this.config.reverseDriving;

        this.setControlOrientation(this.config.controlOrientation)
        this.setControlSensitivityForward(this.config.controlSensitivityForward);
        this.setControlSensitivityDirection(this.config.controlSensitivityDirection);

        this.args.btnPlay.addEventListener("click", () => this.setGSensorMode(true));
        this.args.btnPause.addEventListener("click", () => this.setGSensorMode(false));
        this.args.btnCalibration.addEventListener("click", () => { this.requireCalibration = true; this.setSettingsVisibility(false) });
        this.args.btnClearCalibration.addEventListener("click", () => { this.clearCalibration = true; });
        this.args.btnSettings.addEventListener("click", () => this.setSettingsVisibility(!this.settingsVisible));
        this.args.btnRotateLeft.addEventListener("mousedown", () => this.manualDrivingData = new DrivingData(0.5, -0.5));
        this.args.btnRotateLeft.addEventListener("mouseup", () => this.manualDrivingData = undefined);
        this.args.btnRotateRight.addEventListener("mousedown", () => this.manualDrivingData = new DrivingData(-0.5, 0.5));
        this.args.btnRotateRight.addEventListener("mouseup", () => this.manualDrivingData = undefined);
        this.args.btnRotateLeft.addEventListener("touchstart", () => this.manualDrivingData = new DrivingData(0.5, -0.5));
        this.args.btnRotateLeft.addEventListener("touchend", () => this.manualDrivingData = undefined);
        this.args.btnRotateRight.addEventListener("touchstart", () => this.manualDrivingData = new DrivingData(-0.5, 0.5));
        this.args.btnRotateRight.addEventListener("touchend", () => this.manualDrivingData = undefined);
        this.args.btnZero.addEventListener("click", () => this.accelerometerDriving.setAsZero());
        this.args.chbReverse.addEventListener("change", () => this.setReverseDriving(this.args.chbReverse.checked));
        this.args.btnSettingsClose.addEventListener("click", () => this.setSettingsVisibility(false));
        this.args.btnPortrait.addEventListener("click", () => this.setControlOrientation(ControlOrientation.Portrait));
        this.args.btnLandscapeLeft.addEventListener("click", () => this.setControlOrientation(ControlOrientation.LandscapeLeft));
        this.args.btnLandscapeRight.addEventListener("click", () => this.setControlOrientation(ControlOrientation.LandscapeRight));
        this.args.btnLight.addEventListener("click", () => this.setLightsPanelVisibility(!this.lightsPanelVisible));
        this.args.btnLightsClose.addEventListener("click", () => {this.setLightsPanelVisibility(false); this.uploadLightsConfig();});
        this.args.btnAddFirstColor.addEventListener("click", () => this.addFirstColor())
        this.args.rdDirectionSensitivityLow.addEventListener("click", () => 
            {if(this.args.rdDirectionSensitivityLow.checked){this.setControlSensitivityDirection(SensitivityLevel.Low)}});
        this.args.rdDirectionSensitivityHigh.addEventListener("click", () => 
            {if(this.args.rdDirectionSensitivityHigh.checked){this.setControlSensitivityDirection(SensitivityLevel.High)}});
        this.args.rdDirectionSensitivityMedium.addEventListener("click", () => 
            {if(this.args.rdDirectionSensitivityMedium.checked){this.setControlSensitivityDirection(SensitivityLevel.Medium)}});
        this.args.rdForwardSensitivityLow.addEventListener("click", () => 
            {if(this.args.rdForwardSensitivityLow.checked){this.setControlSensitivityForward(SensitivityLevel.Low)}});
        this.args.rdForwardSensitivityHigh.addEventListener("click", () => 
            {if(this.args.rdForwardSensitivityHigh.checked){this.setControlSensitivityForward(SensitivityLevel.High)}});
        this.args.rdForwardSensitivityMedium.addEventListener("click", () => 
            {if(this.args.rdForwardSensitivityMedium.checked){this.setControlSensitivityForward(SensitivityLevel.Medium)}});

        controller.batteryUpdated.subscribe((x) => this.processBatteryInfo())
        controller.stateChangedEvent.subscribe((x) => this.processState());
        controller.chassisLightChanged.subscribe((x) => this.updateChasisLightsTable());

        this.processBatteryInfo();
        this.processState();
        this.updateChasisLightsTable();

        setInterval(() => { this.updateDrivingData() }, 30)
    }

    addFirstColor(): void {
        var tbody = this.args.chassisLightsTable.getElementsByTagName("tbody")[0]
        this.insertRow(tbody, undefined, 0, 0, 0, 1);
    }

    updateChasisLightsTable(): void {
        //clear rows
        var tbody = this.args.chassisLightsTable.getElementsByTagName("tbody")[0]
        var rows = tbody.getElementsByTagName("tr");
        for (var i = rows.length - 1; i >= 0; i--)
        {
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
        for (let entry of lightsConfig.stops) {
            previousRow = this.insertRow(tbody, previousRow, entry.red, entry.green, entry.blue, entry.duration );
        }
    }

    parseNumValue(str : string) : number
    {
        if(str && str != "")
        {
            return parseFloat(str.replace(",", "."));
        }
        else return 0;
    }

    uploadLightsConfig()
    {
        var config = new ChassisLightConfig();
        config.persistent = true;
        config.stops = [];
        
        var tbody = this.args.chassisLightsTable.getElementsByTagName("tbody")[0]
        var rows = tbody.getElementsByTagName("tr");
        for (var i = 0; i < rows.length; i++)
        {
            var row = rows.item(i);
            var colorPicker = <HTMLInputElement>row.getElementsByTagName("td")[0].getElementsByTagName("input")[0];
            var durationInput = <HTMLInputElement>row.getElementsByTagName("td")[1].getElementsByTagName("input")[0];
            var duration = this.parseNumValue(durationInput.value);
            var r = parseInt(colorPicker.value.substr(1, 2), 16);
            var g = parseInt(colorPicker.value.substr(3, 2), 16);
            var b = parseInt(colorPicker.value.substr(5, 2), 16);

            config.stops.push({blue:b, green : g, red : r, duration : duration});
        }

        this.controller.setChassisLight(config);
    }

    toHex(val : number) : string
    {
        var str = val.toString(16);
        if(str.length == 1) return "0" + str;
        else return str;
    }

    insertRow(tbody : HTMLTableSectionElement, previous : HTMLTableRowElement, red : number, green : number, blue : number, duration : number) : HTMLTableRowElement
    {
        var row = <HTMLTableRowElement>document.createElement("tr");

        var cellColorPicker = row.insertCell();
        var colorPicker = document.createElement("input");
        colorPicker.type = "color";
        colorPicker.value = "#" + this.toHex(red) + this.toHex(green) + this.toHex(blue);
        cellColorPicker.insertAdjacentElement("afterbegin", colorPicker)

        var cellDuration = row.insertCell();
        var durationInput =  document.createElement("input");
        durationInput.type = "number";
        durationInput.min = "0";
        durationInput.max = "3600";
        durationInput.step = "0.2";
        durationInput.value = duration.toString();
        cellDuration.insertAdjacentElement("afterbegin", durationInput);

        var cellButtons = row.insertCell();
        var imgAdd = document.createElement("img");
        imgAdd.src = eval("plusBtnIconBase64");
        imgAdd.addEventListener("click", ()=>this.insertRow(tbody, row, red, green, blue, duration));
        imgAdd.classList.add("plusBtn");
        var imgDel = document.createElement("img");
        imgDel.src = eval("minusBtnIconBase64");
        imgDel.addEventListener("click", ()=>
        {
            if(tbody.getElementsByTagName("tr").length > 1)
                row.remove()
        });
        imgDel.classList.add("minusBtn");
        cellButtons.insertAdjacentElement("afterbegin", imgAdd);
        cellButtons.insertAdjacentElement("afterbegin", imgDel);
        if(previous)
            previous.insertAdjacentElement("afterend", row);
        else
            tbody.insertAdjacentElement("afterbegin", row);
        return row;
    }

    loadConfig(): Config {
        var val = localStorage.getItem("config")
        if (val)
            return JSON.parse(val);
        else
            return new Config();
    }

    storeConfig(config: Config) {
        localStorage.setItem("config", JSON.stringify(this.config));
    }

    setControlOrientation(orientation: ControlOrientation): void {
        this.config.controlOrientation = orientation;
        this.storeConfig(this.config);
        this.accelerometerDriving.setControlOrientation(orientation);

        this.args.btnPortrait.style.opacity = orientation == ControlOrientation.Portrait ? "1" : "0.4";
        this.args.btnLandscapeLeft.style.opacity = orientation == ControlOrientation.LandscapeLeft ? "1" : "0.4";
        this.args.btnLandscapeRight.style.opacity = orientation == ControlOrientation.LandscapeRight ? "1" : "0.4";
    }

    setControlSensitivityForward(sensitivity : SensitivityLevel) : void
    {
        if(sensitivity == undefined){sensitivity = SensitivityLevel.Medium;}
        this.config.controlSensitivityForward = sensitivity;
        this.storeConfig(this.config);
        this.accelerometerDriving.setForwardSensitivity(sensitivity);

        this.args.rdForwardSensitivityHigh.checked = sensitivity == SensitivityLevel.High;
        this.args.rdForwardSensitivityLow.checked = <any>sensitivity == SensitivityLevel.Low;
        this.args.rdForwardSensitivityMedium.checked = sensitivity == SensitivityLevel.Medium;
    }

    setControlSensitivityDirection(sensitivity : SensitivityLevel) : void
    {
        if(sensitivity == undefined){sensitivity = SensitivityLevel.Medium;}
        this.config.controlSensitivityDirection = sensitivity;
        this.storeConfig(this.config);
        this.accelerometerDriving.setDirectionSensitivity(sensitivity);
        
        this.args.rdDirectionSensitivityHigh.checked = sensitivity == SensitivityLevel.High;
        this.args.rdDirectionSensitivityLow.checked = <any>sensitivity == SensitivityLevel.Low;
        this.args.rdDirectionSensitivityMedium.checked = sensitivity == SensitivityLevel.Medium;
    }

    setReverseDriving(reverse: boolean): void {
        this.config.reverseDriving = reverse;
        this.controller.setReverseDriving(reverse);
        this.storeConfig(this.config)
    }

    processState(): void {
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
    }

    processBatteryInfo(): void {
        var batteryInfo = this.controller.getBatteryInfo();
        if (batteryInfo) {
            this.args.iconBatteryFull.style.display = batteryInfo.Level == BatteryLevel.Full ? "block" : "none";
            this.args.iconBatteryHalf.style.display = batteryInfo.Level == BatteryLevel.Half ? "block" : "none";
            this.args.iconBatteryLow.style.display = batteryInfo.Level == BatteryLevel.Low ? "block" : "none";
            this.args.lblV1.innerText = batteryInfo.VBat1.toFixed(2).toString() + " V"
            this.args.lblV2.innerText = batteryInfo.VBat2.toFixed(2).toString() + " V"
        }
        else {
            this.args.iconBatteryFull.style.display = "none";
            this.args.iconBatteryHalf.style.display = "block";
            this.args.iconBatteryLow.style.display = "none";
            this.args.lblV1.innerText = "-.-- V";
            this.args.lblV2.innerText = "-.-- V";
        }
    }

    setGSensorMode(enabled: boolean): void {
        if (this.controller.getState() != State.OK) { enabled = false; }
        this.accelerometerDriving.setIsEnabled(enabled);
        this.args.btnPlay.style.display = enabled ? "none" : "block";
        this.args.btnPause.style.display = !enabled ? "none" : "block";;
    }

    private blinkLowBatteryState: boolean = false;
    blinkLowBattery(): void {
        if (this.blinkLowBatteryState)
            this.args.iconBatteryLow.style.opacity = "0.3";
        else
            this.args.iconBatteryLow.style.opacity = "1";
        this.blinkLowBatteryState = !this.blinkLowBatteryState;
    }

    private setSettingsVisibility(isVisible: boolean): void {
        this.settingsVisible = isVisible
        this.args.panelSettings.style.display = isVisible ? "block" : "none";
        this.setGSensorMode(false);
    }

    private setLightsPanelVisibility(isVisible: boolean): void {
        
        this.lightsPanelVisible = isVisible;
        this.args.panelLights.style.display = isVisible ? "block" : "none";
        this.setGSensorMode(false);
    }

    updateDrivingData(): void {
        var keyboardDrivingData = this.keyboardDriving.getData();
        var accelerometerDrivingData = this.accelerometerDriving.getData();
        var screenDrivingData = this.screenDriving.getData();

        var selectedDrivingData = undefined;

        if(this.clearCalibration)
        {
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
    }
}

class Controller {
    private motorResponse: DTO_MotorResponse = null;

    private batteryInfo: DTO_BatteryInfo = null;

    private lightResponse: DTO_ChassisLight = null;

    private motorClient: WSClient;

    private lightClient: WSClient;

    private reverse: boolean = false;

    constructor() {
        setInterval(() => this.readBatteryInfo(), 30000);
        setTimeout(() => this.readBatteryInfo(), 3000);
        var host = window.location.host
        host = "192.168.4.1"
        this.motorClient = new WSClient("ws://" + host + "/motor");
        this.lightClient = new WSClient("ws://" + host + "/chassisLight");
        this.motorClient.stateChangedEvent.subscribe(() => this.stateChangedEvent.invoke(undefined))
        this.lightClient.stateChangedEvent.subscribe(() => this.stateChangedEvent.invoke(undefined))
        this.motorClient.messageReceivedEvent.subscribe((msg) => this.processMotorMessage(msg))
        this.lightClient.messageReceivedEvent.subscribe((msg) => this.processLightMessage(msg))
    }

    setReverseDriving(reverse: boolean): void {
        this.reverse = reverse;
    }

    processMotorMessage(msg: DTO_MotorResponse): void {
        this.motorResponse = msg;
        this.stateChangedEvent.invoke(undefined);
    }

    processLightMessage(msg: DTO_ChassisLight): void {
        this.lightResponse = msg;
        this.chassisLightChanged.invoke(undefined);
    }

    readBatteryInfo(): any {
        var req: XMLHttpRequest = new XMLHttpRequest()
        req.open('GET', '/battery');
        req.onload = () => {
            if (req.status == 200) {
                this.batteryInfo = JSON.parse(req.response);
                this.processBatteryInfo();
            }
            else {
                this.batteryInfo = null
            }
        }
        req.onerror = () => { this.motorResponse = null }
        req.send();
    }

    processBatteryInfo(): void {
        if (this.batteryInfo && (this.batteryInfo.vbat1 + this.batteryInfo.vbat2 < 6)) {
            window.navigator.vibrate([500, 200, 500, 200])
        }
        this.batteryUpdated.invoke(undefined);
    }

    setMotors(motorA: number, motorB: number): void {
        console.log("Set motorA: " + motorA + "; Set motorB: " + motorB);

        var msg = <DTO_MotorRequest>{
            motorA: !this.reverse ? motorA : (-motorB),
            motorB: !this.reverse ? motorB : (-motorA),
            startCalibration: false
        };
        this.motorClient.sendMessage(msg);
    }

    setChassisLight(config: ChassisLightConfig): boolean {
        var dto : DTO_ChassisLight = {
            persist : config.persistent,
            stops : []
        }
        config.stops.forEach(e => {
            dto.stops.push({
                r: e.red,
                g: e.green,
                b: e.blue,
                t: Math.round(e.duration * 50)
            })
        });

        return this.lightClient.sendMessage(dto);
    }

    getChassisLight(): ChassisLightConfig {
        if (this.lightResponse) {
            var retVal = new ChassisLightConfig();
            retVal.persistent = false;
            retVal.stops = [];
            this.lightResponse.stops.forEach((x) => {
                retVal.stops.push({
                    red: x.r,
                    green: x.g,
                    blue: x.b,
                    duration: x.t / 50
                })
            })
        }
        else {
            return null;
        }
        return retVal;
    }

    startCalibration(): any {
        this.motorClient.sendMessage(<DTO_MotorRequest>{
            motorA: 0,
            motorB: 0,
            startCalibration: true
        });
    }

    clearCalibration(): any {
        this.motorClient.sendMessage(<DTO_MotorRequest>{
            motorA: 0,
            motorB: 0,
            clearCalibration: true
        });
    }
    
    getBatteryInfo(): BatteryInfo {
        if (this.batteryInfo) {
            var retVal = new BatteryInfo();
            retVal.VBat1 = this.batteryInfo.vbat1;
            retVal.VBat2 = this.batteryInfo.vbat2;
            if (this.batteryInfo.vbat1 + this.batteryInfo.vbat2  > 7.2 )
                retVal.Level = BatteryLevel.Full;
            else if (this.batteryInfo.vbat1 + this.batteryInfo.vbat2  > 6.2 )
                retVal.Level = BatteryLevel.Half;
            else
                retVal.Level = BatteryLevel.Low;
            return retVal;
        }
        else return null;
    }

    getState(): State {
        if (this.lightClient.isConnected() == false || this.motorClient.isConnected() == false) {
            return State.Disconnected;
        }
        else if (this.motorResponse && this.motorResponse.calibrationInProgress) {
            return State.CalibrationInProgress;
        }
        else {
            return State.OK
        }
    }

    public stateChangedEvent: LiteEvent<any> = new LiteEvent<any>();

    public batteryUpdated: LiteEvent<any> = new LiteEvent<any>();

    public chassisLightChanged: LiteEvent<any> = new LiteEvent<any>();
}

enum WSClientState {
    disconnected,
    connecting,
    connected
}

class WSClient {
    private state: WSClientState = WSClientState.disconnected

    private socket: WebSocket;

    private url: string;

    constructor(url: string) {
        this.url = url;
        this.openSocket();
        this.setState(WSClientState.disconnected);
    }

    setState(state: WSClientState): any {
        this.state = state;
        this.stateChangedEvent.invoke(state);
    }

    getState(): WSClientState {
        return this.state;
    }

    isConnected(): boolean {
        return this.state == WSClientState.connected;
    }

    openSocket(): void {
        this.socket = new WebSocket(this.url);
        this.setState(WSClientState.connecting);
        this.socket.addEventListener("open", () => {
            this.setState(WSClientState.connected);
        })
        this.socket.addEventListener("close", () => {
            this.setState(WSClientState.disconnected);
            this.socket = null;
            this.scheduleReconnection();
        })
        this.socket.addEventListener("error", (evnt) => {
            console.log("WebSocket error: ", evnt)
        })
        this.socket.addEventListener("message", (evnt) => {
            console.log("Received message: ", evnt.data)
            this.messageReceivedEvent.invoke(JSON.parse(evnt.data))
        })
    }

    scheduleReconnection(): void {
        setTimeout(() => this.openSocket(), 5000);
    }

    public stateChangedEvent: LiteEvent<WSClientState> = new LiteEvent<WSClientState>();

    public messageReceivedEvent: LiteEvent<any> = new LiteEvent<any>();

    public sendMessage(msg: any): boolean {
        console.debug("Send message:", msg);
        if (this.state == WSClientState.connected) {
            this.socket.send(JSON.stringify(msg));
            return true;
        }
        else {
            console.log("Unable to send, not connected.")
            return false;
        }
    }
}
