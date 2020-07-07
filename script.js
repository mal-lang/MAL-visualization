var svg = d3.select('svg');

var width = svg.attr("width")
var height = svg.attr("height");
var graph = {}

var boxWidth = 260
var labelHeight = 40
var attackStepHeight = 30
var sideMargin = 50

var colors = [
//	[Dark shade, light shade]
	["#D3367D", "#E072A4"],
	["#264D7D", "#447EC5"],
	["#519F2D", "#B0E298"],
	["#553A49", "#9C6D87"]
]

var assets = data.assets
var attackSteps = data.attackSteps
var relations = data.attackPaths
var associations = data.associations

var simulation = d3.forceSimulation(assets)
	.force('link', d3.forceLink().links(associations).strength(0.01))
	.force('center', d3.forceCenter(width/2, height/2))
	.force('charge', d3.forceManyBody().strength(-600))
	.on('tick', ticked)

//Lines for associations
graph.association = d3.select('svg')
	.selectAll('line')
	.data(associations)
	.enter()
graph.associationLink = graph.association.append('line')
	.attr('stroke-width', 2)
	.style('stroke', 'gray')

//Association labels
graph.associationLabel = d3.select('svg')
	.selectAll('.associationLabel')
	.data(associations)
	.enter()
graph.associationLabelText = graph.associationLabel.append('text')
	.text(function(d) {
		return d.name
	})

//SVG groups (g) for the assets
graph.asset = d3.select('svg')
	.selectAll('g')
	.data(assets)
	.enter()
	.append('g')
graph.assetBox = graph.asset.append(createAssetBox)

var drag = d3.drag()
	.on("start", draggedStart)
	.on("drag", dragged)
	.on("end", draggedEnd)

graph.asset.call(drag)

graph.attackPath = d3.select('svg')
	.selectAll('line .path')
	.data(relations)
	.enter()
graph.attackPathLink = graph.attackPath.append(function(d) {
	if(attackSteps[d.source].parent == attackSteps[d.target].parent) {
		return document.createElement('path')
	}
	var path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
	path.setAttributeNS(null, 'stroke-width', 1.1)
	path.setAttributeNS(null, 'stroke', 'black')
	path.setAttributeNS(null, 'fill', 'transparent')
	path.setAttributeNS(null, 'marker-end', 'url(#arrow)')
	return path
})

function ticked() {
	//Update Association link position
	graph.associationLink.attr('x1', function(d) {
			return d.source.x
		})
		.attr('y1', function(d) {
			return d.source.y + (30 * d.source.attackSteps.length + 40)/2
		})
		.attr('x2', function(d) {
			return d.target.x
		})
		.attr('y2', function(d) {
			return d.target.y + (30 * d.target.attackSteps.length + 40)/2
		})

	graph.associationLabelText.attr('x', function(d) {
			return d.source.x + (d.target.x - d.source.x)/2 + 15
		})
		.attr('y', function(d) {
			var ys = d.source.y + (30 * d.source.attackSteps.length + 40)/2
			var yt = d.target.y + (30 * d.target.attackSteps.length + 40)/2
			return ys + (yt - ys)/2
		})

	//Update Asset position
	graph.asset.attr('transform', function(d) {
		return 'translate(' + (d.x - boxWidth/2) + ',' + d.y + ')';
	});

	//Update Attack path position
	graph.attackPathLink.attr('d', function(d) {
		if(attackSteps[d.source].parent == attackSteps[d.target].parent) {
			return
		}
		var controllBend = 125
		//Decide if connect to Attack Steps on left or right side
		if(Math.abs(assets[attackSteps[d.source].parent].x - 
					assets[attackSteps[d.target].parent].x) < boxWidth/2) {
			if(assets[attackSteps[d.source].parent].x < width/2) {
				var x1 = assets[attackSteps[d.source].parent].x - boxWidth/2
				var x2 = assets[attackSteps[d.target].parent].x - boxWidth/2 - 5
				var c1 = x1 - controllBend
				var c2 = x2 - controllBend
			} else {
				var x1 = assets[attackSteps[d.source].parent].x + boxWidth/2
				var x2 = assets[attackSteps[d.target].parent].x + boxWidth/2 + 5
				var c1 = x1 + controllBend
				var c2 = x2 + controllBend
			}
		}
		else if(assets[attackSteps[d.source].parent].x - assets[attackSteps[d.target].parent].x > 0) {
			var x1 = assets[attackSteps[d.source].parent].x - boxWidth/2
			var x2 = assets[attackSteps[d.target].parent].x + boxWidth/2 + 5
			var c1 = x1 - controllBend
			var c2 = x2 + controllBend
		} else {
			var x1 = assets[attackSteps[d.source].parent].x + boxWidth/2
			var x2 = assets[attackSteps[d.target].parent].x - boxWidth/2 - 5
			var c1 = x1 + controllBend
			var c2 = x2 - controllBend
		}
		var y1 = assets[attackSteps[d.source].parent].y + (attackSteps[d.source].index * attackStepHeight) + 12 + labelHeight
		var y2 = assets[attackSteps[d.target].parent].y + (attackSteps[d.target].index * attackStepHeight) + 12 + labelHeight

		return "M " + x1 + " " + y1 + " C " + c1 + " " + y1 + " " + c2 + " " + y2 + " " + x2 + " " + y2
	})
}

