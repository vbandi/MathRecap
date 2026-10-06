import { compileExpression, FIGURE_WIDTHS, formatNumber, niceStep, planeLayout, sampleFunction, tickValues } from "./figure-model.mjs";

// Renders a validated worksheet figure description as SVG. Colours are fixed because the
// worksheet is always shown on a light "paper" background and must print the same way.
const SVG_NS = "http://www.w3.org/2000/svg";
const INK = "#1b2033";
const MUTED = "#6b7088";
const GRID = "#dfe2ea";
const FILL = "rgba(61, 111, 182, .12)";
const SERIES_COLORS = ["#3d6fb6", "#e08a2c", "#5a9e3a", "#b34a8c", "#2f9c9c", "#c9a227", "#7a5cc4", "#c75146", "#5c6b7a", "#8fb33a", "#d4728c", "#4b8bbe"];
let clipCounter = 0;

function draw(tag, attributes, parent) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value !== undefined && value !== null) node.setAttribute(name, String(value));
  }
  parent?.append(node);
  return node;
}

function label(parent, x, y, value, { anchor = "start", baseline = "auto", size = 13, color = INK, weight } = {}) {
  const node = draw("text", { x: round(x), y: round(y), "text-anchor": anchor, "dominant-baseline": baseline, "font-size": size, fill: color, "font-weight": weight }, parent);
  node.textContent = value;
  return node;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function pathData(points) {
  return points.map(([x, y], index) => `${index ? "L" : "M"}${round(x)} ${round(y)}`).join(" ");
}

function stroke(dashed, width = 1.8, color = INK) {
  return { fill: "none", stroke: color, "stroke-width": width, "stroke-dasharray": dashed ? "6 4" : undefined, "stroke-linecap": "round", "stroke-linejoin": "round" };
}

function unit(dx, dy) {
  const length = Math.hypot(dx, dy) || 1;
  return [dx / length, dy / length];
}

function centroid(points) {
  return points.reduce(([sumX, sumY], [x, y]) => [sumX + x / points.length, sumY + y / points.length], [0, 0]);
}

// Screen directions from a plane point along everything drawn from it: polygon sides, segments, vectors
// and angle arms.
function attachedDirections(at, figure, toScreen) {
  const isAt = ([x, y]) => x === at[0] && y === at[1];
  const ends = [];
  for (const other of figure.elements) {
    if (other.shape === "polygon") {
      other.points.forEach((point, index) => {
        if (isAt(point)) ends.push(other.points.at(index - 1), other.points[(index + 1) % other.points.length]);
      });
    } else if (other.shape === "segment" || other.shape === "vector") {
      if (isAt(other.from)) ends.push(other.to);
      if (isAt(other.to)) ends.push(other.from);
    } else if (other.shape === "angle" && isAt(other.vertex)) {
      ends.push(other.from, other.to);
    }
  }
  const [x, y] = toScreen(at);
  return ends.filter((end) => !isAt(end)).map((end) => {
    const [endX, endY] = toScreen(end);
    return unit(endX - x, endY - y);
  });
}

function arrowHead(parent, [x, y], [dx, dy], color = INK, size = 9) {
  const [ux, uy] = unit(dx, dy);
  const back = [x - ux * size, y - uy * size];
  const points = [[x, y], [back[0] - uy * size * .45, back[1] + ux * size * .45], [back[0] + uy * size * .45, back[1] - ux * size * .45]];
  draw("polygon", { points: points.map((point) => point.map(round).join(",")).join(" "), fill: color }, parent);
}

function createSvg(width, height, caption) {
  const svgNode = draw("svg", { viewBox: `0 0 ${round(width)} ${round(height)}`, width: round(width), height: round(height), role: "img", "aria-label": caption || "Ábra" });
  draw("title", {}, svgNode).textContent = caption || "Ábra";
  return svgNode;
}

function renderAxes(svgNode, figure, layout) {
  const [xMin, xMax] = figure.xRange;
  const [yMin, yMax] = figure.yRange;
  const xStep = niceStep(xMax - xMin, Math.max(4, Math.floor((layout.width - 56) / 38)));
  const yStep = niceStep(yMax - yMin, Math.max(4, Math.floor((layout.height - 56) / 30)));
  const xTicks = tickValues(xMin, xMax, xStep);
  const yTicks = tickValues(yMin, yMax, yStep);
  const left = layout.toX(xMin), right = layout.toX(xMax), top = layout.toY(yMax), bottom = layout.toY(yMin);

  if (figure.grid) {
    const grid = draw("g", { stroke: GRID, "stroke-width": 1 }, svgNode);
    xTicks.forEach((x) => draw("line", { x1: round(layout.toX(x)), x2: round(layout.toX(x)), y1: round(top), y2: round(bottom) }, grid));
    yTicks.forEach((y) => draw("line", { y1: round(layout.toY(y)), y2: round(layout.toY(y)), x1: round(left), x2: round(right) }, grid));
  }
  if (!figure.axes) return;

  const axisY = layout.toY(yMin <= 0 && yMax >= 0 ? 0 : yMin);
  const axisX = layout.toX(xMin <= 0 && xMax >= 0 ? 0 : xMin);
  const axes = draw("g", {}, svgNode);
  draw("line", { x1: round(left - 6), x2: round(right + 10), y1: round(axisY), y2: round(axisY), ...stroke(false, 1.3) }, axes);
  draw("line", { x1: round(axisX), x2: round(axisX), y1: round(bottom + 6), y2: round(top - 10), ...stroke(false, 1.3) }, axes);
  arrowHead(axes, [right + 14, axisY], [1, 0], INK, 8);
  arrowHead(axes, [axisX, top - 14], [0, -1], INK, 8);
  label(axes, right + 12, axisY - 8, figure.xLabel ?? "x", { anchor: "end", size: 13, weight: 600 });
  label(axes, axisX + 8, top - 8, figure.yLabel ?? "y", { size: 13, weight: 600 });

  for (const x of xTicks) {
    const screenX = layout.toX(x);
    draw("line", { x1: round(screenX), x2: round(screenX), y1: round(axisY - 3), y2: round(axisY + 3), ...stroke(false, 1.1) }, axes);
    if (x !== 0 || layout.toX(0) !== axisX) label(axes, screenX, axisY + 15, formatNumber(x), { anchor: "middle", size: 11, color: MUTED });
  }
  for (const y of yTicks) {
    const screenY = layout.toY(y);
    draw("line", { x1: round(axisX - 3), x2: round(axisX + 3), y1: round(screenY), y2: round(screenY), ...stroke(false, 1.1) }, axes);
    if (y !== 0 || layout.toY(0) !== axisY) label(axes, axisX - 6, screenY, formatNumber(y), { anchor: "end", baseline: "middle", size: 11, color: MUTED });
  }
  if (layout.toX(0) === axisX && layout.toY(0) === axisY) label(axes, axisX - 5, axisY + 14, "0", { anchor: "end", size: 11, color: MUTED });
}

function renderPlaneElement(group, clipped, element, layout, figure) {
  const toScreen = ([x, y]) => [layout.toX(x), layout.toY(y)];
  switch (element.shape) {
    case "point": {
      const [x, y] = toScreen(element.at);
      draw("circle", { cx: round(x), cy: round(y), r: 3.6, fill: element.open ? "#fff" : INK, stroke: INK, "stroke-width": 1.5 }, group);
      if (!element.label) return;
      // A point where sides, segments or angle arms meet is labelled on the side away from them, so the
      // label stays clear of the lines and the angle marks.
      const directions = attachedDirections(element.at, figure, toScreen);
      const [awayX, awayY] = directions.reduce(([sumX, sumY], [dx, dy]) => [sumX - dx, sumY - dy], [0, 0]);
      if (Math.hypot(awayX, awayY) > .2) {
        const [ux, uy] = unit(awayX, awayY);
        label(group, x + ux * 13, y + uy * 13, element.label, { anchor: "middle", baseline: "middle", weight: 600 });
      } else if (directions.length) {
        // The lines pass straight through the point: label it beside them, on the upper side.
        const [dx, dy] = directions[0];
        const [ux, uy] = dx > 0 ? [dy, -dx] : [-dy, dx];
        label(group, x + ux * 13, y + uy * 13, element.label, { anchor: "middle", baseline: "middle", weight: 600 });
      } else label(group, x + 7, y - 7, element.label, { weight: 600 });
      return;
    }
    case "segment": {
      const from = toScreen(element.from), to = toScreen(element.to);
      draw("path", { d: pathData([from, to]), ...stroke(element.dashed) }, group);
      const middle = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
      const [ux, uy] = unit(to[0] - from[0], to[1] - from[1]);
      for (let index = 0; index < (element.ticks ?? 0); index += 1) {
        const offset = (index - ((element.ticks - 1) / 2)) * 4;
        const center = [middle[0] + ux * offset, middle[1] + uy * offset];
        draw("path", { d: pathData([[center[0] - uy * 6, center[1] + ux * 6], [center[0] + uy * 6, center[1] - ux * 6]]), ...stroke(false, 1.4) }, group);
      }
      if (element.label) label(group, middle[0] + uy * 14, middle[1] - ux * 14, element.label, { anchor: "middle", baseline: "middle" });
      return;
    }
    case "line": {
      const [first, second] = element.through.map(toScreen);
      const [ux, uy] = unit(second[0] - first[0], second[1] - first[1]);
      const reach = layout.width + layout.height;
      draw("path", { d: pathData([[first[0] - ux * reach, first[1] - uy * reach], [first[0] + ux * reach, first[1] + uy * reach]]), ...stroke(element.dashed) }, clipped);
      if (element.label) label(group, second[0] - uy * 12 + 4, second[1] + ux * 12, element.label, { weight: 600 });
      return;
    }
    case "vector": {
      const from = toScreen(element.from), to = toScreen(element.to);
      const direction = [to[0] - from[0], to[1] - from[1]];
      const [ux, uy] = unit(...direction);
      draw("path", { d: pathData([from, [to[0] - ux * 6, to[1] - uy * 6]]), ...stroke(false, 2) }, group);
      arrowHead(group, to, direction);
      if (element.label) label(group, (from[0] + to[0]) / 2 + uy * 14, (from[1] + to[1]) / 2 - ux * 14, element.label, { anchor: "middle", baseline: "middle", weight: 600 });
      return;
    }
    case "polygon": {
      const points = element.points.map(toScreen);
      draw("path", { d: `${pathData(points)} Z`, ...stroke(false), fill: element.filled ? FILL : "none" }, group);
      if (element.label) {
        const [x, y] = centroid(points);
        label(group, x, y, element.label, { anchor: "middle", baseline: "middle", weight: 600 });
      }
      return;
    }
    case "circle": {
      const [x, y] = toScreen(element.center);
      const rx = element.radius * layout.xUnit, ry = element.radius * layout.yUnit;
      draw("ellipse", { cx: round(x), cy: round(y), rx: round(rx), ry: round(ry), ...stroke(element.dashed) }, group);
      if (element.label) label(group, x + rx * .72 + 4, y - ry * .72 - 4, element.label, { weight: 600 });
      return;
    }
    case "angle": {
      const vertex = toScreen(element.vertex);
      const first = unit(layout.toX(element.from[0]) - vertex[0], layout.toY(element.from[1]) - vertex[1]);
      const second = unit(layout.toX(element.to[0]) - vertex[0], layout.toY(element.to[1]) - vertex[1]);
      const bisector = unit(first[0] + second[0], first[1] + second[1]);
      const radius = 20;
      if (element.right) {
        const size = 11;
        draw("path", { d: pathData([
          [vertex[0] + first[0] * size, vertex[1] + first[1] * size],
          [vertex[0] + (first[0] + second[0]) * size, vertex[1] + (first[1] + second[1]) * size],
          [vertex[0] + second[0] * size, vertex[1] + second[1] * size],
        ]), ...stroke(false, 1.3) }, group);
      } else {
        const sweep = first[0] * second[1] - first[1] * second[0] > 0 ? 1 : 0;
        const start = [vertex[0] + first[0] * radius, vertex[1] + first[1] * radius];
        const end = [vertex[0] + second[0] * radius, vertex[1] + second[1] * radius];
        draw("path", { d: `M${round(start[0])} ${round(start[1])} A${radius} ${radius} 0 0 ${sweep} ${round(end[0])} ${round(end[1])}`, ...stroke(false, 1.3) }, group);
      }
      if (element.label) label(group, vertex[0] + bisector[0] * (radius + 13), vertex[1] + bisector[1] * (radius + 13), element.label, { anchor: "middle", baseline: "middle", size: 12 });
      return;
    }
    case "function": {
      const domain = element.domain ?? figure.xRange;
      const from = Math.max(domain[0], figure.xRange[0]), to = Math.min(domain[1], figure.xRange[1]);
      if (from >= to) return;
      const pieces = sampleFunction(compileExpression(element.expression), [from, to], figure.yRange);
      pieces.forEach((piece) => draw("path", { d: pathData(piece.map(toScreen)), ...stroke(element.dashed, 2.2, SERIES_COLORS[0]) }, clipped));
      const visible = pieces.flat().filter(([, y]) => y >= figure.yRange[0] && y <= figure.yRange[1]);
      if (element.label && visible.length) {
        const [x, y] = toScreen(visible[visible.length - 1]);
        label(group, Math.min(x, layout.width - 8), Math.max(14, Math.min(layout.height - 6, y - 8)), element.label, { anchor: "end", color: SERIES_COLORS[0], weight: 600 });
      }
      return;
    }
    case "polyline": {
      const points = element.points.map(toScreen);
      draw("path", { d: pathData(points), ...stroke(element.dashed, 2, SERIES_COLORS[0]) }, clipped);
      if (element.markers) points.forEach(([x, y]) => draw("circle", { cx: round(x), cy: round(y), r: 3.2, fill: SERIES_COLORS[0] }, group));
      if (element.label) {
        const [x, y] = points[points.length - 1];
        label(group, x, y - 9, element.label, { anchor: "end", color: SERIES_COLORS[0], weight: 600 });
      }
      return;
    }
    case "text": {
      const [x, y] = toScreen(element.at);
      label(group, x, y, element.value, { anchor: "middle", baseline: "middle" });
      return;
    }
  }
}

function renderPlane(figure, caption, width) {
  const layout = planeLayout(figure.xRange, figure.yRange, width, figure.equalScale ?? true);
  const svgNode = createSvg(layout.width, layout.height, caption);
  const clipId = `figure-clip-${clipCounter += 1}`;
  const clipPath = draw("clipPath", { id: clipId }, draw("defs", {}, svgNode));
  const left = layout.toX(figure.xRange[0]), top = layout.toY(figure.yRange[1]);
  draw("rect", { x: round(left), y: round(top), width: round(layout.toX(figure.xRange[1]) - left), height: round(layout.toY(figure.yRange[0]) - top) }, clipPath);
  renderAxes(svgNode, figure, layout);
  const clipped = draw("g", { "clip-path": `url(#${clipId})` }, svgNode);
  const group = draw("g", {}, svgNode);
  // Filled shapes first so lines and points stay visible on top of them.
  const ordered = [...figure.elements].sort((first, second) => Number(second.shape === "polygon") - Number(first.shape === "polygon"));
  ordered.forEach((element) => renderPlaneElement(group, clipped, element, layout, figure));
  return svgNode;
}

function renderBarChart(figure, caption, width) {
  const height = Math.round(width * .64);
  const rotate = figure.categories.length > 6 || figure.categories.some((category) => category.length > 10);
  const legend = figure.series.length > 1 || figure.series.some((series) => series.name);
  const margin = { left: 48, right: 12, top: legend ? 32 : 16, bottom: rotate ? 70 : 40 };
  const values = figure.series.flatMap((series) => series.values);
  const rawMin = Math.min(0, ...values), rawMax = Math.max(0, ...values);
  const step = niceStep((rawMax - rawMin) || 1, 6);
  const min = Math.floor(rawMin / step) * step;
  const max = Math.max(Math.ceil(rawMax / step) * step, min + step);
  const plotWidth = width - margin.left - margin.right, plotHeight = height - margin.top - margin.bottom;
  const toY = (value) => margin.top + (max - value) / (max - min) * plotHeight;
  const svgNode = createSvg(width, height, caption);

  for (const tick of tickValues(min, max, step)) {
    draw("line", { x1: margin.left, x2: width - margin.right, y1: round(toY(tick)), y2: round(toY(tick)), stroke: tick === 0 ? INK : GRID, "stroke-width": tick === 0 ? 1.3 : 1 }, svgNode);
    label(svgNode, margin.left - 6, toY(tick), formatNumber(tick), { anchor: "end", baseline: "middle", size: 11, color: MUTED });
  }
  const slot = plotWidth / figure.categories.length;
  const barWidth = Math.min(46, slot * .76 / figure.series.length);
  figure.categories.forEach((category, categoryIndex) => {
    const center = margin.left + slot * (categoryIndex + .5);
    figure.series.forEach((series, seriesIndex) => {
      const value = series.values[categoryIndex];
      const x = center - barWidth * figure.series.length / 2 + barWidth * seriesIndex;
      const y = toY(Math.max(0, value));
      draw("rect", { x: round(x + 1), y: round(y), width: round(barWidth - 2), height: round(Math.abs(toY(value) - toY(0))), fill: SERIES_COLORS[seriesIndex % SERIES_COLORS.length] }, svgNode);
      if (figure.showValues) label(svgNode, x + barWidth / 2, value >= 0 ? y - 4 : toY(value) + 12, formatNumber(value), { anchor: "middle", size: 11 });
    });
    const labelY = height - margin.bottom + 15;
    const text = label(svgNode, center, labelY, category, { anchor: rotate ? "end" : "middle", size: 12 });
    if (rotate) text.setAttribute("transform", `rotate(-35 ${round(center)} ${round(labelY)})`);
  });
  if (figure.yLabel) label(svgNode, 6, 12, figure.yLabel, { size: 12, color: MUTED, weight: 600 });
  if (figure.xLabel) label(svgNode, width - margin.right, height - 4, figure.xLabel, { anchor: "end", size: 12, color: MUTED, weight: 600 });
  if (legend) {
    let x = margin.left;
    figure.series.forEach((series, index) => {
      draw("rect", { x, y: 6, width: 12, height: 12, rx: 2, fill: SERIES_COLORS[index % SERIES_COLORS.length] }, svgNode);
      const name = series.name ?? `${index + 1}. adatsor`;
      label(svgNode, x + 17, 12, name, { baseline: "middle", size: 12 });
      x += 32 + name.length * 7;
    });
  }
  return svgNode;
}

function renderPieChart(figure, caption, width) {
  const radius = Math.round(width * .23), legendX = 2 * radius + 60;
  const height = Math.max(2 * radius + 40, figure.slices.length * 20 + 20), center = [radius + 20, height / 2];
  const total = figure.slices.reduce((sum, slice) => sum + slice.value, 0);
  const svgNode = createSvg(width, height, caption);
  let angle = -Math.PI / 2;
  figure.slices.forEach((slice, index) => {
    const sweep = slice.value / total * Math.PI * 2;
    const color = SERIES_COLORS[index % SERIES_COLORS.length];
    const pointAt = (value) => [center[0] + Math.cos(value) * radius, center[1] + Math.sin(value) * radius];
    if (sweep >= Math.PI * 2 - 1e-9) draw("circle", { cx: center[0], cy: center[1], r: radius, fill: color, stroke: "#fff", "stroke-width": 1.5 }, svgNode);
    else {
      const [start, end] = [pointAt(angle), pointAt(angle + sweep)];
      draw("path", { d: `M${center[0]} ${center[1]} L${round(start[0])} ${round(start[1])} A${radius} ${radius} 0 ${sweep > Math.PI ? 1 : 0} 1 ${round(end[0])} ${round(end[1])} Z`, fill: color, stroke: "#fff", "stroke-width": 1.5 }, svgNode);
    }
    if (figure.showPercent && sweep > .25) {
      const [x, y] = [center[0] + Math.cos(angle + sweep / 2) * radius * .64, center[1] + Math.sin(angle + sweep / 2) * radius * .64];
      label(svgNode, x, y, `${formatNumber(Math.round(slice.value / total * 1000) / 10)}%`, { anchor: "middle", baseline: "middle", size: 12, color: "#fff", weight: 700 });
    }
    const rowY = center[1] - figure.slices.length * 10 + index * 20 + 10;
    draw("rect", { x: legendX, y: round(rowY - 6), width: 12, height: 12, rx: 2, fill: color }, svgNode);
    label(svgNode, legendX + 18, rowY, slice.label, { baseline: "middle", size: 12 });
    angle += sweep;
  });
  return svgNode;
}

function renderNumberLine(figure, caption, width) {
  const height = 84, padding = 24, axisY = 50;
  const [min, max] = figure.range;
  const toX = (value) => padding + (value - min) / (max - min) * (width - 2 * padding);
  const svgNode = createSvg(width, height, caption);
  draw("line", { x1: 6, x2: width - 10, y1: axisY, y2: axisY, ...stroke(false, 1.4) }, svgNode);
  arrowHead(svgNode, [width - 4, axisY], [1, 0], INK, 8);
  const step = figure.tickStep ?? niceStep(max - min, 12);
  for (const tick of tickValues(min, max, step)) {
    draw("line", { x1: round(toX(tick)), x2: round(toX(tick)), y1: axisY - 5, y2: axisY + 5, ...stroke(false, 1.2) }, svgNode);
    label(svgNode, toX(tick), axisY + 20, formatNumber(tick), { anchor: "middle", size: 11, color: MUTED });
  }
  const color = SERIES_COLORS[0];
  for (const interval of figure.intervals) {
    const from = interval.from === null ? 6 : toX(Math.max(min, interval.from));
    const to = interval.to === null ? width - 12 : toX(Math.min(max, interval.to));
    draw("line", { x1: round(from), x2: round(to), y1: axisY, y2: axisY, stroke: color, "stroke-width": 5, "stroke-linecap": "butt", opacity: .75 }, svgNode);
    if (interval.from === null) arrowHead(svgNode, [2, axisY], [-1, 0], color, 10);
    else if (interval.from >= min) draw("circle", { cx: round(from), cy: axisY, r: 5, fill: interval.fromClosed ? color : "#fff", stroke: color, "stroke-width": 2 }, svgNode);
    if (interval.to === null) arrowHead(svgNode, [width - 4, axisY], [1, 0], color, 10);
    else if (interval.to <= max) draw("circle", { cx: round(to), cy: axisY, r: 5, fill: interval.toClosed ? color : "#fff", stroke: color, "stroke-width": 2 }, svgNode);
  }
  for (const point of figure.points) {
    draw("circle", { cx: round(toX(point.at)), cy: axisY, r: 4.5, fill: point.open ? "#fff" : INK, stroke: INK, "stroke-width": 1.6 }, svgNode);
    if (point.label) label(svgNode, toX(point.at), axisY - 13, point.label, { anchor: "middle", weight: 600 });
  }
  return svgNode;
}

const RENDERERS = { plane: renderPlane, barChart: renderBarChart, pieChart: renderPieChart, numberLine: renderNumberLine };

export function renderFigure(part) {
  const figureNode = document.createElement("figure");
  figureNode.className = "ws-figure";
  try {
    figureNode.append(RENDERERS[part.figure.kind](part.figure, part.caption, FIGURE_WIDTHS[part.figure.size ?? "medium"]));
  } catch {
    const fallback = document.createElement("p");
    fallback.className = "ws-figure-error";
    fallback.textContent = "Az ábra nem jeleníthető meg.";
    figureNode.append(fallback);
  }
  if (part.caption) {
    const caption = document.createElement("figcaption");
    caption.textContent = part.caption;
    figureNode.append(caption);
  }
  return figureNode;
}
