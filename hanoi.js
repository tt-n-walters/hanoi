function hanoi(disks) {
    const game = [[], [], []];
    for (let i = disks; i > 0; i--) {
        game[0].push(i);
    }
    return game;
}

function move(game, from, to) {
    if (game[from].length > 0) {
        const disk = game[from][game[from].length - 1];
        const dest = game[to];

        if (dest.length == 0 || disk < dest[dest.length - 1]) {
            // console.log(`Moved disk ${disk} from ${from} to ${to}.`);
            game[to].push(game[from].pop());
        } else {
            // console.log(`Cannot place disk ${disk} on stick ${to}, disk ${dest[dest.length - 1]} is already there.`);
        }
    } else {
        // console.log(`No disk on stick ${from}. Cannot move.`);
    }

    return game;
}
