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
                fps: 5,
                width: 500,
                height: 500,
                tileWidth: 50,
                tileHeight: 50
            },
            player: {
                x: 200,
                y: 300,
                rotation: 0
            }
        };

        // localise some globals
        this.debug = true;
        this.timer = new Date().getTime();

        // todo: redo tiletypes as follows:
        /* 100 - 300 = player objects
         300 - 600 = enemy objects
         600 - 800 = traversables
         800 - 999 = scenery (non traversable)
         */

        this.playfieldArray = [
            [1,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,2,2,2,2,2,2],
            [2,2,3,2,2,0,0,0,0,0],
            [0,0,0,0,0,0,0,100,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,1],
            [0,0,0,255,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,0,1,1],
            [0,0,0,0,0,0,0,1,1,1]

        ];
    }

    componentDidMount() {
        // component mounted: set context of canvas element (will also trigger re-render and thus invoke update method)
        this.setState({ context: document.getElementById('canvas').getContext('2d') });

        // register reusable global window event listener for click events
        window.addEventListener('click', (event) => {this.clickHandler(event)});
    }

    componentDidUpdate() {
        // trigger update (when state changes)
        this.update();
    }

    // click handler
    clickHandler(event){
        const offsetLeft = document.getElementById("canvas").offsetLeft;
        const offsetTop = document.getElementById("canvas").offsetTop;

        // get clicked coords relative to grid
        let mouseX = event.clientX - offsetLeft;
        let mouseY = event.clientY - offsetTop;

        // make sure user clicks within bounds
        if(mouseX < 0 || mouseX > this.state.engine.width || mouseY < 0 || mouseY > this.state.engine.height) {
            console.log('out of bounds');
        } else {

            // get value of grid that is at that position
            let gridX = Math.floor(mouseX / this.state.engine.tileWidth);
            let gridY = Math.floor(mouseY / this.state.engine.tileHeight);

            switch (this.playfieldArray[gridY][gridX]) {
                case 1:
                case 2:
                    console.log('cannot go to ' + gridX, gridY);
                    break;
                case 100:
                    console.log('attacking enemy unit at ' + gridX, gridY);
                    break;
                case 255:
                    console.log('player selected or deselected (later)');
                    break;
                default:
                    console.log('moving towards tile ' + gridX, gridY)
            }
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

    createPlayField() {
        // to aid debugging, visualise the grid
        let x = 0;
        let y = 0;
        let color = 0;

        // note that currently entire grid is displayed. at some point, when grid is much larger, a partial projection should be accomplished
        for (y; y < this.state.engine.height; y+= this.state.engine.tileHeight) {
            for (x; x < this.state.engine.width; x += this.state.engine.tileWidth) {
                switch (this.playfieldArray[y/this.state.engine.tileHeight][x/this.state.engine.tileWidth]) {
                    case 0:   color = '50, 150, 50'; break; // empty
                    case 1:   color = '88, 88, 88'; break; // scenery: stone
                    case 2:   color = '0, 0, 255'; break; // scenery: water
                    case 3:   color = '150, 40, 20'; break; // scenery: bridge
                    case 100: color = '255, 0, 0'; break; // enemy
                    case 255: color = '255, 255, 0'; break; // player
                }
                if (this.debug) {
                    this.createTile(x + 1, y + 1, this.state.engine.tileWidth - 2, this.state.engine.tileHeight - 2, color); // uses slighyly smaller shapes so a grid is simulated
                } else {
                    this.createTile(x, y, this.state.engine.tileWidth, this.state.engine.tileHeight, color);
                }
            }
            x = 0;
        }
    }

    // creates basic rect shape object. should at some point be rewritten to support bitmaps
    createTile(x, y, w, h, fillColour) {
        const context = this.state.context;
        context.beginPath();
        context.rect(x, y, w, h);
        context.fillStyle = 'rgba('+fillColour+', 1)';
        context.fill();
    }

    // checks on every tick if there is a reason to mutate from the current gameState to another
    validateGameState(gameState) {
        let newGameState = gameState;

        switch (gameState) {
            case 'init' :
                // todo: add titlescreen
                // todo: have it advance to game state on click
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

    // here the magic happens. every enemy updates its main target, sub target, rotation, attack. and sub target for player is (re)calculated
    updateInGameProjection() {
        ClearCanvas(this.state.context, this.state.engine.width, this.state.engine.height);

        // redraw entire grid (not sure how that can be optimised) including scenery, enemies, player
        this.createPlayField();

        // note that each destructible element should have a unique id that can be looked up in a stats table that holds it lifecycle stats, position, targets etc
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

        // trigger update again (on every frame)
        requestAnimationFrame(() => { this.update() });
    }

    render() {
        return (
                <canvas id = 'canvas'
                    width = { this.state.engine.width }
                    height = { this.state.engine.height }
                >Oh no! Canvas is not supported on your device :(</canvas>
        )
    }
}

export default Game;
