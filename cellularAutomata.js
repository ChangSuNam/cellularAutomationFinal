//cellular automata library: https://cdn.jsdelivr.net/npm/p5@1.1.9/lib/p5.js

//create variables for drawing the matrix. rows and cols, the number of rows and columns to be drawn
let rows = 10
let cols = 10
let totalCell = rows*cols
let grid = createGrid()
let frameRateConst = 2//higher the rate, faster the rounds

//create variables for audioCtx and analyser. 
let audioCtx = new (window.AudioContext||window.webkitAudioContext);
let analyser = audioCtx.createAnalyser() 
analyser.fftSize = 512; //set FFT frequency domain as 512
let bufferSize = analyser.frequencyBinCount// half the fft size
let dataArray = new Uint8Array(bufferSize) // array with half the fft size
let gainNode
let modulatorFreq
let carrier

//create variables to regulate modes and stages of the game 
let isPlaying = false
let isFirstPlay = true
let waveform = "sine"//default waveform, sine
let drawMode = "gol" //default drawing mode, game of life


//draw the matrix
function createGrid() {
  let result = []
  for (let i = 0; i < rows; i++) {
    let row = [] 
    for (let j = 0; j < cols; j++) {
      row.push(false)
    }
    result.push(row)
  }
  return result
}

// initialize audio
function initAudio() {
  carrier = audioCtx.createOscillator()
  carrier.type = waveform

  modulatorFreq = audioCtx.createOscillator()
  gainNode = audioCtx.createGain()
  gainNode.gain.value = 90
  modulatorFreq.frequency.value = 170

  modulatorFreq.connect(gainNode)
  gainNode.connect(carrier.frequency)

  carrier.connect(analyser)
  analyser.connect(audioCtx.destination)
  
  carrier.start()
  modulatorFreq.start()

  mod3Osc = audioCtx.createOscillator()
  mod3Osc.frequency.setValueAtTime(0,audioCtx.currentTime)
  mod3Osc.connect(audioCtx.destination)
  mod3Osc.start()
}

//change gain and frequency based on frequencyFactor, updated every round with number of living cells
function setFrequency(freqFactor){
  modulatorFreq.frequency.value = freqFactor*50
  gainNode.gain.value = freqFactor*50
} 

//change waveform for oscillator, updated every round if a living cell is touching any of the 4 walls.
function setSynthMode(){
  carrier.type = waveform
}

//change draw mode 
function changeDrawMode(){
  if(drawMode == "gol"){
    drawMode = "analyser"    
  }else{
    drawMode = "gol"
  }
}

//determine next board's state
function getNextBoard() {
  let newGrid = createGrid()
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Counts the number of alive neighbors
      let directions = [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]]
      let aliveNeighborCount = 0
      for(curDir of directions){
        let neighborRow = i + curDir[0]
        let neighborCol = j + curDir[1]
        if (neighborRow >= 0 && neighborCol >= 0 && neighborRow < rows && neighborCol < cols) {
          if(grid[neighborRow][neighborCol]){
            aliveNeighborCount++
          }
        }
      }
      // Decide whether or not the new cell is alive or dead
      if(grid[i][j]) {
        if(aliveNeighborCount==2||aliveNeighborCount==3){
          newGrid[i][j] = true
        }
      }else{
        newGrid[i][j] = (aliveNeighborCount == 3)
      }
    }
  }
  grid = newGrid
}
 

//initial set up for canvas
function setup() {
  let height = 1000
  createCanvas(height * cols/rows, height)
  frameRate(frameRateConst)//set frame rate, default as 2, increases if more cells alive
}
 
