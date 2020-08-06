var svg = d3.select('svg');
svg.on("dblclick", function(){
	var menu = document.getElementById('clickMenu')
	if(menu != null) {
		menu.remove()
	}
	d3.selectAll(".attackPath").attr('opacity', 1.0)
	d3.selectAll(".attackStep").attr('opacity', 1.0)
	d3.selectAll(".asset").attr('opacity', 1.0)
	d3.selectAll(".association").attr('opacity', 1.0)
})
var g = svg.append("g")

var width = svg.attr("width")
var height = svg.attr("height");
var graph = {}

var boxWidth = 340
var labelHeight = 40
var attackStepHeight = 30
var sideMargin = 30
var arrowMargin = 85

var colors = [
//	[Dark shade, light shade]
	["#264D7D", "#447EC5"],
	["#D3367D", "#E072A4"],
	["#519F2D", "#B0E298"],
	["#553A49", "#9C6D87"],
	["#DD5E03", "#FEAC72"]
]

var root = {"children":[{"name":"Network","category":"System","children":[{"name":"access","type":"or","targets":[{"name":"connect","link":"hosts_NetworkAccess_networks","entity_name":"Host","size":4000}]}]},{"name":"Host","category":"System","children":[{"name":"connect","type":"or","targets":[{"name":"access","link":"none","entity_name":"Host","size":4000}]},{"name":"authenticate","type":"or","targets":[{"name":"access","link":"none","entity_name":"Host","size":4000}]},{"name":"guessPassword","type":"or","targets":[{"name":"guessedPassword","link":"none","entity_name":"Host","size":4000}]},{"name":"guessedPassword","type":"or","targets":[{"name":"authenticate","link":"none","entity_name":"Host","size":4000}]},{"name":"access","type":"and","targets":[]}]},{"name":"User","category":"System","children":[{"name":"attemptPhishing","type":"or","targets":[{"name":"phish","link":"none","entity_name":"User","size":4000}]},{"name":"phish","type":"or","targets":[{"name":"obtain","link":"passwords_Credentials_user","entity_name":"Password","size":4000}]}]},{"name":"Password","category":"System","children":[{"name":"obtain","type":"or","targets":[{"name":"authenticate","link":"passwords_Credentials_host","entity_name":"Host","size":4000}]}]}],"associations":[{"source":"Network","target":"Host","name":"NetworkAccess","leftName":"hosts","rightName":"networks"},{"source":"Host","target":"Password","name":"Credentials","leftName":"passwords","rightName":"host"},{"source":"User","target":"Password","name":"Credentials","leftName":"passwords","rightName":"user"}]}

var categories = {}
var numCategories = 0
root.children.forEach(function(element) {
	if (categories[element.category] == undefined) {
		var category = {
			name: element.category,
			index: numCategories++
		}
		categories[element.category] = category
	}
})

initialize(root);
set_id(root);
var relations = makeRelations(root);
setAssociationId(root);

var simulation = d3.forceSimulation(root.children)
	.force('link', d3.forceLink().links(root.associations))
	.force('center', d3.forceCenter(width/2, height/2))
	.force('collide', d3.forceCollide(200))
	.force('x', d3.forceX(width/2).strength(0.0125))
    .force('y', d3.forceY(height/2).strength(0.0275))
	.on('tick', ticked)

svg.call(d3.zoom()
	.extent([[0, 0], [width, height]])
	.scaleExtent([-8, 8])
	.on("zoom", zoomed))
	.on("dblclick.zoom", null)

function zoomed() {
	g.attr("transform", d3.event.transform);
}

d3.select('#sideMenu')
	.selectAll('.label')
	.data([{text: "MAL-Visualizer"}])
	.enter()
	.append("h4")
	.text(function(d) {
		return d.text
	})
	.attr("class", "font")

d3.select('#sideMenu').append("hr")

