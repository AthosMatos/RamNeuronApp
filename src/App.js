import React, { useEffect, useRef, useState } from "react";

function App() 
{
  const [canvas,setCanvas] = useState()
  const [canvasGrid,setcanvasGrid] = useState()
  const [canvasComputingGrid,setcanvasComputingGrid] = useState()

  const [segAmount,setsegAmount] = useState(4)
  const [TrainedTuplas,setTrainedTuplas] = useState(0)

  const [segCanvasCtx,setSegCanvasCtx] = useState()
  const [gridCanvasCtx,setGridCanvasCtxCanvasCtx] = useState()
  const [canvasComputingGridCtx,setcanvasComputingGridCtx] = useState()

  const [NeuronTrainPorcentage,setNeuronTrainPorcentage] = useState(0)
  const [NeuronTrainAmount,setNeuronTrainAmount] = useState(0)
  const [currentLetter,setCurrentLetter] = useState('V')

  const [canvasOffsetX,setcanvasOffsetX] = useState(0)
  const [canvasOffsetY,setcanvasOffsetY] = useState(0)

  const [isPainting,setisPainting] = useState(false)
  const [calcFinal,setcalcFinal] = useState('')
  const [probLetter,setprobLetter] = useState('')

  const canvasRef = useRef()
  const canvasGridRef = useRef()
  const canvasAsSeeRef = useRef()

  const DrawlineWidth = 10;

  const canvasSize = 300

  let showGrid = true
  let SegmentationSize = 4
  let Discriminators = []
  let lettersData = {}
  let lettersAnalyzed = []
  let nextSegH = undefined
  let intervalMS = 60
  let NeuronIndex = 0
  let currentButton = 'V'

  useEffect(()=>
  {
    if(canvasRef.current && canvasGridRef.current)
    {
      setCanvas(canvasRef.current)
      setcanvasGrid(canvasGridRef.current)
      setcanvasComputingGrid(canvasAsSeeRef.current)
    }
  },[canvasGridRef.current,canvasRef.current,canvasAsSeeRef.current])

  useEffect(()=>
  {
    if(canvas && canvasGrid && canvasComputingGrid)
    {
      setSegCanvasCtx(canvas.getContext("2d",{willReadFrequently: true}))
      setGridCanvasCtxCanvasCtx(canvasGrid.getContext("2d",{willReadFrequently: true}))
      setcanvasComputingGridCtx(canvasComputingGrid.getContext("2d",{willReadFrequently: true}))

      setcanvasOffsetX(canvas.offsetLeft)
      setcanvasOffsetY(canvas.offsetTop)
    }
  },[canvasGrid,canvas,canvasComputingGrid])

  useEffect(()=>
  {
    if(segCanvasCtx && gridCanvasCtx && canvasComputingGridCtx)
    {
      SegmentationAnalysis()
      GridRender()
    }
  },[segCanvasCtx,gridCanvasCtx,canvasComputingGridCtx])

  const isBackGround = (pixel) =>
  {
    //0.1
    const greyColor = 220
    const whiteColor=255
    
    for(let i=0;i<pixel.data.length-1;i++)
    {
      //console.log(pixel.data[0])
      if((pixel.data[i] != greyColor) && (pixel.data[i] != whiteColor)) return false
    }
    return true
  }

  function CleanCanvas()
  {
    const [w, h] = [canvas.width, canvas.height];

    segCanvasCtx.clearRect(0, 0, w, h);  
    segCanvasCtx.fillRect(0, 0, w, h);
  }

  function VerificarImg(DecimalLine,Equals)
  {
    function setEquals(key,isOn)
    {
      switch (key) {
        case 0:
         {
          if(isOn)Equals.V++ 
          break
         }
        case 1:
        {
          if(isOn)Equals.W++
          break
        }
        case 2:
        {
          if(isOn)Equals.X++
          break
        }
        case 3:
        {
          if(isOn)Equals.Z++
          break
        }
      }
    }

    if(NeuronIndex == Discriminators.length)NeuronIndex=0

    for(let i2=0;i2<lettersAnalyzed.length;i2++)
    {
      //console.log(`lettersData ${lettersAnalyzed[i]}`,lettersData[lettersAnalyzed[i]])
      const letterIndex = lettersData[lettersAnalyzed[i2]][NeuronIndex]
      for(let i = 0;i<letterIndex.length;i++)
      {
        if(letterIndex[i] == DecimalLine) 
        {
          setEquals(i2,true)
          break
        }
        else
        {
          setEquals(i2,false)
        }
      }
    }
    
    //console.log('NeuronIndex',NeuronIndex)
    //console.log('Discriminators',Discriminators[NeuronIndex])
    //console.log('ImgMatrix',ImgMatrix)

    if(NeuronIndex<Discriminators.length)NeuronIndex++
    //console.log('Equals',Equals)
    
    return Equals
  }

  function AnalyzeImg(trainedDataSet,myTimer)
  {
    const [w, h] = [canvas.width, canvas.height];

    let segH
    let prevsegH

    if(nextSegH == undefined)
    {
      nextSegH = h/SegmentationSize
      prevsegH = 0 //startSegAnalysys
      segH = Math.round(nextSegH) //endSegAnalysys
    }
    else 
    {
      prevsegH = Math.round(nextSegH) //startSegAnalysys
      nextSegH += h/SegmentationSize
      segH = Math.round(nextSegH) //endSegAnalysys
    }

    if(!trainedDataSet)
    {
      const porc = (Math.round(nextSegH)/h)*100
      setNeuronTrainPorcentage(parseInt(porc))
      setNeuronTrainAmount(parseInt((SegmentationSize * porc)/100))

      gridCanvasCtx.fillStyle = 'rgb(0, 200 , 0,0.4)';
      gridCanvasCtx.fillRect(0, prevsegH, w, h/SegmentationSize);
    }

    let prevsegW = 0
    let segW = w/SegmentationSize
    let RamMatrix_X = 0
    //console.log(`analizing from ${prevsegH}px to ${segH}px Vertically`)

    for(let iX=0;iX<SegmentationSize;iX++)
    {
      let segmentIsUsed = false
      for(let x = prevsegW;x<segW; x++)
      {
        for(let y = prevsegH;y<segH;y++)
        {
          const pixel = segCanvasCtx.getImageData(x,y,1,1)
          //console.log(pixel)
          if(!isBackGround(pixel)) segmentIsUsed = true

        }
      }
      RamMatrix_X += (segmentIsUsed?1:0)* Math.pow(2,iX)
      //console.log(segmentIsUsed)
      //console.log(`analizing from ${prevsegW}px to ${segW}px Horizontaly`)
      prevsegW = segW
      segW += w/SegmentationSize
    }

    //console.log(RamMatrix_X)

    if(Math.round(nextSegH) == h)
    {
      //console.log('clear')
      if(!trainedDataSet)
      {
        setNeuronTrainPorcentage(0)
        setNeuronTrainAmount(0)
        clearInterval(myTimer);
      }
      nextSegH = undefined
      
      if(!trainedDataSet)
      {
        setTimeout(() => {
          GridRender() 
        }, intervalMS);
  
        gridCanvasCtx.fillStyle = 'rgb(0, 200 , 0,0.4)';
        gridCanvasCtx.fillRect(0, prevsegH, w, h/SegmentationSize);
      }
    }

    return RamMatrix_X
  }

  function AnalyzeFullImg()
  {
    const [w, h] = [canvas.width, canvas.height];

   
    let prevsegH = 0
    let segH = h/SegmentationSize
    let RamMatrix = []
    //console.log(`analizing from ${prevsegH}px to ${segH}px Vertically`)

    for(let iY=0;iY<SegmentationSize;iY++)
    {
      let RamMatrix_X = []
      let prevsegW = 0
      let segW = w/SegmentationSize
      for(let iX=0;iX<SegmentationSize;iX++)
      {
        let segmentIsUsed = false
        for(let x = prevsegW;x<segW; x++)
        {
          for(let y = prevsegH;y<segH;y++)
          {
            const pixel = segCanvasCtx.getImageData(x,y,1,1)
            //console.log(pixel)
            if(!isBackGround(pixel)) segmentIsUsed = true
          }
        }
        RamMatrix_X.push(segmentIsUsed?1:0)
        //console.log(segmentIsUsed)
        //console.log(`analizing from ${prevsegW}px to ${segW}px Horizontaly`)
        //console.log('iX',iX)

        prevsegW = segW
        segW += w/SegmentationSize
      }
      RamMatrix.push(RamMatrix_X)

      prevsegH = segH
      segH += h/SegmentationSize
    }
  
    //console.log(RamMatrix_X)

    return RamMatrix
  }

  function TrainCurrent(trainedDataSet)
  {
    let index = 0
    //console.log(endedCallBack)

    ComputingGridRender(AnalyzeFullImg(trainedDataSet))

    if(trainedDataSet)
    {
      for(let index = 0; index<SegmentationSize; index++)
      {
        let RAM
        if(Discriminators[index])
        {
          RAM = Discriminators[index]
        }
        else RAM = []

        RAM.push(AnalyzeImg(true,undefined))
        Discriminators[index] = RAM
      }

      //console.log(Discriminators)
    }
    else
    {
      const interval = setInterval(() => 
      {
        let RAM
        if(Discriminators[index])
        {
          RAM = Discriminators[index]
        }
        else RAM = []

        RAM.push(AnalyzeImg(undefined,interval))
        Discriminators[index] = RAM

        //console.log(Discriminators)
        index++
      },intervalMS)  
    }

    lettersData[currentButton] = Discriminators

    //console.log('Discriminators',lettersData)

    setTrainedTuplas((tt)=>tt+1)

    let f = true
    for(let i=0;i<lettersAnalyzed.length;i++)
    {
      if(lettersAnalyzed[i]==currentButton) 
      {
        f = false
        break
      }
    }
    if(f)lettersAnalyzed.push(currentButton)
  }

	const TrainFromFiles = (event) => 
  {
    //console.log(event.target.files)
    const files = event.target.files
		for(let i=0;i<files.length;i++)
    {
      var reader = new FileReader();
      reader.onload = function(event)
      {
        var img = new Image();
        img.onload = function()
        {
          segCanvasCtx.drawImage(img,0,0,canvas.width,canvas.height);
          TrainCurrent(true)
        }
        img.src = event.target.result;
      }
      reader.readAsDataURL(event.target.files[i]);  
    }
	}

  const LoadDataSet = (event) => 
  {
    var reader = new FileReader();
    reader.onload = (event)=>
    {
      const jsu =  JSON.parse(event.target.result)
      lettersData = jsu
      Discriminators = jsu[currentButton]

      let dataVampire
      if(jsu.V)
      {
        dataVampire = jsu.V
        lettersAnalyzed.push('V')
      }
      if(jsu.W)
      {
        dataVampire = jsu.W
        lettersAnalyzed.push('W')
      }
      if(jsu.X)
      {
        dataVampire = jsu.X
        lettersAnalyzed.push('X')
      }
      if(jsu.Z)
      {
        dataVampire = jsu.Z
        lettersAnalyzed.push('Z')
      }
      
      SegmentationSize = dataVampire.length
      setsegAmount(SegmentationSize)
      setTrainedTuplas(dataVampire[0].length * SegmentationSize)
      
      // console.log('dataVampire',dataVampire)
      // console.log('lettersData',lettersData)
      // console.log('Discriminators',Discriminators)
      //console.log(jsu)
    }
    reader.readAsText(event.target.files[0])

	}

  const SegmentationAnalysis = () =>
  {    
    const TrainSection = document.getElementById('TrainSection');
    const files = document.getElementById('files');
    const setTrainedFiles = document.getElementById('setTrainedFiles');
    const DownloadDATA = document.getElementById('DownloadDATA');
    //const AnalyzeLine = document.getElementById('AnalyzeLine');
    const AnalyzeAll = document.getElementById('AnalyzeAll');
    //const RaiseInterval = document.getElementById('RaiseInterval');
    //const LowerInterval = document.getElementById('LowerInterval');
    const V = document.getElementById('V');
    const W = document.getElementById('W');
    const X = document.getElementById('X');
    const Z = document.getElementById('Z');

    V.addEventListener('click', (e) => 
    {
      if(lettersData['V']) Discriminators = lettersData['V']
      else Discriminators = []

      currentButton = 'V'
      setCurrentLetter(currentButton)
    })
    W.addEventListener('click', (e) => 
    {
      if(lettersData['W']) Discriminators = lettersData['W']
      else Discriminators = []

      currentButton = 'W'
      setCurrentLetter(currentButton)
    })
    X.addEventListener('click', (e) => 
    {
      if(lettersData['X']) Discriminators = lettersData['X']
      else Discriminators = []

      currentButton = 'X'
      setCurrentLetter(currentButton)
    })
    Z.addEventListener('click', (e) => 
    {
      if(lettersData['Z']) Discriminators = lettersData['Z']
      else Discriminators = []

      currentButton = 'Z'
      setCurrentLetter(currentButton)
    })

    TrainSection.addEventListener('click', (e) => TrainCurrent());
    
    AnalyzeAll.addEventListener('click', (e) => 
    {
      ComputingGridRender(AnalyzeFullImg())

      if(!Discriminators.length) return

      let Equals = 
      {
        V:0,
        W:0,
        X:0,
        Z:0,
      }

      for(let i=0;i<Discriminators.length;i++)
      {
        setTimeout(() => 
        {
          const analysedImg = AnalyzeImg(undefined)
          //console.log('analysedImg',analysedImg)
          Equals = VerificarImg(analysedImg,Equals)

          if(i==Discriminators.length-1)
          {
            //console.log('lettersData',lettersData)
            //console.log('Discriminators',Discriminators)

            //console.log('Equals',Equals)

            let biggest = 0
            let secondBiggest = 0
            let biggestLetter = ''
            let SecondbiggestLetter = ''

            for(let index=0;index<4;index++)
            {
              let theanalyzed
              let currLetter = ''

              if(index == 0)
              {
                theanalyzed = Equals.V
                currLetter = 'V'
              }
              else if(index == 1)
              {
                theanalyzed = Equals.W
                currLetter = 'W'
              }
              else if(index == 2)
              {
                theanalyzed = Equals.X
                currLetter = 'X'
              }
              else if(index == 3)
              {
                theanalyzed = Equals.Z
                currLetter = 'Z'
              }
              
              if(theanalyzed>biggest)
              {
                biggest = theanalyzed
                biggestLetter = currLetter
              }
              if(theanalyzed>secondBiggest && theanalyzed<biggest)
              {
                secondBiggest = theanalyzed
                SecondbiggestLetter = currLetter
              }
            }

            setcalcFinal(`V: ${Equals.V} W: ${Equals.W} X: ${Equals.X} Z: ${Equals.Z}`)
            setprobLetter(`letra desenhada: ${biggestLetter}`)
            console.log('Equals',Equals)
            console.log('biggest',biggest)
            console.log('secondBiggest',secondBiggest)
            console.log('biggestLetter',biggestLetter)
            console.log('SecondbiggestLetter',SecondbiggestLetter)


          }
        },intervalMS)
      }
    })
    files.addEventListener('change', (e) => 
    {
      TrainFromFiles(e)
    });

    DownloadDATA.addEventListener('click', (e) => 
    {
      const link = document.createElement("a");
      let jsontxt = '{\n'
      for(let i=0;i<lettersAnalyzed.length;i++)
      {
        if(i!=0)jsontxt+=','
        jsontxt += `"${lettersAnalyzed[i]}":${JSON.stringify(lettersData[lettersAnalyzed[i]])}\n`
      }
      jsontxt+='\n}'
    
      const file = new Blob([jsontxt], { type: 'text/plain' });
      link.href = URL.createObjectURL(file);
      link.download = "DataSet.json";
      link.click();
      URL.revokeObjectURL(link.href);
    });

    setTrainedFiles.addEventListener('change', (e) => 
    {
      LoadDataSet(e)
    });
    //RaiseInterval.addEventListener('click', (e) => intervalMS+=50);
    //LowerInterval.addEventListener('click', (e) => {if(intervalMS>50) intervalMS-=50});
  }

  const GridRender = () =>
  {
    const [w, h] = [canvasGrid.width, canvasGrid.height];

    if (!gridCanvasCtx ) return;

    const RaiseSegmentations = document.getElementById('RaiseSegmentations');
    const ResetSegmentations = document.getElementById('ResetSegmentations');
    const LowerSegmentations = document.getElementById('LowerSegmentations');
    const ShowGrid = document.getElementById('ShowGrid');
   
    //gridCanvasCtx.fillStyle = 'rgba(220, 0, 0, 0.2)';
    gridCanvasCtx.lineWidth = 0.5;
    gridCanvasCtx.strokeStyle = 'rgb(0, 0, 0)';
    
    function drawGrid(notShow)
    {
      gridCanvasCtx.clearRect(0, 0, w, h);   
      //gridCanvasCtx.fillRect(0, 0, w, h);

      if(!notShow)
      {
        gridCanvasCtx.beginPath();
    
        for(let i=0,segX = 0,segY = 0;i<SegmentationSize + 1;i++)
        {
          gridCanvasCtx.moveTo(segX, 0);
          gridCanvasCtx.lineTo(segX, h);

          segX+=w/SegmentationSize

          gridCanvasCtx.moveTo(0, segY);
          gridCanvasCtx.lineTo(w, segY);

          segY+=h/SegmentationSize
        }
        gridCanvasCtx.stroke();
        }
    }
    drawGrid()
    
    segCanvasCtx.fillStyle = 'rgb(220, 220, 220)';
    segCanvasCtx.clearRect(0, 0, w, h);   
    segCanvasCtx.fillRect(0, 0, w, h);
    segCanvasCtx.strokeStyle = 'rgba(0, 0, 0, 1)';

    RaiseSegmentations.addEventListener('click', (e) => 
    {
      //console.log("test")
      SegmentationSize+=2
      setsegAmount(SegmentationSize)
      drawGrid(!showGrid)
    });
    ResetSegmentations.addEventListener('click', (e) => 
    {
      SegmentationSize=4
      setsegAmount(SegmentationSize)
      drawGrid(!showGrid)
    });
    LowerSegmentations.addEventListener('click', (e) => 
    {
      
      if(SegmentationSize>4)SegmentationSize-=2
      setsegAmount(SegmentationSize)
      drawGrid(!showGrid)
    });
    ShowGrid.addEventListener('click', (e) => 
    {
      drawGrid(showGrid)
      showGrid = !showGrid
    });
  }

  const ComputingGridRender = (CurrentDrawAsSegmentation)=>
  {
    const [w, h] = [canvasComputingGrid.width, canvasComputingGrid.height];
    
    //console.log(CurrentDrawAsSegmentation)

    canvasComputingGridCtx.clearRect(0, 0, w, h);   
    canvasComputingGridCtx.fillStyle = 'rgb(220, 0, 0)';
    //gridCanvasCtx.fillRect(0, 0, w, h);

    const squareSize = h/SegmentationSize

    let fromX = 0
    for(let i = 0; i<SegmentationSize; i++)
    {
      let fromY = 0
      for(let i2 = 0; i2<SegmentationSize; i2++)
      {
        if(CurrentDrawAsSegmentation[i][i2] == 1)
        {
          //await sleep(1000)
          canvasComputingGridCtx.fillRect(fromY, fromX, squareSize, squareSize);
          
          //console.log(`drawing from X[${i}] Y[${i2}]`)
          //console.log(`drawing from X[${fromX}] to X[${toX}] from Y[${fromY}] to Y[${toY}]`)
        }
        fromY += squareSize
      }
      fromX += squareSize
    }
  }
  
  return (
    <div style={{display:'flex', flexDirection:'column',alignItems:'center',justifyContent:"center",minHeight:'100vh',minWidth:'100vw'}}>
      <p style={{position:'absolute',marginBottom:385}}>{`Segmentacoes: ${segAmount}`}</p>
      <p style={{position:'absolute',marginBottom:385,marginLeft:700}}>{`Saida computacional`}</p>
s
      <div style={{display:'flex',position:'absolute',left:0,top:0,bottom:0,right:0,alignItems:'center',justifyContent:'center'}}>
        <canvas style={{border:'solid black 1px'}} width={canvasSize} height={canvasSize} ref={canvasRef}/> 
      </div>

      <div style={{display:'flex',position:'absolute',left:700,top:0,bottom:0,right:0,alignItems:'center',justifyContent:'center'}}>
          <canvas style={{border:'solid black 1px'}} width={canvasSize} height={canvasSize} ref={canvasAsSeeRef}/>
      </div>

      <div style={{display:'flex',position:'absolute',left:0,top:0,bottom:0,right:0,alignItems:'center',justifyContent:'center'}}>
        <canvas 
        onMouseDown={(e)=>
        {
          setisPainting(true)
          segCanvasCtx.moveTo(e.clientX - canvasOffsetX , e.clientY - canvasOffsetY);
        }} 
        onMouseUp={()=>
        {
          setisPainting(false)
          segCanvasCtx.stroke();
          segCanvasCtx.beginPath();
        }}
        onMouseMove={(e)=>
        {
          if(!isPainting) return;
        
          segCanvasCtx.lineWidth = DrawlineWidth;
          segCanvasCtx.lineCap = 'round';
          segCanvasCtx.lineTo(e.clientX - canvasOffsetX , e.clientY - canvasOffsetY);
          segCanvasCtx.stroke();
        }}
        style={{cursor:'crosshair',}} width={canvasSize} height={canvasSize} ref={canvasGridRef}/>
      </div>

      <div 
      style=
      {{
        position:'absolute',
        marginRight:520,
        alignItems:'center',
        justifyContent:'space-evenly',
        display:'flex',
        flexDirection:'column',
        height:250,
        width:100,
      }}>
        <p style={{textAlign:'center'}}>{`Controle Segmentacao`}</p>
        <button id="RaiseSegmentations" style={{width:100}}>
          <p>+</p>
        </button>
        <button id="LowerSegmentations" style={{width:100}}>
          <p>-</p>
        </button>
        <button style={{width:100}} id="ResetSegmentations" >
          <p>Reset</p>
        </button>
      </div>

      {/*<div 
      style=
      {{
        position:'absolute',
        marginRight:520,
        alignItems:'center',
        justifyContent:'space-evenly',
        display:'flex',
        flexDirection:'column',
        height:200,
        marginTop:585
      }}>
        <p >{`Controle Intervalo`}</p>
        <button id="RaiseInterval" style={{width:50}}>
          <p>+</p>
        </button>
        <button id="LowerInterval" style={{width:50}}>
          <p>-</p>
        </button>
      </div>*/}

      <div 
      style=
      {{
        position:'absolute',
        marginRight:760,
        alignItems:'center',
        justifyContent:'space-evenly',
        display:'flex',
        flexDirection:'column',
        height:250,
        width:100
      }}>
        <p>{`Controle Grid`}</p>
        <button style={{width:100}} id="ShowGrid" >
          <p>Toogle Grid</p>
        </button>
        <button style={{width:100}} id="Clean" onClick={CleanCanvas}>
          <p>Limpar</p>
        </button>
      </div>
      
      <div style=
      {{
        position:'absolute',
        alignItems:'center',
        justifyContent:'space-between',
        display:'flex',
        flexDirection:'column',
        marginTop:525,
        height:200
      }}>
        {/*
          <button id="AnalyzeLine" >
            <p>Analisar linha</p>
          </button>
        */}
        
        <div>
          <p style={{margin:0}}>{`Neuronios Treinados: ${NeuronTrainAmount} (${NeuronTrainPorcentage}%)`}</p>
          <p style={{margin:0}}>{`Discriminadores Treinados: ${TrainedTuplas}`}</p>
        </div>
        
        <div style=
        {{
          alignItems:'center',
          justifyContent:'space-evenly',
          display:'flex',
          flexDirection:'row',
          width:550,
        }}>
          <button style={{width:100}} id="TrainSection" >
            <p>Treinar Novo</p>
          </button>

          <button style={{width:100}} id="AnalyzeAll" >
            <p>Analisar</p>
          </button>

          <button style=
          {{
            width:100,
            alignItems:'center',
            display:'flex',
            flexDirection:'column',
            justifyContent:'center',
          }}>
            <label htmlFor="files" >Selecionar imagens para treinar</label>
            <input id="files" style={{visibility:'hidden',height:0,width:0}} type="file" multiple />

          </button> 

          <button style=
          {{
            width:100,
            alignItems:'center',
            display:'flex',
            flexDirection:'column',
            justifyContent:'center',
          }}>
            <label htmlFor="setTrainedFiles" >Selecionar banco treinado</label>
            <input id="setTrainedFiles" style={{visibility:'hidden',height:0,width:0}} type="file" multiple />

          </button>
          <button style=
          {{
            width:100,
            alignItems:'center',
            display:'flex',
            flexDirection:'column',
            justifyContent:'center',
            height:50
          }}
          id="DownloadDATA"
          >
            Baixar banco
      
          </button>
        </div>

        <div style=
        {{
          alignItems:'center',
          justifyContent:'space-evenly',
          display:'flex',
          flexDirection:'row',
          width:340,
        }}>
          <button style={{width:50,backgroundColor:currentLetter=='V'?'green':''}} id='V'>
            <p>V</p>
          </button>

          <button style={{width:50,backgroundColor:currentLetter=='W'?'green':''}} id='W'>
            <p>W</p>
          </button>

          <button style={{width:50,backgroundColor:currentLetter=='X'?'green':''}} id='X'>
            <p>X</p>
          </button>

          <button style={{width:50,backgroundColor:currentLetter=='Z'?'green':''}} id='Z'>
            <p>Z</p>
          </button>
        </div>
        
        <p style={{margin:0}}>{`${calcFinal}`}</p>
        <p style={{margin:0}}>{probLetter}</p>
        
      </div>
    </div>
  );
}

export default App;
