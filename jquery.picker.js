(function(factory) {
	if (typeof define === "function" && define.amd) {
		define(["jquery"], factory);
	} else if (typeof exports === "object") {
		module.exports = factory(require("jquery"));
	} else {
		factory(jQuery);
	}
})(function($) {
	var compile = function(tpl, data) {
		var matches = tpl.match(/<%=\s?[$_\w]+\s?%>/g),
			keys;
		if (matches) {
			keys = matches.map(function(item) {
				return item.replace(/^<%=\s?([$_\w]+)\s?%>$/, function($, $1) {
					return $1;
				});
			});
			matches.map(function(item, index) {
				var value = data[keys[index]];
				tpl = tpl.replace(item, value || '');
			});
		}
		return tpl;
	};
	var filter = function(ary, cb) {
		var ret = [];
		$.each(ary, function(index, item) {
			if (cb(item)) {
				ret.push(item);
			}
		});
		return ret;
	};

	var single_text = (function() {
		var _defaults = {
				title: '锚点选择',
				confirm_text: '确定',
				cancel_text: '取消',
				rows: 10
			},
			_opts;
		var _handler, _data, _jq = {};
		var _template = {
			content: '<div class="modal-dialog modal-lg" role="document">' +
				'<div class="modal-content">' +
				'</div>' +
				'</div>',
			header: '<div class="modal-header">' +
				'<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
				'<span aria-hidden="true">&times;</span>' +
				'</button>' +
				'<h4 class="modal-title"><%= title %></h4>' +
				'</div>',
			body: '<div class="modal-body">' +
				'<div>' +
				'<input class="form-control" type="search" placeholder="Search..." style="margin-bottom: 10px;">' +
				'<div class="list-group" style="max-height: 320px; overflow: auto; margin-bottom: 0;">' +
				'</div>' +
				'</div>' +
				'</div>',
			footer: '<div class="modal-footer">' +
				'<nav style="float: left;">' +
				'<ul class="pagination" style="margin: 0;">' +
				'</ul>' +
				'</nav>' +
				'<button type="button" class="btn btn-default" data-dismiss="modal"><%= cancel_text %></button>' +
				'<button type="button" class="btn btn-primary"><%= confirm_text %></button>' +
				'</div>',
			prev: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);" aria-label="Previous">' +
				'<span aria-hidden="true">&laquo;</span>' +
				'</a>' +
				'</li>',
			next: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);" aria-label="Next">' +
				'<span aria-hidden="true">&raquo;</span>' +
				'</a>' +
				'</li>',
			page: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);"><%= page %></a>' +
				'</li>',
			list: '<a href="javascript:void(0);" class="list-group-item" data-id="<%= id %>"><%= name %></a>',
		};
		var _loadData = function(opts, search, cb) {
			$.ajax({
				url: opts.url,
				method: opts.method || 'get',
				data: {
					search: search.text,
					page: search.page,
					rows: search.rows
				},
				dataType: 'json',
				success: cb,
				error: function(err) {
					throw err;
				}
			});
		};
		var _onSearch = function(page) {
			return function() {
				_handler && clearTimeout(_handler);
				_handler = setTimeout(function() {
					var text = _jq.$search.val();
					var rows = _opts.rows;
					_loadData(_opts, {
						text: text,
						page: page || 1,
						rows: rows
					}, function(result) {
						if (result.code) throw Error(result.message);
						_data = result.data;
						_render(result);
					});
				}, 500);
			}
		};
		var _renderList = function(data_list) {
			_jq.$list_group.html('');
			$.each(data_list, function(index, item) {
				var $item = $(compile(_template.list, item));
				_jq.$list_group.append($item);
				$item.bind('click', function() {
					$(this)
						.addClass('active')
						.siblings()
						.removeClass('active');
				});
			});
		};
		var _renderPagination = function(result) {
			var page = result.page;
			var rows = result.rows;
			var total = Math.ceil(result.total / rows);
			var start = Math.max(page - 3, 1);
			var end = Math.min(page + 3, total);
			var $prev = $(compile(_template.prev, {
				page: Math.max(page - 1, 1)
			}));
			var $next = $(compile(_template.next, {
				page: Math.min(page + 1, total)
			}));
			var $page;
			_jq.$pagination.html('');
			if (total === 0) return;
			if (result.page === start) {
				$prev.addClass('disabled');
			}
			_jq.$pagination.append($prev);
			for (i = start; i <= end; i++) {
				$page = $(compile(_template.page, {
					page: i
				}));
				if (i === page) {
					$page.addClass('active');
				}
				_jq.$pagination.append($page);
			}
			if (result.page === end) {
				$next.addClass('disabled');
			}
			_jq.$pagination.append($next);
			_jq.$pagination.find('li').bind('click', function() {
				var $this = $(this);
				var page = $this.data('page');
				if (!$this.hasClass('active')) {
					_onSearch(page)();
				}
			});
		};
		var _onComplete = function() {
			var selected = _jq.$list_group.find('.active');
			if (selected.length) {
				selected = filter(_data, function(item) {
					return item.id == selected.data('id');
				});
				_opts.onComplete(selected.shift());
			}
		}
		var _render = function(result) {
			_renderList(result.data);
			_renderPagination(result);
			_jq.$search.get(0).focus();
		};
		return {
			init: function($dialog, opts) {
				_jq.$dialog = $dialog;
				_opts = $.extend(_defaults, opts);
				return this;
			},
			build: function() {
				_jq.$dialog.html('');
				_jq.$dialog.append(_template.content);
				_jq.$content = _jq.$dialog.find('.modal-content');
				_jq.$content.append(compile(_template.header, _opts));
				_jq.$header = _jq.$dialog.find('.modal-header');
				_jq.$content.append(compile(_template.body, _opts));
				_jq.$body = _jq.$content.find('.modal-body');
				_jq.$search = _jq.$body.find('input[type=search]');
				_jq.$list_group = _jq.$body.find('.list-group');
				_jq.$content.append(compile(_template.footer, _opts));
				_jq.$footer = _jq.$content.find('.modal-footer');
				_jq.$pagination = _jq.$footer.find('.pagination');
				_jq.$confirm_btn = _jq.$footer.find('.btn-primary');
				return this;
			},
			render: function() {
				_jq.$search
					.bind('keyup', _onSearch())
					.trigger('keyup');
				if (_opts.onComplete) {
					_jq.$confirm_btn
						.unbind('click', _onComplete)
						.bind('click', _onComplete);
				}
			}
		};
	})();

	var single_picture = (function() {
		var _defaults = {
				title: '图片选择',
				confirm_text: '确定',
				cancel_text: '取消',
				rows: 10
			},
			_opts;
		var _handler, _data, _jq = {};
		var _template = {
			content: '<div class="modal-dialog modal-lg" role="document">' +
				'<div class="modal-content pk-folder">' +
				'</div>' +
				'<div class="modal-content pk-image hidden">' +
				'</div>' +
				'</div>',
			header: '<div class="modal-header">' +
				'<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
				'<span aria-hidden="true">&times;</span>' +
				'</button>' +
				'<h4 class="modal-title"><%= title %></h4>' +
				'</div>',
			folder_body: '<div class="modal-body">' +
				'<div>' +
				'<input class="form-control" type="search" placeholder="Search..." style="margin-bottom: 10px;">' +
				'<div class="thumbnail-group" style="width: 100%; max-height: 320px; overflow: auto; margin-bottom: 0;">' +
				'</div>' +
				'</div>' +
				'</div>',
			folder: '<div class="thumbnail" style="display: inline-block; margin: 0 17px 10px 17px; padding: 0 26px; cursor: pointer; text-align: center;" data-id="<%= id %>">' +
      			'<span class="glyphicon glyphicon-folder-close" style="font-size: 120px;"></span>' +
      			'<div class="caption">' +
        		'<h4><%= name %></h4>' +
        		'<p>共有图片<b><%= total %></b>张</p>' +
      			'</div>' +
    			'</div>',
			folder_footer: '<div class="modal-footer">' +
				'<nav style="float: left;">' +
				'<ul class="pagination" style="margin: 0;">' +
				'</ul>' +
				'</nav>' +
				'</div>',
			image_body: '<div class="modal-body">' +
				'<div>' +
				'<div class="thumbnail-group" style="width: 100%; max-height: 420px; overflow: auto; margin-bottom: 0;">' +
				'</div>' +
				'</div>' +
				'</div>',
    		image: '<a href="javascript:void(0);" class="thumbnail" style="display: inline-block; width: 182px; margin: 0 17px 10px 17px; padding: 0 10px; cursor: pointer;" data-id="<%= id %>">' + 
     	 		'<img src="<%= src %>" alt="<%= name %>" style="max-width: 160px; max-height: 200px;">' +
    			'<div class="caption">' +
        		'<p><%= name %></p>' +
        		'</div>' +
    			'</a>',
			image_footer: '<div class="modal-footer">' +
				'<button type="button" class="btn btn-default pk-back">返回</button>' +
				'<button type="button" class="btn btn-primary"><%= confirm_text %></button>' +
				'</div>',
			prev: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);" aria-label="Previous">' +
				'<span aria-hidden="true">&laquo;</span>' +
				'</a>' +
				'</li>',
			next: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);" aria-label="Next">' +
				'<span aria-hidden="true">&raquo;</span>' +
				'</a>' +
				'</li>',
			page: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);"><%= page %></a>' +
				'</li>'
		};
		var _loadFolderData = function(opts, search, cb) {
			$.ajax({
				url: opts.folder_url,
				method: opts.folder_method || 'get',
				data: {
					search: search.text,
					page: search.page,
					rows: search.rows
				},
				dataType: 'json',
				success: cb,
				error: function(err) {
					throw err;
				}
			});
		};
		var _loadImageData = function(opts, search, cb) {
			$.ajax({
				url: opts.image_url,
				method: opts.image_method || 'get',
				data: {
					folder_id: search.folder_id
				},
				dataType: 'json',
				success: cb,
				error: function(err) {
					throw err;
				}
			});
		};
		var _onSearch = function(page) {
			return function() {
				_handler && clearTimeout(_handler);
				_handler = setTimeout(function() {
					var text = _jq.$folder_search.val();
					var rows = _opts.rows;
					_loadFolderData(_opts, {
						text: text,
						page: page || 1,
						rows: rows
					}, function(result) {
						if (result.code) throw Error(result.message);
						_renderFolder(result);
					});
				}, 500);
			}
		};
		var _renderFolderList = function(data_list) {
			_jq.$folder_group.html('');
			$.each(data_list, function(index, item) {
				var $item = $(compile(_template.folder, item));
				_jq.$folder_group.append($item);
				$item.bind('click', function() {
					var folder_id = $(this).data('id');
					_renderImage(folder_id);
				});
			});
		};
		var _renderFolderPagination = function(result) {
			var page = result.page;
			var rows = result.rows;
			var total = Math.ceil(result.total / rows);
			var start = Math.max(page - 3, 1);
			var end = Math.min(page + 3, total);
			var $prev = $(compile(_template.prev, {
				page: Math.max(page - 1, 1)
			}));
			var $next = $(compile(_template.next, {
				page: Math.min(page + 1, total)
			}));
			var $page;
			_jq.$pagination.html('');
			if (total === 0) return;
			if (result.page === start) {
				$prev.addClass('disabled');
			}
			_jq.$pagination.append($prev);
			for (i = start; i <= end; i++) {
				$page = $(compile(_template.page, {
					page: i
				}));
				if (i === page) {
					$page.addClass('active');
				}
				_jq.$pagination.append($page);
			}
			if (result.page === end) {
				$next.addClass('disabled');
			}
			_jq.$pagination.append($next);
			_jq.$pagination.find('li').bind('click', function() {
				var $this = $(this);
				var page = $this.data('page');
				if (!$this.hasClass('active')) {
					_onSearch(page)();
				}
			});
		};
		var _renderFolder = function(result) {
			_renderFolderList(result.data);
			_renderFolderPagination(result);
			_jq.$folder_search.get(0).focus();
		};
		var _renderImageList = function(images) {
			$.each(images, function(index, item) {
				var $item = $(compile(_template.image, item));
				_jq.$image_group.append($item);
				$item.bind('click', function() {
					var $this = $(this);
					$this.addClass('active');
					$this.siblings().removeClass('active');
				});
			});
		};
		var _renderImage = function(folder_id) {
			_jq.$image_group.html('');
			_jq.$folder_content.addClass('hidden');
			_jq.$image_content.removeClass('hidden');
			_loadImageData(_opts, {
				folder_id: folder_id
			}, function(result) {
				if (result.code) throw Error(result.message);
				_data = result.data;
				_renderImageList(_data);
			});
		};
		var _onComplete = function() {
			var selected = _jq.$image_group.find('.active');
			if (selected.length) {
				selected = filter(_data, function(item) {
					return item.id == selected.data('id');
				});
				_opts.onComplete(selected.shift());
			}
		}
		return {
			init: function($dialog, opts) {
				_jq.$dialog = $dialog;
				_opts = $.extend(_defaults, opts);
				return this;
			},
			build: function() {
				_jq.$dialog.html('');
				_jq.$content = $(compile(_template.content, _opts));
				_jq.$dialog.append(_jq.$content);
				
				_jq.$folder_content = _jq.$content.find('.pk-folder');
				_jq.$folder_header = $(compile(_template.header, _opts));
				_jq.$folder_body = $(compile(_template.folder_body, _opts));
				_jq.$folder_footer = $(compile(_template.folder_footer, _opts));
				_jq.$folder_search = _jq.$folder_body.find('input[type=search]'); 
				_jq.$folder_group = _jq.$folder_body.find('.thumbnail-group');
				_jq.$pagination = _jq.$folder_footer.find('.pagination');

				_jq.$folder_content.append(_jq.$folder_header);
				_jq.$folder_content.append(_jq.$folder_body);
				_jq.$folder_content.append(_jq.$folder_footer);

				_jq.$image_content = _jq.$content.find('.pk-image');
				_jq.$image_header = $(compile(_template.header, _opts));
				_jq.$image_body = $(compile(_template.image_body, _opts));
				_jq.$image_footer = $(compile(_template.image_footer, _opts));
				_jq.$image_group = _jq.$image_body.find('.thumbnail-group');
				_jq.$back_btn = _jq.$image_footer.find('.pk-back');
				_jq.$confirm_btn = _jq.$image_footer.find('.btn-primary');

				_jq.$image_content.append(_jq.$image_header);
				_jq.$image_content.append(_jq.$image_body);
				_jq.$image_content.append(_jq.$image_footer);

				return this;
			},
			render: function() {
				_jq.$folder_search
					.bind('keyup', _onSearch())
					.trigger('keyup');
				_jq.$back_btn.bind('click', function() {
					_jq.$folder_content.removeClass('hidden');
					_jq.$image_content.addClass('hidden');
					_jq.$folder_search.get(0).focus();
				});
				if (_opts.onComplete) {
					_jq.$confirm_btn
						.unbind('click', _onComplete)
						.bind('click', _onComplete);
				}
			}
		};
	})();

	var multi_picture = (function() {
		var _defaults = {
				title: '图片选择',
				confirm_text: '确定',
				cancel_text: '取消',
				rows: 10
			},
			_opts;
		var _handler, _data, _jq = {};
		var _template = {
			content: '<div class="modal-dialog modal-lg" role="document">' +
				'<div class="modal-content pk-folder">' +
				'</div>' +
				'<div class="modal-content pk-image hidden">' +
				'</div>' +
				'</div>',
			header: '<div class="modal-header">' +
				'<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
				'<span aria-hidden="true">&times;</span>' +
				'</button>' +
				'<h4 class="modal-title"><%= title %></h4>' +
				'</div>',
			folder_body: '<div class="modal-body">' +
				'<div>' +
				'<input class="form-control" type="search" placeholder="Search..." style="margin-bottom: 10px;">' +
				'<div class="thumbnail-group" style="width: 100%; max-height: 320px; overflow: auto; margin-bottom: 0;">' +
				'</div>' +
				'</div>' +
				'</div>',
			folder: '<div class="thumbnail" style="display: inline-block; margin: 0 17px 10px 17px; padding: 0 26px; cursor: pointer; text-align: center;" data-id="<%= id %>">' +
      			'<span class="glyphicon glyphicon-folder-close" style="font-size: 120px;"></span>' +
      			'<div class="caption">' +
        		'<h4><%= name %></h4>' +
        		'<p>共有图片<b><%= total %></b>张</p>' +
      			'</div>' +
    			'</div>',
			folder_footer: '<div class="modal-footer">' +
				'<nav style="float: left;">' +
				'<ul class="pagination" style="margin: 0;">' +
				'</ul>' +
				'</nav>' +
				'</div>',
			image_body: '<div class="modal-body">' +
				'<div>' +
				'<div class="thumbnail-group" style="width: 100%; max-height: 420px; overflow: auto; margin-bottom: 0;">' +
				'</div>' +
				'</div>' +
				'</div>',
    		image: '<a href="javascript:void(0);" class="thumbnail" style="display: inline-block; width: 182px; margin: 0 17px 10px 17px; padding: 0 10px; cursor: pointer;" data-id="<%= id %>">' + 
     	 		'<img src="<%= src %>" alt="<%= name %>" style="max-width: 160px; max-height: 200px;">' +
    			'<div class="caption">' +
        		'<input type="checkbox"> <span><%= name %></span>' +
        		'</div>' +
    			'</a>',
			image_footer: '<div class="modal-footer">' +
				'<button type="button" class="btn btn-default pk-back">返回</button>' +
				'<button type="button" class="btn btn-primary"><%= confirm_text %></button>' +
				'</div>',
			prev: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);" aria-label="Previous">' +
				'<span aria-hidden="true">&laquo;</span>' +
				'</a>' +
				'</li>',
			next: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);" aria-label="Next">' +
				'<span aria-hidden="true">&raquo;</span>' +
				'</a>' +
				'</li>',
			page: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);"><%= page %></a>' +
				'</li>'
		};
		var _loadFolderData = function(opts, search, cb) {
			$.ajax({
				url: opts.folder_url,
				method: opts.folder_method || 'get',
				data: {
					search: search.text,
					page: search.page,
					rows: search.rows
				},
				dataType: 'json',
				success: cb,
				error: function(err) {
					throw err;
				}
			});
		};
		var _loadImageData = function(opts, search, cb) {
			$.ajax({
				url: opts.image_url,
				method: opts.image_method || 'get',
				data: {
					folder_id: search.folder_id
				},
				dataType: 'json',
				success: cb,
				error: function(err) {
					throw err;
				}
			});
		};
		var _onSearch = function(page) {
			return function() {
				_handler && clearTimeout(_handler);
				_handler = setTimeout(function() {
					var text = _jq.$folder_search.val();
					var rows = _opts.rows;
					_loadFolderData(_opts, {
						text: text,
						page: page || 1,
						rows: rows
					}, function(result) {
						if (result.code) throw Error(result.message);
						_renderFolder(result);
					});
				}, 500);
			}
		};
		var _renderFolderList = function(data_list) {
			_jq.$folder_group.html('');
			$.each(data_list, function(index, item) {
				var $item = $(compile(_template.folder, item));
				_jq.$folder_group.append($item);
				$item.bind('click', function() {
					var folder_id = $(this).data('id');
					_renderImage(folder_id);
				});
			});
		};
		var _renderFolderPagination = function(result) {
			var page = result.page;
			var rows = result.rows;
			var total = Math.ceil(result.total / rows);
			var start = Math.max(page - 3, 1);
			var end = Math.min(page + 3, total);
			var $prev = $(compile(_template.prev, {
				page: Math.max(page - 1, 1)
			}));
			var $next = $(compile(_template.next, {
				page: Math.min(page + 1, total)
			}));
			var $page;
			_jq.$pagination.html('');
			if (total === 0) return;
			if (result.page === start) {
				$prev.addClass('disabled');
			}
			_jq.$pagination.append($prev);
			for (i = start; i <= end; i++) {
				$page = $(compile(_template.page, {
					page: i
				}));
				if (i === page) {
					$page.addClass('active');
				}
				_jq.$pagination.append($page);
			}
			if (result.page === end) {
				$next.addClass('disabled');
			}
			_jq.$pagination.append($next);
			_jq.$pagination.find('li').bind('click', function() {
				var $this = $(this);
				var page = $this.data('page');
				if (!$this.hasClass('active')) {
					_onSearch(page)();
				}
			});
		};
		var _renderFolder = function(result) {
			_renderFolderList(result.data);
			_renderFolderPagination(result);
			_jq.$folder_search.get(0).focus();
		};
		var _renderImageList = function(images) {
			$.each(images, function(index, item) {
				var $item = $(compile(_template.image, item));
				_jq.$image_group.append($item);
			});
		};
		var _renderImage = function(folder_id) {
			_jq.$image_group.html('');
			_jq.$folder_content.addClass('hidden');
			_jq.$image_content.removeClass('hidden');
			_loadImageData(_opts, {
				folder_id: folder_id
			}, function(result) {
				if (result.code) throw Error(result.message);
				_data = result.data;
				_renderImageList(_data);
			});
		};
		var _onComplete = function() {
			var selected = _jq.$image_group.find('input[type=checkbox]:checked');
			var selected_id = $.map(selected, function(item, i) {
				return $(item).parents('[data-id]').data('id');
			});
			if (selected.length) {
				selected = filter(_data, function(item) {
					return ~selected_id.indexOf(item.id)
				});
				_opts.onComplete(selected);
			}
		}
		return {
			init: function($dialog, opts) {
				_jq.$dialog = $dialog;
				_opts = $.extend(_defaults, opts);
				return this;
			},
			build: function() {
				_jq.$dialog.html('');
				_jq.$content = $(compile(_template.content, _opts));
				_jq.$dialog.append(_jq.$content);
				
				_jq.$folder_content = _jq.$content.find('.pk-folder');
				_jq.$folder_header = $(compile(_template.header, _opts));
				_jq.$folder_body = $(compile(_template.folder_body, _opts));
				_jq.$folder_footer = $(compile(_template.folder_footer, _opts));
				_jq.$folder_search = _jq.$folder_body.find('input[type=search]'); 
				_jq.$folder_group = _jq.$folder_body.find('.thumbnail-group');
				_jq.$pagination = _jq.$folder_footer.find('.pagination');

				_jq.$folder_content.append(_jq.$folder_header);
				_jq.$folder_content.append(_jq.$folder_body);
				_jq.$folder_content.append(_jq.$folder_footer);

				_jq.$image_content = _jq.$content.find('.pk-image');
				_jq.$image_header = $(compile(_template.header, _opts));
				_jq.$image_body = $(compile(_template.image_body, _opts));
				_jq.$image_footer = $(compile(_template.image_footer, _opts));
				_jq.$image_group = _jq.$image_body.find('.thumbnail-group');
				_jq.$back_btn = _jq.$image_footer.find('.pk-back');
				_jq.$confirm_btn = _jq.$image_footer.find('.btn-primary');

				_jq.$image_content.append(_jq.$image_header);
				_jq.$image_content.append(_jq.$image_body);
				_jq.$image_content.append(_jq.$image_footer);

				return this;
			},
			render: function() {
				_jq.$folder_search
					.bind('keyup', _onSearch())
					.trigger('keyup');
				_jq.$back_btn.bind('click', function() {
					_jq.$folder_content.removeClass('hidden');
					_jq.$image_content.addClass('hidden');
					_jq.$folder_search.get(0).focus();
				});
				if (_opts.onComplete) {
					_jq.$confirm_btn
						.unbind('click', _onComplete)
						.bind('click', _onComplete);
				}
			}
		};
	})();

	var single_goods = (function() {
		var _defaults = {
				title: '商品选择',
				confirm_text: '确定',
				cancel_text: '取消',
				rows: 8
			},
			_opts;
		var _handler, _data, _jq = {};
		var _template = {
			content: '<div class="modal-dialog modal-lg" role="document">' +
				'<div class="modal-content pk-brand">' +
				'</div>' +
				'<div class="modal-content pk-goods hidden">' +
				'</div>' +
				'</div>',
			header: '<div class="modal-header">' +
				'<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
				'<span aria-hidden="true">&times;</span>' +
				'</button>' +
				'<h4 class="modal-title"><%= title %></h4>' +
				'</div>',
			brand_body: '<div class="modal-body">' +
				'<div>' +
				'<input class="form-control" type="search" placeholder="Search..." style="margin-bottom: 10px;">' +
				'<div class="thumbnail-group" style="width: 100%; max-height: 320px; overflow: auto; margin-bottom: 0;">' +
				'</div>' +
				'</div>' +
				'</div>',
			brand: '<div class="thumbnail" style="display: inline-block; margin: 0 17px 10px 17px; padding: 0 26px; cursor: pointer; text-align: center;" data-id="<%= id %>">' +
      			'<img src="<%= img %>" style="width: 128px;" />' +
      			'<div class="caption">' +
        		'<h4><%= name %></h4>' +
        		'<p>共有商品<b><%= total %></b>件</p>' +
      			'</div>' +
    			'</div>',
			brand_footer: '<div class="modal-footer">' +
				'<nav style="float: left;">' +
				'<ul class="pagination" style="margin: 0;">' +
				'</ul>' +
				'</nav>' +
				'</div>',
			goods_body: '<div class="modal-body">' +
				'<div>' +
				'<form class="form-inline pk-goods-type-group" style="line-height: 32px;"></form>' +
				'<div class="thumbnail-group" style="width: 100%; max-height: 420px; overflow: auto; margin-bottom: 0;">' +
				'</div>' +
				'</div>' +
				'</div>',
			goods_type: '<label style="margin-right:10px;"><input type="radio" name="goods_type" value="<%= id %>">&nbsp;<%= name %></label>',
    		goods: '<a href="javascript:void(0);" class="thumbnail" style="display: inline-block; width: 182px; margin: 0 17px 10px 17px; padding: 0 10px; cursor: pointer;" data-id="<%= id %>">' + 
     	 		'<img src="<%= src %>" alt="<%= name %>" style="max-width: 160px; max-height: 200px;">' +
    			'<div class="caption">' +
        		'<p><%= name %></p>' +
        		'</div>' +
    			'</a>',
			goods_footer: '<div class="modal-footer">' +
				'<button type="button" class="btn btn-default pk-back">返回</button>' +
				'<button type="button" class="btn btn-primary"><%= confirm_text %></button>' +
				'</div>',
			prev: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);" aria-label="Previous">' +
				'<span aria-hidden="true">&laquo;</span>' +
				'</a>' +
				'</li>',
			next: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);" aria-label="Next">' +
				'<span aria-hidden="true">&raquo;</span>' +
				'</a>' +
				'</li>',
			page: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);"><%= page %></a>' +
				'</li>'
		};
		var _loadBrandData = function(opts, search, cb) {
			$.ajax({
				url: opts.brand_url,
				method: opts.brand_method || 'get',
				data: {
					search: search.text,
					page: search.page,
					rows: search.rows
				},
				dataType: 'json',
				success: cb,
				error: function(err) {
					throw err;
				}
			});
		};
		var _loadGoodsTypeData = function(opts, search, cb) {
			$.ajax({
				url: opts.goods_type_url,
				method: opts.goods_method || 'get',
				data: {
					brand_id: search.brand_id
				},
				dataType: 'json',
				success: cb,
				error: function(err) {
					throw err;
				}
			});
		};
		var _loadGoodsData = function(opts, search, cb) {
			$.ajax({
				url: opts.goods_url,
				method: opts.goods_method || 'get',
				data: {
					brand_id: search.brand_id,
					goods_type_id: search.goods_type_id
				},
				dataType: 'json',
				success: cb,
				error: function(err) {
					throw err;
				}
			});
		};
		var _onSearch = function(page) {
			return function() {
				_handler && clearTimeout(_handler);
				_handler = setTimeout(function() {
					var text = _jq.$brand_search.val();
					var rows = _opts.rows;
					_loadBrandData(_opts, {
						text: text,
						page: page || 1,
						rows: rows
					}, function(result) {
						if (result.code) throw Error(result.message);
						_renderBrand(result);
					});
				}, 500);
			}
		};
		var _renderBrandList = function(data_list) {
			_jq.$brand_group.html('');
			$.each(data_list, function(index, item) {
				var $item = $(compile(_template.brand, item));
				_jq.$brand_group.append($item);
				$item.bind('click', function() {
					var brand_id = $(this).data('id');
					_renderGoods(brand_id);
				});
			});
		};
		var _renderBrandPagination = function(result) {
			var page = result.page;
			var rows = result.rows;
			var total = Math.ceil(result.total / rows);
			var start = Math.max(page - 3, 1);
			var end = Math.min(page + 3, total);
			var $prev = $(compile(_template.prev, {
				page: Math.max(page - 1, 1)
			}));
			var $next = $(compile(_template.next, {
				page: Math.min(page + 1, total)
			}));
			var $page;
			_jq.$pagination.html('');
			if (total === 0) return;
			if (result.page === start) {
				$prev.addClass('disabled');
			}
			_jq.$pagination.append($prev);
			for (i = start; i <= end; i++) {
				$page = $(compile(_template.page, {
					page: i
				}));
				if (i === page) {
					$page.addClass('active');
				}
				_jq.$pagination.append($page);
			}
			if (result.page === end) {
				$next.addClass('disabled');
			}
			_jq.$pagination.append($next);
			_jq.$pagination.find('li').bind('click', function() {
				var $this = $(this);
				var page = $this.data('page');
				if (!$this.hasClass('active')) {
					_onSearch(page)();
				}
			});
		};
		var _renderBrand = function(result) {
			_renderBrandList(result.data);
			_renderBrandPagination(result);
			_jq.$brand_search.get(0).focus();
		};
		var _renderGoodsTypeList = function(goods_type, brand_id) {
			goods_type.unshift({id: '0', name: '全部', checked: 'true'});
			$.each(goods_type, function(index, item) {
				var $item;
				$item = $(compile(_template.goods_type, item));
				_jq.$goods_type_group.append($item);
				if (!index) $item.find('input').attr('checked', true);
				$item.find('input').bind('change', function() {
					var _this = $(this);
					var sublings = _this.siblings();
					if (_this.is(':checked')) {
						sublings.attr('checked', false);
						_renderGoods(brand_id, _this.val());
					}
				})
			});
		};
		var _renderGoodsList = function(goods) {
			$.each(goods, function(index, item) {
				var $item = $(compile(_template.goods, item));
				_jq.$goods_group.append($item);
				$item.bind('click', function() {
					var $this = $(this);
					$this.addClass('active');
					$this.siblings().removeClass('active');
				});
			});
		};
		var _renderGoods = function(brand_id, goods_type_id) {
			_jq.$goods_group.html('');
			_jq.$brand_content.addClass('hidden');
			_jq.$goods_content.removeClass('hidden');
			if (!goods_type_id) {
				_loadGoodsTypeData(_opts, {
					brand_id: brand_id
				}, function(result) {
					if (result.code) throw Error(result.message);
					_data = result.data;
					_renderGoodsTypeList(_data, brand_id);
				});
			}
			_loadGoodsData(_opts, {
				brand_id: brand_id,
				goods_type_id: goods_type_id
			}, function(result) {
				if (result.code) throw Error(result.message);
				_data = result.data;
				_renderGoodsList(_data);
			});
		};
		var _onComplete = function() {
			var selected = _jq.$goods_group.find('.active');
			if (selected.length) {
				selected = filter(_data, function(item) {
					return item.id == selected.data('id');
				});
				_opts.onComplete(selected.shift());
			}
		}
		return {
			init: function($dialog, opts) {
				_jq.$dialog = $dialog;
				_opts = $.extend(_defaults, opts);
				return this;
			},
			build: function() {
				_jq.$dialog.html('');
				_jq.$content = $(compile(_template.content, _opts));
				_jq.$dialog.append(_jq.$content);
				
				_jq.$brand_content = _jq.$content.find('.pk-brand');
				_jq.$brand_header = $(compile(_template.header, _opts));
				_jq.$brand_body = $(compile(_template.brand_body, _opts));
				_jq.$brand_footer = $(compile(_template.brand_footer, _opts));
				_jq.$brand_search = _jq.$brand_body.find('input[type=search]'); 
				_jq.$brand_group = _jq.$brand_body.find('.thumbnail-group');
				_jq.$pagination = _jq.$brand_footer.find('.pagination');

				_jq.$brand_content.append(_jq.$brand_header);
				_jq.$brand_content.append(_jq.$brand_body);
				_jq.$brand_content.append(_jq.$brand_footer);

				_jq.$goods_content = _jq.$content.find('.pk-goods');
				_jq.$goods_header = $(compile(_template.header, _opts));
				_jq.$goods_body = $(compile(_template.goods_body, _opts));
				_jq.$goods_footer = $(compile(_template.goods_footer, _opts));
				_jq.$goods_type_group = _jq.$goods_body.find('.pk-goods-type-group');
				_jq.$goods_group = _jq.$goods_body.find('.thumbnail-group');
				_jq.$back_btn = _jq.$goods_footer.find('.pk-back');
				_jq.$confirm_btn = _jq.$goods_footer.find('.btn-primary');

				_jq.$goods_content.append(_jq.$goods_header);
				_jq.$goods_content.append(_jq.$goods_body);
				_jq.$goods_content.append(_jq.$goods_footer);

				return this;
			},
			render: function() {
				_jq.$brand_search
					.bind('keyup', _onSearch())
					.trigger('keyup');
				_jq.$back_btn.bind('click', function() {
					_jq.$brand_content.removeClass('hidden');
					_jq.$goods_content.addClass('hidden');
					_jq.$brand_search.get(0).focus();
				});
				if (_opts.onComplete) {
					_jq.$confirm_btn
						.unbind('click', _onComplete)
						.bind('click', _onComplete);
				}
			}
		};
	})();

	var multi_goods = (function() {
		var _defaults = {
				title: '商品选择',
				confirm_text: '确定',
				cancel_text: '取消',
				rows: 8
			},
			_opts;
		var _handler, _data = [], _jq = {};
		var _template = {
			content: '<div class="modal-dialog modal-lg" role="document">' +
				'<div class="modal-content pk-brand">' +
				'</div>' +
				'<div class="modal-content pk-goods hidden">' +
				'</div>' +
				'</div>',
			header: '<div class="modal-header">' +
				'<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
				'<span aria-hidden="true">&times;</span>' +
				'</button>' +
				'<h4 class="modal-title"><%= title %></h4>' +
				'</div>',
			brand_body: '<div class="modal-body">' +
				'<div>' +
				'<input class="form-control" type="search" placeholder="Search..." style="margin-bottom: 10px;">' +
				'<div class="thumbnail-group" style="width: 100%; max-height: 320px; overflow: auto; margin-bottom: 0;">' +
				'</div>' +
				'</div>' +
				'</div>',
			brand: '<div class="thumbnail" style="display: inline-block; margin: 0 17px 10px 17px; padding: 0 26px; cursor: pointer; text-align: center;" data-id="<%= id %>">' +
      			'<img src="<%= img %>" style="width: 128px;" />' +
      			'<div class="caption">' +
        		'<h4><%= name %></h4>' +
        		'<p>共有商品<b><%= total %></b>件</p>' +
      			'</div>' +
    			'</div>',
			brand_footer: '<div class="modal-footer">' +
				'<nav style="float: left;">' +
				'<ul class="pagination" style="margin: 0;">' +
				'</ul>' +
				'</nav>' +
				'</div>',
			goods_body: '<div class="modal-body">' +
				'<div>' +
				'<form class="form-inline pk-goods-type-group"></form>' +
				'<div class="row">' + 
				'<div class="col-md-9 thumbnail-group pk-goods-group">' +
				'</div>' +
				'<div class="col-md-3 thumbnail-group pk-goods-selected-group">选择并双击左侧商品</div>' +
				'</div>' +
				'</div>',
			goods_type: '<label style="margin-right:10px;"><input type="radio" name="goods_type" value="<%= id %>">&nbsp;<%= name %></label>',
    		goods: '<div class="thumbnail" data-id="<%= id %>">' + 
     	 		'<img src="<%= src %>" alt="<%= name %>" />' +
    			'<div class="caption">' +
        		'<p class="pk-left"><%= name %></p>' +
        		'<p class="pk-right">' +
        		'<a href="#" role="button" class="btn btn-danger btn-xs pk-remove-btn hidden">'+
        		'<span class="glyphicon glyphicon-trash"></span>' +
        		'</a>' +
        		'</p>' +
        		'</div>' +
    			'</div>',
			goods_footer: '<div class="modal-footer">' +
				'<button type="button" class="btn btn-default pk-back">返回</button>' +
				'<button type="button" class="btn btn-primary"><%= confirm_text %></button>' +
				'</div>',
			prev: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);" aria-label="Previous">' +
				'<span aria-hidden="true">&laquo;</span>' +
				'</a>' +
				'</li>',
			next: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);" aria-label="Next">' +
				'<span aria-hidden="true">&raquo;</span>' +
				'</a>' +
				'</li>',
			page: '<li data-page="<%= page %>">' +
				'<a href="javascript:void(0);"><%= page %></a>' +
				'</li>'
		};
		var _loadBrandData = function(opts, search, cb) {
			$.ajax({
				url: opts.brand_url,
				method: opts.brand_method || 'get',
				data: {
					search: search.text,
					page: search.page,
					rows: search.rows
				},
				dataType: 'json',
				success: cb,
				error: function(err) {
					throw err;
				}
			});
		};
		var _loadGoodsTypeData = function(opts, search, cb) {
			$.ajax({
				url: opts.goods_type_url,
				method: opts.goods_method || 'get',
				data: {
					brand_id: search.brand_id
				},
				dataType: 'json',
				success: cb,
				error: function(err) {
					throw err;
				}
			});
		};
		var _loadGoodsData = function(opts, search, cb) {
			$.ajax({
				url: opts.goods_url,
				method: opts.goods_method || 'get',
				data: {
					brand_id: search.brand_id,
					goods_type_id: search.goods_type_id
				},
				dataType: 'json',
				success: cb,
				error: function(err) {
					throw err;
				}
			});
		};
		var _onSearch = function(page) {
			return function() {
				_handler && clearTimeout(_handler);
				_handler = setTimeout(function() {
					var text = _jq.$brand_search.val();
					var rows = _opts.rows;
					_loadBrandData(_opts, {
						text: text,
						page: page || 1,
						rows: rows
					}, function(result) {
						if (result.code) throw Error(result.message);
						_renderBrand(result);
					});
				}, 500);
			}
		};
		var _renderBrandList = function(data_list) {
			_jq.$brand_group.html('');
			$.each(data_list, function(index, item) {
				var $item = $(compile(_template.brand, item));
				_jq.$brand_group.append($item);
				$item.bind('click', function() {
					var brand_id = $(this).data('id');
					_jq.$goods_type_group.html('');
					_jq.$goods_group.html('');
					_jq.$goods_selected_group.html('');
					_data = [];
					_renderGoods(brand_id);
				});
			});
		};
		var _renderBrandPagination = function(result) {
			var page = result.page;
			var rows = result.rows;
			var total = Math.ceil(result.total / rows);
			var start = Math.max(page - 3, 1);
			var end = Math.min(page + 3, total);
			var $prev = $(compile(_template.prev, {
				page: Math.max(page - 1, 1)
			}));
			var $next = $(compile(_template.next, {
				page: Math.min(page + 1, total)
			}));
			var $page;
			_jq.$pagination.html('');
			if (total === 0) return;
			if (result.page === start) {
				$prev.addClass('disabled');
			}
			_jq.$pagination.append($prev);
			for (i = start; i <= end; i++) {
				$page = $(compile(_template.page, {
					page: i
				}));
				if (i === page) {
					$page.addClass('active');
				}
				_jq.$pagination.append($page);
			}
			if (result.page === end) {
				$next.addClass('disabled');
			}
			_jq.$pagination.append($next);
			_jq.$pagination.find('li').bind('click', function() {
				var $this = $(this);
				var page = $this.data('page');
				if (!$this.hasClass('active')) {
					_onSearch(page)();
				}
			});
		};
		var _renderBrand = function(result) {
			_renderBrandList(result.data);
			_renderBrandPagination(result);
			_jq.$brand_search.get(0).focus();
		};
		var _renderGoodsTypeList = function(goods_type, brand_id) {
			goods_type.unshift({id: '0', name: '全部', checked: 'true'});
			$.each(goods_type, function(index, item) {
				var $item;
				$item = $(compile(_template.goods_type, item));
				_jq.$goods_type_group.append($item);
				if (!index) $item.find('input').attr('checked', true);
				$item.find('input').bind('change', function() {
					var $this = $(this);
					var $sublings = $this.siblings();
					if ($this.is(':checked')) {
						$sublings.attr('checked', false);
						_renderGoods(brand_id, $this.val());
					}
				})
			});
		};
		var _renderGoodsList = function(goods) {
			$.each(goods, function(index, item) {
				var $item = $(compile(_template.goods, item));
				_jq.$goods_group.append($item);
				$item.bind('dblclick', function() {
					var $this = $(this);
					var $selected = _jq.$goods_selected_group;
					var $same = $selected.find('[data-id='+ $this.data('id') +']');
					var $goods = $this.clone();
					if (!$selected.find('div').length) {
						$selected.html('');
					}
					console.log(_data);
					if (!$same.length) {
						_data.push(item);
						$selected.append($goods);
						$goods.find('.pk-remove-btn').removeClass('hidden').bind('click', function() {
							var goods_id = $goods.data('id');
							for (var i = 0; i < _data.length; i++) {
								if (_data[i].id == goods_id) {
									_data.splice(i, 1);
									i --;
								}
							}
							$goods.remove();
						});
					}
				});
			});
		};
		var _renderGoods = function(brand_id, goods_type_id) {
			_jq.$goods_group.html('');
			_jq.$brand_content.addClass('hidden');
			_jq.$goods_content.removeClass('hidden');
			if (!goods_type_id) {
				_loadGoodsTypeData(_opts, {
					brand_id: brand_id
				}, function(result) {
					if (result.code) throw Error(result.message);
					_renderGoodsTypeList(result.data, brand_id);
				});
			}
			_loadGoodsData(_opts, {
				brand_id: brand_id,
				goods_type_id: goods_type_id
			}, function(result) {
				if (result.code) throw Error(result.message);
				_renderGoodsList(result.data);
			});
		};
		var _onComplete = function() {
			_data.length && _opts.onComplete(_data);
		}
		return {
			init: function($dialog, opts) {
				_jq.$dialog = $dialog;
				_opts = $.extend(_defaults, opts);
				return this;
			},
			build: function() {
				_jq.$dialog.html('');
				_jq.$content = $(compile(_template.content, _opts));
				_jq.$dialog.append(_jq.$content);
				
				_jq.$brand_content = _jq.$content.find('.pk-brand');
				_jq.$brand_header = $(compile(_template.header, _opts));
				_jq.$brand_body = $(compile(_template.brand_body, _opts));
				_jq.$brand_footer = $(compile(_template.brand_footer, _opts));
				_jq.$brand_search = _jq.$brand_body.find('input[type=search]'); 
				_jq.$brand_group = _jq.$brand_body.find('.thumbnail-group');
				_jq.$pagination = _jq.$brand_footer.find('.pagination');

				_jq.$brand_content.append(_jq.$brand_header);
				_jq.$brand_content.append(_jq.$brand_body);
				_jq.$brand_content.append(_jq.$brand_footer);

				_jq.$goods_content = _jq.$content.find('.pk-goods');
				_jq.$goods_header = $(compile(_template.header, _opts));
				_jq.$goods_body = $(compile(_template.goods_body, _opts));
				_jq.$goods_footer = $(compile(_template.goods_footer, _opts));
				_jq.$goods_type_group = _jq.$goods_body.find('.pk-goods-type-group');
				_jq.$goods_group = _jq.$goods_body.find('.pk-goods-group');
				_jq.$goods_selected_group = _jq.$goods_body.find('.pk-goods-selected-group');
				_jq.$back_btn = _jq.$goods_footer.find('.pk-back');
				_jq.$confirm_btn = _jq.$goods_footer.find('.btn-primary');

				_jq.$goods_content.append(_jq.$goods_header);
				_jq.$goods_content.append(_jq.$goods_body);
				_jq.$goods_content.append(_jq.$goods_footer);

				return this;
			},
			render: function() {
				_jq.$brand_search
					.bind('keyup', _onSearch())
					.trigger('keyup');
				_jq.$back_btn.bind('click', function() {
					_jq.$brand_content.removeClass('hidden');
					_jq.$goods_content.addClass('hidden');
					_jq.$brand_search.get(0).focus();
				});
				if (_opts.onComplete) {
					_jq.$confirm_btn
						.unbind('click', _onComplete)
						.bind('click', _onComplete);
				}
			}
		};
	})();

	var pickers = {
		single_text: single_text,
		single_picture: single_picture,
		multi_picture: multi_picture,
		single_goods: single_goods,
		multi_goods: multi_goods
	};

	return $.fn.picker = function(type, opts) {
		var picker = pickers[type];
		if (!picker) throw Error('Picker is undefined.');
		picker.init($(this), opts).build().render();
		return this;
	};
});