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
				'<input class="form-control" type="search" placeholder="Search..." style="margin-bottom: 10px;">' +
				'<div class="thumbnail-group" style="width: 100%; max-height: 470px; overflow: auto; margin-bottom: 0;">' +
				'</div>' +
				'</div>',
			image: '<a href="javascript:void(0);" class="thumbnail" style="display: inline-block; width: 182px; margin: 0 17px 10px 17px; padding: 0 10px; cursor: pointer;" data-id="<%= id %>">' +
				'<img src="<%= src %>" alt="<%= name %>" style="max-width: 160px; max-height: 200px;">' +
				'<div class="caption">' +
				'<p><%= name %></p>' +
				'</div>' +
				'</a>',
			footer: '<div class="modal-footer">' +
				'<nav style="float: left;">' +
				'<ul class="pagination" style="margin: 0;">' +
				'</ul>' +
				'</nav>' +
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
		var _loadData = function(opts, search, cb) {
			$.ajax({
				url: opts.url,
				method: opts.method || 'get',
				data: search,
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
						_render(result.data, result.page, result.rows, result.total);
					});
				}, 500);
			}
		};
		var _renderList = function(list) {
			_jq.$group.html('');
			$.each(list, function(index, item) {
				var $item = $(compile(_template.image, item));
				_jq.$group.append($item);
				$item.bind('click', function() {
					var $this = $(this);
					$this.addClass('active');
					$this.siblings().removeClass('active');
				});
			});
		};
		var _renderPagination = function(page, rows, total) {
			var $prev, $next, $page;
			var start, end;
			
			total = Math.ceil(total / rows);
			start = Math.max(page - 3, 1);
			end = Math.min(page + 3, total);
			$prev = $(compile(_template.prev, {
				page: Math.max(page - 1, 1)
			}));
			$next = $(compile(_template.next, {
				page: Math.min(page + 1, total)
			}));
			_jq.$pagination.html('');console.log(start, end, total);
			if (total === 0) return;
			if (page === start) {
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
			if (page === end) {
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
		var _render = function(list, page, rows, total) {
			_renderList(list);
			_renderPagination(page, rows, total);
			_jq.$search.get(0).focus();
		};
		var _onComplete = function() {
			var selected = _jq.$body.find('.active');
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

				_jq.$content = _jq.$content.find('.modal-content');
				_jq.$header = _jq.$content.append(compile(_template.header, _opts));
				_jq.$body = _jq.$content.append(compile(_template.body, _opts));
				_jq.$footer = _jq.$content.append(compile(_template.footer, _opts));
				_jq.$search = _jq.$body.find('input[type=search]');
				_jq.$group = _jq.$body.find('.thumbnail-group');
				_jq.$pagination = _jq.$footer.find('.pagination');

				_jq.$confirm_btn = _jq.$footer.find('.btn-primary');

				return this;
			},
			render: function() {console.log(_jq.$search);
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

	var pickers = {
		single_picture: single_picture
	};

	return $.fn.picker = function(type, opts) {
		var picker = pickers[type];
		if (!picker) throw Error('Picker is undefined.');
		picker.init($(this), opts).build().render();
		return this;
	};
});