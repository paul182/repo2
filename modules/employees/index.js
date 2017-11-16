/**************************************************
 * Configuring Employees Plugins
 **************************************************/
/**
 * Register Plugins
 */
exports.register = function(server, options, next) {
	/*
	server.route([
		
		{
			method : 'GET',
			path : '/employees',
			handler : function(request, reply) {
				
				reply.view('employees/displayEmployees', {title:'Employees'});
			}
		},
		{
			method : 'POST',
			path : '/employees',
			handler : function(request, reply) {
				
			}
		}
		
		
		
	]);
	*/
	next();
};

/**
 * Plugin attributes...
 * we have here the Name and the Version of the plugin
 */
exports.register.attributes = {
	
	name : 'EmployeesModule',
	version : '1.0.0'	
};