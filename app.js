var fs = require('fs');
var path = require('path');
var http = require('http');
var data = require('./data');
var folder = require('./folder');
var image = require('./picture');
var brand = require('./brand');
var goods_type = require('./goods_type');
var goods = require('./goods');
http.createServer(function(req, res) {
	if (req.url === '/') {
		res.end(fs.readFileSync('./index.html'));
	} else if (req.url.match(/^\/(src|libs|jquery|picker)/)) {
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
	} else if (req.url.match('/brand')) {
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
		var result = brand.filter(function(item) {
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
	} else if (req.url.match('/goods_type')) {
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
			total: goods_type.length,
			data: goods_type
		}));
	} else if (req.url.match('/goods')) {
		var selected_goods = goods.slice(0);
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
		if (Number(req.query.goods_type_id)) {
			selected_goods = goods.filter(function(goods) {console.log(goods, req.query.goods_type_id);
				return goods.type == req.query.goods_type_id;
			});
		}
		res.end(JSON.stringify({
			code: 0,
			message: "成功",
			rows: rows,
			page: page,
			total: selected_goods.length,
			data: selected_goods
		}));
	} else {
		console.log(req.url);
		throw Error('undefined');
	}
}).listen(3001);