var hide = true;
var hideAssets = d3.select('#sideMenu')
	.selectAll('.hideButton')
	.data([{text: "Hide assets on trace"}])
	.enter()
	.append("label")
	.attr("class", "font")
	.text(function(d) {
		return d.text
	})
	.append("input")
    .attr("checked", true)
    .attr("type", "checkbox")
	.on("click", function(d) {
		hide = !hide
	})

d3.select('#sideMenu').append("hr")

if(Object.keys(categories)[0] != "undefined") {
	var categoryButtons = d3.select('#sideMenu')
		.selectAll('.catButton')
		.data(Object.keys(categories).map(function(d) {
			return { name: d, hidden: false }
		}))
		.enter()
		.append("div")
		.attr("style", "width: 100%")
		.append("label")
		.attr("class", "font")
		.text(function(d) {
			if(d.name.length > 19) {
				return d.name.substring(0, 16) + "..."
			}
			return d.name
		})
		.append("input")
		.attr("checked", true)
		.attr("type", "checkbox")
		.attr("id", function(d,i) { return 'a'+i; })
		.on("click", function(d) {
			d.hidden = !d.hidden
			if(root.children) {
				root.children.forEach(function(asset) {
					if(asset.category == d.name) {
						document.getElementById('asset_checkbox_' + asset.name).		checked = !d.hidden
						asset.hidden = d.hidden
					}
				})
			}
			update()
		})
	d3.select('#sideMenu').append("hr")
}

var buttons = d3.select('#sideMenu')
	.selectAll('.button')
	.data(root.children)
	.enter()
	.append("div")
	.attr("style", "width: 100%")
	.append("label")
	.attr("class", "font")
	.text(function(d) {
		if(d.name.length > 19) {
			return d.name.substring(0, 16) + "..."
		}
		return d.name
	})
	.append("input")
    .attr("checked", true)
    .attr("type", "checkbox")
    .attr("id", function(d) {
		return 'asset_checkbox_' + d.name;
	})
	.on("click", function(d) {
		d.hidden = !d.hidden
		update()
	})

d3.select('#sideMenu').append("hr")

var exportButton = d3.select('#sideMenu')
	.selectAll('.exportButton')
	.data([{text: "Export"}])
	.enter()
	.append("button")
	.attr("style", "position: absolute; left: 5px; bottom: 10px; margin: auto; width: 170px; height: 30px")
	.text(function(d) {
		return d.text
	})
	.attr("onclick", "export_svg()")

graph.association = g.selectAll('.association')
graph.asset = g.selectAll('.asset')
graph.attackPath = g.selectAll('.attackpath')
graph.associationPathLink = g.selectAll('.associationPathLink')

update()

function appendClass(element, newClass) {
	var oldClass = element.getAttributeNS(null, 'class')
	if(oldClass) {
		if(!oldClass.split(" ").includes(newClass)) {
			element.setAttributeNS(
				null, 
				'class', 
				oldClass + " " + newClass
			)
		}
	}
}

function childrenRecurse(base, attackStep, traversed) {
	var assetElem = document.getElementById('asset_' + attackStep.entity.name)
	appendClass(assetElem, "rec_child_to_" + base.entity.name + "_" + base.name)
	if(attackStep.target_steps) {
		attackStep.target_steps.forEach(function(child) {
			if(!traversed[child.entity.name + "_" + child.name]) {
				var childElem = document.getElementById(child.entity.name + "_" + child.name)
				appendClass(childElem, "rec_child_to_" + base.entity.name + "_" + base.name)
				
				var pathElem = document.getElementById(
					'path_' + attackStep.entity.name + "_" + attackStep.name +
					'_to_' + child.entity.name + "_" + child.name
				)
				appendClass(pathElem, "rec_child_to_" + base.entity.name + "_" + base.name)

				var association_id = pathElem.getAttributeNS(null, 'data-association')
				if(association_id != null) {
					var associationElem = document.getElementById(association_id)
					appendClass(associationElem, "rec_child_to_" + base.entity.name + "_" + base.name)
				}

				traversed[child.entity.name + "_" + child.name] = true
				childrenRecurse(base, child, traversed)
			}
		})
	}
}

