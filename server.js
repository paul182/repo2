var Hapi = require('hapi');
var Path = require('path');

const config = require('./config');

const server = new Hapi.Server({
    app: config
});

/**
 * Lets the server run on this Host and Port
 */
server.connection({
	host: process.env.HOST || config.host,
    port: process.env.PORT || config.port 
});

server.settings.app.dbUrl = process.env.JAWSDB_URL || config.dbUrl;

/**
 * Routing Static Pages [JS, Css, Images, etc]
 */
server.register(require('inert'), function(err) {
	
	if (err) {
		
		throw err;
	}
	
	server.route({
		method : 'GET', path : '/public/{path*}', handler : {
			directory : {
				path : './public',
				listing : false,
				index : false
			}
		}
	});
	
});


/**
 * Register all Modules as Plugins Here
 * 
 */

var plugins = [
	
	{ register : require('vision') }, //register Vision with others Plugins
	{ register : require('./modules/employees/index.js') }
	
];


/**
 * Routing Views
 */ 
server.register(plugins, function (err) {

    if (err) {
        throw err;
    }

    server.views({
		
        engines: { html: require('handlebars') },
		layout : true,
        path: __dirname + '/views',
		layoutPath : Path.join(__dirname, './views/layouts'), //setting Global Layout,
		partialsPath : Path.join(__dirname,'./views/layouts/partial') //partial Views
    });
	
    // register handlers
    require(`${__dirname}/register-handlers`)(server);

    // register routes
    server.route(require(`${__dirname}/routes`)(__dirname));
});


/**
 * Starting Server
 */
server.start(function(){

	console.log("Server running on", server.info.uri);
});
