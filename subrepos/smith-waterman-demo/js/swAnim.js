/*******************************************************************************
 * Copyright (c) 2014 Genome Research Ltd. 
 * 
 * Author: Nicholas Clarke <nicholas.clarke@sanger.ac.uk>
 * 
 * This program is free software: you can redistribute it and/or modify it under 
 * the terms of the GNU Affero General Public License as published by the Free 
 * Software Foundation; either version 3 of the License, or (at your option) any 
 * later version. 
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT 
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS 
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more 
 * details. 
 * 
 * You should have received a copy of the GNU Affero General Public License 
 * along with this program. If not, see <http://www.gnu.org/licenses/>. 
 ******************************************************************************/

var cellSize = 50;
var topLeft = [0,0];

function drawGrid(word1, word2) {
  var wCells = word1.length + 2;
  var hCells = word2.length + 2;

  $("#swAnim").css("width", wCells * cellSize).css("height", hCells * cellSize);

  var canvas = Snap("#swAnim");

  var background = canvas.g();

  var gridRight = cellSize * wCells;
  var gridBottom = cellSize * hCells;

  var gridElt = canvas.rect(topLeft[0],topLeft[1], gridRight, gridBottom);
  gridElt.attr({fill: "#ffffff", stroke : "#000000"});
  background.add(gridElt);

  for (i = 0; i < wCells; i++) {
    var offset = i * cellSize;
    var l = canvas.line(offset, topLeft[1], offset, gridBottom);
    l.attr({stroke : "#000000"});

    if (i > 1) {
      var t = canvas.text(offset + (cellSize / 2), cellSize / 2, word1[i-2]);
      t.attr({fill: "#900", "font-size": "20px"});
    }
  }

  for (i = 0; i < hCells; i++) {
    var offset = i * cellSize;
    var l = canvas.line(topLeft[0], offset, gridRight, offset);
    l.attr({stroke : "#000000"});

    if (i > 1) {
      var t = canvas.text(cellSize / 2, offset + (cellSize / 2), word2[i-2]);
      t.attr({fill: "#900", "font-size": "20px"});
    }
  }

  return {"canvas":canvas, "bg" : background};
}

var ease = function(n) {
  return (n==1) ? 1 : 0;
}

function drawCell(canvas, x, y, val, delay, callback) {
  var cellLeft = topLeft[0] + ((x+1) * cellSize);
  var cellTop = topLeft[1] + ((y+1) * cellSize);

  var t = canvas.text(cellLeft + (cellSize / 2), cellTop + (cellSize / 2), val);
  t.attr({fill: "#009", "font-size": "20px"});
  if (delay != undefined) {
    t.attr({"opacity": 0});
    if (callback != undefined) {
      t.animate({"opacity": 1}, delay, ease, callback);
    } else {
      t.animate({"opacity": 1}, delay, ease);
    }
  }
}

function highlightCell(svg, x, y, colour, delay) {
  var cellLeft = topLeft[0] + ((x+1) * cellSize);
  var cellTop = topLeft[1] + ((y+1) * cellSize);

  var t = svg.canvas.rect(cellLeft, cellTop, cellSize, cellSize);
  t.attr({
    "fill" : colour
  });
  if (delay != undefined) {
    t.attr({"opacity": 0});
    t.animate({"opacity": 1}, delay, ease);
  }
  svg.bg.add(t);
}

var Solver = function(word1, word2, match, mismatch, ins, del) {
  var Hcache = createArray(word1.length + 1, word2.length + 1);

  return {
    "H" : function(x,y) {
      var self = this;
      var cachedResult = Hcache[x][y];
      if (cachedResult == null || cachedResult == undefined) {
        if (x === 0 || y === 0) {
        var h = 0;
        } else {
          var m = (word1[x-1] === word2[y-1]) ? match : mismatch;
          var a = self.H(x-1,y-1) + m;
          var b = self.H(x-1,y)+del;
          var c = self.H(x,y-1)+ins;

          var h = Math.max(a,b,c, 0);
        }
        Hcache[x][y] = h;
      }
      return Hcache[x][y];
    },
    "x" : word1.length,
    "y" : word2.length
  };
}

