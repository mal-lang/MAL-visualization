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
	d3.selectAll(".inheritance").attr('opacity', 1.0)
	d3.selectAll(".link").attr('opacity', 1.0)
	d3.selectAll(".link_path_association").attr('opacity', 1.0)
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

var root = {"children":[{"name":"EthernetGatewayECU","category":"System","superAsset":"GatewayECU","children":[{"name":"access","type":"or","targets":[{"name":"manInTheMiddle","associations":["trafficGatewayECU_GatewayConnection_trafficVNetworks"],"entity_name":"VehicleNetwork","size":4000},{"name":"manInTheMiddle","associations":["trafficEthGatewayECU_Connection_trafficNetworks"],"entity_name":"EthernetNetwork","size":4000},{"name":"forwarding","associations":[],"entity_name":"EthernetGatewayECU","size":4000}]},{"name":"forwarding","type":"or","targets":[{"name":"connect","associations":[],"entity_name":"ECU","size":4000},{"name":"bypassFirewall","associations":[],"entity_name":"EthernetGatewayECU","size":4000}]},{"name":"bypassFirewall","type":"and","targets":[{"name":"gatewayBypassIDPS","associations":[],"entity_name":"GatewayECU","size":4000},{"name":"gatewayNoIDPS","associations":[],"entity_name":"GatewayECU","size":4000},{"name":"accessNetworkLayer","associations":["trafficEthGatewayECU_Connection_trafficNetworks"],"entity_name":"EthernetNetwork","size":4000}]},{"name":"firewallProtection","type":"defense","targets":[{"name":"bypassFirewall","associations":[],"entity_name":"EthernetGatewayECU","size":4000}]},{"name":"denialOfService","type":"or","targets":[{"name":"denialOfService","associations":["trafficGatewayECU_GatewayConnection_trafficVNetworks"],"entity_name":"Network","size":4000},{"name":"denialOfService","associations":["trafficEthGatewayECU_Connection_trafficNetworks"],"entity_name":"Network","size":4000}]}]},{"name":"InfotainmentSystem","category":"System","superAsset":"Machine","children":[{"name":"access","type":"or","targets":[{"name":"engineerNetworkAccess","associations":[],"entity_name":"InfotainmentSystem","size":4000}]},{"name":"gainNetworkAccess","type":"or","targets":[{"name":"accessNetworkLayer","associations":["infotainment_Connection_connectedNetworks"],"entity_name":"Network","size":4000}]},{"name":"engineerNetworkAccess","type":"or","targets":[{"name":"accessNetworkLayer","associations":["infotainment_Connection_connectedNetworks"],"entity_name":"Network","size":4000}]}]},{"name":"NetworkAccessService","category":"System","superAsset":"NetworkService","children":[{"name":"access","type":"or","targets":[{"name":"gainNetworkAccess","associations":["executees_Execution_executor"],"entity_name":"Machine","size":4000}]}]},{"name":"PhysicalMachine","category":"System","children":[{"name":"connect","type":"or","targets":[{"name":"access","associations":[],"entity_name":"PhysicalMachine","size":4000}]},{"name":"access","type":"or","targets":[]}]},{"name":"SensorOrActuator","category":"System","superAsset":"PhysicalMachine","children":[{"name":"connect","type":"or","targets":[{"name":"access","associations":[],"entity_name":"SensorOrActuator","size":4000}]},{"name":"access","type":"or","targets":[{"name":"manipulate","associations":[],"entity_name":"SensorOrActuator","size":4000}]},{"name":"manipulate","type":"or","targets":[]}]},{"name":"Machine","category":"System","superAsset":"PhysicalMachine","children":[{"name":"connect","type":"or","targets":[{"name":"authenticatedAccess","associations":[],"entity_name":"Machine","size":4000},{"name":"compromise","associations":["connectMachines_ConnectionPrivileges_connectPrivileges"],"entity_name":"Account","size":4000},{"name":"exploit","associations":["connectionVulnerabilities_ConnectionVulnerability_connectionVulnerableMachine"],"entity_name":"Vulnerability","size":4000}]},{"name":"authenticate","type":"or","targets":[{"name":"authenticatedAccess","associations":[],"entity_name":"Machine","size":4000}]},{"name":"authenticatedAccess","type":"and","targets":[{"name":"access","associations":[],"entity_name":"Machine","size":4000}]},{"name":"bypassAccessControl","type":"or","targets":[{"name":"access","associations":[],"entity_name":"Machine","size":4000}]},{"name":"access","type":"or","targets":[{"name":"_machineAccess","associations":[],"entity_name":"Machine","size":4000}]},{"name":"idControl","type":"or","targets":[]},{"name":"_machineAccess","type":"or","targets":[{"name":"denialOfService","associations":[],"entity_name":"Machine","size":4000},{"name":"_accessData","associations":[],"entity_name":"Machine","size":4000},{"name":"connect","associations":["executees_Execution_executor"],"entity_name":"Machine","size":4000},{"name":"exploit","associations":["accessVulnerabilities_AccessVulnerability_accessVulnerableMachine"],"entity_name":"Vulnerability","size":4000}]},{"name":"denialOfService","type":"or","targets":[{"name":"denialOfService","associations":["executees_Execution_executor"],"entity_name":"Machine","size":4000},{"name":"denyAccess","associations":["machines_Storage_data"],"entity_name":"Data","size":4000}]},{"name":"_accessData","type":"or","targets":[{"name":"requestAccess","associations":["machines_Storage_data"],"entity_name":"Data","size":4000}]},{"name":"passFirmwareValidation","type":"or","targets":[]},{"name":"udsFirmwareModification","type":"or","targets":[]},{"name":"passUdsFirmwareModification","type":"or","targets":[]},{"name":"gainNetworkAccess","type":"or","targets":[]}]},{"name":"ECU","category":"System","superAsset":"Machine","children":[{"name":"connect","type":"or","targets":[{"name":"attemptChangeOperationMode","associations":[],"entity_name":"ECU","size":4000}]},{"name":"maliciousFirmwareUpload","type":"or","targets":[{"name":"access","associations":[],"entity_name":"ECU","size":4000},{"name":"_ecuNetworkAccess","associations":[],"entity_name":"ECU","size":4000}]},{"name":"uploadFirmware","type":"and","targets":[{"name":"_ecuNetworkAccess","associations":[],"entity_name":"ECU","size":4000}]},{"name":"_ecuNetworkAccess","type":"or","targets":[{"name":"access","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"VehicleNetwork","size":4000},{"name":"eavesdrop","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"VehicleNetwork","size":4000},{"name":"messageInjection","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"VehicleNetwork","size":4000},{"name":"j1939Attacks","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"VehicleNetwork","size":4000},{"name":"_networkSpecificAttack","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"VehicleNetwork","size":4000},{"name":"_networkForwarding","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"VehicleNetwork","size":4000}]},{"name":"udsFirmwareModification","type":"or","targets":[{"name":"udsFirmwareUpload","associations":["firmwareUpdater_FirmwareUpdate_firmwareTarget"],"entity_name":"FirmwareUpdaterService","size":4000}]},{"name":"passUdsFirmwareModification","type":"or","targets":[{"name":"passUdsFirmwareUpload","associations":["firmwareUpdater_FirmwareUpdate_firmwareTarget"],"entity_name":"FirmwareUpdaterService","size":4000}]},{"name":"passFirmwareValidation","type":"or","targets":[{"name":"uploadFirmware","associations":[],"entity_name":"ECU","size":4000}]},{"name":"access","type":"or","targets":[{"name":"manipulate","associations":["sensorsOrActuators_SensorsOrActuators_hardwarePlatform"],"entity_name":"SensorOrActuator","size":4000},{"name":"changeOperationMode","associations":[],"entity_name":"ECU","size":4000},{"name":"gainLINAccessFromCAN","associations":[],"entity_name":"ECU","size":4000},{"name":"bypassMessageConfliction","associations":[],"entity_name":"ECU","size":4000},{"name":"_ecuNetworkAccess","associations":[],"entity_name":"ECU","size":4000}]},{"name":"idControl","type":"or","targets":[{"name":"manipulate","associations":["sensorsOrActuators_SensorsOrActuators_hardwarePlatform"],"entity_name":"SensorOrActuator","size":4000}]},{"name":"offline","type":"or","targets":[{"name":"denialOfService","associations":[],"entity_name":"Machine","size":4000},{"name":"bypassMessageConfliction","associations":[],"entity_name":"ECU","size":4000}]},{"name":"shutdown","type":"or","targets":[{"name":"bypassMessageConfliction","associations":[],"entity_name":"ECU","size":4000},{"name":"denialOfService","associations":[],"entity_name":"Machine","size":4000}]},{"name":"changeOperationMode","type":"and","targets":[{"name":"shutdown","associations":[],"entity_name":"ECU","size":4000},{"name":"maliciousFirmwareModification","associations":["firmware_FirmwareExecution_hardware"],"entity_name":"Firmware","size":4000},{"name":"uploadFirmware","associations":[],"entity_name":"ECU","size":4000}]},{"name":"attemptChangeOperationMode","type":"and","targets":[{"name":"offline","associations":[],"entity_name":"ECU","size":4000},{"name":"bypassMessageConfliction","associations":[],"entity_name":"ECU","size":4000},{"name":"maliciousFirmwareModification","associations":["firmware_FirmwareExecution_hardware"],"entity_name":"Firmware","size":4000}]},{"name":"operationModeProtection","type":"defense","targets":[{"name":"changeOperationMode","associations":[],"entity_name":"ECU","size":4000},{"name":"attemptChangeOperationMode","associations":[],"entity_name":"ECU","size":4000}]},{"name":"bypassMessageConfliction","type":"or","targets":[{"name":"serviceMessageInjection","associations":["executees_Execution_executor"],"entity_name":"Software","size":4000}]},{"name":"_networkServiceMessageInjection","type":"and","targets":[{"name":"serviceMessageInjection","associations":["executees_Execution_executor"],"entity_name":"Software","size":4000}]},{"name":"messageConflictionProtection","type":"defense","targets":[{"name":"_networkServiceMessageInjection","associations":[],"entity_name":"ECU","size":4000}]},{"name":"gainLINAccessFromCAN","type":"or","targets":[{"name":"gainLINAccessFromCAN","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"VehicleNetwork","size":4000}]}]},{"name":"GatewayECU","category":"System","superAsset":"ECU","children":[{"name":"access","type":"or","targets":[{"name":"manInTheMiddle","associations":["trafficGatewayECU_GatewayConnection_trafficVNetworks"],"entity_name":"VehicleNetwork","size":4000},{"name":"forwarding","associations":[],"entity_name":"GatewayECU","size":4000}]},{"name":"forwarding","type":"or","targets":[{"name":"connect","associations":[],"entity_name":"ECU","size":4000},{"name":"bypassFirewall","associations":[],"entity_name":"GatewayECU","size":4000}]},{"name":"bypassFirewall","type":"and","targets":[{"name":"gatewayBypassIDPS","associations":[],"entity_name":"GatewayECU","size":4000},{"name":"gatewayNoIDPS","associations":[],"entity_name":"GatewayECU","size":4000},{"name":"accessUDSservices","associations":["trafficGatewayECU_GatewayConnection_trafficVNetworks"],"entity_name":"VehicleNetwork","size":4000}]},{"name":"firewallProtection","type":"defense","targets":[{"name":"bypassFirewall","associations":[],"entity_name":"GatewayECU","size":4000}]},{"name":"denialOfService","type":"or","targets":[{"name":"denialOfService","associations":["trafficGatewayECU_GatewayConnection_trafficVNetworks"],"entity_name":"Network","size":4000}]},{"name":"idpsExists","type":"defense","targets":[{"name":"gatewayBypassIDPS","associations":[],"entity_name":"GatewayECU","size":4000}]},{"name":"gatewayBypassIDPS","type":"and","targets":[{"name":"_bypassIDPS","associations":["trafficGatewayECU_GatewayConnection_trafficVNetworks"],"entity_name":"VehicleNetwork","size":4000}]},{"name":"idpsDoesNotExist","type":"defense","targets":[{"name":"gatewayNoIDPS","associations":[],"entity_name":"GatewayECU","size":4000}]},{"name":"gatewayNoIDPS","type":"and","targets":[{"name":"_noIDPS","associations":["trafficGatewayECU_GatewayConnection_trafficVNetworks"],"entity_name":"VehicleNetwork","size":4000},{"name":"accessNetworkLayer","associations":["trafficGatewayECU_GatewayConnection_trafficVNetworks"],"entity_name":"VehicleNetwork","size":4000}]}]},{"name":"Software","category":"System","superAsset":"Machine","children":[{"name":"access","type":"or","targets":[{"name":"connect","associations":["executees_Execution_executor"],"entity_name":"Machine","size":4000},{"name":"authenticate","associations":["assignedSoftwares_Assignment_assignedAccounts"],"entity_name":"Account","size":4000}]},{"name":"serviceMessageInjection","type":"or","targets":[]}]},{"name":"Firmware","category":"System","superAsset":"Software","children":[{"name":"maliciousFirmwareModification","type":"or","targets":[{"name":"bypassSecureBoot","associations":[],"entity_name":"Firmware","size":4000},{"name":"crackSecureBoot","associations":[],"entity_name":"Firmware","size":4000}]},{"name":"crackFirmwareValidation","type":"and","targets":[{"name":"maliciousFirmwareUpload","associations":["firmware_FirmwareExecution_hardware"],"entity_name":"ECU","size":4000}]},{"name":"bypassFirmwareValidation","type":"and","targets":[{"name":"maliciousFirmwareUpload","associations":["firmware_FirmwareExecution_hardware"],"entity_name":"ECU","size":4000}]},{"name":"firmwareValidation","type":"defense","targets":[{"name":"bypassFirmwareValidation","associations":[],"entity_name":"Firmware","size":4000}]},{"name":"bypassSecureBoot","type":"and","targets":[{"name":"bypassFirmwareValidation","associations":[],"entity_name":"Firmware","size":4000},{"name":"crackFirmwareValidation","associations":[],"entity_name":"Firmware","size":4000}]},{"name":"crackSecureBoot","type":"or","targets":[{"name":"maliciousFirmwareUpload","associations":["firmware_FirmwareExecution_hardware"],"entity_name":"ECU","size":4000}]},{"name":"secureBoot","type":"defense","targets":[{"name":"bypassSecureBoot","associations":[],"entity_name":"Firmware","size":4000}]}]},{"name":"OperatingSystem","category":"System","superAsset":"Software"},{"name":"Service","category":"System","superAsset":"Software"},{"name":"Client","category":"System","superAsset":"Software"},{"name":"NetworkClient","category":"System","superAsset":"Client","children":[{"name":"access","type":"or","targets":[{"name":"request","associations":["clients_Request_dataflows"],"entity_name":"Dataflow","size":4000}]}]},{"name":"VehicleNetworkReceiver","category":"System","superAsset":"Client","children":[{"name":"access","type":"or","targets":[{"name":"eavesdrop","associations":["receiver_Transmission_dataflows"],"entity_name":"ConnectionlessDataflow","size":4000}]},{"name":"impersonateId","type":"or","targets":[{"name":"idControl","associations":["executees_Execution_executor"],"entity_name":"Machine","size":4000}]}]},{"name":"NetworkService","category":"System","superAsset":"Service","children":[{"name":"connect","type":"or","targets":[{"name":"bypassAccessControl","associations":[],"entity_name":"Machine","size":4000}]},{"name":"access","type":"or","targets":[{"name":"respond","associations":["services_Response_dataflows"],"entity_name":"Dataflow","size":4000}]}]},{"name":"UDSService","category":"System","superAsset":"NetworkService","children":[{"name":"access","type":"or","targets":[{"name":"respond","associations":["services_Response_dataflows"],"entity_name":"Dataflow","size":4000},{"name":"_accessData","associations":["executees_Execution_executor"],"entity_name":"Machine","size":4000}]}]},{"name":"TransmitterService","category":"System","superAsset":"Service","children":[{"name":"access","type":"or","targets":[{"name":"transmit","associations":["transmitter_Transmission_dataflows"],"entity_name":"ConnectionlessDataflow","size":4000},{"name":"denialOfService","associations":["transmitter_Transmission_dataflows"],"entity_name":"Dataflow","size":4000}]},{"name":"serviceMessageInjection","type":"or","targets":[{"name":"maliciousTransmit","associations":["transmitter_Transmission_dataflows"],"entity_name":"ConnectionlessDataflow","size":4000},{"name":"eavesdropId","associations":["transmitter_Transmission_dataflows"],"entity_name":"ConnectionlessDataflow","size":4000}]}]},{"name":"FirmwareUpdaterService","category":"System","superAsset":"UDSService","children":[{"name":"access","type":"or","targets":[{"name":"udsFirmwareModification","associations":["firmwareUpdater_FirmwareUpdate_firmwareTarget"],"entity_name":"ECU","size":4000}]},{"name":"udsFirmwareUpload","type":"and","targets":[{"name":"maliciousFirmwareUpload","associations":["firmwareUpdater_FirmwareUpdate_firmwareTarget"],"entity_name":"ECU","size":4000}]},{"name":"passUdsFirmwareUpload","type":"or","targets":[{"name":"passFirmwareValidation","associations":["firmwareUpdater_FirmwareUpdate_firmwareTarget"],"entity_name":"ECU","size":4000}]},{"name":"udsSecurityAccess","type":"defense","targets":[{"name":"udsFirmwareUpload","associations":[],"entity_name":"FirmwareUpdaterService","size":4000}]}]},{"name":"Router","category":"Networking","superAsset":"Service","children":[{"name":"access","type":"or","targets":[{"name":"manInTheMiddle","associations":["trafficRouters_Connection_trafficNetworks"],"entity_name":"EthernetNetwork","size":4000},{"name":"forwarding","associations":[],"entity_name":"Router","size":4000}]},{"name":"correctlyConfiguredFirewallExists","type":"defense","targets":[{"name":"noFirewallProtection","associations":[],"entity_name":"Router","size":4000}]},{"name":"noFirewallProtection","type":"or","targets":[{"name":"bypassFirewall","associations":[],"entity_name":"Router","size":4000}]},{"name":"forwarding","type":"or","targets":[{"name":"connect","associations":[],"entity_name":"Machine","size":4000},{"name":"bypassFirewall","associations":[],"entity_name":"Router","size":4000}]},{"name":"bypassFirewall","type":"and","targets":[{"name":"accessNetworkLayer","associations":["trafficRouters_Connection_trafficNetworks"],"entity_name":"EthernetNetwork","size":4000}]},{"name":"denialOfService","type":"or","targets":[{"name":"denialOfService","associations":["trafficRouters_Connection_trafficNetworks"],"entity_name":"Network","size":4000}]}]},{"name":"EthernetNetwork","category":"Networking","superAsset":"Network","children":[{"name":"physicalAccess","type":"or","targets":[{"name":"bypassPortSecurity","associations":[],"entity_name":"EthernetNetwork","size":4000}]},{"name":"bypassPortSecurity","type":"and","targets":[{"name":"bypassAccessControl","associations":[],"entity_name":"EthernetNetwork","size":4000}]},{"name":"bypassAccessControl","type":"or","targets":[{"name":"accessDataLinkLayer","associations":[],"entity_name":"EthernetNetwork","size":4000}]},{"name":"accessDataLinkLayer","type":"or","targets":[{"name":"accessNetworkLayer","associations":[],"entity_name":"EthernetNetwork","size":4000},{"name":"aRPCachePoisoning","associations":[],"entity_name":"EthernetNetwork","size":4000}]},{"name":"accessNetworkLayer","type":"or","targets":[{"name":"connect","associations":["networkServices_Listening_networks"],"entity_name":"NetworkService","size":4000},{"name":"forwarding","associations":["trafficRouters_Connection_trafficNetworks"],"entity_name":"Router","size":4000},{"name":"forwarding","associations":["trafficEthGatewayECU_Connection_trafficNetworks"],"entity_name":"EthernetGatewayECU","size":4000},{"name":"denialOfService","associations":[],"entity_name":"Network","size":4000},{"name":"connect","associations":["ethernetNetworkMachines_EthernetConnection_ethernetNetworks"],"entity_name":"Machine","size":4000}]},{"name":"aRPCachePoisoning","type":"and","targets":[{"name":"manInTheMiddle","associations":[],"entity_name":"EthernetNetwork","size":4000}]},{"name":"portSecurity","type":"defense","targets":[{"name":"bypassPortSecurity","associations":[],"entity_name":"EthernetNetwork","size":4000}]},{"name":"staticARPTables","type":"defense","targets":[{"name":"aRPCachePoisoning","associations":[],"entity_name":"EthernetNetwork","size":4000}]},{"name":"manInTheMiddle","type":"or","targets":[{"name":"accessDataLinkLayer","associations":[],"entity_name":"EthernetNetwork","size":4000},{"name":"eavesdrop","associations":[],"entity_name":"Network","size":4000},{"name":"manInTheMiddle","associations":["dataflows_Communication_networks"],"entity_name":"Dataflow","size":4000},{"name":"denialOfService","associations":["trafficRouters_Connection_trafficNetworks"],"entity_name":"Router","size":4000},{"name":"denialOfService","associations":["trafficEthGatewayECU_Connection_trafficNetworks"],"entity_name":"EthernetGatewayECU","size":4000}]}]},{"name":"Network","category":"Networking","children":[{"name":"physicalAccess","type":"or","targets":[{"name":"accessNetworkLayer","associations":[],"entity_name":"Network","size":4000}]},{"name":"access","type":"or","targets":[{"name":"denialOfService","associations":[],"entity_name":"Network","size":4000},{"name":"connect","associations":["networkServices_Listening_networks"],"entity_name":"NetworkService","size":4000},{"name":"connect","associations":["networkMachines_MachineConnection_machineNetworks"],"entity_name":"Machine","size":4000}]},{"name":"accessNetworkLayer","type":"or","targets":[{"name":"access","associations":[],"entity_name":"Network","size":4000},{"name":"eavesdrop","associations":[],"entity_name":"Network","size":4000}]},{"name":"eavesdrop","type":"or","targets":[{"name":"eavesdrop","associations":["dataflows_Communication_networks"],"entity_name":"Dataflow","size":4000}]},{"name":"manInTheMiddle","type":"or","targets":[{"name":"access","associations":[],"entity_name":"Network","size":4000},{"name":"eavesdrop","associations":[],"entity_name":"Network","size":4000},{"name":"manInTheMiddle","associations":["dataflows_Communication_networks"],"entity_name":"Dataflow","size":4000}]},{"name":"denialOfService","type":"or","targets":[{"name":"denialOfService","associations":["dataflows_Communication_networks"],"entity_name":"Dataflow","size":4000}]}]},{"name":"VehicleNetwork","category":"Networking","superAsset":"Network","children":[{"name":"_networkSpecificAttack","type":"or","targets":[]},{"name":"access","type":"or","targets":[{"name":"denialOfService","associations":[],"entity_name":"Network","size":4000},{"name":"connect","associations":["networkServices_Listening_networks"],"entity_name":"NetworkService","size":4000},{"name":"connect","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"ECU","size":4000},{"name":"accessUDSservices","associations":[],"entity_name":"VehicleNetwork","size":4000}]},{"name":"accessNetworkLayer","type":"or","targets":[{"name":"access","associations":[],"entity_name":"VehicleNetwork","size":4000},{"name":"_networkForwarding","associations":[],"entity_name":"VehicleNetwork","size":4000},{"name":"eavesdrop","associations":[],"entity_name":"VehicleNetwork","size":4000},{"name":"messageInjection","associations":[],"entity_name":"VehicleNetwork","size":4000},{"name":"_networkSpecificAttack","associations":[],"entity_name":"VehicleNetwork","size":4000},{"name":"j1939Attacks","associations":[],"entity_name":"VehicleNetwork","size":4000},{"name":"_networkServiceMessageInjection","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"ECU","size":4000}]},{"name":"_networkForwarding","type":"or","targets":[{"name":"forwarding","associations":["trafficGatewayECU_GatewayConnection_trafficVNetworks"],"entity_name":"GatewayECU","size":4000}]},{"name":"eavesdrop","type":"or","targets":[{"name":"eavesdropId","associations":["dataflows_Communication_networks"],"entity_name":"Dataflow","size":4000},{"name":"eavesdropAndBypassMsgConflictionProtection","associations":["dataflows_Communication_networks"],"entity_name":"Dataflow","size":4000}]},{"name":"manInTheMiddle","type":"or","targets":[{"name":"accessNetworkLayer","associations":[],"entity_name":"VehicleNetwork","size":4000},{"name":"eavesdrop","associations":[],"entity_name":"VehicleNetwork","size":4000},{"name":"manInTheMiddle","associations":["dataflows_Communication_networks"],"entity_name":"Dataflow","size":4000},{"name":"denialOfService","associations":["trafficGatewayECU_GatewayConnection_trafficVNetworks"],"entity_name":"GatewayECU","size":4000}]},{"name":"messageInjection","type":"or","targets":[{"name":"maliciousTransmitBypassConflitionProtection","associations":["dataflows_Communication_networks"],"entity_name":"Dataflow","size":4000},{"name":"denialOfService","associations":[],"entity_name":"Network","size":4000}]},{"name":"_bypassIDPS","type":"or","targets":[{"name":"maliciousTransmitBypassIDPS","associations":["dataflows_Communication_networks"],"entity_name":"Dataflow","size":4000}]},{"name":"_noIDPS","type":"or","targets":[{"name":"maliciousTransmitNoIDPS","associations":["dataflows_Communication_networks"],"entity_name":"Dataflow","size":4000}]},{"name":"gainLINAccessFromCAN","type":"or","targets":[]},{"name":"j1939Attacks","type":"or","targets":[]},{"name":"accessUDSservices","type":"or","targets":[{"name":"access","associations":["networkFwUpdater_FwUpdaterServices_fwUpdaterNetworks"],"entity_name":"FirmwareUpdaterService","size":4000}]}]},{"name":"CANNetwork","category":"Networking","superAsset":"VehicleNetwork","children":[{"name":"_networkSpecificAttack","type":"or","targets":[{"name":"busOffAttack","associations":[],"entity_name":"CANNetwork","size":4000},{"name":"exploitArbitration","associations":[],"entity_name":"CANNetwork","size":4000}]},{"name":"exploitArbitration","type":"or","targets":[{"name":"maliciousTransmit","associations":["dataflows_Communication_networks"],"entity_name":"Dataflow","size":4000},{"name":"denialOfService","associations":[],"entity_name":"Network","size":4000}]},{"name":"busOffAttack","type":"and","targets":[{"name":"offline","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"ECU","size":4000},{"name":"denialOfService","associations":[],"entity_name":"Network","size":4000}]},{"name":"busOffProtection","type":"defense","targets":[{"name":"busOffAttack","associations":[],"entity_name":"CANNetwork","size":4000}]}]},{"name":"J1939Network","category":"Networking","superAsset":"CANNetwork","children":[{"name":"accessNetworkLayer","type":"or","targets":[{"name":"denialOfService","associations":[],"entity_name":"J1939Network","size":4000},{"name":"eavesdrop","associations":[],"entity_name":"J1939Network","size":4000},{"name":"messageInjection","associations":[],"entity_name":"J1939Network","size":4000},{"name":"connect","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"ECU","size":4000}]},{"name":"eavesdrop","type":"or","targets":[{"name":"eavesdrop","associations":["j1939dataflows_J1939Communication_j1939networks"],"entity_name":"Dataflow","size":4000}]},{"name":"manInTheMiddle","type":"or","targets":[{"name":"accessNetworkLayer","associations":[],"entity_name":"J1939Network","size":4000},{"name":"eavesdrop","associations":[],"entity_name":"J1939Network","size":4000},{"name":"manInTheMiddle","associations":["j1939dataflows_J1939Communication_j1939networks"],"entity_name":"ConnectionOrientedDataflow","size":4000}]},{"name":"denialOfService","type":"or","targets":[{"name":"denialOfService","associations":["j1939dataflows_J1939Communication_j1939networks"],"entity_name":"Dataflow","size":4000}]},{"name":"messageInjection","type":"or","targets":[]},{"name":"j1939MessageInjection","type":"or","targets":[{"name":"request","associations":["j1939dataflows_J1939Communication_j1939networks"],"entity_name":"ConnectionOrientedDataflow","size":4000},{"name":"maliciousRespond","associations":["j1939dataflows_J1939Communication_j1939networks"],"entity_name":"ConnectionOrientedDataflow","size":4000}]},{"name":"j1939Attacks","type":"or","targets":[{"name":"eavesdrop","associations":[],"entity_name":"J1939Network","size":4000},{"name":"_advancedJ1939Attacks","associations":[],"entity_name":"J1939Network","size":4000},{"name":"maliciousRespond","associations":["j1939dataflows_J1939Communication_j1939networks"],"entity_name":"ConnectionOrientedDataflow","size":4000}]},{"name":"_advancedJ1939Attacks","type":"and","targets":[{"name":"denialOfService","associations":[],"entity_name":"J1939Network","size":4000},{"name":"j1939MessageInjection","associations":[],"entity_name":"J1939Network","size":4000}]},{"name":"noFullJ1939Support","type":"defense","targets":[{"name":"_advancedJ1939Attacks","associations":[],"entity_name":"J1939Network","size":4000}]}]},{"name":"FlexRayNetwork","category":"Networking","superAsset":"VehicleNetwork","children":[{"name":"_networkSpecificAttack","type":"or","targets":[{"name":"commonTimeBaseAttack","associations":[],"entity_name":"FlexRayNetwork","size":4000},{"name":"exploitBusGuardian","associations":[],"entity_name":"FlexRayNetwork","size":4000},{"name":"sleepFrameAttack","associations":[],"entity_name":"FlexRayNetwork","size":4000}]},{"name":"commonTimeBaseAttack","type":"or","targets":[{"name":"denialOfService","associations":[],"entity_name":"Network","size":4000}]},{"name":"exploitBusGuardian","type":"or","targets":[{"name":"offline","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"ECU","size":4000}]},{"name":"sleepFrameAttack","type":"and","targets":[{"name":"offline","associations":["networkECUs_EcuConnection_vehiclenetworks"],"entity_name":"ECU","size":4000}]},{"name":"powerSavingIncapableNodes","type":"defense","targets":[{"name":"sleepFrameAttack","associations":[],"entity_name":"FlexRayNetwork","size":4000}]}]},{"name":"LINNetwork","category":"Networking","superAsset":"VehicleNetwork","children":[{"name":"_networkSpecificAttack","type":"or","targets":[{"name":"injectHeaderOrTimedResponse","associations":[],"entity_name":"LINNetwork","size":4000},{"name":"injectBogusSyncBytes","associations":[],"entity_name":"LINNetwork","size":4000}]},{"name":"injectBogusSyncBytes","type":"or","targets":[{"name":"denialOfService","associations":[],"entity_name":"Network","size":4000}]},{"name":"gainLINAccessFromCAN","type":"or","targets":[{"name":"accessNetworkLayer","associations":[],"entity_name":"VehicleNetwork","size":4000}]},{"name":"injectHeaderOrTimedResponse","type":"and","targets":[{"name":"maliciousTransmit","associations":["dataflows_Communication_networks"],"entity_name":"Dataflow","size":4000}]},{"name":"headerOrTimedResponseProtection","type":"defense","targets":[{"name":"injectHeaderOrTimedResponse","associations":[],"entity_name":"LINNetwork","size":4000}]}]},{"name":"OBD2Connector","category":"Communication","children":[{"name":"physicalAccess","type":"or","targets":[{"name":"accessNetworkLayer","associations":["connector_Interface_interfacingNetworks"],"entity_name":"VehicleNetwork","size":4000}]},{"name":"connect","type":"or","targets":[{"name":"bypassConnectorProtection","associations":[],"entity_name":"OBD2Connector","size":4000},{"name":"_connectNoProtection","associations":[],"entity_name":"OBD2Connector","size":4000}]},{"name":"bypassConnectorProtection","type":"or","targets":[{"name":"physicalAccess","associations":[],"entity_name":"OBD2Connector","size":4000}]},{"name":"_connectNoProtection","type":"and","targets":[{"name":"physicalAccess","associations":[],"entity_name":"OBD2Connector","size":4000}]},{"name":"connectorAccessProtection","type":"defense","targets":[{"name":"_connectNoProtection","associations":[],"entity_name":"OBD2Connector","size":4000}]}]},{"name":"ChargingPlugConnector","category":"Communication","children":[{"name":"physicalAccess","type":"or","targets":[{"name":"accessNetworkLayer","associations":["chargingPlug_Connections_connectedNetwork"],"entity_name":"VehicleNetwork","size":4000}]}]},{"name":"AftermarketDongle","category":"Communication","children":[{"name":"connectDongle","type":"or","targets":[{"name":"_connectToNetwork","associations":[],"entity_name":"AftermarketDongle","size":4000}]},{"name":"_connectToNetwork","type":"and","targets":[{"name":"connect","associations":["dongle_Connection_connector"],"entity_name":"OBD2Connector","size":4000}]},{"name":"dongleIsHardened","type":"defense","targets":[{"name":"_connectToNetwork","associations":[],"entity_name":"AftermarketDongle","size":4000}]}]},{"name":"Information","category":"Communication","children":[{"name":"read","type":"or","targets":[]},{"name":"write","type":"and","targets":[]},{"name":"delete","type":"and","targets":[]}]},{"name":"Data","category":"Communication","children":[{"name":"requestAccess","type":"or","targets":[{"name":"authenticatedRead","associations":[],"entity_name":"Data","size":4000},{"name":"authenticatedWrite","associations":[],"entity_name":"Data","size":4000},{"name":"authenticatedDelete","associations":[],"entity_name":"Data","size":4000}]},{"name":"anyAccountRead","type":"or","targets":[{"name":"authenticatedRead","associations":[],"entity_name":"Data","size":4000}]},{"name":"anyAccountWrite","type":"or","targets":[{"name":"authenticatedWrite","associations":[],"entity_name":"Data","size":4000}]},{"name":"anyAccountDelete","type":"or","targets":[{"name":"authenticatedDelete","associations":[],"entity_name":"Data","size":4000}]},{"name":"authenticatedRead","type":"and","targets":[{"name":"read","associations":[],"entity_name":"Data","size":4000}]},{"name":"authenticatedWrite","type":"and","targets":[{"name":"write","associations":[],"entity_name":"Data","size":4000}]},{"name":"authenticatedDelete","type":"and","targets":[{"name":"delete","associations":[],"entity_name":"Data","size":4000}]},{"name":"read","type":"or","targets":[{"name":"read","associations":["information_Representation_data"],"entity_name":"Information","size":4000},{"name":"read","associations":["containedData_Containment_containingData"],"entity_name":"Data","size":4000}]},{"name":"write","type":"or","targets":[{"name":"delete","associations":[],"entity_name":"Data","size":4000},{"name":"write","associations":["information_Representation_data"],"entity_name":"Information","size":4000},{"name":"write","associations":["containedData_Containment_containingData"],"entity_name":"Data","size":4000}]},{"name":"delete","type":"or","targets":[{"name":"delete","associations":["information_Representation_data"],"entity_name":"Information","size":4000},{"name":"delete","associations":["containedData_Containment_containingData"],"entity_name":"Data","size":4000}]},{"name":"denyAccess","type":"or","targets":[]}]},{"name":"Dataflow","category":"Communication","children":[{"name":"eavesdrop","type":"or","targets":[{"name":"read","associations":["data_DataTransfer_dataflow"],"entity_name":"Data","size":4000}]},{"name":"denialOfService","type":"or","targets":[{"name":"delete","associations":["data_DataTransfer_dataflow"],"entity_name":"Data","size":4000}]},{"name":"manInTheMiddle","type":"or","targets":[]},{"name":"request","type":"or","targets":[]},{"name":"respond","type":"or","targets":[]},{"name":"maliciousTransmitNoIDPS","type":"or","targets":[]},{"name":"maliciousTransmitBypassConflitionProtection","type":"or","targets":[]},{"name":"maliciousTransmitBypassIDPS","type":"or","targets":[]},{"name":"maliciousTransmit","type":"or","targets":[]},{"name":"eavesdropId","type":"and","targets":[]},{"name":"eavesdropAndBypassMsgConflictionProtection","type":"and","targets":[]}]},{"name":"ConnectionOrientedDataflow","category":"Communication","superAsset":"Dataflow","children":[{"name":"manInTheMiddle","type":"or","targets":[{"name":"eavesdrop","associations":[],"entity_name":"Dataflow","size":4000},{"name":"denialOfService","associations":[],"entity_name":"Dataflow","size":4000},{"name":"request","associations":[],"entity_name":"ConnectionOrientedDataflow","size":4000},{"name":"respond","associations":[],"entity_name":"ConnectionOrientedDataflow","size":4000},{"name":"write","associations":["data_DataTransfer_dataflow"],"entity_name":"Data","size":4000},{"name":"read","associations":["data_DataTransfer_dataflow"],"entity_name":"Data","size":4000},{"name":"delete","associations":["data_DataTransfer_dataflow"],"entity_name":"Data","size":4000}]},{"name":"request","type":"or","targets":[{"name":"connect","associations":["services_Response_dataflows"],"entity_name":"NetworkService","size":4000}]},{"name":"respond","type":"or","targets":[{"name":"connect","associations":["clients_Request_dataflows"],"entity_name":"Machine","size":4000}]},{"name":"maliciousRespond","type":"or","targets":[{"name":"respond","associations":[],"entity_name":"ConnectionOrientedDataflow","size":4000}]}]},{"name":"ConnectionlessDataflow","category":"Communication","superAsset":"Dataflow","children":[{"name":"eavesdrop","type":"or","targets":[{"name":"read","associations":["data_DataTransfer_dataflow"],"entity_name":"Data","size":4000}]},{"name":"manInTheMiddle","type":"or","targets":[{"name":"eavesdrop","associations":[],"entity_name":"ConnectionlessDataflow","size":4000},{"name":"denialOfService","associations":[],"entity_name":"Dataflow","size":4000},{"name":"write","associations":["data_DataTransfer_dataflow"],"entity_name":"Data","size":4000},{"name":"read","associations":["data_DataTransfer_dataflow"],"entity_name":"Data","size":4000},{"name":"delete","associations":["data_DataTransfer_dataflow"],"entity_name":"Data","size":4000},{"name":"transmit","associations":[],"entity_name":"ConnectionlessDataflow","size":4000}]},{"name":"maliciousTransmitNoIDPS","type":"or","targets":[{"name":"maliciousTransmitBypassConflitionProtection","associations":[],"entity_name":"ConnectionlessDataflow","size":4000}]},{"name":"maliciousTransmitBypassConflitionProtection","type":"or","targets":[{"name":"transmit","associations":[],"entity_name":"ConnectionlessDataflow","size":4000},{"name":"eavesdropAndBypassMsgConflictionProtection","associations":[],"entity_name":"ConnectionlessDataflow","size":4000}]},{"name":"maliciousTransmitBypassIDPS","type":"or","targets":[{"name":"transmit","associations":[],"entity_name":"ConnectionlessDataflow","size":4000}]},{"name":"maliciousTransmit","type":"or","targets":[{"name":"transmit","associations":[],"entity_name":"ConnectionlessDataflow","size":4000}]},{"name":"transmit","type":"or","targets":[{"name":"connect","associations":["transmitter_Transmission_dataflows"],"entity_name":"Machine","size":4000}]},{"name":"eavesdropId","type":"and","targets":[{"name":"read","associations":["dataflowId_DataflowID_dataflow"],"entity_name":"MessageID","size":4000}]},{"name":"eavesdropAndBypassMsgConflictionProtection","type":"and","targets":[{"name":"read","associations":["dataflowId_DataflowID_dataflow"],"entity_name":"MessageID","size":4000}]}]},{"name":"Vulnerability","category":"Security","children":[{"name":"exploit","type":"or","targets":[{"name":"compromise","associations":["accountVulnerability_Privileges_privileges"],"entity_name":"Account","size":4000}]}]},{"name":"Account","category":"Security","children":[{"name":"authenticate","type":"or","targets":[{"name":"compromise","associations":[],"entity_name":"Account","size":4000}]},{"name":"compromise","type":"or","targets":[{"name":"authenticate","associations":["accessedMachines_AccessPrivileges_account"],"entity_name":"Machine","size":4000},{"name":"anyAccountRead","associations":["readData_Read_readingAccounts"],"entity_name":"Data","size":4000},{"name":"anyAccountWrite","associations":["writtenData_Write_writingAccounts"],"entity_name":"Data","size":4000},{"name":"anyAccountDelete","associations":["deletedData_Delete_deletingAccounts"],"entity_name":"Data","size":4000},{"name":"authenticate","associations":["authenticatees_Authentication_authenticators"],"entity_name":"Account","size":4000}]}]},{"name":"Credentials","category":"Security","superAsset":"Data","children":[{"name":"read","type":"or","targets":[{"name":"authenticate","associations":["credentials_Credentials_accounts"],"entity_name":"Account","size":4000},{"name":"readFirmwareAccessKey","associations":[],"entity_name":"Credentials","size":4000}]},{"name":"readFirmwareAccessKey","type":"or","targets":[{"name":"passFirmwareValidation","associations":["machines_Storage_data"],"entity_name":"Machine","size":4000},{"name":"passUdsFirmwareModification","associations":["machines_Storage_data"],"entity_name":"Machine","size":4000}]}]},{"name":"MessageID","category":"Security","children":[{"name":"read","type":"or","targets":[{"name":"impersonateId","associations":["dataflowId_DataflowID_dataflow","receiver_Transmission_dataflows"],"entity_name":"VehicleNetworkReceiver","size":4000}]}]},{"name":"IDPS","category":"Security","superAsset":"Service"},{"name":"User","category":"User","children":[{"name":"compromise","type":"or","targets":[{"name":"authenticate","associations":["accounts_UserAccount_users"],"entity_name":"Account","size":4000}]}]}],"associations":[{"source":"Dataflow","target":"EthernetNetwork","name":"NetworkVirtualization","leftName":"virtualNetwork","rightName":"realizingDataflow"},{"source":"EthernetNetwork","target":"Machine","name":"EthernetConnection","leftName":"ethernetNetworkMachines","rightName":"ethernetNetworks"},{"source":"EthernetNetwork","target":"Router","name":"Connection","leftName":"trafficRouters","rightName":"trafficNetworks"},{"source":"EthernetNetwork","target":"EthernetGatewayECU","name":"Connection","leftName":"trafficEthGatewayECU","rightName":"trafficNetworks"},{"source":"VehicleNetwork","target":"OBD2Connector","name":"Interface","leftName":"connector","rightName":"interfacingNetworks"},{"source":"VehicleNetwork","target":"ChargingPlugConnector","name":"Connections","leftName":"chargingPlug","rightName":"connectedNetwork"},{"source":"OBD2Connector","target":"AftermarketDongle","name":"Connection","leftName":"dongle","rightName":"connector"},{"source":"Network","target":"InfotainmentSystem","name":"Connection","leftName":"infotainment","rightName":"connectedNetworks"},{"source":"Machine","target":"Software","name":"Execution","leftName":"executees","rightName":"executor"},{"source":"Account","target":"Machine","name":"AccessPrivileges","leftName":"accessedMachines","rightName":"account"},{"source":"Account","target":"Machine","name":"ConnectionPrivileges","leftName":"connectMachines","rightName":"connectPrivileges"},{"source":"Account","target":"Software","name":"Assignment","leftName":"assignedSoftwares","rightName":"assignedAccounts"},{"source":"Account","target":"Account","name":"Authentication","leftName":"authenticatees","rightName":"authenticators"},{"source":"Account","target":"Credentials","name":"Credentials","leftName":"credentials","rightName":"accounts"},{"source":"Account","target":"Data","name":"Read","leftName":"readData","rightName":"readingAccounts"},{"source":"Account","target":"Data","name":"Write","leftName":"writtenData","rightName":"writingAccounts"},{"source":"Account","target":"Data","name":"Delete","leftName":"deletedData","rightName":"deletingAccounts"},{"source":"Data","target":"Data","name":"Containment","leftName":"containedData","rightName":"containingData"},{"source":"Data","target":"Information","name":"Representation","leftName":"information","rightName":"data"},{"source":"Data","target":"Machine","name":"Storage","leftName":"machines","rightName":"data"},{"source":"Network","target":"Dataflow","name":"Communication","leftName":"dataflows","rightName":"networks"},{"source":"Network","target":"Machine","name":"MachineConnection","leftName":"networkMachines","rightName":"machineNetworks"},{"source":"J1939Network","target":"ConnectionOrientedDataflow","name":"J1939Communication","leftName":"j1939dataflows","rightName":"j1939networks"},{"source":"Dataflow","target":"Data","name":"DataTransfer","leftName":"data","rightName":"dataflow"},{"source":"Dataflow","target":"NetworkClient","name":"Request","leftName":"clients","rightName":"dataflows"},{"source":"Dataflow","target":"NetworkService","name":"Response","leftName":"services","rightName":"dataflows"},{"source":"Network","target":"NetworkService","name":"Listening","leftName":"networkServices","rightName":"networks"},{"source":"ConnectionlessDataflow","target":"TransmitterService","name":"Transmission","leftName":"transmitter","rightName":"dataflows"},{"source":"ConnectionlessDataflow","target":"VehicleNetworkReceiver","name":"Transmission","leftName":"receiver","rightName":"dataflows"},{"source":"ConnectionlessDataflow","target":"MessageID","name":"DataflowID","leftName":"dataflowId","rightName":"dataflow"},{"source":"IDPS","target":"GatewayECU","name":"IDPSProtection","leftName":"idpsGatewayECU","rightName":"idps"},{"source":"User","target":"Account","name":"UserAccount","leftName":"accounts","rightName":"users"},{"source":"Machine","target":"Vulnerability","name":"ConnectionVulnerability","leftName":"connectionVulnerabilities","rightName":"connectionVulnerableMachine"},{"source":"Machine","target":"Vulnerability","name":"AccessVulnerability","leftName":"accessVulnerabilities","rightName":"accessVulnerableMachine"},{"source":"Account","target":"Vulnerability","name":"Privileges","leftName":"accountVulnerability","rightName":"privileges"},{"source":"VehicleNetwork","target":"ECU","name":"EcuConnection","leftName":"networkECUs","rightName":"vehiclenetworks"},{"source":"VehicleNetwork","target":"GatewayECU","name":"GatewayConnection","leftName":"trafficGatewayECU","rightName":"trafficVNetworks"},{"source":"ECU","target":"Firmware","name":"FirmwareExecution","leftName":"firmware","rightName":"hardware"},{"source":"ECU","target":"FirmwareUpdaterService","name":"FirmwareUpdate","leftName":"firmwareUpdater","rightName":"firmwareTarget"},{"source":"ECU","target":"SensorOrActuator","name":"SensorsOrActuators","leftName":"sensorsOrActuators","rightName":"hardwarePlatform"},{"source":"VehicleNetwork","target":"FirmwareUpdaterService","name":"FwUpdaterServices","leftName":"networkFwUpdater","rightName":"fwUpdaterNetworks"}]}
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
setAssociationId(root);
var assets = root.children
var associations = root.associations
var isa = makeIsa(root);
var relations = makeRelations(root);
var relations2 = setRelationAssociations(relations, associations);
var links = makeLinks(relations2)

