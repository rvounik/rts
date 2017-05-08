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
                fps: 25,
                width: 800,
                height: 600
            },
            player: {
                x: 0,
                y: 0,
                rotation: 0
            }
        };

        // localise some globals
        this.timer = new Date().getTime();
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

    addPlayer() {

    }

    // checks if there is a reason to mutate from the current gameState to another
    validateGameState(gameState) {
        let newGameState = gameState;

        switch (gameState) {
            case 'init' :
                this.addPlayer();
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
        const context = this.state.context;

        // update positions etc

        ClearCanvas(context, this.state.engine.width, this.state.engine.height);
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
