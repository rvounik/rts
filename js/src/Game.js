import React, { PropTypes, Component } from 'react';
import { render }  from 'react-dom';
import update from 'immutability-helper';

import ClearCanvas from './helpers/ClearCanvas'

class Game extends Component {
    constructor(props) {
        super(props);

        // global state
        this.state = {
            context: null,
            debug: true,
            gameState: 'init',
            engine: {
                fps: 3,
                width: 500,
                height: 500,
                tileWidth: 50,
                tileHeight: 50
            },
            player: {
                x: 300,
                y: 200,
                rotation: 0
            }
        };

        // localise some globals
        this.timer = new Date().getTime();
        this.playfieldArray = [
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0]

        ];
    }

    componentDidMount() {
        // component mounted: set context of canvas element (will also trigger re-render and thus invoke update method)
        this.setState({ context: document.getElementById('canvas').getContext('2d') });

        // register reusable global window event listener for click events
        window.addEventListener('click', (event) => {this.clickWithinBoundsHandler(event)});
    }

    componentDidUpdate() {
        // trigger update (when state changes)
        this.update();
    }

    // helper function that checks whether user clicked within an active boundary range todo: extract to helper
    clickWithinBoundsHandler(event){
        const offsetLeft = document.getElementById("canvas").offsetLeft;
        const offsetTop = document.getElementById("canvas").offsetTop;

        if (
            event.clientX - offsetLeft >= this.bounds.xMin
            && event.clientX - offsetLeft <= this.bounds.xMax
            && event.clientY - offsetTop >= this.bounds.yMin
            && event.clientY - offsetTop <= this.bounds.yMax
        ) {
            // executes the action that was registered for these boundaries, then resets them
            this.bounds.action();
            this.bounds = {};
        }
    }

    updateGameState(newGameState) {
        let newState = update(this.state, {
            gameState: {
                $set: newGameState
            }
        });

        this.setState(newState);
    }

    createVisibleDebugGrid() {
        // to aid debugging, visualise the grid
        let x = 0;
        let y = 0;

        for (y; y < this.state.engine.height; y+= this.state.engine.tileHeight) {
            for (x; x < this.state.engine.width; x += this.state.engine.tileWidth) {
                this.createTile(x+1, y+1, this.state.engine.tileWidth-2, this.state.engine.tileHeight-2, '255, 255, 255')
            }
            x = 0;
        }
    }

    createTile(x, y, w, h, fillColour) {
        const context = this.state.context;
        context.beginPath();
        context.rect(x, y, w, h);
        context.fillStyle = 'rgba('+fillColour+', 1)';
        context.fill();
    }

    createScenery() {
    }

    createEnemies() {
    }

    createPlayer() {
        this.createTile(this.state.player.x , this.state.player.y, this.state.engine.tileWidth, this.state.engine.tileHeight, '0, 255, 0');
    }

    setNewPlayerDestination() {
        // todo: why only fired once?

        const offsetLeft = document.getElementById("canvas").offsetLeft;
        const offsetTop = document.getElementById("canvas").offsetTop;
        let mouseX = event.clientX - offsetLeft;
        let mouseY = event.clientY - offsetTop;

        console.log('new position set to '+mouseX,mouseY+' which translates to tile '
            +Math.floor(mouseX/this.state.engine.tileWidth)
            ,Math.floor(mouseY/this.state.engine.tileHeight)
        );
    }

    // checks if there is a reason to mutate from the current gameState to another
    validateGameState(gameState) {
        let newGameState = gameState;

        switch (gameState) {
            case 'init' :
                // draw titlescreen and await user clicking on start
                // todo: add

                // after clicking start, the following handler should be initialised ONCE. for convenience it is now run just once here:
                this.bounds = {
                    xMin: 0,
                    xMax: 500,
                    yMin: 0,
                    yMax: 500,
                    action: function() {
                        this.setNewPlayerDestination(
                            this.state.player.x,
                            this.state.player.y,
                            this.state.player.rotation
                        )
                    }.bind(this)
                };

                // advance to game state
                this.updateGameState('game');
                break;
            case 'game' :
                break;
            default :
                console.log('invalid game state encountered');
                break;
        }

        if (newGameState != gameState) {
            this.updateGameState(newGameState);
        }
    }

    updateInGameProjection() {
        ClearCanvas(this.state.context, this.state.engine.width, this.state.engine.height);

        this.state.player.y-=1; // normally this is handled a bit more intelligent and is determined by player-set endpoint

        this.createVisibleDebugGrid(); // todo: remove eventually
        this.createScenery();
        this.createEnemies();
        this.createPlayer();
    }

    update() {
        if (this.timer + (1000 / this.state.engine.fps) < new Date().getTime()) {

            // check if gameState still valid
            this.validateGameState(this.state.gameState);

            // update bitmaps, rotation, position, scale of the maskedBitmapLines according to player' position
            if (this.state.gameState == 'game') {
                this.updateInGameProjection();
            }

            // increment timer
            this.timer = new Date().getTime();
        }

        // trigger update (on every frame)
        requestAnimationFrame(() => { this.update() });
    }

    render() {
        return (
            <div>
                <canvas id = 'canvas'
                    width = { this.state.engine.width }
                    height = { this.state.engine.height }
                >Oh no! Canvas is not supported on your device :(</canvas>
            </div>
        )
    }
}

export default Game;