function draw() {

  if (drawMode == "analyser"){ // display oscilloscope
    const canvas = document.querySelector('canvas');
    const canvasCtx = canvas.getContext('2d');
    analyser.getByteTimeDomainData(dataArray); 
    canvasCtx.fillStyle = "rgb(200, 200, 200)";
    canvasCtx.fillRect(0, 0, height * cols/rows, height);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";
    canvasCtx.beginPath();
    const sliceWidth = (height * cols/rows) / bufferSize;
    let x = 0;
    for (let i = 0; i < bufferSize; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * (height / 2);
    
      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }
      x += sliceWidth;
    }
    canvasCtx.lineTo((height * cols/rows), height / 2);
    canvasCtx.stroke();
  
  }
  else{ //display game of life
    background(255)
    let currentCount = 0 // count for living cells
    let mode = [] // array to add waveform
    // Display the grid
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if(grid[i][j]){
          if(i==0){//row ==0, add sine as potential waveform
            mode.push("sine")
          }
          if(i==rows-1){//row == max, add sawtooth as potential waveform
            mode.push("sawtooth")
          }
          if(j==0){//col ==0, add triangle as potential waveform
            mode.push("triangle")
          }
          if(j==cols-1){//col ==max, add square as potential waveform
            mode.push("square")
          }
          if(mode.length >=1){//choose one of the waveform
          waveform = mode[Math.floor(Math.random() * mode.length)]
          }
          if(  (i+j)%3 ==0 && isPlaying  ){
            mod3Osc.frequency.setValueAtTime((i+j)*70,audioCtx.currentTime)
          }
          if(  (i+j)%3 ==1 && isPlaying ){
            mod3Osc.frequency.setValueAtTime((i+j)*35,audioCtx.currentTime)
            mod3Osc.connect(audioCtx.destination)
          }

          currentCount++ 
          fill(0)
          rect(j/cols * width, i/rows * height, width/cols, height/rows)
        }
      }
    }
  
    if(currentCount ==0 && !isFirstPlay){//when all cells dead, create a sound effect
      carrier.stop()
      let osc1 = audioCtx.createOscillator()
      let osc2 = audioCtx.createOscillator()
      let osc3 = audioCtx.createOscillator()
      let osc4 = audioCtx.createOscillator()
      let osc5 = audioCtx.createOscillator()
      oscillatorList = [osc1, osc2, osc3, osc4, osc5]
      
      let globalGain = audioCtx.createGain()
      globalGain.gain.value =50; 
      globalGain.connect(audioCtx.destination);
      
      for (let i=0; i<oscillatorList.length;i++){
        oscillatorList[i].type = "triangle"
        oscillatorList[i].frequency.value = (i+1)*10 
        oscillatorList[i].connect(globalGain) 
        oscillatorList[i].start()
      }  
      globalGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.8) 
      isFirstPlay = true
    }

    frameRateConst = 2 + (currentCount/totalCell)*20 //change frame rate with living cells to total cell ratio.

    if(isPlaying){ 
      setFrequency(currentCount)
      setSynthMode(waveform)
      frameRate(frameRateConst)
    }
    
    // Horizontal grid lines
    stroke(200);
    for (let i = 0; i <= rows; i++) {
      line(0, i/rows * height, width, i/rows * height)
    }
  
    // Vertical grid lines
    for (let i = 0; i <= cols; i++) {
      line(i/cols * width, 0, i/cols * width, width)
    }

    if (isPlaying) {
      getNextBoard()
    }
  }//else ends
}
 
function mouseClicked() {
  let row = Math.floor(mouseY/height * rows)
  let col = Math.floor(mouseX/width * cols)
  if (row >= 0 && col >= 0 && row < rows && col < cols) {
    grid[row][col] = !grid[row][col]
  }
}


let playButton = document.querySelector(".playButton")
playButton.addEventListener("click", function(){
  if(isFirstPlay){
    initAudio()
    isFirstPlay = false
  }
  isPlaying = !isPlaying
  if(isPlaying) {
    playButton.textContent = "Pause"
    audioCtx.resume();
  }else{
    playButton.textContent = "Play"
    audioCtx.suspend();
    //carrier.stop()
  }
});

let resetButton = document.querySelector(".resetButton")
resetButton.addEventListener("click", function() {
  location.reload()
});

let changeModeButton = document.querySelector(".changeModeButton")
changeModeButton.addEventListener("click", function() {
  if(drawMode == "analyser") {
    changeModeButton.textContent = "Pause and view current oscilloscope"
  }else{
    changeModeButton.textContent = "Resume game of life"
  }
  changeDrawMode()
});
