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
        }
    },

    days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

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

    today = (function () {
        var d = new Date(),
        year = d.getUTCFullYear(),
        month = d.getMonth(),
        day = d.getDate();
        return new Date(year, month, day);
    })(),

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

    CalendarDay = function (calendarday, currentday, parentcal) {
        this.date_information = new DateInfo(calendarday, currentday);
        this.dom_node = null;
        this.calendar = parentcal;
        this.selected = false;
    };

    CalendarDay.prototype = {
        select: function () {
            this.calendar.selectDay(this);
        },
        unSelect: function () {
            this.calendar.unSelect(this);
        },
        toggleSelect: function () {
            if ( this.selected ) {
                this.calendar.unSelectDay(this);
            } else {
                this.calendar.selectDay(this);
            }
        },
    }

    var CalendarWidget = function (elm) {

        var self = this;

        this.dom_node = elm;

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

        this.next_btn.onclick = function(){
            self.showNextMonth();
        };

        this.prev_btn.onclick = function(){
            self.showPrevMonth();
        };

        this.removeAllChildren();

        this.date = null;
        this.selected_dates = [];
        this.calendar_info = {
            current_month: {}
        };
        this.set_date(new Date());
        this.selected_day = null;
    };

    CalendarWidget.prototype.set_date = function (date) {
        if (date) {
            if (date instanceof Date) {
                this.date = date;
            } else {
                this.date = new Date(date);
            }
        } else {
            this.date = new Date();
        };
        if (!!this.calendar_info[this.current_month + this.current_year]) {
            this.dom_node.removeChild(this.calendar_info[this.current_month + this.current_year].html);
        };
        this.current_month = months[this.date.getMonth()].monthName.toLowerCase();
        this.current_year = this.date.getFullYear();
        this.set_data(this.date);
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
        this.removeAllChildren();
        this.month_label.innerHTML = this.current_month.substring(0,3)
        this.dom_node.appendChild(this.prev_btn);
        this.dom_node.appendChild(this.month_label);
        this.dom_node.appendChild(this.next_btn);
        this.dom_node.appendChild(this.calendar_node);
        this.dom_node.appendChild(this.calendar_info[this.current_month + this.current_year].html);
    };

    CalendarWidget.prototype.removeAllChildren = function () {
        var self = this;
        var nodes = this.dom_node.childNodes;
        while (nodes.length > 0) {
            this.dom_node.removeChild(nodes[nodes.length - 1]);
        };
    };

    CalendarWidget.prototype.selectDay = function (day) {
        this.selected_day = day;
        this.selected_dates.push(day);
        day.selected = true;
        this.onDaySelected.call(this, day);
    };

    CalendarWidget.prototype.unSelectDay = function (day) {
        var i = this.selected_dates.length;
        while ( i-- ) {
            if ( this.selected_dates[i] === day ) {
                this.selected_dates.splice(i,1);
            }
        }
        this.selected_day = null;
        day.selected = false;
        this.onDayUnSelected.call(this, day);
    };

    CalendarWidget.prototype.set_data = function (date) {

        if (!!this.calendar_info[this.current_month + this.current_year]) return;

        var current_year = date.getUTCFullYear();
        var current_month = date.getMonth();
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
                return new Date(f.getUTCFullYear(), f.getMonth(), f.getDate() + 1);
            } else {
                return new Date(current_year, current_month, f.getDate() + (7 - f.getDay()));
            }
        })();

        while (init_date.getTime() < end_date.getTime()) {
            var calDay = new CalendarDay(init_date, date, this);
            calDay.dom_node = html_day(calDay.date_information);
            calDay.dom_node.onclick = (function (calDay) {
                return function () {
                    calDay.toggleSelect();
                }
            })(calDay);
            data.push(calDay);
            html.appendChild(calDay.dom_node);
            init_date = new Date(init_date.getUTCFullYear(), init_date.getMonth(), init_date.getDate() + 1)
        };

        this.calendar_info[this.current_month + this.current_year] = {
            data: data,
            html: html
        };
    };

    CalendarWidget.prototype.getDay = function (target) {
        var days = this.calendar_info[this.current_month + this.current_year].data;
        var i = -1;
        var day;
        while (++i < days.length) {
            day = days[i].date_information;
            if (day.dayofmonth === target && day.monthName.toLowerCase() === this.current_month) {
                return days[i];
            }
        };
        return null;
    };

    CalendarWidget.prototype.onDaySelected = function () { };
    CalendarWidget.prototype.onDayUnSelected = function () { };
    CalendarWidget.prototype.onMonthChanged = function () { };

    var PageCalendars = function(selector) {
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
            var cw = new CalendarWidget(elm);
            self.widgets.push(cw);
        });
    };

    window.PageCalendars = PageCalendars;

})();