function parentRecurse(base, attackStep, traversed) {
	var assetElem = document.getElementById('asset_' + attackStep.entity.name)
	appendClass(assetElem, "rec_parent_to_" + base.entity.name + "_" + base.name)
	if(attackStep.source_steps) {
		attackStep.source_steps.forEach(function(parent) {
			if(!traversed[parent.entity.name + "_" + parent.name]) {
				var parentElem = document.getElementById(parent.entity.name + "_" + parent.name)
				appendClass(parentElem, "rec_parent_to_" + base.entity.name + "_" + base.name)

				var pathElem = document.getElementById(
					'path_' + parent.entity.name + "_" + parent.name +
					'_to_' + attackStep.entity.name + "_" + attackStep.name
				)
				appendClass(pathElem, "rec_parent_to_" + base.entity.name + "_" + base.name)

				var association_id = pathElem.getAttributeNS(null, 'data-association')
				if(association_id != null) {
					var associationElem = document.getElementById(association_id)
					appendClass(associationElem, "rec_parent_to_" + base.entity.name + "_" + base.name)
				}

				traversed[parent.entity.name + "_" + parent.name] = true
				parentRecurse(base, parent, traversed)
			}
		})
	}
}

if(root.children) {
	root.children.forEach(function(asset) {
		if(asset.children) {
			asset.children.forEach(function(attackStep) {
				var traversed = {}
				traversed[attackStep.entity.name + "_" + attackStep.name] = true
				childrenRecurse(attackStep, attackStep, traversed)

				traversed = {}
				traversed[attackStep.entity.name + "_" + attackStep.name] = true
				parentRecurse(attackStep, attackStep, traversed)
			})
		}
	})
}

function update() {
	//Lines for associations
	graph.association = graph.association.data(root.associations)
	graph.association.exit().remove()
	graph.association = graph.association.enter()
		.append('line')
		.attr('stroke-width', 2)
		.style('stroke', 'grey')
		.attr("class", "association")
		.attr("id", function(d) {
			return d.leftName + "_" + d.name + "_" + d.rightName
		})
		.merge(graph.association)
		.attr("visibility", function(d) {
			return d.source.hidden || d.target.hidden ? "hidden" : "visible"
		})

	graph.asset = graph.asset.data(root.children)
	graph.asset.exit().remove()
	graph.asset = graph.asset.enter()
		.append(createAssetBox)
		.merge(graph.asset)
		.attr("visibility", function(d) { return d.hidden ? "hidden" : "visible" })
	
	graph.attackPath = graph.attackPath.data(relations)
	graph.attackPath.exit().remove()
	graph.attackPath = graph.attackPath.enter()
		.append(function(d) {
			var target = document.getElementById(d.target.entity.name + "_" + d.target.name)
			appendClass(target, "child_to_" + d.source.entity.name + "_" + d.source.name)

			var source = document.getElementById(d.source.entity.name + "_" + d.source.name)
			appendClass(source, "parent_to_" + d.target.entity.name + "_" + d.target.name)
			
			var targetAsset = document.getElementById('asset_' + d.target.entity.name)
			appendClass(targetAsset, "child_to_" + d.source.entity.name + "_" + d.source.name)
			appendClass(targetAsset, "parent_to_" + d.target.entity.name + "_" + d.target.name)
			
			var sourceAsset = document.getElementById('asset_' + d.source.entity.name)
			appendClass(sourceAsset, "child_to_" + d.source.entity.name + "_" + d.source.name)
			appendClass(sourceAsset, "parent_to_" + d.target.entity.name + "_" + d.target.name)

			if(d.source.entity.name == d.target.entity.name) {
				return document.createElement('path')
			}

			var association_id = d.association.leftName + "_" + 
				d.association.name + "_" +
				d.association.rightName

			var association = document.getElementById(association_id)
			appendClass(association, "child_to_" + d.source.entity.name + "_" + d.source.name)
			appendClass(association, "parent_to_" + d.target.entity.name + "_" + d.target.name)

			var path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
			path.setAttributeNS(null, 'stroke-width', 1.1)
			path.setAttributeNS(null, 'stroke', 'black')
			path.setAttributeNS(null, 'fill', 'transparent')
			path.setAttributeNS(null, 'marker-end', 'url(#arrow)')
			path.setAttributeNS(null, 
				'id', 'path_' + d.source.entity.name + "_" + d.source.name + 
				'_to_' + d.target.entity.name + "_" + d.target.name
			)
			path.setAttributeNS(
				null, 
				'class', 
				' notClickable attackPath child_to_' + d.source.entity.name + "_" + d.source.name + 
				' parent_to_' + d.target.entity.name + "_" + d.target.name
			)
			path.setAttributeNS(null, 'data-association', association_id)
			return path
		})
		.merge(graph.attackPath)
		.attr("visibility", function(d) {
			return d.source.entity.hidden || d.target.entity.hidden ? "hidden" : "visible"
		})
	
	graph.associationPathLink = graph.associationPathLink.data(relations)
	graph.associationPathLink.exit().remove()
	graph.associationPathLink = graph.associationPathLink.enter()
		.append('line')
		.attr('stroke-width', 1.4)
		.style('stroke', 'blue')
		.style('stroke-dasharray', '5,5')

	var drag = d3.drag()
		.on("start", draggedStart)
		.on("drag", dragged)
		.on("end", draggedEnd)

	graph.asset.call(drag)
	
	simulation.nodes(root.children);
	simulation.force('link', d3.forceLink().links(root.associations).strength(0.01))
	simulation.restart();
}

