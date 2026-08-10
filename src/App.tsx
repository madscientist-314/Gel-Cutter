import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scissors, 
  Plus, 
  Trash2, 
  Maximize, 
  Layout, 
  PieChart,
  Sliders,
  FileText
} from 'lucide-react';

class Rect {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

class MaxRectsPacker {
  constructor(width, height) {
    this.binWidth = width;
    this.binHeight = height;
    this.usedRectangles = [];
    this.freeRectangles = [new Rect(0, 0, width, height)];
  }

  insert(w, h) {
    let newNode = this.scoreNextNode(w, h);
    if (newNode.h === 0) return null;
    this.placeRectangle(newNode);
    return newNode;
  }

  scoreNextNode(w, h) {
    let bestNode = new Rect(0, 0, 0, 0);
    bestNode.rotated = false;
    let bestShortSideFit = Number.MAX_VALUE;
    let bestLongSideFit = Number.MAX_VALUE;

    for (let freeRect of this.freeRectangles) {
      if (freeRect.w >= w && freeRect.h >= h) {
        let leftoverHoriz = Math.abs(freeRect.w - w);
        let leftoverVert = Math.abs(freeRect.h - h);
        let shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        let longSideFit = Math.max(leftoverHoriz, leftoverVert);

        if (shortSideFit < bestShortSideFit || (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)) {
          bestNode.x = freeRect.x;
          bestNode.y = freeRect.y;
          bestNode.w = w;
          bestNode.h = h;
          bestNode.rotated = false;
          bestShortSideFit = shortSideFit;
          bestLongSideFit = longSideFit;
        }
      }

      if (w !== h && freeRect.w >= h && freeRect.h >= w) {
        let leftoverHoriz = Math.abs(freeRect.w - h);
        let leftoverVert = Math.abs(freeRect.h - w);
        let shortSideFit = Math.min(leftoverHoriz, leftoverVert);
        let longSideFit = Math.max(leftoverHoriz, leftoverVert);

        if (shortSideFit < bestShortSideFit || (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)) {
          bestNode.x = freeRect.x;
          bestNode.y = freeRect.y;
          bestNode.w = h;
          bestNode.h = w;
          bestNode.rotated = true;
          bestShortSideFit = shortSideFit;
          bestLongSideFit = longSideFit;
        }
      }
    }
    return bestNode;
  }

  placeRectangle(node) {
    let numRectanglesToProcess = this.freeRectangles.length;
    for (let i = 0; i < numRectanglesToProcess; ++i) {
      if (this.splitFreeNode(this.freeRectangles[i], node)) {
        this.freeRectangles.splice(i, 1);
        --i;
        --numRectanglesToProcess;
      }
    }
    this.pruneFreeList();
    this.usedRectangles.push(node);
  }

  splitFreeNode(freeNode, usedNode) {
    if (usedNode.x >= freeNode.x + freeNode.w || usedNode.x + usedNode.w <= freeNode.x ||
        usedNode.y >= freeNode.y + freeNode.h || usedNode.y + usedNode.h <= freeNode.y) {
      return false;
    }

    let newNode;
    if (usedNode.y > freeNode.y && usedNode.y < freeNode.y + freeNode.h) {
      newNode = new Rect(freeNode.x, freeNode.y, freeNode.w, usedNode.y - freeNode.y);
      this.freeRectangles.push(newNode);
    }
    if (usedNode.y + usedNode.h < freeNode.y + freeNode.h) {
      newNode = new Rect(freeNode.x, usedNode.y + usedNode.h, freeNode.w, freeNode.y + freeNode.h - (usedNode.y + usedNode.h));
      this.freeRectangles.push(newNode);
    }
    if (usedNode.x > freeNode.x && usedNode.x < freeNode.x + freeNode.w) {
      newNode = new Rect(freeNode.x, freeNode.y, usedNode.x - freeNode.x, freeNode.h);
      this.freeRectangles.push(newNode);
    }
    if (usedNode.x + usedNode.w < freeNode.x + freeNode.w) {
      newNode = new Rect(usedNode.x + usedNode.w, freeNode.y, freeNode.x + freeNode.w - (usedNode.x + usedNode.w), freeNode.h);
      this.freeRectangles.push(newNode);
    }
    return true;
  }

