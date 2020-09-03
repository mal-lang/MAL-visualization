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
			idMap[entity.name] = entity
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
								associations: attackStep.targets[i].links
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

function setRelationAssociations(relations, associations) {
    var relations2 = relations.filter(function(d) {
		return d.source.entity.name != d.target.entity.name
	})
    idMap = {}
	if (associations) {
        associations.forEach(function(a) {
            association_identifier = a.leftName + "_" + a.name + "_" + a.rightName
			idMap[association_identifier] = a
		})
	}
    if (relations2) {
        relations2.forEach(function(r) {
            if(r.associations.length == 0) {
                r.associations = undefined
                if(r.source.entity.superAsset) {
                    var links = []
                    var asset = r.source.entity
                    while(asset.name != r.target.entity.name) {
                        links.push(asset.name)
                        asset = asset.superAsset
                    }
                    links.push(asset.name)
                    r.link = links
                }
            }
        })
	}
    return relations2
}

function makeIsa(root) {
	var isa = []
    if (root.children) {
        root.children.forEach(function(subAsset) {
			if(subAsset.superAsset) {
				isaRelation = {
					subAsset: subAsset,
					superAsset: subAsset.superAsset
				}
				isa.push(isaRelation)
			}
		})
	}
	return isa
}

function makeLinks(relations) {
    var aLinks = []
	var iLinks = []
	
    if(relations){
        relations.forEach(function(r) {
            if(r.associations) {
				r.associations.forEach(function(a, i) {
					aLinks.push({
						path: {
							source: r.source, 
							target: r.target
						}, 
						association: a
					})
				})
            } else if(r.link) {
                r.link.forEach(function(l, i) {
                    if(i+1 < r.link.length) {
                        iLinks.push({
                            path: {
                                source: r.source,
                                target: r.target
                            },
                            link: {
                                source: r.link[i],
                                target: r.link[i+1]
                            }
                        })
                    }
				})
            }
        })
	}
    return {aLinks: aLinks, iLinks: iLinks}
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
            } else {
                entity.children = []
            }
        })
	}

    if (root.children) {
        root.children.forEach(function(entity) {
			if (entity.superAsset) {
				entity.superAsset = root.children.filter(function(asset) {
					return asset.name == entity.superAsset
				})[0]
			} 
            if (entity.children) {
                entity.children.forEach(function(attack_step) {
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
							target_ref.links = []
							if (target_ref.associations) {
								target_ref.associations.forEach(function(target_association) {
									var through = root.associations.filter(function(association) {
										var association_id = association.leftName + "_" + 
											association.name + "_" + association.rightName
										return association_id == target_association
									})[0]
									if (through) {
										target_ref.links.push(through)
									}
								})
							}
                        })
                    }
                    entity.opacity = 0.75
                })
            }
        })
	}
}