function ticked() {
	//Update Association link position
	graph.association.attr('x1', function(d) {
			return d.source.x
		})
		.attr('y1', function(d) {
			return d.source.y + (30 * d.source.children.length + 40)/2
		})
		.attr('x2', function(d) {
			return d.target.x
		})
		.attr('y2', function(d) {
			return d.target.y + (30 * d.target.children.length + 40)/2
		})
	
	//Update Asset position
	graph.asset.attr('transform', function(d) {
		return 'translate(' + (d.x - boxWidth/2) + ',' + d.y + ')';
	})
	
    //Update Attack path position
	graph.attackPath.attr('d', function(d) {
		if(d.source.entity.name == d.target.entity.name) {
			return
		}
        var controllBend = 125
		//Decide if connect to Attack Steps on left or right side
		if(Math.abs(d.source.entity.x - 
					d.target.entity.x) < boxWidth/2) {
			if(d.source.entity.x < width/2) {
				var x1 = d.source.entity.x - boxWidth/2 + sideMargin
				var x2 = d.target.entity.x - boxWidth/2 + sideMargin - 5
				var c1 = x1 - controllBend
				var c2 = x2 - controllBend
			} else {
				var x1 = d.source.entity.x + boxWidth/2 - sideMargin
				var x2 = d.target.entity.x + boxWidth/2 - sideMargin + 5
				var c1 = x1 + controllBend
				var c2 = x2 + controllBend
			}
		}
		else if(d.source.entity.x - d.target.entity.x > 0) {
			var x1 = d.source.entity.x - boxWidth/2 + sideMargin
			var x2 = d.target.entity.x + boxWidth/2 - sideMargin + 5
			var c1 = x1 - controllBend
			var c2 = x2 + controllBend
		} else {
			var x1 = d.source.entity.x + boxWidth/2 - sideMargin
			var x2 = d.target.entity.x - boxWidth/2 + sideMargin - 5
			var c1 = x1 + controllBend
			var c2 = x2 - controllBend
        }
		var y1 = d.source.entity.y + 
				(d.source.index * attackStepHeight) + 12 + labelHeight
		var y2 = d.target.entity.y + 
				(d.target.index * attackStepHeight) + 12 + labelHeight

		return "M " + x1 + " " + y1 + 
			" C " + c1 + " " + y1 + " " + 
			c2 + " " + y2 + " " + x2 + " " + y2
	})

	graph.associationPathLink.attr('x1', function(d) {
			if(d.association != "none") {
				var path = document.getElementById('path_' + 
					d.source.entity.name + "_" + 
					d.source.name + '_to_' + 
					d.target.entity.name + "_" + d.target.name)
				var mid = path.getTotalLength() * 0.6
				var midPoint = path.getPointAtLength(mid)
				return midPoint.x
			}
		})
		.attr('y1', function(d) {
			if(d.association != "none") {
				var path = document.getElementById('path_' + 
					d.source.entity.name + "_" + 
					d.source.name + '_to_' + 
					d.target.entity.name + "_" + d.target.name)
				var mid = path.getTotalLength() * 0.6
				var midPoint = path.getPointAtLength(mid)
				return midPoint.y
			}
		})
		.attr('x2', function(d) {
			if(d.association != "none") {
				var path = document.getElementById('path_' + 
					d.source.entity.name + "_" + 
					d.source.name + '_to_' + 
					d.target.entity.name + "_" + d.target.name)
				var association_id = path.getAttributeNS(null, 'data-association')
				var association = document.getElementById(association_id)
				var mid = association.getTotalLength() * 0.4
				var midPoint = association.getPointAtLength(mid)
				return midPoint.x
			}
		})
		.attr('y2', function(d) {
			if(d.association != "none") {
				var path = document.getElementById('path_' + 
					d.source.entity.name + "_" + 
					d.source.name + '_to_' + 
					d.target.entity.name + "_" + d.target.name)
				var association_id = path.getAttributeNS(null, 'data-association')
				var association = document.getElementById(association_id)
				var mid = association.getTotalLength() * 0.4
				var midPoint = association.getPointAtLength(mid)
				return midPoint.y
			}
		})
}

