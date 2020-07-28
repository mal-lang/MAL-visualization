var svg = d3.select('svg');

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

var root = {"children":[{"name":"Network","children":[{"name":"access","type":"or","targets":[{"name":"connect","entity_name":"Host","size":4000}]}]},{"name":"Host","children":[{"name":"connect","type":"or","targets":[{"name":"access","entity_name":"Host","size":4000}]},{"name":"authenticate","type":"or","targets":[{"name":"access","entity_name":"Host","size":4000}]},{"name":"guessPassword","type":"or","targets":[{"name":"guessedPassword","entity_name":"Host","size":4000}]},{"name":"guessedPassword","type":"or","targets":[{"name":"authenticate","entity_name":"Host","size":4000}]},{"name":"access","type":"and","targets":[]}]},{"name":"User","children":[{"name":"attemptPhishing","type":"or","targets":[{"name":"phish","entity_name":"User","size":4000}]},{"name":"phish","type":"or","targets":[{"name":"obtain","entity_name":"Password","size":4000}]}]},{"name":"Password","children":[{"name":"obtain","type":"or","targets":[{"name":"authenticate","entity_name":"Host","size":4000}]}]}],"associations":[{"source":"Network","target":"Host"},{"source":"Host","target":"Password"},{"source":"User","target":"Password"}]}

var categories = {}
var numCategories = 0
root.children.forEach(function(element) {
	if (categories[element.category] == undefined) {
		categories[element.category] = numCategories++
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
	.on("zoom", zoomed));

function zoomed() {
	g.attr("transform", d3.event.transform);
}

var exportButton = d3.select('div')
	.selectAll('.exportButton')
	.data([{text: "Export"}])
	.enter()
	.append("button")
	.attr("style", "margin: 5px; width: 90%; height: 30px")
	.text(function(d) {
		return d.text
	})
	.attr("onclick", "export_svg()")

var buttons = d3.select('div')
	.selectAll('.button')
	.data(root.children)
	.enter()
	.append("div")
	.attr("style", "width: 100%")
	.append("label")
	.attr("font-family", "Arial")
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
		update()
	})

graph.association = g.selectAll('.association')
graph.asset = g.selectAll('.asset')
graph.attackPath = g.selectAll('.attackpath')

update()

function childrenRecurse(base, attackStep, traversed) {
	if(attackStep.target_steps) {
		attackStep.target_steps.forEach(function(child) {
			if(!traversed[child.entity.name + "_" + child.name]) {
				var childElem = document.getElementById(child.entity.name + "_" + child.name)
				var oldClass = childElem.getAttributeNS(null, 'class')
				childElem.setAttributeNS(
					null, 
					'class', 
					oldClass + " rec_child_to_" + base.entity.name + "_" + base.name
				)
				
				var pathElem = document.getElementById(
					'path_' + attackStep.entity.name + "_" + attackStep.name +
					'_to_' + child.entity.name + "_" + child.name
				)
				oldClass = pathElem.getAttributeNS(null, 'class')
				pathElem.setAttributeNS(
					null, 
					'class', 
					oldClass + " rec_child_to_" + base.entity.name + "_" + base.name
				)

				traversed[child.entity.name + "_" + child.name] = true
				childrenRecurse(base, child, traversed)
			}
		})
	}
}

function parentRecurse(base, attackStep, traversed) {
	if(attackStep.source_steps) {
		attackStep.source_steps.forEach(function(parent) {
			if(!traversed[parent.entity.name + "_" + parent.name]) {
				var parentElem = document.getElementById(parent.entity.name + "_" + parent.name)
				var oldClass = parentElem.getAttributeNS(null, 'class')
				parentElem.setAttributeNS(
					null, 
					'class', 
					oldClass + " rec_parent_to_" + base.entity.name + "_" + base.name
				)

				var pathElem = document.getElementById(
					'path_' + parent.entity.name + "_" + parent.name +
					'_to_' + attackStep.entity.name + "_" + attackStep.name
				)
				oldClass = pathElem.getAttributeNS(null, 'class')
				pathElem.setAttributeNS(
					null, 
					'class', 
					oldClass + " rec_parent_to_" + base.entity.name + "_" + base.name
				)

				traversed[parent.entity.name + "_" + parent.name] = true
				parentRecurse(base, parent, traversed)
			}
		})
	}
}


function update() {
	//Lines for associations
	graph.association = graph.association.data(root.associations)
	graph.association.exit().remove()
	graph.association = graph.association.enter()
		.append('line')
		.attr('stroke-width', 2)
		.style('stroke', 'grey')
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
			var oldClass = target.getAttributeNS(null, 'class')
			target.setAttributeNS(null, 'class', 
				oldClass + " child_to_" + d.source.entity.name + "_" + d.source.name
			)
			var source = document.getElementById(d.source.entity.name + "_" + d.source.name)
			oldClass = source.getAttributeNS(null, 'class')
			source.setAttributeNS(null, 'class', 
				oldClass + " parent_to_" + d.target.entity.name + "_" + d.target.name
			)
			if(d.source.entity.name == d.target.entity.name) {
				return document.createElement('path')
			}
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
			return path
		})
		.merge(graph.attackPath)
		.attr("visibility", function(d) {
			return d.source.entity.hidden || d.target.entity.hidden ? "hidden" : "visible"
		})

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
}

function traceChildren(attackStep) {
	document.getElementById('clickMenu').remove()
	d3.selectAll('.attackStep').attr("opacity","0.1")
	d3.selectAll('.attackPath').attr("opacity","0.0")
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.child_to_' + attackStep).attr("opacity","1.0")
}

function traceParents(attackStep) {
	document.getElementById('clickMenu').remove()
	d3.selectAll('.attackStep').attr("opacity","0.1")
	d3.selectAll('.attackPath').attr("opacity","0.0")
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.parent_to_' + attackStep).attr("opacity","1.0")
}

function traceAllChildren(attackStep) {
	document.getElementById('clickMenu').remove()
	d3.selectAll('.attackStep').attr("opacity","0.1")
	d3.selectAll('.attackPath').attr("opacity","0.0")
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.rec_child_to_' + attackStep).attr("opacity","1.0")
}

function traceAllParents(attackStep) {
	document.getElementById('clickMenu').remove()
	d3.selectAll('.attackStep').attr("opacity","0.1")
	d3.selectAll('.attackPath').attr("opacity","0.0")
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

	//Boundning rectangle
    var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
	rect.setAttributeNS(null, 'fill', colors[categories[d.category]][0])
    rect.setAttributeNS(null, 'width', boxWidth)
	rect.setAttributeNS(
		null, 
		'height', 
		attackStepHeight * d.children.length + labelHeight)
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
		//Rectangle for each Attack Step
		var asbox = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
		asbox.setAttributeNS(null, 'fill', colors[categories[d.category]][1])
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
                        attackStep.target_steps.forEach(function(target) {
                            relation = {source: attackStep, target: target}
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
                    attack_step.entity = entity
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