// createArray from: http://stackoverflow.com/questions/966225/how-can-i-create-a-two-dimensional-array-in-javascript
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

function winningPath(solver) {

  var maxIJ = 0;
  var elts = [];
  for (i = 0; i <= solver.x; i++) {
    for (j = 0; j <= solver.y; j++) {
      if (solver.H(i,j) >= maxIJ) {
        maxIJ = solver.H(i,j);
        elts[0] = {"x" : i, "y" : j, "val" : maxIJ};
      }
    }
  }

  // Work out the rest.
  while (maxIJ != 0) {
    var current = elts[elts.length -1];
    var up = solver.H(current.x, current.y - 1);
    var left = solver.H(current.x-1, current.y);
    var diag = solver.H(current.x-1, current.y-1);
    maxIJ = Math.max(up, left, diag);
    if (maxIJ === diag) {
      elts[elts.length - 1].action = "match";
      elts[elts.length] = {"x":current.x-1, "y":current.y-1, "val":maxIJ};
    } else if (maxIJ === left) {
      elts[elts.length - 1].action = "del";
      elts[elts.length] = {"x":current.x-1, "y":current.y, "val":maxIJ};
    } else {
      elts[elts.length - 1].action = "ins";
      elts[elts.length] = {"x":current.x, "y":current.y-1, "val":maxIJ};
    }
  }

  return elts.slice(0, -1);

}

var display = function(word1, word2, svg, solver) {

  var canvas = svg.canvas;

  var showPath = function() {
    var path = winningPath(solver);
    for (i = 0; i < path.length; i++) {
      highlightCell(svg, path[i].x, path[i].y, "#ffff00", 750 * (i + 1));
    }

    var table = $("<table></table>");
    var tw1 = $("<tr></tr>").appendTo(table);
    var tw2 = $("<tr></tr>").appendTo(table);
    for (i = path.length - 1; i >= 0; i--) {
      var elt = path[i];
      if (elt.action === "ins") {
        $("<td></td>").append("-").appendTo(tw1);
        $("<td></td>").append(word2[elt.y -1]).appendTo(tw2);
      } else if (elt.action === "del") {
        $("<td></td>").append(word1[elt.x -1]).appendTo(tw1);
        $("<td></td>").append("-").appendTo(tw2);    
      } else if (elt.action === "match") {
        $("<td></td>").append(word1[elt.x -1]).appendTo(tw1);
        $("<td></td>").append(word2[elt.y -1]).appendTo(tw2);
      }
    }

    $("div#result").append(table);
  }

  var showNums = function() {
    for (i = 0; i <= word1.length; i++) {
      for (j = 0; j <= word2.length; j++) {
        if (i === word1.length && j === word2.length) {
          drawCell(canvas, i, j, solver.H(i,j).toString(), 1000 * Math.sqrt(i*j), showPath);
        } else {
          drawCell(canvas, i, j, solver.H(i,j).toString(), 1000 * Math.sqrt(i*j));
        } 
      }
    }
  }

  return showNums;
}


function run() {
  var word1 = $("#word1").val();
  var word2 = $("#word2").val();
  var matchCost = parseInt($("#matchCost").val());
  var mismatchCost = parseInt($("#mismatchCost").val());
  var insCost = parseInt($("#insCost").val());
  var delCost = parseInt($("#delCost").val());

  $("#swAnim").add("#result").empty();
  var svg = drawGrid(word1, word2);
  var canvas = svg.canvas;
  var solver = Solver(word1, word2, matchCost, mismatchCost, insCost, delCost);
  display(word1, word2, svg, solver)();
}
