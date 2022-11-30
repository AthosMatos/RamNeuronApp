import React, { useEffect, useRef, useState } from "react";


function App() 
{
  const [canvas,setCanvas] = useState()
  const [canvasGrid,setcanvasGrid] = useState()
  const [segAmount,setsegAmount] = useState(4)
  const [TrainedTuplas,setTrainedTuplas] = useState(0)
  const [segCanvasCtx,setSegCanvasCtx] = useState()
  const [gridCanvasCtx,setGridCanvasCtxCanvasCtx] = useState()
  const [NeuronTrainPorcentage,setNeuronTrainPorcentage] = useState(0)
  const [NeuronTrainAmount,setNeuronTrainAmount] = useState(0)

  const canvasRef = useRef()
  const canvasGridRef = useRef()
  const DrawlineWidth = 10;

  let showGrid = true
  let SegmentationSize = 4
  let isPainting = false;
  let Discriminators = []
  let nextSegH = undefined
  let intervalMS = 60
  let NeuronIndex = 0

  useEffect(()=>
  {
    if(canvasRef.current && canvasGridRef.current)
    {
      setCanvas(canvasRef.current)
      setcanvasGrid(canvasGridRef.current)
    }
  },[canvasGridRef.current,canvasRef.current])

  useEffect(()=>
  {
    if(canvas && canvasGrid)
    {
      setSegCanvasCtx(canvas.getContext("2d",{willReadFrequently: true}))
      setGridCanvasCtxCanvasCtx(canvasGrid.getContext("2d",{willReadFrequently: true}))
    }
  },[canvasGrid,canvas])

  useEffect(()=>
  {
    if(segCanvasCtx && gridCanvasCtx)
    {
      SegmentationAnalysis()
      GridRender()
    }
  },[segCanvasCtx,gridCanvasCtx])

  function CleanCanvas()
  {
    const [w, h] = [canvas.width, canvas.height];

    segCanvasCtx.clearRect(0, 0, w, h);  
    segCanvasCtx.fillRect(0, 0, w, h);
  }

  function VerificarImg(ImgMatrix)
  {
    let Equals = 0

    if(NeuronIndex == Discriminators.length)NeuronIndex=0
    //console.log('Discriminators',Discriminators[NeuronIndex])
    console.log('ImgMatrix',ImgMatrix)
   
    for(let i = 0;i<Discriminators[NeuronIndex].length;i++)
    {
      for(let i2 = 0;i2<Discriminators[NeuronIndex][i].length;i2++)
      {
        let completelyEqual = true
        if(Discriminators[NeuronIndex][i][i2] != ImgMatrix[i2]) 
        {
          completelyEqual = false
          
          break
        }
  
        if(completelyEqual) Equals++
      }
    }

    if(NeuronIndex<Discriminators.length)NeuronIndex++

    Equals = Equals / Discriminators[0].length
    //return (Equals/(Discriminators.length ? Discriminators.length : 1))*100
    return Equals
  }

  function AnalyzeImg(trainedDataSet,myTimer)
  {
    const [w, h] = [canvas.width, canvas.height];

    const isBackGround = (pixel) =>
    {
      //0.1
      let greyColor = 220
      if(trainedDataSet)greyColor=255
      
      for(let i=0;i<pixel.data.length-1;i++)
      {
        //console.log(pixel.data[0])
        if((pixel.data[i] != greyColor)) return false
      }
      return true
    }

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
    const porc = (Math.round(nextSegH)/h)*100
    setNeuronTrainPorcentage(parseInt(porc))
    setNeuronTrainAmount(parseInt((SegmentationSize * porc)/100))

    gridCanvasCtx.fillStyle = 'rgb(0, 200 , 0,0.4)';
    gridCanvasCtx.fillRect(0, prevsegH, w, h/SegmentationSize);

    let prevsegW = 0
    let segW = w/SegmentationSize
    let RamMatrix_X = []
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
      RamMatrix_X.push(segmentIsUsed?1:0)
      //console.log(segmentIsUsed)
      //console.log(`analizing from ${prevsegW}px to ${segW}px Horizontaly`)
      prevsegW = segW
      segW += w/SegmentationSize
    }

    //console.log(RamMatrix_X)

    if(Math.round(nextSegH) == h)
    {
      //console.log('clear')
      setNeuronTrainPorcentage(0)
      setNeuronTrainAmount(0)
      clearInterval(myTimer);

      nextSegH = undefined
      
      setTimeout(() => {
        GridRender() 
      }, intervalMS);

      gridCanvasCtx.fillStyle = 'rgb(0, 200 , 0,0.4)';
      gridCanvasCtx.fillRect(0, prevsegH, w, h/SegmentationSize);
    }

    return RamMatrix_X
  }

	const TrainFromFiles = (event) => 
  {
    //console.log(event.target.files)
		for(let i=0;i<event.target.files.length;i++)
    {
      var reader = new FileReader();
      reader.onload = function(event)
      {
        var img = new Image();
        img.onload = function()
        {
          CleanCanvas()
          segCanvasCtx.drawImage(img,0,0,canvas.width,canvas.height);
          Discriminators.push(AnalyzeImg(true))
          setTrainedTuplas(Discriminators.length)
          
        }
        img.src = event.target.result;
      }
      reader.readAsDataURL(event.target.files[i]);  

      
    }
	};

  const SegmentationAnalysis = () =>
  {    
    const TrainSection = document.getElementById('TrainSection');
    //const AnalyzeLine = document.getElementById('AnalyzeLine');
    const AnalyzeAll = document.getElementById('AnalyzeAll');
    //const RaiseInterval = document.getElementById('RaiseInterval');
    //const LowerInterval = document.getElementById('LowerInterval');
   
    TrainSection.addEventListener('click', (e) => 
    {
      let index = 0
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

        console.log(Discriminators)
        index++
      },intervalMS)
      
      //console.log(TrainedRamNeurons)

      setTrainedTuplas((tt)=>tt+1)
    });
    /*
    AnalyzeLine.addEventListener('click', (e) => 
    {
      //console.log(AnalyzeImg())
      console.log(VerificarImg(AnalyzeImg()))
    });
    */
    AnalyzeAll.addEventListener('click', (e) => 
    {
      console.log(Discriminators)
      let porcentage = 0

      if(!Discriminators.length) return
      
      const interval = setInterval(()=>
      {
        porcentage+=VerificarImg(AnalyzeImg(undefined,interval))
        console.log(`${porcentage/SegmentationSize}%`)
      },intervalMS)
    })

    //RaiseInterval.addEventListener('click', (e) => intervalMS+=50);
    //LowerInterval.addEventListener('click', (e) => {if(intervalMS>50) intervalMS-=50});
  }

  const GridRender = () =>
  {
    const [w, h] = [canvasGrid.width, canvasGrid.height];
    const canvasOffsetX = canvas.offsetLeft;
    const canvasOffsetY = canvas.offsetTop;

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

    canvasGrid.addEventListener('mousedown', (e) => 
    {
        isPainting = true;
        segCanvasCtx.moveTo(e.clientX - canvasOffsetX , e.clientY - canvasOffsetY);
    });

    canvasGrid.addEventListener('mouseup', e => 
    {
        isPainting = false;
        segCanvasCtx.stroke();
        segCanvasCtx.beginPath();
    });

    canvasGrid.addEventListener('mousemove', (e) => 
    {
        if(!isPainting) return;
        
        segCanvasCtx.lineWidth = DrawlineWidth;
        segCanvasCtx.lineCap = 'round';
        segCanvasCtx.lineTo(e.clientX - canvasOffsetX , e.clientY - canvasOffsetY);
        segCanvasCtx.stroke();
    });

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

  return (
    <div style={{display:'flex', flexDirection:'column',alignItems:'center',justifyContent:"center",minHeight:'100vh',minWidth:'100vw'}}>
      <p style={{position:'absolute',marginBottom:385}}>{`Segmentacoes: ${segAmount}`}</p>
      
      <canvas style={{border:'solid black 1px'}} width={300} height={300} ref={canvasRef}/> 
     
      <div style={{display:'flex',position:'absolute',left:0,top:0,bottom:0,right:0,alignItems:'center',justifyContent:'center'}}>
        <canvas style={{cursor:'crosshair',}} width={300} height={300} ref={canvasGridRef}/>
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
        marginLeft:520,
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
        marginTop:465,
        height:120
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
          width:340,
        }}>
          <button style={{width:100}} id="AnalyzeAll" >
            <p>Analisar</p>
          </button>

          <button style={{width:100}} id="TrainSection" >
            <p>Treinar Novo</p>
          </button>

          <button style=
          {{
            width:100,
            alignItems:'center',
            display:'flex',
            flexDirection:'column',
            justifyContent:'center',
          }}>
            <label htmlFor="files" >Selecionar imagens para analizar</label>
            <input id="files" style={{visibility:'hidden',height:0,width:0}} type="file" multiple onChange={TrainFromFiles}/>
          
          </button>
        </div>
        
      </div>
    </div>
  );
}

export default App;
