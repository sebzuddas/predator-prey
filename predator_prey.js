var entities;
var newEntities;
var selected = 'prey';
var predDynamic = []; // array for the predator population 
var preyDynamic = [];
var humanDynamic = [];
var foodDynamic = [];
var totalDynamic = [];

var presets = [
    {
        num: {
            food: 30,
            pred: 10,
            prey: 20,
            human: 5
        },
        custom: []
    }
];
var currentPreset = 0;

var avoidLines = true;
var chaseLines = true;
var lineMode = false;
var motionBlur = false;
var showChart = false;
var showNutrition = false;
var showPerception = false;
var menuVisible = true;
var sidebarOpen = true;


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

// function for initiating entities on the whole based on the presets. 
function initEntities() {
    entities = [];
    newEntities = [];
    // Setup map from preset
    var preset = presets[currentPreset];
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

function isOutsideMap(e) {
    return isOutsideRect(e.pos.x, e.pos.y, 0, 0, width, height);
}

// Draw pie chart to show ratio of each type of entity
function pieChart(entities) {
    var total = getByName(entities, [
        'food', 'prey', 'pred', 'hive', 'swarm', 'fungus'
    ]).length;
    var nums = [
        getByName(entities, 'food').length,
        getByName(entities, 'prey').length,
        getByName(entities, ['hive', 'swarm']).length,
        getByName(entities, 'pred').length,
        getByName(entities, 'fungus').length,
    ];
    var colors = [
        templates.food.color, templates.prey.color, templates.swarm.color,
        templates.pred.color, templates.fungus.color
    ];
    
    // Calculate angles
    var angles = [];
    for (var i = 0; i < nums.length; i++) {
        angles[i] = nums[i] / total * TWO_PI;
    }

    // Draw pie chart
    var diam = 150;
    var lastAngle = 0;
    for (var i = 0; i < angles.length; i++) {
        if (angles[i] === 0) continue;
        // Arc
        fill(colors[i].concat(191));
        noStroke();
        arc(width - 100, 100, diam, diam, lastAngle, lastAngle + angles[i]);
        lastAngle += angles[i];
    }
}

// Clear dead entities from entities array
function removeDead(entities) {
    for (var i = entities.length - 1; i >= 0; i--) {
        var e = entities[i];
        if (e.alive) continue;
        entities.splice(i, 1);
        e.onDeath(newEntities);
    }
}

function toggleMenu() {
    sidebarOpen = !sidebarOpen;
    var m = document.getElementById('menu');
    if (sidebarOpen && menuVisible) {
        m.style.display = 'block';
    } else {
        m.style.display = 'none';
    }
}

// Main p5 functions

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
    initEntities();
    //saveCSVBtn = createButton("Save test");
    //saveCSVBtn.position(width-50, height-50);
    //saveCSVBtn.mousePressed(saveAsCSV);
}

function draw() {
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

    //// Restart if there are not too many entities or too few dynamic entities
    //var numDynamic = getByName(entities, [
    //    'pred', 'prey', 'human', 
    //]).length;
    //if (total <= 0 || total > 1200 || numDynamic === 0) initEntities(); // initEntities(); restarts the simulation. 
    // Randomly spawn food on map

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
    
    fill(255,255,255); // make text white 
    text('Total Simulation Time: '+int(simTime())+'\nPredators: '+int(totPred)+'\nPrey: '+int(totPrey)+'\nFood: '+int(totFood)+'\nHumans: '+int(totHuman), 10, 10);
    //text(predDynamic,50,50); // check that the predator dynamic array is being written to. 
    text(totalDynamic.length,100,100);
    
    removeDead(entities);
    entities = entities.concat(newEntities);
    newEntities = [];
    simulationTime = int(simTime());
    
    if(simulationTime === 10){
      saveAsCSV();
      noLoop();
    }
    
}


// Misc p5 functions

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    initEntities();
}

function simTime(){
return millis()/1000;  
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
  noLoop()
}

//function saveAstxt(){
//  let textToSave = [];
//  for(var i = 0; i<totalDynamic.length; i++){
//    textToSave[i] =int(totalDynamic[i]);
//  }
//  for(var j = 0; j<totalDynamic.length; j++){
//    textToSave[j] =int(totalDynamic[j]);
//  }
//  save(textToSave,  month()+"/"+day()+"_T:"+hour()+":"+minute()+":"+second()+"_Simulation_Output.txt");
//}
