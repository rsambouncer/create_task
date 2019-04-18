
//README
/*
  Mouse effect:
    Kinematic spring, with a spring constant
    
  Potential points of failure:
    1) large applied forces
    2) simultanious collisions
    3) floating point inaccuracies
    
  Note that multiple physics frames are run for each game frame, to reduce bugs
*/

var SCREENWIDTH = 320, SCREENHEIGHT = 450;
var mouseTracker, collidingObjects;

(function start(){
  collidingObjects = [
    new circleObject(100,100,30,0.5),
    new circleObject(250,100,30,0.5),
    new circleObject(130,170,30,0.5),
    new circleObject(100,300,52,1.5)
  ];
  createCanvas("canvas",SCREENWIDTH,SCREENHEIGHT);
  setActiveCanvas("canvas");
  textLabel("startLabel","Drag a circle to start");
  onEvent("screen1","mousedown",hideElement.bind({},"startLabel"));
  setMouseHandlers();
  setInterval(update,20);
})();

function distsqrd(x1,y1,x2,y2){
  return (x1-x2)*(x1-x2)+(y1-y2)*(y1-y2);
}

function circleObject(x,y,radius,mass){
  this.radius = radius;
  this.springConstant = 1;
  this.mass = mass;
  this.canmove = true;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
}
circleObject.prototype.draw = function(){
  circle(this.x,this.y,this.radius);
};
circleObject.prototype.hasPointInside = function(x,y){
  return distsqrd(this.x,this.y,x,y)<=this.radius*this.radius;
};

function setMouseHandlers(){
  mouseTracker = {
    holding: null,
    x: 0,
    y: 0
  };
  onEvent("canvas","mousedown",function(e){
    for(var a in collidingObjects)
      if(collidingObjects[a].hasPointInside(e.x,e.y)){
        mouseTracker.holding = collidingObjects[a];
        break;
      }
  });
  onEvent("canvas","mousemove",function(e){
    mouseTracker.x = e.x;
    mouseTracker.y = e.y;
  });
  onEvent("canvas","mouseup",function(){
    mouseTracker.holding = null;
  });
}

function update(){
  for(var a=0;a<5;a++){
    applyAcceleration();
    applyCollisions();
    moveObjects();
  }
  draw();
}


function applyAcceleration(){
  //mouse pull on object is modelled as a spring
  if(mouseTracker.holding!=null){
    var m = mouseTracker;
    var h = mouseTracker.holding;
    var mouseSpringConstant = 0.0001;
    h.vx+= (m.x-h.x)*mouseSpringConstant/h.mass;
    h.vy+= (m.y-h.y)*mouseSpringConstant/h.mass;
  }
  //friction
  collidingObjects.forEach(function(c){
    c.vx*=0.999;
    c.vy*=0.999;
  });
}

function applyCollisions(){
  //detect and apply collision between every pair of objects
  for(var a=0; a<collidingObjects.length;a++) 
    for(var b=a+1; b<collidingObjects.length;b++)
      objectCollision(collidingObjects[a], collidingObjects[b]);  
  //detect and apply collisions between objects and walls
  for(a in collidingObjects) wallCollision(collidingObjects[a]);
}
function objectCollision(o1,o2){
  //NOTE: here, it is assumed both objects are circular. CHANGE if rectangular objects are introduced
  var coRest = 1; //coefficient of restitution
  var nx1 = o1.x+o1.vx; //new object coordinates
  var ny1 = o1.y+o1.vy;
  var nx2 = o2.x+o2.vx;
  var ny2 = o2.y+o2.vy;
  //check if the objects will overlap. If they do, calculate new velocities
  if(distsqrd(nx1,ny1,nx2,ny2)<=(o1.radius+o2.radius)*(o1.radius+o2.radius)){
    var inverseroot = 1/Math.sqrt(distsqrd(nx1,ny1,nx2,ny2));
    //if speed was important, could have implemented Quake's fast inverse square root
    var sinj = (ny1-ny2)*inverseroot;
    var cosj = (nx1-nx2)*inverseroot;
    //The math here is somewhat complicated
    //I actually spent more time deriving the impulseMag formula than writing the program
    var impulseMag = (coRest+1)*
      ((o1.vx-o2.vx)*cosj+(o1.vy-o2.vy)*sinj)*
      o1.mass*o2.mass / (o1.mass+o2.mass);
    o1.vx-=impulseMag/o1.mass*cosj;
    o1.vy-=impulseMag/o1.mass*sinj;
    o2.vx+=impulseMag/o2.mass*cosj;
    o2.vy+=impulseMag/o2.mass*sinj;
    o1.canmove = false; //prevents them from re-colliding in the same physics frame
    o2.canmove = false;
  }
}
function wallCollision(obj){
  //NOTE: here, it is assumed object is circular. CHANGE if rectangular objects are introduced
  var nx = obj.x+obj.vx;
  var ny = obj.y+obj.vy;
  //check if object collides with left/right walls
  if(nx+obj.radius>=SCREENWIDTH||nx-obj.radius<=0){  
    obj.vx = -obj.vx; obj.canmove = false;
  }
  //check if object collides with top/bottom walls
  if(ny+obj.radius>=SCREENHEIGHT||ny-obj.radius<=0){ 
    obj.vy = -obj.vy; obj.canmove = false;
  }
}

function moveObjects(){
  collidingObjects.forEach(function(c){
    if(c.canmove){
      c.x+=c.vx;
      c.y+=c.vy;
    }
    else c.canmove = true; //rigid body collision occured
  });
}

function draw(){
  clearCanvas();
  for(var a in collidingObjects) collidingObjects[a].draw();
  if(mouseTracker.holding!=null) 
    line(mouseTracker.x,mouseTracker.y,mouseTracker.holding.x,mouseTracker.holding.y);
}


