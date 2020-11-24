let mouse, mousePrevious;
let game, objects;

let slider;
let x = 0;

let instructionsButton;
let instructionsInput;

window.addEventListener("contextmenu", (e) => e.preventDefault());

function setup() {
    createCanvas(windowWidth, windowHeight);
    rectMode(CENTER);
    strokeWeight(2);
    noStroke();
    noSmooth();
    noLoop();

    mouse = createVector();
    mousePrevious = createVector();

    ({ game, objects } = setupGame(4));

    slider = createSlider(0, 15, 4, 1);
    slider.position(0, 0);
    slider.center("horizontal");
    slider.input(() => {
        ({ game, objects } = setupGame(slider.value()));
        loop();
    });

    instructionsButton = createButton("Instructions");
    instructionsButton.position(width - instructionsButton.size().width - 8, 5);
    instructionsButton.mousePressed(() => {
        instructionsInput.style("display", "block");
    });

    instructionsInput = createElement("textarea");
    instructionsInput.style("resize", "none");
    instructionsInput.style("background-color", "rgba(255, 255, 255, 0.3)");
    instructionsInput.style("position", "absolute");
    instructionsInput.style("top", "0");
    instructionsInput.style("right", "0");
    instructionsInput.size(width * 0.2, height * 0.96);
    instructionsInput.style("display", "none");
    instructionsInput.input((e) => {
        if (e.inputType == "insertLineBreak") {
            instructionsInput.style("display", "none");
            try {
                instructions(JSON.parse(instructionsInput.value()));
            } finally {
                instructionsInput.value("");
            }
        }
    });

    draw();
}

function setupGame(disks) {
    game = hanoi(disks);

    const colours = [];
    colorMode(HSB, 100);
    for (let i = 0; i < disks; i++) {
        colours.push(color(map(i, 0, disks, 0, 100), 80, 100));
    }
    colorMode(RGB);

    objects = game.flatMap((stack, pos) => {
        const stick = {
            type: "stick",
            x: floor((width * (pos + 1)) / 4),
            y: floor(height * 0.7),
            w: floor(width * 0.01),
            h: floor(height * 0.4),
            colour: 255,
        };
        return [
            stick,
            ...stack.map((disk, pos) => ({
                type: "disk",
                size: disk,
                x: stick.x,
                y: stick.y + floor(stick.h / 2 - pos * stick.w * 2.5),
                w: floor(map(disk, 0.999999999, disks, width * 0.05, width * 0.2)),
                h: floor(stick.w * 2.5),
                // colour: colours.splice(floor(random(0, colours.length)), 1)[0],
                colour: colours.splice(0, 1)[0],
                selectable: pos == stack.length - 1,
            })),
        ];
    });

    return { game, objects };
}

function update(game, objects) {
    const tops = game.map((stack) => (stack.length > 0 ? stack[stack.length - 1] : 0));
    const sticks = objects.filter((obj) => obj.type == "stick");

    const unchanged = [
        ...sticks,
        ...objects.filter(
            (obj) =>
                obj.type == "disk" &&
                obj.x == sticks[game.findIndex((stack) => stack.includes(obj.size))].x
        ),
    ];
    const changed = objects.filter((obj) => !unchanged.includes(obj));

    return [
        ...unchanged,
        ...changed.map((obj) => {
            const stickIndex = game.findIndex((stack) => stack.includes(obj.size));
            const stick = sticks[stickIndex];
            return {
                ...obj,
                x: stick.x,
                y:
                    stick.y +
                    floor(stick.h / 2 - game[stickIndex].indexOf(obj.size) * stick.w * 2.5),
            };
        }),
    ].map((obj) => ({
        ...obj,
        selectable: tops.includes(obj.size),
    }));
}