//Function taking an asset object and returning a SVG element
function createAssetBox(d) {
	var group = document.createElementNS('http://www.w3.org/2000/svg', 'g')

	//Boundning rectangle
	var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
	rect.setAttributeNS(null, 'fill', colors[d.color][0])
	rect.setAttributeNS(null, 'width', boxWidth)
	rect.setAttributeNS(null, 'height', attackStepHeight * d.attackSteps.length + labelHeight)
	rect.setAttributeNS(null, 'rx', 5)
	rect.setAttributeNS(null, 'ry', 5)
	group.appendChild(rect)

	//Asset name
	var label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
	label.textContent = d.name;
	label.setAttributeNS(null, 'font-size', '1.25em')
	label.setAttributeNS(null, 'x', boxWidth/2)
	label.setAttributeNS(null, 'y', 25)
	label.setAttributeNS(null, 'text-anchor', 'middle')
	label.setAttributeNS(null, 'font-family', 'Arial')
	label.setAttributeNS(null, 'fill', 'white')
	group.appendChild(label)

	for(step in d.attackSteps) {
		var attackStep = attackSteps[d.attackSteps[step]]
		//Rectangle for each Attack Step
		var asbox = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		asbox.setAttributeNS(null, 'fill', colors[d.color][1])
		asbox.setAttributeNS(null, 'x', sideMargin)
		asbox.setAttributeNS(null, 'y', step * attackStepHeight + labelHeight)
		asbox.setAttributeNS(null, 'width', boxWidth - sideMargin * 2)
		asbox.setAttributeNS(null, 'height', attackStepHeight - 5)
		group.append(asbox)
		//Name of each Attack Step
		var text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
		text.textContent = attackStep.name;
		text.setAttributeNS(null, 'x', boxWidth/2)
		text.setAttributeNS(null, 'y', step * attackStepHeight + labelHeight + 17)
		text.setAttributeNS(null, 'text-anchor', 'middle')
		text.setAttributeNS(null, 'font-family', 'Arial')
		text.setAttributeNS(null, 'fill', 'black')
		group.appendChild(text)
	}

	//Draw internal Attack paths
	for(step in d.attackSteps) {
		var attackStep = attackSteps[d.attackSteps[step]]
		for(child in attackStep.children) {
			relation = relations[attackStep.children[child]]
			if(attackSteps[relation.source].parent == attackSteps[relation.target].parent) {
				var line = document.createElementNS('http://www.w3.org/2000/svg', 'path')
				var ys = (attackStep.index * attackStepHeight + labelHeight + 12)
				var yt = (attackSteps[relation.target].index * attackStepHeight + labelHeight + 12)
				var bend = 8
				if(attackSteps[relation.source].index < attackSteps[relation.target].index) {
					var start = "M " + (boxWidth-sideMargin) + " " + ys + " "
					var c1 = "" + ((boxWidth-sideMargin) + 20 + (bend*Math.abs(attackSteps[relation.source].index - attackSteps[relation.target].index))) + " " + ys
					var c2 = "" + ((boxWidth-sideMargin) + 20 + (bend*Math.abs(attackSteps[relation.source].index - attackSteps[relation.target].index))) + " " + yt
					var end = (boxWidth - sideMargin + 5) + " " + yt
				} else {
					var start = "M " + sideMargin + " " + ys + " "
					var c1 = "" + (sideMargin - 20 - (bend*Math.abs(attackSteps[relation.source].index - attackSteps[relation.target].index))) + " " + ys
					var c2 = "" + (sideMargin - 20 - (bend*Math.abs(attackSteps[relation.source].index - attackSteps[relation.target].index))) + " " + yt
					var end = (sideMargin - 5) + " " + yt
				}
				line.setAttributeNS(null, 'd', start + " C " + c1 + " " + c2 + " " + end)
				line.setAttributeNS(null, 'stroke-width', 1.1)
				line.setAttributeNS(null, 'stroke', 'black')
				line.setAttributeNS(null, 'fill', 'transparent')
				line.setAttributeNS(null, 'marker-end', 'url(#arrow)')
				group.appendChild(line)
			}
		}
	}

	return group
}

function draggedStart(d) {
	simulation.alphaTarget(0.3).restart()
	d.fixed = true
	d.fx = d.x
	d.fy = d.y
}

function dragged(d) {
	d.fx = d3.event.x
	d.fy = d3.event.y
}

function draggedEnd(d) {
	if (!d3.event.active) simulation.alphaTarget(0);
	d.fixed = false
}