function removeMenuAndHide() {
	document.getElementById('clickMenu').remove()
	d3.selectAll('.asset').attr("opacity", "1.0")
	d3.selectAll('.attackStep').attr("opacity","0.1")
	d3.selectAll('.attackPath').attr("opacity","0.0")
	if(hide) {
		d3.selectAll('.asset').attr("opacity", "0.0")
	}
	d3.selectAll('.association').attr("opacity", "0.0")
}

function traceChildren(attackStep) {
	removeMenuAndHide()
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.' + attackStep).attr("opacity","1.0")
	d3.selectAll('.child_to_' + attackStep).attr("opacity","1.0")
}

function traceParents(attackStep) {
	removeMenuAndHide()
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.' + attackStep).attr("opacity","1.0")
	d3.selectAll('.parent_to_' + attackStep).attr("opacity","1.0")
}

function traceAllChildren(attackStep) {
	removeMenuAndHide()
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.rec_child_to_' + attackStep).attr("opacity","1.0")
}

function traceAllParents(attackStep) {
	removeMenuAndHide()
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.rec_parent_to_' + attackStep).attr("opacity","1.0")
}

function asclick(name) {
	var old = document.getElementById('clickMenu')
	if(old != null) {
		old.remove()
	}
	var x = event.clientX
	var y = event.clientY
	var clickMenu = document.createElement('div')
	clickMenu.setAttribute('id', 'clickMenu')
	clickMenu.setAttribute('style', 'position:absolute;' +
		'left:'+x+'px;top:'+y+'px;' + 
		'background-color:orange;'
	)
	var p1 = document.createElement('p')
	p1.innerHTML = "Trace Children"
	p1.setAttribute('onclick', 'traceChildren("' + name + '")')
	clickMenu.appendChild(p1)
	var p2 = document.createElement('p')
	p2.innerHTML = "Trace Parents"
	p2.setAttribute('onclick', 'traceParents("' + name + '")')
	clickMenu.appendChild(p2)
	var p3 = document.createElement('p')
	p3.innerHTML = "Trace All Children"
	p3.setAttribute('onclick', 'traceAllChildren("' + name + '")')
	clickMenu.appendChild(p3)
	var p4 = document.createElement('p')
	p4.innerHTML = "Trace All Parents"
	p4.setAttribute('onclick', 'traceAllParents("' + name + '")')
	clickMenu.appendChild(p4)
	document.body.appendChild(clickMenu)
}

