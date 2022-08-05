function createEntity(x, y, template) {
    var e = new Entity(x, y);

    // Define max nutrition from nutrition if necessary
    if (
        typeof template.nutrition !== 'undefined' &&
        typeof template.maxNutrition === 'undefined'
    ) {
        e.maxNutrition = template.nutrition;
    }
    // Define nutrition from max nutrition if necessary
    if (
        typeof template.nutrition === 'undefined' &&
        typeof template.maxNutrition !== 'undefined'
    ) {
        e.nutrition = template.maxNutrition;
    }

    // Fill in all keys
    var keys = Object.keys(template);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        e[key] = template[key];
    }
    e.template = template;
    return e;
}


// Steering functions

function nearestTarget(entities, newEntities) {
    var sum = createVector(0, 0);

    // Pursuing a single target
    var targets = getByName(entities, this.toChase);
    if (targets.length > 0) {
        var e = this.getNearest(targets);
        if (e !== this) {
            if (chaseLines) {
                if (lineMode) {
                    stroke(255);
                } else {
                    stroke(this.color[0], this.color[1], this.color[2], 127);
                }
                line(e.pos.x, e.pos.y, this.pos.x, this.pos.y);
            }
            this.onChase(e, newEntities);
            sum.add(this.target(e, this.chasePriority));
        }
    }

    // Avoidance
    targets = getByName(entities, this.toAvoid);
    for (var i = 0; i < targets.length; i++) {
        var e = targets[i];
        if (e === this) continue;
        if (avoidLines) {
            if (lineMode) {
                stroke(255);
            } else {
                stroke(0, 0, 255);
            }
            line(e.pos.x, e.pos.y, this.pos.x, this.pos.y);
        }
        this.onAvoid(e, newEntities);
        sum.add(this.target(e, this.avoidPriority * -1));
    }
    
    return sum;
}

function multiTarget(entities, newEntities) {
    var sum = createVector(0, 0);

    // Pursuing targets
    var targets = getByName(entities, this.toChase);
    for (var i = 0; i < targets.length; i++) {
        var e = targets[i];
        if (e === this) continue;
        if (chaseLines) {
            if (lineMode) {
                stroke(255);
            } else {
                stroke(this.color[0], this.color[1], this.color[2], 191);
            }
            line(e.pos.x, e.pos.y, this.pos.x, this.pos.y);
        }
        this.onChase(e, newEntities);
        sum.add(this.target(e, this.chasePriority));
    }

    // Avoidance
    targets = getByName(entities, this.toAvoid);
    for (var i = 0; i < targets.length; i++) {
        var e = targets[i];
        if (e === this) continue;
        if (avoidLines) {
            if (lineMode) {
                stroke(255);
            } else {
                stroke(0, 0, 255);
            }
            line(e.pos.x, e.pos.y, this.pos.x, this.pos.y);
        }
        this.onAvoid(e, newEntities);
        sum.add(this.target(e, this.avoidPriority * -1));
    }

    return sum;
}


// Templates

var templates = {};

templates.food = {
    accAmt: 0,
    color: [135, 211, 124],
    name: 'food',
    topSpeed: 0,
    hunger: function() {}
};

templates.pred = {
    accAmt: 0.6,
    avoidPriority: 0.25,
    chasePriority: 4,
    color: [207, 0, 15],
    name: 'pred',
    nutrition: 250,
    perception: 150,
    radius: 12,
    steer: multiTarget,
    toAvoid: ['pred'],
    toChase: ['prey'],
    toEat: ['prey'],
    topSpeed: 4,
    onDeath: function(newEntities) {
        if (random(3) >= 2) return;
        var x = this.pos.x;
        var y = this.pos.y;
        newEntities.push(createEntity(x, y, templates.food));
    },
    onEatAttempt: function(e, newEntities) {
        this.vel.mult(0);
        if (random(5) >= 1) return;
        if (this.onEat(e, newEntities)) e.onEaten(this, newEntities);
    },
    onEat: function(e, newEntities) {
        if (this.eat(e)) {
            if (random(5) >= 1) return false;
            var x = this.pos.x + random(-20, 20);
            var y = this.pos.y + random(-20, 20);
            newEntities.push(createEntity(x, y, templates.pred));
        }
    }
};

templates.prey = {
    accAmt: 0.2,
    chasePriority: 1,
    avoidPriority: 0.5,
    color: [82, 179, 217],
    name: 'prey',
    nutrition: 400,
    perception: 100,
    radius: 8,
    steer: nearestTarget,
    toChase: ['food'],
    toEat: ['food'],
    toAvoid: ['pred', 'human'],
    onEat: function(e, newEntities) {
        if (this.eat(e)) {
            var x = this.pos.x + random(-20, 20);
            var y = this.pos.y + random(-20, 20);
            newEntities.push(createEntity(x, y, templates.prey));
        }
    }
};

templates.human = {
  // human
    accAmt: 0.25,
    avoidPriority: 0.75,
    chasePriority: 4,
    color: [207, 0, 255],
    name: 'human',
    nutrition: 300,
    perception: 150,
    radius: 13,
    steer: multiTarget,
    toAvoid: ['pred'],
    toChase: ['food','prey'], 
    toEat: ['food','prey'],
    topSpeed: 3.5, // not as fast as most predators, but faster than some prey. 
    onDeath: function(newEntities) {
        if (random(3) >= 2) return;
        var x = this.pos.x;
        var y = this.pos.y;
        newEntities.push(createEntity(x, y, templates.food));
    },
    onEatAttempt: function(e, newEntities) {
        this.vel.mult(0);
        if (random(5) >= 1) return;
        if (this.onEat(e, newEntities)) e.onEaten(this, newEntities);
    },
    onEat: function(e, newEntities) { // could add an aspect of 'mating' ie maybe could have a requirement of a human being close to mate. 
        if (this.eat(e)) {
            if (random(5) >= 1) return false;
            var x = this.pos.x + random(-20, 20);
            var y = this.pos.y + random(-20, 20);
            newEntities.push(createEntity(x, y, templates.human));
        }
    }
}
