import React, { useEffect, useRef, useState } from "react";


function App() 
{
  const [canvas,setCanvas] = useState()
  const [canvasGrid,setcanvasGrid] = useState()
  const [segAmount,setsegAmount] = useState(4)
  const [TrainedRams,setTrainedRams] = useState(0)
  const [segCanvasCtx,setSegCanvasCtx] = useState()
  const [gridCanvasCtx,setGridCanvasCtxCanvasCtx] = useState()

  const canvasRef = useRef()
  const canvasGridRef = useRef()
  const DrawlineWidth = 10;

  let showGrid = true
  let SegmentationSize = 4
  let isPainting = false;
  let TrainedRamNeurons = []

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
    for(let i=0;i<TrainedRamNeurons.length;i++)
    {
      let completelyEqual = true
      for(let i2 = 0;i2<TrainedRamNeurons[i].length;i2++)
      {
        for(let i3 = 0;i3<TrainedRamNeurons[i][i2].length;i3++)
        {
          if(TrainedRamNeurons[i][i2][i3] != ImgMatrix[i2][i3])
          {
            completelyEqual = false
            break
          }
        }
      }
      if(completelyEqual)
      {
        Equals++
      }
    }
    return `${(Equals/(TrainedRamNeurons.length))*100}%`
  }

  function AnalyzeImg(trainedDataSet)
  {
    const [w, h] = [canvas.width, canvas.height];

    const isBackGround = (pixel) =>
    {
      //0.1
      var greyColor = 220
      if(trainedDataSet)greyColor=255
      
      for(let i=0;i<pixel.data.length-1;i++)
      {
        //console.log(pixel.data[i])
        if(pixel.data[i] != greyColor) return false
      }
      return true
    }

    let RamMatrix = []
    let segH = h/SegmentationSize
    let prevsegH = 0

    for(let iX = 0;iX<SegmentationSize;iX++)
    {
      let prevsegW = 0
      let segW = w/SegmentationSize
      let RamMatrix_X = []
      //console.log(`analizing from ${prevsegH}px to ${segH}px Vertically`)

      for(let iY=0;iY<SegmentationSize;iY++)
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
      RamMatrix.push(RamMatrix_X)
      prevsegH = segH
      segH += h/SegmentationSize
    }

    //console.log(RamMatrix)

    return RamMatrix
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
          TrainedRamNeurons.push(AnalyzeImg(true))
          setTrainedRams(TrainedRamNeurons.length)
          
        }
        img.src = event.target.result;
      }
      reader.readAsDataURL(event.target.files[i]);  

      
    }
	};

  const SegmentationAnalysis = () =>
  {
    const [w, h] = [canvas.width, canvas.height];
    
    const canvasOffsetX = canvas.offsetLeft;
    const canvasOffsetY = canvas.offsetTop;
    const Train = document.getElementById('Train');
    const Analyze = document.getElementById('Analyze');

    if (!segCanvasCtx ) return;
    
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
   
    Train.addEventListener('click', (e) => 
    {
      //console.log(ctx)
      TrainedRamNeurons.push(AnalyzeImg())
      setTrainedRams(TrainedRamNeurons.length)

      //console.log(TrainedRamNeurons)
      
    });
    Analyze.addEventListener('click', (e) => 
    {
      //console.log(AnalyzeImg())
      console.log(VerificarImg(AnalyzeImg()))
    });

  }

  const GridRender = () =>
  {
    const [w, h] = [canvasGrid.width, canvasGrid.height];
    
    if (!gridCanvasCtx ) return;

    const RaiseSegmentations = document.getElementById('RaiseSegmentations');
    const ResetSegmentations = document.getElementById('ResetSegmentations');
    const LowerSegmentations = document.getElementById('LowerSegmentations');
    const ShowGrid = document.getElementById('ShowGrid');
   
    //ctx.fillStyle = 'rgb(200, 200, 200)';
    gridCanvasCtx.lineWidth = 0.5;
    gridCanvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    function drawGrid(notShow)
    {
      gridCanvasCtx.clearRect(0, 0, w, h);   
      //ctx.fillRect(0, 0, w, h);
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
    
    RaiseSegmentations.addEventListener('click', (e) => 
    {
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
      <p style={{position:'absolute',marginTop:385}}>{`Neuronios Treinados: ${TrainedRams}`}</p>
      
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
        height:250
      }}>
        <p >{`Controle Segmentacao`}</p>
        <button id="RaiseSegmentations" style={{width:50}}>
          <p>+</p>
        </button>
        <button id="LowerSegmentations" style={{width:50}}>
          <p>-</p>
        </button>
        <button id="ResetSegmentations" >
          <p>Reset</p>
        </button>
      </div>

      <div 
      style=
      {{
        position:'absolute',
        marginLeft:520,
        alignItems:'center',
        justifyContent:'space-evenly',
        display:'flex',
        flexDirection:'column',
        height:300
      }}>
        <p>{`Controle Segmentacao`}</p>
        <button id="ShowGrid" >
          <p>Toogle Grid</p>
        </button>
        <button id="Clean" onClick={CleanCanvas}>
          <p>Limpar</p>
        </button>
        <button id="Train" >
          <p>Treinar Novo</p>
        </button>
      </div>
      
      <div style={{alignItems:'center',position:'absolute',marginTop:485,display:'flex'}}>
        <button id="Analyze" >
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
          <label htmlFor="files" >Selecionar imagens para analizar</label>
          <input id="files" style={{visibility:'hidden'}} type="file" multiple onChange={TrainFromFiles}/>
        </button>

      </div>
    </div>
  );
}

export default App;
