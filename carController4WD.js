class CarController4WD{

	constructor(){
		this.turn=0;
		this.speed=0;
		this.cameraX=0;
		this.cameraY=0;

		this.ignoreBackwardMode=false;//to turn liek real car

		this.cameraXDirection=-1;
		this.cameraYDirection=1;

	}


	normalize(value){
		return Math.min(1,Math.max(-1,value));
	}

	setSpeed(speed){
		this.speed=	this.normalize(speed);
	}

	setTurn(turn){

		this.turn=	this.normalize(turn);

	}

	compute(){
		this.leftSpeed= this.speed;
		this.rightSpeed=this.speed;


		var mn;
		if (this.ignoreBackwardMode){
			mn=1;
		}else{
			mn=this.speed<0?-1:1;//so it turns while drivign backwards as a real car
		}

		this.leftSpeed+=this.turn/mn;
		this.rightSpeed-=this.turn/mn;

		this.leftSpeed=this.normalize(this.leftSpeed);
		this.rightSpeed=this.normalize(this.rightSpeed);

	}



	getLeftSideSpeed(){
		return this.leftSpeed;
	}

	getRightSideSpeed(){
		return this.rightSpeed;
	}

	getMotorMode(speed){
		if (speed==0){
			return 1;
		}else if (speed<0){
			return 3;
		}else{
			return 2;
		}
	}



	setCameraPosition(x,y){
		this.cameraX=this.normalize(x);
		this.cameraY=this.normalize(y);


	}

	getCameraX(){
		return this.xAxeCenter+ this.cameraX*this.xAxeRange*this.cameraXDirection;
	}

	getCameraY(){
		return this.yAxeCenter+this.cameraY*this.yAxeRange*this.cameraYDirection;
	}
}