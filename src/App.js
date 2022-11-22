import React, { useEffect, useRef, useState } from "react";

function App() 
{
  const [canvas,setCanvas] = useState()
  const [canvasGrid,setcanvasGrid] = useState()
  const [segAmount,setsegAmount] = useState(4)
  const [TrainedRams,setTrainedRams] = useState(0)

  const canvasRef = useRef()
  const canvasGridRef = useRef()
  const DrawlineWidth = 6;
  var showGrid = true
  var SegmentationSize = 4
  var isPainting = false;
  var TrainedRamNeurons = []

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
      SegmentationAnalysis()
      GridRender()
    }
  },[canvasGrid,canvas])


  const SegmentationAnalysis = () =>
  {
    const [w, h] = [canvas.width, canvas.height];
    const ctx = canvas.getContext("2d",{willReadFrequently: true});
    const canvasOffsetX = canvas.offsetLeft;
    const canvasOffsetY = canvas.offsetTop;
    const Clean = document.getElementById('Clean');
    const Train = document.getElementById('Train');
    const StandardTrain = document.getElementById('StandardTrain');
    const Analyze = document.getElementById('Analyze');

    if (!ctx ) return;
    
    ctx.fillStyle = 'rgb(220, 220, 220)';
    ctx.clearRect(0, 0, w, h);   
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)';

    function VerificarImg(ImgMatrix)
    {
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
        if(completelyEqual) return true
      }
      return false
    }

    function AnalyzeImg()
    {
      const isBackGround = (pixel) =>
      {
        //0.1
        const greyColor = 220
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
              const pixel = ctx.getImageData(x,y,1,1)
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

      return RamMatrix
    }

    canvasGrid.addEventListener('mousedown', (e) => 
    {
        isPainting = true;
        ctx.moveTo(e.clientX - canvasOffsetX , e.clientY - canvasOffsetY);
    });

    canvasGrid.addEventListener('mouseup', e => 
    {
        isPainting = false;
        ctx.stroke();
        ctx.beginPath();
    });

    canvasGrid.addEventListener('mousemove', (e) => 
    {
        if(!isPainting) return;
        
        ctx.lineWidth = DrawlineWidth;
        ctx.lineCap = 'round';
        ctx.lineTo(e.clientX - canvasOffsetX , e.clientY - canvasOffsetY);
        ctx.stroke();
    });
    Clean.addEventListener('click', (e) => 
    {
      ctx.clearRect(0, 0, w, h);  
      ctx.fillRect(0, 0, w, h);
    });
    StandardTrain.addEventListener('click', (e) => 
    {
      
      //console.log(ctx)
      //TrainedRamNeurons.push(AnalyzeImg())
      //setTrainedRams(TrainedRamNeurons.length)

      //console.log(TrainedRamNeurons)'

      const img = new Image();
      img.onload = () => 
      {
        
        ctx.drawImage(img, 0, 0,w,h);
      }
      img.src = require('./test.png');
      
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
      console.log(AnalyzeImg())
      console.log(VerificarImg(AnalyzeImg()))
    });

  }

  const GridRender = () =>
  {
    const [w, h] = [canvasGrid.width, canvasGrid.height];
    const ctx = canvasGrid.getContext("2d",{willReadFrequently: true});
    if (!ctx ) return;

    const RaiseSegmentations = document.getElementById('RaiseSegmentations');
    const ResetSegmentations = document.getElementById('ResetSegmentations');
    const LowerSegmentations = document.getElementById('LowerSegmentations');
    const ShowGrid = document.getElementById('ShowGrid');
   
    //ctx.fillStyle = 'rgb(200, 200, 200)';
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgb(0, 0, 0)';

    function drawGrid(notShow)
    {
      ctx.clearRect(0, 0, w, h);   
      //ctx.fillRect(0, 0, w, h);
      if(!notShow)
      {
        ctx.beginPath();
    
        for(let i=0,segX = 0,segY = 0;i<SegmentationSize + 1;i++)
        {
          ctx.moveTo(segX, 0);
          ctx.lineTo(segX, h);

          segX+=w/SegmentationSize

          ctx.moveTo(0, segY);
          ctx.lineTo(w, segY);

          segY+=h/SegmentationSize
        }
        ctx.stroke();
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
        <button id="Clean" >
          <p>Limpar</p>
        </button>
        <button id="Train" >
          <p>Treinar Novo</p>
        </button>
        <button id="StandardTrain" >
          <p>Treino padrao</p>
        </button>
      </div>
      <div style={{position:'absolute',marginTop:485}}>
        <button id="Analyze" >
          <p>Analisar</p>
        </button>
      </div>
    </div>
  );
}

export default App;
