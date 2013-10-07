; (function () {

	// helper variables
	var hasjQuery = !!window.jQuery,
	hasQuerySelector = !!document.querySelectorAll,

	// helper functions
	helper = {
		isArray: function (obj) {
			return obj instanceof Array || !!obj.length;
		},
		make: function(tag, props) {
			var elm = document.createElement(tag);
			if ( props ) for (var x in props) elm[x] = props[x];
			return elm;
		},
		query: (function () {
			return hasQuerySelector ? function (selector, context) {
				return selector.nodeType ? [selector] : (context || document).querySelectorAll(selector);
			} : hasjQuery ? function (selector, context) {
				return $(selector, (context || null)).toArray();
			} :  function (selector, context) {
				return [selector + " - dependency required"];
			};
		})(),
		foreach: function(list, fn) {
			if ( list.forEach )  return list.forEach(fn);
			if (this.isArray(list)) {
				for (var i = 0, l = list.length; i < l; ) {
					fn.call( list[i], list[i], i++ );
				}
			} else {
				for (var i in list) {
					fn.call( list[i], list[i], i );
				};
			};
		},
		removeAllChildren: function (elem) {
			var nodes = elem.childNodes;
			while (nodes && nodes.length > 0) {
				elem.removeChild(nodes[nodes.length - 1]);
			};
		}
	},

	days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

	// months with names
	months = (function () {
		var m = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
		n = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		ext_m = [],
		i = -1;
		while (++i < m.length) {
			var d = new Number(m[i]);
			d.monthName = n[i];
			ext_m.push(d);
		}
		return ext_m;
	})(),

	// today at midnight
	today = (function () {
		var d = new Date(),
		year = d.getFullYear(),
		month = d.getMonth(),
		day = d.getDate();
		return new Date(year, month, day);
	})(),

	// html element for calendar day
	html_day = function (date) {
		var className = 'cal-day';
		if (!date.available) className += ' unavailable';
		if (date.isPast) className += ' past';
		if (date.isToday) className += ' today';
		if (date.isNextMonth) className += ' next-month';
		else if (date.isPrevMonth) className += ' prev-month'
		else className += ' this-month';
		return helper.make("span", {
			innerHTML: date.dayofmonth,
			className: className
		});;
	},

	// object for calendar day
	DateInfo = function (caldate, curdate) {
		this.weekday = new Number(caldate.getDay());
		this.weekday.name = days[this.weekday];
		this.dayofmonth = caldate.getDate();
		this.monthName = months[caldate.getMonth()].monthName;
		this.available = caldate.getTime() >= today.getTime();
		this.isNextMonth = caldate.getMonth() > curdate.getMonth();
		this.isPrevMonth = caldate.getMonth() < curdate.getMonth();
		this.iscurrent_month = caldate.getMonth() === curdate.getMonth();
		this.isPast = caldate.getTime() < today.getTime();
		this.isToday = caldate.getTime() === today.getTime();
		this.raw_date = caldate;
	},

	// associated elements for a calendar
	CalendarAccessories = function(){

		var self = this;

		this.next_btn = helper.make('a', {
			className: 'cal-nav cal-next',
			innerHTML: '&raquo;'
		});

		this.prev_btn = helper.make('a', {
			className: 'cal-nav cal-prev',
			innerHTML: '&laquo;'
		});

		this.month_label = helper.make('span', {
			className: 'cal-month'
		});

		this.calendar_node = helper.make('div', {
			className: 'cal-header'
		});

		helper.foreach(days, function(d) {
			self.calendar_node.appendChild(helper.make('span', {
				innerHTML: d.substring(0,1).toUpperCase(),
				className: 'cal-day-head'
			}));
		});
	},

	// a holder for a 'pane', allowing for multiple months per calendar
	CalendarPane = function(inst, date_offset) {
		var accessories = new CalendarAccessories;

		this.date_offset = date_offset;
		this.date = new Date(today.getFullYear(), today.getMonth() + this.date_offset);
		this.current_month = months[this.date.getMonth()].monthName.toLowerCase();
		this.current_monthNum = this.date.getMonth();
		this.current_year = this.date.getFullYear();

		this.dom_node = helper.make('div',{
			className: 'calendar-pane'
		});
		this.next_btn = accessories.next_btn;
		this.prev_btn = accessories.prev_btn;
		this.next_btn = accessories.next_btn;
		this.month_label = accessories.month_label;
		this.calendar_node = accessories.calendar_node;
		this.next_btn.onclick = function(){
			inst.showNextMonth();
		};
		this.prev_btn.onclick = function(){
			inst.showPrevMonth();
		};
	},

	CalendarDay = function (calendarday, currentday, parentcal) {
		this.date_information = new DateInfo(calendarday, currentday);
		this.dom_node = null;
		this.calendar = parentcal;
		this.selected = false;
	};

	CalendarDay.prototype = {
		select: function () {
			if ( !this.date_information.available ) {
				return;
			}
			this.calendar.selected_day = this;
			this.calendar.selected_dates.push(this);
			this.selected = true;
			this.dom_node.className += ' selected';
		},
		unSelect: function () {
			var i = this.calendar.selected_dates.length;
			while ( i-- ) {
				if ( this.calendar.selected_dates[i] === this ) {
					this.calendar.selected_dates.splice(i,1);
				}
			}
			this.calendar.selected_day = null;
			this.selected = false;
			this.dom_node.className = this.dom_node.className.replace(' selected', '');
		},
		toggleSelect: function () {
			if ( !this.selected ) {
				this.select();
			} else {
				this.unSelect();
			}
		}
	};

	var CalendarWidget = function (elm, config) {

		var self = this;

		this.config = config || {};
		this.dom_node = elm;
		this.panes = [];

		helper.removeAllChildren(this.dom_node);

		var i = this.config.panes || 1;
		var date_addition = 0;
		while ( i-- ) {
			var pane = new CalendarPane(this, date_addition);
			this.dom_node.appendChild(pane.dom_node);
			this.panes.push(pane);
			date_addition += this.config.interval;
		};

		this.date = null;
		this.selected_dates = [];
		this.calendar_info = {
			current_month: {}
		};
		this.set_date(new Date());
		this.selected_day = null;
	};

	CalendarWidget.prototype.set_date = function (date) {
		var self = this;
		if (date) {
			if (date instanceof Date) {
				this.date = date;
			} else {
				this.date = new Date(date);
			}
		} else {
			this.date = new Date();
		};
		helper.foreach(this.panes, function(pane){

			if (!!self.calendar_info[pane.current_month + pane.current_year]) {
				pane.dom_node.removeChild(self.calendar_info[pane.current_month + pane.current_year].html);
			}

			pane.date = new Date(self.date.getFullYear(), self.date.getMonth() + pane.date_offset);
			pane.current_month = months[pane.date.getMonth()].monthName.toLowerCase();
			pane.current_monthNum = pane.date.getMonth();
			pane.current_year = pane.date.getFullYear();
	
			self.set_data(pane.date);

		});
		this.current_month = months[this.date.getMonth()].monthName.toLowerCase();
		this.current_monthNum = this.date.getMonth();
		this.current_year = this.date.getFullYear();
		this.calendar_info.current_month = this.calendar_info[this.current_month + this.current_year];
		this.showMonth();
		this.onMonthChanged.call(this);
	};

	CalendarWidget.prototype.showNextMonth = function () {
		var nextDate = new Date(this.date.getFullYear(), this.date.getMonth() + 1);
		this.set_date(nextDate);
	};

	CalendarWidget.prototype.showPrevMonth = function () {
		var prevDate = new Date(this.date.getFullYear(), this.date.getMonth() - 1);
		this.set_date(prevDate);
	};

	CalendarWidget.prototype.showMonth = function () {
		var self = this;
		helper.foreach(this.panes, function(pane){
			pane.month_label.innerHTML = pane.current_month.substring(0,3) + " " + pane.current_year;
			pane.dom_node.appendChild(pane.prev_btn);
			pane.dom_node.appendChild(pane.month_label);
			pane.dom_node.appendChild(pane.next_btn);
			pane.dom_node.appendChild(pane.calendar_node);
			pane.dom_node.appendChild(self.calendar_info[pane.current_month + pane.current_year].html);
			self.dom_node.appendChild(pane.dom_node);
		});
	};

	CalendarWidget.prototype.toggleDay = function (day) {
		day.toggleSelect();
		if ( day.selected ) {
			this.onDaySelected.call(this, day);
		} else {
			this.onDayUnSelected.call(this, day);
		}
	};

	CalendarWidget.prototype.selectDay = function (day) {
		day.select();
		this.onDaySelected.call(this, day);
	};

	CalendarWidget.prototype.unSelectDay = function (day) {
		day.unSelect();
		this.onDayUnSelected.call(this, day);
	};

	CalendarWidget.prototype.set_data = function (date) {

		var self = this;
		var current_year = date.getFullYear();
		var current_month = date.getMonth();
		var current_monthName = months[current_month].monthName.toLowerCase();

		if (!!this.calendar_info[current_monthName + current_year]) return;
		
		var data = [];
		var html = helper.make("div", {
			className: 'calendar-holder clearfix'
		});

		var init_date = (function () {
			// find the first day of the month, and wind back if it's not Sunday
			var d;
			var f = new Date(current_year, current_month, 1);
			return f.getDay() === 0 ? f : new Date(current_year, current_month, 1 - f.getDay());
		})();

		var end_date = (function () {
			// find the last day of the month, and wind forwards if it's not Saturday
			var d;
			var f = new Date(current_year, current_month, months[current_month]);
			if (f.getDay() === 6) {
				return new Date(f.getFullYear(), f.getMonth(), f.getDate() + 1);
			} else {
				return new Date(current_year, current_month, f.getDate() + (7 - f.getDay()));
			}
		})();

		while (init_date < end_date) {
			var calDay = new CalendarDay(init_date, date, this);
			calDay.dom_node = html_day(calDay.date_information);
			calDay.dom_node.onclick = (function (calDay) {
				return function () {
					self.toggleDay(calDay);
				}
			})(calDay);
			data.push(calDay);
			html.appendChild(calDay.dom_node);
			init_date = new Date(init_date.getFullYear(), init_date.getMonth(), init_date.getDate() + 1)
		};

		this.calendar_info[current_monthName + current_year] = {
			data: data,
			html: html
		};
		return data;
	};

	CalendarWidget.prototype.getDay = function (year, month, day) {
		var target;
		if  ( year instanceof Date ) {
			target = year;
		} else {
			if ( months[month] < day ) {
				day -= months[month];
				month++;
			};
			if ( month >= 12 ) {
				month = 0;
				year++;
			};
			target = new Date(year, month, day);
		};

		var days = this.calendar_info[months[month].monthName.toLowerCase() + year];
		if ( days ) {
			days = days.data
		} else {
			days = this.set_data(target);
		};
		var i = -1;
		var day;
		while (++i < days.length) {
			day = days[i].date_information.raw_date;
			if ( day.toString() === target.toString() ) {
				return days[i];
			};
		};
		return null;
	};
	

	CalendarWidget.prototype.onDaySelected = function () { };
	CalendarWidget.prototype.onDayUnSelected = function () { };
	CalendarWidget.prototype.onMonthChanged = function () { };

	var PageCalendars = function(selector, config) {
		var elements;
		var self = this;
		this.widgets = [];

		if ( !!selector.nodeName ) {
			elements = [selector];
		} else if ( typeof selector === 'string' ) {
			elements = helper.query(selector);
		} else {
			elements = selector;
		};
		helper.foreach(elements,function(elm){
			var cw = new CalendarWidget(elm, config);
			self.widgets.push(cw);
		});
	};

	window.PageCalendars = PageCalendars;

})();