  pruneFreeList() {
    for (let i = 0; i < this.freeRectangles.length; ++i) {
      for (let j = i + 1; j < this.freeRectangles.length; ++j) {
        if (this.isContainedIn(this.freeRectangles[i], this.freeRectangles[j])) {
          this.freeRectangles.splice(i, 1);
          --i;
          break;
        }
        if (this.isContainedIn(this.freeRectangles[j], this.freeRectangles[i])) {
          this.freeRectangles.splice(j, 1);
          --j;
        }
      }
    }
  }

  isContainedIn(a, b) {
    return a.x >= b.x && a.y >= b.y && 
           a.x + a.w <= b.x + b.w && 
           a.y + a.h <= b.y + b.h;
  }
}

function packFrames(frames, sheetW = 24, sheetH = 20) {
  let sheets = [];
  const sortedFrames = [...frames].sort((a, b) => {
    const areaA = a.w * a.h;
    const areaB = b.w * b.h;
    if (areaA !== areaB) return areaB - areaA; 
    return Math.max(b.w, b.h) - Math.max(a.w, a.h); 
  });

  for (let frame of sortedFrames) {
    let placed = false;
    for (let sheet of sheets) {
      let placement = sheet.packer.insert(frame.w, frame.h);
      if (placement) {
        sheet.placements.push({ 
          ...frame, 
          x: placement.x, 
          y: placement.y, 
          w: placement.w, 
          h: placement.h,
          rotated: placement.rotated 
        });
        sheet.usedArea += (frame.w * frame.h);
        placed = true;
        break;
      }
    }

    if (!placed) {
      let packer = new MaxRectsPacker(sheetW, sheetH);
      let placement = packer.insert(frame.w, frame.h);
      if (placement) {
        sheets.push({ 
          packer: packer, 
          placements: [{ 
             ...frame, 
             x: placement.x, 
             y: placement.y, 
             w: placement.w, 
             h: placement.h, 
             rotated: placement.rotated 
          }],
          usedArea: (frame.w * frame.h)
        });
      }
    }
  }
  return sheets;
}

const initialData = [
  { id: 1, color: "L003", w: 6.25, h: 6.25, qty: 4, label: "L003 P64" },
  { id: 2, color: "L004", w: 10, h: 10, qty: 2, label: "L004 2K" },
  { id: 3, color: "L004", w: 6, h: 6, qty: 1, label: "L004 Prelude" },
  { id: 4, color: "L009", w: 6, h: 6, qty: 1, label: "L009 Prelude" },
  { id: 5, color: "L010", w: 6.25, h: 6.25, qty: 1, label: "L010 P64" },
  { id: 6, color: "L075", w: 6.25, h: 6.25, qty: 7, label: "L075 P64" },
  { id: 7, color: "L109", w: 6.25, h: 6.25, qty: 1, label: "L109 P64" },
  { id: 8, color: "L116", w: 6.25, h: 6.25, qty: 1, label: "L116 P64" },
  { id: 9, color: "L119", w: 6.25, h: 6.25, qty: 1, label: "L119 P64" },
  { id: 10, color: "L134", w: 6.25, h: 6.25, qty: 2, label: "L134 P64" },
  { id: 11, color: "L136", w: 6.25, h: 6.25, qty: 4, label: "L136 P64" },
  { id: 12, color: "L161", w: 7.5, h: 7.5, qty: 5, label: "L161 RJ" },
  { id: 13, color: "L201", w: 10, h: 10, qty: 1, label: "L201 2K" },
  { id: 14, color: "L201", w: 6.25, h: 6.25, qty: 2, label: "L201 P64" },
  { id: 15, color: "L201", w: 6, h: 6, qty: 1, label: "L201 Prelude" },
  { id: 16, color: "R025", w: 6.25, h: 6.25, qty: 14, label: "R025 P64" },
  { id: 17, color: "R119", w: 6.25, h: 6.25, qty: 40, label: "R119 S4" },
  { id: 18, color: "R119", w: 7.5, h: 7.5, qty: 53, label: "R119 S4-L" },
  { id: 19, color: "R119", w: 7.5, h: 7.5, qty: 4, label: "R119 CF72" },
  { id: 20, color: "R119", w: 7.5, h: 7.5, qty: 5, label: "R119 RJ" },
  { id: 21, color: "R132", w: 12, h: 12, qty: 1, label: "R132 S4-10" },
  { id: 22, color: "R132", w: 6.25, h: 6.25, qty: 3, label: "R132 S4" },
  { id: 23, color: "G888", w: 8, h: 10.375, qty: 8, label: "G888 LUI" },
];

const gelColorMap = {
  "L003": "#b4d6f0", "L004": "#d3e6f5", "L009": "#ebf3f8", "L010": "#f2b870",
  "L075": "#f7d6a4", "L109": "#fdf0dd", "L116": "#e02938", "L119": "#1b248a",
  "L134": "#1d793c", "L136": "#ffd8b5", "L161": "#ffcf73", "L201": "#f4f4f5",
  "R025": "#ffd2da", "R119": "#e32636", "R132": "#c8202b", "G888": "#8bc4e8"
};

const getGelColor = (str) => {
  const normalized = str.toUpperCase().replace(/[\s-]/g, '');
  if (gelColorMap[normalized]) return gelColorMap[normalized];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash % 360)}, 70%, 80%)`; 
};

const getTextColor = (hexOrHsl) => {
  if (hexOrHsl.startsWith('hsl')) return '#1e293b';
  const hex = hexOrHsl.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128) ? '#1e293b' : '#ffffff';
};

const FIXTURES = [
  { id: 's4_standard', name: 'Source 4 / S4WRD / Lustr (19°-50°) - 6.25"', w: 6.25, h: 6.25, prefix: 'S4' },
  { id: 's4_large', name: 'Source 4 (14°, 70°, 90°) / XDLT - 7.5"', w: 7.5, h: 7.5, prefix: 'S4-L' },
  { id: 's4_10deg', name: 'Source 4 (10°) - 12"', w: 12, h: 12, prefix: 'S4-10' },
  { id: 's4_5deg', name: 'Source 4 (5°) - 14"', w: 14, h: 14, prefix: 'S4-5' },
  { id: 's4_par', name: 'Source 4 PAR / Lustr Fresnel - 7.5"', w: 7.5, h: 7.5, prefix: 'S4-P' },
  { id: 'rj_600', name: 'Robert Juliat 611/613 SX Profile - 7.5"', w: 7.5, h: 7.5, prefix: 'RJ' },
  { id: 'rj_310', name: 'Robert Juliat 310 Fresnel - 7.5"', w: 7.5, h: 7.5, prefix: 'RJ-F' },
  { id: 'adb_1kw', name: 'ADB F101 Fresnel / C103 PC - 7.5"', w: 7.5, h: 7.5, prefix: 'F101' },
  { id: 'adb_2kw', name: 'ADB F201 Fresnel / C203 PC - 10"', w: 10, h: 10, prefix: 'F201' },
  { id: 'par64', name: 'PAR 64 - 10"', w: 10, h: 10, prefix: 'P64' },
  { id: 'eve_p160', name: 'Chauvet EVE P-160 - 7.5"', w: 7.5, h: 7.5, prefix: 'EVE' },
  { id: 'selecon_lui', name: 'Selecon LUI Flood (Rectangular) - 8" × 10.375"', w: 8, h: 10.375, prefix: 'LUI' },
  { id: 'arri_2500', name: 'Arri Compact 2500 - 13"', w: 13, h: 13, prefix: 'ARRI' },
  { id: 'arri_st5', name: 'Arri ST5 - 13.5"', w: 13.5, h: 13.5, prefix: 'ST5' },
  { id: 'prelude_pc', name: 'Prelude PC - 6"', w: 6, h: 6, prefix: 'PC' },
  { id: 'custom', name: 'Custom Size...', w: "", h: "", prefix: 'CUST' },
];

const STOCK_SIZES = [
  { id: 'half_sheet', name: 'Lee Half Sheet (24" × 21")', w: 24, h: 21 },
  { id: 'full_sheet', name: 'Lee Full Sheet (48" × 21")', w: 48, h: 21 },
  { id: 'roll_2ft', name: 'Lee 2ft Roll (300" × 24")', w: 300, h: 24 },
  { id: 'roll_4ft', name: 'Rosco / Lee 4ft Roll (300" × 48")', w: 300, h: 48 },
];

export default function App() {
  const [requirements, setRequirements] = useState(initialData);
  const [stockOverrides, setStockOverrides] = useState({}); 
  const [colorNotes, setColorNotes] = useState({
    'R025': 'May need to pull 1 sheet from stock'
  });
  
  const [newColor, setNewColor] = useState("");
  const [fixtureId, setFixtureId] = useState("s4_standard");
  const [newW, setNewW] = useState("");
  const [newH, setNewH] = useState("");
  const [newQty, setNewQty] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [useCustomLabel, setUseCustomLabel] = useState(false);

  const computedLabel = useMemo(() => {
    const fix = FIXTURES.find(f => f.id === fixtureId);
    const prefix = fix ? fix.prefix : 'CUST';
    const col = newColor ? newColor.toUpperCase() : 'COL';
    return `${col} ${prefix}`;
  }, [newColor, fixtureId]);

  useEffect(() => {
    if (!window.jspdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    let w, h;
    if (fixtureId === 'custom') {
      w = parseFloat(newW);
      h = parseFloat(newH);
    } else {
      const fix = FIXTURES.find(f => f.id === fixtureId);
      w = fix ? fix.w : 6.25;
      h = fix ? fix.h : 6.25;
    }
    if (!newColor || !w || !h || !newQty) return;

    const labelToUse = useCustomLabel && customLabel ? customLabel : computedLabel;
    
    setRequirements([
      ...requirements, 
      {
        id: Date.now(),
        color: newColor.toUpperCase(),
        w: w,
        h: h,
        qty: parseInt(newQty),
        label: labelToUse
      }
    ]);
    setNewQty(""); 
    setCustomLabel("");
    setUseCustomLabel(false);
    if (fixtureId === 'custom') {
      setNewW(""); 
      setNewH("");
    }
  };

  const updateReqQty = (id, val) => {
    setRequirements(requirements.map(req => {
      if (req.id === id) {
        return { ...req, qty: val === '' ? '' : parseInt(val) };
      }
      return req;
    }));
  };

  const removeReq = (id) => {
    setRequirements(requirements.filter(r => r.id !== id));
  };

  const packedData = useMemo(() => {
    const colorGroups = {};
    requirements.forEach(req => {
      if (!colorGroups[req.color]) colorGroups[req.color] = [];
      const validQty = parseInt(req.qty) || 0;
      for (let i = 0; i < validQty; i++) {
        colorGroups[req.color].push({
          id: `${req.id}-${i}`,
          w: req.w,
          h: req.h,
          originalW: req.w,
          originalH: req.h,
          label: req.label
        });
      }
    });

    const results = [];
    let totalSheetsAll = 0;
    let totalFramesAll = 0;
    const purchaseSummary = {}; 

    Object.keys(colorGroups).sort().forEach(color => {
      const frames = colorGroups[color];
      const override = stockOverrides[color] || 'auto';

      let chosenStock = STOCK_SIZES[0]; 
      let bestSheets = [];

      if (override !== 'auto') {
        chosenStock = STOCK_SIZES.find(s => s.id === override) || STOCK_SIZES[0];
        bestSheets = packFrames(frames, chosenStock.w, chosenStock.h);
      } else {
        let bestCandidate = STOCK_SIZES[0];
        let maxEff = -1;

        for (let stock of STOCK_SIZES) {
          const testSheets = packFrames(frames, stock.w, stock.h);
          if (testSheets.length === 0) continue;
          
          let totalUsedArea = testSheets.reduce((acc, s) => acc + s.usedArea, 0);
          let totalStockArea = testSheets.length * (stock.w * stock.h);
          let eff = totalStockArea > 0 ? (totalUsedArea / totalStockArea) : 0;

          if (eff > maxEff) {
            maxEff = eff;
            bestCandidate = stock;
            bestSheets = testSheets;
          }
        }
        chosenStock = bestCandidate;
      }

      let totalUsedArea = bestSheets.reduce((acc, s) => acc + s.usedArea, 0);
      let totalStockArea = bestSheets.length * (chosenStock.w * chosenStock.h);
      let overallEfficiency = totalStockArea > 0 ? ((totalUsedArea / totalStockArea) * 100).toFixed(1) : 0;

      results.push({
        color,
        displayColor: getGelColor(color),
        textColor: getTextColor(getGelColor(color)),
        sheets: bestSheets,
        framesCount: frames.length,
        chosenStock,
        override,
        overallEfficiency
      });

      totalSheetsAll += bestSheets.length;
      totalFramesAll += frames.length;

      if (!purchaseSummary[chosenStock.name]) {
        purchaseSummary[chosenStock.name] = { count: 0, colorDetails: {} };
      }
      purchaseSummary[chosenStock.name].count += bestSheets.length;
      purchaseSummary[chosenStock.name].colorDetails[color] = bestSheets.length;
    });

    return { 
      groups: results, 
      totalSheets: totalSheetsAll, 
      totalFrames: totalFramesAll,
      purchaseSummary 
    };
  }, [requirements, stockOverrides]);

  const handleExportPDF = () => {
    if (!window.jspdf) {
      alert("PDF library is still loading. Please try again in a moment.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Page 1: Cut Color Count Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("Making It Festival - Cut Color Count", 14, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 21);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 25, pageWidth - 14, 25);

    let currentY = 32;

    const summaryData = {};
    requirements.forEach(req => {
      if (!summaryData[req.color]) {
        summaryData[req.color] = { total: 0, fixtures: {} };
      }
      summaryData[req.color].total += req.qty;
      
      let fixtureName = req.label.split(' ')[1] || `${req.w}x${req.h}`;
      const foundFixture = FIXTURES.find(f => f.w === req.w && f.h === req.h);
      if (foundFixture && !req.label.includes('CUST')) {
         fixtureName = foundFixture.prefix;
      }
      
      if (!summaryData[req.color].fixtures[fixtureName]) {
        summaryData[req.color].fixtures[fixtureName] = 0;
      }
      summaryData[req.color].fixtures[fixtureName] += req.qty;
    });

    doc.setFillColor(241, 245, 249);
    doc.rect(14, currentY, pageWidth - 28, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("Name", 18, currentY + 4.5);
    doc.text("Count", 90, currentY + 4.5);
    doc.text("Note", 130, currentY + 4.5);
    currentY += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);

    Object.keys(summaryData).sort().forEach((color) => {
      if (currentY > pageHeight - 25) {
        doc.addPage();
        currentY = 20;
      }

      const data = summaryData[color];
      doc.setFont("helvetica", "bold");
      doc.text(color, 18, currentY);
      doc.text(String(data.total), 90, currentY);

      const note = colorNotes[color];
      if (note) {
         doc.setFont("helvetica", "italic");
         doc.setFontSize(8);
         doc.setTextColor(100, 116, 139);
         doc.text(note, 130, currentY);
      }
      
      currentY += 5;

      doc.setFont("helvetica", "normal");
      Object.entries(data.fixtures).forEach(([fixName, qty]) => {
         if (currentY > pageHeight - 15) {
            doc.addPage();
            currentY = 20;
         }
         doc.text(fixName, 26, currentY);
         doc.text(String(qty), 90, currentY);
         currentY += 5;
      });
      
      currentY += 2;
      doc.setDrawColor(241, 245, 249);
      doc.line(18, currentY, pageWidth - 18, currentY);
      currentY += 4;
    });

    // Page 2: Purchasing / Stock Summary
    doc.addPage();
    let shopY = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("Purchasing / Stock Summary", 14, shopY);
    
    shopY += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Based on optimized sheet layout efficiencies.`, 14, shopY);
    
    shopY += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, shopY, pageWidth - 14, shopY);
    shopY += 8;
    
    const summary = packedData.purchaseSummary;
    if (Object.keys(summary).length === 0) {
      doc.text("No stock required.", 18, shopY);
    } else {
      Object.entries(summary).sort().forEach(([stockName, details]) => {
        if (shopY > pageHeight - 25) {
          doc.addPage();
          shopY = 20;
        }
        
        doc.setFillColor(241, 245, 249);
        doc.rect(14, shopY - 4, pageWidth - 28, 7, 'F');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(stockName, 18, shopY + 0.5);
        doc.text(`Total: ${details.count}`, 150, shopY + 0.5);
        
        shopY += 7;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        
        Object.entries(details.colorDetails).sort().forEach(([color, count]) => {
           if (shopY > pageHeight - 15) {
              doc.addPage();
              shopY = 20;
           }
           doc.text(color, 26, shopY);
           doc.text(String(count), 150, shopY);
           shopY += 5;
        });
        shopY += 3;
      });
    }

    doc.save(`Cut_Color_Count_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <header className="bg-slate-900 text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">Gel CutList Engine <span className="text-sm font-normal text-slate-400 ml-2">v0.5</span></h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full">
            <Layout className="w-4 h-4 text-emerald-400" />
            <span>{packedData.totalSheets} Sheets Total</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full">
            <PieChart className="w-4 h-4 text-blue-400" />
            <span>{packedData.totalFrames} Frames</span>
          </div>
          <button 
            onClick={handleExportPDF}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm text-sm font-medium cursor-pointer"
          >
            <FileText className="w-4 h-4"/> Export PDF Report
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 bg-white border-r border-slate-200 p-4 flex flex-col h-full overflow-y-auto shadow-sm z-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Add Requirements</h2>
          
          <form onSubmit={handleAdd} className="space-y-3 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Color (e.g. L003, R119)</label>
              <input 
                type="text" required
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase bg-white"
                value={newColor} onChange={e => setNewColor(e.target.value)}
                placeholder="L003"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fixture / Frame Size</label>
              <select 
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                value={fixtureId} 
                onChange={e => {
                  setFixtureId(e.target.value);
                  if (e.target.value === 'custom') {
                    setUseCustomLabel(true);
                    if (!customLabel) setCustomLabel(newColor ? `${newColor.toUpperCase()} CUST` : "CUST");
                  }
                }}
              >
                {FIXTURES.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            
            {fixtureId === 'custom' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Width (in)</label>
                  <input 
                    type="number" step="0.25" required min="1" max="24"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={newW} onChange={e => setNewW(e.target.value)}
                    placeholder="6.25"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Height (in)</label>
                  <input 
                    type="number" step="0.25" required min="1" max="24"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={newH} onChange={e => setNewH(e.target.value)}
                    placeholder="6.25"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <div className="w-1/3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Qty</label>
                <input 
                  type="number" required min="1"
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={newQty} onChange={e => setNewQty(e.target.value)}
                  placeholder="5"
                />
              </div>
              <div className="w-2/3">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-600">Label Note</label>
                  <button 
                    type="button" 
                    onClick={() => setUseCustomLabel(!useCustomLabel)}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    {useCustomLabel ? 'Use Auto' : 'Customize'}
                  </button>
                </div>
                {useCustomLabel ? (
                  <input 
                    type="text" 
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                    placeholder="Custom Label"
                  />
                ) : (
                  <div className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-slate-100 text-slate-700 font-mono truncate select-all">
                    {computedLabel}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm">
              <Plus className="w-4 h-4" /> Add Frames
            </button>
          </form>

          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Current List</h2>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{requirements.length} entries</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {requirements.map(req => (
              <div key={req.id} className="group relative bg-white border border-slate-200 p-3 rounded-lg shadow-sm hover:border-slate-300 transition-all text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800">{req.color}</span>
                  <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                    <span className="text-blue-800 text-xs font-bold">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      className="w-12 text-xs font-bold text-blue-900 bg-transparent outline-none text-center"
                      value={req.qty}
                      onChange={(e) => updateReqQty(req.id, e.target.value)}
                    />
                  </div>
                </div>
                <div className="text-slate-500 flex justify-between items-center">
                  <span>{req.w}" × {req.h}"</span>
                  <span className="text-xs font-mono font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded truncate ml-2 max-w-[120px]">{req.label}</span>
                </div>
                <button 
                  onClick={() => removeReq(req.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-100 text-red-600 p-1 rounded hover:bg-red-200 transition-all cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-100 p-6">
          <div className="max-w-6xl mx-auto space-y-8">
            {packedData.groups.map((group, groupIdx) => (
              <div key={groupIdx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col gap-3">
                  <div className="flex flex-wrap justify-between items-center gap-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded border border-slate-300 shadow-sm" style={{ backgroundColor: group.displayColor }}></div>
                      <h2 className="text-xl font-bold text-slate-800">{group.color}</h2>
                      <span className="text-sm text-slate-500">({group.framesCount} frames)</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-white border border-slate-300 px-3 py-1.5 rounded-lg shadow-sm text-sm">
                        <Sliders className="w-4 h-4 text-blue-600" />
                        <span className="text-slate-600 text-xs font-semibold">Stock Size:</span>
                        <select 
                          className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
                          value={group.override}
                          onChange={(e) => setStockOverrides({ ...stockOverrides, [group.color]: e.target.value })}
                        >
                          <option value="auto">Auto (Most Efficient)</option>
                          {STOCK_SIZES.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="text-xs bg-blue-50 text-blue-700 font-semibold px-3 py-1.5 rounded-lg border border-blue-200">
                        Efficiency: {group.overallEfficiency}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full">
                     <FileText className="w-4 h-4 text-slate-400" />
                     <input 
                       type="text"
                       placeholder="Add custom notes for this color (e.g. May need to pull 1 sheet from stock)..."
                       className="flex-1 text-sm bg-white border border-slate-200 rounded-md px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                       value={colorNotes[group.color] || ''}
                       onChange={(e) => setColorNotes({ ...colorNotes, [group.color]: e.target.value })}
                     />
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                  {group.sheets.map((sheet, sheetIdx) => {
                    const totalArea = group.chosenStock.w * group.chosenStock.h;
                    const efficiency = ((sheet.usedArea / totalArea) * 100).toFixed(1);

                    return (
                      <div key={sheetIdx} className="flex flex-col">
                        <div className="flex justify-between items-end mb-2">
                          <span className="font-semibold text-slate-700 text-sm">Sheet {sheetIdx + 1} ({group.chosenStock.name})</span>
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Yield: {efficiency}%</span>
                        </div>
                        
                        <div className="pt-2">
                          <div 
                            className="relative bg-slate-200 border-2 border-slate-800 shadow-md w-full"
                            style={{ aspectRatio: `${group.chosenStock.w} / ${group.chosenStock.h}` }}
                          >
                            <svg viewBox={`0 0 ${group.chosenStock.w} ${group.chosenStock.h}`} className="w-full h-full absolute inset-0">
                              {sheet.placements.map((frame, fIdx) => (
                                <g key={fIdx}>
                                  <rect
                                    x={frame.x} y={frame.y} width={frame.w} height={frame.h}
                                    fill={group.displayColor} stroke="#1e293b" strokeWidth="0.15"
                                  />
                                  {(frame.w > 2 && frame.h > 2) && (
                                    <text
                                      x={frame.x + (frame.w / 2)} y={frame.y + (frame.h / 2)}
                                      textAnchor="middle" dominantBaseline="middle"
                                      fill={group.textColor} fontSize={Math.min(frame.w, frame.h) * 0.16} fontWeight="bold"
                                    >
                                      {frame.rotated ? `${frame.originalH}"×${frame.originalW}" (R)` : `${frame.originalW}"×${frame.originalH}"`}
                                    </text>
                                  )}
                                </g>
                              ))}
                            </svg>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500 font-medium mt-1">
                            <span>Width: {group.chosenStock.w}"</span>
                            <span>Height: {group.chosenStock.h}"</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}