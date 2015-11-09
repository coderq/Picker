var fs = require('fs');
var path = require('path');
var http = require('http');
var data = require('./data');
var folder = require('./folder');
var image = require('./picture');
http.createServer(function(req, res) {
	if (req.url === '/') {
		res.end(fs.readFileSync('./index.html'));
	} else if (req.url.match('/src') || req.url.match('/libs')) {
		try {
			res.end(fs.readFileSync(path.join(__dirname, req.url)));
		} catch (e) {
			res.end('');
		}
	} else if (req.url.match('/data')) {
		req.query = (function() {
			var queries = req.url.split('?')[1].split('&').map(function(item) {
				return item.split('=');
			});
			var query = {};
			queries.map(function(q) {
				query[q[0]] = q[1];
			});
			return query;
		})();
		var search = decodeURIComponent(req.query.search);
		var page = ~~req.query.page || 1;
		var rows = ~~req.query.rows || 10;

		var start = (page - 1) * rows;
		var end = start + rows;
		var result = data.filter(function(item) {
			return search ? ~item.name.indexOf(search) : true;
		});

		res.end(JSON.stringify({
			code: 0,
			message: "成功",
			rows: rows,
			page: page,
			total: result.length,
			data: result.slice(start, end)
		}));
	} else if (req.url.match('/folder')) {
		req.query = (function() {
			var queries = req.url.split('?')[1].split('&').map(function(item) {
				return item.split('=');
			});
			var query = {};
			queries.map(function(q) {
				query[q[0]] = q[1];
			});
			return query;
		})();
		var search = decodeURIComponent(req.query.search);
		var page = ~~req.query.page || 1;
		var rows = ~~req.query.rows || 10;

		var start = (page - 1) * rows;
		var end = start + rows;
		var result = folder.filter(function(item) {
			return search ? ~item.name.indexOf(search) : true;
		});

		res.end(JSON.stringify({
			code: 0,
			message: "成功",
			rows: rows,
			page: page,
			total: result.length,
			data: result.slice(start, end)
		}));
	} else if (req.url.match('/img')) {
		req.query = (function() {
			var queries = req.url.split('?')[1].split('&').map(function(item) {
				return item.split('=');
			});
			var query = {};
			queries.map(function(q) {
				query[q[0]] = q[1];
			});
			return query;
		})();

		res.end(JSON.stringify({
			code: 0,
			message: "成功",
			rows: rows,
			page: page,
			total: image.length,
			data: image
		}));
	} else {
		throw Error('undefined');
	}
}).listen(3001);