//Function taking an asset object and returning a SVG element
function createAssetBox(d) {
    if(!d.children) {
        d.children = []
    }
	var group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
	var classString = "asset"

	//Boundning rectangle
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
	rect.setAttributeNS(null, 'fill', colors[categories[d.category].index][0])
    rect.setAttributeNS(null, 'width', boxWidth)
	rect.setAttributeNS(
		null, 
		'height', 
		attackStepHeight * d.children.length + labelHeight + sideMargin/2)
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
	for(step in d.children) {
		var attackStep = d.children[step]
		attackStep.index = parseInt(step)
		classString += " " + d.name + "_" + attackStep.name
		//Rectangle for each Attack Step
		var asbox = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		asbox.setAttributeNS(null, 'fill', colors[categories[d.category].index][1])
		asbox.setAttributeNS(null, 'x', sideMargin)
		asbox.setAttributeNS(null, 'y', step * attackStepHeight + labelHeight)
		asbox.setAttributeNS(null, 'width', boxWidth-2*sideMargin)
		asbox.setAttributeNS(null, 'height', attackStepHeight - 5)
		asbox.setAttributeNS(null, 
			'oncontextmenu', 'asclick("' + d.name + "_" + attackStep.name + '")'
		)
		asbox.setAttributeNS(null, 'id', d.name+ "_" +attackStep.name)
		asbox.setAttributeNS(null, 'class', "attackStep ")
		group.append(asbox)
		//Name of each Attack Step
		var text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
		if(attackStep.type == "or") {
			text.textContent = "| " + attackStep.name;
		} else if(attackStep.type == "and") {
			text.textContent = "& " + attackStep.name;
		} else {
			text.textContent = attackStep.name;
		}
		if(text.textContent.length > 19) {
			text.textContent = text.textContent.substring(0, 16) + "..."
		}
		text.setAttributeNS(null, 'x', boxWidth/2)
		text.setAttributeNS(null, 'y', step * attackStepHeight + labelHeight + 17)
		text.setAttributeNS(null, 'text-anchor', 'middle')
		text.setAttributeNS(null, 'font-family', 'Arial')
		text.setAttributeNS(null, 'fill', 'black')
		text.setAttributeNS(null, 'class', 'notClickable')
		group.appendChild(text)
    }
    
	//Draw internal Attack paths
	for(step in d.children) {
        var attackStep = d.children[step]
		for(child in attackStep.targets) {
            relation = attackStep.target_steps[child]
			if(attackStep.entity.name == relation.entity.name) {
				var line = document.createElementNS('http://www.w3.org/2000/svg', 'path')
				var ys = (attackStep.index * attackStepHeight + labelHeight + 12)
				var yt = (relation.index * attackStepHeight + labelHeight + 12)
                var bend = 8
				if(attackStep.index < relation.index) {
					var start = "M " + (boxWidth-arrowMargin) + " " + ys + " "
					var c1 = "" + ((boxWidth-arrowMargin) + 20 + 
							(bend*Math.abs(attackStep.index - relation.index))) + " " + ys
					var c2 = "" + ((boxWidth-arrowMargin) + 20 + 
							(bend*Math.abs(attackStep.index - relation.index))) + " " + yt
					var end = (boxWidth - arrowMargin + 5) + " " + yt
				} else {
					var start = "M " + arrowMargin + " " + ys + " "
					var c1 = "" + ((arrowMargin) - 20 - 
							(bend*Math.abs(attackStep.index - relation.index))) + " " + ys
					var c2 = "" + ((arrowMargin) - 20 - 
							(bend*Math.abs(attackStep.index - relation.index))) + " " + yt
                    var end = (arrowMargin - 5) + " " + yt
				}
				line.setAttributeNS(null, 'd', start + " C " + c1 + " " + c2 + " " + end)
				line.setAttributeNS(null, 'stroke-width', 1.1)
				line.setAttributeNS(null, 'stroke', 'black')
				line.setAttributeNS(null, 'fill', 'transparent')
				line.setAttributeNS(null, 'marker-end', 'url(#arrow)')
				line.setAttributeNS(null, 'id', 
					'path_' + attackStep.entity.name + "_" + attackStep.name + "_to_" +
					relation.entity.name + "_" + relation.name	
				)
				line.setAttributeNS(null, 'class', 'notClickable attackPath' +
					' child_to_' + attackStep.entity.name + "_" + attackStep.name +
					' parent_to_' + relation.entity.name + "_" + relation.name
				)
				group.appendChild(line)
			}
		}
	}
	group.setAttributeNS(null, 'class', classString)
	group.setAttributeNS(null, 'id', 'asset_' + d.name)
	return group
}

