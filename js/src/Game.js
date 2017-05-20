import React, { PropTypes, Component } from 'react';
import { render }  from 'react-dom';
import PF from 'pathfinding';
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
                fps: 50,
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

        // define scenery (ie the level backdrop)
        // 600 - 800 = traversables
        // 800 - 999 = scenery (non traversable)
        this.sceneryMap = [
            [800,600,600,600,600,600,600,600,600,600],
            [600,600,600,600,801,801,801,801,801,801],
            [801,801,601,801,801,600,600,600,600,600],
            [600,600,600,600,600,600,600,300,600,600],
            [600,600,600,600,600,600,600,600,600,600],
            [600,600,600,600,600,600,600,600,600,600],
            [600,600,600,600,600,600,600,600,600,800],
            [600,600,600,100,600,600,600,600,600,800],
            [600,600,600,600,600,600,600,600,800,800],
            [600,600,600,600,600,600,600,800,800,800]
        ];

        // objects are printed on top of the map, hence it requires its own array
        // 0 = empty
        // 100 - 300 = player objects
        // 300 - 600 = enemy objects
        this.objectMap = [
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

        this.statsTable = {};
    }

    addObject(id, gridX, gridY, stats) {
        this.objectMap[gridX][gridY] = id;
        this.statsTable[id] = stats;
        //console.log('added:'+this.statsTable[id].currentX)
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

            let tileContents = this.sceneryMap[gridY][gridX];
            if (tileContents < 300) {
                console.log('player selected or deselected a unit');
                // update local state to select this unit
            } else if (tileContents < 600) {
                console.log('attacking unit '+tileContents);
                // set destination for this unit
                // set target for this unit
            } else if (tileContents < 800) {
                console.log('moving to tile '+gridX, gridY);
                // set destination for this unit (the 100 is hardcoded for now)
                this.statsTable['100'].destinationX = gridX;
                this.statsTable['100'].destinationY = gridY;
                // empty the subdestination (so it will be recalculated)
                this.statsTable['100'].subDestinationX = null;
                this.statsTable['100'].subDestinationY = null;
            } else {
                console.log('can not go here');
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

    createScenery() {
        // to aid debugging, visualise the grid
        let x = 0;
        let y = 0;
        let color = 0;

        // note that currently entire grid is displayed. at some point, when grid is much larger, a partial projection should be accomplished
        // todo: consider moving away from using this grid to visualise the scenery and use a bitmap instead
        for (y; y < this.state.engine.height; y+= this.state.engine.tileHeight) {
            for (x; x < this.state.engine.width; x += this.state.engine.tileWidth) {
                switch (this.sceneryMap[y / this.state.engine.tileHeight][x / this.state.engine.tileWidth]) {
                    case 600:   color = '50, 150, 50'; break; // empty
                    case 800:   color = '88, 88, 88'; break; // scenery: stone
                    case 801:   color = '0, 0, 255'; break; // scenery: water
                    case 601:   color = '150, 40, 20'; break; // scenery: bridge
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

    createObjects() {
        let x = 0;
        let y = 0;
        let color = 0;
        let tileContent;

        // note that currently entire grid is displayed. at some point, when grid is much larger, a partial projection should be accomplished
        for (y; y < this.state.engine.height; y+= this.state.engine.tileHeight) {
            for (x; x < this.state.engine.width; x += this.state.engine.tileWidth) {
                tileContent = this.objectMap[y / this.state.engine.tileHeight][x / this.state.engine.tileWidth];

                switch (tileContent) {
                    case 300: color = '255, 0, 0'; break; // enemy
                    case 100: color = '255, 255, 0'; break; // player
                }

                // ofcourse, later bitmaps will be used instead
                if (tileContent > 0) {
                    //console.log('(re)creating object '+tileContent+' at x='+this.statsTable[tileContent].currentX+',y='+this.statsTable[tileContent].currentY);
                    this.createTile(
                        this.statsTable[tileContent].currentX,
                        this.statsTable[tileContent].currentY,
                        this.state.engine.tileWidth,
                        this.state.engine.tileHeight,
                        color
                    );
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

                // for debugging purposes: add a player and an enemy object
                this.addObject(
                    300,
                    3,
                    7,
                    {
                        destinationX: null,
                        destinationY: null,
                        subDestinationX: null,
                        subDestinationY: null,
                        currentX: 7 * this.state.engine.tileWidth,
                        currentY: 3 * this.state.engine.tileHeight,
                        speed: 1
                    }
                );
                this.addObject(
                    100,
                    7,
                    3,
                    {
                        destinationX: null,
                        destinationY: null,
                        subDestinationX: null,
                        subDestinationY: null,
                        currentX: 3 * this.state.engine.tileWidth,
                        currentY: 7 * this.state.engine.tileHeight,
                        speed: 5
                    }
                );
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
        // build up a new grid for pathfinding
        let grid = new PF.Grid(10, 10); // todo: make dynamic

        // loop through scenerymap to pick any intraversable tiles, add those to the grid
        this.sceneryMap.map(function (row, rowCount) {
            row.map((sceneryId, colCount) => {
                if (sceneryId >= 800) {
                    //console.log('adding '+rowCount+','+colCount+' to the grid array');
                    grid.setWalkableAt(colCount, rowCount, false); // x,y = col,row
                }
            })
        });

        // loop through objectmap to pick any intraversable tiles, add those to the grid
        this.objectMap.map(function (row, rowCount) {
            row.map((objectId, colCount) => {
                if (objectId > 0) {
                    //console.log('adding '+rowCount+','+colCount+' to the grid array');
                    grid.setWalkableAt(colCount, rowCount, false); //x,y = col,row
                }
            })
        });

        // for each object in objectMap, see if it has a destination set. if so, (re)calculate its path
        let breakThis = false;

        this.objectMap.map(function (row, rowCount) {
            row.map((objectId, colCount) => {
                if (objectId > 0) {
                    if (this.statsTable[objectId]) {
                        // copy stats by reference
                        let stats = this.statsTable[objectId];

                        if (stats['destinationX'] != null && stats['destinationY'] != null) {
                            // is destination not reached and no subdestination set? calculate it and set it so object can move to next subdestination further down
                            if (stats.subDestinationX == null || stats.subDestinationY == null) {
                                let finder = new PF.AStarFinder(); // add diagonal movement flag
                                let path = finder.findPath(colCount, rowCount, stats['destinationX'], stats['destinationY'], grid);
                                //console.log('new path set: '+path);

                                // take the first subdestination and store it in the stats table
                                //console.log('setting '+path[1]+' as new sub destination point');
                                stats.subDestinationX = path[1][0] * this.state.engine.tileWidth;
                                stats.subDestinationY = path[1][1] * this.state.engine.tileHeight;
                            }

                            // is destination set and subdestination too? movement
                            if (stats.subDestinationX != null && stats.subDestinationY != null) {
                                //console.log('moving '+objectId+' towards '+stats.subDestinationX,stats.subDestinationY);

                                let reached = false;
                                if (stats.currentX != stats.subDestinationX) {
                                    if (stats.currentX > stats.subDestinationX) {
                                        stats.currentX -= stats.speed;
                                        if (stats.currentX <= stats.subDestinationX) {
                                            reached = true;
                                        }
                                    } else {
                                        stats.currentX += stats.speed;
                                        if (stats.currentX >= stats.subDestinationX) {
                                            reached = true;
                                        }
                                    }
                                }

                                if (stats.currentY != stats.subDestinationY) {
                                    if (stats.currentY > stats.subDestinationY) {
                                        stats.currentY -= stats.speed;
                                        if (stats.currentY <= stats.subDestinationY) {
                                            reached = true;
                                        }
                                    } else {
                                        stats.currentY += stats.speed;
                                        if (stats.currentY >= stats.subDestinationY) {
                                            reached = true;
                                        }
                                    }
                                }

                                if (reached) {
                                    //rounding
                                    stats.currentX = stats.subDestinationX;
                                    stats.currentY = stats.subDestinationY;

                                    // update objectArray (it is now at a different tile)
                                    this.objectMap[rowCount][colCount] = 0;
                                    this.objectMap[stats.currentY/this.state.engine.tileHeight][stats.currentX/this.state.engine.tileWidth] = objectId;
                                    //console.log(this.objectMap);

                                    // reset subdestination
                                    stats.subDestinationX = null;
                                    stats.subDestinationY = null;

                                    if (
                                        (stats.destinationX*this.state.engine.tileWidth == stats.currentX) &&
                                        (stats.destinationY*this.state.engine.tileHeight == stats.currentY)
                                    ){
                                        //console.log('reached final destination');
                                        stats.destinationX = null;
                                        stats.destinationY = null;
                                    }

                                }
                            }
                        }
                    }
                }
            })
        }.bind(this));

        // before redrawing, wipe entire canvas
        ClearCanvas(this.state.context, this.state.engine.width, this.state.engine.height);

        // redraw entire grid (not sure how that can be optimised) including enemies and player
        this.createScenery();

        // redraw all objects (each one has its own id that can be looked up in a stats table to get values for destination, target, health, speed etc)
        this.createObjects()
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
