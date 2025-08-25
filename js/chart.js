
export function lineChart(canvas, series, opts={}){
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;
  ctx.clearRect(0,0,w,h);
  const pad = 40;
  const allY = series.flatMap(s=>s.data.map(p=>p.y));
  const allX = series[0].data.map(p=>p.x);
  const minY = Math.min(...allY, 0);
  const maxY = Math.max(...allY, 1);
  const n = allX.length;
  function xPos(i){ return pad + (w-pad*2) * (i/(n-1||1)); }
  function yPos(v){ 
    if(maxY===minY) return h/2;
    return h-pad - (h-pad*2)*( (v - minY)/(maxY - minY) );
  }
  // axes
  ctx.strokeStyle = '#e8e6f2'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad,pad); ctx.lineTo(pad,h-pad); ctx.lineTo(w-pad,h-pad); ctx.stroke();
  // y labels
  ctx.fillStyle = '#7a7591'; ctx.font = '12px Inter, Helvetica, Arial';
  for(let i=0;i<5;i++){
    const v = minY + (maxY-minY)*i/4;
    const y = yPos(v);
    ctx.fillText(Math.round(v), 6, y+4);
    ctx.strokeStyle = '#f1eff8'; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-pad,y); ctx.stroke();
  }
  // x labels
  const labels = opts.labels || allX.map(x=>x);
  labels.forEach((lab,i)=>{
    const x = xPos(i);
    ctx.fillText(lab, x-10, h-10);
  });
  // lines
  const colors = ['#492296','#D32BBC','#FF8356','#11093A'];
  series.forEach((s,si)=>{
    ctx.strokeStyle = colors[si%colors.length];
    ctx.lineWidth = 2;
    ctx.beginPath();
    s.data.forEach((p,i)=>{
      const x = xPos(i);
      const y = yPos(p.y);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
  });
}
