var svg = d3.select('svg');

var width = svg.attr("width")
var height = svg.attr("height");
var graph = {}

var boxWidth = 160

var colors = [
//	[Dark shade, light shade]
	["#D3367D", "#E072A4"],
	["#264D7D", "#447EC5"],
	["#519F2D", "#B0E298"],
	["#553A49", "#9C6D87"]
]

var allAttackSteps = [
	{name: "| access", parent: "Network", index: 0, children: [0]},
	{name: "| connect", parent: "Host", index: 0, children: [1]},
	{name: "| authenticate", parent: "Host", index: 1, children: [2]},
	{name: "| guessPassword", parent: "Host", index: 2, children: [3]},
	{name: "| guessedPassword", parent: "Host", index: 3, children: [4]},
	{name: "& access", parent: "Host", index: 4, children: []},
	{name: "| obtain", parent: "Password", index: 0, children: [5]},
	{name: "| attemptPhishing", parent: "User", index: 0, children: [7]},
	{name: "| phish", parent: "User", index: 1, children: [6]}
]

var relations = [
	{source: allAttackSteps[0], target: allAttackSteps[1]},
	{source: allAttackSteps[1], target: allAttackSteps[5]},
	{source: allAttackSteps[2], target: allAttackSteps[5]},
	{source: allAttackSteps[3], target: allAttackSteps[4]},
	{source: allAttackSteps[4], target: allAttackSteps[2]},
	{source: allAttackSteps[6], target: allAttackSteps[2]},
	{source: allAttackSteps[8], target: allAttackSteps[6]},
	{source: allAttackSteps[7], target: allAttackSteps[8]},
]

var assets = [
	{
		name: "Network",
		attackSteps: [
			allAttackSteps[0]
		],
		color: 0
	},
	{
		name: "Host",
		attackSteps: [
			allAttackSteps[1],
			allAttackSteps[2],
			allAttackSteps[3],
			allAttackSteps[4],
			allAttackSteps[5]
		],
		color: 1
	},
	{
		name: "Password",
		attackSteps: [
			allAttackSteps[6]
		],
		color: 2
	},
	{
		name: "User",
		attackSteps: [
			allAttackSteps[7],
			allAttackSteps[8]
		],
		color: 3
	}
]

var associations = [
	{source: 0, target: 1, sdata: assets[0], tdata: assets[1]},
	{source: 1, target: 2, sdata: assets[1], tdata: assets[2]},
	{source: 1, target: 3, sdata: assets[1], tdata: assets[3]},
]

var simulation = d3.forceSimulation(assets)
	.force('link', d3.forceLink().links(associations).distance(300))
	.force('center', d3.forceCenter(width/2, height/2))
	.force('charge', d3.forceManyBody().strength(-1000))
	.on('tick', ticked)

//Lines for associations
graph.association = d3.select('svg')
	.selectAll('line')
	.data(associations)
	.enter()
graph.associationLink = graph.association.append('line')

//SVG groups (g) for the assets
graph.asset = d3.select('svg')
	.selectAll('g')
	.data(assets)
	.enter()
	.append('g')
graph.assetBox = graph.asset.append(createAssetBox)

function ticked() {
	//Update Association link position
	graph.associationLink.attr('stroke-width', 2)
		.style('stroke', 'gray')
		.attr('x1', function(d) {
			return d.source.x
		})
		.attr('y1', function(d) {
			return d.source.y + (30 * d.sdata.attackSteps.length + 40)/2
		})
		.attr('x2', function(d) {
			return d.target.x
		})
		.attr('y2', function(d) {
			return d.target.y + (30 * d.tdata.attackSteps.length + 40)/2
		})

	//Update Asset position
	graph.asset.attr('transform', function(d) {
		return 'translate(' + (d.x - boxWidth/2) + ',' + d.y + ')';
	});
}

//Function taking an asset object and returning a SVG element
function createAssetBox(d) {
	var group = document.createElementNS('http://www.w3.org/2000/svg', 'g')

	var labelHeight = 40
	var attackStepHeight = 30
	var sideMargin = 5

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
		var attackStep = d.attackSteps[step]
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
		var attackStep = d.attackSteps[step]
		for(child in attackStep.children) {
			relation = relations[attackStep.children[child]]
			if(relation.source.parent == relation.target.parent) {
				var line = document.createElementNS('http://www.w3.org/2000/svg', 'path')
				var ys = (attackStep.index * attackStepHeight + labelHeight + 12)
				var yt = (relation.target.index * attackStepHeight + labelHeight + 12)
				var bend = 10
				if(relation.source.index < relation.target.index) {
					var start = "M " + boxWidth + " " + ys + " "
					var c1 = "" + (boxWidth + 15 + (bend*Math.abs(relation.source.index - relation.target.index))) + " " + ys
					var c2 = "" + (boxWidth + 15 + (bend*Math.abs(relation.source.index - relation.target.index))) + " " + yt
					var end = (boxWidth + 5) + " " + yt
				} else {
					var start = "M " + 0 + " " + ys + " "
					var c1 = "" + (0 - 15 - (bend*Math.abs(relation.source.index - relation.target.index))) + " " + ys
					var c2 = "" + (0 - 15 - (bend*Math.abs(relation.source.index - relation.target.index))) + " " + yt
					var end = -5 + " " + yt
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
