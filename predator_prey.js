// Global vars
var entities;
var newEntities;
var selected = 'prey';
var predDynamic = []; // array for the predator population 
var preyDynamic = [];
var humanDynamic = [];
var foodDynamic = [];
var totalDynamic = [];
// Settings
var avoidLines = true;
var chaseLines = true;
var lineMode = false;
var motionBlur = false;
var showChart = false;
var showNutrition = false;
var showPerception = false;
var menuVisible = true;
var sidebarOpen = true;
var t = 0;
var finalSimTime = 10; // 5 minutes or 300 seconds
var maxIteration;
var iteration = 0;
let latinHypercube; 

var foodPop = [];
var preyPop = [];
var predPop = [];
var humanPop = [];

function preload(){
  
  latinHypercube = loadTable('LHS_Input.csv', 'csv');
  
}


// function for initiating entities on the whole based on the presets. 


function setup() {
    fill(255,255,255);
    createCanvas(window.innerWidth, window.innerHeight);
    initEntities();
    let maxIteration = latinHypercube.getRowCount();
    
    for(let d = 0; d<maxIteration; d++){
      foodPop[d] = [latinHypercube.get(d,0)]
      preyPop[d] = [latinHypercube.get(d,1)]
      predPop[d] = [latinHypercube.get(d,2)]
      humanPop[d] = [latinHypercube.get(d,3)]    
    }
    //noLoop();
}

var presets = [
    {
        num: {
            food: foodPop[0],
            pred: preyPop[0],
            prey: predPop[0],
            human: humanPop[0]
        }
    }
];

function initEntities() {
    entities = [];
    newEntities = [];
    // Setup map from preset
    var preset = presets[0];
    var keys = Object.keys(preset.num);
    for (var i = 0; i < keys.length; i++) {
        var template = keys[i];
        var count = preset.num[template];
        for (var j = 0; j < count; j++) {
            var x = random(width);
            var y = random(height);
            entities.push(createEntity(x, y, templates[template]));
        }
    }
}



// Misc p5 functions

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    initEntities();
}

function initArrays(){
  var predDynamic = []; // array for the predator population 
  var preyDynamic = [];
  var humanDynamic = [];
  var foodDynamic = [];
  var totalDynamic = [];
}



// Misc functions

// Set position to inside map and adjust velocity
function bounceOffEdges(e) {
    var dv = -4;
    if (e.pos.x - e.radius < 0) {
        e.pos.x = e.radius;
        e.vel.x *= dv;
    }
    if (e.pos.x + e.radius > width) {
        e.pos.x = width - e.radius;
        e.vel.x *= dv;
    }
    if (e.pos.y - e.radius < 0) {
        e.pos.y = e.radius;
        e.vel.y *= dv;
    }
    if (e.pos.y + e.radius > height) {
        e.pos.y = height - e.radius;
        e.vel.y *= dv;
    }
}



function isOutsideMap(e) {
    return isOutsideRect(e.pos.x, e.pos.y, 0, 0, width, height);
}

// Clear dead entities from entities array
function removeDead(entities) {
    for (var i = entities.length - 1; i >= 0; i--) {
        var e = entities[i];
        if (e.alive) {
          continue
      }
        entities.splice(i, 1);
        e.onDeath(newEntities);
    }
}

//function toggleMenu() {
//    sidebarOpen = !sidebarOpen;
//    var m = document.getElementById('menu');
//    if (sidebarOpen && menuVisible) {
//        m.style.display = 'block';
//    } else {
//        m.style.display = 'none';
//    }
//}

// Main p5 functions



function draw() {
      presets = [
        {
            num: {
                food: foodPop[iteration],
                pred: preyPop[iteration],
                prey: predPop[iteration],
                human: humanPop[iteration]
            }
        }
    ];
  
    // Make background slightly transparent for motion blur
    background(0);
    
    var total = entities.length; // total population
    var totPred = getByName(entities, 'pred').length; // individual populations
    var totPrey = getByName(entities, 'prey').length;
    var totHuman = getByName(entities, 'human').length;
    var totFood = getByName(entities, 'food').length;
    
    totalDynamic = append(totalDynamic, total); // append the arrays for the total dynamics
    predDynamic = append(predDynamic, totPred); 
    preyDynamic = append(preyDynamic, totPrey);
    foodDynamic = append(predDynamic, totFood); 
    humanDynamic = append(preyDynamic, totHuman);

    if (random(5) < 1) {
        var x = random(width);
        var y = random(height);
        entities.push(createEntity(x, y, templates.food));
    }

    // Update and draw all entities
    for (var i = 0; i < entities.length; i++) {
        var e = entities[i];
        // Steering
        var visible = e.getVisible(entities);
        var names = e.toChase.concat(e.toEat).concat(e.toAvoid);
        var relevant = getByName(visible, names);
        var f;
        if (relevant.length === 0) {
            f = e.wander(newEntities);
        } else {
            f = e.steer(relevant, newEntities);
        }
        // Update
        e.applyForce(f.limit(e.accAmt));
        e.update();
        bounceOffEdges(e);
        if (isOutsideMap(e)) e.kill();
        e.hunger(newEntities);
        // Draw
        e.draw(lineMode, showPerception, showNutrition);
        // Misc
        e.onFrame(newEntities);
        // Eating
        var targets = getByName(visible, e.toEat);
        for (var j = 0; j < targets.length; j++) {
            var t = targets[j];
            if (e.contains(t.pos.x, t.pos.y)) e.onEatAttempt(t, newEntities);
        }
    }
    
    fill(255,255,255); // colour text
    text('Total Simulation Time: '+int(frameCount % (int(60*finalSimTime))/60)+'\nPredators: '+int(totPred)+'\nPrey: '+int(totPrey)+'\nFood: '+int(totFood)+'\nHumans: '+int(totHuman) +'\nIteration : ' + int(iteration), 10, 10);
    //text(predDynamic,50,50); // check that the predator dynamic array is being written to. 
    text(totalDynamic.length,100,100);
    
    removeDead(entities);
    entities = entities.concat(newEntities);
    newEntities = [];
    
    
    if(frameCount % (int(60*finalSimTime)) === 0){
      saveAsCSV();
      initArrays();
      iteration = iteration + 1;
      initEntities();
    }
    
    if(iteration > maxIteration) noLoop();
    
    
}








function saveAsCSV() {
  
  let simulationOutput = new p5.Table();
  let newRow = simulationOutput.addRow();
  
  simulationOutput.addColumn("Total Population");
  simulationOutput.addColumn("Human Population");
  simulationOutput.addColumn("Predator Population");
  simulationOutput.addColumn("Prey Population");
  simulationOutput.addColumn("Food Population");

  for(var i = 0; i<totalDynamic.length; i++){
    simulationOutput.addRow().setNum("Total Population", int(totalDynamic[i]));
    simulationOutput.setNum(i,"Human Population", int(humanDynamic[i]));
    simulationOutput.setNum(i,"Predator Population", int(predDynamic[i]));
    simulationOutput.setNum(i,"Prey Population", int(preyDynamic[i]));
    simulationOutput.setNum(i,"Food Population", int(foodDynamic[i]));
  }
 
  save(simulationOutput, month()+"/"+day()+"_T:"+hour()+":"+minute()+":"+second()+"_Simulation_Output.csv");
}