function draw() {
    background(51);

    for (const obj of objects) {
        if (obj.hovered) {
            stroke(0);
        } else {
            noStroke();
        }
        fill(obj.colour);
        rect(obj.x, obj.y, obj.w, obj.h, obj.h * 0.2);
    }
    // console.log("Drawn.");

    if (x > 0) {
        fill(255, 0, 0, x);
        push();
        translate(width * 0.5, height * 0.3);
        rotate(QUARTER_PI);
        rect(0, 0, width * 0.02, height * 0.3);
        rotate(HALF_PI);
        rect(0, 0, width * 0.02, height * 0.3);
        pop();
        x -= 5;
    } else {
        noLoop();
    }
}

function mouseMove(fn) {
    mouse.set(mouseX, mouseY);
    fn();
    mousePrevious.set(mouse);
}

function mouseMoved() {
    mouseMove(() => {
        let shouldDraw;

        const selectable = objects.filter((obj) => obj.selectable);
        const hovered = selectable.find((obj) => intersect(obj, mouse));
        const wasHovered = selectable.find((obj) => obj.hovered);
        if (hovered && !hovered.hovered) {
            shouldDraw = true;
            cursor("POINTER");
            hovered.hovered = true;
        }
        if (!hovered && wasHovered) {
            shouldDraw = true;
            cursor();
            wasHovered.hovered = false;
        }

        if (shouldDraw) {
            loop();
        }
    });
}

function mouseDragged() {
    if (mouseButton == LEFT) {
        mouseMove(() => {
            let shouldDraw;

            const selected = objects.find((obj) => obj.selected);
            if (selected) {
                shouldDraw = true;
                const moved = p5.Vector.sub(mouse, mousePrevious);
                selected.x += moved.x;
                selected.y += moved.y;

                const sticks = objects.filter((obj) => obj.type == "stick");
                const intersecting = sticks.find((stick) => intersect(stick, selected));
                const wasHovered = sticks.find((stick) => stick.hovered);
                if (intersecting) {
                    intersecting.hovered = true;
                } else if (wasHovered) {
                    wasHovered.hovered = false;
                }
            }

            if (shouldDraw) {
                loop();
            }
        });
    }
}

function mousePressed() {
    if (mouseButton == LEFT) {
        let shouldDraw;
        const hovered = objects.find((obj) => obj.hovered && obj.type == "disk");
        if (hovered) {
            shouldDraw = true;

            hovered.hovered = false;
            hovered.selected = true;
            hovered.xPrevious = hovered.x;
            hovered.yPrevious = hovered.y;
        }

        if (shouldDraw) {
            loop();
        }
    }
}

function mouseReleased() {
    if (mouseButton == LEFT) {
        let shouldDraw;

        const selected = objects.find((obj) => obj.selected);
        if (selected) {
            shouldDraw = true;
            selected.selected = false;
            cursor();

            const sticks = objects.filter((obj) => obj.type == "stick");
            const intersecting = sticks.find((stick) => stick.hovered);
            if (intersecting) {
                const from = sticks.findIndex((stick) => stick.x == selected.xPrevious);
                const to = sticks.findIndex((stick) => stick == intersecting);

                intersecting.hovered = false;
                if (from != to) {
                    game = move(game, from, to);
                    objects = update(game, objects);
                } else {
                    selected.x = selected.xPrevious;
                    selected.y = selected.yPrevious;
                }
            } else {
                selected.x = selected.xPrevious;
                selected.y = selected.yPrevious;
            }
        }

        if (shouldDraw) {
            loop();
        }
    }
}

function intersect(a, b) {
    return (
        a.x + (a.w || 0) / 2 > b.x - (b.w || 0) / 2 &&
        a.x - (a.w || 0) / 2 < b.x + (b.w || 0) / 2 &&
        a.y + (a.h || 0) / 2 > b.y - (b.h || 0) / 2 &&
        a.y - (a.h || 0) / 2 < b.y + (b.h || 0) / 2
    );
}

function drawX() {
    x = 255;
    loop();
}

function instructions(ins, delay) {
    if (ins.length > 0) {
        doInstruction(...ins.splice(0, 1)[0]);
        setTimeout(instructions, delay, ins);
    }
}

function doInstruction(from, to) {
    game = move(game, from, to);
    objects = update(game, objects);
    loop();
}