function draggedStart(d) {
	simulation.alphaTarget(1.0).restart()
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

// Returns a list of all nodes under the root.
function set_id(root) {
    i = 0;

    function recurse(node) {
        if (node.children) node.children.forEach(recurse);
        if (!node.id) node.id = ++i;
        node.show = false
        node.selected = false
    }

    recurse(root);
}

function setAssociationId(root) {
	idMap = {}
	if (root.children) {
        root.children.forEach(function(entity, i) {
			idMap[entity.name] = i
		})
	}
	if (root.associations) {
        root.associations.forEach(function(association) {
			association.source = idMap[association.source]
			association.target = idMap[association.target]
		})
	}
}

function makeRelations(root) {
    relations = []
    if (root.children) {
        root.children.forEach(function(entity) {
            if (entity.children) {
                entity.children.forEach(function(attackStep) {
                    if (attackStep.target_steps) {
                        attackStep.target_steps.forEach(function(target, i) {
                            relation = {
								source: attackStep, 
								target: target,
								association: attackStep.targets[i].link
							}
                            relations.push(relation)
                        })
                    }
                })
            }
        })
    }
    return relations
}

function initialize(root) {

    nodes = []
    nodes.push(root);
    root.opacity = 0.0
    if (root.children) {
        root.children.forEach(function(entity) {
            entity.hidden = false;
            nodes.push(entity);
            if (entity.children) {
                entity.children.forEach(function(attack_step) {
                    attack_step.target_steps = []
					attack_step.source_steps = []
                    attack_step.entity = entity;
					attack_step.hidden = false;
                    nodes.push(attack_step);
                })
            }
        })
	}

    if (root.children) {
        root.children.forEach(function(entity) {
            if (entity.children) {
                entity.children.forEach(function(attack_step) {
                    //attack_step.color = color(entity.name)
                    attack_step.opacity = 1
                    if (attack_step.targets) {
                        attack_step.targets.forEach(function(target_ref) {
                            var target = nodes.filter(function(attack_step) {
								return attack_step.name == target_ref.name && 
									attack_step.entity.name == target_ref.entity_name;
                            })[0]
                            if (target) {
                                attack_step.target_steps.push(target)
                                target.source_steps.push(attack_step)
							}
							var through = root.associations.filter(function(association) {
								var association_id = association.leftName + "_" + 
									association.name + "_" + association.rightName
								return association_id == target_ref.link
							})[0]
							if (through) {
								target_ref.link = through
							}
							
                        })
                    }
                    //entity.color = color(entity.name)
                    entity.opacity = 0.75
                })
            }
        })
    }
}

function export_svg() {
    var svg = document.getElementById("svg_content")
    //get svg source.
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(svg);

    //add name spaces.
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }

    //add xml declaration
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

	//convert svg source to URI data scheme.
    var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
	
	var link = document.createElement("a");
	link.download = "MAL.svg"
	link.href = url
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	delete link;
}