var assetMap = {}
if(root.children) {
	root.children.forEach(function(a) {
		assetMap[a.name] = a 
	})
}

var relationMap = {}
if(relations) {
	relations.forEach(function(d) {
		relationMap[getPathId(d)] = d
	})
}

var simulation = d3.forceSimulation(root.children)
	.force('link', d3.forceLink().links(root.associations).distance(600))
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
						document.getElementById('asset_checkbox_' + asset.name).checked = !d.hidden
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
graph.isa = g.selectAll('.isa')
graph.asset = g.selectAll('.asset')
graph.attackPath = g.selectAll('.attackpath')
graph.aLink = g.selectAll('.aLink')
graph.iLink = g.selectAll('.iLink')

update()
setChildrenAndParents()

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

function setChildrenAndParents() {
	if(relations) {
		relations.forEach(function(r) {
			var target = document.getElementById(r.target.entity.name + "_" + r.target.name)
			appendClass(target, "child_to_" + r.source.entity.name + "_" + r.source.name)

			var source = document.getElementById(r.source.entity.name + "_" + r.source.name)
			appendClass(source, "parent_to_" + r.target.entity.name + "_" + r.target.name)

			var targetAsset = document.getElementById('asset_' + r.target.entity.name)
			appendClass(targetAsset, "child_to_" + r.source.entity.name + "_" + r.source.name)
			appendClass(targetAsset, "parent_to_" + r.target.entity.name + "_" + r.target.name)
			
			var sourceAsset = document.getElementById('asset_' + r.source.entity.name)
			appendClass(sourceAsset, "child_to_" + r.source.entity.name + "_" + r.source.name)
			appendClass(sourceAsset, "parent_to_" + r.target.entity.name + "_" + r.target.name)
		})
	}
	if(relations2) {
		relations2.forEach(function(r) {
			if(r.associations) {
				r.associations.forEach(function(a, i) {
					associationElem = document.getElementById(getAssociationId(a))
					appendClass(associationElem, "child_to_" + r.source.entity.name + "_" + r.source.name)
					appendClass(associationElem, "parent_to_" + r.target.entity.name + "_" + r.target.name)
					linkElem = document.getElementById(
						"link_" + getAssociationId(a) + 
						"_" + getPathId({source: r.source, target: r.target})
					)
					appendClass(linkElem, "child_to_" + r.source.entity.name + "_" + r.source.name)
					appendClass(linkElem, "parent_to_" + r.target.entity.name + "_" + r.target.name)
					
					var a1 = document.getElementById('asset_' + a.source.name)
					appendClass(a1, "child_to_" + r.source.entity.name + "_" + r.source.name)
					appendClass(a1, "parent_to_" + r.target.entity.name + "_" + r.target.name)

					var a2 = document.getElementById('asset_' + a.target.name)
					appendClass(a2, "child_to_" + r.source.entity.name + "_" + r.source.name)
					appendClass(a2, "parent_to_" + r.target.entity.name + "_" + r.target.name)
				})
			} else if(r.link) {
				r.link.forEach(function(l, i) {
                    if(i+1 < r.link.length) {
						isaElem = document.getElementById("inheritance_" + 
							r.link[i] + "_" +
							r.link[i+1]
						)
						appendClass(isaElem, "child_to_" + r.source.entity.name + "_" + r.source.name)
						appendClass(isaElem, "parent_to_" + r.target.entity.name + "_" + r.target.name)

						linkElem = document.getElementById(
							"link_" + getInheritanceId({subAsset: {name: r.link[i]}, superAsset: {name: r.link[i+1]}}) + 
							"_" + getPathId({source: r.source, target: r.target})
						)
						appendClass(linkElem, "child_to_" + r.source.entity.name + "_" + r.source.name)
						appendClass(linkElem, "parent_to_" + r.target.entity.name + "_" + r.target.name)
					}
					var a1 = document.getElementById('asset_' + l)
					appendClass(a1, "child_to_" + r.source.entity.name + "_" + r.source.name)
					appendClass(a1, "parent_to_" + r.target.entity.name + "_" + r.target.name)
				})
			}
		})
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
}

function childrenRecurse(base, attackStep, traversed) {
	var assetElem = document.getElementById('asset_' + attackStep.entity.name)
	appendClass(assetElem, "rec_child_to_" + base.entity.name + "_" + base.name)
	if(attackStep.target_steps) {
		attackStep.target_steps.forEach(function(child) {
			var childElem = document.getElementById(child.entity.name + "_" + child.name)
			appendClass(childElem, "rec_child_to_" + base.entity.name + "_" + base.name)
			
			var path_id = 'path_' + attackStep.entity.name + "_" + attackStep.name +
				"_" + child.entity.name + "_" + child.name
			var pathElem = document.getElementById(path_id)
			appendClass(pathElem, "rec_child_to_" + base.entity.name + "_" + base.name)
			if(relationMap[path_id]) {
				association = relationMap[path_id].associations
				link = relationMap[path_id].link
				if(association) {
					association.forEach(function(a, i) {
						if(attackStep.entity.name != child.entity.name) {
							var associationElem = document.getElementById(getAssociationId(a))
							appendClass(associationElem, "rec_child_to_" + base.entity.name + "_" + base.name)
							linkElem = document.getElementById(
								"link_" + getAssociationId(a) + 
								"_" + getPathId({source: attackStep, target: child})
							)
							appendClass(linkElem, "rec_child_to_" + base.entity.name + "_" + base.name)

							var a1 = document.getElementById('asset_' + a.source.name)
							appendClass(a1, "rec_child_to_" + base.entity.name + "_" + base.name)

							var a2 = document.getElementById('asset_' + a.target.name)
							appendClass(a2, "rec_child_to_" + base.entity.name + "_" + base.name)
						}
					})
				} else if(link) {
					link.forEach(function(l, i) {
						if(i+1 < link.length) {
							isaElem = document.getElementById("inheritance_" + 
								link[i] + "_" +
								link[i+1]
							)
							appendClass(isaElem, "rec_child_to_" + base.entity.name + "_" + base.name)

							linkObj = {
								subAsset: {name: link[i]},
								superAsset: {name: link[i+1]}
							}
							linkElem = document.getElementById(
								"link_" + getInheritanceId(linkObj) + 
								"_" + getPathId({source: attackStep, target: child})
							)
							appendClass(linkElem, "rec_child_to_" + base.entity.name + "_" + base.name)
						}
						var a1 = document.getElementById('asset_' + l)
						appendClass(a1, "rec_child_to_" + base.entity.name + "_" + base.name)
					})
				}
			}
			if(!traversed[child.entity.name + "_" + child.name]) {
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
			var parentElem = document.getElementById(parent.entity.name + "_" + parent.name)
			appendClass(parentElem, "rec_parent_to_" + base.entity.name + "_" + base.name)
			
			var path_id = 'path_' + parent.entity.name + "_" + parent.name + "_" + attackStep.entity.name + "_" + attackStep.name
			var pathElem = document.getElementById(path_id)
			appendClass(pathElem, "rec_parent_to_" + base.entity.name + "_" + base.name)

			if(relationMap[path_id]) {
				association = relationMap[path_id].associations
				link = relationMap[path_id].link
				if(association) {
					association.forEach(function(a, i) {
						if(parent.entity.name != attackStep.entity.name) {
							var associationElem = document.getElementById(getAssociationId(a))
							appendClass(associationElem, "rec_parent_to_" + base.entity.name + "_" + base.name)
							linkElem = document.getElementById(
								"link_" + getAssociationId(a) + 
								"_" + getPathId({source: parent, target: attackStep})
							)
							appendClass(linkElem, "rec_parent_to_" + base.entity.name + "_" + base.name)

							var a1 = document.getElementById('asset_' + a.source.name)
							appendClass(a1, "rec_parent_to_" + base.entity.name + "_" + base.name)

							var a2 = document.getElementById('asset_' + a.target.name)
							appendClass(a2, "rec_parent_to_" + base.entity.name + "_" + base.name)
						}
					})
				} else if(link) {
					link.forEach(function(l, i) {
						if(i+1 < link.length) {
							isaElem = document.getElementById("inheritance_" + 
								link[i] + "_" +
								link[i+1]
							)
							appendClass(isaElem, "rec_parent_to_" + base.entity.name + "_" + base.name)

							linkObj = {
								subAsset: {name: link[i]},
								superAsset: {name: link[i+1]}
							}
							linkElem = document.getElementById(
								"link_" + getInheritanceId(linkObj) + 
								"_" + getPathId({source: parent, target: attackStep})
							)
							appendClass(linkElem, "rec_parent_to_" + base.entity.name + "_" + base.name)
						}
						var a1 = document.getElementById('asset_' + l)
						appendClass(a1, "rec_parent_to_" + base.entity.name + "_" + base.name)
					})
				}
			}
			if(!traversed[parent.entity.name + "_" + parent.name]) {
				traversed[parent.entity.name + "_" + parent.name] = true
				parentRecurse(base, parent, traversed)
			}
		})
	}
}

function getAssociationId(d) {
    return "association_" + d.leftName + "_" + d.name + "_" + d.rightName
}

function getInheritanceId(d) {
    return "inheritance_" + d.subAsset.name + "_" + d.superAsset.name
}

function getPathId(d) {
	return "path_" + d.source.entity.name + "_" + d.source.name +
        "_" + d.target.entity.name + "_" + d.target.name
}

function update() {

    graph.association = graph.association.data(root.associations)
	graph.association.exit().remove()
	graph.association = graph.association.enter()
		.append('line')
		.attr('stroke-width', 3)
		.style('stroke', 'grey')
		.attr('class', 'association')
		.attr('id', function(d) {
			return getAssociationId(d)
		})
		.merge(graph.association)
		.attr("visibility", function(d) {
			return d.source.hidden || d.target.hidden ? "hidden" : "visible"
        })
	
    graph.isa = graph.isa.data(isa)
    graph.isa.exit().remove()
    graph.isa = graph.isa.enter()
        .append('line')
        .attr('stroke-width', 3)
		.style('stroke', 'grey')
		.attr('class', 'inheritance')
        .attr('id', function(d) {
            return getInheritanceId(d)
        })
        .merge(graph.isa)
        .attr("visibility", function(d) {
            return d.subAsset.hidden || d.superAsset.hidden ? "hidden" : "visible"
        })

	graph.aLink = graph.aLink.data(links.aLinks)
	graph.aLink.exit().remove()
	graph.aLink = graph.aLink.enter()
		.append("line")
		.attr('stroke-width', 1.4)
		.style('stroke', 'blue')
		.style('stroke-dasharray', '5,5')
		.attr('class', 'link')
		.attr('id', function(d) {
			return "link_" + getAssociationId(d.association) + "_" + getPathId(d.path)
		})
		.merge(graph.aLink)
		.attr("visibility", function(d) {
			return d.path.source.entity.hidden || 
				d.path.target.entity.hidden ||
				d.association.source.hidden ||
				d.association.target.hidden ? "hidden" : "visible"
		})

	graph.iLink = graph.iLink.data(links.iLinks)
	graph.iLink.exit().remove()
	graph.iLink = graph.iLink.enter()
		.append("line")
		.attr('stroke-width', 1.4)
		.style('stroke', 'red')
		.style('stroke-dasharray', '5,5')
		.attr('class', 'link')
		.attr('id', function(d) {
			var link = {
				subAsset: {name: d.link.source},
				superAsset: {name: d.link.target},
			}
			return "link_" + getInheritanceId(link) + "_" + getPathId(d.path)
		})
		.merge(graph.iLink)
		.attr("visibility", function(d) {
			return d.path.source.entity.hidden || 
				d.path.target.entity.hidden ||
				assetMap[d.link.source].hidden ||
				assetMap[d.link.target].hidden ? "hidden" : "visible"
		})

    graph.asset = graph.asset.data(root.children)
    graph.asset.exit().remove()
    graph.asset = graph.asset.enter()
        .append(createAssetBox)
        .merge(graph.asset)
        .attr("visibility", function(d) { return d.hidden ? "hidden" : "visible" })

    var drag = d3.drag()
		.on("start", draggedStart)
		.on("drag", dragged)
		.on("end", draggedEnd)

    graph.asset.call(drag)
    
    graph.attackPath = graph.attackPath.data(relations2)
	graph.attackPath.exit().remove()
    graph.attackPath = graph.attackPath.enter()
        .append('path')
        .attr('stroke-width', 1.1)
        .attr('stroke', 'black')
        .attr('fill', 'transparent')
        .attr('marker-end', 'url(#arrow)')
        .attr('class', function(d) {
            return ' notClickable attackPath child_to_' + 
                d.source.entity.name + "_" + d.source.name + 
                ' parent_to_' + d.target.entity.name + "_" + d.target.name
        })
        .attr('id', function(d) {
            return getPathId(d)
        })
        .merge(graph.attackPath)
		.attr("visibility", function(d) {
			return d.source.entity.hidden || d.target.entity.hidden ? "hidden" : "visible"
		})
		
}

function ticked() {
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

    graph.isa.attr('x1', function(d) {
        return d.subAsset.x
    })
    .attr('y1', function(d) {
        return d.subAsset.y + (30 * d.subAsset.children.length + 40)/2
    })
    .attr('x2', function(d) {
        return d.superAsset.x
    })
    .attr('y2', function(d) {
        return d.superAsset.y + (30 * d.superAsset.children.length + 40)/2
    })
    
    graph.asset.attr('transform', function(d) {
        return 'translate(' + (d.x - boxWidth/2) + ',' + d.y + ')';
    })

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

    graph.aLink.each(function(d) {
        var link = d3.select(this)
        var path = document.getElementById("path_" + 
            d.path.source.entity.name + "_" + 
            d.path.source.name + "_" +
            d.path.target.entity.name + "_" + 
            d.path.target.name
        )
        var mid = path.getTotalLength() * 0.6
        var midPoint = path.getPointAtLength(mid)
        var x1 = midPoint.x
        var y1 = midPoint.y
        var association_id = getAssociationId(d.association)
        var association = document.getElementById(association_id)
        mid = association.getTotalLength() * 0.4
        midPoint = association.getPointAtLength(mid)
        link.attr('x1', x1)
        link.attr('y1', y1)
        link.attr('x2', midPoint.x)
        link.attr('y2', midPoint.y)
    })

    graph.iLink.each(function(d) {
        var link = d3.select(this)
        var path = document.getElementById("path_" + 
            d.path.source.entity.name + "_" + 
            d.path.source.name + "_" +
            d.path.target.entity.name + "_" + 
            d.path.target.name
        )
        var mid = path.getTotalLength() * 0.6
        var midPoint = path.getPointAtLength(mid)
        var x1 = midPoint.x
        var y1 = midPoint.y
        var inheritance_id = "inheritance_" + d.link.source + "_" + d.link.target
        var inheritance = document.getElementById(inheritance_id)
        mid = inheritance.getTotalLength() * 0.4
        midPoint = inheritance.getPointAtLength(mid)
        link.attr('x1', x1)
        link.attr('y1', y1)
        link.attr('x2', midPoint.x)
        link.attr('y2', midPoint.y)
    })
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

function removeMenuAndHide() {
	document.getElementById('clickMenu').remove()
	d3.selectAll('.asset').attr("opacity", "1.0")
	d3.selectAll('.attackStep').attr("opacity","0.1")
	d3.selectAll('.attackPath').attr("opacity","0.0")
	if(hide) {
		d3.selectAll('.asset').attr("opacity", "0.0")
	}
	d3.selectAll('.association').attr("opacity", "0.0")
	d3.selectAll('.inheritance').attr("opacity", "0.0")
	d3.selectAll(".link").attr('opacity', 0.0)
	d3.selectAll('.link_path_association').attr("opacity", "0.0")
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
	d3.selectAll('.' + attackStep).attr("opacity","1.0")
	d3.selectAll('.rec_child_to_' + attackStep).attr("opacity","1.0")
}

function traceAllParents(attackStep) {
	removeMenuAndHide()
	d3.selectAll('#' + attackStep).attr("opacity","1.0")
	d3.selectAll('.' + attackStep).attr("opacity","1.0")
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
		
		//Name of each Attack Step
		var text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
		if(attackStep.type == "or") {
			text.textContent = "| " + attackStep.name;
		} else if(attackStep.type == "and") {
			text.textContent = "& " + attackStep.name;
		} else if(attackStep.type == "defense") {
			asbox.setAttributeNS(null, 'fill', 'red')
			text.textContent = "# " + attackStep.name;
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
		text.setAttributeNS(null, 'class', 'textHover')

		var title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
		title.innerHTML = attackStep.name
		text.append(title)

		group.append(asbox)
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
                var bend = 4
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
					'path_' + attackStep.entity.name + "_" + attackStep.name + "_" +
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