var handlebars = require('handlebars');
var fs = require('fs');

var render = function (url, data)
{
	var html = fs.readFileSync(url);
	var template_renderer = handlebars.compile( html.toString() );
	var rendered_html = template_renderer(data);

	return rendered_html;
}

module.exports.render = render;